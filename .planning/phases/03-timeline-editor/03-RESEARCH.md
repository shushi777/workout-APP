# Phase 3: Timeline Editor - Research

**Researched:** 2026-02-03
**Domain:** Canvas-based Timeline Video Editor with Drag-and-Drop Cut Points, Segment Tagging, and Mobile-First UI
**Confidence:** MEDIUM-HIGH

## Summary

Phase 3 implements an interactive timeline editor for workout videos with Canvas-based visualization, drag-and-drop cut point manipulation, segment preview, and exercise tagging via bottom drawer. This is the most complex UI phase, combining canvas rendering, video playback control, touch-optimized drag interactions, autocomplete tagging, and mobile drawer patterns.

The existing vanilla JS implementation provides a proven architecture: HTML Canvas for timeline visualization with manual rendering using devicePixelRatio scaling, native HTML5 video with timeupdate events for segment playback control, and bottom sheet drawer for mobile-first tagging UI. The key challenge is migrating this canvas-heavy, event-driven architecture to React while maintaining performance and touch responsiveness.

**Critical technical decisions:**
1. **DO NOT use a timeline library** - The existing canvas implementation is custom and proven. Libraries like react-timeline-editor are designed for animation timelines, not video editing with draggable cut points. Custom canvas rendering gives full control over mobile touch optimization.
2. **Use native HTML5 video element** - No video.js or react-player needed. The existing implementation proves timeupdate events + currentTime control are sufficient for segment playback.
3. **Use shadcn/ui Drawer for bottom sheet** - Matches existing mobile drawer pattern with swipe gestures, slide animations, and accessibility.
4. **Use dnd-kit for cut point dragging** - Touch-optimized, performance-focused, works with canvas via overlay technique.

**Primary recommendation:** Build custom Canvas timeline component with useRef + useEffect for rendering, dnd-kit for drag interactions via transparent overlay, native HTML5 video with timeupdate event listeners for segment control, shadcn/ui Drawer for mobile tagging sheet, and Material UI Autocomplete for chip-based tag input.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Custom Canvas** | N/A | Timeline visualization | Existing implementation is proven, libraries don't fit video editing use case, full control over touch/mobile optimization |
| **Native HTML5 Video** | N/A | Video playback | Existing implementation uses timeupdate events successfully, no need for library overhead |
| **dnd-kit** | 6.x | Drag-and-drop cut points | Modern, touch-optimized, performance-focused, works with canvas via overlay technique |
| **shadcn/ui Drawer** | latest | Bottom sheet mobile drawer | Built on Vaul, swipe gestures, slide animations, accessibility, matches existing pattern |
| **Material UI Autocomplete** | 6.x | Tag input with autocomplete | Most mature autocomplete solution, built-in chip support, accessibility, Hebrew RTL support |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.562.x | Icons (already from Phase 1) | Scissors, play, tag icons |
| clsx + tailwind-merge | (cn utility from Phase 1) | Conditional styling | Segment states, drawer open/close |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom canvas | react-timeline-editor | Library designed for animation timelines, not video editing; overkill and doesn't match existing UX |
| Custom canvas | Konva.js for React | Adds 80KB bundle, existing vanilla implementation shows plain canvas is sufficient |
| Native video | video.js / react-player | Existing implementation proves native video + timeupdate is enough; libraries add complexity |
| Material UI Autocomplete | Custom autocomplete | MUI handles edge cases, accessibility, RTL, keyboard navigation automatically |
| shadcn/ui Drawer | Material UI Drawer | MUI Drawer is sidebar-focused, shadcn/ui Drawer is mobile bottom sheet |
| dnd-kit | react-beautiful-dnd | react-beautiful-dnd is list-focused, dnd-kit is more flexible for custom canvas scenarios |

