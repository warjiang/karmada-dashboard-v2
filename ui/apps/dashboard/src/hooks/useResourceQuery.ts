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

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { IResponse, ResourceListResponse, ListMeta } from '../services/base';

// Generic resource query parameters
export interface ResourceQueryParams {
  memberClusterName: string;
  namespace?: string;
  keyword?: string;
  filterBy?: string[];
  sortBy?: string[];
  itemsPerPage?: number;
  page?: number;
}

// Resource detail query parameters
export interface ResourceDetailParams {
  memberClusterName: string;
  namespace: string;
  name: string;
}

// Generic resource list query hook
export function useResourceQuery<T>(
  resourceType: string,
  params: ResourceQueryParams,
  fetchFunction: (params: ResourceQueryParams) => Promise<IResponse<ResourceListResponse<T>>>,
  options?: Partial<UseQueryOptions<IResponse<ResourceListResponse<T>>>>
) {
  const { memberClusterName, namespace, keyword, filterBy, sortBy, itemsPerPage, page } = params;

  return useQuery({
    queryKey: [
      memberClusterName,
      resourceType,
      'list',
      namespace,
      keyword,
      filterBy,
      sortBy,
      itemsPerPage,
      page,
    ],
    queryFn: () => fetchFunction(params),
    enabled: !!memberClusterName,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute for list views
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// Generic resource detail query hook
export function useResourceDetailQuery<T>(
  resourceType: string,
  params: ResourceDetailParams,
  fetchFunction: (params: ResourceDetailParams) => Promise<IResponse<T>>,
  options?: Partial<UseQueryOptions<IResponse<T>>>
) {
  const { memberClusterName, namespace, name } = params;

  return useQuery({
    queryKey: [memberClusterName, resourceType, 'detail', namespace, name],
    queryFn: () => fetchFunction(params),
    enabled: !!memberClusterName && !!namespace && !!name,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute for detail views
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// Resource events query hook
export function useResourceEventsQuery<T>(
  resourceType: string,
  params: ResourceDetailParams,
  fetchFunction: (params: ResourceDetailParams) => Promise<IResponse<ResourceListResponse<T>>>,
  options?: Partial<UseQueryOptions<IResponse<ResourceListResponse<T>>>>
) {
  const { memberClusterName, namespace, name } = params;

  return useQuery({
    queryKey: [memberClusterName, resourceType, 'events', namespace, name],
    queryFn: () => fetchFunction(params),
    enabled: !!memberClusterName && !!namespace && !!name,
    staleTime: 10000, // 10 seconds for events (more frequent updates)
    refetchInterval: 30000, // 30 seconds for events
    refetchOnWindowFocus: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    ...options,
  });
}

// Resource metrics query hook
export function useResourceMetricsQuery<T>(
  resourceType: string,
  params: ResourceDetailParams,
  fetchFunction: (params: ResourceDetailParams) => Promise<IResponse<T>>,
  options?: Partial<UseQueryOptions<IResponse<T>>>
) {
  const { memberClusterName, namespace, name } = params;

  return useQuery({
    queryKey: [memberClusterName, resourceType, 'metrics', namespace, name],
    queryFn: () => fetchFunction(params),
    enabled: !!memberClusterName && !!namespace && !!name,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute for metrics
    refetchOnWindowFocus: false, // Don't refetch metrics on focus
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    ...options,
  });
}

// Resource logs query hook
export function useResourceLogsQuery<T>(
  resourceType: string,
  params: ResourceDetailParams & { container?: string; tailLines?: number },
  fetchFunction: (params: ResourceDetailParams & { container?: string; tailLines?: number }) => Promise<IResponse<T>>,
  options?: Partial<UseQueryOptions<IResponse<T>>> & { follow?: boolean }
) {
  const { memberClusterName, namespace, name, container, tailLines } = params;
  const { follow = false, ...queryOptions } = options || {};

  return useQuery({
    queryKey: [memberClusterName, resourceType, 'logs', namespace, name, container, tailLines],
    queryFn: () => fetchFunction(params),
    enabled: !!memberClusterName && !!namespace && !!name,
    staleTime: 0, // Always fresh for logs
    refetchInterval: follow ? 5000 : false, // 5 seconds when following logs
    refetchOnWindowFocus: false, // Don't refetch logs on focus
    retry: 1,
    retryDelay: 2000,
    ...queryOptions,
  });
}

// Related resources query hook
export function useRelatedResourcesQuery<T>(
  resourceType: string,
  params: ResourceDetailParams,
  fetchFunction: (params: ResourceDetailParams) => Promise<IResponse<ResourceListResponse<T>>>,
  options?: Partial<UseQueryOptions<IResponse<ResourceListResponse<T>>>>
) {
  const { memberClusterName, namespace, name } = params;

  return useQuery({
    queryKey: [memberClusterName, resourceType, 'related', namespace, name],
    queryFn: () => fetchFunction(params),
    enabled: !!memberClusterName && !!namespace && !!name,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
    refetchOnWindowFocus: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    ...options,
  });
}

// Namespace options query hook
export function useNamespaceOptionsQuery(
  memberClusterName: string,
  fetchFunction?: (memberClusterName: string) => Promise<IResponse<{ namespaces: Array<{ name: string; status: string }> }>>,
  options?: Partial<UseQueryOptions<IResponse<{ namespaces: Array<{ name: string; status: string }> }>>>
) {
  return useQuery({
    queryKey: [memberClusterName, 'namespaces'],
    queryFn: fetchFunction 
      ? () => fetchFunction(memberClusterName)
      : async () => ({
          code: 200,
          message: 'Success',
          data: {
            namespaces: [
              { name: 'default', status: 'Active' },
              { name: 'kube-system', status: 'Active' },
              { name: 'kube-public', status: 'Active' },
              { name: 'production', status: 'Active' },
              { name: 'staging', status: 'Active' },
              { name: 'development', status: 'Active' },
            ],
          },
        }),
    enabled: !!memberClusterName,
    staleTime: 300000, // 5 minutes for namespaces
    refetchInterval: false, // Don't auto-refetch namespaces
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  });
}

// Auto-refresh hook for real-time updates
export function useAutoRefresh(
  enabled: boolean = true,
  interval: number = 60000, // 1 minute default
  refetchFunctions: Array<() => void> = []
) {
  return useQuery({
    queryKey: ['auto-refresh', interval, enabled],
    queryFn: async () => {
      if (enabled && refetchFunctions.length > 0) {
        refetchFunctions.forEach(refetch => refetch());
      }
      return null;
    },
    enabled,
    refetchInterval: interval,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 0,
  });
}

// Query cache management utilities
export function getResourceQueryKey(
  memberClusterName: string,
  resourceType: string,
  queryType: 'list' | 'detail' | 'events' | 'metrics' | 'logs' | 'related',
  params?: Record<string, unknown>
): (string | number | Record<string, unknown>)[] {
  const baseKey = [memberClusterName, resourceType, queryType];
  
  if (params) {
    return [...baseKey, ...Object.values(params)];
  }
  
  return baseKey;
}

// Prefetch utilities for performance optimization
export function createResourcePrefetchFunction<T>(
  queryClient: any,
  resourceType: string,
  fetchFunction: (params: any) => Promise<IResponse<T>>
) {
  return async (params: ResourceQueryParams | ResourceDetailParams) => {
    const queryKey = getResourceQueryKey(
      params.memberClusterName,
      resourceType,
      'namespace' in params && 'name' in params ? 'detail' : 'list',
      params
    );

    await queryClient.prefetchQuery({
      queryKey,
      queryFn: () => fetchFunction(params),
      staleTime: 30000,
    });
  };
}

// Query invalidation utilities
export function createResourceInvalidateFunction(
  queryClient: any,
  memberClusterName: string,
  resourceType: string
) {
  return {
    // Invalidate all queries for this resource type
    invalidateAll: () => {
      void queryClient.invalidateQueries({
        queryKey: [memberClusterName, resourceType],
      });
    },

    // Invalidate list queries only
    invalidateList: () => {
      void queryClient.invalidateQueries({
        queryKey: [memberClusterName, resourceType, 'list'],
      });
    },

    // Invalidate specific resource detail
    invalidateDetail: (namespace: string, name: string) => {
      void queryClient.invalidateQueries({
        queryKey: [memberClusterName, resourceType, 'detail', namespace, name],
      });
    },

    // Invalidate events for specific resource
    invalidateEvents: (namespace: string, name: string) => {
      void queryClient.invalidateQueries({
        queryKey: [memberClusterName, resourceType, 'events', namespace, name],
      });
    },

    // Invalidate related resources
    invalidateRelated: (namespace: string, name: string) => {
      void queryClient.invalidateQueries({
        queryKey: [memberClusterName, resourceType, 'related', namespace, name],
      });
    },
  };
}