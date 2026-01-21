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

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Space,
  Card,
  Row,
  Col,
  Typography,
  Alert,
  Spin,
  Tabs,
  Modal,
  Tooltip,
  Progress,
  Divider,
  Switch,
  InputNumber,
  Tag,
  Collapse,
  notification,
  FormProps,
  TabsProps,
} from 'antd';
import {
  SaveOutlined,
  CloseOutlined,
  ReloadOutlined,
  QuestionCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  CodeOutlined,
  SettingOutlined,
  BulbOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BaseResource } from '../ResourceList';
import { ResourceMeta } from '@/services/base';
import i18nInstance from '@/utils/i18n';
import { useResourceFormValidation } from './hooks';
import { ResourceFormTemplates } from './templates';
import { ResourceFormExamples } from './examples.tsx';
import { YAMLEditor } from './components';
import { FormErrorDisplay, convertValidationErrorsToFormErrors, ErrorSeverity } from './FormErrorDisplay';

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;

// Form data interfaces
export interface ResourceFormData {
  metadata: {
    name: string;
    namespace: string;
    labels: Record<string, string>;
    annotations: Record<string, string>;
  };
  spec: Record<string, unknown>;
}

// Form field configuration interface
export interface FormFieldConfig {
  key: string;
  label: string;
  type: 'input' | 'textarea' | 'select' | 'number' | 'switch' | 'tags' | 'custom';
  required?: boolean;
  placeholder?: string;
  tooltip?: string;
  options?: Array<{ label: string; value: string | number }>;
  validation?: {
    pattern?: RegExp;
    min?: number;
    max?: number;
    message?: string;
  };
  dependencies?: string[];
  render?: (value: unknown, onChange: (value: unknown) => void, form: any) => React.ReactNode;
  defaultValue?: unknown;
  disabled?: boolean | ((formData: ResourceFormData) => boolean);
  visible?: boolean | ((formData: ResourceFormData) => boolean);
}

// Template configuration interface
export interface ResourceTemplate {
  name: string;
  description: string;
  category: string;
  data: Partial<ResourceFormData>;
  icon?: React.ReactNode;
  recommended?: boolean;
}

// Example configuration interface
export interface ResourceExample {
  name: string;
  description: string;
  yaml: string;
  category: string;
  complexity: 'basic' | 'intermediate' | 'advanced';
}

// Progress step interface
export interface FormProgressStep {
  key: string;
  title: string;
  description?: string;
  completed: boolean;
  error?: boolean;
}

// Resource form props interface
export interface ResourceFormProps<T extends ResourceFormData = ResourceFormData> {
  // Core configuration
  resourceType: string;
  resourceKind: string;
  memberClusterName: string;
  mode: 'create' | 'edit';
  
  // Data
  initialValues?: Partial<T>;
  
  // Form configuration
  fields: FormFieldConfig[];
  templates?: ResourceTemplate[];
  examples?: ResourceExample[];
  
  // Validation
  enableRealTimeValidation?: boolean;
  customValidation?: (values: T) => Promise<Record<string, string>>;
  
  // Features
  enableTemplates?: boolean;
  enableExamples?: boolean;
  enableYAMLEditor?: boolean;
  enableUnsavedChangesWarning?: boolean;
  enableProgressIndicator?: boolean;
  enableAutoSave?: boolean;
  autoSaveInterval?: number;
  
  // Callbacks
  onSubmit: (values: T) => Promise<void>;
  onCancel: () => void;
  onValuesChange?: (changedValues: Partial<T>, allValues: T) => void;
  onTemplateSelect?: (template: ResourceTemplate) => void;
  onExampleSelect?: (example: ResourceExample) => void;
  
  // Styling
  className?: string;
  width?: number | string;
  layout?: 'horizontal' | 'vertical';
  
  // Advanced
  customActions?: React.ReactNode;
  helpContent?: React.ReactNode;
  footerContent?: React.ReactNode;
}

