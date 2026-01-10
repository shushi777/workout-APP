# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Workout Video Editor - A mobile-first Progressive Web App (PWA) for editing workout videos with an interactive timeline editor. Users can upload videos, use AI scene detection to suggest cuts, manually add/adjust cut points, and tag each segment with exercise details. Built with Flask backend, PostgreSQL database, and Canvas-based timeline visualization.

### Current Status: Phase 6 - Cloud Storage Integration (Cloudflare R2) 🚀

**Completed Features (Phase 1-5):**
- ✅ Video upload with drag-and-drop interface
- ✅ AI-powered scene detection using PySceneDetect
- ✅ Interactive Canvas-based timeline editor
- ✅ Drag-and-drop cut point adjustment
- ✅ Manual cut point addition
- ✅ Segment preview in main player and drawer
- ✅ Exercise tagging with autocomplete
- ✅ PostgreSQL database storage for exercise metadata
- ✅ Mobile-first responsive design with PWA support
- ✅ **Web Share Target API**: Share videos from mobile gallery directly to app
- ✅ FFmpeg video cutting: Split original video into separate segment files
- ✅ Handle "Remove audio" flag during video cutting
- ✅ Thumbnail generation for each exercise
- ✅ Exercise library page with video playback
- ✅ Search and filter exercises by name, muscle groups, and equipment
- ✅ Exercise editing and deletion

**Phase 6 - Cloud Storage (100% FREE Solution with Cloudflare R2):**
- ✅ Storage abstraction layer (supports Local, AWS S3, Cloudflare R2)
- ✅ R2Storage implementation with S3-compatible API
- ✅ Configuration system for multiple storage backends
- ⏳ Cleanup logic: Delete original full videos after segmentation
- ⏳ Enhanced error handling for R2 uploads
- ⏳ R2 file deletion when exercises are deleted
- ⏳ Testing with real Cloudflare R2 bucket

**Why Cloudflare R2?**
- 💰 **100% FREE** up to 10GB storage (~1,000-1,250 exercise videos)
- 🌐 **Unlimited bandwidth** (no data transfer costs - this is what makes S3 expensive!)
- 🚀 **Built-in CDN** (fast global delivery included)
- 🔓 **No credit card required** for free tier
- 🔗 **Internet accessible** with HTTPS URLs
- 🛠️ **S3-compatible API** (same boto3 code, minimal changes)

## Development Commands

### Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# FFmpeg is required for video splitting
# Windows: Download from https://ffmpeg.org/download.html
# Linux: sudo apt-get install ffmpeg
# macOS: brew install ffmpeg

# PostgreSQL setup required - see DATABASE_SETUP.md
# After installing PostgreSQL, create database and tables as per DATABASE_SETUP.md

# Environment configuration
# Copy .env.example to .env and configure:
cp .env.example .env
# Edit .env file with your settings (database password, storage backend, etc.)

# For Cloudflare R2 (FREE cloud storage):
# See CLOUDFLARE_R2_SETUP.md for detailed setup instructions
# Update .env with R2 credentials and set STORAGE_BACKEND=r2
```

### Running the Application
```bash
# Start the Flask server
python server.py

