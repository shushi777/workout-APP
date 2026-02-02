# Architecture

**Analysis Date:** 2026-02-02

## Pattern Overview

**Overall:** Three-tier MVC with separation of concerns: Frontend (HTML/Canvas), Backend (Flask API), and Storage abstraction layer.

**Key Characteristics:**
- Client-server architecture with REST API backend
- Storage abstraction layer for cloud/local flexibility
- Canvas-based interactive timeline visualization
- Event-driven UI state management
- Database-driven exercise library

## Layers

**Presentation Layer:**
- Purpose: Render UI, handle user interactions, display video timeline
- Location: `index.html`, `timeline-editor.html`, `exercise-library.html`, `static/css/`, `static/js/`
- Contains: HTML templates, CSS styles, JavaScript state management
- Depends on: Flask API endpoints for scene detection, exercise data, tag suggestions
- Used by: Users accessing the application through browser

**API Layer:**
- Purpose: Process video uploads, detect scenes, manage exercise data, coordinate storage
- Location: `server.py`
- Contains: Flask route handlers, database queries, scene detection coordination
- Depends on: PySceneDetect for scene detection, PostgreSQL for data persistence, storage abstraction for file storage
- Used by: Frontend applications via HTTP/JSON requests

**Storage Abstraction Layer:**
- Purpose: Provide unified interface for local filesystem, AWS S3, and Cloudflare R2 storage
- Location: `storage.py`
- Contains: Abstract base class `VideoStorage`, implementations `LocalStorage`, `S3Storage`, `R2Storage`
- Depends on: boto3 for cloud storage, file system for local storage
- Used by: API layer when saving videos, thumbnails, and managing exercise files

**Video Processing Layer:**
- Purpose: Handle video cutting, thumbnail generation, metadata extraction
- Location: `video_processing.py`
- Contains: FFmpeg command execution, video segmentation, thumbnail generation
- Depends on: FFmpeg (external binary), system subprocess for execution
- Used by: API layer during timeline save to create segment videos

**Database Layer:**
- Purpose: Persist exercise metadata and relationships
- Location: `migrations/`, PostgreSQL (external)
- Contains: Exercise data, muscle groups, equipment, junction tables for relationships
- Depends on: psycopg2 connection handler in `server.py`
- Used by: API layer for all CRUD operations on exercise data

**Configuration Layer:**
- Purpose: Centralize configuration and environment-based settings
- Location: `config.py`
- Contains: Flask config, database config, storage backend selection, video processing parameters
- Depends on: .env file for environment variables
- Used by: Server initialization and all layers requiring configuration

## Data Flow

**Upload to Save Workflow:**

1. **Video Upload** → User selects/shares video
   - Frontend: `index.html` drag-drop or share handler
   - POST to `/process` with file and parameters (threshold, min_scene_length)

2. **Scene Detection** → Server analyzes video for scene changes
   - `server.py` `/process` endpoint receives video
   - Video saved temporarily to `uploads/` folder
   - `detect_scenes()` uses PySceneDetect ContentDetector to find transitions
   - Returns: List of cut point times (where scenes end)
   - Video moved from `uploads/` to `output/{name}_{timestamp}/` folder

3. **Timeline Editing** → User adjusts cut points and adds segment details
   - Frontend: `timeline-editor.js` loads video with suggested cuts as blue circles
   - User can drag to adjust cut points, add manual green circles, zoom (0.5x-3x)
   - For each segment: add exercise name, muscle groups, equipment, audio flag
   - State stored in `state` object (global): cutPoints, segments with details

4. **Timeline Save** → User clicks "Save" to cut video and store exercises
   - POST `/api/timeline/save` with: videoUrl, cutPoints, segments (with exercise details)
   - `server.py` extracts original video path from URL, gets local file from `output/` folder
   - Calls `split_video_by_timeline()` to cut video into segments using FFmpeg
   - For each segment:
     - FFmpeg cuts video from start_time to end_time
     - Creates thumbnail (first frame, 320x180)
     - Respects `remove_audio` flag (FFmpeg `-an` flag)
   - Uploads each segment video and thumbnail to storage backend
   - Inserts exercise record with storage URL, metadata, muscle groups, equipment
   - Cleanup: Deletes original video and local segments (if using cloud storage)

5. **Exercise Library** → User views saved exercises
   - Frontend: `exercise-library.js` loads from `/api/exercises`
   - Displays exercises with thumbnails from storage URLs
   - Supports filtering by muscle groups, equipment, search by name
   - Can edit exercise metadata or delete (removes from DB and storage)

**State Management (Frontend):**

Timeline Editor `state` object (timeline-editor.js):
```javascript
{
  videoFile,                        // File object (upload)
  videoUrl,                         // Serving URL (/download/...)
  videoDuration,                    // Seconds
  cutPoints: [{
    time: number,
    type: 'auto'|'manual',
    id: string                      // Unique identifier
  }],
  segments: [{
    start: time,
    end: time,
    details: {
      name: string,                 // Exercise name
      muscleGroups: string[],       // ["chest", "triceps"]
      equipment: string[],          // ["dumbbells"]
      removeAudio: boolean          // Audio removal flag
    } | null                        // null until user fills form
  }],
  selectedSegmentIndex: number | null,
  currentTime: number,
  isPlaying: boolean,
  zoomLevel: number,                // 0.5 to 3.0
  draggingCutPoint: {time, id} | null,
  segmentPlaybackListener: function | null,  // Cleanup pattern
  drawerVideoPlaybackListener: function | null,
  existingTags: {                   // From /get-tags
    muscleGroups: string[],
    equipment: string[]
  }
}
```

