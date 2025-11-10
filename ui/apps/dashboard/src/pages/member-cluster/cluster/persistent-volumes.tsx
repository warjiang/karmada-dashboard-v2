import { Table, Tag, Button, Space, Progress } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, HddOutlined, CloudOutlined } from '@ant-design/icons';
import { useMemberClusterContext } from '../hooks';

export default function MemberClusterPersistentVolumes() {
  const { memberClusterName } = useMemberClusterContext();

  const mockPersistentVolumes = [
    {
      name: 'pv-database-001',
      status: 'Bound',
      claim: 'production/database-storage',
      capacity: '50Gi',
      accessModes: ['ReadWriteOnce'],
      reclaimPolicy: 'Retain',
      storageClass: 'fast-ssd',
      reason: '',
      age: '15d',
      volumeMode: 'Filesystem',
      usagePercent: 65
    },
    {
      name: 'pv-logs-002',
      status: 'Bound',
      claim: 'default/webapp-logs',
      capacity: '10Gi',
      accessModes: ['ReadWriteMany'],
      reclaimPolicy: 'Delete',
      storageClass: 'standard',
      reason: '',
      age: '7d',
      volumeMode: 'Filesystem',
      usagePercent: 42
    },
    {
      name: 'pv-backup-003',
      status: 'Available',
      claim: '',
      capacity: '100Gi',
      accessModes: ['ReadWriteOnce'],
      reclaimPolicy: 'Retain',
      storageClass: 'slow-hdd',
      reason: '',
      age: '30d',
      volumeMode: 'Filesystem',
      usagePercent: 0
    },
    {
      name: 'pv-cache-004',
      status: 'Released',
      claim: 'cache/redis-data',
      capacity: '20Gi',
      accessModes: ['ReadWriteOnce'],
      reclaimPolicy: 'Delete',
      storageClass: 'fast-ssd',
      reason: 'Claim deleted',
      age: '25d',
      volumeMode: 'Filesystem',
      usagePercent: 0
    }
  ];

  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      'Available': { color: 'default', icon: <CloudOutlined /> },
      'Bound': { color: 'success', icon: <HddOutlined /> },
      'Released': { color: 'warning', icon: <HddOutlined /> },
      'Failed': { color: 'error', icon: <HddOutlined /> }
    };

    const config = statusConfig[status] || { color: 'default', icon: <HddOutlined /> };
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {status}
      </Tag>
    );
  };

  const getReclaimPolicyTag = (policy: string) => {
    const policyColors: Record<string, string> = {
      'Retain': 'blue',
      'Delete': 'orange',
      'Recycle': 'purple'
    };

    return (
      <Tag color={policyColors[policy] || 'default'}>
        {policy}
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

  const formatClaim = (claim: string, status: string) => {
    if (!claim || status === 'Available') {
      return <span className="text-gray-400">Unbound</span>;
    }
    
    const [namespace, name] = claim.split('/');
    return (
      <div className="flex items-center gap-1">
        <Tag color="cyan">{namespace}</Tag>
        <code className="text-xs">{name}</code>
      </div>
    );
  };

  const getUsageProgress = (usagePercent: number, status: string) => {
    if (status !== 'Bound' || usagePercent === 0) {
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

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <strong>{name}</strong>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status)
    },
    {
      title: 'Claim',
      key: 'claim',
      render: (record: any) => formatClaim(record.claim, record.status)
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
      title: 'Reclaim Policy',
      dataIndex: 'reclaimPolicy',
      key: 'reclaimPolicy',
      render: (policy: string) => getReclaimPolicyTag(policy)
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
      title: 'Age',
      dataIndex: 'age',
      key: 'age'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button icon={<EyeOutlined />}  title="View PV details">
            View
          </Button>
          <Button icon={<EditOutlined />}  title="Edit PV">
            Edit
          </Button>
          <Button 
            icon={<DeleteOutlined />} 
             
            danger 
            title="Delete PV"
            disabled={record.status === 'Bound'}
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
        Persistent Volumes in Member Cluster: {memberClusterName}
      </h2>
      <div className="mb-4 text-sm text-gray-600">
        View and manage Kubernetes Persistent Volumes in the "{memberClusterName}" cluster. PVs are cluster-wide storage resources.
      </div>
      
      <Table
        columns={columns}
        dataSource={mockPersistentVolumes}
        rowKey="name"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} persistent volumes`
        }}
        scroll={{ x: 1200 }}
      />
      
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Bound PVs cannot be deleted. The member cluster name "{memberClusterName}" 
          is successfully passed from the parent route and can be used for API calls to fetch cluster-specific PVs.
          <br />
          <strong>Reclaim Policies:</strong> Retain (manual cleanup), Delete (automatic cleanup), Recycle (deprecated)
        </p>
      </div>
    </div>
  );
}