/*
Copyright 2026 The Karmada Authors.

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

import { Button, Drawer, Space, Descriptions, Badge } from 'antd';
import { Icons } from '@/components/icons';
import { MonacoEditor } from '@/components/monaco-editor';
import dayjs from 'dayjs';

// Simplified View Drawer Props
interface ViewDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  loading?: boolean;
  detail: any | null;
  events?: any[];
  extraFields?: { label: string; value: React.ReactNode }[];
}

// Simplified Edit Drawer Props
interface EditDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  content: string;
  onChange: (value: string) => void;
  onSave: () => void;
  loading?: boolean;
}

// Simplified View Drawer Component
export function ViewDrawer({
  open,
  onClose,
  title,
  icon,
  loading = false,
  detail,
  events = [],
  extraFields = [],
}: ViewDrawerProps) {
  const items = [
    { label: 'Name', children: detail?.objectMeta?.name },
    { label: 'Namespace', children: detail?.objectMeta?.namespace },
    {
      label: 'Created',
      children: detail?.objectMeta?.creationTimestamp
        ? dayjs(detail.objectMeta.creationTimestamp).format('YYYY-MM-DD HH:mm:ss')
        : '-',
    },
    ...extraFields,
  ];

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          {icon || <Icons.eye className="w-5 h-5 text-[var(--kd-primary-600)]" />}
          <span>{title}</span>
        </div>
      }
      placement="right"
      width={600}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--kd-primary-600)]" />
        </div>
      )}
      {!loading && detail && (
        <div className="space-y-6">
          <Descriptions
            title="Basic Information"
            column={1}
            bordered
            size="small"
            labelStyle={{ width: 120, backgroundColor: 'var(--kd-gray-50)' }}
            items={items}
          />

          {events.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 text-[var(--kd-text-primary)]">Events</h4>
              <div className="space-y-2 max-h-64 overflow-auto">
                {events.map((e) => (
                  <div
                    key={e.objectMeta?.uid || e.id}
                    className="border border-[var(--kd-border-light)] rounded-lg p-3 text-xs"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge status={e.type === 'Normal' ? 'success' : 'error'} />
                      <span className="font-medium">{e.reason}</span>
                    </div>
                    <div className="text-[var(--kd-text-secondary)] mb-1">{e.message}</div>
                    <div className="text-[var(--kd-text-tertiary)] text-[11px]">
                      {e.sourceComponent || e.source} · {e.lastSeen}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

// Simplified Edit Drawer Component
export function EditDrawer({
  open,
  onClose,
  title,
  icon,
  content,
  onChange,
  onSave,
  loading = false,
}: EditDrawerProps) {
  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          {icon || <Icons.edit className="w-5 h-5 text-[var(--kd-primary-600)]" />}
          <span>{title}</span>
        </div>
      }
      placement="right"
      width={800}
      open={open}
      onClose={() => {
        if (!loading) onClose();
      }}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="primary" loading={loading} onClick={onSave}>
            Save
          </Button>
        </Space>
      }
    >
      <MonacoEditor
        height="calc(100vh - 180px)"
        defaultLanguage="yaml"
        value={content}
        onChange={(value: string | undefined) => onChange(value || '')}
      />
    </Drawer>
  );
}
