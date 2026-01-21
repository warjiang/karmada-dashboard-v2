# ResourceForm Component

A comprehensive, generic form component for creating and editing Kubernetes resources in the Karmada Dashboard. The ResourceForm provides a consistent, user-friendly interface with advanced features like templates, examples, real-time validation, and YAML editing.

## Features

### Core Functionality
- **Generic Resource Support**: Works with any Kubernetes resource type (Deployments, Services, ConfigMaps, Secrets, etc.)
- **Create/Edit Modes**: Supports both resource creation and editing workflows
- **Form Validation**: Real-time validation with Kubernetes-specific rules
- **YAML Integration**: Bidirectional sync between form fields and YAML editor

### Advanced Features
- **Templates**: Pre-configured templates for common resource patterns
- **Examples**: Real-world YAML examples with different complexity levels
- **Progress Tracking**: Visual progress indicators showing form completion
- **Auto-save**: Automatic saving for edit mode (configurable)
- **Unsaved Changes Warning**: Prevents accidental data loss

### User Experience
- **Responsive Design**: Works on desktop and mobile devices
- **Accessibility**: Full keyboard navigation and screen reader support
- **Consistent UI**: Follows Ant Design patterns used throughout the dashboard
- **Help Integration**: Contextual help and documentation links

## Usage

### Basic Usage

```tsx
import { ResourceForm } from '@/components/common/ResourceForm';
import { useResourceFormMutation } from '@/components/common/ResourceForm/hooks';

function CreateDeploymentPage() {
  const mutation = useResourceFormMutation(
    'member-cluster-1',
    'deployment',
    'create',
    createDeploymentFunction
  );

  const fields = [
    {
      key: 'metadata.name',
      label: 'Name',
      type: 'input',
      required: true,
      placeholder: 'Enter deployment name',
    },
    {
      key: 'spec.replicas',
      label: 'Replicas',
      type: 'number',
      required: true,
      defaultValue: 1,
    },
    // ... more fields
  ];

  return (
    <ResourceForm
      resourceType="deployment"
      resourceKind="Deployment"
      memberClusterName="member-cluster-1"
      mode="create"
      fields={fields}
      onSubmit={mutation.mutateAsync}
      onCancel={() => navigate('/deployments')}
    />
  );
}
```

### Advanced Usage with Templates and Examples

```tsx
import { ResourceForm } from '@/components/common/ResourceForm';
import { getDefaultTemplates, getDefaultExamples } from '@/components/common/ResourceForm';

function AdvancedResourceForm() {
  const templates = getDefaultTemplates('deployment');
  const examples = getDefaultExamples('deployment');

  return (
    <ResourceForm
      resourceType="deployment"
      resourceKind="Deployment"
      memberClusterName="member-cluster-1"
      mode="create"
      fields={fields}
      templates={templates}
      examples={examples}
      enableTemplates={true}
      enableExamples={true}
      enableYAMLEditor={true}
      enableProgressIndicator={true}
      enableUnsavedChangesWarning={true}
      customValidation={async (values) => {
        // Custom validation logic
        const errors: Record<string, string> = {};
        if (values.spec.replicas > 100) {
          errors['spec.replicas'] = 'Too many replicas for this cluster';
        }
        return errors;
      }}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      onTemplateSelect={(template) => {
        console.log('Template selected:', template.name);
      }}
      onExampleSelect={(example) => {
        console.log('Example selected:', example.name);
      }}
    />
  );
}
```

### Custom Field Rendering

```tsx
const fields = [
  {
    key: 'spec.ports',
    label: 'Ports',
    type: 'custom',
    required: true,
    render: (value, onChange) => (
      <PortEditor
        value={value || []}
        onChange={onChange}
        showName={true}
        showTargetPort={true}
      />
    ),
  },
  {
    key: 'metadata.labels',
    label: 'Labels',
    type: 'custom',
    render: (value, onChange) => (
      <KeyValueEditor
        value={value || {}}
        onChange={onChange}
        placeholder={{ key: 'Label key', value: 'Label value' }}
        keyValidation={(key) => {
          if (!/^[a-zA-Z0-9]([-._a-zA-Z0-9]*[a-zA-Z0-9])?$/.test(key)) {
            return 'Invalid label key format';
          }
          return null;
        }}
      />
    ),
  },
];
```

