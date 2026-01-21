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
  TypeMeta,
  ConfigMapResource,
  SecretResource,
  PersistentVolumeClaimResource,
} from '../base';
import { GetResourceEvents } from './events';

// Legacy interfaces for backward compatibility
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

// Enhanced ConfigMap functions using enhancedMemberClusterClient

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
  
  const resp = await enhancedMemberClusterClient.get<
    IResponse<{
      errors: string[];
      listMeta: {
        totalItems: number;
      };
      configMaps: ConfigMapResource[];
    }>
  >(url, {
    params: convertDataSelectQuery(requestData),
  });
  return resp;
}

export async function GetMemberClusterConfigMapDetail(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
}) {
  const { memberClusterName, namespace, name } = params;
  const resp = await enhancedMemberClusterClient.get<
    IResponse<
      {
        errors: string[];
      } & ConfigMapResource & { keys?: string[] }
    >
  >(`/clusterapi/${memberClusterName}/api/v1/configmap/${namespace}/${name}`);
  return resp;
}

export async function CreateMemberClusterConfigMap(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
  content: string;
}) {
  const { memberClusterName, ...configMapParams } = params;
  const resp = await enhancedMemberClusterClient.post<
    IResponse<ConfigMapResource>
  >(`/clusterapi/${memberClusterName}/api/v1/configmap`, configMapParams);
  return resp;
}

export async function UpdateMemberClusterConfigMap(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
  content: string;
}) {
  const { memberClusterName, namespace, name, content } = params;
  const resp = await enhancedMemberClusterClient.put<IResponse<ConfigMapResource>>(
    `/clusterapi/${memberClusterName}/api/v1/configmap/${namespace}/${name}`,
    { content }
  );
  return resp;
}

export async function DeleteMemberClusterConfigMap(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
  gracePeriodSeconds?: number;
}) {
  const { memberClusterName, namespace, name, gracePeriodSeconds } = params;
  const resp = await enhancedMemberClusterClient.delete<IResponse<any>>(
    `/clusterapi/${memberClusterName}/api/v1/configmap/${namespace}/${name}`,
    { params: { gracePeriodSeconds } }
  );
  return resp;
}

export async function GetMemberClusterConfigMapEvents(params: {
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
    resourceType: 'configmap',
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

// Enhanced Secret functions using enhancedMemberClusterClient

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
  
  const resp = await enhancedMemberClusterClient.get<
    IResponse<{
      errors: string[];
      listMeta: {
        totalItems: number;
      };
      secrets: SecretResource[];
    }>
  >(url, {
    params: convertDataSelectQuery(requestData),
  });
  return resp;
}

export async function GetMemberClusterSecretDetail(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
}) {
  const { memberClusterName, namespace, name } = params;
  const resp = await enhancedMemberClusterClient.get<
    IResponse<
      {
        errors: string[];
      } & SecretResource & { keys?: string[] }
    >
  >(`/clusterapi/${memberClusterName}/api/v1/secret/${namespace}/${name}`);
  return resp;
}

export async function CreateMemberClusterSecret(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
  content: string;
}) {
  const { memberClusterName, ...secretParams } = params;
  const resp = await enhancedMemberClusterClient.post<
    IResponse<SecretResource>
  >(`/clusterapi/${memberClusterName}/api/v1/secret`, secretParams);
  return resp;
}

export async function UpdateMemberClusterSecret(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
  content: string;
}) {
  const { memberClusterName, namespace, name, content } = params;
  const resp = await enhancedMemberClusterClient.put<IResponse<SecretResource>>(
    `/clusterapi/${memberClusterName}/api/v1/secret/${namespace}/${name}`,
    { content }
  );
  return resp;
}

export async function DeleteMemberClusterSecret(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
  gracePeriodSeconds?: number;
}) {
  const { memberClusterName, namespace, name, gracePeriodSeconds } = params;
  const resp = await enhancedMemberClusterClient.delete<IResponse<any>>(
    `/clusterapi/${memberClusterName}/api/v1/secret/${namespace}/${name}`,
    { params: { gracePeriodSeconds } }
  );
  return resp;
}

export async function GetMemberClusterSecretEvents(params: {
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
    resourceType: 'secret',
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

// Enhanced ImagePullSecret function using enhancedMemberClusterClient
export async function CreateMemberClusterImagePullSecret(params: {
  memberClusterName: string;
  spec: ImagePullSecretSpec;
}) {
  const { memberClusterName, spec } = params;
  const resp = await enhancedMemberClusterClient.post<IResponse<SecretResource>>(
    `/clusterapi/${memberClusterName}/api/v1/secret`,
    spec,
  );
  return resp;
}

// Enhanced PVC functions using enhancedMemberClusterClient

export async function GetMemberClusterPVCs(params: {
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
    ? `/clusterapi/${memberClusterName}/api/v1/persistentvolumeclaim/${namespace}`
    : `/clusterapi/${memberClusterName}/api/v1/persistentvolumeclaim`;
  
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
      persistentVolumeClaims: PersistentVolumeClaimResource[];
    }>
  >(url, {
    params: convertDataSelectQuery(requestData),
  });
  return resp;
}

export async function GetMemberClusterPVCDetail(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
}) {
  const { memberClusterName, namespace, name } = params;
  const resp = await enhancedMemberClusterClient.get<
    IResponse<
      {
        errors: string[];
      } & PersistentVolumeClaimResource & { 
        mountedPods?: string[];
        volumeInfo?: {
          volumeName?: string;
          storageClass?: string;
          capacity?: Record<string, string>;
        };
      }
    >
  >(`/clusterapi/${memberClusterName}/api/v1/persistentvolumeclaim/${namespace}/${name}`);
  return resp;
}

export async function CreateMemberClusterPVC(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
  content: string;
}) {
  const { memberClusterName, ...pvcParams } = params;
  const resp = await enhancedMemberClusterClient.post<
    IResponse<PersistentVolumeClaimResource>
  >(`/clusterapi/${memberClusterName}/api/v1/persistentvolumeclaim`, pvcParams);
  return resp;
}

export async function UpdateMemberClusterPVC(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
  content: string;
}) {
  const { memberClusterName, namespace, name, content } = params;
  const resp = await enhancedMemberClusterClient.put<IResponse<PersistentVolumeClaimResource>>(
    `/clusterapi/${memberClusterName}/api/v1/persistentvolumeclaim/${namespace}/${name}`,
    { content }
  );
  return resp;
}

export async function DeleteMemberClusterPVC(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
  gracePeriodSeconds?: number;
}) {
  const { memberClusterName, namespace, name, gracePeriodSeconds } = params;
  const resp = await enhancedMemberClusterClient.delete<IResponse<any>>(
    `/clusterapi/${memberClusterName}/api/v1/persistentvolumeclaim/${namespace}/${name}`,
    { params: { gracePeriodSeconds } }
  );
  return resp;
}

export async function GetMemberClusterPVCEvents(params: {
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
    resourceType: 'persistentvolumeclaim',
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

export async function GetMemberClusterPVCPods(params: {
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
  >(`/clusterapi/${memberClusterName}/api/v1/persistentvolumeclaim/${namespace}/${name}/pod`);
  return resp;
}

// Export enhanced resource interfaces for use in components
export type { ConfigMapResource, SecretResource, PersistentVolumeClaimResource };