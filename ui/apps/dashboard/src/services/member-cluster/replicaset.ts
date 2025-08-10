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

export interface ReplicaSet {
  objectMeta: ObjectMeta;
  typeMeta: TypeMeta;
  pods: {
    current: number;
    desired: number;
    running: number;
    pending: number;
    failed: number;
    succeeded: number;
    warnings: any[];
  };
  containerImages: string[];
  initContainerImages: any[];
}

export interface ReplicationController {
  objectMeta: ObjectMeta;
  typeMeta: TypeMeta;
  pods: {
    current: number;
    desired: number;
    running: number;
    pending: number;
    failed: number;
    succeeded: number;
    warnings: any[];
  };
  containerImages: string[];
  initContainerImages: any[];
}

// ReplicaSet APIs
export async function GetReplicaSets(params?: {
  namespace?: string;
  keyword?: string;
  filterBy?: string[];
  sortBy?: string[];
  itemsPerPage?: number;
  page?: number;
}) {
  const { namespace, keyword, ...queryParams } = params || {};
  const url = namespace ? `/replicaset/${namespace}` : `/replicaset`;
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
      replicaSets: ReplicaSet[];
    }>
  >(url, {
    params: convertDataSelectQuery(requestData),
  });
  return resp.data;
}

export async function GetReplicaSetDetail(params: {
  namespace: string;
  name: string;
}) {
  const { namespace, name } = params;
  const resp = await karmadaClient.get<
    IResponse<
      {
        errors: string[];
      } & ReplicaSet
    >
  >(`/replicaset/${namespace}/${name}`);
  return resp.data;
}

export async function GetReplicaSetEvents(params: {
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
  >(`/replicaset/${namespace}/${name}/event`);
  return resp.data;
}

export async function GetReplicaSetPods(params: {
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
      pods: any[];
    }>
  >(`/replicaset/${namespace}/${name}/pod`);
  return resp.data;
}

export async function GetReplicaSetServices(params: {
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
      services: any[];
    }>
  >(`/replicaset/${namespace}/${name}/service`);
  return resp.data;
}

// ReplicationController APIs
export async function GetReplicationControllers(params?: {
  namespace?: string;
  keyword?: string;
  filterBy?: string[];
  sortBy?: string[];
  itemsPerPage?: number;
  page?: number;
}) {
  const { namespace, keyword, ...queryParams } = params || {};
  const url = namespace ? `/replicationcontroller/${namespace}` : `/replicationcontroller`;
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
      replicationControllers: ReplicationController[];
    }>
  >(url, {
    params: convertDataSelectQuery(requestData),
  });
  return resp.data;
}

export async function GetReplicationControllerDetail(params: {
  namespace: string;
  name: string;
}) {
  const { namespace, name } = params;
  const resp = await karmadaClient.get<
    IResponse<
      {
        errors: string[];
      } & ReplicationController
    >
  >(`/replicationcontroller/${namespace}/${name}`);
  return resp.data;
}

export async function GetReplicationControllerEvents(params: {
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
  >(`/replicationcontroller/${namespace}/${name}/event`);
  return resp.data;
}

export async function GetReplicationControllerPods(params: {
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
      pods: any[];
    }>
  >(`/replicationcontroller/${namespace}/${name}/pod`);
  return resp.data;
}

export async function GetReplicationControllerServices(params: {
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
      services: any[];
    }>
  >(`/replicationcontroller/${namespace}/${name}/service`);
  return resp.data;
}

export async function ScaleReplicationController(params: {
  namespace: string;
  name: string;
  replicas: number;
}) {
  const { namespace, name, replicas } = params;
  const resp = await karmadaClient.post<
    IResponse<any>
  >(`/replicationcontroller/${namespace}/${name}/update/pod`, { replicas });
  return resp.data;
}