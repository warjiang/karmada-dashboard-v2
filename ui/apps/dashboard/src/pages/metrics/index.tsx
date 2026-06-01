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

import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Alert,
  Button,
  Card,
  Empty,
  Popconfirm,
  Select,
  Space,
  Typography,
  theme,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

import Panel from '@/components/panel';
import { Icons } from '@/components/icons';
import {
  GetSchedulerVisualization,
  KARMADA_COMPONENTS,
  KarmadaComponentKey,
  MetricCatalogItem,
  SchedulerVisualizationResponse,
} from '@/services/metrics';

import { DashboardToolbar, DragPanel, LazyChart, MetricExplorer, PanelEditor } from './components';
import {
  addPanel,
  buildDefaultConfig,
  getConfiguredMetricNames,
  loadDashboardConfig,
  removePanel,
  reorderPanels,
  resetDashboardConfig,
  saveDashboardConfig,
  updatePanel,
  type DashboardConfig,
  type PanelConfig,
} from './dashboard-config';

const { Title, Text } = Typography;

const defaultWindow = '15m';

type ChartType = 'line' | 'area' | 'bar' | 'gauge';

type SeriesKey = string;

interface ChartPointRow {
  timestamp: string;
  [key: string]: string | number | undefined;
}

interface ChartConfig {
  key: SeriesKey;
  title: string;
  color: string;
  chart: ChartType;
  panelId?: string;
  valueFormatter?: (value: number) => string;
  axisFormatter?: (value: number) => string;
}

interface ChartGroup {
  key: string;
  title: string;
  description?: string;
  charts: ChartConfig[];
}

interface MetricTypeGroup {
  type: string;
  typeLabel: string;
  prefixGroups: ChartGroup[];
}

const CHART_COLORS = [
  '#246bff', '#0f9b8e', '#d97706', '#6d4aff', '#d63a8a',
  '#1f9d62', '#d94848', '#8b5cf6', '#06b6d4', '#f59e0b',
  '#ec4899', '#14b8a6', '#f97316',
];

const typeLabels: Record<string, string> = {
  gauge: '📊 Gauge Metrics',
  counter: '📈 Counter Metrics (Rate)',
  histogram: '🏔️ Histogram Metrics (Average)',
  summary: '📉 Summary Metrics (Quantiles)',
};


function formatNumber(value: number, fractionDigits = 3) {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString(undefined, { maximumFractionDigits: fractionDigits });
}

function formatOps(value: number) {
  if (!Number.isFinite(value)) return '0 ops/s';
  return `${formatNumber(value)} ops/s`;
}

function shortOps(value: number) {
  if (!Number.isFinite(value)) return '0';
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return formatNumber(value, 1);
}

function getAutoFormatter(metricName: string): {
  valueFormatter?: (v: number) => string;
  axisFormatter?: (v: number) => string;
} {
  if (metricName.includes('_bytes')) return { valueFormatter: formatBytes, axisFormatter: shortBytes };
  if (metricName.includes('_seconds') || metricName.includes('_duration')) {
    return { valueFormatter: formatSeconds, axisFormatter: shortSeconds };
  }
  if (metricName.endsWith('_total') || metricName.includes('Rate')) {
    return { valueFormatter: formatOps, axisFormatter: shortOps };
  }
  return {};
}

