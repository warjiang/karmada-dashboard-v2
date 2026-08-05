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

package store

import (
	"bytes"
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

const (
	ComponentLabel = "karmada_dashboard_component"
	PodLabel       = "karmada_dashboard_pod"
	ClusterLabel   = "karmada_dashboard_cluster"
)

var ErrUnavailable = errors.New("victoriametrics unavailable")

type Config struct {
	URL                string
	Timeout            time.Duration
	BearerTokenFile    string
	CAFile             string
	InsecureSkipVerify bool
}

type Sample struct {
	Timestamp time.Time
	Value     float64
}

type TimeSeries struct {
	Metric map[string]string
	Values []Sample
}

type Metadata struct {
	Type string `json:"type"`
	Help string `json:"help"`
	Unit string `json:"unit"`
}

type Store interface {
	ImportPrometheus(context.Context, []byte, map[string]string) error
	QueryRange(context.Context, string, time.Time, time.Time, time.Duration) ([]TimeSeries, error)
	LabelValues(context.Context, string, string, time.Time, time.Time) ([]string, error)
	Series(context.Context, string, time.Time, time.Time) ([]map[string]string, error)
	Metadata(context.Context, string) (map[string][]Metadata, error)
	Health(context.Context) error
}

type VictoriaMetrics struct {
	baseURL         *url.URL
	client          *http.Client
	bearerTokenFile string
}

func NewVictoriaMetrics(cfg Config) (*VictoriaMetrics, error) {
	if cfg.Timeout <= 0 {
		cfg.Timeout = 10 * time.Second
	}
	baseURL, err := url.Parse(strings.TrimSpace(cfg.URL))
	if err != nil || baseURL.Scheme == "" || baseURL.Host == "" {
		return nil, fmt.Errorf("invalid VictoriaMetrics URL %q", cfg.URL)
	}
	if baseURL.Scheme != "http" && baseURL.Scheme != "https" {
		return nil, fmt.Errorf("unsupported VictoriaMetrics URL scheme %q", baseURL.Scheme)
	}
	if baseURL.RawQuery != "" || baseURL.Fragment != "" {
		return nil, errors.New("VictoriaMetrics URL must not contain a query or fragment")
	}
	baseURL.Path = strings.TrimRight(baseURL.Path, "/")

	tlsConfig := &tls.Config{MinVersion: tls.VersionTLS12}
	if cfg.InsecureSkipVerify {
		// #nosec G402 -- explicitly controlled by an operator-facing flag.
		tlsConfig.InsecureSkipVerify = true
	}
	if cfg.CAFile != "" {
		pem, readErr := os.ReadFile(cfg.CAFile)
		if readErr != nil {
			return nil, fmt.Errorf("read VictoriaMetrics CA file: %w", readErr)
		}
		roots, poolErr := x509.SystemCertPool()
		if poolErr != nil || roots == nil {
			roots = x509.NewCertPool()
		}
		if !roots.AppendCertsFromPEM(pem) {
			return nil, errors.New("VictoriaMetrics CA file contains no certificates")
		}
		tlsConfig.RootCAs = roots
	}

	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.TLSClientConfig = tlsConfig
	return &VictoriaMetrics{
		baseURL:         baseURL,
		client:          &http.Client{Timeout: cfg.Timeout, Transport: transport},
		bearerTokenFile: cfg.BearerTokenFile,
	}, nil
}

func (v *VictoriaMetrics) ImportPrometheus(ctx context.Context, body []byte, extraLabels map[string]string) error {
	values := url.Values{}
	for name, value := range extraLabels {
		values.Add("extra_label", name+"="+value)
	}
	var lastErr error
	for attempt := 0; attempt < 3; attempt++ {
		if attempt > 0 {
			delay := time.Duration(attempt*attempt) * 100 * time.Millisecond
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(delay):
			}
		}
		req, err := v.request(ctx, http.MethodPost, "/api/v1/import/prometheus", values, bytes.NewReader(body))
		if err != nil {
			return err
		}
		req.Header.Set("Content-Type", "text/plain; version=0.0.4")
		resp, err := v.client.Do(req)
		if err != nil {
			lastErr = fmt.Errorf("%w: import metrics: %v", ErrUnavailable, err)
			continue
		}
		responseBody, readErr := io.ReadAll(io.LimitReader(resp.Body, 4096))
		resp.Body.Close()
		if readErr != nil {
			lastErr = fmt.Errorf("%w: read import response: %v", ErrUnavailable, readErr)
			continue
		}
		if resp.StatusCode >= http.StatusOK && resp.StatusCode < http.StatusMultipleChoices {
			return nil
		}
		lastErr = fmt.Errorf("%w: import returned %s: %s", ErrUnavailable, resp.Status, strings.TrimSpace(string(responseBody)))
	}
	return lastErr
}

