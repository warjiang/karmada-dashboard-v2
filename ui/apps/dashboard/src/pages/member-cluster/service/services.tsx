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

import {
  App,
  Button,
  Drawer,
  Input,
  Select,
  Space,
  Table,
  TableColumnProps,
  Tag,
  Tooltip,
  Descriptions,
  Badge,
} from 'antd';
import { Icons } from '@/components/icons';
import { TablePageLayout } from '@/components/table-page-layout';
import React from 'react';
import { useMemberClusterContext, useMemberClusterNamespace } from '@/hooks';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  GetMemberClusterServiceDetail,
  GetMemberClusterServiceEvents,
  GetMemberClusterServices,
  Service,
  ServiceType,
} from '@/services/member-cluster/service';
import dayjs from 'dayjs';
import { stringify, parse } from 'yaml';
import { MonacoEditor } from '@/components/monaco-editor';
import { GetResource, PutResource } from '@/services/member-cluster/unstructured';
import { Event } from '@/services/member-cluster/event';
import { cn } from '@/utils/cn';

export default function MemberClusterServices() {
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
  const [viewDetail, setViewDetail] = useState<Service | null>(null);
  const [viewEvents, setViewEvents] = useState<Event[]>([]);
  const [viewLoading, setViewLoading] = useState(false);

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['GetServices', memberClusterName, filter],
    queryFn: async () => {
      const ret = await GetMemberClusterServices({
        memberClusterName,
        namespace: filter.selectedWorkSpace,
        keyword: filter.searchText,
      });
      return ret.data;
    },
  });

  const getTypeTag = (type: ServiceType) => {
    const typeColors: Record<ServiceType, string> = {
      [ServiceType.ClusterIP]: 'blue',
      [ServiceType.NodePort]: 'green',
      [ServiceType.LoadBalancer]: 'purple',
      [ServiceType.ExternalName]: 'orange',
    };

    const typeIcons: Record<string, React.ReactNode> = {
      'ClusterIP': <Icons.api className="w-3.5 h-3.5" />,
      'NodePort': <Icons.global className="w-3.5 h-3.5" />,
      'LoadBalancer': <Icons.global className="w-3.5 h-3.5" />,
      'ExternalName': <Icons.global className="w-3.5 h-3.5" />
    };

    return (
      <Tag 
        color={typeColors[type] || 'default'} 
        className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border-0"
        style={{ backgroundColor: `var(--kd-${typeColors[type] || 'gray'}-50)`, color: `var(--kd-${typeColors[type] || 'gray'}-600)` }}
      >
        {typeIcons[type]}
        {type}
      </Tag>
    );
  };

  const getEndpointsTag = (endpointCount: number) => {
    const isReady = endpointCount > 0;
    return (
      <Badge
        status={isReady ? 'success' : 'error'}
        text={
          <span className={cn(
            'text-xs font-medium',
            isReady ? 'text-[var(--kd-success-600)]' : 'text-[var(--kd-error-600)]'
          )}>
            {endpointCount} ready
          </span>
        }
      />
    );
  };

  const formatExternalIPs = (svc: Service) => {
    const addresses = svc.externalEndpoints
      ?.flatMap((ep) => ep.host)
      .filter(Boolean);

    if (!addresses || addresses.length === 0) {
      return <span className="text-[var(--kd-text-tertiary)] text-xs">-</span>;
    }

    if (addresses.length === 1) {
      return (
        <code className="text-xs bg-[var(--kd-gray-100)] px-2 py-1 rounded text-[var(--kd-text-primary)]">
          {addresses[0]}
        </code>
      );
    }

    return (
      <Tooltip title={addresses.join(', ')}>
        <div className="flex items-center gap-1">
          <code className="text-xs bg-[var(--kd-gray-100)] px-2 py-1 rounded text-[var(--kd-text-primary)]">
            {addresses[0]}
          </code>
          <Tag color="blue" className="text-xs px-1.5 py-0">+{addresses.length - 1}</Tag>
        </div>
      </Tooltip>
    );
  };

  const formatSelector = (svc: Service) => {
    const selectorEntries = Object.entries(svc.selector || {});
    if (!selectorEntries.length) {
      return <span className="text-[var(--kd-text-tertiary)] text-xs">-</span>;
    }
    const selectorText = selectorEntries
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');

    return (
      <Tooltip title={selectorText}>
        <Tag 
          color="geekblue" 
          className="text-xs max-w-[150px] truncate"
        >
          {selectorText}
        </Tag>
      </Tooltip>
    );
  };

  const formatPorts = (svc: Service) => {
    const ports = svc.internalEndpoint?.ports || [];
    if (!ports.length) {
      return <span className="text-[var(--kd-text-tertiary)] text-xs">-</span>;
    }

    const portStrings = ports.map((p) => `${p.port}/${p.protocol}`);

    if (portStrings.length === 1) {
      return (
        <code className="text-xs bg-[var(--kd-gray-100)] px-2 py-1 rounded text-[var(--kd-text-primary)]">
          {portStrings[0]}
        </code>
      );
    }

    return (
      <Tooltip title={portStrings.join(', ')}>
        <div className="flex items-center gap-1">
          <code className="text-xs bg-[var(--kd-gray-100)] px-2 py-1 rounded text-[var(--kd-text-primary)]">
            {portStrings[0]}
          </code>
          <Tag color="blue" className="text-xs px-1.5 py-0">+{portStrings.length - 1}</Tag>
        </div>
      </Tooltip>
    );
  };

  const columns: TableColumnProps<Service>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (_: string, record: Service) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--kd-primary-50)] flex items-center justify-center flex-shrink-0">
            <Icons.cloud className="w-4 h-4 text-[var(--kd-primary-600)]" />
          </div>
          <span className="font-medium text-[var(--kd-text-primary)] text-sm">
            {record.objectMeta.name}
          </span>
        </div>
      ),
    },
    {
      title: 'Namespace',
      dataIndex: 'namespace',
      key: 'namespace',
      width: 120,
      render: (_: string, record: Service) => (
        <span className="text-sm text-[var(--kd-text-secondary)]">
          {record.objectMeta.namespace}
        </span>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (_: string, record: Service) => getTypeTag(record.type),
    },
    {
      title: 'Cluster IP',
      dataIndex: 'clusterIP',
      key: 'clusterIP',
      width: 120,
      render: (_: string, record: Service) => (
        <code className="text-xs bg-[var(--kd-gray-100)] px-2 py-1 rounded text-[var(--kd-text-primary)]">
          {record.clusterIP}
        </code>
      ),
    },
    {
      title: 'External IP',
      dataIndex: 'externalIP',
      key: 'externalIP',
      width: 150,
      render: (_: string, record: Service) => formatExternalIPs(record),
    },
    {
      title: 'Ports',
      dataIndex: 'ports',
      key: 'ports',
      width: 120,
      render: (_: string, record: Service) => formatPorts(record),
    },
    {
      title: 'Endpoints',
      dataIndex: 'endpoints',
      key: 'endpoints',
      width: 100,
      render: (_: number, record: Service) => {
        const endpointCount = record.internalEndpoint?.ports?.length || 0;
        return getEndpointsTag(endpointCount);
      },
    },
    {
      title: 'Selector',
      dataIndex: 'selector',
      key: 'selector',
      width: 180,
      render: (_: string, record: Service) => formatSelector(record),
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
      width: 80,
      render: (_: string, record: Service) => {
        const create = dayjs(record.objectMeta.creationTimestamp);
        return (
          <span className="text-xs text-[var(--kd-text-secondary)]">
            {create.fromNow()}
          </span>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_: unknown, record: Service) => (
        <Space size={4}>
          <Tooltip title="View details">
            <Button
              type="text"
              size="small"
              icon={<Icons.eye className="w-4 h-4" />}
              className="text-[var(--kd-text-secondary)] hover:text-[var(--kd-primary-600)] hover:bg-[var(--kd-primary-50)]"
              onClick={async () => {
                setViewDetail(record);
                setViewLoading(true);
                try {
                  const detailResp = await GetMemberClusterServiceDetail({
                    memberClusterName,
                    namespace: record.objectMeta.namespace,
                    name: record.objectMeta.name,
                  });
                  const eventsResp = await GetMemberClusterServiceEvents({
                    memberClusterName,
                    namespace: record.objectMeta.namespace,
                    name: record.objectMeta.name,
                  });

                  setViewDetail((detailResp.data ?? {}) as Service);
                  setViewEvents(eventsResp?.data?.events ?? []);
                  setViewDrawerOpen(true);
                } catch {
                  void messageApi.error('Failed to load Service details');
                } finally {
                  setViewLoading(false);
                }
              }}
            />
          </Tooltip>
          <Tooltip title="Edit Service">
            <Button
              type="text"
              size="small"
              icon={<Icons.edit className="w-4 h-4" />}
              className="text-[var(--kd-text-secondary)] hover:text-[var(--kd-primary-600)] hover:bg-[var(--kd-primary-50)]"
              onClick={async () => {
                try {
                  const ret = await GetResource({
                    memberClusterName,
                    kind: record.typeMeta.kind,
                    name: record.objectMeta.name,
                    namespace: record.objectMeta.namespace,
                  });

                  if (ret.status !== 200) {
                    void messageApi.error('Failed to load Service');
                    return;
                  }

                  setEditContent(stringify(ret.data));
                  setEditDrawerOpen(true);
                } catch {
                  void messageApi.error('Failed to load Service');
                }
              }}
            />
          </Tooltip>
          <Tooltip title="Delete Service">
            <Button
              type="text"
              size="small"
              danger
              disabled
              icon={<Icons.delete className="w-4 h-4" />}
              className="hover:bg-[var(--kd-error-50)]"
            />
          </Tooltip>
        </Space>
      ),
    }
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
        dataSource={data?.services || []}
        rowKey={(record) => `${record.objectMeta.namespace}-${record.objectMeta.name}`}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} services`,
          className: 'px-4 py-3',
        }}
        loading={isLoading}
        scroll={{ x: 1400 }}
        className="kd-table"
      />

      {/* View Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <Icons.cloud className="w-5 h-5 text-[var(--kd-primary-600)]" />
            <span>Service Details</span>
          </div>
        }
        placement="right"
        width={700}
        open={viewDrawerOpen}
        onClose={() => {
          setViewDrawerOpen(false);
          setViewDetail(null);
          setViewEvents([]);
        }}
        destroyOnClose
      >
        {viewLoading && (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--kd-primary-600)]" />
          </div>
        )}
        {!viewLoading && viewDetail && (
          <div className="space-y-6">
            <Descriptions
              title="Basic Information"
              column={1}
              bordered
              size="small"
              labelStyle={{ width: 120, backgroundColor: 'var(--kd-gray-50)' }}
              items={[
                { label: 'Name', children: viewDetail.objectMeta?.name },
                { label: 'Namespace', children: viewDetail.objectMeta?.namespace },
                { label: 'Type', children: viewDetail.type },
                { label: 'Cluster IP', children: viewDetail.clusterIP },
                { 
                  label: 'Created', 
                  children: viewDetail.objectMeta?.creationTimestamp
                    ? dayjs(viewDetail.objectMeta.creationTimestamp).format('YYYY-MM-DD HH:mm:ss')
                    : '-' 
                },
              ]}
            />

            <div>
              <h4 className="text-sm font-semibold mb-3 text-[var(--kd-text-primary)]">Selector</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(viewDetail.selector || {}).map(([k, v]) => (
                  <Tag key={k} color="geekblue" className="text-xs">
                    {k}={v}
                  </Tag>
                ))}
                {!viewDetail.selector && <span className="text-[var(--kd-text-tertiary)]">-</span>}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3 text-[var(--kd-text-primary)]">Events</h4>
              <div className="space-y-2 max-h-64 overflow-auto">
                {viewEvents.map((e) => (
                  <div 
                    key={e.objectMeta.uid} 
                    className="border border-[var(--kd-border-light)] rounded-lg p-3 text-xs"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge status={e.type === 'Normal' ? 'success' : 'error'} />
                      <span className="font-medium">{e.reason}</span>
                    </div>
                    <div className="text-[var(--kd-text-secondary)] mb-1">{e.message}</div>
                    <div className="text-[var(--kd-text-tertiary)] text-[11px]">
                      {e.sourceComponent} · {e.lastSeen}
                    </div>
                  </div>
                ))}
                {!viewEvents.length && (
                  <div className="text-center py-8 text-[var(--kd-text-tertiary)]">
                    No events
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Edit Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <Icons.edit className="w-5 h-5 text-[var(--kd-primary-600)]" />
            <span>Edit Service (YAML)</span>
          </div>
        }
        placement="right"
        width={900}
        open={editDrawerOpen}
        onClose={() => {
          if (!editSubmitting) {
            setEditDrawerOpen(false);
            setEditContent('');
          }
        }}
        destroyOnClose
        extra={
          <Space>
            <Button
              onClick={() => {
                setEditDrawerOpen(false);
                setEditContent('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              loading={editSubmitting}
              onClick={async () => {
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
                    void messageApi.error(
                      ret.message || 'Failed to update Service',
                    );
                    return;
                  }

                  setEditDrawerOpen(false);
                  setEditContent('');
                } catch {
                  void messageApi.error('Failed to update Service');
                } finally {
                  setEditSubmitting(false);
                }
              }}
            >
              Save
            </Button>
          </Space>
        }
      >
        <MonacoEditor
          height="calc(100vh - 180px)"
          defaultLanguage="yaml"
          value={editContent}
          onChange={(value: string | undefined) => setEditContent(value || '')}
        />
      </Drawer>
    </TablePageLayout>
  );
}
