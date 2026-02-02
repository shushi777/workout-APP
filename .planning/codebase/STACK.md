# Technology Stack

**Analysis Date:** 2026-02-02

## Languages

**Primary:**
- Python 3.13.3 - Backend server, video processing, scene detection
- JavaScript (ES6+) - Frontend timeline editor, exercise library, UI interactions
- HTML5 - Frontend markup with RTL support (Hebrew)
- CSS3 - Responsive mobile-first styling

**Secondary:**
- SQL - PostgreSQL database queries via psycopg2

## Runtime

**Environment:**
- Python 3.13.3 (specified in `runtime.txt`)
- Node.js - Not explicitly required (frontend is vanilla JavaScript)

**Package Manager:**
- pip for Python dependencies
- Lockfile: `requirements.txt` (present)

## Frameworks

**Core:**
- Flask 3.0.0 - Web framework for REST API and file serving
- Flask-CORS 4.0.0 - Cross-Origin Resource Sharing support

**Testing:**
- No testing framework detected in current stack

**Build/Dev:**
- Werkzeug 3.0.1 - WSGI utilities and secure filename handling
- Gunicorn 21.2.0 - Production WSGI server

## Key Dependencies

**Critical:**
- scenedetect 0.6.3 - AI-powered scene/cut detection using ContentDetector algorithm
- OpenCV (opencv-python-headless) 4.10.0.84 - Headless version for server (no GUI)
- PySceneDetect integration extracts scene boundaries for timeline editor
- boto3 1.34.0 - AWS SDK for S3 and Cloudflare R2 (S3-compatible) access
- psycopg2-binary 2.9.10 - PostgreSQL database adapter with RealDictCursor support
- python-dotenv 1.0.0 - Environment variable configuration management

**Infrastructure:**
- Pillow 10.0.0+ - Image processing for thumbnail generation (JPEG output)
- requests 2.31.0+ - HTTP library for potential API calls
- numpy 1.26.0-1.x - Numerical computing (required by OpenCV)

## Configuration

**Environment:**
- Configuration via `.env` file with fallback defaults
- Environment-specific configs: `development`, `production`, `test`
- Supports Railway's `DATABASE_PUBLIC_URL` and individual DB variables
- File: `config.py` implements Config, DevelopmentConfig, ProductionConfig, TestConfig classes
- Max upload: 500MB (configurable via `MAX_CONTENT_LENGTH`)

**Build:**
- `requirements.txt` - Python dependencies with pinned versions
- `runtime.txt` - Python version specification for deployment
- No build step required (pure Python Flask app)
- `Dockerfile` - Docker support for containerized deployment
- `railway.toml` - Railway.app deployment configuration

## Platform Requirements

**Development:**
- Python 3.13.3 with pip
- FFmpeg (required for video cutting, thumbnails)
- PostgreSQL 12+ (local or remote)
- Modern browser with HTML5 Canvas support

**Production:**
- Deployment target: Railway.app (configured via `railway.toml`)
- Optional: Cloudflare R2 for cloud storage (100% free tier with unlimited bandwidth)
- Optional: AWS S3 for cloud storage (has data transfer costs)
- Database: PostgreSQL (managed by Railway or external provider)
- Server: Gunicorn WSGI server behind HTTP proxy

## Video Processing Stack

**Scene Detection:**
- Library: PySceneDetect 0.6.3 with ContentDetector
- Detection parameters: threshold (1-100, default 27), min scene length (0.6s)
- Output: List of scene boundaries with timecode objects

**Video Editing:**
- FFmpeg (external binary) - video cutting, thumbnail generation, audio removal
- Execution: subprocess calls via `video_processing.py`
- Codec: H.264 (libx264) with configurable preset (ultrafast-veryslow) and CRF quality (0-51)
- Audio: AAC codec or removal with `-an` flag per segment

**Thumbnail Generation:**
- FFmpeg frame extraction at specified timestamps
- Output: JPEG format, 320x180px (configurable)
- Timing: First frame of each cut segment (timestamp 0.0)

## Storage Stack

**Supported Backends:**
1. **Local Storage** - `LocalStorage` class in `storage.py`
   - Path: `output/` folder (configurable)
   - Uses `Path` library for cross-platform operations
   - Fallback for development and testing

2. **AWS S3** - `S3Storage` class
   - Client: boto3 S3 client
   - Configuration: bucket name, region, access key, secret key
   - Public URLs: `https://{bucket}.s3.{region}.amazonaws.com/{path}`
   - Note: Has data transfer costs (~$4-8/month) - not recommended for free hosting

3. **Cloudflare R2** - `R2Storage` class (extends S3Storage)
   - Endpoint: `https://{account_id}.r2.cloudflarestorage.com`
   - S3-compatible API (same boto3 code)
   - Region: 'auto' (globally distributed)
   - Public URLs: `https://{bucket}.r2.dev/{path}` or custom domain
   - Free tier: 10GB storage + unlimited bandwidth (no egress charges)
   - Recommended for production (Phase 6)

**Storage Factory:**
- `create_storage()` function in `storage.py` instantiates appropriate backend
- Configured via `STORAGE_BACKEND` env var: 'local', 's3', or 'r2'
- All backends implement common `VideoStorage` interface

## Database

**Type:** PostgreSQL 12+

**Connection:**
- Local development: `host=localhost, port=5432, user=postgres, password={DB_PASSWORD}`
- Production (Railway): Parsed from `DATABASE_PUBLIC_URL` environment variable
- Format: `postgresql://user:password@host:port/database`
- Adapter: psycopg2-binary with RealDictCursor for dict-like access

**Tables Created Via:**
- Migration files in `migrations/` directory
- `run_migrations.py` or `run_migration.py` scripts
- See `DATABASE_SETUP.md` for full schema definition

## Deployment

**Production Server:**
- HTTP Server: Gunicorn 21.2.0
- Command: `gunicorn server:app` (standard Flask entry point)
- Port: 5000 (configurable via `PORT` env var)
- Host: 0.0.0.0 (listen on all interfaces)

**Hosting:**
- Primary target: Railway.app (serverless platform)
- Configuration file: `railway.toml`
- Docker support via `Dockerfile` and `entrypoint.sh`

**Environment Setup:**
- Production config disables debug mode
- Requires `SECRET_KEY` to be set (must differ from default)
- Database URL auto-provided by Railway or set manually
- Storage backend selection via `STORAGE_BACKEND` env var

---

*Stack analysis: 2026-02-02*