func (v *VictoriaMetrics) QueryRange(ctx context.Context, query string, start, end time.Time, step time.Duration) ([]TimeSeries, error) {
	values := url.Values{
		"query": {query},
		"start": {formatTimestamp(start)},
		"end":   {formatTimestamp(end)},
		"step":  {strconv.FormatFloat(step.Seconds(), 'f', -1, 64)},
	}
	var response matrixResponse
	if err := v.getJSON(ctx, "/api/v1/query_range", values, &response); err != nil {
		return nil, err
	}
	result := make([]TimeSeries, 0, len(response.Data.Result))
	for _, raw := range response.Data.Result {
		series := TimeSeries{Metric: raw.Metric, Values: make([]Sample, 0, len(raw.Values))}
		for _, pair := range raw.Values {
			if len(pair) != 2 {
				continue
			}
			seconds, ok := pair[0].(float64)
			if !ok {
				continue
			}
			valueText, ok := pair[1].(string)
			if !ok {
				continue
			}
			value, err := strconv.ParseFloat(valueText, 64)
			if err != nil || math.IsNaN(value) || math.IsInf(value, 0) {
				continue
			}
			series.Values = append(series.Values, Sample{Timestamp: time.UnixMilli(int64(seconds * 1000)).UTC(), Value: value})
		}
		result = append(result, series)
	}
	return result, nil
}

func (v *VictoriaMetrics) LabelValues(ctx context.Context, label, match string, start, end time.Time) ([]string, error) {
	values := url.Values{"match[]": {match}, "start": {formatTimestamp(start)}, "end": {formatTimestamp(end)}}
	var response stringListResponse
	path := "/api/v1/label/" + url.PathEscape(label) + "/values"
	if err := v.getJSON(ctx, path, values, &response); err != nil {
		return nil, err
	}
	return response.Data, nil
}

func (v *VictoriaMetrics) Series(ctx context.Context, match string, start, end time.Time) ([]map[string]string, error) {
	values := url.Values{"match[]": {match}, "start": {formatTimestamp(start)}, "end": {formatTimestamp(end)}}
	var response seriesResponse
	if err := v.getJSON(ctx, "/api/v1/series", values, &response); err != nil {
		return nil, err
	}
	return response.Data, nil
}

func (v *VictoriaMetrics) Metadata(ctx context.Context, metric string) (map[string][]Metadata, error) {
	values := url.Values{}
	if metric != "" {
		values.Set("metric", metric)
	}
	var response metadataResponse
	if err := v.getJSON(ctx, "/api/v1/metadata", values, &response); err != nil {
		return nil, err
	}
	return response.Data, nil
}

func (v *VictoriaMetrics) Health(ctx context.Context) error {
	req, err := v.request(ctx, http.MethodGet, "/health", nil, nil)
	if err != nil {
		return err
	}
	resp, err := v.client.Do(req)
	if err != nil {
		return fmt.Errorf("%w: health check: %v", ErrUnavailable, err)
	}
	defer resp.Body.Close()
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return fmt.Errorf("%w: health check returned %s", ErrUnavailable, resp.Status)
	}
	return nil
}

func (v *VictoriaMetrics) getJSON(ctx context.Context, path string, values url.Values, target any) error {
	req, err := v.request(ctx, http.MethodGet, path, values, nil)
	if err != nil {
		return err
	}
	resp, err := v.client.Do(req)
	if err != nil {
		return fmt.Errorf("%w: GET %s: %v", ErrUnavailable, path, err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(io.LimitReader(resp.Body, 16<<20))
	if err != nil {
		return fmt.Errorf("%w: read %s response: %v", ErrUnavailable, path, err)
	}
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return fmt.Errorf("%w: GET %s returned %s: %s", ErrUnavailable, path, resp.Status, strings.TrimSpace(string(body)))
	}
	if err := json.Unmarshal(body, target); err != nil {
		return fmt.Errorf("decode VictoriaMetrics %s response: %w", path, err)
	}
	return nil
}

func (v *VictoriaMetrics) request(ctx context.Context, method, path string, values url.Values, body io.Reader) (*http.Request, error) {
	endpoint := *v.baseURL
	endpoint.Path = strings.TrimRight(endpoint.Path, "/") + path
	endpoint.RawQuery = values.Encode()
	req, err := http.NewRequestWithContext(ctx, method, endpoint.String(), body)
	if err != nil {
		return nil, err
	}
	if v.bearerTokenFile != "" {
		token, readErr := os.ReadFile(v.bearerTokenFile)
		if readErr != nil {
			return nil, fmt.Errorf("read VictoriaMetrics bearer token: %w", readErr)
		}
		if value := strings.TrimSpace(string(token)); value != "" {
			req.Header.Set("Authorization", "Bearer "+value)
		}
	}
	return req, nil
}

func formatTimestamp(value time.Time) string {
	return strconv.FormatFloat(float64(value.UnixMilli())/1000, 'f', 3, 64)
}

type matrixResponse struct {
	Status string `json:"status"`
	Data   struct {
		Result []struct {
			Metric map[string]string `json:"metric"`
			Values [][]any           `json:"values"`
		} `json:"result"`
	} `json:"data"`
}

type stringListResponse struct {
	Status string   `json:"status"`
	Data   []string `json:"data"`
}

type seriesResponse struct {
	Status string              `json:"status"`
	Data   []map[string]string `json:"data"`
}

type metadataResponse struct {
	Status string                `json:"status"`
	Data   map[string][]Metadata `json:"data"`
}
