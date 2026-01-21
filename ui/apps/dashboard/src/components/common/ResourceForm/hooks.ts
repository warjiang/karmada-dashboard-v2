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

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notification } from 'antd';
import { ResourceFormData, FormFieldConfig, ResourceTemplate, ResourceExample } from './index';
import { parseYAML, createParseErrorMessage } from '@/utils/resource-parser';
import { serializeToYAML } from '@/utils/resource-serializer';
import { 
  validateField as validateResourceField, 
  validateResourceForm, 
  getValidationRules,
  resourceValidationRules,
  FieldValidationResult,
  FormValidationResult
} from '@/utils/resource-validation';

// Validation hook for resource forms
export function useResourceFormValidation(resourceType: string) {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Validate individual field using comprehensive validation rules
  const validateField = useCallback(async (
    fieldKey: string,
    value: unknown,
    allValues: ResourceFormData
  ): Promise<string | null> => {
    try {
      const result = await validateResourceField(resourceType, fieldKey, value, allValues);
      return result.valid ? null : result.message || 'Validation failed';
    } catch (error) {
      console.error('Field validation error:', error);
      return error instanceof Error ? error.message : 'Validation failed';
    }
  }, [resourceType]);

  // Validate entire form using comprehensive validation rules
  const validateForm = useCallback(async (values: ResourceFormData): Promise<Record<string, string>> => {
    try {
      const result = await validateResourceForm(resourceType, values);
      return result.errors;
    } catch (error) {
      console.error('Form validation error:', error);
      return { form: error instanceof Error ? error.message : 'Form validation failed' };
    }
  }, [resourceType]);

  // Get field error
  const getFieldError = useCallback((fieldKey: string, errors: Record<string, string>): string | undefined => {
    return errors[fieldKey];
  }, []);

  // Clear validation errors
  const clearValidationErrors = useCallback(() => {
    setValidationErrors({});
  }, []);

  // Set validation error
  const setValidationError = useCallback((fieldKey: string, error: string) => {
    setValidationErrors(prev => ({
      ...prev,
      [fieldKey]: error,
    }));
  }, []);

  // Get validation rules for a specific field
  const getFieldValidationRules = useCallback((fieldPath: string) => {
    return getValidationRules(resourceType, fieldPath);
  }, [resourceType]);

  // Validate multiple fields at once
  const validateFields = useCallback(async (
    fields: Array<{ key: string; value: unknown }>,
    allValues: ResourceFormData
  ): Promise<Record<string, string>> => {
    const errors: Record<string, string> = {};
    
    for (const field of fields) {
      const error = await validateField(field.key, field.value, allValues);
      if (error) {
        errors[field.key] = error;
      }
    }
    
    return errors;
  }, [validateField]);

  return {
    validationErrors,
    validateField,
    validateForm,
    getFieldError,
    clearValidationErrors,
    setValidationError,
    setValidationErrors,
    getFieldValidationRules,
    validateFields,
  };
}

