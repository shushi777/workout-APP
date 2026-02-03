# Domain Pitfalls: Vanilla JS to React Migration

**Domain:** PWA Video Editor - Vanilla JS/Canvas to React + Tailwind Migration
**Researched:** 2026-02-03
**Confidence:** MEDIUM-HIGH (based on official docs, verified community patterns, and codebase analysis)

---

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

---

### Pitfall 1: Canvas Re-rendering on Every State Change

**What goes wrong:** Wrapping Canvas in a React component without proper optimization causes the canvas to re-render on every parent state change, destroying performance. The timeline editor with drag-and-drop becomes unusable.

**Why it happens:** React's default behavior re-renders components when parent state changes. Canvas drawing operations are expensive and don't benefit from React's virtual DOM diffing.

**Consequences:**
- Timeline becomes laggy during playback (60 FPS needed for smooth drag operations)
- Cut point dragging feels unresponsive
- Battery drain on mobile devices
- Users abandon the app

**Prevention:**
1. **Use `React.memo()` on the Canvas component** to prevent re-renders when canvas-irrelevant props change
2. **Separate canvas state from React state** - use `useRef` for canvas-specific data (current drag position, animation frame IDs)
3. **Use `requestAnimationFrame` outside React's render cycle** for drawing operations
4. **Consider react-konva** for declarative canvas with built-in optimization

```typescript
// BAD: Canvas redraws on every state change
function TimelineCanvas({ cutPoints, currentTime }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    drawTimeline(canvasRef.current, cutPoints, currentTime);
  }); // No deps = runs every render!

  return <canvas ref={canvasRef} />;
}

// GOOD: Controlled re-drawing with refs
const TimelineCanvas = React.memo(function TimelineCanvas({
  cutPoints,
  videoDuration
}) {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const currentTimeRef = useRef(0); // Not in React state

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    // Draw using currentTimeRef.current, not state
    drawTimeline(ctx, cutPoints, currentTimeRef.current, videoDuration);
  }, [cutPoints, videoDuration]);

  // Playhead updates via ref, not state
  const updatePlayhead = useCallback((time) => {
    currentTimeRef.current = time;
    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(() => {
        draw();
        animationFrameRef.current = null;
      });
    }
  }, [draw]);

  return <canvas ref={canvasRef} />;
});
```

**Detection:**
- React DevTools shows frequent re-renders of Canvas component
- Performance tab shows long frame times during video playback
- `console.log` in draw function fires excessively

**Phase to address:** Phase 1 (Component Architecture) - Must be correct from the start

