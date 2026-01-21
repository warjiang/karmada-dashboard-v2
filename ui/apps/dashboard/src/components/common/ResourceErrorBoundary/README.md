# ResourceErrorBoundary

A comprehensive React error boundary component designed specifically for resource management operations in the Karmada Dashboard. This component provides robust error handling with user-friendly recovery options, error logging, and monitoring integration.

## Features

- **User-friendly error display** with contextual error messages
- **Recovery options** including retry with exponential backoff, page reload, and navigation
- **Error logging and monitoring integration** for production debugging
- **Customizable actions** and fallback UI components
- **Integration with existing notification system** for non-blocking error feedback
- **Internationalization support** using the existing i18n system
- **Development-friendly error details** with stack traces and component information

## Usage

### Basic Usage

```tsx
import ResourceErrorBoundary from '@/components/common/ResourceErrorBoundary';

function MyResourcePage() {
  return (
    <ResourceErrorBoundary>
      <ResourceList />
      <ResourceDetail />
    </ResourceErrorBoundary>
  );
}
```

### Advanced Usage with Custom Options

```tsx
import ResourceErrorBoundary from '@/components/common/ResourceErrorBoundary';

function MyResourcePage() {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Custom error handling logic
    console.log('Custom error handler:', error);
  };

  const customActions = [
    {
      key: 'contact-support',
      label: 'Contact Support',
      icon: <SupportIcon />,
      onClick: () => window.open('/support', '_blank'),
      type: 'primary' as const,
    },
    {
      key: 'report-bug',
      label: 'Report Bug',
      icon: <BugIcon />,
      onClick: () => reportBug(),
      danger: true,
    },
  ];

  return (
    <ResourceErrorBoundary
      onError={handleError}
      showErrorDetails={true}
      enableRetry={true}
      enableReload={true}
      customActions={customActions}
    >
      <ComplexResourceManagementUI />
    </ResourceErrorBoundary>
  );
}
```

### With Custom Fallback UI

