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
import { Spin, Button, Modal, notification, Popconfirm, Alert, List, Typography } from 'antd';
import { 
  LoadingOutlined, 
  ExclamationCircleOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  DatabaseOutlined,
  CloudServerOutlined
} from '@ant-design/icons';
import i18nInstance from '@/utils/i18n';

const { Text } = Typography;

// Loading States
export interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large';
  tip?: string;
  spinning?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'default',
  tip,
  spinning = true,
  children,
  className,
  style,
}) => {
  return (
    <Spin
      size={size}
      tip={tip}
      spinning={spinning}
      className={className}
      style={style}
      indicator={<LoadingOutlined style={{ fontSize: size === 'large' ? 24 : size === 'small' ? 14 : 18 }} spin />}
    >
      {children}
    </Spin>
  );
};

// Centered loading for full page/section loading
export interface CenteredLoadingProps {
  size?: 'small' | 'default' | 'large';
  tip?: string;
  height?: string | number;
  className?: string;
}

export const CenteredLoading: React.FC<CenteredLoadingProps> = ({
  size = 'large',
  tip = i18nInstance.t('loading', 'Loading...'),
  height = '200px',
  className = '',
}) => {
  return (
    <div 
      className={`flex justify-center items-center ${className}`}
      style={{ height }}
    >
      <LoadingSpinner size={size} tip={tip} />
    </div>
  );
};

// Button loading states
export interface LoadingButtonProps {
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void | Promise<void>;
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  danger?: boolean;
  disabled?: boolean;
  size?: 'small' | 'middle' | 'large';
  icon?: React.ReactNode;
  className?: string;
  htmlType?: 'button' | 'submit' | 'reset';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  children,
  onClick,
  ...buttonProps
}) => {
  return (
    <Button
      loading={loading}
      onClick={onClick}
      {...buttonProps}
    >
      {children}
    </Button>
  );
};

// Notification Types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationConfig {
  message: string;
  description?: string;
  duration?: number;
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  className?: string;
}

// Consistent notification functions
export const showNotification = {
  success: (config: NotificationConfig) => {
    notification.success({
      ...config,
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      duration: config.duration || 4.5,
      placement: config.placement || 'topRight',
    });
  },

  error: (config: NotificationConfig) => {
    notification.error({
      ...config,
      icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      duration: config.duration || 6,
      placement: config.placement || 'topRight',
    });
  },

  warning: (config: NotificationConfig) => {
    notification.warning({
      ...config,
      icon: <WarningOutlined style={{ color: '#faad14' }} />,
      duration: config.duration || 5,
      placement: config.placement || 'topRight',
    });
  },

  info: (config: NotificationConfig) => {
    notification.info({
      ...config,
      icon: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
      duration: config.duration || 4.5,
      placement: config.placement || 'topRight',
    });
  },
};

