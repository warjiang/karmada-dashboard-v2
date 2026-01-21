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

import React, { useState } from 'react';
import { Card, Space, Button, Typography, Divider, Table, Form, Input, Select } from 'antd';
import { DeleteOutlined, EditOutlined, PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
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

const { Title, Paragraph, Text } = Typography;

// Mock data for examples
const mockResources = [
  { key: '1', name: 'nginx-deployment', namespace: 'default', status: 'Running', replicas: '3/3' },
  { key: '2', name: 'redis-deployment', namespace: 'cache', status: 'Pending', replicas: '1/3' },
  { key: '3', name: 'api-deployment', namespace: 'production', status: 'Running', replicas: '5/5' },
];

export const LoadingFeedbackExamples: React.FC = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [globalLoading, setGlobalLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Helper function to simulate async operations
  const simulateAsyncOperation = (duration = 2000): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, duration));
  };

  // Loading state management
  const setResourceLoading = (key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  };

  // Example handlers
  const handleNotificationExample = (type: 'success' | 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        showNotification.success({
          message: 'Operation Successful',
          description: 'The deployment was created successfully.',
        });
        break;
      case 'error':
        showNotification.error({
          message: 'Operation Failed',
          description: 'Failed to create deployment: Insufficient resources.',
        });
        break;
      case 'warning':
        showNotification.warning({
          message: 'Warning',
          description: 'This operation may affect running pods.',
        });
        break;
      case 'info':
        showNotification.info({
          message: 'Information',
          description: 'Deployment status has been updated.',
        });
        break;
    }
  };

  const handleResourceNotificationExample = (type: 'create' | 'update' | 'delete' | 'operation') => {
    switch (type) {
      case 'create':
        resourceNotifications.createSuccess('Deployment', 'nginx-deployment', 'default');
        break;
      case 'update':
        resourceNotifications.updateSuccess('Service', 'web-service', 'production');
        break;
      case 'delete':
        resourceNotifications.deleteSuccess('ConfigMap', 'app-config');
        break;
      case 'operation':
        resourceNotifications.operationSuccess('pause', 'Deployment', 'nginx-deployment', 'default');
        break;
    }
  };

  const handleConfirmationExample = (type: 'delete' | 'warning' | 'info') => {
    switch (type) {
      case 'delete':
        showConfirmation.delete({
          title: 'Delete Deployment',
          content: 'Are you sure you want to delete this deployment? This action cannot be undone.',
          onConfirm: async () => {
            await simulateAsyncOperation(1000);
            resourceNotifications.deleteSuccess('Deployment', 'nginx-deployment', 'default');
          },
        });
        break;
      case 'warning':
        showConfirmation.warning({
          title: 'Restart Deployment',
          content: 'This will restart all pods in the deployment. Continue?',
          onConfirm: async () => {
            await simulateAsyncOperation(1000);
            resourceNotifications.operationSuccess('restart', 'Deployment', 'nginx-deployment', 'default');
          },
        });
        break;
      case 'info':
        showConfirmation.info({
          title: 'Apply Configuration',
          content: 'This will update the deployment configuration.',
          onConfirm: async () => {
            await simulateAsyncOperation(1000);
            resourceNotifications.updateSuccess('Deployment', 'nginx-deployment', 'default');
          },
        });
        break;
    }
  };

  const handleResourceConfirmationExample = (type: 'delete' | 'bulk' | 'operation' | 'unsaved') => {
    switch (type) {
      case 'delete':
        resourceConfirmations.delete(
          'Deployment',
          'nginx-deployment',
          async () => {
            await simulateAsyncOperation(1000);
            resourceNotifications.deleteSuccess('Deployment', 'nginx-deployment', 'default');
          },
          'default'
        );
        break;
      case 'bulk':
        resourceConfirmations.bulkDelete(
          'Service',
          3,
          async () => {
            await simulateAsyncOperation(2000);
            resourceNotifications.bulkOperationSuccess('delete', 'Service', 3, 3);
          }
        );
        break;
      case 'operation':
        resourceConfirmations.operation(
          'Pause',
          'Deployment',
          'nginx-deployment',
          async () => {
            await simulateAsyncOperation(1000);
            resourceNotifications.operationSuccess('pause', 'Deployment', 'nginx-deployment', 'default');
          },
          'default'
        );
        break;
      case 'unsaved':
        resourceConfirmations.unsavedChanges(
          async () => {
            showNotification.info({
              message: 'Changes Discarded',
              description: 'Your unsaved changes have been discarded.',
            });
          },
          () => {
            showNotification.info({
              message: 'Cancelled',
              description: 'You chose to keep your changes.',
            });
          }
        );
        break;
    }
  };

  const handleGlobalLoading = async () => {
    setGlobalLoading(true);
    try {
      await simulateAsyncOperation(3000);
      resourceNotifications.createSuccess('Deployment', 'new-deployment', 'default');
    } catch (error) {
      resourceNotifications.createError('Deployment', 'new-deployment', 'Network error', 'default');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleFormSubmit = async (values: any) => {
    setFormSubmitting(true);
    try {
      await simulateAsyncOperation(2000);
      resourceNotifications.createSuccess('Deployment', values.name, values.namespace);
    } catch (error) {
      resourceNotifications.createError('Deployment', values.name, 'Validation failed', values.namespace);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleResourceAction = async (action: string, resource: any) => {
    const key = `${resource.namespace}-${resource.name}`;
    setResourceLoading(key, true);
    
    try {
      await simulateAsyncOperation(1500);
      resourceNotifications.operationSuccess(action, 'Deployment', resource.name, resource.namespace);
    } catch (error) {
      resourceNotifications.operationError(action, 'Deployment', resource.name, 'Operation failed', resource.namespace);
    } finally {
      setResourceLoading(key, false);
    }
  };

  const handleResourceDelete = async (resource: any) => {
    const key = `${resource.namespace}-${resource.name}`;
    setResourceLoading(key, true);
    
    try {
      await simulateAsyncOperation(1000);
      resourceNotifications.deleteSuccess('Deployment', resource.name, resource.namespace);
    } catch (error) {
      resourceNotifications.deleteError('Deployment', resource.name, 'Delete failed', resource.namespace);
    } finally {
      setResourceLoading(key, false);
    }
  };

  // Table columns for resource table example
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Namespace',
      dataIndex: 'namespace',
      key: 'namespace',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Text type={status === 'Running' ? 'success' : 'warning'}>{status}</Text>
      ),
    },
    {
      title: 'Replicas',
      dataIndex: 'replicas',
      key: 'replicas',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, resource: any) => {
        const key = `${resource.namespace}-${resource.name}`;
        const isLoading = loadingStates[key];
        
        return (
          <Space size="small">
            <LoadingButton
              size="small"
              icon={<EditOutlined />}
              loading={isLoading}
              onClick={() => handleResourceAction('update', resource)}
            >
              Edit
            </LoadingButton>
            
            <ResourcePopconfirm
              title="Pause Deployment"
              description="This will pause the deployment."
              onConfirm={() => handleResourceAction('pause', resource)}
              okText="Pause"
              placement="topRight"
            >
              <LoadingButton
                size="small"
                icon={<PauseCircleOutlined />}
                loading={isLoading}
              >
                Pause
              </LoadingButton>
            </ResourcePopconfirm>
            
            <DeletePopconfirm
              resourceType="Deployment"
              resourceName={resource.name}
              namespace={resource.namespace}
              onConfirm={() => handleResourceDelete(resource)}
              placement="topRight"
            >
              <LoadingButton
                size="small"
                danger
                icon={<DeleteOutlined />}
                loading={isLoading}
              >
                Delete
              </LoadingButton>
            </DeletePopconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Title level={2}>Loading and Feedback Components Examples</Title>
        <Paragraph>
          This page demonstrates the consistent loading states, notifications, and confirmation dialogs
          used throughout the Karmada Dashboard for resource management operations.
        </Paragraph>
      </div>

      {/* Loading Components */}
      <Card title="Loading Components" className="mb-6">
        <div className="space-y-4">
          <div>
            <Title level={4}>LoadingSpinner</Title>
            <Space direction="vertical" size="middle" className="w-full">
              <div>
                <Text strong>Small spinner:</Text>
                <LoadingSpinner size="small" tip="Loading..." />
              </div>
              <div>
                <Text strong>Default spinner:</Text>
                <LoadingSpinner size="default" tip="Processing..." />
              </div>
              <div>
                <Text strong>Large spinner:</Text>
                <LoadingSpinner size="large" tip="Deploying resources..." />
              </div>
            </Space>
          </div>

          <Divider />

          <div>
            <Title level={4}>CenteredLoading</Title>
            <Card>
              <CenteredLoading tip="Loading deployment details..." height="200px" />
            </Card>
          </div>

          <Divider />

          <div>
            <Title level={4}>LoadingButton</Title>
            <Space wrap>
              <LoadingButton type="primary" onClick={handleGlobalLoading} loading={globalLoading}>
                Create Resource
              </LoadingButton>
              <LoadingButton danger loading={false}>
                Delete Resource
              </LoadingButton>
              <LoadingButton type="default" loading={true}>
                Loading State
              </LoadingButton>
            </Space>
          </div>
        </div>
      </Card>

      {/* Notification Examples */}
      <Card title="Notification Examples" className="mb-6">
        <div className="space-y-4">
          <div>
            <Title level={4}>Basic Notifications</Title>
            <Space wrap>
              <Button type="primary" onClick={() => handleNotificationExample('success')}>
                Success Notification
              </Button>
              <Button danger onClick={() => handleNotificationExample('error')}>
                Error Notification
              </Button>
              <Button onClick={() => handleNotificationExample('warning')}>
                Warning Notification
              </Button>
              <Button type="dashed" onClick={() => handleNotificationExample('info')}>
                Info Notification
              </Button>
            </Space>
          </div>

          <Divider />

          <div>
            <Title level={4}>Resource Notifications</Title>
            <Space wrap>
              <Button type="primary" onClick={() => handleResourceNotificationExample('create')}>
                Create Success
              </Button>
              <Button onClick={() => handleResourceNotificationExample('update')}>
                Update Success
              </Button>
              <Button onClick={() => handleResourceNotificationExample('delete')}>
                Delete Success
              </Button>
              <Button onClick={() => handleResourceNotificationExample('operation')}>
                Operation Success
              </Button>
            </Space>
          </div>
        </div>
      </Card>

      {/* Confirmation Examples */}
      <Card title="Confirmation Dialog Examples" className="mb-6">
        <div className="space-y-4">
          <div>
            <Title level={4}>Basic Confirmations</Title>
            <Space wrap>
              <Button danger onClick={() => handleConfirmationExample('delete')}>
                Delete Confirmation
              </Button>
              <Button onClick={() => handleConfirmationExample('warning')}>
                Warning Confirmation
              </Button>
              <Button type="dashed" onClick={() => handleConfirmationExample('info')}>
                Info Confirmation
              </Button>
            </Space>
          </div>

          <Divider />

          <div>
            <Title level={4}>Resource Confirmations</Title>
            <Space wrap>
              <Button danger onClick={() => handleResourceConfirmationExample('delete')}>
                Resource Delete
              </Button>
              <Button danger onClick={() => handleResourceConfirmationExample('bulk')}>
                Bulk Delete
              </Button>
              <Button onClick={() => handleResourceConfirmationExample('operation')}>
                Resource Operation
              </Button>
              <Button onClick={() => handleResourceConfirmationExample('unsaved')}>
                Unsaved Changes
              </Button>
            </Space>
          </div>
        </div>
      </Card>

      {/* Resource Table Example */}
      <Card title="Resource Table with Loading and Confirmations" className="mb-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Title level={4}>Deployments</Title>
            <LoadingButton type="primary" onClick={handleGlobalLoading} loading={globalLoading}>
              Create Deployment
            </LoadingButton>
          </div>
          
          <LoadingSpinner spinning={globalLoading}>
            <Table
              columns={columns}
              dataSource={mockResources}
              pagination={false}
              size="small"
            />
          </LoadingSpinner>
        </div>
      </Card>

      {/* Form Example */}
      <Card title="Resource Form with Loading and Validation" className="mb-6">
        <Form
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{ namespace: 'default' }}
        >
          <Form.Item
            label="Deployment Name"
            name="name"
            rules={[{ required: true, message: 'Please enter deployment name' }]}
          >
            <Input placeholder="nginx-deployment" />
          </Form.Item>
          
          <Form.Item
            label="Namespace"
            name="namespace"
            rules={[{ required: true, message: 'Please select namespace' }]}
          >
            <Select>
              <Select.Option value="default">default</Select.Option>
              <Select.Option value="production">production</Select.Option>
              <Select.Option value="staging">staging</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Space>
              <LoadingButton type="primary" htmlType="submit" loading={formSubmitting}>
                Create Deployment
              </LoadingButton>
              <Button onClick={() => handleResourceConfirmationExample('unsaved')}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* Global Loading Example */}
      {globalLoading && (
        <Card title="Global Loading State">
          <CenteredLoading tip="Creating deployment..." height="150px" />
        </Card>
      )}
    </div>
  );
};

import DeletionWorkflowExample from './DeletionWorkflowExample';

export { DeletionWorkflowExample };
export default LoadingFeedbackExamples;