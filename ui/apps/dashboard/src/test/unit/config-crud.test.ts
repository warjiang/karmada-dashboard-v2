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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enhancedMemberClusterClient } from '../../services/base';
import {
  GetMemberClusterConfigMaps,
  GetMemberClusterConfigMapDetail,
  CreateMemberClusterConfigMap,
  UpdateMemberClusterConfigMap,
  DeleteMemberClusterConfigMap,
  GetMemberClusterSecrets,
  CreateMemberClusterSecret,
  GetMemberClusterPVCs,
  CreateMemberClusterPVC,
} from '../../services/member-cluster/config';

// Mock the enhanced client
vi.mock('../../services/base', () => ({
  enhancedMemberClusterClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  convertDataSelectQuery: vi.fn((query) => query),
}));

describe('Config CRUD Operations', () => {
  const mockMemberClusterName = 'test-cluster';
  const mockNamespace = 'default';
  const mockName = 'test-config';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ConfigMap Operations', () => {
    it('should get ConfigMaps list', async () => {
      const mockResponse = {
        code: 200,
        message: 'Success',
        data: {
          errors: [],
          listMeta: { totalItems: 1 },
          configMaps: [
            {
              objectMeta: {
                name: 'test-configmap',
                namespace: 'default',
                labels: {},
                annotations: {},
                creationTimestamp: '2024-01-01T00:00:00Z',
                uid: 'test-uid',
                resourceVersion: '1',
              },
              typeMeta: { kind: 'ConfigMap', scalable: false, restartable: false },
              data: { key1: 'value1' },
            },
          ],
        },
      };

      vi.mocked(enhancedMemberClusterClient.get).mockResolvedValue(mockResponse);

      const result = await GetMemberClusterConfigMaps({
        memberClusterName: mockMemberClusterName,
        namespace: mockNamespace,
      });

      expect(enhancedMemberClusterClient.get).toHaveBeenCalledWith(
        `/clusterapi/${mockMemberClusterName}/api/v1/configmap/${mockNamespace}`,
        { params: {} }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should get ConfigMap detail', async () => {
      const mockResponse = {
        code: 200,
        message: 'Success',
        data: {
          errors: [],
          objectMeta: {
            name: mockName,
            namespace: mockNamespace,
            labels: {},
            annotations: {},
            creationTimestamp: '2024-01-01T00:00:00Z',
            uid: 'test-uid',
            resourceVersion: '1',
          },
          typeMeta: { kind: 'ConfigMap', scalable: false, restartable: false },
          data: { key1: 'value1' },
          keys: ['key1'],
        },
      };

      vi.mocked(enhancedMemberClusterClient.get).mockResolvedValue(mockResponse);

      const result = await GetMemberClusterConfigMapDetail({
        memberClusterName: mockMemberClusterName,
        namespace: mockNamespace,
        name: mockName,
      });

      expect(enhancedMemberClusterClient.get).toHaveBeenCalledWith(
        `/clusterapi/${mockMemberClusterName}/api/v1/configmap/${mockNamespace}/${mockName}`
      );
      expect(result).toEqual(mockResponse);
    });

    it('should create ConfigMap', async () => {
      const mockResponse = {
        code: 200,
        message: 'Success',
        data: {
          objectMeta: {
            name: mockName,
            namespace: mockNamespace,
            labels: {},
            annotations: {},
            creationTimestamp: '2024-01-01T00:00:00Z',
            uid: 'test-uid',
            resourceVersion: '1',
          },
          typeMeta: { kind: 'ConfigMap', scalable: false, restartable: false },
          data: { key1: 'value1' },
        },
      };

      vi.mocked(enhancedMemberClusterClient.post).mockResolvedValue(mockResponse);

      const result = await CreateMemberClusterConfigMap({
        memberClusterName: mockMemberClusterName,
        namespace: mockNamespace,
        name: mockName,
        content: 'test-content',
      });

      expect(enhancedMemberClusterClient.post).toHaveBeenCalledWith(
        `/clusterapi/${mockMemberClusterName}/api/v1/configmap`,
        { namespace: mockNamespace, name: mockName, content: 'test-content' }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should update ConfigMap', async () => {
      const mockResponse = {
        code: 200,
        message: 'Success',
        data: {
          objectMeta: {
            name: mockName,
            namespace: mockNamespace,
            labels: {},
            annotations: {},
            creationTimestamp: '2024-01-01T00:00:00Z',
            uid: 'test-uid',
            resourceVersion: '2',
          },
          typeMeta: { kind: 'ConfigMap', scalable: false, restartable: false },
          data: { key1: 'updated-value1' },
        },
      };

      vi.mocked(enhancedMemberClusterClient.put).mockResolvedValue(mockResponse);

      const result = await UpdateMemberClusterConfigMap({
        memberClusterName: mockMemberClusterName,
        namespace: mockNamespace,
        name: mockName,
        content: 'updated-content',
      });

      expect(enhancedMemberClusterClient.put).toHaveBeenCalledWith(
        `/clusterapi/${mockMemberClusterName}/api/v1/configmap/${mockNamespace}/${mockName}`,
        { content: 'updated-content' }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should delete ConfigMap', async () => {
      const mockResponse = {
        code: 200,
        message: 'Success',
        data: null,
      };

      vi.mocked(enhancedMemberClusterClient.delete).mockResolvedValue(mockResponse);

      const result = await DeleteMemberClusterConfigMap({
        memberClusterName: mockMemberClusterName,
        namespace: mockNamespace,
        name: mockName,
        gracePeriodSeconds: 30,
      });

      expect(enhancedMemberClusterClient.delete).toHaveBeenCalledWith(
        `/clusterapi/${mockMemberClusterName}/api/v1/configmap/${mockNamespace}/${mockName}`,
        { params: { gracePeriodSeconds: 30 } }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Secret Operations', () => {
    it('should get Secrets list', async () => {
      const mockResponse = {
        code: 200,
        message: 'Success',
        data: {
          errors: [],
          listMeta: { totalItems: 1 },
          secrets: [
            {
              objectMeta: {
                name: 'test-secret',
                namespace: 'default',
                labels: {},
                annotations: {},
                creationTimestamp: '2024-01-01T00:00:00Z',
                uid: 'test-uid',
                resourceVersion: '1',
              },
              typeMeta: { kind: 'Secret', scalable: false, restartable: false },
              type: 'Opaque',
              data: { key1: 'dmFsdWUx' }, // base64 encoded 'value1'
            },
          ],
        },
      };

      vi.mocked(enhancedMemberClusterClient.get).mockResolvedValue(mockResponse);

      const result = await GetMemberClusterSecrets({
        memberClusterName: mockMemberClusterName,
        namespace: mockNamespace,
      });

      expect(enhancedMemberClusterClient.get).toHaveBeenCalledWith(
        `/clusterapi/${mockMemberClusterName}/api/v1/secret/${mockNamespace}`,
        { params: {} }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should create Secret', async () => {
      const mockResponse = {
        code: 200,
        message: 'Success',
        data: {
          objectMeta: {
            name: mockName,
            namespace: mockNamespace,
            labels: {},
            annotations: {},
            creationTimestamp: '2024-01-01T00:00:00Z',
            uid: 'test-uid',
            resourceVersion: '1',
          },
          typeMeta: { kind: 'Secret', scalable: false, restartable: false },
          type: 'Opaque',
          data: { key1: 'dmFsdWUx' },
        },
      };

      vi.mocked(enhancedMemberClusterClient.post).mockResolvedValue(mockResponse);

      const result = await CreateMemberClusterSecret({
        memberClusterName: mockMemberClusterName,
        namespace: mockNamespace,
        name: mockName,
        content: 'test-content',
      });

      expect(enhancedMemberClusterClient.post).toHaveBeenCalledWith(
        `/clusterapi/${mockMemberClusterName}/api/v1/secret`,
        { namespace: mockNamespace, name: mockName, content: 'test-content' }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('PVC Operations', () => {
    it('should get PVCs list', async () => {
      const mockResponse = {
        code: 200,
        message: 'Success',
        data: {
          errors: [],
          listMeta: { totalItems: 1 },
          persistentVolumeClaims: [
            {
              objectMeta: {
                name: 'test-pvc',
                namespace: 'default',
                labels: {},
                annotations: {},
                creationTimestamp: '2024-01-01T00:00:00Z',
                uid: 'test-uid',
                resourceVersion: '1',
              },
              typeMeta: { kind: 'PersistentVolumeClaim', scalable: false, restartable: false },
              spec: {
                accessModes: ['ReadWriteOnce'],
                resources: { requests: { storage: '1Gi' } },
              },
              status: {
                phase: 'Bound',
                capacity: { storage: '1Gi' },
              },
            },
          ],
        },
      };

      vi.mocked(enhancedMemberClusterClient.get).mockResolvedValue(mockResponse);

      const result = await GetMemberClusterPVCs({
        memberClusterName: mockMemberClusterName,
        namespace: mockNamespace,
      });

      expect(enhancedMemberClusterClient.get).toHaveBeenCalledWith(
        `/clusterapi/${mockMemberClusterName}/api/v1/persistentvolumeclaim/${mockNamespace}`,
        { params: {} }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should create PVC', async () => {
      const mockResponse = {
        code: 200,
        message: 'Success',
        data: {
          objectMeta: {
            name: mockName,
            namespace: mockNamespace,
            labels: {},
            annotations: {},
            creationTimestamp: '2024-01-01T00:00:00Z',
            uid: 'test-uid',
            resourceVersion: '1',
          },
          typeMeta: { kind: 'PersistentVolumeClaim', scalable: false, restartable: false },
          spec: {
            accessModes: ['ReadWriteOnce'],
            resources: { requests: { storage: '1Gi' } },
          },
          status: {
            phase: 'Pending',
          },
        },
      };

      vi.mocked(enhancedMemberClusterClient.post).mockResolvedValue(mockResponse);

      const result = await CreateMemberClusterPVC({
        memberClusterName: mockMemberClusterName,
        namespace: mockNamespace,
        name: mockName,
        content: 'test-content',
      });

      expect(enhancedMemberClusterClient.post).toHaveBeenCalledWith(
        `/clusterapi/${mockMemberClusterName}/api/v1/persistentvolumeclaim`,
        { namespace: mockNamespace, name: mockName, content: 'test-content' }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      vi.mocked(enhancedMemberClusterClient.get).mockRejectedValue(mockError);

      await expect(
        GetMemberClusterConfigMaps({
          memberClusterName: mockMemberClusterName,
          namespace: mockNamespace,
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('URL Construction', () => {
    it('should construct correct URLs for namespace-scoped resources', async () => {
      const mockResponse = { code: 200, message: 'Success', data: { errors: [], listMeta: { totalItems: 0 }, configMaps: [] } };
      vi.mocked(enhancedMemberClusterClient.get).mockResolvedValue(mockResponse);

      await GetMemberClusterConfigMaps({
        memberClusterName: mockMemberClusterName,
        namespace: mockNamespace,
      });

      expect(enhancedMemberClusterClient.get).toHaveBeenCalledWith(
        `/clusterapi/${mockMemberClusterName}/api/v1/configmap/${mockNamespace}`,
        { params: {} }
      );
    });

    it('should construct correct URLs for cluster-scoped resources', async () => {
      const mockResponse = { code: 200, message: 'Success', data: { errors: [], listMeta: { totalItems: 0 }, configMaps: [] } };
      vi.mocked(enhancedMemberClusterClient.get).mockResolvedValue(mockResponse);

      await GetMemberClusterConfigMaps({
        memberClusterName: mockMemberClusterName,
      });

      expect(enhancedMemberClusterClient.get).toHaveBeenCalledWith(
        `/clusterapi/${mockMemberClusterName}/api/v1/configmap`,
        { params: {} }
      );
    });
  });
});