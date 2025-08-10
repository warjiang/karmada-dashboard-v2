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

export interface PersistentVolume {
  objectMeta: ObjectMeta;
  typeMeta: TypeMeta;
  status: string;
  claim: string;
  reason: string;
  reclaimPolicy: string;
  accessModes: string[];
  capacity: Record<string, string>;
  storageClass: string;
}

export interface PersistentVolumeClaim {
  objectMeta: ObjectMeta;
  typeMeta: TypeMeta;
  status: string;
  volume: string;
  capacity: Record<string, string>;
  accessModes: string[];
  storageClass: string;
}

export interface StorageClass {
  objectMeta: ObjectMeta;
  typeMeta: TypeMeta;
  provisioner: string;
  parameters: Record<string, string>;
  reclaimPolicy: string;
  allowVolumeExpansion: boolean;
  volumeBindingMode: string;
}

// PersistentVolume APIs
export async function GetPersistentVolumes(params?: {
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
      persistentVolumes: PersistentVolume[];
    }>
  >('/persistentvolume', {
    params: convertDataSelectQuery(requestData),
  });
  return resp.data;
}

export async function GetPersistentVolumeDetail(name: string) {
  const resp = await karmadaClient.get<
    IResponse<
      {
        errors: string[];
      } & PersistentVolume
    >
  >(`/persistentvolume/${name}`);
  return resp.data;
}

export async function GetPersistentVolumeDetailWithNamespace(params: {
  namespace: string;
  name: string;
}) {
  const { namespace, name } = params;
  const resp = await karmadaClient.get<
    IResponse<
      {
        errors: string[];
      } & PersistentVolume
    >
  >(`/persistentvolume/namespace/${namespace}/name/${name}`);
  return resp.data;
}

// PersistentVolumeClaim APIs
export async function GetPersistentVolumeClaims(params?: {
  namespace?: string;
  keyword?: string;
  filterBy?: string[];
  sortBy?: string[];
  itemsPerPage?: number;
  page?: number;
}) {
  const { namespace, keyword, ...queryParams } = params || {};
  const url = namespace ? `/persistentvolumeclaim/${namespace}` : `/persistentvolumeclaim`;
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
      persistentVolumeClaims: PersistentVolumeClaim[];
    }>
  >(url, {
    params: convertDataSelectQuery(requestData),
  });
  return resp.data;
}

export async function GetPersistentVolumeClaimDetail(params: {
  namespace: string;
  name: string;
}) {
  const { namespace, name } = params;
  const resp = await karmadaClient.get<
    IResponse<
      {
        errors: string[];
      } & PersistentVolumeClaim
    >
  >(`/persistentvolumeclaim/${namespace}/${name}`);
  return resp.data;
}

// StorageClass APIs
export async function GetStorageClasses(params?: {
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
      storageClasses: StorageClass[];
    }>
  >('/storageclass', {
    params: convertDataSelectQuery(requestData),
  });
  return resp.data;
}

export async function GetStorageClassDetail(name: string) {
  const resp = await karmadaClient.get<
    IResponse<
      {
        errors: string[];
      } & StorageClass
    >
  >(`/storageclass/${name}`);
  return resp.data;
}

export async function GetStorageClassPersistentVolumes(name: string) {
  const resp = await karmadaClient.get<
    IResponse<{
      errors: string[];
      listMeta: {
        totalItems: number;
      };
      persistentVolumes: PersistentVolume[];
    }>
  >(`/storageclass/${name}/persistentvolume`);
  return resp.data;
}