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
import { useState, useCallback, useMemo } from 'react';
import { BaseResource } from '../ResourceList';

// Resource detail query hook
export function useResourceDetail<T extends BaseResource>(
  memberClusterName: string,
  resourceType: string,
  namespace: string,
  name: string,
  fetchFunction: (params: {
    memberClusterName: string;
    namespace: string;
    name: string;
  }) => Promise<T>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey: [memberClusterName, resourceType, namespace, name, 'detail'],
    queryFn: () => fetchFunction({ memberClusterName, namespace, name }),
    enabled: options?.enabled !== false && !!memberClusterName && !!namespace && !!name,
    staleTime: options?.staleTime || 30000, // 30 seconds
    refetchInterval: options?.refetchInterval || 60000, // 1 minute
  });
}

// Resource events query hook
export function useResourceEvents(
  memberClusterName: string,
  resourceType: string,
  namespace: string,
  name: string,
  fetchEventsFunction?: (params: {
    memberClusterName: string;
    namespace: string;
    name: string;
    resourceType: string;
  }) => Promise<any>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey: [memberClusterName, resourceType, namespace, name, 'events'],
    queryFn: fetchEventsFunction 
      ? () => fetchEventsFunction({ memberClusterName, namespace, name, resourceType })
      : async () => ({ events: [], listMeta: { totalItems: 0 } }),
    enabled: options?.enabled !== false && !!memberClusterName && !!namespace && !!name,
    staleTime: options?.staleTime || 10000, // 10 seconds for events
    refetchInterval: options?.refetchInterval || 30000, // 30 seconds for events
  });
}

// Resource metrics query hook
export function useResourceMetrics(
  memberClusterName: string,
  resourceType: string,
  namespace: string,
  name: string,
  fetchMetricsFunction?: (params: {
    memberClusterName: string;
    namespace: string;
    name: string;
    resourceType: string;
  }) => Promise<any>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey: [memberClusterName, resourceType, namespace, name, 'metrics'],
    queryFn: fetchMetricsFunction
      ? () => fetchMetricsFunction({ memberClusterName, namespace, name, resourceType })
      : async () => ({
          cpu: { current: 0, limit: 0 },
          memory: { current: 0, limit: 0 },
          network: { rx: 0, tx: 0 },
          storage: { used: 0, total: 0 }
        }),
    enabled: options?.enabled !== false && !!memberClusterName && !!namespace && !!name,
    staleTime: options?.staleTime || 30000, // 30 seconds
    refetchInterval: options?.refetchInterval || 60000, // 1 minute
  });
}

// Resource logs query hook
export function useResourceLogs(
  memberClusterName: string,
  resourceType: string,
  namespace: string,
  name: string,
  container?: string,
  tailLines?: number,
  fetchLogsFunction?: (params: {
    memberClusterName: string;
    namespace: string;
    name: string;
    resourceType: string;
    container?: string;
    tailLines?: number;
  }) => Promise<any>,
  options?: {
    enabled?: boolean;
    follow?: boolean;
  }
) {
  return useQuery({
    queryKey: [memberClusterName, resourceType, namespace, name, 'logs', container, tailLines],
    queryFn: fetchLogsFunction
      ? () => fetchLogsFunction({ memberClusterName, namespace, name, resourceType, container, tailLines })
      : async () => ({ logs: 'No logs available', containers: [] }),
    enabled: options?.enabled !== false && !!memberClusterName && !!namespace && !!name,
    staleTime: 0, // Always fresh for logs
    refetchInterval: options?.follow ? 5000 : false, // 5 seconds when following
  });
}

// Related resources query hook
export function useRelatedResources(
  memberClusterName: string,
  resourceType: string,
  namespace: string,
  name: string,
  fetchRelatedFunction?: (params: {
    memberClusterName: string;
    namespace: string;
    name: string;
    resourceType: string;
  }) => Promise<any>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
) {
  return useQuery({
    queryKey: [memberClusterName, resourceType, namespace, name, 'related'],
    queryFn: fetchRelatedFunction
      ? () => fetchRelatedFunction({ memberClusterName, namespace, name, resourceType })
      : async () => ({ resources: [] }),
    enabled: options?.enabled !== false && !!memberClusterName && !!namespace && !!name,
    staleTime: options?.staleTime || 30000, // 30 seconds
  });
}

// Resource update mutation hook
export function useResourceUpdate<T extends BaseResource>(
  memberClusterName: string,
  resourceType: string,
  updateFunction: (params: {
    memberClusterName: string;
    namespace: string;
    name: string;
    content: string;
  }) => Promise<T>,
  options?: {
    onSuccess?: (data: T, variables: any) => void;
    onError?: (error: any, variables: any) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFunction,
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: [memberClusterName, resourceType, variables.namespace, variables.name] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [memberClusterName, resourceType] 
      });

      notification.success({
        message: 'Resource updated successfully',
        description: `${resourceType} ${variables.name} has been updated`,
      });

      options?.onSuccess?.(data, variables);
    },
    onError: (error: any, variables) => {
      notification.error({
        message: 'Failed to update resource',
        description: error.message || `Failed to update ${resourceType} ${variables.name}`,
      });

      options?.onError?.(error, variables);
    },
  });
}

