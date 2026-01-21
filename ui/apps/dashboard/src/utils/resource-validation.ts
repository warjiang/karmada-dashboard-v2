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

import { Rule } from 'antd/es/form';
import { WorkloadKind, ServiceKind, ConfigKind, ServiceType, SecretType } from '@/services/base';

// Validation rule interface
export interface ValidationRule extends Rule {
  field?: string;
  resourceType?: string;
}

// Field validation result interface
export interface FieldValidationResult {
  valid: boolean;
  message?: string;
  code?: string;
}

// Form validation result interface
export interface FormValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  warnings?: Record<string, string>;
}

// Kubernetes naming pattern
const KUBERNETES_NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;
const KUBERNETES_LABEL_KEY_PATTERN = /^([a-z0-9A-Z]([a-z0-9A-Z\-_.]*[a-z0-9A-Z])?\/)?[a-z0-9A-Z]([a-z0-9A-Z\-_.]*[a-z0-9A-Z])?$/;
const KUBERNETES_LABEL_VALUE_PATTERN = /^[a-z0-9A-Z]([a-z0-9A-Z\-_.]*[a-z0-9A-Z])?$/;
const DNS_SUBDOMAIN_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;
const PORT_PATTERN = /^[1-9]\d{0,4}$/;

// Common validation functions
export const validateKubernetesName = (value: string): FieldValidationResult => {
  if (!value) {
    return { valid: false, message: 'Name is required' };
  }
  
  if (!KUBERNETES_NAME_PATTERN.test(value)) {
    return {
      valid: false,
      message: 'Name must be lowercase alphanumeric characters or hyphens, and must start and end with an alphanumeric character'
    };
  }
  
  if (value.length > 253) {
    return { valid: false, message: 'Name must be less than 253 characters' };
  }
  
  return { valid: true };
};

export const validateNamespace = (value: string): FieldValidationResult => {
  if (!value) {
    return { valid: false, message: 'Namespace is required' };
  }
  
  if (value === 'kube-system' || value === 'kube-public' || value === 'kube-node-lease') {
    return {
      valid: true,
      message: 'Warning: This is a system namespace. Proceed with caution.'
    };
  }
  
  return validateKubernetesName(value);
};

export const validateLabels = (labels: Record<string, string>): FieldValidationResult => {
  if (!labels || typeof labels !== 'object') {
    return { valid: true }; // Labels are optional
  }
  
  for (const [key, value] of Object.entries(labels)) {
    // Validate label key
    if (!KUBERNETES_LABEL_KEY_PATTERN.test(key)) {
      return {
        valid: false,
        message: `Invalid label key "${key}". Keys must be valid DNS subdomains with optional prefix.`
      };
    }
    
    if (key.length > 253) {
      return {
        valid: false,
        message: `Label key "${key}" is too long. Keys must be less than 253 characters.`
      };
    }
    
    // Validate label value
    if (value && !KUBERNETES_LABEL_VALUE_PATTERN.test(value)) {
      return {
        valid: false,
        message: `Invalid label value "${value}" for key "${key}". Values must be alphanumeric with hyphens, dots, and underscores.`
      };
    }
    
    if (value && value.length > 63) {
      return {
        valid: false,
        message: `Label value "${value}" is too long. Values must be less than 63 characters.`
      };
    }
  }
  
  return { valid: true };
};

export const validateAnnotations = (annotations: Record<string, string>): FieldValidationResult => {
  if (!annotations || typeof annotations !== 'object') {
    return { valid: true }; // Annotations are optional
  }
  
  for (const [key, value] of Object.entries(annotations)) {
    // Validate annotation key (same as label key)
    if (!KUBERNETES_LABEL_KEY_PATTERN.test(key)) {
      return {
        valid: false,
        message: `Invalid annotation key "${key}". Keys must be valid DNS subdomains with optional prefix.`
      };
    }
    
    if (key.length > 253) {
      return {
        valid: false,
        message: `Annotation key "${key}" is too long. Keys must be less than 253 characters.`
      };
    }
    
    // Annotation values can be any string, but we'll check for reasonable length
    if (value && value.length > 262144) { // 256KB limit
      return {
        valid: false,
        message: `Annotation value for key "${key}" is too long. Values should be less than 256KB.`
      };
    }
  }
  
  return { valid: true };
};

