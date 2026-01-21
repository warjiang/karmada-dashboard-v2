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

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notification } from 'antd';
import { IResponse, ApiError, ApiErrorType } from '../services/base';
import { createResourceInvalidateFunction } from './useResourceQuery';

// Generic mutation parameters
export interface ResourceMutationParams {
  memberClusterName: string;
  namespace: string;
  name: string;
  content?: string;
  gracePeriodSeconds?: number;
}

// Create mutation parameters
export interface ResourceCreateParams {
  memberClusterName: string;
  namespace: string;
  name: string;
  content: string;
}

// Update mutation parameters
export interface ResourceUpdateParams {
  memberClusterName: string;
  namespace: string;
  name: string;
  content: string;
}

// Delete mutation parameters
export interface ResourceDeleteParams {
  memberClusterName: string;
  namespace: string;
  name: string;
  gracePeriodSeconds?: number;
}

// Bulk operation parameters
export interface BulkOperationParams {
  memberClusterName: string;
  resources: Array<{
    namespace: string;
    name: string;
  }>;
  operation: 'delete' | 'label' | 'annotate';
  data?: Record<string, string>; // For label/annotate operations
}

// Workload-specific operation parameters
export interface WorkloadOperationParams {
  memberClusterName: string;
  namespace: string;
  name: string;
  operation: 'pause' | 'resume' | 'restart' | 'rollback' | 'trigger';
  targetRevision?: number; // For rollback operations
}

