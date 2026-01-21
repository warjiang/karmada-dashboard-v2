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
import { Button, Space, Table, TableColumnProps, Tag, notification, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined, DatabaseOutlined } from '@ant-design/icons';
import { extractPropagationPolicy, ApiError, ApiErrorType } from '@/services/base';
import TagList from '@/components/tag-list';
import { FC, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GetResource } from '@/services/unstructured.ts';
import { Config } from '@/services/config.ts';
import { 
  GetMemberClusterPVCs, 
  GetMemberClusterPVCDetail,
  PersistentVolumeClaimResource 
} from '@/services/member-cluster/config';
import { EnhancedDeletePopconfirm } from '@/components/common/LoadingFeedback';

// Enhanced PVC resource interface with additional fields
interface EnhancedPVCResource extends PersistentVolumeClaimResource {
  volumeInfo?: {
    volumeName?: string;
    storageClass?: string;
    capacity?: Record<string, string>;
  };
  mountedPods?: string[];
}

interface PVCTableProps {
  labelTagNum?: number;
  selectedWorkSpace: string;
  searchText: string;
  memberClusterName?: string; // Add member cluster support
  onViewPVCContent: (r: EnhancedPVCResource | Config) => void;
  onEditPVCContent: (r: EnhancedPVCResource | Config) => void;
  onDeletePVCContent: (r: Config) => void;
}

