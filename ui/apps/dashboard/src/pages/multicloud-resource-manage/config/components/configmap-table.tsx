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

import i18nInstance from '@/utils/i18n';
import { Button, Popconfirm, Space, Table, TableColumnProps, Tag, notification, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import TagList from '@/components/tag-list';
import { FC, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GetResource } from '@/services/unstructured.ts';
import { Config, GetConfigMaps } from '@/services/config.ts';
import { extractPropagationPolicy, ApiError, ApiErrorType } from '@/services/base.ts';
import { 
  GetMemberClusterConfigMaps, 
  GetMemberClusterConfigMapDetail,
  ConfigMapResource 
} from '@/services/member-cluster/config';
interface ConfigMapTableProps {
  labelTagNum?: number;
  selectedWorkSpace: string;
  searchText: string;
  memberClusterName?: string; // Add member cluster support
  onViewConfigMapContent: (r: any) => void;
  onEditConfigMapContent: (r: any) => void;
  onDeleteConfigMapContent: (r: Config) => void;
}

const ConfigMapTable: FC<ConfigMapTableProps> = (props) => {
  const {
    labelTagNum,
    selectedWorkSpace,
    searchText,
    memberClusterName,
    onViewConfigMapContent,
    onEditConfigMapContent,
    onDeleteConfigMapContent,
  } = props;

  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // Enhanced error handling for loading states
  const setResourceLoading = (resourceKey: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [resourceKey]: loading }));
  };

  // Enhanced data fetching with member cluster support
  const { data, isLoading, error } = useQuery({
    queryKey: ['GetConfigMaps', memberClusterName, selectedWorkSpace, searchText],
    queryFn: async () => {
      try {
        if (memberClusterName) {
          // Use enhanced member cluster API
          const response = await GetMemberClusterConfigMaps({
            memberClusterName,
            namespace: selectedWorkSpace || undefined,
            keyword: searchText || undefined,
            itemsPerPage: 100,
            page: 1,
          });
          return {
            items: response.data?.configMaps || [],
            totalItems: response.data?.listMeta?.totalItems || 0,
            errors: response.data?.errors || [],
          };
        } else {
          // Fallback to legacy API
          const services = await GetConfigMaps({
            namespace: selectedWorkSpace,
            keyword: searchText,
          });
          return services.data || {};
        }
      } catch (error) {
        console.error('Error fetching ConfigMaps:', error);
        
        // Enhanced error handling
        if (error instanceof ApiError) {
          notification.error({
            message: 'Failed to load ConfigMaps',
            description: error.message,
            duration: 5,
          });
        } else {
          notification.error({
            message: 'Failed to load ConfigMaps',
            description: 'An unexpected error occurred while loading ConfigMaps',
            duration: 5,
          });
        }
        
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry on authentication/authorization errors
      if (error instanceof ApiError && 
          (error.type === ApiErrorType.AuthenticationError || 
           error.type === ApiErrorType.AuthorizationError)) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Enhanced resource detail fetching
  const fetchResourceDetail = async (resource: Config | ConfigMapResource) => {
    const resourceKey = `${resource.objectMeta.namespace}-${resource.objectMeta.name}`;
    setResourceLoading(resourceKey, true);
    
    try {
      if (memberClusterName) {
        // Use enhanced member cluster API
        const response = await GetMemberClusterConfigMapDetail({
          memberClusterName,
          namespace: resource.objectMeta.namespace,
          name: resource.objectMeta.name,
        });
        return response.data;
      } else {
        // Fallback to legacy API
        const ret = await GetResource({
          kind: resource.typeMeta.kind,
          name: resource.objectMeta.name,
          namespace: resource.objectMeta.namespace,
        });
        return ret?.data;
      }
    } catch (error) {
      console.error('Error fetching ConfigMap detail:', error);
      
      if (error instanceof ApiError) {
        notification.error({
          message: 'Failed to load ConfigMap details',
          description: error.message,
          duration: 5,
        });
      } else {
        notification.error({
          message: 'Failed to load ConfigMap details',
          description: 'An unexpected error occurred while loading ConfigMap details',
          duration: 5,
        });
      }
      
      throw error;
    } finally {
      setResourceLoading(resourceKey, false);
    }
  };

  // Enhanced columns with better error handling and loading states
  const columns: TableColumnProps<Config>[] = [
    {
      title: i18nInstance.t('a4b28a416f0b6f3c215c51e79e517298', '命名空间'),
      key: 'namespaceName',
      width: 200,
      render: (_, r) => {
        return r.objectMeta.namespace;
      },
    },
    {
      title: i18nInstance.t('4fcad1c9ba0732214679e13bd69d998b', '配置名称'),
      key: 'configmapName',
      width: 300,
      render: (_, r) => {
        return r.objectMeta.name;
      },
    },
    {
      title: 'Data Keys',
      key: 'dataKeys',
      width: 150,
      render: (_, r) => {
        // Enhanced display for ConfigMap data keys
        const configMapResource = r as ConfigMapResource;
        const dataKeys = configMapResource.keys || Object.keys(configMapResource.data || {});
        const keyCount = dataKeys.length;
        
        if (keyCount === 0) {
          return <span className="text-gray-400">No data</span>;
        }
        
        return (
          <Tooltip 
            title={keyCount <= 5 ? dataKeys.join(', ') : `${dataKeys.slice(0, 5).join(', ')} and ${keyCount - 5} more...`}
            placement="topLeft"
          >
            <span className="cursor-help">
              {keyCount} key{keyCount !== 1 ? 's' : ''}
              {keyCount > 0 && <InfoCircleOutlined className="ml-1 text-gray-400" />}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Mounted Pods',
      key: 'mountedPods',
      width: 120,
      render: (_, r) => {
        // Show mounting information if available
        const configMapResource = r as ConfigMapResource;
        const mountedPods = (configMapResource as any).mountedPods;
        
        if (!mountedPods || mountedPods.length === 0) {
          return <span className="text-gray-400">Not mounted</span>;
        }
        
        return (
          <Tooltip 
            title={`Mounted by: ${mountedPods.join(', ')}`}
            placement="topLeft"
          >
            <span className="cursor-help text-blue-600">
              {mountedPods.length} pod{mountedPods.length !== 1 ? 's' : ''}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: i18nInstance.t('1f7be0a924280cd098db93c9d81ecccd', '标签信息'),
      key: 'labelName',
      align: 'left',
      width: '25%',
      render: (_, r) => {
        if (!r?.objectMeta?.labels) {
          return '-';
        }
        const params = Object.keys(r.objectMeta.labels).map((key) => {
          return {
            key: `${r.objectMeta.name}-${key}`,
            value: `${key}:${r.objectMeta.labels[key]}`,
          };
        });
        return <TagList tags={params} maxLen={labelTagNum} />;
      },
    },
    {
      title: i18nInstance.t('8a99082b2c32c843d2241e0ba60a3619', '分发策略'),
      key: 'propagationPolicies',
      width: 150,
      render: (_, r) => {
        const pp = extractPropagationPolicy(r);
        return pp ? <Tag>{pp}</Tag> : '-';
      },
    },
    {
      title: i18nInstance.t('eaf8a02d1b16fcf94302927094af921f', '覆盖策略'),
      key: 'overridePolicies',
      width: 150,
      render: () => {
        return '-';
      },
    },
    {
      title: i18nInstance.t('2b6bc0f293f5ca01b006206c2535ccbc', '操作'),
      key: 'op',
      width: 200,
      render: (_, r) => {
        const resourceKey = `${r.objectMeta.namespace}-${r.objectMeta.name}`;
        const isResourceLoading = loadingStates[resourceKey];
        
        return (
          <Space.Compact>
            <Button
              size={'small'}
              type="link"
              icon={<EyeOutlined />}
              loading={isResourceLoading}
              onClick={async () => {
                try {
                  const resourceDetail = await fetchResourceDetail(r);
                  onViewConfigMapContent(resourceDetail);
                } catch (error) {
                  // Error already handled in fetchResourceDetail
                }
              }}
            >
              {i18nInstance.t('607e7a4f377fa66b0b28ce318aab841f', '查看')}
            </Button>
            <Button
              size={'small'}
              type="link"
              icon={<EditOutlined />}
              loading={isResourceLoading}
              onClick={async () => {
                try {
                  const resourceDetail = await fetchResourceDetail(r);
                  onEditConfigMapContent(resourceDetail);
                } catch (error) {
                  // Error already handled in fetchResourceDetail
                }
              }}
            >
              {i18nInstance.t('95b351c86267f3aedf89520959bce689', '编辑')}
            </Button>

            <Popconfirm
              placement="topRight"
              title={i18nInstance.t('af57bb34df71db6c4a115ed7665faf5d', {
                name: r.objectMeta.name,
              })}
              description="This action cannot be undone. Are you sure you want to delete this ConfigMap?"
              onConfirm={() => {
                onDeleteConfigMapContent(r);
              }}
              okText={i18nInstance.t(
                'e83a256e4f5bb4ff8b3d804b5473217a',
                '确认',
              )}
              cancelText={i18nInstance.t(
                '625fb26b4b3340f7872b411f401e754c',
                '取消',
              )}
              okType="danger"
            >
              <Button 
                size={'small'} 
                type="link" 
                danger
                icon={<DeleteOutlined />}
                disabled={isResourceLoading}
              >
                {i18nInstance.t('2f4aaddde33c9b93c36fd2503f3d122b', '删除')}
              </Button>
            </Popconfirm>
          </Space.Compact>
        );
      },
    },
  ];

  // Enhanced error display
  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded bg-red-50">
        <div className="flex items-center text-red-600 mb-2">
          <InfoCircleOutlined className="mr-2" />
          <span className="font-medium">Failed to load ConfigMaps</span>
        </div>
        <p className="text-red-600 text-sm">
          {error instanceof ApiError ? error.message : 'An unexpected error occurred'}
        </p>
        {error instanceof ApiError && error.details && (
          <details className="mt-2">
            <summary className="text-red-600 text-sm cursor-pointer">Show details</summary>
            <pre className="text-red-600 text-xs mt-1 whitespace-pre-wrap">{error.details}</pre>
          </details>
        )}
      </div>
    );
  }

  return (
    <Table
      rowKey={(r: Config) =>
        `${r.objectMeta.namespace}-${r.objectMeta.name}` || ''
      }
      columns={columns}
      loading={isLoading}
      dataSource={data?.items || []}
      pagination={{
        total: data?.totalItems || data?.listMeta?.totalItems,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => 
          `${range[0]}-${range[1]} of ${total} ConfigMaps`,
      }}
      scroll={{ x: 1200 }}
    />
  );
};
export default ConfigMapTable;