**Installation:**
```bash
cd frontend

# Drag and drop
npm install @dnd-kit/core @dnd-kit/utilities

# Bottom drawer (shadcn/ui)
npx shadcn@latest add drawer

# Autocomplete with chips
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled

# Already installed from Phase 1: lucide-react, clsx, tailwind-merge
```

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/
├── components/
│   ├── ui/
│   │   ├── Button.tsx              # Already exists from Phase 1
│   │   ├── ProgressBar.tsx         # Already exists from Phase 2
│   │   └── drawer.tsx              # NEW: shadcn/ui Drawer (auto-generated)
│   ├── timeline/
│   │   ├── TimelineCanvas.tsx      # NEW: Canvas rendering + drag overlay
│   │   ├── VideoPlayer.tsx         # NEW: Custom video player with controls
│   │   ├── CutPointLegend.tsx      # NEW: Legend showing auto/manual/selected
│   │   └── SegmentCard.tsx         # NEW: Segment card with badge
│   ├── tagging/
│   │   ├── SegmentDrawer.tsx       # NEW: Bottom sheet with video preview + form
│   │   ├── AutocompleteChips.tsx   # NEW: MUI Autocomplete with chips
│   │   └── VideoPreview.tsx        # NEW: Small segment preview player
│   └── settings/
│       └── DetectionSettings.tsx   # NEW: Collapsible detection settings
├── stores/
│   ├── uiStore.ts                  # Already exists from Phase 1
│   ├── uploadStore.ts              # Already exists from Phase 2
│   └── timelineStore.ts            # NEW: Timeline state (cuts, segments, selection)
├── hooks/
│   ├── useVideoSegmentPlayback.ts  # NEW: Segment playback with timeupdate cleanup
│   └── useCanvasTimeline.ts        # NEW: Canvas rendering with DPR scaling
├── lib/
│   ├── utils.ts                    # Already exists from Phase 1
│   └── api.ts                      # Already exists from Phase 2
├── pages/
│   └── EditorPage.tsx              # UPDATE: Main timeline editor page
└── ...
```

### Pattern 1: Custom Canvas Timeline with useRef + useEffect
**What:** Canvas timeline rendered manually in React with devicePixelRatio scaling
**When to use:** Timeline visualization with cut points, segments, playhead
**Example:**
```typescript
// Source: Existing vanilla JS implementation pattern, adapted to React
import { useRef, useEffect } from 'react';

interface CutPoint {
  time: number;
  type: 'auto' | 'manual';
  id: string;
}

interface TimelineCanvasProps {
  videoDuration: number;
  cutPoints: CutPoint[];
  currentTime: number;
  selectedSegmentIndex: number | null;
  onCutPointDrag: (id: string, newTime: number) => void;
  onSegmentClick: (index: number) => void;
}

export function TimelineCanvas({
  videoDuration,
  cutPoints,
  currentTime,
  selectedSegmentIndex,
  onCutPointDrag,
  onSegmentClick
}: TimelineCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Resize canvas with device pixel ratio for sharp rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = 150 * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    canvas.style.width = rect.width + 'px';
    canvas.style.height = '150px';
  }, []);

  // Render timeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || videoDuration === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#f8f9ff';
    ctx.fillRect(0, 0, width, height);

    // Draw time markers (every 5 seconds)
    drawTimeMarkers(ctx, width, height, videoDuration);

    // Draw segments
    const segments = getSegmentsFromCutPoints(cutPoints, videoDuration);
    drawSegments(ctx, width, height, segments, selectedSegmentIndex);

    // Draw cut points
    drawCutPoints(ctx, width, height, cutPoints, videoDuration);

    // Draw playhead
    drawPlayhead(ctx, width, height, currentTime, videoDuration);
  }, [videoDuration, cutPoints, currentTime, selectedSegmentIndex]);

  return (
    <div ref={wrapperRef} className="relative">
      <canvas
        ref={canvasRef}
        className="block w-full h-[150px] cursor-crosshair touch-none"
      />
      {/* dnd-kit overlay goes here - see Pattern 2 */}
    </div>
  );
}

// Helper functions match existing vanilla JS implementation
function drawTimeMarkers(ctx: CanvasRenderingContext2D, width: number, height: number, duration: number) {
  const markerInterval = 5; // seconds
  const markerCount = Math.ceil(duration / markerInterval);

  ctx.strokeStyle = '#e0e0e0';
  ctx.fillStyle = '#999';
  ctx.font = '11px Arial';
  ctx.textAlign = 'center';

  for (let i = 0; i <= markerCount; i++) {
    const time = i * markerInterval;
    if (time > duration) break;

    const x = (time / duration) * width;

    ctx.beginPath();
    ctx.moveTo(x, height - 20);
    ctx.lineTo(x, height - 10);
    ctx.stroke();

    ctx.fillText(formatTime(time), x, height - 2);
  }
}

