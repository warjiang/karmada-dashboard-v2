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
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/karmada-io/dashboard/cmd/metrics-scraper/app/db"
	"github.com/karmada-io/dashboard/cmd/metrics-scraper/app/scrape"
	metricstore "github.com/karmada-io/dashboard/cmd/metrics-scraper/app/store"
)

type MetricInfo struct {
	Help string `json:"help"`
	Type string `json:"type"`
}

func QueryMetrics(c *gin.Context) {
	appName := c.Param("app_name")
	if db.GetComponentConfig(appName) == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported metrics component"})
		return
	}
	podName := c.Param("pod_name")
	switch c.Query("type") {
	case "mname":
		queryMetricNames(c, appName, podName)
	case "details":
		queryMetricDetailsByName(c, appName, podName, c.Query("mname"))
	case "metricsdetails":
		queryMetricDetails(c, appName)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported query type"})
	}
}

func queryMetricNames(c *gin.Context, appName, podName string) {
	store := scrape.Store()
	if store == nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "metrics store is not initialized"})
		return
	}
	end := time.Now().UTC()
	start := end.Add(-maxVisualizationWindow)
	selector, err := metricScopeSelector(appName, podName)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	names, err := store.LabelValues(c.Request.Context(), "__name__", selector, start, end)
	if err != nil {
		writeStoreError(c, err)
		return
	}
	metadata, err := store.Metadata(c.Request.Context(), "")
	if err != nil {
		writeStoreError(c, err)
		return
	}
	catalog, _ := buildMetricCatalog(names, metadata, nil)
	if len(catalog) == 0 {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "no metrics data available"})
		return
	}
	metricNames := make([]string, 0, len(catalog))
	for _, item := range catalog {
		metricNames = append(metricNames, item.Name)
	}
	c.JSON(http.StatusOK, gin.H{"metricNames": metricNames})
}

func queryMetricDetailsByName(c *gin.Context, appName, podName, metricName string) {
	if !metricNamePattern.MatchString(metricName) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Metric name required for details"})
		return
	}
	store := scrape.Store()
	if store == nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "metrics store is not initialized"})
		return
	}
	scopeSelector, err := metricScopeSelector(appName, podName)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	end := time.Now().UTC()
	start := end.Add(-defaultVisualizationWindow)
	names, err := store.LabelValues(c.Request.Context(), "__name__", scopeSelector, start, end)
	if err != nil {
		writeStoreError(c, err)
		return
	}
	metadata, err := store.Metadata(c.Request.Context(), "")
	if err != nil {
		writeStoreError(c, err)
		return
	}
	_, metaByName := buildMetricCatalog(names, metadata, []string{metricName})
	metricType := normalizePrometheusType(metaByName[metricName].mtype)
	type metricValue struct {
		Value   string            `json:"value"`
		Measure string            `json:"measure"`
		Labels  map[string]string `json:"labels"`
	}
	type metricDetails struct {
		Name   string        `json:"name"`
		Values []metricValue `json:"values"`
	}
	details := map[string]metricDetails{}
	appendSeries := func(series []metricstore.TimeSeries, measure string) {
		for _, item := range series {
			labels := publicLabels(item.Metric)
			for _, sample := range item.Values {
				key := sample.Timestamp.Format(time.RFC3339)
				detail := details[key]
				detail.Name = metricName
				detail.Values = append(detail.Values, metricValue{Value: strconv.FormatFloat(sample.Value, 'g', -1, 64), Measure: measure, Labels: labels})
				details[key] = detail
			}
		}
	}
	seriesToQuery := []struct {
		name    string
		measure string
	}{{name: metricName, measure: "current_value"}}
	switch metricType {
	case "counter":
		seriesToQuery[0].measure = "total"
	case "histogram":
		seriesToQuery = []struct {
			name    string
			measure string
		}{{metricName + "_bucket", "cumulative_count"}, {metricName + "_sum", "sum"}, {metricName + "_count", "count"}}
	case "summary":
		seriesToQuery = []struct {
			name    string
			measure string
		}{{metricName, "current_value"}, {metricName + "_sum", "sum"}, {metricName + "_count", "count"}}
	}
	for _, item := range seriesToQuery {
		selector, selectorErr := metricSelector(item.name, appName, podName, nil)
		if selectorErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": selectorErr.Error()})
			return
		}
		series, queryErr := store.QueryRange(c.Request.Context(), selector, start, end, queryStep(defaultVisualizationWindow))
		if queryErr != nil {
			writeStoreError(c, queryErr)
			return
		}
		appendSeries(series, item.measure)
	}
	if len(details) == 0 {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "no metric details available"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"details": details})
}

func queryMetricDetails(c *gin.Context, appName string) {
	store := scrape.Store()
	if store == nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "metrics store is not initialized"})
		return
	}
	end := time.Now().UTC()
	start := end.Add(-maxVisualizationWindow)
	pods, err := store.LabelValues(c.Request.Context(), metricstore.PodLabel, componentSelector(appName), start, end)
	if err != nil {
		writeStoreError(c, err)
		return
	}
	metadata, err := store.Metadata(c.Request.Context(), "")
	if err != nil {
		writeStoreError(c, err)
		return
	}
	if len(pods) == 0 {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "no metrics data available"})
		return
	}
	result := make(map[string]map[string]MetricInfo, len(pods))
	hasData := false
	for _, pod := range pods {
		selector, selectorErr := metricScopeSelector(appName, pod)
		if selectorErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": selectorErr.Error()})
			return
		}
		names, queryErr := store.LabelValues(c.Request.Context(), "__name__", selector, start, end)
		if queryErr != nil {
			writeStoreError(c, queryErr)
			return
		}
		catalog, _ := buildMetricCatalog(names, metadata, nil)
		items := make(map[string]MetricInfo, len(catalog))
		for _, metric := range catalog {
			items[metric.Name] = MetricInfo{Help: metric.Help, Type: metric.PrometheusType}
		}
		hasData = hasData || len(items) > 0
		result[strings.ReplaceAll(pod, "-", "_")] = items
	}
	if !hasData {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "no metrics data available"})
		return
	}
	c.JSON(http.StatusOK, result)
}

func publicLabels(labels map[string]string) map[string]string {
	result := make(map[string]string)
	for key, value := range labels {
		switch key {
		case "__name__", metricstore.ComponentLabel, metricstore.PodLabel, metricstore.ClusterLabel:
			continue
		default:
			result[key] = value
		}
	}
	return result
}
