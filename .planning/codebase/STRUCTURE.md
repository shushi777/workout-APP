# Codebase Structure

**Analysis Date:** 2026-02-02

## Directory Layout

```
workout_APP/
├── static/                    # Frontend static assets (CSS, JS, icons)
│   ├── css/
│   │   ├── styles.css        # Upload page and global styles
│   │   ├── timeline-editor.css # Timeline editor page styles
│   │   └── exercise-library.css # Exercise library page styles
│   ├── js/
│   │   ├── timeline-editor.js # Timeline Canvas rendering and interaction logic
│   │   └── exercise-library.js # Exercise library filtering and display logic
│   └── icons/                # PWA icons (192px, 512px, favicon)
├── migrations/               # Database migration SQL files
│   ├── 000_initial_schema.sql
│   └── 001_add_timeline_tables.sql
├── uploads/                  # Temporary storage for uploaded videos (auto-created)
├── output/                   # Local storage for videos and segments (auto-created)
│   └── {video_name}_{timestamp}/ # One folder per uploaded video
│       ├── {original_video.mp4}
│       └── segments/
│           └── {segment_001.mp4}
├── .planning/                # GSD planning documents
│   └── codebase/             # Architecture and structure docs
├── index.html                # Upload page - drag-and-drop video upload UI
├── timeline-editor.html      # Timeline editor - Canvas timeline + segment tagging
├── exercise-library.html     # Exercise library - View, filter, edit saved exercises
├── manifest.json             # PWA manifest for installability and share target
├── service-worker.js         # PWA service worker for offline support
├── server.py                 # Flask backend - API endpoints and scene detection
├── config.py                 # Configuration management - storage, database, FFmpeg
├── storage.py                # Storage abstraction layer - Local/S3/R2 backends
├── video_processing.py       # Video cutting, thumbnail generation, metadata extraction
├── requirements.txt          # Python dependencies
├── .env                      # Environment variables (local development)
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── CLAUDE.md                 # Project overview and development guide
├── DATABASE_SETUP.md         # PostgreSQL setup instructions
├── CLOUDFLARE_R2_SETUP.md    # Cloudflare R2 configuration guide
└── README.md                 # User-facing project README
```

## Directory Purposes

**`static/`:**
- Purpose: Frontend assets served directly by Flask static file routes
- Contains: CSS stylesheets, JavaScript application logic, PWA icons
- Key files:
  - `static/js/timeline-editor.js` (700+ lines): Core timeline UI logic
  - `static/js/exercise-library.js` (400+ lines): Exercise grid and filtering
  - `static/css/timeline-editor.css`: Mobile-first timeline styles
  - `static/css/exercise-library.css`: Responsive grid layout for exercises

**`migrations/`:**
- Purpose: Version-controlled database schema migrations
- Contains: SQL files that create tables, add columns, create views
- Key files:
  - `000_initial_schema.sql`: Base schema (exercises, muscle_groups, equipment, junction tables)
  - `001_add_timeline_tables.sql`: Phase 4 additions (start_time, end_time, remove_audio, thumbnail_url, videos table, timelines table)
- Run by: `run_migrations.py` at application startup

**`uploads/`:**
- Purpose: Temporary storage for incoming video uploads
- Auto-created: Yes (by Flask file upload handler)
- Committed: No (.gitignore)
- Lifecycle: Videos deleted after moved to `output/` folder

**`output/`:**
- Purpose: Local storage for processed videos and segments
- Auto-created: Yes (by Flask app initialization)
- Committed: No (.gitignore)
- Structure: One folder per video (`{name}_{timestamp}/`) containing original + segments
- Used by: Local development, or as staging for cloud storage before upload
- Cleanup: Full original video deleted after cloud upload, local segments deleted if using R2/S3

## Key File Locations

**Entry Points:**
- `index.html`: Upload interface - serves at `/` route
- `timeline-editor.html`: Timeline editor - serves at `/timeline-editor.html` route with query params
- `exercise-library.html`: Exercise library - serves at `/exercise-library.html` route