const PVCTable: FC<PVCTableProps> = (props) => {
  const {
    labelTagNum,
    selectedWorkSpace,
    searchText,
    memberClusterName,
    onViewPVCContent,
    onEditPVCContent,
    onDeletePVCContent,
  } = props;

  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // Enhanced error handling for loading states
  const setResourceLoading = (resourceKey: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [resourceKey]: loading }));
  };

  // Enhanced data fetching with member cluster support
  const { data, isLoading, error } = useQuery({
    queryKey: ['GetPVCs', memberClusterName, selectedWorkSpace, searchText],
    queryFn: async () => {
      try {
        if (memberClusterName) {
          // Use enhanced member cluster API
          const response = await GetMemberClusterPVCs({
            memberClusterName,
            namespace: selectedWorkSpace || undefined,
            keyword: searchText || undefined,
            itemsPerPage: 100,
            page: 1,
          });
          return {
            items: response.data?.persistentVolumeClaims || [],
            totalItems: response.data?.listMeta?.totalItems || 0,
            errors: response.data?.errors || [],
          };
        } else {
          // Fallback to legacy API if available
          throw new Error('PVC API not available without member cluster name');
        }
      } catch (error) {
        console.error('Error fetching PVCs:', error);
        
        // Enhanced error handling
        if (error instanceof ApiError) {
          notification.error({
            message: 'Failed to load Persistent Volume Claims',
            description: error.message,
            duration: 5,
          });
        } else {
          notification.error({
            message: 'Failed to load Persistent Volume Claims',
            description: 'An unexpected error occurred while loading PVCs',
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
  const fetchResourceDetail = async (resource: Config | PersistentVolumeClaimResource): Promise<EnhancedPVCResource> => {
    const resourceKey = `${resource.objectMeta.namespace}-${resource.objectMeta.name}`;
    setResourceLoading(resourceKey, true);
    
    try {
      if (memberClusterName) {
        // Use enhanced member cluster API
        const response = await GetMemberClusterPVCDetail({
          memberClusterName,
          namespace: resource.objectMeta.namespace,
          name: resource.objectMeta.name,
        });
        return response.data as EnhancedPVCResource;
      } else {
        // Fallback to legacy API
        const ret = await GetResource({
          kind: resource.typeMeta.kind,
          name: resource.objectMeta.name,
          namespace: resource.objectMeta.namespace,
        });
        return ret?.data as EnhancedPVCResource;
      }
    } catch (error) {
      console.error('Error fetching PVC detail:', error);
      
      if (error instanceof ApiError) {
        notification.error({
          message: 'Failed to load PVC details',
          description: error.message,
          duration: 5,
        });
      } else {
        notification.error({
          message: 'Failed to load PVC details',
          description: 'An unexpected error occurred while loading PVC details',
          duration: 5,
        });
      }
      
      throw error;
    } finally {
      setResourceLoading(resourceKey, false);
    }
  };

  // Get status color for PVC phase
  const getStatusColor = (phase: string) => {
    switch (phase?.toLowerCase()) {
      case 'bound':
        return 'green';
      case 'pending':
        return 'orange';
      case 'lost':
        return 'red';
      case 'available':
        return 'blue';
      default:
        return 'default';
    }
  };

  // Format storage size for display
  const formatStorageSize = (size?: string): string => {
    if (!size) return '-';
    
    // Convert to more readable format if needed
    const match = size.match(/^(\d+)([KMGT]i?)$/);
    if (match) {
      const [, value, unit] = match;
      return `${value}${unit}`;
    }
    
    return size;
  };

  // Enhanced columns with PVC-specific information
  const columns: TableColumnProps<Config>[] = [
    {
      title: i18nInstance.t('a4b28a416f0b6f3c215c51e79e517298', '命名空间'),
      key: 'namespaceName',
      width: 150,
      render: (_, r) => {
        return r.objectMeta.namespace;
      },
    },
    {
      title: 'PVC Name',
      key: 'pvcName',
      width: 250,
      render: (_, r) => {
        return (
          <div className="flex items-center">
            <DatabaseOutlined className="mr-2 text-blue-500" />
            {r.objectMeta.name}
          </div>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, r) => {
        const pvcResource = r as PersistentVolumeClaimResource;
        const phase = pvcResource.status?.phase || 'Unknown';
        
        return (
          <Tag color={getStatusColor(phase)}>
            {phase}
          </Tag>
        );
      },
    },
    {
      title: 'Volume',
      key: 'volume',
      width: 200,
      render: (_, r) => {
        const pvcResource = r as EnhancedPVCResource;
        const volumeInfo = pvcResource.volumeInfo;
        const volumeName = volumeInfo?.volumeName || (pvcResource.spec as any)?.volumeName;
        
        if (!volumeName) {
          return <span className="text-gray-400">Not bound</span>;
        }
        
        return (
          <Tooltip title={`Persistent Volume: ${volumeName}`}>
            <span className="text-blue-600 cursor-help">
              {typeof volumeName === 'string' && volumeName.length > 20 ? `${volumeName.substring(0, 20)}...` : volumeName}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Capacity',
      key: 'capacity',
      width: 120,
      render: (_, r) => {
        const pvcResource = r as PersistentVolumeClaimResource;
        const capacity = pvcResource.status?.capacity?.storage || 
                        pvcResource.spec?.resources?.requests?.storage;
        
        return (
          <span className="font-mono">
            {formatStorageSize(capacity)}
          </span>
        );
      },
    },
    {
      title: 'Access Modes',
      key: 'accessModes',
      width: 150,
      render: (_, r) => {
        const pvcResource = r as PersistentVolumeClaimResource;
        const accessModes = pvcResource.status?.accessModes || pvcResource.spec?.accessModes || [];
        
        if (accessModes.length === 0) {
          return <span className="text-gray-400">None</span>;
        }
        
        const shortModes = accessModes.map((mode: string) => {
          switch (mode) {
            case 'ReadWriteOnce':
              return 'RWO';
            case 'ReadOnlyMany':
              return 'ROX';
            case 'ReadWriteMany':
              return 'RWX';
            case 'ReadWriteOncePod':
              return 'RWOP';
            default:
              return mode;
          }
        });
        
        return (
          <Tooltip title={accessModes.join(', ')}>
            <span className="cursor-help">
              {shortModes.join(', ')}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Storage Class',
      key: 'storageClass',
      width: 150,
      render: (_, r) => {
        const pvcResource = r as EnhancedPVCResource;
        const storageClass = pvcResource.volumeInfo?.storageClass || 
                           pvcResource.spec?.storageClassName;
        
        if (!storageClass) {
          return <span className="text-gray-400">Default</span>;
        }
        
        return (
          <Tag color="blue">
            {storageClass}
          </Tag>
        );
      },
    },
    {
      title: 'Mounted Pods',
      key: 'mountedPods',
      width: 120,
      render: (_, r) => {
        // Show mounting information if available
        const pvcResource = r as EnhancedPVCResource;
        const mountedPods = pvcResource.mountedPods;
        
        if (!mountedPods || mountedPods.length === 0) {
          return <span className="text-gray-400">Not mounted</span>;
        }
        
        return (
          <Tooltip 
            title={`Mounted by: ${mountedPods.join(', ')}`}
            placement="topLeft"
          >
            <span className="cursor-help text-green-600">
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
      width: '15%',
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
                  onViewPVCContent(resourceDetail);
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
                  onEditPVCContent(resourceDetail);
                } catch (error) {
                  // Error already handled in fetchResourceDetail
                }
              }}
            >
              {i18nInstance.t('95b351c86267f3aedf89520959bce689', '编辑')}
            </Button>

            <EnhancedDeletePopconfirm
              resourceType="PersistentVolumeClaim"
              resourceName={r.objectMeta.name}
              namespace={r.objectMeta.namespace}
              resource={r}
              relatedResources={[]} // TODO: Pass related resources when available
              onConfirm={() => onDeletePVCContent(r)}
              placement="topRight"
              gracePeriodSeconds={30}
              allowForceDelete={false}
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
            </EnhancedDeletePopconfirm>
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
          <span className="font-medium">Failed to load Persistent Volume Claims</span>
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
        total: data?.totalItems,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => 
          `${range[0]}-${range[1]} of ${total} PVCs`,
      }}
      scroll={{ x: 1400 }}
    />
  );
};

export default PVCTable;