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

import React, { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Typography,
  Space,
  Button,
  Tag,
  Tooltip,
  Empty,
  Spin,
  Alert,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  TableColumnProps,
  Dropdown,
  MenuProps,
  Badge,
  Timeline,
  Tabs,
  Switch,
  Divider,
} from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BarChartOutlined,
  UnorderedListOutlined,
  MoreOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ResourceEvent, EventSeverity, EventSeverityColors, EventSeverityIcons } from '@/services/base';
import {
  useEventFilter,
  useEventStats,
  useEventGrouping,
  useEventTimeline,
  useEventExport,
  formatEventAge,
  formatEventMessage,
} from '@/hooks/useResourceEvents';

dayjs.extend(relativeTime);

const { Text, Title } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

export interface EventViewerProps {
  memberClusterName: string;
  namespace?: string;
  name?: string;
  resourceType?: string;
  fetchFunction: (params: any) => Promise<{ events: ResourceEvent[]; listMeta: { totalItems: number } }>;
  title?: string;
  showStats?: boolean;
  showTimeline?: boolean;
  showGrouping?: boolean;
  showExport?: boolean;
  showFilters?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  height?: number;
  className?: string;
}

export const EventViewer: React.FC<EventViewerProps> = ({
  memberClusterName,
  namespace,
  name,
  resourceType,
  fetchFunction,
  title = 'Events',
  showStats = true,
  showTimeline = true,
  showGrouping = true,
  showExport = true,
  showFilters = true,
  autoRefresh = true,
  refreshInterval = 30000,
  height = 600,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'grouped'>('list');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh);

  // Fetch events data
  const { data: eventsData, isLoading, error, refetch } = useQuery({
    queryKey: [memberClusterName, 'events', resourceType, namespace, name],
    queryFn: () => fetchFunction({
      memberClusterName,
      namespace,
      name,
      resourceType,
    }),
    enabled: !!memberClusterName,
    staleTime: 10000,
    refetchInterval: autoRefreshEnabled ? refreshInterval : false,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  const events = eventsData?.events || [];

  // Event filtering and processing
  const {
    filter,
    filteredEvents,
    updateFilter,
    clearFilter,
    filterOptions,
    hasActiveFilters,
  } = useEventFilter(events);

  // Event statistics
  const stats = useEventStats(filteredEvents);

  // Event grouping
  const { groupBy, setGroupBy, groupedEvents, groupCount } = useEventGrouping(filteredEvents);

  // Event timeline
  const timelineData = useEventTimeline(filteredEvents, 60);

  // Event export
  const { exportEvents } = useEventExport();

  // Table columns for list view
  const columns: TableColumnProps<ResourceEvent>[] = [
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: EventSeverity) => {
        const sev = severity || EventSeverity.Normal;
        const color = EventSeverityColors[sev];
        const icon = EventSeverityIcons[sev];
        return (
          <Tag color={color} icon={React.createElement(
            sev === EventSeverity.Normal ? CheckCircleOutlined :
            sev === EventSeverity.Warning ? ExclamationCircleOutlined :
            CloseCircleOutlined
          )}>
            {sev}
          </Tag>
        );
      },
      filters: [
        { text: 'Normal', value: EventSeverity.Normal },
        { text: 'Warning', value: EventSeverity.Warning },
        { text: 'Error', value: EventSeverity.Error },
      ],
      onFilter: (value, record) => (record.severity || EventSeverity.Normal) === value,
    },
    {
      title: 'Age',
      dataIndex: 'lastSeen',
      key: 'age',
      width: 100,
      render: (timestamp: string) => (
        <Tooltip title={dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')}>
          <Text type="secondary">{formatEventAge(timestamp)}</Text>
        </Tooltip>
      ),
      sorter: (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime(),
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      width: 150,
      render: (reason: string) => <Tag color="blue">{reason}</Tag>,
      filters: filterOptions.reasons,
      onFilter: (value, record) => record.reason === value,
    },
    {
      title: 'Object',
      key: 'object',
      width: 200,
      render: (record: ResourceEvent) => (
        <div>
          <Text strong>{record.objectKind}</Text>
          <br />
          <Text type="secondary" className="text-xs">
            {record.objectNamespace ? `${record.objectNamespace}/` : ''}{record.objectName}
          </Text>
        </div>
      ),
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      render: (message: string) => (
        <Tooltip title={message}>
          <Text ellipsis style={{ maxWidth: 300 }}>
            {formatEventMessage(message, 100)}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count',
      width: 80,
      render: (count: number) => (
        <Badge count={count} showZero style={{ backgroundColor: '#52c41a' }} />
      ),
      sorter: (a, b) => a.count - b.count,
    },
    {
      title: 'Source',
      dataIndex: 'sourceComponent',
      key: 'source',
      width: 120,
      render: (source: string) => (
        <Text type="secondary" className="text-xs">{source}</Text>
      ),
    },
  ];

  // Filter menu items
  const filterMenuItems: MenuProps['items'] = [
    {
      key: 'severity',
      label: 'Filter by Severity',
      children: [
        {
          key: 'normal',
          label: (
            <div onClick={() => updateFilter({ severity: [EventSeverity.Normal] })}>
              <Tag color={EventSeverityColors[EventSeverity.Normal]}>Normal</Tag>
            </div>
          ),
        },
        {
          key: 'warning',
          label: (
            <div onClick={() => updateFilter({ severity: [EventSeverity.Warning] })}>
              <Tag color={EventSeverityColors[EventSeverity.Warning]}>Warning</Tag>
            </div>
          ),
        },
        {
          key: 'error',
          label: (
            <div onClick={() => updateFilter({ severity: [EventSeverity.Error] })}>
              <Tag color={EventSeverityColors[EventSeverity.Error]}>Error</Tag>
            </div>
          ),
        },
      ],
    },
    {
      key: 'time',
      label: 'Filter by Time',
      children: [
        {
          key: 'last-hour',
          label: (
            <div onClick={() => {
              const now = new Date();
              const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
              updateFilter({ timeRange: { start: oneHourAgo, end: now } });
            }}>
              Last Hour
            </div>
          ),
        },
        {
          key: 'last-day',
          label: (
            <div onClick={() => {
              const now = new Date();
              const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
              updateFilter({ timeRange: { start: oneDayAgo, end: now } });
            }}>
              Last 24 Hours
            </div>
          ),
        },
        {
          key: 'last-week',
          label: (
            <div onClick={() => {
              const now = new Date();
              const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              updateFilter({ timeRange: { start: oneWeekAgo, end: now } });
            }}>
              Last Week
            </div>
          ),
        },
      ],
    },
  ];

  // Export menu items
  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'json',
      label: (
        <div onClick={() => exportEvents(filteredEvents, 'json')}>
          Export as JSON
        </div>
      ),
    },
    {
      key: 'csv',
      label: (
        <div onClick={() => exportEvents(filteredEvents, 'csv')}>
          Export as CSV
        </div>
      ),
    },
  ];

  // Render timeline view
  const renderTimelineView = () => (
    <div style={{ height: height - 100, overflowY: 'auto' }}>
      <Timeline mode="left">
        {filteredEvents
          .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
          .map((event, index) => {
            const severity = event.severity || EventSeverity.Normal;
            const color = EventSeverityColors[severity];
            
            return (
              <Timeline.Item
                key={index}
                color={color}
                dot={React.createElement(
                  severity === EventSeverity.Normal ? CheckCircleOutlined :
                  severity === EventSeverity.Warning ? ExclamationCircleOutlined :
                  CloseCircleOutlined,
                  { style: { color } }
                )}
              >
                <div className="mb-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <Text strong>{event.reason}</Text>
                    <Tag color="blue">{event.objectKind}</Tag>
                    <Text type="secondary" className="text-xs">
                      {dayjs(event.lastSeen).format('HH:mm:ss')}
                    </Text>
                    {event.count > 1 && (
                      <Badge count={event.count} size="small" />
                    )}
                  </div>
                  <Text>{event.message}</Text>
                  <div className="mt-1">
                    <Text type="secondary" className="text-xs">
                      {event.objectNamespace ? `${event.objectNamespace}/` : ''}{event.objectName} • {event.sourceComponent}
                    </Text>
                  </div>
                </div>
              </Timeline.Item>
            );
          })}
      </Timeline>
    </div>
  );

  // Render grouped view
  const renderGroupedView = () => (
    <div style={{ height: height - 100, overflowY: 'auto' }}>
      <div className="mb-4">
        <Select
          value={groupBy}
          onChange={setGroupBy}
          style={{ width: 200 }}
        >
          <Option value="resource">Group by Resource</Option>
          <Option value="reason">Group by Reason</Option>
          <Option value="severity">Group by Severity</Option>
          <Option value="time">Group by Time</Option>
        </Select>
      </div>
      
      <div className="space-y-4">
        {Object.entries(groupedEvents).map(([groupKey, groupEvents]) => (
          <Card key={groupKey} size="small" title={
            <div className="flex justify-between items-center">
              <Text strong>{groupKey}</Text>
              <Badge count={groupEvents.length} showZero />
            </div>
          }>
            <div className="space-y-2">
              {groupEvents.slice(0, 5).map((event, index) => (
                <div key={index} className="flex items-start space-x-2 p-2 bg-gray-50 rounded">
                  <Tag color={EventSeverityColors[event.severity || EventSeverity.Normal]} size="small">
                    {event.severity || EventSeverity.Normal}
                  </Tag>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Text strong className="text-sm">{event.reason}</Text>
                      <Text type="secondary" className="text-xs">
                        {formatEventAge(event.lastSeen)}
                      </Text>
                    </div>
                    <Text className="text-sm">{formatEventMessage(event.message, 80)}</Text>
                  </div>
                </div>
              ))}
              {groupEvents.length > 5 && (
                <Text type="secondary" className="text-xs">
                  ... and {groupEvents.length - 5} more events
                </Text>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  if (error) {
    return (
      <Alert
        message="Failed to load events"
        description={error.message}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={() => refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div className={`event-viewer ${className}`}>
      {/* Header with stats and controls */}
      <div className="mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <Title level={5} className="mb-2">{title}</Title>
            {showStats && (
              <Row gutter={16}>
                <Col>
                  <Statistic
                    title="Total Events"
                    value={stats.total}
                    prefix={<ClockCircleOutlined />}
                  />
                </Col>
                <Col>
                  <Statistic
                    title="Normal"
                    value={stats.normal}
                    valueStyle={{ color: EventSeverityColors[EventSeverity.Normal] }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Col>
                <Col>
                  <Statistic
                    title="Warning"
                    value={stats.warning}
                    valueStyle={{ color: EventSeverityColors[EventSeverity.Warning] }}
                    prefix={<ExclamationCircleOutlined />}
                  />
                </Col>
                <Col>
                  <Statistic
                    title="Error"
                    value={stats.error}
                    valueStyle={{ color: EventSeverityColors[EventSeverity.Error] }}
                    prefix={<CloseCircleOutlined />}
                  />
                </Col>
                <Col>
                  <Statistic
                    title="Recent (1h)"
                    value={stats.recentCount}
                    prefix={<ClockCircleOutlined />}
                  />
                </Col>
              </Row>
            )}
          </div>

          <Space>
            {/* View mode selector */}
            <Select value={viewMode} onChange={setViewMode} style={{ width: 120 }}>
              <Option value="list">
                <UnorderedListOutlined /> List
              </Option>
              {showTimeline && (
                <Option value="timeline">
                  <ClockCircleOutlined /> Timeline
                </Option>
              )}
              {showGrouping && (
                <Option value="grouped">
                  <BarChartOutlined /> Grouped
                </Option>
              )}
            </Select>

            {/* Auto refresh toggle */}
            <div className="flex items-center space-x-2">
              <Text className="text-sm">Auto refresh:</Text>
              <Switch
                size="small"
                checked={autoRefreshEnabled}
                onChange={setAutoRefreshEnabled}
              />
            </div>

            {/* Refresh button */}
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              loading={isLoading}
            >
              Refresh
            </Button>

            {/* Filter dropdown */}
            {showFilters && (
              <Dropdown menu={{ items: filterMenuItems }} trigger={['click']}>
                <Button icon={<FilterOutlined />}>
                  Filter {hasActiveFilters && <Badge dot />}
                </Button>
              </Dropdown>
            )}

            {/* Export dropdown */}
            {showExport && (
              <Dropdown menu={{ items: exportMenuItems }} trigger={['click']}>
                <Button icon={<DownloadOutlined />}>
                  Export
                </Button>
              </Dropdown>
            )}
          </Space>
        </div>

        {/* Filter controls */}
        {showFilters && (
          <div className="space-y-2">
            <Row gutter={[16, 8]}>
              <Col xs={24} sm={8}>
                <Search
                  placeholder="Search events..."
                  allowClear
                  value={filter.searchText}
                  onChange={(e) => updateFilter({ searchText: e.target.value })}
                  prefix={<SearchOutlined />}
                />
              </Col>
              <Col xs={24} sm={6}>
                <Select
                  mode="multiple"
                  placeholder="Severity"
                  allowClear
                  value={filter.severity}
                  onChange={(severity) => updateFilter({ severity })}
                  style={{ width: '100%' }}
                >
                  {filterOptions.severities.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={6}>
                <Select
                  mode="multiple"
                  placeholder="Resource Type"
                  allowClear
                  value={filter.resourceTypes}
                  onChange={(resourceTypes) => updateFilter({ resourceTypes })}
                  style={{ width: '100%' }}
                >
                  {filterOptions.resourceTypes.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={4}>
                <RangePicker
                  showTime
                  value={filter.timeRange.start && filter.timeRange.end ? [
                    dayjs(filter.timeRange.start),
                    dayjs(filter.timeRange.end)
                  ] : null}
                  onChange={(dates) => updateFilter({
                    timeRange: {
                      start: dates?.[0]?.toDate() || null,
                      end: dates?.[1]?.toDate() || null,
                    }
                  })}
                  style={{ width: '100%' }}
                />
              </Col>
            </Row>
            
            {hasActiveFilters && (
              <div className="flex items-center space-x-2">
                <Text type="secondary" className="text-sm">
                  Showing {filteredEvents.length} of {events.length} events
                </Text>
                <Button
                  size="small"
                  icon={<ClearOutlined />}
                  onClick={clearFilter}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <Divider />

      {/* Content area */}
      {isLoading ? (
        <div className="flex justify-center items-center" style={{ height: height - 200 }}>
          <Spin size="large" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <Empty
          description={hasActiveFilters ? "No events match the current filters" : "No events found"}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ marginTop: (height - 300) / 2 }}
        />
      ) : (
        <>
          {viewMode === 'list' && (
            <Table
              columns={columns}
              dataSource={filteredEvents}
              rowKey={(record, index) => `${record.objectMeta?.uid || index}`}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} events`,
              }}
              size="small"
              scroll={{ y: height - 300 }}
            />
          )}
          
          {viewMode === 'timeline' && renderTimelineView()}
          
          {viewMode === 'grouped' && renderGroupedView()}
        </>
      )}
    </div>
  );
};

export default EventViewer;