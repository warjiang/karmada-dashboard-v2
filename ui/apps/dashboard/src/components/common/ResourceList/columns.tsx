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
import { ResourceColumn } from './index';
import {
  ResourceName,
  ResourceAge,
  ResourceLabels,
  ResourceReplicas,
  ResourceImages,
  ResourcePorts,
  ResourceEndpoints,
  ResourceSize,
  ResourceDataKeys,
  ResourceActions,
  ResourceStatus,
} from './components';
import { Workload } from '@/services/member-cluster/workload';
import { ServiceResource, ConfigMapResource, SecretResource, PersistentVolumeClaimResource } from '@/services/base';

// Workload columns (Deployments, StatefulSets, DaemonSets, Jobs, CronJobs)
export const createWorkloadColumns = <T extends Workload>(
  onView?: (record: T) => void,
  onEdit?: (record: T) => void,
  onDelete?: (record: T) => void
): ResourceColumn<T>[] => [
  {
    key: 'name',
    title: 'Name',
    dataIndex: 'name',
    sortable: true,
    width: 200,
    fixed: 'left',
    render: (_, record) => (
      <ResourceName
        name={record.objectMeta.name}
        namespace={record.objectMeta.namespace}
        onClick={onView ? () => onView(record) : undefined}
      />
    ),
  },
  {
    key: 'namespace',
    title: 'Namespace',
    dataIndex: 'namespace',
    sortable: true,
    width: 120,
    render: (_, record) => record.objectMeta.namespace,
  },
  {
    key: 'ready',
    title: 'Ready',
    dataIndex: 'ready',
    sortable: true,
    width: 100,
    render: (_, record) => (
      <ResourceReplicas
        ready={record.pods?.running || 0}
        desired={record.pods?.desired || 0}
      />
    ),
  },
  {
    key: 'images',
    title: 'Images',
    dataIndex: 'images',
    width: 250,
    render: (_, record) => (
      <ResourceImages images={record.containerImages || []} />
    ),
  },
  {
    key: 'age',
    title: 'Age',
    dataIndex: 'age',
    sortable: true,
    width: 100,
    render: (_, record) => (
      <ResourceAge creationTimestamp={record.objectMeta.creationTimestamp} />
    ),
  },
  {
    key: 'labels',
    title: 'Labels',
    dataIndex: 'labels',
    width: 200,
    render: (_, record) => (
      <ResourceLabels labels={record.objectMeta.labels || {}} />
    ),
  },
  {
    key: 'actions',
    title: 'Actions',
    width: 150,
    fixed: 'right',
    render: (_, record) => (
      <ResourceActions
        onView={onView ? () => onView(record) : undefined}
        onEdit={onEdit ? () => onEdit(record) : undefined}
        onDelete={onDelete ? () => onDelete(record) : undefined}
      />
    ),
  },
];

// Service columns
export const createServiceColumns = <T extends ServiceResource>(
  onView?: (record: T) => void,
  onEdit?: (record: T) => void,
  onDelete?: (record: T) => void
): ResourceColumn<T>[] => [
  {
    key: 'name',
    title: 'Name',
    dataIndex: 'name',
    sortable: true,
    width: 200,
    fixed: 'left',
    render: (_, record) => (
      <ResourceName
        name={record.objectMeta.name}
        namespace={record.objectMeta.namespace}
        onClick={onView ? () => onView(record) : undefined}
      />
    ),
  },
  {
    key: 'namespace',
    title: 'Namespace',
    dataIndex: 'namespace',
    sortable: true,
    width: 120,
    render: (_, record) => record.objectMeta.namespace,
  },
  {
    key: 'type',
    title: 'Type',
    dataIndex: 'type',
    sortable: true,
    width: 120,
    render: (_, record) => (
      <ResourceStatus
        status={record.spec.type === 'LoadBalancer' ? 'running' : 'ready'}
        text={record.spec.type}
        showIcon={false}
      />
    ),
  },
  {
    key: 'clusterIP',
    title: 'Cluster IP',
    dataIndex: 'clusterIP',
    width: 140,
    render: (_, record) => (
      <code className="text-xs">{record.spec.clusterIP || 'None'}</code>
    ),
  },
  {
    key: 'externalIP',
    title: 'External IP',
    dataIndex: 'externalIP',
    width: 140,
    render: (_, record) => {
      const externalIPs = record.spec.externalIPs;
      if (!externalIPs || externalIPs.length === 0) {
        return <span className="text-gray-400">None</span>;
      }
      return <code className="text-xs">{externalIPs[0]}</code>;
    },
  },
  {
    key: 'ports',
    title: 'Ports',
    dataIndex: 'ports',
    width: 200,
    render: (_, record) => (
      <ResourcePorts ports={record.spec.ports || []} />
    ),
  },
  {
    key: 'age',
    title: 'Age',
    dataIndex: 'age',
    sortable: true,
    width: 100,
    render: (_, record) => (
      <ResourceAge creationTimestamp={record.objectMeta.creationTimestamp} />
    ),
  },
  {
    key: 'actions',
    title: 'Actions',
    width: 150,
    fixed: 'right',
    render: (_, record) => (
      <ResourceActions
        onView={onView ? () => onView(record) : undefined}
        onEdit={onEdit ? () => onEdit(record) : undefined}
        onDelete={onDelete ? () => onDelete(record) : undefined}
      />
    ),
  },
];

