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
  Selector,
  TypeMeta,
} from '../base';

export enum Protocol {
  TCP = 'TCP',
  UDP = 'UDP',
  SCTP = 'SCTP',
}

export enum ServiceType {
  ClusterIP = 'ClusterIP',
  NodePort = 'NodePort',
  LoadBalancer = 'LoadBalancer',
  ExternalName = 'ExternalName',
}

export interface ServicePort {
  port: number;
  protocol: Protocol;
  nodePort: number;
}

export interface Endpoint {
  host: string;
  ports: ServicePort[];
}

export interface Service {
  objectMeta: ObjectMeta;
  typeMeta: TypeMeta;
  internalEndpoint: Endpoint;
  externalEndpoints: Endpoint[];
  selector: Selector;
  type: ServiceType;
  clusterIP: string;
}

export async function GetMemberClusterServices(params: {
  memberClusterName: string;
  namespace?: string;
  keyword?: string;
}) {
  const { memberClusterName, namespace, keyword } = params;
  const url = namespace
    ? `/clusterapi/${memberClusterName}/api/v1/service/${namespace}`
    : `/clusterapi/${memberClusterName}/api/v1/service`;
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
      services: Service[];
    }>
  >(url, {
    params: convertDataSelectQuery(requestData),
  });
  return resp.data;
}

export interface Ingress {
  objectMeta: ObjectMeta;
  typeMeta: TypeMeta;
  selector: Selector;
}
export async function GetMemberClusterIngress(params: {
  memberClusterName: string;
  namespace?: string;
  keyword?: string;
}) {
  const { memberClusterName, namespace, keyword } = params;
  const url = namespace
    ? `/clusterapi/${memberClusterName}/api/v1/ingress/${namespace}`
    : `/clusterapi/${memberClusterName}/api/v1/ingress`;
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
      items: Ingress[];
    }>
  >(url, {
    params: convertDataSelectQuery(requestData),
  });
  return resp.data;
}

export async function GetMemberClusterServiceDetail(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
}) {
  const { memberClusterName, namespace, name } = params;
  const resp = await karmadaClient.get<
    IResponse<
      {
        errors: string[];
      } & Service
    >
  >(`/clusterapi/${memberClusterName}/api/v1/service/${namespace}/${name}`);
  return resp.data;
}

export async function GetMemberClusterServiceEvents(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
}) {
  const { memberClusterName, namespace, name } = params;
  const resp = await karmadaClient.get<
    IResponse<{
      errors: string[];
      listMeta: {
        totalItems: number;
      };
      events: any[];
    }>
  >(
    `/clusterapi/${memberClusterName}/api/v1/service/${namespace}/${name}/event`,
  );
  return resp.data;
}

export async function GetMemberClusterServiceIngresses(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
}) {
  const { memberClusterName, namespace, name } = params;
  const resp = await karmadaClient.get<
    IResponse<{
      errors: string[];
      listMeta: {
        totalItems: number;
      };
      ingresses: Ingress[];
    }>
  >(
    `/clusterapi/${memberClusterName}/api/v1/service/${namespace}/${name}/ingress`,
  );
  return resp.data;
}

export async function GetMemberClusterServicePods(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
}) {
  const { memberClusterName, namespace, name } = params;
  const resp = await karmadaClient.get<
    IResponse<{
      errors: string[];
      listMeta: {
        totalItems: number;
      };
      pods: any[];
    }>
  >(`/clusterapi/${memberClusterName}/api/v1/service/${namespace}/${name}/pod`);
  return resp.data;
}

export async function GetMemberClusterIngressDetail(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
}) {
  const { memberClusterName, namespace, name } = params;
  const resp = await karmadaClient.get<
    IResponse<
      {
        errors: string[];
      } & Ingress
    >
  >(`/clusterapi/${memberClusterName}/api/v1/ingress/${namespace}/${name}`);
  return resp.data;
}

export async function GetMemberClusterIngressEvents(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
}) {
  const { memberClusterName, namespace, name } = params;
  const resp = await karmadaClient.get<
    IResponse<{
      errors: string[];
      listMeta: {
        totalItems: number;
      };
      events: any[];
    }>
  >(
    `/clusterapi/${memberClusterName}/api/v1/ingress/${namespace}/${name}/event`,
  );
  return resp.data;
}
