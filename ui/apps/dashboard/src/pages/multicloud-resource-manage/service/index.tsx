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

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Button, 
  Segmented, 
  Space, 
  Typography, 
  Card, 
  Row, 
  Col,
  notification,
  Modal,
  Tooltip,
  Tag,
  Select,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  ExportOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { ServiceKind, ServiceResource, IngressResource } from '@/services/base';
import { 
  GetMemberClusterServices, 
  GetMemberClusterIngress,
  DeleteMemberClusterService,
  DeleteMemberClusterIngress,
  GetMemberClusterServiceDetail,
  GetMemberClusterIngressDetail,
} from '@/services/member-cluster/service';
import { resourceConfirmations } from '@/components/common/LoadingFeedback';
import { getResourceDependencies, getCascadingDeletions } from '@/utils/resource-dependencies';
import { 
  useResourceQuery, 
  useResourceDetailQuery,
  useNamespaceOptionsQuery,
} from '@/hooks/useResourceQuery';
import { 
  useResourceDeleteMutation,
  useBulkResourceMutation,
} from '@/hooks/useResourceMutation';
import { ResourceList, createDefaultBulkActions, formatAge, formatLabels } from '@/components/common/ResourceList';
import { ResourceDetail, createResourceBreadcrumbs } from '@/components/common/ResourceDetail';
import { ResourceForm } from '@/components/common/ResourceForm';
import Panel from '@/components/panel';
import i18nInstance from '@/utils/i18n';
const { Title } = Typography;

// Service port interface for display
interface ServicePortDisplay {
  name?: string;
  port: number;
  targetPort: number | string;
  protocol: string;
  nodePort?: number;
}

