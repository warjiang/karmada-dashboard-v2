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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notification } from 'antd';
import { BaseResource, ResourceFilter } from './index';

// Generic resource query hook
export function useResourceQuery<T extends BaseResource>(
  memberClusterName: string,
  resourceType: string,
  filter: ResourceFilter,
  fetchFunction: (params: any) => Promise<any>,
  options?: {
    staleTime?: number;
    refetchInterval?: number;
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: [memberClusterName, resourceType, JSON.stringify(filter)],
    queryFn: () => fetchFunction({
      memberClusterName,
      namespace: filter.selectedNamespace || undefined,
      keyword: filter.searchText || undefined,
      filterBy: filter.selectedLabels.length > 0 ? filter.selectedLabels : undefined,
      sortBy: filter.sortBy.length > 0 ? filter.sortBy : undefined,
      itemsPerPage: filter.itemsPerPage,
      page: filter.page,
    }),
    staleTime: options?.staleTime || 30000, // 30 seconds
    refetchInterval: options?.refetchInterval || 60000, // 1 minute
    enabled: options?.enabled !== false,
  });
}

// Generic resource mutation hook
export function useResourceMutation<T extends BaseResource>(
  memberClusterName: string,
  resourceType: string,
  operation: 'create' | 'update' | 'delete',
  mutationFunction: (params: any) => Promise<any>,
  options?: {
    onSuccess?: (data: any, variables: any) => void;
    onError?: (error: any, variables: any) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutationFunction,
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [memberClusterName, resourceType] });
      queryClient.invalidateQueries({ queryKey: [memberClusterName, 'events'] });
      
      // Show success notification
      notification.success({
        message: `${operation.charAt(0).toUpperCase() + operation.slice(1)} ${resourceType} successful`,
        description: `Successfully ${operation}d ${resourceType}`,
      });

      options?.onSuccess?.(data, variables);
    },
    onError: (error: any, variables) => {
      // Show error notification
      notification.error({
        message: `Failed to ${operation} ${resourceType}`,
        description: error.message || `An error occurred while ${operation}ing ${resourceType}`,
      });

      options?.onError?.(error, variables);
    },
  });
}

// Bulk operations hook
export function useBulkResourceMutation<T extends BaseResource>(
  memberClusterName: string,
  resourceType: string,
  operation: 'delete' | 'label',
  mutationFunction: (items: T[]) => Promise<any>,
  options?: {
    onSuccess?: (data: any, variables: T[]) => void;
    onError?: (error: any, variables: T[]) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutationFunction,
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [memberClusterName, resourceType] });
      
      // Show success notification
      notification.success({
        message: `Bulk ${operation} successful`,
        description: `Successfully ${operation}d ${variables.length} ${resourceType}(s)`,
      });

      options?.onSuccess?.(data, variables);
    },
    onError: (error: any, variables) => {
      // Show error notification
      notification.error({
        message: `Bulk ${operation} failed`,
        description: error.message || `Failed to ${operation} ${variables.length} ${resourceType}(s)`,
      });

      options?.onError?.(error, variables);
    },
  });
}

// Resource events hook
export function useResourceEvents(
  memberClusterName: string,
  resourceType: string,
  namespace: string,
  name: string,
  enabled = true
) {
  return useQuery({
    queryKey: [memberClusterName, resourceType, namespace, name, 'events'],
    queryFn: async () => {
      // This would be implemented based on the specific API endpoint
      // For now, return empty array as placeholder
      return { events: [], listMeta: { totalItems: 0 } };
    },
    enabled,
    staleTime: 10000, // 10 seconds for events
    refetchInterval: 30000, // 30 seconds for events
  });
}

