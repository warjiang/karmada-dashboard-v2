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
import { Alert, Collapse, List, Typography, Space, Tag, Button } from 'antd';
import {
  ExclamationCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CloseOutlined,
  BugOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

const { Panel } = Collapse;
const { Text, Link } = Typography;

// Error severity levels
export enum ErrorSeverity {
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
  Success = 'success',
}

// Form error interface
export interface FormError {
  field: string;
  message: string;
  severity: ErrorSeverity;
  code?: string;
  suggestion?: string;
  documentationLink?: string;
}

// Form error display props
export interface FormErrorDisplayProps {
  errors: FormError[];
  warnings?: FormError[];
  showSuggestions?: boolean;
  showDocumentationLinks?: boolean;
  collapsible?: boolean;
  onDismiss?: (error: FormError) => void;
  onFixSuggestion?: (error: FormError) => void;
  className?: string;
}

// Get icon for error severity
const getErrorIcon = (severity: ErrorSeverity) => {
  switch (severity) {
    case ErrorSeverity.Error:
      return <ExclamationCircleOutlined className="text-red-500" />;
    case ErrorSeverity.Warning:
      return <WarningOutlined className="text-orange-500" />;
    case ErrorSeverity.Info:
      return <InfoCircleOutlined className="text-blue-500" />;
    case ErrorSeverity.Success:
      return <CheckCircleOutlined className="text-green-500" />;
    default:
      return <BugOutlined className="text-gray-500" />;
  }
};

// Get alert type for error severity
const getAlertType = (severity: ErrorSeverity): 'error' | 'warning' | 'info' | 'success' => {
  switch (severity) {
    case ErrorSeverity.Error:
      return 'error';
    case ErrorSeverity.Warning:
      return 'warning';
    case ErrorSeverity.Info:
      return 'info';
    case ErrorSeverity.Success:
      return 'success';
    default:
      return 'error';
  }
};

// Format field name for display
const formatFieldName = (field: string): string => {
  return field
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' → ');
};

