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
  karmadaMemberClusterClient,
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

// Member Cluster ConfigMap APIs
export async function GetMemberClusterConfigMaps(params: {
  memberClusterName: string;
  namespace?: string;
  keyword?: string;
  filterBy?: string[];
  sortBy?: string[];
  itemsPerPage?: number;
  page?: number;
}) {
  const { memberClusterName, namespace, keyword, ...queryParams } = params;
  const url = namespace
    ? `/clusterapi/${memberClusterName}/api/v1/configmap/${namespace}`
    : `/clusterapi/${memberClusterName}/api/v1/configmap`;
  const requestData = { ...queryParams } as DataSelectQuery;
  if (keyword) {
    requestData.filterBy = ['name', keyword];
  }
  const resp = await karmadaMemberClusterClient.get<{
      errors: string[];
      listMeta: {
        totalItems: number;
      };
      items: ConfigMap[];
    }>(url, {
    params: convertDataSelectQuery(requestData),
  });
  return resp.data;
}

export async function GetMemberClusterConfigMapDetail(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
}) {
  const { memberClusterName, namespace, name } = params;
  const resp = await karmadaMemberClusterClient.get<{
        errors: string[];
      } & ConfigMapDetail>(`/clusterapi/${memberClusterName}/api/v1/configmap/${namespace}/${name}`);
  return resp.data;
}

// Member Cluster Secret APIs
export async function GetMemberClusterSecrets(params: {
  memberClusterName: string;
  namespace?: string;
  keyword?: string;
  filterBy?: string[];
  sortBy?: string[];
  itemsPerPage?: number;
  page?: number;
}) {
  const { memberClusterName, namespace, keyword, ...queryParams } = params;
  const url = namespace
    ? `/clusterapi/${memberClusterName}/api/v1/secret/${namespace}`
    : `/clusterapi/${memberClusterName}/api/v1/secret`;
  const requestData = { ...queryParams } as DataSelectQuery;
  if (keyword) {
    requestData.filterBy = ['name', keyword];
  }
  const resp = await karmadaMemberClusterClient.get<
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

export async function GetMemberClusterSecretDetail(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
}) {
  const { memberClusterName, namespace, name } = params;
  const resp = await karmadaMemberClusterClient.get<{
        errors: string[];
      } & SecretDetail>(`/clusterapi/${memberClusterName}/api/v1/secret/${namespace}/${name}`);
  return resp;
}

export async function CreateMemberClusterImagePullSecret(params: {
  memberClusterName: string;
  spec: ImagePullSecretSpec;
}) {
  const { memberClusterName, spec } = params;
  const resp = await karmadaMemberClusterClient.post<Secret>(
    `/clusterapi/${memberClusterName}/api/v1/secret`,
    spec,
  );
  return resp.data;
}