// Namespace options hook
export function useNamespaceOptions(memberClusterName: string) {
  return useQuery({
    queryKey: [memberClusterName, 'namespaces'],
    queryFn: async () => {
      // This would fetch namespaces from the API
      // For now, return common namespaces as placeholder
      return [
        { label: 'default', value: 'default' },
        { label: 'kube-system', value: 'kube-system' },
        { label: 'kube-public', value: 'kube-public' },
        { label: 'production', value: 'production' },
        { label: 'staging', value: 'staging' },
        { label: 'development', value: 'development' },
      ];
    },
    staleTime: 300000, // 5 minutes
  });
}

// Label options hook (extracts unique labels from resources)
export function useLabelOptions<T extends BaseResource>(
  data: T[],
  maxOptions = 50
) {
  const labelOptions = data.reduce((acc, resource) => {
    const labels = resource.objectMeta.labels || {};
    Object.entries(labels).forEach(([key, value]) => {
      const labelString = `${key}=${value}`;
      if (!acc.includes(labelString) && acc.length < maxOptions) {
        acc.push(labelString);
      }
    });
    return acc;
  }, [] as string[]);

  return labelOptions.map(label => ({
    label,
    value: label,
  }));
}

// Status options hook (extracts unique statuses from resources)
export function useStatusOptions<T extends BaseResource & { status?: any }>(
  data: T[],
  statusExtractor: (resource: T) => string
) {
  const statusOptions = data.reduce((acc, resource) => {
    const status = statusExtractor(resource);
    if (status && !acc.includes(status)) {
      acc.push(status);
    }
    return acc;
  }, [] as string[]);

  return statusOptions.map(status => ({
    label: status,
    value: status,
  }));
}

// Auto-refresh hook
export function useAutoRefresh(
  refetchFunction: () => void,
  interval = 60000, // 1 minute
  enabled = true
) {
  return useQuery({
    queryKey: ['auto-refresh', interval],
    queryFn: () => {
      refetchFunction();
      return null;
    },
    enabled,
    refetchInterval: interval,
    refetchIntervalInBackground: false,
  });
}

// Resource health status hook
export function useResourceHealth<T extends BaseResource>(
  resources: T[],
  healthExtractor: (resource: T) => 'healthy' | 'warning' | 'error' | 'unknown'
) {
  const healthStats = resources.reduce(
    (acc, resource) => {
      const health = healthExtractor(resource);
      acc[health] = (acc[health] || 0) + 1;
      return acc;
    },
    { healthy: 0, warning: 0, error: 0, unknown: 0 }
  );

  return {
    total: resources.length,
    ...healthStats,
    healthyPercentage: resources.length > 0 ? (healthStats.healthy / resources.length) * 100 : 0,
  };
}

// Search and filter utilities
export function useResourceSearch<T extends BaseResource>(
  resources: T[],
  searchText: string,
  searchFields: (keyof T | string)[] = ['objectMeta.name', 'objectMeta.namespace']
) {
  if (!searchText.trim()) {
    return resources;
  }

  const searchLower = searchText.toLowerCase();
  
  return resources.filter(resource => {
    return searchFields.some(field => {
      const value = getNestedValue(resource, field as string);
      return value && value.toString().toLowerCase().includes(searchLower);
    });
  });
}

// Utility function to get nested object values
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Resource sorting utilities
export function useResourceSort<T extends BaseResource>(
  resources: T[],
  sortBy: string[],
  sortOrder: 'asc' | 'desc' = 'asc'
) {
  if (sortBy.length === 0) {
    return resources;
  }

  return [...resources].sort((a, b) => {
    for (const field of sortBy) {
      const aValue = getNestedValue(a, field);
      const bValue = getNestedValue(b, field);
      
      if (aValue === bValue) continue;
      
      const comparison = compareValues(aValue, bValue);
      return sortOrder === 'asc' ? comparison : -comparison;
    }
    return 0;
  });
}

function compareValues(a: any, b: any): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b);
  }
  
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  
  // For dates
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }
  
  // Convert to strings for comparison
  return String(a).localeCompare(String(b));
}