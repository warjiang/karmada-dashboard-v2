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
import { vi } from 'vitest';
import { ResourceList, BaseResource, ResourceColumn } from './index';

// Mock data
const mockResources: BaseResource[] = [
  {
    objectMeta: {
      name: 'test-deployment-1',
      namespace: 'default',
      labels: { app: 'web', env: 'prod' },
      annotations: {},
      creationTimestamp: '2024-01-01T00:00:00Z',
      uid: 'uid-1',
    },
    typeMeta: {
      kind: 'Deployment',
      scalable: true,
      restartable: true,
    },
  },
  {
    objectMeta: {
      name: 'test-deployment-2',
      namespace: 'staging',
      labels: { app: 'api', env: 'staging' },
      annotations: {},
      creationTimestamp: '2024-01-02T00:00:00Z',
      uid: 'uid-2',
    },
    typeMeta: {
      kind: 'Deployment',
      scalable: true,
      restartable: true,
    },
  },
];

// Mock fetch function
const mockFetchFunction = vi.fn().mockResolvedValue({
  items: mockResources,
  listMeta: { totalItems: 2 },
  errors: [],
});

// Mock columns
const mockColumns: ResourceColumn<BaseResource>[] = [
  {
    key: 'name',
    title: 'Name',
    dataIndex: 'name',
    sortable: true,
    render: (_, record) => record.objectMeta.name,
  },
  {
    key: 'namespace',
    title: 'Namespace',
    dataIndex: 'namespace',
    sortable: true,
    render: (_, record) => record.objectMeta.namespace,
  },
];

