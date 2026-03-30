/*
Copyright 2026 The Karmada Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { App, Input, Select, Table, TableColumnProps } from 'antd';
import { Icons } from '@/components/icons';
import { TablePageLayout } from '@/components/table-page-layout';
import { useMemberClusterContext, useMemberClusterNamespace } from '@/hooks';
import { useQuery } from '@tanstack/react-query';
import { WorkloadKind } from '@/services/base';
import { useState } from 'react';
import {
  GetMemberClusterWorkloadDetail,
  GetMemberClusterWorkloadEvents,
  GetMemberClusterWorkloads,
  Workload,
  WorkloadDetail,
  WorkloadEvent,
} from '@/services/member-cluster/workload';
import { stringify, parse } from 'yaml';
import { GetResource, PutResource } from '@/services/member-cluster/unstructured';
import { ActionButtons, NameCell, NamespaceCell, AgeCell, CodeCell } from '@/components/table-columns';
import { ViewDrawer, EditDrawer } from '@/components/resource-drawers';

export default function MemberClusterDaemonSets() {
  const { message: messageApi } = App.useApp();
  const { memberClusterName } = useMemberClusterContext();
  const [filter, setFilter] = useState<{
    selectedWorkSpace: string;
    searchText: string;
  }>({
    selectedWorkSpace: '',
    searchText: '',
  });
  const { nsOptions, isNsDataLoading } = useMemberClusterNamespace({ memberClusterName });
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [viewDetail, setViewDetail] = useState<WorkloadDetail | null>(null);
  const [viewEvents, setViewEvents] = useState<WorkloadEvent[]>([]);
  const [viewLoading, setViewLoading] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['GetDaemonSets', memberClusterName, filter],
    queryFn: async () => {
      const workloads = await GetMemberClusterWorkloads({
        memberClusterName,
        kind: WorkloadKind.Daemonset,
        namespace: filter.selectedWorkSpace,
        keyword: filter.searchText,
      });
      return workloads.data;
    },
  });

  const columns: TableColumnProps<Workload>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (_name: string, record: Workload) => (
        <NameCell
          name={record.objectMeta.name}
          icon={<Icons.deployment className="w-4 h-4" />}
        />
      ),
    },
    {
      title: 'Namespace',
      dataIndex: 'namespace',
      key: 'namespace',
      width: 120,
      render: (_name: string, record: Workload) => (
        <NamespaceCell namespace={record.objectMeta.namespace} />
      ),
    },
    {
      title: 'Ready',
      dataIndex: 'replicas',
      key: 'replicas',
      width: 100,
      render: (_status: string, record: Workload) => (
        <span className="text-sm text-[var(--kd-text-primary)]">
          {record.pods?.running}/{record.pods?.desired}
        </span>
      ),
    },
    {
      title: 'Images',
      dataIndex: 'images',
      key: 'images',
      width: 250,
      render: (_, record: Workload) => {
        const image = record.containerImages?.[0];
        if (!image) return <span className="text-[var(--kd-text-tertiary)] text-xs">-</span>;
        return <CodeCell value={image} />;
      },
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
      width: 80,
      render: (_, r) => <AgeCell creationTimestamp={r.objectMeta.creationTimestamp} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_, record: Workload) => (
        <ActionButtons
          onView={async () => {
            setViewLoading(true);
            try {
              const detailResp = await GetMemberClusterWorkloadDetail({
                memberClusterName,
                namespace: record.objectMeta.namespace,
                name: record.objectMeta.name,
                kind: WorkloadKind.Daemonset,
              });
              const eventsResp = await GetMemberClusterWorkloadEvents({
                memberClusterName,
                namespace: record.objectMeta.namespace,
                name: record.objectMeta.name,
                kind: WorkloadKind.Daemonset,
              });
              setViewDetail((detailResp?.data ?? ({} as any)) as WorkloadDetail);
              setViewEvents(eventsResp?.data?.events || []);
              setViewDrawerOpen(true);
            } finally {
              setViewLoading(false);
            }
          }}
          onEdit={async () => {
            try {
              const ret = await GetResource({
                memberClusterName,
                kind: record.typeMeta.kind,
                name: record.objectMeta.name,
                namespace: record.objectMeta.namespace,
              });

              if (ret.status !== 200) {
                void messageApi.error('Failed to load DaemonSet');
                return;
              }

              setEditContent(stringify(ret.data));
              setEditModalOpen(true);
            } catch {
              void messageApi.error('Failed to load DaemonSet');
            }
          }}
        />
      ),
    },
  ];

  const filterBar = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[var(--kd-text-secondary)]">Namespace:</span>
        <Select
          options={nsOptions}
          className="min-w-[160px]"
          value={filter.selectedWorkSpace}
          loading={isNsDataLoading}
          showSearch
          allowClear
          placeholder="All namespaces"
          onChange={(v) => {
            setFilter({
              ...filter,
              selectedWorkSpace: v,
            });
          }}
        />
      </div>
      <Input.Search
        placeholder="Search by name"
        className="w-[240px]"
        allowClear
        onPressEnter={(e) => {
          const input = e.currentTarget.value;
          setFilter({
            ...filter,
            searchText: input,
          });
        }}
        onSearch={(value) => {
          setFilter({
            ...filter,
            searchText: value,
          });
        }}
      />
    </div>
  );

  return (
    <TablePageLayout filterBar={filterBar}>
      <Table
        rowKey={(record) => `${record.objectMeta.namespace}-${record.objectMeta.name}`}
        columns={columns}
        dataSource={data?.daemonSets || []}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} daemonsets`,
          className: 'px-4 py-3',
        }}
        loading={isLoading}
        scroll={{ x: 1000 }}
        className="kd-table"
      />

      <ViewDrawer
        open={viewDrawerOpen}
        onClose={() => {
          setViewDrawerOpen(false);
          setViewDetail(null);
          setViewEvents([]);
        }}
        title="DaemonSet Details"
        icon={<Icons.deployment className="w-5 h-5 text-[var(--kd-primary-600)]" />}
        loading={viewLoading}
        detail={viewDetail}
        events={viewEvents}
        extraFields={[
          {
            label: 'Images',
            value: viewDetail?.containerImages?.join(', ') || '-',
          },
        ]}
      />

      <EditDrawer
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditContent('');
        }}
        title="Edit DaemonSet (YAML)"
        icon={<Icons.edit className="w-5 h-5 text-[var(--kd-primary-600)]" />}
        content={editContent}
        onChange={setEditContent}
        loading={editSubmitting}
        onSave={async () => {
          setEditSubmitting(true);
          try {
            const yamlObject = parse(editContent) as Record<string, any>;
            const ret = await PutResource({
              memberClusterName,
              kind: yamlObject.kind,
              name: yamlObject.metadata?.name,
              namespace: yamlObject.metadata?.namespace,
              content: yamlObject,
            });

            if (ret.code !== 200) {
              void messageApi.error(ret.message || 'Failed to update DaemonSet');
              return;
            }

            setEditModalOpen(false);
            setEditContent('');
            void messageApi.success('DaemonSet updated successfully');
          } catch {
            void messageApi.error('Failed to update DaemonSet');
          } finally {
            setEditSubmitting(false);
          }
        }}
      />
    </TablePageLayout>
  );
}
