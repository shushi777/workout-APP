# Workout Video Editor - React Frontend Rebuild

## What This Is

A mobile-only Progressive Web App for editing workout videos. Users upload videos, use AI scene detection to suggest cuts, adjust cut points on an interactive timeline, tag segments with exercise details, and build an exercise library. The frontend is built with React 19 + Tailwind CSS 4 + Zustand, delivering a smooth mobile experience with PWA installability and Web Share Target support.

## Core Value

Smooth, responsive mobile experience for editing workout videos and building an exercise library — the UI should feel fast and intuitive on a phone.

## Requirements

### Validated

<!-- Shipped in v1.0 -->

- [x] Video upload via drag-and-drop — v1.0
- [x] Video upload via PWA share target (share from gallery) — v1.0
- [x] AI scene detection with PySceneDetect — existing (preserved)
- [x] Interactive Canvas timeline with cut points — v1.0
- [x] Drag-and-drop cut point adjustment — v1.0
- [x] Manual cut point addition at playhead — v1.0
- [x] Segment preview in main player — v1.0
- [x] Exercise tagging (name, muscle groups, equipment, audio flag) — v1.0
- [x] Autocomplete for muscle groups and equipment — v1.0
- [x] FFmpeg video cutting into segments — existing (preserved)
- [x] Thumbnail generation for exercises — existing (preserved)
- [x] Exercise library with search and filter — v1.0
- [x] Exercise editing and deletion — v1.0
- [x] Cloudflare R2 cloud storage — existing (preserved)
- [x] PWA installability — v1.0
- [x] Web Share Target API — v1.0
- [x] React + Tailwind CSS frontend architecture — v1.0
- [x] Dark theme with lighter UI elements — v1.0
- [x] Tab-based SPA (Upload | Editor | Library) — v1.0
- [x] Instant tab switching without page reloads — v1.0
- [x] Mobile-optimized touch interactions (44px targets) — v1.0
- [x] Canvas timeline integration in React — v1.0

### Active

<!-- For next milestone -->

(None defined - use /gsd:new-milestone to start next version)

### Out of Scope

- Desktop-specific layouts — mobile-only app
- Backend changes — keep Flask API as-is
- Offline video editing — requires significant architecture changes

## Context

**Current State:**
- Frontend: React 19 + Tailwind CSS 4 + Zustand (4,400 LOC TypeScript)
- Tech stack: Vite, React Router, dnd-kit, vaul, idb, Workbox
- PWA: Installable with Web Share Target support
- Shipped: v1.0 (2026-02-03)

**Technical Environment:**
- Backend: Flask 3.0, PostgreSQL, Cloudflare R2 storage
- Video processing: FFmpeg, PySceneDetect
- All API endpoints unchanged from original implementation

**Codebase Map:** `.planning/codebase/` contains architecture and stack analysis

## Constraints

- **Backend**: Keep Flask API unchanged — frontend-only rebuild
- **PWA**: Must maintain share target and installability
- **Canvas**: Timeline editor uses Canvas — wrapped in React component
- **Mobile-only**: No desktop layouts needed

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React 19 + Tailwind CSS 4 | Modern stack, component architecture, utility-first CSS | Good |
| Tab-based SPA | Instant switching, better mobile UX than page navigation | Good |
| Dark theme | User preference, easier on eyes | Good |
| Wrap existing Canvas | Timeline works, avoid rewrite risk | Good |
| Zustand for state | Lightweight alternative to Redux | Good |
| dnd-kit for drag | Modern, accessible, sensor-based architecture | Good |
| vaul for drawer | Swipe-to-dismiss, accessibility built-in | Good |
| XHR for uploads | fetch doesn't support upload progress | Good |
| injectManifest for SW | Required for Share Target POST handling | Good |
| idb for IndexedDB | Type-safe wrapper with promise-based API | Good |

---
*Last updated: 2026-02-03 after v1.0 milestone*
