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
  karmadaMemberClusterClient,
  ObjectMeta,
  TypeMeta,
} from '../base';

export interface LocalObjectReference {
  name: string;
}

export interface ServiceAccount {
  objectMeta: ObjectMeta;
  typeMeta: TypeMeta;
  secrets?: LocalObjectReference[];
  imagePullSecrets?: LocalObjectReference[];
  automountServiceAccountToken?: boolean;
}

export async function GetMemberClusterServiceAccount(params: {
  memberClusterName: string;
  namespace?: string;
  keyword?: string;
}) {
  const { memberClusterName, namespace, keyword } = params;
  const url = namespace
    ? `/clusterapi/${memberClusterName}/api/v1/serviceaccount/${namespace}`
    : `/clusterapi/${memberClusterName}/api/v1/serviceaccount`;
  const requestData = {} as DataSelectQuery;
  if (keyword) {
    requestData.filterBy = ['name', keyword];
  }
  const resp = await karmadaMemberClusterClient.get<{
      errors: string[];
      listMeta: {
        totalItems: number;
      };
      items: ServiceAccount[];
    }>(url, {
    params: convertDataSelectQuery(requestData),
  });
  return resp.data;
}

export async function GetMemberClusterServiceAccountDetail(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
}) {
  const { memberClusterName, namespace, name } = params;
  const resp = await karmadaMemberClusterClient.get<{
        errors: string[];
      } & ServiceAccount>(`/clusterapi/${memberClusterName}/api/v1/serviceaccount/${namespace}/${name}`);
  return resp.data;
}