export const validatePort = (port: number | string): FieldValidationResult => {
  const portNum = typeof port === 'string' ? parseInt(port, 10) : port;
  
  if (isNaN(portNum)) {
    return { valid: false, message: 'Port must be a valid number' };
  }
  
  if (portNum < 1 || portNum > 65535) {
    return { valid: false, message: 'Port must be between 1 and 65535' };
  }
  
  return { valid: true };
};

export const validateReplicas = (replicas: number | string): FieldValidationResult => {
  const replicaNum = typeof replicas === 'string' ? parseInt(replicas, 10) : replicas;
  
  if (isNaN(replicaNum)) {
    return { valid: false, message: 'Replicas must be a valid number' };
  }
  
  if (replicaNum < 0) {
    return { valid: false, message: 'Replicas cannot be negative' };
  }
  
  if (replicaNum > 1000) {
    return {
      valid: true,
      message: 'Warning: High replica count may impact cluster performance.'
    };
  }
  
  return { valid: true };
};

export const validateResourceQuantity = (quantity: string): FieldValidationResult => {
  if (!quantity) {
    return { valid: true }; // Optional field
  }
  
  // Basic validation for Kubernetes resource quantities (e.g., "100m", "1Gi", "500Mi")
  const quantityPattern = /^[0-9]+(\.[0-9]+)?([EPTGMK]i?|m)?$/;
  
  if (!quantityPattern.test(quantity)) {
    return {
      valid: false,
      message: 'Invalid resource quantity format. Use formats like "100m", "1Gi", "500Mi".'
    };
  }
  
  return { valid: true };
};

export const validateDNSSubdomain = (value: string): FieldValidationResult => {
  if (!value) {
    return { valid: false, message: 'DNS subdomain is required' };
  }
  
  if (!DNS_SUBDOMAIN_PATTERN.test(value)) {
    return {
      valid: false,
      message: 'Must be a valid DNS subdomain (lowercase letters, numbers, hyphens, and dots)'
    };
  }
  
  if (value.length > 253) {
    return { valid: false, message: 'DNS subdomain must be less than 253 characters' };
  }
  
  return { valid: true };
};

