# Coding Conventions

**Analysis Date:** 2026-02-02

## Naming Patterns

**Files:**
- Python modules: `snake_case.py` (e.g., `video_processing.py`, `server.py`, `storage.py`)
- HTML pages: `kebab-case.html` (e.g., `timeline-editor.html`, `exercise-library.html`)
- JavaScript files: `kebab-case.js` (e.g., `timeline-editor.js`, `exercise-library.js`)
- Configuration files: `config.py`, `.env.example`

**Functions and Methods:**
- Python: `snake_case` (e.g., `get_or_create_muscle_group()`, `split_video_by_timeline()`, `check_ffmpeg_installed()`)
- JavaScript: `camelCase` (e.g., `initializeDOMElements()`, `setupEventListeners()`, `onVideoTimeUpdate()`)

**Variables and Constants:**
- Python module-level constants: `UPPERCASE` (e.g., `ALLOWED_EXTENSIONS`, `DB_CONFIG`, `UPLOAD_FOLDER`)
- Python local variables: `snake_case` (e.g., `video_path`, `output_folder`, `scene_list`)
- JavaScript constants: `UPPERCASE` for immutable objects (e.g., state objects stored as `const state = {...}`)
- JavaScript variables: `camelCase` (e.g., `videoPlayer`, `timelineCanvas`, `selectedSegmentIndex`)
- JavaScript DOM element references: `camelCase` (e.g., `videoPlayer`, `seekBar`, `segmentsList`)

**Types and Classes:**
- Python classes: `PascalCase` (e.g., `VideoStorage`, `LocalStorage`, `S3Storage`, `R2Storage`, `Config`, `DevelopmentConfig`)
- JavaScript: No classes, uses objects and functions

## Code Style

**Formatting:**
- Python: PEP 8 style (4-space indentation)
- JavaScript: 2-space or 4-space indentation, no enforced linting tool
- No automated formatter detected (no prettier config, no eslint config)
- Inconsistent formatting exists between files

**Linting:**
- No linting tools configured (.eslintrc, .prettierrc not present)
- No pytest or unittest configuration
- Code relies on manual review

**Indentation:**
- Python: 4 spaces (PEP 8 standard)
- JavaScript: Mixed (appears to be 4 spaces in most files)

## Import Organization

**Python Order:**
1. Standard library imports (`os`, `json`, `subprocess`, `csv`, `datetime`, etc.)
2. Third-party library imports (`flask`, `psycopg2`, `boto3`, `scenedetect`, etc.)
3. Relative imports (local modules: `from config import Config`, `from storage import create_storage`)

**Pattern in server.py (lines 1-21):**
```python
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from scenedetect import open_video, SceneManager, split_video_ffmpeg
from scenedetect.detectors import ContentDetector
import os
import csv
import shutil
from datetime import datetime
from werkzeug.utils import secure_filename
import psycopg2
from psycopg2.extras import RealDictCursor

# Phase 4 imports
from config import Config, get_config
from storage import create_storage, VideoStorage
from video_processing import (
    split_video_by_timeline,
    get_video_info,
    check_ffmpeg_installed,
    VideoProcessingError
)
```

**JavaScript Order:**
1. Global state objects
2. DOM element references
3. Event listeners setup
4. Utility/helper functions

**Pattern in timeline-editor.js (lines 1-40):**
```javascript
// ===== Timeline Editor JavaScript =====

// Global State
const state = { ... };

// DOM Elements
let videoPlayer, videoSource, ...;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => { ... });

// Function definitions follow
```

**Path Aliases:**
- No path aliases configured
- Relative imports used throughout (no alias resolution)

## Error Handling

**Patterns:**
- Python: Try/except blocks wrap potentially failing operations
- All error handling returns JSON responses with `jsonify()` in Flask routes
- Errors printed to console with `print()` for debugging

**Python Pattern (server.py lines 592-618):**
```python
@app.route('/get-tags', methods=['GET'])
def get_tags():
    """Get all unique muscle groups and equipment for autocomplete"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor(cursor_factory=RealDictCursor)
        # ... operations ...
        cursor.close()
        conn.close()
        return jsonify({...})

    except Exception as e:
        return jsonify({'error': f'Failed to get tags: {str(e)}'}), 500
```

**Custom Exception:**
- `VideoProcessingError` class in `video_processing.py` (line 36-38) for specific video processing failures

**Error Response Format:**
- Always returns JSON: `{'success': bool, 'error': str}` or `{'success': bool, 'message': str}`
- HTTP status codes: 400 (bad request), 404 (not found), 500 (server error)

**JavaScript Pattern (timeline-editor.js lines 89-100):**
```javascript
async function loadExistingTags() {
    try {
        const response = await fetch('/get-tags');
        const data = await response.json();
        state.existingTags.muscleGroups = data.muscle_groups || [];
    } catch (error) {
        console.error('[Timeline Editor] Failed to load tags:', error);
    }
}
```

## Logging

**Framework:** `print()` statements (no logging library)

**Patterns:**
- Python uses `print()` with formatted strings and category prefixes
- Log format: `print(f"[Category] Message: {value}")` (e.g., `[Timeline Save]`, `[FFmpeg]`, `[Storage]`)
- JavaScript uses `console.log()`, `console.error()`, `console.warn()`
- JavaScript log format: `console.log('[Component] Message')`

