import {
  App,
  Button,
  Drawer,
  Input,
  Space,
  Table,
  TableColumnProps,
  Tag,
  Tooltip,
  Progress,
} from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  LaptopOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMemberClusterContext } from '../hooks';
import {
  Node,
  NodeDetail,
  GetMemberClusterNodes,
  GetMemberClusterNodeDetail,
} from '@/services/member-cluster/node.ts';
import dayjs from 'dayjs';

export default function MemberClusterNodes() {
  const { message: messageApi } = App.useApp();
  const { memberClusterName } = useMemberClusterContext();

  const [filter, setFilter] = useState<{ searchText: string }>({
    searchText: '',
  });

  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [viewDetail, setViewDetail] = useState<NodeDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: [
      memberClusterName,
      'GetMemberClusterNodes',
      JSON.stringify(filter),
    ],
    queryFn: async () => {
      const ret = await GetMemberClusterNodes({
        memberClusterName,
        keyword: filter.searchText,
      });
      return ret;
    },
  });

  const getStatusTag = (ready: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      True: { color: 'success', icon: <CheckCircleOutlined /> },
      False: { color: 'error', icon: <WarningOutlined /> },
      Unknown: { color: 'default', icon: <WarningOutlined /> },
    };

    const config =
      statusConfig[ready] || { color: 'default', icon: <WarningOutlined /> };

    const label =
      ready === 'True' ? 'Ready' : ready === 'False' ? 'NotReady' : 'Unknown';

    return (
      <Tag color={config.color} icon={config.icon}>
        {label}
      </Tag>
    );
  };

  const getRolesTags = (node: Node) => {
    const labels = node.objectMeta.labels || {};
    const roles: string[] = [];

    const roleLabel = labels['kubernetes.io/role'];
    if (roleLabel) {
      roles.push(...roleLabel.split(','));
    }

    if (labels['node-role.kubernetes.io/control-plane']) {
      roles.push('control-plane');
    }
    if (labels['node-role.kubernetes.io/master']) {
      roles.push('master');
    }

    const uniqueRoles = [...new Set(roles)].filter(Boolean);

    if (!uniqueRoles.length) {
      return <span className="text-gray-400">None</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {uniqueRoles.map((role) => (
          <Tag
            key={role}
            color={role === 'control-plane' || role === 'master' ? 'red' : 'blue'}
          >
            {role}
          </Tag>
        ))}
      </div>
    );
  };

  const getPercentBar = (fraction: number) => {
    const percent = Math.round(fraction * 100);
    const status =
      percent >= 90 ? 'exception' : percent >= 70 ? 'active' : 'success';

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

  const getPodUsage = (allocatedPods: number, podCapacity: number) => {
    if (!podCapacity) {
      return <span className="text-gray-400">-</span>;
    }
    const percent = Math.round((allocatedPods / podCapacity) * 100);
    const status =
      percent >= 90 ? 'exception' : percent >= 70 ? 'active' : 'success';

    return (
      <div className="flex items-center gap-2">
        <Progress
          percent={percent}
          status={status}
          showInfo={false}
          style={{ width: 60 }}
        />
        <span className="text-xs">
          {allocatedPods}/{podCapacity}
        </span>
      </div>
    );
  };

  const columns: TableColumnProps<Node>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (_: string, record: Node) => (
        <div className="flex items-center gap-2">
          <LaptopOutlined className="text-blue-500" />
          <strong>{record.objectMeta.name}</strong>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'ready',
      key: 'ready',
      render: (_: string, record: Node) => getStatusTag(record.ready),
    },
    {
      title: 'Roles',
      key: 'roles',
      render: (_: unknown, record: Node) => getRolesTags(record),
    },
    {
      title: 'Version',
      key: 'version',
      render: (_: unknown, record: Node) => (
        <code className="text-xs">
          {record.nodeInfo?.kubeletVersion || record.nodeInfo?.kubeProxyVersion || '-'}
        </code>
      ),
    },
    {
      title: 'CPU Usage',
      key: 'cpuUsage',
      render: (_: unknown, record: Node) =>
        getPercentBar(record.allocatedResources.cpuFraction),
    },
    {
      title: 'Memory Usage',
      key: 'memoryUsage',
      render: (_: unknown, record: Node) =>
        getPercentBar(record.allocatedResources.memoryFraction),
    },
    {
      title: 'Pods',
      key: 'pods',
      render: (_: unknown, record: Node) =>
        getPodUsage(
          record.allocatedResources.allocatedPods,
          record.allocatedResources.podCapacity,
        ),
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
      render: (_: string, record: Node) => {
        const create = dayjs(record.objectMeta.creationTimestamp);
        return create.fromNow();
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Node) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            title="View node details"
            onClick={async () => {
              setViewLoading(true);
              try {
                const detail = await GetMemberClusterNodeDetail({
                  memberClusterName,
                  name: record.objectMeta.name,
                });
                setViewDetail(detail as NodeDetail);
                setViewDrawerOpen(true);
              } catch {
                void messageApi.error('Failed to load node');
              } finally {
                setViewLoading(false);
              }
            }}
          >
            View
          </Button>
          <Button icon={<EditOutlined />} title="Edit node" disabled>
            Edit
          </Button>
          <Button
            icon={<DeleteOutlined />}
            danger
            title="Drain node"
            disabled
          >
            Drain
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="h-full w-full flex flex-col p-4">
      <div className="flex flex-row space-x-4 mb-4">
        <Input.Search
          placeholder="Search by node name"
          className="w-[300px]"
          onPressEnter={(e) => {
            const input = e.currentTarget.value;
            setFilter({
              ...filter,
              searchText: input,
            });
          }}
        />
      </div>

      <div className="flex-1 flex flex-col">
        <Table
          columns={columns}
          dataSource={data?.nodes || []}
          rowKey={(record) => record.objectMeta.name}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} nodes`,
          }}
          loading={isLoading}
          scroll={{ x: 1200 }}
        />
      </div>

      <Drawer
        title="Node details"
        placement="right"
        width={900}
        open={viewDrawerOpen}
        onClose={() => {
          setViewDrawerOpen(false);
          setViewDetail(null);
        }}
        destroyOnClose
      >
        {viewLoading && <div>Loading...</div>}
        {!viewLoading && viewDetail && (
          <div className="space-y-4">
            <div>
              <div className="font-semibold mb-2">Basic Info</div>
              <div>Name: {viewDetail.objectMeta?.name}</div>
              <div>
                Created:{' '}
                {viewDetail.objectMeta?.creationTimestamp
                  ? dayjs(viewDetail.objectMeta.creationTimestamp).format(
                      'YYYY-MM-DD HH:mm:ss',
                    )
                  : '-'}
              </div>
              <div>Status: {getStatusTag(viewDetail.ready)}</div>
            </div>
            <div>
              <div className="font-semibold mb-2">System Info</div>
              <div>OS: {viewDetail.nodeInfo?.osImage || '-'}</div>
              <div>Kernel: {viewDetail.nodeInfo?.kernelVersion || '-'}</div>
              <div>
                Container Runtime:{' '}
                {viewDetail.nodeInfo?.containerRuntimeVersion || '-'}
              </div>
              <div>Kubelet: {viewDetail.nodeInfo?.kubeletVersion || '-'}</div>
            </div>
            <div>
              <div className="font-semibold mb-2">Resources</div>
              <div>
                CPU:{' '}
                {getPercentBar(viewDetail.allocatedResources?.cpuFraction ?? 0)}
              </div>
              <div>
                Memory:{' '}
                {getPercentBar(viewDetail.allocatedResources?.memoryFraction ?? 0)}
              </div>
              <div>
                Pods:{' '}
                {getPodUsage(
                  viewDetail.allocatedResources?.allocatedPods ?? 0,
                  viewDetail.allocatedResources?.podCapacity ?? 0,
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
