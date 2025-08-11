import { Table, Tag, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useMemberClusterContext } from '../hooks';

export default function MemberClusterDeployments() {
  const { memberClusterName } = useMemberClusterContext();

  // Mock data for demonstration
  const mockDeployments = [
    {
      name: 'nginx-deployment',
      namespace: 'default',
      replicas: '3/3',
      age: '2d',
      status: 'Running',
      images: 'nginx:1.21'
    },
    {
      name: 'api-server',
      namespace: 'production',
      replicas: '5/5',
      age: '7d',
      status: 'Running',
      images: 'api-server:v1.2.0'
    },
    {
      name: 'frontend',
      namespace: 'staging',
      replicas: '1/2',
      age: '3d',
      status: 'Pending',
      images: 'frontend:latest'
    }
  ];

  const getStatusTag = (status: string) => {
    const color = status === 'Running' ? 'success' : status === 'Pending' ? 'processing' : 'error';
    return <Tag color={color}>{status}</Tag>;
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
      title: 'Ready',
      dataIndex: 'replicas',
      key: 'replicas'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status)
    },
    {
      title: 'Images',
      dataIndex: 'images',
      key: 'images',
      render: (images: string) => <code className="text-xs">{images}</code>
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
          <Button icon={<EditOutlined />} size="small" title="Edit deployment">
            Edit
          </Button>
          {/* 
          <Button icon={<DeleteOutlined />} size="small" danger title="Delete deployment">
            Delete
          </Button> */}
        </Space>
      )
    }
  ];

  return (
    <div className="h-full w-full flex flex-col p-4">
      <div className="flex-1 flex flex-col">
        <Table
          columns={columns}
          dataSource={mockDeployments}
          rowKey="name"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} deployments`
          }}
          scroll={{ y: 'calc(100vh - 400px)' }}
        />
      </div>
      
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded flex-shrink-0">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This is a placeholder implementation. The member cluster name "{memberClusterName}" 
          is successfully passed from the parent route and can be used for API calls to fetch cluster-specific deployments.
        </p>
      </div>
    </div>
  );
}