# Open browser to http://localhost:5000
```

### Project Structure
**Frontend:**
- `index.html` - Upload page with drag-and-drop video upload interface
- `timeline-editor.html` - Main editor with Canvas timeline, video player, and segment tagging
- `exercise-library.html` - View saved exercises with search and filter
- `manifest.json` - PWA manifest for installability and share target
- `service-worker.js` - PWA service worker for offline support
- `static/css/`
  - `styles.css` - Global styles and upload page
  - `timeline-editor.css` - Timeline editor mobile-first styles
  - `exercise-library.css` - Exercise library page styles
- `static/js/`
  - `timeline-editor.js` - Timeline Canvas rendering, drag-drop, segment management
  - `exercise-library.js` - Exercise library frontend logic

**Backend:**
- `server.py` - Flask backend API for video processing and PostgreSQL database management
- `config.py` - Configuration management (supports .env, multiple storage backends)
- `storage.py` - Storage abstraction layer (Local, S3, Cloudflare R2)
- `video_processing.py` - FFmpeg video cutting and thumbnail generation
- `requirements.txt` - Python dependencies (Flask, boto3, psycopg2, scenedetect, etc.)

**Documentation:**
- `CLAUDE.md` - Project overview and development guide (this file)
- `DATABASE_SETUP.md` - PostgreSQL installation and setup instructions
- `CLOUDFLARE_R2_SETUP.md` - Cloudflare R2 setup guide (FREE cloud storage)
- `.env.example` - Environment variables template

**Directories:**
- `uploads/` - Temporary storage for uploaded videos (auto-created, cleaned after processing)
- `output/` - Local storage for videos (only used when STORAGE_BACKEND=local)

## Architecture

### Video Processing Pipeline (Phase 6 - With Cloud Storage)
1. **Upload**: User uploads video via drag-and-drop interface (supports MP4, AVI, MOV, MKV, FLV, WMV)
2. **Scene Detection**:
   - PySceneDetect's ContentDetector analyzes video frames
   - Detects scene transitions based on content changes
   - Returns cut point timestamps (scene end times)
   - Original video temporarily stored in `uploads/` folder
   - After processing, moved to `output/video_name_timestamp/` folder
3. **Timeline Editor Redirect**:
   - Frontend redirects to timeline-editor.html with video URL and suggested cuts as query parameters
   - Format: `/timeline-editor.html?video=/download/folder/file.mp4&cuts=15.5,32.8,48.2`
4. **Interactive Timeline Editing**: Canvas-based timeline with:
   - Auto-detected cut points (blue circles) loaded from query params
   - Manual cut points (green circles) added by user at playhead position
   - Drag-and-drop to adjust cut points with live time overlay
   - Click timeline segments to preview in main player (stops at segment end)
   - Click segment cards to open tagging drawer
   - Zoom controls (0.5x - 3x) for precise editing
5. **Segment Tagging**: For each segment, user adds:
   - Exercise name (text input, required)
   - Muscle groups (multi-select chips with autocomplete, required)
   - Required equipment (multi-select chips with autocomplete, required)
   - "Remove audio" checkbox option (stored in segment details)
   - Segment preview plays in both drawer and main player
6. **Save & Process** (Phase 6 - Cloud Storage Integration):
   - FFmpeg cuts video into individual segment files based on start/end times
   - Respects "Remove audio" flag during cutting (uses FFmpeg `-an` flag)
   - Generates thumbnail for each segment (first frame, 320x180)
   - **Storage Backend** (configurable via .env):
     - **Local Storage**: Saves segments to `output/` folder (development)
     - **Cloudflare R2**: Uploads segments to R2 bucket with public URLs (production, FREE)
     - **AWS S3**: Uploads to S3 (alternative, has data transfer costs)
   - Saves exercise metadata to PostgreSQL:
     - Video URL (R2 public URL or local path)
     - Thumbnail URL
     - Exercise name, duration, start/end times, muscle groups, equipment
     - `remove_audio` flag
   - **Cleanup** (Phase 6):
     - Deletes original full video from `output/` folder
     - Deletes temporary segment files from local disk (if using cloud storage)
     - Keeps only cloud URLs in database
   - Redirects to exercise-library.html after successful save
7. **Exercise Library** (Phase 5):
   - View all saved exercises with thumbnails
   - Search by exercise name
   - Filter by muscle groups and equipment
   - Play videos directly from cloud storage (R2 URLs)
   - Edit exercise metadata
   - Delete exercises (removes from database and cloud storage)

### Key Components

#### **Frontend - Upload Page (index.html)**
- Drag-and-drop video upload interface
- Configurable detection threshold (1-100, default: 27)
- Configurable minimum scene length (default: 0.6s)
- Redirects to timeline editor after processing
- Mobile-first responsive design with PWA support

#### **Frontend - Timeline Editor (timeline-editor.html + timeline-editor.js)**
- **Video Player**:
  - No native controls - custom click-to-play/pause
  - Play/pause icon animation overlay
  - Seekbar with LTR direction (left-to-right progress)
  - Time display (current/duration)

- **Canvas Timeline**:
  - High-DPI rendering with device pixel ratio scaling
  - Two types of cut points:
    - Blue circles: Auto-detected from PySceneDetect
    - Green circles: Manually added by user
  - Drag-and-drop cut points with live time overlay display
  - Click segments to preview in main player (2-second highlight)
  - Visual feedback: playhead, waveform placeholder, segment colors
  - Zoom controls (0.5x - 3x)
  - Touch and mouse event support

- **Segments List**:
  - Cards showing segment number, time range, duration
  - Green checkmark badge when segment has details
  - Click card to open tagging drawer

- **Bottom Drawer** (mobile sheet):
  - Video preview of selected segment
  - Exercise name input
  - Muscle groups chips with autocomplete
  - Equipment chips with autocomplete
  - "Remove audio" checkbox option
  - Save/Delete/Close buttons
  - Smooth slide-up animation

- **JavaScript State Management**:
  ```javascript
  {
    videoFile, videoUrl, videoDuration,
    cutPoints: [{time, type: 'auto'|'manual', id}],
    segments: [{
      start,
      end,
      details: {
        name: string,
        muscleGroups: string[],
        equipment: string[],
        removeAudio: boolean
      } | null
    }],
    selectedSegmentIndex,
    currentTime, isPlaying,
    zoomLevel, draggingCutPoint,
    segmentPlaybackListener, // Cleanup pattern for auto-stop at segment end
    existingTags: {muscleGroups, equipment}
  }
  ```

- **Important Implementation Details**:
  - Segment playback uses event listener pattern with cleanup (`segmentPlaybackListener`)
  - When segment is selected, main player seeks to segment start and plays until segment end
  - Preview video in drawer uses Media Fragments URI (`#t=start,end`) for automatic segment playback
  - `removeAudio` flag is stored in segment details but not yet sent to backend (Phase 4 feature)

