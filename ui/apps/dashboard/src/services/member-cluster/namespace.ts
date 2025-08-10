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

export interface Namespace {
  objectMeta: ObjectMeta;
  typeMeta: TypeMeta;
  phase: string;
  skipAutoPropagation: boolean;
}

export interface NamespaceSpec {
  name: string;
  skipAutoPropagation: boolean;
}

export async function GetMemberClusterNamespaces(params: {
  memberClusterName: string;
  keyword?: string;
  filterBy?: string[];
  sortBy?: string[];
  itemsPerPage?: number;
  page?: number;
}) {
  const { memberClusterName, keyword, ...queryParams } = params;
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
      namespaces: Namespace[];
    }>
  >(`/clusterapi/${memberClusterName}/api/v1/namespace`, {
    params: convertDataSelectQuery(requestData),
  });
  return resp.data;
}

export async function GetMemberClusterNamespaceDetail(params: {
  memberClusterName: string;
  name: string;
}) {
  const { memberClusterName, name } = params;
  const resp = await karmadaClient.get<
    IResponse<
      {
        errors: string[];
      } & Namespace
    >
  >(`/clusterapi/${memberClusterName}/api/v1/namespace/${name}`);
  return resp.data;
}

export async function GetMemberClusterNamespaceEvents(params: {
  memberClusterName: string;
  name: string;
}) {
  const { memberClusterName, name } = params;
  const resp = await karmadaClient.get<
    IResponse<{
      errors: string[];
      listMeta: {
        totalItems: number;
      };
      events: any[];
    }>
  >(`/clusterapi/${memberClusterName}/api/v1/namespace/${name}/event`);
  return resp.data;
}

export async function CreateMemberClusterNamespace(params: {
  memberClusterName: string;
  spec: NamespaceSpec;
}) {
  const { memberClusterName, spec } = params;
  const resp = await karmadaClient.post<IResponse<string>>(
    `/clusterapi/${memberClusterName}/api/v1/namespace`,
    spec,
  );
  return resp.data;
}
