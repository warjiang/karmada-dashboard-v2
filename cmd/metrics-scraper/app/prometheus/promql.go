/*
Copyright 2026 The Karmada Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package prometheus

import (
	"fmt"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"
)

var prometheusNameRE = regexp.MustCompile(`^[a-zA-Z_:][a-zA-Z0-9_:]*$`)

// LabelFilter is a validated Prometheus label matcher.
type LabelFilter struct {
	Label    string `json:"label"`
	Operator string `json:"operator"`
	Value    string `json:"value"`
}

// QuerySpec is the public domain query translated to PromQL.
type QuerySpec struct {
	Component   string        `json:"component"`
	Metric      string        `json:"metric"`
	Filters     []LabelFilter `json:"filters,omitempty"`
	GroupBy     []string      `json:"groupBy,omitempty"`
	Aggregation string        `json:"aggregation,omitempty"`
	Transform   string        `json:"transform,omitempty"`
	Quantile    float64       `json:"quantile,omitempty"`
}

// BuildPromQL validates a query and constructs PromQL without accepting arbitrary expressions.
func BuildPromQL(spec QuerySpec, metricType string, lookback time.Duration) (string, error) {
	if !prometheusNameRE.MatchString(spec.Metric) {
		return "", fmt.Errorf("invalid metric name")
	}
	if strings.TrimSpace(spec.Component) == "" {
		return "", fmt.Errorf("component is required")
	}
	if lookback < time.Minute {
		lookback = time.Minute
	}

	matchers := []string{`karmada_component=` + strconv.Quote(spec.Component)}
	for _, filter := range spec.Filters {
		if !prometheusNameRE.MatchString(filter.Label) {
			return "", fmt.Errorf("invalid label name %q", filter.Label)
		}
		if isReservedLabel(filter.Label) {
			return "", fmt.Errorf("label %q is managed by the server", filter.Label)
		}
		switch filter.Operator {
		case "=", "!=", "=~", "!~":
		default:
			return "", fmt.Errorf("invalid label operator %q", filter.Operator)
		}
		matchers = append(matchers, filter.Label+filter.Operator+strconv.Quote(filter.Value))
	}
	selector := spec.Metric + "{" + strings.Join(matchers, ",") + "}"

	transform := strings.ToLower(strings.TrimSpace(spec.Transform))
	if transform == "" || transform == "auto" {
		switch strings.ToLower(metricType) {
		case "counter":
			transform = "rate"
		case "histogram":
			transform = "histogram_avg"
		default:
			transform = "raw"
		}
	}
	lookbackText := formatPromDuration(lookback)
	expression := selector
	switch transform {
	case "raw":
	case "rate":
		expression = fmt.Sprintf("rate(%s[%s])", selector, lookbackText)
	case "increase":
		expression = fmt.Sprintf("increase(%s[%s])", selector, lookbackText)
	case "histogram_avg":
		base := strings.TrimSuffix(strings.TrimSuffix(strings.TrimSuffix(spec.Metric, "_bucket"), "_sum"), "_count")
		sumSelector := base + "_sum{" + strings.Join(matchers, ",") + "}"
		countSelector := base + "_count{" + strings.Join(matchers, ",") + "}"
		expression = fmt.Sprintf("rate(%s[%s]) / rate(%s[%s])", sumSelector, lookbackText, countSelector, lookbackText)
	case "histogram_quantile":
		quantile := spec.Quantile
		if quantile == 0 {
			quantile = 0.95
		}
		if quantile <= 0 || quantile >= 1 {
			return "", fmt.Errorf("quantile must be between 0 and 1")
		}
		base := strings.TrimSuffix(strings.TrimSuffix(strings.TrimSuffix(spec.Metric, "_bucket"), "_sum"), "_count")
		bucketSelector := base + "_bucket{" + strings.Join(matchers, ",") + "}"
		groups, err := validateGroups(spec.GroupBy)
		if err != nil {
			return "", err
		}
		groups = append([]string{"le"}, groups...)
		expression = fmt.Sprintf("histogram_quantile(%s, sum by (%s) (rate(%s[%s])))", strconv.FormatFloat(quantile, 'f', -1, 64), strings.Join(groups, ","), bucketSelector, lookbackText)
	default:
		return "", fmt.Errorf("unsupported transform %q", transform)
	}

	aggregation := strings.ToLower(strings.TrimSpace(spec.Aggregation))
	if aggregation == "" {
		aggregation = "none"
	}
	if aggregation == "none" {
		return expression, nil
	}
	switch aggregation {
	case "sum", "avg", "min", "max":
	default:
		return "", fmt.Errorf("unsupported aggregation %q", aggregation)
	}
	groups, err := validateGroups(spec.GroupBy)
	if err != nil {
		return "", err
	}
	if len(groups) == 0 {
		return fmt.Sprintf("%s(%s)", aggregation, expression), nil
	}
	return fmt.Sprintf("%s by (%s) (%s)", aggregation, strings.Join(groups, ","), expression), nil
}

func validateGroups(groups []string) ([]string, error) {
	result := make([]string, 0, len(groups))
	seen := map[string]struct{}{}
	for _, group := range groups {
		if !prometheusNameRE.MatchString(group) {
			return nil, fmt.Errorf("invalid group label %q", group)
		}
		if isReservedLabel(group) {
			return nil, fmt.Errorf("group label %q is managed by the server", group)
		}
		if _, ok := seen[group]; ok {
			continue
		}
		seen[group] = struct{}{}
		result = append(result, group)
	}
	sort.Strings(result)
	return result, nil
}

func isReservedLabel(label string) bool {
	return label == "karmada_component" || label == "job" || label == "instance" || label == "__name__" || label == "le"
}

func formatPromDuration(value time.Duration) string {
	seconds := int64(value.Seconds())
	if seconds%3600 == 0 {
		return fmt.Sprintf("%dh", seconds/3600)
	}
	if seconds%60 == 0 {
		return fmt.Sprintf("%dm", seconds/60)
	}
	return fmt.Sprintf("%ds", seconds)
}

// ParseDuration accepts Go durations plus Prometheus-style day and week suffixes.
func ParseDuration(value string) (time.Duration, error) {
	value = strings.TrimSpace(value)
	if strings.HasSuffix(value, "d") || strings.HasSuffix(value, "w") {
		multiplier := 24 * time.Hour
		number := strings.TrimSuffix(value, "d")
		if strings.HasSuffix(value, "w") {
			multiplier = 7 * 24 * time.Hour
			number = strings.TrimSuffix(value, "w")
		}
		amount, err := strconv.Atoi(number)
		if err != nil || amount <= 0 {
			return 0, fmt.Errorf("invalid duration %q", value)
		}
		return time.Duration(amount) * multiplier, nil
	}
	return time.ParseDuration(value)
}