#### **Backend (server.py)**
- **POST `/process`**: Scene detection with PySceneDetect, returns suggested cut points and redirect URL
- **GET `/get-tags`**: Returns all unique muscle groups and equipment for autocomplete
- **POST `/api/timeline/save`**: Saves timeline segments with exercise details to PostgreSQL (Phase 3 - metadata only, no video cutting yet)
- **GET `/download/<folder>/<filename>`**: Serves video files for streaming (not download)
- **POST `/share-receiver`**: Handles videos shared via Web Share Target API (PWA feature)
- **Static file routes**: Serves index.html, timeline-editor.html, exercise-library.html, manifest.json, service-worker.js

**Important Backend Notes:**
- Uses `shutil.move` instead of `os.rename` for cross-device file operations
- Closes video file with `del video` after PySceneDetect processing to release file handle
- All database operations use parameterized queries to prevent SQL injection
- `get_or_create_muscle_group()` and `get_or_create_equipment()` helper functions for normalized tags
- Legacy `/save-tags` endpoint still exists but is unused (can be removed)

#### **PWA Features**
- **manifest.json**: Installable app with share target for receiving videos
- **service-worker.js**: Offline support (basic caching)
- Mobile-first design with touch-friendly 44px minimum tap targets
- Bottom navigation bar (shows only on mobile <768px)

### Detection Parameters
- **Threshold (1-100)**: Lower values = more sensitive (detects more scenes), higher values = less sensitive
  - Default: 27 (balanced sensitivity)
  - PySceneDetect uses ContentDetector to analyze frame-to-frame changes
- **Min Scene Length**: Minimum duration in seconds for a scene to be detected (prevents very short cuts)
  - Default: 0.6 seconds
  - Converted to frames based on video FPS before passing to PySceneDetect

### Technical Decisions & Patterns

**Canvas Timeline Implementation:**
- High-DPI rendering with `devicePixelRatio` scaling for sharp visuals on retina displays
- Separate visual layers: background → time markers → segments → cut points → playhead
- Cut points stored as `{time, type, id}` objects with unique IDs for drag tracking
- Segments dynamically calculated from cut points array (not stored separately)

**Segment Playback Pattern:**
- Uses event listener cleanup pattern to prevent memory leaks
- `segmentPlaybackListener` stored in state and removed before creating new one
- Main player uses `timeupdate` event to auto-pause at segment end
- Drawer preview uses Media Fragments URI (`#t=start,end`) for native browser support

**State Management:**
- Single global `state` object for all application state
- Segments preserve `details` when cut points are adjusted
- Cut points always sorted by time after drag operations
- Selected segment tracked by index (null when no selection)

**Autocomplete Implementation:**
- Loads existing tags from database on page load (`/get-tags`)
- Dropdown shows filtered suggestions as user types
- Enter key or click adds chip (prevents duplicates)
- New tags automatically added to database when segment is saved

