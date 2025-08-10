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

export interface PolicyRule {
  verbs: string[];
  resources: string[];
  resourceNames?: string[];
  apiGroups: string[];
}

export interface Role {
  objectMeta: ObjectMeta;
  typeMeta: TypeMeta;
  rules: PolicyRule[];
}

export interface RoleBinding {
  objectMeta: ObjectMeta;
  typeMeta: TypeMeta;
  subjects: Subject[];
  roleRef: RoleRef;
}

export interface Subject {
  kind: string;
  name: string;
  namespace?: string;
}

export interface RoleRef {
  apiGroup: string;
  kind: string;
  name: string;
}

export interface ClusterRole {
  objectMeta: ObjectMeta;
  typeMeta: TypeMeta;
  rules: PolicyRule[];
}

export interface ClusterRoleBinding {
  objectMeta: ObjectMeta;
  typeMeta: TypeMeta;
  subjects: Subject[];
  roleRef: RoleRef;
}

export interface ServiceAccount {
  objectMeta: ObjectMeta;
  typeMeta: TypeMeta;
  secrets: any[];
  imagePullSecrets: any[];
}

// Role APIs
export async function GetRoles(params?: {
  namespace?: string;
  keyword?: string;
  filterBy?: string[];
  sortBy?: string[];
  itemsPerPage?: number;
  page?: number;
}) {
  const { namespace, keyword, ...queryParams } = params || {};
  const url = namespace ? `/role/${namespace}` : `/role`;
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
      roles: Role[];
    }>
  >(url, {
    params: convertDataSelectQuery(requestData),
  });
  return resp.data;
}

export async function GetRoleDetail(params: {
  namespace: string;
  name: string;
}) {
  const { namespace, name } = params;
  const resp = await karmadaClient.get<
    IResponse<
      {
        errors: string[];
      } & Role
    >
  >(`/role/${namespace}/${name}`);
  return resp.data;
}

// RoleBinding APIs
export async function GetRoleBindings(params?: {
  namespace?: string;
  keyword?: string;
  filterBy?: string[];
  sortBy?: string[];
  itemsPerPage?: number;
  page?: number;
}) {
  const { namespace, keyword, ...queryParams } = params || {};
  const url = namespace ? `/rolebinding/${namespace}` : `/rolebinding`;
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
      roleBindings: RoleBinding[];
    }>
  >(url, {
    params: convertDataSelectQuery(requestData),
  });
  return resp.data;
}

export async function GetRoleBindingDetail(params: {
  namespace: string;
  name: string;
}) {
  const { namespace, name } = params;
  const resp = await karmadaClient.get<
    IResponse<
      {
        errors: string[];
      } & RoleBinding
    >
  >(`/rolebinding/${namespace}/${name}`);
  return resp.data;
}

// ClusterRole APIs
export async function GetClusterRoles(params?: {
  keyword?: string;
  filterBy?: string[];
  sortBy?: string[];
  itemsPerPage?: number;
  page?: number;
}) {
  const { keyword, ...queryParams } = params || {};
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
      clusterRoles: ClusterRole[];
    }>
  >('/clusterrole', {
    params: convertDataSelectQuery(requestData),
  });
  return resp.data;
}

export async function GetClusterRoleDetail(name: string) {
  const resp = await karmadaClient.get<
    IResponse<
      {
        errors: string[];
      } & ClusterRole
    >
  >(`/clusterrole/${name}`);
  return resp.data;
}

// ClusterRoleBinding APIs
export async function GetClusterRoleBindings(params?: {
  keyword?: string;
  filterBy?: string[];
  sortBy?: string[];
  itemsPerPage?: number;
  page?: number;
}) {
  const { keyword, ...queryParams } = params || {};
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
      clusterRoleBindings: ClusterRoleBinding[];
    }>
  >('/clusterrolebinding', {
    params: convertDataSelectQuery(requestData),
  });
  return resp.data;
}

export async function GetClusterRoleBindingDetail(name: string) {
  const resp = await karmadaClient.get<
    IResponse<
      {
        errors: string[];
      } & ClusterRoleBinding
    >
  >(`/clusterrolebinding/${name}`);
  return resp.data;
}

// ServiceAccount APIs
export async function GetServiceAccounts(params?: {
  namespace?: string;
  keyword?: string;
  filterBy?: string[];
  sortBy?: string[];
  itemsPerPage?: number;
  page?: number;
}) {
  const { namespace, keyword, ...queryParams } = params || {};
  const url = namespace ? `/serviceaccount/${namespace}` : `/serviceaccount`;
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
      serviceAccounts: ServiceAccount[];
    }>
  >(url, {
    params: convertDataSelectQuery(requestData),
  });
  return resp.data;
}

export async function GetServiceAccountDetail(params: {
  namespace: string;
  name: string;
}) {
  const { namespace, name } = params;
  const resp = await karmadaClient.get<
    IResponse<
      {
        errors: string[];
      } & ServiceAccount
    >
  >(`/serviceaccount/${namespace}/${name}`);
  return resp.data;
}

export async function GetServiceAccountSecrets(params: {
  namespace: string;
  name: string;
}) {
  const { namespace, name } = params;
  const resp = await karmadaClient.get<
    IResponse<{
      secrets: any[];
    }>
  >(`/serviceaccount/${namespace}/${name}/secret`);
  return resp.data;
}

export async function GetServiceAccountImagePullSecrets(params: {
  namespace: string;
  name: string;
}) {
  const { namespace, name } = params;
  const resp = await karmadaClient.get<
    IResponse<{
      secrets: any[];
    }>
  >(`/serviceaccount/${namespace}/${name}/imagepullsecret`);
  return resp.data;
}