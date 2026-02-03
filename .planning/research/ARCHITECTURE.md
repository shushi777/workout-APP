# Architecture Patterns: React Mobile PWA with Flask Backend

**Domain:** Mobile-first PWA video editor with existing Flask API
**Researched:** 2026-02-03
**Confidence:** HIGH (verified patterns, existing codebase analysis)

## Executive Summary

This document defines the recommended architecture for rebuilding the Workout Video Editor frontend in React while keeping the existing Flask backend unchanged. The architecture follows an **App Shell pattern** with **feature-based organization**, using **React Router v6** for tab navigation and **Zustand** for state management.

---

## Recommended Architecture

### High-Level Overview

```
+--------------------------------------------------+
|                   React PWA                       |
|  +--------------------------------------------+  |
|  |              App Shell                      |  |
|  |  +--------+  +--------+  +--------+        |  |
|  |  | Upload |  |Timeline|  |Library |        |  |
|  |  |  Tab   |  | Editor |  |  Tab   |        |  |
|  |  +--------+  +--------+  +--------+        |  |
|  |                                            |  |
|  |  [Bottom Navigation Bar - Mobile Only]     |  |
|  +--------------------------------------------+  |
|                       |                          |
|              Service Worker                      |
|         (Caching, Offline, Share Target)         |
+--------------------------------------------------+
                        |
                   HTTP/JSON
                        |
+--------------------------------------------------+
|              Flask Backend (Unchanged)            |
|  /process, /api/timeline/save, /api/exercises    |
|  /get-tags, /download/<folder>/<file>            |
+--------------------------------------------------+
                        |
              PostgreSQL + Cloudflare R2
```

### Component Hierarchy

```
src/
  App.tsx                    # Root component, router setup
  |
  +-- components/
  |     +-- layout/
  |     |     AppShell.tsx       # App shell wrapper
  |     |     BottomNav.tsx      # Mobile bottom navigation
  |     |     Header.tsx         # Optional top header
  |     |
  |     +-- common/
  |           Button.tsx
  |           Chip.tsx
  |           Drawer.tsx
  |           LoadingSpinner.tsx
  |           ErrorMessage.tsx
  |
  +-- features/
  |     +-- upload/
  |     |     UploadPage.tsx
  |     |     DropZone.tsx
  |     |     ProcessingStatus.tsx
  |     |     useUpload.ts        # Custom hook
  |     |
  |     +-- timeline/
  |     |     TimelineEditorPage.tsx
  |     |     VideoPlayer.tsx
  |     |     TimelineCanvas.tsx   # Canvas wrapper
  |     |     SegmentsList.tsx
  |     |     SegmentCard.tsx
  |     |     SegmentDrawer.tsx
  |     |     ExerciseForm.tsx
  |     |     AutocompleteInput.tsx
  |     |     useTimeline.ts      # Timeline state hook
  |     |     useCanvasTimeline.ts # Canvas rendering hook
  |     |
  |     +-- library/
  |           LibraryPage.tsx
  |           ExerciseGrid.tsx
  |           ExerciseCard.tsx
  |           FilterBar.tsx
  |           SearchInput.tsx
  |           VideoModal.tsx
  |           useExercises.ts
  |
  +-- hooks/
  |     useApi.ts            # API client hook
  |     useMediaQuery.ts     # Responsive breakpoints
  |     usePWA.ts            # PWA install prompt
  |
  +-- stores/
  |     timelineStore.ts     # Zustand store for timeline
  |     exerciseStore.ts     # Zustand store for exercises
  |     uiStore.ts           # UI state (drawers, modals)
  |
  +-- services/
  |     api.ts               # API client (fetch wrapper)
  |     storage.ts           # LocalStorage utilities
  |
  +-- types/
  |     index.ts             # TypeScript interfaces
  |
  +-- styles/
        global.css
        variables.css
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `AppShell` | Layout wrapper, navigation state | BottomNav, Router outlet |
| `BottomNav` | Tab navigation, active state | React Router |
| `UploadPage` | Video upload orchestration | DropZone, ProcessingStatus, API |
| `TimelineEditorPage` | Timeline editing orchestration | VideoPlayer, TimelineCanvas, SegmentDrawer |
| `TimelineCanvas` | Canvas rendering, cut point interaction | Timeline store, VideoPlayer (time sync) |
| `VideoPlayer` | Video playback, custom controls | Timeline store (currentTime) |
| `SegmentDrawer` | Exercise tagging form | Timeline store, API (tags) |
| `LibraryPage` | Exercise browsing orchestration | FilterBar, ExerciseGrid, API |
| `ExerciseCard` | Single exercise display | VideoModal (on click) |

### Data Flow

```
User Action
    |
    v
