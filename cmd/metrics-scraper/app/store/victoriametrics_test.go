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
	"context"
	"encoding/pem"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestImportPrometheusRetriesAndAddsLabelsAndBearer(t *testing.T) {
	attempts := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attempts++
		if r.URL.Path != "/api/v1/import/prometheus" {
			t.Fatalf("unexpected path %s", r.URL.Path)
		}
		if r.Header.Get("Authorization") != "Bearer secret" {
			t.Fatalf("missing bearer token")
		}
		labels := r.URL.Query()["extra_label"]
		if len(labels) != 2 {
			t.Fatalf("expected two extra labels, got %v", labels)
		}
		labelSet := map[string]bool{}
		for _, label := range labels {
			labelSet[label] = true
		}
		if !labelSet[ComponentLabel+"=scheduler team=a"] || !labelSet[PodLabel+"=pod-a"] {
			t.Fatalf("extra labels were not safely encoded: %v", labels)
		}
		if attempts < 3 {
			http.Error(w, "retry", http.StatusServiceUnavailable)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}))
	defer server.Close()
	tokenFile := filepath.Join(t.TempDir(), "token")
	if err := os.WriteFile(tokenFile, []byte("secret\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	client, err := NewVictoriaMetrics(Config{URL: server.URL, BearerTokenFile: tokenFile, Timeout: time.Second})
	if err != nil {
		t.Fatal(err)
	}
	err = client.ImportPrometheus(context.Background(), []byte("up 1\n"), map[string]string{ComponentLabel: "scheduler team=a", PodLabel: "pod-a"})
	if err != nil {
		t.Fatal(err)
	}
	if attempts != 3 {
		t.Fatalf("expected three attempts, got %d", attempts)
	}
}

func TestQueryRangeDecodesMatrix(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(`{"status":"success","data":{"result":[{"metric":{},"values":[[1700000000,"12.5"],[1700000010,"NaN"]]}]}}`))
	}))
	defer server.Close()
	client, err := NewVictoriaMetrics(Config{URL: server.URL})
	if err != nil {
		t.Fatal(err)
	}
	series, err := client.QueryRange(context.Background(), "sum(up)", time.Now().Add(-time.Minute), time.Now(), 10*time.Second)
	if err != nil {
		t.Fatal(err)
	}
	if len(series) != 1 || len(series[0].Values) != 1 || series[0].Values[0].Value != 12.5 {
		t.Fatalf("unexpected series: %#v", series)
	}
}

func TestCustomCAAndHealth(t *testing.T) {
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/health" {
			t.Fatalf("unexpected path %s", r.URL.Path)
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()
	certificate := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: server.Certificate().Raw})
	caFile := filepath.Join(t.TempDir(), "ca.crt")
	if err := os.WriteFile(caFile, certificate, 0o600); err != nil {
		t.Fatal(err)
	}
	client, err := NewVictoriaMetrics(Config{URL: server.URL, CAFile: caFile})
	if err != nil {
		t.Fatal(err)
	}
	if err := client.Health(context.Background()); err != nil {
		t.Fatal(err)
	}
}

func TestInvalidCAIsRejected(t *testing.T) {
	caFile := filepath.Join(t.TempDir(), "ca.crt")
	if err := os.WriteFile(caFile, []byte("not a certificate"), 0o600); err != nil {
		t.Fatal(err)
	}
	if _, err := NewVictoriaMetrics(Config{URL: "https://example.com", CAFile: caFile}); err == nil {
		t.Fatal("expected invalid CA error")
	}
}

func TestInsecureSkipVerify(t *testing.T) {
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()
	client, err := NewVictoriaMetrics(Config{URL: server.URL, InsecureSkipVerify: true})
	if err != nil {
		t.Fatal(err)
	}
	if err := client.Health(context.Background()); err != nil {
		t.Fatal(err)
	}
}

func TestRequestTimeoutIsUnavailable(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		time.Sleep(100 * time.Millisecond)
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()
	client, err := NewVictoriaMetrics(Config{URL: server.URL, Timeout: 10 * time.Millisecond})
	if err != nil {
		t.Fatal(err)
	}
	err = client.Health(context.Background())
	if !errors.Is(err, ErrUnavailable) {
		t.Fatalf("expected unavailable timeout, got %v", err)
	}
}

func TestDiscoveryAPIsDecodeResponses(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/v1/label/__name__/values":
			_, _ = w.Write([]byte(`{"status":"success","data":["up"]}`))
		case "/api/v1/series":
			_, _ = w.Write([]byte(`{"status":"success","data":[{"__name__":"up","job":"test"}]}`))
		case "/api/v1/metadata":
			_, _ = w.Write([]byte(`{"status":"success","data":{"up":[{"type":"gauge","help":"health"}]}}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()
	client, err := NewVictoriaMetrics(Config{URL: server.URL})
	if err != nil {
		t.Fatal(err)
	}
	now := time.Now()
	names, err := client.LabelValues(context.Background(), "__name__", `{job="test"}`, now.Add(-time.Minute), now)
	if err != nil || len(names) != 1 || names[0] != "up" {
		t.Fatalf("unexpected label values: %v, %v", names, err)
	}
	series, err := client.Series(context.Background(), `{job="test"}`, now.Add(-time.Minute), now)
	if err != nil || len(series) != 1 || series[0]["job"] != "test" {
		t.Fatalf("unexpected series: %v, %v", series, err)
	}
	metadata, err := client.Metadata(context.Background(), "up")
	if err != nil || len(metadata["up"]) != 1 || metadata["up"][0].Type != "gauge" {
		t.Fatalf("unexpected metadata: %v, %v", metadata, err)
	}
}
