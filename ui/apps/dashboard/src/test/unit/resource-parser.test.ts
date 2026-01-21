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
  parseYAML,
  parseJSON,
  parseResource,
  formatParseError,
  createParseErrorMessage,
  throwParseError,
  ParseErrorType,
  KubernetesResource
} from '@/utils/resource-parser';
import { ApiError, ApiErrorType } from '@/services/base';

describe('Resource Parser', () => {
  describe('parseYAML', () => {
    it('should parse valid YAML content', () => {
      const yamlContent = `
apiVersion: v1
kind: Pod
metadata:
  name: test-pod
  namespace: default
spec:
  containers:
  - name: nginx
    image: nginx:1.20
`;

      const result = parseYAML(yamlContent);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toHaveLength(0);
      
      const resource = result.data as KubernetesResource;
      expect(resource.apiVersion).toBe('v1');
      expect(resource.kind).toBe('Pod');
      expect(resource.metadata.name).toBe('test-pod');
      expect(resource.metadata.namespace).toBe('default');
    });

    it('should handle YAML syntax errors with line numbers', () => {
      const invalidYaml = `
apiVersion: v1
kind: Pod
metadata:
  name: test-pod
  namespace: default
spec:
  containers:
  - name: nginx
    image: nginx:1.20
    invalid: [unclosed array
`;

      const result = parseYAML(invalidYaml);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe(ParseErrorType.SyntaxError);
      expect(result.errors[0].message).toContain('unclosed');
    });

    it('should validate Kubernetes resource structure', () => {
      const yamlContent = `
apiVersion: v1
kind: Pod
metadata:
  name: "invalid-name-with-UPPERCASE"
  namespace: default
spec:
  containers: []
`;

      const result = parseYAML(yamlContent);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.message.includes('Invalid name format'))).toBe(true);
    });

    it('should handle empty content', () => {
      const result = parseYAML('');
      
      expect(result.success).toBe(false);
      expect(result.errors[0].message).toBe('Empty content provided');
      expect(result.errors[0].type).toBe(ParseErrorType.SyntaxError);
    });

    it('should validate required fields', () => {
      const yamlContent = `
kind: Pod
metadata:
  name: test-pod
`;

      const result = parseYAML(yamlContent);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.message.includes('Missing required field: apiVersion'))).toBe(true);
    });

    it('should validate label formats', () => {
      const yamlContent = `
apiVersion: v1
kind: Pod
metadata:
  name: test-pod
  labels:
    "invalid key with spaces": "value"
    valid-key: "this-value-is-way-too-long-and-exceeds-the-sixty-three-character-limit-for-kubernetes-labels"
`;

      const result = parseYAML(yamlContent);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.message.includes('Invalid label key format'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('Label value too long'))).toBe(true);
    });

    it('should handle unknown API versions and kinds with warnings', () => {
      const yamlContent = `
apiVersion: custom.io/v1alpha1
kind: CustomResource
metadata:
  name: test-custom
`;

      const result = parseYAML(yamlContent);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.message.includes('Unknown apiVersion'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('Unknown kind'))).toBe(true);
      expect(result.errors.every(e => e.type === ParseErrorType.SchemaError)).toBe(true);
    });
  });

  describe('parseJSON', () => {
    it('should parse valid JSON content', () => {
      const jsonContent = `{
        "apiVersion": "v1",
        "kind": "Service",
        "metadata": {
          "name": "test-service",
          "namespace": "default"
        },
        "spec": {
          "selector": {
            "app": "test"
          },
          "ports": [
            {
              "port": 80,
              "targetPort": 8080
            }
          ]
        }
      }`;

      const result = parseJSON(jsonContent);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toHaveLength(0);
      
      const resource = result.data as KubernetesResource;
      expect(resource.apiVersion).toBe('v1');
      expect(resource.kind).toBe('Service');
      expect(resource.metadata.name).toBe('test-service');
    });

    it('should handle JSON syntax errors with position information', () => {
      const invalidJson = `{
        "apiVersion": "v1",
        "kind": "Service",
        "metadata": {
          "name": "test-service"
          "namespace": "default"
        }
      }`;

      const result = parseJSON(invalidJson);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe(ParseErrorType.SyntaxError);
      expect(result.errors[0].line).toBeDefined();
      expect(result.errors[0].column).toBeDefined();
    });

    it('should handle empty JSON content', () => {
      const result = parseJSON('');
      
      expect(result.success).toBe(false);
      expect(result.errors[0].message).toBe('Empty content provided');
    });
  });

  describe('parseResource', () => {
    it('should auto-detect JSON format', () => {
      const jsonContent = `{"apiVersion": "v1", "kind": "Pod", "metadata": {"name": "test"}}`;
      
      const result = parseResource(jsonContent);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should auto-detect YAML format', () => {
      const yamlContent = `
apiVersion: v1
kind: Pod
metadata:
  name: test
`;
      
      const result = parseResource(yamlContent);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should fallback from JSON to YAML when JSON fails', () => {
      const yamlContent = `
apiVersion: v1
kind: Pod
metadata:
  name: test
`;
      
      const result = parseResource(yamlContent);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should fallback from YAML to JSON when YAML fails', () => {
      const jsonContent = `{"apiVersion": "v1", "kind": "Pod", "metadata": {"name": "test"}}`;
      
      const result = parseResource(jsonContent);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('Error formatting', () => {
    it('should format parse errors with line and column information', () => {
      const error = {
        message: 'Syntax error',
        line: 5,
        column: 10,
        type: ParseErrorType.SyntaxError,
        context: 'invalid: [unclosed'
      };

      const formatted = formatParseError(error);
      
      expect(formatted).toContain('Syntax error (line 5, column 10)');
      expect(formatted).toContain('Context: invalid: [unclosed');
    });

    it('should format parse errors with position information', () => {
      const error = {
        message: 'JSON syntax error',
        position: 42,
        type: ParseErrorType.SyntaxError
      };

      const formatted = formatParseError(error);
      
      expect(formatted).toContain('JSON syntax error (position 42)');
    });

    it('should create comprehensive error messages', () => {
      const result = {
        success: false,
        errors: [
          {
            message: 'Missing required field: apiVersion',
            type: ParseErrorType.ValidationError
          },
          {
            message: 'Invalid name format',
            line: 4,
            type: ParseErrorType.ValidationError
          }
        ],
        warnings: ['Content appeared to be JSON but was parsed as YAML']
      };

      const message = createParseErrorMessage(result);
      
      expect(message).toContain('Missing required field: apiVersion');
      expect(message).toContain('Invalid name format (line 4)');
      expect(message).toContain('Warnings:');
      expect(message).toContain('Content appeared to be JSON but was parsed as YAML');
    });
  });

  describe('Error throwing', () => {
    it('should throw ApiError from parse result', () => {
      const result = {
        success: false,
        errors: [
          {
            message: 'Syntax error',
            type: ParseErrorType.SyntaxError
          }
        ],
        warnings: []
      };

      expect(() => throwParseError(result)).toThrow(ApiError);
      
      try {
        throwParseError(result);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe(400);
        expect((error as ApiError).type).toBe(ApiErrorType.ValidationError);
        expect((error as ApiError).message).toBe('Resource parsing failed');
      }
    });
  });

  describe('Kubernetes resource validation', () => {
    it('should validate deployment resources', () => {
      const deploymentYaml = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  namespace: default
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.20
        ports:
        - containerPort: 80
`;

      const result = parseYAML(deploymentYaml);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const deployment = result.data as KubernetesResource;
      expect(deployment.apiVersion).toBe('apps/v1');
      expect(deployment.kind).toBe('Deployment');
      expect(deployment.metadata.name).toBe('nginx-deployment');
    });

    it('should validate service resources', () => {
      const serviceYaml = `
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
  namespace: default
spec:
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
`;

      const result = parseYAML(serviceYaml);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const service = result.data as KubernetesResource;
      expect(service.apiVersion).toBe('v1');
      expect(service.kind).toBe('Service');
      expect(service.metadata.name).toBe('nginx-service');
    });

    it('should validate configmap resources', () => {
      const configMapYaml = `
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: default
data:
  database_url: "postgresql://localhost:5432/mydb"
  debug: "true"
`;

      const result = parseYAML(configMapYaml);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const configMap = result.data as KubernetesResource;
      expect(configMap.apiVersion).toBe('v1');
      expect(configMap.kind).toBe('ConfigMap');
      expect(configMap.metadata.name).toBe('app-config');
    });
  });
});