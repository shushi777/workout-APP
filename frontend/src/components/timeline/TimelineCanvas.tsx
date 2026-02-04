import { useRef, useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useTimelineStore } from '@/stores/timelineStore';
import { useCanvasTimeline, formatTime } from '@/hooks/useCanvasTimeline';
import { DraggableCutPoint } from './DraggableCutPoint';
import { Plus, Minus } from 'lucide-react';

/**
 * Canvas-based Timeline with draggable cut points
 * Uses dnd-kit for drag-and-drop with touch and mouse support
 */
export function TimelineCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Timeline state from Zustand store
  const {
    videoDuration,
    cutPoints,
    segments,
    currentTime,
    selectedSegmentIndex,
    selectedCutPointId,
    zoomLevel,
    updateCutPoint,
    selectCutPoint,
    selectSegment,
    setZoomLevel,
    setCurrentTime,
  } = useTimelineStore();

  // Local state for drag feedback
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragTime, setDragTime] = useState<number | null>(null);
  const [scrollOffset] = useState(0); // Future: implement panning

  // Setup canvas rendering hook
  const { getTimeFromX, getXFromTime } = useCanvasTimeline(canvasRef, wrapperRef, {
    duration: videoDuration,
    cutPoints,
    segments,
    currentTime,
    selectedSegmentIndex,
    selectedCutPointId: draggingId || selectedCutPointId,
    zoomLevel,
    scrollOffset,
  });

  // Configure dnd-kit sensors for mouse and touch
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // 5px movement to start drag
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // 100ms delay for touch
        tolerance: 5,
      },
    })
  );

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id as string;
    setDraggingId(id);
    selectCutPoint(id);

    // Find current time for the cut point
    const cutPoint = cutPoints.find((cp) => cp.id === id);
    if (cutPoint) {
      setDragTime(cutPoint.time);
    }
  }, [cutPoints, selectCutPoint]);

  // Handle drag move - update time overlay
  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !draggingId) return;

    // Get the cut point's base position
    const cutPoint = cutPoints.find((cp) => cp.id === draggingId);
    if (!cutPoint) return;

    // Calculate new X position
    const baseX = getXFromTime(cutPoint.time);
    const newX = baseX + event.delta.x;

    // Convert to time
    const newTime = getTimeFromX(newX);
    setDragTime(newTime);
  }, [cutPoints, draggingId, getTimeFromX, getXFromTime]);

  // Handle drag end - commit the change
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    if (!draggingId) return;

    // Get the cut point's current position
    const cutPoint = cutPoints.find((cp) => cp.id === draggingId);
    if (!cutPoint) {
      setDraggingId(null);
      setDragTime(null);
      return;
    }

    // Calculate final position
    const baseX = getXFromTime(cutPoint.time);
    const newX = baseX + event.delta.x;
    const newTime = getTimeFromX(newX);

    // Update in store
    updateCutPoint(draggingId, newTime);

    // Clear drag state
    setDraggingId(null);
    setDragTime(null);
  }, [cutPoints, draggingId, getTimeFromX, getXFromTime, updateCutPoint]);

  // Handle canvas click - seek or select segment
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || videoDuration === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // If clicking in the top area (cut point handles), don't seek
    // The draggable overlays will handle cut point interaction
    if (y <= 30) {
      // Check if clicking near a cut point
      const clickedTime = getTimeFromX(x);
      const clickedCutPoint = cutPoints.find(
        (cp) => Math.abs(cp.time - clickedTime) < videoDuration * 0.02
      );

      if (clickedCutPoint) {
        selectCutPoint(clickedCutPoint.id);
        return;
      }
    }

    // Check if clicking in segment area (30 to height-30)
    if (y > 30 && y < 120) {
      const clickedTime = getTimeFromX(x);

      // Find which segment was clicked
      const segmentIndex = segments.findIndex(
        (seg) => clickedTime >= seg.start && clickedTime <= seg.end
      );

      if (segmentIndex !== -1) {
        selectSegment(segmentIndex);
        // Also seek to segment start for preview
        setCurrentTime(segments[segmentIndex].start);
        return;
      }
    }

    // Otherwise, seek to clicked time
    const clickedTime = getTimeFromX(x);
    setCurrentTime(clickedTime);
    selectCutPoint(null);
  }, [cutPoints, getTimeFromX, segments, selectCutPoint, selectSegment, setCurrentTime, videoDuration]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoomLevel(zoomLevel + 0.5);
  }, [setZoomLevel, zoomLevel]);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(zoomLevel - 0.5);
  }, [setZoomLevel, zoomLevel]);

  // Recalculate cut point positions when zoom changes
  const [cutPointPositions, setCutPointPositions] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const positions = new Map<string, number>();
    cutPoints.forEach((cp) => {
      positions.set(cp.id, getXFromTime(cp.time));
    });
    setCutPointPositions(positions);
  }, [cutPoints, getXFromTime, zoomLevel, videoDuration]);

  if (videoDuration === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-8 text-center">
        <p className="text-gray-500">Loading timeline...</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div className="relative">
        {/* Zoom controls */}
        <div className="absolute top-2 right-2 flex items-center gap-1 z-10 bg-gray-900/80 rounded-lg p-1">
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.5}
            className="w-8 h-8 flex items-center justify-center rounded text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Zoom out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-300 min-w-[40px] text-center">
            {zoomLevel}x
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3}
            className="w-8 h-8 flex items-center justify-center rounded text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Zoom in"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Canvas wrapper */}
        <div ref={wrapperRef} className="relative w-full rounded-xl overflow-hidden bg-gray-100">
          {/* Canvas for rendering */}
          <canvas
            ref={canvasRef}
            className="block w-full h-[150px] touch-none cursor-crosshair"
            onClick={handleCanvasClick}
          />

          {/* Draggable cut point overlays */}
          {cutPoints.map((cp) => {
            const x = cutPointPositions.get(cp.id) ?? 0;
            // Only render if visible
            if (x < -20 || x > (wrapperRef.current?.offsetWidth ?? 0) + 20) {
              return null;
            }
            return (
              <DraggableCutPoint
                key={cp.id}
                id={cp.id}
                x={x}
                type={cp.type}
                isSelected={selectedCutPointId === cp.id || draggingId === cp.id}
                onSelect={() => selectCutPoint(cp.id)}
              />
            );
          })}

          {/* Time overlay during drag */}
          {draggingId && dragTime !== null && (
            <div
              className="absolute top-0 pointer-events-none z-20"
              style={{ left: getXFromTime(dragTime) }}
            >
              <div className="relative -translate-x-1/2">
                <div className="bg-black/80 text-white text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
                  {formatTime(dragTime)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DndContext>
  );
}
