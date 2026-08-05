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
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestPrepareConfig(t *testing.T) {
	tests := []struct {
		name           string
		userConfig     string
		expected       []string
		notExpected    []string
		expectedSecret string
	}{
		{
			name:           "bearer token",
			userConfig:     "      token: test-token\n",
			expected:       []string{"authorization:", "credentials_file:", "ca_file:"},
			notExpected:    []string{"cert_file:", "key_file:"},
			expectedSecret: "token",
		},
		{
			name: "client certificate",
			userConfig: fmt.Sprintf(
				"      client-certificate-data: %s\n      client-key-data: %s\n",
				base64.StdEncoding.EncodeToString([]byte("certificate")),
				base64.StdEncoding.EncodeToString([]byte("private-key")),
			),
			expected:       []string{"ca_file:", "cert_file:", "key_file:"},
			notExpected:    []string{"authorization:", "credentials_file:"},
			expectedSecret: "client.key",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dir := t.TempDir()
			kubeconfigPath := filepath.Join(dir, "kubeconfig")
			templatePath := filepath.Join(dir, "prometheus.yml.tmpl")
			outputPath := filepath.Join(dir, "prometheus.yml")
			credentialsDir := filepath.Join(dir, "credentials")
			kubeconfig := fmt.Sprintf(`apiVersion: v1
kind: Config
clusters:
  - name: karmada
    cluster:
      server: https://karmada.example.test
      certificate-authority-data: %s
users:
  - name: dashboard
    user:
%scontexts:
  - name: karmada-apiserver
    context:
      cluster: karmada
      user: dashboard
current-context: karmada-apiserver
`, base64.StdEncoding.EncodeToString([]byte("ca-certificate")), tt.userConfig)
			template := `global:
  scrape_interval: 15s
scrape_configs:
  - job_name: secure-target
    __KARMADA_AUTH__
    tls_config:
      __KARMADA_TLS__
`
			if err := os.WriteFile(kubeconfigPath, []byte(kubeconfig), 0o600); err != nil {
				t.Fatal(err)
			}
			if err := os.WriteFile(templatePath, []byte(template), 0o600); err != nil {
				t.Fatal(err)
			}
			if err := PrepareConfig(kubeconfigPath, "karmada-apiserver", templatePath, outputPath, credentialsDir); err != nil {
				t.Fatalf("PrepareConfig() error = %v", err)
			}
			rendered, err := os.ReadFile(outputPath)
			if err != nil {
				t.Fatal(err)
			}
			text := string(rendered)
			if strings.Contains(text, authMarker) || strings.Contains(text, tlsMarker) {
				t.Fatalf("rendered config still contains a marker:\n%s", text)
			}
			for _, expected := range tt.expected {
				if !strings.Contains(text, expected) {
					t.Errorf("rendered config does not contain %q:\n%s", expected, text)
				}
			}
			for _, unexpected := range tt.notExpected {
				if strings.Contains(text, unexpected) {
					t.Errorf("rendered config unexpectedly contains %q:\n%s", unexpected, text)
				}
			}
			for _, filename := range []string{outputPath, filepath.Join(credentialsDir, tt.expectedSecret)} {
				info, statErr := os.Stat(filename)
				if statErr != nil {
					t.Fatal(statErr)
				}
				if got := info.Mode().Perm(); got != 0o640 {
					t.Errorf("%s mode = %o, want 640", filename, got)
				}
			}
		})
	}
}
