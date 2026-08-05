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

package metrics

import (
	"context"
	"errors"
	"fmt"
	"math"
	"net/http"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"

	promapi "github.com/karmada-io/dashboard/cmd/metrics-scraper/app/prometheus"
)

const (
	defaultQueryWindow = 15 * time.Minute
	defaultMaxPoints   = 1000
	metadataCacheTTL   = 30 * time.Second
)

var prometheusNamePattern = regexp.MustCompile(`^[a-zA-Z_:][a-zA-Z0-9_:]*$`)

// API implements the metrics v2 domain API on top of Prometheus.
type API struct {
	client       *promapi.Client
	components   []string
	componentSet map[string]struct{}
	queryTimeout time.Duration
	maxRange     time.Duration

	cacheMu sync.RWMutex
	cache   map[string]catalogCacheEntry
}

type catalogCacheEntry struct {
	expires time.Time
	items   []CatalogItem
}

var (
	apiMu      sync.RWMutex
	configured *API
)

// Configure installs the process-wide v2 metrics API used by Gin handlers.
func Configure(client *promapi.Client, components []string, queryTimeout, maxRange time.Duration) {
	if queryTimeout <= 0 {
		queryTimeout = 15 * time.Second
	}
	if maxRange <= 0 {
		maxRange = 7 * 24 * time.Hour
	}
	seen := map[string]struct{}{}
	normalized := make([]string, 0, len(components))
	for _, component := range components {
		component = strings.TrimSpace(component)
		if component == "" {
			continue
		}
		if _, ok := seen[component]; ok {
			continue
		}
		seen[component] = struct{}{}
		normalized = append(normalized, component)
	}
	sort.Strings(normalized)
	apiMu.Lock()
	configured = &API{
		client:       client,
		components:   normalized,
		componentSet: seen,
		queryTimeout: queryTimeout,
		maxRange:     maxRange,
		cache:        map[string]catalogCacheEntry{},
	}
	apiMu.Unlock()
}

func getAPI(c *gin.Context) (*API, bool) {
	apiMu.RLock()
	api := configured
	apiMu.RUnlock()
	if api == nil || api.client == nil {
		writeError(c, http.StatusServiceUnavailable, "prometheus_unavailable", "Prometheus client is not configured", nil)
		return nil, false
	}
	return api, true
}

// ComponentStatus describes scrape health for a declared component.
type ComponentStatus struct {
	Name       string   `json:"name"`
	Enabled    bool     `json:"enabled"`
	Healthy    int      `json:"healthyTargets"`
	Total      int      `json:"totalTargets"`
	Pods       []string `json:"pods"`
	LastScrape *string  `json:"lastScrape,omitempty"`
}

