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

import { App, Input, Select, Table, TableColumnProps, Tag, Tooltip } from 'antd';
import { Icons } from '@/components/icons';
import { TablePageLayout } from '@/components/table-page-layout';
import { useMemberClusterContext, useMemberClusterNamespace } from '@/hooks';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  GetMemberClusterSecrets,
  GetMemberClusterSecretDetail,
  Secret,
  SecretDetail,
} from '@/services/member-cluster/config';
import { stringify, parse } from 'yaml';
import { GetResource, PutResource } from '@/services/member-cluster/unstructured';
import { ActionButtons, NameCell, NamespaceCell, AgeCell } from '@/components/table-columns';
import { ViewDrawer, EditDrawer } from '@/components/resource-drawers';

export default function MemberClusterSecrets() {
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
  const [viewDetail, setViewDetail] = useState<SecretDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['GetMemberClusterSecrets', memberClusterName, filter],
    queryFn: async () => {
      const ret = await GetMemberClusterSecrets({
        memberClusterName,
        namespace: filter.selectedWorkSpace,
        keyword: filter.searchText,
      });
      return ret.data;
    },
  });

  const getTypeTag = (type: string) => {
    const typeColors: Record<string, string> = {
      'Opaque': 'blue',
      'kubernetes.io/tls': 'green',
      'kubernetes.io/dockerconfigjson': 'purple',
      'kubernetes.io/service-account-token': 'orange',
    };

    const displayType = type === 'kubernetes.io/dockerconfigjson'
      ? 'docker-registry'
      : type === 'kubernetes.io/service-account-token'
        ? 'service-account'
        : type;

    return (
      <Tag color={typeColors[type] || 'default'} className="text-xs">
        {displayType}
      </Tag>
    );
  };

  const formatDataKeys = (s: Secret) => {
    const keys = Object.keys(s.data || {});
    if (!keys.length) {
      return <span className="text-[var(--kd-text-tertiary)] text-xs">-</span>;
    }
    if (keys.length === 1) {
      return (
        <div className="flex items-center gap-1">
          <Icons.key className="w-4 h-4 text-[var(--kd-primary-600)]" />
          <code className="text-xs bg-[var(--kd-gray-100)] px-2 py-1 rounded">{keys[0]}</code>
        </div>
      );
    }

    return (
      <Tooltip title={keys.join(', ')}>
        <div className="flex items-center gap-1">
          <Icons.key className="w-4 h-4 text-[var(--kd-primary-600)]" />
          <code className="text-xs bg-[var(--kd-gray-100)] px-2 py-1 rounded">{keys[0]}</code>
          <Tag color="blue" className="text-xs">+{keys.length - 1}</Tag>
        </div>
      </Tooltip>
    );
  };

  const formatLabels = (s: Secret) => {
    const labels = s.objectMeta.labels || {};
    const entries = Object.entries(labels);
    if (!entries.length) {
      return <span className="text-[var(--kd-text-tertiary)] text-xs">-</span>;
    }
    const first = `${entries[0][0]}=${entries[0][1]}`;
    const remaining = entries.length - 1;

    if (entries.length === 1) {
      return (
        <Tag color="geekblue" className="text-xs">
          {first}
        </Tag>
      );
    }

    const full = entries.map(([k, v]) => `${k}=${v}`).join(', ');

    return (
      <Tooltip title={full}>
        <div className="flex items-center gap-1">
          <Tag color="geekblue" className="text-xs max-w-[150px] truncate">
            {first}
          </Tag>
          <Tag color="purple" className="text-xs">+{remaining}</Tag>
        </div>
      </Tooltip>
    );
  };

  const columns: TableColumnProps<Secret>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (_: string, record: Secret) => (
        <NameCell
          name={record.objectMeta.name}
          icon={<Icons.lock className="w-4 h-4" />}
        />
      ),
    },
    {
      title: 'Namespace',
      dataIndex: 'namespace',
      key: 'namespace',
      width: 120,
      render: (_: string, record: Secret) => (
        <NamespaceCell namespace={record.objectMeta.namespace} />
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (_: string, record: Secret) => getTypeTag(record.type),
    },
    {
      title: 'Data Keys',
      dataIndex: 'dataKeys',
      key: 'dataKeys',
      width: 200,
      render: (_: unknown, record: Secret) => formatDataKeys(record),
    },
    {
      title: 'Labels',
      dataIndex: 'labels',
      key: 'labels',
      width: 200,
      render: (_: unknown, record: Secret) => formatLabels(record),
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
      width: 80,
      render: (_: string, record: Secret) => (
        <AgeCell creationTimestamp={record.objectMeta.creationTimestamp} />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_: unknown, record: Secret) => (
        <ActionButtons
          onView={async () => {
            setViewLoading(true);
            try {
              const detailResp = await GetMemberClusterSecretDetail({
                memberClusterName,
                namespace: record.objectMeta.namespace,
                name: record.objectMeta.name,
              });

              setViewDetail(detailResp?.data as SecretDetail);
              setViewDrawerOpen(true);
            } catch {
              void messageApi.error('Failed to load Secret');
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
                void messageApi.error('Failed to load Secret');
                return;
              }

              setEditContent(stringify(ret.data));
              setEditDrawerOpen(true);
            } catch {
              void messageApi.error('Failed to load Secret');
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
        columns={columns}
        dataSource={data?.secrets || []}
        rowKey={(record) => `${record.objectMeta.namespace}-${record.objectMeta.name}`}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} secrets`,
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
        }}
        title="Secret Details"
        icon={<Icons.lock className="w-5 h-5 text-[var(--kd-primary-600)]" />}
        loading={viewLoading}
        detail={viewDetail}
        extraFields={[
          {
            label: 'Type',
            value: viewDetail?.type || '-',
          },
          {
            label: 'Keys',
            value: (viewDetail?.keys || []).join(', ') || '-',
          },
        ]}
      />

      <EditDrawer
        open={editDrawerOpen}
        onClose={() => {
          setEditDrawerOpen(false);
          setEditContent('');
        }}
        title="Edit Secret (YAML)"
        icon={<Icons.edit className="w-5 h-5 text-[var(--kd-primary-600)]" />}
        content={editContent}
        onChange={setEditContent}
        loading={editSubmitting}
        onSave={async () => {
          setEditSubmitting(true);
          try {
            const yamlObject = parse(editContent) as Record<string, any>;
            const kind = (yamlObject.kind || '') as string;
            const metadata = (yamlObject.metadata || {}) as {
              name?: string;
              namespace?: string;
            };
            const name = metadata.name || '';
            const namespace = metadata.namespace || '';

            const ret = await PutResource({
              memberClusterName,
              kind,
              name,
              namespace,
              content: yamlObject,
            });

            if (ret.code !== 200) {
              void messageApi.error(ret.message || 'Failed to update Secret');
              return;
            }

            setEditDrawerOpen(false);
            setEditContent('');
            void messageApi.success('Secret updated successfully');
          } catch {
            void messageApi.error('Failed to update Secret');
          } finally {
            setEditSubmitting(false);
          }
        }}
      />
    </TablePageLayout>
  );
}
