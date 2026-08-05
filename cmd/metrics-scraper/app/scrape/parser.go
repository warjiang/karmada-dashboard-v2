/*
Copyright 2024 The Karmada Authors.

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

package scrape

import (
	"encoding/json"
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/prometheus/common/expfmt"
	"github.com/prometheus/common/model"

	"github.com/karmada-io/dashboard/cmd/metrics-scraper/app/db"
)

func parseMetricsToJSON(metricsOutput string) (*db.ParsedData, error) {
	parser := expfmt.NewTextParser(model.UTF8Validation)
	families, err := parser.TextToMetricFamilies(strings.NewReader(metricsOutput))
	if err != nil {
		return nil, fmt.Errorf("parse Prometheus metrics: %w", err)
	}
	metrics := make(map[string]*db.Metric, len(families))
	for name, family := range families {
		parsed := &db.Metric{Name: name, Help: family.GetHelp(), Type: family.GetType().String()}
		for _, metric := range family.Metric {
			labels := make(map[string]string, len(metric.Label))
			for _, pair := range metric.Label {
				labels[pair.GetName()] = pair.GetValue()
			}
			switch {
			case metric.Histogram != nil:
				for _, bucket := range metric.Histogram.Bucket {
					bucketLabels := cloneLabels(labels)
					bucketLabels["le"] = strconv.FormatFloat(bucket.GetUpperBound(), 'g', -1, 64)
					parsed.Values = append(parsed.Values, db.MetricValue{Labels: bucketLabels, Value: strconv.FormatUint(bucket.GetCumulativeCount(), 10), Measure: "cumulative_count"})
				}
				parsed.Values = append(parsed.Values,
					db.MetricValue{Labels: labels, Value: strconv.FormatFloat(metric.Histogram.GetSampleSum(), 'g', -1, 64), Measure: "sum"},
					db.MetricValue{Labels: labels, Value: strconv.FormatUint(metric.Histogram.GetSampleCount(), 10), Measure: "count"},
				)
			case metric.Summary != nil:
				for _, quantile := range metric.Summary.Quantile {
					quantileLabels := cloneLabels(labels)
					quantileLabels["quantile"] = strconv.FormatFloat(quantile.GetQuantile(), 'g', -1, 64)
					parsed.Values = append(parsed.Values, db.MetricValue{Labels: quantileLabels, Value: strconv.FormatFloat(quantile.GetValue(), 'g', -1, 64), Measure: "current_value"})
				}
				parsed.Values = append(parsed.Values,
					db.MetricValue{Labels: labels, Value: strconv.FormatFloat(metric.Summary.GetSampleSum(), 'g', -1, 64), Measure: "sum"},
					db.MetricValue{Labels: labels, Value: strconv.FormatUint(metric.Summary.GetSampleCount(), 10), Measure: "count"},
				)
			case metric.Counter != nil:
				parsed.Values = append(parsed.Values, db.MetricValue{Labels: labels, Value: strconv.FormatFloat(metric.Counter.GetValue(), 'g', -1, 64), Measure: "total"})
			case metric.Gauge != nil:
				parsed.Values = append(parsed.Values, db.MetricValue{Labels: labels, Value: strconv.FormatFloat(metric.Gauge.GetValue(), 'g', -1, 64), Measure: "current_value"})
			case metric.Untyped != nil:
				parsed.Values = append(parsed.Values, db.MetricValue{Labels: labels, Value: strconv.FormatFloat(metric.Untyped.GetValue(), 'g', -1, 64), Measure: "current_value"})
			}
		}
		metrics[name] = parsed
	}
	return &db.ParsedData{CurrentTime: time.Now().UTC().Format(time.RFC3339), Metrics: metrics}, nil
}

func cloneLabels(labels map[string]string) map[string]string {
	cloned := make(map[string]string, len(labels)+1)
	for key, value := range labels {
		cloned[key] = value
	}
	return cloned
}

func isJSON(data []byte) bool {
	return json.Valid(data)
}

func parseFiniteMetricValue(raw string) (float64, bool) {
	value, err := strconv.ParseFloat(strings.TrimSpace(raw), 64)
	return value, err == nil && !math.IsNaN(value) && !math.IsInf(value, 0)
}
