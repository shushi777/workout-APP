# Project Research Summary

**Project:** Workout Video Editor - React Frontend Rebuild
**Domain:** Mobile-first PWA Video Editor with Flask Backend
**Researched:** 2026-02-03
**Confidence:** HIGH

## Executive Summary

This project involves rebuilding the frontend of an existing workout video editor PWA from vanilla JavaScript to React + TypeScript + Tailwind CSS. The existing Flask backend remains unchanged. Research strongly supports a **Vite + React 19 + Tailwind CSS 4** stack with **Zustand for state management** and **vite-plugin-pwa** for PWA functionality. This combination provides modern DX, excellent mobile performance, and clean integration with the existing Flask API.

The recommended approach is a **phased migration** organized by feature domains (Upload, Timeline Editor, Exercise Library) rather than horizontal layers. The timeline editor is the most complex component due to its Canvas-based rendering and touch gesture handling. The critical architectural decision is separating high-frequency state (playhead position, drag coordinates) into refs while keeping structural state (cut points, segments) in Zustand. This prevents the Canvas re-rendering issue that would otherwise destroy performance.

Key risks center on **PWA service worker migration** and **Web Share Target handling**. The existing service worker caches specific HTML files; React's SPA routing serves a single index.html for all routes. The share-receiver endpoint must be intercepted by the service worker, not React Router. These require careful handling during the PWA migration phase. Secondary risks include touch event double-firing on mobile, Canvas performance if not properly memoized, and Tailwind class purging for dynamic styles.

## Key Findings

### Recommended Stack

The stack is modern and well-supported with HIGH confidence from official documentation. Vite 7.x replaces the deprecated Create React App as the standard React build tool. React 19.x provides the latest stable features. Tailwind CSS 4.x offers 5x faster builds with automatic content detection.

**Core technologies:**
- **Vite 7.x**: Build tool and dev server -- 5x faster than webpack, first-party PWA plugin, excellent HMR
- **React 19.x + TypeScript 5.x**: UI framework with type safety -- industry standard, catches errors early
- **Tailwind CSS 4.x**: Utility-first styling -- CSS-first config, first-party Vite plugin, v4.0 released Jan 2025
- **Zustand 5.x**: Client state management -- minimal boilerplate (~3KB), no providers, works outside React components
- **@tanstack/react-query 5.x**: Server state management -- handles API caching, loading/error states cleanly
- **React Router 7.x**: Client-side routing -- SPA mode, data loading, code splitting per route
- **Headless UI 2.x**: Accessible UI primitives -- by Tailwind team, handles drawer/dialog patterns
- **vite-plugin-pwa**: PWA generation -- zero-config service worker via Workbox, manifest injection

**Do NOT use:** Create React App (deprecated), Redux Toolkit (overkill), Axios (fetch sufficient), Next.js (SSR overkill for mobile SPA)

### Expected Features

**Must have (table stakes):**
- 44px+ touch targets on all interactive elements
- Haptic feedback on key actions (cut point placement, segment selection, save)
- Pinch-to-zoom on timeline for precise editing
- Immediate visual feedback (100ms response time)
- Bottom sheet/drawer pattern for segment tagging
- Skeleton loading states for perceived performance
- Dark theme with sufficient contrast
- Progress indicators for video processing/upload

**Should have (competitive):**
- Optimistic UI updates for instant perceived response
- Undo/redo functionality
- Micro-animations on state changes
- Custom haptic patterns for different actions
- Gesture hints on first use

**Defer (v2+):**
- Thumbnail strip on timeline (high complexity)
- Audio waveform visualization
- Batch segment operations
- Landscape mode layout optimization

### Architecture Approach

The architecture follows an **App Shell pattern** with **feature-based folder organization**. Three main features (Upload, Timeline Editor, Library) are organized into self-contained modules under `src/features/`. Each feature contains its page component, sub-components, custom hooks, and types. Shared code lives in `src/components/common/`, `src/hooks/`, and `src/stores/`.

**Major components:**
1. **AppShell** -- Layout wrapper with bottom navigation for mobile, React Router outlet
2. **TimelineEditorPage** -- Orchestrates VideoPlayer, TimelineCanvas, SegmentDrawer
3. **TimelineCanvas** -- Canvas rendering wrapped in React with refs for high-frequency updates
4. **VideoPlayer** -- Controlled playback with segment boundary enforcement
5. **SegmentDrawer** -- Bottom sheet for exercise tagging with autocomplete
6. **Zustand stores** -- timelineStore (cut points, segments), uiStore (drawer state), exerciseStore (library data)

**Critical pattern:** Canvas uses `useRef` for playhead position and drag state (updates 60x/sec), `useMemo` for derived segments, and `React.memo` to prevent unnecessary re-renders. Zustand store accessed directly in Canvas callbacks (works outside React render cycle).

### Critical Pitfalls

1. **Canvas re-rendering on every state change** -- Use React.memo, refs for high-frequency values, requestAnimationFrame outside React render. Must be designed correctly from Phase 1.

2. **Event listener memory leaks** -- Always return cleanup functions from useEffect. Store listener refs, not in state. Existing vanilla JS patterns (`state.segmentPlaybackListener`) must be converted to proper React hooks with cleanup.

3. **Global state as single useState** -- Causes full app re-renders during video playback. Split by update frequency: refs for high-frequency, separate useState/Zustand for medium-frequency, context for rarely-changing values.

4. **PWA service worker conflicts with React Router** -- Use vite-plugin-pwa with `navigateFallback: '/index.html'`. Configure workbox to exclude /api, /download routes. Implement update prompt for users.

