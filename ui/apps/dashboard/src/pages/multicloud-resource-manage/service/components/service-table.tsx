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

import React, { FC, useState, useMemo } from 'react';
import { Button, Popconfirm, Space, Table, TableColumnProps, Tag, Tooltip, Alert, Drawer, Descriptions, Typography } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { GetMemberClusterServices, GetMemberClusterServiceDetail, ServiceResource } from '@/services/member-cluster/service';
import { formatAge, formatLabels } from '@/components/common/ResourceList';
import { useResourceQuery, useResourceDetailQuery } from '@/hooks/useResourceQuery';
import { ApiError, ApiErrorType } from '@/services/base';
import TagList from '@/components/tag-list';
import i18nInstance from '@/utils/i18n';

const { Text, Title } = Typography;

interface ServiceTableProps {
  memberClusterName: string;
  labelTagNum?: number;
  selectedWorkSpace: string;
  searchText: string;
  onViewServiceContent: (r: ServiceResource) => void;
  onEditServiceContent: (r: ServiceResource) => void;
  onDeleteServiceContent: (r: ServiceResource) => void;
}

// Service detail drawer component for enhanced information display
const ServiceDetailDrawer: FC<{
  visible: boolean;
  onClose: () => void;
  service: ServiceResource | null;
  memberClusterName: string;
}> = ({ visible, onClose, service, memberClusterName }) => {
  const { data: serviceDetail, isLoading: detailLoading, error: detailError } = useResourceDetailQuery(
    'service',
    {
      memberClusterName,
      namespace: service?.objectMeta?.namespace || '',
      name: service?.objectMeta?.name || '',
    },
    GetMemberClusterServiceDetail,
    {
      enabled: visible && !!service,
    }
  );

  if (!service) return null;

  const renderServicePorts = (ports: any[] = []) => (
    <Space size={4} wrap>
      {ports.map((port, index) => (
        <Tag key={index} color="blue">
          {port.name && `${port.name}:`}
          {port.port}
          {port.nodePort && `/${port.nodePort}`}
          /{port.protocol}
          {port.targetPort && port.targetPort !== port.port && ` → ${port.targetPort}`}
        </Tag>
      ))}
    </Space>
  );

  const renderEndpoints = (endpoints: any[] = []) => (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      {endpoints.map((endpoint, index) => (
        <div key={index}>
          <Text strong>{endpoint.host}</Text>
          {endpoint.ports && (
            <div style={{ marginLeft: 16 }}>
              <Space size={4} wrap>
                {endpoint.ports.map((port: any, portIndex: number) => (
                  <Tag key={portIndex} color={endpoint.ready ? 'green' : 'red'}>
                    {port.port}/{port.protocol}
                  </Tag>
                ))}
              </Space>
            </div>
          )}
        </div>
      ))}
    </Space>
  );

  return (
    <Drawer
      title={
        <Space>
          <InfoCircleOutlined />
          Service Details: {service.objectMeta?.name}
        </Space>
      }
      width={600}
      open={visible}
      onClose={onClose}
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={() => window.location.reload()}
          size="small"
        >
          Refresh
        </Button>
      }
    >
      {detailError && (
        <Alert
          message="Failed to load service details"
          description={detailError instanceof ApiError ? detailError.message : 'Unknown error occurred'}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Descriptions column={1} bordered size="small" loading={detailLoading}>
        <Descriptions.Item label="Name">
          {service.objectMeta?.name}
        </Descriptions.Item>
        <Descriptions.Item label="Namespace">
          {service.objectMeta?.namespace}
        </Descriptions.Item>
        <Descriptions.Item label="Type">
          <Tag color={getServiceTypeColor(service.spec?.type || 'ClusterIP')}>
            {service.spec?.type || 'ClusterIP'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Cluster IP">
          {service.spec?.clusterIP || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="External IPs">
          {service.spec?.externalIPs?.length ? (
            <Space size={4} wrap>
              {service.spec.externalIPs.map((ip, index) => (
                <Tag key={index} color="green">{ip}</Tag>
              ))}
            </Space>
          ) : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Load Balancer IP">
          {service.spec?.loadBalancerIP ? (
            <Tag color="blue">{service.spec.loadBalancerIP}</Tag>
          ) : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Session Affinity">
          {service.spec?.sessionAffinity || 'None'}
        </Descriptions.Item>
        <Descriptions.Item label="Ports">
          {renderServicePorts(service.spec?.ports)}
        </Descriptions.Item>
        <Descriptions.Item label="Selector">
          {service.spec?.selector ? (
            <Space size={4} wrap>
              {Object.entries(service.spec.selector).map(([key, value]) => (
                <Tag key={key} color="purple">{key}={value}</Tag>
              ))}
            </Space>
          ) : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Endpoints">
          {serviceDetail?.data?.endpoints ? (
            renderEndpoints(serviceDetail.data.endpoints)
          ) : detailLoading ? (
            'Loading endpoints...'
          ) : (
            'No endpoints available'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Labels">
          {formatLabels(service.objectMeta?.labels)}
        </Descriptions.Item>
        <Descriptions.Item label="Annotations">
          {service.objectMeta?.annotations ? (
            <Space size={4} wrap>
              {Object.entries(service.objectMeta.annotations).slice(0, 3).map(([key, value]) => (
                <Tooltip key={key} title={`${key}: ${value}`}>
                  <Tag>{key}</Tag>
                </Tooltip>
              ))}
              {Object.keys(service.objectMeta.annotations).length > 3 && (
                <Tag>+{Object.keys(service.objectMeta.annotations).length - 3} more</Tag>
              )}
            </Space>
          ) : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Created">
          {formatAge(service.objectMeta?.creationTimestamp || '')}
        </Descriptions.Item>
      </Descriptions>
    </Drawer>
  );
};

const ServiceTable: FC<ServiceTableProps> = (props) => {
  const {
    memberClusterName,
    labelTagNum,
    selectedWorkSpace,
    searchText,
    onViewServiceContent,
    onEditServiceContent,
    onDeleteServiceContent,
  } = props;

  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceResource | null>(null);

  // Enhanced query with better error handling and loading states
  const { data, isLoading, error, refetch } = useResourceQuery(
    'service',
    {
      memberClusterName,
      namespace: selectedWorkSpace || undefined,
      keyword: searchText || undefined,
    },
    GetMemberClusterServices,
    {
      select: (response) => response.data || { services: [], listMeta: { totalItems: 0 } },
      retry: (failureCount, error) => {
        // Don't retry authentication or authorization errors
        if (error instanceof ApiError) {
          if (error.type === ApiErrorType.AuthenticationError || 
              error.type === ApiErrorType.AuthorizationError) {
            return false;
          }
        }
        return failureCount < 3;
      },
    }
  );

  // Utility function to get service type color
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

  // Enhanced view handler with detail drawer
  const handleViewService = (service: ServiceResource) => {
    setSelectedService(service);
    setDetailDrawerVisible(true);
    onViewServiceContent(service);
  };

  // Enhanced error display
  const renderErrorAlert = () => {
    if (!error) return null;

    let errorMessage = 'Failed to load services';
    let errorDescription = 'An unknown error occurred';

    if (error instanceof ApiError) {
      errorMessage = `Failed to load services: ${error.message}`;
      errorDescription = error.details || error.message;
    } else if (error instanceof Error) {
      errorDescription = error.message;
    }

    return (
      <Alert
        message={errorMessage}
        description={errorDescription}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={() => refetch()}>
            Retry
          </Button>
        }
        style={{ marginBottom: 16 }}
      />
    );
  };

  const columns: TableColumnProps<ServiceResource>[] = [
    {
      title: i18nInstance.t('a4b28a416f0b6f3c215c51e79e517298', '命名空间'),
      key: 'namespaceName',
      width: 200,
      render: (_, r) => {
        return r.objectMeta?.namespace || '-';
      },
    },
    {
      title: i18nInstance.t('8f3747c057d893862fbe4b7980e9b451', '服务名称'),
      key: 'serviceName',
      width: 300,
      render: (_, r) => {
        return (
          <Space>
            <Text strong>{r.objectMeta?.name || '-'}</Text>
            {r.spec?.selector && Object.keys(r.spec.selector).length > 0 && (
              <Tooltip title="Has selector">
                <Tag color="blue" size="small">Selector</Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Type',
      key: 'serviceType',
      width: 120,
      render: (_, r) => {
        const type = r.spec?.type || 'ClusterIP';
        const color = getServiceTypeColor(type);
        return <Tag color={color}>{type}</Tag>;
      },
    },
    {
      title: 'Cluster IP',
      key: 'clusterIP',
      width: 150,
      render: (_, r) => {
        const clusterIP = r.spec?.clusterIP;
        if (!clusterIP || clusterIP === 'None') return '-';
        return (
          <Tooltip title="Cluster IP">
            <Tag color="blue">{clusterIP}</Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'External IP',
      key: 'externalIP',
      width: 150,
      render: (_, r) => {
        const externalIPs = r.spec?.externalIPs || [];
        const loadBalancerIP = r.spec?.loadBalancerIP;
        
        if (loadBalancerIP) {
          return (
            <Tooltip title="Load Balancer IP">
              <Tag color="orange">{loadBalancerIP}</Tag>
            </Tooltip>
          );
        }
        
        if (externalIPs.length > 0) {
          return (
            <Space size={4} wrap>
              {externalIPs.slice(0, 2).map((ip, index) => (
                <Tooltip key={index} title="External IP">
                  <Tag color="green">{ip}</Tag>
                </Tooltip>
              ))}
              {externalIPs.length > 2 && (
                <Tooltip title={`${externalIPs.length - 2} more external IPs`}>
                  <Tag>+{externalIPs.length - 2}</Tag>
                </Tooltip>
              )}
            </Space>
          );
        }
        
        return '-';
      },
    },
    {
      title: 'Ports',
      key: 'ports',
      width: 200,
      render: (_, r) => {
        const ports = r.spec?.ports || [];
        if (ports.length === 0) return '-';
        
        return (
          <Space size={4} wrap>
            {ports.slice(0, 2).map((port, index) => (
              <Tooltip 
                key={index} 
                title={`${port.name ? `${port.name}: ` : ''}Port ${port.port}${port.nodePort ? ` (NodePort: ${port.nodePort})` : ''} → ${port.targetPort} (${port.protocol})`}
              >
                <Tag color="blue">
                  {port.port}
                  {port.nodePort && `/${port.nodePort}`}
                  /{port.protocol}
                </Tag>
              </Tooltip>
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
      title: i18nInstance.t('1f7be0a924280cd098db93c9d81ecccd', '标签信息'),
      key: 'labelName',
      align: 'left',
      width: '20%',
      render: (_, r) => {
        return formatLabels(r.objectMeta?.labels, labelTagNum);
      },
    },
    {
      title: 'Age',
      key: 'age',
      width: 100,
      render: (_, r) => {
        return formatAge(r.objectMeta?.creationTimestamp || '');
      },
    },
    {
      title: i18nInstance.t('2b6bc0f293f5ca01b006206c2535ccbc', '操作'),
      key: 'op',
      width: 200,
      render: (_, r) => {
        return (
          <Space.Compact>
            <Tooltip title={i18nInstance.t('607e7a4f377fa66b0b28ce318aab841f', '查看')}>
              <Button
                size={'small'}
                type="text"
                icon={<EyeOutlined />}
                onClick={() => handleViewService(r)}
              />
            </Tooltip>
            <Tooltip title={i18nInstance.t('95b351c86267f3aedf89520959bce689', '编辑')}>
              <Button
                size={'small'}
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEditServiceContent(r)}
              />
            </Tooltip>
            <Popconfirm
              placement="topRight"
              title={i18nInstance.t('6163856192e115e6b914d6fb8c4fd82c', {
                name: r.objectMeta?.name || 'this service',
              })}
              onConfirm={() => {
                onDeleteServiceContent(r);
              }}
              okText={i18nInstance.t(
                'e83a256e4f5bb4ff8b3d804b5473217a',
                '确认',
              )}
              cancelText={i18nInstance.t('625fb26b4b3340f7872b411f401e754c', '取消')}
            >
              <Tooltip title={i18nInstance.t('2f4aaddde33c9b93c36fd2503f3d122b', '删除')}>
                <Button size={'small'} type="text" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </Space.Compact>
        );
      },
    },
  ];

  return (
    <div>
      {renderErrorAlert()}
      <Table
        rowKey={(r: ServiceResource) =>
          `${r.objectMeta?.namespace}-${r.objectMeta?.name}` || ''
        }
        columns={columns}
        loading={isLoading}
        dataSource={data?.services || []}
        pagination={{
          total: data?.listMeta?.totalItems || 0,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} services`,
        }}
        scroll={{ x: 'max-content' }}
      />
      <ServiceDetailDrawer
        visible={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        service={selectedService}
        memberClusterName={memberClusterName}
      />
    </div>
  );
};

// Utility function to get service type color (moved outside component for reuse)
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

export default ServiceTable;