function metricNameToTitle(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

function shortBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0';
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)}G`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)}M`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}K`;
  return formatNumber(bytes, 0);
}

function formatSeconds(value: number) {
  if (!Number.isFinite(value)) return '0 s';
  if (value < 0.001) return `${(value * 1000).toFixed(2)} ms`;
  if (value < 1) return `${(value * 1000).toFixed(1)} ms`;
  return `${value.toFixed(3)} s`;
}

function shortSeconds(value: number) {
  if (!Number.isFinite(value)) return '0';
  if (value < 0.001) return `${(value * 1000).toFixed(1)}ms`;
  if (value < 1) return `${(value * 1000).toFixed(0)}ms`;
  return `${value.toFixed(2)}s`;
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function mapVisualizationRows(data?: SchedulerVisualizationResponse): ChartPointRow[] {
  if (!data?.timeseries) return [];

  const rowMap = new Map<string, ChartPointRow>();

  Object.entries(data.timeseries).forEach(([seriesName, points]) => {
    if (!Array.isArray(points) || points.length === 0) return;

    points.forEach((point) => {
      const row = rowMap.get(point.timestamp) ?? { timestamp: point.timestamp };
      row[seriesName] = point.value;
      rowMap.set(point.timestamp, row);
    });
  });

  return Array.from(rowMap.values()).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function getLatestSeriesValue(rows: ChartPointRow[], key: SeriesKey) {
  for (let i = rows.length - 1; i >= 0; i--) {
    const value = rows[i][key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

function getSeriesBounds(rows: ChartPointRow[], key: SeriesKey) {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  rows.forEach((row) => {
    const value = row[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  });

  if (min === Number.POSITIVE_INFINITY || max === Number.NEGATIVE_INFINITY) {
    return undefined;
  }
  return { min, max };
}

function buildChartConfigFromCatalog(item: MetricCatalogItem, index: number): ChartConfig {
  const formatters = getAutoFormatter(item.name);
  return {
    key: item.name,
    title: metricNameToTitle(item.name),
    color: CHART_COLORS[index % CHART_COLORS.length],
    chart: item.suggestedChart,
    valueFormatter: formatters.valueFormatter,
    axisFormatter: formatters.axisFormatter,
  };
}

const MetricsPage = () => {
  const queryClient = useQueryClient();
  const { token } = theme.useToken();
  const [activeComponent, setActiveComponent] = useState<KarmadaComponentKey>(KARMADA_COMPONENTS[0].key);
  const [visualizationPod, setVisualizationPod] = useState<string>('all');
  const [hasInitializedPodSelection, setHasInitializedPodSelection] = useState<boolean>(false);
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window === 'undefined' ? 1280 : window.innerWidth,
  );
  const [editMode, setEditMode] = useState(false);
  // "committedConfig" drives API queries; "draftConfig" is used during editing
  const [committedConfig, setCommittedConfig] = useState<DashboardConfig | null>(null);
  const [draftConfig, setDraftConfig] = useState<DashboardConfig | null>(null);
  const [panelEditorOpen, setPanelEditorOpen] = useState(false);
  const [editingPanel, setEditingPanel] = useState<PanelConfig | null>(null);
  const [explorerOpen, setExplorerOpen] = useState(false);

  // The active config for rendering panels (draft in edit mode, committed otherwise)
  const dashboardConfig = editMode ? draftConfig : committedConfig;

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const config = loadDashboardConfig(activeComponent);
    setCommittedConfig(config);
    setDraftConfig(config);
    setEditMode(false);
    setPanelEditorOpen(false);
    setEditingPanel(null);
  }, [activeComponent]);

  // API queries are driven ONLY by committedConfig (not draft)
  const configuredMetrics = useMemo(
    () => (committedConfig ? getConfiguredMetricNames(committedConfig) : undefined),
    [committedConfig],
  );
  const configuredMetricsKey = configuredMetrics?.join(',') ?? 'default';

  const {
    data: visualizationData,
    isLoading: visualizationLoading,
    error: visualizationError,
  } = useQuery({
    queryKey: ['componentVisualization', activeComponent, visualizationPod, defaultWindow, configuredMetricsKey],
    queryFn: () =>
      GetSchedulerVisualization(activeComponent, {
        window: defaultWindow,
        pod: visualizationPod,
        refresh: false,
        metrics: configuredMetrics,
      }),
    enabled: !!activeComponent,
    refetchInterval: 10_000,
  });

  const { data: podScopeData } = useQuery({
    queryKey: ['componentPodScope', activeComponent, defaultWindow],
    queryFn: () =>
      GetSchedulerVisualization(activeComponent, {
        window: defaultWindow,
        pod: 'all',
        refresh: false,
      }),
    enabled: !!activeComponent,
    refetchInterval: 10_000,
  });

  const refreshVisualizationMutation = useMutation({
    mutationFn: () =>
      GetSchedulerVisualization(activeComponent, {
        window: defaultWindow,
        pod: visualizationPod,
        refresh: true,
        metrics: configuredMetrics,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['componentVisualization', activeComponent, visualizationPod, defaultWindow],
      });
    },
  });

  const visualizationRows = useMemo(
    () => mapVisualizationRows(visualizationData),
    [visualizationData],
  );

  const visualizationPods = useMemo(
    () => podScopeData?.pods ?? visualizationData?.pods ?? [],
    [podScopeData, visualizationData],
  );

  useEffect(() => {
    if (hasInitializedPodSelection || visualizationPods.length === 0) return;
    setVisualizationPod(visualizationPods[0]);
    setHasInitializedPodSelection(true);
  }, [hasInitializedPodSelection, visualizationPods]);

  useEffect(() => {
    if (visualizationPod === 'all' || visualizationPods.length === 0) return;
    if (!visualizationPods.includes(visualizationPod)) {
      setVisualizationPod(visualizationPods[0]);
    }
  }, [visualizationPod, visualizationPods]);

  const seriesKeysWithData = useMemo(() => {
    if (!visualizationData?.timeseries) return [] as SeriesKey[];
    return Object.keys(visualizationData.timeseries).filter(
      (key) => (visualizationData.timeseries[key] ?? []).length > 0,
    );
  }, [visualizationData]);

  const handleAddPanel = (panel: PanelConfig) => {
    const catalog = visualizationData?.metricsCatalog ?? [];
    const config = draftConfig ?? buildDefaultConfig(activeComponent, catalog);
    const updated = addPanel(config, panel);
    setDraftConfig(updated);
    if (!editMode) {
      setCommittedConfig(updated);
    }
  };

  const handleUpdatePanel = (panel: PanelConfig) => {
    if (!draftConfig) return;
    const updated = updatePanel(draftConfig, panel.id, panel);
    setDraftConfig(updated);
    if (!editMode) {
      setCommittedConfig(updated);
    }
  };

  const handleDeletePanel = (panelId: string) => {
    if (!draftConfig) return;
    const updated = removePanel(draftConfig, panelId);
    setDraftConfig(updated);
    if (!editMode) {
      setCommittedConfig(updated);
    }
  };

  const handleResetConfig = () => {
    resetDashboardConfig(activeComponent);
    setCommittedConfig(null);
    setDraftConfig(null);
    setEditMode(false);
  };

  const handleSavePanel = (panel: PanelConfig) => {
    if (editingPanel) {
      handleUpdatePanel(panel);
    } else {
      handleAddPanel(panel);
    }
    setEditingPanel(null);
  };

  const handleEnterEditMode = useCallback(() => {
    if (!draftConfig && visualizationData?.metricsCatalog?.length) {
      const config = buildDefaultConfig(activeComponent, visualizationData.metricsCatalog);
      saveDashboardConfig(config);
      setDraftConfig(config);
      setCommittedConfig(config);
    }
    setEditMode(true);
  }, [draftConfig, visualizationData, activeComponent]);

  const handleExitEditMode = useCallback(() => {
    // Commit draft to storage and update committed state
    if (draftConfig) {
      saveDashboardConfig(draftConfig);
      setCommittedConfig(draftConfig);
    }
    setEditMode(false);
  }, [draftConfig]);

  const handleExplorerAddPanel = useCallback((panel: PanelConfig) => {
    const catalog = visualizationData?.metricsCatalog ?? [];
    const config = draftConfig ?? committedConfig ?? buildDefaultConfig(activeComponent, catalog);
    const updated = addPanel(config, panel);
    saveDashboardConfig(updated);
    setDraftConfig(updated);
    setCommittedConfig(updated);
  }, [draftConfig, committedConfig, activeComponent, visualizationData]);

  // DnD sensors with activation constraint to prevent accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !draftConfig) return;

    const oldIndex = draftConfig.panels.findIndex((p) => p.id === active.id);
    const newIndex = draftConfig.panels.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newPanels = [...draftConfig.panels];
    const [moved] = newPanels.splice(oldIndex, 1);
    newPanels.splice(newIndex, 0, moved);

    const updated = reorderPanels(draftConfig, newPanels);
    setDraftConfig(updated);
  }, [draftConfig]);

  const panelIds = useMemo(
    () => (dashboardConfig?.panels ?? []).filter((p) => p.visible).map((p) => p.id),
    [dashboardConfig],
  );

  const visibleCharts = useMemo((): ChartConfig[] => {
    if (dashboardConfig?.panels?.length) {
      return dashboardConfig.panels
        .filter((panel) => panel.visible)
        .map((panel, idx) => {
          const formatters = getAutoFormatter(panel.metricName);
          return {
            key: panel.metricName,
            title: panel.title,
            color: CHART_COLORS[idx % CHART_COLORS.length],
            chart: panel.chartType as ChartType,
            panelId: panel.id,
            valueFormatter: formatters.valueFormatter,
            axisFormatter: formatters.axisFormatter,
          };
        });
    }

    if (visualizationData?.metricsCatalog?.length) {
      const keysWithData = new Set(seriesKeysWithData);
      return visualizationData.metricsCatalog
        .filter((item) => keysWithData.has(item.name))
        .map((item, idx) => buildChartConfigFromCatalog(item, idx));
    }

    return seriesKeysWithData.map((key, idx) => {
      const formatters = getAutoFormatter(key);
      return {
        key,
        title: metricNameToTitle(key),
        color: CHART_COLORS[idx % CHART_COLORS.length],
        chart: 'line' as ChartType,
        valueFormatter: formatters.valueFormatter,
        axisFormatter: formatters.axisFormatter,
      };
    });
  }, [seriesKeysWithData, visualizationData, dashboardConfig]);

  const metricTypeGroups = useMemo((): MetricTypeGroup[] => {
    if (!visibleCharts.length) return [];

    if (!visualizationData?.metricsCatalog?.length) {
      return [{
        type: 'default',
        typeLabel: '📊 Metrics',
        prefixGroups: [{
          key: 'default',
          title: dashboardConfig ? 'Configured Panels' : 'Available Metrics',
          description: dashboardConfig
            ? 'Panels configured for this dashboard.'
            : 'Chartable metric series discovered from the current response.',
          charts: visibleCharts,
        }],
      }];
    }

    const catalogByName = new Map(
      visualizationData.metricsCatalog.map((item) => [item.name, item] as const),
    );
    const groupsByType = new Map<string, { typeLabel: string; prefixGroups: Map<string, ChartGroup> }>();

    visibleCharts.forEach((chart) => {
      const item = catalogByName.get(chart.key);
      const metricType = item?.prometheusType ?? 'custom';
      const typeGroup = groupsByType.get(metricType) ?? {
        typeLabel: typeLabels[metricType] ?? metricNameToTitle(metricType),
        prefixGroups: new Map<string, ChartGroup>(),
      };

      const prefixKey = item?.group || 'other';
      const prefixGroup = typeGroup.prefixGroups.get(prefixKey) ?? {
        key: `${metricType}-${prefixKey}`,
        title: metricNameToTitle(prefixKey),
        charts: [],
      };

      prefixGroup.charts.push(chart);
      typeGroup.prefixGroups.set(prefixKey, prefixGroup);
      groupsByType.set(metricType, typeGroup);
    });

    return Array.from(groupsByType.entries()).map(([type, group]) => ({
      type,
      typeLabel: group.typeLabel,
      prefixGroups: Array.from(group.prefixGroups.values()),
    }));
  }, [dashboardConfig, visibleCharts, visualizationData]);

  const visualizationErrorDescription = useMemo(() => {
    if (!visualizationError) return null;

    if (axios.isAxiosError(visualizationError)) {
      const status = visualizationError.response?.status;
      if (status === 400) {
        return 'Invalid query parameters. Check selected component, pod mode, and window.';
      }
      if (status === 502) {
        return 'Failed to reach upstream metrics endpoint. Verify proxy endpoint and component service.';
      }
      if (status === 503) {
        return 'No usable metrics in the selected window. Wait for new samples or switch pod scope.';
      }
    }

    return (visualizationError as Error).message;
  }, [visualizationError]);

  const renderGauge = (config: ChartConfig, currentValue: number, bounds: { min: number; max: number } | undefined) => {
    const min = bounds?.min ?? 0;
    const max = bounds?.max ?? (currentValue * 1.5 || 100);
    const ratio = max > min ? Math.min((currentValue - min) / (max - min), 1) : 0;
    const angle = ratio * 180;
    const valueFormatter = config.valueFormatter ?? ((v: number) => formatNumber(v));

    const cx = 120;
    const cy = 100;
    const r = 80;
    const startAngle = Math.PI;
    const endAngle = Math.PI - (angle * Math.PI) / 180;

    const arcX1 = cx + r * Math.cos(startAngle);
    const arcY1 = cy - r * Math.sin(startAngle);
    const arcX2 = cx + r * Math.cos(endAngle);
    const arcY2 = cy - r * Math.sin(endAngle);
    const largeArc = angle > 180 ? 1 : 0;

    return (
      <div className="flex flex-col items-center justify-center h-[240px]">
        <svg width="240" height="140" viewBox="0 0 240 140">
          {/* Background arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke={token.colorBorderSecondary}
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Value arc */}
          {angle > 0 && (
            <path
              d={`M ${arcX1} ${arcY1} A ${r} ${r} 0 ${largeArc} 1 ${arcX2} ${arcY2}`}
              fill="none"
              stroke={config.color}
              strokeWidth="12"
              strokeLinecap="round"
            />
          )}
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize="18" fontWeight="bold" fill={token.colorText}>
            {valueFormatter(currentValue)}
          </text>
          <text x={cx - r} y={cy + 28} textAnchor="start" fontSize="10" fill={token.colorTextTertiary}>
            {valueFormatter(min)}
          </text>
          <text x={cx + r} y={cy + 28} textAnchor="end" fontSize="10" fill={token.colorTextTertiary}>
            {valueFormatter(max)}
          </text>
        </svg>
      </div>
    );
  };

  const renderChartContent = (config: ChartConfig, chartWidth: number) => {
    const gradientId = `series-gradient-${config.key}`;

    if (config.chart === 'gauge') {
      const latestValue = getLatestSeriesValue(visualizationRows, config.key);
      const bounds = getSeriesBounds(visualizationRows, config.key);
      return renderGauge(config, latestValue ?? 0, bounds);
    }

    if (config.chart === 'bar') {
      return (
        <BarChart
          width={chartWidth}
          height={240}
          data={visualizationRows}
          margin={{ left: 4, right: 4, top: 6, bottom: 2 }}
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray="2 6"
            stroke={token.colorBorderSecondary}
          />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTimestamp}
            minTickGap={28}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: token.colorTextTertiary }}
          />
          <YAxis
            width={54}
            tickFormatter={config.axisFormatter ?? ((value) => formatNumber(value, 1))}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: token.colorTextTertiary }}
          />
          <Tooltip
            cursor={{ fill: token.colorFillQuaternary }}
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${token.colorBorderSecondary}`,
              boxShadow: token.boxShadowSecondary,
              background: token.colorBgElevated,
            }}
            labelStyle={{ color: token.colorTextSecondary, fontSize: 12 }}
            labelFormatter={(ts) => new Date(ts as string).toLocaleString()}
            formatter={(value) => {
              const numericValue = typeof value === 'number' ? value : Number(value);
              return [(config.valueFormatter ?? formatNumber)(numericValue), config.title];
            }}
          />
          <Bar
            dataKey={config.key}
            fill={config.color}
            fillOpacity={0.8}
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      );
    }

    if (config.chart === 'line') {
      return (
        <LineChart
          width={chartWidth}
          height={240}
          data={visualizationRows}
          margin={{ left: 4, right: 4, top: 6, bottom: 2 }}
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray="2 6"
            stroke={token.colorBorderSecondary}
          />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTimestamp}
            minTickGap={28}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: token.colorTextTertiary }}
          />
          <YAxis
            width={54}
            tickFormatter={config.axisFormatter ?? ((value) => formatNumber(value, 1))}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: token.colorTextTertiary }}
          />
          <Tooltip
            cursor={{ stroke: token.colorBorder, strokeDasharray: '4 4' }}
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${token.colorBorderSecondary}`,
              boxShadow: token.boxShadowSecondary,
              background: token.colorBgElevated,
            }}
            labelStyle={{ color: token.colorTextSecondary, fontSize: 12 }}
            labelFormatter={(ts) => new Date(ts as string).toLocaleString()}
            formatter={(value) => {
              const numericValue = typeof value === 'number' ? value : Number(value);
              return [(config.valueFormatter ?? formatNumber)(numericValue), config.title];
            }}
          />
          <Line
            type="monotoneX"
            dataKey={config.key}
            stroke={config.color}
            dot={false}
            activeDot={{ r: 3, fill: config.color, stroke: token.colorBgContainer, strokeWidth: 1 }}
            strokeWidth={2}
            connectNulls
            isAnimationActive={false}
          />
        </LineChart>
      );
    }

    // Default: area chart
    return (
      <AreaChart
        width={chartWidth}
        height={240}
        data={visualizationRows}
        margin={{ left: 4, right: 4, top: 6, bottom: 2 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={config.color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={config.color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          vertical={false}
          strokeDasharray="2 6"
          stroke={token.colorBorderSecondary}
        />
        <XAxis
          dataKey="timestamp"
          tickFormatter={formatTimestamp}
          minTickGap={28}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: token.colorTextTertiary }}
        />
        <YAxis
          width={54}
          tickFormatter={config.axisFormatter ?? ((value) => formatNumber(value, 1))}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: token.colorTextTertiary }}
        />
        <Tooltip
          cursor={{ stroke: token.colorBorder, strokeDasharray: '4 4' }}
          contentStyle={{
            borderRadius: 8,
            border: `1px solid ${token.colorBorderSecondary}`,
            boxShadow: token.boxShadowSecondary,
            background: token.colorBgElevated,
          }}
          labelStyle={{ color: token.colorTextSecondary, fontSize: 12 }}
          labelFormatter={(ts) => new Date(ts as string).toLocaleString()}
          formatter={(value) => {
            const numericValue = typeof value === 'number' ? value : Number(value);
            return [(config.valueFormatter ?? formatNumber)(numericValue), config.title];
          }}
        />
        <Area
          type="monotoneX"
          dataKey={config.key}
          stroke={config.color}
          fill={`url(#${gradientId})`}
          fillOpacity={1}
          strokeWidth={2}
          connectNulls
          isAnimationActive={false}
        />
      </AreaChart>
    );
  };

  const renderChartCard = (config: ChartConfig) => {
    const latestValue = getLatestSeriesValue(visualizationRows, config.key);
    const valueFormatter = config.valueFormatter ?? ((value: number) => formatNumber(value));
    const bounds = getSeriesBounds(visualizationRows, config.key);
    const chartWidth = windowWidth >= 1280 ? Math.max(320, Math.floor((windowWidth - 220) / 2) - 24) : Math.max(260, windowWidth - 88);
    const panel = config.panelId
      ? dashboardConfig?.panels.find((item) => item.id === config.panelId)
      : undefined;

    return (
      <Card
        key={config.panelId ?? config.key}
        size="small"
        className="relative h-[338px]"
        title={
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <Space size={8}>
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <Text strong style={{ fontSize: 14 }}>
                  {config.title}
                </Text>
              </Space>
              <Text className="text-sm font-medium">
                {typeof latestValue === 'number' ? valueFormatter(latestValue) : '--'}
              </Text>
            </div>
            {bounds ? (
              <Text type="secondary" className="text-xs">
                Range: {valueFormatter(bounds.min)} to {valueFormatter(bounds.max)}
              </Text>
            ) : null}
          </div>
        }
      >
        {editMode && panel ? (
          <Space size="small" style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
            <Button
              size="small"
              type="text"
              onClick={() => {
                setEditingPanel(panel);
                setPanelEditorOpen(true);
              }}
            >
              Edit
            </Button>
            <Popconfirm
              title="Delete this panel?"
              onConfirm={() => handleDeletePanel(panel.id)}
            >
              <Button size="small" type="text" danger>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        ) : null}
        {visualizationRows.length === 0 ? (
          <LazyChart height={252} loading={visualizationLoading}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No timeseries data in current window" />
          </LazyChart>
        ) : (
          <LazyChart height={252} loading={visualizationLoading}>
            <div
              className="h-[252px] w-full min-w-0 overflow-hidden rounded-md px-1 pt-2"
              style={{ backgroundColor: token.colorFillQuaternary }}
            >
              {renderChartContent(config, chartWidth)}
            </div>
          </LazyChart>
        )}
      </Card>
    );
  };

  return (
    <Panel>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Title level={4} className="!mb-1">
              Control Plane Metrics
            </Title>
          </div>

          <Space size={8}>
            <Button
              icon={<Icons.spinner size={14} />}
              size="small"
              loading={refreshVisualizationMutation.isPending}
              onClick={() => refreshVisualizationMutation.mutate()}
            >
              Refresh now
            </Button>
            <DashboardToolbar
              editMode={editMode}
              hasCustomConfig={!!committedConfig}
              onToggleEdit={() => {
                if (editMode) {
                  handleExitEditMode();
                } else {
                  handleEnterEditMode();
                }
              }}
              onAddPanel={() => {
                setEditingPanel(null);
                setPanelEditorOpen(true);
              }}
              onReset={handleResetConfig}
              onExplore={() => setExplorerOpen(true)}
            />
          </Space>
        </div>

        <Card size="small" title="Dashboard Scope">
          <div className="flex flex-wrap items-center gap-4">
            <Space size={6}>
              <Text strong className="text-xs uppercase tracking-wide" style={{ color: token.colorTextTertiary }}>
                Component
              </Text>
              <Select
                size="small"
                value={activeComponent}
                options={KARMADA_COMPONENTS.map((item) => ({ value: item.key, label: item.label }))}
                style={{ minWidth: 220 }}
                onChange={(value) => {
                  setActiveComponent(value as KarmadaComponentKey);
                  setVisualizationPod('all');
                  setHasInitializedPodSelection(false);
                }}
              />
            </Space>

            <Space size={6}>
              <Text strong className="text-xs uppercase tracking-wide" style={{ color: token.colorTextTertiary }}>
                Window
              </Text>
              <Select
                size="small"
                value={defaultWindow}
                disabled
                options={[{ label: '15 minutes', value: defaultWindow }]}
                style={{ minWidth: 140 }}
              />
            </Space>

            <Space size={6}>
              <Text strong className="text-xs uppercase tracking-wide" style={{ color: token.colorTextTertiary }}>
                Pod
              </Text>
              <Select
                size="small"
                value={visualizationPod}
                style={{ minWidth: 280 }}
                options={[
                  { label: 'All pods (sum)', value: 'all' },
                  ...visualizationPods.map((pod) => ({ label: pod, value: pod })),
                ]}
                onChange={(value) => setVisualizationPod(value)}
              />
            </Space>

            <div className="ml-auto text-right">
              {visualizationData?.meta?.sampleIntervalSec ? (
                <Text type="secondary" className="block text-xs">
                  Sample interval: {visualizationData.meta.sampleIntervalSec}s
                </Text>
              ) : null}
              {visualizationData?.meta?.generatedAt ? (
                <Text type="secondary" className="block text-xs">
                  Last fetched: {new Date(visualizationData.meta.generatedAt).toLocaleString()}
                </Text>
              ) : null}
            </div>
          </div>
        </Card>

        {visualizationData?.warnings?.length ? (
          <Alert
            type="warning"
            message="Partial data detected"
            description={visualizationData.warnings.join(' ')}
          />
        ) : null}

        <div>
          {visualizationError ? (
            <Alert
              type="error"
              message={`Failed to load ${activeComponent} visualization`}
              description={visualizationErrorDescription}
              action={
                <Button size="small" onClick={() => refreshVisualizationMutation.mutate()}>
                  Retry now
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {metricTypeGroups.length > 0 ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={panelIds} strategy={rectSortingStrategy}>
                    <div className="space-y-6">
                      {metricTypeGroups.map((typeGroup) => (
                        <div key={typeGroup.type} className="space-y-4">
                          <div className="px-1">
                            <Text strong className="text-base">
                              {typeGroup.typeLabel}
                            </Text>
                          </div>
                          <div className="space-y-4">
                            {typeGroup.prefixGroups.map((group) => (
                              <div key={group.key} className="space-y-2">
                                <div className="px-1">
                                  <Text strong className="text-sm">
                                    {group.title}
                                  </Text>
                                  {group.description ? (
                                    <Text type="secondary" className="ml-2 text-xs">
                                      {group.description}
                                    </Text>
                                  ) : null}
                                </div>
                                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                                  {group.charts.map((chart) => (
                                    <DragPanel key={chart.panelId ?? chart.key} id={chart.panelId ?? chart.key} disabled={!editMode}>
                                      {renderChartCard(chart)}
                                    </DragPanel>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <Card size="small">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No chartable metric series found for the selected component and pod scope."
                  />
                </Card>
              )}
            </div>
          )}
        </div>
        <PanelEditor
          open={panelEditorOpen}
          onClose={() => {
            setPanelEditorOpen(false);
            setEditingPanel(null);
          }}
          onSave={handleSavePanel}
          catalog={visualizationData?.metricsCatalog ?? []}
          editingPanel={editingPanel}
        />
        <MetricExplorer
          open={explorerOpen}
          onClose={() => setExplorerOpen(false)}
          onAddToDashboard={handleExplorerAddPanel}
          catalog={visualizationData?.metricsCatalog ?? []}
          component={activeComponent}
          pod={visualizationPod}
        />
      </div>
    </Panel>
  );
};

export default MetricsPage;
