import { Button, Input, Select, Space, Table, TableColumnProps } from 'antd';
import { EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useMemberClusterContext } from '../hooks';
import { useQuery } from '@tanstack/react-query';
import { WorkloadKind } from '@/services';
import { useState } from 'react';
import {
    GetMemberClusterWorkloads,
    Workload,
} from '@/services/member-cluster/workload.ts';
import useNamespace from '../../../hooks/use-namespace.ts';
import i18nInstance from '@/utils/i18n.tsx';
import dayjs from 'dayjs';
// import {GetResource} from "@/services/member-cluster/unstructured.ts";

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
  const { data, isLoading } = useQuery({
    queryKey: [memberClusterName, 'GetWorkloads', JSON.stringify(filter)],
    queryFn: async () => {
      const workloads = await GetMemberClusterWorkloads({
        memberClusterName: memberClusterName,
        kind: filter.kind,
        namespace: filter.selectedWorkSpace,
        keyword: filter.searchText,
      });
      console.log('workloads.data', workloads);
      return workloads;
    },
  });

  const columns: TableColumnProps<Workload>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (_name: string, record: Workload) => (
        <>{record.objectMeta.name}</>
      ),
    },
    {
      title: 'Namespace',
      dataIndex: 'namespace',
      key: 'namespace',
      render: (_name: string, record: Workload) => (
        <>{record.objectMeta.namespace}</>
      ),
    },
    {
      title: 'Ready',
      dataIndex: 'replicas',
      key: 'replicas',
      render: (_status: string, record: Workload) => (
        <>
          {record.pods?.running}/{record.pods?.desired}
        </>
      ),
    },
    {
      title: 'Images',
      dataIndex: 'images',
      key: 'images',
      render: (_, record: Workload) => (
        <code className="text-xs">{record.containerImages?.[0]}</code>
      ),
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
      render: (_, r) => {
        const create = dayjs(r.objectMeta.creationTimestamp);
        return create.fromNow();
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, _record: Workload) => (
        <Space>
          <Button icon={<EyeOutlined />} title="View details" onClick={async () => {
              // const workloadDetail = await GetResource({
              //   memberClusterName: memberClusterName,
              //   namespace: record.objectMeta.namespace,
              //   name: record.objectMeta.name,
              //   kind: record.typeMeta.kind as WorkloadKind,
              // })
              // console.log('workloadDetail', workloadDetail)
          }}>
            View
          </Button>
          <Button icon={<EditOutlined />} title="Edit deployment">
            Edit
          </Button>
          {/* 
          <Button icon={<DeleteOutlined />}  danger title="Delete deployment">
            Delete
          </Button> */}
        </Space>
      ),
    },
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
          rowKey={(record) =>
            `${record.objectMeta.namespace}-${record.objectMeta.name}`
          }
          columns={columns}
          dataSource={data?.deployments || []}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} deployments`,
          }}
          scroll={{ y: 'calc(100vh - 400px)' }}
          loading={isLoading}
        />
      </div>
    </div>
  );
}
