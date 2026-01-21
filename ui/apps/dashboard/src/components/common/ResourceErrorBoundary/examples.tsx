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
import { Button, Space, Card, Typography } from 'antd';
import { BugOutlined, SupportOutlined } from '@ant-design/icons';
import ResourceErrorBoundary from './index';
import { ApiError, ApiErrorType } from '@/services/base';

const { Title, Paragraph } = Typography;

// Example component that can throw different types of errors
const ErrorProneComponent = ({ errorType }: { errorType: string }) => {
  switch (errorType) {
    case 'network':
      throw new ApiError({
        code: 0,
        message: 'Network connection failed',
        type: ApiErrorType.NetworkError,
      });
    case 'auth':
      throw new ApiError({
        code: 401,
        message: 'Authentication token expired',
        type: ApiErrorType.AuthenticationError,
      });
    case 'permission':
      throw new ApiError({
        code: 403,
        message: 'Insufficient permissions to access resource',
        type: ApiErrorType.AuthorizationError,
      });
    case 'notfound':
      throw new ApiError({
        code: 404,
        message: 'Resource not found',
        type: ApiErrorType.NotFoundError,
      });
    case 'server':
      throw new ApiError({
        code: 500,
        message: 'Internal server error occurred',
        type: ApiErrorType.ServerError,
      });
    case 'generic':
      throw new Error('A generic JavaScript error occurred');
    default:
      return <div>Component is working normally</div>;
  }
};

// Basic usage example
export const BasicErrorBoundaryExample = () => {
  const [errorType, setErrorType] = useState<string>('none');

  return (
    <Card title="Basic ResourceErrorBoundary Example">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Paragraph>
          Click the buttons below to trigger different types of errors and see how the ResourceErrorBoundary handles them.
        </Paragraph>
        
        <Space wrap>
          <Button onClick={() => setErrorType('none')}>No Error</Button>
          <Button onClick={() => setErrorType('network')} type="primary">Network Error</Button>
          <Button onClick={() => setErrorType('auth')} type="primary">Auth Error</Button>
          <Button onClick={() => setErrorType('permission')} type="primary">Permission Error</Button>
          <Button onClick={() => setErrorType('notfound')} type="primary">Not Found Error</Button>
          <Button onClick={() => setErrorType('server')} type="primary">Server Error</Button>
          <Button onClick={() => setErrorType('generic')} type="primary">Generic Error</Button>
        </Space>

        <ResourceErrorBoundary>
          <ErrorProneComponent errorType={errorType} />
        </ResourceErrorBoundary>
      </Space>
    </Card>
  );
};

// Advanced usage with custom actions
export const AdvancedErrorBoundaryExample = () => {
  const [errorType, setErrorType] = useState<string>('none');

  const customActions = [
    {
      key: 'contact-support',
      label: 'Contact Support',
      icon: <SupportOutlined />,
      onClick: () => {
        console.log('Opening support chat...');
        // In a real app, this would open a support chat or redirect to support page
      },
      type: 'primary' as const,
    },
    {
      key: 'report-bug',
      label: 'Report Bug',
      icon: <BugOutlined />,
      onClick: () => {
        console.log('Opening bug report form...');
        // In a real app, this would open a bug report form
      },
      danger: true,
    },
  ];

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.log('Custom error handler called:', { error, errorInfo });
    // In a real app, you might send this to analytics or logging service
  };

  return (
    <Card title="Advanced ResourceErrorBoundary Example">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Paragraph>
          This example shows advanced features including custom actions, error handling, and detailed error information.
        </Paragraph>
        
        <Space wrap>
          <Button onClick={() => setErrorType('none')}>No Error</Button>
          <Button onClick={() => setErrorType('server')} type="primary">Trigger Server Error</Button>
        </Space>

        <ResourceErrorBoundary
          onError={handleError}
          showErrorDetails={true}
          customActions={customActions}
          enableRetry={true}
          enableReload={true}
        >
          <ErrorProneComponent errorType={errorType} />
        </ResourceErrorBoundary>
      </Space>
    </Card>
  );
};