**File Handling:**
- Original video moved (not copied) from uploads/ to output/ folder
- Uses `shutil.move` for cross-device compatibility
- Video file closed with `del video` to release file handle on Windows
- Output folders named `{base_name}_{timestamp}` for uniqueness

**RTL Support:**
- Hebrew text throughout interface (dir="rtl" on html tag)
- Seekbar direction is LTR (left-to-right) despite RTL layout
- Timeline canvas rendering is LTR (time flows left to right)
- Bottom navigation and drawer work naturally with RTL

### Database Schema (Phase 3)
**Tables:**
- **exercises**: Main table storing exercise information
  - id (SERIAL PRIMARY KEY)
  - video_file_path (TEXT) - Currently stores local path to original video, will store R2 URL in Phase 4
  - exercise_name (VARCHAR(255)) - Name of the exercise
  - duration (FLOAT) - Duration in seconds (calculated from segment start/end times)
  - created_at (TIMESTAMP) - Auto-generated timestamp

- **muscle_groups**: Lookup table for muscle groups
  - id (SERIAL PRIMARY KEY)
  - name (VARCHAR(100) UNIQUE)

- **equipment**: Lookup table for equipment
  - id (SERIAL PRIMARY KEY)
  - name (VARCHAR(100) UNIQUE)

- **exercise_muscle_groups**: Junction table (many-to-many)
  - exercise_id → exercises.id
  - muscle_group_id → muscle_groups.id

- **exercise_equipment**: Junction table (many-to-many)
  - exercise_id → exercises.id
  - equipment_id → equipment.id

**Phase 4 Schema Changes:**
- Add `start_time` (FLOAT) and `end_time` (FLOAT) columns to `exercises` table
- Add `remove_audio` (BOOLEAN) column to `exercises` table
- Change `video_file_path` to store Cloudflare R2 URL instead of local path
- Consider adding `thumbnail_url` column for video previews

### API Endpoints

#### POST `/share-receiver`
Handles videos shared from other apps via Web Share Target API (PWA feature).

**Request:**
- Content-Type: multipart/form-data
- Fields:
  - `video`: Video file (shared from mobile gallery or other app)

**Response:**
- HTML page with auto-redirect to timeline editor
- Automatically processes video with default settings (threshold: 27, min scene: 0.6s)
- Shows loading screen with spinner and Hebrew UI
- Redirects to `/timeline-editor.html?video=...&cuts=...` after processing
- If processing fails, redirects to timeline editor without suggested cuts

**Error Handling:**
- Invalid file type: Shows error message and redirects to home page
- Processing error: Still saves video and redirects to editor (user can add cuts manually)
- All error messages in Hebrew with RTL support

#### POST `/process`
Processes uploaded video and detects scenes.

**Request:**
- Content-Type: multipart/form-data
- Fields:
  - `video`: Video file
  - `threshold`: Detection threshold (1-100, default: 27)
  - `min_scene_length`: Minimum scene length in seconds (default: 0.6)

**Response:**
```json
{
  "success": true,
  "scene_count": 3,
  "video_url": "/download/video_name_timestamp/video_name.mp4",
  "suggested_cuts": [15.5, 32.8, 48.2],
  "video_duration": 60.5,
  "redirect_url": "/timeline-editor.html?video=/download/video_name_timestamp/video_name.mp4&cuts=15.5,32.8,48.2"
}
```

#### GET `/get-tags`
Returns all unique muscle groups and equipment from database for autocomplete.

**Response:**
```json
{
  "muscle_groups": ["chest", "legs", "back", "triceps"],
  "equipment": ["dumbbells", "resistance band", "bodyweight"]
}
```

#### POST `/api/timeline/save`
Saves timeline with cut points and exercise segments to PostgreSQL database.

**Request:**
- Content-Type: application/json
- Body:
```json
{
  "videoUrl": "/download/video_name_timestamp/video_name.mp4",
  "cutPoints": [
    {"time": 15.5, "type": "auto", "id": "auto_0"},
    {"time": 32.8, "type": "manual", "id": "manual_1234567890"}
  ],
  "segments": [
    {
      "start": 0,
      "end": 15.5,
      "exercise": "Push-ups",
      "muscle": "chest, triceps",
      "equipment": "bodyweight"
    },
    {
      "start": 15.5,
      "end": 32.8,
      "exercise": "Squats",
      "muscle": "legs",
      "equipment": "bodyweight"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "saved_count": 2,
  "message": "Saved 2 exercises to database"
}
```

