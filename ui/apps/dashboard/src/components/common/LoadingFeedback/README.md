# Loading and Feedback Components

This module provides consistent loading states, notifications, and confirmation dialogs across all resource management operations in the Karmada Dashboard.

## Components

### Loading Components

#### LoadingSpinner
Basic spinner component with customizable size and tip text.

```tsx
import { LoadingSpinner } from '@/components/common/LoadingFeedback';

<LoadingSpinner size="large" tip="Loading resources..." spinning={isLoading}>
  <YourContent />
</LoadingSpinner>
```

#### CenteredLoading
Centered loading spinner for full page or section loading states.

```tsx
import { CenteredLoading } from '@/components/common/LoadingFeedback';

<CenteredLoading 
  size="large" 
  tip="Loading deployment details..." 
  height="400px" 
/>
```

#### LoadingButton
Button with built-in loading state management.

```tsx
import { LoadingButton } from '@/components/common/LoadingFeedback';

<LoadingButton 
  loading={isSubmitting} 
  type="primary" 
  onClick={handleSubmit}
>
  Create Deployment
</LoadingButton>
```

### Notification Functions

#### Basic Notifications
```tsx
import { showNotification } from '@/components/common/LoadingFeedback';

// Success notification
showNotification.success({
  message: 'Operation Successful',
  description: 'The resource was created successfully.',
});

// Error notification
showNotification.error({
  message: 'Operation Failed',
  description: 'Failed to create the resource.',
  duration: 6,
});

// Warning notification
showNotification.warning({
  message: 'Warning',
  description: 'This action may have side effects.',
});

// Info notification
showNotification.info({
  message: 'Information',
  description: 'Resource status has been updated.',
});
```

#### Resource-Specific Notifications
Pre-configured notifications for common resource operations:

```tsx
import { resourceNotifications } from '@/components/common/LoadingFeedback';

// Success notifications
resourceNotifications.createSuccess('Deployment', 'nginx-deployment', 'default');
resourceNotifications.updateSuccess('Service', 'web-service', 'production');
resourceNotifications.deleteSuccess('ConfigMap', 'app-config');
resourceNotifications.operationSuccess('pause', 'Deployment', 'nginx-deployment', 'default');

// Error notifications
resourceNotifications.createError('Deployment', 'nginx-deployment', 'Insufficient resources', 'default');
resourceNotifications.updateError('Service', 'web-service', 'Port already in use', 'production');
resourceNotifications.deleteError('ConfigMap', 'app-config', 'Resource is in use');
resourceNotifications.operationError('pause', 'Deployment', 'nginx-deployment', 'Operation not allowed', 'default');

// Bulk operation notifications
resourceNotifications.bulkOperationSuccess('delete', 'Deployment', 5, 5); // All succeeded
resourceNotifications.bulkOperationSuccess('delete', 'Deployment', 3, 5); // Partial success (shows warning)
resourceNotifications.bulkOperationError('delete', 'Deployment', 5, 'Network error');
```

### Confirmation Dialogs

#### Basic Confirmations
```tsx
import { showConfirmation } from '@/components/common/LoadingFeedback';

// Delete confirmation
showConfirmation.delete({
  title: 'Delete Resource',
  content: 'Are you sure you want to delete this resource?',
  onConfirm: async () => {
    await deleteResource();
  },
});

// Warning confirmation
showConfirmation.warning({
  title: 'Proceed with Operation',
  content: 'This operation cannot be undone.',
  onConfirm: async () => {
    await performOperation();
  },
});

// Info confirmation
showConfirmation.info({
  title: 'Information',
  content: 'This will update the resource configuration.',
  onConfirm: async () => {
    await updateResource();
  },
});
```

#### Resource-Specific Confirmations
Pre-configured confirmations for common resource operations:

```tsx
import { resourceConfirmations } from '@/components/common/LoadingFeedback';

// Single resource deletion
resourceConfirmations.delete(
  'Deployment', 
  'nginx-deployment', 
  async () => await deleteDeployment(),
  'default' // namespace (optional)
);

// Bulk deletion
resourceConfirmations.bulkDelete(
  'Service', 
  3, 
  async () => await deleteBulkServices()
);

// Resource operations
resourceConfirmations.operation(
  'Pause', 
  'Deployment', 
  'nginx-deployment', 
  async () => await pauseDeployment(),
  'default'
);

// Unsaved changes warning
resourceConfirmations.unsavedChanges(
  async () => await discardChanges(),
  () => console.log('User cancelled')
);

// Data replacement warning
resourceConfirmations.replaceData(
  'Template', 
  async () => await applyTemplate(),
  () => console.log('User cancelled')
);
```

### Popconfirm Components

#### ResourcePopconfirm
Generic popconfirm component for inline confirmations:

```tsx
import { ResourcePopconfirm } from '@/components/common/LoadingFeedback';

<ResourcePopconfirm
  title="Confirm Action"
  description="This will modify the resource."
  onConfirm={handleConfirm}
  okType="danger"
  placement="topRight"
>
  <Button danger>Dangerous Action</Button>
</ResourcePopconfirm>
```

#### DeletePopconfirm
Specialized popconfirm for resource deletion:

```tsx
import { DeletePopconfirm } from '@/components/common/LoadingFeedback';

<DeletePopconfirm
  resourceType="Deployment"
  resourceName="nginx-deployment"
  namespace="default"
  onConfirm={handleDelete}
  placement="topRight"
>
  <Button danger icon={<DeleteOutlined />}>
    Delete
  </Button>
</DeletePopconfirm>
```

## Usage Patterns

### In Resource Tables
```tsx
import { DeletePopconfirm, LoadingButton, resourceNotifications } from '@/components/common/LoadingFeedback';

const ResourceTable = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const handleDelete = async (resource: Resource) => {
    const key = `${resource.namespace}-${resource.name}`;
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    
    try {
      await deleteResource(resource);
      resourceNotifications.deleteSuccess('Deployment', resource.name, resource.namespace);
    } catch (error) {
      resourceNotifications.deleteError('Deployment', resource.name, error.message, resource.namespace);
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <Table
      columns={[
        // ... other columns
        {
          title: 'Actions',
          render: (_, resource) => {
            const key = `${resource.namespace}-${resource.name}`;
            const isLoading = loadingStates[key];
            
            return (
              <DeletePopconfirm
                resourceType="Deployment"
                resourceName={resource.name}
                namespace={resource.namespace}
                onConfirm={() => handleDelete(resource)}
              >
                <LoadingButton 
                  loading={isLoading}
                  danger 
                  size="small"
                  icon={<DeleteOutlined />}
                >
                  Delete
                </LoadingButton>
              </DeletePopconfirm>
            );
          }
        }
      ]}
    />
  );
};
```

### In Resource Forms
```tsx
import { LoadingButton, resourceNotifications, resourceConfirmations } from '@/components/common/LoadingFeedback';

const ResourceForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleSubmit = async (values: FormData) => {
    setIsSubmitting(true);
    try {
      await createResource(values);
      resourceNotifications.createSuccess('Deployment', values.name, values.namespace);
    } catch (error) {
      resourceNotifications.createError('Deployment', values.name, error.message, values.namespace);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      resourceConfirmations.unsavedChanges(
        () => navigate('/deployments'),
        () => console.log('User chose to stay')
      );
    } else {
      navigate('/deployments');
    }
  };

  return (
    <Form onFinish={handleSubmit}>
      {/* Form fields */}
      
      <Space>
        <LoadingButton 
          type="primary" 
          htmlType="submit" 
          loading={isSubmitting}
        >
          Create Deployment
        </LoadingButton>
        <Button onClick={handleCancel}>
          Cancel
        </Button>
      </Space>
    </Form>
  );
};
```

### In Resource Detail Views
```tsx
import { CenteredLoading, LoadingButton, resourceConfirmations } from '@/components/common/LoadingFeedback';

const ResourceDetail = ({ resourceId }: { resourceId: string }) => {
  const { data: resource, isLoading } = useQuery(['resource', resourceId], fetchResource);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteResource(resourceId);
      resourceNotifications.deleteSuccess('Deployment', resource.name, resource.namespace);
      navigate('/deployments');
    } catch (error) {
      resourceNotifications.deleteError('Deployment', resource.name, error.message, resource.namespace);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <CenteredLoading tip="Loading resource details..." height="400px" />;
  }

  return (
    <div>
      {/* Resource details */}
      
      <Space>
        <Button type="primary">Edit</Button>
        <LoadingButton 
          danger 
          loading={isDeleting}
          onClick={() => resourceConfirmations.delete(
            'Deployment',
            resource.name,
            handleDelete,
            resource.namespace
          )}
        >
          Delete
        </LoadingButton>
      </Space>
    </div>
  );
};
```

## Internationalization

All text strings use the i18n system with fallback English text. The following keys are used:

- `loading` - "Loading..."
- `confirm` - "Confirm"
- `cancel` - "Cancel"
- `delete` - "Delete"
- `resource_created` - "{resourceType} Created"
- `resource_updated` - "{resourceType} Updated"
- `resource_deleted` - "{resourceType} Deleted"
- `confirm_delete_resource` - "Delete {resourceType}"
- `unsaved_changes` - "Unsaved Changes"
- And many more...

## Consistency Guidelines

1. **Always use these components** instead of creating custom loading/notification implementations
2. **Use resource-specific functions** when available (e.g., `resourceNotifications.createSuccess`)
3. **Include namespace information** when applicable for better user context
4. **Use appropriate confirmation types** (delete for destructive actions, warning for potentially harmful actions)
5. **Provide meaningful error messages** that help users understand what went wrong
6. **Use consistent placement** for popconfirms (topRight is default)
7. **Handle loading states** at the appropriate granularity (per-resource for tables, global for forms)

## Testing

The components are designed to be easily testable:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoadingButton, resourceNotifications } from '@/components/common/LoadingFeedback';

// Mock notification
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  notification: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

test('shows loading state and calls notification on success', async () => {
  const mockOnClick = jest.fn().mockResolvedValue(undefined);
  
  render(
    <LoadingButton onClick={mockOnClick}>
      Submit
    </LoadingButton>
  );
  
  const button = screen.getByRole('button');
  fireEvent.click(button);
  
  // Should show loading state
  expect(button).toHaveAttribute('class', expect.stringContaining('ant-btn-loading'));
  
  await waitFor(() => {
    expect(mockOnClick).toHaveBeenCalled();
  });
});
```