// GetComponents returns declarative component configuration and Prometheus target health.
func GetComponents(c *gin.Context) {
	api, ok := getAPI(c)
	if !ok {
		return
	}
	ctx, cancel := context.WithTimeout(c.Request.Context(), api.queryTimeout)
	defer cancel()

	statuses := make(map[string]*ComponentStatus, len(api.components))
	for _, name := range api.components {
		statuses[name] = &ComponentStatus{Name: name, Enabled: true, Pods: []string{}}
	}
	if len(api.components) > 0 {
		parts := make([]string, 0, len(api.components))
		for _, name := range api.components {
			parts = append(parts, regexp.QuoteMeta(name))
		}
		query := `up{karmada_component=~"^(?:` + strings.Join(parts, "|") + `)$"}`
		samples, warnings, err := api.client.Query(ctx, query, time.Now())
		if err != nil {
			writePrometheusError(c, ctx, err)
			return
		}
		podSets := map[string]map[string]struct{}{}
		for _, sample := range samples {
			name := sample.Labels["karmada_component"]
			status, exists := statuses[name]
			if !exists {
				continue
			}
			status.Total++
			if sample.Value == 1 {
				status.Healthy++
			}
			formatted := sample.Timestamp.Format(time.RFC3339)
			if status.LastScrape == nil || formatted > *status.LastScrape {
				status.LastScrape = &formatted
			}
			pod := sample.Labels["karmada_pod"]
			if pod != "" {
				if podSets[name] == nil {
					podSets[name] = map[string]struct{}{}
				}
				podSets[name][pod] = struct{}{}
			}
		}
		for name, pods := range podSets {
			for pod := range pods {
				statuses[name].Pods = append(statuses[name].Pods, pod)
			}
			sort.Strings(statuses[name].Pods)
		}
		items := make([]ComponentStatus, 0, len(api.components))
		for _, name := range api.components {
			items = append(items, *statuses[name])
		}
		c.JSON(http.StatusOK, gin.H{"items": items, "warnings": warnings})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": []ComponentStatus{}})
}

// CatalogItem describes a metric visible for a component.
type CatalogItem struct {
	Name             string   `json:"name"`
	Type             string   `json:"type"`
	Help             string   `json:"help"`
	Unit             string   `json:"unit,omitempty"`
	Labels           []string `json:"labels"`
	DefaultTransform string   `json:"defaultTransform"`
	SuggestedChart   string   `json:"suggestedChart"`
	Group            string   `json:"group"`
}

// GetCatalog lists metric families stored for a component.
func GetCatalog(c *gin.Context) {
	api, ok := getAPI(c)
	if !ok {
		return
	}
	component := strings.TrimSpace(c.Query("component"))
	if !api.validComponent(component) {
		writeError(c, http.StatusBadRequest, "invalid_component", "component is not enabled", nil)
		return
	}
	if items, found := api.cachedCatalog(component); found {
		c.JSON(http.StatusOK, gin.H{"items": items})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), api.queryTimeout)
	defer cancel()
	now := time.Now()
	selector := `{karmada_component=` + strconv.Quote(component) + `}`
	names, warnings, err := api.client.LabelValues(ctx, "__name__", []string{selector}, now.Add(-api.maxRange), now)
	if err != nil {
		writePrometheusError(c, ctx, err)
		return
	}
	metadata, metadataWarnings, err := api.client.Metadata(ctx, "")
	if err != nil {
		writePrometheusError(c, ctx, err)
		return
	}
	warnings = append(warnings, metadataWarnings...)
	catalogNames := map[string]struct{}{}
	for _, name := range names {
		normalizedName := name
		for _, suffix := range []string{"_bucket", "_sum", "_count"} {
			if strings.HasSuffix(name, suffix) {
				base := strings.TrimSuffix(name, suffix)
				if entries := metadata[base]; len(entries) > 0 && normalizeType(entries[0].Type) == "histogram" {
					normalizedName = base
				}
				break
			}
		}
		catalogNames[normalizedName] = struct{}{}
	}
	names = names[:0]
	for name := range catalogNames {
		names = append(names, name)
	}
	sort.Strings(names)
	items := make([]CatalogItem, 0, len(names))
	for _, name := range names {
		item := CatalogItem{
			Name:             name,
			Type:             "untyped",
			Labels:           []string{},
			DefaultTransform: "raw",
			SuggestedChart:   "line",
			Group:            metricGroup(name),
		}
		if entries := metadata[name]; len(entries) > 0 {
			item.Type = normalizeType(entries[0].Type)
			item.Help = entries[0].Help
			item.Unit = entries[0].Unit
		}
		switch item.Type {
		case "counter":
			item.DefaultTransform = "rate"
		case "histogram":
			item.DefaultTransform = "histogram_avg"
		}
		if item.Type == "gauge" {
			item.SuggestedChart = "area"
		}
		items = append(items, item)
	}
	api.storeCatalog(component, items)
	c.JSON(http.StatusOK, gin.H{"items": items, "warnings": warnings})
}

