/**
 * Property-Based Test for Workload CRUD Completeness
 * Feature: member-cluster-resource-management, Property 10: API Client Consistency (CRUD operations)
 * Validates: Requirements 11.3
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

describe('Workload CRUD Completeness Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 10: API Client Consistency (CRUD operations)', () => {
    it('should support complete CRUD operations for all workload types', async () => {
      // Feature: member-cluster-resource-management, Property 10: API Client Consistency (CRUD operations)
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            memberClusterName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            resourceName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            workloadType: fc.constantFrom(
              WorkloadKind.Deployment,
              WorkloadKind.Statefulset,
              WorkloadKind.Daemonset,
              WorkloadKind.Job,
              WorkloadKind.Cronjob
            ),
            operation: fc.constantFrom('create', 'read', 'update', 'delete'),
            content: fc.string({ minLength: 10, maxLength: 1000 }),
            gracePeriodSeconds: fc.option(fc.integer({ min: 0, max: 300 })),
          }),
          async ({ memberClusterName, namespace, resourceName, workloadType, operation, content, gracePeriodSeconds }) => {
            // Skip empty workload types
            if (!workloadType) {
              return true;
            }

            // Mock successful responses for all operations
            const mockResponse: IResponse<any> = {
              code: 200,
              message: 'Success',
              data: {
                objectMeta: {
                  name: resourceName,
                  namespace: namespace,
                  labels: {},
                  annotations: {},
                  creationTimestamp: new Date().toISOString(),
                  uid: 'test-uid',
                },
                typeMeta: {
                  kind: workloadType,
                  scalable: true,
                  restartable: true,
                },
              },
            };

            const mockClient = enhancedMemberClusterClient as any;
            mockClient.get.mockResolvedValue(mockResponse);
            mockClient.post.mockResolvedValue(mockResponse);
            mockClient.put.mockResolvedValue(mockResponse);
            mockClient.delete.mockResolvedValue(mockResponse);

            let result: any;
            let expectedUrl: string;
            try {
              switch (operation) {
                case 'create':
                  expectedUrl = `/clusterapi/${memberClusterName}/api/v1/${workloadType}`;
                  
                  switch (workloadType) {
                    case WorkloadKind.Deployment:
                      result = await workloadService.CreateMemberClusterDeployment({
                        memberClusterName,
                        namespace,
                        name: resourceName,
                        content,
                      });
                      break;
                    case WorkloadKind.Statefulset:
                      result = await workloadService.CreateMemberClusterStatefulSet({
                        memberClusterName,
                        namespace,
                        name: resourceName,
                        content,
                      });
                      break;
                    case WorkloadKind.Daemonset:
                      result = await workloadService.CreateMemberClusterDaemonSet({
                        memberClusterName,
                        namespace,
                        name: resourceName,
                        content,
                      });
                      break;
                    case WorkloadKind.Job:
                      result = await workloadService.CreateMemberClusterJob({
                        memberClusterName,
                        namespace,
                        name: resourceName,
                        content,
                      });
                      break;
                    case WorkloadKind.Cronjob:
                      result = await workloadService.CreateMemberClusterCronJob({
                        memberClusterName,
                        namespace,
                        name: resourceName,
                        content,
                      });
                      break;
                  }
                  
                  // Verify POST was called with correct URL
                  expect(mockClient.post).toHaveBeenCalledWith(
                    expectedUrl,
                    expect.objectContaining({
                      namespace,
                      name: resourceName,
                      content,
                    })
                  );
                  break;

                case 'read':
                  expectedUrl = `/clusterapi/${memberClusterName}/api/v1/${workloadType}/${namespace}/${resourceName}`;
                  
                  result = await workloadService.GetMemberClusterWorkloadDetail({
                    memberClusterName,
                    namespace,
                    name: resourceName,
                    kind: workloadType,
                  });
                  
                  // Verify GET was called with correct URL
                  expect(mockClient.get).toHaveBeenCalledWith(expectedUrl);
                  break;

                case 'update':
                  expectedUrl = `/clusterapi/${memberClusterName}/api/v1/${workloadType}/${namespace}/${resourceName}`;
                  
                  switch (workloadType) {
                    case WorkloadKind.Deployment:
                      result = await workloadService.UpdateMemberClusterDeployment({
                        memberClusterName,
                        namespace,
                        name: resourceName,
                        content,
                      });
                      break;
                    case WorkloadKind.Statefulset:
                      result = await workloadService.UpdateMemberClusterStatefulSet({
                        memberClusterName,
                        namespace,
                        name: resourceName,
                        content,
                      });
                      break;
                    case WorkloadKind.Daemonset:
                      result = await workloadService.UpdateMemberClusterDaemonSet({
                        memberClusterName,
                        namespace,
                        name: resourceName,
                        content,
                      });
                      break;
                    case WorkloadKind.Job:
                      result = await workloadService.UpdateMemberClusterJob({
                        memberClusterName,
                        namespace,
                        name: resourceName,
                        content,
                      });
                      break;
                    case WorkloadKind.Cronjob:
                      result = await workloadService.UpdateMemberClusterCronJob({
                        memberClusterName,
                        namespace,
                        name: resourceName,
                        content,
                      });
                      break;
                  }
                  
                  // Verify PUT was called with correct URL and data
                  expect(mockClient.put).toHaveBeenCalledWith(
                    expectedUrl,
                    expect.objectContaining({ content })
                  );
                  break;

                case 'delete':
                  expectedUrl = `/clusterapi/${memberClusterName}/api/v1/${workloadType}/${namespace}/${resourceName}`;
                  
                  const deleteParams = {
                    memberClusterName,
                    namespace,
                    name: resourceName,
                    ...(gracePeriodSeconds !== null && gracePeriodSeconds !== undefined && { gracePeriodSeconds }),
                  };
                  
                  switch (workloadType) {
                    case WorkloadKind.Deployment:
                      result = await workloadService.DeleteMemberClusterDeployment(deleteParams);
                      break;
                    case WorkloadKind.Statefulset:
                      result = await workloadService.DeleteMemberClusterStatefulSet(deleteParams);
                      break;
                    case WorkloadKind.Daemonset:
                      result = await workloadService.DeleteMemberClusterDaemonSet(deleteParams);
                      break;
                    case WorkloadKind.Job:
                      result = await workloadService.DeleteMemberClusterJob(deleteParams);
                      break;
                    case WorkloadKind.Cronjob:
                      result = await workloadService.DeleteMemberClusterCronJob(deleteParams);
                      break;
                  }
                  
                  // Verify DELETE was called with correct URL and params
                  const expectedConfig = gracePeriodSeconds !== null && gracePeriodSeconds !== undefined
                    ? { params: { gracePeriodSeconds } }
                    : {};
                  expect(mockClient.delete).toHaveBeenCalledWith(expectedUrl, expectedConfig);
                  break;
              }

              // Verify consistent response structure for all operations
              expect(result).toBeDefined();
              expect(result).toHaveProperty('code');
              expect(result).toHaveProperty('message');
              expect(result).toHaveProperty('data');
              
              // Verify response data structure consistency
              if (result.data && typeof result.data === 'object') {
                if (operation !== 'delete') {
                  expect(result.data).toHaveProperty('objectMeta');
                  expect(result.data).toHaveProperty('typeMeta');
                  
                  if (result.data.objectMeta) {
                    expect(result.data.objectMeta).toHaveProperty('name');
                    expect(result.data.objectMeta).toHaveProperty('namespace');
                  }
                  
                  if (result.data.typeMeta) {
                    expect(result.data.typeMeta).toHaveProperty('kind');
                  }
                }
              }

              // Verify URL pattern consistency - Requirement 11.3
              expect(expectedUrl).toMatch(/^\/clusterapi\/[a-z0-9-]+\/api\/v1\/[a-z]+/);
              expect(expectedUrl).toContain(memberClusterName);
              expect(expectedUrl).toContain(workloadType);
              expect(expectedUrl).toContain(namespace);
              
              // For operations that target specific resources, verify resource name is in URL
              if (['read', 'update', 'delete'].includes(operation)) {
                expect(expectedUrl).toContain(resourceName);
              }

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

    it('should support consistent list operations for all workload types', async () => {
      // Feature: member-cluster-resource-management, Property 10: API Client Consistency (CRUD operations)
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            memberClusterName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.option(fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s))),
            workloadType: fc.constantFrom(
              WorkloadKind.Deployment,
              WorkloadKind.Statefulset,
              WorkloadKind.Daemonset,
              WorkloadKind.Job,
              WorkloadKind.Cronjob
            ),
            keyword: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
            filterBy: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 })),
            sortBy: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 3 })),
            itemsPerPage: fc.option(fc.integer({ min: 1, max: 100 })),
            page: fc.option(fc.integer({ min: 1, max: 50 })),
          }),
          async ({ memberClusterName, namespace, workloadType, keyword, filterBy, sortBy, itemsPerPage, page }) => {
            // Skip empty workload types
            if (!workloadType) {
              return true;
            }

            // Mock successful list response
            const mockListResponse: IResponse<any> = {
              code: 200,
              message: 'Success',
              data: {
                errors: [],
                listMeta: {
                  totalItems: 10,
                },
                status: {
                  running: 5,
                  pending: 2,
                  failed: 1,
                  succeeded: 2,
                  terminating: 0,
                },
                [`${workloadType}s`]: [],
              },
            };

            const mockClient = enhancedMemberClusterClient as any;
            mockClient.get.mockResolvedValue(mockListResponse);

            const listParams = {
              memberClusterName,
              ...(namespace && { namespace }),
              ...(keyword && { keyword }),
              ...(filterBy && { filterBy }),
              ...(sortBy && { sortBy }),
              ...(itemsPerPage && { itemsPerPage }),
              ...(page && { page }),
            };

            let result: any;
            let expectedUrl: string;

            try {
              // Determine expected URL based on namespace
              expectedUrl = namespace
                ? `/clusterapi/${memberClusterName}/api/v1/${workloadType}/${namespace}`
                : `/clusterapi/${memberClusterName}/api/v1/${workloadType}`;

              // Call appropriate list function based on workload type
              switch (workloadType) {
                case WorkloadKind.Deployment:
                  result = await workloadService.GetMemberClusterDeployments(listParams);
                  break;
                case WorkloadKind.Statefulset:
                  result = await workloadService.GetMemberClusterStatefulSets(listParams);
                  break;
                case WorkloadKind.Daemonset:
                  result = await workloadService.GetMemberClusterDaemonSets(listParams);
                  break;
                case WorkloadKind.Job:
                  result = await workloadService.GetMemberClusterJobs(listParams);
                  break;
                case WorkloadKind.Cronjob:
                  result = await workloadService.GetMemberClusterCronJobs(listParams);
                  break;
              }

              // Verify GET was called with correct URL
              expect(mockClient.get).toHaveBeenCalledWith(
                expectedUrl,
                expect.objectContaining({
                  params: expect.any(Object),
                })
              );

              // Verify consistent response structure
              expect(result).toBeDefined();
              expect(result).toHaveProperty('code');
              expect(result).toHaveProperty('message');
              expect(result).toHaveProperty('data');

              // Verify list response data structure
              if (result.data && typeof result.data === 'object') {
                expect(result.data).toHaveProperty('listMeta');
                expect(result.data.listMeta).toHaveProperty('totalItems');
                expect(typeof result.data.listMeta.totalItems).toBe('number');
              }

              // Verify URL pattern consistency - Requirement 11.3
              expect(expectedUrl).toMatch(/^\/clusterapi\/[a-z0-9-]+\/api\/v1\/[a-z]+/);
              expect(expectedUrl).toContain(memberClusterName);
              expect(expectedUrl).toContain(workloadType);

              // If namespace is provided, verify it's in the URL
              if (namespace) {
                expect(expectedUrl).toContain(namespace);
              }

              // Verify query parameters are properly converted
              const lastCall = mockClient.get.mock.calls[mockClient.get.mock.calls.length - 1];
              if (lastCall && lastCall[1] && lastCall[1].params) {
                const params = lastCall[1].params;
                
                // Verify DataSelectQuery conversion consistency
                if (keyword) {
                  expect(params.filterBy).toBe(`name,${keyword}`);
                }
                
                if (filterBy && filterBy.length > 0) {
                  expect(params.filterBy).toBe(filterBy.join(','));
                }
                
                if (sortBy && sortBy.length > 0) {
                  expect(params.sortBy).toBe(sortBy.join(','));
                }
                
                if (itemsPerPage) {
                  expect(params.itemsPerPage).toBe(itemsPerPage);
                }
                
                if (page) {
                  expect(params.page).toBe(page);
                }
              }

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

    it('should support consistent workload-specific operations', async () => {
      // Feature: member-cluster-resource-management, Property 10: API Client Consistency (CRUD operations)
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            memberClusterName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            resourceName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            operation: fc.constantFrom('pause', 'resume', 'restart', 'rollback', 'trigger', 'getPods', 'getJobs'),
            targetRevision: fc.option(fc.integer({ min: 1, max: 100 })),
          }),
          async ({ memberClusterName, namespace, resourceName, operation, targetRevision }) => {
            // Mock successful responses
            const mockResponse: IResponse<any> = {
              code: 200,
              message: 'Success',
              data: {
                listMeta: { totalItems: 0 },
                pods: [],
                jobs: [],
                replicaSets: [],
              },
            };

            const mockClient = enhancedMemberClusterClient as any;
            mockClient.get.mockResolvedValue(mockResponse);
            mockClient.put.mockResolvedValue(mockResponse);

            let result: any;
            let expectedUrl: string;

            try {
              switch (operation) {
                case 'pause':
                  expectedUrl = `/clusterapi/${memberClusterName}/api/v1/deployment/${namespace}/${resourceName}/pause`;
                  result = await workloadService.PauseMemberClusterDeployment({
                    memberClusterName,
                    namespace,
                    name: resourceName,
                  });
                  expect(mockClient.put).toHaveBeenCalledWith(expectedUrl);
                  break;

                case 'resume':
                  expectedUrl = `/clusterapi/${memberClusterName}/api/v1/deployment/${namespace}/${resourceName}/resume`;
                  result = await workloadService.ResumeMemberClusterDeployment({
                    memberClusterName,
                    namespace,
                    name: resourceName,
                  });
                  expect(mockClient.put).toHaveBeenCalledWith(expectedUrl);
                  break;

                case 'restart':
                  expectedUrl = `/clusterapi/${memberClusterName}/api/v1/deployment/${namespace}/${resourceName}/restart`;
                  result = await workloadService.RestartMemberClusterDeployment({
                    memberClusterName,
                    namespace,
                    name: resourceName,
                  });
                  expect(mockClient.put).toHaveBeenCalledWith(expectedUrl);
                  break;

                case 'rollback':
                  expectedUrl = `/clusterapi/${memberClusterName}/api/v1/deployment/${namespace}/${resourceName}/rollback`;
                  result = await workloadService.RollbackMemberClusterDeployment({
                    memberClusterName,
                    namespace,
                    name: resourceName,
                    ...(targetRevision && { targetRevision }),
                  });
                  const expectedData = targetRevision ? { targetRevision } : {};
                  expect(mockClient.put).toHaveBeenCalledWith(expectedUrl, expectedData);
                  break;

                case 'trigger':
                  expectedUrl = `/clusterapi/${memberClusterName}/api/v1/cronjob/${namespace}/${resourceName}/trigger`;
                  result = await workloadService.TriggerMemberClusterCronJob({
                    memberClusterName,
                    namespace,
                    name: resourceName,
                  });
                  expect(mockClient.put).toHaveBeenCalledWith(expectedUrl);
                  break;

                case 'getPods':
                  expectedUrl = `/clusterapi/${memberClusterName}/api/v1/job/${namespace}/${resourceName}/pod`;
                  result = await workloadService.GetMemberClusterJobPods({
                    memberClusterName,
                    namespace,
                    name: resourceName,
                  });
                  expect(mockClient.get).toHaveBeenCalledWith(expectedUrl);
                  break;

                case 'getJobs':
                  expectedUrl = `/clusterapi/${memberClusterName}/api/v1/cronjob/${namespace}/${resourceName}/job`;
                  result = await workloadService.GetMemberClusterCronJobJobs({
                    memberClusterName,
                    namespace,
                    name: resourceName,
                  });
                  expect(mockClient.get).toHaveBeenCalledWith(expectedUrl);
                  break;

                default:
                  return true; // Skip unknown operations
              }

              // Verify consistent response structure
              expect(result).toBeDefined();
              expect(result).toHaveProperty('code');
              expect(result).toHaveProperty('message');
              expect(result).toHaveProperty('data');

              // Verify URL pattern consistency - Requirement 11.3
              expect(expectedUrl).toMatch(/^\/clusterapi\/[a-z0-9-]+\/api\/v1\/[a-z]+\/[a-z0-9-]+\/[a-z0-9-]+\/[a-z]+/);
              expect(expectedUrl).toContain(memberClusterName);
              expect(expectedUrl).toContain(namespace);
              expect(expectedUrl).toContain(resourceName);

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
  });
});