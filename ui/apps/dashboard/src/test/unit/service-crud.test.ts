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
import {
  CreateMemberClusterService,
  UpdateMemberClusterService,
  DeleteMemberClusterService,
  GetMemberClusterServices,
  GetMemberClusterServiceDetail,
  CreateMemberClusterIngress,
  UpdateMemberClusterIngress,
  DeleteMemberClusterIngress,
  GetMemberClusterIngress,
  GetMemberClusterIngressDetail,
} from '../../services/member-cluster/service';
import { enhancedMemberClusterClient } from '../../services/base';

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

describe('Service CRUD Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Service CRUD', () => {
    it('should get services with correct parameters', async () => {
      const mockResponse = {
        code: 200,
        message: 'Success',
        data: {
          errors: [],
          listMeta: { totalItems: 1 },
          services: [{ objectMeta: { name: 'test-service' } }]
        }
      };
      vi.mocked(enhancedMemberClusterClient.get).mockResolvedValue(mockResponse);

      const params = {
        memberClusterName: 'test-cluster',
        namespace: 'default',
        keyword: 'test',
        itemsPerPage: 10,
        page: 1
      };

      const result = await GetMemberClusterServices(params);

      expect(enhancedMemberClusterClient.get).toHaveBeenCalledWith(
        '/clusterapi/test-cluster/api/v1/service/default',
        {
          params: {
            filterBy: ['name', 'test'],
            itemsPerPage: 10,
            page: 1
          }
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should get service detail with correct parameters', async () => {
      const mockResponse = {
        code: 200,
        message: 'Success',
        data: {
          errors: [],
          objectMeta: { name: 'test-service', namespace: 'default' },
          spec: { type: 'ClusterIP', ports: [] }
        }
      };
      vi.mocked(enhancedMemberClusterClient.get).mockResolvedValue(mockResponse);

      const params = {
        memberClusterName: 'test-cluster',
        namespace: 'default',
        name: 'test-service'
      };

      const result = await GetMemberClusterServiceDetail(params);

      expect(enhancedMemberClusterClient.get).toHaveBeenCalledWith(
        '/clusterapi/test-cluster/api/v1/service/default/test-service'
      );
      expect(result).toEqual(mockResponse);
    });

    it('should create service with correct parameters', async () => {
      const mockResponse = { code: 200, message: 'Success', data: {} };
      vi.mocked(enhancedMemberClusterClient.post).mockResolvedValue(mockResponse);

      const params = {
        memberClusterName: 'test-cluster',
        namespace: 'default',
        name: 'test-service',
        content: 'yaml-content'
      };

      const result = await CreateMemberClusterService(params);

      expect(enhancedMemberClusterClient.post).toHaveBeenCalledWith(
        '/clusterapi/test-cluster/api/v1/service',
        { namespace: 'default', name: 'test-service', content: 'yaml-content' }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should update service with correct parameters', async () => {
      const mockResponse = { code: 200, message: 'Success', data: {} };
      vi.mocked(enhancedMemberClusterClient.put).mockResolvedValue(mockResponse);

      const params = {
        memberClusterName: 'test-cluster',
        namespace: 'default',
        name: 'test-service',
        content: 'updated-yaml-content'
      };

      const result = await UpdateMemberClusterService(params);

      expect(enhancedMemberClusterClient.put).toHaveBeenCalledWith(
        '/clusterapi/test-cluster/api/v1/service/default/test-service',
        { content: 'updated-yaml-content' }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should delete service with correct parameters', async () => {
      const mockResponse = { code: 200, message: 'Success', data: {} };
      vi.mocked(enhancedMemberClusterClient.delete).mockResolvedValue(mockResponse);

      const params = {
        memberClusterName: 'test-cluster',
        namespace: 'default',
        name: 'test-service',
        gracePeriodSeconds: 30
      };

      const result = await DeleteMemberClusterService(params);

      expect(enhancedMemberClusterClient.delete).toHaveBeenCalledWith(
        '/clusterapi/test-cluster/api/v1/service/default/test-service',
        { params: { gracePeriodSeconds: 30 } }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Ingress CRUD', () => {
    it('should get ingress resources with correct parameters', async () => {
      const mockResponse = {
        code: 200,
        message: 'Success',
        data: {
          errors: [],
          listMeta: { totalItems: 1 },
          items: [{ objectMeta: { name: 'test-ingress' } }]
        }
      };
      vi.mocked(enhancedMemberClusterClient.get).mockResolvedValue(mockResponse);

      const params = {
        memberClusterName: 'test-cluster',
        namespace: 'default',
        keyword: 'test',
        itemsPerPage: 10,
        page: 1
      };

      const result = await GetMemberClusterIngress(params);

      expect(enhancedMemberClusterClient.get).toHaveBeenCalledWith(
        '/clusterapi/test-cluster/api/v1/ingress/default',
        {
          params: {
            filterBy: ['name', 'test'],
            itemsPerPage: 10,
            page: 1
          }
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should get ingress detail with correct parameters', async () => {
      const mockResponse = {
        code: 200,
        message: 'Success',
        data: {
          errors: [],
          objectMeta: { name: 'test-ingress', namespace: 'default' },
          spec: { rules: [] }
        }
      };
      vi.mocked(enhancedMemberClusterClient.get).mockResolvedValue(mockResponse);

      const params = {
        memberClusterName: 'test-cluster',
        namespace: 'default',
        name: 'test-ingress'
      };

      const result = await GetMemberClusterIngressDetail(params);

      expect(enhancedMemberClusterClient.get).toHaveBeenCalledWith(
        '/clusterapi/test-cluster/api/v1/ingress/default/test-ingress'
      );
      expect(result).toEqual(mockResponse);
    });

    it('should create ingress with correct parameters', async () => {
      const mockResponse = { code: 200, message: 'Success', data: {} };
      vi.mocked(enhancedMemberClusterClient.post).mockResolvedValue(mockResponse);

      const params = {
        memberClusterName: 'test-cluster',
        namespace: 'default',
        name: 'test-ingress',
        content: 'yaml-content'
      };

      const result = await CreateMemberClusterIngress(params);

      expect(enhancedMemberClusterClient.post).toHaveBeenCalledWith(
        '/clusterapi/test-cluster/api/v1/ingress',
        { namespace: 'default', name: 'test-ingress', content: 'yaml-content' }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should update ingress with correct parameters', async () => {
      const mockResponse = { code: 200, message: 'Success', data: {} };
      vi.mocked(enhancedMemberClusterClient.put).mockResolvedValue(mockResponse);

      const params = {
        memberClusterName: 'test-cluster',
        namespace: 'default',
        name: 'test-ingress',
        content: 'updated-yaml-content'
      };

      const result = await UpdateMemberClusterIngress(params);

      expect(enhancedMemberClusterClient.put).toHaveBeenCalledWith(
        '/clusterapi/test-cluster/api/v1/ingress/default/test-ingress',
        { content: 'updated-yaml-content' }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should delete ingress with correct parameters', async () => {
      const mockResponse = { code: 200, message: 'Success', data: {} };
      vi.mocked(enhancedMemberClusterClient.delete).mockResolvedValue(mockResponse);

      const params = {
        memberClusterName: 'test-cluster',
        namespace: 'default',
        name: 'test-ingress'
      };

      const result = await DeleteMemberClusterIngress(params);

      expect(enhancedMemberClusterClient.delete).toHaveBeenCalledWith(
        '/clusterapi/test-cluster/api/v1/ingress/default/test-ingress',
        { params: { gracePeriodSeconds: undefined } }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      vi.mocked(enhancedMemberClusterClient.get).mockRejectedValue(mockError);

      const params = {
        memberClusterName: 'test-cluster',
        namespace: 'default',
        name: 'test-service'
      };

      await expect(GetMemberClusterServiceDetail(params)).rejects.toThrow('Network error');
    });

    it('should handle validation errors in create operations', async () => {
      const mockError = new Error('Validation failed');
      vi.mocked(enhancedMemberClusterClient.post).mockRejectedValue(mockError);

      const params = {
        memberClusterName: 'test-cluster',
        namespace: 'default',
        name: 'invalid-service',
        content: 'invalid-yaml'
      };

      await expect(CreateMemberClusterService(params)).rejects.toThrow('Validation failed');
    });
  });
});