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

import React, { useState } from 'react';
import {
  Card,
  Table,
  Typography,
  Space,
  Button,
  Tag,
  Tooltip,
  Progress,
  Badge,
  Empty,
  Spin,
  Alert,
  Input,
  Select,
  Row,
  Col,
  Statistic,
  TableColumnProps,
} from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  LinkOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { DetailTabProps } from './index';
import { ResourceMeta, ResourceEvent } from '@/services/base';
import { formatAge } from '../ResourceList';

const { Text, Title } = Typography;
const { Search } = Input;
const { Option } = Select;

// Pods tab for workload resources
export const PodsTab: React.FC<DetailTabProps> = ({
  resource,
  memberClusterName,
  resourceType,
  onNavigate,
}) => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: podsData, isLoading, refetch } = useQuery({
    queryKey: [memberClusterName, 'pods', resource?.objectMeta?.namespace, resource?.objectMeta?.name],
    queryFn: async () => {
      // This would fetch pods related to the resource
      // For now, return mock data
      return {
        pods: [],
        listMeta: { totalItems: 0 }
      };
    },
    enabled: !!resource?.objectMeta?.name,
    staleTime: 10000,
    refetchInterval: 30000,
  });

  const pods = podsData?.pods || [];
  const filteredPods = pods.filter((pod: any) => {
    const matchesSearch = !searchText || pod.objectMeta.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = !statusFilter || pod.status?.phase === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: TableColumnProps<any>[] = [
    {
      title: 'Name',
      dataIndex: ['objectMeta', 'name'],
      key: 'name',
      render: (name: string, record: any) => (
        <Button
          type="link"
          onClick={() => onNavigate?.({ kind: 'Pod', namespace: record.objectMeta.namespace, name })}
        >
          {name}
        </Button>
      ),
    },
    {
      title: 'Status',
      dataIndex: ['status', 'phase'],
      key: 'status',
      render: (phase: string) => {
        const color = phase === 'Running' ? 'green' : phase === 'Pending' ? 'orange' : 'red';
        return <Tag color={color}>{phase}</Tag>;
      },
    },
    {
      title: 'Ready',
      key: 'ready',
      render: (record: any) => {
        const ready = record.status?.containerStatuses?.filter((c: any) => c.ready).length || 0;
        const total = record.status?.containerStatuses?.length || 0;
        return <Badge status={ready === total ? 'success' : 'processing'} text={`${ready}/${total}`} />;
      },
    },
    {
      title: 'Restarts',
      key: 'restarts',
      render: (record: any) => {
        const restarts = record.status?.containerStatuses?.reduce((sum: number, c: any) => sum + (c.restartCount || 0), 0) || 0;
        return <Text>{restarts}</Text>;
      },
    },
    {
      title: 'Age',
      dataIndex: ['objectMeta', 'creationTimestamp'],
      key: 'age',
      render: (timestamp: string) => formatAge(timestamp),
    },
    {
      title: 'Node',
      dataIndex: ['spec', 'nodeName'],
      key: 'node',
      render: (nodeName: string) => nodeName || '-',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Title level={5}>Pods ({filteredPods.length})</Title>
        <Space>
          <Search
            placeholder="Search pods..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
          <Select
            placeholder="Filter by status"
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
          >
            <Option value="Running">Running</Option>
            <Option value="Pending">Pending</Option>
            <Option value="Failed">Failed</Option>
            <Option value="Succeeded">Succeeded</Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} />
        </Space>
      </div>

      {filteredPods.length === 0 ? (
        <Empty description="No pods found" />
      ) : (
        <Table
          columns={columns}
          dataSource={filteredPods}
          rowKey={(record) => record.objectMeta.uid}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          size="small"
        />
      )}
    </div>
  );
};

// Endpoints tab for service resources
export const EndpointsTab: React.FC<DetailTabProps> = ({
  resource,
  memberClusterName,
}) => {
  const { data: endpointsData, isLoading } = useQuery({
    queryKey: [memberClusterName, 'endpoints', resource?.objectMeta?.namespace, resource?.objectMeta?.name],
    queryFn: async () => {
      // This would fetch endpoints for the service
      return { endpoints: [], listMeta: { totalItems: 0 } };
    },
    enabled: !!resource?.objectMeta?.name,
    staleTime: 10000,
  });

  const endpoints = endpointsData?.endpoints || [];

  const columns: TableColumnProps<any>[] = [
    {
      title: 'Address',
      dataIndex: 'host',
      key: 'host',
    },
    {
      title: 'Node',
      dataIndex: 'nodeName',
      key: 'nodeName',
      render: (nodeName: string) => nodeName || '-',
    },
    {
      title: 'Ready',
      dataIndex: 'ready',
      key: 'ready',
      render: (ready: boolean) => (
        <Badge status={ready ? 'success' : 'error'} text={ready ? 'Ready' : 'Not Ready'} />
      ),
    },
    {
      title: 'Ports',
      dataIndex: 'ports',
      key: 'ports',
      render: (ports: any[]) => (
        <Space wrap>
          {ports?.map((port, index) => (
            <Tag key={index}>{port.port}/{port.protocol}</Tag>
          ))}
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Title level={5}>Endpoints ({endpoints.length})</Title>
      
      {endpoints.length === 0 ? (
        <Empty description="No endpoints found" />
      ) : (
        <Table
          columns={columns}
          dataSource={endpoints}
          rowKey={(record, index) => `${record.host}-${index}`}
          pagination={false}
          size="small"
        />
      )}
    </div>
  );
};

// Metrics tab for resources that support metrics
export const MetricsTab: React.FC<DetailTabProps> = ({
  resource,
  memberClusterName,
}) => {
  const { data: metricsData, isLoading } = useQuery({
    queryKey: [memberClusterName, 'metrics', resource?.objectMeta?.namespace, resource?.objectMeta?.name],
    queryFn: async () => {
      // This would fetch metrics for the resource
      return {
        cpu: { current: 0, limit: 0 },
        memory: { current: 0, limit: 0 },
        network: { rx: 0, tx: 0 },
        storage: { used: 0, total: 0 }
      };
    },
    enabled: !!resource?.objectMeta?.name,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  const metrics = metricsData || {};

  return (
    <div className="space-y-4">
      <Title level={5}>Resource Metrics</Title>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="CPU Usage"
              value={metrics.cpu?.current || 0}
              suffix="m"
              precision={1}
            />
            {metrics.cpu?.limit > 0 && (
              <Progress
                percent={(metrics.cpu.current / metrics.cpu.limit) * 100}
                size="small"
                status="active"
              />
            )}
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Memory Usage"
              value={metrics.memory?.current || 0}
              suffix="Mi"
              precision={1}
            />
            {metrics.memory?.limit > 0 && (
              <Progress
                percent={(metrics.memory.current / metrics.memory.limit) * 100}
                size="small"
                status="active"
              />
            )}
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Network RX"
              value={metrics.network?.rx || 0}
              suffix="KB/s"
              precision={2}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Network TX"
              value={metrics.network?.tx || 0}
              suffix="KB/s"
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      {metrics.storage && (
        <Card title="Storage Usage" size="small">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Statistic
                title="Used"
                value={metrics.storage.used}
                suffix="GB"
                precision={2}
              />
            </Col>
            <Col xs={24} sm={12}>
              <Statistic
                title="Total"
                value={metrics.storage.total}
                suffix="GB"
                precision={2}
              />
            </Col>
          </Row>
          {metrics.storage.total > 0 && (
            <Progress
              percent={(metrics.storage.used / metrics.storage.total) * 100}
              status="active"
              className="mt-2"
            />
          )}
        </Card>
      )}
    </div>
  );
};

// Logs tab for resources that generate logs
export const LogsTab: React.FC<DetailTabProps> = ({
  resource,
  memberClusterName,
}) => {
  const [container, setContainer] = useState<string>('');
  const [tailLines, setTailLines] = useState<number>(100);
  const [follow, setFollow] = useState<boolean>(false);

  const { data: logsData, isLoading, refetch } = useQuery({
    queryKey: [memberClusterName, 'logs', resource?.objectMeta?.namespace, resource?.objectMeta?.name, container, tailLines],
    queryFn: async () => {
      // This would fetch logs for the resource
      return { logs: 'No logs available', containers: [] };
    },
    enabled: !!resource?.objectMeta?.name,
    staleTime: 0,
    refetchInterval: follow ? 5000 : false,
  });

  const logs = logsData?.logs || '';
  const containers = logsData?.containers || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Title level={5}>Logs</Title>
        <Space>
          {containers.length > 1 && (
            <Select
              placeholder="Select container"
              value={container}
              onChange={setContainer}
              style={{ width: 150 }}
            >
              {containers.map((c: string) => (
                <Option key={c} value={c}>{c}</Option>
              ))}
            </Select>
          )}
          <Select
            value={tailLines}
            onChange={setTailLines}
            style={{ width: 100 }}
          >
            <Option value={50}>50 lines</Option>
            <Option value={100}>100 lines</Option>
            <Option value={500}>500 lines</Option>
            <Option value={1000}>1000 lines</Option>
          </Select>
          <Button
            icon={<PlayCircleOutlined />}
            type={follow ? 'primary' : 'default'}
            onClick={() => setFollow(!follow)}
          >
            {follow ? 'Stop' : 'Follow'}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} />
          <Button
            icon={<DownloadOutlined />}
            onClick={() => {
              const blob = new Blob([logs], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${resource?.objectMeta?.name || 'resource'}-logs.txt`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }}
          >
            Download
          </Button>
        </Space>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" />
          </div>
        ) : (
          <pre
            style={{
              background: '#000',
              color: '#fff',
              padding: '16px',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '600px',
              fontSize: '12px',
              lineHeight: '1.4',
              fontFamily: 'monospace',
            }}
          >
            {logs || 'No logs available'}
          </pre>
        )}
      </Card>
    </div>
  );
};

// Conditions tab for resources with status conditions
export const ConditionsTab: React.FC<DetailTabProps> = ({ resource }) => {
  const conditions = resource?.status?.conditions || [];

  const columns: TableColumnProps<any>[] = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'True' ? 'green' : status === 'False' ? 'red' : 'orange';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string) => reason || '-',
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      render: (message: string) => (
        <Tooltip title={message}>
          <Text ellipsis style={{ maxWidth: 300 }}>
            {message || '-'}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Last Transition',
      dataIndex: 'lastTransitionTime',
      key: 'lastTransitionTime',
      render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
  ];

  return (
    <div className="space-y-4">
      <Title level={5}>Conditions ({conditions.length})</Title>
      
      {conditions.length === 0 ? (
        <Empty description="No conditions found" />
      ) : (
        <Table
          columns={columns}
          dataSource={conditions}
          rowKey={(record, index) => `${record.type}-${index}`}
          pagination={false}
          size="small"
        />
      )}
    </div>
  );
};

// Related Resources tab
export const RelatedResourcesTab: React.FC<DetailTabProps> = ({
  resource,
  memberClusterName,
  onNavigate,
}) => {
  const { data: relatedData, isLoading } = useQuery({
    queryKey: [memberClusterName, 'related', resource?.objectMeta?.namespace, resource?.objectMeta?.name],
    queryFn: async () => {
      // This would fetch related resources
      return { resources: [] };
    },
    enabled: !!resource?.objectMeta?.name,
    staleTime: 30000,
  });

  const relatedResources = relatedData?.resources || [];

  const columns: TableColumnProps<any>[] = [
    {
      title: 'Kind',
      dataIndex: 'kind',
      key: 'kind',
      render: (kind: string) => <Tag color="blue">{kind}</Tag>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <Button
          type="link"
          onClick={() => onNavigate?.({ kind: record.kind, namespace: record.namespace, name })}
        >
          {name}
        </Button>
      ),
    },
    {
      title: 'Namespace',
      dataIndex: 'namespace',
      key: 'namespace',
      render: (namespace: string) => namespace || '-',
    },
    {
      title: 'Relationship',
      dataIndex: 'relationship',
      key: 'relationship',
      render: (relationship: string) => <Tag color="green">{relationship}</Tag>,
    },
    {
      title: 'Age',
      dataIndex: 'creationTimestamp',
      key: 'age',
      render: (timestamp: string) => formatAge(timestamp),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Title level={5}>Related Resources ({relatedResources.length})</Title>
      
      {relatedResources.length === 0 ? (
        <Empty description="No related resources found" />
      ) : (
        <Table
          columns={columns}
          dataSource={relatedResources}
          rowKey={(record, index) => `${record.kind}-${record.name}-${index}`}
          pagination={false}
          size="small"
        />
      )}
    </div>
  );
};