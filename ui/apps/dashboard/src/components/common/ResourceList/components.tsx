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
import { Tag, Tooltip, Space, Typography, Badge, Progress } from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { BaseResource } from './index';

const { Text } = Typography;

// Resource name component with namespace
export interface ResourceNameProps {
  name: string;
  namespace?: string;
  kind?: string;
  showNamespace?: boolean;
  onClick?: () => void;
}

export const ResourceName: React.FC<ResourceNameProps> = ({
  name,
  namespace,
  kind,
  showNamespace = true,
  onClick,
}) => (
  <Space direction="vertical" size={0}>
    <Text
      strong
      className={onClick ? 'cursor-pointer text-blue-600 hover:text-blue-800' : ''}
      onClick={onClick}
    >
      {name}
    </Text>
    {showNamespace && namespace && (
      <Text type="secondary" className="text-xs">
        {namespace}
      </Text>
    )}
  </Space>
);

// Resource status component
export interface ResourceStatusProps {
  status: 'running' | 'pending' | 'failed' | 'succeeded' | 'unknown' | 'ready' | 'not-ready';
  text?: string;
  showIcon?: boolean;
}

export const ResourceStatus: React.FC<ResourceStatusProps> = ({
  status,
  text,
  showIcon = true,
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'running':
      case 'ready':
      case 'succeeded':
        return {
          color: 'success',
          icon: <CheckCircleOutlined />,
          text: text || status.charAt(0).toUpperCase() + status.slice(1),
        };
      case 'pending':
        return {
          color: 'processing',
          icon: <ClockCircleOutlined />,
          text: text || 'Pending',
        };
      case 'failed':
      case 'not-ready':
        return {
          color: 'error',
          icon: <CloseCircleOutlined />,
          text: text || 'Failed',
        };
      case 'unknown':
      default:
        return {
          color: 'default',
          icon: <InfoCircleOutlined />,
          text: text || 'Unknown',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Tag color={config.color} icon={showIcon ? config.icon : undefined}>
      {config.text}
    </Tag>
  );
};

// Resource age component
export interface ResourceAgeProps {
  creationTimestamp: string;
  format?: 'relative' | 'absolute' | 'both';
}

export const ResourceAge: React.FC<ResourceAgeProps> = ({
  creationTimestamp,
  format = 'relative',
}) => {
  const created = dayjs(creationTimestamp);
  const relative = created.fromNow();
  const absolute = created.format('YYYY-MM-DD HH:mm:ss');

  if (format === 'relative') {
    return (
      <Tooltip title={absolute}>
        <Text>{relative}</Text>
      </Tooltip>
    );
  }

  if (format === 'absolute') {
    return <Text>{absolute}</Text>;
  }

  return (
    <Space direction="vertical" size={0}>
      <Text>{relative}</Text>
      <Text type="secondary" className="text-xs">
        {absolute}
      </Text>
    </Space>
  );
};

// Resource labels component
export interface ResourceLabelsProps {
  labels: Record<string, string>;
  maxDisplay?: number;
  showEmpty?: boolean;
}

export const ResourceLabels: React.FC<ResourceLabelsProps> = ({
  labels = {},
  maxDisplay = 2,
  showEmpty = true,
}) => {
  const labelEntries = Object.entries(labels);

  if (labelEntries.length === 0) {
    return showEmpty ? <Text type="secondary">None</Text> : null;
  }

  const displayLabels = labelEntries.slice(0, maxDisplay);
  const remainingCount = labelEntries.length - maxDisplay;

  return (
    <Space size={4} wrap>
      {displayLabels.map(([key, value]) => (
        <Tooltip key={key} title={`${key}=${value}`}>
          <Tag color="blue" className="text-xs cursor-help">
            {key}={value.length > 10 ? `${value.substring(0, 10)}...` : value}
          </Tag>
        </Tooltip>
      ))}
      {remainingCount > 0 && (
        <Tooltip
          title={labelEntries
            .slice(maxDisplay)
            .map(([key, value]) => `${key}=${value}`)
            .join(', ')}
        >
          <Tag color="default" className="cursor-help">
            +{remainingCount} more
          </Tag>
        </Tooltip>
      )}
    </Space>
  );
};

// Resource replicas component (for workloads)
export interface ResourceReplicasProps {
  ready: number;
  desired: number;
  showProgress?: boolean;
}

export const ResourceReplicas: React.FC<ResourceReplicasProps> = ({
  ready,
  desired,
  showProgress = false,
}) => {
  const percentage = desired > 0 ? (ready / desired) * 100 : 0;
  const isHealthy = ready === desired;

  if (showProgress) {
    return (
      <Space direction="vertical" size={0}>
        <Text>
          {ready}/{desired}
        </Text>
        <Progress
          percent={percentage}
          size="small"
          status={isHealthy ? 'success' : percentage > 0 ? 'active' : 'exception'}
          showInfo={false}
        />
      </Space>
    );
  }

  return (
    <Badge
      status={isHealthy ? 'success' : ready > 0 ? 'processing' : 'error'}
      text={`${ready}/${desired}`}
    />
  );
};

// Resource images component (for workloads)
export interface ResourceImagesProps {
  images: string[];
  maxDisplay?: number;
}

export const ResourceImages: React.FC<ResourceImagesProps> = ({
  images = [],
  maxDisplay = 1,
}) => {
  if (images.length === 0) {
    return <Text type="secondary">None</Text>;
  }

  const displayImages = images.slice(0, maxDisplay);
  const remainingCount = images.length - maxDisplay;

  return (
    <Space direction="vertical" size={0}>
      {displayImages.map((image, index) => (
        <Tooltip key={index} title={image}>
          <code className="text-xs">
            {image.length > 30 ? `${image.substring(0, 30)}...` : image}
          </code>
        </Tooltip>
      ))}
      {remainingCount > 0 && (
        <Tooltip title={images.slice(maxDisplay).join(', ')}>
          <Tag color="blue" className="text-xs cursor-help">
            +{remainingCount} more
          </Tag>
        </Tooltip>
      )}
    </Space>
  );
};

// Resource ports component (for services)
export interface ResourcePortsProps {
  ports: Array<{
    name?: string;
    port: number;
    targetPort?: number | string;
    protocol?: string;
    nodePort?: number;
  }>;
  maxDisplay?: number;
}

export const ResourcePorts: React.FC<ResourcePortsProps> = ({
  ports = [],
  maxDisplay = 2,
}) => {
  if (ports.length === 0) {
    return <Text type="secondary">None</Text>;
  }

  const displayPorts = ports.slice(0, maxDisplay);
  const remainingCount = ports.length - maxDisplay;

  const formatPort = (port: any) => {
    const { port: portNum, targetPort, protocol = 'TCP', nodePort } = port;
    let portStr = `${portNum}`;
    
    if (targetPort && targetPort !== portNum) {
      portStr += `:${targetPort}`;
    }
    
    if (nodePort) {
      portStr += `:${nodePort}`;
    }
    
    return `${portStr}/${protocol}`;
  };

  return (
    <Space direction="vertical" size={0}>
      {displayPorts.map((port, index) => (
        <code key={index} className="text-xs">
          {formatPort(port)}
        </code>
      ))}
      {remainingCount > 0 && (
        <Tooltip
          title={ports.slice(maxDisplay).map(formatPort).join(', ')}
        >
          <Tag color="blue" className="text-xs cursor-help">
            +{remainingCount} more
          </Tag>
        </Tooltip>
      )}
    </Space>
  );
};

// Resource endpoints component (for services)
export interface ResourceEndpointsProps {
  ready: number;
  total?: number;
  showDetails?: boolean;
}

export const ResourceEndpoints: React.FC<ResourceEndpointsProps> = ({
  ready,
  total,
  showDetails = false,
}) => {
  const hasTotal = total !== undefined;
  const isHealthy = hasTotal ? ready === total : ready > 0;

  if (showDetails && hasTotal) {
    return (
      <Space direction="vertical" size={0}>
        <Badge
          status={isHealthy ? 'success' : ready > 0 ? 'processing' : 'error'}
          text={`${ready}/${total} ready`}
        />
        {total > 0 && (
          <Progress
            percent={(ready / total) * 100}
            size="small"
            status={isHealthy ? 'success' : ready > 0 ? 'active' : 'exception'}
            showInfo={false}
          />
        )}
      </Space>
    );
  }

  return (
    <Badge
      status={isHealthy ? 'success' : ready > 0 ? 'processing' : 'error'}
      text={hasTotal ? `${ready}/${total} ready` : `${ready} ready`}
    />
  );
};

// Resource size component (for config resources)
export interface ResourceSizeProps {
  size: string | number;
  unit?: string;
}

export const ResourceSize: React.FC<ResourceSizeProps> = ({
  size,
  unit = 'B',
}) => {
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const sizeValue = typeof size === 'string' ? parseInt(size, 10) : size;
  const formattedSize = isNaN(sizeValue) ? size : formatSize(sizeValue);

  return <code className="text-xs">{formattedSize}</code>;
};

// Resource data keys component (for ConfigMaps/Secrets)
export interface ResourceDataKeysProps {
  keys: string[];
  maxDisplay?: number;
  showIcon?: boolean;
}

export const ResourceDataKeys: React.FC<ResourceDataKeysProps> = ({
  keys = [],
  maxDisplay = 2,
  showIcon = true,
}) => {
  if (keys.length === 0) {
    return <Text type="secondary">None</Text>;
  }

  const displayKeys = keys.slice(0, maxDisplay);
  const remainingCount = keys.length - maxDisplay;

  return (
    <Space direction="vertical" size={0}>
      {displayKeys.map((key, index) => (
        <div key={index} className="flex items-center gap-1">
          {showIcon && <InfoCircleOutlined className="text-blue-500" />}
          <code className="text-xs">{key}</code>
        </div>
      ))}
      {remainingCount > 0 && (
        <Tooltip title={keys.slice(maxDisplay).join(', ')}>
          <Tag color="blue" className="text-xs cursor-help">
            +{remainingCount} more
          </Tag>
        </Tooltip>
      )}
    </Space>
  );
};

// Resource health indicator
export interface ResourceHealthProps {
  health: 'healthy' | 'warning' | 'error' | 'unknown';
  message?: string;
}

export const ResourceHealth: React.FC<ResourceHealthProps> = ({
  health,
  message,
}) => {
  const getHealthConfig = (health: string) => {
    switch (health) {
      case 'healthy':
        return {
          status: 'success' as const,
          icon: <CheckCircleOutlined />,
          color: '#52c41a',
        };
      case 'warning':
        return {
          status: 'warning' as const,
          icon: <ExclamationCircleOutlined />,
          color: '#faad14',
        };
      case 'error':
        return {
          status: 'error' as const,
          icon: <CloseCircleOutlined />,
          color: '#ff4d4f',
        };
      case 'unknown':
      default:
        return {
          status: 'default' as const,
          icon: <InfoCircleOutlined />,
          color: '#d9d9d9',
        };
    }
  };

  const config = getHealthConfig(health);

  return (
    <Tooltip title={message}>
      <Badge
        status={config.status}
        text={health.charAt(0).toUpperCase() + health.slice(1)}
      />
    </Tooltip>
  );
};

// Resource actions component
export interface ResourceActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  customActions?: Array<{
    key: string;
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    danger?: boolean;
    disabled?: boolean;
  }>;
}

export const ResourceActions: React.FC<ResourceActionsProps> = ({
  onView,
  onEdit,
  onDelete,
  customActions = [],
}) => {
  return (
    <Space>
      {onView && (
        <Tooltip title="View details">
          <a onClick={onView} className="text-blue-600 hover:text-blue-800">
            View
          </a>
        </Tooltip>
      )}
      {onEdit && (
        <Tooltip title="Edit resource">
          <a onClick={onEdit} className="text-blue-600 hover:text-blue-800">
            Edit
          </a>
        </Tooltip>
      )}
      {customActions.map(action => (
        <Tooltip key={action.key} title={action.label}>
          <a
            onClick={action.onClick}
            className={
              action.danger
                ? 'text-red-600 hover:text-red-800'
                : 'text-blue-600 hover:text-blue-800'
            }
            style={{ opacity: action.disabled ? 0.5 : 1 }}
          >
            {action.icon} {action.label}
          </a>
        </Tooltip>
      ))}
      {onDelete && (
        <Tooltip title="Delete resource">
          <a onClick={onDelete} className="text-red-600 hover:text-red-800">
            Delete
          </a>
        </Tooltip>
      )}
    </Space>
  );
};