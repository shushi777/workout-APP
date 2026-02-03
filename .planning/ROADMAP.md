# Roadmap: Workout Video Editor - React Frontend Rebuild

## Overview

Rebuild the workout video editor frontend from vanilla HTML/JS to React + Tailwind CSS, delivering a smooth mobile experience across 5 phases. Phase 1 establishes the foundation (Vite, React, TypeScript, Tailwind, Zustand) with mobile UX patterns. Phase 2 migrates the upload feature. Phase 3 tackles the complex timeline editor with Canvas integration, tagging drawer, and save flow. Phase 4 migrates the exercise library. Phase 5 adds PWA capabilities (installability, share target, offline).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Foundation & Design System** - React project setup with Tailwind dark theme and mobile UX patterns
- [x] **Phase 2: Upload Feature** - Video upload with drag-and-drop and processing status
- [x] **Phase 3: Timeline Editor** - Canvas timeline, video player, segment tagging, and save flow
- [x] **Phase 4: Exercise Library** - View, search, filter, play, edit, and delete exercises
- [ ] **Phase 5: PWA Migration** - Installability, share target, and offline support

## Phase Details

### Phase 1: Foundation & Design System
**Goal**: User can navigate a React app shell with dark theme and 44px+ touch targets
**Depends on**: Nothing (first phase)
**Requirements**: SETUP-01, SETUP-02, SETUP-03, SETUP-04, SETUP-05, SETUP-06, UX-01, UX-02, UX-03, UX-04
**Success Criteria** (what must be TRUE):
  1. User can navigate between Upload, Editor, and Library tabs without page reload
  2. All buttons and interactive elements are 44px+ for comfortable touch
  3. App displays in dark theme with lighter UI elements
  4. Hebrew text renders correctly in RTL layout
  5. Development server proxies API calls to Flask backend
**Plans:** 2 plans

Plans:
- [x] 01-01-PLAN.md — Vite + React + TypeScript + Tailwind setup with Flask proxy
- [x] 01-02-PLAN.md — App shell with tab navigation, Button component, and Zustand stores

### Phase 2: Upload Feature
**Goal**: User can upload a video and see it processed for scene detection
**Depends on**: Phase 1
**Requirements**: UPLOAD-01, UPLOAD-02, UPLOAD-03, UPLOAD-04, UPLOAD-05
**Success Criteria** (what must be TRUE):
  1. User can drag-and-drop a video file onto the upload area
  2. User can tap to select a video file from device storage
  3. User sees upload progress bar while video transfers
  4. User sees processing status while scene detection runs
  5. User is automatically navigated to Editor tab after processing completes
**Plans:** 1 plan

Plans:
- [x] 02-01-PLAN.md — Upload infrastructure (api, store, ProgressBar) + DropZone + UploadPage wiring

### Phase 3: Timeline Editor
**Goal**: User can edit cut points, preview segments, tag exercises, and save the timeline
**Depends on**: Phase 2
**Requirements**: EDITOR-01, EDITOR-02, EDITOR-03, EDITOR-04, EDITOR-05, EDITOR-06, EDITOR-07, TAG-01, TAG-02, TAG-03, TAG-04, TAG-05, TAG-06, TAG-07, TAG-08, SAVE-01, SAVE-02, SAVE-03
**Success Criteria** (what must be TRUE):
  1. Canvas timeline renders cut points from scene detection
  2. User can drag cut points to adjust timing with live feedback
  3. User can add manual cut points at current playhead position
  4. User can pinch-to-zoom on timeline for precision editing
  5. Video player plays with custom controls and stops at segment boundaries
  6. User can tap segment to open tagging drawer with video preview
  7. User can enter exercise name, select muscle groups/equipment with autocomplete, toggle audio removal
  8. Segment card shows checkmark badge after saving details
  9. User can save all tagged segments and is navigated to Library after video cutting completes
**Plans:** 4 plans

Plans:
- [x] 03-01-PLAN.md — Canvas timeline with Zustand store, dnd-kit dragging, and cut point rendering
- [x] 03-02-PLAN.md — Video player with custom controls and segment preview playback
- [x] 03-03-PLAN.md — Segment tagging drawer with shadcn/ui, autocomplete chips, and form
- [x] 03-04-PLAN.md — Save flow with progress modal and navigation to Library

### Phase 4: Exercise Library
**Goal**: User can view, search, filter, play, edit, and delete saved exercises
**Depends on**: Phase 3
**Requirements**: LIB-01, LIB-02, LIB-03, LIB-04, LIB-05, LIB-06, LIB-07
**Success Criteria** (what must be TRUE):
  1. User can view all saved exercises in a grid layout with thumbnails
  2. User can search exercises by name and see filtered results
  3. User can filter exercises by muscle groups and equipment
  4. User can tap an exercise to play its video
  5. User can edit exercise metadata and see changes saved
  6. User can delete an exercise and see it removed from the list
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md — Exercise store, API functions, grid layout, search and filter
- [x] 04-02-PLAN.md — Video autoplay with Intersection Observer, edit dialog, delete dialog

### Phase 5: PWA Migration
**Goal**: User can install the app and share videos from gallery directly to it
**Depends on**: Phase 4
**Requirements**: PWA-01, PWA-02, PWA-03
**Success Criteria** (what must be TRUE):
  1. User can install the app to home screen on mobile device
  2. User can share a video from gallery and have it open in the app for processing
  3. App shell is cached for offline access (basic offline support)
**Plans**: TBD

Plans:
- [ ] 05-01: PWA manifest and service worker with vite-plugin-pwa
- [ ] 05-02: Share target handler with service worker interception

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Design System | 2/2 | ✓ Complete | 2026-02-03 |
| 2. Upload Feature | 1/1 | ✓ Complete | 2026-02-03 |
| 3. Timeline Editor | 4/4 | ✓ Complete | 2026-02-03 |
| 4. Exercise Library | 2/2 | ✓ Complete | 2026-02-03 |
| 5. PWA Migration | 0/2 | Not started | - |
