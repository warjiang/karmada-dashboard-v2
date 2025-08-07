import { Table, Tag, Button, Space, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, SafetyCertificateOutlined, KeyOutlined } from '@ant-design/icons';
import { useMemberClusterContext } from '../hooks';

export default function MemberClusterServiceAccounts() {
  const { memberClusterName } = useMemberClusterContext();

  const mockServiceAccounts = [
    {
      name: 'default',
      namespace: 'default',
      secrets: ['default-token-abc12'],
      age: '45d',
      labels: '',
      automountToken: true,
      imagePullSecrets: []
    },
    {
      name: 'admin-sa',
      namespace: 'kube-system',
      secrets: ['admin-token-def34', 'admin-tls-cert'],
      age: '45d',
      labels: 'component=admin,type=service-account',
      automountToken: true,
      imagePullSecrets: ['registry-secret']
    },
    {
      name: 'prometheus',
      namespace: 'monitoring',
      secrets: ['prometheus-token-ghi56'],
      age: '20d',
      labels: 'app=prometheus,component=monitoring',
      automountToken: true,
      imagePullSecrets: []
    },
    {
      name: 'grafana',
      namespace: 'monitoring',
      secrets: ['grafana-token-jkl78'],
      age: '20d',
      labels: 'app=grafana,component=monitoring',
      automountToken: true,
      imagePullSecrets: []
    },
    {
      name: 'webapp-sa',
      namespace: 'production',
      secrets: ['webapp-token-mno90', 'webapp-db-secret'],
      age: '15d',
      labels: 'app=webapp,environment=production',
      automountToken: false,
      imagePullSecrets: ['private-registry']
    },
    {
      name: 'ci-runner',
      namespace: 'ci-cd',
      secrets: ['ci-token-pqr12', 'docker-config'],
      age: '10d',
      labels: 'app=ci,component=runner',
      automountToken: true,
      imagePullSecrets: ['docker-hub-secret', 'private-registry']
    }
  ];

  const getAutomountTag = (automount: boolean) => {
    return automount ? 
      <Tag color="green" icon={<KeyOutlined />}>Enabled</Tag> : 
      <Tag color="orange">Disabled</Tag>;
  };

  const formatSecrets = (secrets: string[]) => {
    if (secrets.length === 0) {
      return <span className="text-gray-400">None</span>;
    }
    
    if (secrets.length === 1) {
      return <code className="text-xs">{secrets[0]}</code>;
    }
    
    return (
      <Tooltip title={secrets.join(', ')}>
        <div className="flex items-center gap-1">
          <code className="text-xs">{secrets[0]}</code>
          <Tag size="small" color="blue">+{secrets.length - 1}</Tag>
        </div>
      </Tooltip>
    );
  };

  const formatImagePullSecrets = (secrets: string[]) => {
    if (secrets.length === 0) {
      return <span className="text-gray-400">None</span>;
    }
    
    if (secrets.length === 1) {
      return (
        <Tag color="purple" size="small" icon={<SafetyCertificateOutlined />}>
          {secrets[0]}
        </Tag>
      );
    }
    
    return (
      <Tooltip title={secrets.join(', ')}>
        <div className="flex items-center gap-1">
          <Tag color="purple" size="small" icon={<SafetyCertificateOutlined />}>
            {secrets[0]}
          </Tag>
          <Tag size="small" color="cyan">+{secrets.length - 1}</Tag>
        </div>
      </Tooltip>
    );
  };

  const formatLabels = (labels: string) => {
    if (!labels) {
      return <span className="text-gray-400">None</span>;
    }

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
            <Tag size="small" color="purple">+{remainingCount}</Tag>
          )}
        </div>
      </Tooltip>
    );
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <div className="flex items-center gap-2">
          <SafetyCertificateOutlined className="text-blue-500" />
          <strong>{name}</strong>
        </div>
      )
    },
    {
      title: 'Namespace',
      dataIndex: 'namespace',
      key: 'namespace'
    },
    {
      title: 'Automount Token',
      dataIndex: 'automountToken',
      key: 'automountToken',
      render: (automount: boolean) => getAutomountTag(automount)
    },
    {
      title: 'Secrets',
      dataIndex: 'secrets',
      key: 'secrets',
      render: (secrets: string[]) => formatSecrets(secrets)
    },
    {
      title: 'Image Pull Secrets',
      dataIndex: 'imagePullSecrets',
      key: 'imagePullSecrets',
      render: (secrets: string[]) => formatImagePullSecrets(secrets)
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
          <Button icon={<EyeOutlined />} size="small" title="View ServiceAccount details">
            View
          </Button>
          <Button icon={<EditOutlined />} size="small" title="Edit ServiceAccount">
            Edit
          </Button>
          <Button 
            icon={<DeleteOutlined />} 
            size="small" 
            danger 
            title="Delete ServiceAccount"
            disabled={record.name === 'default'}
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
        Service Accounts in Member Cluster: {memberClusterName}
      </h2>
      <div className="mb-4 text-sm text-gray-600">
        View and manage Kubernetes ServiceAccounts in the "{memberClusterName}" cluster. ServiceAccounts provide identity for processes running in pods.
      </div>
      
      <Table
        columns={columns}
        dataSource={mockServiceAccounts}
        rowKey="name"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} service accounts`
        }}
      />
      
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Default ServiceAccounts cannot be deleted. The member cluster name "{memberClusterName}" 
          is successfully passed from the parent route and can be used for API calls to fetch cluster-specific ServiceAccounts.
          <br />
          <strong>Token Automount:</strong> Controls whether API tokens are automatically mounted in pods using this ServiceAccount
        </p>
      </div>
    </div>
  );
}