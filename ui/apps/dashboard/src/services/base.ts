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

import axios from 'axios';
import _ from 'lodash';

let pathPrefix = window.__path_prefix__ || '';
if (!pathPrefix.startsWith('/')) {
  pathPrefix = '/' + pathPrefix;
}
if (!pathPrefix.endsWith('/')) {
  pathPrefix = pathPrefix + '/';
}
export const routerBase = pathPrefix;
const baseURL: string = _.join([pathPrefix, 'api/v1'], '');
const memberclusterBaseURL: string = pathPrefix;

export const karmadaClient = axios.create({
  baseURL,
});

export const karmadaMemberClusterClient = axios.create({
  baseURL: memberclusterBaseURL,
});

export interface IResponse<Data = {}> {
  code: number;
  message: string;
  data: Data;
}

export interface DataSelectQuery {
  filterBy?: string[];
  sortBy?: string[];
  itemsPerPage?: number;
  page?: number;
}
export const convertDataSelectQuery = (query: DataSelectQuery) => {
  const dsQuery = {} as Record<string, string | number>;
  if (query.filterBy) {
    dsQuery['filterBy'] = query.filterBy.join(',');
  }
  if (query.sortBy) {
    dsQuery['sortBy'] = query.sortBy.join(',');
  }
  if (query.itemsPerPage) {
    dsQuery['itemsPerPage'] = query.itemsPerPage;
  }
  if (query.page) {
    dsQuery['page'] = query.page;
  }
  return dsQuery;
};

export type Labels = Record<string, string>;
export type Annotations = Record<string, string>;

export interface ObjectMeta {
  name: string;
  namespace: string;
  labels: Labels;
  annotations: Annotations;
  creationTimestamp: string;
  uid: string;
}

export interface TypeMeta {
  kind: string;
  scalable: boolean;
  restartable: boolean;
}
export type Selector = Record<string, string>;

export interface RollingUpdateStrategy {
  maxSurge: string;
  maxUnavailable: string;
}

export enum WorkloadKind {
  Unknown = '',
  Deployment = 'deployment',
  Statefulset = 'statefulset',
  Daemonset = 'daemonset',
  Cronjob = 'cronjob',
  Job = 'job',
}

export enum ServiceKind {
  Unknown = '',
  Ingress = 'ingress',
  Service = 'service',
}

export enum ConfigKind {
  Unknown = '',
  Secret = 'secret',
  ConfigMap = 'configmap',
  PersistentVolumeClaim = 'persistentvolumeclaim',
}

export enum PolicyScope {
  Namespace = 'namespace-scope',
  Cluster = 'cluster-scope',
}

export enum Mode {
  Create = 'create',
  Edit = 'edit',
  Detail = 'detail',
}

export const propagationpolicyKey = 'propagationpolicy.karmada.io/name';
// safely extract propagationpolicy
export const extractPropagationPolicy = (r: { objectMeta: ObjectMeta }) => {
  if (!r?.objectMeta?.annotations?.[propagationpolicyKey]) {
    return '';
  }
  return r?.objectMeta?.annotations?.[propagationpolicyKey];
};

// Enhanced resource interfaces for comprehensive resource management

// Base resource interfaces extending existing ObjectMeta
export interface ResourceMeta extends ObjectMeta {
  resourceVersion: string;
  generation?: number;
  finalizers?: string[];
  ownerReferences?: OwnerReference[];
}

export interface OwnerReference {
  apiVersion: string;
  kind: string;
  name: string;
  uid: string;
  controller?: boolean;
  blockOwnerDeletion?: boolean;
}

export interface ResourceStatus {
  phase?: string;
  conditions?: Condition[];
  observedGeneration?: number;
}

export interface Condition {
  type: string;
  status: string;
  lastTransitionTime: string;
  reason?: string;
  message?: string;
}
// Service resource interfaces
export interface ServiceResource {
  objectMeta: ResourceMeta;
  typeMeta: TypeMeta;
  spec: ServiceSpec;
  status?: ServiceStatus;
}

