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
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/karmada-io/dashboard/cmd/metrics-scraper/app/db"
	"github.com/karmada-io/dashboard/cmd/metrics-scraper/app/scrape"
	metricstore "github.com/karmada-io/dashboard/cmd/metrics-scraper/app/store"
)

const (
	defaultVisualizationWindow = 15 * time.Minute
	maxVisualizationWindow     = 7 * 24 * time.Hour
	defaultPodMode             = "all"
	maxPoints                  = 600
)

var (
	metricNamePattern = regexp.MustCompile(`^[a-zA-Z_:][a-zA-Z0-9_:]*$`)
	labelNamePattern  = regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_]*$`)
	triggerScrapeNow  = scrape.TriggerScrapeNow
)

type Point struct {
	Timestamp string  `json:"timestamp"`
	Value     float64 `json:"value"`
}

type metricMeta struct {
	name  string
	help  string
	mtype string
}

type VisualizationMeta struct {
	AppName           string `json:"appName"`
	Window            string `json:"window"`
	PodMode           string `json:"podMode"`
	SampleIntervalSec int    `json:"sampleIntervalSec"`
	GeneratedAt       string `json:"generatedAt"`
}

type VisualizationMetricInfo struct {
	Name           string `json:"name"`
	Type           string `json:"type"`
	SuggestedChart string `json:"suggestedChart"`
}

type MetricCatalogItem struct {
	Name           string `json:"name"`
	Help           string `json:"help"`
	PrometheusType string `json:"prometheusType"`
	SuggestedChart string `json:"suggestedChart"`
	Group          string `json:"group"`
}

type SchedulerVisualizationResponse struct {
	Meta             VisualizationMeta         `json:"meta"`
	Timeseries       map[string][]Point        `json:"timeseries"`
	Pods             []string                  `json:"pods"`
	Warnings         []string                  `json:"warnings,omitempty"`
	AvailableMetrics []VisualizationMetricInfo `json:"availableMetrics,omitempty"`
	MetricsCatalog   []MetricCatalogItem       `json:"metricsCatalog,omitempty"`
}

func GetSchedulerVisualization(c *gin.Context) {
	appName := c.Param("app_name")
	if db.GetComponentConfig(appName) == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported metrics component"})
		return
	}
	window, err := parseWindow(c.Query("window"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	podMode := c.DefaultQuery("pod", defaultPodMode)
	refresh, err := parseRefresh(c.Query("refresh"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var warnings []string
	if refresh {
		warnings, err = triggerScrapeNow(c.Request.Context(), appName)
		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{"error": err.Error(), "errors": warnings, "message": fmt.Sprintf("failed to refresh %s metrics before visualization query", appName)})
			return
		}
	}
	store := scrape.Store()
	if store == nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "metrics store is not initialized"})
		return
	}
	end := time.Now().UTC()
	start := end.Add(-window)
	pods, err := store.LabelValues(c.Request.Context(), metricstore.PodLabel, componentSelector(appName), start, end)
	if err != nil {
		writeStoreError(c, err)
		return
	}
	sort.Strings(pods)
	if podMode != defaultPodMode && !contains(pods, podMode) {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("pod %q not found in metrics data", podMode)})
		return
	}

	requested := splitMetrics(c.Query("metrics"))
	catalog, metaByName, err := discoverCatalog(c.Request.Context(), store, appName, start, end, requested)
	if err != nil {
		writeStoreError(c, err)
		return
	}
	step := queryStep(window)
	series := make(map[string][]Point)
	var seriesMu sync.Mutex
	var firstErr error
	var errOnce sync.Once
	sem := make(chan struct{}, 8)
	var wg sync.WaitGroup
	for _, item := range catalog {
		item := item
		wg.Add(1)
		go func() {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()
			query, queryErr := visualizationQuery(item.Name, metaByName[item.Name].mtype, appName, podMode)
			if queryErr != nil {
				errOnce.Do(func() { firstErr = queryErr })
				return
			}
			result, queryErr := store.QueryRange(c.Request.Context(), query, start, end, step)
			if queryErr != nil {
				errOnce.Do(func() { firstErr = queryErr })
				return
			}
			points := flattenSeries(result)
			if len(points) > 0 {
				seriesMu.Lock()
				series[item.Name] = points
				seriesMu.Unlock()
			}
		}()
	}
	wg.Wait()
	if firstErr != nil {
		writeStoreError(c, firstErr)
		return
	}
	if len(series) == 0 {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": fmt.Sprintf("no %s visualization data available in requested window", appName), "pods": pods})
		return
	}
	c.JSON(http.StatusOK, SchedulerVisualizationResponse{
		Meta:       VisualizationMeta{AppName: appName, Window: window.String(), PodMode: podMode, SampleIntervalSec: int(step.Seconds()), GeneratedAt: end.Format(time.RFC3339)},
		Timeseries: series, Pods: pods, Warnings: warnings, AvailableMetrics: buildAvailableMetrics(series, metaByName), MetricsCatalog: catalog,
	})
}

func parseWindow(raw string) (time.Duration, error) {
	if raw == "" {
		return defaultVisualizationWindow, nil
	}
	var window time.Duration
	var err error
	if strings.HasSuffix(raw, "d") {
		var days int
		days, err = strconv.Atoi(strings.TrimSuffix(raw, "d"))
		window = time.Duration(days) * 24 * time.Hour
	} else {
		window, err = time.ParseDuration(raw)
	}
	if err != nil || window <= 0 || window > maxVisualizationWindow {
		return 0, fmt.Errorf("invalid window %q, expected a positive duration up to %s", raw, maxVisualizationWindow)
	}
	return window, nil
}

func parseRefresh(raw string) (bool, error) {
	if raw == "" {
		return false, nil
	}
	return strconv.ParseBool(raw)
}

func queryStep(window time.Duration) time.Duration {
	steps := []time.Duration{10 * time.Second, 30 * time.Second, time.Minute, 5 * time.Minute, 15 * time.Minute, 30 * time.Minute}
	for _, step := range steps {
		if window/step <= maxPoints {
			return step
		}
	}
	return 30 * time.Minute
}

func componentSelector(appName string) string {
	return fmt.Sprintf("{%s=%s}", metricstore.ComponentLabel, strconv.Quote(appName))
}

func metricScopeSelector(appName, pod string) (string, error) {
	if pod == "" || pod == defaultPodMode {
		return componentSelector(appName), nil
	}
	selector, err := metricSelector("up", appName, pod, nil)
	if err != nil {
		return "", err
	}
	return strings.TrimPrefix(selector, "up"), nil
}

func metricSelector(metric, appName, pod string, filters []LabelFilter) (string, error) {
	if !metricNamePattern.MatchString(metric) {
		return "", fmt.Errorf("invalid metric name %q", metric)
	}
	matchers := []string{metricstore.ComponentLabel + "=" + strconv.Quote(appName)}
	if pod != "" && pod != defaultPodMode {
		matchers = append(matchers, metricstore.PodLabel+"="+strconv.Quote(pod))
	}
	reserved := map[string]bool{metricstore.ComponentLabel: true, metricstore.PodLabel: true, metricstore.ClusterLabel: true, "__name__": true}
	for _, filter := range filters {
		if !labelNamePattern.MatchString(filter.Key) || reserved[filter.Key] {
			return "", fmt.Errorf("invalid or reserved label %q", filter.Key)
		}
		matchers = append(matchers, filter.Key+"="+strconv.Quote(filter.Value))
	}
	return metric + "{" + strings.Join(matchers, ",") + "}", nil
}

func visualizationQuery(metric, metricType, appName, pod string) (string, error) {
	return aggregateQuery(metric, metricType, "sum", appName, pod, nil)
}

func aggregateQuery(metric, metricType, aggregation, appName, pod string, filters []LabelFilter) (string, error) {
	metricType = normalizePrometheusType(metricType)
	if metricType == "histogram" || metricType == "summary" {
		sumSelector, err := metricSelector(metric+"_sum", appName, pod, filters)
		if err != nil {
			return "", err
		}
		countSelector, err := metricSelector(metric+"_count", appName, pod, filters)
		if err != nil {
			return "", err
		}
		weightedAverage := "sum(rate(" + sumSelector + "[1m])) / clamp_min(sum(rate(" + countSelector + "[1m])), 1e-12)"
		if aggregation == "sum" || aggregation == "rate" {
			return weightedAverage, nil
		}
		perSeriesAverage := "rate(" + sumSelector + "[1m]) / clamp_min(rate(" + countSelector + "[1m]), 1e-12)"
		return aggregation + "(" + perSeriesAverage + ")", nil
	}

	selector, err := metricSelector(metric, appName, pod, filters)
	if err != nil {
		return "", err
	}
	if aggregation == "rate" {
		return "sum(rate(" + selector + "[1m]))", nil
	}
	return aggregation + "(" + selector + ")", nil
}

func discoverCatalog(ctx context.Context, store metricstore.Store, appName string, start, end time.Time, requested []string) ([]MetricCatalogItem, map[string]metricMeta, error) {
	seriesNames, err := store.LabelValues(ctx, "__name__", componentSelector(appName), start, end)
	if err != nil {
		return nil, nil, err
	}
	metadata, err := store.Metadata(ctx, "")
	if err != nil {
		return nil, nil, err
	}
	catalog, metaByName := buildMetricCatalog(seriesNames, metadata, requested)
	return catalog, metaByName, nil
}

func buildMetricCatalog(seriesNames []string, metadata map[string][]metricstore.Metadata, requested []string) ([]MetricCatalogItem, map[string]metricMeta) {
	available := make(map[string]bool, len(seriesNames))
	for _, name := range seriesNames {
		available[name] = true
	}
	inferred := make(map[string]string, len(seriesNames))
	for _, name := range seriesNames {
		switch {
		case strings.HasSuffix(name, "_bucket"):
			inferred[strings.TrimSuffix(name, "_bucket")] = "histogram"
		case strings.HasSuffix(name, "_sum") && available[strings.TrimSuffix(name, "_sum")+"_count"]:
			family := strings.TrimSuffix(name, "_sum")
			if inferred[family] != "histogram" {
				inferred[family] = "summary"
			}
		case strings.HasSuffix(name, "_count") && available[strings.TrimSuffix(name, "_count")+"_sum"]:
			continue
		case strings.HasSuffix(name, "_total"):
			inferred[name] = "counter"
		default:
			if inferred[name] == "" {
				inferred[name] = "gauge"
			}
		}
	}
	for family, entries := range metadata {
		if len(entries) == 0 {
			continue
		}
		metricType := normalizePrometheusType(entries[0].Type)
		name := family
		if metricType == "counter" && !available[name] && available[name+"_total"] {
			name += "_total"
		}
		if available[name] || ((metricType == "histogram" || metricType == "summary") && available[family+"_sum"] && available[family+"_count"]) {
			inferred[name] = metricType
		}
	}

	metricNames := requested
	if len(metricNames) == 0 {
		metricNames = make([]string, 0, len(inferred))
		for name := range inferred {
			metricNames = append(metricNames, name)
		}
	}
	seen := map[string]bool{}
	metaByName := make(map[string]metricMeta, len(metricNames))
	catalog := make([]MetricCatalogItem, 0, len(metricNames))
	for _, name := range metricNames {
		if seen[name] || !metricNamePattern.MatchString(name) {
			continue
		}
		seen[name] = true
		entries := metadata[name]
		if len(entries) == 0 && strings.HasSuffix(name, "_total") {
			entries = metadata[strings.TrimSuffix(name, "_total")]
		}
		meta := metricMeta{name: name, mtype: inferred[name]}
		if meta.mtype == "" {
			switch {
			case available[name+"_bucket"]:
				meta.mtype = "histogram"
			case available[name+"_sum"] && available[name+"_count"]:
				meta.mtype = "summary"
			case strings.HasSuffix(name, "_total"):
				meta.mtype = "counter"
			default:
				meta.mtype = "gauge"
			}
		}
		if len(entries) > 0 {
			meta.help = entries[0].Help
			meta.mtype = normalizePrometheusType(entries[0].Type)
		}
		metaByName[name] = meta
		catalog = append(catalog, MetricCatalogItem{Name: name, Help: meta.help, PrometheusType: meta.mtype, SuggestedChart: suggestedChartForType(meta.mtype), Group: extractMetricGroup(name)})
	}
	sort.Slice(catalog, func(i, j int) bool { return catalog[i].Name < catalog[j].Name })
	return catalog, metaByName
}

func splitMetrics(raw string) []string {
	if raw == "" {
		return nil
	}
	seen := map[string]bool{}
	var result []string
	for _, value := range strings.Split(raw, ",") {
		value = strings.TrimSpace(value)
		if value != "" && !seen[value] {
			seen[value] = true
			result = append(result, value)
		}
	}
	return result
}

func flattenSeries(series []metricstore.TimeSeries) []Point {
	if len(series) == 0 {
		return nil
	}
	points := make([]Point, 0, len(series[0].Values))
	for _, sample := range series[0].Values {
		points = append(points, Point{Timestamp: sample.Timestamp.Format(time.RFC3339), Value: sample.Value})
	}
	return points
}

func buildAvailableMetrics(series map[string][]Point, metadata map[string]metricMeta) []VisualizationMetricInfo {
	result := make([]VisualizationMetricInfo, 0, len(series))
	for name := range series {
		mtype := normalizePrometheusType(metadata[name].mtype)
		result = append(result, VisualizationMetricInfo{Name: name, Type: mtype, SuggestedChart: suggestedChartForType(mtype)})
	}
	sort.Slice(result, func(i, j int) bool { return result[i].Name < result[j].Name })
	return result
}

func normalizePrometheusType(value string) string {
	switch strings.ToLower(value) {
	case "counter":
		return "counter"
	case "histogram":
		return "histogram"
	case "summary":
		return "summary"
	default:
		return "gauge"
	}
}

func suggestedChartForType(value string) string {
	switch normalizePrometheusType(value) {
	case "histogram", "summary":
		return "bar"
	case "counter":
		return "line"
	default:
		return "gauge"
	}
}

func extractMetricGroup(name string) string {
	if index := strings.IndexByte(name, '_'); index > 0 {
		return name[:index]
	}
	return "other"
}

func contains(values []string, target string) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}
	return false
}

func writeStoreError(c *gin.Context, err error) {
	status := http.StatusInternalServerError
	if errors.Is(err, metricstore.ErrUnavailable) {
		status = http.StatusBadGateway
	}
	c.JSON(status, gin.H{"error": err.Error()})
}