// Generic resource create mutation hook
export function useResourceCreateMutation<T>(
  resourceType: string,
  mutationFunction: (params: ResourceCreateParams) => Promise<IResponse<T>>,
  options?: {
    onSuccess?: (data: IResponse<T>, variables: ResourceCreateParams) => void;
    onError?: (error: Error, variables: ResourceCreateParams) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutationFunction,
    onSuccess: (data, variables) => {
      const { memberClusterName, namespace, name } = variables;
      const invalidate = createResourceInvalidateFunction(queryClient, memberClusterName, resourceType);

      // Invalidate list queries to show the new resource
      invalidate.invalidateList();

      // Show success notification
      notification.success({
        message: `${resourceType} Created`,
        description: `Successfully created ${resourceType} "${name}" in namespace "${namespace}"`,
        duration: 4,
      });

      options?.onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      const { name, namespace } = variables;
      
      // Show error notification with specific error handling
      const errorMessage = getErrorMessage(error as ApiError, `create ${resourceType}`);
      notification.error({
        message: `Failed to Create ${resourceType}`,
        description: `Could not create ${resourceType} "${name}" in namespace "${namespace}": ${errorMessage}`,
        duration: 6,
      });

      options?.onError?.(error, variables);
    },
    retry: (failureCount, error) => {
      // Don't retry validation errors or conflicts
      const apiError = error as ApiError;
      if (apiError.type === ApiErrorType.ValidationError || apiError.type === ApiErrorType.ConflictError) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

// Generic resource update mutation hook
export function useResourceUpdateMutation<T>(
  resourceType: string,
  mutationFunction: (params: ResourceUpdateParams) => Promise<IResponse<T>>,
  options?: {
    onSuccess?: (data: IResponse<T>, variables: ResourceUpdateParams) => void;
    onError?: (error: Error, variables: ResourceUpdateParams) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutationFunction,
    onSuccess: (data, variables) => {
      const { memberClusterName, namespace, name } = variables;
      const invalidate = createResourceInvalidateFunction(queryClient, memberClusterName, resourceType);

      // Invalidate specific resource detail and list
      invalidate.invalidateDetail(namespace, name);
      invalidate.invalidateList();
      invalidate.invalidateEvents(namespace, name);

      // Show success notification
      notification.success({
        message: `${resourceType} Updated`,
        description: `Successfully updated ${resourceType} "${name}" in namespace "${namespace}"`,
        duration: 4,
      });

      options?.onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      const { name, namespace } = variables;
      
      // Show error notification
      const errorMessage = getErrorMessage(error as ApiError, `update ${resourceType}`);
      notification.error({
        message: `Failed to Update ${resourceType}`,
        description: `Could not update ${resourceType} "${name}" in namespace "${namespace}": ${errorMessage}`,
        duration: 6,
      });

      options?.onError?.(error, variables);
    },
    retry: (failureCount, error) => {
      // Don't retry validation errors or conflicts
      const apiError = error as ApiError;
      if (apiError.type === ApiErrorType.ValidationError || apiError.type === ApiErrorType.ConflictError) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

// Generic resource delete mutation hook
export function useResourceDeleteMutation(
  resourceType: string,
  mutationFunction: (params: ResourceDeleteParams) => Promise<IResponse<any>>,
  options?: {
    onSuccess?: (data: IResponse<any>, variables: ResourceDeleteParams) => void;
    onError?: (error: Error, variables: ResourceDeleteParams) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutationFunction,
    onSuccess: (data, variables) => {
      const { memberClusterName, namespace, name } = variables;
      const invalidate = createResourceInvalidateFunction(queryClient, memberClusterName, resourceType);

      // Invalidate list queries to remove the deleted resource
      invalidate.invalidateList();

      // Remove the specific resource from cache
      queryClient.removeQueries({
        queryKey: [memberClusterName, resourceType, 'detail', namespace, name],
      });

      // Show success notification
      notification.success({
        message: `${resourceType} Deleted`,
        description: `Successfully deleted ${resourceType} "${name}" from namespace "${namespace}"`,
        duration: 4,
      });

      options?.onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      const { name, namespace } = variables;
      
      // Show error notification
      const errorMessage = getErrorMessage(error as ApiError, `delete ${resourceType}`);
      notification.error({
        message: `Failed to Delete ${resourceType}`,
        description: `Could not delete ${resourceType} "${name}" from namespace "${namespace}": ${errorMessage}`,
        duration: 6,
      });

      options?.onError?.(error, variables);
    },
    retry: (failureCount, error) => {
      // Don't retry not found errors (resource might already be deleted)
      const apiError = error as ApiError;
      if (apiError.type === ApiErrorType.NotFoundError) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

// Bulk operations mutation hook
export function useBulkResourceMutation(
  resourceType: string,
  mutationFunction: (params: BulkOperationParams) => Promise<IResponse<{ successCount: number; failureCount: number; errors?: string[] }>>,
  options?: {
    onSuccess?: (data: IResponse<{ successCount: number; failureCount: number; errors?: string[] }>, variables: BulkOperationParams) => void;
    onError?: (error: Error, variables: BulkOperationParams) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutationFunction,
    onSuccess: (data, variables) => {
      const { memberClusterName, resources, operation } = variables;
      const invalidate = createResourceInvalidateFunction(queryClient, memberClusterName, resourceType);

      // Invalidate list queries
      invalidate.invalidateList();

      // For delete operations, remove specific resources from cache
      if (operation === 'delete') {
        resources.forEach(({ namespace, name }) => {
          queryClient.removeQueries({
            queryKey: [memberClusterName, resourceType, 'detail', namespace, name],
          });
        });
      }

      // Show success notification with details
      const { successCount, failureCount } = data.data;

      if (failureCount === 0) {
        notification.success({
          message: `Bulk ${operation} Completed`,
          description: `Successfully ${operation}d ${successCount} ${resourceType}(s)`,
          duration: 4,
        });
      } else {
        notification.warning({
          message: `Bulk ${operation} Partially Completed`,
          description: `${successCount} succeeded, ${failureCount} failed out of ${resources.length} ${resourceType}(s)`,
          duration: 6,
        });
      }

      options?.onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      const { resources, operation } = variables;
      
      // Show error notification
      const errorMessage = getErrorMessage(error as ApiError, `bulk ${operation}`);
      notification.error({
        message: `Bulk ${operation} Failed`,
        description: `Could not ${operation} ${resources.length} ${resourceType}(s): ${errorMessage}`,
        duration: 6,
      });

      options?.onError?.(error, variables);
    },
    retry: 1,
    retryDelay: 2000,
  });
}

// Workload-specific operations mutation hook
export function useWorkloadOperationMutation(
  mutationFunction: (params: WorkloadOperationParams) => Promise<IResponse<any>>,
  options?: {
    onSuccess?: (data: IResponse<any>, variables: WorkloadOperationParams) => void;
    onError?: (error: Error, variables: WorkloadOperationParams) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutationFunction,
    onSuccess: (data, variables) => {
      const { memberClusterName, namespace, name, operation } = variables;
      const resourceType = 'deployment'; // Assuming deployment for workload operations
      const invalidate = createResourceInvalidateFunction(queryClient, memberClusterName, resourceType);

      // Invalidate detail and events to show updated status
      invalidate.invalidateDetail(namespace, name);
      invalidate.invalidateEvents(namespace, name);
      invalidate.invalidateList();

      // Show success notification
      const operationPastTense = getOperationPastTense(operation);
      notification.success({
        message: `Workload ${operationPastTense}`,
        description: `Successfully ${operationPastTense.toLowerCase()} workload "${name}" in namespace "${namespace}"`,
        duration: 4,
      });

      options?.onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      const { name, namespace, operation } = variables;
      
      // Show error notification
      const errorMessage = getErrorMessage(error as ApiError, `${operation} workload`);
      notification.error({
        message: `Failed to ${operation} Workload`,
        description: `Could not ${operation} workload "${name}" in namespace "${namespace}": ${errorMessage}`,
        duration: 6,
      });

      options?.onError?.(error, variables);
    },
    retry: (failureCount, error) => {
      // Don't retry not found errors
      const apiError = error as ApiError;
      if (apiError.type === ApiErrorType.NotFoundError) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

// Optimistic updates hook for better UX
export function useOptimisticResourceMutation<T>(
  resourceType: string,
  mutationFunction: (params: ResourceUpdateParams) => Promise<IResponse<T>>,
  optimisticUpdateFunction: (oldData: T, variables: ResourceUpdateParams) => T,
  options?: {
    onError?: (error: Error, variables: ResourceUpdateParams, context?: { previousData?: IResponse<T> }) => void;
    onSettled?: (data: IResponse<T> | undefined, error: Error | null, variables: ResourceUpdateParams) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutationFunction,
    onMutate: async (variables): Promise<{ previousData?: IResponse<T> }> => {
      const { memberClusterName, namespace, name } = variables;
      const queryKey = [memberClusterName, resourceType, 'detail', namespace, name];

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<IResponse<T>>(queryKey);

      // Optimistically update
      if (previousData) {
        const optimisticData = {
          ...previousData,
          data: optimisticUpdateFunction(previousData.data, variables),
        };
        queryClient.setQueryData(queryKey, optimisticData);
      }

      return { previousData };
    },
    onError: (error, variables, context) => {
      const { memberClusterName, namespace, name } = variables;
      const queryKey = [memberClusterName, resourceType, 'detail', namespace, name];

      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }

      // Show error notification
      const errorMessage = getErrorMessage(error as ApiError, `update ${resourceType}`);
      notification.error({
        message: `Failed to Update ${resourceType}`,
        description: `Could not update ${resourceType} "${name}": ${errorMessage}`,
        duration: 6,
      });

      options?.onError?.(error, variables, context);
    },
    onSettled: (data, error, variables) => {
      const { memberClusterName, namespace, name } = variables;
      const invalidate = createResourceInvalidateFunction(queryClient, memberClusterName, resourceType);

      // Always refetch after mutation settles
      invalidate.invalidateDetail(namespace, name);
      invalidate.invalidateList();

      options?.onSettled?.(data, error, variables);
    },
  });
}

// Utility functions
function getErrorMessage(error: ApiError, operation: string): string {
  if (!error.type) {
    return error.message || `Failed to ${operation}`;
  }

  switch (error.type) {
    case ApiErrorType.ValidationError:
      return error.field 
        ? `Validation failed for field "${error.field}": ${error.message}`
        : `Validation failed: ${error.message}`;
    case ApiErrorType.AuthenticationError:
      return 'Authentication required. Please log in again.';
    case ApiErrorType.AuthorizationError:
      return 'Insufficient permissions to perform this action.';
    case ApiErrorType.NotFoundError:
      return 'Resource not found. It may have been deleted.';
    case ApiErrorType.ConflictError:
      return 'Resource conflict. Please refresh and try again.';
    case ApiErrorType.NetworkError:
      return 'Network error. Please check your connection.';
    case ApiErrorType.ServerError:
      return 'Server error. Please try again later.';
    default:
      return error.message || `Failed to ${operation}`;
  }
}

function getOperationPastTense(operation: string): string {
  switch (operation) {
    case 'pause':
      return 'Paused';
    case 'resume':
      return 'Resumed';
    case 'restart':
      return 'Restarted';
    case 'rollback':
      return 'Rolled Back';
    case 'trigger':
      return 'Triggered';
    default:
      return operation.charAt(0).toUpperCase() + operation.slice(1) + 'd';
  }
}

// Mutation state management utilities
export function useMutationState() {
  const queryClient = useQueryClient();

  return {
    // Check if any mutations are in progress
    isMutating: () => queryClient.isMutating() > 0,

    // Get all mutation states
    getMutationStates: () => queryClient.getMutationCache().getAll(),

    // Cancel all mutations
    cancelMutations: () => queryClient.getMutationCache().clear(),

    // Get mutations by resource type
    getMutationsByResourceType: (resourceType: string) => {
      return queryClient.getMutationCache().getAll().filter(
        mutation => mutation.options.mutationKey?.[1] === resourceType
      );
    },
  };
}

// Batch mutations for multiple operations
export function useBatchMutations() {
  const executeBatch = async <T>(
    mutations: Array<() => Promise<T>>,
    options?: {
      onProgress?: (completed: number, total: number) => void;
      onBatchComplete?: (results: T[]) => void;
      onBatchError?: (errors: Error[]) => void;
      concurrency?: number;
    }
  ) => {
    const { onProgress, onBatchComplete, onBatchError, concurrency = 3 } = options || {};
    const results: T[] = [];
    const errors: Error[] = [];

    // Execute mutations in batches with limited concurrency
    for (let i = 0; i < mutations.length; i += concurrency) {
      const batch = mutations.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (mutation, index) => {
        try {
          const result = await mutation();
          results[i + index] = result;
          onProgress?.(results.filter(r => r !== undefined).length, mutations.length);
          return result;
        } catch (error) {
          errors.push(error as Error);
          onProgress?.(results.filter(r => r !== undefined).length, mutations.length);
          throw error;
        }
      });

      await Promise.allSettled(batchPromises);
    }

    if (errors.length > 0) {
      onBatchError?.(errors);
    } else {
      onBatchComplete?.(results);
    }

    return { results, errors };
  };

  return { executeBatch };
}