Component Event Handler
    |
    v
Zustand Store Action (or useState for local state)
    |
    v
Store State Update
    |
    v
React Re-render (subscribed components)
    |
    v
UI Update

API Calls:
Component -> useApi hook -> fetch() -> Flask Backend -> JSON Response -> Store Update
```

---

## Patterns to Follow

### Pattern 1: Feature-Based Folder Structure

**What:** Organize code by feature/domain rather than by type (components, hooks, utils).

**Why:**
- Co-locates related code (easier to find)
- Enables feature-level code splitting
- Scales better as app grows
- Each feature is self-contained

**Example:**
```
features/
  timeline/
    TimelineEditorPage.tsx    # Page component
    TimelineCanvas.tsx        # Feature-specific component
    useTimeline.ts            # Feature-specific hook
    timeline.types.ts         # Feature-specific types
    index.ts                  # Public exports
```

### Pattern 2: Canvas in React with useRef + useEffect

**What:** Wrap imperative Canvas API in a React component using refs and effects.

**Why:** The existing timeline-editor.js has complex Canvas logic (1300+ lines). We need to preserve this logic while making it React-friendly.

**Example:**
```typescript
// TimelineCanvas.tsx
import { useRef, useEffect, useCallback } from 'react';
import { useTimelineStore } from '@/stores/timelineStore';

export function TimelineCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { cutPoints, segments, currentTime, videoDuration } = useTimelineStore();

  // Resize handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = 150 * dpr;
      canvas.getContext('2d')?.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Draw timeline
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !videoDuration) return;

    // Clear and draw (port existing drawTimeline logic)
    drawTimeline(ctx, { cutPoints, segments, currentTime, videoDuration });
  }, [cutPoints, segments, currentTime, videoDuration]);

  // Mouse/touch handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Port existing handleTimelinePress logic
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ width: '100%', height: '150px', cursor: 'crosshair' }}
    />
  );
}
```

### Pattern 3: Zustand for Global State

**What:** Use Zustand for global state (timeline, exercises) instead of Redux or Context.

**Why:**
- Minimal boilerplate (no providers, reducers, action creators)
- TypeScript-friendly
- Supports selectors for performance
- Works outside React components (useful for Canvas callbacks)
- Small bundle size (~1KB)

**Example:**
```typescript
// stores/timelineStore.ts
import { create } from 'zustand';

interface CutPoint {
  time: number;
  type: 'auto' | 'manual';
  id: string;
}

interface Segment {
  start: number;
  end: number;
  details: {
    name: string;
    muscleGroups: string[];
    equipment: string[];
    removeAudio: boolean;
  } | null;
}

interface TimelineState {
  videoUrl: string | null;
  videoDuration: number;
  currentTime: number;
  isPlaying: boolean;
  cutPoints: CutPoint[];
  segments: Segment[];
  selectedSegmentIndex: number | null;
  draggingCutPoint: CutPoint | null;

  // Actions
  setVideoUrl: (url: string) => void;
  setVideoDuration: (duration: number) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  addCutPoint: (time: number, type: 'auto' | 'manual') => void;
  removeCutPoint: (id: string) => void;
  updateCutPointTime: (id: string, time: number) => void;
  selectSegment: (index: number | null) => void;
  saveSegmentDetails: (index: number, details: Segment['details']) => void;
  loadSuggestedCuts: (cuts: number[]) => void;
  reset: () => void;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  videoUrl: null,
  videoDuration: 0,
  currentTime: 0,
  isPlaying: false,
  cutPoints: [],
  segments: [],
  selectedSegmentIndex: null,
  draggingCutPoint: null,

  setVideoUrl: (url) => set({ videoUrl: url }),
  setVideoDuration: (duration) => set({ videoDuration: duration }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),

  addCutPoint: (time, type) => set((state) => {
    const newCutPoint: CutPoint = {
      time,
      type,
      id: `${type}_${Date.now()}`
    };
    const cutPoints = [...state.cutPoints, newCutPoint].sort((a, b) => a.time - b.time);
    return { cutPoints, segments: calculateSegments(cutPoints, state.videoDuration, state.segments) };
  }),