// Custom fallback UI example
export const CustomFallbackExample = () => {
  const [errorType, setErrorType] = useState<string>('none');

  const CustomErrorFallback = () => (
    <Card 
      style={{ 
        textAlign: 'center', 
        backgroundColor: '#fff2f0', 
        border: '1px solid #ffccc7' 
      }}
    >
      <Title level={3} type="danger">🚨 Oops! Something went wrong</Title>
      <Paragraph>
        We're sorry, but something unexpected happened. Our team has been notified.
      </Paragraph>
      <Space>
        <Button type="primary" onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
        <Button onClick={() => setErrorType('none')}>
          Try Again
        </Button>
      </Space>
    </Card>
  );

  return (
    <Card title="Custom Fallback UI Example">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Paragraph>
          This example demonstrates how to provide a custom fallback UI instead of the default error display.
        </Paragraph>
        
        <Space wrap>
          <Button onClick={() => setErrorType('none')}>No Error</Button>
          <Button onClick={() => setErrorType('generic')} type="primary">Trigger Error</Button>
        </Space>

        <ResourceErrorBoundary fallback={<CustomErrorFallback />}>
          <ErrorProneComponent errorType={errorType} />
        </ResourceErrorBoundary>
      </Space>
    </Card>
  );
};

// Resource management specific example
export const ResourceManagementExample = () => {
  const [errorType, setErrorType] = useState<string>('none');

  const resourceActions = [
    {
      key: 'refresh-data',
      label: 'Refresh Data',
      onClick: () => {
        console.log('Refreshing resource data...');
        // In a real app, this would invalidate queries and refetch data
      },
    },
    {
      key: 'check-permissions',
      label: 'Check Permissions',
      onClick: () => {
        console.log('Checking user permissions...');
        // In a real app, this would verify user permissions
      },
    },
  ];

  return (
    <Card title="Resource Management Error Boundary">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Paragraph>
          This example shows how to use ResourceErrorBoundary in a resource management context with relevant recovery actions.
        </Paragraph>
        
        <Space wrap>
          <Button onClick={() => setErrorType('none')}>Working Resource</Button>
          <Button onClick={() => setErrorType('permission')} type="primary">Permission Error</Button>
          <Button onClick={() => setErrorType('notfound')} type="primary">Resource Not Found</Button>
        </Space>

        <ResourceErrorBoundary
          customActions={resourceActions}
          onError={(error) => {
            // Log resource-specific errors
            console.log('Resource error occurred:', error.message);
          }}
        >
          <div style={{ padding: '20px', border: '1px dashed #d9d9d9', borderRadius: '6px' }}>
            <Title level={4}>Resource Management Component</Title>
            <ErrorProneComponent errorType={errorType} />
          </div>
        </ResourceErrorBoundary>
      </Space>
    </Card>
  );
};

// Complete example showcasing all features
export const CompleteExample = () => {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%', padding: '24px' }}>
      <Title level={2}>ResourceErrorBoundary Examples</Title>
      
      <BasicErrorBoundaryExample />
      <AdvancedErrorBoundaryExample />
      <CustomFallbackExample />
      <ResourceManagementExample />
      
      <Card title="Usage Tips">
        <ul>
          <li><strong>Page Level:</strong> Wrap entire pages to catch all resource-related errors</li>
          <li><strong>Component Level:</strong> Wrap specific components that perform API operations</li>
          <li><strong>Custom Actions:</strong> Provide context-specific recovery options</li>
          <li><strong>Error Monitoring:</strong> Use the onError callback to send errors to monitoring services</li>
          <li><strong>Development:</strong> Enable showErrorDetails for debugging information</li>
        </ul>
      </Card>
    </Space>
  );
};

export default CompleteExample;