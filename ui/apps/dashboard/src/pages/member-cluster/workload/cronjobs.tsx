import { Table, Tag, Button, Space, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { useMemberClusterContext } from '../hooks';

export default function MemberClusterCronJobs() {
  const { memberClusterName } = useMemberClusterContext();

  // Mock data for demonstration
  const mockCronJobs = [
    {
      name: 'backup-job',
      namespace: 'default',
      schedule: '0 2 * * *',
      suspend: false,
      active: 1,
      lastSchedule: '2h',
      age: '5d',
      image: 'backup-tool:v1.0'
    },
    {
      name: 'cleanup-logs',
      namespace: 'system',
      schedule: '0 */6 * * *',
      suspend: false,
      active: 0,
      lastSchedule: '4h',
      age: '12d',
      image: 'busybox:latest'
    },
    {
      name: 'data-sync',
      namespace: 'production',
      schedule: '*/15 * * * *',
      suspend: true,
      active: 0,
      lastSchedule: 'Never',
      age: '3d',
      image: 'sync-service:v2.1'
    },
    {
      name: 'health-check',
      namespace: 'monitoring',
      schedule: '*/5 * * * *',
      suspend: false,
      active: 2,
      lastSchedule: '3m',
      age: '7d',
      image: 'health-checker:latest'
    }
  ];

  const getSuspendTag = (suspend: boolean) => {
    return (
      <Tag color={suspend ? 'red' : 'green'} icon={suspend ? <PauseCircleOutlined /> : <PlayCircleOutlined />}>
        {suspend ? 'Suspended' : 'Active'}
      </Tag>
    );
  };

  const getActiveTag = (active: number) => {
    const color = active > 0 ? 'processing' : 'default';
    return <Tag color={color}>{active}</Tag>;
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
      title: 'Schedule',
      dataIndex: 'schedule',
      key: 'schedule',
      render: (schedule: string) => <code className="text-xs">{schedule}</code>
    },
    {
      title: 'Status',
      dataIndex: 'suspend',
      key: 'suspend',
      render: (suspend: boolean) => getSuspendTag(suspend)
    },
    {
      title: 'Active Jobs',
      dataIndex: 'active',
      key: 'active',
      render: (active: number) => getActiveTag(active)
    },
    {
      title: 'Last Schedule',
      dataIndex: 'lastSchedule',
      key: 'lastSchedule'
    },
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      render: (image: string) => (
        <Tooltip title={image}>
          <code className="text-xs">{image.length > 20 ? `${image.substring(0, 20)}...` : image}</code>
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
      render: (_: any, record: any) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" title="View details">
            View
          </Button>
          {record.suspend ? (
            <Button icon={<PlayCircleOutlined />} size="small" title="Resume CronJob" type="primary">
              Resume
            </Button>
          ) : (
            <Button icon={<PauseCircleOutlined />} size="small" title="Suspend CronJob">
              Suspend
            </Button>
          )}
          <Button icon={<EditOutlined />} size="small" title="Edit CronJob">
            Edit
          </Button>
          <Button icon={<DeleteOutlined />} size="small" danger title="Delete CronJob">
            Delete
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">
        CronJobs in Member Cluster: {memberClusterName}
      </h2>
      <div className="mb-4 text-sm text-gray-600">
        View and manage Kubernetes CronJobs in the "{memberClusterName}" cluster.
      </div>
      
      <Table
        columns={columns}
        dataSource={mockCronJobs}
        rowKey="name"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} cronjobs`
        }}
      />
      
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This is a placeholder implementation. The member cluster name "{memberClusterName}" 
          is successfully passed from the parent route and can be used for API calls to fetch cluster-specific CronJobs.
        </p>
      </div>
    </div>
  );
}