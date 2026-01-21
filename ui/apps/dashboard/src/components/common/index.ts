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

// ResourceList exports
export { default as ResourceList } from './ResourceList';
export type {
  BaseResource,
  ResourceFilter,
  BulkAction,
  ResourceColumn,
  ExportConfig,
  ResourceListProps,
} from './ResourceList';

export {
  createDefaultBulkActions,
  formatAge,
  formatLabels,
} from './ResourceList';

// ResourceList hooks
export {
  useResourceQuery,
  useResourceMutation,
  useBulkResourceMutation,
  useResourceEvents,
  useNamespaceOptions,
  useLabelOptions,
  useStatusOptions,
  useAutoRefresh,
  useResourceHealth,
  useResourceSearch,
  useResourceSort,
} from './ResourceList/hooks';

// ResourceList components
export {
  ResourceName,
  ResourceAge,
  ResourceLabels,
  ResourceReplicas,
  ResourceImages,
  ResourcePorts,
  ResourceEndpoints,
  ResourceSize,
  ResourceDataKeys,
  ResourceHealth,
  ResourceActions,
  ResourceStatus,
} from './ResourceList/components';

export type {
  ResourceNameProps,
  ResourceStatusProps,
  ResourceAgeProps,
  ResourceLabelsProps,
  ResourceReplicasProps,
  ResourceImagesProps,
  ResourcePortsProps,
  ResourceEndpointsProps,
  ResourceSizeProps,
  ResourceDataKeysProps,
  ResourceHealthProps,
  ResourceActionsProps,
} from './ResourceList/components';

// ResourceList column definitions
export {
  createWorkloadColumns,
  createServiceColumns,
  createConfigMapColumns,
  createSecretColumns,
  createPVCColumns,
  createGenericColumns,
} from './ResourceList/columns';

// ResourceDetail exports
export { default as ResourceDetail } from './ResourceDetail';
export type {
  DetailTab,
  DetailTabProps,
  BreadcrumbItem,
  ResourceDetailProps,
} from './ResourceDetail';

export {
  createResourceBreadcrumbs,
} from './ResourceDetail';

export { ResourceNotFound } from './ResourceNotFound';
export { RouteGuard } from './RouteGuard';

// ResourceDetail hooks
export {
  useResourceDetail,
  useResourceEvents,
  useResourceMetrics,
  useResourceLogs,
  useRelatedResources,
  useResourceUpdate,
  useResourceDelete,
  useResourceDetailState,
  useYAMLFormatter,
  useResourceNavigation,
  useResourceHealth,
  useResourceExport,
} from './ResourceDetail/hooks';

// ResourceDetail tabs
export {
  PodsTab,
  EndpointsTab,
  MetricsTab,
  LogsTab,
  ConditionsTab,
  RelatedResourcesTab,
} from './ResourceDetail/tabs';

// ResourceDetail utilities
export {
  createWorkloadTabs,
  createServiceTabs,
  createConfigTabs,
  getResourceTypeIcon,
  getResourceStatusColor,
  formatResourceAge,
  extractResourceHealth,
  getResourceDisplayFields,
  validateResourceForEdit,
  cleanResourceForExport,
} from './ResourceDetail/utils';

// ResourceErrorBoundary exports
export { default as ResourceErrorBoundary } from './ResourceErrorBoundary';
export { ResourceErrorBoundary as ResourceErrorBoundaryClass } from './ResourceErrorBoundary';