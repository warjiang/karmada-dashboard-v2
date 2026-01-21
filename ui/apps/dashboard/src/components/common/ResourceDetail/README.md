# ResourceDetail Component

A comprehensive, generic component for displaying detailed information about Kubernetes resources in the Karmada Dashboard. This component provides consistent tab layouts, navigation, and detailed information display across all resource types.

## Features

- **Generic Design**: Works with any Kubernetes resource type
- **Consistent Tab Layout**: Overview, YAML, Events, and resource-specific tabs
- **Navigation Support**: Breadcrumbs and related resource navigation
- **Comprehensive Information**: Metadata, specifications, status, and relationships
- **Interactive Features**: Edit YAML, view logs, metrics, and events
- **Export Capabilities**: Download resources as YAML or JSON
- **Error Handling**: Graceful error states and loading indicators
- **Responsive Design**: Works on all screen sizes

## Basic Usage

```tsx
import { ResourceDetail } from '@/components/common/ResourceDetail';
import { GetMemberClusterDeploymentDetail } from '@/services/member-cluster/workload';

function DeploymentDetailView() {
  const [open, setOpen] = useState(false);
  
  return (
    <ResourceDetail
      open={open}
      memberClusterName="cluster-1"
      namespace="default"
      name="my-deployment"
      resourceType="deployment"
      resourceKind="Deployment"
      fetchFunction={GetMemberClusterDeploymentDetail}
      onClose={() => setOpen(false)}
    />
  );
}
```

## Advanced Usage with Custom Tabs

```tsx
import { ResourceDetail, DetailTab } from '@/components/common/ResourceDetail';
import { createWorkloadTabs } from '@/components/common/ResourceDetail/utils';
import { WorkloadKind } from '@/services/base';

function DeploymentDetailWithCustomTabs() {
  const customTabs: DetailTab[] = [
    ...createWorkloadTabs(WorkloadKind.Deployment),
    {
      key: 'custom',
      label: 'Custom Tab',
      component: MyCustomTabComponent,
    },
  ];

  return (
    <ResourceDetail
      open={open}
      memberClusterName="cluster-1"
      namespace="default"
      name="my-deployment"
      resourceType="deployment"
      resourceKind="Deployment"
      fetchFunction={GetMemberClusterDeploymentDetail}
      tabs={customTabs}
      onClose={() => setOpen(false)}
      onEdit={() => handleEdit()}
      onDelete={() => handleDelete()}
    />
  );
}
```

## Props

### Core Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `open` | `boolean` | ✅ | Whether the detail drawer is open |
| `memberClusterName` | `string` | ✅ | Name of the member cluster |
| `namespace` | `string` | ✅ | Resource namespace |
| `name` | `string` | ✅ | Resource name |
| `resourceType` | `string` | ✅ | Resource type (e.g., 'deployment') |
| `resourceKind` | `string` | ✅ | Resource kind (e.g., 'Deployment') |
| `fetchFunction` | `function` | ✅ | Function to fetch resource details |
| `onClose` | `function` | ✅ | Callback when drawer is closed |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tabs` | `DetailTab[]` | `[]` | Custom tabs to add |
| `defaultActiveTab` | `string` | `'overview'` | Default active tab |
| `breadcrumbs` | `BreadcrumbItem[]` | `[]` | Navigation breadcrumbs |
| `onNavigate` | `function` | - | Navigation callback |
| `onEdit` | `function` | - | Edit callback |
| `onDelete` | `function` | - | Delete callback |
| `onRefresh` | `function` | - | Refresh callback |
| `title` | `string` | - | Custom drawer title |
| `width` | `number \| string` | `800` | Drawer width |
| `placement` | `'left' \| 'right' \| 'top' \| 'bottom'` | `'right'` | Drawer placement |
| `customActions` | `React.ReactNode` | - | Custom action buttons |

### Feature Flags

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableEdit` | `boolean` | `true` | Show edit button |
| `enableDelete` | `boolean` | `true` | Show delete button |
| `enableRefresh` | `boolean` | `true` | Show refresh button |
| `enableExport` | `boolean` | `true` | Enable export functionality |
| `enableBreadcrumbs` | `boolean` | `true` | Show breadcrumbs |

## Default Tabs

The component includes three default tabs:

### 1. Overview Tab
- Basic resource information (name, namespace, age, etc.)
- Labels and annotations
- Owner references and finalizers
- Resource-specific metadata

### 2. YAML Tab
- Syntax-highlighted YAML view
- Edit capabilities with validation
- Download functionality
- Clean export format (removes internal fields)

### 3. Events Tab
- Chronological event history
- Event filtering and search
- Real-time updates
- Event type indicators

## Custom Tabs

Create custom tabs by implementing the `DetailTabProps` interface:

```tsx
import { DetailTabProps } from '@/components/common/ResourceDetail';

const MyCustomTab: React.FC<DetailTabProps> = ({
  resource,
  memberClusterName,
  resourceType,
  onNavigate,
  onRefresh,
}) => {
  return (
    <div>
      <h3>Custom Tab Content</h3>
      <p>Resource: {resource?.objectMeta?.name}</p>
      <p>Cluster: {memberClusterName}</p>
    </div>
  );
};

const customTab: DetailTab = {
  key: 'custom',
  label: 'Custom',
  icon: <CustomIcon />,
  component: MyCustomTab,
};
```

## Resource-Specific Tabs

Use utility functions to create resource-specific tabs:

```tsx
import { 
  createWorkloadTabs, 
  createServiceTabs, 
  createConfigTabs 
} from '@/components/common/ResourceDetail/utils';
import { WorkloadKind, ServiceKind, ConfigKind } from '@/services/base';

// For workload resources
const workloadTabs = createWorkloadTabs(WorkloadKind.Deployment);

// For service resources
const serviceTabs = createServiceTabs(ServiceKind.Service);

// For configuration resources
const configTabs = createConfigTabs(ConfigKind.ConfigMap);
```

## Available Resource-Specific Tabs

### Workload Resources (Deployment, StatefulSet, DaemonSet, Job, CronJob)
- **Pods Tab**: Shows related pods with status and actions
- **Conditions Tab**: Displays resource conditions and health status
- **Metrics Tab**: Resource usage metrics (CPU, memory, network)
- **Logs Tab**: Container logs with filtering and following
- **Related Resources Tab**: Shows owned and related resources

### Service Resources (Service, Ingress)
- **Endpoints Tab**: Service endpoints and backend information
- **Related Resources Tab**: Connected pods and other resources

### Configuration Resources (ConfigMap, Secret, PVC)
- **Data Tab**: Configuration data (with security for secrets)
- **Volume Info Tab**: Persistent volume information (PVC only)
- **Conditions Tab**: Resource conditions (PVC only)
- **Related Resources Tab**: Pods using the configuration

## Hooks

The component provides several hooks for advanced usage:

### useResourceDetail
```tsx
import { useResourceDetail } from '@/components/common/ResourceDetail/hooks';

const { data, isLoading, error, refetch } = useResourceDetail(
  memberClusterName,
  resourceType,
  namespace,
  name,
  fetchFunction
);
```

### useResourceEvents
```tsx
import { useResourceEvents } from '@/components/common/ResourceDetail/hooks';

const { data: events } = useResourceEvents(
  memberClusterName,
  resourceType,
  namespace,
  name,
  fetchEventsFunction
);
```

### useResourceMetrics
```tsx
import { useResourceMetrics } from '@/components/common/ResourceDetail/hooks';

const { data: metrics } = useResourceMetrics(
  memberClusterName,
  resourceType,
  namespace,
  name,
  fetchMetricsFunction
);
```

## Utilities

### Creating Breadcrumbs
```tsx
import { createResourceBreadcrumbs } from '@/components/common/ResourceDetail/utils';

const breadcrumbs = createResourceBreadcrumbs(
  memberClusterName,
  resourceType,
  resourceKind,
  namespace,
  resourceName,
  onNavigateToCluster,
  onNavigateToResourceList,
  onNavigateToNamespace
);
```

### Resource Health Status
```tsx
import { extractResourceHealth } from '@/components/common/ResourceDetail/utils';

const { status, message } = extractResourceHealth(resource);
// status: 'healthy' | 'warning' | 'error' | 'unknown'
```

### Clean Resource for Export
```tsx
import { cleanResourceForExport } from '@/components/common/ResourceDetail/utils';

const cleanResource = cleanResourceForExport(resource);
// Removes internal fields like resourceVersion, uid, etc.
```

## Styling

The component uses Ant Design components and follows the existing design system. Custom styling can be applied using the `className` prop:

```tsx
<ResourceDetail
  className="my-custom-detail"
  // ... other props
/>
```

## Error Handling

The component handles various error states:

- **Network Errors**: Shows retry button and error message
- **Resource Not Found**: Displays empty state with navigation options
- **Loading States**: Shows appropriate spinners and skeletons
- **Validation Errors**: Highlights problematic fields in YAML editor

## Performance

- **Query Caching**: Uses React Query for efficient data caching
- **Lazy Loading**: Tabs are rendered only when active
- **Optimistic Updates**: Immediate UI feedback for mutations
- **Debounced Search**: Efficient filtering and searching
- **Memory Management**: Proper cleanup on component unmount

## Accessibility

- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Management**: Logical focus flow and indicators
- **Color Contrast**: Meets WCAG guidelines for color contrast
- **Responsive Design**: Works on all screen sizes and devices

## Testing

The component includes comprehensive test coverage:

```bash
# Run unit tests
npm test ResourceDetail

# Run integration tests
npm test ResourceDetail.integration

# Run property-based tests
npm test ResourceDetail.property
```

## Examples

See the `examples.tsx` file for complete usage examples with different resource types and configurations.