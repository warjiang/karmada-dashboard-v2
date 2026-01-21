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
  App,
  Button,
  Segmented,
  Tag,
  Tooltip,
  Dropdown,
  Modal,
  notification,
  MenuProps,
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  RollbackOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Icons } from '@/components/icons';
import Panel from '@/components/panel';
import ResourceList, { 
  ResourceColumn, 
  BulkAction,
  formatAge,
  formatLabels 
} from '@/components/common/ResourceList';
import { 
  useResourceDeleteMutation, 
  useWorkloadOperationMutation,
  useBulkResourceMutation 
} from '@/hooks/useResourceMutation';
import {
  GetMemberClusterDeployments,
  GetMemberClusterStatefulSets,
  GetMemberClusterDaemonSets,
  GetMemberClusterJobs,
  GetMemberClusterCronJobs,
  DeleteMemberClusterDeployment,
  DeleteMemberClusterStatefulSet,
  DeleteMemberClusterDaemonSet,
  DeleteMemberClusterJob,
  DeleteMemberClusterCronJob,
  PauseMemberClusterDeployment,
  ResumeMemberClusterDeployment,
  RestartMemberClusterDeployment,
  RollbackMemberClusterDeployment,
  TriggerMemberClusterCronJob,
  type Workload,
} from '@/services/member-cluster/workload';
import { WorkloadKind } from '@/services/base';
import NewWorkloadEditorModal from './new-workload-editor-modal.tsx';
import WorkloadDetailDrawer, {
  WorkloadDetailDrawerProps,
} from './workload-detail-drawer.tsx';
import { useToggle } from '@uidotdev/usehooks';
import { stringify } from 'yaml';
import i18nInstance from '@/utils/i18n';
import { resourceConfirmations } from '@/components/common/LoadingFeedback';
import { getResourceDependencies, getCascadingDeletions } from '@/utils/resource-dependencies';

const propagationpolicyKey = 'propagationpolicy.karmada.io/name';

// Workload filter interface
interface WorkloadFilter {
  kind: WorkloadKind;
  selectedNamespace: string;
  searchText: string;
}

// Mock member cluster name - in real implementation this would come from context/props
const MEMBER_CLUSTER_NAME = 'member-cluster-1';