// Test wrapper with QueryClient
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('ResourceList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders resource list with data', async () => {
    render(
      <TestWrapper>
        <ResourceList
          memberClusterName="test-cluster"
          resourceType="deployment"
          resourceKind="Deployment"
          fetchFunction={mockFetchFunction}
          columns={mockColumns}
        />
      </TestWrapper>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('test-deployment-1')).toBeInTheDocument();
      expect(screen.getByText('test-deployment-2')).toBeInTheDocument();
    });

    // Check if namespaces are displayed
    expect(screen.getByText('default')).toBeInTheDocument();
    expect(screen.getByText('staging')).toBeInTheDocument();
  });

  it('displays title and description when provided', async () => {
    render(
      <TestWrapper>
        <ResourceList
          memberClusterName="test-cluster"
          resourceType="deployment"
          resourceKind="Deployment"
          fetchFunction={mockFetchFunction}
          columns={mockColumns}
          title="Test Deployments"
          description="Test deployment list"
        />
      </TestWrapper>
    );

    expect(screen.getByText('Test Deployments')).toBeInTheDocument();
    expect(screen.getByText('Test deployment list')).toBeInTheDocument();
  });

  it('handles search functionality', async () => {
    render(
      <TestWrapper>
        <ResourceList
          memberClusterName="test-cluster"
          resourceType="deployment"
          resourceKind="Deployment"
          fetchFunction={mockFetchFunction}
          columns={mockColumns}
          enableSearch={true}
        />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('test-deployment-1')).toBeInTheDocument();
    });

    // Find and use search input
    const searchInput = screen.getByDisplayValue('');
    fireEvent.change(searchInput, { target: { value: 'test-deployment-1' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

    // Verify fetch function was called with search parameters
    await waitFor(() => {
      expect(mockFetchFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          keyword: 'test-deployment-1',
        })
      );
    });
  });

  it('handles refresh functionality', async () => {
    render(
      <TestWrapper>
        <ResourceList
          memberClusterName="test-cluster"
          resourceType="deployment"
          resourceKind="Deployment"
          fetchFunction={mockFetchFunction}
          columns={mockColumns}
          enableRefresh={true}
        />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockFetchFunction).toHaveBeenCalledTimes(1);
    });

    // Find and click refresh button
    const refreshButton = screen.getByLabelText('Refresh') || screen.getByRole('button', { name: /reload/i });
    fireEvent.click(refreshButton);

    // Verify fetch function was called again
    await waitFor(() => {
      expect(mockFetchFunction).toHaveBeenCalledTimes(2);
    });
  });

  it('handles pagination', async () => {
    render(
      <TestWrapper>
        <ResourceList
          memberClusterName="test-cluster"
          resourceType="deployment"
          resourceKind="Deployment"
          fetchFunction={mockFetchFunction}
          columns={mockColumns}
          enablePagination={true}
        />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('test-deployment-1')).toBeInTheDocument();
    });

    // Check if pagination is displayed
    expect(screen.getByText(/1-2 of 2 deployment/)).toBeInTheDocument();
  });

  it('handles bulk selection when enabled', async () => {
    const mockBulkActions = [
      {
        key: 'delete',
        label: 'Delete',
        onClick: vi.fn(),
      },
    ];

    render(
      <TestWrapper>
        <ResourceList
          memberClusterName="test-cluster"
          resourceType="deployment"
          resourceKind="Deployment"
          fetchFunction={mockFetchFunction}
          columns={mockColumns}
          enableBulkOperations={true}
          bulkActions={mockBulkActions}
        />
      </TestWrapper>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('test-deployment-1')).toBeInTheDocument();
    });

    // Find and click first checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // First row checkbox (index 0 is select all)

    // Check if bulk action bar appears
    await waitFor(() => {
      expect(screen.getByText(/1 items selected/)).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  it('displays error messages when fetch fails', async () => {
    const mockErrorFetch = vi.fn().mockResolvedValue({
      items: [],
      listMeta: { totalItems: 0 },
      errors: ['Failed to fetch deployments'],
    });

    render(
      <TestWrapper>
        <ResourceList
          memberClusterName="test-cluster"
          resourceType="deployment"
          resourceKind="Deployment"
          fetchFunction={mockErrorFetch}
          columns={mockColumns}
        />
      </TestWrapper>
    );

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Errors occurred while fetching data')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch deployments')).toBeInTheDocument();
    });
  });

  it('displays empty state when no data', async () => {
    const mockEmptyFetch = vi.fn().mockResolvedValue({
      items: [],
      listMeta: { totalItems: 0 },
      errors: [],
    });

    render(
      <TestWrapper>
        <ResourceList
          memberClusterName="test-cluster"
          resourceType="deployment"
          resourceKind="Deployment"
          fetchFunction={mockEmptyFetch}
          columns={mockColumns}
          emptyStateMessage="No deployments found"
        />
      </TestWrapper>
    );

    // Wait for empty state to be displayed
    await waitFor(() => {
      expect(screen.getByText('No deployments found')).toBeInTheDocument();
    });
  });

  it('calls onRowClick when row is clicked', async () => {
    const mockOnRowClick = vi.fn();

    render(
      <TestWrapper>
        <ResourceList
          memberClusterName="test-cluster"
          resourceType="deployment"
          resourceKind="Deployment"
          fetchFunction={mockFetchFunction}
          columns={mockColumns}
          onRowClick={mockOnRowClick}
        />
      </TestWrapper>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('test-deployment-1')).toBeInTheDocument();
    });

    // Click on first row
    const firstRow = screen.getByText('test-deployment-1').closest('tr');
    if (firstRow) {
      fireEvent.click(firstRow);
      expect(mockOnRowClick).toHaveBeenCalledWith(mockResources[0]);
    }
  });

  it('disables features when props are false', async () => {
    render(
      <TestWrapper>
        <ResourceList
          memberClusterName="test-cluster"
          resourceType="deployment"
          resourceKind="Deployment"
          fetchFunction={mockFetchFunction}
          columns={mockColumns}
          enableSearch={false}
          enableRefresh={false}
          enablePagination={false}
          enableBulkOperations={false}
          enableExport={false}
        />
      </TestWrapper>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('test-deployment-1')).toBeInTheDocument();
    });

    // Check that disabled features are not present
    expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /refresh/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/1-2 of 2/)).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByText(/export/i)).not.toBeInTheDocument();
  });
});