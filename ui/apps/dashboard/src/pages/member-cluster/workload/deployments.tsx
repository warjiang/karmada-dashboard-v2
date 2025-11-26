import { Table, Tag, Button, Space, Input, Select} from 'antd';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useMemberClusterContext } from '../hooks';
import {useQuery} from "@tanstack/react-query";
import {WorkloadKind} from "@/services";
import {useState} from "react";
import {GetMemberClusterWorkloads} from "@/services/member-cluster/workload.ts";
import useNamespace from "../../../hooks/use-namespace.ts";
import i18nInstance from "@/utils/i18n.tsx";

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
  const { nsOptions, isNsDataLoading } = useNamespace({});
    const { data, isLoading, refetch } = useQuery({
    queryKey: [memberClusterName, 'GetWorkloads', JSON.stringify(filter)],
    queryFn: async () => {
      const clusters = await GetMemberClusterWorkloads({
          memberClusterName: memberClusterName,
        kind: filter.kind,
        namespace: filter.selectedWorkSpace,
        keyword: filter.searchText,
      });
      return clusters.data || {};
    },
  });

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
      <div className={'flex flex-row space-x-4 mb-4'}>
        <h3 className={'leading-[32px]'}>
          {i18nInstance.t('280c56077360c204e536eb770495bc5f', '命名空间')}：
        </h3>
        <Select
            options={nsOptions}
            className={'min-w-[200px]'}
            value={filter.selectedWorkSpace}
            loading={isNsDataLoading}
            showSearch
            allowClear
            onChange={(v) => {
              setFilter({
                ...filter,
                selectedWorkSpace: v,
              });
            }}
        />
        <Input.Search
            placeholder={i18nInstance.t(
                'cfaff3e369b9bd51504feb59bf0972a0',
                '按命名空间搜索',
            )}
            className={'w-[300px]'}
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
          dataSource={data?.items || []}
          rowKey="name"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} deployments`
          }}
          scroll={{ y: 'calc(100vh - 400px)' }}
          loading={isLoading}
        />
      </div>

    </div>
  );
}