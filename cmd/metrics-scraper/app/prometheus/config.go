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
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"k8s.io/client-go/tools/clientcmd"
)

const (
	authMarker = "__KARMADA_AUTH__"
	tlsMarker  = "__KARMADA_TLS__"
)

// PrepareConfig resolves credentials from a kubeconfig and renders Prometheus configuration.
func PrepareConfig(kubeconfigPath, contextName, templatePath, outputPath, credentialsDir string) error {
	if kubeconfigPath == "" || templatePath == "" || outputPath == "" || credentialsDir == "" {
		return fmt.Errorf("kubeconfig, template, output and credentials directory are required")
	}
	rules := &clientcmd.ClientConfigLoadingRules{ExplicitPath: kubeconfigPath}
	overrides := &clientcmd.ConfigOverrides{CurrentContext: contextName}
	config, err := clientcmd.NewNonInteractiveDeferredLoadingClientConfig(rules, overrides).ClientConfig()
	if err != nil {
		return fmt.Errorf("load Karmada kubeconfig: %w", err)
	}
	if err := os.MkdirAll(credentialsDir, 0o700); err != nil {
		return fmt.Errorf("create credentials directory: %w", err)
	}

	caData, err := dataOrFile(config.TLSClientConfig.CAData, config.TLSClientConfig.CAFile)
	if err != nil {
		return fmt.Errorf("read Karmada CA: %w", err)
	}
	if len(caData) == 0 && !config.TLSClientConfig.Insecure {
		return fmt.Errorf("Karmada kubeconfig has no CA data")
	}
	caPath := filepath.Join(credentialsDir, "ca.crt")
	if len(caData) > 0 {
		if err := os.WriteFile(caPath, caData, 0o640); err != nil {
			return fmt.Errorf("write Karmada CA: %w", err)
		}
	}

	authFragment := ""
	tlsLines := []string{}
	if len(caData) > 0 {
		tlsLines = append(tlsLines, "ca_file: "+caPath)
	}
	certData, certErr := dataOrFile(config.TLSClientConfig.CertData, config.TLSClientConfig.CertFile)
	if certErr != nil {
		return fmt.Errorf("read Karmada client certificate: %w", certErr)
	}
	keyData, keyErr := dataOrFile(config.TLSClientConfig.KeyData, config.TLSClientConfig.KeyFile)
	if keyErr != nil {
		return fmt.Errorf("read Karmada client key: %w", keyErr)
	}
	if len(certData) > 0 || len(keyData) > 0 {
		if len(certData) == 0 || len(keyData) == 0 {
			return fmt.Errorf("Karmada kubeconfig must contain both client certificate and key")
		}
		certPath := filepath.Join(credentialsDir, "client.crt")
		keyPath := filepath.Join(credentialsDir, "client.key")
		if err := os.WriteFile(certPath, certData, 0o640); err != nil {
			return fmt.Errorf("write Karmada client certificate: %w", err)
		}
		if err := os.WriteFile(keyPath, keyData, 0o640); err != nil {
			return fmt.Errorf("write Karmada client key: %w", err)
		}
		tlsLines = append(tlsLines, "cert_file: "+certPath, "key_file: "+keyPath)
	} else if strings.TrimSpace(config.BearerToken) != "" {
		tokenPath := filepath.Join(credentialsDir, "token")
		if err := os.WriteFile(tokenPath, []byte(strings.TrimSpace(config.BearerToken)), 0o640); err != nil {
			return fmt.Errorf("write Karmada bearer token: %w", err)
		}
		authFragment = "authorization:\n  credentials_file: " + tokenPath
	} else {
		return fmt.Errorf("Karmada kubeconfig has neither client certificate nor bearer token")
	}

	templateData, err := os.ReadFile(templatePath)
	if err != nil {
		return fmt.Errorf("read Prometheus config template: %w", err)
	}
	rendered, err := replaceIndentedMarker(string(templateData), authMarker, authFragment)
	if err != nil {
		return err
	}
	rendered, err = replaceIndentedMarker(rendered, tlsMarker, strings.Join(tlsLines, "\n"))
	if err != nil {
		return err
	}
	if err := os.WriteFile(outputPath, []byte(rendered), 0o640); err != nil {
		return fmt.Errorf("write Prometheus config: %w", err)
	}
	return nil
}

func dataOrFile(data []byte, filename string) ([]byte, error) {
	if len(data) > 0 {
		return data, nil
	}
	if filename == "" {
		return nil, nil
	}
	return os.ReadFile(filename)
}

func replaceIndentedMarker(input, marker, fragment string) (string, error) {
	lines := strings.Split(input, "\n")
	output := make([]string, 0, len(lines))
	for _, line := range lines {
		index := strings.Index(line, marker)
		if index < 0 {
			output = append(output, line)
			continue
		}
		prefix := line[:index]
		if strings.TrimSpace(fragment) == "" {
			continue
		}
		for _, fragmentLine := range strings.Split(fragment, "\n") {
			output = append(output, prefix+fragmentLine)
		}
	}
	// A marker can be absent when all HTTPS components are disabled.
	return strings.Join(output, "\n"), nil
}
