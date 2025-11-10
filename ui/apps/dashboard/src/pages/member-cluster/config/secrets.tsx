import { Table, Tag, Button, Space, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, LockOutlined, KeyOutlined, SafetyCertificateOutlined, DatabaseOutlined } from '@ant-design/icons';
import { useMemberClusterContext } from '../hooks';

export default function MemberClusterSecrets() {
  const { memberClusterName } = useMemberClusterContext();

  // Mock data for demonstration
  const mockSecrets = [
    {
      name: 'database-credentials',
      namespace: 'production',
      type: 'Opaque',
      dataKeys: ['username', 'password', 'host'],
      age: '15d',
      size: '0.8 KiB',
      mountedPods: 2,
      labels: 'app=postgres,tier=database',
      lastUpdated: '2d'
    },
    {
      name: 'api-tokens',
      namespace: 'default',
      type: 'Opaque',
      dataKeys: ['jwt-secret', 'api-key', 'webhook-token'],
      age: '7d',
      size: '1.2 KiB',
      mountedPods: 5,
      labels: 'app=api-server,component=auth',
      lastUpdated: '1d'
    },
    {
      name: 'tls-certificate',
      namespace: 'default',
      type: 'kubernetes.io/tls',
      dataKeys: ['tls.crt', 'tls.key'],
      age: '30d',
      size: '4.1 KiB',
      mountedPods: 3,
      labels: 'app=ingress,component=ssl',
      lastUpdated: '5d'
    },
    {
      name: 'docker-registry',
      namespace: 'kube-system',
      type: 'kubernetes.io/dockerconfigjson',
      dataKeys: ['.dockerconfigjson'],
      age: '45d',
      size: '0.5 KiB',
      mountedPods: 0,
      labels: 'component=registry,type=pull-secret',
      lastUpdated: '10d'
    },
    {
      name: 'oauth-config',
      namespace: 'auth',
      type: 'Opaque',
      dataKeys: ['client-id', 'client-secret', 'redirect-uri'],
      age: '12d',
      size: '0.9 KiB',
      mountedPods: 1,
      labels: 'app=oauth-proxy,component=auth',
      lastUpdated: '3h'
    },
    {
      name: 'monitoring-secrets',
      namespace: 'monitoring',
      type: 'Opaque',
      dataKeys: ['grafana-admin', 'prometheus-token'],
      age: '20d',
      size: '0.6 KiB',
      mountedPods: 2,
      labels: 'app=monitoring,tier=admin',
      lastUpdated: '7d'
    }
  ];

  const getTypeTag = (type: string) => {
    const typeConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      'Opaque': { color: 'blue', icon: <LockOutlined /> },
      'kubernetes.io/tls': { color: 'green', icon: <SafetyCertificateOutlined /> },
      'kubernetes.io/dockerconfigjson': { color: 'purple', icon: <DatabaseOutlined /> },
      'kubernetes.io/service-account-token': { color: 'orange', icon: <KeyOutlined /> }
    };

    const config = typeConfig[type] || { color: 'default', icon: <LockOutlined /> };
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {type === 'kubernetes.io/dockerconfigjson' ? 'docker-registry' :
         type === 'kubernetes.io/service-account-token' ? 'service-account' :
         type}
      </Tag>
    );
  };

  const formatDataKeys = (keys: string[]) => {
    if (keys.length === 1) {
      return (
        <div className="flex items-center gap-1">
          <KeyOutlined className="text-blue-500" />
          <code className="text-xs">{keys[0]}</code>
        </div>
      );
    }
    
    return (
      <Tooltip title={keys.join(', ')}>
        <div className="flex items-center gap-1">
          <KeyOutlined className="text-blue-500" />
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

  const getLastUpdatedTag = (lastUpdated: string) => {
    const isRecent = lastUpdated.includes('h') || lastUpdated === '1d';
    return (
      <Tag color={isRecent ? 'green' : 'default'}>
        {lastUpdated} ago
      </Tag>
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
      title: 'Namespace',
      dataIndex: 'namespace',
      key: 'namespace'
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => getTypeTag(type)
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
      title: 'Last Updated',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      render: (lastUpdated: string) => getLastUpdatedTag(lastUpdated)
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
          <Button icon={<EyeOutlined />}  title="View Secret details">
            View
          </Button>
          <Button icon={<EditOutlined />}  title="Edit Secret">
            Edit
          </Button>
          <Button icon={<DeleteOutlined />}  danger title="Delete Secret">
            Delete
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">
        Secrets in Member Cluster: {memberClusterName}
      </h2>
      <div className="mb-4 text-sm text-gray-600">
        View and manage Kubernetes Secrets in the "{memberClusterName}" cluster. Secrets store sensitive data like passwords and tokens.
      </div>
      
      <Table
        columns={columns}
        dataSource={mockSecrets}
        rowKey="name"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} secrets`
        }}
      />
      
      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded">
        <p className="text-sm text-amber-800">
          <strong>Security Note:</strong> Secret values are not displayed for security reasons. The member cluster name "{memberClusterName}" 
          is successfully passed from the parent route and can be used for API calls to fetch cluster-specific Secrets.
          <br />
          <strong>Types:</strong> Opaque (generic), TLS (certificates), docker-registry (pull secrets), service-account (tokens)
        </p>
      </div>
    </div>
  );
}