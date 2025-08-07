import { Table, Tag, Button, Space, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useMemberClusterContext } from '../hooks';

export default function MemberClusterRoles() {
  const { memberClusterName } = useMemberClusterContext();

  const mockRoles = [
    {
      name: 'admin',
      namespace: 'production',
      rules: 8,
      resources: ['*'],
      verbs: ['*'],
      age: '30d',
      labels: 'app=backend,environment=production'
    },
    {
      name: 'developer',
      namespace: 'default',
      rules: 5,
      resources: ['pods', 'services', 'configmaps', 'secrets'],
      verbs: ['get', 'list', 'watch', 'create', 'update'],
      age: '25d',
      labels: 'team=frontend,access=development'
    },
    {
      name: 'view',
      namespace: 'monitoring',
      rules: 3,
      resources: ['pods', 'services', 'endpoints'],
      verbs: ['get', 'list', 'watch'],
      age: '20d',
      labels: 'app=monitoring,component=rbac'
    },
    {
      name: 'secret-reader',
      namespace: 'kube-system',
      rules: 1,
      resources: ['secrets'],
      verbs: ['get', 'list'],
      age: '45d',
      labels: 'component=system,type=automation'
    },
    {
      name: 'pod-manager',
      namespace: 'staging',
      rules: 4,
      resources: ['pods', 'pods/log', 'pods/exec'],
      verbs: ['get', 'list', 'watch', 'create', 'delete'],
      age: '12d',
      labels: 'environment=staging,role=debug'
    }
  ];

  const formatResources = (resources: string[]) => {
    if (resources.length === 1 && resources[0] === '*') {
      return <Tag color="red">All Resources</Tag>;
    }
    
    if (resources.length <= 3) {
      return (
        <div className="flex flex-wrap gap-1">
          {resources.map((resource, index) => (
            <Tag key={index} color="blue" size="small">{resource}</Tag>
          ))}
        </div>
      );
    }
    
    return (
      <Tooltip title={resources.join(', ')}>
        <div className="flex flex-wrap gap-1">
          {resources.slice(0, 3).map((resource, index) => (
            <Tag key={index} color="blue" size="small">{resource}</Tag>
          ))}
          <Tag size="small" color="cyan">+{resources.length - 3}</Tag>
        </div>
      </Tooltip>
    );
  };

  const formatVerbs = (verbs: string[]) => {
    if (verbs.length === 1 && verbs[0] === '*') {
      return <Tag color="red">All Verbs</Tag>;
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {verbs.slice(0, 4).map((verb, index) => (
          <Tag key={index} color="green" size="small">{verb}</Tag>
        ))}
        {verbs.length > 4 && <Tag size="small" color="cyan">+{verbs.length - 4}</Tag>}
      </div>
    );
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
      render: (name: string) => <strong>{name}</strong>
    },
    {
      title: 'Namespace',
      dataIndex: 'namespace',
      key: 'namespace'
    },
    {
      title: 'Rules',
      dataIndex: 'rules',
      key: 'rules',
      render: (rules: number) => (
        <Tag color="orange" icon={<SafetyCertificateOutlined />}>
          {rules} rules
        </Tag>
      )
    },
    {
      title: 'Resources',
      dataIndex: 'resources',
      key: 'resources',
      render: (resources: string[]) => formatResources(resources)
    },
    {
      title: 'Verbs',
      dataIndex: 'verbs',
      key: 'verbs',
      render: (verbs: string[]) => formatVerbs(verbs)
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
          <Button icon={<EyeOutlined />} size="small" title="View Role details">
            View
          </Button>
          <Button icon={<EditOutlined />} size="small" title="Edit Role">
            Edit
          </Button>
          <Button icon={<DeleteOutlined />} size="small" danger title="Delete Role">
            Delete
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">
        Roles in Member Cluster: {memberClusterName}
      </h2>
      <div className="mb-4 text-sm text-gray-600">
        View and manage Kubernetes Roles in the "{memberClusterName}" cluster. Roles define namespace-scoped permissions.
      </div>
      
      <Table
        columns={columns}
        dataSource={mockRoles}
        rowKey="name"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} roles`
        }}
      />
      
      <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded">
        <p className="text-sm text-orange-800">
          <strong>Security Note:</strong> Roles define namespace-scoped permissions. The member cluster name "{memberClusterName}" 
          is successfully passed from the parent route and can be used for API calls to fetch cluster-specific Roles.
          <br />
          <strong>Scope:</strong> Unlike ClusterRoles, Roles only grant permissions within their specific namespace
        </p>
      </div>
    </div>
  );
}