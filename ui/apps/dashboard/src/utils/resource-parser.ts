/*
Copyright 2025 The Karmada Authors.

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

import * as yaml from 'yaml';
import { ApiError, ApiErrorType } from '@/services/base';

// Parser error interfaces
export interface ParseError {
  message: string;
  line?: number;
  column?: number;
  position?: number;
  type: ParseErrorType;
  context?: string;
}

export enum ParseErrorType {
  SyntaxError = 'SYNTAX_ERROR',
  ValidationError = 'VALIDATION_ERROR',
  SchemaError = 'SCHEMA_ERROR',
  StructureError = 'STRUCTURE_ERROR'
}

export interface ParseResult<T = unknown> {
  success: boolean;
  data?: T;
  errors: ParseError[];
  warnings?: string[];
}

// Kubernetes resource schema interfaces
export interface KubernetesResource {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    [key: string]: unknown;
  };
  spec?: unknown;
  status?: unknown;
  [key: string]: unknown;
}

// Basic Kubernetes API schema validation
const REQUIRED_FIELDS = ['apiVersion', 'kind', 'metadata'];
const METADATA_REQUIRED_FIELDS = ['name'];

// Known Kubernetes API versions and kinds for validation
const VALID_API_VERSIONS = [
  'v1',
  'apps/v1',
  'extensions/v1beta1',
  'networking.k8s.io/v1',
  'networking.k8s.io/v1beta1',
  'batch/v1',
  'batch/v1beta1',
  'autoscaling/v1',
  'autoscaling/v2',
  'policy/v1',
  'policy/v1beta1',
  'rbac.authorization.k8s.io/v1',
  'storage.k8s.io/v1',
  'apiextensions.k8s.io/v1',
  'admissionregistration.k8s.io/v1',
  'scheduling.k8s.io/v1',
  'coordination.k8s.io/v1',
  'node.k8s.io/v1',
  'discovery.k8s.io/v1',
  'flowcontrol.apiserver.k8s.io/v1beta3'
];

const VALID_KINDS = [
  // Core resources
  'Pod', 'Service', 'ConfigMap', 'Secret', 'PersistentVolume', 'PersistentVolumeClaim',
  'Namespace', 'Node', 'ServiceAccount', 'Endpoints', 'Event',
  
  // Apps resources
  'Deployment', 'StatefulSet', 'DaemonSet', 'ReplicaSet',
  
  // Batch resources
  'Job', 'CronJob',
  
  // Networking resources
  'Ingress', 'NetworkPolicy', 'IngressClass',
  
  // RBAC resources
  'Role', 'RoleBinding', 'ClusterRole', 'ClusterRoleBinding',
  
  // Storage resources
  'StorageClass', 'VolumeAttachment',
  
  // Policy resources
  'PodDisruptionBudget', 'PodSecurityPolicy',
  
  // Autoscaling resources
  'HorizontalPodAutoscaler', 'VerticalPodAutoscaler',
  
  // Custom Resource Definitions
  'CustomResourceDefinition'
];

// Name validation regex (RFC 1123 DNS subdomain names)
const DNS_SUBDOMAIN_REGEX = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;
const DNS_LABEL_REGEX = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

/**
 * Parse YAML content with comprehensive error handling and validation
 */
export function parseYAML<T = KubernetesResource>(content: string): ParseResult<T> {
  const errors: ParseError[] = [];
  const warnings: string[] = [];

  if (!content || content.trim() === '') {
    errors.push({
      message: 'Empty content provided',
      type: ParseErrorType.SyntaxError
    });
    return { success: false, errors, warnings };
  }

  try {
    // Parse YAML with detailed error information
    const document = yaml.parseDocument(content, {
      keepSourceTokens: true,
      strict: true,
      uniqueKeys: true
    });

    // Check for YAML parsing errors
    if (document.errors.length > 0) {
      document.errors.forEach(error => {
        const parseError: ParseError = {
          message: error.message,
          type: ParseErrorType.SyntaxError,
          context: error.toString()
        };

        // Extract line and column information if available
        if (error.pos && error.pos.length >= 2) {
          parseError.line = error.pos[0];
          parseError.column = error.pos[1];
        }

        errors.push(parseError);
      });
    }

    // Check for YAML warnings
    if (document.warnings.length > 0) {
      document.warnings.forEach(warning => {
        warnings.push(warning.message);
      });
    }

    if (errors.length > 0) {
      return { success: false, errors, warnings };
    }

    const data = document.toJS() as T;
    
    // Validate structure if it looks like a Kubernetes resource
    if (isKubernetesResource(data)) {
      const validationErrors = validateKubernetesResource(data);
      errors.push(...validationErrors);
    }

    return {
      success: errors.length === 0,
      data,
      errors,
      warnings
    };

  } catch (error) {
    const parseError: ParseError = {
      message: error instanceof Error ? error.message : 'Unknown YAML parsing error',
      type: ParseErrorType.SyntaxError
    };

    // Try to extract line information from error message
    if (error instanceof Error) {
      const lineMatch = error.message.match(/at line (\d+)/);
      if (lineMatch) {
        parseError.line = parseInt(lineMatch[1], 10);
      }
    }

    errors.push(parseError);
    return { success: false, errors, warnings };
  }
}

