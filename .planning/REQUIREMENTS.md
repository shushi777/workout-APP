# Requirements: Workout Video Editor - React Frontend Rebuild

**Defined:** 2026-02-03
**Core Value:** Smooth, responsive mobile experience for editing workout videos

## v1 Requirements

Requirements for the React + Tailwind frontend rebuild. Each maps to roadmap phases.

### Setup & Infrastructure

- [ ] **SETUP-01**: Vite + React 19 + TypeScript project initialized
- [ ] **SETUP-02**: Tailwind CSS 4 configured with dark theme
- [ ] **SETUP-03**: Zustand state management configured
- [ ] **SETUP-04**: React Router with tab-based navigation (Upload | Editor | Library)
- [ ] **SETUP-05**: Flask API proxy configured for development
- [ ] **SETUP-06**: Production build outputs to Flask static folder

### Upload Feature

- [ ] **UPLOAD-01**: User can drag-and-drop video file to upload
- [ ] **UPLOAD-02**: User can tap to select video file from device
- [ ] **UPLOAD-03**: User sees upload progress indicator
- [ ] **UPLOAD-04**: User sees processing progress during scene detection
- [ ] **UPLOAD-05**: User is navigated to Editor tab after processing completes

### Timeline Editor

- [ ] **EDITOR-01**: Canvas timeline renders with cut points from scene detection
- [ ] **EDITOR-02**: User can drag cut points to adjust timing
- [ ] **EDITOR-03**: User can add manual cut points at playhead position
- [ ] **EDITOR-04**: User can pinch-to-zoom on timeline for precision
- [ ] **EDITOR-05**: Video player plays with custom controls (no native controls)
- [ ] **EDITOR-06**: User can tap timeline segment to preview in player
- [ ] **EDITOR-07**: Player stops at segment end during preview

### Segment Tagging

- [ ] **TAG-01**: User can tap segment to open tagging drawer
- [ ] **TAG-02**: Drawer shows video preview of selected segment
- [ ] **TAG-03**: User can enter exercise name
- [ ] **TAG-04**: User can select muscle groups with autocomplete chips
- [ ] **TAG-05**: User can select equipment with autocomplete chips
- [ ] **TAG-06**: User can toggle "remove audio" option
- [ ] **TAG-07**: User can save segment details
- [ ] **TAG-08**: Segment card shows checkmark when details saved

### Save & Process

- [ ] **SAVE-01**: User can save timeline with all tagged segments
- [ ] **SAVE-02**: User sees progress indicator during video cutting
- [ ] **SAVE-03**: User is navigated to Library tab after successful save

### Exercise Library

- [ ] **LIB-01**: User can view all saved exercises in grid layout
- [ ] **LIB-02**: User can search exercises by name
- [ ] **LIB-03**: User can filter exercises by muscle groups
- [ ] **LIB-04**: User can filter exercises by equipment
- [ ] **LIB-05**: User can tap exercise to play video
- [ ] **LIB-06**: User can edit exercise metadata
- [ ] **LIB-07**: User can delete exercise

### Mobile UX

- [ ] **UX-01**: All interactive elements have 44px+ touch targets
- [ ] **UX-02**: Tab navigation is fixed at bottom of screen
- [ ] **UX-03**: Dark theme with lighter UI elements throughout
- [ ] **UX-04**: RTL layout support for Hebrew text

### PWA

- [ ] **PWA-01**: App is installable on mobile devices
- [ ] **PWA-02**: User can share video from gallery to app (Share Target)
- [ ] **PWA-03**: Service worker caches app shell for offline access

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Polish

- **POLISH-01**: Haptic feedback on key actions (cut placement, save)
- **POLISH-02**: Skeleton loading states during data fetch
- **POLISH-03**: Micro-animations on state transitions
- **POLISH-04**: Optimistic UI updates for instant feedback

### Advanced Features

- **ADV-01**: Undo/redo for cut point changes
- **ADV-02**: Thumbnail strip on timeline
- **ADV-03**: Audio waveform visualization
- **ADV-04**: Batch segment operations

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Desktop layouts | Mobile-only app |
| Backend changes | Keep Flask API unchanged |
| New features | Feature parity is the goal |
| Landscape mode | Portrait-only for v1 |
| Offline video editing | Requires significant architecture changes |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SETUP-01 | Phase 1 | Pending |
| SETUP-02 | Phase 1 | Pending |
| SETUP-03 | Phase 1 | Pending |
| SETUP-04 | Phase 1 | Pending |
| SETUP-05 | Phase 1 | Pending |
| SETUP-06 | Phase 1 | Pending |
| UX-01 | Phase 1 | Pending |
| UX-02 | Phase 1 | Pending |
| UX-03 | Phase 1 | Pending |
| UX-04 | Phase 1 | Pending |
| UPLOAD-01 | Phase 2 | Pending |
| UPLOAD-02 | Phase 2 | Pending |
| UPLOAD-03 | Phase 2 | Pending |
| UPLOAD-04 | Phase 2 | Pending |
| UPLOAD-05 | Phase 2 | Pending |
| EDITOR-01 | Phase 3 | Pending |
| EDITOR-02 | Phase 3 | Pending |
| EDITOR-03 | Phase 3 | Pending |
| EDITOR-04 | Phase 3 | Pending |
| EDITOR-05 | Phase 3 | Pending |
| EDITOR-06 | Phase 3 | Pending |
| EDITOR-07 | Phase 3 | Pending |
| TAG-01 | Phase 3 | Pending |
| TAG-02 | Phase 3 | Pending |
| TAG-03 | Phase 3 | Pending |
| TAG-04 | Phase 3 | Pending |
| TAG-05 | Phase 3 | Pending |
| TAG-06 | Phase 3 | Pending |
| TAG-07 | Phase 3 | Pending |
| TAG-08 | Phase 3 | Pending |
| SAVE-01 | Phase 3 | Pending |
| SAVE-02 | Phase 3 | Pending |
| SAVE-03 | Phase 3 | Pending |
| LIB-01 | Phase 4 | Pending |
| LIB-02 | Phase 4 | Pending |
| LIB-03 | Phase 4 | Pending |
| LIB-04 | Phase 4 | Pending |
| LIB-05 | Phase 4 | Pending |
| LIB-06 | Phase 4 | Pending |
| LIB-07 | Phase 4 | Pending |
| PWA-01 | Phase 5 | Pending |
| PWA-02 | Phase 5 | Pending |
| PWA-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 40 total
- Mapped to phases: 40
- Unmapped: 0

---
*Requirements defined: 2026-02-03*
*Last updated: 2026-02-03 after roadmap creation*