  // ... other actions
}));

// Helper function (can be in separate file)
function calculateSegments(cutPoints: CutPoint[], duration: number, existingSegments: Segment[]): Segment[] {
  // Port existing getSegmentsFromCutPoints logic
}
```

### Pattern 4: React Router v6 with Tab Layout

**What:** Use React Router v6 with outlet pattern for tab-based navigation.

**Why:**
- Clean URL structure (/upload, /editor, /library)
- Supports query params for video URL and cuts (existing pattern)
- Enables browser back/forward navigation
- Code splitting per route

**Example:**
```typescript
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { UploadPage } from '@/features/upload/UploadPage';
import { TimelineEditorPage } from '@/features/timeline/TimelineEditorPage';
import { LibraryPage } from '@/features/library/LibraryPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/upload" replace />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/editor" element={<TimelineEditorPage />} />
          <Route path="/library" element={<LibraryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// components/layout/AppShell.tsx
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export function AppShell() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className="app-shell">
      <main className="app-content">
        <Outlet />
      </main>
      {isMobile && <BottomNav />}
    </div>
  );
}
```

### Pattern 5: Video Player with Controlled Playback

**What:** Wrap HTML5 video element with React state control for segment playback.

**Why:** Need to sync video playback with timeline, auto-stop at segment boundaries, support drawer preview.

**Example:**
```typescript
// features/timeline/VideoPlayer.tsx
import { useRef, useEffect, useCallback } from 'react';
import { useTimelineStore } from '@/stores/timelineStore';

interface VideoPlayerProps {
  src: string;
  segmentBounds?: { start: number; end: number };
  onTimeUpdate?: (time: number) => void;
}