/**
 * Parse JSON content with comprehensive error handling and validation
 */
export function parseJSON<T = KubernetesResource>(content: string): ParseResult<T> {
  const errors: ParseError[] = [];
  const warnings: string[] = [];

  if (!content || content.trim() === '') {
    errors.push({
      message: 'Empty content provided',
      type: ParseErrorType.SyntaxError
    });
    return { success: false, errors, warnings };
  }

  try {
    const data = JSON.parse(content) as T;
    
    // Validate structure if it looks like a Kubernetes resource
    if (isKubernetesResource(data)) {
      const validationErrors = validateKubernetesResource(data);
      errors.push(...validationErrors);
    }

    return {
      success: errors.length === 0,
      data,
      errors,
      warnings
    };

  } catch (error) {
    const parseError: ParseError = {
      message: 'Invalid JSON format',
      type: ParseErrorType.SyntaxError
    };

    // Extract detailed error information from JSON.parse error
    if (error instanceof SyntaxError) {
      parseError.message = error.message;
      
      // Try to extract position information
      const positionMatch = error.message.match(/at position (\d+)/);
      if (positionMatch) {
        const position = parseInt(positionMatch[1], 10);
        parseError.position = position;
        
        // Calculate line and column from position
        const lines = content.substring(0, position).split('\n');
        parseError.line = lines.length;
        parseError.column = lines[lines.length - 1].length + 1;
        
        // Add context around the error
        const contextStart = Math.max(0, position - 20);
        const contextEnd = Math.min(content.length, position + 20);
        parseError.context = content.substring(contextStart, contextEnd);
      }
    }

    errors.push(parseError);
    return { success: false, errors, warnings };
  }
}

/**
 * Auto-detect format and parse content (YAML or JSON)
 */
export function parseResource<T = KubernetesResource>(content: string): ParseResult<T> {
  // Try to detect format based on content
  const trimmedContent = content.trim();
  
  // If it starts with { or [, likely JSON
  if (trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) {
    const jsonResult = parseJSON<T>(content);
    if (jsonResult.success) {
      return jsonResult;
    }
    
    // If JSON parsing failed, try YAML as fallback
    const yamlResult = parseYAML<T>(content);
    if (yamlResult.success) {
      yamlResult.warnings = yamlResult.warnings || [];
      yamlResult.warnings.push('Content appeared to be JSON but was parsed as YAML');
    }
    return yamlResult;
  }
  
  // Otherwise, try YAML first
  const yamlResult = parseYAML<T>(content);
  if (yamlResult.success) {
    return yamlResult;
  }
  
  // If YAML failed, try JSON as fallback
  const jsonResult = parseJSON<T>(content);
  if (jsonResult.success) {
    jsonResult.warnings = jsonResult.warnings || [];
    jsonResult.warnings.push('Content appeared to be YAML but was parsed as JSON');
    return jsonResult;
  }
  
  // Return YAML errors as primary (more descriptive)
  return yamlResult;
}

/**
 * Check if data looks like a Kubernetes resource
 */
function isKubernetesResource(data: unknown): data is KubernetesResource {
  return (
    typeof data === 'object' &&
    data !== null &&
    ('apiVersion' in data || 'kind' in data || 'metadata' in data)
  );
}

/**
 * Validate Kubernetes resource structure and schema
 */