export interface ServiceSpec {
  type: ServiceType;
  selector?: Record<string, string>;
  ports: ServicePort[];
  clusterIP?: string;
  externalIPs?: string[];
  loadBalancerIP?: string;
  sessionAffinity?: string;
  externalTrafficPolicy?: string;
  healthCheckNodePort?: number;
}

export interface ServicePort {
  name?: string;
  protocol: string;
  port: number;
  targetPort: number | string;
  nodePort?: number;
}

export interface ServiceStatus {
  loadBalancer?: LoadBalancerStatus;
  conditions?: Condition[];
}

export interface LoadBalancerStatus {
  ingress?: LoadBalancerIngress[];
}

export interface LoadBalancerIngress {
  ip?: string;
  hostname?: string;
  ports?: PortStatus[];
}

export interface PortStatus {
  port: number;
  protocol: string;
  error?: string;
}

export enum ServiceType {
  ClusterIP = 'ClusterIP',
  NodePort = 'NodePort',
  LoadBalancer = 'LoadBalancer',
  ExternalName = 'ExternalName'
}
// Ingress resource interfaces
export interface IngressResource {
  objectMeta: ResourceMeta;
  typeMeta: TypeMeta;
  spec: IngressSpec;
  status?: IngressStatus;
}

export interface IngressSpec {
  ingressClassName?: string;
  defaultBackend?: IngressBackend;
  tls?: IngressTLS[];
  rules: IngressRule[];
}

export interface IngressRule {
  host?: string;
  http: HTTPIngressRuleValue;
}

export interface HTTPIngressRuleValue {
  paths: HTTPIngressPath[];
}

export interface HTTPIngressPath {
  path?: string;
  pathType: string;
  backend: IngressBackend;
}

export interface IngressBackend {
  service?: IngressServiceBackend;
  resource?: TypedLocalObjectReference;
}

export interface IngressServiceBackend {
  name: string;
  port?: ServiceBackendPort;
}

export interface ServiceBackendPort {
  name?: string;
  number?: number;
}

export interface TypedLocalObjectReference {
  apiGroup?: string;
  kind: string;
  name: string;
}

export interface IngressTLS {
  hosts?: string[];
  secretName?: string;
}

export interface IngressStatus {
  loadBalancer?: IngressLoadBalancerStatus;
}

export interface IngressLoadBalancerStatus {
  ingress?: IngressLoadBalancerIngress[];
}

export interface IngressLoadBalancerIngress {
  ip?: string;
  hostname?: string;
  ports?: PortStatus[];
}
// Configuration resource interfaces
export interface ConfigMapResource {
  objectMeta: ResourceMeta;
  typeMeta: TypeMeta;
  data?: Record<string, string>;
  binaryData?: Record<string, string>;
  immutable?: boolean;
}

export interface SecretResource {
  objectMeta: ResourceMeta;
  typeMeta: TypeMeta;
  type: SecretType;
  data?: Record<string, string>;
  stringData?: Record<string, string>;
  immutable?: boolean;
}

export enum SecretType {
  Opaque = 'Opaque',
  ServiceAccountToken = 'kubernetes.io/service-account-token',
  DockerConfigJson = 'kubernetes.io/dockerconfigjson',
  BasicAuth = 'kubernetes.io/basic-auth',
  SSHAuth = 'kubernetes.io/ssh-auth',
  TLS = 'kubernetes.io/tls'
}

export interface PersistentVolumeClaimResource {
  objectMeta: ResourceMeta;
  typeMeta: TypeMeta;
  spec: PVCSpec;
  status?: PVCStatus;
}

export interface PVCSpec {
  accessModes: string[];
  resources: ResourceRequirements;
  storageClassName?: string;
  volumeMode?: string;
  selector?: LabelSelector;
  dataSource?: TypedLocalObjectReference;
  dataSourceRef?: TypedObjectReference;
  volumeName?: string;
}