// Form state management hook
export function useResourceFormState<T extends ResourceFormData>(
  initialValues?: Partial<T>,
  enableAutoSave = false,
  autoSaveInterval = 30000
) {
  const [formData, setFormData] = useState<Partial<T>>(initialValues || {});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Update form data
  const updateFormData = useCallback((updates: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
    setIsDirty(true);
  }, []);

  // Reset form data
  const resetFormData = useCallback(() => {
    setFormData(initialValues || {});
    setHasUnsavedChanges(false);
    setIsDirty(false);
    setAutoSaveStatus('idle');
  }, [initialValues]);

  // Mark as saved
  const markAsSaved = useCallback(() => {
    setHasUnsavedChanges(false);
    setAutoSaveStatus('saved');
    setTimeout(() => setAutoSaveStatus('idle'), 2000);
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (!enableAutoSave || !hasUnsavedChanges) return;

    const interval = setInterval(async () => {
      try {
        setAutoSaveStatus('saving');
        // Auto-save logic would be implemented here
        // For now, just simulate saving
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch (error) {
        setAutoSaveStatus('error');
        console.error('Auto-save failed:', error);
      }
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [enableAutoSave, hasUnsavedChanges, autoSaveInterval]);

  return {
    formData,
    hasUnsavedChanges,
    isDirty,
    autoSaveStatus,
    updateFormData,
    resetFormData,
    markAsSaved,
    setFormData,
    setHasUnsavedChanges,
  };
}

// Resource form mutation hook
export function useResourceFormMutation<T extends ResourceFormData>(
  memberClusterName: string,
  resourceType: string,
  mode: 'create' | 'edit',
  mutationFunction: (data: T) => Promise<unknown>,
  options?: {
    onSuccess?: (data: unknown, variables: T) => void;
    onError?: (error: unknown, variables: T) => void;
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
        message: `${resourceType} ${mode === 'create' ? 'Created' : 'Updated'}`,
        description: `Successfully ${mode === 'create' ? 'created' : 'updated'} ${resourceType} ${variables.metadata.name}`,
      });

      options?.onSuccess?.(data, variables);
    },
    onError: (error: unknown, variables) => {
      // Show error notification
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      notification.error({
        message: `Failed to ${mode === 'create' ? 'Create' : 'Update'} ${resourceType}`,
        description: errorMessage,
      });

      options?.onError?.(error, variables);
    },
  });
}

// Template management hook
export function useResourceTemplates(resourceType: string) {
  const [templates, setTemplates] = useState<ResourceTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ResourceTemplate | null>(null);

  // Load templates (in a real implementation, this would fetch from an API or local storage)
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        // Mock templates for different resource types
        const mockTemplates: ResourceTemplate[] = [
          {
            name: 'Basic Configuration',
            description: 'A simple configuration with minimal settings',
            category: 'Basic',
            recommended: true,
            data: {
              metadata: {
                name: '',
                namespace: 'default',
                labels: {},
                annotations: {},
              },
              spec: {},
            },
          },
          {
            name: 'Production Ready',
            description: 'Production-ready configuration with best practices',
            category: 'Advanced',
            data: {
              metadata: {
                name: '',
                namespace: 'production',
                labels: {
                  environment: 'production',
                  tier: 'backend',
                },
                annotations: {
                  'deployment.kubernetes.io/revision': '1',
                },
              },
              spec: {},
            },
          },
        ];

        setTemplates(mockTemplates);
      } catch (error) {
        console.error('Failed to load templates:', error);
      }
    };

    loadTemplates();
  }, [resourceType]);

  // Apply template
  const applyTemplate = useCallback((template: ResourceTemplate) => {
    setSelectedTemplate(template);
    return template.data;
  }, []);

  // Clear template selection
  const clearTemplate = useCallback(() => {
    setSelectedTemplate(null);
  }, []);

  return {
    templates,
    selectedTemplate,
    applyTemplate,
    clearTemplate,
  };
}