## Props

### ResourceFormProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `resourceType` | `string` | - | The type of resource (e.g., 'deployment', 'service') |
| `resourceKind` | `string` | - | The Kubernetes kind (e.g., 'Deployment', 'Service') |
| `memberClusterName` | `string` | - | The target member cluster name |
| `mode` | `'create' \| 'edit'` | - | Form mode |
| `initialValues` | `Partial<T>` | - | Initial form values for edit mode |
| `fields` | `FormFieldConfig[]` | - | Form field configuration |
| `templates` | `ResourceTemplate[]` | `[]` | Available templates |
| `examples` | `ResourceExample[]` | `[]` | Available examples |
| `enableRealTimeValidation` | `boolean` | `true` | Enable real-time field validation |
| `enableTemplates` | `boolean` | `true` | Show templates feature |
| `enableExamples` | `boolean` | `true` | Show examples feature |
| `enableYAMLEditor` | `boolean` | `true` | Show YAML editor tab |
| `enableUnsavedChangesWarning` | `boolean` | `true` | Warn about unsaved changes |
| `enableProgressIndicator` | `boolean` | `true` | Show progress indicator |
| `enableAutoSave` | `boolean` | `false` | Enable auto-save (edit mode only) |
| `autoSaveInterval` | `number` | `30000` | Auto-save interval in milliseconds |
| `onSubmit` | `(values: T) => Promise<void>` | - | Form submission handler |
| `onCancel` | `() => void` | - | Cancel handler |
| `customValidation` | `(values: T) => Promise<Record<string, string>>` | - | Custom validation function |

### FormFieldConfig

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `key` | `string` | - | Field path (e.g., 'metadata.name', 'spec.replicas') |
| `label` | `string` | - | Field label |
| `type` | `'input' \| 'textarea' \| 'select' \| 'number' \| 'switch' \| 'tags' \| 'custom'` | - | Field type |
| `required` | `boolean` | `false` | Whether field is required |
| `placeholder` | `string` | - | Field placeholder text |
| `tooltip` | `string` | - | Help tooltip text |
| `options` | `Array<{label: string, value: string \| number}>` | - | Options for select fields |
| `validation` | `object` | - | Validation rules (pattern, min, max, message) |
| `render` | `function` | - | Custom render function for 'custom' type |
| `defaultValue` | `unknown` | - | Default field value |
| `disabled` | `boolean \| function` | `false` | Whether field is disabled |
| `visible` | `boolean \| function` | `true` | Whether field is visible |

## Hooks

### useResourceFormValidation

Provides validation utilities for form fields.

```tsx
const {
  validationErrors,
  validateField,
  validateForm,
  getFieldError,
  clearValidationErrors,
  setValidationError,
} = useResourceFormValidation();
```

### useResourceFormState

Manages form state including unsaved changes and auto-save.

```tsx
const {
  formData,
  hasUnsavedChanges,
  isDirty,
  autoSaveStatus,
  updateFormData,
  resetFormData,
  markAsSaved,
} = useResourceFormState(initialValues, enableAutoSave, autoSaveInterval);
```

### useResourceFormMutation

Handles form submission with React Query integration.

```tsx
const mutation = useResourceFormMutation(
  memberClusterName,
  resourceType,
  mode,
  mutationFunction,
  {
    onSuccess: (data, variables) => {
      // Handle success
    },
    onError: (error, variables) => {
      // Handle error
    },
  }
);
```

### useResourceTemplates

Manages resource templates.

```tsx
const {
  templates,
  selectedTemplate,
  applyTemplate,
  clearTemplate,
} = useResourceTemplates(resourceType);
```

### useResourceExamples

Manages resource examples.

```tsx
const {
  examples,
  selectedExample,
  applyExample,
  clearExample,
} = useResourceExamples(resourceType);
```

## Components

### YAMLEditor

A syntax-highlighted YAML editor with validation.