// Resource-specific validation rules
export const resourceValidationRules = {
  // Common metadata validation rules
  metadata: {
    name: [
      { required: true, message: 'Name is required' },
      {
        validator: (_: unknown, value: string) => {
          const result = validateKubernetesName(value);
          return result.valid ? Promise.resolve() : Promise.reject(new Error(result.message));
        }
      }
    ] as ValidationRule[],
    
    namespace: [
      { required: true, message: 'Namespace is required' },
      {
        validator: (_: unknown, value: string) => {
          const result = validateNamespace(value);
          return result.valid ? Promise.resolve() : Promise.reject(new Error(result.message));
        }
      }
    ] as ValidationRule[],
    
    labels: [
      {
        validator: (_: unknown, value: Record<string, string>) => {
          const result = validateLabels(value);
          return result.valid ? Promise.resolve() : Promise.reject(new Error(result.message));
        }
      }
    ] as ValidationRule[],
    
    annotations: [
      {
        validator: (_: unknown, value: Record<string, string>) => {
          const result = validateAnnotations(value);
          return result.valid ? Promise.resolve() : Promise.reject(new Error(result.message));
        }
      }
    ] as ValidationRule[]
  },

  // Deployment validation rules
  [WorkloadKind.Deployment]: {
    'spec.replicas': [
      { required: true, message: 'Replicas is required' },
      { type: 'number', min: 0, max: 1000, message: 'Replicas must be between 0 and 1000' },
      {
        validator: (_: unknown, value: number) => {
          const result = validateReplicas(value);
          return result.valid ? Promise.resolve() : Promise.reject(new Error(result.message));
        }
      }
    ] as ValidationRule[],
    
    'spec.selector.matchLabels': [
      { required: true, message: 'Selector labels are required' },
      {
        validator: (_: unknown, value: Record<string, string>) => {
          if (!value || Object.keys(value).length === 0) {
            return Promise.reject(new Error('At least one selector label is required'));
          }
          const result = validateLabels(value);
          return result.valid ? Promise.resolve() : Promise.reject(new Error(result.message));
        }
      }
    ] as ValidationRule[],
    
    'spec.template.spec.containers': [
      { required: true, message: 'At least one container is required' },
      {
        validator: (_: unknown, value: unknown[]) => {
          if (!Array.isArray(value) || value.length === 0) {
            return Promise.reject(new Error('At least one container is required'));
          }
          return Promise.resolve();
        }
      }
    ] as ValidationRule[],
    
    'spec.template.spec.containers[].name': [
      { required: true, message: 'Container name is required' },
      {
        validator: (_: unknown, value: string) => {
          const result = validateKubernetesName(value);
          return result.valid ? Promise.resolve() : Promise.reject(new Error(result.message));
        }
      }
    ] as ValidationRule[],
    
    'spec.template.spec.containers[].image': [
      { required: true, message: 'Container image is required' },
      {
        validator: (_: unknown, value: string) => {
          if (!value || value.trim().length === 0) {
            return Promise.reject(new Error('Container image is required'));
          }
          // Basic image format validation
          if (!/^[a-z0-9._-]+([:/][a-z0-9._-]+)*$/i.test(value)) {
            return Promise.reject(new Error('Invalid container image format'));
          }
          return Promise.resolve();
        }
      }
    ] as ValidationRule[],
    
    'spec.template.spec.containers[].ports[].containerPort': [
      { required: true, message: 'Container port is required' },
      {
        validator: (_: unknown, value: number) => {
          const result = validatePort(value);
          return result.valid ? Promise.resolve() : Promise.reject(new Error(result.message));
        }
      }
    ] as ValidationRule[]
  },

  // StatefulSet validation rules (similar to Deployment with additional validations)
  [WorkloadKind.Statefulset]: {
    'spec.serviceName': [
      { required: true, message: 'Service name is required for StatefulSet' },
      {
        validator: (_: unknown, value: string) => {
          const result = validateKubernetesName(value);
          return result.valid ? Promise.resolve() : Promise.reject(new Error(result.message));
        }
      }
    ] as ValidationRule[],
    
    'spec.volumeClaimTemplates[].spec.accessModes': [
      { required: true, message: 'Access modes are required for volume claim templates' },
      {
        validator: (_: unknown, value: string[]) => {
          if (!Array.isArray(value) || value.length === 0) {
            return Promise.reject(new Error('At least one access mode is required'));
          }
          const validModes = ['ReadWriteOnce', 'ReadOnlyMany', 'ReadWriteMany'];
          for (const mode of value) {
            if (!validModes.includes(mode)) {
              return Promise.reject(new Error(`Invalid access mode: ${mode}`));
            }
          }
          return Promise.resolve();
        }
      }
    ] as ValidationRule[]
  },

  // DaemonSet validation rules
  [WorkloadKind.Daemonset]: {
    'spec.selector.matchLabels': [
      { required: true, message: 'Selector labels are required' },
      {
        validator: (_: unknown, value: Record<string, string>) => {
          if (!value || Object.keys(value).length === 0) {
            return Promise.reject(new Error('At least one selector label is required'));
          }
          const result = validateLabels(value);
          return result.valid ? Promise.resolve() : Promise.reject(new Error(result.message));
        }
      }
    ] as ValidationRule[]
  },

  // Job validation rules
  [WorkloadKind.Job]: {
    'spec.completions': [
      { type: 'number', min: 1, message: 'Completions must be at least 1' }
    ] as ValidationRule[],
    
    'spec.parallelism': [
      { type: 'number', min: 1, message: 'Parallelism must be at least 1' }
    ] as ValidationRule[],
    
    'spec.backoffLimit': [
      { type: 'number', min: 0, message: 'Backoff limit cannot be negative' }
    ] as ValidationRule[]
  },

  // CronJob validation rules
  [WorkloadKind.Cronjob]: {
    'spec.schedule': [
      { required: true, message: 'Schedule is required' },
      {
        validator: (_: unknown, value: string) => {
          if (!value) {
            return Promise.reject(new Error('Schedule is required'));
          }
          // Enhanced cron expression validation (5 fields: minute hour day month weekday)
          // Supports ranges (e.g., 9-17), lists (e.g., 1,3,5), and step values (e.g., */5)
          const cronPattern = /^(\*|[0-5]?\d(-[0-5]?\d)?(,[0-5]?\d(-[0-5]?\d)?)*|\*\/[0-9]+)\s+(\*|[01]?\d|2[0-3]|([01]?\d|2[0-3])-([01]?\d|2[0-3])|(([01]?\d|2[0-3]),)*([01]?\d|2[0-3])|\*\/[0-9]+)\s+(\*|[0-2]?\d|3[01]|([0-2]?\d|3[01])-([0-2]?\d|3[01])|(([0-2]?\d|3[01]),)*([0-2]?\d|3[01])|\*\/[0-9]+)\s+(\*|[0-9]|1[0-2]|([0-9]|1[0-2])-([0-9]|1[0-2])|(([0-9]|1[0-2]),)*([0-9]|1[0-2])|\*\/[0-9]+)\s+(\*|[0-6]|[0-6]-[0-6]|([0-6],)*[0-6]|\*\/[0-9]+)$/;
          if (!cronPattern.test(value.trim())) {
            return Promise.reject(new Error('Invalid cron expression format'));
          }
          return Promise.resolve();
        }
      }
    ] as ValidationRule[],
    
    'spec.concurrencyPolicy': [
      {
        validator: (_: unknown, value: string) => {
          if (value && !['Allow', 'Forbid', 'Replace'].includes(value)) {
            return Promise.reject(new Error('Concurrency policy must be Allow, Forbid, or Replace'));
          }
          return Promise.resolve();
        }
      }
    ] as ValidationRule[]
  },

  // Service validation rules
  [ServiceKind.Service]: {
    'spec.type': [
      { required: true, message: 'Service type is required' },
      {
        validator: (_: unknown, value: string) => {
          if (!Object.values(ServiceType).includes(value as ServiceType)) {
            return Promise.reject(new Error('Invalid service type'));
          }
          return Promise.resolve();
        }
      }
    ] as ValidationRule[],
    
    'spec.ports': [
      { required: true, message: 'At least one port is required' },
      {
        validator: (_: unknown, value: unknown[]) => {
          if (!Array.isArray(value) || value.length === 0) {
            return Promise.reject(new Error('At least one port is required'));
          }
          return Promise.resolve();
        }
      }
    ] as ValidationRule[],
    
    'spec.ports[].port': [
      { required: true, message: 'Port is required' },
      {
        validator: (_: unknown, value: number) => {
          const result = validatePort(value);
          return result.valid ? Promise.resolve() : Promise.reject(new Error(result.message));
        }
      }
    ] as ValidationRule[],
    
    'spec.ports[].targetPort': [
      { required: true, message: 'Target port is required' },
      {
        validator: (_: unknown, value: number | string) => {
          if (typeof value === 'string') {
            // Named port - validate as Kubernetes name
            const result = validateKubernetesName(value);
            return result.valid ? Promise.resolve() : Promise.reject(new Error(result.message));
          } else {
            // Numeric port
            const result = validatePort(value);
            return result.valid ? Promise.resolve() : Promise.reject(new Error(result.message));
          }
        }
      }
    ] as ValidationRule[],
    
    'spec.selector': [
      {
        validator: (_: unknown, value: Record<string, string>) => {
          if (value) {
            const result = validateLabels(value);
            return result.valid ? Promise.resolve() : Promise.reject(new Error(result.message));
          }
          return Promise.resolve();
        }
      }
    ] as ValidationRule[]
  },

  // Ingress validation rules
  [ServiceKind.Ingress]: {
    'spec.rules': [
      { required: true, message: 'At least one ingress rule is required' },
      {
        validator: (_: unknown, value: unknown[]) => {
          if (!Array.isArray(value) || value.length === 0) {
            return Promise.reject(new Error('At least one ingress rule is required'));
          }
          return Promise.resolve();
        }
      }
    ] as ValidationRule[],
    
    'spec.rules[].host': [
      {
        validator: (_: unknown, value: string) => {
          if (value) {
            const result = validateDNSSubdomain(value);
            return result.valid ? Promise.resolve() : Promise.reject(new Error(result.message));
          }
          return Promise.resolve();
        }
      }
    ] as ValidationRule[],
    
    'spec.rules[].http.paths[].path': [
      {
        validator: (_: unknown, value: string) => {
          if (value && !value.startsWith('/')) {
            return Promise.reject(new Error('Path must start with /'));
          }
          return Promise.resolve();
        }
      }
    ] as ValidationRule[],
    
    'spec.rules[].http.paths[].pathType': [
      { required: true, message: 'Path type is required' },
      {
        validator: (_: unknown, value: string) => {
          if (!['Exact', 'Prefix', 'ImplementationSpecific'].includes(value)) {
            return Promise.reject(new Error('Path type must be Exact, Prefix, or ImplementationSpecific'));
          }
          return Promise.resolve();
        }
      }
    ] as ValidationRule[]
  },

  // ConfigMap validation rules
  [ConfigKind.ConfigMap]: {
    'data': [
      {
        validator: (_: unknown, value: Record<string, string>) => {
          if (value) {
            for (const [key, val] of Object.entries(value)) {
              if (!key || key.trim().length === 0) {
                return Promise.reject(new Error('ConfigMap data keys cannot be empty'));
              }
              if (typeof val !== 'string') {
                return Promise.reject(new Error('ConfigMap data values must be strings'));
              }
            }
          }
          return Promise.resolve();
        }
      }
    ] as ValidationRule[]
  },

  // Secret validation rules
  [ConfigKind.Secret]: {
    'type': [
      { required: true, message: 'Secret type is required' },
      {
        validator: (_: unknown, value: string) => {
          if (!Object.values(SecretType).includes(value as SecretType)) {
            return Promise.reject(new Error('Invalid secret type'));
          }
          return Promise.resolve();
        }
      }
    ] as ValidationRule[],
    
    'data': [
      {
        validator: (_: unknown, value: Record<string, string>) => {
          if (value) {
            for (const [key, val] of Object.entries(value)) {
              if (!key || key.trim().length === 0) {
                return Promise.reject(new Error('Secret data keys cannot be empty'));
              }
              if (typeof val !== 'string') {
                return Promise.reject(new Error('Secret data values must be strings'));
              }
              // Validate base64 encoding for data field
              try {
                atob(val);
              } catch {
                return Promise.reject(new Error(`Secret data value for key "${key}" must be base64 encoded`));
              }
            }
          }
          return Promise.resolve();
        }
      }
    ] as ValidationRule[]
  },

  // PersistentVolumeClaim validation rules
  [ConfigKind.PersistentVolumeClaim]: {
    'spec.accessModes': [
      { required: true, message: 'Access modes are required' },
      {
        validator: (_: unknown, value: string[]) => {
          if (!Array.isArray(value) || value.length === 0) {
            return Promise.reject(new Error('At least one access mode is required'));
          }
          const validModes = ['ReadWriteOnce', 'ReadOnlyMany', 'ReadWriteMany'];
          for (const mode of value) {
            if (!validModes.includes(mode)) {
              return Promise.reject(new Error(`Invalid access mode: ${mode}`));
            }
          }
          return Promise.resolve();
        }
      }
    ] as ValidationRule[],
    
    'spec.resources.requests.storage': [
      { required: true, message: 'Storage request is required' },
      {
        validator: (_: unknown, value: string) => {
          const result = validateResourceQuantity(value);
          return result.valid ? Promise.resolve() : Promise.reject(new Error(result.message));
        }
      }
    ] as ValidationRule[],
    
    'spec.storageClassName': [
      {
        validator: (_: unknown, value: string) => {
          if (value) {
            const result = validateKubernetesName(value);
            return result.valid ? Promise.resolve() : Promise.reject(new Error(result.message));
          }
          return Promise.resolve();
        }
      }
    ] as ValidationRule[]
  }
};

