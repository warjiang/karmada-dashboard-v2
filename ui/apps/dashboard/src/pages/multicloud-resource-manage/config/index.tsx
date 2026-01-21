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

import { useState, useCallback } from 'react';
import { Card, Segmented, Space, Button, notification } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { stringify } from 'yaml';

import i18nInstance from '@/utils/i18n';
import Panel from '@/components/panel';
import { ConfigKind } from '@/services/base.ts';
import { useStore } from './store.ts';

// Services
import {
  GetMemberClusterConfigMaps,
  GetMemberClusterConfigMapDetail,
  CreateMemberClusterConfigMap,
  UpdateMemberClusterConfigMap,
  DeleteMemberClusterConfigMap,
  GetMemberClusterSecrets,
  GetMemberClusterSecretDetail,
  CreateMemberClusterSecret,
  UpdateMemberClusterSecret,
  DeleteMemberClusterSecret,
  GetMemberClusterPVCs,
  GetMemberClusterPVCDetail,
  CreateMemberClusterPVC,
  UpdateMemberClusterPVC,
  DeleteMemberClusterPVC,
} from '@/services/member-cluster/config';

// Enhanced components for all config resource types
import QueryFilter from './components/query-filter';
import ConfigEditorModal from './components/config-editor-modal';
import ConfigMapTable from './components/configmap-table';
import SecretTable from './components/secret-table';
import PVCTable from './components/pvc-table';
import { resourceConfirmations } from '@/components/common/LoadingFeedback';
import { getResourceDependencies, getCascadingDeletions } from '@/utils/resource-dependencies';

// Resource type mapping
const RESOURCE_CONFIG: Record<ConfigKind, {
  title: string;
  singular: string;
  fetchList: (params: any) => Promise<any>;
  fetchDetail: (params: any) => Promise<any>;
  create: (params: any) => Promise<any>;
  update: (params: any) => Promise<any>;
  delete: (params: any) => Promise<any>;
}> = {
  [ConfigKind.Unknown]: {
    title: 'Unknown',
    singular: 'Unknown',
    fetchList: () => Promise.resolve({ data: { items: [], listMeta: { totalItems: 0 } } }),
    fetchDetail: () => Promise.resolve({ data: {} }),
    create: () => Promise.resolve({ data: {} }),
    update: () => Promise.resolve({ data: {} }),
    delete: () => Promise.resolve({ data: {} }),
  },
  [ConfigKind.ConfigMap]: {
    title: 'ConfigMaps',
    singular: 'ConfigMap',
    fetchList: GetMemberClusterConfigMaps,
    fetchDetail: GetMemberClusterConfigMapDetail,
    create: CreateMemberClusterConfigMap,
    update: UpdateMemberClusterConfigMap,
    delete: DeleteMemberClusterConfigMap,
  },
  [ConfigKind.Secret]: {
    title: 'Secrets',
    singular: 'Secret',
    fetchList: GetMemberClusterSecrets,
    fetchDetail: GetMemberClusterSecretDetail,
    create: CreateMemberClusterSecret,
    update: UpdateMemberClusterSecret,
    delete: DeleteMemberClusterSecret,
  },
  [ConfigKind.PersistentVolumeClaim]: {
    title: 'Persistent Volume Claims',
    singular: 'PVC',
    fetchList: GetMemberClusterPVCs,
    fetchDetail: GetMemberClusterPVCDetail,
    create: CreateMemberClusterPVC,
    update: UpdateMemberClusterPVC,
    delete: DeleteMemberClusterPVC,
  },
};

