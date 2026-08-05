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
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	promapi "github.com/karmada-io/dashboard/cmd/metrics-scraper/app/prometheus"
)

func TestV2MetricsRoutes(t *testing.T) {
	gin.SetMode(gin.TestMode)
	var rangeQuery string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/api/v1/query":
			_, _ = io.WriteString(w, `{"status":"success","data":{"resultType":"vector","result":[{"metric":{"karmada_component":"karmada-scheduler","karmada_pod":"scheduler-0"},"value":[1720000000,"1"]}]}}`)
		case "/api/v1/label/__name__/values":
			_, _ = io.WriteString(w, `{"status":"success","data":["process_cpu_seconds_total","request_duration_seconds_bucket","request_duration_seconds_sum","request_duration_seconds_count"]}`)
		case "/api/v1/label/pod/values":
			_, _ = io.WriteString(w, `{"status":"success","data":["scheduler-0"]}`)
		case "/api/v1/metadata":
			_, _ = io.WriteString(w, `{"status":"success","data":{"process_cpu_seconds_total":[{"type":"counter","help":"CPU time","unit":"seconds"}],"request_duration_seconds":[{"type":"histogram","help":"Request duration","unit":"seconds"}]}}`)
		case "/api/v1/query_range":
			if err := r.ParseForm(); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
			rangeQuery = r.Form.Get("query")
			_, _ = io.WriteString(w, `{"status":"success","data":{"resultType":"matrix","result":[{"metric":{"__name__":"process_cpu_seconds_total","karmada_component":"karmada-scheduler","pod":"scheduler-0"},"values":[[1720000000,"2.5"]]}]}}`)
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	client, err := promapi.NewClient(promapi.Config{Address: server.URL, Timeout: time.Second})
	if err != nil {
		t.Fatal(err)
	}
	Configure(client, []string{"karmada-scheduler"}, time.Second, 24*time.Hour)
	router := newV2TestRouter()

	tests := []struct {
		name       string
		method     string
		path       string
		body       string
		wantStatus int
		wantBody   string
	}{
		{name: "components", method: http.MethodGet, path: "/components", wantStatus: http.StatusOK, wantBody: `"healthyTargets":1`},
		{name: "catalog", method: http.MethodGet, path: "/catalog?component=karmada-scheduler", wantStatus: http.StatusOK, wantBody: `"type":"histogram"`},
		{name: "label values", method: http.MethodGet, path: "/label-values?component=karmada-scheduler&metric=up&label=pod", wantStatus: http.StatusOK, wantBody: `"pod":["scheduler-0"]`},
		{name: "query range", method: http.MethodPost, path: "/query-range", body: `{"component":"karmada-scheduler","metric":"process_cpu_seconds_total","transform":"raw","aggregation":"none","window":"1m","stepSeconds":15}`, wantStatus: http.StatusOK, wantBody: `"value":2.5`},
		{name: "invalid component", method: http.MethodGet, path: "/catalog?component=unknown", wantStatus: http.StatusBadRequest, wantBody: `"code":"invalid_component"`},
		{name: "reserved filter", method: http.MethodPost, path: "/query-range", body: `{"component":"karmada-scheduler","metric":"up","transform":"raw","window":"1m","stepSeconds":15,"filters":[{"label":"karmada_component","operator":"=","value":"other"}]}`, wantStatus: http.StatusBadRequest, wantBody: `"code":"invalid_query"`},
		{name: "excessive range", method: http.MethodPost, path: "/query-range", body: `{"component":"karmada-scheduler","metric":"up","transform":"raw","window":"25h","stepSeconds":300}`, wantStatus: http.StatusBadRequest, wantBody: `"code":"invalid_time_range"`},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			request := httptest.NewRequest(tt.method, tt.path, strings.NewReader(tt.body))
			if tt.body != "" {
				request.Header.Set("Content-Type", "application/json")
			}
			response := httptest.NewRecorder()
			router.ServeHTTP(response, request)
			if response.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d; body: %s", response.Code, tt.wantStatus, response.Body.String())
			}
			if !strings.Contains(response.Body.String(), tt.wantBody) {
				t.Fatalf("body does not contain %q: %s", tt.wantBody, response.Body.String())
			}
		})
	}
	if !strings.Contains(rangeQuery, `karmada_component="karmada-scheduler"`) {
		t.Fatalf("query does not contain the server-managed component matcher: %s", rangeQuery)
	}
}

func TestV2MetricsPrometheusErrors(t *testing.T) {
	gin.SetMode(gin.TestMode)
	tests := []struct {
		name       string
		handler    http.Handler
		timeout    time.Duration
		clientWait time.Duration
		wantStatus int
		wantCode   string
	}{
		{
			name: "unavailable",
			handler: http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
				w.WriteHeader(http.StatusServiceUnavailable)
				_, _ = io.WriteString(w, `{"status":"error","errorType":"unavailable","error":"not ready"}`)
			}),
			timeout:    time.Second,
			clientWait: time.Second,
			wantStatus: http.StatusServiceUnavailable,
			wantCode:   "prometheus_unavailable",
		},
		{
			name: "context timeout",
			handler: http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
				time.Sleep(75 * time.Millisecond)
				_, _ = io.WriteString(w, `{"status":"success","data":{"resultType":"vector","result":[]}}`)
			}),
			timeout:    10 * time.Millisecond,
			clientWait: time.Second,
			wantStatus: http.StatusGatewayTimeout,
			wantCode:   "prometheus_timeout",
		},
		{
			name: "HTTP client timeout",
			handler: http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
				time.Sleep(75 * time.Millisecond)
				_, _ = io.WriteString(w, `{"status":"success","data":{"resultType":"vector","result":[]}}`)
			}),
			timeout:    time.Second,
			clientWait: 10 * time.Millisecond,
			wantStatus: http.StatusGatewayTimeout,
			wantCode:   "prometheus_timeout",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := httptest.NewServer(tt.handler)
			defer server.Close()
			client, err := promapi.NewClient(promapi.Config{Address: server.URL, Timeout: tt.clientWait})
			if err != nil {
				t.Fatal(err)
			}
			Configure(client, []string{"karmada-scheduler"}, tt.timeout, time.Hour)
			response := httptest.NewRecorder()
			newV2TestRouter().ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/components", nil))
			if response.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d; body: %s", response.Code, tt.wantStatus, response.Body.String())
			}
			if !strings.Contains(response.Body.String(), tt.wantCode) {
				t.Fatalf("body does not contain %q: %s", tt.wantCode, response.Body.String())
			}
		})
	}
}

func newV2TestRouter() *gin.Engine {
	router := gin.New()
	router.GET("/components", GetComponents)
	router.GET("/catalog", GetCatalog)
	router.GET("/label-values", GetLabelValues)
	router.POST("/query-range", QueryRange)
	return router
}
