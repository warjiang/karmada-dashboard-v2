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

import { Button, Space, Tooltip } from 'antd';
import { Icons } from '@/components/icons';
import dayjs from 'dayjs';

// Standard action buttons for table rows
interface ActionButtonsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  deleteDisabled?: boolean;
}

export function ActionButtons({ onView, onEdit, onDelete, deleteDisabled = true }: ActionButtonsProps) {
  return (
    <Space size={4}>
      {onView && (
        <Tooltip title="View details">
          <Button
            type="text"
            size="small"
            icon={<Icons.eye className="w-4 h-4" />}
            className="text-[var(--kd-text-secondary)] hover:text-[var(--kd-primary-600)] hover:bg-[var(--kd-primary-50)]"
            onClick={onView}
          />
        </Tooltip>
      )}
      {onEdit && (
        <Tooltip title="Edit">
          <Button
            type="text"
            size="small"
            icon={<Icons.edit className="w-4 h-4" />}
            className="text-[var(--kd-text-secondary)] hover:text-[var(--kd-primary-600)] hover:bg-[var(--kd-primary-50)]"
            onClick={onEdit}
          />
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip title="Delete">
          <Button
            type="text"
            size="small"
            danger
            disabled={deleteDisabled}
            icon={<Icons.delete className="w-4 h-4" />}
            className="hover:bg-[var(--kd-error-50)]"
            onClick={onDelete}
          />
        </Tooltip>
      )}
    </Space>
  );
}

// Standard name column with icon
interface NameCellProps {
  name: string;
  icon?: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
}

export function NameCell({ name, icon, iconBgColor = 'var(--kd-primary-50)', iconColor = 'var(--kd-primary-600)' }: NameCellProps) {
  return (
    <div className="flex items-center gap-2">
      {icon && (
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: iconBgColor }}
        >
          <div style={{ color: iconColor }}>{icon}</div>
        </div>
      )}
      <span className="font-medium text-[var(--kd-text-primary)] text-sm">
        {name}
      </span>
    </div>
  );
}

// Standard namespace cell
export function NamespaceCell({ namespace }: { namespace: string }) {
  return (
    <span className="text-sm text-[var(--kd-text-secondary)]">
      {namespace}
    </span>
  );
}

// Standard age cell
export function AgeCell({ creationTimestamp }: { creationTimestamp?: string }) {
  if (!creationTimestamp) return <span className="text-xs text-[var(--kd-text-tertiary)]">-</span>;
  return (
    <span className="text-xs text-[var(--kd-text-secondary)]">
      {dayjs(creationTimestamp).fromNow()}
    </span>
  );
}

// Standard code cell for IPs, ports, etc.
export function CodeCell({ value }: { value: string }) {
  return (
    <code className="text-xs bg-[var(--kd-gray-100)] px-2 py-1 rounded text-[var(--kd-text-primary)]">
      {value}
    </code>
  );
}
