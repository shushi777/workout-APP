import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { CutPoint, Segment } from '@/stores/timelineStore';

export interface UseCanvasTimelineOptions {
  duration: number;
  cutPoints: CutPoint[];
  segments: Segment[];
  currentTime: number;
  selectedSegmentIndex: number | null;
  selectedCutPointId: string | null;
  zoomLevel: number;
  scrollOffset: number;
}

interface CanvasContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
}

/**
 * Format seconds to MM:SS string
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Hook for Canvas timeline rendering with high-DPI support
 */
export function useCanvasTimeline(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  wrapperRef: RefObject<HTMLDivElement | null>,
  options: UseCanvasTimelineOptions
) {
  const animationFrameRef = useRef<number | null>(null);
  const lastOptionsRef = useRef<UseCanvasTimelineOptions>(options);
  lastOptionsRef.current = options;

  /**
   * Get canvas context with DPR-adjusted dimensions
   */
  const getCanvasContext = useCallback((): CanvasContext | null => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const dpr = window.devicePixelRatio || 1;
    const rect = wrapper.getBoundingClientRect();

    return {
      ctx,
      width: rect.width,
      height: 150,
      dpr,
    };
  }, [canvasRef, wrapperRef]);

  /**
   * Resize canvas to match wrapper size with DPR scaling
   */
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = getCanvasContext();
    if (!canvas || !context) return;

    const { width, height, dpr } = context;

    // Set canvas size with DPR for sharp rendering
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // Set display size
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Scale context to match DPR
    context.ctx.scale(dpr, dpr);
  }, [canvasRef, getCanvasContext]);

  /**
   * Convert X position to time value
   */
  const getTimeFromX = useCallback((x: number): number => {
    const context = getCanvasContext();
    const { duration, zoomLevel, scrollOffset } = lastOptionsRef.current;
    if (!context || duration === 0) return 0;

    const visibleDuration = duration / zoomLevel;
    const time = scrollOffset + (x / context.width) * visibleDuration;
    return Math.max(0, Math.min(duration, time));
  }, [getCanvasContext]);

  /**
   * Convert time value to X position
   */
  const getXFromTime = useCallback((time: number): number => {
    const context = getCanvasContext();
    const { duration, zoomLevel, scrollOffset } = lastOptionsRef.current;
    if (!context || duration === 0) return 0;

    const visibleDuration = duration / zoomLevel;
    const x = ((time - scrollOffset) / visibleDuration) * context.width;
    return x;
  }, [getCanvasContext]);

  /**
   * Draw time markers on the timeline
   */
  const drawTimeMarkers = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const { duration, zoomLevel, scrollOffset } = lastOptionsRef.current;
    if (duration === 0) return;

    // Adjust marker interval based on zoom level
    const baseInterval = 5; // seconds
    let markerInterval = baseInterval;
    if (zoomLevel >= 2) markerInterval = 2;
    if (zoomLevel >= 3) markerInterval = 1;

    const visibleDuration = duration / zoomLevel;
    const startTime = Math.floor(scrollOffset / markerInterval) * markerInterval;
    const endTime = scrollOffset + visibleDuration;

    ctx.strokeStyle = '#e0e0e0';
    ctx.fillStyle = '#999';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';

    for (let time = startTime; time <= endTime + markerInterval; time += markerInterval) {
      if (time < 0 || time > duration) continue;

      const x = ((time - scrollOffset) / visibleDuration) * width;
      if (x < -20 || x > width + 20) continue;

      // Draw tick
      ctx.beginPath();
      ctx.moveTo(x, height - 20);
      ctx.lineTo(x, height - 10);
      ctx.stroke();

      // Draw time label
      ctx.fillText(formatTime(time), x, height - 2);
    }
  }, []);

  /**
   * Draw segment rectangles on the timeline
   */
  const drawSegments = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const { duration, segments, selectedSegmentIndex, zoomLevel, scrollOffset } = lastOptionsRef.current;
    if (duration === 0) return;

    const visibleDuration = duration / zoomLevel;

    segments.forEach((segment, index) => {
      const startX = ((segment.start - scrollOffset) / visibleDuration) * width;
      const endX = ((segment.end - scrollOffset) / visibleDuration) * width;
      const segmentWidth = endX - startX;

      // Skip if not visible
      if (endX < 0 || startX > width) return;

      // Determine segment color
      let fillColor = '#ffffff';
      let strokeColor = '#e0e0e0';

      if (segment.details) {
        fillColor = '#f0fff4'; // Green tint for segments with details
        strokeColor = '#48bb78';
      }

      if (selectedSegmentIndex === index) {
        fillColor = '#fff5e6'; // Orange tint for selected
        strokeColor = '#f59e0b';
      }

      // Draw segment rectangle
      ctx.fillStyle = fillColor;
      ctx.fillRect(startX, 30, segmentWidth, height - 60);

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, 30, segmentWidth, height - 60);

      // Draw segment number if visible
      if (segmentWidth > 30) {
        ctx.fillStyle = '#667eea';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`#${index + 1}`, startX + segmentWidth / 2, 55);
      }
    });
  }, []);

  /**
   * Draw cut points on the timeline
   */
  const drawCutPoints = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const { duration, cutPoints, selectedCutPointId, zoomLevel, scrollOffset } = lastOptionsRef.current;
    if (duration === 0) return;

    const visibleDuration = duration / zoomLevel;

    cutPoints.forEach((cutPoint) => {
      const x = ((cutPoint.time - scrollOffset) / visibleDuration) * width;

      // Skip if not visible
      if (x < -10 || x > width + 10) return;

      const isSelected = selectedCutPointId === cutPoint.id;

      // Color based on type and selection
      let color = cutPoint.type === 'auto' ? '#667eea' : '#48bb78';
      if (isSelected) {
        color = '#ef4444'; // Red for selected
      }

      // Draw vertical line
      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected ? 4 : 3;
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, height - 30);
      ctx.stroke();

      // Draw handle (circle at top)
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, 20, isSelected ? 10 : 8, 0, Math.PI * 2);
      ctx.fill();

      // Draw white border around handle
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, []);

  /**
   * Draw playhead (current time indicator)
   */
  const drawPlayhead = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const { currentTime, duration, zoomLevel, scrollOffset } = lastOptionsRef.current;
    if (currentTime === 0 || duration === 0) return;

    const visibleDuration = duration / zoomLevel;
    const x = ((currentTime - scrollOffset) / visibleDuration) * width;

    // Skip if not visible
    if (x < -10 || x > width + 10) return;

    // Draw playhead line (dashed)
    ctx.strokeStyle = '#fc8181';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw playhead triangle at top
    ctx.fillStyle = '#fc8181';
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - 6, 10);
    ctx.lineTo(x + 6, 10);
    ctx.closePath();
    ctx.fill();
  }, []);

  /**
   * Main draw function - renders entire timeline
   */
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const context = getCanvasContext();
    if (!canvas || !context) return;

    const { ctx, width, height, dpr } = context;

    // Clear canvas (need to clear at full resolution)
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.restore();

    // Draw background
    ctx.fillStyle = '#f8f9ff';
    ctx.fillRect(0, 0, width, height);

    // Draw layers in order
    drawTimeMarkers(ctx, width, height);
    drawSegments(ctx, width, height);
    drawCutPoints(ctx, width, height);
    drawPlayhead(ctx, width, height);
  }, [canvasRef, getCanvasContext, drawTimeMarkers, drawSegments, drawCutPoints, drawPlayhead]);

  // Resize observer for responsive canvas
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const observer = new ResizeObserver(() => {
      resizeCanvas();
      redraw();
    });

    observer.observe(wrapper);
    resizeCanvas();

    return () => {
      observer.disconnect();
    };
  }, [wrapperRef, resizeCanvas, redraw]);

  // Redraw when options change
  useEffect(() => {
    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Schedule redraw on next animation frame
    animationFrameRef.current = requestAnimationFrame(redraw);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    options.duration,
    options.cutPoints,
    options.segments,
    options.currentTime,
    options.selectedSegmentIndex,
    options.selectedCutPointId,
    options.zoomLevel,
    options.scrollOffset,
    redraw,
  ]);

  return {
    getTimeFromX,
    getXFromTime,
    redraw,
    resizeCanvas,
  };
}