// ... other drawing functions
```

### Pattern 2: dnd-kit Drag Overlay on Canvas
**What:** Transparent overlay with draggable cut point handles positioned over canvas
**When to use:** Making canvas elements draggable with touch support
**Example:**
```typescript
// Source: dnd-kit docs + custom canvas integration pattern
import { DndContext, useSensor, useSensors, MouseSensor, TouchSensor, DragEndEvent } from '@dnd-kit/core';
import { useRef } from 'react';

interface DraggableCutPoint {
  id: string;
  time: number;
  type: 'auto' | 'manual';
}

export function TimelineWithDrag({ cutPoints, videoDuration, onCutPointDrag }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Configure sensors for mouse and touch
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // 5px tolerance before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // 100ms delay to allow scrolling
        tolerance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const canvasWidth = canvasRef.current?.clientWidth || 0;

    // Calculate new time based on pixel movement
    const timeChange = (delta.x / canvasWidth) * videoDuration;
    const cutPoint = cutPoints.find(cp => cp.id === active.id);
    if (cutPoint) {
      const newTime = Math.max(0, Math.min(videoDuration, cutPoint.time + timeChange));
      onCutPointDrag(active.id, newTime);
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="relative">
        <canvas ref={canvasRef} className="block w-full h-[150px]" />

        {/* Draggable overlays positioned over cut points */}
        {cutPoints.map(cutPoint => {
          const x = (cutPoint.time / videoDuration) * (canvasRef.current?.clientWidth || 0);
          return (
            <DraggableCutPointHandle
              key={cutPoint.id}
              id={cutPoint.id}
              x={x}
              type={cutPoint.type}
            />
          );
        })}
      </div>
    </DndContext>
  );
}
```

### Pattern 3: Segment Playback with timeupdate Event Cleanup
**What:** Play video segment with automatic stop at segment end, proper event cleanup
**When to use:** Previewing segments in main player or drawer
**Example:**
```typescript
// Source: Existing vanilla JS implementation pattern, adapted to React hook
import { useEffect, useRef } from 'react';

export function useVideoSegmentPlayback(
  videoRef: React.RefObject<HTMLVideoElement>,
  segment: { start: number; end: number } | null,
  autoPlay: boolean = false
) {
  const listenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !segment) return;

    // Seek to segment start
    video.currentTime = segment.start;

    // Auto-play if enabled
    if (autoPlay) {
      video.play().catch(err => {
        console.log('Auto-play prevented:', err);
      });
    }

    // Create listener to stop at segment end
    const listener = () => {
      if (video.currentTime >= segment.end) {
        video.pause();
      }
    };

    // Store listener for cleanup
    listenerRef.current = listener;
    video.addEventListener('timeupdate', listener);

    // Cleanup on unmount or segment change
    return () => {
      if (listenerRef.current) {
        video.removeEventListener('timeupdate', listenerRef.current);
        listenerRef.current = null;
      }
    };
  }, [videoRef, segment, autoPlay]);
}

// Usage in component
function VideoPlayer({ segment, autoPlay }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useVideoSegmentPlayback(videoRef, segment, autoPlay);

  return <video ref={videoRef} src={videoUrl} />;
}
```

### Pattern 4: shadcn/ui Drawer for Mobile Bottom Sheet
**What:** Mobile-optimized bottom sheet with swipe gestures and slide animation
**When to use:** Segment tagging interface on mobile
**Example:**
```typescript
// Source: shadcn/ui Drawer docs
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { useState } from 'react';
import { X } from 'lucide-react';

interface SegmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  segment: Segment | null;
  segmentIndex: number | null;
}

