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

import { describe, it, expect } from 'vitest';
import {
  serializeToYAML,
  serializeToJSON,
  serializeResource,
  formatKubernetesResource,
  ResourcePrettyPrinter,
  yamlPrinter,
  jsonPrinter,
  validateSerialization
} from '@/utils/resource-serializer';
import { ApiError } from '@/services/base';

describe('Resource Serializer', () => {
  const sampleResource = {
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: {
      name: 'test-pod',
      namespace: 'default',
      labels: {
        app: 'test',
        version: 'v1.0.0'
      },
      annotations: {
        'deployment.kubernetes.io/revision': '1'
      }
    },
    spec: {
      containers: [
        {
          name: 'nginx',
          image: 'nginx:1.20',
          ports: [
            {
              containerPort: 80
            }
          ]
        }
      ]
    }
  };

  describe('serializeToYAML', () => {
    it('should serialize object to YAML format', () => {
      const result = serializeToYAML(sampleResource);
      
      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content).toContain('apiVersion: v1');
      expect(result.content).toContain('kind: Pod');
      expect(result.content).toContain('name: test-pod');
      expect(result.content).toContain('namespace: default');
    });

    it('should handle YAML serialization with custom options', () => {
      const result = serializeToYAML(sampleResource, {
        indent: 4,
        sortKeys: false
      });
      
      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      // Should contain proper indentation
      expect(result.content).toContain('    name: test-pod');
    });

    it('should remove empty fields when requested', () => {
      const resourceWithEmpty = {
        ...sampleResource,
        status: {},
        emptyArray: [],
        nullValue: null,
        undefinedValue: undefined,
        emptyString: ''
      };

      const result = serializeToYAML(resourceWithEmpty, {
        removeEmpty: true
      });
      
      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content).not.toContain('status:');
      expect(result.content).not.toContain('emptyArray:');
      expect(result.content).not.toContain('nullValue:');
      expect(result.content).not.toContain('emptyString:');
    });

    it('should handle serialization errors gracefully', () => {
      const circularRef: any = { name: 'test' };
      circularRef.self = circularRef;

      const result = serializeToYAML(circularRef);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('serializeToJSON', () => {
    it('should serialize object to JSON format', () => {
      const result = serializeToJSON(sampleResource);
      
      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      
      const parsed = JSON.parse(result.content!);
      expect(parsed.apiVersion).toBe('v1');
      expect(parsed.kind).toBe('Pod');
      expect(parsed.metadata.name).toBe('test-pod');
    });

    it('should handle JSON serialization with custom indentation', () => {
      const result = serializeToJSON(sampleResource, {
        indent: 4
      });
      
      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      // Should contain 4-space indentation
      expect(result.content).toContain('    "apiVersion"');
    });

    it('should sort keys when requested', () => {
      const unsortedObject = {
        zebra: 'last',
        alpha: 'first',
        beta: 'middle'
      };

      const result = serializeToJSON(unsortedObject, {
        sortKeys: true
      });
      
      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      
      const lines = result.content!.split('\n');
      const alphaIndex = lines.findIndex(line => line.includes('"alpha"'));
      const betaIndex = lines.findIndex(line => line.includes('"beta"'));
      const zebraIndex = lines.findIndex(line => line.includes('"zebra"'));
      
      expect(alphaIndex).toBeLessThan(betaIndex);
      expect(betaIndex).toBeLessThan(zebraIndex);
    });

    it('should handle JSON serialization errors gracefully', () => {
      const circularRef: any = { name: 'test' };
      circularRef.self = circularRef;

      const result = serializeToJSON(circularRef);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('serializeResource', () => {
    it('should serialize to YAML by default', () => {
      const result = serializeResource(sampleResource);
      
      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content).toContain('apiVersion: v1');
    });

    it('should serialize to JSON when specified', () => {
      const result = serializeResource(sampleResource, 'json');
      
      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content).toContain('"apiVersion": "v1"');
    });
  });

  describe('formatKubernetesResource', () => {
    it('should format Kubernetes resource with proper field ordering', () => {
      const result = formatKubernetesResource(sampleResource, 'yaml');
      
      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      
      const lines = result.content!.split('\n');
      const apiVersionIndex = lines.findIndex(line => line.includes('apiVersion:'));
      const kindIndex = lines.findIndex(line => line.includes('kind:'));
      const metadataIndex = lines.findIndex(line => line.includes('metadata:'));
      const specIndex = lines.findIndex(line => line.includes('spec:'));
      
      expect(apiVersionIndex).toBeLessThan(kindIndex);
      expect(kindIndex).toBeLessThan(metadataIndex);
      expect(metadataIndex).toBeLessThan(specIndex);
    });

    it('should order metadata fields correctly', () => {
      const resourceWithMetadata = {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
          uid: 'abc-123',
          resourceVersion: '12345',
          name: 'test-pod',
          namespace: 'default',
          creationTimestamp: '2023-01-01T00:00:00Z',
          labels: { app: 'test' },
          annotations: { note: 'test' }
        }
      };

      const result = formatKubernetesResource(resourceWithMetadata, 'yaml');
      
      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      
      const lines = result.content!.split('\n');
      const nameIndex = lines.findIndex(line => line.trim().startsWith('name:'));
      const namespaceIndex = lines.findIndex(line => line.trim().startsWith('namespace:'));
      const labelsIndex = lines.findIndex(line => line.trim().startsWith('labels:'));
      const annotationsIndex = lines.findIndex(line => line.trim().startsWith('annotations:'));
      
      expect(nameIndex).toBeLessThan(namespaceIndex);
      expect(namespaceIndex).toBeLessThan(labelsIndex);
      expect(labelsIndex).toBeLessThan(annotationsIndex);
    });

    it('should remove empty fields from Kubernetes resources', () => {
      const resourceWithEmpty = {
        ...sampleResource,
        status: {},
        emptyData: null,
        rules: []
      };

      const result = formatKubernetesResource(resourceWithEmpty, 'yaml');
      
      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content).not.toContain('status:');
      expect(result.content).not.toContain('emptyData:');
      expect(result.content).not.toContain('rules:');
    });
  });

  describe('ResourcePrettyPrinter', () => {
    it('should create printer with default YAML options', () => {
      const printer = new ResourcePrettyPrinter();
      const options = printer.getOptions();
      
      expect(options.format).toBe('yaml');
      expect(options.indent).toBe(2);
      expect(options.sortKeys).toBe(true);
    });

    it('should format resource using printer', () => {
      const printer = new ResourcePrettyPrinter();
      const formatted = printer.format(sampleResource);
      
      expect(formatted).toBeDefined();
      expect(formatted).toContain('apiVersion: v1');
      expect(formatted).toContain('kind: Pod');
    });

    it('should format Kubernetes resource with proper ordering', () => {
      const printer = new ResourcePrettyPrinter();
      const formatted = printer.formatKubernetes(sampleResource);
      
      expect(formatted).toBeDefined();
      expect(formatted).toContain('apiVersion: v1');
      expect(formatted).toContain('kind: Pod');
      
      const lines = formatted.split('\n');
      const apiVersionIndex = lines.findIndex(line => line.includes('apiVersion:'));
      const kindIndex = lines.findIndex(line => line.includes('kind:'));
      
      expect(apiVersionIndex).toBeLessThan(kindIndex);
    });

    it('should update printer options', () => {
      const printer = new ResourcePrettyPrinter();
      printer.setOptions({ format: 'json', indent: 4 });
      
      const options = printer.getOptions();
      expect(options.format).toBe('json');
      expect(options.indent).toBe(4);
    });

    it('should handle formatting errors by throwing ApiError', () => {
      const printer = new ResourcePrettyPrinter();
      const circularRef: any = { name: 'test' };
      circularRef.self = circularRef;

      expect(() => printer.format(circularRef)).toThrow(ApiError);
    });
  });

  describe('Default printer instances', () => {
    it('should provide YAML printer instance', () => {
      const formatted = yamlPrinter.format(sampleResource);
      
      expect(formatted).toBeDefined();
      expect(formatted).toContain('apiVersion: v1');
      expect(formatted).not.toContain('"apiVersion"');
    });

    it('should provide JSON printer instance', () => {
      const formatted = jsonPrinter.format(sampleResource);
      
      expect(formatted).toBeDefined();
      expect(formatted).toContain('"apiVersion": "v1"');
      expect(formatted).not.toContain('apiVersion: v1');
    });
  });

  describe('validateSerialization', () => {
    it('should return content for successful serialization', () => {
      const result = { success: true, content: 'test content' };
      const content = validateSerialization(result);
      
      expect(content).toBe('test content');
    });

    it('should throw ApiError for failed serialization', () => {
      const result = { success: false, error: 'Serialization failed' };
      
      expect(() => validateSerialization(result)).toThrow(ApiError);
      
      try {
        validateSerialization(result);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toBe('Resource serialization failed');
        expect((error as ApiError).details).toBe('Serialization failed');
      }
    });

    it('should handle empty content', () => {
      const result = { success: true, content: undefined };
      const content = validateSerialization(result);
      
      expect(content).toBe('');
    });
  });

  describe('Round-trip consistency', () => {
    it('should maintain data integrity through YAML round-trip', () => {
      const yamlResult = serializeToYAML(sampleResource);
      expect(yamlResult.success).toBe(true);
      
      // Parse the YAML back (would need parser for full test)
      const yamlContent = yamlResult.content!;
      expect(yamlContent).toContain('apiVersion: v1');
      expect(yamlContent).toContain('kind: Pod');
      expect(yamlContent).toContain('name: test-pod');
    });

    it('should maintain data integrity through JSON round-trip', () => {
      const jsonResult = serializeToJSON(sampleResource);
      expect(jsonResult.success).toBe(true);
      
      const parsed = JSON.parse(jsonResult.content!);
      expect(parsed).toEqual(sampleResource);
    });
  });
});