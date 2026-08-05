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
	"context"
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	promapi "github.com/prometheus/client_golang/api"
	promv1 "github.com/prometheus/client_golang/api/prometheus/v1"
	"github.com/prometheus/common/model"
)

// Config configures access to a Prometheus HTTP API.
type Config struct {
	Address         string
	Timeout         time.Duration
	BearerTokenFile string
	CAFile          string
	CertFile        string
	KeyFile         string
	ServerName      string
	InsecureTLS     bool
}

// Client wraps the official Prometheus Go API client with dashboard domain types.
type Client struct {
	api promv1.API
}

// Sample is one Prometheus instant-vector sample.
type Sample struct {
	Labels    map[string]string
	Timestamp time.Time
	Value     float64
}

// Series is one Prometheus range-vector series.
type Series struct {
	Labels map[string]string
	Points []Point
}

// Point is a numeric sample in a time series.
type Point struct {
	Timestamp time.Time
	Value     float64
}

// Metadata describes a Prometheus metric family.
type Metadata struct {
	Type string `json:"type"`
	Help string `json:"help"`
	Unit string `json:"unit"`
}

type bearerRoundTripper struct {
	token string
	next  http.RoundTripper
}

func (rt *bearerRoundTripper) RoundTrip(request *http.Request) (*http.Response, error) {
	clone := request.Clone(request.Context())
	clone.Header = request.Header.Clone()
	clone.Header.Set("Authorization", "Bearer "+rt.token)
	return rt.next.RoundTrip(clone)
}

// NewClient creates a Prometheus API client.
func NewClient(cfg Config) (*Client, error) {
	if strings.TrimSpace(cfg.Address) == "" {
		return nil, fmt.Errorf("prometheus address is required")
	}
	parsedURL, err := url.Parse(cfg.Address)
	if err != nil || parsedURL.Scheme == "" || parsedURL.Host == "" {
		return nil, fmt.Errorf("invalid prometheus address %q", cfg.Address)
	}

	tlsConfig := &tls.Config{ // #nosec G402 -- optional insecure mode is explicitly configured by the operator.
		MinVersion:         tls.VersionTLS12,
		ServerName:         cfg.ServerName,
		InsecureSkipVerify: cfg.InsecureTLS,
	}
	if cfg.CAFile != "" {
		caData, readErr := os.ReadFile(cfg.CAFile)
		if readErr != nil {
			return nil, fmt.Errorf("read prometheus CA: %w", readErr)
		}
		pool, poolErr := x509.SystemCertPool()
		if poolErr != nil {
			pool = x509.NewCertPool()
		}
		if !pool.AppendCertsFromPEM(caData) {
			return nil, fmt.Errorf("prometheus CA file contains no certificates")
		}
		tlsConfig.RootCAs = pool
	}
	if cfg.CertFile != "" || cfg.KeyFile != "" {
		if cfg.CertFile == "" || cfg.KeyFile == "" {
			return nil, fmt.Errorf("both prometheus client certificate and key are required")
		}
		certificate, certErr := tls.LoadX509KeyPair(cfg.CertFile, cfg.KeyFile)
		if certErr != nil {
			return nil, fmt.Errorf("load prometheus client certificate: %w", certErr)
		}
		tlsConfig.Certificates = []tls.Certificate{certificate}
	}

	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.TLSClientConfig = tlsConfig
	var roundTripper http.RoundTripper = transport
	if cfg.BearerTokenFile != "" {
		token, readErr := os.ReadFile(cfg.BearerTokenFile)
		if readErr != nil {
			return nil, fmt.Errorf("read prometheus bearer token: %w", readErr)
		}
		if bearerToken := strings.TrimSpace(string(token)); bearerToken != "" {
			roundTripper = &bearerRoundTripper{token: bearerToken, next: transport}
		}
	}
	if cfg.Timeout <= 0 {
		cfg.Timeout = 15 * time.Second
	}
	httpClient := &http.Client{Timeout: cfg.Timeout, Transport: roundTripper}
	apiClient, err := promapi.NewClient(promapi.Config{Address: cfg.Address, Client: httpClient})
	if err != nil {
		return nil, fmt.Errorf("create Prometheus API client: %w", err)
	}
	return &Client{api: promv1.NewAPI(apiClient)}, nil
}

