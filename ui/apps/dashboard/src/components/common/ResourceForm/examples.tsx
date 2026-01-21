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
  Collapse,
} from 'antd';
import {
  SearchOutlined,
  BulbOutlined,
  CodeOutlined,
  EyeOutlined,
  CopyOutlined,
  BookOutlined,
  ExperimentOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { ResourceExample } from './index';

const { Text, Title, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;
const { Panel } = Collapse;

// Complexity level icons and colors
const complexityConfig = {
  basic: {
    icon: <BookOutlined />,
    color: 'green',
    label: 'Basic',
  },
  intermediate: {
    icon: <ExperimentOutlined />,
    color: 'orange',
    label: 'Intermediate',
  },
  advanced: {
    icon: <RocketOutlined />,
    color: 'red',
    label: 'Advanced',
  },
};

interface ResourceFormExamplesProps {
  open: boolean;
  examples: ResourceExample[];
  onSelect: (example: ResourceExample) => void;
  onClose: () => void;
}

export const ResourceFormExamples: React.FC<ResourceFormExamplesProps> = ({
  open,
  examples,
  onSelect,
  onClose,
}) => {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('');
  const [previewExample, setPreviewExample] = useState<ResourceExample | null>(null);

  // Filter examples based on search and filters
  const filteredExamples = useMemo(() => {
    return examples.filter(example => {
      const matchesSearch = !searchText || 
        example.name.toLowerCase().includes(searchText.toLowerCase()) ||
        example.description.toLowerCase().includes(searchText.toLowerCase());
      
      const matchesCategory = !selectedCategory || example.category === selectedCategory;
      
      const matchesComplexity = !selectedComplexity || example.complexity === selectedComplexity;

      return matchesSearch && matchesCategory && matchesComplexity;
    });
  }, [examples, searchText, selectedCategory, selectedComplexity]);

  // Get unique categories and complexities
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(examples.map(e => e.category))];
    return uniqueCategories.sort();
  }, [examples]);

  const complexities = useMemo(() => {
    const uniqueComplexities = [...new Set(examples.map(e => e.complexity))];
    return uniqueComplexities.sort();
  }, [examples]);

  // Group examples by category
  const examplesByCategory = useMemo(() => {
    const grouped: Record<string, ResourceExample[]> = {};
    filteredExamples.forEach(example => {
      if (!grouped[example.category]) {
        grouped[example.category] = [];
      }
      grouped[example.category].push(example);
    });
    return grouped;
  }, [filteredExamples]);

  const handleExampleSelect = (example: ResourceExample) => {
    onSelect(example);
    onClose();
  };

  const handlePreview = (example: ResourceExample) => {
    setPreviewExample(example);
  };

  const handleCopyYAML = (yaml: string) => {
    navigator.clipboard.writeText(yaml);
    // In a real implementation, you'd show a success message
  };

  const renderExampleCard = (example: ResourceExample) => {
    const complexityInfo = complexityConfig[example.complexity];
    
    return (
      <Card
        key={example.name}
        hoverable
        className="h-full transition-all duration-200 hover:shadow-lg"
        actions={[
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(example)}
          >
            Preview
          </Button>,
          <Button
            type="link"
            size="small"
            icon={<BulbOutlined />}
            onClick={() => handleExampleSelect(example)}
          >
            Use Example
          </Button>,
        ]}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <CodeOutlined />
              <Title level={5} className="mb-0">
                {example.name}
              </Title>
            </div>
            <Tag color={complexityInfo.color} icon={complexityInfo.icon}>
              {complexityInfo.label}
            </Tag>
          </div>

          {/* Description */}
          <Text type="secondary" className="text-sm">
            {example.description}
          </Text>

          {/* Category */}
          <div className="flex items-center justify-between">
            <Tag color="blue">{example.category}</Tag>
            <Text type="secondary" className="text-xs">
              {example.yaml.split('\n').length} lines
            </Text>
          </div>

          {/* YAML Preview */}
          <div className="bg-gray-50 p-2 rounded text-xs font-mono">
            <Text type="secondary">
              {example.yaml.split('\n').slice(0, 3).join('\n')}
              {example.yaml.split('\n').length > 3 && '\n...'}
            </Text>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <>
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <BulbOutlined />
            <span>Resource Examples</span>
            <Badge count={filteredExamples.length} style={{ backgroundColor: '#1890ff' }} />
          </div>
        }
        open={open}
        onCancel={onClose}
        width={1000}
        footer={null}
        className="resource-examples-modal"
      >
        <div className="space-y-4">
          {/* Filters */}
          <Card size="small">
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={8}>
                <Search
                  placeholder="Search examples..."
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
                      {category}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Select
                  placeholder="Filter by complexity"
                  value={selectedComplexity}
                  onChange={setSelectedComplexity}
                  allowClear
                  className="w-full"
                >
                  {complexities.map(complexity => (
                    <Option key={complexity} value={complexity}>
                      <Space>
                        {complexityConfig[complexity as keyof typeof complexityConfig].icon}
                        {complexityConfig[complexity as keyof typeof complexityConfig].label}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Col>
            </Row>
          </Card>

          {/* Examples Grid */}
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {filteredExamples.length === 0 ? (
              <Empty
                description="No examples found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <div className="space-y-6">
                {Object.entries(examplesByCategory).map(([category, categoryExamples]) => (
                  <div key={category}>
                    <div className="flex items-center space-x-2 mb-4">
                      <CodeOutlined />
                      <Title level={4} className="mb-0">
                        {category}
                      </Title>
                      <Badge count={categoryExamples.length} style={{ backgroundColor: '#1890ff' }} />
                    </div>
                    <Row gutter={[16, 16]}>
                      {categoryExamples.map(example => (
                        <Col key={example.name} xs={24} sm={12} lg={8}>
                          {renderExampleCard(example)}
                        </Col>
                      ))}
                    </Row>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Help Text */}
          <Card size="small" className="bg-green-50 border-green-200">
            <div className="flex items-start space-x-2">
              <BulbOutlined className="text-green-500 mt-1" />
              <div>
                <Text strong className="text-green-700">
                  About Examples
                </Text>
                <br />
                <Text className="text-green-600 text-sm">
                  Examples show real-world YAML configurations for different use cases. 
                  Preview an example to see the full YAML, or use it to populate your form 
                  with a working configuration.
                </Text>
              </div>
            </div>
          </Card>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <EyeOutlined />
            <span>{previewExample?.name}</span>
            <Tag color={previewExample ? complexityConfig[previewExample.complexity].color : 'default'}>
              {previewExample ? complexityConfig[previewExample.complexity].label : ''}
            </Tag>
          </div>
        }
        open={!!previewExample}
        onCancel={() => setPreviewExample(null)}
        width={800}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={() => previewExample && handleCopyYAML(previewExample.yaml)}>
            Copy YAML
          </Button>,
          <Button key="use" type="primary" icon={<BulbOutlined />} onClick={() => previewExample && handleExampleSelect(previewExample)}>
            Use This Example
          </Button>,
        ]}
      >
        {previewExample && (
          <div className="space-y-4">
            {/* Description */}
            <Card size="small">
              <Paragraph>{previewExample.description}</Paragraph>
              <div className="flex items-center space-x-4">
                <div>
                  <Text strong>Category: </Text>
                  <Tag color="blue">{previewExample.category}</Tag>
                </div>
                <div>
                  <Text strong>Complexity: </Text>
                  <Tag color={complexityConfig[previewExample.complexity].color}>
                    {complexityConfig[previewExample.complexity].label}
                  </Tag>
                </div>
              </div>
            </Card>

            {/* YAML Content */}
            <Card title="YAML Configuration" size="small">
              <pre
                style={{
                  background: '#f5f5f5',
                  padding: '16px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '400px',
                  fontSize: '12px',
                  lineHeight: '1.4',
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                }}
              >
                {previewExample.yaml}
              </pre>
            </Card>
          </div>
        )}
      </Modal>
    </>
  );
};

// Default examples for different resource types
export const getDefaultExamples = (resourceType: string): ResourceExample[] => {
  const baseExamples: Record<string, ResourceExample[]> = {
    deployment: [
      {
        name: 'Simple Nginx Deployment',
        description: 'A basic nginx deployment with 3 replicas',
        category: 'Web Server',
        complexity: 'basic',
        yaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  namespace: default
  labels:
    app: nginx
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
      },
      {
        name: 'Production Web App',
        description: 'Production-ready web application with health checks and resource limits',
        category: 'Web Server',
        complexity: 'advanced',
        yaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapp-deployment
  namespace: production
  labels:
    app: webapp
    environment: production
    tier: frontend
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
  selector:
    matchLabels:
      app: webapp
  template:
    metadata:
      labels:
        app: webapp
    spec:
      containers:
      - name: webapp
        image: myapp:v1.2.3
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000`,
      },
    ],
    service: [
      {
        name: 'ClusterIP Service',
        description: 'Internal service for cluster communication',
        category: 'Networking',
        complexity: 'basic',
        yaml: `apiVersion: v1
kind: Service
metadata:
  name: my-service
  namespace: default
  labels:
    app: my-app
spec:
  type: ClusterIP
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP`,
      },
      {
        name: 'LoadBalancer Service',
        description: 'External service with cloud load balancer',
        category: 'Networking',
        complexity: 'intermediate',
        yaml: `apiVersion: v1
kind: Service
metadata:
  name: external-service
  namespace: default
  labels:
    app: my-app
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
    service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: "true"
spec:
  type: LoadBalancer
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
    name: http
  - port: 443
    targetPort: 8443
    protocol: TCP
    name: https`,
      },
    ],
    configmap: [
      {
        name: 'Application Configuration',
        description: 'Basic application configuration with properties',
        category: 'Configuration',
        complexity: 'basic',
        yaml: `apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: default
  labels:
    app: my-app
data:
  app.properties: |
    debug=false
    log.level=info
    max.connections=100
  database.url: "jdbc:postgresql://localhost:5432/mydb"
  redis.host: "redis-service"
  redis.port: "6379"`,
      },
      {
        name: 'Nginx Configuration',
        description: 'Nginx server configuration with custom settings',
        category: 'Web Server',
        complexity: 'intermediate',
        yaml: `apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-config
  namespace: default
  labels:
    app: nginx
data:
  nginx.conf: |
    user nginx;
    worker_processes auto;
    error_log /var/log/nginx/error.log;
    pid /run/nginx.pid;
    
    events {
        worker_connections 1024;
    }
    
    http {
        log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                        '$status $body_bytes_sent "$http_referer" '
                        '"$http_user_agent" "$http_x_forwarded_for"';
        
        access_log /var/log/nginx/access.log main;
        
        sendfile on;
        tcp_nopush on;
        tcp_nodelay on;
        keepalive_timeout 65;
        types_hash_max_size 2048;
        
        include /etc/nginx/mime.types;
        default_type application/octet-stream;
        
        server {
            listen 80;
            server_name localhost;
            
            location / {
                proxy_pass http://backend-service:8080;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
            }
        }
    }`,
      },
    ],
    secret: [
      {
        name: 'Database Credentials',
        description: 'Database username and password secret',
        category: 'Security',
        complexity: 'basic',
        yaml: `apiVersion: v1
kind: Secret
metadata:
  name: db-secret
  namespace: default
  labels:
    app: my-app
type: Opaque
data:
  username: bXl1c2Vy  # base64 encoded 'myuser'
  password: bXlwYXNzd29yZA==  # base64 encoded 'mypassword'
  database: bXlkYXRhYmFzZQ==  # base64 encoded 'mydatabase'`,
      },
      {
        name: 'Docker Registry Secret',
        description: 'Credentials for private Docker registry access',
        category: 'Security',
        complexity: 'intermediate',
        yaml: `apiVersion: v1
kind: Secret
metadata:
  name: registry-secret
  namespace: default
  labels:
    app: my-app
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: eyJhdXRocyI6eyJteS1yZWdpc3RyeS5jb20iOnsidXNlcm5hbWUiOiJteXVzZXIiLCJwYXNzd29yZCI6Im15cGFzc3dvcmQiLCJhdXRoIjoiYlhsMWMyVnlPbTE1Y0dGemMzZHZjbVE9In19fQ==`,
      },
      {
        name: 'TLS Certificate',
        description: 'TLS certificate and private key for HTTPS',
        category: 'Security',
        complexity: 'advanced',
        yaml: `apiVersion: v1
kind: Secret
metadata:
  name: tls-secret
  namespace: default
  labels:
    app: my-app
type: kubernetes.io/tls
data:
  tls.crt: LS0tLS1CRUdJTi... # base64 encoded certificate
  tls.key: LS0tLS1CRUdJTi... # base64 encoded private key`,
      },
    ],
  };

  return baseExamples[resourceType] || [];
};

export default ResourceFormExamples;