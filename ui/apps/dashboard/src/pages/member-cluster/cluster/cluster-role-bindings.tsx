import { Table, Tag, Button, Space, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, TeamOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useMemberClusterContext } from '../hooks';

export default function MemberClusterClusterRoleBindings() {
  const { memberClusterName } = useMemberClusterContext();

  const mockClusterRoleBindings = [
    {
      name: 'cluster-admin',
      roleRef: 'cluster-admin',
      subjects: [
        { kind: 'User', name: 'admin@company.com', namespace: '' },
        { kind: 'ServiceAccount', name: 'admin-sa', namespace: 'kube-system' }
      ],
      age: '45d',
      labels: 'rbac.authorization.k8s.io/autoupdate=true'
    },
    {
      name: 'system:node',
      roleRef: 'system:node',
      subjects: [
        { kind: 'Group', name: 'system:nodes', namespace: '' }
      ],
      age: '45d',
      labels: 'kubernetes.io/bootstrapping=rbac-defaults'
    },
    {
      name: 'monitoring-reader',
      roleRef: 'monitoring-reader',
      subjects: [
        { kind: 'ServiceAccount', name: 'prometheus', namespace: 'monitoring' },
        { kind: 'ServiceAccount', name: 'grafana', namespace: 'monitoring' }
      ],
      age: '20d',
      labels: 'app=monitoring,component=rbac'
    }
  ];

  const getSubjectTag = (subject: any) => {
    const kindColors: Record<string, string> = {
      'User': 'blue',
      'Group': 'green',
      'ServiceAccount': 'purple'
    };
    
    const kindIcons: Record<string, React.ReactNode> = {
      'User': <TeamOutlined />,
      'Group': <TeamOutlined />,
      'ServiceAccount': <SafetyCertificateOutlined />
    };

    return (
      <Tag 
        key={`${subject.kind}-${subject.name}`}
        color={kindColors[subject.kind] || 'default'} 
        icon={kindIcons[subject.kind]}
        className="mb-1"
      >
        {subject.kind}: {subject.name}
        {subject.namespace && <span className="text-xs opacity-75"> ({subject.namespace})</span>}
      </Tag>
    );
  };

  const formatSubjects = (subjects: any[]) => {
    if (subjects.length <= 2) {
      return (
        <div className="flex flex-col gap-1">
          {subjects.map(subject => getSubjectTag(subject))}
        </div>
      );
    }
    
    return (
      <Tooltip title={
        <div className="flex flex-col gap-1">
          {subjects.map(subject => getSubjectTag(subject))}
        </div>
      }>
        <div className="flex flex-col gap-1">
          {subjects.slice(0, 2).map(subject => getSubjectTag(subject))}
          <Tag  color="cyan">+{subjects.length - 2} more</Tag>
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
      title: 'Role',
      dataIndex: 'roleRef',
      key: 'roleRef',
      render: (roleRef: string) => (
        <Tag color="orange" icon={<SafetyCertificateOutlined />}>
          {roleRef}
        </Tag>
      )
    },
    {
      title: 'Subjects',
      dataIndex: 'subjects',
      key: 'subjects',
      render: (subjects: any[]) => formatSubjects(subjects)
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
          <Button icon={<EyeOutlined />}  title="View details">
            View
          </Button>
          <Button icon={<EditOutlined />}  title="Edit ClusterRoleBinding">
            Edit
          </Button>
          <Button icon={<DeleteOutlined />}  danger title="Delete ClusterRoleBinding">
            Delete
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">
        Cluster Role Bindings in Member Cluster: {memberClusterName}
      </h2>
      <div className="mb-4 text-sm text-gray-600">
        View and manage Kubernetes ClusterRoleBindings in the "{memberClusterName}" cluster. ClusterRoleBindings grant cluster-wide permissions.
      </div>
      
      <Table
        columns={columns}
        dataSource={mockClusterRoleBindings}
        rowKey="name"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} cluster role bindings`
        }}
      />
      
      <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded">
        <p className="text-sm text-orange-800">
          <strong>Security Note:</strong> ClusterRoleBindings grant cluster-wide permissions. The member cluster name "{memberClusterName}" 
          is successfully passed from the parent route and can be used for API calls to fetch cluster-specific ClusterRoleBindings.
        </p>
      </div>
    </div>
  );
}