**Common Categories:**
- `[Timeline Save]` - Timeline save operations
- `[FFmpeg]` - FFmpeg video processing
- `[Storage]` - Storage backend operations
- `[Exercise Update]` - Exercise CRUD operations
- `[Cleanup]` - File cleanup operations
- `[File Cleanup]` - File deletion operations
- `[Timeline Editor]` - Frontend timeline editor
- `[Exercise Library]` - Frontend exercise library
- `DEBUG:`, `ERROR:`, `WARNING:` - Operation status

**Debug Logging:**
- Significant operations logged with status: `print(f"DEBUG: ...")` for request details
- Scene detection: `print(f"DEBUG: Scene detection result - {len(scene_list)} scenes detected")`
- No request body logging in critical paths

## Comments

**When to Comment:**
- Function docstrings using triple quotes ("""...""") for all functions
- Inline comments explain non-obvious logic
- Category prefixes in logs explain operation context
- HTML comments used for section organization in backend

**Pattern (video_processing.py lines 41-62):**
```python
def check_ffmpeg_installed() -> bool:
    """
    Check if FFmpeg is installed and accessible
    Tries both the configured FFMPEG_PATH and default 'ffmpeg' command

    Returns:
        True if FFmpeg is available, False otherwise
    """
    # Try configured path first
    if FFMPEG_PATH and FFMPEG_PATH != 'ffmpeg':
        try:
            subprocess.run([FFMPEG_PATH, '-version'], capture_output=True, check=True, timeout=5)
            return True
        except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
            pass
```

**JSDoc/TSDoc:**
- Not used in JavaScript files
- No TypeScript present
- Documentation done via comments

## Function Design

**Size:**
- Functions range from 10-50 lines typically
- Some Flask route handlers are 100+ lines (acceptable for request handling)
- Video processing functions are longer (50-100 lines) due to multiple operations

**Parameters:**
- Python: Uses explicit parameters, defaults for optional values
- Type hints used in some functions (e.g., `def save(self, file_data: BinaryIO, filename: str, folder: str = "") -> str:`)
- JavaScript: No type hints, named parameters passed in objects

**Pattern (storage.py lines 20-31):**
```python
@abstractmethod
def save(self, file_data: BinaryIO, filename: str, folder: str = "") -> str:
    """
    Save a file to storage

    Args:
        file_data: File object or binary data
        filename: Name of the file
        folder: Optional folder/prefix for organization

    Returns:
        Storage path or URL
    """
    pass
```

**Return Values:**
- Python: Single return value (dict, string, bool, or tuple)
- JSON responses always wrapped in `jsonify()`
- Raise custom exceptions on errors
- JavaScript: Async functions return Promises, synchronous functions return values or undefined

## Module Design

**Exports:**
- Python modules export classes and functions directly
- No `__all__` declarations to restrict exports
- Factory functions like `create_storage(config)` for object creation

**Pattern (storage.py lines 282-322):**
```python
def create_storage(config: dict) -> VideoStorage:
    """
    Factory function to create storage instance based on configuration
    """
    storage_type = config.get('type', 'local')

    if storage_type == 'local':
        return LocalStorage(base_path=config.get('path', 'output'))
    elif storage_type == 's3':
        return S3Storage(...)
    elif storage_type == 'r2':
        return R2Storage(...)
    else:
        raise ValueError(f"Unsupported storage type: {storage_type}")
```

**Barrel Files:**
- Not used in this codebase
- Each module has specific purpose with clear imports

## Database Interactions

**Pattern:**
- Direct psycopg2 cursor usage
- Parameterized queries throughout to prevent SQL injection
- Connection pattern: `conn = get_db_connection()` → `cursor = conn.cursor()` → operations → `conn.commit()` → `conn.close()`
- Cursor factory `RealDictCursor` for dict-like row access

**Example (server.py lines 85-94):**
```python
def get_or_create_muscle_group(conn, name):
    """Get muscle group ID or create if doesn't exist"""
    cursor = conn.cursor()

    # Try to get existing
    cursor.execute("SELECT id FROM muscle_groups WHERE name = %s", (name.strip(),))
    result = cursor.fetchone()

    if result:
        return result[0]

    # Create new
    cursor.execute("INSERT INTO muscle_groups (name) VALUES (%s) RETURNING id", (name.strip(),))
    muscle_id = cursor.fetchone()[0]
    conn.commit()
    return muscle_id
```

## Configuration Management

**Pattern:**
- Configuration class-based system in `config.py`
- Environment variables loaded via `python-dotenv`
- Three configurations: `DevelopmentConfig`, `ProductionConfig`, `TestConfig`
- Configuration factory function: `get_config(env)`

**Feature Flags:**
- Backend selection via `STORAGE_BACKEND` environment variable ('local', 's3', 'r2')
- FFmpeg path configurable via `FFMPEG_PATH` env var
- Video codec and quality settings via env vars

## Security Patterns

**Input Validation:**
- File uploads validated with `allowed_file()` checking extensions
- Filenames secured with `secure_filename()` from werkzeug
- Path validation: `os.path.normpath()` and prefix checking for security

**Password Handling:**
- Passwords stored in environment variables only
- Default password '1990' used in development (not for production)
- Parameterized queries prevent SQL injection

**CORS:**
- CORS enabled with `CORS(app)` blanket approach (allows all origins)

---

*Convention analysis: 2026-02-02*
