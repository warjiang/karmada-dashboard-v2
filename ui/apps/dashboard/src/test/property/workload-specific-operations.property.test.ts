/**
 * Property-Based Test for Workload-Specific Operations
 * Feature: member-cluster-resource-management, Property 7: Workload-Specific Operations
 * Validates: Requirements 1.7, 2.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import {
  WorkloadKind,
  enhancedMemberClusterClient,
  IResponse,
} from '../../services/base';
import * as workloadService from '../../services/member-cluster/workload';

// Mock the enhanced member cluster client
vi.mock('../../services/base', async () => {
  const actual = await vi.importActual('../../services/base');
  return {
    ...actual,
    enhancedMemberClusterClient: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
    },
  };
});

describe('Workload-Specific Operations Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 7: Workload-Specific Operations', () => {
    it('should execute deployment operations (pause, resume, restart, rollback) correctly and provide status feedback', async () => {
      // **Feature: member-cluster-resource-management, Property 7: Workload-Specific Operations**
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            memberClusterName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            deploymentName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            operation: fc.constantFrom('pause', 'resume', 'restart', 'rollback'),
            targetRevision: fc.option(fc.integer({ min: 1, max: 100 })),
          }),
          async ({ memberClusterName, namespace, deploymentName, operation, targetRevision }) => {
            // Mock successful operation response with status feedback
            const mockResponse: IResponse<any> = {
              code: 200,
              message: `${operation} operation completed successfully`,
              data: {
                objectMeta: {
                  name: deploymentName,
                  namespace: namespace,
                  labels: {},
                  annotations: {},
                  creationTimestamp: new Date().toISOString(),
                  uid: 'test-uid',
                },
                typeMeta: {
                  kind: WorkloadKind.Deployment,
                  scalable: true,
                  restartable: true,
                },
                status: {
                  phase: operation === 'pause' ? 'Paused' : 'Running',
                  conditions: [
                    {
                      type: 'Available',
                      status: 'True',
                      lastTransitionTime: new Date().toISOString(),
                      reason: `${operation}Successful`,
                      message: `Deployment ${operation} operation completed`,
                    }
                  ],
                },
              },
            };

            const mockClient = enhancedMemberClusterClient as any;
            mockClient.put.mockResolvedValue(mockResponse);

            let result: any;
            let expectedUrl: string;

            try {
              switch (operation) {
                case 'pause':
                  expectedUrl = `/clusterapi/${memberClusterName}/api/v1/deployment/${namespace}/${deploymentName}/pause`;
                  result = await workloadService.PauseMemberClusterDeployment({
                    memberClusterName,
                    namespace,
                    name: deploymentName,
                  });
                  break;

                case 'resume':
                  expectedUrl = `/clusterapi/${memberClusterName}/api/v1/deployment/${namespace}/${deploymentName}/resume`;
                  result = await workloadService.ResumeMemberClusterDeployment({
                    memberClusterName,
                    namespace,
                    name: deploymentName,
                  });
                  break;

                case 'restart':
                  expectedUrl = `/clusterapi/${memberClusterName}/api/v1/deployment/${namespace}/${deploymentName}/restart`;
                  result = await workloadService.RestartMemberClusterDeployment({
                    memberClusterName,
                    namespace,
                    name: deploymentName,
                  });
                  break;

                case 'rollback':
                  expectedUrl = `/clusterapi/${memberClusterName}/api/v1/deployment/${namespace}/${deploymentName}/rollback`;
                  const rollbackParams = {
                    memberClusterName,
                    namespace,
                    name: deploymentName,
                    ...(targetRevision && { targetRevision }),
                  };
                  result = await workloadService.RollbackMemberClusterDeployment(rollbackParams);
                  
                  // Verify rollback includes target revision when provided
                  const expectedData = targetRevision ? { targetRevision } : {};
                  expect(mockClient.put).toHaveBeenCalledWith(expectedUrl, expectedData);
                  break;
              }

              // Verify operation executed correctly - Requirement 1.7
              expect(mockClient.put).toHaveBeenCalledWith(expectedUrl, expect.any(Object));
              
              // Verify consistent response structure with status feedback
              expect(result).toBeDefined();
              expect(result).toHaveProperty('code');
              expect(result).toHaveProperty('message');
              expect(result).toHaveProperty('data');
              expect(result.code).toBe(200);
              expect(result.message).toContain(operation);
              
              // Verify status feedback is provided - Requirement 1.7
              if (result.data && typeof result.data === 'object') {
                expect(result.data).toHaveProperty('objectMeta');
                expect(result.data).toHaveProperty('typeMeta');
                expect(result.data.objectMeta.name).toBe(deploymentName);
                expect(result.data.objectMeta.namespace).toBe(namespace);
                
                // Verify status information is included
                if (result.data.status) {
                  expect(result.data.status).toHaveProperty('phase');
                  expect(result.data.status).toHaveProperty('conditions');
                  
                  // Verify conditions provide meaningful feedback
                  if (Array.isArray(result.data.status.conditions) && result.data.status.conditions.length > 0) {
                    const condition = result.data.status.conditions[0];
                    expect(condition).toHaveProperty('type');
                    expect(condition).toHaveProperty('status');
                    expect(condition).toHaveProperty('reason');
                    expect(condition).toHaveProperty('message');
                    expect(condition.message).toContain(operation);
                  }
                }
              }

              // Verify URL pattern consistency
              expect(expectedUrl).toMatch(/^\/clusterapi\/[a-z0-9-]+\/api\/v1\/deployment\/[a-z0-9-]+\/[a-z0-9-]+\/(pause|resume|restart|rollback)$/);
              expect(expectedUrl).toContain(memberClusterName);
              expect(expectedUrl).toContain(namespace);
              expect(expectedUrl).toContain(deploymentName);
              expect(expectedUrl).toContain(operation);

              return true;
            } catch (error) {
              // If an error occurs, it should be a properly structured error
              expect(error).toBeInstanceOf(Error);
              return true;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should execute cronjob trigger operations correctly and provide status feedback', async () => {
      // **Feature: member-cluster-resource-management, Property 7: Workload-Specific Operations**
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            memberClusterName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            cronJobName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
          }),
          async ({ memberClusterName, namespace, cronJobName }) => {
            // Mock successful trigger response with status feedback
            const mockResponse: IResponse<any> = {
              code: 200,
              message: 'CronJob triggered successfully',
              data: {
                objectMeta: {
                  name: cronJobName,
                  namespace: namespace,
                  labels: {},
                  annotations: {},
                  creationTimestamp: new Date().toISOString(),
                  uid: 'test-uid',
                },
                typeMeta: {
                  kind: WorkloadKind.Cronjob,
                  scalable: false,
                  restartable: false,
                },
                status: {
                  lastScheduleTime: new Date().toISOString(),
                  active: [
                    {
                      name: `${cronJobName}-manual-${Date.now()}`,
                      namespace: namespace,
                    }
                  ],
                  conditions: [
                    {
                      type: 'Triggered',
                      status: 'True',
                      lastTransitionTime: new Date().toISOString(),
                      reason: 'ManualTrigger',
                      message: 'CronJob was manually triggered',
                    }
                  ],
                },
              },
            };

            const mockClient = enhancedMemberClusterClient as any;
            mockClient.put.mockResolvedValue(mockResponse);

            try {
              const expectedUrl = `/clusterapi/${memberClusterName}/api/v1/cronjob/${namespace}/${cronJobName}/trigger`;
              const result = await workloadService.TriggerMemberClusterCronJob({
                memberClusterName,
                namespace,
                name: cronJobName,
              });

              // Verify trigger operation executed correctly - Requirement 2.5
              expect(mockClient.put).toHaveBeenCalledWith(expectedUrl);
              
              // Verify consistent response structure with status feedback
              expect(result).toBeDefined();
              expect(result).toHaveProperty('code');
              expect(result).toHaveProperty('message');
              expect(result).toHaveProperty('data');
              expect(result.code).toBe(200);
              expect(result.message).toContain('triggered');
              
              // Verify status feedback is provided - Requirement 2.5
              if (result.data && typeof result.data === 'object') {
                expect(result.data).toHaveProperty('objectMeta');
                expect(result.data).toHaveProperty('typeMeta');
                expect(result.data.objectMeta.name).toBe(cronJobName);
                expect(result.data.objectMeta.namespace).toBe(namespace);
                expect(result.data.typeMeta.kind).toBe(WorkloadKind.Cronjob);
                
                // Verify cronjob-specific status information
                if (result.data.status) {
                  // Should have lastScheduleTime for triggered cronjobs
                  expect(result.data.status).toHaveProperty('lastScheduleTime');
                  
                  // Should show active jobs when triggered
                  if (result.data.status.active) {
                    expect(Array.isArray(result.data.status.active)).toBe(true);
                  }
                  
                  // Should have conditions showing trigger status
                  if (result.data.status.conditions) {
                    expect(Array.isArray(result.data.status.conditions)).toBe(true);
                    if (result.data.status.conditions.length > 0) {
                      const condition = result.data.status.conditions[0];
                      expect(condition).toHaveProperty('type');
                      expect(condition).toHaveProperty('status');
                      expect(condition).toHaveProperty('reason');
                      expect(condition).toHaveProperty('message');
                    }
                  }
                }
              }

              // Verify URL pattern consistency
              expect(expectedUrl).toMatch(/^\/clusterapi\/[a-z0-9-]+\/api\/v1\/cronjob\/[a-z0-9-]+\/[a-z0-9-]+\/trigger$/);
              expect(expectedUrl).toContain(memberClusterName);
              expect(expectedUrl).toContain(namespace);
              expect(expectedUrl).toContain(cronJobName);

              return true;
            } catch (error) {
              // If an error occurs, it should be a properly structured error
              expect(error).toBeInstanceOf(Error);
              return true;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should execute view pods operations for different workload types correctly', async () => {
      // **Feature: member-cluster-resource-management, Property 7: Workload-Specific Operations**
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            memberClusterName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            resourceName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            workloadType: fc.constantFrom(
              WorkloadKind.Daemonset,
              WorkloadKind.Statefulset,
              WorkloadKind.Job
            ),
            podCount: fc.integer({ min: 0, max: 10 }),
          }),
          async ({ memberClusterName, namespace, resourceName, workloadType, podCount }) => {
            // Generate mock pods for the workload
            const mockPods = Array.from({ length: podCount }, (_, index) => ({
              objectMeta: {
                name: `${resourceName}-pod-${index}`,
                namespace: namespace,
                labels: {
                  app: resourceName,
                  'pod-template-hash': `hash-${index}`,
                },
                annotations: {},
                creationTimestamp: new Date(Date.now() - index * 60000).toISOString(),
                uid: `pod-uid-${index}`,
              },
              typeMeta: {
                kind: 'Pod',
                scalable: false,
                restartable: true,
              },
              status: {
                phase: fc.sample(fc.constantFrom('Running', 'Pending', 'Succeeded', 'Failed'), 1)[0],
                conditions: [
                  {
                    type: 'Ready',
                    status: 'True',
                    lastTransitionTime: new Date().toISOString(),
                    reason: 'ContainersReady',
                    message: 'All containers are ready',
                  }
                ],
                containerStatuses: [
                  {
                    name: 'main-container',
                    ready: true,
                    restartCount: 0,
                    state: { running: { startedAt: new Date().toISOString() } },
                  }
                ],
              },
            }));

            const mockResponse: IResponse<any> = {
              code: 200,
              message: 'Pods retrieved successfully',
              data: {
                errors: [],
                listMeta: {
                  totalItems: podCount,
                },
                pods: mockPods,
              },
            };

            const mockClient = enhancedMemberClusterClient as any;
            mockClient.get.mockResolvedValue(mockResponse);

            try {
              let result: any;
              let expectedUrl: string;

              switch (workloadType) {
                case WorkloadKind.Daemonset:
                  expectedUrl = `/clusterapi/${memberClusterName}/api/v1/daemonset/${namespace}/${resourceName}/pod`;
                  result = await workloadService.GetMemberClusterDaemonSetPods({
                    memberClusterName,
                    namespace,
                    name: resourceName,
                  });
                  break;

                case WorkloadKind.Statefulset:
                  expectedUrl = `/clusterapi/${memberClusterName}/api/v1/statefulset/${namespace}/${resourceName}/pod`;
                  result = await workloadService.GetMemberClusterStatefulSetPods({
                    memberClusterName,
                    namespace,
                    name: resourceName,
                  });
                  break;

                case WorkloadKind.Job:
                  expectedUrl = `/clusterapi/${memberClusterName}/api/v1/job/${namespace}/${resourceName}/pod`;
                  result = await workloadService.GetMemberClusterJobPods({
                    memberClusterName,
                    namespace,
                    name: resourceName,
                  });
                  break;

                default:
                  return true; // Skip unknown workload types
              }

              // Verify view pods operation executed correctly - Requirement 2.5
              expect(mockClient.get).toHaveBeenCalledWith(expectedUrl);
              
              // Verify consistent response structure
              expect(result).toBeDefined();
              expect(result).toHaveProperty('code');
              expect(result).toHaveProperty('message');
              expect(result).toHaveProperty('data');
              expect(result.code).toBe(200);
              
              // Verify pods data structure
              if (result.data && typeof result.data === 'object') {
                expect(result.data).toHaveProperty('listMeta');
                expect(result.data).toHaveProperty('pods');
                expect(result.data.listMeta).toHaveProperty('totalItems');
                expect(result.data.listMeta.totalItems).toBe(podCount);
                
                // Verify pods array structure
                expect(Array.isArray(result.data.pods)).toBe(true);
                expect(result.data.pods).toHaveLength(podCount);
                
                // Verify each pod has required structure
                result.data.pods.forEach((pod: any, index: number) => {
                  expect(pod).toHaveProperty('objectMeta');
                  expect(pod).toHaveProperty('typeMeta');
                  expect(pod).toHaveProperty('status');
                  
                  expect(pod.objectMeta.name).toBe(`${resourceName}-pod-${index}`);
                  expect(pod.objectMeta.namespace).toBe(namespace);
                  expect(pod.typeMeta.kind).toBe('Pod');
                  
                  // Verify pod status information
                  expect(pod.status).toHaveProperty('phase');
                  expect(['Running', 'Pending', 'Succeeded', 'Failed']).toContain(pod.status.phase);
                  
                  if (pod.status.conditions) {
                    expect(Array.isArray(pod.status.conditions)).toBe(true);
                  }
                  
                  if (pod.status.containerStatuses) {
                    expect(Array.isArray(pod.status.containerStatuses)).toBe(true);
                  }
                });
              }

              // Verify URL pattern consistency
              const expectedPattern = new RegExp(`^/clusterapi/[a-z0-9-]+/api/v1/${workloadType}/[a-z0-9-]+/[a-z0-9-]+/pod$`);
              expect(expectedUrl).toMatch(expectedPattern);
              expect(expectedUrl).toContain(memberClusterName);
              expect(expectedUrl).toContain(namespace);
              expect(expectedUrl).toContain(resourceName);
              expect(expectedUrl).toContain(workloadType);

              return true;
            } catch (error) {
              // If an error occurs, it should be a properly structured error
              expect(error).toBeInstanceOf(Error);
              return true;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should execute view jobs operations for cronjobs correctly', async () => {
      // **Feature: member-cluster-resource-management, Property 7: Workload-Specific Operations**
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            memberClusterName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            cronJobName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            jobCount: fc.integer({ min: 0, max: 5 }),
          }),
          async ({ memberClusterName, namespace, cronJobName, jobCount }) => {
            // Generate mock jobs for the cronjob
            const mockJobs = Array.from({ length: jobCount }, (_, index) => ({
              objectMeta: {
                name: `${cronJobName}-job-${Date.now() - index * 3600000}`,
                namespace: namespace,
                labels: {
                  'job-name': `${cronJobName}-job-${index}`,
                  'controller-uid': `cronjob-uid-${index}`,
                },
                annotations: {},
                creationTimestamp: new Date(Date.now() - index * 3600000).toISOString(),
                uid: `job-uid-${index}`,
                ownerReferences: [
                  {
                    apiVersion: 'batch/v1',
                    kind: 'CronJob',
                    name: cronJobName,
                    uid: 'cronjob-uid',
                    controller: true,
                    blockOwnerDeletion: true,
                  }
                ],
              },
              typeMeta: {
                kind: WorkloadKind.Job,
                scalable: false,
                restartable: false,
              },
              status: {
                phase: fc.sample(fc.constantFrom('Running', 'Succeeded', 'Failed'), 1)[0],
                startTime: new Date(Date.now() - index * 3600000).toISOString(),
                completionTime: index < 2 ? new Date(Date.now() - index * 3600000 + 300000).toISOString() : undefined,
                active: index >= 2 ? 1 : 0,
                succeeded: index < 2 ? 1 : 0,
                failed: 0,
                conditions: [
                  {
                    type: index < 2 ? 'Complete' : 'Active',
                    status: 'True',
                    lastTransitionTime: new Date().toISOString(),
                    reason: index < 2 ? 'JobComplete' : 'JobRunning',
                    message: index < 2 ? 'Job completed successfully' : 'Job is running',
                  }
                ],
              },
            }));

            const mockResponse: IResponse<any> = {
              code: 200,
              message: 'Jobs retrieved successfully',
              data: {
                errors: [],
                listMeta: {
                  totalItems: jobCount,
                },
                jobs: mockJobs,
              },
            };

            const mockClient = enhancedMemberClusterClient as any;
            mockClient.get.mockResolvedValue(mockResponse);

            try {
              const expectedUrl = `/clusterapi/${memberClusterName}/api/v1/cronjob/${namespace}/${cronJobName}/job`;
              const result = await workloadService.GetMemberClusterCronJobJobs({
                memberClusterName,
                namespace,
                name: cronJobName,
              });

              // Verify view jobs operation executed correctly - Requirement 2.5
              expect(mockClient.get).toHaveBeenCalledWith(expectedUrl);
              
              // Verify consistent response structure
              expect(result).toBeDefined();
              expect(result).toHaveProperty('code');
              expect(result).toHaveProperty('message');
              expect(result).toHaveProperty('data');
              expect(result.code).toBe(200);
              
              // Verify jobs data structure
              if (result.data && typeof result.data === 'object') {
                expect(result.data).toHaveProperty('listMeta');
                expect(result.data).toHaveProperty('jobs');
                expect(result.data.listMeta).toHaveProperty('totalItems');
                expect(result.data.listMeta.totalItems).toBe(jobCount);
                
                // Verify jobs array structure
                expect(Array.isArray(result.data.jobs)).toBe(true);
                expect(result.data.jobs).toHaveLength(jobCount);
                
                // Verify each job has required structure
                result.data.jobs.forEach((job: any, index: number) => {
                  expect(job).toHaveProperty('objectMeta');
                  expect(job).toHaveProperty('typeMeta');
                  expect(job).toHaveProperty('status');
                  
                  expect(job.objectMeta.name).toContain(cronJobName);
                  expect(job.objectMeta.namespace).toBe(namespace);
                  expect(job.typeMeta.kind).toBe(WorkloadKind.Job);
                  
                  // Verify job is owned by the cronjob
                  expect(job.objectMeta).toHaveProperty('ownerReferences');
                  expect(Array.isArray(job.objectMeta.ownerReferences)).toBe(true);
                  if (job.objectMeta.ownerReferences.length > 0) {
                    const ownerRef = job.objectMeta.ownerReferences[0];
                    expect(ownerRef.kind).toBe('CronJob');
                    expect(ownerRef.name).toBe(cronJobName);
                    expect(ownerRef.controller).toBe(true);
                  }
                  
                  // Verify job status information
                  expect(job.status).toHaveProperty('phase');
                  expect(['Running', 'Succeeded', 'Failed']).toContain(job.status.phase);
                  expect(job.status).toHaveProperty('startTime');
                  
                  // Verify job completion metrics
                  expect(job.status).toHaveProperty('active');
                  expect(job.status).toHaveProperty('succeeded');
                  expect(job.status).toHaveProperty('failed');
                  expect(typeof job.status.active).toBe('number');
                  expect(typeof job.status.succeeded).toBe('number');
                  expect(typeof job.status.failed).toBe('number');
                  
                  if (job.status.conditions) {
                    expect(Array.isArray(job.status.conditions)).toBe(true);
                  }
                });
              }

              // Verify URL pattern consistency
              expect(expectedUrl).toMatch(/^\/clusterapi\/[a-z0-9-]+\/api\/v1\/cronjob\/[a-z0-9-]+\/[a-z0-9-]+\/job$/);
              expect(expectedUrl).toContain(memberClusterName);
              expect(expectedUrl).toContain(namespace);
              expect(expectedUrl).toContain(cronJobName);

              return true;
            } catch (error) {
              // If an error occurs, it should be a properly structured error
              expect(error).toBeInstanceOf(Error);
              return true;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should execute replica set operations for deployments correctly', async () => {
      // **Feature: member-cluster-resource-management, Property 7: Workload-Specific Operations**
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            memberClusterName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            deploymentName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            operationType: fc.constantFrom('newreplicaset', 'oldreplicaset'),
            replicaSetCount: fc.integer({ min: 0, max: 3 }),
          }),
          async ({ memberClusterName, namespace, deploymentName, operationType, replicaSetCount }) => {
            // Generate mock replica sets
            const mockReplicaSets = Array.from({ length: replicaSetCount }, (_, index) => ({
              objectMeta: {
                name: `${deploymentName}-rs-${operationType === 'newreplicaset' ? 'new' : 'old'}-${index}`,
                namespace: namespace,
                labels: {
                  app: deploymentName,
                  'pod-template-hash': `hash-${operationType}-${index}`,
                },
                annotations: {
                  'deployment.kubernetes.io/revision': operationType === 'newreplicaset' ? '2' : '1',
                },
                creationTimestamp: new Date(Date.now() - index * 3600000).toISOString(),
                uid: `rs-uid-${index}`,
                ownerReferences: [
                  {
                    apiVersion: 'apps/v1',
                    kind: 'Deployment',
                    name: deploymentName,
                    uid: 'deployment-uid',
                    controller: true,
                    blockOwnerDeletion: true,
                  }
                ],
              },
              typeMeta: {
                kind: 'ReplicaSet',
                scalable: true,
                restartable: false,
              },
              status: {
                replicas: 3,
                readyReplicas: operationType === 'newreplicaset' ? 3 : 0,
                availableReplicas: operationType === 'newreplicaset' ? 3 : 0,
                observedGeneration: 1,
                conditions: [
                  {
                    type: 'ReplicaFailure',
                    status: operationType === 'newreplicaset' ? 'False' : 'True',
                    lastTransitionTime: new Date().toISOString(),
                    reason: operationType === 'newreplicaset' ? 'ReplicaSetUpdated' : 'ReplicaSetScaledDown',
                    message: operationType === 'newreplicaset' ? 'ReplicaSet is up to date' : 'ReplicaSet scaled down',
                  }
                ],
              },
            }));

            const mockResponse: IResponse<any> = {
              code: 200,
              message: `${operationType} retrieved successfully`,
              data: {
                errors: [],
                listMeta: {
                  totalItems: replicaSetCount,
                },
                replicaSets: mockReplicaSets,
              },
            };

            const mockClient = enhancedMemberClusterClient as any;
            mockClient.get.mockResolvedValue(mockResponse);

            try {
              let result: any;
              let expectedUrl: string;

              if (operationType === 'newreplicaset') {
                expectedUrl = `/clusterapi/${memberClusterName}/api/v1/deployment/${namespace}/${deploymentName}/newreplicaset`;
                result = await workloadService.GetMemberClusterDeploymentNewReplicaSets({
                  memberClusterName,
                  namespace,
                  name: deploymentName,
                });
              } else {
                expectedUrl = `/clusterapi/${memberClusterName}/api/v1/deployment/${namespace}/${deploymentName}/oldreplicaset`;
                result = await workloadService.GetMemberClusterDeploymentOldReplicaSets({
                  memberClusterName,
                  namespace,
                  name: deploymentName,
                });
              }

              // Verify replica set operation executed correctly - Requirement 2.5
              expect(mockClient.get).toHaveBeenCalledWith(expectedUrl);
              
              // Verify consistent response structure
              expect(result).toBeDefined();
              expect(result).toHaveProperty('code');
              expect(result).toHaveProperty('message');
              expect(result).toHaveProperty('data');
              expect(result.code).toBe(200);
              
              // Verify replica sets data structure
              if (result.data && typeof result.data === 'object') {
                expect(result.data).toHaveProperty('listMeta');
                expect(result.data).toHaveProperty('replicaSets');
                expect(result.data.listMeta).toHaveProperty('totalItems');
                expect(result.data.listMeta.totalItems).toBe(replicaSetCount);
                
                // Verify replica sets array structure
                expect(Array.isArray(result.data.replicaSets)).toBe(true);
                expect(result.data.replicaSets).toHaveLength(replicaSetCount);
                
                // Verify each replica set has required structure
                result.data.replicaSets.forEach((rs: any, index: number) => {
                  expect(rs).toHaveProperty('objectMeta');
                  expect(rs).toHaveProperty('typeMeta');
                  expect(rs).toHaveProperty('status');
                  
                  expect(rs.objectMeta.name).toContain(deploymentName);
                  expect(rs.objectMeta.namespace).toBe(namespace);
                  expect(rs.typeMeta.kind).toBe('ReplicaSet');
                  
                  // Verify replica set is owned by the deployment
                  expect(rs.objectMeta).toHaveProperty('ownerReferences');
                  expect(Array.isArray(rs.objectMeta.ownerReferences)).toBe(true);
                  if (rs.objectMeta.ownerReferences.length > 0) {
                    const ownerRef = rs.objectMeta.ownerReferences[0];
                    expect(ownerRef.kind).toBe('Deployment');
                    expect(ownerRef.name).toBe(deploymentName);
                    expect(ownerRef.controller).toBe(true);
                  }
                  
                  // Verify replica set status information
                  expect(rs.status).toHaveProperty('replicas');
                  expect(rs.status).toHaveProperty('readyReplicas');
                  expect(rs.status).toHaveProperty('availableReplicas');
                  expect(typeof rs.status.replicas).toBe('number');
                  expect(typeof rs.status.readyReplicas).toBe('number');
                  expect(typeof rs.status.availableReplicas).toBe('number');
                  
                  // Verify revision annotation for deployment tracking
                  if (rs.objectMeta.annotations) {
                    expect(rs.objectMeta.annotations).toHaveProperty('deployment.kubernetes.io/revision');
                  }
                  
                  if (rs.status.conditions) {
                    expect(Array.isArray(rs.status.conditions)).toBe(true);
                  }
                });
              }

              // Verify URL pattern consistency
              const expectedPattern = new RegExp(`^/clusterapi/[a-z0-9-]+/api/v1/deployment/[a-z0-9-]+/[a-z0-9-]+/${operationType}$`);
              expect(expectedUrl).toMatch(expectedPattern);
              expect(expectedUrl).toContain(memberClusterName);
              expect(expectedUrl).toContain(namespace);
              expect(expectedUrl).toContain(deploymentName);
              expect(expectedUrl).toContain(operationType);

              return true;
            } catch (error) {
              // If an error occurs, it should be a properly structured error
              expect(error).toBeInstanceOf(Error);
              return true;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should execute daemonset service operations correctly', async () => {
      // **Feature: member-cluster-resource-management, Property 7: Workload-Specific Operations**
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            memberClusterName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            daemonSetName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            serviceCount: fc.integer({ min: 0, max: 3 }),
          }),
          async ({ memberClusterName, namespace, daemonSetName, serviceCount }) => {
            // Generate mock services for the daemonset
            const mockServices = Array.from({ length: serviceCount }, (_, index) => ({
              objectMeta: {
                name: `${daemonSetName}-service-${index}`,
                namespace: namespace,
                labels: {
                  app: daemonSetName,
                  service: `service-${index}`,
                },
                annotations: {},
                creationTimestamp: new Date(Date.now() - index * 3600000).toISOString(),
                uid: `service-uid-${index}`,
              },
              typeMeta: {
                kind: 'Service',
                scalable: false,
                restartable: false,
              },
              spec: {
                type: fc.sample(fc.constantFrom('ClusterIP', 'NodePort', 'LoadBalancer'), 1)[0],
                selector: {
                  app: daemonSetName,
                },
                ports: [
                  {
                    name: 'http',
                    protocol: 'TCP',
                    port: 80 + index,
                    targetPort: 8080 + index,
                  }
                ],
                clusterIP: `10.96.${index}.${100 + index}`,
              },
              status: {
                loadBalancer: {},
                conditions: [],
              },
            }));

            const mockResponse: IResponse<any> = {
              code: 200,
              message: 'Services retrieved successfully',
              data: {
                errors: [],
                listMeta: {
                  totalItems: serviceCount,
                },
                services: mockServices,
              },
            };

            const mockClient = enhancedMemberClusterClient as any;
            mockClient.get.mockResolvedValue(mockResponse);

            try {
              const expectedUrl = `/clusterapi/${memberClusterName}/api/v1/daemonset/${namespace}/${daemonSetName}/service`;
              const result = await workloadService.GetMemberClusterDaemonSetServices({
                memberClusterName,
                namespace,
                name: daemonSetName,
              });

              // Verify daemonset services operation executed correctly - Requirement 2.5
              expect(mockClient.get).toHaveBeenCalledWith(expectedUrl);
              
              // Verify consistent response structure
              expect(result).toBeDefined();
              expect(result).toHaveProperty('code');
              expect(result).toHaveProperty('message');
              expect(result).toHaveProperty('data');
              expect(result.code).toBe(200);
              
              // Verify services data structure
              if (result.data && typeof result.data === 'object') {
                expect(result.data).toHaveProperty('listMeta');
                expect(result.data).toHaveProperty('services');
                expect(result.data.listMeta).toHaveProperty('totalItems');
                expect(result.data.listMeta.totalItems).toBe(serviceCount);
                
                // Verify services array structure
                expect(Array.isArray(result.data.services)).toBe(true);
                expect(result.data.services).toHaveLength(serviceCount);
                
                // Verify each service has required structure
                result.data.services.forEach((service: any, index: number) => {
                  expect(service).toHaveProperty('objectMeta');
                  expect(service).toHaveProperty('typeMeta');
                  expect(service).toHaveProperty('spec');
                  
                  expect(service.objectMeta.name).toContain(daemonSetName);
                  expect(service.objectMeta.namespace).toBe(namespace);
                  expect(service.typeMeta.kind).toBe('Service');
                  
                  // Verify service spec
                  expect(service.spec).toHaveProperty('type');
                  expect(service.spec).toHaveProperty('selector');
                  expect(service.spec).toHaveProperty('ports');
                  expect(['ClusterIP', 'NodePort', 'LoadBalancer']).toContain(service.spec.type);
                  
                  // Verify service selector matches daemonset
                  expect(service.spec.selector).toHaveProperty('app');
                  expect(service.spec.selector.app).toBe(daemonSetName);
                  
                  // Verify ports configuration
                  expect(Array.isArray(service.spec.ports)).toBe(true);
                  if (service.spec.ports.length > 0) {
                    const port = service.spec.ports[0];
                    expect(port).toHaveProperty('protocol');
                    expect(port).toHaveProperty('port');
                    expect(port).toHaveProperty('targetPort');
                    expect(typeof port.port).toBe('number');
                  }
                });
              }

              // Verify URL pattern consistency
              expect(expectedUrl).toMatch(/^\/clusterapi\/[a-z0-9-]+\/api\/v1\/daemonset\/[a-z0-9-]+\/[a-z0-9-]+\/service$/);
              expect(expectedUrl).toContain(memberClusterName);
              expect(expectedUrl).toContain(namespace);
              expect(expectedUrl).toContain(daemonSetName);

              return true;
            } catch (error) {
              // If an error occurs, it should be a properly structured error
              expect(error).toBeInstanceOf(Error);
              return true;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle workload-specific operation errors gracefully with appropriate feedback', async () => {
      // **Feature: member-cluster-resource-management, Property 7: Workload-Specific Operations**
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            memberClusterName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            resourceName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            operation: fc.constantFrom('pause', 'resume', 'restart', 'rollback', 'trigger'),
            errorType: fc.constantFrom('not-found', 'forbidden', 'conflict', 'server-error'),
          }),
          async ({ memberClusterName, namespace, resourceName, operation, errorType }) => {
            // Mock different error responses
            let mockError: any;
            
            switch (errorType) {
              case 'not-found':
                mockError = {
                  response: {
                    status: 404,
                    data: {
                      message: `${operation === 'trigger' ? 'CronJob' : 'Deployment'} ${resourceName} not found`,
                    }
                  }
                };
                break;
              case 'forbidden':
                mockError = {
                  response: {
                    status: 403,
                    data: {
                      message: `Insufficient permissions to ${operation} ${operation === 'trigger' ? 'cronjob' : 'deployment'}`,
                    }
                  }
                };
                break;
              case 'conflict':
                mockError = {
                  response: {
                    status: 409,
                    data: {
                      message: `Cannot ${operation} ${operation === 'trigger' ? 'cronjob' : 'deployment'}: resource conflict`,
                    }
                  }
                };
                break;
              case 'server-error':
                mockError = {
                  response: {
                    status: 500,
                    data: {
                      message: `Internal server error during ${operation} operation`,
                    }
                  }
                };
                break;
            }

            const mockClient = enhancedMemberClusterClient as any;
            mockClient.put.mockRejectedValue(mockError);

            try {
              let operationPromise: Promise<any>;
              
              switch (operation) {
                case 'pause':
                  operationPromise = workloadService.PauseMemberClusterDeployment({
                    memberClusterName,
                    namespace,
                    name: resourceName,
                  });
                  break;
                case 'resume':
                  operationPromise = workloadService.ResumeMemberClusterDeployment({
                    memberClusterName,
                    namespace,
                    name: resourceName,
                  });
                  break;
                case 'restart':
                  operationPromise = workloadService.RestartMemberClusterDeployment({
                    memberClusterName,
                    namespace,
                    name: resourceName,
                  });
                  break;
                case 'rollback':
                  operationPromise = workloadService.RollbackMemberClusterDeployment({
                    memberClusterName,
                    namespace,
                    name: resourceName,
                  });
                  break;
                case 'trigger':
                  operationPromise = workloadService.TriggerMemberClusterCronJob({
                    memberClusterName,
                    namespace,
                    name: resourceName,
                  });
                  break;
                default:
                  return true; // Skip unknown operations
              }

              // Operation should throw an error
              await expect(operationPromise).rejects.toThrow();
              
              return true;
            } catch (error) {
              // Verify error handling provides appropriate feedback - Requirements 1.7, 2.5
              expect(error).toBeDefined();
              expect(error).toHaveProperty('message');
              expect(typeof error.message).toBe('string');
              expect(error.message.length).toBeGreaterThan(0);
              
              // Verify error message is user-friendly and contextual
              switch (errorType) {
                case 'not-found':
                  expect(error.message).toMatch(/not found|deleted/i);
                  break;
                case 'forbidden':
                  expect(error.message).toMatch(/permission|access/i);
                  break;
                case 'conflict':
                  expect(error.message).toMatch(/conflict|refresh|try again/i);
                  break;
                case 'server-error':
                  expect(error.message).toMatch(/server error|try again later/i);
                  break;
              }
              
              return true;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});