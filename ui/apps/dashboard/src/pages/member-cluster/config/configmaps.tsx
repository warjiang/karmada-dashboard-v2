import { Table, Tag, Button, Space, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, DatabaseOutlined } from '@ant-design/icons';
import { useMemberClusterContext } from '../hooks';

export default function MemberClusterConfigMaps() {
  const { memberClusterName } = useMemberClusterContext();

  // Mock data for demonstration
  const mockConfigMaps = [
    {
      name: 'app-config',
      namespace: 'default',
      dataKeys: ['config.yaml', 'app.properties'],
      age: '7d',
      size: '2.5 KiB',
      mountedPods: 3,
      labels: 'app=webapp,environment=prod'
    },
    {
      name: 'database-config',
      namespace: 'production',
      dataKeys: ['database.conf', 'init.sql'],
      age: '15d',
      size: '1.8 KiB',
      mountedPods: 1,
      labels: 'app=postgres,tier=database'
    },
    {
      name: 'nginx-config',
      namespace: 'default',
      dataKeys: ['nginx.conf', 'mime.types', 'ssl.conf'],
      age: '3d',
      size: '4.2 KiB',
      mountedPods: 2,
      labels: 'app=nginx,component=webserver'
    },
    {
      name: 'logging-config',
      namespace: 'monitoring',
      dataKeys: ['fluentd.conf'],
      age: '10d',
      size: '0.9 KiB',
      mountedPods: 5,
      labels: 'app=fluentd,component=logging'
    },
    {
      name: 'redis-config',
      namespace: 'cache',
      dataKeys: ['redis.conf'],
      age: '20d',
      size: '1.2 KiB',
      mountedPods: 1,
      labels: 'app=redis,tier=cache'
    },
    {
      name: 'env-config',
      namespace: 'staging',
      dataKeys: ['env.properties', 'features.json', 'endpoints.yaml'],
      age: '5d',
      size: '3.1 KiB',
      mountedPods: 0,
      labels: 'environment=staging,type=config'
    }
  ];

  const formatDataKeys = (keys: string[]) => {
    if (keys.length === 1) {
      return (
        <div className="flex items-center gap-1">
          <FileTextOutlined className="text-blue-500" />
          <code className="text-xs">{keys[0]}</code>
        </div>
      );
    }
    
    return (
      <Tooltip title={keys.join(', ')}>
        <div className="flex items-center gap-1">
          <FileTextOutlined className="text-blue-500" />
          <code className="text-xs">{keys[0]}</code>
          {keys.length > 1 && (
            <Tag  color="blue">+{keys.length - 1}</Tag>
          )}
        </div>
      </Tooltip>
    );
  };

  const getMountedPodsTag = (pods: number) => {
    if (pods === 0) {
      return <Tag color="default">Not mounted</Tag>;
    }
    return <Tag color="green" icon={<DatabaseOutlined />}>{pods} pods</Tag>;
  };

  const formatLabels = (labels: string) => {
    const labelPairs = labels.split(',');
    const firstLabel = labelPairs[0];
    const remainingCount = labelPairs.length - 1;
    
    if (labelPairs.length === 1) {
      return <Tag color="geekblue" className="text-xs">{firstLabel}</Tag>;
    }
    
    return (
      <Tooltip title={labels}>
        <div className="flex items-center gap-1">
          <Tag color="geekblue" className="text-xs">{firstLabel}</Tag>
          {remainingCount > 0 && (
            <Tag  color="purple">+{remainingCount}</Tag>
          )}
        </div>
      </Tooltip>
    );
  };

  const formatSize = (size: string) => {
    return <code className="text-xs">{size}</code>;
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <strong>{name}</strong>
    },
    {
      title: 'Namespace',
      dataIndex: 'namespace',
      key: 'namespace'
    },
    {
      title: 'Data Keys',
      dataIndex: 'dataKeys',
      key: 'dataKeys',
      render: (keys: string[]) => formatDataKeys(keys)
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (size: string) => formatSize(size)
    },
    {
      title: 'Mounted',
      dataIndex: 'mountedPods',
      key: 'mountedPods',
      render: (pods: number) => getMountedPodsTag(pods)
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
      render: () => (
        <Space>
          <Button icon={<EyeOutlined />}  title="View ConfigMap data">
            View
          </Button>
          <Button icon={<EditOutlined />}  title="Edit ConfigMap">
            Edit
          </Button>
          <Button icon={<DeleteOutlined />}  danger title="Delete ConfigMap">
            Delete
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">
        ConfigMaps in Member Cluster: {memberClusterName}
      </h2>
      <div className="mb-4 text-sm text-gray-600">
        View and manage Kubernetes ConfigMaps in the "{memberClusterName}" cluster. ConfigMaps store non-confidential configuration data.
      </div>
      
      <Table
        columns={columns}
        dataSource={mockConfigMaps}
        rowKey="name"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} configmaps`
        }}
      />
      
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This is a placeholder implementation. The member cluster name "{memberClusterName}" 
          is successfully passed from the parent route and can be used for API calls to fetch cluster-specific ConfigMaps.
          <br />
          <strong>Usage:</strong> ConfigMaps can be mounted as volumes or exposed as environment variables in pods.
        </p>
      </div>
    </div>
  );
}