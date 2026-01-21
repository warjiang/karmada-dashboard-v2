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

import React from 'react';
import { notification } from 'antd';
import { ResourceList, createDefaultBulkActions } from './index';
import { createWorkloadColumns, createServiceColumns, createConfigMapColumns } from './columns';
import { GetMemberClusterDeployments } from '@/services/member-cluster/workload';
import { Workload } from '@/services/member-cluster/workload';
import { ServiceResource, ConfigMapResource } from '@/services/base';

// Example: Deployment ResourceList
export const DeploymentResourceList: React.FC<{
  memberClusterName: string;
}> = ({ memberClusterName }) => {
  const handleView = (deployment: Workload) => {
    console.log('View deployment:', deployment);
    // Navigate to deployment detail page
  };

  const handleEdit = (deployment: Workload) => {
    console.log('Edit deployment:', deployment);
    // Navigate to deployment edit page
  };

  const handleDelete = async (deployments: Workload[]) => {
    console.log('Delete deployments:', deployments);
    // Implement bulk delete logic
    notification.success({
      message: 'Deployments deleted',
      description: `Successfully deleted ${deployments.length} deployment(s)`,
    });
  };

  const handleCreate = () => {
    console.log('Create new deployment');
    // Navigate to deployment create page
  };

  const columns = createWorkloadColumns(handleView, handleEdit, (deployment) => 
    handleDelete([deployment])
  );

  const bulkActions = createDefaultBulkActions(
    handleDelete,
    (deployments) => deployments.length === 1 ? handleEdit(deployments[0]) : Promise.resolve(),
  );

  return (
    <ResourceList
      memberClusterName={memberClusterName}
      resourceType="deployment"
      resourceKind="Deployment"
      fetchFunction={GetMemberClusterDeployments}
      columns={columns}
      bulkActions={bulkActions}
      title="Deployments"
      description="Manage Kubernetes Deployments in this cluster"
      createButtonText="Create Deployment"
      onCreateClick={handleCreate}
      onRowClick={handleView}
    />
  );
};

// Example: Service ResourceList
export const ServiceResourceList: React.FC<{
  memberClusterName: string;
  fetchFunction: (params: any) => Promise<any>;
}> = ({ memberClusterName, fetchFunction }) => {
  const handleView = (service: ServiceResource) => {
    console.log('View service:', service);
  };

  const handleEdit = (service: ServiceResource) => {
    console.log('Edit service:', service);
  };

  const handleDelete = async (services: ServiceResource[]) => {
    console.log('Delete services:', services);
    notification.success({
      message: 'Services deleted',
      description: `Successfully deleted ${services.length} service(s)`,
    });
  };

  const columns = createServiceColumns(handleView, handleEdit, (service) => 
    handleDelete([service])
  );

  const bulkActions = createDefaultBulkActions(
    handleDelete,
    (services) => services.length === 1 ? handleEdit(services[0]) : Promise.resolve(),
  );

  return (
    <ResourceList
      memberClusterName={memberClusterName}
      resourceType="service"
      resourceKind="Service"
      fetchFunction={fetchFunction}
      columns={columns}
      bulkActions={bulkActions}
      title="Services"
      description="Manage Kubernetes Services in this cluster"
      createButtonText="Create Service"
      onRowClick={handleView}
    />
  );
};

// Example: ConfigMap ResourceList
export const ConfigMapResourceList: React.FC<{
  memberClusterName: string;
  fetchFunction: (params: any) => Promise<any>;
}> = ({ memberClusterName, fetchFunction }) => {
  const handleView = (configMap: ConfigMapResource) => {
    console.log('View configMap:', configMap);
  };

  const handleEdit = (configMap: ConfigMapResource) => {
    console.log('Edit configMap:', configMap);
  };

  const handleDelete = async (configMaps: ConfigMapResource[]) => {
    console.log('Delete configMaps:', configMaps);
    notification.success({
      message: 'ConfigMaps deleted',
      description: `Successfully deleted ${configMaps.length} ConfigMap(s)`,
    });
  };

  const columns = createConfigMapColumns(handleView, handleEdit, (configMap) => 
    handleDelete([configMap])
  );

  const bulkActions = createDefaultBulkActions(
    handleDelete,
    (configMaps) => configMaps.length === 1 ? handleEdit(configMaps[0]) : Promise.resolve(),
  );

  return (
    <ResourceList
      memberClusterName={memberClusterName}
      resourceType="configmap"
      resourceKind="ConfigMap"
      fetchFunction={fetchFunction}
      columns={columns}
      bulkActions={bulkActions}
      title="ConfigMaps"
      description="Manage Kubernetes ConfigMaps in this cluster"
      createButtonText="Create ConfigMap"
      onRowClick={handleView}
      exportConfig={{
        enabled: true,
        formats: ['csv', 'json'],
        filename: 'configmaps',
      }}
    />
  );
};

// Example: Custom ResourceList with custom filters
export const CustomResourceList: React.FC<{
  memberClusterName: string;
  fetchFunction: (params: any) => Promise<any>;
}> = ({ memberClusterName, fetchFunction }) => {
  const customFilters = (
    <div>
      {/* Custom filter components would go here */}
    </div>
  );

  const customActions = (
    <div>
      {/* Custom action buttons would go here */}
    </div>
  );

  return (
    <ResourceList
      memberClusterName={memberClusterName}
      resourceType="custom"
      resourceKind="Custom Resource"
      fetchFunction={fetchFunction}
      columns={[
        {
          key: 'name',
          title: 'Name',
          dataIndex: 'name',
          sortable: true,
          render: (_, record) => record.objectMeta.name,
        },
        {
          key: 'namespace',
          title: 'Namespace',
          dataIndex: 'namespace',
          sortable: true,
          render: (_, record) => record.objectMeta.namespace,
        },
      ]}
      customFilters={customFilters}
      customActions={customActions}
      enableBulkOperations={false}
      enableExport={false}
      title="Custom Resources"
      description="Custom resource management example"
    />
  );
};