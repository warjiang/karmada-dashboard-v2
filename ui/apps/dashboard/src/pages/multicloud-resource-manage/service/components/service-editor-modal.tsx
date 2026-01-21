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

import React, { FC, useEffect, useState } from 'react';
import { Form, Modal, Select, notification } from 'antd';
import Editor from '@monaco-editor/react';
import { parse, stringify } from 'yaml';
import _ from 'lodash';
import { IResponse, ServiceKind } from '@/services/base';
import { 
  CreateMemberClusterService, 
  UpdateMemberClusterService,
  CreateMemberClusterIngress,
  UpdateMemberClusterIngress,
} from '@/services/member-cluster/service';
import i18nInstance from '@/utils/i18n';

export interface ServiceEditorModalProps {
  mode: 'create' | 'edit' | 'detail';
  open: boolean;
  memberClusterName: string;
  serviceContent?: string;
  onOk: (ret: IResponse<any>) => Promise<void> | void;
  onCancel: () => Promise<void> | void;
  kind: ServiceKind;
}

const ServiceEditorModal: FC<ServiceEditorModalProps> = (props) => {
  const { 
    mode, 
    open, 
    memberClusterName,
    serviceContent = '', 
    onOk, 
    onCancel, 
    kind 
  } = props;
  
  const [content, setContent] = useState<string>(serviceContent);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setContent(serviceContent);
  }, [serviceContent]);

  function handleEditorChange(value: string | undefined) {
    setContent(value || '');
  }

  const handleSubmit = async () => {
    if (!memberClusterName) {
      notification.error({
        message: 'Error',
        description: 'Member cluster name is required',
      });
      return;
    }

    setLoading(true);
    try {
      const yamlObject = parse(content) as Record<string, any>;
      const resourceKind = _.get(yamlObject, 'kind');
      const namespace = _.get(yamlObject, 'metadata.namespace', 'default');
      const name = _.get(yamlObject, 'metadata.name');

      if (!name) {
        notification.error({
          message: 'Validation Error',
          description: 'Resource name is required',
        });
        return;
      }

      let result: IResponse<any>;

      if (mode === 'create') {
        if (kind === ServiceKind.Service) {
          result = await CreateMemberClusterService({
            memberClusterName,
            namespace,
            name,
            content: stringify(yamlObject),
          });
        } else {
          result = await CreateMemberClusterIngress({
            memberClusterName,
            namespace,
            name,
            content: stringify(yamlObject),
          });
        }
      } else {
        if (kind === ServiceKind.Service) {
          result = await UpdateMemberClusterService({
            memberClusterName,
            namespace,
            name,
            content: stringify(yamlObject),
          });
        } else {
          result = await UpdateMemberClusterIngress({
            memberClusterName,
            namespace,
            name,
            content: stringify(yamlObject),
          });
        }
      }

      await onOk(result);
      setContent('');
    } catch (error) {
      console.error('Failed to submit service/ingress:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      notification.error({
        message: `Failed to ${mode} ${kind === ServiceKind.Service ? 'Service' : 'Ingress'}`,
        description: errorMessage,
      });

      // Still call onOk with error response for consistency
      await onOk({
        code: 500,
        message: errorMessage,
        data: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    await onCancel();
    setContent('');
  };

  const getModalTitle = () => {
    const resourceType = kind === ServiceKind.Service ? 'Service' : 'Ingress';
    switch (mode) {
      case 'create':
        return i18nInstance.t('c7961c290ec86485d8692f3c09b4075b', `新增${resourceType}`);
      case 'edit':
        return i18nInstance.t('cc51f34aa418cb3a596fd6470c677bfe', `编辑${resourceType}`);
      case 'detail':
        return i18nInstance.t('ad23e7bbdbe6ed03eebfc27eef7570fa', `查看${resourceType}`);
      default:
        return resourceType;
    }
  };

  return (
    <Modal
      title={getModalTitle()}
      open={open}
      width={1000}
      okText={i18nInstance.t('38cf16f2204ffab8a6e0187070558721', '确定')}
      cancelText={i18nInstance.t('625fb26b4b3340f7872b411f401e754c', '取消')}
      destroyOnClose={true}
      confirmLoading={loading}
      onOk={handleSubmit}
      onCancel={handleCancel}
      okButtonProps={{
        disabled: mode === 'detail',
      }}
    >
      <Form.Item
        label={i18nInstance.t('924f67de61fc9e07fff979306900dc6a', '服务类型')}
      >
        <Select
          value={kind}
          disabled
          options={[
            {
              label: 'Service',
              value: ServiceKind.Service,
            },
            {
              label: 'Ingress',
              value: ServiceKind.Ingress,
            },
          ]}
          style={{
            width: 200,
          }}
        />
      </Form.Item>
      
      <Editor
        height="600px"
        defaultLanguage="yaml"
        value={content}
        theme="vs"
        options={{
          theme: 'vs',
          lineNumbers: 'on',
          fontSize: 14,
          readOnly: mode === 'detail',
          minimap: {
            enabled: false,
          },
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          folding: true,
          renderLineHighlight: 'all',
          selectOnLineNumbers: true,
          roundedSelection: false,
          cursorStyle: 'line',
          formatOnPaste: true,
          formatOnType: true,
        }}
        onChange={handleEditorChange}
      />
    </Modal>
  );
};

export default ServiceEditorModal;
