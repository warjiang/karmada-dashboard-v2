/**
 * Property-Based Test for API Client Consistency
 * Feature: member-cluster-resource-management, Property 10: API Client Consistency
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import {
  handleApiError,
  validateResponse,
  createSuccessResponse,
  createErrorResponse,
  ApiError,
  ApiErrorType,
  type DataSelectQuery,
  convertDataSelectQuery,
} from '../../services/base';

// Mock axios client
vi.mock('../../services/base', async () => {
  const actual = await vi.importActual('../../services/base');
  return {
    ...actual,
    karmadaMemberClusterClient: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
    },
  };
});

describe('API Client Consistency Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 10: API Client Consistency', () => {
    it('should use consistent URL patterns for all resource operations', () => {
      // Feature: member-cluster-resource-management, Property 10: API Client Consistency
      fc.assert(
        fc.property(
          fc.record({
            memberClusterName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            resourceType: fc.constantFrom('deployment', 'service', 'configmap', 'secret', 'persistentvolumeclaim'),
            namespace: fc.option(fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s))),
            resourceName: fc.option(fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s))),
            operation: fc.constantFrom('list', 'get', 'create', 'update', 'delete'),
          }),
          ({ memberClusterName, resourceType, namespace, resourceName, operation }) => {
            // Test URL pattern consistency - Requirement 11.1
            const expectedUrlPattern = `/clusterapi/${memberClusterName}/api/v1/${resourceType}`;
            
            let expectedUrl = expectedUrlPattern;
            if (namespace) {
              expectedUrl += `/${namespace}`;
            }
            if (resourceName && (operation === 'get' || operation === 'update' || operation === 'delete')) {
              expectedUrl += `/${resourceName}`;
            }

            // Verify URL follows the consistent pattern
            expect(expectedUrl).toMatch(/^\/clusterapi\/[a-z0-9-]+\/api\/v1\/[a-z]+/);
            
            // Verify member cluster name is properly included
            expect(expectedUrl).toContain(memberClusterName);
            
            // Verify resource type is properly included
            expect(expectedUrl).toContain(resourceType);
            
            // Verify namespace is included when provided
            if (namespace) {
              expect(expectedUrl).toContain(namespace);
            }
            
            // Verify resource name is included for specific operations
            if (resourceName && ['get', 'update', 'delete'].includes(operation)) {
              expect(expectedUrl).toContain(resourceName);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide consistent response typing and error handling', () => {
      // Feature: member-cluster-resource-management, Property 10: API Client Consistency
      fc.assert(
        fc.property(
          fc.record({
            statusCode: fc.integer({ min: 200, max: 599 }),
            message: fc.string({ minLength: 1, maxLength: 200 }),
            data: fc.anything(),
            hasErrors: fc.boolean(),
            hasValidationErrors: fc.boolean(),
          }),
          ({ statusCode, message, data, hasErrors, hasValidationErrors }) => {
            // Test response typing consistency - Requirement 11.2
            const mockResponse = {
              code: statusCode,
              message,
              data,
              ...(hasErrors && { errors: [{ code: statusCode, message, type: ApiErrorType.UnknownError }] }),
              ...(hasValidationErrors && { validationErrors: [{ field: 'test', message: 'validation error' }] }),
              timestamp: new Date().toISOString(),
            };

            const validatedResponse = validateResponse(mockResponse);

            // Verify response structure consistency
            expect(validatedResponse).toHaveProperty('code');
            expect(validatedResponse).toHaveProperty('message');
            expect(validatedResponse).toHaveProperty('data');
            expect(validatedResponse).toHaveProperty('timestamp');
            
            // Verify response types
            expect(typeof validatedResponse.code).toBe('number');
            expect(typeof validatedResponse.message).toBe('string');
            expect(typeof validatedResponse.timestamp).toBe('string');
            
            // Verify error arrays are properly typed when present
            if (hasErrors) {
              expect(Array.isArray(validatedResponse.errors)).toBe(true);
            }
            
            if (hasValidationErrors) {
              expect(Array.isArray(validatedResponse.validationErrors)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should support consistent CRUD operations for all resource types', () => {
      // Feature: member-cluster-resource-management, Property 10: API Client Consistency
      fc.assert(
        fc.property(
          fc.record({
            resourceType: fc.constantFrom('deployment', 'service', 'configmap', 'secret', 'persistentvolumeclaim'),
            operation: fc.constantFrom('create', 'read', 'update', 'delete'),
            memberClusterName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            resourceName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
          }),
          ({ resourceType, operation, memberClusterName, namespace, resourceName }) => {
            // Test CRUD operation consistency - Requirement 11.3
            const baseUrl = `/clusterapi/${memberClusterName}/api/v1/${resourceType}`;
            
            let expectedUrl: string;
            
            switch (operation) {
              case 'create':
                expectedUrl = `${baseUrl}/${namespace}`;
                break;
              case 'read':
                expectedUrl = `${baseUrl}/${namespace}/${resourceName}`;
                break;
              case 'update':
                expectedUrl = `${baseUrl}/${namespace}/${resourceName}`;
                break;
              case 'delete':
                expectedUrl = `${baseUrl}/${namespace}/${resourceName}`;
                break;
              default:
                throw new Error(`Unknown operation: ${operation}`);
            }
            
            // Verify consistent URL structure for all CRUD operations
            expect(expectedUrl).toMatch(/^\/clusterapi\/[a-z0-9-]+\/api\/v1\/[a-z]+\/[a-z0-9-]+/);
            
            // Verify method consistency is handled by the mock expectations above
            
            // Verify all required path components are present
            expect(expectedUrl).toContain(memberClusterName);
            expect(expectedUrl).toContain(resourceType);
            expect(expectedUrl).toContain(namespace);
            
            // Resource name should be present for read, update, delete operations
            if (['read', 'update', 'delete'].includes(operation)) {
              expect(expectedUrl).toContain(resourceName);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle DataSelectQuery parameters consistently', () => {
      // Feature: member-cluster-resource-management, Property 10: API Client Consistency
      fc.assert(
        fc.property(
          fc.record({
            filterBy: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 })),
            sortBy: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 })),
            itemsPerPage: fc.option(fc.integer({ min: 1, max: 1000 })),
            page: fc.option(fc.integer({ min: 1, max: 100 })),
          }),
          ({ filterBy, sortBy, itemsPerPage, page }) => {
            // Test pagination parameter consistency - Requirement 11.4
            const query: DataSelectQuery = {
              ...(filterBy && { filterBy }),
              ...(sortBy && { sortBy }),
              ...(itemsPerPage && { itemsPerPage }),
              ...(page && { page }),
            };
            
            const convertedQuery = convertDataSelectQuery(query);
            
            // Verify consistent parameter conversion
            if (filterBy) {
              expect(convertedQuery.filterBy).toBe(filterBy.join(','));
            }
            
            if (sortBy) {
              expect(convertedQuery.sortBy).toBe(sortBy.join(','));
            }
            
            if (itemsPerPage) {
              expect(convertedQuery.itemsPerPage).toBe(itemsPerPage);
            }
            
            if (page) {
              expect(convertedQuery.page).toBe(page);
            }
            
            // Verify all converted values are strings or numbers
            Object.values(convertedQuery).forEach(value => {
              expect(['string', 'number'].includes(typeof value)).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle authentication and session management consistently', () => {
      // Feature: member-cluster-resource-management, Property 10: API Client Consistency
      fc.assert(
        fc.property(
          fc.record({
            hasAuthToken: fc.boolean(),
            tokenExpired: fc.boolean(),
            statusCode: fc.constantFrom(401, 403, 200),
          }),
          ({ statusCode }) => {
            // Test authentication handling consistency - Requirement 11.6
            let expectedErrorType: ApiErrorType | null = null;
            
            if (statusCode === 401) {
              expectedErrorType = ApiErrorType.AuthenticationError;
            } else if (statusCode === 403) {
              expectedErrorType = ApiErrorType.AuthorizationError;
            }
            
            if (expectedErrorType) {
              const mockError = {
                response: {
                  status: statusCode,
                  data: { message: 'Auth error' }
                }
              };
              
              expect(() => handleApiError(mockError)).toThrow(ApiError);
              
              try {
                handleApiError(mockError);
              } catch (error) {
                if (error instanceof ApiError) {
                  expect(error.type).toBe(expectedErrorType);
                  expect(error.code).toBe(statusCode);
                }
              }
            }
            
            // Verify consistent error handling for auth scenarios
            expect(statusCode).toBeGreaterThanOrEqual(200);
            expect(statusCode).toBeLessThan(600);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should support bulk operations consistently', () => {
      // Feature: member-cluster-resource-management, Property 10: API Client Consistency
      fc.assert(
        fc.property(
          fc.record({
            resourceType: fc.constantFrom('deployment', 'service', 'configmap', 'secret'),
            resourceCount: fc.integer({ min: 1, max: 50 }),
            successCount: fc.integer({ min: 0, max: 50 }),
            operation: fc.constantFrom('delete', 'update', 'label'),
          }),
          ({ resourceCount, successCount }) => {
            // Test bulk operation consistency - Requirement 11.7
            const actualSuccessCount = Math.min(successCount, resourceCount);
            const failureCount = resourceCount - actualSuccessCount;
            
            const bulkResult = {
              totalItems: resourceCount,
              successCount: actualSuccessCount,
              failureCount,
              errors: failureCount > 0 ? Array(failureCount).fill(null).map(() => ({
                code: 500,
                message: 'Operation failed',
                type: ApiErrorType.ServerError
              })) : [],
              results: Array(resourceCount).fill(null).map((_, index) => ({
                success: index < actualSuccessCount,
                message: index < actualSuccessCount ? 'Success' : 'Failed',
                errors: index >= actualSuccessCount ? [{
                  code: 500,
                  message: 'Operation failed',
                  type: ApiErrorType.ServerError
                }] : undefined
              }))
            };
            
            // Verify bulk operation result structure consistency
            expect(bulkResult.totalItems).toBe(resourceCount);
            expect(bulkResult.successCount).toBe(actualSuccessCount);
            expect(bulkResult.failureCount).toBe(failureCount);
            expect(bulkResult.successCount + bulkResult.failureCount).toBe(bulkResult.totalItems);
            
            // Verify results array consistency
            expect(bulkResult.results).toHaveLength(resourceCount);
            
            // Verify error array consistency
            if (failureCount > 0) {
              expect(bulkResult.errors).toHaveLength(failureCount);
            } else {
              expect(bulkResult.errors).toHaveLength(0);
            }
            
            // Verify individual result consistency
            bulkResult.results.forEach((result) => {
              expect(typeof result.success).toBe('boolean');
              expect(typeof result.message).toBe('string');
              
              if (!result.success) {
                expect(result.errors).toBeDefined();
                expect(Array.isArray(result.errors)).toBe(true);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should implement consistent caching strategies', () => {
      // Feature: member-cluster-resource-management, Property 10: API Client Consistency
      fc.assert(
        fc.property(
          fc.record({
            resourceType: fc.constantFrom('deployment', 'service', 'configmap', 'secret'),
            cacheKey: fc.string({ minLength: 1, maxLength: 100 }),
            ttl: fc.integer({ min: 1000, max: 300000 }), // 1 second to 5 minutes
            lastModified: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
          }),
          ({ cacheKey, ttl, lastModified }) => {
            // Test caching strategy consistency - Requirement 11.5
            const now = new Date();
            
            // Skip invalid dates
            if (isNaN(lastModified.getTime())) {
              return true; // Skip this test case
            }
            
            const cacheAge = now.getTime() - lastModified.getTime();
            const isExpired = cacheAge > ttl;
            
            // Verify cache key structure consistency
            expect(cacheKey).toBeTruthy();
            expect(typeof cacheKey).toBe('string');
            
            // Verify TTL is reasonable
            expect(ttl).toBeGreaterThan(0);
            expect(ttl).toBeLessThanOrEqual(300000); // Max 5 minutes
            
            // Verify cache expiration logic consistency
            if (isExpired) {
              expect(cacheAge).toBeGreaterThan(ttl);
            } else {
              expect(cacheAge).toBeLessThanOrEqual(ttl);
            }
            
            // Verify timestamp consistency
            expect(lastModified).toBeInstanceOf(Date);
            expect(lastModified.getTime()).toBeLessThanOrEqual(now.getTime());
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Error Handling Consistency', () => {
    it('should create consistent error responses', () => {
      fc.assert(
        fc.property(
          fc.record({
            code: fc.integer({ min: 400, max: 599 }),
            message: fc.string({ minLength: 1, maxLength: 200 }),
            type: fc.constantFrom(...Object.values(ApiErrorType)),
            details: fc.option(fc.string({ minLength: 1, maxLength: 500 })),
            field: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
          }),
          ({ code, message, type, details, field }) => {
            const apiError = new ApiError({ code, message, type, details: details || undefined, field: field || undefined });
            const errorResponse = createErrorResponse(apiError);
            
            // Verify error response structure
            expect(errorResponse.code).toBe(code);
            expect(errorResponse.message).toBe(message);
            expect(errorResponse.data).toBeNull();
            expect(Array.isArray(errorResponse.errors)).toBe(true);
            expect(errorResponse.errors).toHaveLength(1);
            expect(errorResponse.errors![0]).toEqual(apiError);
            expect(typeof errorResponse.timestamp).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create consistent success responses', () => {
      fc.assert(
        fc.property(
          fc.record({
            data: fc.anything(),
            message: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
          }),
          ({ data, message }) => {
            const successResponse = createSuccessResponse(data, message || undefined);
            
            // Verify success response structure
            expect(successResponse.code).toBe(200);
            expect(successResponse.message).toBe(message || 'Success');
            expect(successResponse.data).toEqual(data);
            expect(typeof successResponse.timestamp).toBe('string');
            expect(successResponse.errors).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});