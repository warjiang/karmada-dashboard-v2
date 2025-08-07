import { Table, Tag, Button, Space, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, LinkOutlined, LockOutlined } from '@ant-design/icons';
import { useMemberClusterContext } from '../hooks';

export default function MemberClusterIngress() {
  const { memberClusterName } = useMemberClusterContext();

  // Mock data for demonstration
  const mockIngress = [
    {
      name: 'web-app-ingress',
      namespace: 'default',
      class: 'nginx',
      hosts: ['app.example.com', 'www.app.example.com'],
      address: '192.168.1.100',
      ports: '80,443',
      age: '5d',
      tls: true,
      rules: 2
    },
    {
      name: 'api-ingress',
      namespace: 'production',
      class: 'traefik',
      hosts: ['api.company.com'],
      address: '10.0.1.50',
      ports: '443',
      age: '12d',
      tls: true,
      rules: 1
    },
    {
      name: 'dashboard-ingress',
      namespace: 'monitoring',
      class: 'nginx',
      hosts: ['dashboard.internal'],
      address: '',
      ports: '80',
      age: '3d',
      tls: false,
      rules: 1
    },
    {
      name: 'blog-ingress',
      namespace: 'staging',
      class: 'nginx',
      hosts: ['blog.test.com', 'staging-blog.test.com'],
      address: '192.168.1.101',
      ports: '80,443',
      age: '8d',
      tls: true,
      rules: 3
    }
  ];

  const getStatusTag = (address: string) => {
    return address ? 
      <Tag color="green" icon={<LinkOutlined />}>Ready</Tag> : 
      <Tag color="orange">Pending</Tag>;
  };

  const getTlsTag = (tls: boolean) => {
    return tls ? 
      <Tag color="blue" icon={<LockOutlined />}>TLS</Tag> : 
      <Tag color="default">HTTP</Tag>;
  };

  const formatHosts = (hosts: string[]) => {
    if (hosts.length === 1) {
      return <code className="text-xs">{hosts[0]}</code>;
    }
    
    const displayHost = hosts[0];
    const remainingCount = hosts.length - 1;
    
    return (
      <Tooltip title={hosts.join(', ')}>
        <div className="flex items-center gap-1">
          <code className="text-xs">{displayHost}</code>
          {remainingCount > 0 && (
            <Tag size="small" color="blue">+{remainingCount}</Tag>
          )}
        </div>
      </Tooltip>
    );
  };

  const formatAddress = (address: string) => {
    return address ? (
      <code className="text-xs">{address}</code>
    ) : (
      <span className="text-gray-400">Pending</span>
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
      title: 'Class',
      dataIndex: 'class',
      key: 'class',
      render: (className: string) => (
        <Tag color="geekblue">{className}</Tag>
      )
    },
    {
      title: 'Hosts',
      dataIndex: 'hosts',
      key: 'hosts',
      render: (hosts: string[]) => formatHosts(hosts)
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      render: (address: string) => formatAddress(address)
    },
    {
      title: 'Ports',
      dataIndex: 'ports',
      key: 'ports',
      render: (ports: string) => <code className="text-xs">{ports}</code>
    },
    {
      title: 'TLS',
      dataIndex: 'tls',
      key: 'tls',
      render: (tls: boolean) => getTlsTag(tls)
    },
    {
      title: 'Rules',
      dataIndex: 'rules',
      key: 'rules',
      render: (rules: number) => (
        <Tag color="purple">{rules}</Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'address',
      key: 'status',
      render: (address: string) => getStatusTag(address)
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
          <Button icon={<EyeOutlined />} size="small" title="View details">
            View
          </Button>
          <Button icon={<EditOutlined />} size="small" title="Edit Ingress">
            Edit
          </Button>
          <Button icon={<DeleteOutlined />} size="small" danger title="Delete Ingress">
            Delete
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">
        Ingress in Member Cluster: {memberClusterName}
      </h2>
      <div className="mb-4 text-sm text-gray-600">
        View and manage Kubernetes Ingress resources in the "{memberClusterName}" cluster. Ingress manages external access to services.
      </div>
      
      <Table
        columns={columns}
        dataSource={mockIngress}
        rowKey="name"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} ingress resources`
        }}
      />
      
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This is a placeholder implementation. The member cluster name "{memberClusterName}" 
          is successfully passed from the parent route and can be used for API calls to fetch cluster-specific Ingress resources.
        </p>
      </div>
    </div>
  );
}