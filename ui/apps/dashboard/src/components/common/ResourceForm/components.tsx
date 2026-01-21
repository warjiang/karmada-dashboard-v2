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

import React, { useState, useCallback, useMemo } from 'react';
import {
  Input,
  Select,
  Button,
  Space,
  Tag,
  Card,
  Row,
  Col,
  Typography,
  Form,
  InputNumber,
  Switch,
  Tooltip,
  Popover,
  Alert,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  MinusOutlined,
  QuestionCircleOutlined,
  CodeOutlined,
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  CopyOutlined,
} from '@ant-design/icons';

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// YAML Editor Component
interface YAMLEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  readOnly?: boolean;
  showLineNumbers?: boolean;
  theme?: 'light' | 'dark';
}

export const YAMLEditor: React.FC<YAMLEditorProps> = ({
  value,
  onChange,
  height = '400px',
  readOnly = false,
  showLineNumbers = true,
  theme = 'light',
}) => {
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string>('');

  const handleChange = useCallback((newValue: string) => {
    try {
      // Basic YAML validation (in real implementation, use yaml library)
      JSON.parse(newValue);
      setIsValid(true);
      setError('');
      onChange(newValue);
    } catch (err) {
      setIsValid(false);
      setError(err instanceof Error ? err.message : 'Invalid YAML format');
      onChange(newValue); // Still update the value for editing
    }
  }, [onChange]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
  }, [value]);

  return (
    <div className="yaml-editor">
      {/* Editor Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
          <CodeOutlined />
          <Text strong>YAML Configuration</Text>
          {!isValid && (
            <Tag color="error" icon={<CloseOutlined />}>
              Invalid
            </Tag>
          )}
          {isValid && (
            <Tag color="success" icon={<CheckOutlined />}>
              Valid
            </Tag>
          )}
        </div>
        <Space>
          <Tooltip title="Copy YAML">
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy} />
          </Tooltip>
        </Space>
      </div>

      {/* Error Display */}
      {!isValid && error && (
        <Alert
          message="YAML Syntax Error"
          description={error}
          type="error"
          showIcon
          className="mb-2"
        />
      )}

      {/* Editor */}
      <div
        className={`yaml-editor-container ${theme === 'dark' ? 'dark' : 'light'}`}
        style={{ height }}
      >
        <TextArea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          style={{
            height: '100%',
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            fontSize: '12px',
            lineHeight: '1.4',
            resize: 'none',
          }}
          placeholder="Enter YAML configuration..."
          readOnly={readOnly}
        />
      </div>

      {/* Line count and character count */}
      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
        <span>{value.split('\n').length} lines</span>
        <span>{value.length} characters</span>
      </div>
    </div>
  );
};

// Key-Value Pairs Editor Component
interface KeyValuePair {
  key: string;
  value: string;
}

interface KeyValueEditorProps {
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  placeholder?: {
    key: string;
    value: string;
  };
  keyValidation?: (key: string) => string | null;
  valueValidation?: (value: string) => string | null;
  allowEmpty?: boolean;
}

