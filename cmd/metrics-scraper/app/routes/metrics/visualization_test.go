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

package metrics

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/karmada-io/dashboard/cmd/metrics-scraper/app/scrape"
	metricstore "github.com/karmada-io/dashboard/cmd/metrics-scraper/app/store"
)

type fakeStore struct {
	empty    bool
	err      error
	names    []string
	metadata map[string][]metricstore.Metadata
	mu       sync.Mutex
	queries  []string
}

func (f *fakeStore) ImportPrometheus(context.Context, []byte, map[string]string) error { return nil }
func (f *fakeStore) Health(context.Context) error                                      { return nil }
func (f *fakeStore) LabelValues(_ context.Context, label, _ string, _, _ time.Time) ([]string, error) {
	if f.err != nil {
		return nil, f.err
	}
	if label == metricstore.PodLabel {
		return []string{"scheduler-pod"}, nil
	}
	if f.names != nil {
		return f.names, nil
	}
	return []string{"workqueue_depth", "workqueue_adds_total"}, nil
}
func (f *fakeStore) Metadata(context.Context, string) (map[string][]metricstore.Metadata, error) {
	if f.err != nil {
		return nil, f.err
	}
	if f.metadata != nil {
		return f.metadata, nil
	}
	return map[string][]metricstore.Metadata{
		"workqueue_depth": {{}},
		"workqueue_adds":  {{Type: "counter"}},
	}, nil
}
func (f *fakeStore) Series(context.Context, string, time.Time, time.Time) ([]map[string]string, error) {
	if f.err != nil {
		return nil, f.err
	}
	return nil, nil
}
func (f *fakeStore) QueryRange(_ context.Context, query string, _, end time.Time, _ time.Duration) ([]metricstore.TimeSeries, error) {
	f.mu.Lock()
	f.queries = append(f.queries, query)
	f.mu.Unlock()
	if f.err != nil {
		return nil, f.err
	}
	if f.empty {
		return nil, nil
	}
	value := 6.0
	if strings.Contains(query, "rate(") {
		value = 2
	}
	return []metricstore.TimeSeries{{Values: []metricstore.Sample{{Timestamp: end.Add(-time.Minute), Value: value}}}}, nil
}

func (f *fakeStore) recordedQueries() []string {
	f.mu.Lock()
	defer f.mu.Unlock()
	return append([]string(nil), f.queries...)
}

func TestGetSchedulerVisualizationInvalidApp(t *testing.T) {
	c, recorder := newVisualizationContext("/api/v1/metrics/unknown-component/visualization")
	c.Params = gin.Params{{Key: "app_name", Value: "unknown-component"}}
	GetSchedulerVisualization(c)
	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", recorder.Code)
	}
}

func TestGetSchedulerVisualizationNoData(t *testing.T) {
	withStore(t, &fakeStore{empty: true})
	c, recorder := newVisualizationContext("/api/v1/metrics/karmada-scheduler/visualization?window=15m")
	c.Params = gin.Params{{Key: "app_name", Value: "karmada-scheduler"}}
	GetSchedulerVisualization(c)
	if recorder.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503, got %d body=%s", recorder.Code, recorder.Body.String())
	}
}

func TestGetSchedulerVisualizationSuccess(t *testing.T) {
	withStore(t, &fakeStore{})
	c, recorder := newVisualizationContext("/api/v1/metrics/karmada-scheduler/visualization?window=7d")
	c.Params = gin.Params{{Key: "app_name", Value: "karmada-scheduler"}}
	GetSchedulerVisualization(c)
	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", recorder.Code, recorder.Body.String())
	}
}

func TestGetSchedulerVisualizationStoreUnavailable(t *testing.T) {
	withStore(t, &fakeStore{err: metricstore.ErrUnavailable})
	c, recorder := newVisualizationContext("/api/v1/metrics/karmada-scheduler/visualization")
	c.Params = gin.Params{{Key: "app_name", Value: "karmada-scheduler"}}
	GetSchedulerVisualization(c)
	if recorder.Code != http.StatusBadGateway {
		t.Fatalf("expected 502, got %d body=%s", recorder.Code, recorder.Body.String())
	}
}

func TestQueryStepCapsPoints(t *testing.T) {
	step := queryStep(7 * 24 * time.Hour)
	if 7*24*time.Hour/step > maxPoints {
		t.Fatalf("step %s returns too many points", step)
	}
}

