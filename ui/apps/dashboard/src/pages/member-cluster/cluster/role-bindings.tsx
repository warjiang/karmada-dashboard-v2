import { Table, Tag, Button, Space, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, TeamOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useMemberClusterContext } from '../hooks';

export default function MemberClusterRoleBindings() {
  const { memberClusterName } = useMemberClusterContext();

  const mockRoleBindings = [
    {
      name: 'admin-binding',
      namespace: 'production',
      roleRef: 'admin',
      subjects: [
        { kind: 'User', name: 'alice@company.com' },
        { kind: 'ServiceAccount', name: 'admin-sa' }
      ],
      age: '30d',
      labels: 'app=backend,environment=production'
    },
    {
      name: 'developer-access',
      namespace: 'default',
      roleRef: 'developer',
      subjects: [
        { kind: 'Group', name: 'developers' },
        { kind: 'User', name: 'bob@company.com' }
      ],
      age: '20d',
      labels: 'team=frontend,access=development'
    },
    {
      name: 'monitoring-reader',
      namespace: 'monitoring',
      roleRef: 'view',
      subjects: [
        { kind: 'ServiceAccount', name: 'prometheus' },
        { kind: 'ServiceAccount', name: 'grafana' }
      ],
      age: '15d',
      labels: 'app=monitoring,component=rbac'
    },
    {
      name: 'secret-reader',
      namespace: 'kube-system',
      roleRef: 'secret-reader',
      subjects: [
        { kind: 'ServiceAccount', name: 'secret-manager' }
      ],
      age: '45d',
      labels: 'component=system,type=automation'
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
          <Button icon={<EyeOutlined />}  title="View details">
            View
          </Button>
          <Button icon={<EditOutlined />}  title="Edit RoleBinding">
            Edit
          </Button>
          <Button icon={<DeleteOutlined />}  danger title="Delete RoleBinding">
            Delete
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">
        Role Bindings in Member Cluster: {memberClusterName}
      </h2>
      <div className="mb-4 text-sm text-gray-600">
        View and manage Kubernetes RoleBindings in the "{memberClusterName}" cluster. RoleBindings grant namespace-scoped permissions.
      </div>
      
      <Table
        columns={columns}
        dataSource={mockRoleBindings}
        rowKey="name"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} role bindings`
        }}
      />
      
      <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded">
        <p className="text-sm text-orange-800">
          <strong>Security Note:</strong> RoleBindings grant namespace-scoped permissions. The member cluster name "{memberClusterName}" 
          is successfully passed from the parent route and can be used for API calls to fetch cluster-specific RoleBindings.
        </p>
      </div>
    </div>
  );
}