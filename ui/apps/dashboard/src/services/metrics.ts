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

import axios from 'axios';
import _ from 'lodash';

let pathPrefix = window.__path_prefix__ || '';
if (!pathPrefix.startsWith('/')) pathPrefix = '/' + pathPrefix;
if (!pathPrefix.endsWith('/')) pathPrefix += '/';

const metricsBaseURL: string = _.join(
  [pathPrefix, 'metrics-scraper/api/v2/metrics'],
  '',
);

export const metricsScraperClient = axios.create({ baseURL: metricsBaseURL });

export const KARMADA_COMPONENTS = [
  { key: 'karmada-scheduler', label: 'Scheduler' },
  { key: 'karmada-controller-manager', label: 'Controller Manager' },
  { key: 'karmada-scheduler-estimator', label: 'Scheduler Estimator' },
  { key: 'karmada-aggregated-apiserver', label: 'Aggregated APIServer' },
  { key: 'karmada-apiserver', label: 'APIServer' },
  { key: 'karmada-descheduler', label: 'Descheduler' },
  { key: 'karmada-kube-controller-manager', label: 'Kube Controller Manager' },
  { key: 'karmada-metrics-adapter', label: 'Metrics Adapter' },
  { key: 'karmada-search', label: 'Search' },
  { key: 'karmada-webhook', label: 'Webhook' },
] as const;

export type KarmadaComponentKey = (typeof KARMADA_COMPONENTS)[number]['key'];

export interface VisualizationPoint {
  timestamp: string;
  value: number;
}

export interface MetricInfo {
  name: string;
  type: string;
  suggestedChart: 'line' | 'area' | 'bar' | 'gauge';
}

export interface MetricCatalogItem {
  name: string;
  help: string;
  prometheusType: 'gauge' | 'counter' | 'histogram' | 'summary' | 'untyped';
  suggestedChart: 'line' | 'area' | 'bar' | 'gauge';
  group: string;
  labels?: string[];
  defaultTransform?: QueryTransform;
}

export interface MetricsComponentStatus {
  name: string;
  enabled: boolean;
  healthyTargets: number;
  totalTargets: number;
  pods: string[];
  lastScrape?: string;
}

interface ComponentsResponse {
  items: MetricsComponentStatus[];
  warnings?: string[];
}

interface CatalogResponse {
  items: Array<{
    name: string;
    type: MetricCatalogItem['prometheusType'];
    help: string;
    labels?: string[];
    defaultTransform?: QueryTransform;
    suggestedChart: MetricCatalogItem['suggestedChart'];
    group: string;
  }>;
  warnings?: string[];
}

export type QueryTransform =
  | 'auto'
  | 'raw'
  | 'rate'
  | 'increase'
  | 'histogram_avg'
  | 'histogram_quantile';

export type QueryAggregation = 'none' | 'sum' | 'avg' | 'min' | 'max';

export interface LabelFilter {
  key: string;
  value: string;
}

interface QueryRangeSeries {
  labels: Record<string, string>;
  points: VisualizationPoint[];
}

interface QueryRangeResponse {
  query: {
    stepSeconds: number;
  };
  series: QueryRangeSeries[];
  warnings?: string[];
}

export async function GetMetricsComponents(): Promise<MetricsComponentStatus[]> {
  const response = await metricsScraperClient.get<ComponentsResponse>('/components');
  return response.data.items ?? [];
}

export async function GetMetricsCatalog(
  component: string,
): Promise<MetricCatalogItem[]> {
  const response = await metricsScraperClient.get<CatalogResponse>('/catalog', {
    params: { component },
  });
  return (response.data.items ?? []).map((item) => ({
    name: item.name,
    help: item.help,
    prometheusType: item.type,
    suggestedChart: item.suggestedChart,
    group: item.group,
    labels: item.labels ?? [],
    defaultTransform: item.defaultTransform ?? 'auto',
  }));
}

async function queryRange(input: {
  component: string;
  metric: string;
  window?: string;
  aggregation?: QueryAggregation;
  transform?: QueryTransform;
  filters?: Array<{ label: string; operator: string; value: string }>;
  groupBy?: string[];
  quantile?: number;
}): Promise<QueryRangeResponse> {
  const response = await metricsScraperClient.post<QueryRangeResponse>(
    '/query-range',
    input,
  );
  return response.data;
}

async function getAvailableLabels(
  component: string,
  metric: string,
): Promise<Record<string, string[]>> {
  const response = await metricsScraperClient.get<{
    values: Record<string, string[]>;
  }>('/label-values', { params: { component, metric } });
  return response.data.values ?? {};
}

export interface SchedulerVisualizationMeta {
  appName: string;
  window: string;
  podMode: string;
  sampleIntervalSec: number;
  generatedAt: string;
}

export interface SchedulerVisualizationResponse {
  meta: SchedulerVisualizationMeta;
  timeseries: Record<string, VisualizationPoint[]>;
  pods: string[];
  warnings?: string[];
  availableMetrics?: MetricInfo[];
  metricsCatalog?: MetricCatalogItem[];
}

function mergeSeries(series: QueryRangeSeries[]): VisualizationPoint[] {
  if (series.length === 1) return series[0].points;
  const values = new Map<string, number>();
  series.forEach((item) =>
    item.points.forEach((point) =>
      values.set(point.timestamp, (values.get(point.timestamp) ?? 0) + point.value),
    ),
  );
  return Array.from(values.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([timestamp, value]) => ({ timestamp, value }));
}

