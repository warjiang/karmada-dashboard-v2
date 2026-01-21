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
import { Button, Space, Card, Typography, Modal } from 'antd';
import { ResourceDetail, DetailTab, BreadcrumbItem } from './index';
import { createWorkloadTabs, createServiceTabs, createConfigTabs, createResourceBreadcrumbs } from './utils';
import { WorkloadKind, ServiceKind, ConfigKind } from '@/services/base';

const { Title, Paragraph } = Typography;

// Mock fetch functions for examples
const mockFetchDeployment = async (params: any) => ({
  objectMeta: {
    name: params.name,
    namespace: params.namespace,
    labels: { app: 'example', version: 'v1.0.0' },
    annotations: { 'deployment.kubernetes.io/revision': '1' },
    creationTimestamp: '2024-01-15T10:30:00Z',
    uid: 'abc123-def456-ghi789',
    resourceVersion: '12345',
  },
  typeMeta: {
    kind: 'Deployment',
    scalable: true,
    restartable: true,
  },
  spec: {
    replicas: 3,
    selector: { matchLabels: { app: 'example' } },
    template: {
      spec: {
        containers: [
          { name: 'app', image: 'nginx:1.21' },
        ],
      },
    },
  },
  status: {
    replicas: 3,
    readyReplicas: 2,
    conditions: [
      {
        type: 'Available',
        status: 'True',
        reason: 'MinimumReplicasAvailable',
        message: 'Deployment has minimum availability.',
        lastTransitionTime: '2024-01-15T10:35:00Z',
      },
    ],
  },
});

const mockFetchService = async (params: any) => ({
  objectMeta: {
    name: params.name,
    namespace: params.namespace,
    labels: { app: 'example' },
    creationTimestamp: '2024-01-15T10:30:00Z',
    uid: 'service-123',
    resourceVersion: '54321',
  },
  typeMeta: {
    kind: 'Service',
    scalable: false,
    restartable: false,
  },
  spec: {
    type: 'ClusterIP',
    selector: { app: 'example' },
    ports: [
      { port: 80, targetPort: 8080, protocol: 'TCP' },
    ],
    clusterIP: '10.96.0.100',
  },
});

const mockFetchConfigMap = async (params: any) => ({
  objectMeta: {
    name: params.name,
    namespace: params.namespace,
    labels: { component: 'config' },
    creationTimestamp: '2024-01-15T10:30:00Z',
    uid: 'configmap-123',
    resourceVersion: '67890',
  },
  typeMeta: {
    kind: 'ConfigMap',
    scalable: false,
    restartable: false,
  },
  data: {
    'app.properties': 'debug=true\nport=8080',
    'config.yaml': 'server:\n  host: localhost\n  port: 8080',
  },
});

// Example 1: Basic Deployment Detail
export const BasicDeploymentDetail: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <Card title="Basic Deployment Detail" className="mb-4">
      <Paragraph>
        A simple deployment detail view with default tabs (Overview, YAML, Events).
      </Paragraph>
      
      <Button type="primary" onClick={() => setOpen(true)}>
        Open Deployment Detail
      </Button>

      <ResourceDetail
        open={open}
        memberClusterName="production-cluster"
        namespace="default"
        name="nginx-deployment"
        resourceType="deployment"
        resourceKind="Deployment"
        fetchFunction={mockFetchDeployment}
        onClose={() => setOpen(false)}
      />
    </Card>
  );
};

