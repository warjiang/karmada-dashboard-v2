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

import { karmadaMemberClusterClient } from '../base';

export interface LogSource {
  containerName: string;
  podName: string;
}

export interface LogDetails {
  info: LogInfo;
  logs: LogLine[];
  podLogs: PodLogs;
}

export interface LogInfo {
  podName: string;
  containerName: string;
  fromDate: string;
  toDate: string;
  truncated: boolean;
}

export interface LogLine {
  timestamp: string;
  content: string;
}

export interface PodLogs {
  logs: string[];
}

export async function GetLogs(params: {
  memberClusterName: string;
  namespace: string;
  pod: string;
  container?: string;
  previous?: boolean;
  sinceSeconds?: number;
  sinceTime?: string;
  timestamps?: boolean;
  tailLines?: number;
  limitBytes?: number;
}) {
  const { memberClusterName, namespace, pod, container, ...queryParams } = params;
  console.log('GetLogs')
  const url = container ? `/clusterapi/${memberClusterName}/api/v1/log/${namespace}/${pod}/${container}` : `/clusterapi/${memberClusterName}/api/v1/log/${namespace}/${pod}`;

  const resp = await karmadaMemberClusterClient.get<LogDetails>(url, {
    params: queryParams,
  });
  return resp;
}

export async function DownloadLogs(params: {
  memberClusterName: string;
  namespace: string;
  pod: string;
  container: string;
  previous?: boolean;
  sinceSeconds?: number;
  sinceTime?: string;
  timestamps?: boolean;
  tailLines?: number;
  limitBytes?: number;
}) {
  const { memberClusterName, namespace, pod, container, ...queryParams } = params;

  const resp = await karmadaMemberClusterClient.get<Blob>(`/clusterapi/${memberClusterName}/api/v1/log/file/${namespace}/${pod}/${container}`, {
    params: queryParams,
    responseType: 'blob',
  });
  return resp;
}

export async function GetLogSources(params: {
  memberClusterName: string;
  namespace: string;
  resourceName: string;
  resourceType: string;
}) {
  const { memberClusterName, namespace, resourceName, resourceType } = params;

  const resp = await karmadaMemberClusterClient.get<{
    logSources: LogSource[];
  }>(`/clusterapi/${memberClusterName}/api/v1/log/source/${namespace}/${resourceName}/${resourceType}`);
  return resp;
}
