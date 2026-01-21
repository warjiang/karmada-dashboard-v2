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

// Serialization options
export interface SerializationOptions {
  format: 'yaml' | 'json';
  indent?: number;
  sortKeys?: boolean;
  removeEmpty?: boolean;
  preserveComments?: boolean;
}

export interface SerializationResult {
  success: boolean;
  content?: string;
  error?: string;
}

// Default serialization options
const DEFAULT_YAML_OPTIONS: SerializationOptions = {
  format: 'yaml',
  indent: 2,
  sortKeys: true,
  removeEmpty: false,
  preserveComments: true
};

const DEFAULT_JSON_OPTIONS: SerializationOptions = {
  format: 'json',
  indent: 2,
  sortKeys: true,
  removeEmpty: false,
  preserveComments: false
};

/**
 * Pretty print resource as YAML with proper formatting
 */
export function serializeToYAML(
  data: unknown, 
  options: Partial<SerializationOptions> = {}
): SerializationResult {
  const opts = { ...DEFAULT_YAML_OPTIONS, ...options };
  
  try {
    // Clean data if requested
    const cleanedData = opts.removeEmpty ? removeEmptyFields(data) : data;
    
    // Configure YAML document options
    const yamlOptions: yaml.DocumentOptions & yaml.SchemaOptions & yaml.ParseOptions & yaml.CreateNodeOptions & yaml.ToStringOptions = {
      indent: opts.indent || 2,
      lineWidth: 120,
      minContentWidth: 20,
      sortMapEntries: opts.sortKeys,
      keepSourceTokens: opts.preserveComments,
      aliasDuplicateObjects: false,
      anchorPrefix: '',
      collectionStyle: 'any',
      commentString: (comment: string) => `# ${comment}`,
      defaultKeyType: null,
      defaultStringType: 'PLAIN',
      directives: null,
      doubleQuotedAsJSON: false,
      doubleQuotedMinMultiLineLength: 40,
      falseStr: 'false',
      flowCollectionPadding: true,
      indentSeq: true,
      keepUndefined: false,
      logLevel: 'warn',
      mapAsMap: false,
      maxAliasCount: 100,
      nullStr: 'null',
      prettyErrors: true,
      simpleKeys: false,
      singleQuote: false,
      strict: true,
      trueStr: 'true',
      uniqueKeys: true,
      version: '1.2'
    };

    // Create YAML document
    const doc = new yaml.Document(cleanedData, yamlOptions);
    
    // Format the document
    const content = doc.toString(yamlOptions);
    
    return {
      success: true,
      content: content.trim()
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to serialize to YAML'
    };
  }
}

/**
 * Pretty print resource as JSON with proper formatting
 */
export function serializeToJSON(
  data: unknown, 
  options: Partial<SerializationOptions> = {}
): SerializationResult {
  const opts = { ...DEFAULT_JSON_OPTIONS, ...options };
  
  try {
    // Clean data if requested
    const cleanedData = opts.removeEmpty ? removeEmptyFields(data) : data;
    
    // Sort keys if requested
    const processedData = opts.sortKeys ? sortObjectKeys(cleanedData) : cleanedData;
    
    // Serialize to JSON with proper indentation
    const content = JSON.stringify(processedData, null, opts.indent || 2);
    
    return {
      success: true,
      content
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to serialize to JSON'
    };
  }
}

/**
 * Auto-format resource based on preferred format
 */
export function serializeResource(
  data: unknown,
  format: 'yaml' | 'json' = 'yaml',
  options: Partial<SerializationOptions> = {}
): SerializationResult {
  const opts = { ...options, format };
  
  if (format === 'json') {
    return serializeToJSON(data, opts);
  } else {
    return serializeToYAML(data, opts);
  }
}

/**
 * Remove empty fields from object recursively
 */
function removeEmptyFields(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    const filtered = obj
      .map(removeEmptyFields)
      .filter(item => !isEmpty(item));
    return filtered.length > 0 ? filtered : undefined;
  }
  
  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    
    Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
      const cleanedValue = removeEmptyFields(value);
      if (!isEmpty(cleanedValue)) {
        cleaned[key] = cleanedValue;
      }
    });
    
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }
  
  return obj;
}

/**
 * Check if value is considered empty
 */
function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined || value === '') {
    return true;
  }
  
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  
  if (typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).length === 0;
  }
  
  return false;
}

/**
 * Sort object keys recursively
 */
