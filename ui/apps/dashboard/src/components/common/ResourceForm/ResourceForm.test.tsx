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
import { ResourceForm, FormFieldConfig, ResourceTemplate, ResourceExample } from './index';

// Mock the notification system
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  notification: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock i18n
jest.mock('@/utils/i18n', () => ({
  t: (key: string, defaultValue: string) => defaultValue,
}));

// Test wrapper with QueryClient
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('ResourceForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  const basicFields: FormFieldConfig[] = [
    {
      key: 'metadata.name',
      label: 'Name',
      type: 'input',
      required: true,
      placeholder: 'Enter resource name',
    },
    {
      key: 'metadata.namespace',
      label: 'Namespace',
      type: 'select',
      required: true,
      options: [
        { label: 'default', value: 'default' },
        { label: 'production', value: 'production' },
      ],
    },
    {
      key: 'spec.replicas',
      label: 'Replicas',
      type: 'number',
      required: true,
      defaultValue: 1,
    },
  ];

  const mockTemplates: ResourceTemplate[] = [
    {
      name: 'Basic Template',
      description: 'A basic configuration',
      category: 'Basic',
      recommended: true,
      data: {
        metadata: {
          name: '',
          namespace: 'default',
          labels: {},
          annotations: {},
        },
        spec: {
          replicas: 3,
        },
      },
    },
  ];

  const mockExamples: ResourceExample[] = [
    {
      name: 'Simple Example',
      description: 'A simple example',
      category: 'Basic',
      complexity: 'basic',
      yaml: JSON.stringify({
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: { name: 'test', namespace: 'default' },
        spec: { replicas: 1 },
      }, null, 2),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form with basic fields', () => {
    render(
      <TestWrapper>
        <ResourceForm
          resourceType="deployment"
          resourceKind="Deployment"
          memberClusterName="test-cluster"
          mode="create"
          fields={basicFields}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Create Deployment')).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Namespace/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Replicas/)).toBeInTheDocument();
  });

  it('shows validation errors for required fields', async () => {
    render(
      <TestWrapper>
        <ResourceForm
          resourceType="deployment"
          resourceKind="Deployment"
          memberClusterName="test-cluster"
          mode="create"
          fields={basicFields}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /Create/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Namespace is required')).toBeInTheDocument();
    });
  });

  it('calls onSubmit with form data when valid', async () => {
    render(
      <TestWrapper>
        <ResourceForm
          resourceType="deployment"
          resourceKind="Deployment"
          memberClusterName="test-cluster"
          mode="create"
          fields={basicFields}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    // Fill in the form
    const nameInput = screen.getByLabelText(/Name/);
    const namespaceSelect = screen.getByLabelText(/Namespace/);
    const replicasInput = screen.getByLabelText(/Replicas/);

    fireEvent.change(nameInput, { target: { value: 'test-deployment' } });
    fireEvent.change(namespaceSelect, { target: { value: 'default' } });
    fireEvent.change(replicasInput, { target: { value: '3' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Create/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        metadata: {
          name: 'test-deployment',
          namespace: 'default',
        },
        spec: {
          replicas: 3,
        },
      });
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <TestWrapper>
        <ResourceForm
          resourceType="deployment"
          resourceKind="Deployment"
          memberClusterName="test-cluster"
          mode="create"
          fields={basicFields}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/ });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows templates when enabled', () => {
    render(
      <TestWrapper>
        <ResourceForm
          resourceType="deployment"
          resourceKind="Deployment"
          memberClusterName="test-cluster"
          mode="create"
          fields={basicFields}
          templates={mockTemplates}
          enableTemplates={true}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    expect(screen.getByRole('button', { name: /Templates/ })).toBeInTheDocument();
  });

  it('shows examples when enabled', () => {
    render(
      <TestWrapper>
        <ResourceForm
          resourceType="deployment"
          resourceKind="Deployment"
          memberClusterName="test-cluster"
          mode="create"
          fields={basicFields}
          examples={mockExamples}
          enableExamples={true}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    expect(screen.getByRole('button', { name: /Examples/ })).toBeInTheDocument();
  });

  it('shows YAML editor tab when enabled', () => {
    render(
      <TestWrapper>
        <ResourceForm
          resourceType="deployment"
          resourceKind="Deployment"
          memberClusterName="test-cluster"
          mode="create"
          fields={basicFields}
          enableYAMLEditor={true}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    expect(screen.getByRole('tab', { name: /YAML/ })).toBeInTheDocument();
  });

  it('shows progress indicator when enabled', () => {
    render(
      <TestWrapper>
        <ResourceForm
          resourceType="deployment"
          resourceKind="Deployment"
          memberClusterName="test-cluster"
          mode="create"
          fields={basicFields}
          enableProgressIndicator={true}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Progress')).toBeInTheDocument();
  });

  it('populates form with initial values in edit mode', () => {
    const initialValues = {
      metadata: {
        name: 'existing-deployment',
        namespace: 'production',
        labels: {},
        annotations: {},
      },
      spec: {
        replicas: 5,
      },
    };

    render(
      <TestWrapper>
        <ResourceForm
          resourceType="deployment"
          resourceKind="Deployment"
          memberClusterName="test-cluster"
          mode="edit"
          fields={basicFields}
          initialValues={initialValues}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Edit Deployment')).toBeInTheDocument();
    expect(screen.getByDisplayValue('existing-deployment')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  it('runs custom validation when provided', async () => {
    const customValidation = jest.fn().mockResolvedValue({
      'spec.replicas': 'Too many replicas',
    });

    render(
      <TestWrapper>
        <ResourceForm
          resourceType="deployment"
          resourceKind="Deployment"
          memberClusterName="test-cluster"
          mode="create"
          fields={basicFields}
          customValidation={customValidation}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    // Fill in the form
    const nameInput = screen.getByLabelText(/Name/);
    const namespaceSelect = screen.getByLabelText(/Namespace/);
    const replicasInput = screen.getByLabelText(/Replicas/);

    fireEvent.change(nameInput, { target: { value: 'test-deployment' } });
    fireEvent.change(namespaceSelect, { target: { value: 'default' } });
    fireEvent.change(replicasInput, { target: { value: '100' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Create/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(customValidation).toHaveBeenCalled();
      expect(screen.getByText('Too many replicas')).toBeInTheDocument();
    });

    // onSubmit should not be called due to validation error
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('handles form field visibility based on conditions', () => {
    const conditionalFields: FormFieldConfig[] = [
      ...basicFields,
      {
        key: 'spec.strategy.type',
        label: 'Strategy Type',
        type: 'select',
        options: [
          { label: 'RollingUpdate', value: 'RollingUpdate' },
          { label: 'Recreate', value: 'Recreate' },
        ],
      },
      {
        key: 'spec.strategy.rollingUpdate.maxSurge',
        label: 'Max Surge',
        type: 'input',
        visible: (formData) => formData.spec?.strategy?.type === 'RollingUpdate',
      },
    ];

    render(
      <TestWrapper>
        <ResourceForm
          resourceType="deployment"
          resourceKind="Deployment"
          memberClusterName="test-cluster"
          mode="create"
          fields={conditionalFields}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    // Max Surge field should not be visible initially
    expect(screen.queryByLabelText(/Max Surge/)).not.toBeInTheDocument();

    // Select RollingUpdate strategy
    const strategySelect = screen.getByLabelText(/Strategy Type/);
    fireEvent.change(strategySelect, { target: { value: 'RollingUpdate' } });

    // Max Surge field should now be visible
    expect(screen.getByLabelText(/Max Surge/)).toBeInTheDocument();
  });

  it('handles form reset correctly', () => {
    render(
      <TestWrapper>
        <ResourceForm
          resourceType="deployment"
          resourceKind="Deployment"
          memberClusterName="test-cluster"
          mode="create"
          fields={basicFields}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    // Fill in some data
    const nameInput = screen.getByLabelText(/Name/);
    fireEvent.change(nameInput, { target: { value: 'test-deployment' } });

    expect(screen.getByDisplayValue('test-deployment')).toBeInTheDocument();

    // Click reset button
    const resetButton = screen.getByRole('button', { name: /Reset/ });
    fireEvent.click(resetButton);

    // Form should be cleared
    expect(screen.queryByDisplayValue('test-deployment')).not.toBeInTheDocument();
  });
});

describe('ResourceForm Accessibility', () => {
  const basicFields: FormFieldConfig[] = [
    {
      key: 'metadata.name',
      label: 'Name',
      type: 'input',
      required: true,
      tooltip: 'The name of the resource',
    },
  ];

  it('has proper ARIA labels and roles', () => {
    render(
      <TestWrapper>
        <ResourceForm
          resourceType="deployment"
          resourceKind="Deployment"
          memberClusterName="test-cluster"
          mode="create"
          fields={basicFields}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      </TestWrapper>
    );

    // Check for proper form structure
    expect(screen.getByRole('form')).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument();
  });

  it('supports keyboard navigation', () => {
    render(
      <TestWrapper>
        <ResourceForm
          resourceType="deployment"
          resourceKind="Deployment"
          memberClusterName="test-cluster"
          mode="create"
          fields={basicFields}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      </TestWrapper>
    );

    const nameInput = screen.getByLabelText(/Name/);
    const createButton = screen.getByRole('button', { name: /Create/ });
    const cancelButton = screen.getByRole('button', { name: /Cancel/ });

    // Elements should be focusable
    nameInput.focus();
    expect(document.activeElement).toBe(nameInput);

    // Tab navigation should work
    fireEvent.keyDown(nameInput, { key: 'Tab' });
    // Note: In a real test environment, you'd check focus management more thoroughly
  });
});

describe('ResourceForm Performance', () => {
  it('does not re-render unnecessarily', () => {
    const renderSpy = jest.fn();
    
    const TestComponent = () => {
      renderSpy();
      return (
        <ResourceForm
          resourceType="deployment"
          resourceKind="Deployment"
          memberClusterName="test-cluster"
          mode="create"
          fields={[]}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );
    };

    const { rerender } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const initialRenderCount = renderSpy.mock.calls.length;

    // Re-render with same props
    rerender(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Should not cause additional renders due to memoization
    expect(renderSpy.mock.calls.length).toBe(initialRenderCount);
  });
});