// Get validation rules for a specific resource type and field
export function getValidationRules(resourceType: string, fieldPath: string): ValidationRule[] {
  const resourceRules = resourceValidationRules[resourceType as keyof typeof resourceValidationRules];
  if (!resourceRules) {
    return resourceValidationRules.metadata[fieldPath as keyof typeof resourceValidationRules.metadata] || [];
  }
  
  // Check resource-specific rules first
  const specificRules = resourceRules[fieldPath as keyof typeof resourceRules];
  if (specificRules) {
    return specificRules;
  }
  
  // Fall back to metadata rules for common fields
  if (fieldPath.startsWith('metadata.')) {
    const metadataField = fieldPath.replace('metadata.', '');
    return resourceValidationRules.metadata[metadataField as keyof typeof resourceValidationRules.metadata] || [];
  }
  
  return [];
}

// Validate entire form data
export async function validateResourceForm(resourceType: string, formData: Record<string, unknown>): Promise<FormValidationResult> {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};
  
  // Validate metadata fields first
  const metadataFields = ['metadata.name', 'metadata.namespace', 'metadata.labels', 'metadata.annotations'];
  for (const fieldPath of metadataFields) {
    const fieldValue = getNestedValue(formData, fieldPath);
    // Only validate if the field exists or is required
    if (fieldValue !== undefined || fieldPath.includes('name') || fieldPath.includes('namespace')) {
      const result = await validateField(resourceType, fieldPath, fieldValue, formData);
      if (!result.valid && result.message) {
        errors[fieldPath] = result.message;
      }
    }
  }
  
  // Validate resource-specific required fields that exist in the form data
  const resourceRules = resourceValidationRules[resourceType as keyof typeof resourceValidationRules];
  if (resourceRules) {
    for (const fieldPath of Object.keys(resourceRules)) {
      // Skip array field patterns like 'spec.template.spec.containers[].name'
      if (fieldPath.includes('[]')) {
        continue;
      }
      
      const fieldValue = getNestedValue(formData, fieldPath);
      // Only validate if the field exists or has validation rules that require it
      if (fieldValue !== undefined) {
        const result = await validateField(resourceType, fieldPath, fieldValue, formData);
        if (!result.valid && result.message) {
          errors[fieldPath] = result.message;
        }
      }
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    warnings
  };
}