// ConfigMap columns
export const createConfigMapColumns = <T extends ConfigMapResource>(
  onView?: (record: T) => void,
  onEdit?: (record: T) => void,
  onDelete?: (record: T) => void
): ResourceColumn<T>[] => [
  {
    key: 'name',
    title: 'Name',
    dataIndex: 'name',
    sortable: true,
    width: 200,
    fixed: 'left',
    render: (_, record) => (
      <ResourceName
        name={record.objectMeta.name}
        namespace={record.objectMeta.namespace}
        onClick={onView ? () => onView(record) : undefined}
      />
    ),
  },
  {
    key: 'namespace',
    title: 'Namespace',
    dataIndex: 'namespace',
    sortable: true,
    width: 120,
    render: (_, record) => record.objectMeta.namespace,
  },
  {
    key: 'dataKeys',
    title: 'Data Keys',
    dataIndex: 'dataKeys',
    width: 200,
    render: (_, record) => (
      <ResourceDataKeys keys={Object.keys(record.data || {})} />
    ),
  },
  {
    key: 'size',
    title: 'Size',
    dataIndex: 'size',
    sortable: true,
    width: 100,
    render: (_, record) => {
      const data = record.data || {};
      const totalSize = Object.values(data).reduce((acc, value) => acc + value.length, 0);
      return <ResourceSize size={totalSize} />;
    },
  },
  {
    key: 'immutable',
    title: 'Immutable',
    dataIndex: 'immutable',
    width: 100,
    render: (_, record) => (
      <ResourceStatus
        status={record.immutable ? 'ready' : 'unknown'}
        text={record.immutable ? 'Yes' : 'No'}
        showIcon={false}
      />
    ),
  },
  {
    key: 'age',
    title: 'Age',
    dataIndex: 'age',
    sortable: true,
    width: 100,
    render: (_, record) => (
      <ResourceAge creationTimestamp={record.objectMeta.creationTimestamp} />
    ),
  },
  {
    key: 'labels',
    title: 'Labels',
    dataIndex: 'labels',
    width: 200,
    render: (_, record) => (
      <ResourceLabels labels={record.objectMeta.labels || {}} />
    ),
  },
  {
    key: 'actions',
    title: 'Actions',
    width: 150,
    fixed: 'right',
    render: (_, record) => (
      <ResourceActions
        onView={onView ? () => onView(record) : undefined}
        onEdit={onEdit ? () => onEdit(record) : undefined}
        onDelete={onDelete ? () => onDelete(record) : undefined}
      />
    ),
  },
];

// Secret columns
export const createSecretColumns = <T extends SecretResource>(
  onView?: (record: T) => void,
  onEdit?: (record: T) => void,
  onDelete?: (record: T) => void
): ResourceColumn<T>[] => [
  {
    key: 'name',
    title: 'Name',
    dataIndex: 'name',
    sortable: true,
    width: 200,
    fixed: 'left',
    render: (_, record) => (
      <ResourceName
        name={record.objectMeta.name}
        namespace={record.objectMeta.namespace}
        onClick={onView ? () => onView(record) : undefined}
      />
    ),
  },
  {
    key: 'namespace',
    title: 'Namespace',
    dataIndex: 'namespace',
    sortable: true,
    width: 120,
    render: (_, record) => record.objectMeta.namespace,
  },
  {
    key: 'type',
    title: 'Type',
    dataIndex: 'type',
    sortable: true,
    width: 150,
    render: (_, record) => (
      <ResourceStatus
        status="ready"
        text={record.type}
        showIcon={false}
      />
    ),
  },
  {
    key: 'dataKeys',
    title: 'Data Keys',
    dataIndex: 'dataKeys',
    width: 200,
    render: (_, record) => (
      <ResourceDataKeys 
        keys={Object.keys(record.data || {})} 
        showIcon={false}
      />
    ),
  },
  {
    key: 'immutable',
    title: 'Immutable',
    dataIndex: 'immutable',
    width: 100,
    render: (_, record) => (
      <ResourceStatus
        status={record.immutable ? 'ready' : 'unknown'}
        text={record.immutable ? 'Yes' : 'No'}
        showIcon={false}
      />
    ),
  },
  {
    key: 'age',
    title: 'Age',
    dataIndex: 'age',
    sortable: true,
    width: 100,
    render: (_, record) => (
      <ResourceAge creationTimestamp={record.objectMeta.creationTimestamp} />
    ),
  },
  {
    key: 'labels',
    title: 'Labels',
    dataIndex: 'labels',
    width: 200,
    render: (_, record) => (
      <ResourceLabels labels={record.objectMeta.labels || {}} />
    ),
  },
  {
    key: 'actions',
    title: 'Actions',
    width: 150,
    fixed: 'right',
    render: (_, record) => (
      <ResourceActions
        onView={onView ? () => onView(record) : undefined}
        onEdit={onEdit ? () => onEdit(record) : undefined}
        onDelete={onDelete ? () => onDelete(record) : undefined}
      />
    ),
  },
];

