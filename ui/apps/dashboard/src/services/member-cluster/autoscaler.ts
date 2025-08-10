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
  convertDataSelectQuery,
  DataSelectQuery,
  IResponse,
  karmadaClient,
  ObjectMeta,
  TypeMeta,
} from '../base';

export interface HorizontalPodAutoscaler {
  objectMeta: ObjectMeta;
  typeMeta: TypeMeta;
  scaleTargetRef: ScaleTargetRef;
  minReplicas: number;
  maxReplicas: number;
  currentReplicas: number;
  targetCPUUtilizationPercentage?: number;
  metrics: HPAMetric[];
  currentMetrics: HPAMetricStatus[];
}

export interface ScaleTargetRef {
  kind: string;
  name: string;
  apiVersion: string;
}

export interface HPAMetric {
  type: string;
  resource?: ResourceMetricSource;
  object?: ObjectMetricSource;
  external?: ExternalMetricSource;
}

export interface ResourceMetricSource {
  name: string;
  targetAverageUtilization?: number;
  targetAverageValue?: string;
}

export interface ObjectMetricSource {
  target: CrossVersionObjectReference;
  metricName: string;
  targetValue: string;
}

export interface ExternalMetricSource {
  metricName: string;
  metricSelector?: any;
  targetValue?: string;
  targetAverageValue?: string;
}

export interface CrossVersionObjectReference {
  kind: string;
  name: string;
  apiVersion: string;
}

export interface HPAMetricStatus {
  type: string;
  resource?: ResourceMetricStatus;
  object?: ObjectMetricStatus;
  external?: ExternalMetricStatus;
}

export interface ResourceMetricStatus {
  name: string;
  currentAverageUtilization?: number;
  currentAverageValue?: string;
}

export interface ObjectMetricStatus {
  target: CrossVersionObjectReference;
  metricName: string;
  currentValue: string;
}

export interface ExternalMetricStatus {
  metricName: string;
  metricSelector?: any;
  currentValue?: string;
  currentAverageValue?: string;
}

export async function GetHorizontalPodAutoscalers(params?: {
  namespace?: string;
  keyword?: string;
  filterBy?: string[];
  sortBy?: string[];
  itemsPerPage?: number;
  page?: number;
}) {
  const { namespace, keyword, ...queryParams } = params || {};
  const url = namespace ? `/horizontalpodautoscaler/${namespace}` : `/horizontalpodautoscaler`;
  const requestData = { ...queryParams } as DataSelectQuery;
  if (keyword) {
    requestData.filterBy = ['name', keyword];
  }
  const resp = await karmadaClient.get<
    IResponse<{
      errors: string[];
      listMeta: {
        totalItems: number;
      };
      horizontalPodAutoscalers: HorizontalPodAutoscaler[];
    }>
  >(url, {
    params: convertDataSelectQuery(requestData),
  });
  return resp.data;
}

export async function GetHorizontalPodAutoscalerDetail(params: {
  namespace: string;
  name: string;
}) {
  const { namespace, name } = params;
  const resp = await karmadaClient.get<
    IResponse<
      {
        errors: string[];
      } & HorizontalPodAutoscaler
    >
  >(`/horizontalpodautoscaler/${namespace}/${name}`);
  return resp.data;
}

export async function GetHorizontalPodAutoscalersForResource(params: {
  kind: string;
  namespace: string;
  name: string;
}) {
  const { kind, namespace, name } = params;
  const resp = await karmadaClient.get<
    IResponse<{
      errors: string[];
      listMeta: {
        totalItems: number;
      };
      horizontalPodAutoscalers: HorizontalPodAutoscaler[];
    }>
  >(`/${kind}/${namespace}/${name}/horizontalpodautoscaler`);
  return resp.data;
}