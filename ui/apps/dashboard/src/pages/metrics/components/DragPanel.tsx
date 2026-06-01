import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

interface DragPanelProps {
  id: string;
  children: ReactNode;
  disabled?: boolean;
}

export default function DragPanel({ id, children, disabled }: DragPanelProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {!disabled && (
        <div
          {...listeners}
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 20,
            cursor: 'grab',
            padding: 4,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <GripVertical size={14} style={{ opacity: 0.5 }} />
        </div>
      )}
      {children}
    </div>
  );
}