// PVC columns
export const createPVCColumns = <T extends PersistentVolumeClaimResource>(
  onView?: (record: T) => void,
  onEdit?: (record: T) => void,
  onDelete?: (record: T) => void
): ResourceColumn<T>[] => [
  {
    key: 'name',
    title: 'Name',
    dataIndex: 'name',
    sortable: true,
    width: 200,
    fixed: 'left',
    render: (_, record) => (
      <ResourceName
        name={record.objectMeta.name}
        namespace={record.objectMeta.namespace}
        onClick={onView ? () => onView(record) : undefined}
      />
    ),
  },
  {
    key: 'namespace',
    title: 'Namespace',
    dataIndex: 'namespace',
    sortable: true,
    width: 120,
    render: (_, record) => record.objectMeta.namespace,
  },
  {
    key: 'status',
    title: 'Status',
    dataIndex: 'status',
    sortable: true,
    width: 100,
    render: (_, record) => {
      const phase = record.status?.phase || 'Unknown';
      const status = phase === 'Bound' ? 'ready' : phase === 'Pending' ? 'pending' : 'unknown';
      return <ResourceStatus status={status} text={phase} />;
    },
  },
  {
    key: 'volume',
    title: 'Volume',
    dataIndex: 'volume',
    width: 150,
    render: (_, record) => (
      <code className="text-xs">
        {record.spec.volumeName || 'Not bound'}
      </code>
    ),
  },
  {
    key: 'capacity',
    title: 'Capacity',
    dataIndex: 'capacity',
    sortable: true,
    width: 100,
    render: (_, record) => {
      const capacity = record.status?.capacity?.storage || record.spec.resources.requests?.storage;
      return capacity ? <ResourceSize size={capacity} unit="" /> : <span>-</span>;
    },
  },
  {
    key: 'accessModes',
    title: 'Access Modes',
    dataIndex: 'accessModes',
    width: 150,
    render: (_, record) => {
      const modes = record.spec.accessModes || [];
      const shortModes = modes.map(mode => {
        switch (mode) {
          case 'ReadWriteOnce': return 'RWO';
          case 'ReadOnlyMany': return 'ROX';
          case 'ReadWriteMany': return 'RWX';
          default: return mode;
        }
      });
      return <code className="text-xs">{shortModes.join(', ')}</code>;
    },
  },
  {
    key: 'storageClass',
    title: 'Storage Class',
    dataIndex: 'storageClass',
    width: 150,
    render: (_, record) => (
      <code className="text-xs">
        {record.spec.storageClassName || 'Default'}
      </code>
    ),
  },
  {
    key: 'age',
    title: 'Age',
    dataIndex: 'age',
    sortable: true,
    width: 100,
    render: (_, record) => (
      <ResourceAge creationTimestamp={record.objectMeta.creationTimestamp} />
    ),
  },
  {
    key: 'actions',
    title: 'Actions',
    width: 150,
    fixed: 'right',
    render: (_, record) => (
      <ResourceActions
        onView={onView ? () => onView(record) : undefined}
        onEdit={onEdit ? () => onEdit(record) : undefined}
        onDelete={onDelete ? () => onDelete(record) : undefined}
      />
    ),
  },
];

// Generic columns factory
export const createGenericColumns = <T extends { objectMeta: { name: string; namespace: string; creationTimestamp: string; labels?: Record<string, string> } }>(
  resourceType: string,
  onView?: (record: T) => void,
  onEdit?: (record: T) => void,
  onDelete?: (record: T) => void
): ResourceColumn<T>[] => [
  {
    key: 'name',
    title: 'Name',
    dataIndex: 'name',
    sortable: true,
    width: 200,
    fixed: 'left',
    render: (_, record) => (
      <ResourceName
        name={record.objectMeta.name}
        namespace={record.objectMeta.namespace}
        onClick={onView ? () => onView(record) : undefined}
      />
    ),
  },
  {
    key: 'namespace',
    title: 'Namespace',
    dataIndex: 'namespace',
    sortable: true,
    width: 120,
    render: (_, record) => record.objectMeta.namespace,
  },
  {
    key: 'age',
    title: 'Age',
    dataIndex: 'age',
    sortable: true,
    width: 100,
    render: (_, record) => (
      <ResourceAge creationTimestamp={record.objectMeta.creationTimestamp} />
    ),
  },
  {
    key: 'labels',
    title: 'Labels',
    dataIndex: 'labels',
    width: 200,
    render: (_, record) => (
      <ResourceLabels labels={record.objectMeta.labels || {}} />
    ),
  },
  {
    key: 'actions',
    title: 'Actions',
    width: 150,
    fixed: 'right',
    render: (_, record) => (
      <ResourceActions
        onView={onView ? () => onView(record) : undefined}
        onEdit={onEdit ? () => onEdit(record) : undefined}
        onDelete={onDelete ? () => onDelete(record) : undefined}
      />
    ),
  },
];