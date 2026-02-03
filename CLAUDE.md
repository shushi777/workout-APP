# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Workout Video Editor - A mobile-first Progressive Web App (PWA) for editing workout videos with an interactive timeline editor. Users can upload videos, use AI scene detection to suggest cuts, manually add/adjust cut points, and tag each segment with exercise details.

**Tech Stack:**
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS 4 + Zustand
- **Backend:** Flask + PostgreSQL + PySceneDetect + FFmpeg
- **Storage:** Local / AWS S3 / Cloudflare R2 (abstraction layer)
- **PWA:** Workbox + vite-plugin-pwa

### Current Status: v1.0 Shipped (2026-02-03)

**Completed Features:**
- ✅ React frontend rebuild with TypeScript and Tailwind CSS
- ✅ Video upload with drag-and-drop and XHR progress tracking
- ✅ AI-powered scene detection using PySceneDetect
- ✅ Interactive Canvas-based timeline editor with cut point dragging
- ✅ Segment tagging with autocomplete chips (Zustand store)
- ✅ Exercise library with search, filter, and video autoplay on scroll
- ✅ PWA with Web Share Target API (share videos from mobile gallery)
- ✅ FFmpeg video cutting with thumbnail generation
- ✅ Cloud storage support (Cloudflare R2 - 100% free tier)

## Development Commands

### Setup
```bash
# Install Python backend dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install

# FFmpeg is required for video splitting
# Windows: Download from https://ffmpeg.org/download.html
# Linux: sudo apt-get install ffmpeg
# macOS: brew install ffmpeg

# PostgreSQL setup required - see DATABASE_SETUP.md

# Environment configuration
cp .env.example .env
# Edit .env with your database password, storage backend, etc.
```

### Running the Application
```bash
# Start Flask backend (serves API + static React build)
python server.py
# Backend runs at http://localhost:5000

# For frontend development with hot reload:
cd frontend
npm run dev
# Frontend dev server runs at http://localhost:5173

# Build frontend for production:
cd frontend
npm run build
# Output goes to static/react/
```

## Project Structure

```
workout_APP/
├── frontend/                   # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/        # BottomNav
│   │   │   ├── library/       # ExerciseCard, ExerciseGrid, SearchFilters, dialogs
│   │   │   ├── tagging/       # AutocompleteChips, SegmentDrawer
│   │   │   ├── timeline/      # TimelineCanvas, VideoPlayer, DraggableCutPoint, SaveFlow
│   │   │   ├── ui/            # Button, dialog, drawer, ProgressBar
│   │   │   └── upload/        # DropZone
│   │   ├── hooks/             # useCanvasTimeline, useVideoSegmentPlayback
│   │   ├── lib/               # api.ts, shareTarget.ts, utils.ts
│   │   ├── pages/             # UploadPage, EditorPage, LibraryPage
│   │   ├── stores/            # exerciseStore.ts (Zustand)
│   │   ├── App.tsx            # Router setup
│   │   ├── main.tsx           # Entry point
│   │   └── sw.ts              # Service worker (Workbox)
│   ├── public/                # Static assets
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── static/
│   ├── react/                 # Built React app (production)
│   └── icons/                 # PWA icons (192px, 512px)
├── migrations/                # PostgreSQL migration SQL files
├── uploads/                   # Temporary video upload storage
├── output/                    # Local video/segment storage
├── server.py                  # Flask backend API
├── config.py                  # Configuration management
├── storage.py                 # Storage abstraction (Local/S3/R2)
├── video_processing.py        # FFmpeg video cutting
├── requirements.txt           # Python dependencies
└── .env.example               # Environment template
```

## Architecture

### Frontend (React)

**State Management:** Zustand store (`stores/exerciseStore.ts`)
```typescript
interface ExerciseStore {
  // Timeline state
  videoUrl: string | null
  videoDuration: number
  cutPoints: CutPoint[]        // {id, time, type: 'auto'|'manual'}
  segments: Segment[]          // Derived from cutPoints
  selectedSegmentIndex: number | null

  // Exercise tagging
  existingTags: { muscleGroups: string[], equipment: string[] }

  // Actions
  addCutPoint, removeCutPoint, updateCutPointTime
  setSegmentDetails, clearSegmentDetails
}
```

