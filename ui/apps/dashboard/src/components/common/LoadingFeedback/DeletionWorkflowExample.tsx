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
import { Button, Space, Card, Typography, Divider } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { 
  showDeletionConfirmation, 
  resourceConfirmations, 
  EnhancedDeletePopconfirm,
  ResourceDependency 
} from './index';

const { Title, Text } = Typography;

/**
 * Example component demonstrating the enhanced deletion workflow
 */
const DeletionWorkflowExample: React.FC = () => {
  // Example dependencies for demonstration
  const configMapDependencies: ResourceDependency[] = [
    {
      type: 'mount',
      resourceType: 'Pod',
      resourceName: 'nginx-pod',
      namespace: 'default',
      description: 'Pod will lose access to configuration data',
      severity: 'error'
    },
    {
      type: 'reference',
      resourceType: 'Deployment',
      resourceName: 'nginx-deployment',
      namespace: 'default',
      description: 'Deployment pods will fail to start without this ConfigMap',
      severity: 'error'
    }
  ];

  const pvcDependencies: ResourceDependency[] = [
    {
      type: 'mount',
      resourceType: 'Pod',
      resourceName: 'database-pod',
      namespace: 'default',
      description: 'Pod will lose access to persistent storage',
      severity: 'error'
    },
    {
      type: 'reference',
      resourceType: 'PersistentVolume',
      resourceName: 'pv-001',
      description: 'Bound persistent volume may be released and data could be lost',
      severity: 'warning'
    }
  ];

  const deploymentCascading: ResourceDependency[] = [
    {
      type: 'ownership',
      resourceType: 'ReplicaSet',
      resourceName: 'nginx-rs-abc123',
      namespace: 'default',
      description: 'Owned by deployment, will be automatically deleted',
      severity: 'info'
    },
    {
      type: 'ownership',
      resourceType: 'Pod',
      resourceName: '3 pod(s)',
      namespace: 'default',
      description: 'Owned by deployment ReplicaSets, will be automatically deleted',
      severity: 'info'
    }
  ];

  const handleBasicDeletion = () => {
    showDeletionConfirmation({
      resourceType: 'Service',
      resourceName: 'nginx-service',
      namespace: 'default',
      onConfirm: () => {
        console.log('Basic deletion confirmed');
      }
    });
  };

  const handleDeletionWithDependencies = () => {
    showDeletionConfirmation({
      resourceType: 'ConfigMap',
      resourceName: 'app-config',
      namespace: 'default',
      dependencies: configMapDependencies,
      onConfirm: () => {
        console.log('ConfigMap deletion with dependencies confirmed');
      }
    });
  };

  const handleDeletionWithCascading = () => {
    showDeletionConfirmation({
      resourceType: 'Deployment',
      resourceName: 'nginx-deployment',
      namespace: 'default',
      cascadingResources: deploymentCascading,
      gracePeriodSeconds: 30,
      onConfirm: () => {
        console.log('Deployment deletion with cascading confirmed');
      }
    });
  };

  const handleBlockedDeletion = () => {
    showDeletionConfirmation({
      resourceType: 'PersistentVolumeClaim',
      resourceName: 'data-pvc',
      namespace: 'default',
      dependencies: pvcDependencies,
      force: false,
      onConfirm: () => {
        console.log('PVC deletion confirmed');
      }
    });
  };

  const handleForceDeletion = () => {
    showDeletionConfirmation({
      resourceType: 'PersistentVolumeClaim',
      resourceName: 'data-pvc',
      namespace: 'default',
      dependencies: pvcDependencies,
      force: true,
      onConfirm: () => {
        console.log('PVC force deletion confirmed');
      }
    });
  };

  const handleResourceConfirmation = () => {
    resourceConfirmations.deleteWithDependencies({
      resourceType: 'Secret',
      resourceName: 'app-secret',
      namespace: 'default',
      dependencies: [
        {
          type: 'mount',
          resourceType: 'Pod',
          resourceName: 'app-pod',
          namespace: 'default',
          description: 'Pod will lose access to secret data',
          severity: 'error'
        }
      ],
      onConfirm: () => {
        console.log('Secret deletion confirmed via resourceConfirmations');
      }
    });
  };

  const handleBulkDeletion = () => {
    resourceConfirmations.bulkDelete(
      'ConfigMap',
      3,
      () => {
        console.log('Bulk deletion confirmed');
      },
      [
        {
          type: 'mount',
          resourceType: 'Pod',
          resourceName: 'multiple pods',
          description: 'Multiple pods will lose configuration data',
          severity: 'warning'
        }
      ]
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Enhanced Deletion Workflow Examples</Title>
      <Text type="secondary">
        Demonstrates consistent deletion confirmation dialogs with dependency warnings and cascading deletion handling.
      </Text>

      <Divider />

      <Card title="Basic Deletion" style={{ marginBottom: '16px' }}>
        <Text>Simple deletion without dependencies or cascading resources.</Text>
        <br />
        <br />
        <Button 
          danger 
          icon={<DeleteOutlined />} 
          onClick={handleBasicDeletion}
        >
          Delete Service
        </Button>
      </Card>

      <Card title="Deletion with Dependencies" style={{ marginBottom: '16px' }}>
        <Text>Deletion that shows critical dependencies that would be affected.</Text>
        <br />
        <br />
        <Button 
          danger 
          icon={<DeleteOutlined />} 
          onClick={handleDeletionWithDependencies}
        >
          Delete ConfigMap with Dependencies
        </Button>
      </Card>

      <Card title="Deletion with Cascading Resources" style={{ marginBottom: '16px' }}>
        <Text>Deletion that shows resources that will be automatically deleted.</Text>
        <br />
        <br />
        <Button 
          danger 
          icon={<DeleteOutlined />} 
          onClick={handleDeletionWithCascading}
        >
          Delete Deployment with Cascading
        </Button>
      </Card>

      <Card title="Blocked Deletion" style={{ marginBottom: '16px' }}>
        <Text>Deletion blocked by critical dependencies (can be overridden with force).</Text>
        <br />
        <br />
        <Space>
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={handleBlockedDeletion}
          >
            Delete PVC (Blocked)
          </Button>
          <Button 
            danger 
            type="primary"
            icon={<DeleteOutlined />} 
            onClick={handleForceDeletion}
          >
            Force Delete PVC
          </Button>
        </Space>
      </Card>

      <Card title="Resource Confirmations API" style={{ marginBottom: '16px' }}>
        <Text>Using the resourceConfirmations API for consistent deletion dialogs.</Text>
        <br />
        <br />
        <Space>
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={handleResourceConfirmation}
          >
            Delete Secret
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={handleBulkDeletion}
          >
            Bulk Delete ConfigMaps
          </Button>
        </Space>
      </Card>

      <Card title="Enhanced Delete Popconfirm" style={{ marginBottom: '16px' }}>
        <Text>Using the EnhancedDeletePopconfirm component for inline deletion.</Text>
        <br />
        <br />
        <EnhancedDeletePopconfirm
          resourceType="ConfigMap"
          resourceName="app-config"
          namespace="default"
          resource={{
            objectMeta: { name: 'app-config', namespace: 'default' },
            typeMeta: { kind: 'ConfigMap' }
          }}
          onConfirm={() => console.log('Enhanced popconfirm deletion confirmed')}
          gracePeriodSeconds={30}
        >
          <Button danger icon={<DeleteOutlined />}>
            Delete with Enhanced Popconfirm
          </Button>
        </EnhancedDeletePopconfirm>
      </Card>
    </div>
  );
};

export default DeletionWorkflowExample;