**Important Notes:**
- In Phase 3, the `video_file_path` stored in the database points to the original uploaded video (not individual segment files)
- The `removeAudio` flag is collected in the UI but not sent to the backend yet (will be used in Phase 4 for FFmpeg cutting)
- Cut points are not currently stored in the database (only segment start/end times are stored)
- In Phase 4, we'll implement FFmpeg video cutting to create separate video files for each segment

#### GET `/download/<folder>/<filename>`
Serves generated video files for streaming (not download).

### User Workflow

#### **Option 1: Share Video from Mobile Gallery (PWA Feature)** 📱
1. **Open Mobile Gallery**: On your phone, open a video in the gallery/photos app
2. **Tap Share**: Tap the share button
3. **Select Workout App**: Choose "Workout Video Editor" from the share menu (PWA must be installed)
4. **Automatic Processing**:
   - Video is received by the app via Web Share Target API
   - Automatically runs scene detection with default settings (threshold: 27, min scene: 0.6s)
   - Shows beautiful loading screen with spinner (Hebrew UI)
   - Automatically redirects to timeline editor with suggested cuts
5. **Continue to Timeline Editing**: Proceed with steps 5-9 below

#### **Option 2: Upload from App Interface** 💻
1. **Upload Video**: User uploads video via drag-and-drop or file selection on index.html
2. **Configure Parameters** (optional): Set detection threshold (1-100, default: 27) and minimum scene length (default: 0.6s)
3. **Process Video**: Click "Process Video" to run PySceneDetect analysis
4. **Automatic Redirect**: After processing, user is automatically redirected to timeline-editor.html with suggested cuts
5. **Interactive Timeline Editing**:
   - View video in main player with custom controls
   - Canvas timeline shows auto-detected cut points (blue circles)
   - Click and drag cut points to adjust timing (shows live time overlay)
   - Add manual cut points (green circles) at current playhead position
   - Click timeline segments to preview in main player
   - Zoom controls (0.5x - 3x) for detailed editing
6. **Segment Tagging**:
   - Click segment card to open bottom drawer
   - Video preview plays the selected segment automatically
   - Main player also plays the segment (stops at segment end)
   - Add exercise details:
     - Exercise name (required)
     - Muscle groups (multi-select chips with autocomplete, required)
     - Equipment (multi-select chips with autocomplete, required)
     - "Remove audio" checkbox for silent videos
   - Save details or delete segment
7. **Save Timeline**: Click "שמור" (Save) button when at least one segment has details
8. **Database Storage**: All segments with details are saved to PostgreSQL
9. **Redirect to Library**: After successful save, redirected to exercise-library.html

**Key Features:**
- **Non-destructive editing**: Cut points can be adjusted without affecting the original video
- **Autocomplete tags**: Muscle groups and equipment suggestions from existing database entries
- **Segment preview**: Both drawer preview and main player show selected segment
- **Mobile-first**: Touch-friendly interface with bottom drawer for mobile devices
- **Real-time validation**: Save button only enabled when at least one segment has details

## Known Limitations & Issues (Phase 3)

**Current Limitations:**
1. **No video cutting**: Segments are not cut into separate files yet (metadata only)
2. **No cloud storage**: Videos stored locally, not uploaded to Cloudflare R2
3. **removeAudio not implemented**: Checkbox exists but doesn't affect saved videos
4. **No exercise library**: Can't view/search saved exercises yet (page exists but not functional)
5. **No undo/redo**: Timeline edits can't be undone
6. **No segment merging**: Can't merge adjacent segments into one
7. **No bulk operations**: Can't delete multiple segments at once
8. **No video preview thumbnails**: Timeline shows colored segments, not actual video frames

**Known Bugs:**
- None reported yet

**Browser Compatibility:**
- Tested on: Chrome, Edge (Chromium-based browsers)
- PWA features may not work on all browsers
- Media Fragments URI (`#t=start,end`) requires browser support

**Performance Considerations:**
- Large videos (>500MB) may take time to upload and process
- Canvas rendering performance may vary on low-end devices
- Scene detection speed depends on video length and resolution
- Multiple concurrent uploads not supported (single-user app)