// Example 2: Deployment with Workload-Specific Tabs
export const DeploymentWithWorkloadTabs: React.FC = () => {
  const [open, setOpen] = useState(false);

  const workloadTabs = createWorkloadTabs(WorkloadKind.Deployment);
  
  const breadcrumbs = createResourceBreadcrumbs(
    'production-cluster',
    'deployment',
    'Deployment',
    'default',
    'nginx-deployment',
    () => console.log('Navigate to cluster'),
    () => console.log('Navigate to deployments'),
    () => console.log('Navigate to namespace')
  );

  const handleEdit = () => {
    Modal.info({
      title: 'Edit Deployment',
      content: 'This would open the deployment edit form.',
    });
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete Deployment',
      content: 'Are you sure you want to delete this deployment?',
      onOk: () => console.log('Delete confirmed'),
    });
  };

  return (
    <Card title="Deployment with Workload Tabs" className="mb-4">
      <Paragraph>
        A deployment detail view with workload-specific tabs (Pods, Conditions, Metrics, Logs, Related Resources).
        Includes breadcrumbs, edit/delete actions, and navigation callbacks.
      </Paragraph>
      
      <Button type="primary" onClick={() => setOpen(true)}>
        Open Enhanced Deployment Detail
      </Button>

      <ResourceDetail
        open={open}
        memberClusterName="production-cluster"
        namespace="default"
        name="nginx-deployment"
        resourceType="deployment"
        resourceKind="Deployment"
        fetchFunction={mockFetchDeployment}
        tabs={workloadTabs}
        breadcrumbs={breadcrumbs}
        onClose={() => setOpen(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onNavigate={(resource) => console.log('Navigate to:', resource)}
        onRefresh={() => console.log('Refresh triggered')}
      />
    </Card>
  );
};

// Example 3: Service Detail with Custom Actions
export const ServiceDetailWithCustomActions: React.FC = () => {
  const [open, setOpen] = useState(false);

  const serviceTabs = createServiceTabs(ServiceKind.Service);
  
  const customActions = (
    <Space>
      <Button size="small" onClick={() => console.log('Test connectivity')}>
        Test
      </Button>
      <Button size="small" onClick={() => console.log('View traffic')}>
        Traffic
      </Button>
    </Space>
  );

  return (
    <Card title="Service Detail with Custom Actions" className="mb-4">
      <Paragraph>
        A service detail view with service-specific tabs (Endpoints, Related Resources) and custom action buttons.
      </Paragraph>
      
      <Button type="primary" onClick={() => setOpen(true)}>
        Open Service Detail
      </Button>

      <ResourceDetail
        open={open}
        memberClusterName="production-cluster"
        namespace="default"
        name="nginx-service"
        resourceType="service"
        resourceKind="Service"
        fetchFunction={mockFetchService}
        tabs={serviceTabs}
        customActions={customActions}
        onClose={() => setOpen(false)}
        title="Service Configuration"
        width={900}
      />
    </Card>
  );
};

// Example 4: ConfigMap Detail with Custom Tab
export const ConfigMapDetailWithCustomTab: React.FC = () => {
  const [open, setOpen] = useState(false);

  // Custom tab component
  const DataViewerTab: React.FC<any> = ({ resource }) => (
    <div className="space-y-4">
      <Title level={5}>Configuration Data</Title>
      {Object.entries(resource?.data || {}).map(([key, value]) => (
        <Card key={key} title={key} size="small">
          <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
            {value as string}
          </pre>
        </Card>
      ))}
    </div>
  );

  const configTabs = createConfigTabs(ConfigKind.ConfigMap);
  const customTabs: DetailTab[] = [
    {
      key: 'data-viewer',
      label: 'Data Viewer',
      component: DataViewerTab,
    },
    ...configTabs,
  ];

  return (
    <Card title="ConfigMap Detail with Custom Tab" className="mb-4">
      <Paragraph>
        A ConfigMap detail view with a custom data viewer tab that displays configuration data in a formatted way.
      </Paragraph>
      
      <Button type="primary" onClick={() => setOpen(true)}>
        Open ConfigMap Detail
      </Button>

      <ResourceDetail
        open={open}
        memberClusterName="production-cluster"
        namespace="default"
        name="app-config"
        resourceType="configmap"
        resourceKind="ConfigMap"
        fetchFunction={mockFetchConfigMap}
        tabs={customTabs}
        defaultActiveTab="data-viewer"
        onClose={() => setOpen(false)}
        enableEdit={false} // ConfigMaps might not be editable in some contexts
      />
    </Card>
  );
};

// Example 5: Minimal Detail View
export const MinimalDetailView: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <Card title="Minimal Detail View" className="mb-4">
      <Paragraph>
        A minimal detail view with only the essential features enabled. No edit/delete buttons, no breadcrumbs.
      </Paragraph>
      
      <Button type="primary" onClick={() => setOpen(true)}>
        Open Minimal Detail
      </Button>

      <ResourceDetail
        open={open}
        memberClusterName="production-cluster"
        namespace="default"
        name="simple-pod"
        resourceType="pod"
        resourceKind="Pod"
        fetchFunction={mockFetchDeployment} // Reusing for simplicity
        onClose={() => setOpen(false)}
        enableEdit={false}
        enableDelete={false}
        enableBreadcrumbs={false}
        width={600}
        placement="left"
      />
    </Card>
  );
};

// Example 6: Detail View with Error Handling
export const DetailViewWithErrorHandling: React.FC = () => {
  const [open, setOpen] = useState(false);

  const mockFetchWithError = async () => {
    throw new Error('Resource not found or access denied');
  };

  return (
    <Card title="Detail View with Error Handling" className="mb-4">
      <Paragraph>
        Demonstrates how the component handles errors gracefully with retry options.
      </Paragraph>
      
      <Button type="primary" onClick={() => setOpen(true)}>
        Open Detail with Error
      </Button>

      <ResourceDetail
        open={open}
        memberClusterName="production-cluster"
        namespace="default"
        name="missing-resource"
        resourceType="deployment"
        resourceKind="Deployment"
        fetchFunction={mockFetchWithError}
        onClose={() => setOpen(false)}
        onRefresh={() => console.log('Retry fetch')}
      />
    </Card>
  );
};

// Main examples component
export const ResourceDetailExamples: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <Title level={2}>ResourceDetail Component Examples</Title>
        <Paragraph>
          These examples demonstrate various configurations and use cases for the ResourceDetail component.
          Each example shows different features and customization options.
        </Paragraph>
      </div>

      <BasicDeploymentDetail />
      <DeploymentWithWorkloadTabs />
      <ServiceDetailWithCustomActions />
      <ConfigMapDetailWithCustomTab />
      <MinimalDetailView />
      <DetailViewWithErrorHandling />
    </div>
  );
};

export default ResourceDetailExamples;