export interface ResourceRequirements {
  limits?: Record<string, string>;
  requests?: Record<string, string>;
}

export interface LabelSelector {
  matchLabels?: Record<string, string>;
  matchExpressions?: LabelSelectorRequirement[];
}

export interface LabelSelectorRequirement {
  key: string;
  operator: string;
  values?: string[];
}

export interface TypedObjectReference {
  apiGroup?: string;
  kind: string;
  name: string;
  namespace?: string;
}

export interface PVCStatus {
  phase: string;
  accessModes?: string[];
  capacity?: Record<string, string>;
  conditions?: Condition[];
  allocatedResources?: Record<string, string>;
  resizeStatus?: string;
}
// Enhanced error handling types and response interfaces
export interface ApiErrorInterface {
  code: number;
  message: string;
  details?: string;
  field?: string;
  type: ApiErrorType;
}

export enum ApiErrorType {
  NetworkError = 'NETWORK_ERROR',
  AuthenticationError = 'AUTHENTICATION_ERROR',
  AuthorizationError = 'AUTHORIZATION_ERROR',
  ValidationError = 'VALIDATION_ERROR',
  NotFoundError = 'NOT_FOUND_ERROR',
  ConflictError = 'CONFLICT_ERROR',
  ServerError = 'SERVER_ERROR',
  UnknownError = 'UNKNOWN_ERROR'
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface EnhancedResponse<T = unknown> extends IResponse<T> {
  errors?: ApiErrorInterface[];
  validationErrors?: ValidationError[];
  timestamp?: string;
  requestId?: string;
}

// Resource list response interface
export interface ResourceListResponse<T> {
  items: T[];
  listMeta: ListMeta;
  errors?: string[];
  status?: any;
}

export interface ListMeta {
  totalItems: number;
  itemsPerPage?: number;
  page?: number;
  sortBy?: string;
  filterBy?: string;
}

// Resource operation result interfaces
export interface ResourceOperationResult {
  success: boolean;
  message?: string;
  errors?: ApiErrorInterface[];
  resource?: unknown;
}

export interface BulkOperationResult {
  totalItems: number;
  successCount: number;
  failureCount: number;
  errors?: ApiErrorInterface[];
  results?: ResourceOperationResult[];
}

// Event interfaces for resource monitoring
export interface ResourceEvent {
  objectMeta: ResourceMeta;
  typeMeta: TypeMeta;
  message: string;
  sourceComponent: string;
  sourceHost: string;
  object: string;
  objectKind: string;
  objectName: string;
  objectNamespace: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  reason: string;
  type: string;
  severity?: EventSeverity;
}

export enum EventSeverity {
  Normal = 'Normal',
  Warning = 'Warning',
  Error = 'Error'
}

export const EventSeverityColors = {
  [EventSeverity.Normal]: '#52c41a', // Green
  [EventSeverity.Warning]: '#faad14', // Orange
  [EventSeverity.Error]: '#ff4d4f', // Red
} as const;

export const EventSeverityIcons = {
  [EventSeverity.Normal]: 'check-circle',
  [EventSeverity.Warning]: 'exclamation-circle',
  [EventSeverity.Error]: 'close-circle',
} as const;

// Endpoint interfaces for service resources
export interface Endpoint {
  objectMeta: ResourceMeta;
  typeMeta: TypeMeta;
  host: string;
  nodeName?: string;
  ready: boolean;
  ports: EndpointPort[];
}

export interface EndpointPort {
  name?: string;
  port: number;
  protocol: string;
}
// Centralized error handling function
export function handleApiError(error: unknown): never {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response: { status: number; data?: { message?: string; details?: string; field?: string } } };
    const { status, data } = axiosError.response;
    
