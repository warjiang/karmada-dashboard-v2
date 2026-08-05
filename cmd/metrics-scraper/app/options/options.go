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

package options

import (
	"net"
	"time"

	"github.com/spf13/pflag"
)

// Options contains everything necessary to create and run api.
type Options struct {
	BindAddress                net.IP
	Port                       int
	InsecureBindAddress        net.IP
	InsecurePort               int
	KubeConfig                 string
	KubeContext                string
	SkipKubeApiserverTLSVerify bool
	Namespace                  string
	PrometheusURL              string
	PrometheusQueryTimeout     time.Duration
	PrometheusMaxQueryRange    time.Duration
	PrometheusBearerTokenFile  string
	PrometheusCAFile           string
	PrometheusCertFile         string
	PrometheusKeyFile          string
	PrometheusServerName       string
	PrometheusInsecureTLS      bool
	MetricsComponents          []string
	DisableCSRFProtection      bool
	OpenAPIEnabled             bool
}

// NewOptions returns initialized Options.
func NewOptions() *Options {
	return &Options{}
}

// AddFlags adds flags of api to the specified FlagSet
func (o *Options) AddFlags(fs *pflag.FlagSet) {
	if o == nil {
		return
	}
	fs.IPVar(&o.BindAddress, "bind-address", net.IPv4(127, 0, 0, 1), "IP address on which to serve the --port, set to 0.0.0.0 for all interfaces")
	fs.IntVar(&o.Port, "port", 8001, "secure port to listen to for incoming HTTPS requests")
	fs.IPVar(&o.InsecureBindAddress, "insecure-bind-address", net.IPv4(127, 0, 0, 1), "IP address on which to serve the --insecure-port, set to 0.0.0.0 for all interfaces")
	fs.IntVar(&o.InsecurePort, "insecure-port", 8000, "port to listen to for incoming HTTP requests")
	fs.StringVar(&o.KubeConfig, "kubeconfig", "", "Path to the host cluster kubeconfig file.")
	fs.StringVar(&o.KubeContext, "context", "", "The name of the kubeconfig context to use.")
	fs.BoolVar(&o.SkipKubeApiserverTLSVerify, "skip-kube-apiserver-tls-verify", false, "enable if connection with remote Kubernetes API server should skip TLS verify")
	fs.StringVar(&o.Namespace, "namespace", "karmada-dashboard", "Namespace to use when accessing Dashboard specific resources, i.e. configmap")
	fs.StringVar(&o.PrometheusURL, "prometheus-url", "http://karmada-dashboard-prometheus:9090", "Prometheus HTTP API endpoint")
	fs.DurationVar(&o.PrometheusQueryTimeout, "prometheus-query-timeout", 15*time.Second, "Timeout for Prometheus API requests")
	fs.DurationVar(&o.PrometheusMaxQueryRange, "prometheus-max-query-range", 7*24*time.Hour, "Maximum time range accepted by the metrics API")
	fs.StringVar(&o.PrometheusBearerTokenFile, "prometheus-bearer-token-file", "", "File containing a bearer token for the Prometheus API")
	fs.StringVar(&o.PrometheusCAFile, "prometheus-ca-file", "", "CA certificate used to verify the Prometheus API")
	fs.StringVar(&o.PrometheusCertFile, "prometheus-client-cert-file", "", "Client certificate for the Prometheus API")
	fs.StringVar(&o.PrometheusKeyFile, "prometheus-client-key-file", "", "Client key for the Prometheus API")
	fs.StringVar(&o.PrometheusServerName, "prometheus-server-name", "", "TLS server name for the Prometheus API")
	fs.BoolVar(&o.PrometheusInsecureTLS, "prometheus-insecure-tls", false, "Skip verification of the Prometheus API certificate")
	fs.StringSliceVar(&o.MetricsComponents, "metrics-components", []string{
		"karmada-scheduler",
		"karmada-controller-manager",
		"karmada-scheduler-estimator",
		"karmada-aggregated-apiserver",
		"karmada-apiserver",
		"karmada-descheduler",
		"karmada-kube-controller-manager",
		"karmada-metrics-adapter",
		"karmada-search",
		"karmada-webhook",
	}, "Enabled component names, matching the karmada_component Prometheus label")
	fs.BoolVar(&o.DisableCSRFProtection, "disable-csrf-protection", false, "allows disabling CSRF protection")
	fs.BoolVar(&o.OpenAPIEnabled, "openapi-enabled", false, "enables OpenAPI v2 endpoint under '/apidocs.json'")
}