// Resource operation notifications
export const resourceNotifications = {
  createSuccess: (resourceType: string, name: string, namespace?: string) => {
    showNotification.success({
      message: i18nInstance.t('resource_created', `${resourceType} Created`),
      description: namespace 
        ? i18nInstance.t('resource_created_desc_ns', `Successfully created ${resourceType} "${name}" in namespace "${namespace}"`)
        : i18nInstance.t('resource_created_desc', `Successfully created ${resourceType} "${name}"`),
    });
  },

  updateSuccess: (resourceType: string, name: string, namespace?: string) => {
    showNotification.success({
      message: i18nInstance.t('resource_updated', `${resourceType} Updated`),
      description: namespace 
        ? i18nInstance.t('resource_updated_desc_ns', `Successfully updated ${resourceType} "${name}" in namespace "${namespace}"`)
        : i18nInstance.t('resource_updated_desc', `Successfully updated ${resourceType} "${name}"`),
    });
  },

  deleteSuccess: (resourceType: string, name: string, namespace?: string) => {
    showNotification.success({
      message: i18nInstance.t('resource_deleted', `${resourceType} Deleted`),
      description: namespace 
        ? i18nInstance.t('resource_deleted_desc_ns', `Successfully deleted ${resourceType} "${name}" from namespace "${namespace}"`)
        : i18nInstance.t('resource_deleted_desc', `Successfully deleted ${resourceType} "${name}"`),
    });
  },

  operationSuccess: (operation: string, resourceType: string, name: string, namespace?: string) => {
    const operationPastTense = operation.endsWith('e') ? `${operation}d` : `${operation}ed`;
    showNotification.success({
      message: i18nInstance.t('operation_success', `${resourceType} ${operationPastTense}`),
      description: namespace 
        ? i18nInstance.t('operation_success_desc_ns', `Successfully ${operationPastTense.toLowerCase()} ${resourceType} "${name}" in namespace "${namespace}"`)
        : i18nInstance.t('operation_success_desc', `Successfully ${operationPastTense.toLowerCase()} ${resourceType} "${name}"`),
    });
  },

  createError: (resourceType: string, name: string, error: string, namespace?: string) => {
    showNotification.error({
      message: i18nInstance.t('resource_create_failed', `Failed to Create ${resourceType}`),
      description: namespace 
        ? i18nInstance.t('resource_create_failed_desc_ns', `Could not create ${resourceType} "${name}" in namespace "${namespace}": ${error}`)
        : i18nInstance.t('resource_create_failed_desc', `Could not create ${resourceType} "${name}": ${error}`),
    });
  },

  updateError: (resourceType: string, name: string, error: string, namespace?: string) => {
    showNotification.error({
      message: i18nInstance.t('resource_update_failed', `Failed to Update ${resourceType}`),
      description: namespace 
        ? i18nInstance.t('resource_update_failed_desc_ns', `Could not update ${resourceType} "${name}" in namespace "${namespace}": ${error}`)
        : i18nInstance.t('resource_update_failed_desc', `Could not update ${resourceType} "${name}": ${error}`),
    });
  },

  deleteError: (resourceType: string, name: string, error: string, namespace?: string) => {
    showNotification.error({
      message: i18nInstance.t('resource_delete_failed', `Failed to Delete ${resourceType}`),
      description: namespace 
        ? i18nInstance.t('resource_delete_failed_desc_ns', `Could not delete ${resourceType} "${name}" from namespace "${namespace}": ${error}`)
        : i18nInstance.t('resource_delete_failed_desc', `Could not delete ${resourceType} "${name}": ${error}`),
    });
  },

  operationError: (operation: string, resourceType: string, name: string, error: string, namespace?: string) => {
    showNotification.error({
      message: i18nInstance.t('operation_failed', `Failed to ${operation} ${resourceType}`),
      description: namespace 
        ? i18nInstance.t('operation_failed_desc_ns', `Could not ${operation} ${resourceType} "${name}" in namespace "${namespace}": ${error}`)
        : i18nInstance.t('operation_failed_desc', `Could not ${operation} ${resourceType} "${name}": ${error}`),
    });
  },

  bulkOperationSuccess: (operation: string, resourceType: string, successCount: number, totalCount: number) => {
    if (successCount === totalCount) {
      showNotification.success({
        message: i18nInstance.t('bulk_operation_success', `Bulk ${operation} Completed`),
        description: i18nInstance.t('bulk_operation_success_desc', `Successfully ${operation}d ${successCount} ${resourceType}(s)`),
      });
    } else {
      showNotification.warning({
        message: i18nInstance.t('bulk_operation_partial', `Bulk ${operation} Partially Completed`),
        description: i18nInstance.t('bulk_operation_partial_desc', `${successCount} succeeded, ${totalCount - successCount} failed out of ${totalCount} ${resourceType}(s)`),
      });
    }
  },

  bulkOperationError: (operation: string, resourceType: string, totalCount: number, error: string) => {
    showNotification.error({
      message: i18nInstance.t('bulk_operation_failed', `Bulk ${operation} Failed`),
      description: i18nInstance.t('bulk_operation_failed_desc', `Could not ${operation} ${totalCount} ${resourceType}(s): ${error}`),
    });
  },
};

// Confirmation Dialog Types
export interface ConfirmationConfig {
  title: string;
  content: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  okText?: string;
  cancelText?: string;
  okType?: 'primary' | 'danger';
  icon?: React.ReactNode;
  width?: number;
  centered?: boolean;
  maskClosable?: boolean;
}

