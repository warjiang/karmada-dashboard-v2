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

import axios from 'axios';
import _ from 'lodash';

let pathPrefix = window.__path_prefix__ || '';
if (!pathPrefix.startsWith('/')) {
  pathPrefix = '/' + pathPrefix;
}
if (!pathPrefix.endsWith('/')) {
  pathPrefix = pathPrefix + '/';
}

const metricsBaseURL: string = _.join(
  [pathPrefix, 'metrics-scraper/api/v1'],
  '',
);

export const metricsScraperClient = axios.create({
  baseURL: metricsBaseURL,
});

export const KARMADA_COMPONENTS = [
  { key: 'karmada-scheduler', label: 'Scheduler' },
  { key: 'karmada-controller-manager', label: 'Controller Manager' },
  { key: 'karmada-agent', label: 'Agent' },
] as const;

export type KarmadaComponentKey = (typeof KARMADA_COMPONENTS)[number]['key'];

export interface MetricValue {
  labels?: Record<string, string>;
  value: string;
  measure: string;
}

export interface Metric {
  name: string;
  help: string;
  type: string;
  values?: MetricValue[];
}

export interface ParsedData {
  currentTime: string;
  metrics: Record<string, Metric>;
}

/** Response from GET /metrics/:app_name — maps pod name → parsed metrics snapshot */
export type ComponentMetricsResponse = Record<string, ParsedData>;

/** Response from GET /metrics?type=sync_status — maps component name → syncing */
export type SyncStatusResponse = Record<string, boolean>;

export async function GetComponentMetrics(
  appName: string,
): Promise<ComponentMetricsResponse> {
  const resp =
    await metricsScraperClient.get<ComponentMetricsResponse>(
      `/metrics/${appName}`,
    );
  return resp.data;
}

export async function GetSyncStatus(): Promise<SyncStatusResponse> {
  const resp = await metricsScraperClient.get<SyncStatusResponse>('/metrics', {
    params: { type: 'sync_status' },
  });
  return resp.data;
}

export async function SetComponentSync(
  appName: string | null,
  enabled: boolean,
): Promise<void> {
  const type = enabled ? 'sync_on' : 'sync_off';
  if (appName) {
    await metricsScraperClient.get(`/metrics/${appName}`, {
      params: { type },
    });
  } else {
    await metricsScraperClient.get('/metrics', { params: { type } });
  }
}