export function SegmentDrawer({ isOpen, onClose, segment, segmentIndex }: SegmentDrawerProps) {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[95vh]">
        <DrawerHeader className="flex items-center justify-between border-b border-gray-800 pb-4">
          <DrawerTitle>
            פרטי סגמנט #{segmentIndex !== null ? segmentIndex + 1 : ''}
          </DrawerTitle>
          <DrawerClose asChild>
            <button className="rounded-full p-2 hover:bg-gray-800">
              <X className="w-6 h-6" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="overflow-y-auto p-4">
          {/* Video preview */}
          <VideoPreview segment={segment} />

          {/* Exercise form */}
          <ExerciseForm segment={segment} onSave={handleSave} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
```

### Pattern 5: Material UI Autocomplete with Chips
**What:** Tag input with autocomplete dropdown and chip display
**When to use:** Muscle groups and equipment tagging
**Example:**
```typescript
// Source: Material UI Autocomplete + Chip docs
import { Autocomplete, Chip, TextField } from '@mui/material';
import { useState } from 'react';

interface AutocompleteChipsProps {
  label: string;
  options: string[];
  value: string[];
  onChange: (newValue: string[]) => void;
  placeholder?: string;
}

export function AutocompleteChips({
  label,
  options,
  value,
  onChange,
  placeholder
}: AutocompleteChipsProps) {
  return (
    <Autocomplete
      multiple
      freeSolo
      options={options}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => (
          <Chip
            label={option}
            {...getTagProps({ index })}
            className="bg-blue-600 text-white"
          />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          variant="outlined"
          // Custom dark theme styling for Tailwind consistency
          sx={{
            '& .MuiOutlinedInput-root': {
              color: 'rgb(243 244 246)', // text-gray-100
              backgroundColor: 'rgb(17 24 39)', // bg-gray-900
              '& fieldset': {
                borderColor: 'rgb(55 65 81)', // border-gray-700
              },
              '&:hover fieldset': {
                borderColor: 'rgb(75 85 99)', // border-gray-600
              },
              '&.Mui-focused fieldset': {
                borderColor: 'rgb(37 99 235)', // border-blue-600
              },
            },
            '& .MuiInputLabel-root': {
              color: 'rgb(156 163 175)', // text-gray-400
            },
          }}
        />
      )}
    />
  );
}
```

### Pattern 6: Zustand Timeline Store
**What:** Zustand store for timeline state with cut points, segments, selection
**When to use:** Managing timeline editor state across components
**Example:**
```typescript
// Source: Zustand docs + existing vanilla JS state structure
import { create } from 'zustand';

interface CutPoint {
  time: number;
  type: 'auto' | 'manual';
  id: string;
}

interface SegmentDetails {
  name: string;
  muscleGroups: string[];
  equipment: string[];
  removeAudio: boolean;
}

interface Segment {
  start: number;
  end: number;
  details: SegmentDetails | null;
}

interface TimelineState {
  // Video
  videoUrl: string | null;
  videoDuration: number;

  // Timeline
  cutPoints: CutPoint[];
  segments: Segment[];
  selectedSegmentIndex: number | null;
  selectedCutPointId: string | null;

  // Playback
  currentTime: number;
  isPlaying: boolean;

  // Existing tags for autocomplete
  existingTags: {
    muscleGroups: string[];
    equipment: string[];
  };

  // Actions
  loadVideo: (url: string, duration: number, suggestedCuts: number[]) => void;
  addCutPoint: (time: number) => void;
  updateCutPoint: (id: string, newTime: number) => void;
  deleteCutPoint: (id: string) => void;
  selectCutPoint: (id: string | null) => void;
  selectSegment: (index: number | null) => void;
  updateSegmentDetails: (index: number, details: SegmentDetails) => void;
  setCurrentTime: (time: number) => void;
  setPlaying: (playing: boolean) => void;
  loadExistingTags: (tags: { muscleGroups: string[]; equipment: string[] }) => void;
}