// Utility function to get nested object values
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

// Field-level validation function for real-time validation
export async function validateField(
  resourceType: string,
  fieldPath: string,
  value: unknown,
  allValues?: Record<string, unknown>
): Promise<FieldValidationResult> {
  const rules = getValidationRules(resourceType, fieldPath);
  
  for (const rule of rules) {
    // Check required validation
    if (rule.required && (!value || value === '')) {
      return {
        valid: false,
        message: rule.message || `${fieldPath} is required`
      };
    }
    
    // Check custom validator
    if (rule.validator) {
      try {
        const result = await rule.validator(null, value);
        // If validator doesn't throw, validation passed
      } catch (error) {
        return {
          valid: false,
          message: error instanceof Error ? error.message : 'Validation failed'
        };
      }
    }
    
    // Check type validation
    if (rule.type && value !== undefined && value !== null && value !== '') {
      if (rule.type === 'number' && typeof value !== 'number') {
        return {
          valid: false,
          message: `${fieldPath} must be a number`
        };
      }
      
      if (rule.type === 'string' && typeof value !== 'string') {
        return {
          valid: false,
          message: `${fieldPath} must be a string`
        };
      }
    }
    
    // Check min/max validation for numbers
    if (typeof value === 'number' && rule.min !== undefined && value < rule.min) {
      return {
        valid: false,
        message: rule.message || `${fieldPath} must be at least ${rule.min}`
      };
    }
    
    if (typeof value === 'number' && rule.max !== undefined && value > rule.max) {
      return {
        valid: false,
        message: rule.message || `${fieldPath} must be at most ${rule.max}`
      };
    }
    
    // Check pattern validation
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      return {
        valid: false,
        message: rule.message || `${fieldPath} format is invalid`
      };
    }
  }
  
  return { valid: true };
}

// Export validation utilities for use in components
export {
  KUBERNETES_NAME_PATTERN,
  KUBERNETES_LABEL_KEY_PATTERN,
  KUBERNETES_LABEL_VALUE_PATTERN,
  DNS_SUBDOMAIN_PATTERN,
  PORT_PATTERN
};