    switch (status) {
      case 401:
        throw new ApiError({
          code: status,
          message: 'Authentication required. Please log in again.',
          type: ApiErrorType.AuthenticationError,
          details: data?.message
        });
      case 403:
        throw new ApiError({
          code: status,
          message: 'Insufficient permissions to perform this action.',
          type: ApiErrorType.AuthorizationError,
          details: data?.message
        });
      case 404:
        throw new ApiError({
          code: status,
          message: 'Resource not found. It may have been deleted.',
          type: ApiErrorType.NotFoundError,
          details: data?.message
        });
      case 409:
        throw new ApiError({
          code: status,
          message: 'Resource conflict. Please refresh and try again.',
          type: ApiErrorType.ConflictError,
          details: data?.message
        });
      case 422:
        throw new ApiError({
          code: status,
          message: data?.message || 'Validation failed. Please check your input.',
          type: ApiErrorType.ValidationError,
          details: data?.details,
          field: data?.field
        });
      case 500:
        throw new ApiError({
          code: status,
          message: 'Server error. Please try again later.',
          type: ApiErrorType.ServerError,
          details: data?.message
        });
      default:
        throw new ApiError({
          code: status,
          message: data?.message || `Request failed with status ${status}`,
          type: ApiErrorType.UnknownError,
          details: data?.details
        });
    }
  } else if (error && typeof error === 'object' && 'request' in error) {
    throw new ApiError({
      code: 0,
      message: 'Network error. Please check your connection.',
      type: ApiErrorType.NetworkError,
      details: 'No response received from server'
    });
  } else {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    const errorStack = error instanceof Error ? error.stack : undefined;
    throw new ApiError({
      code: 0,
      message: errorMessage,
      type: ApiErrorType.UnknownError,
      details: errorStack
    });
  }
}

// ApiError class for structured error handling
export class ApiError extends Error {
  public code: number;
  public type: ApiErrorType;
  public details?: string;
  public field?: string;

  constructor(params: {
    code: number;
    message: string;
    type: ApiErrorType;
    details?: string;
    field?: string;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.code = params.code;
    this.type = params.type;
    this.details = params.details;
    this.field = params.field;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      type: this.type,
      details: this.details,
      field: this.field
    };
  }
}

// Enhanced API client with comprehensive error handling
export const enhancedMemberClusterClient = {
  async get<T>(url: string, config?: Record<string, unknown>): Promise<T> {
    try {
      const response = await karmadaMemberClusterClient.get<T>(url, config);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  async post<T>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<T> {
    try {
      const response = await karmadaMemberClusterClient.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  async put<T>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<T> {
    try {
      const response = await karmadaMemberClusterClient.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  async delete<T>(url: string, config?: Record<string, unknown>): Promise<T> {
    try {
      const response = await karmadaMemberClusterClient.delete<T>(url, config);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  async patch<T>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<T> {
    try {
      const response = await karmadaMemberClusterClient.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  }
};

// Response validation utilities
export function validateResponse<T>(response: unknown): EnhancedResponse<T> {
  if (!response) {
    throw new ApiError({
      code: 0,
      message: 'Empty response received',
      type: ApiErrorType.UnknownError
    });
  }

  // Validate response structure
  if (typeof response !== 'object') {
    throw new ApiError({
      code: 0,
      message: 'Invalid response format',
      type: ApiErrorType.UnknownError,
      details: 'Response is not an object'
    });
  }

  const responseObj = response as Record<string, unknown>;

  return {
    code: (responseObj.code as number) || 200,
    message: (responseObj.message as string) || 'Success',
    data: responseObj.data as T,
    errors: responseObj.errors as ApiErrorInterface[],
    validationErrors: responseObj.validationErrors as ValidationError[],
    timestamp: (responseObj.timestamp as string) || new Date().toISOString(),
    requestId: responseObj.requestId as string
  };
}

// Consistent response typing utilities
export function createSuccessResponse<T>(data: T, message?: string): EnhancedResponse<T> {
  return {
    code: 200,
    message: message || 'Success',
    data,
    timestamp: new Date().toISOString()
  };
}

export function createErrorResponse(error: ApiError): EnhancedResponse<null> {
  return {
    code: error.code,
    message: error.message,
    data: null,
    errors: [error],
    timestamp: new Date().toISOString()
  };
}