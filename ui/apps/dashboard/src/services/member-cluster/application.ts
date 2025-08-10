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
  IResponse,
  karmadaClient,
} from '../base';

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
  const resp = await karmadaClient.post<
    IResponse<any>
  >('/appdeployment', spec);
  return resp.data;
}

export async function CreateAppDeploymentFromFile(spec: AppDeploymentFromFileSpec) {
  const resp = await karmadaClient.post<
    IResponse<any>
  >('/appdeploymentfromfile', spec);
  return resp.data;
}

export async function GetProtocols() {
  const resp = await karmadaClient.get<
    IResponse<{
      protocols: string[];
    }>
  >('/appdeployment/protocols');
  return resp.data;
}

export async function ValidateImageReference(imageReference: string) {
  const resp = await karmadaClient.post<
    IResponse<ValidationResponse>
  >('/appdeployment/validate/imagereference', { imageReference });
  return resp.data;
}

export async function ValidateAppName(name: string, namespace?: string) {
  const resp = await karmadaClient.post<
    IResponse<ValidationResponse>
  >('/appdeployment/validate/name', { name, namespace });
  return resp.data;
}

export async function ValidateProtocol(protocol: string) {
  const resp = await karmadaClient.post<
    IResponse<ValidationResponse>
  >('/appdeployment/validate/protocol', { protocol });
  return resp.data;
}