// Resource delete mutation hook
export function useResourceDelete(
  memberClusterName: string,
  resourceType: string,
  deleteFunction: (params: {
    memberClusterName: string;
    namespace: string;
    name: string;
    gracePeriodSeconds?: number;
  }) => Promise<any>,
  options?: {
    onSuccess?: (data: any, variables: any) => void;
    onError?: (error: any, variables: any) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFunction,
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: [memberClusterName, resourceType] 
      });

      notification.success({
        message: 'Resource deleted successfully',
        description: `${resourceType} ${variables.name} has been deleted`,
      });

      options?.onSuccess?.(data, variables);
    },
    onError: (error: any, variables) => {
      notification.error({
        message: 'Failed to delete resource',
        description: error.message || `Failed to delete ${resourceType} ${variables.name}`,
      });

      options?.onError?.(error, variables);
    },
  });
}

// Resource detail state management hook
export function useResourceDetailState(initialTab = 'overview') {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isEditing, setIsEditing] = useState(false);
  const [yamlContent, setYamlContent] = useState('');

  const resetState = useCallback(() => {
    setActiveTab(initialTab);
    setIsEditing(false);
    setYamlContent('');
  }, [initialTab]);

  return {
    activeTab,
    setActiveTab,
    isEditing,
    setIsEditing,
    yamlContent,
    setYamlContent,
    resetState,
  };
}

// YAML formatting hook
export function useYAMLFormatter() {
  const formatResourceToYAML = useCallback((resource: any): string => {
    if (!resource) return '';
    
    try {
      // Remove internal fields that shouldn't be shown in YAML
      const cleanResource = { ...resource };
      
      if (cleanResource.objectMeta) {
        const { 
          resourceVersion, 
          uid, 
          generation, 
          managedFields,
          ...cleanMeta 
        } = cleanResource.objectMeta;
        cleanResource.objectMeta = cleanMeta;
      }

      // Remove status for editing
      if (cleanResource.status) {
        delete cleanResource.status;
      }
      
      // Convert to YAML-like JSON format (would use yaml library in real implementation)
      return JSON.stringify(cleanResource, null, 2);
    } catch (error) {
      console.error('Failed to format YAML:', error);
      return 'Error formatting YAML';
    }
  }, []);

  const parseYAMLToResource = useCallback((yamlContent: string): any => {
    try {
      // Parse YAML content (would use yaml library in real implementation)
      return JSON.parse(yamlContent);
    } catch (error) {
      throw new Error('Invalid YAML format');
    }
  }, []);

  return {
    formatResourceToYAML,
    parseYAMLToResource,
  };
}

// Resource navigation hook
export function useResourceNavigation() {
  const [navigationHistory, setNavigationHistory] = useState<Array<{
    kind: string;
    namespace: string;
    name: string;
    timestamp: number;
  }>>([]);

  const navigateToResource = useCallback((resource: {
    kind: string;
    namespace: string;
    name: string;
  }) => {
    const navigationItem = {
      ...resource,
      timestamp: Date.now(),
    };

    setNavigationHistory(prev => {
      // Remove duplicate entries and limit history size
      const filtered = prev.filter(item => 
        !(item.kind === resource.kind && 
          item.namespace === resource.namespace && 
          item.name === resource.name)
      );
      return [navigationItem, ...filtered].slice(0, 10); // Keep last 10 items
    });
  }, []);

  const clearNavigationHistory = useCallback(() => {
    setNavigationHistory([]);
  }, []);

  return {
    navigationHistory,
    navigateToResource,
    clearNavigationHistory,
  };
}

// Resource health status hook
export function useResourceHealth(resource: any) {
  const healthStatus = useMemo(() => {
    if (!resource) return 'unknown';

    // Check conditions for health status
    const conditions = resource.status?.conditions || [];
    
    // Look for common condition types
    const readyCondition = conditions.find((c: any) => c.type === 'Ready');
    const availableCondition = conditions.find((c: any) => c.type === 'Available');
    const progressingCondition = conditions.find((c: any) => c.type === 'Progressing');

    if (readyCondition?.status === 'True' || availableCondition?.status === 'True') {
      return 'healthy';
    }

    if (readyCondition?.status === 'False' || availableCondition?.status === 'False') {
      return 'error';
    }

    if (progressingCondition?.status === 'True') {
      return 'warning';
    }

    // Check phase-based status
    const phase = resource.status?.phase;
    if (phase) {
      switch (phase.toLowerCase()) {
        case 'running':
        case 'active':
        case 'bound':
          return 'healthy';
        case 'pending':
        case 'creating':
          return 'warning';
        case 'failed':
        case 'error':
          return 'error';
        default:
          return 'unknown';
      }
    }

    return 'unknown';
  }, [resource]);

  const healthMessage = useMemo(() => {
    if (!resource) return 'Resource not available';

    const conditions = resource.status?.conditions || [];
    const failedCondition = conditions.find((c: any) => c.status === 'False');
    
    if (failedCondition) {
      return failedCondition.message || failedCondition.reason || 'Resource has failed conditions';
    }

    const phase = resource.status?.phase;
    if (phase) {
      return `Resource is ${phase.toLowerCase()}`;
    }

    return 'Resource status is unknown';
  }, [resource]);

  return {
    healthStatus,
    healthMessage,
  };
}

// Export utility functions
export function useResourceExport() {
  const exportToYAML = useCallback((resource: any, filename?: string) => {
    const yamlContent = JSON.stringify(resource, null, 2); // Would use yaml library
    const blob = new Blob([yamlContent], { type: 'application/x-yaml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${resource?.objectMeta?.name || 'resource'}.yaml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const exportToJSON = useCallback((resource: any, filename?: string) => {
    const jsonContent = JSON.stringify(resource, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${resource?.objectMeta?.name || 'resource'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  return {
    exportToYAML,
    exportToJSON,
  };
}