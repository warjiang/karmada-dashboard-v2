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

import React, { useState, useMemo } from 'react';
import {
  Modal,
  Card,
  Row,
  Col,
  Typography,
  Input,
  Select,
  Space,
  Tag,
  Button,
  Empty,
  Tooltip,
  Badge,
} from 'antd';
import {
  SearchOutlined,
  StarOutlined,
  StarFilled,
  FileTextOutlined,
  RocketOutlined,
  SettingOutlined,
  DatabaseOutlined,
  CloudOutlined,
  SecurityScanOutlined,
} from '@ant-design/icons';
import { ResourceTemplate } from './index';

const { Text, Title } = Typography;
const { Search } = Input;
const { Option } = Select;

// Template category icons
const categoryIcons: Record<string, React.ReactNode> = {
  Basic: <FileTextOutlined />,
  Advanced: <RocketOutlined />,
  Production: <SettingOutlined />,
  Database: <DatabaseOutlined />,
  Networking: <CloudOutlined />,
  Security: <SecurityScanOutlined />,
};

// Template complexity colors
const complexityColors: Record<string, string> = {
  basic: 'green',
  intermediate: 'orange',
  advanced: 'red',
};

interface ResourceFormTemplatesProps {
  open: boolean;
  templates: ResourceTemplate[];
  onSelect: (template: ResourceTemplate) => void;
  onClose: () => void;
}