func TestMetricSelectorRejectsReservedLabels(t *testing.T) {
	_, err := metricSelector("workqueue_depth", "karmada-scheduler", "all", []LabelFilter{{Key: metricstore.PodLabel, Value: "other"}})
	if err == nil {
		t.Fatal("expected reserved label to be rejected")
	}
}

func TestBuildMetricCatalogInfersFamiliesWithoutMetadata(t *testing.T) {
	names := []string{
		"active_workers",
		"requests_total",
		"latency_seconds_bucket", "latency_seconds_sum", "latency_seconds_count",
		"rpc_duration_seconds", "rpc_duration_seconds_sum", "rpc_duration_seconds_count",
	}
	catalog, _ := buildMetricCatalog(names, map[string][]metricstore.Metadata{}, nil)
	types := map[string]string{}
	for _, item := range catalog {
		types[item.Name] = item.PrometheusType
	}
	want := map[string]string{
		"active_workers":       "gauge",
		"requests_total":       "counter",
		"latency_seconds":      "histogram",
		"rpc_duration_seconds": "summary",
	}
	if len(types) != len(want) {
		t.Fatalf("unexpected catalog: %#v", catalog)
	}
	for name, metricType := range want {
		if types[name] != metricType {
			t.Fatalf("expected %s to be %s, got %s", name, metricType, types[name])
		}
	}
}

func TestHistogramQueryUsesRateOfSumAndCount(t *testing.T) {
	query, err := visualizationQuery("latency_seconds", "histogram", "karmada-scheduler", "all")
	if err != nil {
		t.Fatal(err)
	}
	for _, fragment := range []string{"rate(latency_seconds_sum", "rate(latency_seconds_count", "1e-12"} {
		if !strings.Contains(query, fragment) {
			t.Fatalf("query %q does not contain %q", query, fragment)
		}
	}
}

func TestMetricExploreNoData(t *testing.T) {
	withStore(t, &fakeStore{empty: true})
	c, recorder := newVisualizationContext("/api/v1/metrics/karmada-scheduler/explore?metric=workqueue_depth&window=7d")
	c.Params = gin.Params{{Key: "app_name", Value: "karmada-scheduler"}}
	GetMetricExplore(c)
	if recorder.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503, got %d body=%s", recorder.Code, recorder.Body.String())
	}
}

func TestLegacyMetricNamesHideHistogramChildren(t *testing.T) {
	store := &fakeStore{names: []string{"latency_seconds_bucket", "latency_seconds_sum", "latency_seconds_count"}, metadata: map[string][]metricstore.Metadata{}}
	withStore(t, store)
	c, recorder := newVisualizationContext("/api/v1/metrics/karmada-scheduler/scheduler-pod?type=mname")
	c.Params = gin.Params{{Key: "app_name", Value: "karmada-scheduler"}, {Key: "pod_name", Value: "scheduler-pod"}}
	QueryMetrics(c)
	if recorder.Code != http.StatusOK || !strings.Contains(recorder.Body.String(), `"latency_seconds"`) || strings.Contains(recorder.Body.String(), `"latency_seconds_sum"`) {
		t.Fatalf("unexpected response %d: %s", recorder.Code, recorder.Body.String())
	}
}

func TestLegacyHistogramDetailsQueryAllFamilySeries(t *testing.T) {
	store := &fakeStore{names: []string{"latency_seconds_bucket", "latency_seconds_sum", "latency_seconds_count"}, metadata: map[string][]metricstore.Metadata{}}
	withStore(t, store)
	c, recorder := newVisualizationContext("/api/v1/metrics/karmada-scheduler/scheduler-pod?type=details&mname=latency_seconds")
	c.Params = gin.Params{{Key: "app_name", Value: "karmada-scheduler"}, {Key: "pod_name", Value: "scheduler-pod"}}
	QueryMetrics(c)
	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", recorder.Code, recorder.Body.String())
	}
	queries := strings.Join(store.recordedQueries(), "\n")
	for _, name := range []string{"latency_seconds_bucket", "latency_seconds_sum", "latency_seconds_count"} {
		if !strings.Contains(queries, name) {
			t.Fatalf("missing %s query in %q", name, queries)
		}
	}
}

func withStore(t *testing.T, store metricstore.Store) {
	t.Helper()
	original := scrape.Store()
	scrape.SetStore(store)
	t.Cleanup(func() { scrape.SetStore(original) })
}

func newVisualizationContext(target string) (*gin.Context, *httptest.ResponseRecorder) {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodGet, target, nil)
	return c, recorder
}