export const useTimelineStore = create<TimelineState>()((set, get) => ({
  videoUrl: null,
  videoDuration: 0,
  cutPoints: [],
  segments: [],
  selectedSegmentIndex: null,
  selectedCutPointId: null,
  currentTime: 0,
  isPlaying: false,
  existingTags: { muscleGroups: [], equipment: [] },

  loadVideo: (url, duration, suggestedCuts) => {
    const cutPoints = suggestedCuts.map((time, index) => ({
      time,
      type: 'auto' as const,
      id: `auto_${index}`,
    }));

    set({
      videoUrl: url,
      videoDuration: duration,
      cutPoints,
      segments: getSegmentsFromCutPoints(cutPoints, duration),
      currentTime: 0,
      selectedSegmentIndex: null,
      selectedCutPointId: null,
    });
  },

  addCutPoint: (time) => {
    const newCutPoint = {
      time,
      type: 'manual' as const,
      id: `manual_${Date.now()}`,
    };

    const newCutPoints = [...get().cutPoints, newCutPoint].sort((a, b) => a.time - b.time);

    set({
      cutPoints: newCutPoints,
      segments: getSegmentsFromCutPoints(newCutPoints, get().videoDuration),
    });
  },

  updateCutPoint: (id, newTime) => {
    const newCutPoints = get().cutPoints.map(cp =>
      cp.id === id ? { ...cp, time: newTime } : cp
    ).sort((a, b) => a.time - b.time);

    set({
      cutPoints: newCutPoints,
      segments: getSegmentsFromCutPoints(newCutPoints, get().videoDuration),
    });
  },

  deleteCutPoint: (id) => {
    const newCutPoints = get().cutPoints.filter(cp => cp.id !== id);

    set({
      cutPoints: newCutPoints,
      segments: getSegmentsFromCutPoints(newCutPoints, get().videoDuration),
      selectedCutPointId: null,
    });
  },

  selectCutPoint: (id) => set({ selectedCutPointId: id }),
  selectSegment: (index) => set({ selectedSegmentIndex: index }),

  updateSegmentDetails: (index, details) => {
    const segments = get().segments;
    const newSegments = segments.map((seg, i) =>
      i === index ? { ...seg, details } : seg
    );
    set({ segments: newSegments });
  },

  setCurrentTime: (time) => set({ currentTime: time }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  loadExistingTags: (tags) => set({ existingTags: tags }),
}));

// Helper function to generate segments from cut points
function getSegmentsFromCutPoints(cutPoints: CutPoint[], duration: number): Segment[] {
  if (cutPoints.length === 0) {
    return [{ start: 0, end: duration, details: null }];
  }

  const segments: Segment[] = [];

  // First segment
  segments.push({ start: 0, end: cutPoints[0].time, details: null });

  // Middle segments
  for (let i = 0; i < cutPoints.length - 1; i++) {
    segments.push({
      start: cutPoints[i].time,
      end: cutPoints[i + 1].time,
      details: null,
    });
  }

  // Last segment
  segments.push({
    start: cutPoints[cutPoints.length - 1].time,
    end: duration,
    details: null,
  });

  return segments;
}
```

### Anti-Patterns to Avoid

- **Using a timeline library for video editing:** Animation timeline libraries (react-timeline-editor, animation-timeline-control) don't fit video editing use cases; custom canvas gives full control
- **Wrapping video in a library:** video.js/react-player add complexity; native HTML5 video + timeupdate is sufficient
- **Using Media Fragments URI for playback control:** While `#t=start,end` works for drawer preview, main player needs precise timeupdate control for stopping at segment end
- **Forgetting devicePixelRatio scaling:** Canvas looks blurry on retina displays without DPR scaling
- **Not cleaning up timeupdate listeners:** Memory leaks from accumulated event listeners
- **Using requestAnimationFrame for playhead:** timeupdate event is sufficient and more accurate
- **Storing segments separately from cut points:** Segments should be dynamically calculated from cut points array

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bottom sheet drawer | Custom slide animation + gesture handling | shadcn/ui Drawer (Vaul) | Handles swipe gestures, accessibility, iOS safe area, edge cases |
| Autocomplete with chips | Custom dropdown + input | Material UI Autocomplete | Handles keyboard navigation, RTL, accessibility, filtering, edge cases |
| Drag and drop | Native HTML5 drag events | dnd-kit | Touch support, performance optimization, collision detection, sensors |
| Video time formatting | String manipulation | Shared utility function | Already proven in existing codebase |

**Key insight:** The existing vanilla JS implementation proves custom canvas is the right choice for timeline visualization. Don't replace it with a library. However, for UI components (drawer, autocomplete), use battle-tested libraries that handle accessibility and edge cases.

## Common Pitfalls

### Pitfall 1: Canvas Rendering Performance on Mobile
**What goes wrong:** Timeline rendering is slow or janky on mobile devices
**Why it happens:** Excessive re-renders, not using devicePixelRatio properly, rendering too frequently
**How to avoid:**
- Use `useEffect` dependencies carefully to only re-render when needed
- Scale canvas with devicePixelRatio for sharp rendering
- Debounce drag events if performance issues occur
- Use `touch-action: none` to prevent default touch behaviors
**Warning signs:** Laggy drag interactions, blurry timeline on retina displays

### Pitfall 2: timeupdate Event Listener Memory Leaks
**What goes wrong:** App slows down over time, video playback becomes laggy
**Why it happens:** Event listeners added but never removed, especially when switching segments
**How to avoid:**
- Store listener reference in useRef
- Remove listener in useEffect cleanup
- Always clean up when segment changes or component unmounts
**Warning signs:** Increasing memory usage in DevTools, multiple listeners firing for same event

### Pitfall 3: Segment Details Lost When Cut Points Change
**What goes wrong:** User tags a segment, adjusts cut points, loses all tag data
**Why it happens:** Regenerating segments array without preserving existing details
**How to avoid:**
- When recalculating segments from cut points, preserve details by segment index
- Match segments by approximate time ranges
- Warn user before actions that might lose data
**Warning signs:** User reports losing tags after adjusting timeline

### Pitfall 4: Canvas Click Positions Wrong on Scaled Canvas
**What goes wrong:** Click/touch on timeline registers at wrong position
**Why it happens:** Not accounting for devicePixelRatio in coordinate calculations
**How to avoid:**
- Use `canvas.getBoundingClientRect()` for click position
- Use clientWidth, not canvas.width, for coordinate calculations
- Test on high-DPI displays (retina)
**Warning signs:** Clicks register offset from visual position

### Pitfall 5: Material UI Theme Conflicts with Tailwind
**What goes wrong:** MUI components look broken or unstyled
**Why it happens:** Tailwind's base styles reset MUI's styles
**How to avoid:**
- Use MUI's `sx` prop to apply custom styles
- Override MUI theme to match Tailwind dark colors
- Test MUI components in dark mode
**Warning signs:** White text on white background, missing borders, broken layout

### Pitfall 6: Drawer Not Showing on Mobile
**What goes wrong:** Bottom drawer doesn't appear or appears off-screen
**Why it happens:** iOS safe area, viewport height issues, z-index conflicts
**How to avoid:**
- Use `max-h-[95vh]` for drawer content
- Add safe area padding for iOS
- Set appropriate z-index (2000+)
- Test on actual iOS device or simulator
**Warning signs:** Drawer cut off by home indicator, conflicts with bottom nav

### Pitfall 7: Cut Point Dragging Not Working on Touch
**What goes wrong:** User can't drag cut points on mobile
**Why it happens:** Touch events conflicting with scroll, activation constraints too strict
**How to avoid:**
- Configure TouchSensor with appropriate activation delay (100ms)
- Use `touch-action: none` on canvas
- Set tolerance to 5px to allow small movements
- Test on real mobile device
**Warning signs:** Drag works with mouse, fails on touch

### Pitfall 8: Video Plays Past Segment End
**What goes wrong:** Segment preview keeps playing after segment ends
**Why it happens:** timeupdate event not firing frequently enough, comparison using strict equality
**How to avoid:**
- Use `>=` comparison, not `===`
- Account for timeupdate firing ~250ms intervals
- Test with short segments (<1 second)
**Warning signs:** Segment plays 0.5-1 second past intended end time

## Code Examples

### Complete TimelineCanvas Component
```typescript
// src/components/timeline/TimelineCanvas.tsx
import { useRef, useEffect } from 'react';
import { useTimelineStore } from '@/stores/timelineStore';

export function TimelineCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const {
    videoDuration,
    cutPoints,
    currentTime,
    selectedSegmentIndex,
    segments,
  } = useTimelineStore();

  // Resize canvas with DPR
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const handleResize = () => {
      const rect = wrapper.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = 150 * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      canvas.style.width = rect.width + 'px';
      canvas.style.height = '150px';
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Render timeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || videoDuration === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#f8f9ff';
    ctx.fillRect(0, 0, width, height);

    // Time markers
    drawTimeMarkers(ctx, width, height, videoDuration);

    // Segments
    drawSegments(ctx, width, height, segments, selectedSegmentIndex);

    // Cut points
    drawCutPoints(ctx, width, height, cutPoints, videoDuration);

    // Playhead
    drawPlayhead(ctx, width, height, currentTime, videoDuration);
  }, [videoDuration, cutPoints, currentTime, selectedSegmentIndex, segments]);

  return (
    <div ref={wrapperRef} className="relative border-2 border-gray-700 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        className="block w-full h-[150px] cursor-crosshair touch-none"
      />
    </div>
  );
}

// Drawing functions (match existing vanilla JS implementation)
function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds === Infinity) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function drawTimeMarkers(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  duration: number
) {
  const markerInterval = 5;
  const markerCount = Math.ceil(duration / markerInterval);

  ctx.strokeStyle = '#e0e0e0';
  ctx.fillStyle = '#999';
  ctx.font = '11px Arial';
  ctx.textAlign = 'center';

  for (let i = 0; i <= markerCount; i++) {
    const time = i * markerInterval;
    if (time > duration) break;

    const x = (time / duration) * width;

    ctx.beginPath();
    ctx.moveTo(x, height - 20);
    ctx.lineTo(x, height - 10);
    ctx.stroke();

    ctx.fillText(formatTime(time), x, height - 2);
  }
}

function drawSegments(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  segments: Array<{ start: number; end: number; details: any }>,
  selectedIndex: number | null
) {
  const videoDuration = segments.length > 0
    ? segments[segments.length - 1].end
    : 0;

  segments.forEach((segment, index) => {
    const startX = (segment.start / videoDuration) * width;
    const endX = (segment.end / videoDuration) * width;
    const segmentWidth = endX - startX;

    let fillColor = '#ffffff';
    let strokeColor = '#e0e0e0';

    if (segment.details) {
      fillColor = '#f0fff4';
      strokeColor = '#48bb78';
    }

    if (selectedIndex === index) {
      fillColor = '#fff5e6';
      strokeColor = '#f59e0b';
    }

    ctx.fillStyle = fillColor;
    ctx.fillRect(startX, 30, segmentWidth, height - 60);

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, 30, segmentWidth, height - 60);

    ctx.fillStyle = '#667eea';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`#${index + 1}`, startX + segmentWidth / 2, 55);
  });
}

