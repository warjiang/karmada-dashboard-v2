import type { MetricCatalogItem } from '@/services/metrics';

export type ChartType = 'line' | 'area' | 'bar' | 'gauge';
export type AggregationType = 'sum' | 'avg' | 'max' | 'min' | 'rate';

export interface LabelFilter {
  key: string;
  value: string;
}

export interface MetricQuery {
  metric: string;
  aggregation: AggregationType;
  labelFilters?: LabelFilter[];
}

export interface PanelConfig {
  id: string;
  metricName: string;
  chartType: ChartType;
  title: string;
  visible: boolean;
  query?: MetricQuery;
  /** Grid position (order index) */
  order?: number;
}

export interface DashboardConfig {
  version: number;
  component: string;
  panels: PanelConfig[];
}

const STORAGE_PREFIX = 'karmada-metrics-dashboard:';
const CONFIG_VERSION = 1;

/**
 * Generate a unique panel ID
 */
export function generatePanelId(): string {
  return `panel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Load dashboard config from localStorage for a specific component.
 * Returns null if no config exists (meaning: show all metrics by default).
 */
export function loadDashboardConfig(component: string): DashboardConfig | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${component}`);
    if (!raw) return null;
    const config = JSON.parse(raw) as DashboardConfig;
    if (config.version !== CONFIG_VERSION) return null;
    return config;
  } catch {
    return null;
  }
}

/**
 * Save dashboard config to localStorage for a specific component.
 */
export function saveDashboardConfig(config: DashboardConfig): void {
  localStorage.setItem(
    `${STORAGE_PREFIX}${config.component}`,
    JSON.stringify(config),
  );
}

/**
 * Reset (delete) the dashboard config for a component, reverting to show-all default.
 */
export function resetDashboardConfig(component: string): void {
  localStorage.removeItem(`${STORAGE_PREFIX}${component}`);
}

/**
 * Create a PanelConfig from a MetricCatalogItem with sensible defaults.
 */
export function createPanelFromCatalogItem(item: MetricCatalogItem): PanelConfig {
  return {
    id: generatePanelId(),
    metricName: item.name,
    chartType: item.suggestedChart,
    title: item.name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    visible: true,
  };
}

/**
 * Build a full default config from catalog (all metrics visible).
 */
export function buildDefaultConfig(
  component: string,
  catalog: MetricCatalogItem[],
): DashboardConfig {
  return {
    version: CONFIG_VERSION,
    component,
    panels: catalog.map(createPanelFromCatalogItem),
  };
}

/**
 * Add a panel to the config and save.
 */
export function addPanel(config: DashboardConfig, panel: PanelConfig): DashboardConfig {
  const updated = {
    ...config,
    panels: [...config.panels, panel],
  };
  saveDashboardConfig(updated);
  return updated;
}

/**
 * Remove a panel by ID and save.
 */
export function removePanel(config: DashboardConfig, panelId: string): DashboardConfig {
  const updated = {
    ...config,
    panels: config.panels.filter((p) => p.id !== panelId),
  };
  saveDashboardConfig(updated);
  return updated;
}

/**
 * Update a panel by ID and save.
 */
export function updatePanel(config: DashboardConfig, panelId: string, updates: Partial<PanelConfig>): DashboardConfig {
  const updated = {
    ...config,
    panels: config.panels.map((p) =>
      p.id === panelId ? { ...p, ...updates } : p,
    ),
  };
  saveDashboardConfig(updated);
  return updated;
}

/**
 * Reorder panels and save.
 */
export function reorderPanels(config: DashboardConfig, panels: PanelConfig[]): DashboardConfig {
  const updated = { ...config, panels };
  saveDashboardConfig(updated);
  return updated;
}

/**
 * Get the list of metric names from the config (for API filtering).
 */
export function getConfiguredMetricNames(config: DashboardConfig): string[] {
  return config.panels
    .filter((p) => p.visible)
    .map((p) => p.metricName);
}
