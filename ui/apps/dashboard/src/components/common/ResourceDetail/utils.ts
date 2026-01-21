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
import {
  AppstoreOutlined,
  SettingOutlined,
  BarChartOutlined,
  FileTextOutlined,
  LinkOutlined,
  ApiOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { DetailTab, BreadcrumbItem } from './index';
import { WorkloadKind, ConfigKind } from '@/services/base';

// Placeholder tab components - these would be implemented as actual components
const PodsTab = ({ resource }: any) => React.createElement('div', null, `Pods content for ${resource?.objectMeta?.name}`);
const ConditionsTab = ({ resource }: any) => React.createElement('div', null, `Conditions content for ${resource?.objectMeta?.name}`);
const MetricsTab = ({ resource }: any) => React.createElement('div', null, `Metrics content for ${resource?.objectMeta?.name}`);
const LogsTab = ({ resource }: any) => React.createElement('div', null, `Logs content for ${resource?.objectMeta?.name}`);
const RelatedResourcesTab = ({ resource }: any) => React.createElement('div', null, `Related resources for ${resource?.objectMeta?.name}`);
const EndpointsTab = ({ resource }: any) => React.createElement('div', null, `Endpoints content for ${resource?.objectMeta?.name}`);

// Workload-specific tabs
export function createWorkloadTabs(workloadKind: WorkloadKind): DetailTab[] {
  const tabs: DetailTab[] = [
    {
      key: 'pods',
      label: 'Pods',
      icon: React.createElement(AppstoreOutlined),
      component: PodsTab,
    },
    {
      key: 'conditions',
      label: 'Conditions',
      icon: React.createElement(SettingOutlined),
      component: ConditionsTab,
    },
    {
      key: 'metrics',
      label: 'Metrics',
      icon: React.createElement(BarChartOutlined),
      component: MetricsTab,
    },
    {
      key: 'logs',
      label: 'Logs',
      icon: React.createElement(FileTextOutlined),
      component: LogsTab,
    },
    {
      key: 'related',
      label: 'Related Resources',
      icon: React.createElement(LinkOutlined),
      component: RelatedResourcesTab,
    },
  ];

  // Add workload-specific tabs
  switch (workloadKind) {
    case WorkloadKind.Deployment:
      // Deployment-specific tabs could be added here
      break;
    case WorkloadKind.Statefulset:
      // StatefulSet-specific tabs could be added here
      break;
    case WorkloadKind.Daemonset:
      // DaemonSet-specific tabs could be added here
      break;
    case WorkloadKind.Cronjob:
      // CronJob-specific tabs could be added here
      break;
    case WorkloadKind.Job:
      // Job-specific tabs could be added here
      break;
  }

  return tabs;
}

// Service-specific tabs
export function createServiceTabs(): DetailTab[] {
  return [
    {
      key: 'endpoints',
      label: 'Endpoints',
      icon: React.createElement(ApiOutlined),
      component: EndpointsTab,
    },
    {
      key: 'related',
      label: 'Related Resources',
      icon: React.createElement(LinkOutlined),
      component: RelatedResourcesTab,
    },
  ];
}

// Configuration resource tabs
export function createConfigTabs(configKind: ConfigKind): DetailTab[] {
  const tabs: DetailTab[] = [];

  switch (configKind) {
    case ConfigKind.ConfigMap:
      tabs.push({
        key: 'data',
        label: 'Data',
        icon: React.createElement(SettingOutlined),
        component: ConditionsTab, // Reuse for now, would create specific component
      });
      break;
    case ConfigKind.Secret:
      tabs.push({
        key: 'data',
        label: 'Data',
        icon: React.createElement(DatabaseOutlined),
        component: ConditionsTab, // Would create specific secret data component
      });
      break;
    case ConfigKind.PersistentVolumeClaim:
      tabs.push({
        key: 'volume',
        label: 'Volume Info',
        icon: React.createElement(CloudServerOutlined),
        component: ConditionsTab, // Would create specific volume info component
      });
      break;
  }

  tabs.push({
    key: 'conditions',
    label: 'Conditions',
    icon: React.createElement(SettingOutlined),
    component: ConditionsTab,
  });

  tabs.push({
    key: 'related',
    label: 'Related Resources',
    icon: React.createElement(LinkOutlined),
    component: RelatedResourcesTab,
  });

  return tabs;
}

// Breadcrumb utilities
export function createResourceBreadcrumbs(
  memberClusterName: string,
  resourceType: string,
  namespace?: string,
  onNavigateToCluster?: () => void,
  onNavigateToResourceList?: () => void,
  onNavigateToNamespace?: () => void
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Clusters',
      icon: React.createElement(CloudServerOutlined),
      onClick: onNavigateToCluster,
    },
    {
      title: memberClusterName,
      onClick: onNavigateToCluster,
    },
    {
      title: resourceType.charAt(0).toUpperCase() + resourceType.slice(1),
      onClick: onNavigateToResourceList,
    },
  ];

  if (namespace) {
    breadcrumbs.push({
      title: namespace,
      onClick: onNavigateToNamespace,
    });
  }

  return breadcrumbs;
}

// Resource type utilities
export function getResourceTypeIcon(resourceType: string): React.ReactNode {
  switch (resourceType.toLowerCase()) {
    case 'deployment':
    case 'statefulset':
    case 'daemonset':
    case 'job':
    case 'cronjob':
      return React.createElement(AppstoreOutlined);
    case 'service':
      return React.createElement(SettingOutlined);
    case 'ingress':
      return React.createElement(ApiOutlined);
    case 'configmap':
    case 'secret':
      return React.createElement(DatabaseOutlined);
    case 'persistentvolumeclaim':
      return React.createElement(CloudServerOutlined);
    default:
      return React.createElement(FileTextOutlined);
  }
}

// Resource status utilities
export function getResourceStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'running':
    case 'ready':
    case 'bound':
    case 'active':
      return '#52c41a'; // Green
    case 'pending':
    case 'waiting':
      return '#faad14'; // Orange
    case 'failed':
    case 'error':
    case 'crashloopbackoff':
      return '#ff4d4f'; // Red
    case 'terminating':
    case 'deleting':
      return '#722ed1'; // Purple
    default:
      return '#d9d9d9'; // Gray
  }
}

// Resource age formatting
export function formatResourceAge(creationTimestamp: string): string {
  const now = new Date();
  const created = new Date(creationTimestamp);
  const diffMs = now.getTime() - created.getTime();

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  } else {
    return `${diffDays}d`;
  }
}

// Resource size formatting
export function formatResourceSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Label formatting utilities
export function formatLabels(labels: Record<string, string> = {}): string {
  const labelEntries = Object.entries(labels);
  if (labelEntries.length === 0) return 'None';
  
  return labelEntries
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');
}

// Annotation formatting utilities
export function formatAnnotations(annotations: Record<string, string> = {}): string {
  const annotationEntries = Object.entries(annotations);
  if (annotationEntries.length === 0) return 'None';
  
  return annotationEntries
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');
}