// Consistent confirmation dialogs
export const showConfirmation = {
  delete: (config: Omit<ConfirmationConfig, 'icon' | 'okType'>) => {
    Modal.confirm({
      ...config,
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      okType: 'danger',
      okText: config.okText || i18nInstance.t('delete', 'Delete'),
      cancelText: config.cancelText || i18nInstance.t('cancel', 'Cancel'),
      centered: config.centered !== false,
      maskClosable: config.maskClosable !== false,
    });
  },

  warning: (config: Omit<ConfirmationConfig, 'icon'>) => {
    Modal.confirm({
      ...config,
      icon: <WarningOutlined style={{ color: '#faad14' }} />,
      okText: config.okText || i18nInstance.t('confirm', 'Confirm'),
      cancelText: config.cancelText || i18nInstance.t('cancel', 'Cancel'),
      centered: config.centered !== false,
      maskClosable: config.maskClosable !== false,
    });
  },

  info: (config: Omit<ConfirmationConfig, 'icon'>) => {
    Modal.confirm({
      ...config,
      icon: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
      okText: config.okText || i18nInstance.t('confirm', 'Confirm'),
      cancelText: config.cancelText || i18nInstance.t('cancel', 'Cancel'),
      centered: config.centered !== false,
      maskClosable: config.maskClosable !== false,
    });
  },
};

// Resource dependency information
export interface ResourceDependency {
  type: 'mount' | 'reference' | 'ownership' | 'selector';
  resourceType: string;
  resourceName: string;
  namespace?: string;
  description: string;
  severity: 'warning' | 'error' | 'info';
}

// Enhanced deletion configuration
export interface DeletionConfig {
  resourceType: string;
  resourceName: string;
  namespace?: string;
  dependencies?: ResourceDependency[];
  cascadingResources?: ResourceDependency[];
  gracePeriodSeconds?: number;
  force?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

// Dependency warning component
const DependencyWarning: React.FC<{ dependencies: ResourceDependency[] }> = ({ dependencies }) => {
  const errorDeps = dependencies.filter(dep => dep.severity === 'error');
  const warningDeps = dependencies.filter(dep => dep.severity === 'warning');
  const infoDeps = dependencies.filter(dep => dep.severity === 'info');

  return (
    <div className="space-y-3">
      {errorDeps.length > 0 && (
        <Alert
          type="error"
          showIcon
          message="Critical Dependencies Found"
          description={
            <List
              size="small"
              dataSource={errorDeps}
              renderItem={(dep) => (
                <List.Item>
                  <div className="flex items-center space-x-2">
                    <DatabaseOutlined className="text-red-500" />
                    <Text strong>{dep.resourceType}</Text>
                    <Text code>{dep.resourceName}</Text>
                    {dep.namespace && <Text type="secondary">({dep.namespace})</Text>}
                    <Text type="danger">- {dep.description}</Text>
                  </div>
                </List.Item>
              )}
            />
          }
        />
      )}

      {warningDeps.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message="Dependencies Will Be Affected"
          description={
            <List
              size="small"
              dataSource={warningDeps}
              renderItem={(dep) => (
                <List.Item>
                  <div className="flex items-center space-x-2">
                    <LinkOutlined className="text-orange-500" />
                    <Text strong>{dep.resourceType}</Text>
                    <Text code>{dep.resourceName}</Text>
                    {dep.namespace && <Text type="secondary">({dep.namespace})</Text>}
                    <Text>- {dep.description}</Text>
                  </div>
                </List.Item>
              )}
            />
          }
        />
      )}

      {infoDeps.length > 0 && (
        <Alert
          type="info"
          showIcon
          message="Related Resources"
          description={
            <List
              size="small"
              dataSource={infoDeps}
              renderItem={(dep) => (
                <List.Item>
                  <div className="flex items-center space-x-2">
                    <CloudServerOutlined className="text-blue-500" />
                    <Text strong>{dep.resourceType}</Text>
                    <Text code>{dep.resourceName}</Text>
                    {dep.namespace && <Text type="secondary">({dep.namespace})</Text>}
                    <Text>- {dep.description}</Text>
                  </div>
                </List.Item>
              )}
            />
          }
        />
      )}
    </div>
  );
};

