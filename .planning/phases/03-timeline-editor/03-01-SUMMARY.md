---
phase: 03-timeline-editor
plan: 01
subsystem: timeline
tags: [canvas, dnd-kit, zustand, timeline, drag-drop]

dependency-graph:
  requires:
    - 01-foundation (React, Vite, Tailwind)
    - 02-upload-feature (Navigation to /editor)
  provides:
    - Canvas-based timeline rendering
    - Cut point drag-and-drop
    - Timeline state management (Zustand)
  affects:
    - 03-02 (Video player integration)
    - 03-03 (Segment tagging drawer)
    - 03-04 (Save functionality)

tech-stack:
  added:
    - "@dnd-kit/core": "^6.x"
    - "@dnd-kit/utilities": "^3.x"
  patterns:
    - "Canvas rendering with devicePixelRatio scaling"
    - "DndContext with MouseSensor and TouchSensor"
    - "Zustand store for timeline state"
    - "Segment regeneration with detail preservation"

key-files:
  created:
    - "frontend/src/stores/timelineStore.ts"
    - "frontend/src/hooks/useCanvasTimeline.ts"
    - "frontend/src/components/timeline/TimelineCanvas.tsx"
    - "frontend/src/components/timeline/DraggableCutPoint.tsx"
    - "frontend/src/components/timeline/index.ts"
  modified:
    - "frontend/package.json"
    - "frontend/src/pages/EditorPage.tsx"
    - "frontend/src/lib/api.ts"
    - "frontend/src/components/ui/Button.tsx"

decisions:
  - id: dnd-kit-sensors
    choice: "MouseSensor (5px) + TouchSensor (100ms delay)"
    rationale: "Prevents accidental drags while remaining responsive"
  - id: segment-preservation
    choice: "1 second tolerance with 80% overlap matching"
    rationale: "Preserves exercise details when cut points are adjusted slightly"
  - id: zoom-range
    choice: "0.5x to 3.0x with 0.5 step increments"
    rationale: "Sufficient for both overview and precision editing"

metrics:
  duration: "8 min"
  completed: "2026-02-03"
---

# Phase 03 Plan 01: Canvas Timeline Core Summary

**Canvas timeline with dnd-kit drag-and-drop, Zustand state management, and high-DPI rendering supporting cut point manipulation and zoom controls**

## Accomplishments

- Created timelineStore with Zustand for complete timeline state management
- Implemented useCanvasTimeline hook with devicePixelRatio scaling for retina displays
- Built TimelineCanvas component with DndContext, draggable cut points, and zoom controls
- Wired EditorPage to parse URL params and initialize timeline from upload flow
- Added getTags API for fetching existing tags for future autocomplete

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install dnd-kit and create timelineStore | `3cea0ee` | package.json, timelineStore.ts, Button.tsx |
| 2a | Create useCanvasTimeline hook | `0745691` | useCanvasTimeline.ts |
| 2b | Create TimelineCanvas component with dnd-kit | `e46c9e1` | TimelineCanvas.tsx, DraggableCutPoint.tsx, index.ts |
| 3 | Wire EditorPage with URL params and timeline | `d6b2f26` | EditorPage.tsx, api.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed TypeScript import in Button.tsx**
- **Found during:** Task 1 (build verification)
- **Issue:** `ButtonHTMLAttributes` needed type-only import with `verbatimModuleSyntax`
- **Fix:** Changed to `import type { ButtonHTMLAttributes } from 'react'`
- **Files modified:** `frontend/src/components/ui/Button.tsx`
- **Commit:** `3cea0ee`

**2. [Rule 3 - Blocking] Fixed process.env usage in EditorPage**
- **Found during:** Task 3 (build verification)
- **Issue:** `process.env.NODE_ENV` not available in Vite without @types/node
- **Fix:** Changed to `import.meta.env.DEV` (Vite's environment variable pattern)
- **Files modified:** `frontend/src/pages/EditorPage.tsx`
- **Commit:** `d6b2f26`

## Patterns Established

1. **Canvas rendering pattern:** High-DPI with devicePixelRatio scaling, resize observer, requestAnimationFrame
2. **Drag-and-drop pattern:** DndContext with MouseSensor (5px) and TouchSensor (100ms delay)
3. **Segment preservation pattern:** 1-second tolerance matching with 80% overlap detection
4. **URL-based state initialization:** Parse query params, load video metadata, initialize store

## Integration Points

- **Upload flow:** UploadPage redirects to `/editor?video=...&cuts=...` after processing
- **Video loading:** EditorPage creates hidden video element to get duration metadata
- **Tags API:** `/get-tags` endpoint returns muscle groups and equipment for autocomplete

## Key Code Patterns

### Timeline Store State
```typescript
interface TimelineState {
  videoUrl: string | null;
  videoDuration: number;
  cutPoints: CutPoint[];
  segments: Segment[];
  selectedSegmentIndex: number | null;
  selectedCutPointId: string | null;
  zoomLevel: number;
  currentTime: number;
  isPlaying: boolean;
  existingTags: { muscleGroups: string[]; equipment: string[] };
}
```

### Canvas Drawing Layers
1. Background (#f8f9ff)
2. Time markers (zoom-aware intervals)
3. Segments (white/green/orange based on state)
4. Cut points (blue=auto, green=manual, red=selected)
5. Playhead (red dashed line with triangle)

## Verification Results

- Build: Passes with no TypeScript errors
- useCanvasTimeline.ts: 359 lines (> 100 required)
- TimelineCanvas.tsx: 279 lines (> 150 required)
- Key links verified: loadVideo called with URL params, DndContext with sensors

## Next Phase Readiness

### Ready for 03-02 (Video Player):
- TimelineCanvas renders and can receive currentTime updates
- Store has setCurrentTime and setPlaying actions ready
- EditorPage has placeholder video element position

### Required for 03-03 (Segment Drawer):
- selectSegment action implemented
- selectedSegmentIndex tracked in store
- Segment cards clickable (need onClick handler wiring)