// Query executes an instant query.
func (c *Client) Query(ctx context.Context, query string, at time.Time) ([]Sample, []string, error) {
	value, warnings, err := c.api.Query(ctx, query, at)
	if err != nil {
		return nil, warnings, err
	}
	vector, ok := value.(model.Vector)
	if !ok {
		return nil, warnings, fmt.Errorf("unexpected prometheus result type %q", value.Type())
	}
	result := make([]Sample, 0, len(vector))
	for _, sample := range vector {
		if sample.Histogram != nil {
			return nil, warnings, fmt.Errorf("native histogram instant results are not supported")
		}
		result = append(result, Sample{
			Labels:    labelsFromMetric(sample.Metric),
			Timestamp: sample.Timestamp.Time().UTC(),
			Value:     float64(sample.Value),
		})
	}
	return result, warnings, nil
}

// QueryRange executes a range query.
func (c *Client) QueryRange(ctx context.Context, query string, start, end time.Time, step time.Duration) ([]Series, []string, error) {
	value, warnings, err := c.api.QueryRange(ctx, query, promv1.Range{Start: start, End: end, Step: step})
	if err != nil {
		return nil, warnings, err
	}
	matrix, ok := value.(model.Matrix)
	if !ok {
		return nil, warnings, fmt.Errorf("unexpected prometheus result type %q", value.Type())
	}
	result := make([]Series, 0, len(matrix))
	for _, stream := range matrix {
		if len(stream.Histograms) > 0 {
			return nil, warnings, fmt.Errorf("native histogram range results are not supported")
		}
		series := Series{Labels: labelsFromMetric(stream.Metric), Points: make([]Point, 0, len(stream.Values))}
		for _, pair := range stream.Values {
			series.Points = append(series.Points, Point{Timestamp: pair.Timestamp.Time().UTC(), Value: float64(pair.Value)})
		}
		result = append(result, series)
	}
	return result, warnings, nil
}

// LabelValues returns values for a label, optionally restricted by matchers.
func (c *Client) LabelValues(ctx context.Context, label string, matches []string, start, end time.Time) ([]string, []string, error) {
	values, warnings, err := c.api.LabelValues(ctx, label, matches, start, end)
	result := make([]string, 0, len(values))
	for _, value := range values {
		result = append(result, string(value))
	}
	return result, warnings, err
}

// LabelNames returns label names for matching series.
func (c *Client) LabelNames(ctx context.Context, matches []string, start, end time.Time) ([]string, []string, error) {
	labels, warnings, err := c.api.LabelNames(ctx, matches, start, end)
	result := make([]string, 0, len(labels))
	for _, label := range labels {
		result = append(result, string(label))
	}
	return result, warnings, err
}

// Metadata returns Prometheus metric metadata.
func (c *Client) Metadata(ctx context.Context, metric string) (map[string][]Metadata, []string, error) {
	metadata, err := c.api.Metadata(ctx, metric, "5000")
	if err != nil {
		return nil, nil, err
	}
	result := make(map[string][]Metadata, len(metadata))
	for name, entries := range metadata {
		converted := make([]Metadata, 0, len(entries))
		for _, entry := range entries {
			converted = append(converted, Metadata{Type: string(entry.Type), Help: entry.Help, Unit: entry.Unit})
		}
		result[name] = converted
	}
	return result, nil, nil
}

func labelsFromMetric(metric model.Metric) map[string]string {
	labels := make(map[string]string, len(metric))
	for name, value := range metric {
		labels[string(name)] = string(value)
	}
	return labels
}