export const ResourceFormTemplates: React.FC<ResourceFormTemplatesProps> = ({
  open,
  templates,
  onSelect,
  onClose,
}) => {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showRecommendedOnly, setShowRecommendedOnly] = useState(false);

  // Filter templates based on search and filters
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = !searchText || 
        template.name.toLowerCase().includes(searchText.toLowerCase()) ||
        template.description.toLowerCase().includes(searchText.toLowerCase());
      
      const matchesCategory = !selectedCategory || template.category === selectedCategory;
      
      const matchesRecommended = !showRecommendedOnly || template.recommended;

      return matchesSearch && matchesCategory && matchesRecommended;
    });
  }, [templates, searchText, selectedCategory, showRecommendedOnly]);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(templates.map(t => t.category))];
    return uniqueCategories.sort();
  }, [templates]);

  // Group templates by category
  const templatesByCategory = useMemo(() => {
    const grouped: Record<string, ResourceTemplate[]> = {};
    filteredTemplates.forEach(template => {
      if (!grouped[template.category]) {
        grouped[template.category] = [];
      }
      grouped[template.category].push(template);
    });
    return grouped;
  }, [filteredTemplates]);

  const handleTemplateSelect = (template: ResourceTemplate) => {
    onSelect(template);
    onClose();
  };

  const renderTemplateCard = (template: ResourceTemplate) => (
    <Card
      key={template.name}
      hoverable
      className="h-full cursor-pointer transition-all duration-200 hover:shadow-lg"
      onClick={() => handleTemplateSelect(template)}
      actions={[
        <Button type="link" size="small">
          Use Template
        </Button>,
      ]}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            {categoryIcons[template.category] || <FileTextOutlined />}
            <Title level={5} className="mb-0">
              {template.name}
            </Title>
          </div>
          {template.recommended && (
            <Tooltip title="Recommended template">
              <StarFilled className="text-yellow-500" />
            </Tooltip>
          )}
        </div>

        {/* Description */}
        <Text type="secondary" className="text-sm">
          {template.description}
        </Text>

        {/* Category and badges */}
        <div className="flex items-center justify-between">
          <Tag color="blue">{template.category}</Tag>
          {template.recommended && (
            <Badge count="Recommended" style={{ backgroundColor: '#52c41a' }} />
          )}
        </div>

        {/* Preview of template data */}
        <div className="bg-gray-50 p-2 rounded text-xs">
          <Text type="secondary">
            Preview: {Object.keys(template.data).join(', ')}
          </Text>
        </div>
      </div>
    </Card>
  );

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <FileTextOutlined />
          <span>Resource Templates</span>
          <Badge count={filteredTemplates.length} style={{ backgroundColor: '#1890ff' }} />
        </div>
      }
      open={open}
      onCancel={onClose}
      width={1000}
      footer={null}
      className="resource-templates-modal"
    >
      <div className="space-y-4">
        {/* Filters */}
        <Card size="small">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="Search templates..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="Filter by category"
                value={selectedCategory}
                onChange={setSelectedCategory}
                allowClear
                className="w-full"
              >
                {categories.map(category => (
                  <Option key={category} value={category}>
                    <Space>
                      {categoryIcons[category]}
                      {category}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={24} md={8}>
              <Button
                type={showRecommendedOnly ? 'primary' : 'default'}
                icon={showRecommendedOnly ? <StarFilled /> : <StarOutlined />}
                onClick={() => setShowRecommendedOnly(!showRecommendedOnly)}
              >
                Recommended Only
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Templates Grid */}
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {filteredTemplates.length === 0 ? (
            <Empty
              description="No templates found"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <div className="space-y-6">
              {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
                <div key={category}>
                  <div className="flex items-center space-x-2 mb-4">
                    {categoryIcons[category]}
                    <Title level={4} className="mb-0">
                      {category}
                    </Title>
                    <Badge count={categoryTemplates.length} style={{ backgroundColor: '#1890ff' }} />
                  </div>
                  <Row gutter={[16, 16]}>
                    {categoryTemplates.map(template => (
                      <Col key={template.name} xs={24} sm={12} lg={8}>
                        {renderTemplateCard(template)}
                      </Col>
                    ))}
                  </Row>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Text */}
        <Card size="small" className="bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-2">
            <FileTextOutlined className="text-blue-500 mt-1" />
            <div>
              <Text strong className="text-blue-700">
                About Templates
              </Text>
              <br />
              <Text className="text-blue-600 text-sm">
                Templates provide pre-configured starting points for your resources. 
                Select a template to automatically populate the form with common configurations 
                and best practices.
              </Text>
            </div>
          </div>
        </Card>
      </div>
    </Modal>
  );
};

// Default templates for different resource types
export const getDefaultTemplates = (resourceType: string): ResourceTemplate[] => {
  const baseTemplates: Record<string, ResourceTemplate[]> = {
    deployment: [
      {
        name: 'Simple Web App',
        description: 'Basic web application deployment with a single container',
        category: 'Basic',
        recommended: true,
        icon: <RocketOutlined />,
        data: {
          metadata: {
            name: '',
            namespace: 'default',
            labels: {
              app: 'web-app',
              tier: 'frontend',
            },
            annotations: {},
          },
          spec: {
            replicas: 3,
            selector: {
              matchLabels: {
                app: 'web-app',
              },
            },
            template: {
              metadata: {
                labels: {
                  app: 'web-app',
                },
              },
              spec: {
                containers: [
                  {
                    name: 'web',
                    image: 'nginx:latest',
                    ports: [
                      {
                        containerPort: 80,
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
      {
        name: 'Production Ready',
        description: 'Production-ready deployment with resource limits, health checks, and security',
        category: 'Production',
        recommended: true,
        data: {
          metadata: {
            name: '',
            namespace: 'production',
            labels: {
              app: 'production-app',
              environment: 'production',
              tier: 'backend',
            },
            annotations: {
              'deployment.kubernetes.io/revision': '1',
            },
          },
          spec: {
            replicas: 5,
            strategy: {
              type: 'RollingUpdate',
              rollingUpdate: {
                maxSurge: 1,
                maxUnavailable: 1,
              },
            },
            selector: {
              matchLabels: {
                app: 'production-app',
              },
            },
            template: {
              metadata: {
                labels: {
                  app: 'production-app',
                },
              },
              spec: {
                containers: [
                  {
                    name: 'app',
                    image: 'myapp:v1.0.0',
                    ports: [
                      {
                        containerPort: 8080,
                      },
                    ],
                    resources: {
                      requests: {
                        memory: '256Mi',
                        cpu: '250m',
                      },
                      limits: {
                        memory: '512Mi',
                        cpu: '500m',
                      },
                    },
                    livenessProbe: {
                      httpGet: {
                        path: '/health',
                        port: 8080,
                      },
                      initialDelaySeconds: 30,
                      periodSeconds: 10,
                    },
                    readinessProbe: {
                      httpGet: {
                        path: '/ready',
                        port: 8080,
                      },
                      initialDelaySeconds: 5,
                      periodSeconds: 5,
                    },
                  },
                ],
                securityContext: {
                  runAsNonRoot: true,
                  runAsUser: 1000,
                },
              },
            },
          },
        },
      },
    ],
    service: [
      {
        name: 'ClusterIP Service',
        description: 'Internal service accessible only within the cluster',
        category: 'Basic',
        recommended: true,
        data: {
          metadata: {
            name: '',
            namespace: 'default',
            labels: {
              app: 'my-service',
            },
            annotations: {},
          },
          spec: {
            type: 'ClusterIP',
            selector: {
              app: 'my-app',
            },
            ports: [
              {
                port: 80,
                targetPort: 8080,
                protocol: 'TCP',
              },
            ],
          },
        },
      },
      {
        name: 'LoadBalancer Service',
        description: 'External service with cloud load balancer',
        category: 'Networking',
        data: {
          metadata: {
            name: '',
            namespace: 'default',
            labels: {
              app: 'my-service',
            },
            annotations: {
              'service.beta.kubernetes.io/aws-load-balancer-type': 'nlb',
            },
          },
          spec: {
            type: 'LoadBalancer',
            selector: {
              app: 'my-app',
            },
            ports: [
              {
                port: 80,
                targetPort: 8080,
                protocol: 'TCP',
              },
            ],
          },
        },
      },
    ],
    configmap: [
      {
        name: 'Application Config',
        description: 'Basic application configuration',
        category: 'Basic',
        recommended: true,
        data: {
          metadata: {
            name: '',
            namespace: 'default',
            labels: {
              app: 'my-app',
            },
            annotations: {},
          },
          data: {
            'app.properties': 'debug=false\nlog.level=info',
            'database.url': 'jdbc:postgresql://localhost:5432/mydb',
          },
        },
      },
    ],
    secret: [
      {
        name: 'Database Credentials',
        description: 'Database username and password',
        category: 'Security',
        recommended: true,
        data: {
          metadata: {
            name: '',
            namespace: 'default',
            labels: {
              app: 'my-app',
            },
            annotations: {},
          },
          type: 'Opaque',
          data: {
            username: '',
            password: '',
          },
        },
      },
      {
        name: 'Docker Registry Secret',
        description: 'Credentials for private Docker registry',
        category: 'Security',
        data: {
          metadata: {
            name: '',
            namespace: 'default',
            labels: {},
            annotations: {},
          },
          type: 'kubernetes.io/dockerconfigjson',
          data: {
            '.dockerconfigjson': '',
          },
        },
      },
    ],
  };

  return baseTemplates[resourceType] || [];
};

export default ResourceFormTemplates;