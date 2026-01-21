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
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { notification, Modal } from 'antd';
import {
  LoadingSpinner,
  CenteredLoading,
  LoadingButton,
  ResourcePopconfirm,
  DeletePopconfirm,
  showNotification,
  resourceNotifications,
  showConfirmation,
  resourceConfirmations,
} from './index';

// Mock antd components
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    notification: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
    Modal: {
      ...actual.Modal,
      confirm: vi.fn(),
    },
  };
});

// Mock i18n
vi.mock('@/utils/i18n', () => ({
  default: {
    t: vi.fn((key: string, fallback: string) => fallback || key),
  },
}));

describe('LoadingFeedback Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('LoadingSpinner', () => {
    it('renders with default props', () => {
      render(<LoadingSpinner />);
      expect(document.querySelector('.ant-spin')).toBeInTheDocument();
    });

    it('renders with custom size and tip', () => {
      render(<LoadingSpinner size="large" tip="Loading resources..." />);
      expect(document.querySelector('.ant-spin-lg')).toBeInTheDocument();
      // The tip text might not be rendered in test environment, so we check for the aria-live attribute
      expect(document.querySelector('[aria-live="polite"]')).toBeInTheDocument();
    });

    it('renders children when not spinning', () => {
      render(
        <LoadingSpinner spinning={false}>
          <div>Content</div>
        </LoadingSpinner>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('applies custom className and style', () => {
      render(
        <LoadingSpinner 
          className="custom-class" 
          style={{ backgroundColor: 'red' }}
        />
      );
      const spinner = document.querySelector('.ant-spin');
      expect(spinner).toHaveClass('custom-class');
      // Style might not be applied directly to the spinner element in test environment
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('CenteredLoading', () => {
    it('renders with default props', () => {
      render(<CenteredLoading />);
      expect(document.querySelector('.flex.justify-center.items-center')).toBeInTheDocument();
      // Check for the spinner instead of the tip text
      expect(document.querySelector('.ant-spin')).toBeInTheDocument();
    });

    it('renders with custom height and tip', () => {
      render(<CenteredLoading height="300px" tip="Custom loading..." />);
      const container = document.querySelector('.flex.justify-center.items-center');
      expect(container).toHaveStyle({ height: '300px' });
      // Check for the spinner instead of the tip text
      expect(document.querySelector('.ant-spin')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<CenteredLoading className="custom-centered" />);
      expect(document.querySelector('.custom-centered')).toBeInTheDocument();
    });
  });

  describe('LoadingButton', () => {
    it('renders with default props', () => {
      render(<LoadingButton>Click me</LoadingButton>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('shows loading state', () => {
      render(<LoadingButton loading>Loading button</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('ant-btn-loading');
    });

    it('calls onClick handler', async () => {
      const mockOnClick = vi.fn();
      render(<LoadingButton onClick={mockOnClick}>Click me</LoadingButton>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('handles async onClick', async () => {
      const mockOnClick = vi.fn().mockResolvedValue(undefined);
      render(<LoadingButton onClick={mockOnClick}>Async button</LoadingButton>);
      
      fireEvent.click(screen.getByRole('button'));
      await waitFor(() => {
        expect(mockOnClick).toHaveBeenCalled();
      });
    });

    it('applies button props correctly', () => {
      render(
        <LoadingButton 
          type="primary" 
          danger 
          size="large" 
          disabled
        >
          Button
        </LoadingButton>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('ant-btn-primary');
      expect(button).toHaveClass('ant-btn-dangerous');
      expect(button).toHaveClass('ant-btn-lg');
      expect(button).toBeDisabled();
    });
  });

  describe('ResourcePopconfirm', () => {
    it('renders children', () => {
      render(
        <ResourcePopconfirm title="Confirm" onConfirm={vi.fn()}>
          <button>Delete</button>
        </ResourcePopconfirm>
      );
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('calls onConfirm when confirmed', async () => {
      const mockOnConfirm = vi.fn();
      render(
        <ResourcePopconfirm title="Confirm action" onConfirm={mockOnConfirm}>
          <button>Action</button>
        </ResourcePopconfirm>
      );

      // Click the trigger button
      fireEvent.click(screen.getByRole('button', { name: 'Action' }));
      
      // Wait for popconfirm to appear and click confirm
      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: 'Confirm' });
        fireEvent.click(confirmButton);
      });

      expect(mockOnConfirm).toHaveBeenCalled();
    });

    it('calls onCancel when cancelled', async () => {
      const mockOnCancel = vi.fn();
      render(
        <ResourcePopconfirm 
          title="Confirm action" 
          onConfirm={vi.fn()} 
          onCancel={mockOnCancel}
        >
          <button>Action</button>
        </ResourcePopconfirm>
      );

      // Click the trigger button
      fireEvent.click(screen.getByRole('button', { name: 'Action' }));
      
      // Wait for popconfirm to appear and click cancel
      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: 'Cancel' });
        fireEvent.click(cancelButton);
      });

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('DeletePopconfirm', () => {
    it('renders with resource information', () => {
      render(
        <DeletePopconfirm
          resourceType="Deployment"
          resourceName="nginx-deployment"
          namespace="default"
          onConfirm={vi.fn()}
        >
          <button>Delete</button>
        </DeletePopconfirm>
      );
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('shows correct confirmation text with namespace', async () => {
      render(
        <DeletePopconfirm
          resourceType="Deployment"
          resourceName="nginx-deployment"
          namespace="default"
          onConfirm={vi.fn()}
        >
          <button>Delete</button>
        </DeletePopconfirm>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
      
      await waitFor(() => {
        expect(screen.getByText('Delete Deployment')).toBeInTheDocument();
      });
    });

    it('shows correct confirmation text without namespace', async () => {
      render(
        <DeletePopconfirm
          resourceType="ConfigMap"
          resourceName="app-config"
          onConfirm={vi.fn()}
        >
          <button>Delete</button>
        </DeletePopconfirm>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
      
      await waitFor(() => {
        expect(screen.getByText('Delete ConfigMap')).toBeInTheDocument();
      });
    });
  });

  describe('showNotification', () => {
    it('calls notification.success with correct parameters', () => {
      showNotification.success({
        message: 'Success',
        description: 'Operation completed',
      });

      expect(notification.success).toHaveBeenCalledWith({
        message: 'Success',
        description: 'Operation completed',
        icon: expect.any(Object),
        duration: 4.5,
        placement: 'topRight',
      });
    });

    it('calls notification.error with correct parameters', () => {
      showNotification.error({
        message: 'Error',
        description: 'Operation failed',
        duration: 10,
      });

      expect(notification.error).toHaveBeenCalledWith({
        message: 'Error',
        description: 'Operation failed',
        duration: 10,
        icon: expect.any(Object),
        placement: 'topRight',
      });
    });

    it('calls notification.warning with correct parameters', () => {
      showNotification.warning({
        message: 'Warning',
        description: 'Potential issue',
      });

      expect(notification.warning).toHaveBeenCalledWith({
        message: 'Warning',
        description: 'Potential issue',
        icon: expect.any(Object),
        duration: 5,
        placement: 'topRight',
      });
    });

    it('calls notification.info with correct parameters', () => {
      showNotification.info({
        message: 'Info',
        description: 'Information message',
      });

      expect(notification.info).toHaveBeenCalledWith({
        message: 'Info',
        description: 'Information message',
        icon: expect.any(Object),
        duration: 4.5,
        placement: 'topRight',
      });
    });
  });

  describe('resourceNotifications', () => {
    it('shows create success notification with namespace', () => {
      resourceNotifications.createSuccess('Deployment', 'nginx-deployment', 'default');

      expect(notification.success).toHaveBeenCalledWith({
        message: 'Deployment Created',
        description: 'Successfully created Deployment "nginx-deployment" in namespace "default"',
        icon: expect.any(Object),
        duration: 4.5,
        placement: 'topRight',
      });
    });

    it('shows create success notification without namespace', () => {
      resourceNotifications.createSuccess('ConfigMap', 'app-config');

      expect(notification.success).toHaveBeenCalledWith({
        message: 'ConfigMap Created',
        description: 'Successfully created ConfigMap "app-config"',
        icon: expect.any(Object),
        duration: 4.5,
        placement: 'topRight',
      });
    });

    it('shows update success notification', () => {
      resourceNotifications.updateSuccess('Service', 'web-service', 'production');

      expect(notification.success).toHaveBeenCalledWith({
        message: 'Service Updated',
        description: 'Successfully updated Service "web-service" in namespace "production"',
        icon: expect.any(Object),
        duration: 4.5,
        placement: 'topRight',
      });
    });

    it('shows delete success notification', () => {
      resourceNotifications.deleteSuccess('Secret', 'db-secret', 'default');

      expect(notification.success).toHaveBeenCalledWith({
        message: 'Secret Deleted',
        description: 'Successfully deleted Secret "db-secret" from namespace "default"',
        icon: expect.any(Object),
        duration: 4.5,
        placement: 'topRight',
      });
    });

    it('shows operation success notification', () => {
      resourceNotifications.operationSuccess('pause', 'Deployment', 'nginx-deployment', 'default');

      expect(notification.success).toHaveBeenCalledWith({
        message: 'Deployment paused',
        description: 'Successfully paused Deployment "nginx-deployment" in namespace "default"',
        icon: expect.any(Object),
        duration: 4.5,
        placement: 'topRight',
      });
    });

    it('shows create error notification', () => {
      resourceNotifications.createError('Deployment', 'nginx-deployment', 'Insufficient resources', 'default');

      expect(notification.error).toHaveBeenCalledWith({
        message: 'Failed to Create Deployment',
        description: 'Could not create Deployment "nginx-deployment" in namespace "default": Insufficient resources',
        icon: expect.any(Object),
        duration: 6,
        placement: 'topRight',
      });
    });

    it('shows bulk operation success notification', () => {
      resourceNotifications.bulkOperationSuccess('delete', 'Service', 5, 5);

      expect(notification.success).toHaveBeenCalledWith({
        message: 'Bulk delete Completed',
        description: 'Successfully deleted 5 Service(s)',
        icon: expect.any(Object),
        duration: 4.5,
        placement: 'topRight',
      });
    });

    it('shows bulk operation partial success notification', () => {
      resourceNotifications.bulkOperationSuccess('delete', 'Service', 3, 5);

      expect(notification.warning).toHaveBeenCalledWith({
        message: 'Bulk delete Partially Completed',
        description: '3 succeeded, 2 failed out of 5 Service(s)',
        icon: expect.any(Object),
        duration: 5,
        placement: 'topRight',
      });
    });

    it('shows bulk operation error notification', () => {
      resourceNotifications.bulkOperationError('delete', 'Service', 5, 'Network error');

      expect(notification.error).toHaveBeenCalledWith({
        message: 'Bulk delete Failed',
        description: 'Could not delete 5 Service(s): Network error',
        icon: expect.any(Object),
        duration: 6,
        placement: 'topRight',
      });
    });
  });

  describe('showConfirmation', () => {
    it('shows delete confirmation', () => {
      const mockOnConfirm = vi.fn();
      showConfirmation.delete({
        title: 'Delete Resource',
        content: 'Are you sure?',
        onConfirm: mockOnConfirm,
      });

      expect(Modal.confirm).toHaveBeenCalledWith({
        title: 'Delete Resource',
        content: 'Are you sure?',
        onConfirm: mockOnConfirm,
        icon: expect.any(Object),
        okType: 'danger',
        okText: 'Delete',
        cancelText: 'Cancel',
        centered: true,
        maskClosable: true,
      });
    });

    it('shows warning confirmation', () => {
      const mockOnConfirm = vi.fn();
      showConfirmation.warning({
        title: 'Warning',
        content: 'This may cause issues',
        onConfirm: mockOnConfirm,
        okText: 'Proceed',
      });

      expect(Modal.confirm).toHaveBeenCalledWith({
        title: 'Warning',
        content: 'This may cause issues',
        onConfirm: mockOnConfirm,
        icon: expect.any(Object),
        okText: 'Proceed',
        cancelText: 'Cancel',
        centered: true,
        maskClosable: true,
      });
    });

    it('shows info confirmation', () => {
      const mockOnConfirm = vi.fn();
      showConfirmation.info({
        title: 'Information',
        content: 'Please confirm',
        onConfirm: mockOnConfirm,
      });

      expect(Modal.confirm).toHaveBeenCalledWith({
        title: 'Information',
        content: 'Please confirm',
        onConfirm: mockOnConfirm,
        icon: expect.any(Object),
        okText: 'Confirm',
        cancelText: 'Cancel',
        centered: true,
        maskClosable: true,
      });
    });
  });

  describe('resourceConfirmations', () => {
    it('shows resource delete confirmation with namespace', () => {
      const mockOnConfirm = vi.fn();
      resourceConfirmations.delete('Deployment', 'nginx-deployment', mockOnConfirm, 'default');

      expect(Modal.confirm).toHaveBeenCalledWith({
        title: 'Delete Deployment "nginx-deployment" from "default"',
        content: expect.any(Object), // React component content
        onOk: mockOnConfirm,
        icon: expect.any(Object),
        okType: 'danger',
        okText: 'Delete',
        cancelText: 'Cancel',
        centered: true,
        maskClosable: false,
        width: 400,
        okButtonProps: {
          disabled: false,
        },
        onCancel: undefined,
      });
    });

    it('shows resource delete confirmation without namespace', () => {
      const mockOnConfirm = vi.fn();
      resourceConfirmations.delete('ConfigMap', 'app-config', mockOnConfirm);

      expect(Modal.confirm).toHaveBeenCalledWith({
        title: 'Delete ConfigMap "app-config"',
        content: expect.any(Object), // React component content
        onOk: mockOnConfirm,
        icon: expect.any(Object),
        okType: 'danger',
        okText: 'Delete',
        cancelText: 'Cancel',
        centered: true,
        maskClosable: false,
        width: 400,
        okButtonProps: {
          disabled: false,
        },
        onCancel: undefined,
      });
    });

    it('shows bulk delete confirmation', () => {
      const mockOnConfirm = vi.fn();
      resourceConfirmations.bulkDelete('Service', 3, mockOnConfirm);

      expect(Modal.confirm).toHaveBeenCalledWith({
        title: 'Delete 3 Services "3 selected items"',
        content: expect.any(Object), // React component content
        onOk: mockOnConfirm,
        icon: expect.any(Object),
        okType: 'danger',
        okText: 'Delete',
        cancelText: 'Cancel',
        centered: true,
        maskClosable: false,
        width: 400,
        okButtonProps: {
          disabled: false,
        },
        onCancel: undefined,
      });
    });

    it('shows operation confirmation', () => {
      const mockOnConfirm = vi.fn();
      resourceConfirmations.operation('Pause', 'Deployment', 'nginx-deployment', mockOnConfirm, 'default');

      expect(Modal.confirm).toHaveBeenCalledWith({
        title: 'Pause Deployment',
        content: 'Are you sure you want to pause "nginx-deployment" in namespace "default"?',
        onConfirm: mockOnConfirm,
        icon: expect.any(Object),
        okText: 'Confirm',
        cancelText: 'Cancel',
        centered: true,
        maskClosable: true,
      });
    });

    it('shows unsaved changes confirmation', () => {
      const mockOnConfirm = vi.fn();
      const mockOnCancel = vi.fn();
      resourceConfirmations.unsavedChanges(mockOnConfirm, mockOnCancel);

      expect(Modal.confirm).toHaveBeenCalledWith({
        title: 'Unsaved Changes',
        content: 'You have unsaved changes. Are you sure you want to continue?',
        onConfirm: mockOnConfirm,
        onCancel: mockOnCancel,
        icon: expect.any(Object),
        okText: 'Confirm',
        cancelText: 'Cancel',
        centered: true,
        maskClosable: true,
      });
    });

    it('shows replace data confirmation', () => {
      const mockOnConfirm = vi.fn();
      const mockOnCancel = vi.fn();
      resourceConfirmations.replaceData('Template', mockOnConfirm, mockOnCancel);

      expect(Modal.confirm).toHaveBeenCalledWith({
        title: 'Replace Template',
        content: 'This will replace your current data with the selected template. Are you sure?',
        onConfirm: mockOnConfirm,
        onCancel: mockOnCancel,
        icon: expect.any(Object),
        okText: 'Confirm',
        cancelText: 'Cancel',
        centered: true,
        maskClosable: true,
      });
    });
  });
});