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

import React, { FC, useState } from 'react';
import { Button, Popconfirm, Space, Table, TableColumnProps, Tag, Tooltip, Alert, Drawer, Descriptions, Typography } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined, ReloadOutlined, SecurityScanOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { GetMemberClusterIngress, GetMemberClusterIngressDetail, IngressResource } from '@/services/member-cluster/service';
import { formatAge, formatLabels } from '@/components/common/ResourceList';
import { useResourceQuery, useResourceDetailQuery } from '@/hooks/useResourceQuery';
import { ApiError, ApiErrorType } from '@/services/base';
import i18nInstance from '@/utils/i18n';

const { Text, Title } = Typography;

interface IngressTableProps {
  memberClusterName: string;
  labelTagNum?: number;
  selectedWorkSpace: string;
  searchText: string;
  onViewIngressContent: (r: IngressResource) => void;
  onEditIngressContent: (r: IngressResource) => void;
  onDeleteIngressContent: (r: IngressResource) => void;
}

// Ingress detail drawer component for enhanced information display
const IngressDetailDrawer: FC<{
  visible: boolean;
  onClose: () => void;
  ingress: IngressResource | null;
  memberClusterName: string;
}> = ({ visible, onClose, ingress, memberClusterName }) => {
  const { data: ingressDetail, isLoading: detailLoading, error: detailError } = useResourceDetailQuery(
    'ingress',
    {
      memberClusterName,
      namespace: ingress?.objectMeta?.namespace || '',
      name: ingress?.objectMeta?.name || '',
    },
    GetMemberClusterIngressDetail,
    {
      enabled: visible && !!ingress,
    }
  );

  if (!ingress) return null;

  const renderIngressRules = (rules: any[] = []) => (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      {rules.map((rule, index) => (
        <div key={index} style={{ border: '1px solid #f0f0f0', padding: 8, borderRadius: 4 }}>
          <div>
            <Text strong>Host: </Text>
            <Tag color="blue">{rule.host || '*'}</Tag>
          </div>
          {rule.http?.paths && (
            <div style={{ marginTop: 8 }}>
              <Text strong>Paths:</Text>
              <div style={{ marginLeft: 16, marginTop: 4 }}>
                {rule.http.paths.map((path: any, pathIndex: number) => (
                  <div key={pathIndex} style={{ marginBottom: 4 }}>
                    <Space>
                      <Tag color="green">{path.path || '/'}</Tag>
                      <Tag color="orange">{path.pathType}</Tag>
                      <Text>→</Text>
                      <Tag color="purple">
                        {path.backend?.service?.name}
                        {path.backend?.service?.port?.number && `:${path.backend.service.port.number}`}
                        {path.backend?.service?.port?.name && `:${path.backend.service.port.name}`}
                      </Tag>
                    </Space>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </Space>
  );

  const renderTLSConfiguration = (tls: any[] = []) => (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      {tls.map((tlsConfig, index) => (
        <div key={index} style={{ border: '1px solid #f0f0f0', padding: 8, borderRadius: 4 }}>
          <div>
            <Text strong>Secret: </Text>
            <Tag color="red">{tlsConfig.secretName}</Tag>
          </div>
          {tlsConfig.hosts && (
            <div style={{ marginTop: 4 }}>
              <Text strong>Hosts: </Text>
              <Space size={4} wrap>
                {tlsConfig.hosts.map((host: string, hostIndex: number) => (
                  <Tag key={hostIndex} color="blue">{host}</Tag>
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
          Ingress Details: {ingress.objectMeta?.name}
        </Space>
      }
      width={700}
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
          message="Failed to load ingress details"
          description={detailError instanceof ApiError ? detailError.message : 'Unknown error occurred'}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Descriptions column={1} bordered size="small" loading={detailLoading}>
        <Descriptions.Item label="Name">
          {ingress.objectMeta?.name}
        </Descriptions.Item>
        <Descriptions.Item label="Namespace">
          {ingress.objectMeta?.namespace}
        </Descriptions.Item>
        <Descriptions.Item label="Ingress Class">
          {ingress.spec?.ingressClassName ? (
            <Tag color="blue">{ingress.spec.ingressClassName}</Tag>
          ) : (
            <Tag color="default">Default</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Default Backend">
          {ingress.spec?.defaultBackend ? (
            <Tag color="purple">
              {ingress.spec.defaultBackend.service?.name}
              {ingress.spec.defaultBackend.service?.port?.number && 
                `:${ingress.spec.defaultBackend.service.port.number}`}
            </Tag>
          ) : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Rules">
          {ingress.spec?.rules?.length ? (
            renderIngressRules(ingress.spec.rules)
          ) : (
            'No rules configured'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="TLS Configuration">
          {ingress.spec?.tls?.length ? (
            <Space>
              <SecurityScanOutlined style={{ color: '#52c41a' }} />
              {renderTLSConfiguration(ingress.spec.tls)}
            </Space>
          ) : (
            <Space>
              <Tag color="default">No TLS</Tag>
            </Space>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Load Balancer Status">
          {ingressDetail?.data?.status?.loadBalancer?.ingress?.length ? (
            <Space direction="vertical" size="small">
              {ingressDetail.data.status.loadBalancer.ingress.map((lb: any, index: number) => (
                <div key={index}>
                  {lb.ip && <Tag color="green">IP: {lb.ip}</Tag>}
                  {lb.hostname && <Tag color="blue">Host: {lb.hostname}</Tag>}
                </div>
              ))}
            </Space>
          ) : (
            'Pending'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Labels">
          {formatLabels(ingress.objectMeta?.labels)}
        </Descriptions.Item>
        <Descriptions.Item label="Annotations">
          {ingress.objectMeta?.annotations ? (
            <Space size={4} wrap>
              {Object.entries(ingress.objectMeta.annotations).slice(0, 3).map(([key, value]) => (
                <Tooltip key={key} title={`${key}: ${value}`}>
                  <Tag>{key}</Tag>
                </Tooltip>
              ))}
              {Object.keys(ingress.objectMeta.annotations).length > 3 && (
                <Tag>+{Object.keys(ingress.objectMeta.annotations).length - 3} more</Tag>
              )}
            </Space>
          ) : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Created">
          {formatAge(ingress.objectMeta?.creationTimestamp || '')}
        </Descriptions.Item>
      </Descriptions>
    </Drawer>
  );
};

const IngressTable: FC<IngressTableProps> = (props) => {
  const {
    memberClusterName,
    labelTagNum,
    selectedWorkSpace,
    searchText,
    onViewIngressContent,
    onEditIngressContent,
    onDeleteIngressContent,
  } = props;

  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedIngress, setSelectedIngress] = useState<IngressResource | null>(null);

  // Enhanced query with better error handling and loading states
  const { data, isLoading, error, refetch } = useResourceQuery(
    'ingress',
    {
      memberClusterName,
      namespace: selectedWorkSpace || undefined,
      keyword: searchText || undefined,
    },
    GetMemberClusterIngress,
    {
      select: (response) => response.data || { items: [], listMeta: { totalItems: 0 } },
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

  // Enhanced view handler with detail drawer
  const handleViewIngress = (ingress: IngressResource) => {
    setSelectedIngress(ingress);
    setDetailDrawerVisible(true);
    onViewIngressContent(ingress);
  };

  // Enhanced error display
  const renderErrorAlert = () => {
    if (!error) return null;

    let errorMessage = 'Failed to load ingresses';
    let errorDescription = 'An unknown error occurred';

    if (error instanceof ApiError) {
      errorMessage = `Failed to load ingresses: ${error.message}`;
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

  const columns: TableColumnProps<IngressResource>[] = [
    {
      title: i18nInstance.t('a4b28a416f0b6f3c215c51e79e517298', '命名空间'),
      key: 'namespaceName',
      width: 200,
      render: (_, r) => {
        return r.objectMeta?.namespace || '-';
      },
    },
    {
      title: i18nInstance.t('d7ec2d3fea4756bc1642e0f10c180cf5', '名称'),
      key: 'ingressName',
      width: 300,
      render: (_, r) => {
        return (
          <Space>
            <Text strong>{r.objectMeta?.name || '-'}</Text>
            {r.spec?.tls && r.spec.tls.length > 0 && (
              <Tooltip title="TLS Enabled">
                <SecurityScanOutlined style={{ color: '#52c41a' }} />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Class',
      key: 'ingressClass',
      width: 120,
      render: (_, r) => {
        const className = r.spec?.ingressClassName;
        return className ? (
          <Tag color="blue">{className}</Tag>
        ) : (
          <Tag color="default">Default</Tag>
        );
      },
    },
    {
      title: 'Hosts',
      key: 'hosts',
      width: 200,
      render: (_, r) => {
        const rules = r.spec?.rules || [];
        const hosts = rules.map(rule => rule.host).filter(Boolean);
        
        if (hosts.length === 0) {
          return <Tag color="default">*</Tag>;
        }
        
        return (
          <Space size={4} wrap>
            {hosts.slice(0, 2).map((host, index) => (
              <Tooltip key={index} title={`Host: ${host}`}>
                <Tag color="blue">{host}</Tag>
              </Tooltip>
            ))}
            {hosts.length > 2 && (
              <Tooltip title={`${hosts.length - 2} more hosts: ${hosts.slice(2).join(', ')}`}>
                <Tag>+{hosts.length - 2}</Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Paths',
      key: 'paths',
      width: 100,
      render: (_, r) => {
        const rules = r.spec?.rules || [];
        const pathCount = rules.reduce((total, rule) => 
          total + (rule.http?.paths?.length || 0), 0
        );
        
        return pathCount > 0 ? (
          <Tooltip title={`${pathCount} path${pathCount > 1 ? 's' : ''} configured`}>
            <Tag color="green">{pathCount}</Tag>
          </Tooltip>
        ) : (
          <Tag color="default">0</Tag>
        );
      },
    },
    {
      title: 'TLS',
      key: 'tls',
      width: 80,
      render: (_, r) => {
        const tlsCount = r.spec?.tls?.length || 0;
        return tlsCount > 0 ? (
          <Tooltip title={`${tlsCount} TLS configuration${tlsCount > 1 ? 's' : ''}`}>
            <Tag color="green" icon={<SecurityScanOutlined />}>
              {tlsCount}
            </Tag>
          </Tooltip>
        ) : (
          <Tag color="default">0</Tag>
        );
      },
    },
    {
      title: 'Backends',
      key: 'backends',
      width: 120,
      render: (_, r) => {
        const rules = r.spec?.rules || [];
        const backends = new Set<string>();
        
        // Collect unique backend services
        rules.forEach(rule => {
          rule.http?.paths?.forEach(path => {
            if (path.backend?.service?.name) {
              backends.add(path.backend.service.name);
            }
          });
        });

        // Add default backend if exists
        if (r.spec?.defaultBackend?.service?.name) {
          backends.add(r.spec.defaultBackend.service.name);
        }

        const backendArray = Array.from(backends);
        
        if (backendArray.length === 0) {
          return <Tag color="default">None</Tag>;
        }

        return (
          <Space size={4} wrap>
            {backendArray.slice(0, 2).map((backend, index) => (
              <Tooltip key={index} title={`Backend service: ${backend}`}>
                <Tag color="purple">{backend}</Tag>
              </Tooltip>
            ))}
            {backendArray.length > 2 && (
              <Tooltip title={`${backendArray.length - 2} more backends: ${backendArray.slice(2).join(', ')}`}>
                <Tag>+{backendArray.length - 2}</Tag>
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
                onClick={() => handleViewIngress(r)}
              />
            </Tooltip>
            <Tooltip title={i18nInstance.t('95b351c86267f3aedf89520959bce689', '编辑')}>
              <Button
                size={'small'}
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEditIngressContent(r)}
              />
            </Tooltip>
            <Popconfirm
              placement="topRight"
              title={i18nInstance.t('6163856192e115e6b914d6fb8c4fd82c', {
                name: r.objectMeta?.name || 'this ingress',
              })}
              onConfirm={() => {
                onDeleteIngressContent(r);
              }}
              okText={i18nInstance.t(
                'e83a256e4f5bb4ff8b3d804b5473217a',
                '确认',
              )}
              cancelText={i18nInstance.t(
                '625fb26b4b3340f7872b411f401e754c',
                '取消',
              )}
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
        rowKey={(r: IngressResource) =>
          `${r.objectMeta?.namespace}-${r.objectMeta?.name}` || ''
        }
        columns={columns}
        loading={isLoading}
        dataSource={data?.items || []}
        pagination={{
          total: data?.listMeta?.totalItems || 0,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} ingresses`,
        }}
        scroll={{ x: 'max-content' }}
      />
      <IngressDetailDrawer
        visible={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        ingress={selectedIngress}
        memberClusterName={memberClusterName}
      />
    </div>
  );
};

export default IngressTable;