```tsx
<YAMLEditor
  value={yamlContent}
  onChange={setYamlContent}
  height="400px"
  readOnly={false}
  showLineNumbers={true}
  theme="light"
/>
```

### KeyValueEditor

An editor for key-value pairs (labels, annotations, etc.).

```tsx
<KeyValueEditor
  value={labels}
  onChange={setLabels}
  placeholder={{ key: 'Key', value: 'Value' }}
  keyValidation={(key) => validateLabelKey(key)}
  valueValidation={(value) => validateLabelValue(value)}
/>
```

### PortEditor

An editor for service ports configuration.

```tsx
<PortEditor
  value={ports}
  onChange={setPorts}
  showName={true}
  showTargetPort={true}
/>
```

### ResourceRequirementsEditor

An editor for CPU and memory resource requirements.

```tsx
<ResourceRequirementsEditor
  value={resources}
  onChange={setResources}
/>
```

### EnvVarEditor

An editor for environment variables.

```tsx
<EnvVarEditor
  value={envVars}
  onChange={setEnvVars}
/>
```

## Templates and Examples

### Creating Templates

Templates provide pre-configured starting points for resources:

```tsx
const template: ResourceTemplate = {
  name: 'Production Web App',
  description: 'Production-ready web application with best practices',
  category: 'Production',
  recommended: true,
  data: {
    metadata: {
      name: '',
      namespace: 'production',
      labels: {
        environment: 'production',
        tier: 'frontend',
      },
    },
    spec: {
      replicas: 3,
      // ... more configuration
    },
  },
};
```

### Creating Examples

Examples show real-world YAML configurations:

```tsx
const example: ResourceExample = {
  name: 'Simple Nginx Deployment',
  description: 'A basic nginx deployment with 3 replicas',
  category: 'Web Server',
  complexity: 'basic',
  yaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.14.2
        ports:
        - containerPort: 80`,
};
```

## Validation

The ResourceForm includes comprehensive validation:

### Built-in Validation
- **Kubernetes naming conventions**: Names must be lowercase alphanumeric with hyphens
- **Required fields**: Validates required fields are not empty
- **Port ranges**: Validates ports are between 1-65535
- **Resource limits**: Validates CPU and memory formats
- **Label formats**: Validates label key/value formats

### Custom Validation
You can provide custom validation functions:

```tsx
const customValidation = async (values: ResourceFormData) => {
  const errors: Record<string, string> = {};
  
  // Custom business logic validation
  if (values.spec.replicas > getMaxReplicasForCluster(memberClusterName)) {
    errors['spec.replicas'] = 'Exceeds cluster capacity';
  }
  
  // Async validation (e.g., check if name is unique)
  const nameExists = await checkResourceNameExists(values.metadata.name);
  if (nameExists) {
    errors['metadata.name'] = 'Resource name already exists';
  }
  
  return errors;
};
```

## Styling and Theming

The ResourceForm follows the dashboard's design system:

- Uses Ant Design components for consistency
- Responsive design with mobile support
- Dark/light theme support
- Customizable through CSS classes and Ant Design theme variables

## Accessibility

The component includes comprehensive accessibility features:

- Full keyboard navigation
- Screen reader support with proper ARIA labels
- High contrast mode support
- Focus management and visual indicators

## Performance

The ResourceForm is optimized for performance:

- Lazy loading of templates and examples
- Debounced validation to reduce API calls
- Memoized components to prevent unnecessary re-renders
- Efficient form state management

## Testing

The component includes comprehensive test coverage:

- Unit tests for all hooks and utilities
- Integration tests for form workflows
- Property-based tests for validation logic
- Accessibility tests for keyboard navigation and screen readers

## Migration Guide

When migrating from existing form components:

1. **Replace form fields**: Convert existing form fields to `FormFieldConfig` format
2. **Update validation**: Move validation logic to the new validation system
3. **Add templates**: Create templates for common configurations
4. **Update styling**: Ensure custom styles work with the new component structure

## Contributing

When contributing to the ResourceForm component:

1. Follow the existing code patterns and TypeScript interfaces
2. Add comprehensive tests for new features
3. Update documentation for any API changes
4. Ensure accessibility standards are maintained
5. Test with multiple resource types to ensure genericity