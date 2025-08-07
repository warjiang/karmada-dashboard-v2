import { Table, Tag, Button, Space, Tooltip } from 'antd';
import { EyeOutlined, ExclamationCircleOutlined, InfoCircleOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useMemberClusterContext } from '../hooks';

export default function MemberClusterEvents() {
  const { memberClusterName } = useMemberClusterContext();

  const mockEvents = [
    {
      name: 'Pulling',
      namespace: 'default',
      type: 'Normal',
      reason: 'Pulling',
      object: 'Pod/webapp-deployment-7b8c5f9d4-xyz12',
      source: 'kubelet',
      message: 'Pulling image "nginx:1.21"',
      count: 1,
      firstSeen: '2m',
      lastSeen: '2m'
    },
    {
      name: 'Failed',
      namespace: 'production',
      type: 'Warning',
      reason: 'Failed',
      object: 'Pod/database-0',
      source: 'kubelet',
      message: 'Failed to pull image "postgres:14": rpc error: code = Unknown',
      count: 5,
      firstSeen: '15m',
      lastSeen: '1m'
    },
    {
      name: 'Scheduled',
      namespace: 'default',
      type: 'Normal',
      reason: 'Scheduled',
      object: 'Pod/api-server-6d8b9c7f5-abc34',
      source: 'default-scheduler',
      message: 'Successfully assigned default/api-server-6d8b9c7f5-abc34 to node-1',
      count: 1,
      firstSeen: '5m',
      lastSeen: '5m'
    },
    {
      name: 'Unhealthy',
      namespace: 'monitoring',
      type: 'Warning',
      reason: 'Unhealthy',
      object: 'Pod/prometheus-0',
      source: 'kubelet',
      message: 'Liveness probe failed: HTTP probe failed with statuscode: 503',
      count: 3,
      firstSeen: '10m',
      lastSeen: '3m'
    },
    {
      name: 'Created',
      namespace: 'kube-system',
      type: 'Normal',
      reason: 'Created',
      object: 'Pod/coredns-78fcd69978-def56',
      source: 'kubelet',
      message: 'Created container coredns',
      count: 1,
      firstSeen: '1h',
      lastSeen: '1h'
    }
  ];

  const getTypeTag = (type: string) => {
    const typeConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      'Normal': { color: 'success', icon: <CheckCircleOutlined /> },
      'Warning': { color: 'warning', icon: <WarningOutlined /> },
      'Error': { color: 'error', icon: <ExclamationCircleOutlined /> }
    };

    const config = typeConfig[type] || { color: 'default', icon: <InfoCircleOutlined /> };
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {type}
      </Tag>
    );
  };

  const getReasonTag = (reason: string, type: string) => {
    const reasonColors: Record<string, string> = {
      'Pulling': 'blue',
      'Pulled': 'green',
      'Failed': 'red',
      'Scheduled': 'green',
      'Created': 'green',
      'Started': 'green',
      'Unhealthy': 'orange',
      'Killing': 'red',
      'FailedScheduling': 'red'
    };

    return (
      <Tag color={reasonColors[reason] || 'default'}>
        {reason}
      </Tag>
    );
  };

  const formatObject = (object: string) => {
    const [kind, name] = object.split('/');
    return (
      <div className="flex items-center gap-1">
        <Tag color="geekblue" size="small">{kind}</Tag>
        <code className="text-xs">{name}</code>
      </div>
    );
  };

  const formatMessage = (message: string) => {
    if (message.length <= 50) {
      return <span className="text-sm">{message}</span>;
    }
    
    return (
      <Tooltip title={message}>
        <span className="text-sm">{message.substring(0, 50)}...</span>
      </Tooltip>
    );
  };

  const getCountTag = (count: number) => {
    if (count === 1) {
      return <Tag color="default">1</Tag>;
    }
    
    const color = count > 10 ? 'red' : count > 5 ? 'orange' : 'blue';
    return <Tag color={color}>{count}</Tag>;
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => getTypeTag(type),
      width: 100
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string, record: any) => getReasonTag(reason, record.type),
      width: 120
    },
    {
      title: 'Object',
      dataIndex: 'object',
      key: 'object',
      render: (object: string) => formatObject(object),
      width: 200
    },
    {
      title: 'Namespace',
      dataIndex: 'namespace',
      key: 'namespace',
      width: 120
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      render: (source: string) => <code className="text-xs">{source}</code>,
      width: 120
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      render: (message: string) => formatMessage(message)
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count',
      render: (count: number) => getCountTag(count),
      width: 80
    },
    {
      title: 'First Seen',
      dataIndex: 'firstSeen',
      key: 'firstSeen',
      width: 100
    },
    {
      title: 'Last Seen',
      dataIndex: 'lastSeen',
      key: 'lastSeen',
      width: 100
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" title="View event details">
            View
          </Button>
        </Space>
      ),
      width: 80
    }
  ];

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">
        Events in Member Cluster: {memberClusterName}
      </h2>
      <div className="mb-4 text-sm text-gray-600">
        View Kubernetes Events in the "{memberClusterName}" cluster. Events provide insights into cluster activity and troubleshooting.
      </div>
      
      <Table
        columns={columns}
        dataSource={mockEvents}
        rowKey={(record, index) => `${record.object}-${index}`}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} events`
        }}
        scroll={{ x: 1200 }}
      />
      
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Events are automatically cleaned up after a retention period. The member cluster name "{memberClusterName}" 
          is successfully passed from the parent route and can be used for API calls to fetch cluster-specific Events.
          <br />
          <strong>Types:</strong> Normal (informational), Warning (potential issues), Error (failures)
        </p>
      </div>
    </div>
  );
}