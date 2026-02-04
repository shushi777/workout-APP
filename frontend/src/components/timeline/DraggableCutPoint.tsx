import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface DraggableCutPointProps {
  id: string;
  x: number;
  type: 'auto' | 'manual';
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * Draggable cut point overlay for the timeline
 * Positioned over canvas cut points for touch-friendly dragging
 */
export function DraggableCutPoint({ id, x, isSelected, onSelect }: DraggableCutPointProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
  });

  // Calculate position with transform
  const translateX = transform ? transform.x : 0;

  // Handle click/tap selection (only when not dragging)
  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging) {
      e.stopPropagation();
      onSelect();
    }
  };

  return (
    <div
      ref={setNodeRef}
      onClick={handleClick}
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
      {/* Visual indicator - shows when selected (Canvas also draws circles) */}
      <div
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          "w-4 h-4 rounded-full",
          "border-2 border-white shadow-md",
          "transition-transform",
          isDragging && "scale-125",
          // Show visual indicator when selected, hide otherwise (Canvas draws the main circle)
          isSelected ? "opacity-100" : "opacity-0",
          // Color based on selection
          isSelected && "bg-red-500 ring-2 ring-red-400 ring-offset-2 ring-offset-gray-900"
        )}
      />
    </div>
  );
}
