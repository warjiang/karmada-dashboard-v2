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

import { karmadaMemberClusterClient } from '../base';

export interface AppDeploymentSpec {
  name: string;
  namespace: string;
  containerImage: string;
  replicas: number;
  description?: string;
  portMappings?: PortMapping[];
  variables?: EnvironmentVariable[];
  labels?: Record<string, string>;
  cpu?: string;
  memory?: string;
  runAsPrivileged?: boolean;
}

export interface PortMapping {
  port: number;
  targetPort?: number;
  protocol: string;
}

export interface EnvironmentVariable {
  name: string;
  value: string;
}

export interface AppDeploymentFromFileSpec {
  name: string;
  namespace: string;
  content: string;
  validate?: boolean;
}

export interface ValidationResponse {
  valid: boolean;
  detail?: string;
}

export async function CreateAppDeployment(spec: AppDeploymentSpec) {
  const resp = await karmadaMemberClusterClient.post<any>('/appdeployment', spec);
  return resp;
}

export async function CreateAppDeploymentFromFile(spec: AppDeploymentFromFileSpec) {
  const resp = await karmadaMemberClusterClient.post<any>('/appdeploymentfromfile', spec);
  return resp;
}

export async function GetProtocols() {
  const resp = await karmadaMemberClusterClient.get<{
    protocols: string[];
  }>('/appdeployment/protocols');
  return resp;
}

export async function ValidateImageReference(imageReference: string) {
  const resp = await karmadaMemberClusterClient.post<ValidationResponse>('/appdeployment/validate/imagereference', { imageReference });
  return resp;
}

export async function ValidateAppName(name: string, namespace?: string) {
  const resp = await karmadaMemberClusterClient.post<ValidationResponse>('/appdeployment/validate/name', { name, namespace });
  return resp;
}

export async function ValidateProtocol(protocol: string) {
  const resp = await karmadaMemberClusterClient.post<ValidationResponse>('/appdeployment/validate/protocol', { protocol });
  return resp;
}