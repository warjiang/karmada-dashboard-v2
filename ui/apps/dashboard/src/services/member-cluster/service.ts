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
  enhancedMemberClusterClient,
  ObjectMeta,
  Selector,
  TypeMeta,
  ServiceResource,
  IngressResource,
  Endpoint,
} from '../base';
import { GetResourceEvents } from './events';

// Legacy interfaces for backward compatibility
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

// Legacy Service interface for backward compatibility
export interface Service {
  objectMeta: ObjectMeta;
  typeMeta: TypeMeta;
  internalEndpoint: Endpoint;
  externalEndpoints: Endpoint[];
  selector: Selector;
  type: ServiceType;
  clusterIP: string;
}

// Legacy Ingress interface for backward compatibility
export interface Ingress {
  objectMeta: ObjectMeta;
  typeMeta: TypeMeta;
  selector: Selector;
}

// Enhanced Service functions using enhancedMemberClusterClient

export async function GetMemberClusterServices(params: {
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
    ? `/clusterapi/${memberClusterName}/api/v1/service/${namespace}`
    : `/clusterapi/${memberClusterName}/api/v1/service`;
  
  const requestData = { ...queryParams } as DataSelectQuery;
  if (keyword) {
    requestData.filterBy = ['name', keyword];
  }
  
  const resp = await enhancedMemberClusterClient.get<
    IResponse<{
      errors: string[];
      listMeta: {
        totalItems: number;
      };
      services: ServiceResource[];
    }>
  >(url, {
    params: convertDataSelectQuery(requestData),
  });
  return resp;
}

export async function GetMemberClusterServiceDetail(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
}) {
  const { memberClusterName, namespace, name } = params;
  const resp = await enhancedMemberClusterClient.get<
    IResponse<
      {
        errors: string[];
      } & ServiceResource & { endpoints?: Endpoint[] }
    >
  >(`/clusterapi/${memberClusterName}/api/v1/service/${namespace}/${name}`);
  return resp;
}

export async function CreateMemberClusterService(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
  content: string;
}) {
  const { memberClusterName, ...serviceParams } = params;
  const resp = await enhancedMemberClusterClient.post<
    IResponse<ServiceResource>
  >(`/clusterapi/${memberClusterName}/api/v1/service`, serviceParams);
  return resp;
}

export async function UpdateMemberClusterService(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
  content: string;
}) {
  const { memberClusterName, namespace, name, content } = params;
  const resp = await enhancedMemberClusterClient.put<IResponse<ServiceResource>>(
    `/clusterapi/${memberClusterName}/api/v1/service/${namespace}/${name}`,
    { content }
  );
  return resp;
}

export async function DeleteMemberClusterService(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
  gracePeriodSeconds?: number;
}) {
  const { memberClusterName, namespace, name, gracePeriodSeconds } = params;
  const resp = await enhancedMemberClusterClient.delete<IResponse<any>>(
    `/clusterapi/${memberClusterName}/api/v1/service/${namespace}/${name}`,
    { params: { gracePeriodSeconds } }
  );
  return resp;
}

export async function GetMemberClusterServiceEvents(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
}) {
  const { memberClusterName, namespace, name } = params;
  
  // Use the generic event service
  const response = await GetResourceEvents({
    memberClusterName,
    namespace,
    name,
    resourceType: 'service',
    limit: 100,
  });

  return {
    data: {
      events: response.events || [],
      listMeta: response.listMeta || { totalItems: 0 },
      errors: response.errors || [],
    }
  };
}

export async function GetMemberClusterServiceIngresses(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
}) {
  const { memberClusterName, namespace, name } = params;
  const resp = await enhancedMemberClusterClient.get<
    IResponse<{
      errors: string[];
      listMeta: {
        totalItems: number;
      };
      ingresses: IngressResource[];
    }>
  >(
    `/clusterapi/${memberClusterName}/api/v1/service/${namespace}/${name}/ingress`,
  );
  return resp;
}

export async function GetMemberClusterServicePods(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
}) {
  const { memberClusterName, namespace, name } = params;
  const resp = await enhancedMemberClusterClient.get<
    IResponse<{
      errors: string[];
      listMeta: {
        totalItems: number;
      };
      pods: any[];
    }>
  >(`/clusterapi/${memberClusterName}/api/v1/service/${namespace}/${name}/pod`);
  return resp;
}

// Enhanced Ingress functions using enhancedMemberClusterClient

export async function GetMemberClusterIngress(params: {
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
    ? `/clusterapi/${memberClusterName}/api/v1/ingress/${namespace}`
    : `/clusterapi/${memberClusterName}/api/v1/ingress`;
  
  const requestData = { ...queryParams } as DataSelectQuery;
  if (keyword) {
    requestData.filterBy = ['name', keyword];
  }
  
  const resp = await enhancedMemberClusterClient.get<
    IResponse<{
      errors: string[];
      listMeta: {
        totalItems: number;
      };
      items: IngressResource[];
    }>
  >(url, {
    params: convertDataSelectQuery(requestData),
  });
  return resp;
}

export async function GetMemberClusterIngressDetail(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
}) {
  const { memberClusterName, namespace, name } = params;
  const resp = await enhancedMemberClusterClient.get<
    IResponse<
      {
        errors: string[];
      } & IngressResource
    >
  >(`/clusterapi/${memberClusterName}/api/v1/ingress/${namespace}/${name}`);
  return resp;
}

export async function CreateMemberClusterIngress(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
  content: string;
}) {
  const { memberClusterName, ...ingressParams } = params;
  const resp = await enhancedMemberClusterClient.post<
    IResponse<IngressResource>
  >(`/clusterapi/${memberClusterName}/api/v1/ingress`, ingressParams);
  return resp;
}

export async function UpdateMemberClusterIngress(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
  content: string;
}) {
  const { memberClusterName, namespace, name, content } = params;
  const resp = await enhancedMemberClusterClient.put<IResponse<IngressResource>>(
    `/clusterapi/${memberClusterName}/api/v1/ingress/${namespace}/${name}`,
    { content }
  );
  return resp;
}

export async function DeleteMemberClusterIngress(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
  gracePeriodSeconds?: number;
}) {
  const { memberClusterName, namespace, name, gracePeriodSeconds } = params;
  const resp = await enhancedMemberClusterClient.delete<IResponse<any>>(
    `/clusterapi/${memberClusterName}/api/v1/ingress/${namespace}/${name}`,
    { params: { gracePeriodSeconds } }
  );
  return resp;
}

export async function GetMemberClusterIngressEvents(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
}) {
  const { memberClusterName, namespace, name } = params;
  
  // Use the generic event service
  const response = await GetResourceEvents({
    memberClusterName,
    namespace,
    name,
    resourceType: 'ingress',
    limit: 100,
  });

  return {
    data: {
      events: response.events || [],
      listMeta: response.listMeta || { totalItems: 0 },
      errors: response.errors || [],
    }
  };
}