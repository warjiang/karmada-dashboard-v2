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
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { notification } from 'antd';
import { ResourceErrorBoundary } from './index';
import { ApiError, ApiErrorType } from '@/services/base';
import { vi, beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';

// Mock i18n
vi.mock('@/utils/i18n', () => ({
  default: {
    t: (key: string, fallback?: string) => fallback || key,
  },
}));

// Mock notification
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    notification: {
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  };
});

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleGroup = console.group;
const originalConsoleGroupEnd = console.groupEnd;

beforeAll(() => {
  console.error = vi.fn();
  console.group = vi.fn();
  console.groupEnd = vi.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.group = originalConsoleGroup;
  console.groupEnd = originalConsoleGroupEnd;
});

// Test component that throws an error
const ThrowError = ({ shouldThrow = true, errorType = 'generic' }: { shouldThrow?: boolean; errorType?: string }) => {
  if (shouldThrow) {
    if (errorType === 'api') {
      throw new ApiError({
        code: 500,
        message: 'API Error occurred',
        type: ApiErrorType.ServerError,
      });
    } else if (errorType === 'network') {
      throw new ApiError({
        code: 0,
        message: 'Network Error occurred',
        type: ApiErrorType.NetworkError,
      });
    } else {
      throw new Error('Test error occurred');
    }
  }
  return <div>No error</div>;
};