```tsx
import ResourceErrorBoundary from '@/components/common/ResourceErrorBoundary';

const CustomErrorFallback = () => (
  <div className="custom-error-page">
    <h2>Oops! Something went wrong</h2>
    <p>Please try refreshing the page.</p>
  </div>
);

function MyResourcePage() {
  return (
    <ResourceErrorBoundary fallback={<CustomErrorFallback />}>
      <ResourceComponents />
    </ResourceErrorBoundary>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | The child components to wrap with error boundary |
| `fallback` | `ReactNode` | - | Custom fallback UI to render when an error occurs |
| `onError` | `(error: Error, errorInfo: React.ErrorInfo) => void` | - | Custom error handler callback |
| `showErrorDetails` | `boolean` | `process.env.NODE_ENV === 'development'` | Whether to show detailed error information |
| `enableRetry` | `boolean` | `true` | Whether to show the retry button |
| `enableReload` | `boolean` | `true` | Whether to show the reload page button |
| `customActions` | `CustomAction[]` | `[]` | Array of custom action buttons |

### CustomAction Interface

```tsx
interface CustomAction {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  danger?: boolean;
}
```

## Error Handling Features

### Error Types

The component handles different types of errors with appropriate messaging:

- **Network Errors**: Connection issues, timeouts
- **Authentication Errors**: Token expiration, login required
- **Authorization Errors**: Insufficient permissions
- **Not Found Errors**: Resource not found
- **Server Errors**: 5xx HTTP status codes
- **Validation Errors**: Form validation failures
- **Unknown Errors**: Unexpected JavaScript errors

### Recovery Options

1. **Retry with Exponential Backoff**: Automatically retries failed operations with increasing delays (1s, 2s, 4s)
2. **Page Reload**: Refreshes the entire page to reset application state
3. **Navigation**: Go back to the previous page
4. **Custom Actions**: Configurable buttons for specific recovery scenarios

### Error Logging

The component automatically logs errors with the following information:

- Unique error ID for tracking
- Error message and stack trace
- Component stack trace
- Timestamp and user context
- Browser and environment information
- Current URL and user ID (if available)

In production, errors are sent to a monitoring service endpoint (`/api/v1/errors`).

### Notification Integration

The component integrates with the existing Ant Design notification system to show non-blocking error messages for:

- Network connectivity issues
- Server errors
- Authentication problems

## Internationalization

The component uses the existing i18n system with the following translation keys:

- `error_occurred`: "An error occurred"
- `network_error_desc`: "Please check your internet connection and try again."
- `auth_error_desc`: "Please log in again to continue."
- `permission_error_desc`: "You do not have permission to perform this action."
- `server_error_desc`: "A server error occurred. Please try again later."
- `unexpected_error_desc`: "An unexpected error occurred. Please try again."
- `max_retries_reached`: "Maximum retries reached"
- `retrying`: "Retrying..."
- `try_again`: "Try Again"
- `reload_page`: "Reload Page"
- `go_back`: "Go Back"
- `error_details`: "Error Details"
- `error_id`: "Error ID"
- `error_message`: "Message"
- `stack_trace`: "Stack Trace"
- `component_stack`: "Component Stack"

## Best Practices

### Placement

1. **Page Level**: Wrap entire pages to catch all resource-related errors
2. **Component Level**: Wrap specific components that perform API operations
3. **Route Level**: Use in route error boundaries for navigation errors

### Error Monitoring

1. **Production**: Ensure monitoring endpoint is configured
2. **Development**: Use detailed error information for debugging
3. **Logging**: Implement proper error tracking and alerting

### User Experience

1. **Contextual Messages**: Provide specific error messages based on error type
2. **Recovery Options**: Always provide multiple ways to recover from errors
3. **Non-blocking Notifications**: Use notifications for minor errors, error boundary for critical failures

## Examples

### Wrapping Resource Lists

```tsx
<ResourceErrorBoundary>
  <ResourceList
    memberClusterName="cluster-1"
    resourceType="deployments"
    // ... other props
  />
</ResourceErrorBoundary>
```

### Wrapping Resource Forms

```tsx
<ResourceErrorBoundary
  onError={(error) => {
    // Log form-specific errors
    analytics.track('form_error', { error: error.message });
  }}
>
  <ResourceForm
    mode="create"
    resourceType="service"
    // ... other props
  />
</ResourceErrorBoundary>
```

### Wrapping Entire Resource Management Pages

```tsx
function WorkloadPage() {
  return (
    <ResourceErrorBoundary
      customActions={[
        {
          key: 'refresh-data',
          label: 'Refresh Data',
          icon: <ReloadOutlined />,
          onClick: () => queryClient.invalidateQueries(['workloads']),
        },
      ]}
    >
      <WorkloadList />
      <WorkloadDetail />
      <WorkloadForm />
    </ResourceErrorBoundary>
  );
}
```

## Testing

The component can be tested by triggering errors in child components:

```tsx
// Test component that throws an error
const ErrorComponent = () => {
  throw new Error('Test error');
};

// Test the error boundary
render(
  <ResourceErrorBoundary>
    <ErrorComponent />
  </ResourceErrorBoundary>
);
```

## Integration with Existing Components

The ResourceErrorBoundary is designed to work seamlessly with existing components:

- **ResourceList**: Catches errors during data fetching and rendering
- **ResourceDetail**: Handles errors in detail view loading
- **ResourceForm**: Manages form submission and validation errors
- **API Services**: Works with the enhanced API client error handling

## Monitoring Integration

For production deployments, configure the monitoring endpoint to receive error reports:

```typescript
// Example monitoring service integration
app.post('/api/v1/errors', (req, res) => {
  const errorData = req.body;
  
  // Send to monitoring service (Sentry, LogRocket, etc.)
  monitoringService.captureError(errorData);
  
  res.status(200).json({ success: true });
});
```