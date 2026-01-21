# ResourceList Component

A generic, reusable component for displaying and managing Kubernetes resources in the Karmada Dashboard. This component provides consistent UI patterns, advanced list view features, and comprehensive resource management capabilities.

## Features

- **Generic Design**: Works with any Kubernetes resource type
- **Advanced Filtering**: Filter by namespace, labels, status, and custom criteria
- **Sorting & Pagination**: Sortable columns with customizable pagination
- **Real-time Search**: Search across resource names and metadata
- **Bulk Operations**: Select multiple resources for bulk actions
- **Export Functionality**: Export resource lists in CSV, JSON, or YAML formats
- **Auto-refresh**: Configurable automatic data refresh
- **Consistent UI**: Uniform look and feel across all resource types
- **Error Handling**: Robust error handling with user-friendly messages
- **Loading States**: Proper loading indicators and feedback
- **Responsive Design**: Works on different screen sizes

## Basic Usage

```tsx
import { ResourceList, createWorkloadColumns } from '@/components/common';
import { GetMemberClusterDeployments } from '@/services/member-cluster/workload';

function DeploymentList({ memberClusterName }: { memberClusterName: string }) {
  const columns = createWorkloadColumns(
    (deployment) => console.log('View:', deployment),
    (deployment) => console.log('Edit:', deployment),
    (deployment) => console.log('Delete:', deployment)
  );

  return (
    <ResourceList
      memberClusterName={memberClusterName}
      resourceType="deployment"
      resourceKind="Deployment"
      fetchFunction={GetMemberClusterDeployments}
      columns={columns}
      title="Deployments"
      description="Manage Kubernetes Deployments"
    />
  );
}
```

## Props

### Core Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `memberClusterName` | `string` | Yes | Name of the member cluster |
| `resourceType` | `string` | Yes | Type of resource (e.g., 'deployment', 'service') |
| `resourceKind` | `string` | Yes | Kubernetes resource kind (e.g., 'Deployment', 'Service') |
| `fetchFunction` | `Function` | Yes | Function to fetch resource data |
| `columns` | `ResourceColumn[]` | Yes | Table column definitions |

### Feature Configuration

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableBulkOperations` | `boolean` | `true` | Enable bulk selection and operations |
| `enableExport` | `boolean` | `true` | Enable export functionality |
| `enableRefresh` | `boolean` | `true` | Enable manual refresh button |
| `enableSearch` | `boolean` | `true` | Enable search functionality |
| `enableFiltering` | `boolean` | `true` | Enable filtering controls |
| `enableSorting` | `boolean` | `true` | Enable column sorting |
| `enablePagination` | `boolean` | `true` | Enable pagination |

### Customization Props

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Custom title for the resource list |
| `description` | `string` | Description text below the title |
| `createButtonText` | `string` | Text for the create button |
| `emptyStateMessage` | `string` | Message when no resources are found |
| `customFilters` | `ReactNode` | Custom filter components |
| `customActions` | `ReactNode` | Custom action buttons |

### Callback Props

| Prop | Type | Description |
|------|------|-------------|
| `onRowClick` | `(record) => void` | Called when a table row is clicked |
| `onCreateClick` | `() => void` | Called when create button is clicked |
| `onRefresh` | `() => void` | Called when refresh is triggered |

## Column Definitions

The component uses predefined column factories for common resource types:

### Workload Columns
```tsx
import { createWorkloadColumns } from '@/components/common';

const columns = createWorkloadColumns(
  onView,    // (record) => void
  onEdit,    // (record) => void
  onDelete   // (record) => void
);
```

### Service Columns
```tsx
import { createServiceColumns } from '@/components/common';

const columns = createServiceColumns(onView, onEdit, onDelete);
```

### ConfigMap Columns
```tsx
import { createConfigMapColumns } from '@/components/common';

