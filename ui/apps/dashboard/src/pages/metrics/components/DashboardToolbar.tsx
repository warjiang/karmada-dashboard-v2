import { Button, Popconfirm, Space, Tooltip } from 'antd';
import { Check, Compass, Pencil, Plus, RotateCcw } from 'lucide-react';

interface DashboardToolbarProps {
  editMode: boolean;
  hasCustomConfig: boolean;
  onToggleEdit: () => void;
  onAddPanel: () => void;
  onReset: () => void;
  onExplore?: () => void;
}

export default function DashboardToolbar({
  editMode,
  hasCustomConfig,
  onToggleEdit,
  onAddPanel,
  onReset,
  onExplore,
}: DashboardToolbarProps) {
  return (
    <Space size="small">
      <Tooltip title="Explore metrics with DSL query">
        <Button
          size="small"
          icon={<Compass size={14} />}
          onClick={onExplore}
        >
          Explore
        </Button>
      </Tooltip>
      {editMode && (
        <>
          <Button
            type="primary"
            size="small"
            icon={<Plus size={14} />}
            onClick={onAddPanel}
          >
            Add Panel
          </Button>
          {hasCustomConfig && (
            <Popconfirm
              title="Reset to default?"
              description="This will remove all customizations and show all metrics."
              onConfirm={onReset}
              okText="Reset"
              cancelText="Cancel"
            >
              <Button size="small" icon={<RotateCcw size={14} />} danger>
                Reset
              </Button>
            </Popconfirm>
          )}
        </>
      )}
      <Tooltip title={editMode ? 'Done editing' : 'Customize dashboard'}>
        <Button
          size="small"
          type={editMode ? 'primary' : 'default'}
          icon={editMode ? <Check size={14} /> : <Pencil size={14} />}
          onClick={onToggleEdit}
        >
          {editMode ? 'Done' : 'Edit'}
        </Button>
      </Tooltip>
    </Space>
  );
}