export function VideoPlayer({ src, segmentBounds, onTimeUpdate }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { currentTime, isPlaying, setCurrentTime, setIsPlaying, setVideoDuration } = useTimelineStore();

  // Sync store state with video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);

      // Auto-stop at segment end
      if (segmentBounds && time >= segmentBounds.end) {
        video.pause();
        setIsPlaying(false);
      }
    };

    const handleLoadedMetadata = () => {
      setVideoDuration(video.duration);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [segmentBounds, setCurrentTime, setIsPlaying, setVideoDuration, onTimeUpdate]);

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      // If at segment end, seek back to start
      if (segmentBounds && video.currentTime >= segmentBounds.end) {
        video.currentTime = segmentBounds.start;
      }
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [segmentBounds, setIsPlaying]);

  return (
    <div className="video-player" onClick={togglePlayPause}>
      <video ref={videoRef} src={src} playsInline />
      <div className={`play-overlay ${isPlaying ? 'hidden' : ''}`}>
        {isPlaying ? '⏸️' : '▶️'}
      </div>
      {/* Custom seek bar */}
    </div>
  );
}
```

### Pattern 6: API Client with Custom Hook

**What:** Centralized API client with React Query or custom hooks for data fetching.

**Why:** Consistent error handling, loading states, caching, and TypeScript types.

**Example:**
```typescript
// services/api.ts
const API_BASE = ''; // Same origin, no base needed

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const api = {
  getTags: () => apiRequest<{ muscle_groups: string[]; equipment: string[] }>('/get-tags'),

  processVideo: (formData: FormData) =>
    fetch('/process', { method: 'POST', body: formData }).then(r => r.json()),

  saveTimeline: (data: TimelineSaveData) =>
    apiRequest<{ success: boolean; saved_count: number }>('/api/timeline/save', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getExercises: (params: ExerciseQueryParams) =>
    apiRequest<ExercisesResponse>(`/api/exercises?${new URLSearchParams(params as any)}`),

  deleteExercise: (id: number) =>
    apiRequest<{ success: boolean }>(`/api/exercises/${id}`, { method: 'DELETE' }),
};

// hooks/useApi.ts
import { useState, useCallback } from 'react';

export function useApi<T, Args extends any[]>(
  apiFunc: (...args: Args) => Promise<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (...args: Args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunc(...args);
      setData(result);
      return result;
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [apiFunc]);

  return { data, loading, error, execute };
}
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Prop Drilling Through Many Levels

**What:** Passing state through 4+ component levels.

**Why bad:** Makes components tightly coupled, hard to refactor, verbose code.

**Instead:** Use Zustand store for shared state. Components subscribe directly.

```typescript
// BAD: Prop drilling
<TimelineEditorPage>
  <TimelineSection cutPoints={cutPoints} onCutPointChange={...}>
    <TimelineCanvas cutPoints={cutPoints} onCutPointChange={...}>
      <CutPointHandle cutPoint={cp} onChange={...} />
    </TimelineCanvas>
  </TimelineSection>
</TimelineEditorPage>

// GOOD: Store subscription
function CutPointHandle({ id }: { id: string }) {
  const cutPoint = useTimelineStore(state => state.cutPoints.find(cp => cp.id === id));
  const updateCutPointTime = useTimelineStore(state => state.updateCutPointTime);
  // Direct access, no prop drilling
}
```

### Anti-Pattern 2: useEffect for Derived State

**What:** Using useEffect to compute values that can be derived directly.

**Why bad:** Causes extra renders, stale data bugs, harder to reason about.

**Instead:** Compute derived values inline or use useMemo.

```typescript
// BAD: useEffect for derived state
const [segments, setSegments] = useState([]);
useEffect(() => {
  setSegments(calculateSegments(cutPoints, duration));
}, [cutPoints, duration]);

// GOOD: Derived in render or useMemo
const segments = useMemo(() =>
  calculateSegments(cutPoints, duration),
  [cutPoints, duration]
);

// OR in Zustand store as getter/selector
const segments = useTimelineStore(state =>
  calculateSegments(state.cutPoints, state.videoDuration)
);
```

### Anti-Pattern 3: Inline Event Handlers with Object Creation

**What:** Creating new functions/objects in render that break memoization.

**Why bad:** Causes unnecessary re-renders of child components.

**Instead:** Use useCallback for handlers, useMemo for objects.

```typescript
// BAD: New function every render
<Button onClick={() => handleClick(item.id)} />

// GOOD: Stable callback
const handleItemClick = useCallback((id: string) => {
  // ...
}, []);
<Button onClick={() => handleItemClick(item.id)} />

// OR: Pass id as data attribute
<Button data-id={item.id} onClick={handleClick} />
```

### Anti-Pattern 4: Giant Monolithic Components

**What:** Single component file with 500+ lines handling multiple concerns.

**Why bad:** Hard to test, hard to reuse, hard to understand.

**Instead:** Extract logical units into smaller components and hooks.

```typescript
// BAD: One 800-line TimelineEditor.tsx

// GOOD: Split by responsibility
// TimelineEditorPage.tsx - orchestration (~100 lines)
// VideoPlayer.tsx - video playback (~100 lines)
// TimelineCanvas.tsx - canvas rendering (~150 lines)
// SegmentDrawer.tsx - form UI (~100 lines)
// useTimeline.ts - business logic (~100 lines)
// useCanvasTimeline.ts - canvas logic (~150 lines)
```

---

## Flask Integration Strategy

### Development Setup (Proxy)

During development, run React dev server (Vite) and Flask separately. Vite proxies API requests to Flask.

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5000',
      '/process': 'http://localhost:5000',
      '/download': 'http://localhost:5000',
      '/get-tags': 'http://localhost:5000',
      '/share-receiver': 'http://localhost:5000',
      '/reprocess': 'http://localhost:5000',
    },
  },
});
```

### Production Build (Static Files)

Build React app, output to Flask's static folder. Flask serves the SPA.

```
workout_APP/
  server.py
  frontend/              # React source (not served)
    src/
    package.json
    vite.config.ts
  static/
    react/               # Build output
      index.html
      assets/
        main-[hash].js
        main-[hash].css
```

```python
# server.py additions for SPA
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    # Serve static files if they exist
    if path and os.path.exists(os.path.join('static/react', path)):
        return send_from_directory('static/react', path)
    # Otherwise serve index.html (SPA routing)
    return send_from_directory('static/react', 'index.html')
```

### Build Script

```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build --outDir ../static/react --emptyOutDir",
    "preview": "vite preview"
  }
}
```

---

## PWA Configuration

### Service Worker with Vite PWA Plugin

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Ask user before updating
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Workout Video Editor',
        short_name: 'Workout Editor',
        description: 'Edit workout videos with AI scene detection',
        theme_color: '#667eea',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
        share_target: {
          action: '/share-receiver',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            files: [{ name: 'video', accept: ['video/*'] }],
          },
        },
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
          {
            urlPattern: /^\/download\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'video-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 86400 },
            },
          },
        ],
      },
    }),
  ],
});
```

### Share Target Handling

The existing Flask `/share-receiver` endpoint handles shared videos. The React app needs to handle the redirect after processing.

