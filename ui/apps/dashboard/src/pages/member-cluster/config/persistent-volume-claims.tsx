import { Table, Tag, Button, Space, Progress } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, HddOutlined, CloudOutlined } from '@ant-design/icons';
import { useMemberClusterContext } from '../hooks';

export default function MemberClusterPersistentVolumeClaims() {
  const { memberClusterName } = useMemberClusterContext();

  // Mock data for demonstration
  const mockPVCs = [
    {
      name: 'database-storage',
      namespace: 'production',
      status: 'Bound',
      volume: 'pv-database-001',
      capacity: '50Gi',
      accessModes: ['ReadWriteOnce'],
      storageClass: 'fast-ssd',
      age: '15d',
      mountedPods: ['postgres-0'],
      usagePercent: 65
    },
    {
      name: 'webapp-logs',
      namespace: 'default',
      status: 'Bound',
      volume: 'pv-logs-002',
      capacity: '10Gi',
      accessModes: ['ReadWriteMany'],
      storageClass: 'standard',
      age: '7d',
      mountedPods: ['webapp-1', 'webapp-2', 'webapp-3'],
      usagePercent: 42
    },
    {
      name: 'cache-data',
      namespace: 'cache',
      status: 'Bound',
      volume: 'pv-redis-003',
      capacity: '20Gi',
      accessModes: ['ReadWriteOnce'],
      storageClass: 'fast-ssd',
      age: '20d',
      mountedPods: ['redis-master-0'],
      usagePercent: 78
    },
    {
      name: 'backup-storage',
      namespace: 'backup',
      status: 'Pending',
      volume: '',
      capacity: '100Gi',
      accessModes: ['ReadWriteOnce'],
      storageClass: 'slow-hdd',
      age: '2h',
      mountedPods: [],
      usagePercent: 0
    },
    {
      name: 'monitoring-data',
      namespace: 'monitoring',
      status: 'Bound',
      volume: 'pv-prometheus-004',
      capacity: '30Gi',
      accessModes: ['ReadWriteOnce'],
      storageClass: 'standard',
      age: '12d',
      mountedPods: ['prometheus-0'],
      usagePercent: 85
    },
    {
      name: 'shared-files',
      namespace: 'staging',
      status: 'Bound',
      volume: 'pv-shared-005',
      capacity: '15Gi',
      accessModes: ['ReadWriteMany'],
      storageClass: 'standard',
      age: '5d',
      mountedPods: ['frontend-1', 'backend-1'],
      usagePercent: 23
    }
  ];

  const getStatusTag = (status: string) => {
    const statusColors: Record<string, string> = {
      'Bound': 'success',
      'Pending': 'processing',
      'Lost': 'error',
      'Available': 'default'
    };
    
    const statusIcons: Record<string, React.ReactNode> = {
      'Bound': <HddOutlined />,
      'Pending': <CloudOutlined />,
      'Lost': <HddOutlined />,
      'Available': <HddOutlined />
    };

    return (
      <Tag color={statusColors[status] || 'default'} icon={statusIcons[status]}>
        {status}
      </Tag>
    );
  };

  const getStorageClassTag = (storageClass: string) => {
    const classColors: Record<string, string> = {
      'fast-ssd': 'red',
      'standard': 'blue',
      'slow-hdd': 'orange'
    };

    return (
      <Tag color={classColors[storageClass] || 'default'}>
        {storageClass}
      </Tag>
    );
  };

  const formatAccessModes = (modes: string[]) => {
    const modeAbbrev: Record<string, string> = {
      'ReadWriteOnce': 'RWO',
      'ReadOnlyMany': 'ROX',
      'ReadWriteMany': 'RWX'
    };

    return (
      <div className="flex gap-1">
        {modes.map((mode, index) => (
          <Tag key={index}  color="geekblue">
            {modeAbbrev[mode] || mode}
          </Tag>
        ))}
      </div>
    );
  };

  const formatMountedPods = (pods: string[]) => {
    if (pods.length === 0) {
      return <span className="text-gray-400">None</span>;
    }
    
    if (pods.length === 1) {
      return <code className="text-xs">{pods[0]}</code>;
    }
    
    return (
      <div className="flex items-center gap-1">
        <code className="text-xs">{pods[0]}</code>
        <Tag  color="cyan">+{pods.length - 1}</Tag>
      </div>
    );
  };

  const getUsageProgress = (usagePercent: number, status: string) => {
    if (status !== 'Bound') {
      return <span className="text-gray-400">N/A</span>;
    }

    const getStatus = () => {
      if (usagePercent >= 90) return 'exception';
      if (usagePercent >= 80) return 'active';
      return 'success';
    };

    return (
      <div className="flex items-center gap-2">
        <Progress
          percent={usagePercent}
         
          status={getStatus()}
          showInfo={false}
          style={{ width: 60 }}
        />
        <span className="text-xs">{usagePercent}%</span>
      </div>
    );
  };

  const formatVolume = (volume: string, status: string) => {
    if (status !== 'Bound' || !volume) {
      return <span className="text-gray-400">Not bound</span>;
    }
    return <code className="text-xs">{volume}</code>;
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
      title: 'Volume',
      key: 'volume',
      render: (record: any) => formatVolume(record.volume, record.status)
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (capacity: string) => <code className="text-xs">{capacity}</code>
    },
    {
      title: 'Access Modes',
      dataIndex: 'accessModes',
      key: 'accessModes',
      render: (modes: string[]) => formatAccessModes(modes)
    },
    {
      title: 'Storage Class',
      dataIndex: 'storageClass',
      key: 'storageClass',
      render: (storageClass: string) => getStorageClassTag(storageClass)
    },
    {
      title: 'Usage',
      key: 'usage',
      render: (record: any) => getUsageProgress(record.usagePercent, record.status)
    },
    {
      title: 'Mounted Pods',
      dataIndex: 'mountedPods',
      key: 'mountedPods',
      render: (pods: string[]) => formatMountedPods(pods)
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
          <Button icon={<EyeOutlined />}  title="View PVC details">
            View
          </Button>
          <Button icon={<EditOutlined />}  title="Edit PVC">
            Edit
          </Button>
          <Button 
            icon={<DeleteOutlined />} 
             
            danger 
            title="Delete PVC"
            disabled={record.mountedPods.length > 0}
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
        Persistent Volume Claims in Member Cluster: {memberClusterName}
      </h2>
      <div className="mb-4 text-sm text-gray-600">
        View and manage Kubernetes Persistent Volume Claims in the "{memberClusterName}" cluster. PVCs request storage resources.
      </div>
      
      <Table
        columns={columns}
        dataSource={mockPVCs}
        rowKey="name"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} persistent volume claims`
        }}
      />
      
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This is a placeholder implementation. The member cluster name "{memberClusterName}" 
          is successfully passed from the parent route and can be used for API calls to fetch cluster-specific PVCs.
          <br />
          <strong>Access Modes:</strong> RWO (ReadWriteOnce), ROX (ReadOnlyMany), RWX (ReadWriteMany)
        </p>
      </div>
    </div>
  );
}