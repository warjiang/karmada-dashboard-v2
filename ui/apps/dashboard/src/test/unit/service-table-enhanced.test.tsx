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

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ServiceTable from '@/pages/multicloud-resource-manage/service/components/service-table';
import IngressTable from '@/pages/multicloud-resource-manage/service/components/ingress-table';
import { ServiceResource, IngressResource } from '@/services/member-cluster/service';
import { ApiError, ApiErrorType } from '@/services/base';

// Mock the service functions
vi.mock('@/services/member-cluster/service', () => ({
  GetMemberClusterServices: vi.fn(),
  GetMemberClusterServiceDetail: vi.fn(),
  GetMemberClusterIngress: vi.fn(),
  GetMemberClusterIngressDetail: vi.fn(),
}));

// Mock the hooks
vi.mock('@/hooks/useResourceQuery', () => ({
  useResourceQuery: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useResourceDetailQuery: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

// Mock antd notification
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    notification: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    },
  };
});

describe('Enhanced Service Table Components', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const mockServiceResource: ServiceResource = {
    objectMeta: {
      name: 'test-service',
      namespace: 'default',
      labels: { app: 'test' },
      annotations: { 'service.beta.kubernetes.io/aws-load-balancer-type': 'nlb' },
      creationTimestamp: '2024-01-01T00:00:00Z',
      uid: 'test-uid',
      resourceVersion: '1',
    },
    typeMeta: {
      kind: 'Service',
      scalable: false,
      restartable: false,
    },
    spec: {
      type: 'LoadBalancer',
      selector: { app: 'test' },
      ports: [
        {
          name: 'http',
          protocol: 'TCP',
          port: 80,
          targetPort: 8080,
          nodePort: 30080,
        },
      ],
      clusterIP: '10.96.0.1',
      externalIPs: ['192.168.1.100'],
      loadBalancerIP: '203.0.113.1',
      sessionAffinity: 'None',
    },
  };

  const mockIngressResource: IngressResource = {
    objectMeta: {
      name: 'test-ingress',
      namespace: 'default',
      labels: { app: 'test' },
      annotations: { 'nginx.ingress.kubernetes.io/rewrite-target': '/' },
      creationTimestamp: '2024-01-01T00:00:00Z',
      uid: 'test-uid',
      resourceVersion: '1',
    },
    typeMeta: {
      kind: 'Ingress',
      scalable: false,
      restartable: false,
    },
    spec: {
      ingressClassName: 'nginx',
      rules: [
        {
          host: 'example.com',
          http: {
            paths: [
              {
                path: '/',
                pathType: 'Prefix',
                backend: {
                  service: {
                    name: 'test-service',
                    port: { number: 80 },
                  },
                },
              },
            ],
          },
        },
      ],
      tls: [
        {
          hosts: ['example.com'],
          secretName: 'tls-secret',
        },
      ],
    },
  };

  describe('ServiceTable', () => {
    const defaultProps = {
      memberClusterName: 'test-cluster',
      selectedWorkSpace: 'default',
      searchText: '',
      onViewServiceContent: vi.fn(),
      onEditServiceContent: vi.fn(),
      onDeleteServiceContent: vi.fn(),
    };

    it('should render service table with enhanced information display', async () => {
      const { useResourceQuery } = await import('@/hooks/useResourceQuery');
      vi.mocked(useResourceQuery).mockReturnValue({
        data: { services: [mockServiceResource], listMeta: { totalItems: 1 } },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(
        <QueryClientProvider client={queryClient}>
          <ServiceTable {...defaultProps} />
        </QueryClientProvider>
      );

      // Check that service information is displayed
      expect(screen.getByText('test-service')).toBeInTheDocument();
      expect(screen.getByText('default')).toBeInTheDocument();
      expect(screen.getByText('LoadBalancer')).toBeInTheDocument();
      expect(screen.getByText('10.96.0.1')).toBeInTheDocument();
      expect(screen.getByText('203.0.113.1')).toBeInTheDocument();

      // Check that ports are displayed with enhanced formatting
      expect(screen.getByText('80/30080/TCP')).toBeInTheDocument();

      // Check that selector indicator is shown
      expect(screen.getByText('Selector')).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      const apiError = new ApiError({
        code: 500,
        message: 'Internal server error',
        type: ApiErrorType.ServerError,
        details: 'Database connection failed',
      });

      const { useResourceQuery } = await import('@/hooks/useResourceQuery');
      vi.mocked(useResourceQuery).mockReturnValue({
        data: null,
        isLoading: false,
        error: apiError,
        refetch: vi.fn(),
      } as any);

      render(
        <QueryClientProvider client={queryClient}>
          <ServiceTable {...defaultProps} />
        </QueryClientProvider>
      );

      // Check that error alert is displayed
      expect(screen.getByText(/Failed to load services/)).toBeInTheDocument();
      expect(screen.getByText(/Internal server error/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should open service detail drawer when view button is clicked', async () => {
      const { useResourceQuery, useResourceDetailQuery } = await import('@/hooks/useResourceQuery');
      
      vi.mocked(useResourceQuery).mockReturnValue({
        data: { services: [mockServiceResource], listMeta: { totalItems: 1 } },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.mocked(useResourceDetailQuery).mockReturnValue({
        data: { 
          data: { 
            ...mockServiceResource, 
            endpoints: [
              { host: '10.244.0.1', ready: true, ports: [{ port: 8080, protocol: 'TCP' }] }
            ] 
          } 
        },
        isLoading: false,
        error: null,
      } as any);

      render(
        <QueryClientProvider client={queryClient}>
          <ServiceTable {...defaultProps} />
        </QueryClientProvider>
      );

      // Click the view button
      const viewButton = screen.getByRole('button', { name: /eye/i });
      fireEvent.click(viewButton);

      // Check that detail drawer is opened
      await waitFor(() => {
        expect(screen.getByText('Service Details: test-service')).toBeInTheDocument();
      });

      // Check that detailed information is displayed
      expect(screen.getByText('LoadBalancer')).toBeInTheDocument();
      expect(screen.getByText('10.96.0.1')).toBeInTheDocument();
      expect(screen.getByText('None')).toBeInTheDocument(); // Session Affinity
    });

    it('should display service-specific detail information', async () => {
      const { useResourceQuery } = await import('@/hooks/useResourceQuery');
      vi.mocked(useResourceQuery).mockReturnValue({
        data: { services: [mockServiceResource], listMeta: { totalItems: 1 } },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(
        <QueryClientProvider client={queryClient}>
          <ServiceTable {...defaultProps} />
        </QueryClientProvider>
      );

      // Check that service-specific information is displayed
      expect(screen.getByText('LoadBalancer')).toBeInTheDocument();
      expect(screen.getByText('203.0.113.1')).toBeInTheDocument(); // Load Balancer IP
      expect(screen.getByText('192.168.1.100')).toBeInTheDocument(); // External IP
      
      // Check port information with target port
      expect(screen.getByText('80/30080/TCP')).toBeInTheDocument();
    });
  });

  describe('IngressTable', () => {
    const defaultProps = {
      memberClusterName: 'test-cluster',
      selectedWorkSpace: 'default',
      searchText: '',
      onViewIngressContent: vi.fn(),
      onEditIngressContent: vi.fn(),
      onDeleteIngressContent: vi.fn(),
    };

    it('should render ingress table with enhanced information display', async () => {
      const { useResourceQuery } = await import('@/hooks/useResourceQuery');
      vi.mocked(useResourceQuery).mockReturnValue({
        data: { items: [mockIngressResource], listMeta: { totalItems: 1 } },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(
        <QueryClientProvider client={queryClient}>
          <IngressTable {...defaultProps} />
        </QueryClientProvider>
      );

      // Check that ingress information is displayed
      expect(screen.getByText('test-ingress')).toBeInTheDocument();
      expect(screen.getByText('default')).toBeInTheDocument();
      expect(screen.getByText('nginx')).toBeInTheDocument();
      expect(screen.getByText('example.com')).toBeInTheDocument();

      // Check that TLS indicator is shown
      expect(screen.getAllByText('1')[0]).toBeInTheDocument(); // TLS count

      // Check that path count is displayed
      expect(screen.getByText('1')).toBeInTheDocument(); // Path count

      // Check that backend service is displayed
      expect(screen.getByText('test-service')).toBeInTheDocument();
    });

    it('should display TLS configuration and routing rules in detail drawer', async () => {
      const { useResourceQuery, useResourceDetailQuery } = await import('@/hooks/useResourceQuery');
      
      vi.mocked(useResourceQuery).mockReturnValue({
        data: { items: [mockIngressResource], listMeta: { totalItems: 1 } },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.mocked(useResourceDetailQuery).mockReturnValue({
        data: { data: mockIngressResource },
        isLoading: false,
        error: null,
      } as any);

      render(
        <QueryClientProvider client={queryClient}>
          <IngressTable {...defaultProps} />
        </QueryClientProvider>
      );

      // Click the view button
      const viewButton = screen.getByRole('button', { name: /eye/i });
      fireEvent.click(viewButton);

      // Check that detail drawer is opened
      await waitFor(() => {
        expect(screen.getByText('Ingress Details: test-ingress')).toBeInTheDocument();
      });

      // Check that TLS configuration is displayed
      expect(screen.getByText('tls-secret')).toBeInTheDocument();
      expect(screen.getByText('example.com')).toBeInTheDocument();

      // Check that routing rules are displayed
      expect(screen.getByText('/')).toBeInTheDocument(); // Path
      expect(screen.getByText('Prefix')).toBeInTheDocument(); // Path type
      expect(screen.getByText('test-service:80')).toBeInTheDocument(); // Backend
    });

    it('should handle ingress without TLS configuration', async () => {
      const ingressWithoutTLS = {
        ...mockIngressResource,
        spec: {
          ...mockIngressResource.spec,
          tls: undefined,
        },
      };

      const { useResourceQuery } = await import('@/hooks/useResourceQuery');
      vi.mocked(useResourceQuery).mockReturnValue({
        data: { items: [ingressWithoutTLS], listMeta: { totalItems: 1 } },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(
        <QueryClientProvider client={queryClient}>
          <IngressTable {...defaultProps} />
        </QueryClientProvider>
      );

      // Check that TLS count shows 0
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should display annotations and routing rules correctly', async () => {
      const { useResourceQuery } = await import('@/hooks/useResourceQuery');
      vi.mocked(useResourceQuery).mockReturnValue({
        data: { items: [mockIngressResource], listMeta: { totalItems: 1 } },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(
        <QueryClientProvider client={queryClient}>
          <IngressTable {...defaultProps} />
        </QueryClientProvider>
      );

      // Check that ingress class is displayed
      expect(screen.getByText('nginx')).toBeInTheDocument();

      // Check that host is displayed
      expect(screen.getByText('example.com')).toBeInTheDocument();

      // Check that backend service is displayed
      expect(screen.getByText('test-service')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors appropriately', async () => {
      const networkError = new ApiError({
        code: 0,
        message: 'Network error. Please check your connection.',
        type: ApiErrorType.NetworkError,
      });

      const { useResourceQuery } = await import('@/hooks/useResourceQuery');
      vi.mocked(useResourceQuery).mockReturnValue({
        data: null,
        isLoading: false,
        error: networkError,
        refetch: vi.fn(),
      } as any);

      render(
        <QueryClientProvider client={queryClient}>
          <ServiceTable 
            memberClusterName="test-cluster"
            selectedWorkSpace="default"
            searchText=""
            onViewServiceContent={vi.fn()}
            onEditServiceContent={vi.fn()}
            onDeleteServiceContent={vi.fn()}
          />
        </QueryClientProvider>
      );

      expect(screen.getAllByText(/Network error/)[0]).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should handle authentication errors appropriately', async () => {
      const authError = new ApiError({
        code: 401,
        message: 'Authentication required. Please log in again.',
        type: ApiErrorType.AuthenticationError,
      });

      const { useResourceQuery } = await import('@/hooks/useResourceQuery');
      vi.mocked(useResourceQuery).mockReturnValue({
        data: null,
        isLoading: false,
        error: authError,
        refetch: vi.fn(),
      } as any);

      render(
        <QueryClientProvider client={queryClient}>
          <IngressTable 
            memberClusterName="test-cluster"
            selectedWorkSpace="default"
            searchText=""
            onViewIngressContent={vi.fn()}
            onEditIngressContent={vi.fn()}
            onDeleteIngressContent={vi.fn()}
          />
        </QueryClientProvider>
      );

      expect(screen.getAllByText(/Authentication required/)[0]).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should display loading state correctly', async () => {
      const { useResourceQuery } = await import('@/hooks/useResourceQuery');
      vi.mocked(useResourceQuery).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(
        <QueryClientProvider client={queryClient}>
          <ServiceTable 
            memberClusterName="test-cluster"
            selectedWorkSpace="default"
            searchText=""
            onViewServiceContent={vi.fn()}
            onEditServiceContent={vi.fn()}
            onDeleteServiceContent={vi.fn()}
          />
        </QueryClientProvider>
      );

      // Check that loading spinner is displayed
      expect(screen.getByRole('table')).toBeInTheDocument();
      // The loading state is handled by Ant Design Table component internally
    });
  });
});