// Enhanced deletion confirmation dialog
export const showDeletionConfirmation = (config: DeletionConfig) => {
  const { 
    resourceType, 
    resourceName, 
    namespace, 
    dependencies = [], 
    cascadingResources = [],
    gracePeriodSeconds,
    force = false,
    onConfirm, 
    onCancel 
  } = config;

  const hasBlockingDependencies = dependencies.some(dep => dep.severity === 'error');
  const hasWarningDependencies = dependencies.some(dep => dep.severity === 'warning');
  const hasCascadingResources = cascadingResources.length > 0;

  const title = namespace 
    ? `Delete ${resourceType} "${resourceName}" from "${namespace}"`
    : `Delete ${resourceType} "${resourceName}"`;

  let content: React.ReactNode;

  if (hasBlockingDependencies && !force) {
    content = (
      <div className="space-y-4">
        <Text type="danger">
          This {resourceType.toLowerCase()} cannot be deleted because it has critical dependencies.
        </Text>
        <DependencyWarning dependencies={dependencies} />
        <Text type="secondary">
          To force deletion, use the force delete option (this may cause system instability).
        </Text>
      </div>
    );
  } else if (hasWarningDependencies || hasCascadingResources) {
    content = (
      <div className="space-y-4">
        <Text>
          Are you sure you want to delete this {resourceType.toLowerCase()}?
        </Text>
        
        {hasWarningDependencies && (
          <>
            <Text type="warning" strong>
              This action will affect the following resources:
            </Text>
            <DependencyWarning dependencies={dependencies} />
          </>
        )}

        {hasCascadingResources && (
          <>
            <Text type="warning" strong>
              The following resources will also be deleted:
            </Text>
            <DependencyWarning dependencies={cascadingResources} />
          </>
        )}

        <Text type="secondary">
          This action cannot be undone.
          {gracePeriodSeconds && ` Grace period: ${gracePeriodSeconds} seconds.`}
        </Text>
      </div>
    );
  } else {
    content = (
      <div className="space-y-2">
        <Text>
          Are you sure you want to delete this {resourceType.toLowerCase()}?
        </Text>
        <Text type="secondary">
          This action cannot be undone.
          {gracePeriodSeconds && ` Grace period: ${gracePeriodSeconds} seconds.`}
        </Text>
      </div>
    );
  }

  Modal.confirm({
    title,
    content,
    icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
    okText: force ? 'Force Delete' : 'Delete',
    okType: 'danger',
    cancelText: i18nInstance.t('cancel', 'Cancel'),
    width: hasBlockingDependencies || hasWarningDependencies || hasCascadingResources ? 600 : 400,
    centered: true,
    maskClosable: false,
    okButtonProps: {
      disabled: hasBlockingDependencies && !force,
    },
    onOk: onConfirm,
    onCancel,
  });
};

// Resource-specific confirmation dialogs
export const resourceConfirmations = {
  delete: (resourceType: string, name: string, onConfirm: () => void | Promise<void>, namespace?: string, dependencies?: ResourceDependency[]) => {
    showDeletionConfirmation({
      resourceType,
      resourceName: name,
      namespace,
      dependencies,
      onConfirm,
    });
  },

  bulkDelete: (resourceType: string, count: number, onConfirm: () => void | Promise<void>, dependencies?: ResourceDependency[]) => {
    showDeletionConfirmation({
      resourceType: `${count} ${resourceType}${count > 1 ? 's' : ''}`,
      resourceName: `${count} selected items`,
      dependencies,
      onConfirm,
    });
  },

  deleteWithDependencies: (config: DeletionConfig) => {
    showDeletionConfirmation(config);
  },

  operation: (operation: string, resourceType: string, name: string, onConfirm: () => void | Promise<void>, namespace?: string) => {
    showConfirmation.warning({
      title: i18nInstance.t('confirm_operation', `${operation} ${resourceType}`),
      content: namespace 
        ? i18nInstance.t('confirm_operation_desc_ns', `Are you sure you want to ${operation.toLowerCase()} "${name}" in namespace "${namespace}"?`)
        : i18nInstance.t('confirm_operation_desc', `Are you sure you want to ${operation.toLowerCase()} "${name}"?`),
      onConfirm,
    });
  },

  unsavedChanges: (onConfirm: () => void | Promise<void>, onCancel?: () => void) => {
    showConfirmation.warning({
      title: i18nInstance.t('unsaved_changes', 'Unsaved Changes'),
      content: i18nInstance.t('unsaved_changes_desc', 'You have unsaved changes. Are you sure you want to continue?'),
      onConfirm,
      onCancel,
    });
  },

  replaceData: (dataType: string, onConfirm: () => void | Promise<void>, onCancel?: () => void) => {
    showConfirmation.warning({
      title: i18nInstance.t('replace_data', `Replace ${dataType}`),
      content: i18nInstance.t('replace_data_desc', `This will replace your current data with the selected ${dataType.toLowerCase()}. Are you sure?`),
      onConfirm,
      onCancel,
    });
  },
};

