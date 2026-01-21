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
import { FormFieldConfig, ResourceTemplate, ResourceExample } from './index';

// Example field configurations for different resource types

export const deploymentFields: FormFieldConfig[] = [
  // Metadata fields
  {
    key: 'metadata.name',
    label: 'Name',
    type: 'input',
    required: true,
    placeholder: 'Enter deployment name',
    tooltip: 'The name of the deployment. Must be unique within the namespace.',
    validation: {
      pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
      message: 'Name must be lowercase alphanumeric with hyphens',
    },
  },
  {
    key: 'metadata.namespace',
    label: 'Namespace',
    type: 'select',
    required: true,
    placeholder: 'Select namespace',
    tooltip: 'The namespace where the deployment will be created.',
    options: [
      { label: 'default', value: 'default' },
      { label: 'production', value: 'production' },
      { label: 'staging', value: 'staging' },
      { label: 'development', value: 'development' },
    ],
    defaultValue: 'default',
  },
  {
    key: 'spec.replicas',
    label: 'Replicas',
    type: 'number',
    required: true,
    placeholder: 'Number of replicas',
    tooltip: 'The number of pod replicas to run.',
    validation: {
      min: 0,
      max: 100,
      message: 'Replicas must be between 0 and 100',
    },
    defaultValue: 1,
  },
];

export const serviceFields: FormFieldConfig[] = [
  {
    key: 'metadata.name',
    label: 'Name',
    type: 'input',
    required: true,
    placeholder: 'Enter service name',
    tooltip: 'The name of the service. Must be unique within the namespace.',
    validation: {
      pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
      message: 'Name must be lowercase alphanumeric with hyphens',
    },
  },
  {
    key: 'metadata.namespace',
    label: 'Namespace',
    type: 'select',
    required: true,
    placeholder: 'Select namespace',
    tooltip: 'The namespace where the service will be created.',
    options: [
      { label: 'default', value: 'default' },
      { label: 'production', value: 'production' },
      { label: 'staging', value: 'staging' },
      { label: 'development', value: 'development' },
    ],
    defaultValue: 'default',
  },
  {
    key: 'spec.type',
    label: 'Service Type',
    type: 'select',
    required: true,
    placeholder: 'Select service type',
    tooltip: 'The type of service to create.',
    options: [
      { label: 'ClusterIP', value: 'ClusterIP' },
      { label: 'NodePort', value: 'NodePort' },
      { label: 'LoadBalancer', value: 'LoadBalancer' },
      { label: 'ExternalName', value: 'ExternalName' },
    ],
    defaultValue: 'ClusterIP',
  },
];

export const configMapFields: FormFieldConfig[] = [
  {
    key: 'metadata.name',
    label: 'Name',
    type: 'input',
    required: true,
    placeholder: 'Enter ConfigMap name',
    tooltip: 'The name of the ConfigMap. Must be unique within the namespace.',
    validation: {
      pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
      message: 'Name must be lowercase alphanumeric with hyphens',
    },
  },
  {
    key: 'metadata.namespace',
    label: 'Namespace',
    type: 'select',
    required: true,
    placeholder: 'Select namespace',
    tooltip: 'The namespace where the ConfigMap will be created.',
    options: [
      { label: 'default', value: 'default' },
      { label: 'production', value: 'production' },
      { label: 'staging', value: 'staging' },
      { label: 'development', value: 'development' },
    ],
    defaultValue: 'default',
  },
];

export const secretFields: FormFieldConfig[] = [
  {
    key: 'metadata.name',
    label: 'Name',
    type: 'input',
    required: true,
    placeholder: 'Enter Secret name',
    tooltip: 'The name of the Secret. Must be unique within the namespace.',
    validation: {
      pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
      message: 'Name must be lowercase alphanumeric with hyphens',
    },
  },
  {
    key: 'metadata.namespace',
    label: 'Namespace',
    type: 'select',
    required: true,
    placeholder: 'Select namespace',
    tooltip: 'The namespace where the Secret will be created.',
    options: [
      { label: 'default', value: 'default' },
      { label: 'production', value: 'production' },
      { label: 'staging', value: 'staging' },
      { label: 'development', value: 'development' },
    ],
    defaultValue: 'default',
  },
  {
    key: 'type',
    label: 'Secret Type',
    type: 'select',
    required: true,
    placeholder: 'Select secret type',
    tooltip: 'The type of secret to create.',
    options: [
      { label: 'Opaque', value: 'Opaque' },
      { label: 'kubernetes.io/service-account-token', value: 'kubernetes.io/service-account-token' },
      { label: 'kubernetes.io/dockerconfigjson', value: 'kubernetes.io/dockerconfigjson' },
      { label: 'kubernetes.io/basic-auth', value: 'kubernetes.io/basic-auth' },
      { label: 'kubernetes.io/ssh-auth', value: 'kubernetes.io/ssh-auth' },
      { label: 'kubernetes.io/tls', value: 'kubernetes.io/tls' },
    ],
    defaultValue: 'Opaque',
  },
];

