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

package app

import (
	"context"
	"fmt"
	"time"

	"github.com/karmada-io/karmada/pkg/sharedcli/klogflag"
	"github.com/spf13/cobra"
	cliflag "k8s.io/component-base/cli/flag"
	"k8s.io/klog/v2"

	"github.com/karmada-io/dashboard/cmd/metrics-scraper/app/options"
	promapi "github.com/karmada-io/dashboard/cmd/metrics-scraper/app/prometheus"
	"github.com/karmada-io/dashboard/cmd/metrics-scraper/app/router"
	"github.com/karmada-io/dashboard/cmd/metrics-scraper/app/routes/metrics"
	"github.com/karmada-io/dashboard/pkg/client"
	"github.com/karmada-io/dashboard/pkg/config"
	"github.com/karmada-io/dashboard/pkg/environment"
)

// NewMetricsScraperCommand creates a *cobra.Command object with default parameters
func NewMetricsScraperCommand(ctx context.Context) *cobra.Command {
	opts := options.NewOptions()
	cmd := &cobra.Command{
		Use:  "karmada-dashboard-metrics-scraper",
		Long: `The karmada-dashboard-metrics-scraper serves a stateless, Prometheus-backed metrics query API.`,
		RunE: func(_ *cobra.Command, _ []string) error {
			if err := run(ctx, opts); err != nil {
				return err
			}
			return nil
		},
		Args: func(cmd *cobra.Command, args []string) error {
			for _, arg := range args {
				if len(arg) > 0 {
					return fmt.Errorf("%q does not take any arguments, got %q", cmd.CommandPath(), args)
				}
			}
			return nil
		},
	}
	fss := cliflag.NamedFlagSets{}

	genericFlagSet := fss.FlagSet("generic")
	opts.AddFlags(genericFlagSet)

	// Set klog flags
	logsFlagSet := fss.FlagSet("logs")
	klogflag.Add(logsFlagSet)

	cmd.Flags().AddFlagSet(genericFlagSet)
	cmd.Flags().AddFlagSet(logsFlagSet)
	cmd.AddCommand(newPreparePrometheusConfigCommand())
	return cmd
}

func run(ctx context.Context, opts *options.Options) error {
	klog.InfoS("Starting Karmada Dashboard metrics API", "version", environment.Version)
	config.SetNamespace(opts.Namespace)

	client.InitKubeConfig(
		client.WithUserAgent(environment.UserAgent()),
		client.WithKubeconfig(opts.KubeConfig),
		client.WithKubeContext(opts.KubeContext),
		client.WithInsecureTLSSkipVerify(opts.SkipKubeApiserverTLSVerify),
	)
	prometheusClient, err := promapi.NewClient(promapi.Config{
		Address:         opts.PrometheusURL,
		Timeout:         opts.PrometheusQueryTimeout,
		BearerTokenFile: opts.PrometheusBearerTokenFile,
		CAFile:          opts.PrometheusCAFile,
		CertFile:        opts.PrometheusCertFile,
		KeyFile:         opts.PrometheusKeyFile,
		ServerName:      opts.PrometheusServerName,
		InsecureTLS:     opts.PrometheusInsecureTLS,
	})
	if err != nil {
		return fmt.Errorf("initialize Prometheus client: %w", err)
	}
	metrics.Configure(prometheusClient, opts.MetricsComponents, opts.PrometheusQueryTimeout, opts.PrometheusMaxQueryRange)
	router.SetReadinessCheck(func(checkCtx context.Context) error {
		_, _, checkErr := prometheusClient.Query(checkCtx, "vector(1)", time.Now())
		return checkErr
	})
	serve(opts)

	config.InitDashboardConfig(client.InClusterClient(), ctx.Done())
	<-ctx.Done()
	return nil
}

func serve(opts *options.Options) {
	insecureAddress := fmt.Sprintf("%s:%d", opts.InsecureBindAddress, opts.InsecurePort)
	klog.V(1).InfoS("Listening and serving on", "address", insecureAddress)
	go func() {
		klog.Fatal(router.Router().Run(insecureAddress))
	}()
}

func init() {
	r := router.V2().Group("/metrics")
	r.GET("/components", metrics.GetComponents)
	r.GET("/catalog", metrics.GetCatalog)
	r.GET("/label-values", metrics.GetLabelValues)
	r.POST("/query-range", metrics.QueryRange)
	r.GET("/dashboards", metrics.GetDashboardConfig)
	r.PUT("/dashboards", metrics.SaveDashboardConfig)
}

func newPreparePrometheusConfigCommand() *cobra.Command {
	var kubeconfigPath, contextName, templatePath, outputPath, credentialsDir string
	cmd := &cobra.Command{
		Use:   "prepare-prometheus-config",
		Short: "Render Prometheus scrape configuration from a Karmada kubeconfig",
		RunE: func(_ *cobra.Command, _ []string) error {
			return promapi.PrepareConfig(kubeconfigPath, contextName, templatePath, outputPath, credentialsDir)
		},
	}
	cmd.Flags().StringVar(&kubeconfigPath, "kubeconfig", "", "Karmada kubeconfig path")
	cmd.Flags().StringVar(&contextName, "context", "", "Karmada kubeconfig context")
	cmd.Flags().StringVar(&templatePath, "template", "", "Prometheus configuration template")
	cmd.Flags().StringVar(&outputPath, "output", "", "Rendered Prometheus configuration path")
	cmd.Flags().StringVar(&credentialsDir, "credentials-dir", "", "Directory for normalized credentials")
	_ = cmd.MarkFlagRequired("kubeconfig")
	_ = cmd.MarkFlagRequired("template")
	_ = cmd.MarkFlagRequired("output")
	_ = cmd.MarkFlagRequired("credentials-dir")
	return cmd
}