export async function GetSchedulerVisualization(
  appName: string,
  params?: {
    window?: string;
    pod?: string;
    metrics?: string[];
    panels?: MetricsDashboardPanel[];
  },
): Promise<SchedulerVisualizationResponse> {
  const [catalog, components] = await Promise.all([
    GetMetricsCatalog(appName),
    GetMetricsComponents(),
  ]);
  const component = components.find((item) => item.name === appName);
  const metricNames = params?.metrics ?? [];
  const panelByMetric = new Map(
    (params?.panels ?? [])
      .filter((panel) => panel.visible)
      .map((panel) => [panel.metricName, panel]),
  );
  const results = await Promise.all(
    metricNames.map(async (metric) => {
      const panelQuery = panelByMetric.get(metric)?.query;
      const filters = (panelQuery?.labelFilters ?? []).map((item) => ({
        label: item.key,
        operator: '=',
        value: item.value,
      }));
      if (params?.pod && params.pod !== 'all') {
        filters.push({ label: 'karmada_pod', operator: '=', value: params.pod });
      }
      const legacyRate = panelQuery?.aggregation === 'rate';
      const result = await queryRange({
        component: appName,
        metric: panelQuery?.metric || metric,
        window: params?.window ?? '15m',
        aggregation: legacyRate
          ? 'sum'
          : ((panelQuery?.aggregation as QueryAggregation) ?? 'sum'),
        transform: legacyRate ? 'rate' : (panelQuery?.transform ?? 'auto'),
        filters: filters.length > 0 ? filters : undefined,
      });
      return { metric, result };
    }),
  );
  const timeseries: Record<string, VisualizationPoint[]> = {};
  const warnings: string[] = [];
  results.forEach(({ metric, result }) => {
    timeseries[metric] = mergeSeries(result.series ?? []);
    warnings.push(...(result.warnings ?? []));
  });
  return {
    meta: {
      appName,
      window: params?.window ?? '15m',
      podMode: params?.pod ?? 'all',
      sampleIntervalSec: results[0]?.result.query.stepSeconds ?? 15,
      generatedAt: new Date().toISOString(),
    },
    timeseries,
    pods: component?.pods ?? [],
    warnings,
    availableMetrics: catalog.map((item) => ({
      name: item.name,
      type: item.prometheusType,
      suggestedChart: item.suggestedChart,
    })),
    metricsCatalog: catalog,
  };
}

export interface ComponentPodsResponse {
  appName: string;
  pods: string[];
  warnings?: string[];
}

export async function GetComponentPods(
  appName: string,
): Promise<ComponentPodsResponse> {
  const components = await GetMetricsComponents();
  return {
    appName,
    pods: components.find((item) => item.name === appName)?.pods ?? [],
  };
}

export interface ExploreResponse {
  meta: {
    metric: string;
    aggregation: string;
    labels: LabelFilter[];
    window: string;
    podMode: string;
    generatedAt: string;
  };
  timeseries: VisualizationPoint[];
  availableLabels: Record<string, string[]>;
}

export async function ExploreMetric(
  appName: string,
  params: {
    metric: string;
    aggregation?: string;
    labels?: LabelFilter[];
    window?: string;
    pod?: string;
  },
): Promise<ExploreResponse> {
  const filters = (params.labels ?? []).map((item) => ({
    label: item.key,
    operator: '=',
    value: item.value,
  }));
  if (params.pod && params.pod !== 'all') {
    filters.push({ label: 'karmada_pod', operator: '=', value: params.pod });
  }
  const rate = params.aggregation === 'rate';
  const [result, availableLabels] = await Promise.all([
    queryRange({
      component: appName,
      metric: params.metric,
      window: params.window ?? '15m',
      aggregation: rate
        ? 'sum'
        : ((params.aggregation as QueryAggregation) ?? 'sum'),
      transform: rate ? 'rate' : 'auto',
      filters,
    }),
    getAvailableLabels(appName, params.metric),
  ]);
  return {
    meta: {
      metric: params.metric,
      aggregation: params.aggregation ?? 'sum',
      labels: params.labels ?? [],
      window: params.window ?? '15m',
      podMode: params.pod ?? 'all',
      generatedAt: new Date().toISOString(),
    },
    timeseries: mergeSeries(result.series ?? []),
    availableLabels,
  };
}

export interface MetricsDashboardPanel {
  id: string;
  metricName: string;
  chartType: 'line' | 'area' | 'bar' | 'gauge';
  title: string;
  visible: boolean;
  query?: {
    metric: string;
    aggregation: string;
    transform?: QueryTransform;
    labelFilters?: LabelFilter[];
  };
  order?: number;
}

export interface MetricsDashboard {
  version: number;
  component: string;
  panels: MetricsDashboardPanel[];
}

interface MetricsDashboardConfigResponse {
  dashboards: MetricsDashboard[];
}

function migrateDashboard(dashboard: MetricsDashboard): MetricsDashboard {
  return {
    ...dashboard,
    version: 2,
    panels: dashboard.panels.map((panel) => ({
      ...panel,
      query: panel.query
        ? {
            ...panel.query,
            transform:
              panel.query.aggregation === 'rate'
                ? 'rate'
                : (panel.query.transform ?? 'auto'),
            aggregation:
              panel.query.aggregation === 'rate'
                ? 'sum'
                : panel.query.aggregation,
          }
        : undefined,
    })),
  };
}

export async function GetMetricsDashboards(): Promise<MetricsDashboard[]> {
  const response =
    await metricsScraperClient.get<MetricsDashboardConfigResponse>('/dashboards');
  return (response.data.dashboards ?? []).map(migrateDashboard);
}

export async function SaveMetricsDashboard(
  dashboard: MetricsDashboard,
): Promise<MetricsDashboard[]> {
  const response = await metricsScraperClient.put<MetricsDashboardConfigResponse>(
    '/dashboards',
    { dashboard: migrateDashboard(dashboard) },
  );
  return (response.data.dashboards ?? []).map(migrateDashboard);
}