// GetLabelValues returns bounded label value choices for a component and metric.
func GetLabelValues(c *gin.Context) {
	api, ok := getAPI(c)
	if !ok {
		return
	}
	component := strings.TrimSpace(c.Query("component"))
	metric := strings.TrimSpace(c.Query("metric"))
	requestedLabel := strings.TrimSpace(c.Query("label"))
	if !api.validComponent(component) {
		writeError(c, http.StatusBadRequest, "invalid_component", "component is not enabled", nil)
		return
	}
	if metric != "" && !isPrometheusName(metric) {
		writeError(c, http.StatusBadRequest, "invalid_metric", "invalid metric name", nil)
		return
	}
	if requestedLabel != "" && !isPrometheusName(requestedLabel) {
		writeError(c, http.StatusBadRequest, "invalid_label", "invalid label name", nil)
		return
	}

	selector := `{karmada_component=` + strconv.Quote(component) + `}`
	if metric != "" {
		selector = metric + selector
	}
	ctx, cancel := context.WithTimeout(c.Request.Context(), api.queryTimeout)
	defer cancel()
	now := time.Now()
	labels := []string{requestedLabel}
	warnings := []string{}
	if requestedLabel == "" {
		var err error
		labels, warnings, err = api.client.LabelNames(ctx, []string{selector}, now.Add(-defaultQueryWindow), now)
		if err != nil {
			writePrometheusError(c, ctx, err)
			return
		}
	}
	result := map[string][]string{}
	for _, label := range labels {
		if label == "" || label == "__name__" || label == "job" || label == "instance" || label == "karmada_component" {
			continue
		}
		values, valueWarnings, err := api.client.LabelValues(ctx, label, []string{selector}, now.Add(-defaultQueryWindow), now)
		if err != nil {
			writePrometheusError(c, ctx, err)
			return
		}
		warnings = append(warnings, valueWarnings...)
		if len(values) > 200 {
			values = values[:200]
		}
		result[label] = values
		if len(result) >= 30 {
			break
		}
	}
	c.JSON(http.StatusOK, gin.H{"values": result, "warnings": warnings})
}

type queryRangeRequest struct {
	promapi.QuerySpec
	Window     string `json:"window,omitempty"`
	Start      string `json:"start,omitempty"`
	End        string `json:"end,omitempty"`
	StepSecond int64  `json:"stepSeconds,omitempty"`
}

type queryRangePoint struct {
	Timestamp string  `json:"timestamp"`
	Value     float64 `json:"value"`
}

type queryRangeSeries struct {
	Labels map[string]string `json:"labels"`
	Points []queryRangePoint `json:"points"`
}

// QueryRange executes a bounded, server-generated PromQL range query.
func QueryRange(c *gin.Context) {
	api, ok := getAPI(c)
	if !ok {
		return
	}
	var request queryRangeRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		writeError(c, http.StatusBadRequest, "invalid_request", "invalid request body", err.Error())
		return
	}
	if !api.validComponent(request.Component) {
		writeError(c, http.StatusBadRequest, "invalid_component", "component is not enabled", nil)
		return
	}
	start, end, step, err := api.resolveRange(request)
	if err != nil {
		writeError(c, http.StatusBadRequest, "invalid_time_range", err.Error(), nil)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), api.queryTimeout)
	defer cancel()
	metricType := ""
	if request.Transform == "" || request.Transform == "auto" {
		metadata, _, metadataErr := api.client.Metadata(ctx, request.Metric)
		if metadataErr != nil {
			writePrometheusError(c, ctx, metadataErr)
			return
		}
		if entries := metadata[request.Metric]; len(entries) > 0 {
			metricType = normalizeType(entries[0].Type)
		}
	}
	lookback := step * 4
	query, err := promapi.BuildPromQL(request.QuerySpec, metricType, lookback)
	if err != nil {
		writeError(c, http.StatusBadRequest, "invalid_query", err.Error(), nil)
		return
	}
	series, warnings, err := api.client.QueryRange(ctx, query, start, end, step)
	if err != nil {
		writePrometheusError(c, ctx, err)
		return
	}
	result := make([]queryRangeSeries, 0, len(series))
	for _, item := range series {
		labels := item.Labels
		delete(labels, "__name__")
		points := make([]queryRangePoint, 0, len(item.Points))
		for _, point := range item.Points {
			if math.IsNaN(point.Value) || math.IsInf(point.Value, 0) {
				continue
			}
			points = append(points, queryRangePoint{Timestamp: point.Timestamp.Format(time.RFC3339Nano), Value: point.Value})
		}
		result = append(result, queryRangeSeries{Labels: labels, Points: points})
	}
	c.JSON(http.StatusOK, gin.H{
		"query": gin.H{
			"component":   request.Component,
			"metric":      request.Metric,
			"start":       start.Format(time.RFC3339),
			"end":         end.Format(time.RFC3339),
			"stepSeconds": int64(step.Seconds()),
			"aggregation": request.Aggregation,
			"transform":   request.Transform,
		},
		"series":   result,
		"warnings": warnings,
	})
}