**Sources:**
- [Konva React optimization](https://konvajs.org/docs/react/index.html)
- [Babylon.js forum on avoiding re-renders](https://forum.babylonjs.com/t/react-ui-babylon-js-how-to-avoid-usestate-re-rendering-canvas/35154)

---

### Pitfall 2: Event Listener Memory Leaks from Vanilla JS Patterns

**What goes wrong:** The existing codebase stores event listeners in global state (`state.segmentPlaybackListener`, `state.drawerVideoPlaybackListener`) and manually manages cleanup. Translating this pattern directly to React without proper `useEffect` cleanup creates memory leaks.

**Why it happens:** In vanilla JS, the global `state` object persists for the page lifetime. In React, components mount/unmount frequently (especially with navigation), but listeners attached to `window`, `document`, or media elements persist.

**Consequences:**
- Multiple listeners stack up causing callbacks to fire multiple times
- Video `timeupdate` events fire for unmounted components
- Browser memory grows over time
- Weird behavior: pause at wrong segment boundaries

**Prevention:**
1. **Always return cleanup functions from `useEffect`**
2. **Use the exact same function reference** for add/remove
3. **Store listener references in refs**, not state
4. **Use custom hooks** to encapsulate listener logic

```typescript
// EXISTING VANILLA JS PATTERN (from timeline-editor.js):
// state.segmentPlaybackListener = () => { ... };
// videoPlayer.addEventListener('timeupdate', state.segmentPlaybackListener);
// Later: videoPlayer.removeEventListener('timeupdate', state.segmentPlaybackListener);

// REACT TRANSLATION - BAD:
useEffect(() => {
  const listener = () => {
    if (videoRef.current.currentTime >= segment.end) {
      videoRef.current.pause();
    }
  };
  videoRef.current.addEventListener('timeupdate', listener);
  // MISSING CLEANUP!
}, [segment]);

// REACT TRANSLATION - GOOD:
function useSegmentPlayback(videoRef, segment, isActive) {
  useEffect(() => {
    if (!isActive || !segment) return;

    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.currentTime >= segment.end) {
        video.pause();
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [segment?.start, segment?.end, isActive]);
}
```

**Detection:**
- React DevTools shows "Can't perform state update on unmounted component" warnings
- Multiple pause events fire when segment ends
- Memory profiler shows growing detached DOM nodes
- Add `console.log` in listeners - if it fires after navigating away, you have a leak

**Phase to address:** Phase 2 (State Migration) - Convert all event patterns

**Sources:**
- [Pluralsight: How to cleanup event listeners in React](https://www.pluralsight.com/guides/how-to-cleanup-event-listeners-react)
- [FreeCodeCamp: Fix memory leaks in React](https://www.freecodecamp.org/news/fix-memory-leaks-in-react-apps/)

---

### Pitfall 3: Global State Object Converted to Single useState

**What goes wrong:** The existing `state` object has 15+ properties. Converting it to a single `useState({ ...everything })` causes entire app re-renders on any change.

**Why it happens:** React re-renders components when state changes. If all state is in one object, changing `currentTime` (which updates 60x/second during playback) re-renders everything.

**Consequences:**
- UI freezes during video playback
- Segment list re-renders on every frame
- Form inputs lag while typing
- App becomes unusable

**Prevention:**
1. **Split state by update frequency:**
   - High frequency (currentTime, draggingCutPoint): use refs
   - Medium frequency (cutPoints, segments): separate useState or useReducer
   - Low frequency (videoUrl, videoDuration): context or props

2. **Use multiple useState calls** or **useReducer for related state**
3. **Memoize derived values** with `useMemo`
4. **Memoize callbacks** with `useCallback`

```typescript
// BAD: Single state object
const [state, setState] = useState({
  videoUrl: null,
  videoDuration: 0,
  cutPoints: [],
  segments: [],
  selectedSegmentIndex: null,
  currentTime: 0,  // Updates 60x/sec!
  isPlaying: false,
  zoomLevel: 1,
  draggingCutPoint: null,  // Updates on every mouse move!
  // ... more
});

// GOOD: Split by concern and update frequency
// Video metadata (rarely changes)
const [videoUrl, setVideoUrl] = useState(null);
const [videoDuration, setVideoDuration] = useState(0);

// Timeline data (changes on user action)
const [cutPoints, setCutPoints] = useState([]);
const [selectedSegmentIndex, setSelectedSegmentIndex] = useState(null);

// Derived state (computed from cutPoints)
const segments = useMemo(() =>
  getSegmentsFromCutPoints(cutPoints, videoDuration),
  [cutPoints, videoDuration]
);

// High-frequency values (use refs, not state)
const currentTimeRef = useRef(0);
const draggingCutPointRef = useRef(null);

// UI state (separate concerns)
const [isDrawerOpen, setIsDrawerOpen] = useState(false);
const [zoomLevel, setZoomLevel] = useState(1);
```

**Detection:**
- React DevTools Profiler shows entire tree re-rendering
- Typing in exercise name input is laggy
- Segment cards flash/re-render during video playback

**Phase to address:** Phase 2 (State Migration) - Fundamental architecture decision

**Sources:**
- [Brainhub: Migrating to React](https://brainhub.eu/library/migrating-to-react)
- [Medium: Converting Vanilla JavaScript to React](https://medium.com/@findingalberta/converting-vanilla-javascript-to-react-98654a12973e)

---

### Pitfall 4: PWA Service Worker Conflicts with React Router

**What goes wrong:** The existing service worker caches routes. React SPA with client-side routing serves the same `index.html` for all routes. Stale service worker serves old cached HTML that doesn't match new React bundle.

**Why it happens:**
- Service worker caches `/timeline-editor.html` as separate file
- React SPA serves same `index.html` for all routes
- Old service worker doesn't know about new routing strategy
- Users see blank page or old version after update

**Consequences:**
- Users stuck on old version even after deploying updates
- "White screen of death" on navigation
- Features work for new users but not returning users
- Support tickets about "app not updating"

**Prevention:**
1. **Use vite-plugin-pwa** for proper React PWA setup
2. **Configure workbox for SPA navigation** with `navigateFallback`
3. **Implement update prompt** so users know new version exists
4. **Version your service worker** and handle updates gracefully

```typescript
// vite.config.ts with vite-plugin-pwa
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Show update prompt, don't auto-update
      workbox: {
        // SPA navigation fallback
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/api/,      // Don't cache API routes
          /^\/download/, // Don't cache video downloads
        ],
        // Cache strategies
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.r2\.cloudflarestorage\.com/,
            handler: 'CacheFirst', // Videos from R2
            options: {
              cacheName: 'video-cache',
              expiration: { maxEntries: 50 },
            },
          },
        ],
      },
      manifest: {
        // Preserve existing share_target config
        share_target: {
          action: '/share-receiver',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            files: [{ name: 'video', accept: ['video/*'] }],
          },
        },
      },
    }),
  ],
});
```

**Detection:**
- Returning users report features missing that new users see
- `navigator.serviceWorker.controller` shows old version
- Network tab shows requests served from ServiceWorker with old responses
- Clear cache fixes the problem temporarily

**Phase to address:** Phase 4 (PWA Migration) - Critical for update flow

**Sources:**
- [Vite PWA Getting Started](https://vite-pwa-org.netlify.app/guide/)
- [Create React App PWA docs](https://create-react-app.dev/docs/making-a-progressive-web-app/)
- [Medium: Handling PWA updates with Vite](https://medium.com/@leybov.anton/how-to-control-and-handle-last-app-updates-in-pwa-with-react-and-vite-cfb98499b500)

---

### Pitfall 5: Web Share Target POST Handler Breaks in React SPA

**What goes wrong:** The existing `/share-receiver` endpoint expects multipart form data from the OS share sheet. React SPA intercepts the navigation, Share Target fails silently.

**Why it happens:**
- Share Target sends POST to `/share-receiver`
- React Router intercepts as client-side navigation
- No server-side handler receives the file
- User sees blank page or home screen

**Consequences:**
- Core PWA feature completely broken
- Users can't share videos from gallery
- No error message - just doesn't work
- Destroys mobile UX

**Prevention:**
1. **Exclude share-receiver from SPA routing** - must hit actual server endpoint
2. **Use service worker to intercept** Share Target POST and redirect to client
3. **Store shared file in IndexedDB** via service worker, then navigate to editor

```typescript
// service-worker.ts (using workbox)
import { precacheAndRoute } from 'workbox-precaching';

// Handle Share Target POST
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname === '/share-receiver' && event.request.method === 'POST') {
    event.respondWith(handleShareTarget(event.request));
  }
});

async function handleShareTarget(request) {
  const formData = await request.formData();
  const videoFile = formData.get('video');

  if (videoFile) {
    // Store in IndexedDB for the client to pick up
    const db = await openDB('share-target', 1);
    await db.put('pending', { file: videoFile, timestamp: Date.now() }, 'shared-video');
  }

  // Redirect to the editor page (client-side will check IndexedDB)
  return Response.redirect('/editor?source=share', 303);
}

// In React app: check for shared video on mount
function useSharedVideo() {
  const [sharedVideo, setSharedVideo] = useState(null);

  useEffect(() => {
    async function checkForSharedVideo() {
      const db = await openDB('share-target', 1);
      const pending = await db.get('pending', 'shared-video');
      if (pending && Date.now() - pending.timestamp < 60000) {
        setSharedVideo(pending.file);
        await db.delete('pending', 'shared-video');
      }
    }
    checkForSharedVideo();
  }, []);

  return sharedVideo;
}
```

**Detection:**
- Share from gallery does nothing
- Network tab shows no request to server
- Service worker logs show route not matched
- Works in development (no service worker) but breaks in production

**Phase to address:** Phase 4 (PWA Migration) - Must be handled specially

**Sources:**
- [MDN: share_target manifest](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target)
- [web.dev: Workbox share targets](https://web.dev/articles/workbox-share-targets)
- [Medium: Share Target API](https://cgarethc.medium.com/adding-support-so-other-mobile-apps-can-share-to-my-react-pwa-57f4960cb997)

---

## Moderate Pitfalls

Mistakes that cause delays or technical debt.

---

### Pitfall 6: Touch Events Double-Fire on Mobile

**What goes wrong:** The existing code has complex touch/click deduplication logic (see `addMuscleGroup` handler with `lastMuscleGroupEvent` tracking). React's synthetic events behave differently.

**Why it happens:** Mobile browsers fire both `touchend` and `click` for compatibility. The existing vanilla JS code manually debounces. React's event system may not match this timing.

**Prevention:**
1. **Use `onPointerDown`/`onPointerUp`** instead of separate touch/mouse handlers
2. **Or use a library** like `@use-gesture/react` for unified gesture handling
3. **Test on real devices**, not just Chrome DevTools mobile simulation

```typescript
// BAD: Porting vanilla JS touch handling directly
const addMuscleGroup = (event) => {
  const now = Date.now();
  if (event.type === 'click' && lastEvent.type === 'touchend' &&
      now - lastEvent.time < 500) {
    return; // Skip click after touch
  }
  // ... rest of handler
};

// GOOD: Use pointer events (unified touch/mouse)
<button
  onPointerDown={(e) => {
    e.preventDefault(); // Prevents click from firing
    addMuscleGroup();
  }}
>
  Add
</button>

// BETTER: Use gesture library for complex interactions
import { useDrag } from '@use-gesture/react';

function DraggableCutPoint({ cutPoint, onDrag }) {
  const bind = useDrag(({ movement: [mx], down }) => {
    onDrag(cutPoint.id, mx, down);
  });

  return <div {...bind()} className="cut-point" />;
}
```

**Detection:**
- Chips added twice on mobile tap
- Buttons require double-tap to work
- Works on desktop, broken on mobile

**Phase to address:** Phase 3 (UI Migration) - Part of component conversion

---

### Pitfall 7: Tailwind Purge Removes Dynamic Classes

**What goes wrong:** Segment colors are computed dynamically (`fillColor = '#f0fff4'` for segments with details). If you use dynamic Tailwind classes, they get purged in production.

**Why it happens:** Tailwind scans source files for class names at build time. Dynamic string concatenation isn't detected.

**Prevention:**
1. **Use complete class names**, not string concatenation
2. **Safelist dynamic classes** in Tailwind config
3. **Use CSS custom properties** for truly dynamic values

```typescript
// BAD: Dynamic class construction (gets purged)
<div className={`bg-${segment.details ? 'green' : 'gray'}-100`} />

// GOOD: Complete class names (detected by Tailwind)
<div className={segment.details ? 'bg-green-100' : 'bg-gray-100'} />

// GOOD: Safelist if truly dynamic
// tailwind.config.js
module.exports = {
  safelist: [
    'bg-green-100',
    'bg-orange-100',
    'border-green-500',
    'border-orange-500',
  ],
};

// GOOD: CSS variables for canvas colors (not Tailwind)
const COLORS = {
  segmentWithDetails: '#f0fff4',
  segmentSelected: '#fff5e6',
  cutPointAuto: '#667eea',
  cutPointManual: '#48bb78',
};
```

**Detection:**
- Styles work in development, missing in production
- Inspecting element shows class present but no styles applied
- Build output CSS file is smaller than expected

**Phase to address:** Phase 3 (UI Migration) - Throughout styling work

**Sources:**
- [Tailwind upgrade guide](https://tailwindcss.com/docs/upgrade-guide)
- [bobbyhadz: Tailwind classes not working](https://bobbyhadz.com/blog/tailwind-class-not-working)

---

### Pitfall 8: Video autoplay Blocked Without User Interaction

**What goes wrong:** The existing code auto-plays video when selecting a segment (`videoPlayer.play().catch(...)`). React's stricter lifecycle may trigger play before user interaction is established.

**Why it happens:** Browsers require user interaction before autoplay. In vanilla JS, the interaction chain is clearer. React's effect timing can break this chain.

**Prevention:**
1. **Only call `.play()` in response to user events**, not in effects
2. **Use `muted` attribute** for preview videos (muted autoplay is allowed)
3. **Handle the rejected promise** gracefully with UI feedback

```typescript
// BAD: Playing in useEffect (may not have user interaction)
useEffect(() => {
  if (selectedSegment) {
    videoRef.current.play(); // May be blocked!
  }
}, [selectedSegment]);

// GOOD: Play in click handler (has user interaction)
const handleSegmentClick = (index) => {
  setSelectedSegment(index);
  videoRef.current.currentTime = segments[index].start;
  videoRef.current.play().catch(() => {
    // Show play button overlay for user to tap
    setShowPlayOverlay(true);
  });
};

// GOOD: Muted preview (allowed to autoplay)
<video
  ref={previewRef}
  muted // Allows autoplay
  playsInline // Required for iOS
  autoPlay
/>
```

**Detection:**
- Video doesn't play when selecting segment on mobile
- Console shows "play() failed because user didn't interact"
- Works on desktop Chrome, fails on mobile Safari

**Phase to address:** Phase 3 (UI Migration) - Video component implementation

**Sources:**
- [ImageKit: React Video Player](https://imagekit.io/blog/react-video-player/)

---

### Pitfall 9: Drawer Animation Performance with React State

**What goes wrong:** The existing drawer uses CSS class toggle (`classList.add('open')`). React re-render for drawer state can cause janky animations.

**Why it happens:** React state change triggers re-render. If re-render is slow, animation stutters. Also, React may batch state updates causing animation timing issues.

**Prevention:**
1. **Use CSS transitions on transform**, not on React-controlled properties
2. **Consider Framer Motion** for complex animations with React integration
3. **Use `will-change: transform`** for GPU acceleration

```typescript
// BAD: Animating based on conditional rendering
{isDrawerOpen && <Drawer />}  // No exit animation possible

// GOOD: Always render, animate with CSS
<div
  className={`
    fixed bottom-0 left-0 right-0
    transform transition-transform duration-300
    ${isDrawerOpen ? 'translate-y-0' : 'translate-y-full'}
  `}
>
  <DrawerContent />
</div>

// BETTER: Use Framer Motion for complex animations
import { AnimatePresence, motion } from 'framer-motion';

<AnimatePresence>
  {isDrawerOpen && (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25 }}
    >
      <DrawerContent />
    </motion.div>
  )}
</AnimatePresence>
```

**Detection:**
- Drawer animation stutters or jumps
- Animation starts from wrong position
- Exit animation doesn't play

**Phase to address:** Phase 3 (UI Migration) - Drawer component

---

### Pitfall 10: Lost Scroll Position on Re-renders

**What goes wrong:** The segments list re-renders when segments change. User's scroll position resets, losing their place in a long list.

**Prevention:**
1. **Key components properly** with stable IDs
2. **Use virtualization** for long lists (react-window)
3. **Preserve scroll position** in ref if needed

```typescript
// BAD: Index as key (causes remount on reorder)
{segments.map((seg, i) => (
  <SegmentCard key={i} segment={seg} />
))}

// GOOD: Stable ID as key
{segments.map((seg) => (
  <SegmentCard key={`${seg.start}-${seg.end}`} segment={seg} />
))}
```

**Phase to address:** Phase 3 (UI Migration) - List components

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable.

---

### Pitfall 11: RTL Layout Breaks with Flexbox Defaults

**What goes wrong:** The app is Hebrew (RTL). Tailwind's flex utilities default to LTR. Timeline specifically needs LTR (time flows left-to-right).

**Prevention:**
1. **Set `dir="rtl"` on root** and `dir="ltr"` on timeline specifically
2. **Use logical properties** (`start`/`end` instead of `left`/`right`)
3. **Test thoroughly** with RTL content

```typescript
// Root layout
<html dir="rtl">
  <body>
    <App />
  </body>
</html>

// Timeline (force LTR)
<div dir="ltr" className="timeline-container">
  <TimelineCanvas />
</div>
```

**Phase to address:** Phase 3 (UI Migration) - Global styles setup

---

### Pitfall 12: Form Submission Refreshes Page

**What goes wrong:** The existing form uses `event.preventDefault()`. In React, easy to forget this or have event handler not fire correctly.

**Prevention:**
1. **Always use `onSubmit` on form**, not `onClick` on button
2. **Always call `e.preventDefault()`**
3. **Use controlled components** for form state

```typescript
// GOOD
<form onSubmit={(e) => {
  e.preventDefault();
  saveExerciseDetails();
}}>
  <input
    value={exerciseName}
    onChange={(e) => setExerciseName(e.target.value)}
  />
  <button type="submit">Save</button>
</form>
```

**Phase to address:** Phase 3 (UI Migration) - Form components

---

### Pitfall 13: Stale Closure in Event Handlers

**What goes wrong:** Event handlers capture old state values due to JavaScript closures. Common with intervals and async operations.

**Prevention:**
1. **Use refs for values needed in callbacks**
2. **Use functional state updates**
3. **Include dependencies in useCallback**

```typescript
// BAD: Stale closure
const [count, setCount] = useState(0);
useEffect(() => {
  const interval = setInterval(() => {
    console.log(count); // Always logs initial value!
  }, 1000);
  return () => clearInterval(interval);
}, []); // count not in deps

// GOOD: Use ref for current value
const countRef = useRef(count);
countRef.current = count;

useEffect(() => {
  const interval = setInterval(() => {
    console.log(countRef.current); // Always current
  }, 1000);
  return () => clearInterval(interval);
}, []);
```

**Phase to address:** Phase 2 (State Migration) - Throughout

---

## Phase-Specific Warnings

| Phase | Likely Pitfall | Mitigation |
|-------|---------------|------------|
| Phase 1: Component Architecture | Canvas re-rendering (Pitfall 1) | Design refs-based canvas from start |
| Phase 2: State Migration | Global state conversion (Pitfall 3), Event listener leaks (Pitfall 2), Stale closures (Pitfall 13) | Split state by frequency, use custom hooks |
| Phase 3: UI Migration | Touch events (Pitfall 6), Tailwind purge (Pitfall 7), Video autoplay (Pitfall 8), Animations (Pitfall 9) | Test on real mobile devices |
| Phase 4: PWA Migration | Service worker conflicts (Pitfall 4), Share Target breaks (Pitfall 5) | Test full PWA flow including updates |

---

## Pre-Migration Checklist

Before starting each phase, verify:

- [ ] Canvas component isolated with proper memoization strategy
- [ ] State split planned by update frequency
- [ ] Event listener cleanup pattern documented
- [ ] PWA update strategy defined
- [ ] Share Target service worker handler planned
- [ ] Touch event handling approach chosen
- [ ] Tailwind content paths configured
- [ ] RTL/LTR boundary rules established

---

## Sources

### Official Documentation
- [React: Manipulating DOM with Refs](https://react.dev/learn/manipulating-the-dom-with-refs)
- [React: useRef](https://react.dev/reference/react/useRef)
- [MDN: share_target manifest](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target)
- [Tailwind Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)

### Verified Community Resources
- [Konva React Documentation](https://konvajs.org/docs/react/index.html)
- [Vite PWA Guide](https://vite-pwa-org.netlify.app/guide/)
- [web.dev: Workbox Share Targets](https://web.dev/articles/workbox-share-targets)
- [Pluralsight: Event Listener Cleanup](https://www.pluralsight.com/guides/how-to-cleanup-event-listeners-react)
- [FreeCodeCamp: Fix Memory Leaks](https://www.freecodecamp.org/news/fix-memory-leaks-in-react-apps/)

### Migration Guides
- [Brainhub: Migrating to React](https://brainhub.eu/library/migrating-to-react)
- [Medium: Converting Vanilla JS to React](https://medium.com/@findingalberta/converting-vanilla-javascript-to-react-98654a12973e)
- [Xebia: Migrating to React Step by Step](https://xebia.com/blog/migrating-to-react-step-by-step/)
