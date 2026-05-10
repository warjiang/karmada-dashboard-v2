/*
Copyright 2024 The Karmada Authors.

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

import { useState, useMemo } from 'react';
import {
  Button,
  Card,
  Input,
  Select,
  Spin,
  Switch,
  Table,
  TableColumnProps,
  Tag,
  Typography,
  Space,
  Empty,
  Alert,
} from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Panel from '@/components/panel';
import { Icons } from '@/components/icons';
import {
  GetComponentMetrics,
  GetSyncStatus,
  SetComponentSync,
  KARMADA_COMPONENTS,
  ComponentMetricsResponse,
  Metric,
  MetricValue,
} from '@/services/metrics';

const { Title, Text } = Typography;

const MetricTypeColors: Record<string, string> = {
  COUNTER: 'blue',
  GAUGE: 'green',
  HISTOGRAM: 'purple',
  SUMMARY: 'orange',
  UNTYPED: 'default',
};

interface MetricRow {
  key: string;
  name: string;
  type: string;
  help: string;
  values: MetricValue[];
}

function buildRows(
  metricsData: ComponentMetricsResponse | undefined,
  selectedPod: string,
  search: string,
): MetricRow[] {
  if (!metricsData) return [];
  const podData = metricsData[selectedPod];
  if (!podData) return [];
  return Object.entries(podData.metrics)
    .filter(([name]) => !search || name.toLowerCase().includes(search.toLowerCase()))
    .map(([name, metric]: [string, Metric]) => ({
      key: name,
      name,
      type: metric.type,
      help: metric.help,
      values: metric.values ?? [],
    }));
}

const MetricsPage = () => {
  const queryClient = useQueryClient();
  const [activeComponent, setActiveComponent] = useState<string>(
    KARMADA_COMPONENTS[0].key,
  );
  const [selectedPod, setSelectedPod] = useState<string>('');
  const [search, setSearch] = useState('');

  const {
    data: syncStatus,
    isLoading: syncLoading,
    error: syncError,
  } = useQuery({
    queryKey: ['metricsSyncStatus'],
    queryFn: GetSyncStatus,
    refetchInterval: 30_000,
  });

  const {
    data: metricsData,
    isLoading: metricsLoading,
    error: metricsError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['componentMetrics', activeComponent],
    queryFn: () => GetComponentMetrics(activeComponent),
    enabled: !!activeComponent,
  });

  const syncMutation = useMutation({
    mutationFn: ({
      appName,
      enabled,
    }: {
      appName: string;
      enabled: boolean;
    }) => SetComponentSync(appName, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metricsSyncStatus'] });
    },
  });

  // Derive pod list from latest metrics response
  const pods = useMemo(() => {
    if (!metricsData) return [];
    return Object.keys(metricsData);
  }, [metricsData]);

  // Auto-select first pod when data/component changes
  const resolvedPod = useMemo(() => {
    if (pods.includes(selectedPod)) return selectedPod;
    return pods[0] ?? '';
  }, [pods, selectedPod]);

  const tableRows = useMemo(
    () => buildRows(metricsData, resolvedPod, search),
    [metricsData, resolvedPod, search],
  );

  const currentTime = useMemo(() => {
    if (!metricsData || !resolvedPod) return '';
    return metricsData[resolvedPod]?.currentTime ?? '';
  }, [metricsData, resolvedPod]);

  const columns: TableColumnProps<MetricRow>[] = [
    {
      title: 'Metric Name',
      dataIndex: 'name',
      key: 'name',
      width: '32%',
      render: (name: string) => (
        <code className="text-xs break-all">{name}</code>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type: string) => (
        <Tag color={MetricTypeColors[type] ?? 'default'}>{type}</Tag>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'help',
      key: 'help',
      ellipsis: true,
    },
    {
      title: 'Values',
      dataIndex: 'values',
      key: 'values',
      width: '30%',
      render: (values: MetricValue[]) => {
        if (!values || values.length === 0) return <Text type="secondary">-</Text>;
        const preview = values.slice(0, 3);
        return (
          <div className="space-y-1">
            {preview.map((v, i) => (
              <div key={i} className="text-xs">
                <span className="font-mono font-semibold">{v.value}</span>
                {v.measure && v.measure !== 'current_value' && v.measure !== 'total' && (
                  <Tag className="ml-1 text-xs" style={{ fontSize: 10 }}>
                    {v.measure}
                  </Tag>
                )}
                {v.labels && Object.keys(v.labels).length > 0 && (
                  <span className="text-gray-400 ml-1 break-all">
                    {'{'}
                    {Object.entries(v.labels)
                      .slice(0, 4)
                      .map(([k, val]) => `${k}="${val}"`)
                      .join(', ')}
                    {Object.keys(v.labels).length > 4 ? ', ...' : ''}
                    {'}'}
                  </span>
                )}
              </div>
            ))}
            {values.length > 3 && (
              <Text type="secondary" className="text-xs">
                +{values.length - 3} more
              </Text>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <Panel>
      <Title level={4} className="mb-4">
        Karmada Metrics
      </Title>

      {/* Sync Status Cards */}
      <Spin spinning={syncLoading}>
        {syncError ? (
          <Alert
            type="warning"
            message="Metrics scraper unavailable"
            description="Could not connect to the metrics-scraper service. Make sure it is running."
            className="mb-4"
          />
        ) : (
          <div className="flex flex-wrap gap-3 mb-6">
            {KARMADA_COMPONENTS.map(({ key, label }) => {
              const isActive = syncStatus?.[key] ?? false;
              return (
                <Card
                  key={key}
                  size="small"
                  className="min-w-[200px]"
                  styles={{ body: { padding: '8px 12px' } }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-sm">{label}</span>
                    <Switch
                      size="small"
                      checked={isActive}
                      loading={syncMutation.isPending}
                      onChange={(checked) =>
                        syncMutation.mutate({ appName: key, enabled: checked })
                      }
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Spin>

      {/* Component selector + Refresh */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Space>
          <Text strong>Component:</Text>
          {KARMADA_COMPONENTS.map(({ key, label }) => (
            <Button
              key={key}
              type={activeComponent === key ? 'primary' : 'default'}
              size="small"
              onClick={() => {
                setActiveComponent(key);
                setSelectedPod('');
              }}
            >
              {label}
            </Button>
          ))}
        </Space>
        <Button
          icon={<Icons.spinner size={14} />}
          size="small"
          loading={isFetching}
          onClick={() => refetch()}
        >
          Refresh
        </Button>
        {currentTime && (
          <Text type="secondary" className="text-xs">
            Last fetched: {new Date(currentTime).toLocaleString()}
          </Text>
        )}
      </div>

      {/* Pod selector */}
      {pods.length > 1 && (
        <div className="mb-4">
          <Space>
            <Text strong>Pod:</Text>
            <Select
              value={resolvedPod}
              options={pods.map((p) => ({ label: p, value: p }))}
              onChange={(v) => setSelectedPod(v)}
              style={{ minWidth: 340 }}
              size="small"
            />
          </Space>
        </div>
      )}

      {/* Metric Name search */}
      <div className="mb-4">
        <Input.Search
          placeholder="Filter by metric name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-[360px]"
          allowClear
        />
      </div>

      {/* Metrics Table */}
      <Spin spinning={metricsLoading}>
        {metricsError ? (
          <Alert
            type="error"
            message="Failed to fetch metrics"
            description={(metricsError as Error).message}
          />
        ) : !resolvedPod ? (
          <Empty
            description={
              metricsLoading
                ? 'Loading…'
                : 'No pods found for this component'
            }
          />
        ) : (
          <Table<MetricRow>
            rowKey="key"
            columns={columns}
            dataSource={tableRows}
            size="small"
            pagination={{ pageSize: 50, showSizeChanger: true }}
            scroll={{ x: 'max-content' }}
          />
        )}
      </Spin>
    </Panel>
  );
};

export default MetricsPage;