// Single error item component
const ErrorItem: React.FC<{
  error: FormError;
  showSuggestions?: boolean;
  showDocumentationLinks?: boolean;
  onDismiss?: (error: FormError) => void;
  onFixSuggestion?: (error: FormError) => void;
}> = ({ error, showSuggestions, showDocumentationLinks, onDismiss, onFixSuggestion }) => {
  return (
    <div className="flex items-start space-x-3 p-3 border-b border-gray-100 last:border-b-0">
      <div className="flex-shrink-0 mt-1">
        {getErrorIcon(error.severity)}
      </div>
      
      <div className="flex-grow min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-grow">
            <div className="flex items-center space-x-2 mb-1">
              <Text strong className="text-sm">
                {formatFieldName(error.field)}
              </Text>
              {error.code && (
                <Tag size="small" color="default">
                  {error.code}
                </Tag>
              )}
            </div>
            
            <Text className="text-sm text-gray-600 block mb-2">
              {error.message}
            </Text>
            
            {error.suggestion && showSuggestions && (
              <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
                <Text className="text-xs text-blue-700">
                  <InfoCircleOutlined className="mr-1" />
                  Suggestion: {error.suggestion}
                </Text>
                {onFixSuggestion && (
                  <Button
                    type="link"
                    size="small"
                    className="p-0 ml-2 text-xs"
                    onClick={() => onFixSuggestion(error)}
                  >
                    Apply Fix
                  </Button>
                )}
              </div>
            )}
            
            {error.documentationLink && showDocumentationLinks && (
              <div className="mt-1">
                <Link
                  href={error.documentationLink}
                  target="_blank"
                  className="text-xs"
                >
                  View Documentation
                </Link>
              </div>
            )}
          </div>
          
          {onDismiss && (
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={() => onDismiss(error)}
              className="flex-shrink-0 ml-2"
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Main form error display component
export const FormErrorDisplay: React.FC<FormErrorDisplayProps> = ({
  errors,
  warnings = [],
  showSuggestions = true,
  showDocumentationLinks = true,
  collapsible = false,
  onDismiss,
  onFixSuggestion,
  className = '',
}) => {
  // Group errors by severity
  const errorsByType = {
    errors: errors.filter(e => e.severity === ErrorSeverity.Error),
    warnings: [...warnings, ...errors.filter(e => e.severity === ErrorSeverity.Warning)],
    info: errors.filter(e => e.severity === ErrorSeverity.Info),
    success: errors.filter(e => e.severity === ErrorSeverity.Success),
  };

  // Don't render if no errors or warnings
  if (errors.length === 0 && warnings.length === 0) {
    return null;
  }

  // Render error section
  const renderErrorSection = (
    title: string,
    items: FormError[],
    severity: ErrorSeverity,
    defaultExpanded = true
  ) => {
    if (items.length === 0) return null;

    const content = (
      <div className="space-y-0">
        {items.map((error, index) => (
          <ErrorItem
            key={`${error.field}-${index}`}
            error={error}
            showSuggestions={showSuggestions}
            showDocumentationLinks={showDocumentationLinks}
            onDismiss={onDismiss}
            onFixSuggestion={onFixSuggestion}
          />
        ))}
      </div>
    );

    if (collapsible) {
      return (
        <Collapse
          defaultActiveKey={defaultExpanded ? ['1'] : []}
          ghost
          className="mb-2"
        >
          <Panel
            header={
              <Space>
                {getErrorIcon(severity)}
                <Text strong>
                  {title} ({items.length})
                </Text>
              </Space>
            }
            key="1"
          >
            {content}
          </Panel>
        </Collapse>
      );
    }

    return (
      <Alert
        type={getAlertType(severity)}
        showIcon
        className="mb-2"
        message={
          <Text strong>
            {title} ({items.length})
          </Text>
        }
        description={content}
      />
    );
  };

  return (
    <div className={`form-error-display ${className}`}>
      {renderErrorSection('Validation Errors', errorsByType.errors, ErrorSeverity.Error)}
      {renderErrorSection('Warnings', errorsByType.warnings, ErrorSeverity.Warning)}
      {renderErrorSection('Information', errorsByType.info, ErrorSeverity.Info, false)}
      {renderErrorSection('Success', errorsByType.success, ErrorSeverity.Success, false)}
    </div>
  );
};

// Utility function to convert validation errors to FormError format
export const convertValidationErrorsToFormErrors = (
  validationErrors: Record<string, string>,
  resourceType: string
): FormError[] => {
  return Object.entries(validationErrors).map(([field, message]) => ({
    field,
    message,
    severity: ErrorSeverity.Error,
    code: `VALIDATION_${field.toUpperCase().replace(/\./g, '_')}`,
    suggestion: getSuggestionForField(field, message, resourceType),
    documentationLink: getDocumentationLinkForField(field, resourceType),
  }));
};

// Get suggestion for specific field validation errors
const getSuggestionForField = (field: string, message: string, resourceType: string): string | undefined => {
  // Name validation suggestions
  if (field.includes('name') && message.includes('lowercase')) {
    return 'Use only lowercase letters, numbers, and hyphens. Start and end with alphanumeric characters.';
  }
  
  // Port validation suggestions
  if (field.includes('port') && message.includes('between')) {
    return 'Use a port number between 1 and 65535. Common ports: 80 (HTTP), 443 (HTTPS), 8080 (alt HTTP).';
  }
  
  // Replica validation suggestions
  if (field.includes('replicas') && message.includes('between')) {
    return 'Start with 1-3 replicas for testing, scale up based on load requirements.';
  }
  
  // Label validation suggestions
  if (field.includes('labels') && message.includes('Invalid')) {
    return 'Label keys should be DNS subdomains (e.g., "app", "version", "environment"). Values should be simple strings.';
  }
  
  // Schedule validation suggestions
  if (field.includes('schedule') && message.includes('cron')) {
    return 'Use cron format: "minute hour day month weekday". Example: "0 2 * * *" for daily at 2 AM.';
  }
  
  // Storage validation suggestions
  if (field.includes('storage') && message.includes('format')) {
    return 'Use Kubernetes quantity format: "10Gi" for 10 gigabytes, "500Mi" for 500 megabytes.';
  }
  
  return undefined;
};

// Get documentation link for specific fields
const getDocumentationLinkForField = (field: string, resourceType: string): string | undefined => {
  const baseUrl = 'https://kubernetes.io/docs/concepts';
  
  if (field.includes('name') || field.includes('namespace')) {
    return `${baseUrl}/overview/working-with-objects/names/`;
  }
  
  if (field.includes('labels') || field.includes('annotations')) {
    return `${baseUrl}/overview/working-with-objects/labels/`;
  }
  
  if (field.includes('schedule')) {
    return `${baseUrl}/workloads/controllers/cron-jobs/`;
  }
  
  if (field.includes('storage') || field.includes('volume')) {
    return `${baseUrl}/storage/persistent-volumes/`;
  }
  
  // Resource-specific documentation
  switch (resourceType) {
    case 'deployment':
      return `${baseUrl}/workloads/controllers/deployment/`;
    case 'service':
      return `${baseUrl}/services-networking/service/`;
    case 'ingress':
      return `${baseUrl}/services-networking/ingress/`;
    case 'configmap':
      return `${baseUrl}/configuration/configmap/`;
    case 'secret':
      return `${baseUrl}/configuration/secret/`;
    default:
      return undefined;
  }
};

export default FormErrorDisplay;