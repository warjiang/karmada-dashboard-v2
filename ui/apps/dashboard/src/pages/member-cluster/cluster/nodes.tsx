import { Table, Tag, Button, Space, Progress } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, LaptopOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useMemberClusterContext } from '../hooks';

export default function MemberClusterNodes() {
  const { memberClusterName } = useMemberClusterContext();

  const mockNodes = [
    {
      name: 'node-1',
      status: 'Ready',
      roles: ['control-plane', 'master'],
      age: '45d',
      version: 'v1.28.2',
      internalIP: '10.0.1.10',
      externalIP: '203.0.113.10',
      os: 'Ubuntu 22.04.3 LTS',
      kernel: '5.15.0-84-generic',
      runtime: 'containerd://1.7.2',
      cpu: { capacity: '4', allocatable: '3900m', usage: '2100m' },
      memory: { capacity: '16Gi', allocatable: '15.5Gi', usage: '8.2Gi' },
      pods: { capacity: 110, current: 45 },
      conditions: [
        { type: 'Ready', status: 'True' },
        { type: 'DiskPressure', status: 'False' },
        { type: 'MemoryPressure', status: 'False' },
        { type: 'PIDPressure', status: 'False' }
      ]
    },
    {
      name: 'node-2',
      status: 'Ready',
      roles: ['worker'],
      age: '45d',
      version: 'v1.28.2',
      internalIP: '10.0.1.11',
      externalIP: '203.0.113.11',
      os: 'Ubuntu 22.04.3 LTS',
      kernel: '5.15.0-84-generic',
      runtime: 'containerd://1.7.2',
      cpu: { capacity: '8', allocatable: '7800m', usage: '4200m' },
      memory: { capacity: '32Gi', allocatable: '31.2Gi', usage: '18.5Gi' },
      pods: { capacity: 110, current: 67 },
      conditions: [
        { type: 'Ready', status: 'True' },
        { type: 'DiskPressure', status: 'False' },
        { type: 'MemoryPressure', status: 'True' },
        { type: 'PIDPressure', status: 'False' }
      ]
    },
    {
      name: 'node-3',
      status: 'NotReady',
      roles: ['worker'],
      age: '30d',
      version: 'v1.28.1',
      internalIP: '10.0.1.12',
      externalIP: '<none>',
      os: 'Ubuntu 22.04.2 LTS',
      kernel: '5.15.0-82-generic',
      runtime: 'containerd://1.7.1',
      cpu: { capacity: '4', allocatable: '3900m', usage: '0m' },
      memory: { capacity: '16Gi', allocatable: '15.5Gi', usage: '0Gi' },
      pods: { capacity: 110, current: 0 },
      conditions: [
        { type: 'Ready', status: 'False' },
        { type: 'DiskPressure', status: 'False' },
        { type: 'MemoryPressure', status: 'False' },
        { type: 'PIDPressure', status: 'False' }
      ]
    }
  ];

  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      'Ready': { color: 'success', icon: <CheckCircleOutlined /> },
      'NotReady': { color: 'error', icon: <WarningOutlined /> },
      'Unknown': { color: 'default', icon: <WarningOutlined /> }
    };

    const config = statusConfig[status] || { color: 'default', icon: <WarningOutlined /> };
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {status}
      </Tag>
    );
  };

  const getRolesTags = (roles: string[]) => {
    return (
      <div className="flex flex-wrap gap-1">
        {roles.map((role, index) => (
          <Tag key={index} color={role === 'control-plane' || role === 'master' ? 'red' : 'blue'}>
            {role}
          </Tag>
        ))}
      </div>
    );
  };

  const getResourceUsage = (usage: string, allocatable: string, _unit: string = '') => {
    const usageNum = parseFloat(usage.replace(/[^0-9.]/g, ''));
    const allocatableNum = parseFloat(allocatable.replace(/[^0-9.]/g, ''));
    const percent = Math.round((usageNum / allocatableNum) * 100);
    
    const status = percent >= 90 ? 'exception' : percent >= 70 ? 'active' : 'success';

    return (
      <div className="flex items-center gap-2">
        <Progress
          percent={percent}
         
          status={status}
          showInfo={false}
          style={{ width: 60 }}
        />
        <span className="text-xs">{percent}%</span>
      </div>
    );
  };

  const getPodUsage = (current: number, capacity: number) => {
    const percent = Math.round((current / capacity) * 100);
    const status = percent >= 90 ? 'exception' : percent >= 70 ? 'active' : 'success';

    return (
      <div className="flex items-center gap-2">
        <Progress
          percent={percent}
         
          status={status}
          showInfo={false}
          style={{ width: 60 }}
        />
        <span className="text-xs">{current}/{capacity}</span>
      </div>
    );
  };

  const getConditionsTag = (conditions: any[]) => {
    const readyCondition = conditions.find(c => c.type === 'Ready');
    const warningConditions = conditions.filter(c => c.type !== 'Ready' && c.status === 'True');
    
    return (
      <div className="flex flex-col gap-1">
        {readyCondition && (
          <Tag color={readyCondition.status === 'True' ? 'green' : 'red'}>
            {readyCondition.type}: {readyCondition.status}
          </Tag>
        )}
        {warningConditions.length > 0 && (
          <Tag color="orange">
            {warningConditions.length} warning(s)
          </Tag>
        )}
      </div>
    );
  };

  const formatIP = (ip: string) => {
    if (ip === '<none>' || !ip) {
      return <span className="text-gray-400">None</span>;
    }
    return <code className="text-xs">{ip}</code>;
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <div className="flex items-center gap-2">
          <LaptopOutlined className="text-blue-500" />
          <strong>{name}</strong>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status)
    },
    {
      title: 'Roles',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: string[]) => getRolesTags(roles)
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      render: (version: string) => <code className="text-xs">{version}</code>
    },
    {
      title: 'Internal IP',
      dataIndex: 'internalIP',
      key: 'internalIP',
      render: (ip: string) => formatIP(ip)
    },
    {
      title: 'External IP',
      dataIndex: 'externalIP',
      key: 'externalIP',
      render: (ip: string) => formatIP(ip)
    },
    {
      title: 'CPU Usage',
      key: 'cpuUsage',
      render: (record: any) => getResourceUsage(record.cpu.usage, record.cpu.allocatable)
    },
    {
      title: 'Memory Usage',
      key: 'memoryUsage',
      render: (record: any) => getResourceUsage(record.memory.usage, record.memory.allocatable)
    },
    {
      title: 'Pods',
      key: 'pods',
      render: (record: any) => getPodUsage(record.pods.current, record.pods.capacity)
    },
    {
      title: 'Conditions',
      dataIndex: 'conditions',
      key: 'conditions',
      render: (conditions: any[]) => getConditionsTag(conditions)
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
          <Button icon={<EyeOutlined />}  title="View node details">
            View
          </Button>
          <Button icon={<EditOutlined />}  title="Edit node labels">
            Edit
          </Button>
          <Button 
            icon={<DeleteOutlined />} 
             
            danger 
            title="Drain and delete node"
            disabled={record.roles.includes('control-plane') || record.roles.includes('master')}
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
        Nodes in Member Cluster: {memberClusterName}
      </h2>
      <div className="mb-4 text-sm text-gray-600">
        View and manage Kubernetes Nodes in the "{memberClusterName}" cluster. Nodes are the worker machines in the cluster.
      </div>
      
      <Table
        columns={columns}
        dataSource={mockNodes}
        rowKey="name"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} nodes`
        }}
        scroll={{ x: 1400 }}
      />
      
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Control plane nodes cannot be deleted. The member cluster name "{memberClusterName}" 
          is successfully passed from the parent route and can be used for API calls to fetch cluster-specific Nodes.
          <br />
          <strong>Resource Usage:</strong> Shows current resource utilization against allocatable capacity
        </p>
      </div>
    </div>
  );
}