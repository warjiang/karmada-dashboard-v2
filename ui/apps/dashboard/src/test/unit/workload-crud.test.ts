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
  CreateMemberClusterDeployment,
  UpdateMemberClusterDeployment,
  DeleteMemberClusterDeployment,
  CreateMemberClusterStatefulSet,
  UpdateMemberClusterStatefulSet,
  DeleteMemberClusterStatefulSet,
  CreateMemberClusterDaemonSet,
  CreateMemberClusterJob,
  CreateMemberClusterCronJob,
} from '../../services/member-cluster/workload';
import { enhancedMemberClusterClient } from '../../services/base';

// Mock the enhanced client
vi.mock('../../services/base', () => ({
  enhancedMemberClusterClient: {
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Workload CRUD Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Deployment CRUD', () => {
    it('should create deployment with correct parameters', async () => {
      const mockResponse = { code: 200, message: 'Success', data: {} };
      vi.mocked(enhancedMemberClusterClient.post).mockResolvedValue(mockResponse);

      const params = {
        memberClusterName: 'test-cluster',
        namespace: 'default',
        name: 'test-deployment',
        content: 'yaml-content'
      };

      const result = await CreateMemberClusterDeployment(params);

      expect(enhancedMemberClusterClient.post).toHaveBeenCalledWith(
        '/clusterapi/test-cluster/api/v1/deployment',
        { namespace: 'default', name: 'test-deployment', content: 'yaml-content' }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should update deployment with correct parameters', async () => {
      const mockResponse = { code: 200, message: 'Success', data: {} };
      vi.mocked(enhancedMemberClusterClient.put).mockResolvedValue(mockResponse);

      const params = {
        memberClusterName: 'test-cluster',
        namespace: 'default',
        name: 'test-deployment',
        content: 'updated-yaml-content'
      };

      const result = await UpdateMemberClusterDeployment(params);

      expect(enhancedMemberClusterClient.put).toHaveBeenCalledWith(
        '/clusterapi/test-cluster/api/v1/deployment/default/test-deployment',
        { content: 'updated-yaml-content' }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should delete deployment with correct parameters', async () => {
      const mockResponse = { code: 200, message: 'Success', data: {} };
      vi.mocked(enhancedMemberClusterClient.delete).mockResolvedValue(mockResponse);

      const params = {
        memberClusterName: 'test-cluster',
        namespace: 'default',
        name: 'test-deployment',
        gracePeriodSeconds: 30
      };

      const result = await DeleteMemberClusterDeployment(params);

      expect(enhancedMemberClusterClient.delete).toHaveBeenCalledWith(
        '/clusterapi/test-cluster/api/v1/deployment/default/test-deployment',
        { params: { gracePeriodSeconds: 30 } }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('StatefulSet CRUD', () => {
    it('should create statefulset with correct parameters', async () => {
      const mockResponse = { code: 200, message: 'Success', data: {} };
      vi.mocked(enhancedMemberClusterClient.post).mockResolvedValue(mockResponse);

      const params = {
        memberClusterName: 'test-cluster',
        namespace: 'default',
        name: 'test-statefulset',
        content: 'yaml-content'
      };

      const result = await CreateMemberClusterStatefulSet(params);

      expect(enhancedMemberClusterClient.post).toHaveBeenCalledWith(
        '/clusterapi/test-cluster/api/v1/statefulset',
        { namespace: 'default', name: 'test-statefulset', content: 'yaml-content' }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should update statefulset with correct parameters', async () => {
      const mockResponse = { code: 200, message: 'Success', data: {} };
      vi.mocked(enhancedMemberClusterClient.put).mockResolvedValue(mockResponse);

      const params = {
        memberClusterName: 'test-cluster',
        namespace: 'default',
        name: 'test-statefulset',
        content: 'updated-yaml-content'
      };

      const result = await UpdateMemberClusterStatefulSet(params);

      expect(enhancedMemberClusterClient.put).toHaveBeenCalledWith(
        '/clusterapi/test-cluster/api/v1/statefulset/default/test-statefulset',
        { content: 'updated-yaml-content' }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should delete statefulset with correct parameters', async () => {
      const mockResponse = { code: 200, message: 'Success', data: {} };
      vi.mocked(enhancedMemberClusterClient.delete).mockResolvedValue(mockResponse);

      const params = {
        memberClusterName: 'test-cluster',
        namespace: 'default',
        name: 'test-statefulset'
      };

      const result = await DeleteMemberClusterStatefulSet(params);

      expect(enhancedMemberClusterClient.delete).toHaveBeenCalledWith(
        '/clusterapi/test-cluster/api/v1/statefulset/default/test-statefulset',
        { params: { gracePeriodSeconds: undefined } }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('DaemonSet CRUD', () => {
    it('should create daemonset with correct parameters', async () => {
      const mockResponse = { code: 200, message: 'Success', data: {} };
      vi.mocked(enhancedMemberClusterClient.post).mockResolvedValue(mockResponse);

      const params = {
        memberClusterName: 'test-cluster',
        namespace: 'kube-system',
        name: 'test-daemonset',
        content: 'yaml-content'
      };

      const result = await CreateMemberClusterDaemonSet(params);

      expect(enhancedMemberClusterClient.post).toHaveBeenCalledWith(
        '/clusterapi/test-cluster/api/v1/daemonset',
        { namespace: 'kube-system', name: 'test-daemonset', content: 'yaml-content' }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Job CRUD', () => {
    it('should create job with correct parameters', async () => {
      const mockResponse = { code: 200, message: 'Success', data: {} };
      vi.mocked(enhancedMemberClusterClient.post).mockResolvedValue(mockResponse);

      const params = {
        memberClusterName: 'test-cluster',
        namespace: 'default',
        name: 'test-job',
        content: 'yaml-content'
      };

      const result = await CreateMemberClusterJob(params);

      expect(enhancedMemberClusterClient.post).toHaveBeenCalledWith(
        '/clusterapi/test-cluster/api/v1/job',
        { namespace: 'default', name: 'test-job', content: 'yaml-content' }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('CronJob CRUD', () => {
    it('should create cronjob with correct parameters', async () => {
      const mockResponse = { code: 200, message: 'Success', data: {} };
      vi.mocked(enhancedMemberClusterClient.post).mockResolvedValue(mockResponse);

      const params = {
        memberClusterName: 'test-cluster',
        namespace: 'default',
        name: 'test-cronjob',
        content: 'yaml-content'
      };

      const result = await CreateMemberClusterCronJob(params);

      expect(enhancedMemberClusterClient.post).toHaveBeenCalledWith(
        '/clusterapi/test-cluster/api/v1/cronjob',
        { namespace: 'default', name: 'test-cronjob', content: 'yaml-content' }
      );
      expect(result).toEqual(mockResponse);
    });
  });
});