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

import React, { useState, useCallback, useMemo } from 'react';
import {
  Table,
  Input,
  Select,
  Button,
  Space,
  Checkbox,
  Dropdown,
  Tooltip,
  Tag,
  Alert,
  Spin,
  Card,
  Row,
  Col,
  Typography,
  Divider,
  MenuProps,
  TableColumnProps,
  TableProps,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  FilterOutlined,
  SettingOutlined,
  DeleteOutlined,
  EditOutlined,
  TagOutlined,
  ClearOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ObjectMeta, DataSelectQuery } from '@/services/base';
import i18nInstance from '@/utils/i18n';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Search } = Input;
const { Option } = Select;
const { Text } = Typography;

// Generic resource interface that all resources should extend
export interface BaseResource {
  objectMeta: ObjectMeta;
  typeMeta?: {
    kind: string;
    scalable?: boolean;
    restartable?: boolean;
  };
}

// Filter configuration interface
export interface ResourceFilter {
  selectedNamespace: string;
  searchText: string;
  selectedLabels: string[];
  selectedStatus: string[];
  sortBy: string[];
  page: number;
  itemsPerPage: number;
  customFilters?: Record<string, any>;
}

// Bulk action interface
export interface BulkAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: (selectedItems: BaseResource[]) => boolean;
  onClick: (selectedItems: BaseResource[]) => void | Promise<void>;
}

// Column configuration interface
export interface ResourceColumn<T extends BaseResource> extends Omit<TableColumnProps<T>, 'render'> {
  key: string;
  title: string;
  dataIndex?: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: number | string;
  fixed?: 'left' | 'right';
  ellipsis?: boolean;
}

// Export configuration interface
export interface ExportConfig {
  enabled: boolean;
  formats?: ('csv' | 'json' | 'yaml')[];
  filename?: string;
  customExporter?: (data: BaseResource[], format: string) => void;
}

// Resource list props interface
export interface ResourceListProps<T extends BaseResource> {
  // Core configuration
  memberClusterName: string;
  resourceType: string;
  resourceKind: string;
  
  // Data fetching
  fetchFunction: (params: {
    memberClusterName: string;
    namespace?: string;
    keyword?: string;
    filterBy?: string[];
    sortBy?: string[];
    itemsPerPage?: number;
    page?: number;
  }) => Promise<{
    items?: T[];
    listMeta?: {
      totalItems: number;
    };
    errors?: string[];
    [key: string]: any; // For resource-specific response fields
  }>;
  
  // Table configuration
  columns: ResourceColumn<T>[];
  rowKey?: string | ((record: T) => string);
  
  // Feature configuration
  enableBulkOperations?: boolean;
  bulkActions?: BulkAction[];
  enableExport?: boolean;
  exportConfig?: ExportConfig;
  enableRefresh?: boolean;
  enableSearch?: boolean;
  enableFiltering?: boolean;
  enableSorting?: boolean;
  enablePagination?: boolean;
  
  // Customization
  title?: string;
  description?: string;
  createPath?: string;
  createButtonText?: string;
  emptyStateMessage?: string;
  customFilters?: React.ReactNode;
  customActions?: React.ReactNode;
  
  // Callbacks
  onRowClick?: (record: T) => void;
  onCreateClick?: () => void;
  onRefresh?: () => void;
  
  // Styling
  className?: string;
  tableProps?: Partial<TableProps<T>>;
}

// Default filter state
const defaultFilter: ResourceFilter = {
  selectedNamespace: '',
  searchText: '',
  selectedLabels: [],
  selectedStatus: [],
  sortBy: [],
  page: 1,
  itemsPerPage: 10,
};