export const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
  value = {},
  onChange,
  placeholder = { key: 'Key', value: 'Value' },
  keyValidation,
  valueValidation,
  allowEmpty = true,
}) => {
  const [pairs, setPairs] = useState<KeyValuePair[]>(() => {
    const initialPairs = Object.entries(value).map(([key, val]) => ({ key, value: val }));
    return initialPairs.length > 0 ? initialPairs : [{ key: '', value: '' }];
  });

  const updatePairs = useCallback((newPairs: KeyValuePair[]) => {
    setPairs(newPairs);
    
    // Convert back to object, filtering out empty pairs if not allowed
    const newValue: Record<string, string> = {};
    newPairs.forEach(({ key, value: val }) => {
      if (key.trim() && (allowEmpty || val.trim())) {
        newValue[key.trim()] = val;
      }
    });
    
    onChange(newValue);
  }, [onChange, allowEmpty]);

  const addPair = useCallback(() => {
    updatePairs([...pairs, { key: '', value: '' }]);
  }, [pairs, updatePairs]);

  const removePair = useCallback((index: number) => {
    const newPairs = pairs.filter((_, i) => i !== index);
    updatePairs(newPairs.length > 0 ? newPairs : [{ key: '', value: '' }]);
  }, [pairs, updatePairs]);

  const updatePair = useCallback((index: number, field: 'key' | 'value', newValue: string) => {
    const newPairs = [...pairs];
    newPairs[index] = { ...newPairs[index], [field]: newValue };
    updatePairs(newPairs);
  }, [pairs, updatePairs]);

  return (
    <div className="key-value-editor space-y-2">
      {pairs.map((pair, index) => (
        <Row key={index} gutter={8} align="middle">
          <Col flex="1">
            <Input
              placeholder={placeholder.key}
              value={pair.key}
              onChange={(e) => updatePair(index, 'key', e.target.value)}
              status={keyValidation && keyValidation(pair.key) ? 'error' : ''}
            />
          </Col>
          <Col flex="1">
            <Input
              placeholder={placeholder.value}
              value={pair.value}
              onChange={(e) => updatePair(index, 'value', e.target.value)}
              status={valueValidation && valueValidation(pair.value) ? 'error' : ''}
            />
          </Col>
          <Col>
            <Space>
              {index === pairs.length - 1 && (
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={addPair}
                />
              )}
              {pairs.length > 1 && (
                <Button
                  type="text"
                  size="small"
                  icon={<MinusOutlined />}
                  onClick={() => removePair(index)}
                  danger
                />
              )}
            </Space>
          </Col>
        </Row>
      ))}
    </div>
  );
};

// Port Configuration Component
interface Port {
  name?: string;
  port: number;
  targetPort: number | string;
  protocol: string;
}

interface PortEditorProps {
  value: Port[];
  onChange: (value: Port[]) => void;
  showName?: boolean;
  showTargetPort?: boolean;
}

export const PortEditor: React.FC<PortEditorProps> = ({
  value = [],
  onChange,
  showName = true,
  showTargetPort = true,
}) => {
  const [ports, setPorts] = useState<Port[]>(() => 
    value.length > 0 ? value : [{ port: 80, targetPort: 8080, protocol: 'TCP' }]
  );

  const updatePorts = useCallback((newPorts: Port[]) => {
    setPorts(newPorts);
    onChange(newPorts.filter(port => port.port > 0));
  }, [onChange]);

  const addPort = useCallback(() => {
    updatePorts([...ports, { port: 80, targetPort: 8080, protocol: 'TCP' }]);
  }, [ports, updatePorts]);

  const removePort = useCallback((index: number) => {
    const newPorts = ports.filter((_, i) => i !== index);
    updatePorts(newPorts.length > 0 ? newPorts : [{ port: 80, targetPort: 8080, protocol: 'TCP' }]);
  }, [ports, updatePorts]);

  const updatePort = useCallback((index: number, field: keyof Port, newValue: string | number) => {
    const newPorts = [...ports];
    newPorts[index] = { ...newPorts[index], [field]: newValue };
    updatePorts(newPorts);
  }, [ports, updatePorts]);

  return (
    <div className="port-editor space-y-2">
      {ports.map((port, index) => (
        <Card key={index} size="small" className="border-dashed">
          <Row gutter={8} align="middle">
            {showName && (
              <Col flex="1">
                <div>
                  <Text className="text-xs text-gray-500">Name</Text>
                  <Input
                    placeholder="Port name (optional)"
                    value={port.name || ''}
                    onChange={(e) => updatePort(index, 'name', e.target.value)}
                    size="small"
                  />
                </div>
              </Col>
            )}
            <Col flex="1">
              <div>
                <Text className="text-xs text-gray-500">Port *</Text>
                <InputNumber
                  placeholder="Port"
                  value={port.port}
                  onChange={(value) => updatePort(index, 'port', value || 0)}
                  min={1}
                  max={65535}
                  size="small"
                  style={{ width: '100%' }}
                />
              </div>
            </Col>
            {showTargetPort && (
              <Col flex="1">
                <div>
                  <Text className="text-xs text-gray-500">Target Port</Text>
                  <Input
                    placeholder="Target port"
                    value={port.targetPort}
                    onChange={(e) => updatePort(index, 'targetPort', 
                      isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value)
                    )}
                    size="small"
                  />
                </div>
              </Col>
            )}
            <Col flex="1">
              <div>
                <Text className="text-xs text-gray-500">Protocol</Text>
                <Select
                  value={port.protocol}
                  onChange={(value) => updatePort(index, 'protocol', value)}
                  size="small"
                  style={{ width: '100%' }}
                >
                  <Option value="TCP">TCP</Option>
                  <Option value="UDP">UDP</Option>
                  <Option value="SCTP">SCTP</Option>
                </Select>
              </div>
            </Col>
            <Col>
              <Space>
                {index === ports.length - 1 && (
                  <Button
                    type="dashed"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={addPort}
                  />
                )}
                {ports.length > 1 && (
                  <Button
                    type="text"
                    size="small"
                    icon={<MinusOutlined />}
                    onClick={() => removePort(index)}
                    danger
                  />
                )}
              </Space>
            </Col>
          </Row>
        </Card>
      ))}
    </div>
  );
};