**Configuration:**
- `config.py`: All environment-based configuration (storage backend, database, FFmpeg, video params)
- `.env.example`: Template for required environment variables
- `manifest.json`: PWA configuration (app name, icons, share target)

**Core Logic:**
- `server.py`: Flask app, all API endpoints, scene detection coordination
- `storage.py`: Storage abstraction (LocalStorage, S3Storage, R2Storage factory)
- `video_processing.py`: FFmpeg wrapper (video cutting, thumbnail generation, metadata)

**Frontend Logic:**
- `static/js/timeline-editor.js`: Canvas rendering, cut point dragging, segment management, state management
- `static/js/exercise-library.js`: Exercise grid, filtering, search, edit/delete operations

**Styling:**
- `static/css/styles.css`: Upload page, global styles, bottom navigation (mobile)
- `static/css/timeline-editor.css`: Timeline Canvas, video player, drawer, segment list
- `static/css/exercise-library.css`: Exercise grid, filter sections, modals

**Testing:**
- No dedicated test directory - manually tested

## Naming Conventions

**Files:**
- HTML pages: kebab-case with `.html` extension (index.html, timeline-editor.html)
- JavaScript: camelCase without spaces (timelineEditor.js, exerciseLibrary.js)
- CSS: kebab-case (timeline-editor.css, exercise-library.css)
- Python: snake_case (config.py, video_processing.py, storage.py)
- SQL migrations: Number_description format (000_initial_schema.sql, 001_add_timeline_tables.sql)

**Directories:**
- Static assets: Plural (static, migrations, uploads, output)
- Feature-specific: descriptive (css, js, icons)

**Functions:**
- JavaScript: camelCase (loadVideo, saveTimeline, renderSegments, handleSegmentClick)
- Python: snake_case (get_db_connection, detect_scenes, split_video_by_timeline)
- Python classes: PascalCase (Config, LocalStorage, S3Storage, R2Storage)

**Variables:**
- JavaScript: camelCase for variables, UPPERCASE for constants (const MAX_ZOOM = 3.0)
- JavaScript DOM elements: camelCase (videoPlayer, timelineCanvas, saveTimelineBtn)
- Python: snake_case (video_path, output_folder, segment_details)

**Types:**
- JavaScript: Implicit (no TypeScript)
- Python: Type hints in docstrings (file_data: BinaryIO, returns: str)

## Where to Add New Code

