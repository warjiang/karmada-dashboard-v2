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

import React, { useState, useMemo, useCallback } from 'react';
import {
  Drawer,
  Tabs,
  Card,
  Statistic,
  Typography,
  Space,
  Button,
  Breadcrumb,
  Alert,
  Spin,
  Tag,
  Tooltip,
  Row,
  Col,
  Divider,
  Empty,
  TabsProps,
} from 'antd';
import {
  InfoCircleOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  LinkOutlined,
  HomeOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { BaseResource } from '../ResourceList';
import { ResourceMeta, ResourceEvent } from '@/services/base';
import EventViewer from '../EventViewer';
import { GetResourceEvents } from '@/services/member-cluster/events';
import { EventsTab } from './EventsTab';
import i18nInstance from '@/utils/i18n';
import { calculateDuration } from '@/utils/time';
import TagList, { convertLabelToTags } from '@/components/tag-list';

const { Text, Title } = Typography;

// Tab configuration interface
export interface DetailTab {
  key: string;
  label: string;
  icon?: React.ReactNode;
  component: React.ComponentType<DetailTabProps>;
  disabled?: boolean;
  forceRender?: boolean;
}

// Props for tab components
export interface DetailTabProps {
  resource: any;
  memberClusterName: string;
  resourceType: string;
  onNavigate?: (resource: { kind: string; namespace: string; name: string }) => void;
  onRefresh?: () => void;
}

// Breadcrumb item interface
export interface BreadcrumbItem {
  title: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

// Resource detail props interface
export interface ResourceDetailProps {
  // Core configuration
  open: boolean;
  memberClusterName: string;
  namespace: string;
  name: string;
  resourceType: string;
  resourceKind: string;
  
  // Data fetching
  fetchFunction: (params: {
    memberClusterName: string;
    namespace: string;
    name: string;
  }) => Promise<any>;
  
  // Tab configuration
  tabs?: DetailTab[];
  defaultActiveTab?: string;
  
  // Navigation and breadcrumbs
  breadcrumbs?: BreadcrumbItem[];
  onNavigate?: (resource: { kind: string; namespace: string; name: string }) => void;
  
  // Actions
  onEdit?: () => void;
  onDelete?: () => void;
  onClose: () => void;
  onRefresh?: () => void;
  
  // Customization
  title?: string;
  width?: number | string;
  placement?: 'left' | 'right' | 'top' | 'bottom';
  customActions?: React.ReactNode;
  
  // Feature flags
  enableEdit?: boolean;
  enableDelete?: boolean;
  enableRefresh?: boolean;
  enableExport?: boolean;
  enableBreadcrumbs?: boolean;
  
  // Styling
  className?: string;
}

// Overview tab component
const OverviewTab: React.FC<DetailTabProps> = ({ resource }) => {
  if (!resource) {
    return <Empty description="No resource data available" />;
  }

  const objectMeta = resource.objectMeta as ResourceMeta;
  const typeMeta = resource.typeMeta;

  return (
    <div className="space-y-4">
      {/* Basic Information */}
      <Card title="Basic Information" size="small">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Statistic
              title="Name"
              value={objectMeta?.name || '-'}
              valueStyle={{ fontSize: '14px' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Statistic
              title="Namespace"
              value={objectMeta?.namespace || '-'}
              valueStyle={{ fontSize: '14px' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Statistic
              title="Kind"
              value={typeMeta?.kind || '-'}
              valueStyle={{ fontSize: '14px' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Statistic
              title="Age"
              value={calculateDuration(objectMeta?.creationTimestamp)}
              valueStyle={{ fontSize: '14px' }}
            />
          </Col>
        </Row>
        
        <Divider />
        
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Statistic
              title="Created"
              value={
                objectMeta?.creationTimestamp
                  ? dayjs(objectMeta.creationTimestamp).format('YYYY-MM-DD HH:mm:ss')
                  : '-'
              }
              valueStyle={{ fontSize: '14px' }}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Statistic
              title="UID"
              value={
                <Tooltip title={objectMeta?.uid}>
                  <Text ellipsis style={{ maxWidth: 200 }}>
                    {objectMeta?.uid || '-'}
                  </Text>
                </Tooltip>
              }
              valueStyle={{ fontSize: '14px' }}
            />
          </Col>
        </Row>
        
        {objectMeta?.resourceVersion && (
          <>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Statistic
                  title="Resource Version"
                  value={objectMeta.resourceVersion}
                  valueStyle={{ fontSize: '14px' }}
                />
              </Col>
              {objectMeta.generation && (
                <Col xs={24} sm={12}>
                  <Statistic
                    title="Generation"
                    value={objectMeta.generation}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Col>
              )}
            </Row>
          </>
        )}
      </Card>

      {/* Labels */}
      <Card title="Labels" size="small">
        <TagList
          tags={convertLabelToTags(
            objectMeta?.name || '',
            objectMeta?.labels
          )}
        />
      </Card>

      {/* Annotations */}
      <Card title="Annotations" size="small">
        <TagList
          tags={convertLabelToTags(
            objectMeta?.name || '',
            objectMeta?.annotations
          )}
        />
      </Card>

      {/* Owner References */}
      {objectMeta?.ownerReferences && objectMeta.ownerReferences.length > 0 && (
        <Card title="Owner References" size="small">
          <div className="space-y-2">
            {objectMeta.ownerReferences.map((owner, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Tag color="blue">{owner.kind}</Tag>
                <Text strong>{owner.name}</Text>
                {owner.controller && <Tag color="green">Controller</Tag>}
                {owner.blockOwnerDeletion && <Tag color="orange">Block Deletion</Tag>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Finalizers */}
      {objectMeta?.finalizers && objectMeta.finalizers.length > 0 && (
        <Card title="Finalizers" size="small">
          <div className="space-y-1">
            {objectMeta.finalizers.map((finalizer, index) => (
              <Tag key={index} color="purple">
                {finalizer}
              </Tag>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// YAML tab component
const YAMLTab: React.FC<DetailTabProps> = ({ resource }) => {
  const [yamlContent, setYamlContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatYAML = useCallback(() => {
    if (!resource) return '';
    
    try {
      // Remove internal fields that shouldn't be shown in YAML
      const cleanResource = { ...resource };
      if (cleanResource.objectMeta) {
        const { resourceVersion, uid, generation, ...cleanMeta } = cleanResource.objectMeta;
        cleanResource.objectMeta = cleanMeta;
      }
      
      // Convert to YAML (would need yaml library)
      return JSON.stringify(cleanResource, null, 2);
    } catch (error) {
      console.error('Failed to format YAML:', error);
      return 'Error formatting YAML';
    }
  }, [resource]);

  useMemo(() => {
    setYamlContent(formatYAML());
  }, [formatYAML]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Parse and validate YAML
      // Save changes via API
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save YAML:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([yamlContent], { type: 'application/x-yaml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${resource?.objectMeta?.name || 'resource'}.yaml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Title level={5}>YAML Configuration</Title>
        <Space>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownload}
            size="small"
          >
            Download
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={() => setIsEditing(!isEditing)}
            size="small"
            type={isEditing ? 'primary' : 'default'}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
          {isEditing && (
            <Button
              type="primary"
              onClick={handleSave}
              loading={loading}
              size="small"
            >
              Save
            </Button>
          )}
        </Space>
      </div>
      
      <Card>
        <pre
          style={{
            background: '#f5f5f5',
            padding: '16px',
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '600px',
            fontSize: '12px',
            lineHeight: '1.4',
          }}
        >
          {isEditing ? (
            <textarea
              value={yamlContent}
              onChange={(e) => setYamlContent(e.target.value)}
              style={{
                width: '100%',
                height: '500px',
                border: 'none',
                background: 'transparent',
                resize: 'none',
                outline: 'none',
                fontFamily: 'monospace',
                fontSize: '12px',
              }}
            />
          ) : (
            yamlContent
          )}
        </pre>
      </Card>
    </div>
  );
};

// Events tab component - now using the enhanced EventsTab
const EventsTabComponent: React.FC<DetailTabProps> = (props) => {
  return <EventsTab {...props} />;
};

// Main ResourceDetail component
export const ResourceDetail: React.FC<ResourceDetailProps> = ({
  open,
  memberClusterName,
  namespace,
  name,
  resourceType,
  resourceKind,
  fetchFunction,
  tabs = [],
  defaultActiveTab = 'overview',
  breadcrumbs = [],
  onNavigate,
  onEdit,
  onDelete,
  onClose,
  onRefresh,
  title,
  width = 800,
  placement = 'right',
  customActions,
  enableEdit = true,
  enableDelete = true,
  enableRefresh = true,
  enableExport = true,
  enableBreadcrumbs = true,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState(defaultActiveTab);
  const queryClient = useQueryClient();

  // Data fetching
  const {
    data: resource,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [memberClusterName, resourceType, namespace, name],
    queryFn: () => fetchFunction({ memberClusterName, namespace, name }),
    enabled: open && !!memberClusterName && !!namespace && !!name,
    staleTime: 30000, // 30 seconds
  });

  // Default tabs
  const defaultTabs: DetailTab[] = [
    {
      key: 'overview',
      label: 'Overview',
      icon: <InfoCircleOutlined />,
      component: OverviewTab,
    },
    {
      key: 'yaml',
      label: 'YAML',
      component: YAMLTab,
    },
    {
      key: 'events',
      label: 'Events',
      component: EventsTabComponent,
    },
  ];

  // Combine default and custom tabs
  const allTabs = [...defaultTabs, ...tabs];

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
    queryClient.invalidateQueries({ queryKey: [memberClusterName, resourceType] });
    onRefresh?.();
  }, [refetch, queryClient, memberClusterName, resourceType, onRefresh]);

  // Handle navigation
  const handleNavigate = useCallback((targetResource: { kind: string; namespace: string; name: string }) => {
    onNavigate?.(targetResource);
  }, [onNavigate]);

  // Tab items for Ant Design Tabs
  const tabItems: TabsProps['items'] = allTabs.map(tab => ({
    key: tab.key,
    label: (
      <span>
        {tab.icon}
        {tab.label}
      </span>
    ),
    children: (
      <tab.component
        resource={resource}
        memberClusterName={memberClusterName}
        resourceType={resourceType}
        onNavigate={handleNavigate}
        onRefresh={handleRefresh}
      />
    ),
    disabled: tab.disabled,
    forceRender: tab.forceRender,
  }));

  // Generate title
  const drawerTitle = title || `${resourceKind} Details`;

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between">
          <div>
            <Title level={4} className="mb-0">
              {drawerTitle}
            </Title>
            {resource?.objectMeta && (
              <Text type="secondary" className="text-sm">
                {resource.objectMeta.namespace}/{resource.objectMeta.name}
              </Text>
            )}
          </div>
          <Space>
            {customActions}
            {enableRefresh && (
              <Tooltip title="Refresh">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  loading={isLoading}
                  size="small"
                />
              </Tooltip>
            )}
            {enableEdit && onEdit && (
              <Tooltip title="Edit">
                <Button
                  icon={<EditOutlined />}
                  onClick={onEdit}
                  size="small"
                />
              </Tooltip>
            )}
            {enableDelete && onDelete && (
              <Tooltip title="Delete">
                <Button
                  icon={<DeleteOutlined />}
                  onClick={onDelete}
                  danger
                  size="small"
                />
              </Tooltip>
            )}
          </Space>
        </div>
      }
      placement={placement}
      open={open}
      width={width}
      onClose={onClose}
      className={className}
      destroyOnClose
    >
      {/* Breadcrumbs */}
      {enableBreadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-4">
          <Breadcrumb>
            {breadcrumbs.map((crumb, index) => (
              <Breadcrumb.Item key={index}>
                {crumb.icon}
                {crumb.onClick ? (
                  <a onClick={crumb.onClick}>{crumb.title}</a>
                ) : crumb.href ? (
                  <a href={crumb.href}>{crumb.title}</a>
                ) : (
                  crumb.title
                )}
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert
          message="Failed to load resource details"
          description={error instanceof Error ? error.message : 'An unexpected error occurred'}
          type="error"
          showIcon
          className="mb-4"
          action={
            <Button size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        />
      )}

      {/* Loading State */}
      {isLoading && !resource && (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      )}

      {/* Content */}
      {resource && (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="small"
        />
      )}

      {/* Empty State */}
      {!isLoading && !resource && !error && (
        <Empty
          description="Resource not found"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </Drawer>
  );
};

// Utility functions for creating common breadcrumbs
export const createResourceBreadcrumbs = (
  memberClusterName: string,
  resourceType: string,
  namespace?: string,
  onNavigateToCluster?: () => void,
  onNavigateToResourceList?: () => void,
  onNavigateToNamespace?: () => void
): BreadcrumbItem[] => {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Clusters',
      icon: <HomeOutlined />,
      onClick: onNavigateToCluster,
    },
    {
      title: memberClusterName,
      onClick: onNavigateToCluster,
    },
    {
      title: resourceType.charAt(0).toUpperCase() + resourceType.slice(1),
      onClick: onNavigateToResourceList,
    },
  ];

  if (namespace) {
    breadcrumbs.push({
      title: namespace,
      onClick: onNavigateToNamespace,
    });
  }

  return breadcrumbs;
};

// Default export
export default ResourceDetail;