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

export interface Container {
  name: string;
  image: string;
  ready: boolean;
  restartCount: number;
  env: EnvVar[];
}

export interface EnvVar {
  name: string;
  value: string;
}

export interface ContainerStatus {
  name: string;
  ready: boolean;
  restartCount: number;
  image: string;
  imageID: string;
  state: any;
  lastState: any;
}

export interface Pod {
  objectMeta: ObjectMeta;
  typeMeta: TypeMeta;
  status: string;
  podPhase: string;
  podIP: string;
  nodeName: string;
  restartCount: number;
  containers: Container[];
  containerStatuses: ContainerStatus[];
  warnings: any[];
}

export interface PodDetail extends Pod {
  controller: any;
  creationTimestamp: string;
  startTime: string;
  tolerations: any[];
  nodeSelector: Record<string, string>;
  serviceAccountName: string;
}

export async function GetPods(params: {
  namespace?: string;
  keyword?: string;
}) {
  const { namespace, keyword } = params;
  const url = namespace ? `/pod/${namespace}` : `/pod`;
  const requestData = {} as DataSelectQuery;
  if (keyword) {
    requestData.filterBy = ['name', keyword];
  }
  const resp = await karmadaClient.get<
    IResponse<{
      errors: string[];
      listMeta: {
        totalItems: number;
      };
      pods: Pod[];
    }>
  >(url, {
    params: convertDataSelectQuery(requestData),
  });
  return resp.data;
}

export async function GetPodDetail(params: {
  namespace: string;
  name: string;
}) {
  const { namespace, name } = params;
  const resp = await karmadaClient.get<
    IResponse<
      {
        errors: string[];
      } & PodDetail
    >
  >(`/pod/${namespace}/${name}`);
  return resp.data;
}

export async function GetPodContainers(params: {
  namespace: string;
  name: string;
}) {
  const { namespace, name } = params;
  const resp = await karmadaClient.get<
    IResponse<{
      containers: Container[];
    }>
  >(`/pod/${namespace}/${name}/container`);
  return resp.data;
}

export async function GetPodEvents(params: {
  namespace: string;
  name: string;
}) {
  const { namespace, name } = params;
  const resp = await karmadaClient.get<
    IResponse<{
      errors: string[];
      listMeta: {
        totalItems: number;
      };
      events: any[];
    }>
  >(`/pod/${namespace}/${name}/event`);
  return resp.data;
}

export async function GetPodPersistentVolumeClaims(params: {
  namespace: string;
  name: string;
}) {
  const { namespace, name } = params;
  const resp = await karmadaClient.get<
    IResponse<{
      persistentVolumeClaims: any[];
    }>
  >(`/pod/${namespace}/${name}/persistentvolumeclaim`);
  return resp.data;
}

export async function GetPodShell(params: {
  namespace: string;
  pod: string;
  container: string;
}) {
  const { namespace, pod, container } = params;
  const resp = await karmadaClient.get<IResponse<any>>(
    `/pod/${namespace}/${pod}/shell/${container}`
  );
  return resp.data;
}