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
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/karmada-io/dashboard/cmd/metrics-scraper/app/db"
	"github.com/karmada-io/dashboard/cmd/metrics-scraper/app/scrape"
	metricstore "github.com/karmada-io/dashboard/cmd/metrics-scraper/app/store"
)

const defaultExploreAggregation = "sum"

type LabelFilter struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

type ExploreMeta struct {
	Metric      string        `json:"metric"`
	Aggregation string        `json:"aggregation"`
	Labels      []LabelFilter `json:"labels"`
	Window      string        `json:"window"`
	PodMode     string        `json:"podMode"`
	GeneratedAt string        `json:"generatedAt"`
}

type ExploreResponse struct {
	Meta            ExploreMeta         `json:"meta"`
	Timeseries      []Point             `json:"timeseries"`
	AvailableLabels map[string][]string `json:"availableLabels"`
}

func GetMetricExplore(c *gin.Context) {
	appName := c.Param("app_name")
	if db.GetComponentConfig(appName) == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported metrics component"})
		return
	}
	metricName := strings.TrimSpace(c.Query("metric"))
	if !metricNamePattern.MatchString(metricName) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "metric is required and must be a valid metric name"})
		return
	}
	aggregation, err := parseExploreAggregation(c.Query("aggregation"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	filters, err := parseLabelFilters(c.Query("labels"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	window, err := parseWindow(c.Query("window"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	podMode := c.DefaultQuery("pod", defaultPodMode)
	store := scrape.Store()
	if store == nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "metrics store is not initialized"})
		return
	}
	end := time.Now().UTC()
	start := end.Add(-window)
	nameSelector, err := metricScopeSelector(appName, podMode)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	seriesNames, err := store.LabelValues(c.Request.Context(), "__name__", nameSelector, start, end)
	if err != nil {
		writeStoreError(c, err)
		return
	}
	metadata, err := store.Metadata(c.Request.Context(), "")
	if err != nil {
		writeStoreError(c, err)
		return
	}
	_, metaByName := buildMetricCatalog(seriesNames, metadata, []string{metricName})
	metricType := metaByName[metricName].mtype
	query, err := aggregateQuery(metricName, metricType, aggregation, appName, podMode, filters)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	result, err := store.QueryRange(c.Request.Context(), query, start, end, queryStep(window))
	if err != nil {
		writeStoreError(c, err)
		return
	}
	labelMetric := metricName
	if metricType == "histogram" || metricType == "summary" {
		labelMetric += "_sum"
	}
	labelSelector, _ := metricSelector(labelMetric, appName, podMode, nil)
	availableLabels, err := queryAvailableLabels(c.Request.Context(), store, labelSelector, start, end)
	if err != nil {
		writeStoreError(c, err)
		return
	}
	points := flattenSeries(result)
	if len(points) == 0 {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": fmt.Sprintf("no %s data available in requested window", metricName)})
		return
	}
	c.JSON(http.StatusOK, ExploreResponse{
		Meta:       ExploreMeta{Metric: metricName, Aggregation: aggregation, Labels: filters, Window: window.String(), PodMode: podMode, GeneratedAt: end.Format(time.RFC3339)},
		Timeseries: points, AvailableLabels: availableLabels,
	})
}

func parseExploreAggregation(raw string) (string, error) {
	if raw == "" {
		return defaultExploreAggregation, nil
	}
	value := strings.ToLower(strings.TrimSpace(raw))
	switch value {
	case "sum", "avg", "max", "min", "rate":
		return value, nil
	default:
		return "", fmt.Errorf("invalid aggregation %q, expected one of sum, avg, max, min, rate", raw)
	}
}

func parseLabelFilters(raw string) ([]LabelFilter, error) {
	if strings.TrimSpace(raw) == "" {
		return nil, nil
	}
	var filters []LabelFilter
	if err := json.Unmarshal([]byte(raw), &filters); err != nil {
		return nil, fmt.Errorf("invalid labels, expected JSON array of {key,value}: %w", err)
	}
	for _, filter := range filters {
		if strings.TrimSpace(filter.Key) == "" {
			return nil, fmt.Errorf("invalid labels, key must not be empty")
		}
	}
	return filters, nil
}

func queryAvailableLabels(ctx context.Context, store metricstore.Store, selector string, start, end time.Time) (map[string][]string, error) {
	series, err := store.Series(ctx, selector, start, end)
	if err != nil {
		return nil, err
	}
	return collectAvailableLabels(series), nil
}

func collectAvailableLabels(series []map[string]string) map[string][]string {
	reserved := map[string]bool{"__name__": true, metricstore.ComponentLabel: true, metricstore.PodLabel: true, metricstore.ClusterLabel: true}
	sets := map[string]map[string]bool{}
	for _, labels := range series {
		for key, value := range labels {
			if reserved[key] {
				continue
			}
			if sets[key] == nil {
				sets[key] = map[string]bool{}
			}
			sets[key][value] = true
		}
	}
	result := make(map[string][]string, len(sets))
	for key, values := range sets {
		for value := range values {
			result[key] = append(result[key], value)
		}
		sort.Strings(result[key])
	}
	return result
}