// Example management hook
export function useResourceExamples(resourceType: string) {
  const [examples, setExamples] = useState<ResourceExample[]>([]);
  const [selectedExample, setSelectedExample] = useState<ResourceExample | null>(null);

  // Load examples
  useEffect(() => {
    const loadExamples = async () => {
      try {
        // Mock examples for different resource types
        const mockExamples: ResourceExample[] = [
          {
            name: 'Simple Deployment',
            description: 'A basic deployment with one container',
            category: 'Deployment',
            complexity: 'basic',
            yaml: JSON.stringify({
              apiVersion: 'apps/v1',
              kind: 'Deployment',
              metadata: {
                name: 'nginx-deployment',
                namespace: 'default',
              },
              spec: {
                replicas: 3,
                selector: {
                  matchLabels: {
                    app: 'nginx',
                  },
                },
                template: {
                  metadata: {
                    labels: {
                      app: 'nginx',
                    },
                  },
                  spec: {
                    containers: [
                      {
                        name: 'nginx',
                        image: 'nginx:1.14.2',
                        ports: [
                          {
                            containerPort: 80,
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            }, null, 2),
          },
        ];

        setExamples(mockExamples);
      } catch (error) {
        console.error('Failed to load examples:', error);
      }
    };

    loadExamples();
  }, [resourceType]);

  // Apply example
  const applyExample = useCallback((example: ResourceExample) => {
    setSelectedExample(example);
    return example.yaml;
  }, []);

  // Clear example selection
  const clearExample = useCallback(() => {
    setSelectedExample(null);
  }, []);

  return {
    examples,
    selectedExample,
    applyExample,
    clearExample,
  };
}

// Form field configuration hook
export function useFormFieldConfiguration(resourceType: string): FormFieldConfig[] {
  return useMemo(() => {
    // Base metadata fields for all resources
    const baseFields: FormFieldConfig[] = [
      {
        key: 'metadata.name',
        label: 'Name',
        type: 'input',
        required: true,
        placeholder: 'Enter resource name',
        tooltip: 'The name of the resource. Must be unique within the namespace.',
        validation: {
          pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
          message: 'Name must be lowercase alphanumeric characters or hyphens, and must start and end with an alphanumeric character',
        },
      },
      {
        key: 'metadata.namespace',
        label: 'Namespace',
        type: 'select',
        required: true,
        placeholder: 'Select namespace',
        tooltip: 'The namespace where the resource will be created.',
        options: [
          { label: 'default', value: 'default' },
          { label: 'kube-system', value: 'kube-system' },
          { label: 'kube-public', value: 'kube-public' },
          { label: 'production', value: 'production' },
          { label: 'staging', value: 'staging' },
          { label: 'development', value: 'development' },
        ],
      },
      {
        key: 'metadata.labels',
        label: 'Labels',
        type: 'custom',
        placeholder: 'Add labels',
        tooltip: 'Key-value pairs used to organize and select resources. Keys must be valid DNS subdomains with optional prefix.',
      },
      {
        key: 'metadata.annotations',
        label: 'Annotations',
        type: 'custom',
        placeholder: 'Add annotations',
        tooltip: 'Key-value pairs used to store arbitrary metadata. Keys must be valid DNS subdomains with optional prefix.',
      },
    ];

    // Resource-specific fields with comprehensive validation
    const resourceSpecificFields: Record<string, FormFieldConfig[]> = {
      deployment: [
        {
          key: 'spec.replicas',
          label: 'Replicas',
          type: 'number',
          required: true,
          placeholder: 'Number of replicas',
          tooltip: 'The number of desired replicas. High values may impact cluster performance.',
          validation: {
            min: 0,
            max: 1000,
            message: 'Replicas must be between 0 and 1000',
          },
          defaultValue: 1,
        },
        {
          key: 'spec.selector.matchLabels',
          label: 'Selector Labels',
          type: 'custom',
          required: true,
          tooltip: 'Labels used to select pods for this deployment. Must match template labels.',
        },
        {
          key: 'spec.template.metadata.labels',
          label: 'Pod Template Labels',
          type: 'custom',
          required: true,
          tooltip: 'Labels applied to pods created by this deployment.',
        },
        {
          key: 'spec.template.spec.containers',
          label: 'Containers',
          type: 'custom',
          required: true,
          tooltip: 'Container specifications for the pod template.',
        },
        {
          key: 'spec.strategy.type',
          label: 'Deployment Strategy',
          type: 'select',
          placeholder: 'Select deployment strategy',
          tooltip: 'Strategy for replacing old pods with new ones.',
          options: [
            { label: 'RollingUpdate', value: 'RollingUpdate' },
            { label: 'Recreate', value: 'Recreate' },
          ],
          defaultValue: 'RollingUpdate',
        },
      ],
      statefulset: [
        {
          key: 'spec.replicas',
          label: 'Replicas',
          type: 'number',
          required: true,
          placeholder: 'Number of replicas',
          tooltip: 'The number of desired replicas for the StatefulSet.',
          validation: {
            min: 0,
            max: 1000,
            message: 'Replicas must be between 0 and 1000',
          },
          defaultValue: 1,
        },
        {
          key: 'spec.serviceName',
          label: 'Service Name',
          type: 'input',
          required: true,
          placeholder: 'Enter service name',
          tooltip: 'The name of the service that governs this StatefulSet.',
          validation: {
            pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
            message: 'Service name must be lowercase alphanumeric with hyphens',
          },
        },
        {
          key: 'spec.selector.matchLabels',
          label: 'Selector Labels',
          type: 'custom',
          required: true,
          tooltip: 'Labels used to select pods for this StatefulSet.',
        },
        {
          key: 'spec.volumeClaimTemplates',
          label: 'Volume Claim Templates',
          type: 'custom',
          tooltip: 'Templates for persistent volume claims.',
        },
      ],
      daemonset: [
        {
          key: 'spec.selector.matchLabels',
          label: 'Selector Labels',
          type: 'custom',
          required: true,
          tooltip: 'Labels used to select pods for this DaemonSet.',
        },
        {
          key: 'spec.template.metadata.labels',
          label: 'Pod Template Labels',
          type: 'custom',
          required: true,
          tooltip: 'Labels applied to pods created by this DaemonSet.',
        },
        {
          key: 'spec.updateStrategy.type',
          label: 'Update Strategy',
          type: 'select',
          placeholder: 'Select update strategy',
          tooltip: 'Strategy for updating DaemonSet pods.',
          options: [
            { label: 'RollingUpdate', value: 'RollingUpdate' },
            { label: 'OnDelete', value: 'OnDelete' },
          ],
          defaultValue: 'RollingUpdate',
        },
      ],
      job: [
        {
          key: 'spec.completions',
          label: 'Completions',
          type: 'number',
          placeholder: 'Number of completions',
          tooltip: 'The number of successful completions required.',
          validation: {
            min: 1,
            message: 'Completions must be at least 1',
          },
          defaultValue: 1,
        },
        {
          key: 'spec.parallelism',
          label: 'Parallelism',
          type: 'number',
          placeholder: 'Number of parallel pods',
          tooltip: 'The maximum number of pods that can run in parallel.',
          validation: {
            min: 1,
            message: 'Parallelism must be at least 1',
          },
          defaultValue: 1,
        },
        {
          key: 'spec.backoffLimit',
          label: 'Backoff Limit',
          type: 'number',
          placeholder: 'Number of retries',
          tooltip: 'The number of retries before marking the job as failed.',
          validation: {
            min: 0,
            message: 'Backoff limit cannot be negative',
          },
          defaultValue: 6,
        },
        {
          key: 'spec.activeDeadlineSeconds',
          label: 'Active Deadline (seconds)',
          type: 'number',
          placeholder: 'Maximum duration in seconds',
          tooltip: 'The maximum duration the job can run before being terminated.',
          validation: {
            min: 1,
            message: 'Active deadline must be positive',
          },
        },
      ],
      cronjob: [
        {
          key: 'spec.schedule',
          label: 'Schedule',
          type: 'input',
          required: true,
          placeholder: '0 0 * * *',
          tooltip: 'Cron expression for scheduling the job (e.g., "0 0 * * *" for daily at midnight).',
          validation: {
            pattern: /^(\*|[0-5]?\d|\*\/[0-9]+)\s+(\*|[01]?\d|2[0-3]|\*\/[0-9]+)\s+(\*|[0-2]?\d|3[01]|\*\/[0-9]+)\s+(\*|[0-9]|1[0-2]|\*\/[0-9]+)\s+(\*|[0-6]|\*\/[0-9]+)$/,
            message: 'Invalid cron expression format',
          },
        },
        {
          key: 'spec.concurrencyPolicy',
          label: 'Concurrency Policy',
          type: 'select',
          placeholder: 'Select concurrency policy',
          tooltip: 'How to handle concurrent executions of the job.',
          options: [
            { label: 'Allow', value: 'Allow' },
            { label: 'Forbid', value: 'Forbid' },
            { label: 'Replace', value: 'Replace' },
          ],
          defaultValue: 'Allow',
        },
        {
          key: 'spec.successfulJobsHistoryLimit',
          label: 'Successful Jobs History Limit',
          type: 'number',
          placeholder: 'Number of successful jobs to keep',
          tooltip: 'The number of successful finished jobs to retain.',
          validation: {
            min: 0,
            message: 'History limit cannot be negative',
          },
          defaultValue: 3,
        },
        {
          key: 'spec.failedJobsHistoryLimit',
          label: 'Failed Jobs History Limit',
          type: 'number',
          placeholder: 'Number of failed jobs to keep',
          tooltip: 'The number of failed finished jobs to retain.',
          validation: {
            min: 0,
            message: 'History limit cannot be negative',
          },
          defaultValue: 1,
        },
      ],
      service: [
        {
          key: 'spec.type',
          label: 'Service Type',
          type: 'select',
          required: true,
          placeholder: 'Select service type',
          tooltip: 'The type of service to create.',
          options: [
            { label: 'ClusterIP', value: 'ClusterIP' },
            { label: 'NodePort', value: 'NodePort' },
            { label: 'LoadBalancer', value: 'LoadBalancer' },
            { label: 'ExternalName', value: 'ExternalName' },
          ],
          defaultValue: 'ClusterIP',
        },
        {
          key: 'spec.ports',
          label: 'Ports',
          type: 'custom',
          required: true,
          tooltip: 'The ports that this service exposes.',
        },
        {
          key: 'spec.selector',
          label: 'Selector',
          type: 'custom',
          tooltip: 'Labels used to select pods for this service.',
        },
        {
          key: 'spec.sessionAffinity',
          label: 'Session Affinity',
          type: 'select',
          placeholder: 'Select session affinity',
          tooltip: 'Whether to enable session affinity.',
          options: [
            { label: 'None', value: 'None' },
            { label: 'ClientIP', value: 'ClientIP' },
          ],
          defaultValue: 'None',
        },
      ],
      ingress: [
        {
          key: 'spec.ingressClassName',
          label: 'Ingress Class',
          type: 'input',
          placeholder: 'Enter ingress class name',
          tooltip: 'The name of the ingress class to use.',
        },
        {
          key: 'spec.rules',
          label: 'Rules',
          type: 'custom',
          required: true,
          tooltip: 'Ingress rules for routing traffic.',
        },
        {
          key: 'spec.tls',
          label: 'TLS Configuration',
          type: 'custom',
          tooltip: 'TLS configuration for secure connections.',
        },
        {
          key: 'spec.defaultBackend',
          label: 'Default Backend',
          type: 'custom',
          tooltip: 'Default backend for requests that don\'t match any rule.',
        },
      ],
      configmap: [
        {
          key: 'data',
          label: 'Data',
          type: 'custom',
          tooltip: 'The configuration data stored in this ConfigMap as key-value pairs.',
        },
        {
          key: 'binaryData',
          label: 'Binary Data',
          type: 'custom',
          tooltip: 'Binary data stored in this ConfigMap (base64 encoded).',
        },
        {
          key: 'immutable',
          label: 'Immutable',
          type: 'switch',
          tooltip: 'Whether this ConfigMap is immutable (cannot be updated).',
          defaultValue: false,
        },
      ],
      secret: [
        {
          key: 'type',
          label: 'Secret Type',
          type: 'select',
          required: true,
          placeholder: 'Select secret type',
          tooltip: 'The type of secret to create.',
          options: [
            { label: 'Opaque', value: 'Opaque' },
            { label: 'Docker Config JSON', value: 'kubernetes.io/dockerconfigjson' },
            { label: 'Basic Auth', value: 'kubernetes.io/basic-auth' },
            { label: 'SSH Auth', value: 'kubernetes.io/ssh-auth' },
            { label: 'TLS', value: 'kubernetes.io/tls' },
            { label: 'Service Account Token', value: 'kubernetes.io/service-account-token' },
          ],
          defaultValue: 'Opaque',
        },
        {
          key: 'data',
          label: 'Data',
          type: 'custom',
          tooltip: 'The secret data (will be base64 encoded automatically).',
        },
        {
          key: 'stringData',
          label: 'String Data',
          type: 'custom',
          tooltip: 'Secret data as plain text (will be base64 encoded automatically).',
        },
        {
          key: 'immutable',
          label: 'Immutable',
          type: 'switch',
          tooltip: 'Whether this Secret is immutable (cannot be updated).',
          defaultValue: false,
        },
      ],
      persistentvolumeclaim: [
        {
          key: 'spec.accessModes',
          label: 'Access Modes',
          type: 'custom',
          required: true,
          tooltip: 'The access modes for the persistent volume.',
        },
        {
          key: 'spec.resources.requests.storage',
          label: 'Storage Request',
          type: 'input',
          required: true,
          placeholder: 'e.g., 10Gi',
          tooltip: 'The amount of storage requested (e.g., "10Gi", "500Mi").',
          validation: {
            pattern: /^[0-9]+(\.[0-9]+)?([EPTGMK]i?|m)?$/,
            message: 'Invalid storage quantity format. Use formats like "10Gi", "500Mi".',
          },
        },
        {
          key: 'spec.storageClassName',
          label: 'Storage Class',
          type: 'input',
          placeholder: 'Enter storage class name',
          tooltip: 'The name of the storage class to use.',
        },
        {
          key: 'spec.volumeMode',
          label: 'Volume Mode',
          type: 'select',
          placeholder: 'Select volume mode',
          tooltip: 'The volume mode (Filesystem or Block).',
          options: [
            { label: 'Filesystem', value: 'Filesystem' },
            { label: 'Block', value: 'Block' },
          ],
          defaultValue: 'Filesystem',
        },
        {
          key: 'spec.selector',
          label: 'Selector',
          type: 'custom',
          tooltip: 'Label selector for matching persistent volumes.',
        },
      ],
    };

    return [
      ...baseFields,
      ...(resourceSpecificFields[resourceType] || []),
    ];
  }, [resourceType]);
}

// Progress tracking hook
export function useFormProgress(fields: FormFieldConfig[], formData: Partial<ResourceFormData>) {
  return useMemo(() => {
    const requiredFields = fields.filter(field => field.required);
    const completedFields = requiredFields.filter(field => {
      const value = getNestedValue(formData, field.key);
      return value !== undefined && value !== null && value !== '';
    });

    const totalSteps = 3; // metadata, spec, validation
    const completedSteps = [
      // Metadata step
      formData.metadata?.name && formData.metadata?.namespace,
      // Spec step
      formData.spec && Object.keys(formData.spec).length > 0,
      // Validation step (assume valid for now)
      true,
    ].filter(Boolean).length;

    return {
      totalFields: requiredFields.length,
      completedFields: completedFields.length,
      fieldCompletionPercentage: requiredFields.length > 0 ? (completedFields.length / requiredFields.length) * 100 : 0,
      totalSteps,
      completedSteps,
      stepCompletionPercentage: (completedSteps / totalSteps) * 100,
    };
  }, [fields, formData]);
}

// Utility function to get nested object values
function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object') return undefined;
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

// YAML conversion hooks
export function useYAMLConversion() {
  const convertToYAML = useCallback((data: unknown): string => {
    try {
      const result = serializeToYAML(data);
      if (!result.success) {
        console.error('Failed to convert to YAML:', result.error);
        return '';
      }
      return result.content || '';
    } catch (error) {
      console.error('Failed to convert to YAML:', error);
      return '';
    }
  }, []);

  const convertFromYAML = useCallback((yaml: string): unknown => {
    const result = parseYAML(yaml);
    if (!result.success) {
      const errorMessage = createParseErrorMessage(result);
      console.error('Failed to parse YAML:', errorMessage);
      throw new Error(errorMessage || 'Invalid YAML format');
    }
    return result.data;
  }, []);

  const validateYAML = useCallback((yaml: string): { valid: boolean; error?: string } => {
    const result = parseYAML(yaml);
    if (result.success) {
      return { valid: true };
    }
    
    const errorMessage = createParseErrorMessage(result);
    return {
      valid: false,
      error: errorMessage || 'Invalid YAML format',
    };
  }, []);

  return {
    convertToYAML,
    convertFromYAML,
    validateYAML,
  };
}