const ConfigPage = () => {
  const queryClient = useQueryClient();
  
  // Enhanced state management
  const [memberClusterName] = useState('member1'); // This should come from context/props
  
  // Legacy store for backward compatibility
  const filter = useStore((state) => state.filter);
  const { setFilter } = useStore((state) => {
    return {
      setFilter: state.setFilter,
    };
  });
  const editor = useStore((state) => state.editor);
  const { editConfig, viewConfig, createConfig, hideEditor } = useStore(
    (state) => {
      return {
        editConfig: state.editConfig,
        viewConfig: state.viewConfig,
        createConfig: state.createConfig,
        hideEditor: state.hideEditor,
      };
    },
  );

  // Get current resource configuration
  const currentConfig = RESOURCE_CONFIG[filter.kind];

  // Legacy handlers for backward compatibility
  const handleLegacyView = useCallback((resource: any) => {
    viewConfig(stringify(resource));
  }, [viewConfig]);

  const handleLegacyEdit = useCallback((resource: any) => {
    editConfig(stringify(resource));
  }, [editConfig]);

  const handleLegacyDelete = useCallback(async (resource: any) => {
    const resourceType = currentConfig.singular;
    const resourceName = resource.objectMeta.name;
    const namespace = resource.objectMeta.namespace;

    // Analyze dependencies
    const dependencies = getResourceDependencies(filter.kind.toLowerCase(), resource);
    const cascadingResources = getCascadingDeletions(resourceType, resourceName, namespace);

    resourceConfirmations.deleteWithDependencies({
      resourceType,
      resourceName,
      namespace,
      dependencies,
      cascadingResources,
      gracePeriodSeconds: 30,
      onConfirm: async () => {
        try {
          await currentConfig.delete({
            memberClusterName,
            namespace,
            name: resourceName,
          });
          
          notification.success({
            message: i18nInstance.t('success', 'Success'),
            description: `${resourceType} deleted successfully`,
          });
          
          await queryClient.invalidateQueries({
            queryKey: [memberClusterName, filter.kind],
            exact: false,
          });
        } catch (e) {
          console.error('Delete error:', e);
          notification.error({
            message: i18nInstance.t('error', 'Error'),
            description: `Failed to delete ${resourceType}`,
          });
        }
      },
    });
  }, [currentConfig, memberClusterName, filter.kind, queryClient]);

  return (
    <Panel>
      {/* Enhanced Header with Resource Type Selector */}
      <Card className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Configuration Resources</h2>
            <Segmented
              value={filter.kind}
              onChange={(value) => setFilter({ kind: value as ConfigKind })}
              options={[
                { label: 'ConfigMaps', value: ConfigKind.ConfigMap },
                { label: 'Secrets', value: ConfigKind.Secret },
                { label: 'PVCs', value: ConfigKind.PersistentVolumeClaim },
              ]}
            />
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={createConfig}
            >
              Create {currentConfig.singular}
            </Button>
          </Space>
        </div>

        {/* Legacy Filter Component for backward compatibility */}
        <QueryFilter
          filter={filter}
          setFilter={(v) => {
            setFilter(v);
          }}
          onNewConfig={createConfig}
          nsOptions={[]}
          isNsDataLoading={false}
        />
      </Card>

      {/* Enhanced Resource Tables for all config types */}
      {filter.kind === ConfigKind.ConfigMap && (
        <Card>
          <ConfigMapTable
            labelTagNum={5}
            selectedWorkSpace={filter.selectedWorkspace}
            searchText={filter.searchText}
            memberClusterName={memberClusterName}
            onViewConfigMapContent={handleLegacyView}
            onEditConfigMapContent={handleLegacyEdit}
            onDeleteConfigMapContent={handleLegacyDelete}
          />
        </Card>
      )}

      {filter.kind === ConfigKind.Secret && (
        <Card>
          <SecretTable
            labelTagNum={5}
            selectedWorkSpace={filter.selectedWorkspace}
            searchText={filter.searchText}
            memberClusterName={memberClusterName}
            onViewSecret={handleLegacyView}
            onEditSecret={handleLegacyEdit}
            onDeleteSecretContent={handleLegacyDelete}
          />
        </Card>
      )}

      {/* PVC Table Component with enhanced functionality */}
      {filter.kind === ConfigKind.PersistentVolumeClaim && (
        <Card>
          <PVCTable
            labelTagNum={5}
            selectedWorkSpace={filter.selectedWorkspace}
            searchText={filter.searchText}
            memberClusterName={memberClusterName}
            onViewPVCContent={handleLegacyView}
            onEditPVCContent={handleLegacyEdit}
            onDeletePVCContent={handleLegacyDelete}
          />
        </Card>
      )}

      {/* Legacy Config Editor Modal for backward compatibility */}
      <ConfigEditorModal
        mode={editor.mode}
        workloadContent={editor.content}
        open={editor.show}
        kind={filter.kind}
        onOk={async (ret) => {
          if (editor.mode === 'read') {
            hideEditor();
            return;
          }
          const msg =
            editor.mode === 'edit'
              ? i18nInstance.t('8347a927c09a4ec2fe473b0a93f667d0', '修改')
              : i18nInstance.t('66ab5e9f24c8f46012a25c89919fb191', '新增');
          if (ret.code === 200) {
            notification.success({
              message: `${msg}${i18nInstance.t('a6d38572262cb1b1238d449b4098f002', '配置成功')}`,
            });
            hideEditor();
            if (editor.mode === 'create') {
              await queryClient.invalidateQueries({
                queryKey: [memberClusterName, filter.kind],
                exact: false,
              });
            }
          } else {
            notification.error({
              message: `${msg}${i18nInstance.t('03d3b00687bbab3e9a7e1bd3aeeaa0a4', '配置失败')}`,
            });
          }
        }}
        onCancel={hideEditor}
      />
    </Panel>
  );
};
export default ConfigPage;
