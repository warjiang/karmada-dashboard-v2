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

// Resource query hooks
export {
  useResourceQuery,
  useResourceDetailQuery,
  useResourceEventsQuery,
  useResourceMetricsQuery,
  useResourceLogsQuery,
  useRelatedResourcesQuery,
  useNamespaceOptionsQuery,
  useAutoRefresh,
  getResourceQueryKey,
  createResourcePrefetchFunction,
  createResourceInvalidateFunction,
} from './useResourceQuery';

export type {
  ResourceQueryParams,
  ResourceDetailParams,
} from './useResourceQuery';

// Resource mutation hooks
export {
  useResourceCreateMutation,
  useResourceUpdateMutation,
  useResourceDeleteMutation,
  useBulkResourceMutation,
  useWorkloadOperationMutation,
  useOptimisticResourceMutation,
  useMutationState,
  useBatchMutations,
} from './useResourceMutation';

export type {
  ResourceMutationParams,
  ResourceCreateParams,
  ResourceUpdateParams,
  ResourceDeleteParams,
  BulkOperationParams,
  WorkloadOperationParams,
} from './useResourceMutation';

// Resource events hooks
export {
  useResourceEvents,
  useClusterEvents,
  useEventFilter,
  useEventStats,
  useEventGrouping,
  useEventTimeline,
  useEventExport,
  useEventStream,
  EventSeverityColors,
  EventSeverityIcons,
  formatEventAge,
  formatEventMessage,
} from './useResourceEvents';

export type {
  EventQueryParams,
  EventFilter,
  EventStats,
} from './useResourceEvents';