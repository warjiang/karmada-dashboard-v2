import { Table, Tag, Button, Space, Progress } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, FolderOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useMemberClusterContext } from '../hooks';

export default function MemberClusterNamespaces() {
  const { memberClusterName } = useMemberClusterContext();

  const mockNamespaces = [
    {
      name: 'default',
      status: 'Active',
      age: '45d',
      labels: '',
      resourceQuota: true,
      pods: { current: 12, limit: 50 },
      services: { current: 8, limit: 20 },
      secrets: { current: 5, limit: 10 },
      configMaps: { current: 3, limit: 15 }
    },
    {
      name: 'kube-system',
      status: 'Active',
      age: '45d',
      labels: 'kubernetes.io/metadata.name=kube-system',
      resourceQuota: false,
      pods: { current: 25, limit: null },
      services: { current: 10, limit: null },
      secrets: { current: 12, limit: null },
      configMaps: { current: 8, limit: null }
    },
    {
      name: 'production',
      status: 'Active',
      age: '30d',
      labels: 'environment=production,tier=backend',
      resourceQuota: true,
      pods: { current: 45, limit: 100 },
      services: { current: 15, limit: 30 },
      secrets: { current: 8, limit: 20 },
      configMaps: { current: 12, limit: 25 }
    },
    {
      name: 'monitoring',
      status: 'Active',
      age: '20d',
      labels: 'app=monitoring,component=observability',
      resourceQuota: true,
      pods: { current: 8, limit: 20 },
      services: { current: 5, limit: 10 },
      secrets: { current: 3, limit: 8 },
      configMaps: { current: 4, limit: 10 }
    },
    {
      name: 'staging',
      status: 'Terminating',
      age: '15d',
      labels: 'environment=staging',
      resourceQuota: true,
      pods: { current: 2, limit: 20 },
      services: { current: 1, limit: 10 },
      secrets: { current: 1, limit: 5 },
      configMaps: { current: 0, limit: 5 }
    }
  ];

  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      'Active': { color: 'success', icon: <FolderOutlined /> },
      'Terminating': { color: 'error', icon: <ExclamationCircleOutlined /> }
    };

    const config = statusConfig[status] || { color: 'default', icon: <FolderOutlined /> };
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {status}
      </Tag>
    );
  };

  const getResourceQuotaTag = (hasQuota: boolean) => {
    return hasQuota ? 
      <Tag color="blue">Enabled</Tag> : 
      <Tag color="default">Disabled</Tag>;
  };

  const getResourceUsage = (current: number, limit: number | null, resourceType: string) => {
    if (limit === null) {
      return <span className="text-sm">{current}</span>;
    }

    const percent = Math.round((current / limit) * 100);
    const status = percent >= 90 ? 'exception' : percent >= 70 ? 'active' : 'success';

    return (
      <div className="flex items-center gap-2">
        <Progress
          percent={percent}
          size="small"
          status={status}
          showInfo={false}
          style={{ width: 60 }}
        />
        <span className="text-xs">{current}/{limit}</span>
      </div>
    );
  };

  const formatLabels = (labels: string) => {
    if (!labels) {
      return <span className="text-gray-400">None</span>;
    }

    const labelPairs = labels.split(',');
    const firstLabel = labelPairs[0];
    
    if (labelPairs.length === 1) {
      return <Tag color="geekblue" className="text-xs">{firstLabel}</Tag>;
    }
    
    return (
      <div className="flex items-center gap-1">
        <Tag color="geekblue" className="text-xs">{firstLabel}</Tag>
        <Tag size="small" color="purple">+{labelPairs.length - 1}</Tag>
      </div>
    );
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <strong>{name}</strong>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status)
    },
    {
      title: 'Resource Quota',
      dataIndex: 'resourceQuota',
      key: 'resourceQuota',
      render: (hasQuota: boolean) => getResourceQuotaTag(hasQuota)
    },
    {
      title: 'Pods',
      key: 'pods',
      render: (record: any) => getResourceUsage(record.pods.current, record.pods.limit, 'pods')
    },
    {
      title: 'Services',
      key: 'services',
      render: (record: any) => getResourceUsage(record.services.current, record.services.limit, 'services')
    },
    {
      title: 'Secrets',
      key: 'secrets',
      render: (record: any) => getResourceUsage(record.secrets.current, record.secrets.limit, 'secrets')
    },
    {
      title: 'ConfigMaps',
      key: 'configMaps',
      render: (record: any) => getResourceUsage(record.configMaps.current, record.configMaps.limit, 'configMaps')
    },
    {
      title: 'Labels',
      dataIndex: 'labels',
      key: 'labels',
      render: (labels: string) => formatLabels(labels)
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" title="View namespace details">
            View
          </Button>
          <Button icon={<EditOutlined />} size="small" title="Edit namespace">
            Edit
          </Button>
          <Button 
            icon={<DeleteOutlined />} 
            size="small" 
            danger 
            title="Delete namespace"
            disabled={record.name === 'default' || record.name === 'kube-system'}
          >
            Delete
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">
        Namespaces in Member Cluster: {memberClusterName}
      </h2>
      <div className="mb-4 text-sm text-gray-600">
        View and manage Kubernetes Namespaces in the "{memberClusterName}" cluster. Namespaces provide resource isolation and organization.
      </div>
      
      <Table
        columns={columns}
        dataSource={mockNamespaces}
        rowKey="name"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} namespaces`
        }}
        scroll={{ x: 1000 }}
      />
      
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> System namespaces (default, kube-system) cannot be deleted. The member cluster name "{memberClusterName}" 
          is successfully passed from the parent route and can be used for API calls to fetch cluster-specific Namespaces.
          <br />
          <strong>Resource Quotas:</strong> When enabled, limit resource consumption within the namespace
        </p>
      </div>
    </div>
  );
}