const columns = createConfigMapColumns(onView, onEdit, onDelete);
```

### Custom Columns
```tsx
const customColumns: ResourceColumn<MyResource>[] = [
  {
    key: 'name',
    title: 'Name',
    dataIndex: 'name',
    sortable: true,
    render: (_, record) => record.objectMeta.name,
  },
  {
    key: 'status',
    title: 'Status',
    dataIndex: 'status',
    render: (_, record) => <ResourceStatus status={record.status} />,
  },
];
```

## Bulk Actions

Define bulk actions for selected resources:

```tsx
import { createDefaultBulkActions } from '@/components/common';

const bulkActions = createDefaultBulkActions(
  async (items) => {
    // Delete selected items
    await deleteResources(items);
  },
  async (items) => {
    // Edit single item (only enabled when one item selected)
    if (items.length === 1) {
      editResource(items[0]);
    }
  },
  async (items) => {
    // Manage labels for selected items
    await manageLabelDialog(items);
  }
);

// Or define custom bulk actions
const customBulkActions: BulkAction[] = [
  {
    key: 'restart',
    label: 'Restart',
    icon: <ReloadOutlined />,
    onClick: async (items) => {
      await restartResources(items);
    },
  },
  {
    key: 'scale',
    label: 'Scale',
    icon: <ExpandOutlined />,
    disabled: (items) => items.some(item => !item.typeMeta.scalable),
    onClick: async (items) => {
      await scaleDialog(items);
    },
  },
];
```

## Export Configuration

Configure export functionality:

```tsx
const exportConfig: ExportConfig = {
  enabled: true,
  formats: ['csv', 'json', 'yaml'],
  filename: 'my-resources',
  customExporter: (data, format) => {
    // Custom export logic
    if (format === 'yaml') {
      exportAsYAML(data);
    }
  },
};
```

## Hooks

The component provides several hooks for advanced usage:

### useResourceQuery
```tsx
import { useResourceQuery } from '@/components/common';

const { data, isLoading, error } = useResourceQuery(
  memberClusterName,
  'deployment',
  filter,
  fetchFunction
);
```

### useResourceMutation
```tsx
import { useResourceMutation } from '@/components/common';

const deleteMutation = useResourceMutation(
  memberClusterName,
  'deployment',
  'delete',
  deleteFunction
);
```

### useBulkResourceMutation
```tsx
import { useBulkResourceMutation } from '@/components/common';

const bulkDeleteMutation = useBulkResourceMutation(
  memberClusterName,
  'deployment',
  'delete',
  bulkDeleteFunction
);
```

## Utility Components

The ResourceList includes utility components for consistent resource display:

### ResourceName
```tsx
<ResourceName
  name="my-deployment"
  namespace="default"
  onClick={() => navigate('/deployment/detail')}
/>
```

### ResourceStatus
```tsx
<ResourceStatus status="running" text="Running" />
```

### ResourceAge
```tsx
<ResourceAge creationTimestamp="2024-01-01T00:00:00Z" />
```

### ResourceLabels
```tsx
<ResourceLabels labels={{ app: 'web', env: 'prod' }} maxDisplay={3} />
```

### ResourceReplicas
```tsx
<ResourceReplicas ready={3} desired={3} showProgress />
```

## Styling

The component uses Tailwind CSS classes and Ant Design components. You can customize the appearance by:

1. Passing custom `className` prop
2. Using `tableProps` for table-specific styling
3. Overriding CSS classes in your stylesheets

## Error Handling

The component handles various error scenarios:

- Network errors
- API errors
- Validation errors
- Empty states
- Loading states

Errors are displayed using Ant Design Alert components with appropriate messaging.

## Performance

The component is optimized for performance:

- Uses React Query for caching and background updates
- Implements virtual scrolling for large datasets
- Debounces search input
- Memoizes expensive calculations
- Supports pagination to limit data loading

## Accessibility

The component follows accessibility best practices:

- Proper ARIA labels
- Keyboard navigation support
- Screen reader compatibility
- High contrast support
- Focus management

## Examples

See the `examples.tsx` file for complete usage examples of different resource types.