Exercise Library `state` object (exercise-library.js):
```javascript
{
  allExercises: [],
  filteredExercises: [],
  selectedMuscles: Set<string>,
  selectedEquipment: Set<string>,
  searchTerm: string,
  currentExercise: object | null,
  allMuscleGroups: string[],
  allEquipment: string[],
  playingCards: Set<number>          // Track which cards are playing video
}
```

## Key Abstractions

**VideoStorage (storage.py):**
- Purpose: Unified interface for different storage backends
- Examples: `LocalStorage`, `S3Storage`, `R2Storage`
- Pattern: Abstract base class with concrete implementations using same interface
- Methods: `save(file_data, filename, folder)`, `delete(path)`, `exists(path)`, `get_url(path)`, `get_local_path(path)`

**Storage Factory (storage.py):**
- Purpose: Create appropriate storage instance based on configuration
- Pattern: Factory function `create_storage(config)` that returns configured instance
- Usage: Called once at server startup to initialize `storage` global

**Scene Detection (server.py):**
- Purpose: Wrapper around PySceneDetect ContentDetector
- Pattern: Encapsulates scene detection logic with configurable threshold and min length
- Returns: List of (start_timecode, end_timecode) tuples from PySceneDetect

**Video Processing (video_processing.py):**
- Purpose: High-level interface for FFmpeg video operations
- Functions:
  - `split_video_by_timeline(video_path, segments, output_folder, ...)`: Cuts video, generates thumbnails
  - `get_video_info(video_path)`: Extracts metadata (duration, fps, resolution)
  - `check_ffmpeg_installed()`: Verifies FFmpeg availability
- Pattern: Functions raise `VideoProcessingError` for error handling

**Segment Playback Pattern (timeline-editor.js):**
- Purpose: Auto-stop main video at segment end
- Implementation: `timeupdate` event listener stored in `state.segmentPlaybackListener`
- Cleanup: Remove listener before creating new one to prevent memory leaks
- Usage: When segment selected, listener pauses video at segment.end time

## Entry Points

**Web Upload Page:**
- Location: `index.html` served by `server.py` `/` route
- Triggers: User drag-drops or selects video file
- Responsibilities: Display upload interface, call `/process`, redirect to timeline editor with scene detection results

**Web Share Target:**
- Location: `server.py` `/share-receiver` endpoint
- Triggers: User shares video from mobile gallery to PWA
- Responsibilities: Save shared video, detect scenes, show loading spinner, redirect to timeline editor

**Timeline Editor:**
- Location: `timeline-editor.html` served by `server.py` `/timeline-editor.html` route
- Triggers: Redirect from `/process` or `/share-receiver` with video URL and suggested cuts in query params
- Responsibilities: Display interactive canvas timeline, handle cut point editing, manage segment tagging, save to database

**Exercise Library:**
- Location: `exercise-library.html` served by `server.py` `/exercise-library.html` route
- Triggers: Direct navigation or redirect after save
- Responsibilities: Display exercise grid with filtering, handle edit/delete operations

**Scene Detection:**
- Location: `server.py` `/process` endpoint
- Triggers: POST request from upload page with video file
- Responsibilities: Save video, run PySceneDetect, return cut points, organize files for timeline editor

**Video Saving & Processing:**
- Location: `server.py` `/api/timeline/save` endpoint
- Triggers: POST request from timeline editor with complete timeline data
- Responsibilities: FFmpeg video cutting, thumbnail generation, storage upload, database persistence, cleanup

## Error Handling

**Strategy:** Multi-level error handling with user-friendly messages and fallback behavior

**Patterns:**
- Upload validation: File type checking, size limits (500MB)
- Scene detection failures: Show error but allow manual timeline editing
- Video cutting failures: Return error to user, don't save to database
- Storage upload failures: Log errors, skip failed uploads (video fails with error, thumbnail optional)
- Database errors: Return error response, user can retry save
- FFmpeg not found: Warning at startup, disabled video cutting
- Database connection: Logged error, returns 500 to user

**Exception Types:**
- `VideoProcessingError`: Raised by video_processing.py for FFmpeg failures
- `ClientError` (boto3): Caught and logged for S3/R2 upload failures
- Generic exceptions: Caught at endpoint level, logged, returned as JSON error response

## Cross-Cutting Concerns

**Logging:** Console print() statements throughout with prefixes:
- `[Timeline Editor]`: Frontend logging in browser console
- `[Storage]`: Storage backend initialization
- `[FFmpeg]`: FFmpeg availability checks
- `[Timeline Save]`: Timeline save operation progress
- `[Cleanup]`: File deletion progress
- `DEBUG:`, `ERROR:`, `WARNING:` for different severity levels

**Validation:**
- Frontend: Exercise name required, muscle groups required, equipment required before segment save
- Backend: Video URL format validation, segment data validation, file existence checks
- Database: Foreign key constraints, unique muscle group/equipment names
- File: Extension checking (mp4, avi, mov, mkv, flv, wmv)

**Authentication:** Not implemented - single-user development app

**Configuration Management:**
- Environment-based: Three configs (development, production, test) in `config.py`
- Storage backend selection via `STORAGE_BACKEND` env var
- Database connection: Railway `DATABASE_PUBLIC_URL` or local env vars
- Video processing parameters: Threshold, min scene length, codec, quality settings

**Concurrency:** Single-user application, no concurrent request handling needed

---

*Architecture analysis: 2026-02-02*
