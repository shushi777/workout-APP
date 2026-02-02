# Workout Video Editor - React Frontend Rebuild

## What This Is

A mobile-only Progressive Web App for editing workout videos. Users upload videos, use AI scene detection to suggest cuts, adjust cut points on an interactive timeline, tag segments with exercise details, and build an exercise library. This project rebuilds the existing vanilla HTML/JS frontend in React + Tailwind CSS to improve mobile usability and performance.

## Core Value

Smooth, responsive mobile experience for editing workout videos and building an exercise library — the UI should feel fast and intuitive on a phone.

## Requirements

### Validated

<!-- Existing features that work and must be preserved -->

- [x] Video upload via drag-and-drop — existing
- [x] Video upload via PWA share target (share from gallery) — existing
- [x] AI scene detection with PySceneDetect — existing
- [x] Interactive Canvas timeline with cut points — existing
- [x] Drag-and-drop cut point adjustment — existing
- [x] Manual cut point addition at playhead — existing
- [x] Segment preview in main player — existing
- [x] Exercise tagging (name, muscle groups, equipment, audio flag) — existing
- [x] Autocomplete for muscle groups and equipment — existing
- [x] FFmpeg video cutting into segments — existing
- [x] Thumbnail generation for exercises — existing
- [x] Exercise library with search and filter — existing
- [x] Exercise editing and deletion — existing
- [x] Cloudflare R2 cloud storage — existing
- [x] PWA installability — existing

### Active

<!-- Frontend rebuild scope -->

- [ ] React + Tailwind CSS frontend architecture
- [ ] Dark theme with lighter UI elements
- [ ] Tab-based SPA (Upload | Editor | Library)
- [ ] Instant tab switching without page reloads
- [ ] Smooth video playback on mobile
- [ ] Mobile-optimized touch interactions
- [ ] Canvas timeline integration in React
- [ ] PWA features preserved (manifest, service worker, share target)

### Out of Scope

- Desktop-specific layouts — mobile-only app
- Backend changes — keep Flask API as-is
- New features beyond current functionality — feature parity only
- Animations and micro-interactions beyond basics — feature parity first

## Context

**Current State:**
- Frontend: 3 separate HTML pages with vanilla JavaScript
- Pain points: Hard to use on mobile, video playback and page transitions feel janky
- Timeline editor uses HTML5 Canvas — works well, needs React wrapper

**Technical Environment:**
- Backend: Flask 3.0, PostgreSQL, Cloudflare R2 storage
- Video processing: FFmpeg, PySceneDetect
- Existing API endpoints work and should not change

**Codebase Map:** `.planning/codebase/` contains architecture and stack analysis

## Constraints

- **Backend**: Keep Flask API unchanged — frontend-only rebuild
- **PWA**: Must maintain share target and installability
- **Canvas**: Timeline editor uses Canvas — wrap in React component, don't rewrite
- **Mobile-only**: No desktop layouts needed

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React + Tailwind | Modern stack, component architecture, utility-first CSS | — Pending |
| Tab-based SPA | Instant switching, better mobile UX than page navigation | — Pending |
| Dark theme | User preference, easier on eyes | — Pending |
| Wrap existing Canvas | Timeline works, avoid rewrite risk | — Pending |

---
*Last updated: 2026-02-02 after initialization*
