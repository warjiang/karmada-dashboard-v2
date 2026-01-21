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

import {
  validateKubernetesName,
  validateNamespace,
  validateLabels,
  validateAnnotations,
  validatePort,
  validateReplicas,
  validateResourceQuantity,
  validateDNSSubdomain,
  resourceValidationRules,
  getValidationRules,
  validateResourceForm,
  validateField,
} from '@/utils/resource-validation';
import { WorkloadKind, ServiceKind, ConfigKind } from '@/services/base';

describe('Resource Validation', () => {
  describe('validateKubernetesName', () => {
    it('should validate correct Kubernetes names', () => {
      expect(validateKubernetesName('my-app')).toEqual({ valid: true });
      expect(validateKubernetesName('app123')).toEqual({ valid: true });
      expect(validateKubernetesName('a')).toEqual({ valid: true });
    });

    it('should reject invalid Kubernetes names', () => {
      expect(validateKubernetesName('')).toEqual({
        valid: false,
        message: 'Name is required'
      });
      expect(validateKubernetesName('My-App')).toEqual({
        valid: false,
        message: 'Name must be lowercase alphanumeric characters or hyphens, and must start and end with an alphanumeric character'
      });
      expect(validateKubernetesName('-app')).toEqual({
        valid: false,
        message: 'Name must be lowercase alphanumeric characters or hyphens, and must start and end with an alphanumeric character'
      });
      expect(validateKubernetesName('app-')).toEqual({
        valid: false,
        message: 'Name must be lowercase alphanumeric characters or hyphens, and must start and end with an alphanumeric character'
      });
    });

    it('should reject names that are too long', () => {
      const longName = 'a'.repeat(254);
      expect(validateKubernetesName(longName)).toEqual({
        valid: false,
        message: 'Name must be less than 253 characters'
      });
    });
  });

  describe('validateNamespace', () => {
    it('should validate correct namespaces', () => {
      expect(validateNamespace('default')).toEqual({ valid: true });
      expect(validateNamespace('my-namespace')).toEqual({ valid: true });
    });

    it('should warn about system namespaces', () => {
      expect(validateNamespace('kube-system')).toEqual({
        valid: true,
        message: 'Warning: This is a system namespace. Proceed with caution.'
      });
    });

    it('should reject empty namespace', () => {
      expect(validateNamespace('')).toEqual({
        valid: false,
        message: 'Namespace is required'
      });
    });
  });

  describe('validateLabels', () => {
    it('should validate correct labels', () => {
      expect(validateLabels({ app: 'my-app', version: 'v1.0' })).toEqual({ valid: true });
      expect(validateLabels({})).toEqual({ valid: true });
    });

    it('should reject invalid label keys', () => {
      expect(validateLabels({ 'invalid key': 'value' })).toEqual({
        valid: false,
        message: 'Invalid label key "invalid key". Keys must be valid DNS subdomains with optional prefix.'
      });
    });

    it('should reject label values that are too long', () => {
      const longValue = 'a'.repeat(64);
      expect(validateLabels({ app: longValue })).toEqual({
        valid: false,
        message: 'Label value "' + longValue + '" is too long. Values must be less than 63 characters.'
      });
    });
  });

  describe('validatePort', () => {
    it('should validate correct ports', () => {
      expect(validatePort(80)).toEqual({ valid: true });
      expect(validatePort(8080)).toEqual({ valid: true });
      expect(validatePort('443')).toEqual({ valid: true });
    });

    it('should reject invalid ports', () => {
      expect(validatePort(0)).toEqual({
        valid: false,
        message: 'Port must be between 1 and 65535'
      });
      expect(validatePort(65536)).toEqual({
        valid: false,
        message: 'Port must be between 1 and 65535'
      });
      expect(validatePort('invalid')).toEqual({
        valid: false,
        message: 'Port must be a valid number'
      });
    });
  });

  describe('validateReplicas', () => {
    it('should validate correct replica counts', () => {
      expect(validateReplicas(1)).toEqual({ valid: true });
      expect(validateReplicas(3)).toEqual({ valid: true });
      expect(validateReplicas(0)).toEqual({ valid: true });
    });

    it('should warn about high replica counts', () => {
      expect(validateReplicas(1001)).toEqual({
        valid: true,
        message: 'Warning: High replica count may impact cluster performance.'
      });
    });

    it('should reject negative replicas', () => {
      expect(validateReplicas(-1)).toEqual({
        valid: false,
        message: 'Replicas cannot be negative'
      });
    });
  });

  describe('validateResourceQuantity', () => {
    it('should validate correct resource quantities', () => {
      expect(validateResourceQuantity('100m')).toEqual({ valid: true });
      expect(validateResourceQuantity('1Gi')).toEqual({ valid: true });
      expect(validateResourceQuantity('500Mi')).toEqual({ valid: true });
      expect(validateResourceQuantity('2')).toEqual({ valid: true });
    });

    it('should reject invalid resource quantities', () => {
      expect(validateResourceQuantity('invalid')).toEqual({
        valid: false,
        message: 'Invalid resource quantity format. Use formats like "100m", "1Gi", "500Mi".'
      });
    });

    it('should allow empty quantities (optional)', () => {
      expect(validateResourceQuantity('')).toEqual({ valid: true });
    });
  });

  describe('getValidationRules', () => {
    it('should return metadata rules for common fields', () => {
      const nameRules = getValidationRules('deployment', 'metadata.name');
      expect(nameRules).toBeDefined();
      expect(nameRules.length).toBeGreaterThan(0);
    });

    it('should return resource-specific rules', () => {
      const replicaRules = getValidationRules('deployment', 'spec.replicas');
      expect(replicaRules).toBeDefined();
      expect(replicaRules.length).toBeGreaterThan(0);
    });

    it('should return empty array for unknown fields', () => {
      const unknownRules = getValidationRules('deployment', 'unknown.field');
      expect(unknownRules).toEqual([]);
    });
  });

  describe('validateResourceForm', () => {
    it('should validate a complete deployment form', async () => {
      const deploymentForm = {
        metadata: {
          name: 'my-deployment',
          namespace: 'default',
          labels: { app: 'my-app' },
          annotations: {}
        },
        spec: {
          replicas: 3,
          selector: {
            matchLabels: { app: 'my-app' }
          },
          template: {
            metadata: {
              labels: { app: 'my-app' }
            },
            spec: {
              containers: [
                {
                  name: 'my-container',
                  image: 'nginx:latest',
                  ports: [
                    {
                      containerPort: 80
                    }
                  ]
                }
              ]
            }
          }
        }
      };

      const result = await validateResourceForm('deployment', deploymentForm);
      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should detect missing required fields', async () => {
      const incompleteForm = {
        metadata: {
          name: '',
          namespace: 'default',
          labels: {},
          annotations: {}
        },
        spec: {}
      };

      const result = await validateResourceForm('deployment', incompleteForm);
      expect(result.valid).toBe(false);
      expect(result.errors['metadata.name']).toBeDefined();
    });
  });

  describe('validateField', () => {
    it('should validate individual fields correctly', async () => {
      const result = await validateField('deployment', 'metadata.name', 'my-app');
      expect(result.valid).toBe(true);
    });

    it('should detect field validation errors', async () => {
      const result = await validateField('deployment', 'metadata.name', 'Invalid-Name');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('lowercase');
    });

    it('should validate port fields', async () => {
      const validPort = await validateField('service', 'spec.ports[].port', 80);
      expect(validPort.valid).toBe(true);

      const invalidPort = await validateField('service', 'spec.ports[].port', 0);
      expect(invalidPort.valid).toBe(false);
    });

    it('should validate replica fields', async () => {
      const validReplicas = await validateField('deployment', 'spec.replicas', 3);
      expect(validReplicas.valid).toBe(true);

      const invalidReplicas = await validateField('deployment', 'spec.replicas', -1);
      expect(invalidReplicas.valid).toBe(false);
    });
  });

  describe('Resource-specific validation rules', () => {
    it('should have validation rules for all workload types', () => {
      expect(resourceValidationRules[WorkloadKind.Deployment]).toBeDefined();
      expect(resourceValidationRules[WorkloadKind.Statefulset]).toBeDefined();
      expect(resourceValidationRules[WorkloadKind.Daemonset]).toBeDefined();
      expect(resourceValidationRules[WorkloadKind.Job]).toBeDefined();
      expect(resourceValidationRules[WorkloadKind.Cronjob]).toBeDefined();
    });

    it('should have validation rules for service types', () => {
      expect(resourceValidationRules[ServiceKind.Service]).toBeDefined();
      expect(resourceValidationRules[ServiceKind.Ingress]).toBeDefined();
    });

    it('should have validation rules for config types', () => {
      expect(resourceValidationRules[ConfigKind.ConfigMap]).toBeDefined();
      expect(resourceValidationRules[ConfigKind.Secret]).toBeDefined();
      expect(resourceValidationRules[ConfigKind.PersistentVolumeClaim]).toBeDefined();
    });
  });

  describe('CronJob schedule validation', () => {
    it('should validate correct cron expressions', async () => {
      const validSchedules = [
        '0 0 * * *',    // Daily at midnight
        '*/5 * * * *',  // Every 5 minutes
        '0 9-17 * * 1-5', // Business hours weekdays
      ];

      for (const schedule of validSchedules) {
        const result = await validateField('cronjob', 'spec.schedule', schedule);
        expect(result.valid).toBe(true);
      }
    });

    it('should reject invalid cron expressions', async () => {
      const invalidSchedules = [
        'invalid',
        '60 * * * *',   // Invalid minute
        '* 25 * * *',   // Invalid hour
      ];

      for (const schedule of invalidSchedules) {
        const result = await validateField('cronjob', 'spec.schedule', schedule);
        expect(result.valid).toBe(false);
      }
    });
  });

  describe('Service type validation', () => {
    it('should validate correct service types', async () => {
      const validTypes = ['ClusterIP', 'NodePort', 'LoadBalancer', 'ExternalName'];

      for (const type of validTypes) {
        const result = await validateField('service', 'spec.type', type);
        expect(result.valid).toBe(true);
      }
    });

    it('should reject invalid service types', async () => {
      const result = await validateField('service', 'spec.type', 'InvalidType');
      expect(result.valid).toBe(false);
    });
  });

  describe('PVC access modes validation', () => {
    it('should validate correct access modes', async () => {
      const validModes = ['ReadWriteOnce', 'ReadOnlyMany', 'ReadWriteMany'];
      const result = await validateField('persistentvolumeclaim', 'spec.accessModes', validModes);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid access modes', async () => {
      const invalidModes = ['InvalidMode'];
      const result = await validateField('persistentvolumeclaim', 'spec.accessModes', invalidModes);
      expect(result.valid).toBe(false);
    });

    it('should require at least one access mode', async () => {
      const result = await validateField('persistentvolumeclaim', 'spec.accessModes', []);
      expect(result.valid).toBe(false);
    });
  });
});