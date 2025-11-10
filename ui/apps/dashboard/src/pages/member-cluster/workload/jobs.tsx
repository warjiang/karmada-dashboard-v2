import { Table, Tag, Button, Space, Progress, Tooltip } from 'antd';
import { EyeOutlined, DeleteOutlined, RedoOutlined, ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useMemberClusterContext } from '../hooks';

export default function MemberClusterJobs() {
  const { memberClusterName } = useMemberClusterContext();

  // Mock data for demonstration
  const mockJobs = [
    {
      name: 'data-migration-20231201',
      namespace: 'default',
      completions: 1,
      duration: '2m15s',
      age: '3h',
      image: 'migrate-tool:v1.2',
      status: 'Complete',
      startTime: '2023-12-01T10:30:00Z',
      completionTime: '2023-12-01T10:32:15Z',
      succeeded: 1,
      failed: 0,
      active: 0
    },
    {
      name: 'backup-database',
      namespace: 'production',
      completions: 1,
      duration: '15m32s',
      age: '1h',
      image: 'postgres:14-alpine',
      status: 'Complete',
      startTime: '2023-12-01T11:45:00Z',
      completionTime: '2023-12-01T12:00:32Z',
      succeeded: 1,
      failed: 0,
      active: 0
    },
    {
      name: 'process-logs',
      namespace: 'analytics',
      completions: 3,
      duration: '5m',
      age: '30m',
      image: 'log-processor:latest',
      status: 'Running',
      startTime: '2023-12-01T12:30:00Z',
      completionTime: null,
      succeeded: 2,
      failed: 0,
      active: 1
    },
    {
      name: 'cleanup-old-files',
      namespace: 'system',
      completions: 1,
      duration: '1m45s',
      age: '2h',
      image: 'busybox:1.35',
      status: 'Failed',
      startTime: '2023-12-01T11:30:00Z',
      completionTime: '2023-12-01T11:31:45Z',
      succeeded: 0,
      failed: 1,
      active: 0
    },
    {
      name: 'generate-reports',
      namespace: 'reporting',
      completions: 5,
      duration: '8m12s',
      age: '25m',
      image: 'report-generator:v2.0',
      status: 'Running',
      startTime: '2023-12-01T12:35:00Z',
      completionTime: null,
      succeeded: 3,
      failed: 1,
      active: 1
    }
  ];

  const getStatusTag = (status: string, succeeded: number, failed: number, active: number) => {
    let icon, color;
    
    switch (status) {
      case 'Complete':
        icon = <CheckCircleOutlined />;
        color = 'success';
        break;
      case 'Running':
        icon = <ClockCircleOutlined />;
        color = 'processing';
        break;
      case 'Failed':
        icon = <ExclamationCircleOutlined />;
        color = 'error';
        break;
      default:
        icon = null;
        color = 'default';
    }

    return (
      <div className="flex flex-col gap-1">
        <Tag color={color} icon={icon}>
          {status}
        </Tag>
        <div className="text-xs text-gray-500">
          S:{succeeded} F:{failed} A:{active}
        </div>
      </div>
    );
  };

  const getCompletionProgress = (succeeded: number, failed: number, completions: number) => {
    const total = succeeded + failed;
    const percent = completions > 0 ? Math.round((total / completions) * 100) : 0;
    const status = failed > 0 ? 'exception' : total === completions ? 'success' : 'active';
    
    return (
      <div className="flex items-center gap-2">
        <Progress
          percent={percent}
         
          status={status}
          showInfo={false}
          style={{ width: 60 }}
        />
        <span className="text-xs">{total}/{completions}</span>
      </div>
    );
  };

  const formatDuration = (duration: string) => {
    return <code className="text-xs">{duration}</code>;
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
      render: (status: string, record: any) => 
        getStatusTag(status, record.succeeded, record.failed, record.active)
    },
    {
      title: 'Completions',
      key: 'completions',
      render: (record: any) => 
        getCompletionProgress(record.succeeded, record.failed, record.completions)
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: string) => formatDuration(duration)
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age'
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
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button icon={<EyeOutlined />}  title="View details">
            View
          </Button>
          {record.status === 'Complete' || record.status === 'Failed' ? (
            <Button icon={<RedoOutlined />}  title="Create job from template">
              Recreate
            </Button>
          ) : null}
          <Button 
            icon={<DeleteOutlined />} 
             
            danger 
            title="Delete job"
            disabled={record.status === 'Running'}
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
        Jobs in Member Cluster: {memberClusterName}
      </h2>
      <div className="mb-4 text-sm text-gray-600">
        View and manage Kubernetes Jobs in the "{memberClusterName}" cluster. Jobs run pods to completion for batch workloads.
      </div>
      
      <Table
        columns={columns}
        dataSource={mockJobs}
        rowKey="name"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} jobs`
        }}
      />
      
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This is a placeholder implementation. The member cluster name "{memberClusterName}" 
          is successfully passed from the parent route and can be used for API calls to fetch cluster-specific Jobs.
          <br />
          <strong>Legend:</strong> S=Succeeded, F=Failed, A=Active pods
        </p>
      </div>
    </div>
  );
}