describe('ResourceErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ResourceErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ResourceErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders error UI when child component throws an error', () => {
    render(
      <ResourceErrorBoundary>
        <ThrowError />
      </ResourceErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred while managing resources.')).toBeInTheDocument();
  });

  it('displays API error messages correctly', () => {
    render(
      <ResourceErrorBoundary>
        <ThrowError errorType="api" />
      </ResourceErrorBoundary>
    );

    expect(screen.getByText('Server Error')).toBeInTheDocument();
    expect(screen.getByText('API Error occurred')).toBeInTheDocument();
  });

  it('displays network error messages correctly', () => {
    render(
      <ResourceErrorBoundary>
        <ThrowError errorType="network" />
      </ResourceErrorBoundary>
    );

    expect(screen.getByText('Network Error')).toBeInTheDocument();
    expect(screen.getByText('Network Error occurred')).toBeInTheDocument();
  });

  it('shows retry button and handles retry action', async () => {
    const { rerender } = render(
      <ResourceErrorBoundary enableRetry={true}>
        <ThrowError />
      </ResourceErrorBoundary>
    );

    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);

    // Wait for retry delay and check if notification was called
    await waitFor(() => {
      expect(notification.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Retrying...',
        })
      );
    });

    // After retry, the component should reset and try to render children again
    await waitFor(() => {
      // The error boundary should reset and try to render the child again
      // Since our test component still throws, it should show error again
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('shows reload button and handles reload action', () => {
    // Mock window.location.reload
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });

    render(
      <ResourceErrorBoundary enableReload={true}>
        <ThrowError />
      </ResourceErrorBoundary>
    );

    const reloadButton = screen.getByText('Reload Page');
    expect(reloadButton).toBeInTheDocument();

    fireEvent.click(reloadButton);
    expect(mockReload).toHaveBeenCalled();
  });

  it('shows go back button and handles navigation', () => {
    // Mock window.history.back
    const mockBack = vi.fn();
    Object.defineProperty(window, 'history', {
      value: { back: mockBack },
      writable: true,
    });

    render(
      <ResourceErrorBoundary>
        <ThrowError />
      </ResourceErrorBoundary>
    );

    const backButton = screen.getByText('Go Back');
    expect(backButton).toBeInTheDocument();

    fireEvent.click(backButton);
    expect(mockBack).toHaveBeenCalled();
  });

  it('renders custom actions', () => {
    const mockCustomAction = vi.fn();
    const customActions = [
      {
        key: 'custom-action',
        label: 'Custom Action',
        onClick: mockCustomAction,
      },
    ];

    render(
      <ResourceErrorBoundary customActions={customActions}>
        <ThrowError />
      </ResourceErrorBoundary>
    );

    const customButton = screen.getByText('Custom Action');
    expect(customButton).toBeInTheDocument();

    fireEvent.click(customButton);
    expect(mockCustomAction).toHaveBeenCalled();
  });

  it('renders custom fallback UI', () => {
    const CustomFallback = () => <div>Custom Error UI</div>;

    render(
      <ResourceErrorBoundary fallback={<CustomFallback />}>
        <ThrowError />
      </ResourceErrorBoundary>
    );

    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('calls custom error handler', () => {
    const mockErrorHandler = vi.fn();

    render(
      <ResourceErrorBoundary onError={mockErrorHandler}>
        <ThrowError />
      </ResourceErrorBoundary>
    );

    expect(mockErrorHandler).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('shows error details in development mode', () => {
    render(
      <ResourceErrorBoundary showErrorDetails={true}>
        <ThrowError />
      </ResourceErrorBoundary>
    );

    // Click to expand error details
    const errorDetailsButton = screen.getByText('Error Details');
    fireEvent.click(errorDetailsButton);

    expect(screen.getByText('Error ID:')).toBeInTheDocument();
    expect(screen.getByText('Message:')).toBeInTheDocument();
  });

  it('hides error details in production mode', () => {
    render(
      <ResourceErrorBoundary showErrorDetails={false}>
        <ThrowError />
      </ResourceErrorBoundary>
    );

    expect(screen.queryByText('Error Details')).not.toBeInTheDocument();
  });

  it('limits retry attempts', async () => {
    const { rerender } = render(
      <ResourceErrorBoundary enableRetry={true}>
        <ThrowError />
      </ResourceErrorBoundary>
    );

    // Try to retry 4 times (more than the limit of 3)
    for (let i = 0; i < 4; i++) {
      const retryButton = screen.queryByText('Try Again');
      if (retryButton) {
        fireEvent.click(retryButton);
        await waitFor(() => {}, { timeout: 1100 }); // Wait for retry delay
      }
    }

    // After max retries, should show warning
    await waitFor(() => {
      expect(notification.warning).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Maximum retries reached',
        })
      );
    });
  });

  it('shows notification for network errors', () => {
    render(
      <ResourceErrorBoundary>
        <ThrowError errorType="network" />
      </ResourceErrorBoundary>
    );

    expect(notification.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'An error occurred',
        description: 'Please check your internet connection and try again.',
      })
    );
  });

  it('generates unique error IDs', () => {
    let randomCallCount = 0;
    const originalRandom = Math.random;
    Math.random = vi.fn(() => {
      randomCallCount++;
      return randomCallCount * 0.1; // Different values for each call
    });

    const { rerender } = render(
      <ResourceErrorBoundary showErrorDetails={true}>
        <ThrowError />
      </ResourceErrorBoundary>
    );

    // Expand error details to see error ID
    const errorDetailsButton = screen.getByText('Error Details');
    fireEvent.click(errorDetailsButton);

    const firstErrorId = screen.getByText(/error_\d+_\w+/);
    expect(firstErrorId).toBeInTheDocument();

    // Reset and trigger another error
    rerender(
      <ResourceErrorBoundary showErrorDetails={true}>
        <ThrowError shouldThrow={false} />
      </ResourceErrorBoundary>
    );

    rerender(
      <ResourceErrorBoundary showErrorDetails={true}>
        <ThrowError />
      </ResourceErrorBoundary>
    );

    // Should generate a new error ID
    const errorDetailsButton2 = screen.getByText('Error Details');
    fireEvent.click(errorDetailsButton2);

    const secondErrorId = screen.getByText(/error_\d+_\w+/);
    expect(secondErrorId).toBeInTheDocument();
    
    // Error IDs should be different (they will be because of different timestamps)
    expect(firstErrorId.textContent).not.toBe(secondErrorId.textContent);

    // Restore original Math.random
    Math.random = originalRandom;
  });

  it('cleans up timeouts on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    
    const { unmount } = render(
      <ResourceErrorBoundary>
        <ThrowError />
      </ResourceErrorBoundary>
    );

    // Trigger retry to create timeout
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});