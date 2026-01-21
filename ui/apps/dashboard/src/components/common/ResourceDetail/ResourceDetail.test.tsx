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
import { ResourceDetail } from './index';
import { createWorkloadTabs } from './utils';
import { WorkloadKind } from '@/services/base';

// Mock the i18n utility
jest.mock('@/utils/i18n', () => ({
  t: (key: string, fallback: string) => fallback || key,
}));

// Mock the time utility
jest.mock('@/utils/time', () => ({
  calculateDuration: (timestamp: string) => '2d',
}));

// Mock the tag-list component
jest.mock('@/components/tag-list', () => ({
  __esModule: true,
  default: ({ tags }: { tags: any[] }) => (
    <div data-testid="tag-list">
      {tags.map((tag, index) => (
        <span key={index} data-testid="tag">
          {tag.key}={tag.value}
        </span>
      ))}
    </div>
  ),
  convertLabelToTags: (name: string, labels: Record<string, string> = {}) =>
    Object.entries(labels).map(([key, value]) => ({ key, value })),
}));

// Mock fetch function
const mockFetchFunction = jest.fn();

// Mock resource data
const mockResource = {
  objectMeta: {
    name: 'test-deployment',
    namespace: 'default',
    labels: { app: 'test', version: 'v1.0.0' },
    annotations: { 'deployment.kubernetes.io/revision': '1' },
    creationTimestamp: '2024-01-15T10:30:00Z',
    uid: 'abc123-def456-ghi789',
    resourceVersion: '12345',
  },
  typeMeta: {
    kind: 'Deployment',
    scalable: true,
    restartable: true,
  },
  spec: {
    replicas: 3,
    selector: { matchLabels: { app: 'test' } },
  },
  status: {
    replicas: 3,
    readyReplicas: 2,
    conditions: [
      {
        type: 'Available',
        status: 'True',
        reason: 'MinimumReplicasAvailable',
        message: 'Deployment has minimum availability.',
        lastTransitionTime: '2024-01-15T10:35:00Z',
      },
    ],
  },
};

// Test wrapper component
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

