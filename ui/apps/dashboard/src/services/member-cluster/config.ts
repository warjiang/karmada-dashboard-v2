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

export interface ConfigMap {
  objectMeta: ObjectMeta;
  typeMeta: TypeMeta;
  data: Record<string, string>;
  binaryData: Record<string, string>;
}

export interface ConfigMapDetail extends ConfigMap {
  keys: string[];
}

export interface Secret {
  objectMeta: ObjectMeta;
  typeMeta: TypeMeta;
  type: string;
  data: Record<string, string>;
}

export interface SecretDetail extends Secret {
  keys: string[];
}

export interface ImagePullSecretSpec {
  name: string;
  namespace: string;
  data: {
    '.dockerconfigjson': string;
  };
}

// ConfigMap APIs
export async function GetConfigMaps(params?: {
  namespace?: string;
  keyword?: string;
  filterBy?: string[];
  sortBy?: string[];
  itemsPerPage?: number;
  page?: number;
}) {
  const { namespace, keyword, ...queryParams } = params || {};
  const url = namespace ? `/configmap/${namespace}` : `/configmap`;
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
      configMaps: ConfigMap[];
    }>
  >(url, {
    params: convertDataSelectQuery(requestData),
  });
  return resp.data;
}

export async function GetConfigMapDetail(params: {
  namespace: string;
  name: string;
}) {
  const { namespace, name } = params;
  const resp = await karmadaClient.get<
    IResponse<
      {
        errors: string[];
      } & ConfigMapDetail
    >
  >(`/configmap/${namespace}/${name}`);
  return resp.data;
}

// Secret APIs
export async function GetSecrets(params?: {
  namespace?: string;
  keyword?: string;
  filterBy?: string[];
  sortBy?: string[];
  itemsPerPage?: number;
  page?: number;
}) {
  const { namespace, keyword, ...queryParams } = params || {};
  const url = namespace ? `/secret/${namespace}` : `/secret`;
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
      secrets: Secret[];
    }>
  >(url, {
    params: convertDataSelectQuery(requestData),
  });
  return resp.data;
}

export async function GetSecretDetail(params: {
  namespace: string;
  name: string;
}) {
  const { namespace, name } = params;
  const resp = await karmadaClient.get<
    IResponse<
      {
        errors: string[];
      } & SecretDetail
    >
  >(`/secret/${namespace}/${name}`);
  return resp.data;
}

export async function CreateImagePullSecret(spec: ImagePullSecretSpec) {
  const resp = await karmadaClient.post<IResponse<Secret>>('/secret', spec);
  return resp.data;
}
