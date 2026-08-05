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
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/karmada-io/dashboard/cmd/metrics-scraper/app/db"
	metricstore "github.com/karmada-io/dashboard/cmd/metrics-scraper/app/store"
)

var (
	storeMu        sync.RWMutex
	metricsStore   metricstore.Store
	syncMap        sync.Map
	scrapeInterval = 10 * time.Second
)

func componentNames() []string {
	names := make([]string, 0, len(db.AllComponents())+2)
	for _, cfg := range db.AllComponents() {
		if cfg.Name == db.KarmadaSchedulerEstimator {
			names = append(names, cfg.Name+"-member1", cfg.Name+"-member2", cfg.Name+"-member3")
			continue
		}
		names = append(names, cfg.Name)
	}
	return names
}

func Store() metricstore.Store {
	storeMu.RLock()
	defer storeMu.RUnlock()
	return metricsStore
}

func SetStore(store metricstore.Store) {
	storeMu.Lock()
	metricsStore = store
	storeMu.Unlock()
}

func Init(ctx context.Context, store metricstore.Store, interval time.Duration) error {
	if store == nil {
		return errors.New("metrics store is required")
	}
	if interval > 0 {
		scrapeInterval = interval
	}
	SetStore(store)

	log.Printf("Metrics scrape interval set to %s", scrapeInterval)
	for _, appName := range componentNames() {
		syncMap.Store(appName, 1)
		go startAppMetricsFetcher(ctx, appName)
	}
	return nil
}

func startAppMetricsFetcher(ctx context.Context, appName string) {
	scrape := func() {
		value, ok := syncMap.Load(appName)
		if !ok || value != 1 {
			return
		}
		_, warnings, err := FetchMetrics(ctx, appName, true)
		if err != nil {
			log.Printf("Error fetching metrics for %s: %v, warnings: %v", appName, err, warnings)
		}
	}

	scrape()
	ticker := time.NewTicker(scrapeInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			scrape()
		}
	}
}

func CheckAppStatus(c *gin.Context) {
	status := make(map[string]bool, len(componentNames()))
	for _, appName := range componentNames() {
		value, ok := syncMap.Load(appName)
		status[appName] = ok && value == 1
	}
	c.JSON(http.StatusOK, status)
}

func HandleSyncOperation(c *gin.Context, appName string, syncValue int, queryType string) {
	if syncValue != 0 && syncValue != 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid sync value"})
		return
	}
	if appName == "" {
		for _, name := range componentNames() {
			syncMap.Store(name, syncValue)
		}
		state := "off"
		if syncValue == 1 {
			state = "on"
		}
		c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Sync turned %s successfully for all apps", state)})
		return
	}
	if db.GetComponentConfig(appName) == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported metrics component"})
		return
	}
	if current, ok := syncMap.Load(appName); ok && current == syncValue {
		c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Sync is already %s for %s", queryType, appName)})
		return
	}
	syncMap.Store(appName, syncValue)
	state := "off"
	if syncValue == 1 {
		state = "on"
	}
	c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Sync turned %s successfully for %s", state, appName)})
}

func TriggerScrapeNow(ctx context.Context, appName string) ([]string, error) {
	if Store() == nil {
		return nil, errors.New("metrics scraper is not initialized")
	}
	_, warnings, err := FetchMetrics(ctx, appName, true)
	return warnings, err
}