```typescript
// features/upload/useShareTarget.ts
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function useShareTarget() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if redirected from share-receiver
    const video = searchParams.get('video');
    const cuts = searchParams.get('cuts');

    if (video) {
      // Navigate to editor with params
      navigate(`/editor?video=${video}&cuts=${cuts || ''}`);
    }
  }, [searchParams, navigate]);
}
```

---

## State Management Decision

### Recommendation: Zustand

**Why Zustand over alternatives:**

| Criteria | Zustand | Redux Toolkit | React Context |
|----------|---------|---------------|---------------|
| Boilerplate | Minimal | Moderate | Minimal |
| Bundle size | ~1KB | ~10KB | 0 (built-in) |
| DevTools | Yes | Yes | Limited |
| Outside React | Yes | Yes | No |
| TypeScript | Excellent | Excellent | Good |
| Learning curve | Low | Moderate | Low |
| Performance | Excellent (selectors) | Excellent | Poor (full re-render) |

**Key reasons for Zustand:**
1. Canvas callbacks need store access outside React components
2. Timeline state is complex but not deep (Zustand handles well)
3. No provider wrapper needed (simpler component tree)
4. Selectors prevent unnecessary re-renders

### State Boundaries

| State Type | Where to Store | Example |
|------------|----------------|---------|
| Timeline editing | Zustand (`timelineStore`) | cutPoints, segments, currentTime |
| Exercise library | Zustand (`exerciseStore`) | exercises, filters, pagination |
| UI state | Zustand (`uiStore`) or local | drawer open, modal visible |
| Form state | Local useState | input values before save |
| Server cache | React Query (optional) | GET responses with caching |

---

## File/Folder Structure Rationale

### Why Feature-Based?

The existing codebase has 3 clear features:
1. **Upload** - Video upload and processing
2. **Timeline** - Video editing with cut points
3. **Library** - Exercise browsing and management

Each feature is relatively independent. Feature-based organization:
- Makes code ownership clear
- Enables lazy loading per feature
- Keeps related code together
- Scales as features grow

### Shared Code

Code shared across features goes in:
- `components/common/` - Reusable UI components
- `components/layout/` - App-wide layout components
- `hooks/` - Generic hooks (useMediaQuery, useApi)
- `services/` - API client, utilities
- `stores/` - Zustand stores (imported by features)
- `types/` - Shared TypeScript interfaces

---

## Migration Path from Existing Code

### What to Port Directly

1. **Canvas drawing logic** (`drawTimeline`, `drawCutPoints`, `drawSegments`, `drawPlayhead`)
   - Port to `useCanvasTimeline.ts` hook
   - Convert to TypeScript, keep logic identical

2. **Segment calculation** (`getSegmentsFromCutPoints`, `updateSegments`)
   - Port to Zustand store or utility function
   - Add TypeScript types

3. **Autocomplete logic** (`setupAutocomplete`, `addChip`)
   - Port to `AutocompleteInput.tsx` component
   - Use controlled component pattern

### What to Restructure

1. **Global state object** - Convert to Zustand store with typed actions
2. **DOM manipulation** - Replace with React state/refs
3. **Event listeners** - Convert to React event handlers
4. **URL parsing** - Use React Router's `useSearchParams`

### What to Improve

1. **Error handling** - Add error boundaries, toast notifications
2. **Loading states** - Skeleton loaders, progress indicators
3. **Form validation** - Use react-hook-form or similar
4. **Accessibility** - Proper ARIA labels, keyboard navigation

---

## Scalability Considerations

| Concern | Current (100 videos) | Future (10K videos) |
|---------|---------------------|---------------------|
| Library loading | Load all | Virtual scrolling, pagination |
| Search | Client filter | Server-side search |
| Video playback | Direct URL | CDN with range requests |
| State size | Full in memory | Normalize, paginate |

---

## Sources

- [MDN PWA Best Practices](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Best_practices) - Official PWA guidelines
- [Create React App PWA Docs](https://create-react-app.dev/docs/making-a-progressive-web-app/) - PWA setup reference
- [F22 Labs PWA Guide](https://www.f22labs.com/blogs/how-to-build-progressive-web-apps-pwas-with-react/) - React PWA patterns
- Existing codebase analysis (`timeline-editor.js`, `server.py`, `service-worker.js`)
- Zustand, React Router v6, Vite documentation (training data - MEDIUM confidence, verify versions)