// Main ResourceForm component
export function ResourceForm<T extends ResourceFormData = ResourceFormData>({
  resourceType,
  resourceKind,
  memberClusterName,
  mode,
  initialValues,
  fields,
  templates = [],
  examples = [],
  enableRealTimeValidation = true,
  customValidation,
  enableTemplates = true,
  enableExamples = true,
  enableYAMLEditor = true,
  enableUnsavedChangesWarning = true,
  enableProgressIndicator = true,
  enableAutoSave = false,
  autoSaveInterval = 30000,
  onSubmit,
  onCancel,
  onValuesChange,
  onTemplateSelect,
  onExampleSelect,
  className = '',
  width = '100%',
  layout = 'vertical',
  customActions,
  helpContent,
  footerContent,
}: ResourceFormProps<T>) {
  // Form instance
  const [form] = Form.useForm<T>();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('form');
  const [yamlContent, setYamlContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [progressSteps, setProgressSteps] = useState<FormProgressStep[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Query client for cache management
  const queryClient = useQueryClient();

  // Custom hooks
  const { validateField, validateForm, getFieldError, getFieldValidationRules } = useResourceFormValidation(resourceType);

  // Initialize form values
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
      setYamlContent(convertFormDataToYAML(initialValues));
      updateProgressSteps(initialValues);
    }
  }, [initialValues, form]);

  // Auto-save functionality
  useEffect(() => {
    if (!enableAutoSave || mode !== 'edit') return;

    const interval = setInterval(async () => {
      if (hasUnsavedChanges) {
        try {
          setAutoSaveStatus('saving');
          const values = form.getFieldsValue();
          // Auto-save logic would go here
          setAutoSaveStatus('saved');
          setTimeout(() => setAutoSaveStatus('idle'), 2000);
        } catch (error) {
          setAutoSaveStatus('error');
          console.error('Auto-save failed:', error);
        }
      }
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [enableAutoSave, hasUnsavedChanges, autoSaveInterval, form, mode]);

  // Unsaved changes warning
  useEffect(() => {
    if (!enableUnsavedChangesWarning) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, enableUnsavedChangesWarning]);

  // Form submission with enhanced validation
  const handleSubmit = useCallback(async (values: T) => {
    setLoading(true);
    try {
      // Run comprehensive form validation first
      const formValidationErrors = await validateForm(values);
      if (Object.keys(formValidationErrors).length > 0) {
        setValidationErrors(formValidationErrors);
        notification.error({
          message: 'Validation Failed',
          description: `Please fix ${Object.keys(formValidationErrors).length} validation error(s) and try again.`,
          duration: 5,
        });
        return;
      }

      // Run custom validation if provided
      if (customValidation) {
        const customErrors = await customValidation(values);
        if (Object.keys(customErrors).length > 0) {
          setValidationErrors(customErrors);
          notification.error({
            message: 'Custom Validation Failed',
            description: 'Please fix the validation errors and try again.',
            duration: 5,
          });
          return;
        }
      }

      // Clear any existing validation errors
      setValidationErrors({});

      // Submit the form
      await onSubmit(values);
      setHasUnsavedChanges(false);
      
      notification.success({
        message: `${resourceKind} ${mode === 'create' ? 'Created' : 'Updated'}`,
        description: `Successfully ${mode === 'create' ? 'created' : 'updated'} ${resourceKind} ${values.metadata.name}`,
        duration: 4,
      });
    } catch (error) {
      console.error(`Failed to ${mode} ${resourceKind}:`, error);
      
      // Enhanced error handling with specific error types
      let errorMessage = 'An unexpected error occurred';
      let errorDescription = '';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide specific guidance based on error type
        if (error.message.includes('already exists')) {
          errorDescription = `A ${resourceKind} with this name already exists in the namespace. Please choose a different name.`;
        } else if (error.message.includes('insufficient permissions')) {
          errorDescription = 'You do not have permission to perform this action. Please contact your administrator.';
        } else if (error.message.includes('quota exceeded')) {
          errorDescription = 'Resource quota exceeded. Please check your namespace limits or contact your administrator.';
        } else if (error.message.includes('invalid')) {
          errorDescription = 'The resource configuration is invalid. Please check all fields and try again.';
        } else {
          errorDescription = 'Please check your configuration and try again. If the problem persists, contact support.';
        }
      }
      
      notification.error({
        message: `Failed to ${mode === 'create' ? 'Create' : 'Update'} ${resourceKind}`,
        description: errorDescription || errorMessage,
        duration: 8,
      });
      
      // Set form-level error for display
      setValidationErrors({
        form: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }, [customValidation, onSubmit, resourceKind, mode, validateForm]);

  // Form values change handler with enhanced real-time validation
  const handleValuesChange = useCallback((changedValues: Partial<T>, allValues: T) => {
    setHasUnsavedChanges(true);
    setYamlContent(convertFormDataToYAML(allValues));
    updateProgressSteps(allValues);
    
    // Enhanced real-time validation
    if (enableRealTimeValidation) {
      const validateChangedFields = async () => {
        const newErrors = { ...validationErrors };
        
        // Validate each changed field
        for (const [fieldPath, value] of Object.entries(changedValues)) {
          try {
            const error = await validateField(fieldPath, value, allValues);
            if (error) {
              newErrors[fieldPath] = error;
            } else {
              // Clear error if validation passes
              delete newErrors[fieldPath];
            }
          } catch (validationError) {
            console.error(`Validation error for field ${fieldPath}:`, validationError);
            newErrors[fieldPath] = validationError instanceof Error 
              ? validationError.message 
              : 'Validation failed';
          }
        }
        
        // Also validate dependent fields (e.g., if selector labels change, validate template labels)
        const changedFieldPaths = Object.keys(changedValues);
        if (changedFieldPaths.some(path => path.includes('selector')) && resourceType === 'deployment') {
          try {
            const templateLabelsError = await validateField(
              'spec.template.metadata.labels', 
              allValues.spec?.template?.metadata?.labels, 
              allValues
            );
            if (templateLabelsError) {
              newErrors['spec.template.metadata.labels'] = templateLabelsError;
            } else {
              delete newErrors['spec.template.metadata.labels'];
            }
          } catch (error) {
            console.error('Error validating template labels:', error);
          }
        }
        
        setValidationErrors(newErrors);
      };
      
      // Debounce validation to avoid excessive API calls
      const timeoutId = setTimeout(validateChangedFields, 300);
      return () => clearTimeout(timeoutId);
    }

    onValuesChange?.(changedValues, allValues);
  }, [enableRealTimeValidation, validateField, onValuesChange, validationErrors, resourceType]);

  // Template selection handler
  const handleTemplateSelect = useCallback((template: ResourceTemplate) => {
    Modal.confirm({
      title: 'Apply Template',
      content: `This will replace your current form data with the "${template.name}" template. Are you sure?`,
      onOk: () => {
        form.setFieldsValue(template.data as T);
        setYamlContent(convertFormDataToYAML(template.data as T));
        setHasUnsavedChanges(true);
        setShowTemplates(false);
        onTemplateSelect?.(template);
        
        notification.success({
          message: 'Template Applied',
          description: `Successfully applied the "${template.name}" template.`,
        });
      },
    });
  }, [form, onTemplateSelect]);

  // Example selection handler
  const handleExampleSelect = useCallback((example: ResourceExample) => {
    Modal.confirm({
      title: 'Load Example',
      content: `This will replace your current form data with the "${example.name}" example. Are you sure?`,
      onOk: () => {
        try {
          const parsedData = convertYAMLToFormData(example.yaml);
          form.setFieldsValue(parsedData as T);
          setYamlContent(example.yaml);
          setHasUnsavedChanges(true);
          setShowExamples(false);
          onExampleSelect?.(example);
          
          notification.success({
            message: 'Example Loaded',
            description: `Successfully loaded the "${example.name}" example.`,
          });
        } catch (error) {
          notification.error({
            message: 'Failed to Load Example',
            description: 'The example YAML could not be parsed.',
          });
        }
      },
    });
  }, [form, onExampleSelect]);

  // Cancel handler with unsaved changes warning
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges && enableUnsavedChangesWarning) {
      Modal.confirm({
        title: 'Unsaved Changes',
        content: 'You have unsaved changes. Are you sure you want to cancel?',
        icon: <ExclamationCircleOutlined />,
        onOk: onCancel,
      });
    } else {
      onCancel();
    }
  }, [hasUnsavedChanges, enableUnsavedChangesWarning, onCancel]);

  // YAML editor sync
  const handleYAMLChange = useCallback((yaml: string) => {
    try {
      const formData = convertYAMLToFormData(yaml);
      form.setFieldsValue(formData as T);
      setYamlContent(yaml);
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Failed to parse YAML:', error);
    }
  }, [form]);

  // Progress steps calculation
  const updateProgressSteps = useCallback((values: Partial<T>) => {
    const steps: FormProgressStep[] = [
      {
        key: 'metadata',
        title: 'Basic Information',
        description: 'Name, namespace, and labels',
        completed: !!(values.metadata?.name && values.metadata?.namespace),
      },
      {
        key: 'spec',
        title: 'Configuration',
        description: 'Resource-specific settings',
        completed: !!values.spec && Object.keys(values.spec).length > 0,
      },
      {
        key: 'validation',
        title: 'Validation',
        description: 'Form validation checks',
        completed: Object.keys(validationErrors).length === 0,
        error: Object.keys(validationErrors).length > 0,
      },
    ];
    setProgressSteps(steps);
  }, [validationErrors]);

  // Render form fields
  const renderFormFields = useCallback(() => {
    return fields.map((field) => {
      const isVisible = typeof field.visible === 'function' 
        ? field.visible(form.getFieldsValue())
        : field.visible !== false;
      
      if (!isVisible) return null;

      const isDisabled = typeof field.disabled === 'function'
        ? field.disabled(form.getFieldsValue())
        : field.disabled;

      const fieldError = getFieldError(field.key, validationErrors);
      
      // Get comprehensive validation rules for this field
      const validationRules = getFieldValidationRules(field.key);

      return (
        <Form.Item
          key={field.key}
          name={field.key.split('.')}
          label={
            <Space>
              {field.label}
              {field.tooltip && (
                <Tooltip title={field.tooltip}>
                  <QuestionCircleOutlined />
                </Tooltip>
              )}
            </Space>
          }
          rules={[
            // Use comprehensive validation rules
            ...validationRules,
            // Add any field-specific validation from field config
            ...(field.validation ? [{
              pattern: field.validation.pattern,
              min: field.validation.min,
              max: field.validation.max,
              message: field.validation.message,
            }].filter(rule => Object.keys(rule).length > 0) : []),
          ]}
          validateStatus={fieldError ? 'error' : ''}
          help={fieldError}
        >
          {renderFormField(field, isDisabled)}
        </Form.Item>
      );
    });
  }, [fields, form, validationErrors, getFieldError, getFieldValidationRules]);

  // Render individual form field
  const renderFormField = useCallback((field: FormFieldConfig, disabled?: boolean) => {
    switch (field.type) {
      case 'input':
        return (
          <Input
            placeholder={field.placeholder}
            disabled={disabled}
          />
        );
      case 'textarea':
        return (
          <TextArea
            placeholder={field.placeholder}
            disabled={disabled}
            rows={4}
          />
        );
      case 'select':
        return (
          <Select
            placeholder={field.placeholder}
            disabled={disabled}
            showSearch
            optionFilterProp="children"
          >
            {field.options?.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        );
      case 'number':
        return (
          <InputNumber
            placeholder={field.placeholder}
            disabled={disabled}
            min={field.validation?.min}
            max={field.validation?.max}
            style={{ width: '100%' }}
          />
        );
      case 'switch':
        return (
          <Switch disabled={disabled} />
        );
      case 'custom':
        return field.render?.(
          form.getFieldValue(field.key.split('.')),
          (value) => form.setFieldValue(field.key.split('.'), value),
          form
        );
      default:
        return (
          <Input
            placeholder={field.placeholder}
            disabled={disabled}
          />
        );
    }
  }, [form]);

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    const completedSteps = progressSteps.filter(step => step.completed).length;
    return progressSteps.length > 0 ? (completedSteps / progressSteps.length) * 100 : 0;
  }, [progressSteps]);

  // Tab items
  const tabItems: TabsProps['items'] = [
    {
      key: 'form',
      label: (
        <Space>
          <SettingOutlined />
          Form
        </Space>
      ),
      children: (
        <div className="space-y-4">
          {renderFormFields()}
        </div>
      ),
    },
    ...(enableYAMLEditor ? [{
      key: 'yaml',
      label: (
        <Space>
          <CodeOutlined />
          YAML
        </Space>
      ),
      children: (
        <YAMLEditor
          value={yamlContent}
          onChange={handleYAMLChange}
          height="500px"
        />
      ),
    }] : []),
  ];

  return (
    <div className={`resource-form ${className}`} style={{ width }}>
      {/* Header */}
      <Card className="mb-4">
        <Row justify="space-between" align="middle">
          <Col>
            <Space direction="vertical" size={0}>
              <Title level={4} className="mb-0">
                {mode === 'create' ? `Create ${resourceKind}` : `Edit ${resourceKind}`}
              </Title>
              <Text type="secondary">
                {mode === 'create' 
                  ? `Create a new ${resourceKind} in ${memberClusterName}`
                  : `Edit ${resourceKind} in ${memberClusterName}`
                }
              </Text>
            </Space>
          </Col>
          <Col>
            <Space>
              {enableAutoSave && mode === 'edit' && (
                <div className="flex items-center space-x-2">
                  <Text type="secondary" className="text-xs">
                    {autoSaveStatus === 'saving' && 'Saving...'}
                    {autoSaveStatus === 'saved' && 'Saved'}
                    {autoSaveStatus === 'error' && 'Save failed'}
                  </Text>
                </div>
              )}
              {customActions}
            </Space>
          </Col>
        </Row>

        {/* Progress Indicator */}
        {enableProgressIndicator && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <Text strong>Progress</Text>
              <Text type="secondary">{Math.round(completionPercentage)}% complete</Text>
            </div>
            <Progress
              percent={completionPercentage}
              status={progressSteps.some(step => step.error) ? 'exception' : 'active'}
              showInfo={false}
            />
            <div className="flex justify-between mt-2">
              {progressSteps.map(step => (
                <div key={step.key} className="flex items-center space-x-1">
                  {step.completed ? (
                    <CheckCircleOutlined className="text-green-500" />
                  ) : step.error ? (
                    <ExclamationCircleOutlined className="text-red-500" />
                  ) : (
                    <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                  )}
                  <Text
                    className={`text-xs ${
                      step.completed ? 'text-green-600' : 
                      step.error ? 'text-red-600' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </Text>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <Card className="mb-4">
        <Row gutter={[16, 16]}>
          {enableTemplates && templates.length > 0 && (
            <Col>
              <Button
                icon={<FileTextOutlined />}
                onClick={() => setShowTemplates(true)}
              >
                Templates
              </Button>
            </Col>
          )}
          {enableExamples && examples.length > 0 && (
            <Col>
              <Button
                icon={<BulbOutlined />}
                onClick={() => setShowExamples(true)}
              >
                Examples
              </Button>
            </Col>
          )}
          <Col>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                form.resetFields();
                setHasUnsavedChanges(false);
                setValidationErrors({});
              }}
            >
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Enhanced Validation Errors Display */}
      {Object.keys(validationErrors).length > 0 && (
        <FormErrorDisplay
          errors={convertValidationErrorsToFormErrors(validationErrors, resourceType)}
          showSuggestions={true}
          showDocumentationLinks={true}
          collapsible={Object.keys(validationErrors).length > 3}
          onDismiss={(error) => {
            setValidationErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors[error.field];
              return newErrors;
            });
          }}
          onFixSuggestion={(error) => {
            // Auto-fix suggestions could be implemented here
            notification.info({
              message: 'Auto-fix Suggestion',
              description: `Suggestion for ${error.field}: ${error.suggestion}`,
            });
          }}
          className="mb-4"
        />
      )}

      {/* Main Form */}
      <Card>
        <Form
          form={form}
          layout={layout}
          onFinish={handleSubmit}
          onValuesChange={handleValuesChange}
          initialValues={initialValues}
          scrollToFirstError
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
          />

          {/* Help Content */}
          {helpContent && (
            <Collapse className="mt-4">
              <Panel header="Help & Documentation" key="help">
                {helpContent}
              </Panel>
            </Collapse>
          )}

          {/* Form Actions */}
          <Divider />
          <Row justify="space-between" align="middle">
            <Col>
              {hasUnsavedChanges && (
                <Space>
                  <WarningOutlined className="text-orange-500" />
                  <Text type="secondary">You have unsaved changes</Text>
                </Space>
              )}
            </Col>
            <Col>
              <Space>
                <Button onClick={handleCancel}>
                  <CloseOutlined />
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SaveOutlined />}
                >
                  {mode === 'create' ? 'Create' : 'Update'}
                </Button>
              </Space>
            </Col>
          </Row>

          {/* Footer Content */}
          {footerContent && (
            <>
              <Divider />
              {footerContent}
            </>
          )}
        </Form>
      </Card>

      {/* Templates Modal */}
      <ResourceFormTemplates
        open={showTemplates}
        templates={templates}
        onSelect={handleTemplateSelect}
        onClose={() => setShowTemplates(false)}
      />

      {/* Examples Modal */}
      <ResourceFormExamples
        open={showExamples}
        examples={examples}
        onSelect={handleExampleSelect}
        onClose={() => setShowExamples(false)}
      />
    </div>
  );
}

// Utility functions
function convertFormDataToYAML(data: unknown): string {
  try {
    // In a real implementation, this would use a YAML library
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Failed to convert form data to YAML:', error);
    return '';
  }
}

function convertYAMLToFormData(yaml: string): unknown {
  try {
    // In a real implementation, this would use a YAML library
    return JSON.parse(yaml);
  } catch (error) {
    console.error('Failed to convert YAML to form data:', error);
    throw new Error('Invalid YAML format');
  }
}

export default ResourceForm;