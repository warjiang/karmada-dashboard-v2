import { Table, Tag, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useMemberClusterContext } from '../hooks';
import {useQuery} from "@tanstack/react-query";
import {WorkloadKind} from "@/services";
import {useState} from "react";
import {GetMemberClusterWorkloads} from "@/services/member-cluster/workload.ts";

export default function MemberClusterDeployments() {
  const { memberClusterName } = useMemberClusterContext();
  const [filter, setFilter] = useState<{
    kind: WorkloadKind;
    selectedWorkSpace: string;
    searchText: string;
  }>({
    kind: WorkloadKind.Deployment,
    selectedWorkSpace: '',
    searchText: '',
  });
    const { data, isLoading, refetch } = useQuery({
    queryKey: [memberClusterName, 'GetWorkloads', JSON.stringify(filter)],
    queryFn: async () => {
      const clusters = await GetMemberClusterWorkloads({
          memberClusterName:memberClusterName,
        kind: filter.kind,
        namespace: filter.selectedWorkSpace,
        keyword: filter.searchText,
      });
      return clusters.data || {};
    },
  });
    console.log("payload", {
        data,isLoading, refetch
    })
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
          <Button icon={<EyeOutlined />}  title="View details">
            View
          </Button>
          <Button icon={<EditOutlined />}  title="Edit deployment">
            Edit
          </Button>
          {/* 
          <Button icon={<DeleteOutlined />}  danger title="Delete deployment">
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