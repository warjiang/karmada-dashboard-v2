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
import { Card, Typography, Space, Button, Divider } from 'antd';
import { ResourceForm, ResourceFormData } from './index';
import { useFormFieldConfiguration } from './hooks';
import { WorkloadKind, ServiceKind, ConfigKind } from '@/services/base';

const { Title, Paragraph, Text } = Typography;

// Example usage of the comprehensive validation system
export const ValidationExample: React.FC = () => {
  const [selectedResourceType, setSelectedResourceType] = useState<string>('deployment');
  const [formData, setFormData] = useState<ResourceFormData | null>(null);

  // Get field configuration for the selected resource type
  const fields = useFormFieldConfiguration(selectedResourceType);

  // Example form submission handler
  const handleSubmit = async (values: ResourceFormData) => {
    console.log('Form submitted with values:', values);
    setFormData(values);
    
    // In a real application, this would call the appropriate API
    // For example: await CreateMemberClusterDeployment({ memberClusterName, ...values });
  };

  // Example cancel handler
  const handleCancel = () => {
    console.log('Form cancelled');
    setFormData(null);
  };

  // Resource type examples
  const resourceTypes = [
    { key: WorkloadKind.Deployment, label: 'Deployment', description: 'Manage application deployments' },
    { key: WorkloadKind.Statefulset, label: 'StatefulSet', description: 'Manage stateful applications' },
    { key: WorkloadKind.Daemonset, label: 'DaemonSet', description: 'Run pods on all nodes' },
    { key: WorkloadKind.Job, label: 'Job', description: 'Run batch jobs' },
    { key: WorkloadKind.Cronjob, label: 'CronJob', description: 'Schedule recurring jobs' },
    { key: ServiceKind.Service, label: 'Service', description: 'Expose applications' },
    { key: ServiceKind.Ingress, label: 'Ingress', description: 'Manage external access' },
    { key: ConfigKind.ConfigMap, label: 'ConfigMap', description: 'Store configuration data' },
    { key: ConfigKind.Secret, label: 'Secret', description: 'Store sensitive data' },
    { key: ConfigKind.PersistentVolumeClaim, label: 'PVC', description: 'Request storage' },
  ];

  return (
    <div className="validation-example p-6">
      <Title level={2}>Resource Form Validation Example</Title>
      
      <Paragraph>
        This example demonstrates the comprehensive validation system for Kubernetes resources.
        The validation includes:
      </Paragraph>
      
      <ul>
        <li><Text strong>Field-level validation:</Text> Real-time validation as you type</li>
        <li><Text strong>Resource-specific rules:</Text> Validation rules tailored to each resource type</li>
        <li><Text strong>Kubernetes naming conventions:</Text> Proper DNS subdomain validation</li>
        <li><Text strong>Port and quantity validation:</Text> Numeric range and format validation</li>
        <li><Text strong>Cron expression validation:</Text> Proper cron format for CronJobs</li>
        <li><Text strong>Label and annotation validation:</Text> Key-value pair format validation</li>
        <li><Text strong>Form submission validation:</Text> Complete form validation before submission</li>
        <li><Text strong>User-friendly error messages:</Text> Clear, actionable error descriptions</li>
        <li><Text strong>Suggestions and documentation:</Text> Helpful hints and links</li>
      </ul>

      <Divider />

      <Title level={3}>Select Resource Type</Title>
      <Space wrap className="mb-4">
        {resourceTypes.map(type => (
          <Button
            key={type.key}
            type={selectedResourceType === type.key ? 'primary' : 'default'}
            onClick={() => setSelectedResourceType(type.key)}
            title={type.description}
          >
            {type.label}
          </Button>
        ))}
      </Space>

      <Divider />

      <Title level={3}>Resource Form with Validation</Title>
      
      <Card>
        <ResourceForm
          resourceType={selectedResourceType}
          resourceKind={resourceTypes.find(t => t.key === selectedResourceType)?.label || selectedResourceType}
          memberClusterName="example-cluster"
          mode="create"
          fields={fields}
          enableRealTimeValidation={true}
          enableTemplates={true}
          enableExamples={true}
          enableYAMLEditor={true}
          enableUnsavedChangesWarning={true}
          enableProgressIndicator={true}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          customValidation={async (values) => {
            // Example custom validation
            const errors: Record<string, string> = {};
            
            // Custom business logic validation
            if (selectedResourceType === 'deployment' && values.spec?.replicas > 10) {
              errors['spec.replicas'] = 'High replica count requires approval. Please contact your administrator.';
            }
            
            if (values.metadata?.name?.includes('test') && values.metadata?.namespace === 'production') {
              errors['metadata.name'] = 'Test resources should not be deployed to production namespace.';
            }
            
            return errors;
          }}
          helpContent={
            <div>
              <Title level={5}>Validation Features</Title>
              <ul>
                <li>Real-time field validation as you type</li>
                <li>Comprehensive error messages with suggestions</li>
                <li>Resource-specific validation rules</li>
                <li>Kubernetes naming convention enforcement</li>
                <li>Custom business logic validation</li>
                <li>Form submission prevention on validation errors</li>
              </ul>
              
              <Title level={5}>Try These Examples</Title>
              <ul>
                <li>Enter an invalid name (e.g., "My-App" with uppercase)</li>
                <li>Set replicas to a negative number</li>
                <li>Use invalid port numbers (0 or 65536+)</li>
                <li>For CronJobs, try invalid cron expressions</li>
                <li>Add labels with invalid keys or long values</li>
              </ul>
            </div>
          }
        />
      </Card>

      {formData && (
        <>
          <Divider />
          <Title level={3}>Submitted Form Data</Title>
          <Card>
            <pre style={{ background: '#f5f5f5', padding: '16px', borderRadius: '4px' }}>
              {JSON.stringify(formData, null, 2)}
            </pre>
          </Card>
        </>
      )}
    </div>
  );
};

export default ValidationExample;