function drawCutPoints(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cutPoints: Array<{ time: number; type: string; id: string }>,
  duration: number
) {
  cutPoints.forEach(cutPoint => {
    const x = (cutPoint.time / duration) * width;
    const color = cutPoint.type === 'auto' ? '#667eea' : '#48bb78';

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, 20);
    ctx.lineTo(x, height - 30);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, 20, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function drawPlayhead(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  currentTime: number,
  duration: number
) {
  if (currentTime === 0) return;

  const x = (currentTime / duration) * width;

  ctx.strokeStyle = '#fc8181';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#fc8181';
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x - 6, 10);
  ctx.lineTo(x + 6, 10);
  ctx.closePath();
  ctx.fill();
}
```

### Complete Video Player with Custom Controls
```typescript
// src/components/timeline/VideoPlayer.tsx
import { useRef, useEffect, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { useTimelineStore } from '@/stores/timelineStore';
import { cn } from '@/lib/utils';

export function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showIcon, setShowIcon] = useState(false);

  const {
    videoUrl,
    videoDuration,
    currentTime,
    isPlaying,
    setCurrentTime,
    setPlaying,
  } = useTimelineStore();

  // Sync with video timeupdate
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [setCurrentTime, setPlaying]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }

    setShowIcon(true);
    setTimeout(() => setShowIcon(false), 800);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = (parseFloat(e.target.value) / 100) * videoDuration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <div className="bg-black rounded-xl overflow-hidden">
      {/* Video */}
      <div className="relative aspect-video bg-black cursor-pointer" onClick={togglePlayPause}>
        <video
          ref={videoRef}
          src={videoUrl || undefined}
          className="w-full h-full object-contain"
        />

        {/* Play/Pause Icon Overlay */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity",
            showIcon ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="bg-black/60 rounded-full w-24 h-24 flex items-center justify-center">
            {isPlaying ? (
              <Pause className="w-12 h-12 text-white" />
            ) : (
              <Play className="w-12 h-12 text-white" />
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gradient-to-b from-black/70 to-black/90 p-4 flex items-center gap-4">
        <div className="text-white text-sm font-medium min-w-[80px]">
          {formatTime(currentTime)} / {formatTime(videoDuration)}
        </div>

        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={(currentTime / videoDuration) * 100 || 0}
          onChange={handleSeek}
          className="flex-1 h-2 bg-white/30 rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer
                     dir-ltr"
          dir="ltr"
        />
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds === Infinity) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| jQuery timeline plugins | Custom React Canvas components | 2020+ | More control, better performance, no jQuery dependency |
| video.js for all video | Native HTML5 video for simple cases | 2022+ | Simpler, smaller bundle, sufficient for basic playback |
| react-beautiful-dnd | dnd-kit | 2023+ | Better touch support, more flexible, actively maintained |
| Custom bottom sheet | shadcn/ui Drawer (Vaul) | 2024+ | Better gestures, accessibility, iOS safe area |
| Custom autocomplete | Material UI Autocomplete | Stable | Handles edge cases, accessibility, RTL |
| Media Fragments for segments | timeupdate event control | Current | More precise control over segment end timing |

**Deprecated/outdated:**
- **react-beautiful-dnd:** Maintenance mode (not deprecated but dnd-kit preferred for new projects)
- **Animation timeline libraries for video:** Designed for animation keyframes, not video editing
- **react-player for simple video:** Overkill for basic video element needs

## Open Questions

1. **Should we implement zoom controls for timeline?**
   - What we know: Existing vanilla implementation mentions zoom (0.5x - 3x) in CLAUDE.md
   - What's unclear: No zoom controls visible in HTML or JS files reviewed
   - Recommendation: Defer to future phase; focus on core drag/tag functionality first

2. **Media Fragments URI vs timeupdate control**
   - What we know: Existing code uses timeupdate for main player, but Media Fragments (#t=start,end) could work for drawer preview
   - What's unclear: Whether Media Fragments are reliable across all browsers for preview
   - Recommendation: Use Media Fragments for drawer preview (simpler), timeupdate for main player (more control)

3. **Cut point selection for deletion**
   - What we know: Existing code has selectedCutPoint for deletion, delete button
   - What's unclear: Whether React version should allow multi-select for bulk delete
   - Recommendation: Start with single selection, add bulk delete in future if requested

4. **Undo/redo for timeline edits**
   - What we know: No undo in existing implementation
   - What's unclear: Whether users expect undo for cut point adjustments
   - Recommendation: Not in Phase 3; could add Zustand middleware for undo in future

## Sources

### Primary (HIGH confidence)
- [Existing timeline-editor.js implementation](file://C:\Users\OmriS\Desktop\workout_APP\static\js\timeline-editor.js) - Proven canvas rendering, segment playback, event cleanup patterns
- [Existing timeline-editor.html structure](file://C:\Users\OmriS\Desktop\workout_APP\timeline-editor.html) - Drawer layout, video controls, form structure
- [dnd-kit Documentation](https://docs.dndkit.com/) - Touch sensors, activation constraints, custom drag overlays
- [Material UI Autocomplete](https://mui.com/material-ui/react-autocomplete/) - Chip mode, freeSolo, custom styling
- [shadcn/ui Drawer](https://www.shadcn.io/patterns/drawer-bottom-1) - Mobile bottom sheet pattern
- [MDN Media Fragments](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment/Media_fragments) - #t=start,end syntax
- [W3C Media Fragments URI](https://www.w3.org/TR/media-frags/) - Official specification

### Secondary (MEDIUM confidence)
- [Twick React Timeline SDK](https://github.com/ncounterspecialist/twick) - Modern React video editor architecture reference
- [animation-timeline-control](https://github.com/ievgennaida/animation-timeline-control) - Canvas timeline dragging patterns
- [Konva.js Mobile Touch Events](https://konvajs.org/docs/events/Mobile_Events.html) - Canvas touch event handling
- [dnd-kit Blog Post (Puck)](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react) - dnd-kit comparison and rationale
- [LogRocket Video Playback Guide](https://blog.logrocket.com/a-comprehensive-guide-to-video-playback-in-react/) - React video patterns

### Tertiary (LOW confidence)
- [React timeline editor libraries](https://www.reactvideoeditor.com/docs/core/components/timeline) - Commercial solutions, not applicable but shows patterns
- [HTML5 Video Fragments Tutorial](https://www.sitepoint.com/html5-video-fragments-captions-dynamic-thumbnails/) - Media Fragments examples

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM-HIGH - Custom canvas is proven from existing code, but React integration needs validation
- Architecture: HIGH - Existing vanilla implementation provides proven patterns to follow
- Pitfalls: MEDIUM - Common React pitfalls known, but canvas + video + touch interaction has edge cases

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - libraries are stable, canvas APIs are standard)

**Key unknowns requiring validation:**
- dnd-kit overlay technique with custom canvas (needs prototype)
- Material UI dark theme styling with Tailwind (needs testing)
- Touch drag performance on actual mobile devices (needs device testing)
- Segment details preservation during cut point adjustments (needs careful implementation)
