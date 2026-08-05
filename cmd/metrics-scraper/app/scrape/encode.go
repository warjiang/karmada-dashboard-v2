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
	"bytes"
	"encoding/json"
	"fmt"
	"sort"
	"strconv"
	"strings"

	"github.com/karmada-io/dashboard/cmd/metrics-scraper/app/db"
)

func normalizeMetricsPayload(payload []byte) (*db.ParsedData, []byte, error) {
	if !isJSON(payload) {
		parsed, err := parseMetricsToJSON(string(payload))
		return parsed, payload, err
	}
	parsed := &db.ParsedData{}
	if err := json.Unmarshal(payload, parsed); err != nil {
		return nil, nil, fmt.Errorf("decode JSON metrics: %w", err)
	}
	exposition, err := encodePrometheus(parsed)
	if err != nil {
		return nil, nil, err
	}
	return parsed, exposition, nil
}

func encodePrometheus(data *db.ParsedData) ([]byte, error) {
	if data == nil {
		return nil, fmt.Errorf("metrics payload is nil")
	}
	var buffer bytes.Buffer
	names := make([]string, 0, len(data.Metrics))
	for name := range data.Metrics {
		names = append(names, name)
	}
	sort.Strings(names)
	for _, name := range names {
		metric := data.Metrics[name]
		if metric == nil {
			continue
		}
		if metric.Help != "" {
			fmt.Fprintf(&buffer, "# HELP %s %s\n", name, strings.NewReplacer("\\", "\\\\", "\n", "\\n").Replace(metric.Help))
		}
		if metric.Type != "" {
			fmt.Fprintf(&buffer, "# TYPE %s %s\n", name, strings.ToLower(metric.Type))
		}
		for _, value := range metric.Values {
			if _, err := strconv.ParseFloat(value.Value, 64); err != nil {
				continue
			}
			seriesName := name
			switch value.Measure {
			case "sum":
				seriesName = name + "_sum"
			case "count":
				seriesName = name + "_count"
			case "cumulative_count":
				seriesName = name + "_bucket"
			case "current_value", "total":
			default:
				continue
			}
			fmt.Fprintf(&buffer, "%s%s %s\n", seriesName, formatLabels(value.Labels), value.Value)
		}
	}
	return buffer.Bytes(), nil
}

func formatLabels(labels map[string]string) string {
	if len(labels) == 0 {
		return ""
	}
	keys := make([]string, 0, len(labels))
	for key := range labels {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	var buffer strings.Builder
	buffer.WriteByte('{')
	for index, key := range keys {
		if index > 0 {
			buffer.WriteByte(',')
		}
		buffer.WriteString(key)
		buffer.WriteByte('=')
		buffer.WriteString(strconv.Quote(labels[key]))
	}
	buffer.WriteByte('}')
	return buffer.String()
}
