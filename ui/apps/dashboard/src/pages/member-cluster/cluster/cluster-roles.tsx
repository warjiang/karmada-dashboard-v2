import { Table, Tag, Button, Space, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, SafetyCertificateOutlined, ApiOutlined } from '@ant-design/icons';
import { useMemberClusterContext } from '../hooks';

export default function MemberClusterClusterRoles() {
  const { memberClusterName } = useMemberClusterContext();

  const mockClusterRoles = [
    {
      name: 'cluster-admin',
      rules: 12,
      resources: ['*.*'],
      verbs: ['*'],
      age: '45d',
      labels: 'kubernetes.io/bootstrapping=rbac-defaults',
      aggregated: false
    },
    {
      name: 'system:node',
      rules: 8,
      resources: ['nodes', 'nodes/status', 'pods', 'persistentvolumes'],
      verbs: ['get', 'list', 'watch', 'create', 'update', 'patch'],
      age: '45d',
      labels: 'kubernetes.io/bootstrapping=rbac-defaults',
      aggregated: false
    },
    {
      name: 'view',
      rules: 25,
      resources: ['pods', 'services', 'deployments', 'configmaps'],
      verbs: ['get', 'list', 'watch'],
      age: '45d',
      labels: 'kubernetes.io/bootstrapping=rbac-defaults',
      aggregated: true
    },
    {
      name: 'monitoring-reader',
      rules: 4,
      resources: ['nodes', 'pods', 'services', 'endpoints'],
      verbs: ['get', 'list', 'watch'],
      age: '20d',
      labels: 'app=monitoring,component=rbac',
      aggregated: false
    }
  ];

  const formatResources = (resources: string[]) => {
    if (resources.length === 1 && resources[0] === '*.*') {
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

  const getAggregatedTag = (aggregated: boolean) => {
    return aggregated ? 
      <Tag color="purple" icon={<ApiOutlined />}>Aggregated</Tag> : 
      <Tag color="default">Standard</Tag>;
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <strong>{name}</strong>
    },
    {
      title: 'Type',
      dataIndex: 'aggregated',
      key: 'aggregated',
      render: (aggregated: boolean) => getAggregatedTag(aggregated)
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
      title: 'Age',
      dataIndex: 'age',
      key: 'age'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" title="View ClusterRole details">
            View
          </Button>
          <Button icon={<EditOutlined />} size="small" title="Edit ClusterRole">
            Edit
          </Button>
          <Button icon={<DeleteOutlined />} size="small" danger title="Delete ClusterRole">
            Delete
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">
        Cluster Roles in Member Cluster: {memberClusterName}
      </h2>
      <div className="mb-4 text-sm text-gray-600">
        View and manage Kubernetes ClusterRoles in the "{memberClusterName}" cluster. ClusterRoles define cluster-wide permissions.
      </div>
      
      <Table
        columns={columns}
        dataSource={mockClusterRoles}
        rowKey="name"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} cluster roles`
        }}
      />
      
      <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded">
        <p className="text-sm text-orange-800">
          <strong>Security Note:</strong> ClusterRoles define cluster-wide permissions. The member cluster name "{memberClusterName}" 
          is successfully passed from the parent route and can be used for API calls to fetch cluster-specific ClusterRoles.
          <br />
          <strong>Types:</strong> Standard (explicitly defined), Aggregated (composed from other roles)
        </p>
      </div>
    </div>
  );
}