export const pvcFields: FormFieldConfig[] = [
  {
    key: 'metadata.name',
    label: 'Name',
    type: 'input',
    required: true,
    placeholder: 'Enter PVC name',
    tooltip: 'The name of the PVC. Must be unique within the namespace.',
    validation: {
      pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
      message: 'Name must be lowercase alphanumeric with hyphens',
    },
  },
  {
    key: 'metadata.namespace',
    label: 'Namespace',
    type: 'select',
    required: true,
    placeholder: 'Select namespace',
    tooltip: 'The namespace where the PVC will be created.',
    options: [
      { label: 'default', value: 'default' },
      { label: 'production', value: 'production' },
      { label: 'staging', value: 'staging' },
      { label: 'development', value: 'development' },
    ],
    defaultValue: 'default',
  },
  {
    key: 'spec.accessModes',
    label: 'Access Modes',
    type: 'select',
    required: true,
    placeholder: 'Select access mode',
    tooltip: 'The access modes for the persistent volume.',
    options: [
      { label: 'ReadWriteOnce', value: 'ReadWriteOnce' },
      { label: 'ReadOnlyMany', value: 'ReadOnlyMany' },
      { label: 'ReadWriteMany', value: 'ReadWriteMany' },
    ],
    defaultValue: 'ReadWriteOnce',
  },
  {
    key: 'spec.resources.requests.storage',
    label: 'Storage Size',
    type: 'input',
    required: true,
    placeholder: 'e.g., 10Gi',
    tooltip: 'The amount of storage to request.',
    validation: {
      pattern: /^\d+[KMGT]i?$/,
      message: 'Storage size must be in format like 10Gi, 100Mi, etc.',
    },
  },
  {
    key: 'spec.storageClassName',
    label: 'Storage Class',
    type: 'input',
    placeholder: 'Leave empty for default storage class',
    tooltip: 'The storage class to use for the persistent volume.',
  },
];

// Resource templates
export const deploymentTemplates: ResourceTemplate[] = [
  {
    name: 'Basic Web Application',
    description: 'A simple web application deployment with basic configuration',
    category: 'Web Applications',
    recommended: true,
    data: {
      metadata: {
        name: 'web-app',
        namespace: 'default',
        labels: { app: 'web-app' },
        annotations: {},
      },
      spec: {
        replicas: 3,
        selector: { matchLabels: { app: 'web-app' } },
        template: {
          metadata: { labels: { app: 'web-app' } },
          spec: {
            containers: [{
              name: 'web-app',
              image: 'nginx:latest',
              ports: [{ containerPort: 80 }],
            }],
          },
        },
      },
    },
  },
];

export const serviceTemplates: ResourceTemplate[] = [
  {
    name: 'ClusterIP Service',
    description: 'Internal service accessible only within the cluster',
    category: 'Networking',
    recommended: true,
    data: {
      metadata: {
        name: 'my-service',
        namespace: 'default',
        labels: {},
        annotations: {},
      },
      spec: {
        type: 'ClusterIP',
        selector: { app: 'my-app' },
        ports: [{ port: 80, targetPort: 8080 }],
      },
    },
  },
];

export const configMapTemplates: ResourceTemplate[] = [
  {
    name: 'Application Configuration',
    description: 'Basic application configuration with common settings',
    category: 'Configuration',
    recommended: true,
    data: {
      metadata: {
        name: 'app-config',
        namespace: 'default',
        labels: {},
        annotations: {},
      },
      spec: {
        'app.properties': 'debug=false\nlog.level=info',
        'database.url': 'jdbc:mysql://localhost:3306/mydb',
      },
    },
  },
];

export const secretTemplates: ResourceTemplate[] = [
  {
    name: 'Database Credentials',
    description: 'Secret for storing database credentials',
    category: 'Security',
    recommended: true,
    data: {
      metadata: {
        name: 'db-credentials',
        namespace: 'default',
        labels: {},
        annotations: {},
      },
      spec: {
        type: 'Opaque',
        username: 'admin',
        password: 'secret123',
      },
    },
  },
];

export const pvcTemplates: ResourceTemplate[] = [
  {
    name: 'Application Data Storage',
    description: 'Persistent volume claim for application data',
    category: 'Storage',
    recommended: true,
    data: {
      metadata: {
        name: 'app-data',
        namespace: 'default',
        labels: {},
        annotations: {},
      },
      spec: {
        accessModes: ['ReadWriteOnce'],
        resources: {
          requests: {
            storage: '10Gi',
          },
        },
      },
    },
  },
];

// Resource examples
export const deploymentExamples: ResourceExample[] = [
  {
    name: 'Nginx Deployment',
    description: 'Simple nginx web server deployment',
    category: 'Web Servers',
    complexity: 'basic',
    yaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.21
        ports:
        - containerPort: 80`,
  },
];

export const serviceExamples: ResourceExample[] = [
  {
    name: 'Nginx Service',
    description: 'Service to expose nginx deployment',
    category: 'Networking',
    complexity: 'basic',
    yaml: `apiVersion: v1
kind: Service
metadata:
  name: nginx-service
  namespace: default
spec:
  type: ClusterIP
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 80`,
  },
];

export const configMapExamples: ResourceExample[] = [
  {
    name: 'Application Config',
    description: 'Configuration for a web application',
    category: 'Configuration',
    complexity: 'basic',
    yaml: `apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: default
data:
  app.properties: |
    debug=false
    log.level=info
  database.url: "jdbc:mysql://localhost:3306/mydb"`,
  },
];

export const secretExamples: ResourceExample[] = [
  {
    name: 'Database Secret',
    description: 'Secret containing database credentials',
    category: 'Security',
    complexity: 'basic',
    yaml: `apiVersion: v1
kind: Secret
metadata:
  name: db-secret
  namespace: default
type: Opaque
data:
  username: YWRtaW4=  # admin (base64 encoded)
  password: cGFzc3dvcmQ=  # password (base64 encoded)`,
  },
];

export const pvcExamples: ResourceExample[] = [
  {
    name: 'Data Storage PVC',
    description: 'Persistent volume claim for application data',
    category: 'Storage',
    complexity: 'basic',
    yaml: `apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data-pvc
  namespace: default
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: standard`,
  },
];