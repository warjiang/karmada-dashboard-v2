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
	"strings"
	"testing"
	"time"
)

func TestBuildPromQLCounterAuto(t *testing.T) {
	query, err := BuildPromQL(QuerySpec{
		Component:   "karmada-scheduler",
		Metric:      "workqueue_adds_total",
		Transform:   "auto",
		Aggregation: "sum",
	}, "counter", time.Minute)
	if err != nil {
		t.Fatalf("BuildPromQL() error = %v", err)
	}
	want := `sum(rate(workqueue_adds_total{karmada_component="karmada-scheduler"}[1m]))`
	if query != want {
		t.Fatalf("BuildPromQL() = %q, want %q", query, want)
	}
}

func TestBuildPromQLHistogramQuantile(t *testing.T) {
	query, err := BuildPromQL(QuerySpec{
		Component: "karmada-apiserver",
		Metric:    "apiserver_request_duration_seconds",
		Transform: "histogram_quantile",
		Quantile:  0.9,
		GroupBy:   []string{"verb"},
	}, "histogram", 2*time.Minute)
	if err != nil {
		t.Fatalf("BuildPromQL() error = %v", err)
	}
	if !strings.Contains(query, "histogram_quantile(0.9") || !strings.Contains(query, "sum by (le,verb)") {
		t.Fatalf("unexpected histogram query %q", query)
	}
}

func TestBuildPromQLRejectsManagedLabel(t *testing.T) {
	_, err := BuildPromQL(QuerySpec{
		Component: "karmada-scheduler",
		Metric:    "up",
		Filters: []LabelFilter{{
			Label: "karmada_component", Operator: "=", Value: "other",
		}},
	}, "gauge", time.Minute)
	if err == nil {
		t.Fatal("expected managed label to be rejected")
	}
}

func TestBuildPromQLHistogramQuantileValidatesAggregation(t *testing.T) {
	_, err := BuildPromQL(QuerySpec{
		Component:   "karmada-apiserver",
		Metric:      "apiserver_request_duration_seconds",
		Transform:   "histogram_quantile",
		Aggregation: "invalid",
	}, "histogram", time.Minute)
	if err == nil {
		t.Fatal("expected unsupported aggregation to be rejected")
	}
}

func TestParseDuration(t *testing.T) {
	for input, want := range map[string]time.Duration{
		"15m": 15 * time.Minute,
		"7d":  7 * 24 * time.Hour,
		"2w":  14 * 24 * time.Hour,
	} {
		got, err := ParseDuration(input)
		if err != nil || got != want {
			t.Fatalf("ParseDuration(%q) = %v, %v; want %v", input, got, err, want)
		}
	}
}

func TestReplaceIndentedMarker(t *testing.T) {
	input := "job:\n  __KARMADA_AUTH__\n  tls_config:\n    __KARMADA_TLS__\n"
	result, err := replaceIndentedMarker(input, authMarker, "authorization:\n  credentials_file: /token")
	if err != nil {
		t.Fatalf("replace auth marker: %v", err)
	}
	result, err = replaceIndentedMarker(result, tlsMarker, "ca_file: /ca\ncert_file: /cert")
	if err != nil {
		t.Fatalf("replace TLS marker: %v", err)
	}
	want := "job:\n  authorization:\n    credentials_file: /token\n  tls_config:\n    ca_file: /ca\n    cert_file: /cert\n"
	if result != want {
		t.Fatalf("rendered config:\n%s\nwant:\n%s", result, want)
	}
}
