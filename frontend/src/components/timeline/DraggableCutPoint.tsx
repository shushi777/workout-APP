import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface DraggableCutPointProps {
  id: string;
  x: number;
  type: 'auto' | 'manual';
  isSelected: boolean;
}

/**
 * Draggable cut point overlay for the timeline
 * Positioned over canvas cut points for touch-friendly dragging
 */
export function DraggableCutPoint({ id, x, type, isSelected }: DraggableCutPointProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
  });

  // Calculate position with transform
  const translateX = transform ? transform.x : 0;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        // Positioning - centered on cut point
        "absolute top-0",
        // Touch target - 44x44px for WCAG AAA
        "w-[44px] h-[44px]",
        // Cursor
        isDragging ? "cursor-grabbing" : "cursor-grab",
        // Z-index
        isDragging ? "z-30" : "z-10"
      )}
      style={{
        left: x + translateX,
        transform: 'translateX(-50%)',
      }}
      {...listeners}
      {...attributes}
    >
      {/* Visual indicator - invisible (Canvas draws the visible circle) */}
      {/* Keep DOM structure for potential future use, but hide with opacity-0 */}
      <div
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          "w-4 h-4 rounded-full",
          "border-2 border-white shadow-md",
          "transition-transform",
          "opacity-0", // Hidden - Canvas draws the only visible circle
          isDragging && "scale-125",
          // Color based on type and selection (kept for potential future use)
          type === 'auto' && !isSelected && "bg-[#667eea]",
          type === 'manual' && !isSelected && "bg-[#48bb78]",
          isSelected && "bg-[#ef4444]"
        )}
      />
    </div>
  );
}