func (api *API) resolveRange(request queryRangeRequest) (time.Time, time.Time, time.Duration, error) {
	end := time.Now().UTC()
	start := end.Add(-defaultQueryWindow)
	if request.Window != "" {
		window, err := promapi.ParseDuration(request.Window)
		if err != nil || window <= 0 {
			return time.Time{}, time.Time{}, 0, fmt.Errorf("invalid window")
		}
		start = end.Add(-window)
	}
	if request.End != "" {
		parsed, err := time.Parse(time.RFC3339, request.End)
		if err != nil {
			return time.Time{}, time.Time{}, 0, fmt.Errorf("end must be RFC3339")
		}
		end = parsed
	}
	if request.Start != "" {
		parsed, err := time.Parse(time.RFC3339, request.Start)
		if err != nil {
			return time.Time{}, time.Time{}, 0, fmt.Errorf("start must be RFC3339")
		}
		start = parsed
	}
	window := end.Sub(start)
	if window <= 0 {
		return time.Time{}, time.Time{}, 0, fmt.Errorf("start must be before end")
	}
	if window > api.maxRange {
		return time.Time{}, time.Time{}, 0, fmt.Errorf("query range exceeds %s", api.maxRange)
	}
	step := time.Duration(request.StepSecond) * time.Second
	minimumStep := window / 300
	if minimumStep < 15*time.Second {
		minimumStep = 15 * time.Second
	}
	if step == 0 {
		step = minimumStep
	}
	if step < 15*time.Second || window/step > defaultMaxPoints {
		return time.Time{}, time.Time{}, 0, fmt.Errorf("step produces too many data points")
	}
	return start, end, step, nil
}

func (api *API) validComponent(component string) bool {
	_, ok := api.componentSet[strings.TrimSpace(component)]
	return ok
}

func (api *API) cachedCatalog(component string) ([]CatalogItem, bool) {
	api.cacheMu.RLock()
	entry, ok := api.cache[component]
	api.cacheMu.RUnlock()
	if !ok || time.Now().After(entry.expires) {
		return nil, false
	}
	return entry.items, true
}

func (api *API) storeCatalog(component string, items []CatalogItem) {
	api.cacheMu.Lock()
	api.cache[component] = catalogCacheEntry{expires: time.Now().Add(metadataCacheTTL), items: items}
	api.cacheMu.Unlock()
}

func writePrometheusError(c *gin.Context, ctx context.Context, err error) {
	var timeoutError interface{ Timeout() bool }
	if ctx.Err() == context.DeadlineExceeded || errors.Is(err, context.DeadlineExceeded) || (errors.As(err, &timeoutError) && timeoutError.Timeout()) {
		writeError(c, http.StatusGatewayTimeout, "prometheus_timeout", "Prometheus query timed out", nil)
		return
	}
	writeError(c, http.StatusServiceUnavailable, "prometheus_unavailable", "Prometheus query failed", err.Error())
}

func writeError(c *gin.Context, status int, code, message string, details any) {
	errorBody := gin.H{"code": code, "message": message}
	if details != nil {
		errorBody["details"] = details
	}
	c.JSON(status, gin.H{"error": errorBody})
}

func metricGroup(name string) string {
	parts := strings.Split(name, "_")
	if len(parts) >= 2 {
		return strings.Join(parts[:2], "_")
	}
	return name
}

func normalizeType(value string) string {
	switch strings.ToLower(value) {
	case "counter", "gauge", "histogram", "summary":
		return strings.ToLower(value)
	default:
		return "untyped"
	}
}

func isPrometheusName(value string) bool {
	return prometheusNamePattern.MatchString(value)
}