// Service page component
const ServicePage: React.FC = () => {
  // State management
  const [selectedResourceType, setSelectedResourceType] = useState<ServiceKind>(ServiceKind.Service);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedResource, setSelectedResource] = useState<{
    namespace: string;
    name: string;
  } | null>(null);

  // Query client for cache management
  const queryClient = useQueryClient();

  // Mock member cluster name - in real implementation, this would come from context/props
  const memberClusterName = 'member-cluster-1';

  // Namespace options query
  const { data: namespaceData } = useNamespaceOptionsQuery(memberClusterName);
  const namespaceOptions = useMemo(() => 
    namespaceData?.data?.namespaces?.map(ns => ({
      label: ns.name,
      value: ns.name,
    })) || [],
    [namespaceData]
  );

  // Service list query
  const serviceQuery = useResourceQuery(
    'service',
    {
      memberClusterName,
      namespace: selectedNamespace || undefined,
      keyword: searchText || undefined,
      itemsPerPage: 20,
      page: 1,
    },
    GetMemberClusterServices,
    {
      enabled: selectedResourceType === ServiceKind.Service,
    }
  );

  // Ingress list query
  const ingressQuery = useResourceQuery(
    'ingress',
    {
      memberClusterName,
      namespace: selectedNamespace || undefined,
      keyword: searchText || undefined,
      itemsPerPage: 20,
      page: 1,
    },
    GetMemberClusterIngress,
    {
      enabled: selectedResourceType === ServiceKind.Ingress,
    }
  );

  // Resource detail query
  const detailQuery = useResourceDetailQuery(
    selectedResourceType === ServiceKind.Service ? 'service' : 'ingress',
    {
      memberClusterName,
      namespace: selectedResource?.namespace || '',
      name: selectedResource?.name || '',
    },
    selectedResourceType === ServiceKind.Service 
      ? GetMemberClusterServiceDetail 
      : GetMemberClusterIngressDetail,
    {
      enabled: detailDrawerOpen && !!selectedResource,
    }
  );

  // Delete mutations
  const serviceDeleteMutation = useResourceDeleteMutation(
    'service',
    DeleteMemberClusterService,
    {
      onSuccess: () => {
        setDetailDrawerOpen(false);
        setSelectedResource(null);
      },
    }
  );

  const ingressDeleteMutation = useResourceDeleteMutation(
    'ingress',
    DeleteMemberClusterIngress,
    {
      onSuccess: () => {
        setDetailDrawerOpen(false);
        setSelectedResource(null);
      },
    }
  );

  // Bulk delete mutation
  const bulkDeleteMutation = useBulkResourceMutation(
    selectedResourceType === ServiceKind.Service ? 'service' : 'ingress',
    async (params) => {
      const deleteFunction = selectedResourceType === ServiceKind.Service 
        ? DeleteMemberClusterService 
        : DeleteMemberClusterIngress;
      
      let successCount = 0;
      let failureCount = 0;
      const errors: string[] = [];

      for (const resource of params.resources) {
        try {
          await deleteFunction({
            memberClusterName: params.memberClusterName,
            namespace: resource.namespace,
            name: resource.name,
          });
          successCount++;
        } catch (error) {
          failureCount++;
          errors.push(`Failed to delete ${resource.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        code: 200,
        message: 'Bulk operation completed',
        data: { successCount, failureCount, errors },
      };
    }
  );

  // Current query based on selected resource type
  const currentQuery = selectedResourceType === ServiceKind.Service ? serviceQuery : ingressQuery;
  const currentData = currentQuery.data?.data;

  // Extract items from response
  const items = useMemo(() => {
    if (!currentData) return [];
    
    if (selectedResourceType === ServiceKind.Service) {
      return (currentData as any).services || [];
    } else {
      return (currentData as any).items || [];
    }
  }, [currentData, selectedResourceType]);

  // Service columns configuration
  const serviceColumns = useMemo(() => [
    {
      key: 'name',
      title: i18nInstance.t('8f3747c057d893862fbe4b7980e9b451', '服务名称'),
      dataIndex: ['objectMeta', 'name'],
      sortable: true,
      ellipsis: true,
      render: (name: string, record: ServiceResource) => (
        <Button
          type="link"
          onClick={() => handleResourceClick(record)}
          className="p-0 h-auto"
        >
          {name}
        </Button>
      ),
    },
    {
      key: 'namespace',
      title: i18nInstance.t('a4b28a416f0b6f3c215c51e79e517298', '命名空间'),
      dataIndex: ['objectMeta', 'namespace'],
      sortable: true,
      width: 150,
    },
    {
      key: 'type',
      title: 'Type',
      dataIndex: ['spec', 'type'],
      width: 120,
      render: (type: string) => (
        <Tag color={getServiceTypeColor(type)}>{type}</Tag>
      ),
    },
    {
      key: 'clusterIP',
      title: 'Cluster IP',
      dataIndex: ['spec', 'clusterIP'],
      width: 150,
      render: (ip: string) => ip || '-',
    },
    {
      key: 'externalIP',
      title: 'External IP',
      width: 150,
      render: (_, record: ServiceResource) => {
        const externalIPs = record.spec?.externalIPs || [];
        const loadBalancerIP = record.spec?.loadBalancerIP;
        
        if (loadBalancerIP) {
          return <Tag color="blue">{loadBalancerIP}</Tag>;
        }
        
        if (externalIPs.length > 0) {
          return (
            <Space size={4} wrap>
              {externalIPs.slice(0, 2).map((ip, index) => (
                <Tag key={index} color="green">{ip}</Tag>
              ))}
              {externalIPs.length > 2 && (
                <Tag>+{externalIPs.length - 2} more</Tag>
              )}
            </Space>
          );
        }
        
        return '-';
      },
    },
    {
      key: 'ports',
      title: 'Ports',
      width: 200,
      render: (_, record: ServiceResource) => {
        const ports = record.spec?.ports || [];
        if (ports.length === 0) return '-';
        
        return (
          <Space size={4} wrap>
            {ports.slice(0, 2).map((port, index) => (
              <Tag key={index} color="blue">
                {port.port}
                {port.nodePort && `/${port.nodePort}`}
                /{port.protocol}
              </Tag>
            ))}
            {ports.length > 2 && (
              <Tooltip title={`${ports.length - 2} more ports`}>
                <Tag>+{ports.length - 2}</Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      key: 'labels',
      title: i18nInstance.t('1f7be0a924280cd098db93c9d81ecccd', '标签信息'),
      width: 200,
      render: (_, record: ServiceResource) => 
        formatLabels(record.objectMeta?.labels, 2),
    },
    {
      key: 'age',
      title: 'Age',
      width: 100,
      render: (_, record: ServiceResource) => 
        formatAge(record.objectMeta?.creationTimestamp || ''),
    },
    {
      key: 'actions',
      title: i18nInstance.t('2b6bc0f293f5ca01b006206c2535ccbc', '操作'),
      width: 200,
      fixed: 'right' as const,
      render: (_, record: ServiceResource) => (
        <Space size="small">
          <Tooltip title={i18nInstance.t('607e7a4f377fa66b0b28ce318aab841f', '查看')}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleResourceClick(record)}
            />
          </Tooltip>
          <Tooltip title={i18nInstance.t('95b351c86267f3aedf89520959bce689', '编辑')}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditResource(record)}
            />
          </Tooltip>
          <Tooltip title={i18nInstance.t('2f4aaddde33c9b93c36fd2503f3d122b', '删除')}>
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteResource(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ], []);

  // Ingress columns configuration
  const ingressColumns = useMemo(() => [
    {
      key: 'name',
      title: i18nInstance.t('d7ec2d3fea4756bc1642e0f10c180cf5', '名称'),
      dataIndex: ['objectMeta', 'name'],
      sortable: true,
      ellipsis: true,
      render: (name: string, record: IngressResource) => (
        <Button
          type="link"
          onClick={() => handleResourceClick(record)}
          className="p-0 h-auto"
        >
          {name}
        </Button>
      ),
    },
    {
      key: 'namespace',
      title: i18nInstance.t('a4b28a416f0b6f3c215c51e79e517298', '命名空间'),
      dataIndex: ['objectMeta', 'namespace'],
      sortable: true,
      width: 150,
    },
    {
      key: 'class',
      title: 'Class',
      dataIndex: ['spec', 'ingressClassName'],
      width: 120,
      render: (className: string) => className || '-',
    },
    {
      key: 'hosts',
      title: 'Hosts',
      width: 200,
      render: (_, record: IngressResource) => {
        const rules = record.spec?.rules || [];
        const hosts = rules.map(rule => rule.host).filter(Boolean);
        
        if (hosts.length === 0) return '-';
        
        return (
          <Space size={4} wrap>
            {hosts.slice(0, 2).map((host, index) => (
              <Tag key={index} color="blue">{host}</Tag>
            ))}
            {hosts.length > 2 && (
              <Tag>+{hosts.length - 2} more</Tag>
            )}
          </Space>
        );
      },
    },
    {
      key: 'paths',
      title: 'Paths',
      width: 150,
      render: (_, record: IngressResource) => {
        const rules = record.spec?.rules || [];
        const pathCount = rules.reduce((total, rule) => 
          total + (rule.http?.paths?.length || 0), 0
        );
        
        return pathCount > 0 ? `${pathCount} path${pathCount > 1 ? 's' : ''}` : '-';
      },
    },
    {
      key: 'tls',
      title: 'TLS',
      width: 80,
      render: (_, record: IngressResource) => {
        const tlsCount = record.spec?.tls?.length || 0;
        return tlsCount > 0 ? (
          <Tag color="green">{tlsCount} TLS</Tag>
        ) : (
          <Tag color="default">No TLS</Tag>
        );
      },
    },
    {
      key: 'labels',
      title: i18nInstance.t('1f7be0a924280cd098db93c9d81ecccd', '标签信息'),
      width: 200,
      render: (_, record: IngressResource) => 
        formatLabels(record.objectMeta?.labels, 2),
    },
    {
      key: 'age',
      title: 'Age',
      width: 100,
      render: (_, record: IngressResource) => 
        formatAge(record.objectMeta?.creationTimestamp || ''),
    },
    {
      key: 'actions',
      title: i18nInstance.t('2b6bc0f293f5ca01b006206c2535ccbc', '操作'),
      width: 200,
      fixed: 'right' as const,
      render: (_, record: IngressResource) => (
        <Space size="small">
          <Tooltip title={i18nInstance.t('607e7a4f377fa66b0b28ce318aab841f', '查看')}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleResourceClick(record)}
            />
          </Tooltip>
          <Tooltip title={i18nInstance.t('95b351c86267f3aedf89520959bce689', '编辑')}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditResource(record)}
            />
          </Tooltip>
          <Tooltip title={i18nInstance.t('2f4aaddde33c9b93c36fd2503f3d122b', '删除')}>
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteResource(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ], []);

  // Event handlers
  const handleResourceTypeChange = useCallback((value: ServiceKind) => {
    setSelectedResourceType(value);
    setSelectedNamespace('');
    setSearchText('');
    setSelectedResource(null);
    setDetailDrawerOpen(false);
  }, []);

  const handleResourceClick = useCallback((resource: ServiceResource | IngressResource) => {
    setSelectedResource({
      namespace: resource.objectMeta?.namespace || '',
      name: resource.objectMeta?.name || '',
    });
    setDetailDrawerOpen(true);
  }, []);

  const handleEditResource = useCallback((resource: ServiceResource | IngressResource) => {
    setSelectedResource({
      namespace: resource.objectMeta?.namespace || '',
      name: resource.objectMeta?.name || '',
    });
    setFormMode('edit');
    setFormModalOpen(true);
  }, []);

  const handleDeleteResource = useCallback(async (resource: ServiceResource | IngressResource) => {
    const resourceName = resource.objectMeta?.name || '';
    const resourceNamespace = resource.objectMeta?.namespace || '';
    const resourceType = selectedResourceType === ServiceKind.Service ? 'Service' : 'Ingress';
    
    // Analyze dependencies
    const dependencies = getResourceDependencies(resourceType.toLowerCase(), resource);
    const cascadingResources = getCascadingDeletions(resourceType, resourceName, resourceNamespace);

    resourceConfirmations.deleteWithDependencies({
      resourceType,
      resourceName,
      namespace: resourceNamespace,
      dependencies,
      cascadingResources,
      onConfirm: () => {
        const mutation = selectedResourceType === ServiceKind.Service 
          ? serviceDeleteMutation 
          : ingressDeleteMutation;
        
        mutation.mutate({
          memberClusterName,
          namespace: resourceNamespace,
          name: resourceName,
        });
      },
    });
  }, [selectedResourceType, serviceDeleteMutation, ingressDeleteMutation, memberClusterName]);

  const handleCreateResource = useCallback(() => {
    setFormMode('create');
    setSelectedResource(null);
    setFormModalOpen(true);
  }, []);

  const handleBulkDelete = useCallback(async (selectedItems: (ServiceResource | IngressResource)[]) => {
    const resourceType = selectedResourceType === ServiceKind.Service ? 'Service' : 'Ingress';
    
    // Analyze dependencies for all selected items
    const allDependencies = selectedItems.flatMap(item => 
      getResourceDependencies(resourceType.toLowerCase(), item)
    );

    resourceConfirmations.deleteWithDependencies({
      resourceType: `${selectedItems.length} ${resourceType}${selectedItems.length > 1 ? 's' : ''}`,
      resourceName: `${selectedItems.length} selected items`,
      dependencies: allDependencies,
      onConfirm: () => {
        bulkDeleteMutation.mutate({
          memberClusterName,
          resources: selectedItems.map(item => ({
            namespace: item.objectMeta?.namespace || '',
            name: item.objectMeta?.name || '',
          })),
          operation: 'delete',
        });
      },
    });
  }, [selectedResourceType, bulkDeleteMutation, memberClusterName]);

  // Bulk actions
  const bulkActions = useMemo(() => 
    createDefaultBulkActions(handleBulkDelete),
    [handleBulkDelete]
  );

  // Utility functions
  const getServiceTypeColor = (type: string): string => {
    switch (type) {
      case 'ClusterIP':
        return 'blue';
      case 'NodePort':
        return 'green';
      case 'LoadBalancer':
        return 'orange';
      case 'ExternalName':
        return 'purple';
      default:
        return 'default';
    }
  };

  // Breadcrumbs for detail view
  const breadcrumbs = useMemo(() => 
    createResourceBreadcrumbs(
      memberClusterName,
      selectedResourceType === ServiceKind.Service ? 'services' : 'ingresses',
      selectedResource?.namespace,
      () => {/* navigate to cluster */},
      () => setDetailDrawerOpen(false),
      () => {/* navigate to namespace */}
    ),
    [memberClusterName, selectedResourceType, selectedResource]
  );

  return (
    <Panel>
      {/* Header Section */}
      <Card className="mb-4">
        <Row justify="space-between" align="middle">
          <Col>
            <Space direction="vertical" size={0}>
              <Title level={4} className="mb-0">
                {selectedResourceType === ServiceKind.Service ? 'Services' : 'Ingresses'}
              </Title>
              <Typography.Text type="secondary">
                Manage network services and ingress resources in {memberClusterName}
              </Typography.Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateResource}
              >
                {i18nInstance.t('c7961c290ec86485d8692f3c09b4075b', '新增服务')}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Resource Type Selector */}
      <Card className="mb-4">
        <Segmented
          value={selectedResourceType}
          onChange={handleResourceTypeChange}
          options={[
            {
              label: 'Services',
              value: ServiceKind.Service,
            },
            {
              label: 'Ingresses',
              value: ServiceKind.Ingress,
            },
          ]}
        />
      </Card>

      {/* Resource List */}
      <ResourceList
        memberClusterName={memberClusterName}
        resourceType={selectedResourceType === ServiceKind.Service ? 'service' : 'ingress'}
        resourceKind={selectedResourceType === ServiceKind.Service ? 'Service' : 'Ingress'}
        fetchFunction={selectedResourceType === ServiceKind.Service ? GetMemberClusterServices : GetMemberClusterIngress}
        columns={selectedResourceType === ServiceKind.Service ? serviceColumns : ingressColumns}
        enableBulkOperations={true}
        bulkActions={bulkActions}
        enableExport={true}
        enableRefresh={true}
        enableSearch={true}
        enableFiltering={true}
        onRowClick={handleResourceClick}
        onCreateClick={handleCreateResource}
        createButtonText={`Create ${selectedResourceType === ServiceKind.Service ? 'Service' : 'Ingress'}`}
        customFilters={
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Select Namespace"
              allowClear
              showSearch
              value={selectedNamespace || undefined}
              onChange={setSelectedNamespace}
              options={namespaceOptions}
              className="w-full"
            />
          </Col>
        }
      />

      {/* Resource Detail Drawer */}
      <ResourceDetail
        open={detailDrawerOpen}
        memberClusterName={memberClusterName}
        namespace={selectedResource?.namespace || ''}
        name={selectedResource?.name || ''}
        resourceType={selectedResourceType === ServiceKind.Service ? 'service' : 'ingress'}
        resourceKind={selectedResourceType === ServiceKind.Service ? 'Service' : 'Ingress'}
        fetchFunction={selectedResourceType === ServiceKind.Service ? GetMemberClusterServiceDetail : GetMemberClusterIngressDetail}
        breadcrumbs={breadcrumbs}
        onEdit={() => {
          setFormMode('edit');
          setFormModalOpen(true);
        }}
        onDelete={() => {
          if (selectedResource) {
            const mutation = selectedResourceType === ServiceKind.Service 
              ? serviceDeleteMutation 
              : ingressDeleteMutation;
            
            Modal.confirm({
              title: `Delete ${selectedResourceType === ServiceKind.Service ? 'Service' : 'Ingress'}`,
              content: `Are you sure you want to delete "${selectedResource.name}"?`,
              okType: 'danger',
              onOk: () => {
                mutation.mutate({
                  memberClusterName,
                  namespace: selectedResource.namespace,
                  name: selectedResource.name,
                });
              },
            });
          }
        }}
        onClose={() => {
          setDetailDrawerOpen(false);
          setSelectedResource(null);
        }}
        width={900}
      />

      {/* Resource Form Modal */}
      <Modal
        title={`${formMode === 'create' ? 'Create' : 'Edit'} ${selectedResourceType === ServiceKind.Service ? 'Service' : 'Ingress'}`}
        open={formModalOpen}
        onCancel={() => {
          setFormModalOpen(false);
          setSelectedResource(null);
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <ResourceForm
          resourceType={selectedResourceType === ServiceKind.Service ? 'service' : 'ingress'}
          resourceKind={selectedResourceType === ServiceKind.Service ? 'Service' : 'Ingress'}
          memberClusterName={memberClusterName}
          mode={formMode}
          fields={[]} // This would be populated with service/ingress specific fields
          onSubmit={async (values) => {
            // Implementation would handle create/update operations
            console.log('Form submitted:', values);
            setFormModalOpen(false);
            setSelectedResource(null);
            // Refresh the list
            currentQuery.refetch();
          }}
          onCancel={() => {
            setFormModalOpen(false);
            setSelectedResource(null);
          }}
        />
      </Modal>
    </Panel>
  );
};
export default ServicePage;
