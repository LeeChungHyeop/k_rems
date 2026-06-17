import { useRef } from 'react';
import { GripVertical } from 'lucide-react';
import { usePlantOrder } from './PlantOrderContext';
import { cn } from '@/lib/utils';

/**
 * A table-cell-friendly drag handle for reordering plant rows.
 * Uses native HTML5 drag-and-drop for simplicity.
 * When `disabled` (e.g. user has applied a column sort), drag is inert.
 */
export function PlantDragHandle({ plantId, disabled, children }: { plantId: string; disabled?: boolean; children: React.ReactNode }) {
  const { reorder } = usePlantOrder();
  const rowRef = useRef<HTMLSpanElement>(null);

  if (disabled) {
    return <span className="inline-flex items-center gap-1.5">{children}</span>;
  }

  return (
    <span
      ref={rowRef}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plant-id', plantId);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
      onDrop={(e) => {
        e.preventDefault();
        const src = e.dataTransfer.getData('text/plant-id');
        if (src && src !== plantId) reorder(src, plantId);
      }}
      className={cn('inline-flex items-center gap-1.5 cursor-grab active:cursor-grabbing')}
      title="드래그하여 순서 변경"
    >
      <GripVertical className="h-3 w-3 text-muted-foreground/60 hover:text-primary transition-colors shrink-0" />
      {children}
    </span>
  );
}
