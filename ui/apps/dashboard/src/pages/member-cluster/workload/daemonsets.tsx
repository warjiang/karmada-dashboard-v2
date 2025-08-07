import { Table, Tag, Button, Space, Progress, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, NodeExpandOutlined } from '@ant-design/icons';
import { useMemberClusterContext } from '../hooks';

export default function MemberClusterDaemonSets() {
  const { memberClusterName } = useMemberClusterContext();

  // Mock data for demonstration
  const mockDaemonSets = [
    {
      name: 'fluent-bit',
      namespace: 'kube-system',
      desired: 3,
      current: 3,
      ready: 3,
      upToDate: 3,
      available: 3,
      nodeSelector: 'kubernetes.io/os=linux',
      age: '15d',
      images: 'fluent/fluent-bit:1.9.3',
      status: 'Ready'
    },
    {
      name: 'node-exporter',
      namespace: 'monitoring',
      desired: 3,
      current: 3,
      ready: 2,
      upToDate: 3,
      available: 2,
      nodeSelector: 'beta.kubernetes.io/arch=amd64',
      age: '8d',
      images: 'prom/node-exporter:v1.3.1',
      status: 'Updating'
    },
    {
      name: 'kube-proxy',
      namespace: 'kube-system',
      desired: 3,
      current: 3,
      ready: 3,
      upToDate: 3,
      available: 3,
      nodeSelector: 'kubernetes.io/os=linux',
      age: '30d',
      images: 'k8s.gcr.io/kube-proxy:v1.25.0',
      status: 'Ready'
    },
    {
      name: 'weave-net',
      namespace: 'kube-system',
      desired: 3,
      current: 2,
      ready: 2,
      upToDate: 2,
      available: 2,
      nodeSelector: '',
      age: '25d',
      images: 'weaveworks/weave-kube:2.8.1',
      status: 'Degraded'
    }
  ];

  const getStatusTag = (status: string) => {
    const colorMap: Record<string, string> = {
      'Ready': 'success',
      'Updating': 'processing',
      'Degraded': 'error',
      'Failed': 'error'
    };
    return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
  };

  const getReadinessProgress = (ready: number, desired: number) => {
    const percent = desired > 0 ? Math.round((ready / desired) * 100) : 0;
    const status = percent === 100 ? 'success' : percent > 80 ? 'active' : 'exception';
    
    return (
      <div className="flex items-center gap-2">
        <Progress
          percent={percent}
          size="small"
          status={status}
          showInfo={false}
          style={{ width: 60 }}
        />
        <span className="text-xs">{ready}/{desired}</span>
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
      title: 'Namespace',
      dataIndex: 'namespace',
      key: 'namespace'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status)
    },
    {
      title: 'Desired',
      dataIndex: 'desired',
      key: 'desired'
    },
    {
      title: 'Current',
      dataIndex: 'current',
      key: 'current'
    },
    {
      title: 'Ready',
      dataIndex: 'ready',
      key: 'ready',
      render: (ready: number, record: any) => getReadinessProgress(ready, record.desired)
    },
    {
      title: 'Up-to-date',
      dataIndex: 'upToDate',
      key: 'upToDate'
    },
    {
      title: 'Available',
      dataIndex: 'available',
      key: 'available'
    },
    {
      title: 'Node Selector',
      dataIndex: 'nodeSelector',
      key: 'nodeSelector',
      render: (nodeSelector: string) => (
        nodeSelector ? (
          <Tooltip title={nodeSelector}>
            <Tag icon={<NodeExpandOutlined />} className="text-xs">
              {nodeSelector.length > 15 ? `${nodeSelector.substring(0, 15)}...` : nodeSelector}
            </Tag>
          </Tooltip>
        ) : (
          <span className="text-gray-400">None</span>
        )
      )
    },
    {
      title: 'Images',
      dataIndex: 'images',
      key: 'images',
      render: (images: string) => (
        <Tooltip title={images}>
          <code className="text-xs">{images.length > 25 ? `${images.substring(0, 25)}...` : images}</code>
        </Tooltip>
      )
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
          <Button icon={<EditOutlined />} size="small" title="Edit DaemonSet">
            Edit
          </Button>
          <Button icon={<DeleteOutlined />} size="small" danger title="Delete DaemonSet">
            Delete
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">
        DaemonSets in Member Cluster: {memberClusterName}
      </h2>
      <div className="mb-4 text-sm text-gray-600">
        View and manage Kubernetes DaemonSets in the "{memberClusterName}" cluster. DaemonSets ensure that pods run on all (or selected) nodes.
      </div>
      
      <Table
        columns={columns}
        dataSource={mockDaemonSets}
        rowKey="name"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} daemonsets`
        }}
      />
      
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This is a placeholder implementation. The member cluster name "{memberClusterName}" 
          is successfully passed from the parent route and can be used for API calls to fetch cluster-specific DaemonSets.
        </p>
      </div>
    </div>
  );
}