import React from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Table, Button, Space, Tag, Tooltip, message } from 'antd';
import { 
  EyeOutlined, 
  EditOutlined, 
  DeleteOutlined,
  ReloadOutlined,
  PlusOutlined 
} from '@ant-design/icons';
import { GetMemberClusterStatefulSets } from '@/services/member-cluster/workload';
import { formatAge } from '@/components/common/ResourceList';
import type { ColumnsType } from 'antd/es/table';

interface StatefulSetItem {
  objectMeta: {
    name: string;
    namespace: string;
    creationTimestamp: string;
    labels?: Record<string, string>;
  };
  status: {
    replicas: number;
    readyReplicas: number;
    currentReplicas: number;
  };
  spec: {
    replicas: number;
    serviceName: string;
  };
}

interface MemberClusterContext {
  memberClusterName: string;
}

export default function MemberClusterStatefulSets() {
  const params = useParams<{ memberCluster: string }>();
  const context = useOutletContext<MemberClusterContext>();
  const memberClusterName = params.memberCluster || context?.memberClusterName || '';

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['member-cluster-statefulsets', memberClusterName],
    queryFn: () => GetMemberClusterStatefulSets({
      memberClusterName,
      itemsPerPage: 50,
      page: 1
    }),
    enabled: !!memberClusterName,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const handleRefresh = () => {
    refetch();
    message.success('StatefulSets refreshed');
  };

  const handleView = (record: StatefulSetItem) => {
    // TODO: Implement view functionality
    message.info(`View StatefulSet: ${record.objectMeta.name}`);
  };

  const handleEdit = (record: StatefulSetItem) => {
    // TODO: Implement edit functionality
    message.info(`Edit StatefulSet: ${record.objectMeta.name}`);
  };

  const handleDelete = (record: StatefulSetItem) => {
    // TODO: Implement delete functionality
    message.info(`Delete StatefulSet: ${record.objectMeta.name}`);
  };

  const columns: ColumnsType<StatefulSetItem> = [
    {
      title: 'Name',
      dataIndex: ['objectMeta', 'name'],
      key: 'name',
      sorter: (a, b) => a.objectMeta.name.localeCompare(b.objectMeta.name),
    },
    {
      title: 'Namespace',
      dataIndex: ['objectMeta', 'namespace'],
      key: 'namespace',
      sorter: (a, b) => a.objectMeta.namespace.localeCompare(b.objectMeta.namespace),
    },
    {
      title: 'Ready',
      key: 'ready',
      render: (_, record) => {
        const ready = record.status?.readyReplicas || 0;
        const desired = record.spec?.replicas || 0;
        const isReady = ready === desired && desired > 0;
        
        return (
          <Tag color={isReady ? 'green' : ready > 0 ? 'orange' : 'red'}>
            {ready}/{desired}
          </Tag>
        );
      },
      sorter: (a, b) => {
        const aReady = (a.status?.readyReplicas || 0) / (a.spec?.replicas || 1);
        const bReady = (b.status?.readyReplicas || 0) / (b.spec?.replicas || 1);
        return aReady - bReady;
      },
    },
    {
      title: 'Current',
      dataIndex: ['status', 'currentReplicas'],
      key: 'current',
      render: (current) => current || 0,
      sorter: (a, b) => (a.status?.currentReplicas || 0) - (b.status?.currentReplicas || 0),
    },
    {
      title: 'Service Name',
      dataIndex: ['spec', 'serviceName'],
      key: 'serviceName',
      render: (serviceName) => serviceName || '-',
    },
    {
      title: 'Age',
      key: 'age',
      render: (_, record) => formatAge(record.objectMeta.creationTimestamp),
      sorter: (a, b) => 
        new Date(a.objectMeta.creationTimestamp).getTime() - 
        new Date(b.objectMeta.creationTimestamp).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">Failed to load StatefulSets</p>
          <Button onClick={handleRefresh} icon={<ReloadOutlined />}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const statefulsets = data?.statefulSets || [];

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">StatefulSets</h2>
            <p className="text-gray-600 text-sm">
              Manage StatefulSets in member cluster: {memberClusterName}
            </p>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={isLoading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => message.info('Create StatefulSet functionality coming soon')}
            >
              Create StatefulSet
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={statefulsets}
          loading={isLoading}
          rowKey={(record) => `${record.objectMeta.namespace}-${record.objectMeta.name}`}
          pagination={{
            total: data?.listMeta?.totalItems || 0,
            pageSize: 50,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} StatefulSets`,
          }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
}