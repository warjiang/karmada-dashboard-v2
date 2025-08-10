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

export interface ScaleResource {
  replicas: number;
}

export async function GetResourceScale(params: {
  kind: string;
  namespace?: string;
  name: string;
}) {
  const { kind, namespace, name } = params;
  const url = namespace ? `/scale/${kind}/${namespace}/${name}` : `/scale/${kind}/${name}`;
  const resp = await karmadaClient.get<
    IResponse<ScaleResource>
  >(url);
  return resp.data;
}

export async function ScaleResource(params: {
  kind: string;
  namespace?: string;
  name: string;
  replicas: number;
}) {
  const { kind, namespace, name, replicas } = params;
  const url = namespace ? `/scale/${kind}/${namespace}/${name}` : `/scale/${kind}/${name}`;
  const resp = await karmadaClient.put<
    IResponse<ScaleResource>
  >(url, { replicas });
  return resp.data;
}