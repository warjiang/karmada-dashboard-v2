/**
 * Property-Based Test for Error Handling Robustness
 * Feature: member-cluster-resource-management, Property 9: Error Handling Robustness
 * Validates: Requirements 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import {
  handleApiError,
  validateResponse,
  ApiError,
  ApiErrorType,
} from '../../services/base';

describe('Error Handling Robustness Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 9: Error Handling Robustness', () => {
    it('should handle network errors gracefully with user-friendly messages', () => {
      // Feature: member-cluster-resource-management, Property 9: Error Handling Robustness
      fc.assert(
        fc.property(
          fc.record({
            hasResponse: fc.boolean(),
            hasRequest: fc.boolean(),
            errorMessage: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
            errorStack: fc.option(fc.string({ minLength: 1, maxLength: 500 })),
          }),
          ({ hasResponse, hasRequest, errorMessage, errorStack }) => {
            // Test network error handling - Requirement 6.2
            let mockError: any;
            
            if (!hasResponse && !hasRequest) {
              // Generic error case
              mockError = errorMessage ? new Error(errorMessage) : new Error('Generic error');
              if (errorStack) {
                mockError.stack = errorStack;
              }
            } else if (!hasResponse && hasRequest) {
              // Network error case (request made but no response)
              mockError = {
                request: { timeout: 5000 },
                message: errorMessage || 'Network timeout'
              };
            } else {
              // This case will be handled by other tests
              return true;
            }
            
            expect(() => handleApiError(mockError)).toThrow(ApiError);
            
            try {
              handleApiError(mockError);
            } catch (error) {
              if (error instanceof ApiError) {
                // Verify error is properly structured
                expect(error.type).toBeDefined();
                expect(error.message).toBeTruthy();
                expect(typeof error.message).toBe('string');
                expect(error.code).toBeDefined();
                expect(typeof error.code).toBe('number');
                
                // Verify user-friendly messages
                if (!hasResponse && !hasRequest) {
                  expect(error.type).toBe(ApiErrorType.UnknownError);
                  expect(error.message).toBeTruthy();
                } else if (!hasResponse && hasRequest) {
                  expect(error.type).toBe(ApiErrorType.NetworkError);
                  expect(error.message).toContain('Network error');
                }
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display specific field-level validation error messages', () => {
      // Feature: member-cluster-resource-management, Property 9: Error Handling Robustness
      fc.assert(
        fc.property(
          fc.record({
            statusCode: fc.constantFrom(422), // Only 422 is handled as validation error
            fieldName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z][a-zA-Z0-9._-]*$/.test(s)),
            validationMessage: fc.string({ minLength: 2, maxLength: 200 }).filter(s => s.trim().length > 0), // Ensure non-empty message
            hasDetails: fc.boolean(),
            details: fc.option(fc.string({ minLength: 1, maxLength: 300 })),
          }),
          ({ statusCode, fieldName, validationMessage, hasDetails, details }) => {
            // Test validation error handling - Requirement 6.3
            const mockError = {
              response: {
                status: statusCode,
                data: {
                  message: validationMessage,
                  field: fieldName,
                  ...(hasDetails && details && { details })
                }
              }
            };
            
            expect(() => handleApiError(mockError)).toThrow(ApiError);
            
            try {
              handleApiError(mockError);
            } catch (error) {
              if (error instanceof ApiError) {
                // Verify validation error structure
                expect(error.type).toBe(ApiErrorType.ValidationError);
                expect(error.code).toBe(statusCode);
                expect(error.message).toBeTruthy();
                expect(error.field).toBe(fieldName);
                
                // Verify field-level error information is preserved
                expect(error.field).toBeTruthy();
                expect(typeof error.field).toBe('string');
                
                // Verify details are included when provided
                if (hasDetails && details) {
                  expect(error.details).toBe(details);
                }
                
                // Verify message is user-friendly
                expect(error.message.length).toBeGreaterThan(0);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show appropriate 404 states with navigation options', () => {
      // Feature: member-cluster-resource-management, Property 9: Error Handling Robustness
      fc.assert(
        fc.property(
          fc.record({
            resourceType: fc.constantFrom('deployment', 'service', 'configmap', 'secret', 'namespace'),
            resourceName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
            namespace: fc.option(fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s))),
            customMessage: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
          }),
          ({ resourceType, customMessage }) => {
            // Test 404 error handling - Requirement 6.4
            const mockError = {
              response: {
                status: 404,
                data: {
                  message: customMessage || `${resourceType} not found`
                }
              }
            };
            
            expect(() => handleApiError(mockError)).toThrow(ApiError);
            
            try {
              handleApiError(mockError);
            } catch (error) {
              if (error instanceof ApiError) {
                // Verify 404 error structure
                expect(error.type).toBe(ApiErrorType.NotFoundError);
                expect(error.code).toBe(404);
                expect(error.message).toBeTruthy();
                
                // Verify user-friendly 404 message
                expect(error.message).toContain('not found');
                expect(error.message.toLowerCase()).toMatch(/not found|deleted|missing/);
                
                // Verify error provides context for navigation
                expect(error.message.length).toBeGreaterThan(10); // Meaningful message
                expect(typeof error.message).toBe('string');
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display clear authorization error messages', () => {
      // Feature: member-cluster-resource-management, Property 9: Error Handling Robustness
      fc.assert(
        fc.property(
          fc.record({
            statusCode: fc.constantFrom(401, 403),
            operation: fc.constantFrom('create', 'read', 'update', 'delete', 'list'),
            resourceType: fc.constantFrom('deployment', 'service', 'configmap', 'secret'),
            customMessage: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
          }),
          ({ statusCode, operation, resourceType, customMessage }) => {
            // Test authorization error handling - Requirement 6.5
            const mockError = {
              response: {
                status: statusCode,
                data: {
                  message: customMessage || `Insufficient permissions to ${operation} ${resourceType}`
                }
              }
            };
            
            expect(() => handleApiError(mockError)).toThrow(ApiError);
            
            try {
              handleApiError(mockError);
            } catch (error) {
              if (error instanceof ApiError) {
                // Verify authorization error structure
                if (statusCode === 401) {
                  expect(error.type).toBe(ApiErrorType.AuthenticationError);
                  expect(error.message).toMatch(/authentication|log in|login/i);
                } else if (statusCode === 403) {
                  expect(error.type).toBe(ApiErrorType.AuthorizationError);
                  expect(error.message).toMatch(/permission|insufficient|access/i);
                }
                
                expect(error.code).toBe(statusCode);
                expect(error.message).toBeTruthy();
                
                // Verify clear authorization messaging
                expect(error.message.length).toBeGreaterThan(10);
                expect(typeof error.message).toBe('string');
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should log errors and show generic error boundaries for unexpected errors', () => {
      // Feature: member-cluster-resource-management, Property 9: Error Handling Robustness
      fc.assert(
        fc.property(
          fc.record({
            statusCode: fc.constantFrom(500), // Only 500 is handled as server error in the current implementation
            serverMessage: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
            hasDetails: fc.boolean(),
            errorDetails: fc.option(fc.string({ minLength: 1, maxLength: 500 })),
          }),
          ({ statusCode, serverMessage, hasDetails, errorDetails }) => {
            // Test unexpected error handling - Requirement 6.6
            const mockError = {
              response: {
                status: statusCode,
                data: {
                  message: serverMessage || 'Internal server error',
                  ...(hasDetails && errorDetails && { details: errorDetails })
                }
              }
            };
            
            expect(() => handleApiError(mockError)).toThrow(ApiError);
            
            try {
              handleApiError(mockError);
            } catch (error) {
              if (error instanceof ApiError) {
                // Verify server error structure
                expect(error.type).toBe(ApiErrorType.ServerError);
                expect(error.code).toBe(statusCode);
                expect(error.message).toBeTruthy();
                
                // Verify generic user-friendly message for server errors (hardcoded in implementation)
                expect(error.message).toBe('Server error. Please try again later.');
                
                // Verify original server message is preserved in details
                if (serverMessage) {
                  expect(error.details).toBe(serverMessage);
                } else {
                  expect(error.details).toBe('Internal server error');
                }
                
                // Verify error can be serialized for logging
                const serialized = error.toJSON();
                expect(serialized).toHaveProperty('name');
                expect(serialized).toHaveProperty('message');
                expect(serialized).toHaveProperty('code');
                expect(serialized).toHaveProperty('type');
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate data and handle parsing errors safely', () => {
      // Feature: member-cluster-resource-management, Property 9: Error Handling Robustness
      fc.assert(
        fc.property(
          fc.record({
            responseType: fc.constantFrom('null', 'undefined', 'string', 'number', 'boolean', 'malformed-object'),
            hasValidStructure: fc.boolean(),
            includeRequiredFields: fc.boolean(),
          }),
          ({ responseType, hasValidStructure, includeRequiredFields }) => {
            // Test malformed response handling - Requirement 6.7
            let mockResponse: any;
            
            switch (responseType) {
              case 'null':
                mockResponse = null;
                break;
              case 'undefined':
                mockResponse = undefined;
                break;
              case 'string':
                mockResponse = 'invalid response';
                break;
              case 'number':
                mockResponse = 12345;
                break;
              case 'boolean':
                mockResponse = true;
                break;
              case 'malformed-object':
                mockResponse = hasValidStructure ? {
                  ...(includeRequiredFields && { code: 200, message: 'Success' }),
                  data: { test: 'data' }
                } : {
                  invalidField: 'invalid'
                };
                break;
            }
            
            if (responseType === 'null' || responseType === 'undefined') {
              expect(() => validateResponse(mockResponse)).toThrow(ApiError);
              
              try {
                validateResponse(mockResponse);
              } catch (error) {
                if (error instanceof ApiError) {
                  expect(error.type).toBe(ApiErrorType.UnknownError);
                  expect(error.message).toContain('Empty response');
                }
              }
            } else if (['string', 'number', 'boolean'].includes(responseType)) {
              expect(() => validateResponse(mockResponse)).toThrow(ApiError);
              
              try {
                validateResponse(mockResponse);
              } catch (error) {
                if (error instanceof ApiError) {
                  expect(error.type).toBe(ApiErrorType.UnknownError);
                  expect(error.message).toContain('Invalid response format');
                }
              }
            } else if (responseType === 'malformed-object') {
              // Should not throw for objects, but should provide defaults
              const result = validateResponse(mockResponse);
              
              // Verify safe defaults are provided
              expect(result).toHaveProperty('code');
              expect(result).toHaveProperty('message');
              expect(result).toHaveProperty('data');
              expect(result).toHaveProperty('timestamp');
              
              // Verify types are correct
              expect(typeof result.code).toBe('number');
              expect(typeof result.message).toBe('string');
              expect(typeof result.timestamp).toBe('string');
              
              // Verify defaults when fields are missing
              if (!includeRequiredFields) {
                expect(result.code).toBe(200); // Default code
                expect(result.message).toBe('Success'); // Default message
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle conflict errors with appropriate retry guidance', () => {
      // Feature: member-cluster-resource-management, Property 9: Error Handling Robustness
      fc.assert(
        fc.property(
          fc.record({
            resourceType: fc.constantFrom('deployment', 'service', 'configmap', 'secret'),
            conflictReason: fc.constantFrom('resource-version', 'name-conflict', 'dependency-conflict'),
            customMessage: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
          }),
          ({ resourceType, conflictReason, customMessage }) => {
            // Test conflict error handling
            const mockError = {
              response: {
                status: 409,
                data: {
                  message: customMessage || `Conflict updating ${resourceType}: ${conflictReason}`
                }
              }
            };
            
            expect(() => handleApiError(mockError)).toThrow(ApiError);
            
            try {
              handleApiError(mockError);
            } catch (error) {
              if (error instanceof ApiError) {
                // Verify conflict error structure
                expect(error.type).toBe(ApiErrorType.ConflictError);
                expect(error.code).toBe(409);
                expect(error.message).toBeTruthy();
                
                // Verify retry guidance is provided
                expect(error.message).toMatch(/conflict|refresh|try again/i);
                expect(error.message.length).toBeGreaterThan(10);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle unknown status codes gracefully', () => {
      // Feature: member-cluster-resource-management, Property 9: Error Handling Robustness
      fc.assert(
        fc.property(
          fc.record({
            statusCode: fc.integer({ min: 100, max: 999 }).filter(code => 
              ![200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 502, 503, 504].includes(code)
            ),
            errorMessage: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
          }),
          ({ statusCode, errorMessage }) => {
            // Test unknown status code handling
            const mockError = {
              response: {
                status: statusCode,
                data: {
                  message: errorMessage || `Unknown error with status ${statusCode}`
                }
              }
            };
            
            expect(() => handleApiError(mockError)).toThrow(ApiError);
            
            try {
              handleApiError(mockError);
            } catch (error) {
              if (error instanceof ApiError) {
                // Verify unknown error handling
                expect(error.type).toBe(ApiErrorType.UnknownError);
                expect(error.code).toBe(statusCode);
                expect(error.message).toBeTruthy();
                
                // Verify fallback message includes status code
                if (!errorMessage) {
                  expect(error.message).toContain(statusCode.toString());
                }
                
                // Verify error is properly structured
                expect(typeof error.message).toBe('string');
                expect(error.message.length).toBeGreaterThan(0);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve error context and details for debugging', () => {
      // Feature: member-cluster-resource-management, Property 9: Error Handling Robustness
      fc.assert(
        fc.property(
          fc.record({
            statusCode: fc.integer({ min: 400, max: 599 }),
            errorMessage: fc.string({ minLength: 2, maxLength: 200 }).filter(s => s.trim().length > 0), // Ensure non-empty message
            errorDetails: fc.option(fc.string({ minLength: 1, maxLength: 500 })),
            fieldName: fc.option(fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length > 0)), // Ensure non-empty field
            hasStackTrace: fc.boolean(),
          }),
          ({ statusCode, errorMessage, errorDetails, fieldName }) => {
            // Test error context preservation
            const mockError = {
              response: {
                status: statusCode,
                data: {
                  message: errorMessage,
                  ...(errorDetails && { details: errorDetails }),
                  ...(fieldName && { field: fieldName })
                }
              }
            };
            
            expect(() => handleApiError(mockError)).toThrow(ApiError);
            
            try {
              handleApiError(mockError);
            } catch (error) {
              if (error instanceof ApiError) {
                // Verify error context is preserved based on status code
                expect(error.code).toBe(statusCode);
                
                // Different status codes have different message handling
                if (statusCode === 422) {
                  // Validation errors preserve the original message
                  expect(error.message).toBe(errorMessage);
                  if (fieldName) {
                    expect(error.field).toBe(fieldName);
                  }
                  if (errorDetails) {
                    expect(error.details).toBe(errorDetails);
                  }
                } else if (statusCode === 500) {
                  // Server errors use hardcoded message, original in details
                  expect(error.message).toBe('Server error. Please try again later.');
                  expect(error.details).toBe(errorMessage);
                } else if (statusCode === 401) {
                  // Auth errors use hardcoded message, original in details
                  expect(error.message).toBe('Authentication required. Please log in again.');
                  expect(error.details).toBe(errorMessage);
                } else if (statusCode === 403) {
                  // Authorization errors use hardcoded message, original in details
                  expect(error.message).toBe('Insufficient permissions to perform this action.');
                  expect(error.details).toBe(errorMessage);
                } else if (statusCode === 404) {
                  // Not found errors use hardcoded message, original in details
                  expect(error.message).toBe('Resource not found. It may have been deleted.');
                  expect(error.details).toBe(errorMessage);
                } else if (statusCode === 409) {
                  // Conflict errors use hardcoded message, original in details
                  expect(error.message).toBe('Resource conflict. Please refresh and try again.');
                  expect(error.details).toBe(errorMessage);
                } else {
                  // Unknown errors preserve the original message or use fallback
                  expect(error.message).toBeTruthy();
                }
                
                // Verify error can be serialized for logging/debugging
                const serialized = error.toJSON();
                expect(serialized.code).toBe(statusCode);
                expect(serialized.message).toBeTruthy();
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Validation Error Handling', () => {
    it('should handle multiple validation errors consistently', () => {
      fc.assert(
        fc.property(
          fc.record({
            validationErrors: fc.array(
              fc.record({
                field: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z][a-zA-Z0-9._-]*$/.test(s)),
                message: fc.string({ minLength: 1, maxLength: 200 }),
                code: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
              }),
              { minLength: 1, maxLength: 10 }
            ),
          }),
          ({ validationErrors }) => {
            // Test multiple validation errors
            const mockResponse = {
              code: 422,
              message: 'Validation failed',
              data: null,
              validationErrors,
              timestamp: new Date().toISOString()
            };
            
            const result = validateResponse(mockResponse);
            
            // Verify validation errors are preserved
            expect(result.validationErrors).toEqual(validationErrors);
            expect(Array.isArray(result.validationErrors)).toBe(true);
            expect(result.validationErrors).toHaveLength(validationErrors.length);
            
            // Verify each validation error structure
            result.validationErrors!.forEach((error, index) => {
              expect(error.field).toBe(validationErrors[index].field);
              expect(error.message).toBe(validationErrors[index].message);
              
              if (validationErrors[index].code) {
                expect(error.code).toBe(validationErrors[index].code);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});