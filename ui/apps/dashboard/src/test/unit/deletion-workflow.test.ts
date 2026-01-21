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

import { describe, it, expect, vi } from 'vitest';
import { getResourceDependencies, getCascadingDeletions } from '@/utils/resource-dependencies';
import { ConfigMapResource, SecretResource, PersistentVolumeClaimResource } from '@/services/base';

describe('Deletion Workflow Consistency', () => {
  describe('Resource Dependency Analysis', () => {
    it('should identify ConfigMap dependencies correctly', () => {
      const configMap: ConfigMapResource = {
        objectMeta: {
          name: 'app-config',
          namespace: 'default',
          resourceVersion: '1',
          annotations: {},
          labels: {},
          uid: 'test-uid'
        },
        typeMeta: {
          kind: 'ConfigMap'
        },
        data: {
          'app.properties': 'key=value'
        }
      };

      const relatedPod = {
        kind: 'Pod',
        metadata: {
          name: 'app-pod',
          namespace: 'default'
        },
        spec: {
          volumes: [{
            name: 'config-volume',
            configMap: {
              name: 'app-config'
            }
          }]
        }
      };

      const dependencies = getResourceDependencies('configmap', configMap, [relatedPod]);
      
      expect(dependencies).toHaveLength(1);
      expect(dependencies[0]).toMatchObject({
        type: 'mount',
        resourceType: 'Pod',
        resourceName: 'app-pod',
        namespace: 'default',
        severity: 'error'
      });
    });

    it('should identify Secret dependencies correctly', () => {
      const secret: SecretResource = {
        objectMeta: {
          name: 'app-secret',
          namespace: 'default',
          resourceVersion: '1',
          annotations: {},
          labels: {},
          uid: 'test-uid'
        },
        typeMeta: {
          kind: 'Secret'
        },
        type: 'Opaque',
        data: {
          'password': 'cGFzc3dvcmQ='
        }
      };

      const relatedPod = {
        kind: 'Pod',
        metadata: {
          name: 'app-pod',
          namespace: 'default'
        },
        spec: {
          containers: [{
            name: 'app',
            env: [{
              name: 'PASSWORD',
              valueFrom: {
                secretKeyRef: {
                  name: 'app-secret',
                  key: 'password'
                }
              }
            }]
          }]
        }
      };

      const dependencies = getResourceDependencies('secret', secret, [relatedPod]);
      
      expect(dependencies).toHaveLength(1);
      expect(dependencies[0]).toMatchObject({
        type: 'mount',
        resourceType: 'Pod',
        resourceName: 'app-pod',
        namespace: 'default',
        severity: 'error'
      });
    });

    it('should identify PVC dependencies correctly', () => {
      const pvc: PersistentVolumeClaimResource = {
        objectMeta: {
          name: 'data-pvc',
          namespace: 'default',
          resourceVersion: '1',
          annotations: {},
          labels: {},
          uid: 'test-uid'
        },
        typeMeta: {
          kind: 'PersistentVolumeClaim'
        },
        spec: {
          accessModes: ['ReadWriteOnce'],
          resources: {
            requests: {
              storage: '10Gi'
            }
          }
        },
        status: {
          phase: 'Bound'
        }
      };

      const relatedPod = {
        kind: 'Pod',
        metadata: {
          name: 'app-pod',
          namespace: 'default'
        },
        spec: {
          volumes: [{
            name: 'data-volume',
            persistentVolumeClaim: {
              claimName: 'data-pvc'
            }
          }]
        }
      };

      const dependencies = getResourceDependencies('persistentvolumeclaim', pvc, [relatedPod]);
      
      expect(dependencies.length).toBeGreaterThan(0);
      
      // Should have pod dependency
      const podDependency = dependencies.find(dep => dep.resourceType === 'Pod');
      expect(podDependency).toMatchObject({
        type: 'mount',
        resourceType: 'Pod',
        resourceName: 'app-pod',
        namespace: 'default',
        severity: 'error'
      });

      // Should have PV warning for bound PVC
      const pvDependency = dependencies.find(dep => dep.resourceType === 'PersistentVolume');
      expect(pvDependency).toMatchObject({
        type: 'reference',
        resourceType: 'PersistentVolume',
        severity: 'warning'
      });
    });
  });

  describe('Cascading Deletion Analysis', () => {
    it('should identify deployment cascading deletions', () => {
      const relatedReplicaSet = {
        kind: 'ReplicaSet',
        metadata: {
          name: 'app-rs-123',
          namespace: 'default',
          ownerReferences: [{
            kind: 'Deployment',
            name: 'app-deployment'
          }]
        }
      };

      const relatedPod = {
        kind: 'Pod',
        metadata: {
          name: 'app-pod-456',
          namespace: 'default',
          ownerReferences: [{
            kind: 'ReplicaSet',
            name: 'app-rs-123'
          }]
        }
      };

      const cascading = getCascadingDeletions(
        'deployment',
        'app-deployment',
        'default',
        [relatedReplicaSet, relatedPod]
      );

      expect(cascading.length).toBeGreaterThan(0);
      
      // Should identify ReplicaSet as cascading
      const rsDeletion = cascading.find(c => c.resourceType === 'ReplicaSet');
      expect(rsDeletion).toMatchObject({
        type: 'ownership',
        resourceType: 'ReplicaSet',
        resourceName: 'app-rs-123',
        namespace: 'default',
        severity: 'info'
      });

      // Should identify Pods as cascading
      const podDeletion = cascading.find(c => c.resourceType === 'Pod');
      expect(podDeletion).toMatchObject({
        type: 'ownership',
        resourceType: 'Pod',
        severity: 'info'
      });
    });

    it('should identify statefulset cascading deletions', () => {
      const relatedPod = {
        kind: 'Pod',
        metadata: {
          name: 'app-0',
          namespace: 'default',
          ownerReferences: [{
            kind: 'StatefulSet',
            name: 'app-statefulset'
          }]
        }
      };

      const cascading = getCascadingDeletions(
        'statefulset',
        'app-statefulset',
        'default',
        [relatedPod]
      );

      expect(cascading).toHaveLength(1);
      expect(cascading[0]).toMatchObject({
        type: 'ownership',
        resourceType: 'Pod',
        resourceName: '1 pod(s)',
        namespace: 'default',
        severity: 'info'
      });
    });
  });

  describe('Dependency Warning Display', () => {
    it('should categorize dependencies by severity', () => {
      // This would test the DependencyWarning component
      // For now, we just verify the dependency analysis works
      const configMap: ConfigMapResource = {
        objectMeta: {
          name: 'test-config',
          namespace: 'default',
          resourceVersion: '1',
          annotations: {},
          labels: {},
          uid: 'test-uid'
        },
        typeMeta: {
          kind: 'ConfigMap'
        }
      };

      const dependencies = getResourceDependencies('configmap', configMap, []);
      
      // No dependencies should result in empty array
      expect(dependencies).toHaveLength(0);
    });
  });
});