5. **Web Share Target breaks in SPA** -- Service worker must intercept POST to /share-receiver, store file in IndexedDB, then redirect to React route. Cannot rely on React Router for this.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Project Setup & Component Architecture
**Rationale:** Foundation must be correct before building features. Canvas performance patterns must be established first as they affect all timeline work.
**Delivers:** Vite + React + TypeScript + Tailwind project structure, Zustand stores, component architecture, Flask proxy configuration
**Addresses:** Design system, touch targets, consistent visual language
**Avoids:** Canvas re-rendering pitfall (must design refs-based approach from start)
**Research needed:** None -- well-documented patterns

### Phase 2: Upload Feature Migration
**Rationale:** Simplest feature, validates Flask integration, provides foundation for timeline handoff
**Delivers:** Drag-and-drop upload, processing status, video processing API integration
**Uses:** React Router, fetch API, TanStack Query for upload progress
**Implements:** UploadPage feature module
**Research needed:** None -- standard file upload patterns

### Phase 3: Timeline Editor Core
**Rationale:** Most complex feature, depends on foundation from Phase 1. Core editing must work before tagging UI.
**Delivers:** Canvas timeline rendering, cut point display and dragging, video player with custom controls, segment calculation
**Uses:** Native Canvas API with React refs, Zustand for timeline state, pointer events for unified touch/mouse
**Avoids:** Global state pitfall, event listener leaks, stale closures
**Research needed:** Minimal -- existing Canvas code provides reference

### Phase 4: Timeline Editor - Tagging & Save
**Rationale:** Builds on working timeline from Phase 3. Tagging drawer is second-most complex UI.
**Delivers:** Segment drawer with exercise form, autocomplete chips, API save integration, redirect to library
**Implements:** SegmentDrawer, ExerciseForm, AutocompleteInput components
**Avoids:** Touch double-fire on mobile, form submission refresh, video autoplay blocking
**Research needed:** None -- existing patterns documented

### Phase 5: Exercise Library Migration
**Rationale:** Depends on saved exercises from Timeline flow. Can be built in parallel with PWA phase if desired.
**Delivers:** Exercise grid/list, search and filter, video playback modal, edit/delete functionality
**Uses:** TanStack Query for data fetching, Zustand for filter state
**Addresses:** Pull-to-refresh, skeleton loading states
**Research needed:** None -- standard list/grid patterns

### Phase 6: PWA Migration
**Rationale:** Must come after all routes exist. Service worker configuration depends on final route structure.
**Delivers:** Installable PWA, offline support, share target handler, update prompt
**Uses:** vite-plugin-pwa with injectManifest strategy for share target
**Avoids:** Service worker conflicts (navigateFallback), Share Target breaks in SPA
**Research needed:** YES -- Share Target + React SPA requires careful service worker configuration

### Phase Ordering Rationale

- **Foundation first (Phase 1):** Canvas performance and state patterns must be correct from the start. Retrofitting is expensive.
- **Upload before Timeline:** Validates Flask proxy, simpler feature provides confidence
- **Timeline split into Core (3) and Tagging (4):** Reduces complexity per phase, allows testing core editing before form UI
- **Library before PWA:** Routes must be stable before configuring service worker caching
- **PWA last:** Depends on all routes and features being in place

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 6 (PWA Migration):** Share Target POST handling with React SPA is non-trivial. Service worker must intercept, store in IndexedDB, redirect. Needs spike/prototype.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Vite + React setup is well-documented
- **Phase 2:** File upload is standard
- **Phase 3-4:** Canvas in React is documented; existing JS provides migration reference
- **Phase 5:** List/grid UI is standard

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified via official docs (Vite, React, Tailwind, Zustand releases) |
| Features | MEDIUM-HIGH | Based on CapCut/InShot analysis and platform guidelines; user validation needed |
| Architecture | HIGH | Feature-based organization is established pattern; existing codebase provides migration reference |
| Pitfalls | MEDIUM-HIGH | Based on official docs + verified community patterns; some pitfalls need real device testing |

**Overall confidence:** HIGH

### Gaps to Address

- **Real device testing:** Touch event behavior and haptics must be tested on actual iOS/Android devices, not just Chrome DevTools simulation
- **Share Target prototype:** Before Phase 6, build a minimal spike to validate service worker approach for POST handling
- **Performance profiling:** Canvas performance should be profiled on low-end mobile devices during Phase 3
- **RTL edge cases:** Hebrew layout may have edge cases beyond what research covered; test early

## Sources

### Primary (HIGH confidence)
- [Vite Official Releases](https://vite.dev/releases) -- version verification
- [React 19.2 Announcement](https://react.dev/blog/2025/10/01/react-19-2) -- feature verification
- [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4) -- configuration patterns
- [Zustand v5.0.10 npm](https://www.npmjs.com/package/zustand) -- API verification
- [vite-plugin-pwa Docs](https://vite-pwa-org.netlify.app/guide/) -- PWA configuration
- [MDN share_target](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target) -- Share Target API
- Existing codebase analysis (timeline-editor.js, server.py) -- migration reference

### Secondary (MEDIUM confidence)
- [Konva React Documentation](https://konvajs.org/docs/react/index.html) -- Canvas optimization patterns
- [web.dev Workbox Share Targets](https://web.dev/articles/workbox-share-targets) -- service worker handling
- [Pluralsight Event Listener Cleanup](https://www.pluralsight.com/guides/how-to-cleanup-event-listeners-react) -- memory leak prevention
- CapCut/InShot UI analysis articles -- mobile video editor UX patterns

### Tertiary (LOW confidence)
- State management comparison articles -- may have bias; verified against npm downloads
- Migration guides from Medium/dev.to -- useful patterns but verify against official docs

---
*Research completed: 2026-02-03*
*Ready for roadmap: yes*