// Popconfirm component for inline confirmations
export interface ResourcePopconfirmProps {
  title: string;
  description?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  okText?: string;
  cancelText?: string;
  okType?: 'primary' | 'danger';
  placement?: 'top' | 'left' | 'right' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  children: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export const ResourcePopconfirm: React.FC<ResourcePopconfirmProps> = ({
  title,
  description,
  onConfirm,
  onCancel,
  okText = i18nInstance.t('confirm', 'Confirm'),
  cancelText = i18nInstance.t('cancel', 'Cancel'),
  okType = 'primary',
  placement = 'topRight',
  children,
  disabled = false,
  icon,
}) => {
  return (
    <Popconfirm
      title={title}
      description={description}
      onConfirm={onConfirm}
      onCancel={onCancel}
      okText={okText}
      cancelText={cancelText}
      okType={okType}
      placement={placement}
      disabled={disabled}
      icon={icon}
    >
      {children}
    </Popconfirm>
  );
};

// Enhanced Delete Popconfirm with dependency checking
export interface EnhancedDeletePopconfirmProps {
  resourceType: string;
  resourceName: string;
  namespace?: string;
  resource?: any;
  relatedResources?: any[];
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  placement?: 'top' | 'left' | 'right' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  children: React.ReactNode;
  disabled?: boolean;
  gracePeriodSeconds?: number;
  allowForceDelete?: boolean;
}

export const EnhancedDeletePopconfirm: React.FC<EnhancedDeletePopconfirmProps> = ({
  resourceType,
  resourceName,
  namespace,
  resource,
  relatedResources,
  onConfirm,
  onCancel,
  children,
  gracePeriodSeconds,
  allowForceDelete = false,
}) => {
  const handleDelete = () => {
    // Import dependency analysis dynamically to avoid circular imports
    void import('@/utils/resource-dependencies').then(({ getResourceDependencies, getCascadingDeletions }) => {
      const dependencies = resource ? getResourceDependencies(resourceType, resource, relatedResources) : [];
      const cascadingResources = getCascadingDeletions(resourceType, resourceName, namespace || '', relatedResources);

      showDeletionConfirmation({
        resourceType,
        resourceName,
        namespace,
        dependencies,
        cascadingResources,
        gracePeriodSeconds,
        force: allowForceDelete,
        onConfirm,
        onCancel,
      });
    });
  };

  return (
    <div onClick={handleDelete} style={{ display: 'inline-block' }}>
      {children}
    </div>
  );
};

// Original Delete Popconfirm for backward compatibility
export interface DeletePopconfirmProps {
  resourceType: string;
  resourceName: string;
  namespace?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  placement?: 'top' | 'left' | 'right' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  children: React.ReactNode;
  disabled?: boolean;
}

export const DeletePopconfirm: React.FC<DeletePopconfirmProps> = ({
  resourceType,
  resourceName,
  namespace,
  onConfirm,
  onCancel,
  placement = 'topRight',
  children,
  disabled = false,
}) => {
  const title = i18nInstance.t('confirm_delete_resource', `Delete ${resourceType}`);
  const description = namespace 
    ? i18nInstance.t('confirm_delete_resource_desc_ns', `Are you sure you want to delete "${resourceName}" in namespace "${namespace}"?`)
    : i18nInstance.t('confirm_delete_resource_desc', `Are you sure you want to delete "${resourceName}"?`);

  return (
    <ResourcePopconfirm
      title={title}
      description={description}
      onConfirm={onConfirm}
      onCancel={onCancel}
      okText={i18nInstance.t('delete', 'Delete')}
      cancelText={i18nInstance.t('cancel', 'Cancel')}
      okType="danger"
      placement={placement}
      disabled={disabled}
      icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
    >
      {children}
    </ResourcePopconfirm>
  );
};

// Default export for convenience
export default {
  LoadingSpinner,
  CenteredLoading,
  LoadingButton,
  ResourcePopconfirm,
  DeletePopconfirm,
  EnhancedDeletePopconfirm,
  showNotification,
  resourceNotifications,
  showConfirmation,
  resourceConfirmations,
  showDeletionConfirmation,
};