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
import { renderHook } from '@testing-library/react';
import { useYAMLConversion } from '@/components/common/ResourceForm/hooks';

describe('YAML Conversion Hooks', () => {
  const sampleResource = {
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: {
      name: 'test-pod',
      namespace: 'default'
    },
    spec: {
      containers: [
        {
          name: 'nginx',
          image: 'nginx:1.20'
        }
      ]
    }
  };

  describe('useYAMLConversion', () => {
    it('should convert object to YAML format', () => {
      const { result } = renderHook(() => useYAMLConversion());
      const { convertToYAML } = result.current;

      const yamlContent = convertToYAML(sampleResource);

      expect(yamlContent).toBeDefined();
      expect(yamlContent).toContain('apiVersion: v1');
      expect(yamlContent).toContain('kind: Pod');
      expect(yamlContent).toContain('name: test-pod');
      expect(yamlContent).toContain('namespace: default');
    });

    it('should convert YAML back to object', () => {
      const { result } = renderHook(() => useYAMLConversion());
      const { convertFromYAML } = result.current;

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

      const parsedObject = convertFromYAML(yamlContent);

      expect(parsedObject).toBeDefined();
      expect((parsedObject as any).apiVersion).toBe('v1');
      expect((parsedObject as any).kind).toBe('Pod');
      expect((parsedObject as any).metadata.name).toBe('test-pod');
      expect((parsedObject as any).metadata.namespace).toBe('default');
    });

    it('should validate valid YAML', () => {
      const { result } = renderHook(() => useYAMLConversion());
      const { validateYAML } = result.current;

      const validYaml = `
apiVersion: v1
kind: Pod
metadata:
  name: test-pod
`;

      const validation = validateYAML(validYaml);

      expect(validation.valid).toBe(true);
      expect(validation.error).toBeUndefined();
    });

    it('should detect invalid YAML', () => {
      const { result } = renderHook(() => useYAMLConversion());
      const { validateYAML } = result.current;

      const invalidYaml = `
apiVersion: v1
kind: Pod
metadata:
  name: test-pod
  invalid: [unclosed array
`;

      const validation = validateYAML(invalidYaml);

      expect(validation.valid).toBe(false);
      expect(validation.error).toBeDefined();
      expect(validation.error).toContain('unclosed');
    });

    it('should handle conversion errors gracefully', () => {
      const { result } = renderHook(() => useYAMLConversion());
      const { convertToYAML } = result.current;

      const circularRef: any = { name: 'test' };
      circularRef.self = circularRef;

      const yamlContent = convertToYAML(circularRef);

      expect(yamlContent).toBe('');
    });

    it('should handle parsing errors gracefully', () => {
      const { result } = renderHook(() => useYAMLConversion());
      const { convertFromYAML } = result.current;

      const invalidYaml = `
apiVersion: v1
kind: Pod
metadata:
  name: test-pod
  invalid: [unclosed array
`;

      expect(() => convertFromYAML(invalidYaml)).toThrow();
    });

    it('should provide detailed error messages for validation failures', () => {
      const { result } = renderHook(() => useYAMLConversion());
      const { validateYAML } = result.current;

      const yamlWithMissingFields = `
kind: Pod
metadata:
  name: "invalid-NAME-format"
`;

      const validation = validateYAML(yamlWithMissingFields);

      expect(validation.valid).toBe(false);
      expect(validation.error).toBeDefined();
      expect(validation.error).toContain('Missing required field: apiVersion');
      expect(validation.error).toContain('Invalid name format');
    });

    it('should handle round-trip conversion correctly', () => {
      const { result } = renderHook(() => useYAMLConversion());
      const { convertToYAML, convertFromYAML } = result.current;

      // Convert to YAML
      const yamlContent = convertToYAML(sampleResource);
      expect(yamlContent).toBeDefined();

      // Convert back to object
      const parsedObject = convertFromYAML(yamlContent);
      expect(parsedObject).toBeDefined();

      // Verify the data is equivalent
      expect((parsedObject as any).apiVersion).toBe(sampleResource.apiVersion);
      expect((parsedObject as any).kind).toBe(sampleResource.kind);
      expect((parsedObject as any).metadata.name).toBe(sampleResource.metadata.name);
      expect((parsedObject as any).metadata.namespace).toBe(sampleResource.metadata.namespace);
    });
  });
});