function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  
  if (typeof obj === 'object') {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj as Record<string, unknown>).sort();
    
    keys.forEach(key => {
      sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
    });
    
    return sorted;
  }
  
  return obj;
}

/**
 * Format resource with Kubernetes-specific ordering
 */
export function formatKubernetesResource(
  data: unknown,
  format: 'yaml' | 'json' = 'yaml'
): SerializationResult {
  try {
    // Apply Kubernetes-specific field ordering
    const orderedData = applyKubernetesFieldOrder(data);
    
    const options: Partial<SerializationOptions> = {
      format,
      sortKeys: false, // We handle sorting manually for K8s resources
      removeEmpty: true,
      preserveComments: true
    };
    
    return serializeResource(orderedData, format, options);
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to format Kubernetes resource'
    };
  }
}

/**
 * Apply Kubernetes-specific field ordering
 */
function applyKubernetesFieldOrder(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }
  
  const resource = obj as Record<string, unknown>;
  const ordered: Record<string, unknown> = {};
  
  // Kubernetes resource field order
  const fieldOrder = [
    'apiVersion',
    'kind',
    'metadata',
    'spec',
    'status',
    'data',
    'stringData',
    'binaryData',
    'rules',
    'subjects',
    'roleRef'
  ];
  
  // Add fields in preferred order
  fieldOrder.forEach(field => {
    if (field in resource) {
      if (field === 'metadata') {
        ordered[field] = orderMetadata(resource[field]);
      } else {
        ordered[field] = applyKubernetesFieldOrder(resource[field]);
      }
    }
  });
  
  // Add remaining fields in alphabetical order
  const remainingKeys = Object.keys(resource)
    .filter(key => !fieldOrder.includes(key))
    .sort();
    
  remainingKeys.forEach(key => {
    ordered[key] = applyKubernetesFieldOrder(resource[key]);
  });
  
  return ordered;
}

/**
 * Order metadata fields according to Kubernetes conventions
 */
function orderMetadata(metadata: unknown): unknown {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return metadata;
  }
  
  const meta = metadata as Record<string, unknown>;
  const ordered: Record<string, unknown> = {};
  
  // Metadata field order
  const metadataOrder = [
    'name',
    'namespace',
    'labels',
    'annotations',
    'uid',
    'resourceVersion',
    'generation',
    'creationTimestamp',
    'deletionTimestamp',
    'finalizers',
    'ownerReferences',
    'managedFields'
  ];
  
  // Add fields in preferred order
  metadataOrder.forEach(field => {
    if (field in meta) {
      ordered[field] = meta[field];
    }
  });
  
  // Add remaining fields in alphabetical order
  const remainingKeys = Object.keys(meta)
    .filter(key => !metadataOrder.includes(key))
    .sort();
    
  remainingKeys.forEach(key => {
    ordered[key] = meta[key];
  });
  
  return ordered;
}

/**
 * Validate serialization result and throw error if failed
 */
export function validateSerialization(result: SerializationResult): string {
  if (!result.success) {
    throw new ApiError({
      code: 500,
      message: 'Resource serialization failed',
      type: ApiErrorType.UnknownError,
      details: result.error
    });
  }
  
  return result.content || '';
}

/**
 * Pretty printer class for consistent formatting
 */
export class ResourcePrettyPrinter {
  private options: SerializationOptions;
  
  constructor(options: Partial<SerializationOptions> = {}) {
    this.options = {
      ...DEFAULT_YAML_OPTIONS,
      ...options
    };
  }
  
  /**
   * Format resource to string
   */
  format(data: unknown): string {
    const result = this.options.format === 'json' 
      ? serializeToJSON(data, this.options)
      : serializeToYAML(data, this.options);
      
    return validateSerialization(result);
  }
  
  /**
   * Format Kubernetes resource with proper field ordering
   */
  formatKubernetes(data: unknown): string {
    const result = formatKubernetesResource(data, this.options.format);
    return validateSerialization(result);
  }
  
  /**
   * Update formatting options
   */
  setOptions(options: Partial<SerializationOptions>): void {
    this.options = { ...this.options, ...options };
  }
  
  /**
   * Get current options
   */
  getOptions(): SerializationOptions {
    return { ...this.options };
  }
}

// Export default instances
export const yamlPrinter = new ResourcePrettyPrinter({ format: 'yaml' });
export const jsonPrinter = new ResourcePrettyPrinter({ format: 'json' });