describe('ResourceDetail Component', () => {
  beforeEach(() => {
    mockFetchFunction.mockClear();
    mockFetchFunction.mockResolvedValue(mockResource);
  });

  const defaultProps = {
    open: true,
    memberClusterName: 'test-cluster',
    namespace: 'default',
    name: 'test-deployment',
    resourceType: 'deployment',
    resourceKind: 'Deployment',
    fetchFunction: mockFetchFunction,
    onClose: jest.fn(),
  };

  it('renders the resource detail drawer when open', async () => {
    render(
      <TestWrapper>
        <ResourceDetail {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('Deployment Details')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('default/test-deployment')).toBeInTheDocument();
    });
  });

  it('displays default tabs (Overview, YAML, Events)', async () => {
    render(
      <TestWrapper>
        <ResourceDetail {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('YAML')).toBeInTheDocument();
      expect(screen.getByText('Events')).toBeInTheDocument();
    });
  });

  it('displays resource information in overview tab', async () => {
    render(
      <TestWrapper>
        <ResourceDetail {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('test-deployment')).toBeInTheDocument();
      expect(screen.getByText('default')).toBeInTheDocument();
      expect(screen.getByText('Deployment')).toBeInTheDocument();
      expect(screen.getByText('2d')).toBeInTheDocument();
    });
  });

  it('displays labels and annotations', async () => {
    render(
      <TestWrapper>
        <ResourceDetail {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      const tagLists = screen.getAllByTestId('tag-list');
      expect(tagLists).toHaveLength(2); // Labels and annotations
      
      const tags = screen.getAllByTestId('tag');
      expect(tags.some(tag => tag.textContent?.includes('app=test'))).toBe(true);
      expect(tags.some(tag => tag.textContent?.includes('version=v1.0.0'))).toBe(true);
    });
  });

  it('calls fetchFunction with correct parameters', async () => {
    render(
      <TestWrapper>
        <ResourceDetail {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockFetchFunction).toHaveBeenCalledWith({
        memberClusterName: 'test-cluster',
        namespace: 'default',
        name: 'test-deployment',
      });
    });
  });

  it('displays custom tabs when provided', async () => {
    const customTabs = createWorkloadTabs(WorkloadKind.Deployment);
    
    render(
      <TestWrapper>
        <ResourceDetail {...defaultProps} tabs={customTabs} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Pods')).toBeInTheDocument();
      expect(screen.getByText('Conditions')).toBeInTheDocument();
      expect(screen.getByText('Metrics')).toBeInTheDocument();
      expect(screen.getByText('Logs')).toBeInTheDocument();
    });
  });

  it('shows edit and delete buttons when enabled', async () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();

    render(
      <TestWrapper>
        <ResourceDetail
          {...defaultProps}
          onEdit={onEdit}
          onDelete={onDelete}
          enableEdit={true}
          enableDelete={true}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      const editButton = screen.getByLabelText('Edit');
      const deleteButton = screen.getByLabelText('Delete');
      
      expect(editButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
      
      fireEvent.click(editButton);
      expect(onEdit).toHaveBeenCalled();
      
      fireEvent.click(deleteButton);
      expect(onDelete).toHaveBeenCalled();
    });
  });

  it('hides edit and delete buttons when disabled', async () => {
    render(
      <TestWrapper>
        <ResourceDetail
          {...defaultProps}
          enableEdit={false}
          enableDelete={false}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByLabelText('Edit')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Delete')).not.toBeInTheDocument();
    });
  });

  it('displays breadcrumbs when provided', async () => {
    const breadcrumbs = [
      { title: 'Clusters' },
      { title: 'test-cluster' },
      { title: 'Deployments' },
      { title: 'default' },
    ];

    render(
      <TestWrapper>
        <ResourceDetail {...defaultProps} breadcrumbs={breadcrumbs} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Clusters')).toBeInTheDocument();
      expect(screen.getByText('test-cluster')).toBeInTheDocument();
      expect(screen.getByText('Deployments')).toBeInTheDocument();
    });
  });

  it('handles loading state', () => {
    mockFetchFunction.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <TestWrapper>
        <ResourceDetail {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByTestId('loading-spinner') || screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    const errorMessage = 'Failed to fetch resource';
    mockFetchFunction.mockRejectedValue(new Error(errorMessage));

    render(
      <TestWrapper>
        <ResourceDetail {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load resource details')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('calls onClose when drawer is closed', async () => {
    const onClose = jest.fn();

    render(
      <TestWrapper>
        <ResourceDetail {...defaultProps} onClose={onClose} />
      </TestWrapper>
    );

    await waitFor(() => {
      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('switches between tabs correctly', async () => {
    render(
      <TestWrapper>
        <ResourceDetail {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      // Initially on Overview tab
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      
      // Switch to YAML tab
      fireEvent.click(screen.getByText('YAML'));
      expect(screen.getByText('YAML Configuration')).toBeInTheDocument();
      
      // Switch to Events tab
      fireEvent.click(screen.getByText('Events'));
      expect(screen.getByText('Resource Events')).toBeInTheDocument();
    });
  });

  it('displays custom title when provided', async () => {
    render(
      <TestWrapper>
        <ResourceDetail {...defaultProps} title="Custom Resource Title" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Custom Resource Title')).toBeInTheDocument();
    });
  });

  it('displays custom actions when provided', async () => {
    const customActions = <button data-testid="custom-action">Custom Action</button>;

    render(
      <TestWrapper>
        <ResourceDetail {...defaultProps} customActions={customActions} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('custom-action')).toBeInTheDocument();
    });
  });

  it('calls onRefresh when refresh button is clicked', async () => {
    const onRefresh = jest.fn();

    render(
      <TestWrapper>
        <ResourceDetail {...defaultProps} onRefresh={onRefresh} />
      </TestWrapper>
    );

    await waitFor(() => {
      const refreshButton = screen.getByLabelText('Refresh');
      fireEvent.click(refreshButton);
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  it('does not render when open is false', () => {
    render(
      <TestWrapper>
        <ResourceDetail {...defaultProps} open={false} />
      </TestWrapper>
    );

    expect(screen.queryByText('Deployment Details')).not.toBeInTheDocument();
  });
});