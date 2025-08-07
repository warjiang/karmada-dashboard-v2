import { Table, Tag, Button, Space, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, ApiOutlined, GlobalOutlined } from '@ant-design/icons';
import { useMemberClusterContext } from '../hooks';

export default function MemberClusterServices() {
  const { memberClusterName } = useMemberClusterContext();

  // Mock data for demonstration
  const mockServices = [
    {
      name: 'webapp-service',
      namespace: 'default',
      type: 'LoadBalancer',
      clusterIP: '10.96.1.15',
      externalIP: '203.0.113.5',
      ports: '80:30080/TCP, 443:30443/TCP',
      age: '7d',
      selector: 'app=webapp',
      endpoints: 3
    },
    {
      name: 'api-service',
      namespace: 'production',
      type: 'ClusterIP',
      clusterIP: '10.96.2.20',
      externalIP: '<none>',
      ports: '8080:8080/TCP',
      age: '15d',
      selector: 'app=api-server',
      endpoints: 5
    },
    {
      name: 'database-service',
      namespace: 'production',
      type: 'ClusterIP',
      clusterIP: '10.96.3.25',
      externalIP: '<none>',
      ports: '5432:5432/TCP',
      age: '20d',
      selector: 'app=postgres',
      endpoints: 1
    },
    {
      name: 'monitoring-service',
      namespace: 'monitoring',
      type: 'NodePort',
      clusterIP: '10.96.4.30',
      externalIP: '<none>',
      ports: '9090:30090/TCP',
      age: '10d',
      selector: 'app=prometheus',
      endpoints: 2
    },
    {
      name: 'redis-service',
      namespace: 'cache',
      type: 'ClusterIP',
      clusterIP: '10.96.5.35',
      externalIP: '<none>',
      ports: '6379:6379/TCP',
      age: '12d',
      selector: 'app=redis',
      endpoints: 1
    },
    {
      name: 'frontend-service',
      namespace: 'staging',
      type: 'LoadBalancer',
      clusterIP: '10.96.6.40',
      externalIP: '<pending>',
      ports: '80:30180/TCP',
      age: '2d',
      selector: 'app=frontend',
      endpoints: 0
    }
  ];

  const getTypeTag = (type: string) => {
    const typeColors: Record<string, string> = {
      'ClusterIP': 'blue',
      'NodePort': 'green',
      'LoadBalancer': 'purple',
      'ExternalName': 'orange'
    };
    
    const typeIcons: Record<string, React.ReactNode> = {
      'ClusterIP': <ApiOutlined />,
      'NodePort': <GlobalOutlined />,
      'LoadBalancer': <GlobalOutlined />,
      'ExternalName': <GlobalOutlined />
    };

    return (
      <Tag color={typeColors[type] || 'default'} icon={typeIcons[type]}>
        {type}
      </Tag>
    );
  };

  const getEndpointsTag = (endpoints: number) => {
    const color = endpoints > 0 ? 'success' : 'error';
    return <Tag color={color}>{endpoints} ready</Tag>;
  };

  const formatExternalIP = (externalIP: string) => {
    if (externalIP === '<none>') {
      return <span className="text-gray-400">None</span>;
    }
    if (externalIP === '<pending>') {
      return <Tag color="orange">Pending</Tag>;
    }
    return <code className="text-xs">{externalIP}</code>;
  };

  const formatSelector = (selector: string) => {
    return (
      <Tooltip title={selector}>
        <Tag color="geekblue" className="text-xs">
          {selector.length > 15 ? `${selector.substring(0, 15)}...` : selector}
        </Tag>
      </Tooltip>
    );
  };

  const formatPorts = (ports: string) => {
    const portList = ports.split(', ');
    if (portList.length === 1) {
      return <code className="text-xs">{ports}</code>;
    }
    
    return (
      <Tooltip title={ports}>
        <div className="flex items-center gap-1">
          <code className="text-xs">{portList[0]}</code>
          {portList.length > 1 && (
            <Tag size="small" color="blue">+{portList.length - 1}</Tag>
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
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => getTypeTag(type)
    },
    {
      title: 'Cluster IP',
      dataIndex: 'clusterIP',
      key: 'clusterIP',
      render: (clusterIP: string) => <code className="text-xs">{clusterIP}</code>
    },
    {
      title: 'External IP',
      dataIndex: 'externalIP',
      key: 'externalIP',
      render: (externalIP: string) => formatExternalIP(externalIP)
    },
    {
      title: 'Ports',
      dataIndex: 'ports',
      key: 'ports',
      render: (ports: string) => formatPorts(ports)
    },
    {
      title: 'Endpoints',
      dataIndex: 'endpoints',
      key: 'endpoints',
      render: (endpoints: number) => getEndpointsTag(endpoints)
    },
    {
      title: 'Selector',
      dataIndex: 'selector',
      key: 'selector',
      render: (selector: string) => formatSelector(selector)
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
          <Button icon={<EditOutlined />} size="small" title="Edit Service">
            Edit
          </Button>
          <Button icon={<DeleteOutlined />} size="small" danger title="Delete Service">
            Delete
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">
        Services in Member Cluster: {memberClusterName}
      </h2>
      <div className="mb-4 text-sm text-gray-600">
        View and manage Kubernetes Services in the "{memberClusterName}" cluster. Services provide stable network access to pods.
      </div>
      
      <Table
        columns={columns}
        dataSource={mockServices}
        rowKey="name"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} services`
        }}
      />
      
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This is a placeholder implementation. The member cluster name "{memberClusterName}" 
          is successfully passed from the parent route and can be used for API calls to fetch cluster-specific Services.
          <br />
          <strong>Service Types:</strong> ClusterIP (internal), NodePort (node access), LoadBalancer (external), ExternalName (DNS)
        </p>
      </div>
    </div>
  );
}