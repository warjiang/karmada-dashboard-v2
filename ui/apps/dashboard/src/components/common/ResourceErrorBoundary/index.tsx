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

import React, { Component, ReactNode } from 'react';
import { Result, Button, Space, Typography, Collapse, notification } from 'antd';
import { ReloadOutlined, RollbackOutlined, BugOutlined } from '@ant-design/icons';
import i18nInstance from '@/utils/i18n';
import { ApiError, ApiErrorType } from '@/services/base';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface ResourceErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showErrorDetails?: boolean;
  enableRetry?: boolean;
  enableReload?: boolean;
  customActions?: Array<{
    key: string;
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
    danger?: boolean;
  }>;
}

interface ResourceErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId: string;
  retryCount: number;
}

/**
 * ResourceErrorBoundary - A comprehensive error boundary component for resource management
 * 
 * Features:
 * - User-friendly error display with recovery options
 * - Error logging and monitoring integration
 * - Retry functionality with exponential backoff
 * - Detailed error information for debugging
 * - Customizable actions and fallback UI
 * - Integration with existing notification system
 */
export class ResourceErrorBoundary extends Component<
  ResourceErrorBoundaryProps,
  ResourceErrorBoundaryState
> {
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: ResourceErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorId: this.generateErrorId(),
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ResourceErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: ResourceErrorBoundary.prototype.generateErrorId(),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error for monitoring and debugging
    this.logError(error, errorInfo);
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
    
    // Show notification for critical errors
    this.showErrorNotification(error);
  }

  componentWillUnmount() {
    // Clean up any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logError(error: Error, errorInfo: React.ErrorInfo) {
    const errorData = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
    };

    // Log to console for development
    console.group(`🚨 Resource Error Boundary - ${this.state.errorId}`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Error Data:', errorData);
    console.groupEnd();

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(errorData);
    }
  }

  private getUserId(): string | null {
    // Extract user ID from token or session storage
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.user_id || null;
      }
    } catch {
      // Ignore token parsing errors
    }
    return null;
  }

  private async sendToMonitoring(errorData: any) {
    try {
      // Send error data to monitoring service
      // This could be integrated with services like Sentry, LogRocket, etc.
      await fetch('/api/v1/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      });
    } catch (monitoringError) {
      console.warn('Failed to send error to monitoring service:', monitoringError);
    }
  }

  private showErrorNotification(error: Error) {
    const isApiError = error instanceof ApiError;
    const errorType = isApiError ? error.type : ApiErrorType.UnknownError;

    // Only show notifications for certain error types to avoid spam
    const shouldNotify = [
      ApiErrorType.NetworkError,
      ApiErrorType.ServerError,
      ApiErrorType.AuthenticationError,
    ].includes(errorType);

    if (shouldNotify) {
      notification.error({
        message: i18nInstance.t('error_occurred', 'An error occurred'),
        description: this.getErrorDescription(error),
        duration: 8,
        key: this.state.errorId,
      });
    }
  }

  private getErrorDescription(error: Error): string {
    if (error instanceof ApiError) {
      switch (error.type) {
        case ApiErrorType.NetworkError:
          return i18nInstance.t('network_error_desc', 'Please check your internet connection and try again.');
        case ApiErrorType.AuthenticationError:
          return i18nInstance.t('auth_error_desc', 'Please log in again to continue.');
        case ApiErrorType.AuthorizationError:
          return i18nInstance.t('permission_error_desc', 'You do not have permission to perform this action.');
        case ApiErrorType.ServerError:
          return i18nInstance.t('server_error_desc', 'A server error occurred. Please try again later.');
        default:
          return error.message;
      }
    }
    return i18nInstance.t('unexpected_error_desc', 'An unexpected error occurred. Please try again.');
  }

  private handleRetry = () => {
    const { retryCount } = this.state;
    const maxRetries = 3;
    
    if (retryCount >= maxRetries) {
      notification.warning({
        message: i18nInstance.t('max_retries_reached', 'Maximum retries reached'),
        description: i18nInstance.t('max_retries_desc', 'Please reload the page or contact support.'),
      });
      return;
    }

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, retryCount) * 1000;
    
    notification.info({
      message: i18nInstance.t('retrying', 'Retrying...'),
      description: i18nInstance.t('retry_desc', `Attempting to recover (${retryCount + 1}/${maxRetries})`),
      duration: 2,
    });

    const timeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        errorId: this.generateErrorId(),
        retryCount: retryCount + 1,
      });
    }, delay);

    this.retryTimeouts.push(timeout);
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoBack = () => {
    window.history.back();
  };

  private getErrorTitle(): string {
    const { error } = this.state;
    
    if (error instanceof ApiError) {
      switch (error.type) {
        case ApiErrorType.NetworkError:
          return i18nInstance.t('network_error_title', 'Network Error');
        case ApiErrorType.AuthenticationError:
          return i18nInstance.t('auth_error_title', 'Authentication Required');
        case ApiErrorType.AuthorizationError:
          return i18nInstance.t('permission_error_title', 'Permission Denied');
        case ApiErrorType.NotFoundError:
          return i18nInstance.t('not_found_error_title', 'Resource Not Found');
        case ApiErrorType.ServerError:
          return i18nInstance.t('server_error_title', 'Server Error');
        default:
          return i18nInstance.t('error_title', 'Something went wrong');
      }
    }
    
    return i18nInstance.t('error_title', 'Something went wrong');
  }

  private getErrorSubTitle(): string {
    const { error } = this.state;
    
    if (error instanceof ApiError) {
      return error.message;
    }
    
    return i18nInstance.t('error_subtitle', 'An unexpected error occurred while managing resources.');
  }

  private getErrorStatus(): '403' | '404' | '500' | 'error' {
    const { error } = this.state;
    
    if (error instanceof ApiError) {
      switch (error.type) {
        case ApiErrorType.AuthorizationError:
          return '403';
        case ApiErrorType.NotFoundError:
          return '404';
        case ApiErrorType.ServerError:
          return '500';
        default:
          return 'error';
      }
    }
    
    return 'error';
  }

  private renderErrorDetails() {
    const { error, errorInfo, errorId } = this.state;
    const { showErrorDetails = process.env.NODE_ENV === 'development' } = this.props;
    
    if (!showErrorDetails || !error) {
      return null;
    }

    return (
      <div style={{ marginTop: 24, textAlign: 'left' }}>
        <Collapse ghost>
          <Panel 
            header={
              <Space>
                <BugOutlined />
                <Text type="secondary">
                  {i18nInstance.t('error_details', 'Error Details')}
                </Text>
              </Space>
            } 
            key="error-details"
          >
            <div style={{ marginBottom: 16 }}>
              <Text strong>{i18nInstance.t('error_id', 'Error ID')}: </Text>
              <Text code>{errorId}</Text>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <Text strong>{i18nInstance.t('error_message', 'Message')}: </Text>
              <Paragraph>
                <Text type="danger">{error.message}</Text>
              </Paragraph>
            </div>

            {error.stack && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>{i18nInstance.t('stack_trace', 'Stack Trace')}: </Text>
                <Paragraph>
                  <pre style={{ 
                    fontSize: '12px', 
                    background: '#f5f5f5', 
                    padding: '8px', 
                    borderRadius: '4px',
                    overflow: 'auto',
                    maxHeight: '200px'
                  }}>
                    {error.stack}
                  </pre>
                </Paragraph>
              </div>
            )}

            {errorInfo?.componentStack && (
              <div>
                <Text strong>{i18nInstance.t('component_stack', 'Component Stack')}: </Text>
                <Paragraph>
                  <pre style={{ 
                    fontSize: '12px', 
                    background: '#f5f5f5', 
                    padding: '8px', 
                    borderRadius: '4px',
                    overflow: 'auto',
                    maxHeight: '200px'
                  }}>
                    {errorInfo.componentStack}
                  </pre>
                </Paragraph>
              </div>
            )}
          </Panel>
        </Collapse>
      </div>
    );
  }

  private renderActions() {
    const { enableRetry = true, enableReload = true, customActions = [] } = this.props;
    const { retryCount } = this.state;
    const maxRetries = 3;

    const defaultActions = [];

    if (enableRetry && retryCount < maxRetries) {
      defaultActions.push(
        <Button 
          key="retry" 
          type="primary" 
          icon={<RollbackOutlined />} 
          onClick={this.handleRetry}
        >
          {i18nInstance.t('try_again', 'Try Again')}
        </Button>
      );
    }

    if (enableReload) {
      defaultActions.push(
        <Button 
          key="reload" 
          icon={<ReloadOutlined />} 
          onClick={this.handleReload}
        >
          {i18nInstance.t('reload_page', 'Reload Page')}
        </Button>
      );
    }

    defaultActions.push(
      <Button key="back" onClick={this.handleGoBack}>
        {i18nInstance.t('go_back', 'Go Back')}
      </Button>
    );

    // Add custom actions
    const customActionButtons = customActions.map(action => (
      <Button
        key={action.key}
        type={action.type || 'default'}
        danger={action.danger}
        icon={action.icon}
        onClick={action.onClick}
      >
        {action.label}
      </Button>
    ));

    return (
      <Space wrap>
        {defaultActions}
        {customActionButtons}
      </Space>
    );
  }

  render() {
    const { hasError } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <div style={{ 
          padding: '48px 24px',
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Result
            status={this.getErrorStatus()}
            title={this.getErrorTitle()}
            subTitle={this.getErrorSubTitle()}
            extra={this.renderActions()}
          />
          {this.renderErrorDetails()}
        </div>
      );
    }

    return children;
  }
}

export default ResourceErrorBoundary;