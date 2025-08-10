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

import {
  IResponse,
  karmadaClient,
} from './base';

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
  const { namespace, pod, container, ...queryParams } = params;
  const url = container ? `/log/${namespace}/${pod}/${container}` : `/log/${namespace}/${pod}`;
  
  const resp = await karmadaClient.get<LogDetails>(url, {
    params: queryParams,
  });
  return resp.data;
}

export async function DownloadLogs(params: {
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
  const { namespace, pod, container, ...queryParams } = params;
  
  const resp = await karmadaClient.get<Blob>(`/log/file/${namespace}/${pod}/${container}`, {
    params: queryParams,
    responseType: 'blob',
  });
  return resp.data;
}

export async function GetLogSources(params: {
  namespace: string;
  resourceName: string;
  resourceType: string;
}) {
  const { namespace, resourceName, resourceType } = params;
  
  const resp = await karmadaClient.get<
    IResponse<{
      logSources: LogSource[];
    }>
  >(`/log/source/${namespace}/${resourceName}/${resourceType}`);
  return resp.data;
}