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

import React, { FC, useMemo, useCallback } from 'react';
import {
  Card,
  Statistic,
  Table,
  TableColumnProps,
  Typography,
  Space,
  Button,
  Tag,
  Tooltip,
  Row,
  Col,
  Divider,
  Empty,
  Progress,
  Badge,
  Spin,
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  RollbackOutlined,
  ThunderboltOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { ResourceDetail, DetailTab, DetailTabProps, createResourceBreadcrumbs } from '@/components/common/ResourceDetail';
import { PodsTab, ConditionsTab, RelatedResourcesTab } from '@/components/common/ResourceDetail/tabs';
import {
  GetMemberClusterWorkloadDetail,
  GetMemberClusterWorkloadEvents,
  GetMemberClusterDeploymentNewReplicaSets,
  GetMemberClusterDeploymentOldReplicaSets,
  GetMemberClusterDaemonSetPods,
  GetMemberClusterStatefulSetPods,
  GetMemberClusterJobPods,
  GetMemberClusterCronJobJobs,
  PauseMemberClusterDeployment,
  ResumeMemberClusterDeployment,
  RestartMemberClusterDeployment,
  RollbackMemberClusterDeployment,
  TriggerMemberClusterCronJob,
  type WorkloadDetail,
  type WorkloadEvent,
} from '@/services/member-cluster/workload';
import { WorkloadKind } from '@/services/base';
import { formatAge } from '@/components/common/ResourceList';
import TagList, { convertLabelToTags } from '@/components/tag-list';
import { calculateDuration } from '@/utils/time';
import i18nInstance from '@/utils/i18n';

const { Text, Title } = Typography;

export interface WorkloadDetailDrawerProps {
  open: boolean;
  memberClusterName: string;
  kind: WorkloadKind;
  namespace: string;
  name: string;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onNavigate?: (resource: { kind: string; namespace: string; name: string }) => void;
}

// Workload-specific overview tab
const WorkloadOverviewTab: React.FC<DetailTabProps> = ({ resource, memberClusterName, resourceType, onNavigate }) => {
  if (!resource) {
    return <Empty description="No workload data available" />;
  }

  const workloadDetail = resource as WorkloadDetail;
  const objectMeta = workloadDetail.objectMeta;
  const typeMeta = workloadDetail.typeMeta;
  const pods = workloadDetail.pods;
  const statusInfo = workloadDetail.statusInfo;

  return (
    <div className="space-y-4">
      {/* Basic Information */}
      <Card title="Basic Information" size="small">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Statistic
              title="Name"
              value={objectMeta?.name || '-'}
              valueStyle={{ fontSize: '14px' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Statistic
              title="Namespace"
              value={objectMeta?.namespace || '-'}
              valueStyle={{ fontSize: '14px' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Statistic
              title="Kind"
              value={typeMeta?.kind || '-'}
              valueStyle={{ fontSize: '14px' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Statistic
              title="Age"
              value={calculateDuration(objectMeta?.creationTimestamp)}
              valueStyle={{ fontSize: '14px' }}
            />
          </Col>
        </Row>
        
        <Divider />
        
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Statistic
              title="Created"
              value={
                objectMeta?.creationTimestamp
                  ? new Date(objectMeta.creationTimestamp).toLocaleString()
                  : '-'
              }
              valueStyle={{ fontSize: '14px' }}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Statistic
              title="UID"
              value={
                <Tooltip title={objectMeta?.uid}>
                  <Text ellipsis style={{ maxWidth: 200 }}>
                    {objectMeta?.uid || '-'}
                  </Text>
                </Tooltip>
              }
              valueStyle={{ fontSize: '14px' }}
            />
          </Col>
        </Row>
      </Card>

      {/* Workload Status */}
      <Card title="Workload Status" size="small">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Desired Replicas"
              value={pods?.desired || 0}
              valueStyle={{ fontSize: '14px' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Current Replicas"
              value={pods?.current || 0}
              valueStyle={{ fontSize: '14px' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Ready Replicas"
              value={statusInfo?.available || 0}
              valueStyle={{ fontSize: '14px' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Updated Replicas"
              value={statusInfo?.updated || 0}
              valueStyle={{ fontSize: '14px' }}
            />
          </Col>
        </Row>

        {/* Pod Status Breakdown */}
        <Divider />
        <Title level={5}>Pod Status</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Badge status="success" text={`Running: ${pods?.running || 0}`} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Badge status="processing" text={`Pending: ${pods?.pending || 0}`} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Badge status="error" text={`Failed: ${pods?.failed || 0}`} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Badge status="default" text={`Succeeded: ${pods?.succeeded || 0}`} />
          </Col>
        </Row>

        {/* Readiness Progress */}
        {pods?.desired && pods.desired > 0 && (
          <>
            <Divider />
            <div>
              <Text strong>Readiness: </Text>
              <Progress
                percent={Math.round(((pods.current || 0) / pods.desired) * 100)}
                status={pods.current === pods.desired ? 'success' : 'active'}
                format={(percent) => `${pods.current}/${pods.desired} (${percent}%)`}
              />
            </div>
          </>
        )}
      </Card>

      {/* Container Images */}
      {workloadDetail.containerImages && workloadDetail.containerImages.length > 0 && (
        <Card title="Container Images" size="small">
          <div className="space-y-2">
            {workloadDetail.containerImages.map((image, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Tag color="blue">{image}</Tag>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Deployment Strategy */}
      {workloadDetail.strategy && (
        <Card title="Deployment Strategy" size="small">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Statistic
                title="Strategy"
                value={workloadDetail.strategy}
                valueStyle={{ fontSize: '14px' }}
              />
            </Col>
            {workloadDetail.minReadySeconds !== undefined && (
              <Col xs={24} sm={12}>
                <Statistic
                  title="Min Ready Seconds"
                  value={workloadDetail.minReadySeconds}
                  suffix="s"
                  valueStyle={{ fontSize: '14px' }}
                />
              </Col>
            )}
          </Row>
          
          {workloadDetail.rollingUpdateStrategy && (
            <>
              <Divider />
              <Title level={5}>Rolling Update Strategy</Title>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Statistic
                    title="Max Unavailable"
                    value={workloadDetail.rollingUpdateStrategy.maxUnavailable || '-'}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <Statistic
                    title="Max Surge"
                    value={workloadDetail.rollingUpdateStrategy.maxSurge || '-'}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Col>
              </Row>
            </>
          )}
        </Card>
      )}

      {/* Labels */}
      <Card title="Labels" size="small">
        <TagList
          tags={convertLabelToTags(
            objectMeta?.name || '',
            objectMeta?.labels
          )}
        />
      </Card>

      {/* Annotations */}
      <Card title="Annotations" size="small">
        <TagList
          tags={convertLabelToTags(
            objectMeta?.name || '',
            objectMeta?.annotations
          )}
        />
      </Card>

      {/* Selector */}
      {workloadDetail.selector && (
        <Card title="Selector" size="small">
          <TagList
            tags={convertLabelToTags(
              'selector',
              workloadDetail.selector.matchLabels
            )}
          />
        </Card>
      )}
    </div>
  );
};

// Workload-specific pods tab
const WorkloadPodsTab: React.FC<DetailTabProps> = ({ 
  resource, 
  memberClusterName, 
  resourceType, 
  onNavigate 
}) => {
  const workloadDetail = resource as WorkloadDetail;
  const workloadKind = workloadDetail?.typeMeta?.kind as WorkloadKind;
  
  // Get the appropriate pods fetch function based on workload kind
  const getPodsFetchFunction = useCallback(() => {
    switch (workloadKind) {
      case WorkloadKind.Daemonset:
        return GetMemberClusterDaemonSetPods;
      case WorkloadKind.Statefulset:
        return GetMemberClusterStatefulSetPods;
      case WorkloadKind.Job:
        return GetMemberClusterJobPods;
      default:
        // For deployments and other workloads, we'll use a generic approach
        return null;
    }
  }, [workloadKind]);

  const podsFetchFunction = getPodsFetchFunction();

  // Use the generic PodsTab but with workload-specific fetch function
  return (
    <PodsTab
      resource={resource}
      memberClusterName={memberClusterName}
      resourceType={resourceType}
      onNavigate={onNavigate}
    />
  );
};

// Replica Sets tab for deployments
const ReplicaSetsTab: React.FC<DetailTabProps> = ({ 
  resource, 
  memberClusterName, 
  resourceType 
}) => {
  const workloadDetail = resource as WorkloadDetail;
  
  // Only show for deployments
  if (workloadDetail?.typeMeta?.kind !== WorkloadKind.Deployment) {
    return <Empty description="Replica sets are only available for deployments" />;
  }

  const { data: newReplicaSetsData, isLoading: isNewLoading } = useQuery({
    queryKey: [memberClusterName, 'deployment', workloadDetail.objectMeta.namespace, workloadDetail.objectMeta.name, 'newreplicasets'],
    queryFn: () => GetMemberClusterDeploymentNewReplicaSets({
      memberClusterName,
      namespace: workloadDetail.objectMeta.namespace,
      name: workloadDetail.objectMeta.name,
    }),
    enabled: !!workloadDetail?.objectMeta?.name,
    staleTime: 30000,
  });

  const { data: oldReplicaSetsData, isLoading: isOldLoading } = useQuery({
    queryKey: [memberClusterName, 'deployment', workloadDetail.objectMeta.namespace, workloadDetail.objectMeta.name, 'oldreplicasets'],
    queryFn: () => GetMemberClusterDeploymentOldReplicaSets({
      memberClusterName,
      namespace: workloadDetail.objectMeta.namespace,
      name: workloadDetail.objectMeta.name,
    }),
    enabled: !!workloadDetail?.objectMeta?.name,
    staleTime: 30000,
  });

  const newReplicaSets = newReplicaSetsData?.data?.replicaSets || [];
  const oldReplicaSets = oldReplicaSetsData?.data?.replicaSets || [];
  const allReplicaSets = [...newReplicaSets, ...oldReplicaSets];

  const columns: TableColumnProps<any>[] = [
    {
      title: 'Name',
      dataIndex: ['objectMeta', 'name'],
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Desired',
      dataIndex: ['pods', 'desired'],
      key: 'desired',
      render: (desired: number) => desired || 0,
    },
    {
      title: 'Current',
      dataIndex: ['pods', 'current'],
      key: 'current',
      render: (current: number) => current || 0,
    },
    {
      title: 'Ready',
      dataIndex: ['pods', 'running'],
      key: 'ready',
      render: (ready: number) => ready || 0,
    },
    {
      title: 'Age',
      dataIndex: ['objectMeta', 'creationTimestamp'],
      key: 'age',
      render: (timestamp: string) => formatAge(timestamp),
    },
    {
      title: 'Type',
      key: 'type',
      render: (_, record: any) => {
        const isNew = newReplicaSets.some(rs => rs.objectMeta.name === record.objectMeta.name);
        return <Tag color={isNew ? 'green' : 'orange'}>{isNew ? 'New' : 'Old'}</Tag>;
      },
    },
  ];

  if (isNewLoading || isOldLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Title level={5}>Replica Sets ({allReplicaSets.length})</Title>
      </div>

      {allReplicaSets.length === 0 ? (
        <Empty description="No replica sets found" />
      ) : (
        <Table
          columns={columns}
          dataSource={allReplicaSets}
          rowKey={(record) => record.objectMeta.uid}
          pagination={false}
          size="small"
        />
      )}
    </div>
  );
};

// Jobs tab for CronJobs
const JobsTab: React.FC<DetailTabProps> = ({ 
  resource, 
  memberClusterName, 
  resourceType 
}) => {
  const workloadDetail = resource as WorkloadDetail;
  
  // Only show for cronjobs
  if (workloadDetail?.typeMeta?.kind !== WorkloadKind.Cronjob) {
    return <Empty description="Jobs are only available for cronjobs" />;
  }

  const { data: jobsData, isLoading } = useQuery({
    queryKey: [memberClusterName, 'cronjob', workloadDetail.objectMeta.namespace, workloadDetail.objectMeta.name, 'jobs'],
    queryFn: () => GetMemberClusterCronJobJobs({
      memberClusterName,
      namespace: workloadDetail.objectMeta.namespace,
      name: workloadDetail.objectMeta.name,
    }),
    enabled: !!workloadDetail?.objectMeta?.name,
    staleTime: 30000,
  });

  const jobs = jobsData?.data?.jobs || [];

  const columns: TableColumnProps<any>[] = [
    {
      title: 'Name',
      dataIndex: ['objectMeta', 'name'],
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Completions',
      key: 'completions',
      render: (record: any) => {
        const completions = record.spec?.completions || 0;
        const succeeded = record.status?.succeeded || 0;
        return `${succeeded}/${completions}`;
      },
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (record: any) => {
        const startTime = record.status?.startTime;
        const completionTime = record.status?.completionTime;
        if (startTime && completionTime) {
          const duration = new Date(completionTime).getTime() - new Date(startTime).getTime();
          return `${Math.round(duration / 1000)}s`;
        }
        return '-';
      },
    },
    {
      title: 'Age',
      dataIndex: ['objectMeta', 'creationTimestamp'],
      key: 'age',
      render: (timestamp: string) => formatAge(timestamp),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Title level={5}>Jobs ({jobs.length})</Title>
      </div>

      {jobs.length === 0 ? (
        <Empty description="No jobs found" />
      ) : (
        <Table
          columns={columns}
          dataSource={jobs}
          rowKey={(record) => record.objectMeta.uid}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          size="small"
        />
      )}
    </div>
  );
};

const WorkloadDetailDrawer: FC<WorkloadDetailDrawerProps> = (props) => {
  const { 
    open, 
    memberClusterName, 
    kind, 
    namespace, 
    name, 
    onClose, 
    onEdit, 
    onDelete, 
    onNavigate 
  } = props;

  // Fetch function for workload details
  const fetchWorkloadDetail = useCallback(
    async (params: { memberClusterName: string; namespace: string; name: string }) => {
      const response = await GetMemberClusterWorkloadDetail({
        memberClusterName: params.memberClusterName,
        namespace: params.namespace,
        name: params.name,
        kind,
      });
      return response.data;
    },
    [kind]
  );

  // Fetch function for workload events
  const fetchWorkloadEvents = useCallback(
    async (params: { memberClusterName: string; namespace: string; name: string; resourceType: string }) => {
      const response = await GetMemberClusterWorkloadEvents({
        memberClusterName: params.memberClusterName,
        namespace: params.namespace,
        name: params.name,
        kind,
      });
      return response.data;
    },
    [kind]
  );

  // Handle workload operations
  const handleWorkloadOperation = useCallback(
    async (operation: string) => {
      const params = { memberClusterName, namespace, name };
      
      try {
        switch (operation) {
          case 'pause':
            if (kind === WorkloadKind.Deployment) {
              await PauseMemberClusterDeployment(params);
            }
            break;
          case 'resume':
            if (kind === WorkloadKind.Deployment) {
              await ResumeMemberClusterDeployment(params);
            }
            break;
          case 'restart':
            if (kind === WorkloadKind.Deployment) {
              await RestartMemberClusterDeployment(params);
            }
            break;
          case 'rollback':
            if (kind === WorkloadKind.Deployment) {
              await RollbackMemberClusterDeployment(params);
            }
            break;
          case 'trigger':
            if (kind === WorkloadKind.Cronjob) {
              await TriggerMemberClusterCronJob(params);
            }
            break;
        }
      } catch (error) {
        console.error(`Failed to ${operation} workload:`, error);
        throw error;
      }
    },
    [memberClusterName, namespace, name, kind]
  );

  // Define workload-specific tabs
  const workloadTabs: DetailTab[] = useMemo(() => {
    const tabs: DetailTab[] = [
      {
        key: 'overview',
        label: 'Overview',
        component: WorkloadOverviewTab,
      },
      {
        key: 'pods',
        label: 'Pods',
        component: WorkloadPodsTab,
      },
    ];

    // Add deployment-specific tabs
    if (kind === WorkloadKind.Deployment) {
      tabs.push({
        key: 'replicasets',
        label: 'Replica Sets',
        component: ReplicaSetsTab,
      });
    }

    // Add cronjob-specific tabs
    if (kind === WorkloadKind.Cronjob) {
      tabs.push({
        key: 'jobs',
        label: 'Jobs',
        component: JobsTab,
      });
    }

    // Add conditions tab for all workloads
    tabs.push({
      key: 'conditions',
      label: 'Conditions',
      component: ConditionsTab,
    });

    // Add related resources tab
    tabs.push({
      key: 'related',
      label: 'Related Resources',
      component: RelatedResourcesTab,
    });

    return tabs;
  }, [kind]);

  // Create breadcrumbs
  const breadcrumbs = useMemo(() => 
    createResourceBreadcrumbs(
      memberClusterName,
      kind.toLowerCase(),
      namespace,
      () => {
        // Navigate to cluster overview
        onNavigate?.({ kind: 'Cluster', namespace: '', name: memberClusterName });
      },
      () => {
        // Navigate to workload list
        onNavigate?.({ kind: 'WorkloadList', namespace: '', name: kind });
      },
      () => {
        // Navigate to namespace
        onNavigate?.({ kind: 'Namespace', namespace, name: namespace });
      }
    ),
    [memberClusterName, kind, namespace, onNavigate]
  );

  // Custom actions for workload operations
  const customActions = useMemo(() => {
    const actions: React.ReactNode[] = [];

    if (kind === WorkloadKind.Deployment) {
      actions.push(
        <Tooltip key="pause" title="Pause Deployment">
          <Button
            icon={<PauseCircleOutlined />}
            onClick={() => handleWorkloadOperation('pause')}
            size="small"
          />
        </Tooltip>,
        <Tooltip key="resume" title="Resume Deployment">
          <Button
            icon={<PlayCircleOutlined />}
            onClick={() => handleWorkloadOperation('resume')}
            size="small"
          />
        </Tooltip>,
        <Tooltip key="restart" title="Restart Deployment">
          <Button
            icon={<ReloadOutlined />}
            onClick={() => handleWorkloadOperation('restart')}
            size="small"
          />
        </Tooltip>,
        <Tooltip key="rollback" title="Rollback Deployment">
          <Button
            icon={<RollbackOutlined />}
            onClick={() => handleWorkloadOperation('rollback')}
            size="small"
          />
        </Tooltip>
      );
    }

    if (kind === WorkloadKind.Cronjob) {
      actions.push(
        <Tooltip key="trigger" title="Trigger CronJob">
          <Button
            icon={<ThunderboltOutlined />}
            onClick={() => handleWorkloadOperation('trigger')}
            size="small"
          />
        </Tooltip>
      );
    }

    return <Space>{actions}</Space>;
  }, [kind, handleWorkloadOperation]);

  return (
    <ResourceDetail
      open={open}
      memberClusterName={memberClusterName}
      namespace={namespace}
      name={name}
      resourceType={kind.toLowerCase()}
      resourceKind={kind}
      fetchFunction={fetchWorkloadDetail}
      tabs={workloadTabs}
      defaultActiveTab="overview"
      breadcrumbs={breadcrumbs}
      onNavigate={onNavigate}
      onEdit={onEdit}
      onDelete={onDelete}
      onClose={onClose}
      title={`${kind} Details`}
      width={1000}
      placement="right"
      customActions={customActions}
      enableEdit={true}
      enableDelete={true}
      enableRefresh={true}
      enableExport={true}
      enableBreadcrumbs={true}
    />
  );
};

export default WorkloadDetailDrawer;