// Resource Requirements Component
interface ResourceRequirements {
  requests?: {
    cpu?: string;
    memory?: string;
  };
  limits?: {
    cpu?: string;
    memory?: string;
  };
}

interface ResourceRequirementsEditorProps {
  value: ResourceRequirements;
  onChange: (value: ResourceRequirements) => void;
}

export const ResourceRequirementsEditor: React.FC<ResourceRequirementsEditorProps> = ({
  value = {},
  onChange,
}) => {
  const updateRequirements = useCallback((type: 'requests' | 'limits', resource: 'cpu' | 'memory', newValue: string) => {
    const updated = {
      ...value,
      [type]: {
        ...value[type],
        [resource]: newValue || undefined,
      },
    };
    
    // Clean up empty objects
    if (updated.requests && Object.keys(updated.requests).length === 0) {
      delete updated.requests;
    }
    if (updated.limits && Object.keys(updated.limits).length === 0) {
      delete updated.limits;
    }
    
    onChange(updated);
  }, [value, onChange]);

  return (
    <div className="resource-requirements-editor">
      <Row gutter={16}>
        <Col span={12}>
          <Card title="Requests" size="small">
            <div className="space-y-2">
              <div>
                <Text className="text-xs text-gray-500">CPU</Text>
                <Input
                  placeholder="e.g., 100m, 0.1"
                  value={value.requests?.cpu || ''}
                  onChange={(e) => updateRequirements('requests', 'cpu', e.target.value)}
                  size="small"
                  suffix={
                    <Tooltip title="CPU units: cores (e.g., 0.5) or millicores (e.g., 500m)">
                      <QuestionCircleOutlined />
                    </Tooltip>
                  }
                />
              </div>
              <div>
                <Text className="text-xs text-gray-500">Memory</Text>
                <Input
                  placeholder="e.g., 128Mi, 1Gi"
                  value={value.requests?.memory || ''}
                  onChange={(e) => updateRequirements('requests', 'memory', e.target.value)}
                  size="small"
                  suffix={
                    <Tooltip title="Memory units: bytes (e.g., 128Mi, 1Gi)">
                      <QuestionCircleOutlined />
                    </Tooltip>
                  }
                />
              </div>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Limits" size="small">
            <div className="space-y-2">
              <div>
                <Text className="text-xs text-gray-500">CPU</Text>
                <Input
                  placeholder="e.g., 500m, 1"
                  value={value.limits?.cpu || ''}
                  onChange={(e) => updateRequirements('limits', 'cpu', e.target.value)}
                  size="small"
                  suffix={
                    <Tooltip title="CPU units: cores (e.g., 1) or millicores (e.g., 1000m)">
                      <QuestionCircleOutlined />
                    </Tooltip>
                  }
                />
              </div>
              <div>
                <Text className="text-xs text-gray-500">Memory</Text>
                <Input
                  placeholder="e.g., 512Mi, 2Gi"
                  value={value.limits?.memory || ''}
                  onChange={(e) => updateRequirements('limits', 'memory', e.target.value)}
                  size="small"
                  suffix={
                    <Tooltip title="Memory units: bytes (e.g., 512Mi, 2Gi)">
                      <QuestionCircleOutlined />
                    </Tooltip>
                  }
                />
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// Environment Variables Component
interface EnvVar {
  name: string;
  value?: string;
  valueFrom?: {
    secretKeyRef?: {
      name: string;
      key: string;
    };
    configMapKeyRef?: {
      name: string;
      key: string;
    };
  };
}

interface EnvVarEditorProps {
  value: EnvVar[];
  onChange: (value: EnvVar[]) => void;
}

export const EnvVarEditor: React.FC<EnvVarEditorProps> = ({
  value = [],
  onChange,
}) => {
  const [envVars, setEnvVars] = useState<EnvVar[]>(() => 
    value.length > 0 ? value : [{ name: '', value: '' }]
  );

  const updateEnvVars = useCallback((newEnvVars: EnvVar[]) => {
    setEnvVars(newEnvVars);
    onChange(newEnvVars.filter(env => env.name.trim()));
  }, [onChange]);

  const addEnvVar = useCallback(() => {
    updateEnvVars([...envVars, { name: '', value: '' }]);
  }, [envVars, updateEnvVars]);

  const removeEnvVar = useCallback((index: number) => {
    const newEnvVars = envVars.filter((_, i) => i !== index);
    updateEnvVars(newEnvVars.length > 0 ? newEnvVars : [{ name: '', value: '' }]);
  }, [envVars, updateEnvVars]);

  const updateEnvVar = useCallback((index: number, updates: Partial<EnvVar>) => {
    const newEnvVars = [...envVars];
    newEnvVars[index] = { ...newEnvVars[index], ...updates };
    updateEnvVars(newEnvVars);
  }, [envVars, updateEnvVars]);

  return (
    <div className="env-var-editor space-y-2">
      {envVars.map((envVar, index) => (
        <Card key={index} size="small" className="border-dashed">
          <Row gutter={8} align="middle">
            <Col flex="1">
              <div>
                <Text className="text-xs text-gray-500">Name *</Text>
                <Input
                  placeholder="Environment variable name"
                  value={envVar.name}
                  onChange={(e) => updateEnvVar(index, { name: e.target.value })}
                  size="small"
                />
              </div>
            </Col>
            <Col flex="2">
              <div>
                <Text className="text-xs text-gray-500">Value</Text>
                <Input
                  placeholder="Environment variable value"
                  value={envVar.value || ''}
                  onChange={(e) => updateEnvVar(index, { value: e.target.value, valueFrom: undefined })}
                  size="small"
                />
              </div>
            </Col>
            <Col>
              <Space>
                {index === envVars.length - 1 && (
                  <Button
                    type="dashed"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={addEnvVar}
                  />
                )}
                {envVars.length > 1 && (
                  <Button
                    type="text"
                    size="small"
                    icon={<MinusOutlined />}
                    onClick={() => removeEnvVar(index)}
                    danger
                  />
                )}
              </Space>
            </Col>
          </Row>
        </Card>
      ))}
    </div>
  );
};

// Form Field Wrapper Component
interface FormFieldWrapperProps {
  label: string;
  tooltip?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

export const FormFieldWrapper: React.FC<FormFieldWrapperProps> = ({
  label,
  tooltip,
  required,
  error,
  children,
}) => {
  return (
    <div className="form-field-wrapper">
      <div className="flex items-center space-x-2 mb-2">
        <Text strong className={required ? 'text-red-500' : ''}>
          {label}
          {required && ' *'}
        </Text>
        {tooltip && (
          <Tooltip title={tooltip}>
            <QuestionCircleOutlined className="text-gray-400" />
          </Tooltip>
        )}
      </div>
      <div className={error ? 'border-red-300 rounded' : ''}>
        {children}
      </div>
      {error && (
        <Text type="danger" className="text-xs mt-1">
          {error}
        </Text>
      )}
    </div>
  );
};

export default {
  YAMLEditor,
  KeyValueEditor,
  PortEditor,
  ResourceRequirementsEditor,
  EnvVarEditor,
  FormFieldWrapper,
};