function validateKubernetesResource(resource: KubernetesResource): ParseError[] {
  const errors: ParseError[] = [];

  // Validate required top-level fields
  REQUIRED_FIELDS.forEach(field => {
    if (!(field in resource) || resource[field] === undefined || resource[field] === null) {
      errors.push({
        message: `Missing required field: ${field}`,
        type: ParseErrorType.ValidationError
      });
    }
  });

  // Validate apiVersion format
  if (typeof resource.apiVersion === 'string') {
    if (!VALID_API_VERSIONS.includes(resource.apiVersion)) {
      errors.push({
        message: `Unknown apiVersion: ${resource.apiVersion}. This may be a custom resource or newer API version.`,
        type: ParseErrorType.SchemaError
      });
    }
  } else {
    errors.push({
      message: 'apiVersion must be a string',
      type: ParseErrorType.ValidationError
    });
  }

  // Validate kind
  if (typeof resource.kind === 'string') {
    if (!VALID_KINDS.includes(resource.kind)) {
      errors.push({
        message: `Unknown kind: ${resource.kind}. This may be a custom resource.`,
        type: ParseErrorType.SchemaError
      });
    }
  } else {
    errors.push({
      message: 'kind must be a string',
      type: ParseErrorType.ValidationError
    });
  }

  // Validate metadata
  if (typeof resource.metadata === 'object' && resource.metadata !== null) {
    const metadata = resource.metadata;

    // Validate required metadata fields
    METADATA_REQUIRED_FIELDS.forEach(field => {
      if (!(field in metadata) || metadata[field] === undefined || metadata[field] === null) {
        errors.push({
          message: `Missing required metadata field: ${field}`,
          type: ParseErrorType.ValidationError
        });
      }
    });

    // Validate name format
    if (typeof metadata.name === 'string') {
      if (!DNS_LABEL_REGEX.test(metadata.name)) {
        errors.push({
          message: `Invalid name format: ${metadata.name}. Names must be lowercase alphanumeric with hyphens.`,
          type: ParseErrorType.ValidationError
        });
      }
      if (metadata.name.length > 253) {
        errors.push({
          message: `Name too long: ${metadata.name}. Names must be less than 253 characters.`,
          type: ParseErrorType.ValidationError
        });
      }
    }

    // Validate namespace format if present
    if (metadata.namespace && typeof metadata.namespace === 'string') {
      if (!DNS_LABEL_REGEX.test(metadata.namespace)) {
        errors.push({
          message: `Invalid namespace format: ${metadata.namespace}. Namespaces must be lowercase alphanumeric with hyphens.`,
          type: ParseErrorType.ValidationError
        });
      }
    }

    // Validate labels format
    if (metadata.labels) {
      if (typeof metadata.labels !== 'object' || Array.isArray(metadata.labels)) {
        errors.push({
          message: 'Labels must be an object with string key-value pairs',
          type: ParseErrorType.ValidationError
        });
      } else {
        Object.entries(metadata.labels).forEach(([key, value]) => {
          if (typeof key !== 'string' || typeof value !== 'string') {
            errors.push({
              message: `Invalid label: ${key}=${value}. Labels must be string key-value pairs.`,
              type: ParseErrorType.ValidationError
            });
          }
          
          // Validate label key format
          if (!DNS_SUBDOMAIN_REGEX.test(key) && !key.includes('/')) {
            errors.push({
              message: `Invalid label key format: ${key}`,
              type: ParseErrorType.ValidationError
            });
          }
          
          // Validate label value length
          if (value.length > 63) {
            errors.push({
              message: `Label value too long: ${key}=${value}. Values must be less than 63 characters.`,
              type: ParseErrorType.ValidationError
            });
          }
        });
      }
    }

    // Validate annotations format
    if (metadata.annotations) {
      if (typeof metadata.annotations !== 'object' || Array.isArray(metadata.annotations)) {
        errors.push({
          message: 'Annotations must be an object with string key-value pairs',
          type: ParseErrorType.ValidationError
        });
      } else {
        Object.entries(metadata.annotations).forEach(([key, value]) => {
          if (typeof key !== 'string' || typeof value !== 'string') {
            errors.push({
              message: `Invalid annotation: ${key}=${value}. Annotations must be string key-value pairs.`,
              type: ParseErrorType.ValidationError
            });
          }
        });
      }
    }
  } else {
    errors.push({
      message: 'metadata must be an object',
      type: ParseErrorType.ValidationError
    });
  }

  return errors;
}

/**
 * Format error message with context for display
 */
export function formatParseError(error: ParseError): string {
  let message = error.message;
  
  if (error.line !== undefined) {
    message += ` (line ${error.line}`;
    if (error.column !== undefined) {
      message += `, column ${error.column}`;
    }
    message += ')';
  } else if (error.position !== undefined) {
    message += ` (position ${error.position})`;
  }
  
  if (error.context) {
    message += `\nContext: ${error.context}`;
  }
  
  return message;
}

/**
 * Create a comprehensive error message from parse result
 */
export function createParseErrorMessage(result: ParseResult): string {
  if (result.success) {
    return '';
  }
  
  const errorMessages = result.errors.map(formatParseError);
  let message = errorMessages.join('\n');
  
  if (result.warnings && result.warnings.length > 0) {
    message += '\n\nWarnings:\n' + result.warnings.join('\n');
  }
  
  return message;
}

/**
 * Throw an ApiError from parse result
 */
export function throwParseError(result: ParseResult): never {
  const message = createParseErrorMessage(result);
  const primaryError = result.errors[0];
  
  let errorType = ApiErrorType.ValidationError;
  if (primaryError?.type === ParseErrorType.SyntaxError) {
    errorType = ApiErrorType.ValidationError;
  } else if (primaryError?.type === ParseErrorType.SchemaError) {
    errorType = ApiErrorType.ValidationError;
  }
  
  throw new ApiError({
    code: 400,
    message: 'Resource parsing failed',
    type: errorType,
    details: message
  });
}