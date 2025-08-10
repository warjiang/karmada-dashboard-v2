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

export interface NetworkPolicy {
  objectMeta: ObjectMeta;
  typeMeta: TypeMeta;
  spec: NetworkPolicySpec;
}

export interface NetworkPolicySpec {
  podSelector: any;
  policyTypes: string[];
  ingress: NetworkPolicyIngressRule[];
  egress: NetworkPolicyEgressRule[];
}

export interface NetworkPolicyIngressRule {
  ports: NetworkPolicyPort[];
  from: NetworkPolicyPeer[];
}

export interface NetworkPolicyEgressRule {
  ports: NetworkPolicyPort[];
  to: NetworkPolicyPeer[];
}

export interface NetworkPolicyPort {
  protocol: string;
  port: string | number;
  endPort?: number;
}

export interface NetworkPolicyPeer {
  podSelector?: any;
  namespaceSelector?: any;
  ipBlock?: IPBlock;
}

export interface IPBlock {
  cidr: string;
  except: string[];
}

export interface IngressClass {
  objectMeta: ObjectMeta;
  typeMeta: TypeMeta;
  spec: IngressClassSpec;
}

export interface IngressClassSpec {
  controller: string;
  parameters?: IngressClassParametersReference;
}

export interface IngressClassParametersReference {
  apiGroup?: string;
  kind: string;
  name: string;
  scope?: string;
  namespace?: string;
}

// NetworkPolicy APIs
export async function GetNetworkPolicies(params?: {
  namespace?: string;
  keyword?: string;
  filterBy?: string[];
  sortBy?: string[];
  itemsPerPage?: number;
  page?: number;
}) {
  const { namespace, keyword, ...queryParams } = params || {};
  const url = namespace ? `/networkpolicy/${namespace}` : `/networkpolicy`;
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
      networkPolicies: NetworkPolicy[];
    }>
  >(url, {
    params: convertDataSelectQuery(requestData),
  });
  return resp.data;
}

export async function GetNetworkPolicyDetail(params: {
  namespace: string;
  name: string;
}) {
  const { namespace, name } = params;
  const resp = await karmadaClient.get<
    IResponse<
      {
        errors: string[];
      } & NetworkPolicy
    >
  >(`/networkpolicy/${namespace}/${name}`);
  return resp.data;
}

// IngressClass APIs
export async function GetIngressClasses(params?: {
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
      ingressClasses: IngressClass[];
    }>
  >('/ingressclass', {
    params: convertDataSelectQuery(requestData),
  });
  return resp.data;
}

export async function GetIngressClassDetail(name: string) {
  const resp = await karmadaClient.get<
    IResponse<
      {
        errors: string[];
      } & IngressClass
    >
  >(`/ingressclass/${name}`);
  return resp.data;
}