const WorkloadPage = () => {
  const [filter, setFilter] = useState<WorkloadFilter>({
    kind: WorkloadKind.Deployment,
    selectedNamespace: '',
    searchText: '',
  });

  const [drawerData, setDrawerData] = useState<
    Omit<WorkloadDetailDrawerProps, 'onClose'>
  >({
    open: false,
    memberClusterName: MEMBER_CLUSTER_NAME,
    kind: WorkloadKind.Unknown,
    namespace: '',
    name: '',
  });

  const [showModal, toggleShowModal] = useToggle(false);
  const [editorState, setEditorState] = useState<{
    mode: 'create' | 'edit';
    content: string;
  }>({
    mode: 'create',
    content: '',
  });

  const resetEditorState = useCallback(() => {
    setEditorState({
      mode: 'create',
      content: '',
    });
  }, []);

  // Get the appropriate fetch function based on workload kind
  const getFetchFunction = useCallback((kind: WorkloadKind) => {
    switch (kind) {
      case WorkloadKind.Deployment:
        return GetMemberClusterDeployments;
      case WorkloadKind.Statefulset:
        return GetMemberClusterStatefulSets;
      case WorkloadKind.Daemonset:
        return GetMemberClusterDaemonSets;
      case WorkloadKind.Job:
        return GetMemberClusterJobs;
      case WorkloadKind.Cronjob:
        return GetMemberClusterCronJobs;
      default:
        return GetMemberClusterDeployments;
    }
  }, []);

  // Get the appropriate delete function based on workload kind
  const getDeleteFunction = useCallback((kind: WorkloadKind) => {
    switch (kind) {
      case WorkloadKind.Deployment:
        return DeleteMemberClusterDeployment;
      case WorkloadKind.Statefulset:
        return DeleteMemberClusterStatefulSet;
      case WorkloadKind.Daemonset:
        return DeleteMemberClusterDaemonSet;
      case WorkloadKind.Job:
        return DeleteMemberClusterJob;
      case WorkloadKind.Cronjob:
        return DeleteMemberClusterCronJob;
      default:
        return DeleteMemberClusterDeployment;
    }
  }, []);

  // Fetch workload data using the enhanced hook
  const fetchFunction = useCallback(
    (params: {
      memberClusterName: string;
      namespace?: string;
      keyword?: string;
      filterBy?: string[];
      sortBy?: string[];
      itemsPerPage?: number;
      page?: number;
    }) => {
      const fetchFn = getFetchFunction(filter.kind);
      return fetchFn(params).then(response => {
        // Extract the correct array based on workload kind
        let items: Workload[] = [];
        
        switch (filter.kind) {
          case WorkloadKind.Deployment:
            items = (response.data as any).deployments || [];
            break;
          case WorkloadKind.Statefulset:
            items = (response.data as any).statefulSets || [];
            break;
          case WorkloadKind.Daemonset:
            items = (response.data as any).daemonSets || [];
            break;
          case WorkloadKind.Job:
            items = (response.data as any).jobs || [];
            break;
          case WorkloadKind.Cronjob:
            items = (response.data as any).cronJobs || [];
            break;
          default:
            items = [];
        }

        return {
          items,
          listMeta: response.data.listMeta,
          errors: response.data.errors,
        };
      });
    },
    [filter.kind, getFetchFunction]
  );

  // Delete mutation
  const deleteMutation = useResourceDeleteMutation(
    filter.kind.toLowerCase(),
    getDeleteFunction(filter.kind),
    {
      onSuccess: () => {
        notification.success({
          message: i18nInstance.t('success', 'Success'),
          description: i18nInstance.t('delete_success', 'Resource deleted successfully'),
        });
      },
    }
  );

  // Workload operation mutations
  const pauseMutation = useWorkloadOperationMutation(
    (params) => PauseMemberClusterDeployment(params),
    {
      onSuccess: () => {
        notification.success({
          message: i18nInstance.t('success', 'Success'),
          description: i18nInstance.t('pause_success', 'Deployment paused successfully'),
        });
      },
    }
  );

  const resumeMutation = useWorkloadOperationMutation(
    (params) => ResumeMemberClusterDeployment(params),
    {
      onSuccess: () => {
        notification.success({
          message: i18nInstance.t('success', 'Success'),
          description: i18nInstance.t('resume_success', 'Deployment resumed successfully'),
        });
      },
    }
  );

  const restartMutation = useWorkloadOperationMutation(
    (params) => RestartMemberClusterDeployment(params),
    {
      onSuccess: () => {
        notification.success({
          message: i18nInstance.t('success', 'Success'),
          description: i18nInstance.t('restart_success', 'Deployment restarted successfully'),
        });
      },
    }
  );

  const rollbackMutation = useWorkloadOperationMutation(
    (params) => RollbackMemberClusterDeployment(params),
    {
      onSuccess: () => {
        notification.success({
          message: i18nInstance.t('success', 'Success'),
          description: i18nInstance.t('rollback_success', 'Deployment rolled back successfully'),
        });
      },
    }
  );

  const triggerMutation = useWorkloadOperationMutation(
    (params) => TriggerMemberClusterCronJob(params),
    {
      onSuccess: () => {
        notification.success({
          message: i18nInstance.t('success', 'Success'),
          description: i18nInstance.t('trigger_success', 'CronJob triggered successfully'),
        });
      },
    }
  );

  // Bulk delete mutation
  const bulkDeleteMutation = useBulkResourceMutation(
    filter.kind.toLowerCase(),
    async (params) => {
      const deleteFunction = getDeleteFunction(filter.kind);
      const results = await Promise.allSettled(
        params.resources.map(resource =>
          deleteFunction({
            memberClusterName: params.memberClusterName,
            namespace: resource.namespace,
            name: resource.name,
          })
        )
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.filter(r => r.status === 'rejected').length;
      const errors = results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map(r => (r.reason as Error).message || 'Unknown error');

      return {
        code: 200,
        message: 'Bulk operation completed',
        data: { successCount, failureCount, errors },
      };
    }
  );

  // Handle workload operations
  const handleWorkloadOperation = useCallback(
    (operation: string, workload: Workload) => {
      const params = {
        memberClusterName: MEMBER_CLUSTER_NAME,
        namespace: workload.objectMeta.namespace,
        name: workload.objectMeta.name,
        operation: operation as any,
      };

      switch (operation) {
        case 'pause':
          pauseMutation.mutate(params);
          break;
        case 'resume':
          resumeMutation.mutate(params);
          break;
        case 'restart':
          restartMutation.mutate(params);
          break;
        case 'rollback':
          rollbackMutation.mutate(params);
          break;
        case 'trigger':
          triggerMutation.mutate(params);
          break;
      }
    },
    [pauseMutation, resumeMutation, restartMutation, rollbackMutation, triggerMutation]
  );

  // Handle single workload deletion
  const handleDelete = useCallback(
    async (workload: Workload) => {
      const resourceType = filter.kind;
      const resourceName = workload.objectMeta.name;
      const namespace = workload.objectMeta.namespace;

      // Analyze dependencies and cascading deletions
      const dependencies = getResourceDependencies(resourceType.toLowerCase(), workload);
      const cascadingResources = getCascadingDeletions(resourceType, resourceName, namespace);

      resourceConfirmations.deleteWithDependencies({
        resourceType,
        resourceName,
        namespace,
        dependencies,
        cascadingResources,
        gracePeriodSeconds: 30,
        onConfirm: () => {
          deleteMutation.mutate({
            memberClusterName: MEMBER_CLUSTER_NAME,
            namespace,
            name: resourceName,
          });
        },
      });
    },
    [filter.kind, deleteMutation]
  );

  // Handle bulk deletion
  const handleBulkDelete = useCallback(
    async (workloads: Workload[]) => {
      const resourceType = filter.kind;
      
      // Analyze dependencies for all selected workloads
      const allDependencies = workloads.flatMap(workload => 
        getResourceDependencies(resourceType.toLowerCase(), workload)
      );

      // Analyze cascading deletions for all workloads
      const allCascadingResources = workloads.flatMap(workload =>
        getCascadingDeletions(resourceType, workload.objectMeta.name, workload.objectMeta.namespace)
      );

      resourceConfirmations.deleteWithDependencies({
        resourceType: `${workloads.length} ${resourceType}${workloads.length > 1 ? 's' : ''}`,
        resourceName: `${workloads.length} selected items`,
        dependencies: allDependencies,
        cascadingResources: allCascadingResources,
        gracePeriodSeconds: 30,
        onConfirm: () => {
          bulkDeleteMutation.mutate({
            memberClusterName: MEMBER_CLUSTER_NAME,
            resources: workloads.map(w => ({
              namespace: w.objectMeta.namespace,
              name: w.objectMeta.name,
            })),
            operation: 'delete',
          });
        },
      });
    },
    [bulkDeleteMutation, filter.kind]
  );

  // Get workload-specific operation menu items
  const getWorkloadOperationMenuItems = useCallback(
    (workload: Workload): MenuProps['items'] => {
      const baseItems: MenuProps['items'] = [
        {
          key: 'view',
          label: i18nInstance.t('view', 'View'),
          icon: <EyeOutlined />,
          onClick: () => {
            setDrawerData({
              open: true,
              memberClusterName: MEMBER_CLUSTER_NAME,
              kind: workload.typeMeta.kind as WorkloadKind,
              name: workload.objectMeta.name,
              namespace: workload.objectMeta.namespace,
            });
          },
        },
        {
          key: 'edit',
          label: i18nInstance.t('edit', 'Edit'),
          icon: <EditOutlined />,
          onClick: () => {
            // This would need to be implemented with the proper API call
            // For now, using the existing pattern
            setEditorState({
              mode: 'edit',
              content: stringify(workload), // This is a placeholder
            });
            toggleShowModal(true);
          },
        },
        {
          type: 'divider',
        },
      ];

      // Add workload-specific operations
      if (filter.kind === WorkloadKind.Deployment) {
        baseItems.push(
          {
            key: 'pause',
            label: i18nInstance.t('pause', 'Pause'),
            icon: <PauseCircleOutlined />,
            onClick: () => handleWorkloadOperation('pause', workload),
          },
          {
            key: 'resume',
            label: i18nInstance.t('resume', 'Resume'),
            icon: <PlayCircleOutlined />,
            onClick: () => handleWorkloadOperation('resume', workload),
          },
          {
            key: 'restart',
            label: i18nInstance.t('restart', 'Restart'),
            icon: <ReloadOutlined />,
            onClick: () => handleWorkloadOperation('restart', workload),
          },
          {
            key: 'rollback',
            label: i18nInstance.t('rollback', 'Rollback'),
            icon: <RollbackOutlined />,
            onClick: () => handleWorkloadOperation('rollback', workload),
          },
          {
            type: 'divider',
          }
        );
      }

      if (filter.kind === WorkloadKind.Cronjob) {
        baseItems.push(
          {
            key: 'trigger',
            label: i18nInstance.t('trigger', 'Trigger Now'),
            icon: <ThunderboltOutlined />,
            onClick: () => handleWorkloadOperation('trigger', workload),
          },
          {
            type: 'divider',
          }
        );
      }

      // Add delete option
      baseItems.push({
        key: 'delete',
        label: i18nInstance.t('delete', 'Delete'),
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => {
          Modal.confirm({
            title: i18nInstance.t('confirm_delete', 'Confirm Delete'),
            content: i18nInstance.t(
              'delete_warning',
              `Are you sure you want to delete ${workload.objectMeta.name}?`
            ),
            okText: i18nInstance.t('delete', 'Delete'),
            okType: 'danger',
            cancelText: i18nInstance.t('cancel', 'Cancel'),
            onOk: () => handleDelete(workload),
          });
        },
      });

      return baseItems;
    },
    [filter.kind, handleWorkloadOperation, handleDelete, toggleShowModal]
  );
  // Define table columns for the ResourceList component
  const columns: ResourceColumn<Workload>[] = useMemo(() => [
    {
      key: 'namespace',
      title: i18nInstance.t('a4b28a416f0b6f3c215c51e79e517298', '命名空间'),
      dataIndex: 'namespace',
      width: 150,
      sortable: true,
      ellipsis: true,
      render: (_, record: Workload) => (
        <Tag color="blue">{record.objectMeta.namespace}</Tag>
      ),
    },
    {
      key: 'name',
      title: i18nInstance.t('89d19c60880d35c2bd88af0d9cc0497b', '负载名称'),
      dataIndex: 'name',
      width: 200,
      sortable: true,
      ellipsis: true,
      render: (_, record: Workload) => (
        <Button
          type="link"
          className="p-0 h-auto"
          onClick={() => {
            setDrawerData({
              open: true,
              memberClusterName: MEMBER_CLUSTER_NAME,
              kind: record.typeMeta.kind as WorkloadKind,
              name: record.objectMeta.name,
              namespace: record.objectMeta.namespace,
            });
          }}
        >
          {record.objectMeta.name}
        </Button>
      ),
    },
    {
      key: 'ready',
      title: i18nInstance.t('ready_status', 'Ready'),
      width: 120,
      render: (_, record: Workload) => {
        const { current, desired } = record.pods;
        const isReady = current === desired && desired > 0;
        return (
          <Tag color={isReady ? 'success' : 'warning'}>
            {current}/{desired}
          </Tag>
        );
      },
    },
    {
      key: 'images',
      title: i18nInstance.t('images', 'Images'),
      width: 200,
      ellipsis: true,
      render: (_, record: Workload) => {
        const images = record.containerImages || [];
        if (images.length === 0) return '-';
        
        return (
          <Tooltip title={images.join(', ')}>
            <span>{images[0]}{images.length > 1 ? ` +${images.length - 1}` : ''}</span>
          </Tooltip>
        );
      },
    },
    {
      key: 'labels',
      title: i18nInstance.t('1f7be0a924280cd098db93c9d81ecccd', '标签信息'),
      width: 250,
      render: (_, record: Workload) => 
        formatLabels(record.objectMeta.labels, 2),
    },
    {
      key: 'age',
      title: i18nInstance.t('age', 'Age'),
      width: 100,
      sortable: true,
      render: (_, record: Workload) => 
        formatAge(record.objectMeta.creationTimestamp),
    },
    {
      key: 'propagationPolicy',
      title: i18nInstance.t('8a99082b2c32c843d2241e0ba60a3619', '分发策略'),
      width: 150,
      render: (_, record: Workload) => {
        const policyName = record.objectMeta.annotations?.[propagationpolicyKey];
        return policyName ? <Tag>{policyName}</Tag> : '-';
      },
    },
    {
      key: 'overridePolicy',
      title: i18nInstance.t('eaf8a02d1b16fcf94302927094af921f', '覆盖策略'),
      width: 150,
      render: () => '-', // Placeholder for override policies
    },
    {
      key: 'actions',
      title: i18nInstance.t('2b6bc0f293f5ca01b006206c2535ccbc', '操作'),
      width: 120,
      fixed: 'right',
      render: (_, record: Workload) => (
        <Dropdown
          menu={{ items: getWorkloadOperationMenuItems(record) }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button size="small" type="text">
            {i18nInstance.t('actions', 'Actions')}
          </Button>
        </Dropdown>
      ),
    },
  ], [getWorkloadOperationMenuItems]);

  // Define bulk actions
  const bulkActions: BulkAction[] = useMemo(() => [
    {
      key: 'delete',
      label: i18nInstance.t('delete', 'Delete'),
      icon: <DeleteOutlined />,
      danger: true,
      onClick: (selectedItems) => {
        // Type assertion since we know these are Workload items
        const workloads = selectedItems as unknown as Workload[];
        return handleBulkDelete(workloads);
      },
    },
  ], [handleBulkDelete]);

  // Handle filter changes
  const handleKindChange = useCallback((kind: WorkloadKind) => {
    if (kind !== filter.kind) {
      setFilter({
        kind,
        selectedNamespace: '',
        searchText: '',
      });
    }
  }, [filter.kind]);

  const { message: messageApi } = App.useApp();
  return (
    <Panel>
      {/* Workload Type Selector */}
      <div className="flex flex-row justify-between mb-4">
        <div>
          <Segmented
            value={filter.kind}
            style={{ marginBottom: 8 }}
            onChange={handleKindChange}
            options={[
              {
                label: 'Deployment',
                value: WorkloadKind.Deployment,
              },
              {
                label: 'StatefulSet',
                value: WorkloadKind.Statefulset,
              },
              {
                label: 'DaemonSet',
                value: WorkloadKind.Daemonset,
              },
              {
                label: 'CronJob',
                value: WorkloadKind.Cronjob,
              },
              {
                label: 'Job',
                value: WorkloadKind.Job,
              },
            ]}
          />
        </div>
        <Button
          type="primary"
          icon={<Icons.add width={16} height={16} />}
          className="flex flex-row items-center"
          onClick={() => {
            toggleShowModal(true);
          }}
        >
          {i18nInstance.t('96d6b0fcc58b6f65dc4c00c6138d2ac0', '新增工作负载')}
        </Button>
      </div>

      {/* Enhanced ResourceList Component */}
      <ResourceList<Workload>
        memberClusterName={MEMBER_CLUSTER_NAME}
        resourceType={filter.kind.toLowerCase()}
        resourceKind={filter.kind}
        fetchFunction={fetchFunction}
        columns={columns}
        enableBulkOperations={true}
        bulkActions={bulkActions}
        enableExport={true}
        enableRefresh={true}
        enableSearch={true}
        enableFiltering={true}
        enableSorting={true}
        enablePagination={true}
        title={`${filter.kind}s`}
        description={i18nInstance.t(
          'workload_description',
          `Manage ${filter.kind.toLowerCase()} resources in the member cluster`
        )}
        emptyStateMessage={i18nInstance.t(
          'no_workloads',
          `No ${filter.kind.toLowerCase()}s found`
        )}
        exportConfig={{
          enabled: true,
          formats: ['csv', 'json'],
          filename: `${filter.kind.toLowerCase()}s-${new Date().toISOString().slice(0, 10)}`,
        }}
        onRowClick={(record) => {
          setDrawerData({
            open: true,
            memberClusterName: MEMBER_CLUSTER_NAME,
            kind: record.typeMeta.kind as WorkloadKind,
            name: record.objectMeta.name,
            namespace: record.objectMeta.namespace,
          });
        }}
        customFilters={
          <div className="flex flex-row space-x-4">
            {/* Additional custom filters can be added here */}
          </div>
        }
      />

      {/* Create/Edit Modal */}
      <NewWorkloadEditorModal
        mode={editorState.mode}
        workloadContent={editorState.content}
        open={showModal}
        kind={filter.kind}
        onOk={async (ret) => {
          const msg =
            editorState.mode === 'edit'
              ? i18nInstance.t('8347a927c09a4ec2fe473b0a93f667d0', '修改')
              : i18nInstance.t('66ab5e9f24c8f46012a25c89919fb191', '新增');
          if (ret.code === 200) {
            await messageApi.success(
              `${i18nInstance.t('c3bc562e9ffcae6029db730fe218515c', '工作负载')}${msg}${i18nInstance.t('330363dfc524cff2488f2ebde0500896', '成功')}`,
            );
            toggleShowModal(false);
            resetEditorState();
          } else {
            await messageApi.error(
              `工作负载${msg}${i18nInstance.t('acd5cb847a4aff235c9a01ddeb6f9770', '失败')}`,
            );
          }
        }}
        onCancel={() => {
          resetEditorState();
          toggleShowModal(false);
        }}
      />

      {/* Detail Drawer */}
      <WorkloadDetailDrawer
        open={drawerData.open}
        memberClusterName={MEMBER_CLUSTER_NAME}
        kind={drawerData.kind}
        name={drawerData.name}
        namespace={drawerData.namespace}
        onClose={() => {
          setDrawerData({
            open: false,
            memberClusterName: MEMBER_CLUSTER_NAME,
            kind: WorkloadKind.Unknown,
            namespace: '',
            name: '',
          });
        }}
        onEdit={() => {
          // Handle edit action - could open the editor modal with current resource
          console.log('Edit workload:', drawerData);
        }}
        onDelete={() => {
          // Handle delete action
          if (drawerData.name && drawerData.namespace) {
            const workload = {
              objectMeta: {
                name: drawerData.name,
                namespace: drawerData.namespace,
              },
              typeMeta: {
                kind: drawerData.kind,
              },
            } as any;
            handleDelete(workload);
          }
        }}
        onNavigate={(resource) => {
          // Handle navigation to related resources
          console.log('Navigate to resource:', resource);
          // This could be implemented to navigate to other resource pages
        }}
      />
    </Panel>
  );
};
export default WorkloadPage;
