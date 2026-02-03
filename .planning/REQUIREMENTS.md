# Requirements: Workout Video Editor - React Frontend Rebuild

**Defined:** 2026-02-03
**Core Value:** Smooth, responsive mobile experience for editing workout videos

## v1 Requirements

Requirements for the React + Tailwind frontend rebuild. Each maps to roadmap phases.

### Setup & Infrastructure

- [x] **SETUP-01**: Vite + React 19 + TypeScript project initialized
- [x] **SETUP-02**: Tailwind CSS 4 configured with dark theme
- [x] **SETUP-03**: Zustand state management configured
- [x] **SETUP-04**: React Router with tab-based navigation (Upload | Editor | Library)
- [x] **SETUP-05**: Flask API proxy configured for development
- [x] **SETUP-06**: Production build outputs to Flask static folder

### Upload Feature

- [x] **UPLOAD-01**: User can drag-and-drop video file to upload
- [x] **UPLOAD-02**: User can tap to select video file from device
- [x] **UPLOAD-03**: User sees upload progress indicator
- [x] **UPLOAD-04**: User sees processing progress during scene detection
- [x] **UPLOAD-05**: User is navigated to Editor tab after processing completes

### Timeline Editor

- [x] **EDITOR-01**: Canvas timeline renders with cut points from scene detection
- [x] **EDITOR-02**: User can drag cut points to adjust timing
- [x] **EDITOR-03**: User can add manual cut points at playhead position
- [x] **EDITOR-04**: User can pinch-to-zoom on timeline for precision
- [x] **EDITOR-05**: Video player plays with custom controls (no native controls)
- [x] **EDITOR-06**: User can tap timeline segment to preview in player
- [x] **EDITOR-07**: Player stops at segment end during preview

### Segment Tagging

- [x] **TAG-01**: User can tap segment to open tagging drawer
- [x] **TAG-02**: Drawer shows video preview of selected segment
- [x] **TAG-03**: User can enter exercise name
- [x] **TAG-04**: User can select muscle groups with autocomplete chips
- [x] **TAG-05**: User can select equipment with autocomplete chips
- [x] **TAG-06**: User can toggle "remove audio" option
- [x] **TAG-07**: User can save segment details
- [x] **TAG-08**: Segment card shows checkmark when details saved

### Save & Process

- [x] **SAVE-01**: User can save timeline with all tagged segments
- [x] **SAVE-02**: User sees progress indicator during video cutting
- [x] **SAVE-03**: User is navigated to Library tab after successful save

### Exercise Library

- [ ] **LIB-01**: User can view all saved exercises in grid layout
- [ ] **LIB-02**: User can search exercises by name
- [ ] **LIB-03**: User can filter exercises by muscle groups
- [ ] **LIB-04**: User can filter exercises by equipment
- [ ] **LIB-05**: User can tap exercise to play video
- [ ] **LIB-06**: User can edit exercise metadata
- [ ] **LIB-07**: User can delete exercise

### Mobile UX

- [x] **UX-01**: All interactive elements have 44px+ touch targets
- [x] **UX-02**: Tab navigation is fixed at bottom of screen
- [x] **UX-03**: Dark theme with lighter UI elements throughout
- [x] **UX-04**: RTL layout support for Hebrew text

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
| SETUP-01 | Phase 1 | Complete |
| SETUP-02 | Phase 1 | Complete |
| SETUP-03 | Phase 1 | Complete |
| SETUP-04 | Phase 1 | Complete |
| SETUP-05 | Phase 1 | Complete |
| SETUP-06 | Phase 1 | Complete |
| UX-01 | Phase 1 | Complete |
| UX-02 | Phase 1 | Complete |
| UX-03 | Phase 1 | Complete |
| UX-04 | Phase 1 | Complete |
| UPLOAD-01 | Phase 2 | Complete |
| UPLOAD-02 | Phase 2 | Complete |
| UPLOAD-03 | Phase 2 | Complete |
| UPLOAD-04 | Phase 2 | Complete |
| UPLOAD-05 | Phase 2 | Complete |
| EDITOR-01 | Phase 3 | Complete |
| EDITOR-02 | Phase 3 | Complete |
| EDITOR-03 | Phase 3 | Complete |
| EDITOR-04 | Phase 3 | Complete |
| EDITOR-05 | Phase 3 | Complete |
| EDITOR-06 | Phase 3 | Complete |
| EDITOR-07 | Phase 3 | Complete |
| TAG-01 | Phase 3 | Complete |
| TAG-02 | Phase 3 | Complete |
| TAG-03 | Phase 3 | Complete |
| TAG-04 | Phase 3 | Complete |
| TAG-05 | Phase 3 | Complete |
| TAG-06 | Phase 3 | Complete |
| TAG-07 | Phase 3 | Complete |
| TAG-08 | Phase 3 | Complete |
| SAVE-01 | Phase 3 | Complete |
| SAVE-02 | Phase 3 | Complete |
| SAVE-03 | Phase 3 | Complete |
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