**New Feature:**
- Primary code: Place business logic in `server.py` endpoints or new module in root
- Frontend: Add event handlers in existing `static/js/` file or create new one
- Styles: Add CSS rules to relevant file in `static/css/` directory
- Tests: Add test file to project root or new `tests/` directory (doesn't exist yet)

**New API Endpoint:**
- Location: `server.py` as new `@app.route()` function
- Pattern: Follow existing endpoint style (route decorator, validation, try/except, JSON response)
- Database: Use `get_db_connection()` helper, parameterized queries for safety
- Storage: Use global `storage` instance created at startup

**New Component/Module:**
- Implementation: Root directory (where config.py, storage.py live)
- Import: From `server.py` at top level
- Example: `from new_module import function_name`

**Utilities:**
- Shared helpers: Add to existing module (config.py, video_processing.py) or create new module
- Frontend utilities: Add to relevant `static/js/` file as function

**Database Changes:**
- Schema changes: Create new migration file in `migrations/` directory
- Naming: Use pattern `{number}_{description}.sql` (e.g., `002_add_user_table.sql`)
- Execution: Automatically run by `run_migrations.py` at startup

## Special Directories

**`.planning/codebase/`:**
- Purpose: GSD codebase analysis documents
- Generated: No (manually written by analysis agent)
- Committed: Yes (.git tracked)
- Contains: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md, INTEGRATIONS.md, STACK.md

**`.claude/`:**
- Purpose: Claude Code IDE settings
- Generated: Yes (by Claude IDE)
- Committed: Yes
- Contains: IDE state, local settings

**`migrations/`:**
- Purpose: Version-controlled database migrations
- Generated: No (manually written)
- Committed: Yes
- Contains: SQL schema files in order of execution

**`output/`:**
- Purpose: Local video storage during processing
- Generated: Yes (auto-created by Flask)
- Committed: No (.gitignore)
- Cleanup: Only full videos, not individual segments when using cloud storage

**`uploads/`:**
- Purpose: Temporary staging for uploaded videos
- Generated: Yes (auto-created by Flask)
- Committed: No (.gitignore)
- Cleanup: Files moved to output/ folder after processing

**`static/icons/`:**
- Purpose: PWA icons for installability
- Generated: No (manually added)
- Committed: Yes
- Contains: 192x192, 512x512 PNG icons + favicon

## Database Schema Locations

**Tables created by migrations:**
- `exercises`: Main table storing exercise metadata
  - Columns: id, video_file_path, exercise_name, duration, start_time, end_time, remove_audio, thumbnail_url, created_at
  - Indexes: created_at DESC, exercise_name
  - Relationships: Has many muscle_groups (via exercise_muscle_groups), has many equipment (via exercise_equipment)

- `muscle_groups`: Lookup table for muscle group tags
  - Columns: id, name (UNIQUE)
  - Relationships: Many exercises (via exercise_muscle_groups)

- `equipment`: Lookup table for equipment tags
  - Columns: id, name (UNIQUE)
  - Relationships: Many exercises (via exercise_equipment)

- `exercise_muscle_groups`: Junction table (many-to-many)
  - Columns: exercise_id, muscle_group_id
  - Primary key: (exercise_id, muscle_group_id)
  - Foreign keys: exercises.id, muscle_groups.id

- `exercise_equipment`: Junction table (many-to-many)
  - Columns: exercise_id, equipment_id
  - Primary key: (exercise_id, equipment_id)
  - Foreign keys: exercises.id, equipment.id

- `videos` (Phase 4): Stores original uploaded videos
  - Columns: id, original_filename, storage_path, duration, file_size, mime_type, fps, resolution, storage_type, created_at, processed_at, status
  - Indexes: created_at DESC, status
  - Status values: 'uploaded', 'processing', 'completed', 'failed'

- `timelines` (Phase 4): Stores timeline editing sessions
  - Columns: id, video_id, cut_points (JSONB), segments_count, created_at, updated_at, saved_at
  - Indexes: video_id, created_at DESC
  - Foreign key: videos.id

**Views:**
- `exercise_details`: Denormalized view of exercises with all muscle groups and equipment aggregated as arrays

**Migration files:**
- `migrations/000_initial_schema.sql`: Creates tables exercises, muscle_groups, equipment, junction tables, indexes
- `migrations/001_add_timeline_tables.sql`: Adds columns to exercises, creates videos and timelines tables, creates exercise_details view

## Adding New Migrations

**Process:**
1. Create new SQL file: `migrations/{next_number}_{description}.sql`
2. Write idempotent SQL (use `IF NOT EXISTS`, `IF` statements)
3. Include comments explaining changes
4. File will be auto-run by `run_migrations.py` at startup (sorted by filename)
5. Test locally against PostgreSQL

**Pattern from existing migrations:**
```sql
-- Migration: {Title}
-- Description of changes
-- Date: YYYY-MM-DD

-- ============================================
-- Section 1: Create/Alter tables
-- ============================================

CREATE TABLE IF NOT EXISTS {table_name} (
    -- columns
);

ALTER TABLE {existing_table}
ADD COLUMN IF NOT EXISTS {new_column} {type};

-- ============================================
-- Verification
-- ============================================

SELECT 'Migration completed successfully!' as status;
```

---

*Structure analysis: 2026-02-02*