// Main ResourceList component
export function ResourceList<T extends BaseResource>({
  memberClusterName,
  resourceType,
  resourceKind,
  fetchFunction,
  columns,
  rowKey = (record) => `${record.objectMeta.namespace}-${record.objectMeta.name}`,
  enableBulkOperations = true,
  bulkActions = [],
  enableExport = true,
  exportConfig = { enabled: true, formats: ['csv', 'json'] },
  enableRefresh = true,
  enableSearch = true,
  enableFiltering = true,
  enableSorting = true,
  enablePagination = true,
  title,
  description,
  createPath,
  createButtonText,
  emptyStateMessage,
  customFilters,
  customActions,
  onRowClick,
  onCreateClick,
  onRefresh,
  className = '',
  tableProps = {},
}: ResourceListProps<T>) {
  // State management
  const [filter, setFilter] = useState<ResourceFilter>(defaultFilter);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<T[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Query client for cache management
  const queryClient = useQueryClient();

  // Data fetching with React Query
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [memberClusterName, resourceType, JSON.stringify(filter)],
    queryFn: () => fetchFunction({
      memberClusterName,
      namespace: filter.selectedNamespace || undefined,
      keyword: filter.searchText || undefined,
      filterBy: filter.selectedLabels.length > 0 ? filter.selectedLabels : undefined,
      sortBy: filter.sortBy.length > 0 ? filter.sortBy : undefined,
      itemsPerPage: filter.itemsPerPage,
      page: filter.page,
    }),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });

  // Extract data from response
  const data = useMemo(() => {
    if (!response) return [];
    
    // Handle different response formats
    const resourceKey = `${resourceType}s` as keyof typeof response;
    if (response[resourceKey] && Array.isArray(response[resourceKey])) {
      return response[resourceKey] as T[];
    }
    
    if (response.items && Array.isArray(response.items)) {
      return response.items as T[];
    }
    
    return [];
  }, [response, resourceType]);

  const totalItems = response?.listMeta?.totalItems || 0;
  const errors = response?.errors || [];

  // Filter update handlers
  const updateFilter = useCallback((updates: Partial<ResourceFilter>) => {
    setFilter(prev => ({ ...prev, ...updates, page: 1 })); // Reset to page 1 when filtering
  }, []);

  const handleSearch = useCallback((value: string) => {
    updateFilter({ searchText: value });
  }, [updateFilter]);

  const handleNamespaceChange = useCallback((value: string) => {
    updateFilter({ selectedNamespace: value });
  }, [updateFilter]);

  const handlePageChange = useCallback((page: number, pageSize?: number) => {
    setFilter(prev => ({
      ...prev,
      page,
      itemsPerPage: pageSize || prev.itemsPerPage,
    }));
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  // Bulk operations
  const handleBulkSelection = useCallback((selectedKeys: React.Key[], selectedRecords: T[]) => {
    setSelectedRowKeys(selectedKeys);
    setSelectedRows(selectedRecords);
  }, []);

  const handleBulkAction = useCallback(async (action: BulkAction) => {
    if (selectedRows.length === 0) return;
    
    setBulkActionLoading(action.key);
    try {
      await action.onClick(selectedRows);
      // Clear selection after successful action
      setSelectedRowKeys([]);
      setSelectedRows([]);
      // Refresh data
      refetch();
    } catch (error) {
      console.error(`Bulk action ${action.key} failed:`, error);
    } finally {
      setBulkActionLoading(null);
    }
  }, [selectedRows, refetch]);

  // Export functionality
  const handleExport = useCallback(async (format: string) => {
    if (!exportConfig.enabled) return;
    
    setExportLoading(true);
    try {
      if (exportConfig.customExporter) {
        exportConfig.customExporter(data, format);
      } else {
        // Default export implementation
        const filename = exportConfig.filename || `${resourceType}-${dayjs().format('YYYY-MM-DD-HH-mm-ss')}`;
        
        if (format === 'csv') {
          exportToCSV(data, filename);
        } else if (format === 'json') {
          exportToJSON(data, filename);
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportLoading(false);
    }
  }, [data, exportConfig, resourceType]);

  // Export utility functions
  const exportToCSV = (data: T[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = columns.map(col => col.title).join(',');
    const rows = data.map(item => 
      columns.map(col => {
        const value = col.dataIndex ? item[col.dataIndex as keyof T] : '';
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',')
    );
    
    const csvContent = [headers, ...rows].join('\n');
    downloadFile(csvContent, `${filename}.csv`, 'text/csv');
  };

  const exportToJSON = (data: T[], filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, `${filename}.json`, 'application/json');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setFilter(defaultFilter);
  }, []);

  // Bulk action menu items
  const bulkActionMenuItems: MenuProps['items'] = bulkActions.map(action => ({
    key: action.key,
    label: action.label,
    icon: action.icon,
    danger: action.danger,
    disabled: action.disabled?.(selectedRows) || bulkActionLoading === action.key,
    onClick: () => handleBulkAction(action),
  }));

  // Export menu items
  const exportMenuItems: MenuProps['items'] = exportConfig.formats?.map(format => ({
    key: format,
    label: format.toUpperCase(),
    onClick: () => handleExport(format),
  })) || [];

  // Table row selection configuration
  const rowSelection = enableBulkOperations ? {
    selectedRowKeys,
    onChange: handleBulkSelection,
    onSelect: (record: T, selected: boolean, selectedRecords: T[]) => {
      handleBulkSelection(
        selectedRecords.map(r => typeof rowKey === 'function' ? rowKey(r) : r[rowKey as keyof T] as React.Key),
        selectedRecords
      );
    },
    onSelectAll: (selected: boolean, selectedRecords: T[], changeRecords: T[]) => {
      handleBulkSelection(
        selectedRecords.map(r => typeof rowKey === 'function' ? rowKey(r) : r[rowKey as keyof T] as React.Key),
        selectedRecords
      );
    },
  } : undefined;

  // Enhanced columns with sorting
  const enhancedColumns = useMemo(() => {
    return columns.map(col => ({
      ...col,
      sorter: enableSorting && col.sortable ? true : false,
      showSorterTooltip: false,
    }));
  }, [columns, enableSorting]);

  return (
    <div className={`resource-list ${className}`}>
      {/* Header Section */}
      <Card className="mb-4" bodyStyle={{ padding: '16px 24px' }}>
        <Row justify="space-between" align="middle" className="mb-4">
          <Col>
            <Space direction="vertical" size={0}>
              <Typography.Title level={4} className="mb-0">
                {title || `${resourceKind}s`}
              </Typography.Title>
              {description && (
                <Text type="secondary" className="text-sm">
                  {description}
                </Text>
              )}
            </Space>
          </Col>
          <Col>
            <Space>
              {customActions}
              {createPath && (
                <Button type="primary" onClick={onCreateClick}>
                  {createButtonText || `Create ${resourceKind}`}
                </Button>
              )}
            </Space>
          </Col>
        </Row>

        {/* Filters Section */}
        {(enableSearch || enableFiltering) && (
          <Row gutter={[16, 16]} className="mb-4">
            {enableSearch && (
              <Col xs={24} sm={12} md={8} lg={6}>
                <Search
                  placeholder={i18nInstance.t('search_placeholder', `Search ${resourceType}...`)}
                  allowClear
                  onSearch={handleSearch}
                  onPressEnter={(e) => handleSearch(e.currentTarget.value)}
                />
              </Col>
            )}
            
            {enableFiltering && (
              <>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Select
                    placeholder="Select Namespace"
                    allowClear
                    showSearch
                    value={filter.selectedNamespace || undefined}
                    onChange={handleNamespaceChange}
                    className="w-full"
                  >
                    <Option value="">All Namespaces</Option>
                    {/* Namespace options would be populated from a hook */}
                  </Select>
                </Col>
                
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Select
                    mode="multiple"
                    placeholder="Filter by Labels"
                    allowClear
                    value={filter.selectedLabels}
                    onChange={(value) => updateFilter({ selectedLabels: value })}
                    className="w-full"
                  >
                    {/* Label options would be populated dynamically */}
                  </Select>
                </Col>
              </>
            )}

            {customFilters}

            <Col>
              <Space>
                <Tooltip title="Clear all filters">
                  <Button
                    icon={<ClearOutlined />}
                    onClick={handleClearFilters}
                    disabled={JSON.stringify(filter) === JSON.stringify(defaultFilter)}
                  />
                </Tooltip>
                
                {enableRefresh && (
                  <Tooltip title="Refresh">
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={handleRefresh}
                      loading={isLoading}
                    />
                  </Tooltip>
                )}
                
                {enableExport && exportConfig.enabled && (
                  <Dropdown
                    menu={{ items: exportMenuItems }}
                    trigger={['click']}
                    disabled={data.length === 0}
                  >
                    <Button
                      icon={<ExportOutlined />}
                      loading={exportLoading}
                    >
                      Export
                    </Button>
                  </Dropdown>
                )}
              </Space>
            </Col>
          </Row>
        )}

        {/* Bulk Actions Bar */}
        {enableBulkOperations && selectedRows.length > 0 && (
          <Alert
            message={
              <Row justify="space-between" align="middle">
                <Col>
                  <Space>
                    <Text strong>{selectedRows.length} items selected</Text>
                    <Button
                      size="small"
                      type="link"
                      onClick={() => {
                        setSelectedRowKeys([]);
                        setSelectedRows([]);
                      }}
                    >
                      Clear selection
                    </Button>
                  </Space>
                </Col>
                <Col>
                  <Space>
                    {bulkActions.map(action => (
                      <Button
                        key={action.key}
                        size="small"
                        icon={action.icon}
                        danger={action.danger}
                        disabled={action.disabled?.(selectedRows)}
                        loading={bulkActionLoading === action.key}
                        onClick={() => handleBulkAction(action)}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </Space>
                </Col>
              </Row>
            }
            type="info"
            showIcon={false}
            className="mb-4"
          />
        )}

        {/* Error Display */}
        {errors.length > 0 && (
          <Alert
            message="Errors occurred while fetching data"
            description={
              <ul className="mb-0">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            }
            type="error"
            showIcon
            className="mb-4"
          />
        )}
      </Card>

      {/* Table Section */}
      <Card>
        <Table<T>
          {...tableProps}
          rowKey={rowKey}
          columns={enhancedColumns}
          dataSource={data}
          loading={isLoading}
          rowSelection={rowSelection}
          onRow={onRowClick ? (record) => ({
            onClick: () => onRowClick(record),
            style: { cursor: 'pointer' },
          }) : undefined}
          pagination={enablePagination ? {
            current: filter.page,
            pageSize: filter.itemsPerPage,
            total: totalItems,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} ${resourceType}`,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: handlePageChange,
            onShowSizeChange: handlePageChange,
          } : false}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: emptyStateMessage || `No ${resourceType} found`,
          }}
        />
      </Card>
    </div>
  );
}

// Default bulk actions
export const createDefaultBulkActions = <T extends BaseResource>(
  onDelete?: (items: T[]) => Promise<void>,
  onEdit?: (items: T[]) => Promise<void>,
  onLabel?: (items: T[]) => Promise<void>
): BulkAction[] => {
  const actions: BulkAction[] = [];

  if (onDelete) {
    actions.push({
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: onDelete,
    });
  }

  if (onEdit) {
    actions.push({
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      disabled: (items) => items.length !== 1, // Only allow editing single item
      onClick: onEdit,
    });
  }

  if (onLabel) {
    actions.push({
      key: 'label',
      label: 'Manage Labels',
      icon: <TagOutlined />,
      onClick: onLabel,
    });
  }

  return actions;
};

// Utility function to format age
export const formatAge = (creationTimestamp: string): string => {
  return dayjs(creationTimestamp).fromNow();
};

// Utility function to format labels
export const formatLabels = (labels: Record<string, string> = {}, maxDisplay = 2): React.ReactNode => {
  const labelEntries = Object.entries(labels);
  
  if (labelEntries.length === 0) {
    return <Text type="secondary">None</Text>;
  }

  const displayLabels = labelEntries.slice(0, maxDisplay);
  const remainingCount = labelEntries.length - maxDisplay;

  return (
    <Space size={4} wrap>
      {displayLabels.map(([key, value]) => (
        <Tag key={key} color="blue" className="text-xs">
          {key}={value}
        </Tag>
      ))}
      {remainingCount > 0 && (
        <Tag color="default">+{remainingCount} more</Tag>
      )}
    </Space>
  );
};

export default ResourceList;