**Key Components:**
- `TimelineCanvas` - Canvas-based timeline with cut point visualization
- `DraggableCutPoint` - @dnd-kit powered drag handles
- `SegmentDrawer` - Vaul drawer for exercise tagging
- `AutocompleteChips` - Tag input with suggestions
- `VideoPlayer` - Custom controls with segment playback
- `DropZone` - react-dropzone for video upload

**Routing:** React Router v7
- `/` - Upload page
- `/editor` - Timeline editor (with `?video=` and `?cuts=` params)
- `/library` - Exercise library

### Backend (Flask)

**API Endpoints:**
- `POST /process` - Upload video, run scene detection, return cut points
- `POST /api/timeline/save` - Cut video segments, save to storage + database
- `GET /api/exercises` - List all exercises with filters
- `PUT /api/exercises/<id>` - Update exercise metadata
- `DELETE /api/exercises/<id>` - Delete exercise (DB + storage)
- `GET /get-tags` - Get existing muscle groups and equipment for autocomplete
- `POST /share-receiver` - Handle PWA Web Share Target
- `GET /download/<folder>/<filename>` - Serve video files

**Storage Abstraction (`storage.py`):**
- `LocalStorage` - Development (saves to `output/`)
- `S3Storage` - AWS S3 (has bandwidth costs)
- `R2Storage` - Cloudflare R2 (FREE: 10GB storage + unlimited bandwidth)

Configure via `STORAGE_BACKEND` env var: `local`, `s3`, or `r2`

### Video Processing Pipeline

1. **Upload** → Video received via drag-drop or Web Share Target
2. **Scene Detection** → PySceneDetect ContentDetector finds cut points
3. **Timeline Editing** → User adjusts cuts, tags segments with exercise info
4. **Save & Process** → FFmpeg cuts segments, generates thumbnails
5. **Storage** → Upload to R2/S3 or save locally
6. **Database** → Save exercise metadata with video URLs
7. **Library** → Browse, search, filter, play exercises

### Database Schema

**Tables:**
- `exercises` - id, video_file_path, thumbnail_url, exercise_name, duration, start_time, end_time, remove_audio, created_at
- `muscle_groups` - id, name (unique)
- `equipment` - id, name (unique)
- `exercise_muscle_groups` - exercise_id, muscle_group_id (junction)
- `exercise_equipment` - exercise_id, equipment_id (junction)

## Key Technical Decisions

**Frontend:**
- React 19 with TypeScript for type safety
- Tailwind CSS 4 with dark theme and 44px touch targets
- Zustand for simple, performant state management
- @dnd-kit for accessible drag-and-drop
- Vaul for mobile-native drawer component
- Workbox for PWA service worker

**Canvas Timeline:**
- High-DPI rendering with devicePixelRatio scaling
- Cut points as draggable circles (blue=auto, green=manual)
- Segments derived from sorted cut points array
- Playhead synced with video currentTime

**Video Playback:**
- Custom useVideoSegmentPlayback hook
- Auto-stop at segment end using timeupdate event
- Cleanup pattern to prevent memory leaks

## Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=workout_db
DB_USER=postgres
DB_PASSWORD=your_password

# Storage (choose one: local, s3, r2)
STORAGE_BACKEND=local

# Cloudflare R2 (if STORAGE_BACKEND=r2)
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket
R2_PUBLIC_URL=https://your-bucket.r2.dev

# Flask
SECRET_KEY=your_secret_key
FLASK_ENV=development
```

## Deployment

**Railway.app (recommended):**
- `railway.toml` configured for Flask + Gunicorn
- `Dockerfile` for containerized deployment
- Set `DATABASE_PUBLIC_URL` from Railway PostgreSQL addon
- Set `STORAGE_BACKEND=r2` for cloud storage

**Build Process:**
```bash
# Frontend build (run before deploy)
cd frontend && npm run build

# Output goes to static/react/ which Flask serves
```
