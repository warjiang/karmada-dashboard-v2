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
import { useParams } from 'react-router-dom';
import {
  Card,
  Typography,
  Space,
  Button,
  Select,
  Row,
  Col,
  Statistic,
  Alert,
  Tabs,
  Breadcrumb,
} from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  HomeOutlined,
  DatabaseOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import EventViewer from '@/components/common/EventViewer';
import { 
  GetClusterEvents, 
  GetNamespaceEvents, 
  GetEventStats,
  GetEventFilterOptions,
} from '@/services/member-cluster/events';
import { EventSeverity, EventSeverityColors } from '@/services/base';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface EventsPageProps {}

const EventsPage: React.FC<EventsPageProps> = () => {
  const { memberClusterName } = useParams<{ memberClusterName: string }>();
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('cluster');

  // Fetch event statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: [memberClusterName, 'event-stats', selectedNamespace],
    queryFn: () => GetEventStats({
      memberClusterName: memberClusterName!,
      namespace: selectedNamespace || undefined,
    }),
    enabled: !!memberClusterName,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Fetch filter options
  const { data: filterOptions } = useQuery({
    queryKey: [memberClusterName, 'event-filter-options', selectedNamespace],
    queryFn: () => GetEventFilterOptions({
      memberClusterName: memberClusterName!,
      namespace: selectedNamespace || undefined,
    }),
    enabled: !!memberClusterName,
    staleTime: 300000, // 5 minutes
  });

  const stats = statsData || {
    total: 0,
    normal: 0,
    warning: 0,
    error: 0,
    recentCount: 0,
    criticalCount: 0,
    dailyCount: 0,
  };

  const namespaces = filterOptions?.namespaces || [];

  if (!memberClusterName) {
    return (
      <Alert
        message="Invalid cluster"
        description="Member cluster name is required"
        type="error"
        showIcon
      />
    );
  }

  return (
    <div className="events-page">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item>
          <HomeOutlined />
          <span>Home</span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <DatabaseOutlined />
          <span>Member Clusters</span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <span>{memberClusterName}</span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <ClockCircleOutlined />
          <span>Events</span>
        </Breadcrumb.Item>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <Title level={2} className="mb-2">
            <ClockCircleOutlined className="mr-2" />
            Events
          </Title>
          <Text type="secondary">
            Monitor and analyze Kubernetes events across {selectedNamespace ? `namespace: ${selectedNamespace}` : 'the entire cluster'}
          </Text>
        </div>

        <Space>
          {namespaces.length > 0 && (
            <Select
              placeholder="All Namespaces"
              allowClear
              value={selectedNamespace}
              onChange={setSelectedNamespace}
              style={{ width: 200 }}
            >
              {namespaces.map(ns => (
                <Option key={ns.value} value={ns.value}>
                  {ns.label}
                </Option>
              ))}
            </Select>
          )}
        </Space>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card>
            <Statistic
              title="Total Events"
              value={stats.total}
              prefix={<ClockCircleOutlined />}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card>
            <Statistic
              title="Normal"
              value={stats.normal}
              valueStyle={{ color: EventSeverityColors[EventSeverity.Normal] }}
              prefix={<CheckCircleOutlined />}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card>
            <Statistic
              title="Warning"
              value={stats.warning}
              valueStyle={{ color: EventSeverityColors[EventSeverity.Warning] }}
              prefix={<ExclamationCircleOutlined />}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card>
            <Statistic
              title="Error"
              value={stats.error}
              valueStyle={{ color: EventSeverityColors[EventSeverity.Error] }}
              prefix={<CloseCircleOutlined />}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card>
            <Statistic
              title="Recent (1h)"
              value={stats.recentCount}
              prefix={<ClockCircleOutlined />}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card>
            <Statistic
              title="Critical (1h)"
              value={stats.criticalCount}
              valueStyle={{ color: stats.criticalCount > 0 ? EventSeverityColors[EventSeverity.Error] : undefined }}
              prefix={<CloseCircleOutlined />}
              loading={statsLoading}
            />
          </Card>
        </Col>
      </Row>

      {/* Critical Events Alert */}
      {stats.criticalCount > 0 && (
        <Alert
          message={`${stats.criticalCount} critical events in the last hour`}
          description="There are error events that may require immediate attention."
          type="error"
          showIcon
          className="mb-4"
          action={
            <Button size="small" onClick={() => setActiveTab('critical')}>
              View Critical Events
            </Button>
          }
        />
      )}

      {/* Event Viewer Tabs */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="All Events" key="cluster">
            <EventViewer
              memberClusterName={memberClusterName}
              namespace={selectedNamespace || undefined}
              fetchFunction={async (params) => {
                const response = selectedNamespace
                  ? await GetNamespaceEvents({
                      memberClusterName: params.memberClusterName,
                      namespace: selectedNamespace,
                      limit: 200,
                    })
                  : await GetClusterEvents({
                      memberClusterName: params.memberClusterName,
                      limit: 200,
                    });
                return {
                  events: response.events || [],
                  listMeta: response.listMeta || { totalItems: 0 },
                };
              }}
              title={selectedNamespace ? `Events in ${selectedNamespace}` : 'Cluster Events'}
              showStats={false} // Stats are shown above
              showTimeline={true}
              showGrouping={true}
              showExport={true}
              showFilters={true}
              autoRefresh={true}
              refreshInterval={30000}
              height={700}
            />
          </TabPane>

          <TabPane tab="Critical Events" key="critical">
            <EventViewer
              memberClusterName={memberClusterName}
              namespace={selectedNamespace || undefined}
              fetchFunction={async (params) => {
                const response = selectedNamespace
                  ? await GetNamespaceEvents({
                      memberClusterName: params.memberClusterName,
                      namespace: selectedNamespace,
                      eventType: EventSeverity.Error,
                      limit: 100,
                    })
                  : await GetClusterEvents({
                      memberClusterName: params.memberClusterName,
                      eventType: EventSeverity.Error,
                      limit: 100,
                    });
                return {
                  events: response.events || [],
                  listMeta: response.listMeta || { totalItems: 0 },
                };
              }}
              title="Critical Events (Errors Only)"
              showStats={false}
              showTimeline={true}
              showGrouping={true}
              showExport={true}
              showFilters={true}
              autoRefresh={true}
              refreshInterval={15000} // More frequent refresh for critical events
              height={700}
            />
          </TabPane>

          <TabPane tab="Recent Activity" key="recent">
            <EventViewer
              memberClusterName={memberClusterName}
              namespace={selectedNamespace || undefined}
              fetchFunction={async (params) => {
                const now = new Date();
                const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
                
                const response = selectedNamespace
                  ? await GetNamespaceEvents({
                      memberClusterName: params.memberClusterName,
                      namespace: selectedNamespace,
                      limit: 100,
                    })
                  : await GetClusterEvents({
                      memberClusterName: params.memberClusterName,
                      timeRange: {
                        start: oneHourAgo.toISOString(),
                        end: now.toISOString(),
                      },
                      limit: 100,
                    });

                // Filter events from the last hour on the client side if backend doesn't support time filtering
                const recentEvents = (response.events || []).filter(event => 
                  new Date(event.lastSeen) >= oneHourAgo
                );

                return {
                  events: recentEvents,
                  listMeta: { totalItems: recentEvents.length },
                };
              }}
              title="Recent Activity (Last Hour)"
              showStats={false}
              showTimeline={true}
              showGrouping={true}
              showExport={true}
              showFilters={true}
              autoRefresh={true}
              refreshInterval={10000} // Very frequent refresh for recent activity
              height={700}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default EventsPage;