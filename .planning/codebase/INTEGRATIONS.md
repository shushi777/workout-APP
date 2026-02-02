# External Integrations

**Analysis Date:** 2026-02-02

## APIs & External Services

**Video Scene Detection:**
- PySceneDetect (scenedetect 0.6.3) - Local library for scene boundary detection
  - Uses ContentDetector algorithm analyzing frame-to-frame changes
  - No external API calls required
  - Runs locally with threshold (1-100) and min_scene_length (0.6s) parameters

**Video Processing:**
- FFmpeg - External binary for video cutting, thumbnail generation, audio removal
  - SDK/Client: subprocess calls via Python's `subprocess` module
  - Commands: ffmpeg (main), ffprobe (metadata extraction)
  - Configuration: `FFMPEG_PATH` env var for custom locations

## Data Storage

**Databases:**
- PostgreSQL 12+
  - Connection: psycopg2-binary 2.9.10
  - Local development: `localhost:5432`
  - Production (Railway): `DATABASE_PUBLIC_URL` env var
  - ORM: None (direct SQL queries with parameterized statements)

**File Storage:**
- **Configurable Backend (via STORAGE_BACKEND env var):**

  1. **Local Filesystem** (Development)
     - Location: `output/` folder (configurable via `LOCAL_STORAGE_PATH`)
     - No external service required

  2. **Cloudflare R2** (Production - Recommended)
     - Service: Cloudflare R2 Object Storage
     - SDK/Client: boto3 (S3-compatible)
     - Auth: R2_ACCESS_KEY, R2_SECRET_KEY
     - Endpoint: `https://{account_id}.r2.cloudflarestorage.com`
     - Public URLs: `https://{bucket}.r2.dev/{path}`
     - Free tier: 10GB storage + unlimited bandwidth
     - No data transfer costs (major advantage over AWS S3)

  3. **AWS S3** (Alternative - Has Costs)
     - Service: Amazon S3
     - SDK/Client: boto3
     - Auth: S3_ACCESS_KEY, S3_SECRET_KEY
     - Endpoint: Standard AWS S3 or custom S3-compatible endpoint
     - Public URLs: `https://{bucket}.s3.{region}.amazonaws.com/{path}`
     - Cost concern: ~$4-8/month data transfer fees (not recommended for free tier)

**Caching:**
- None detected in current stack

## Authentication & Identity

**Auth Provider:**
- Custom implementation (no external service)
- No user authentication/login system in current Phase 6
- Currently single-user/public app
- PWA shares videos via Web Share Target API (no auth needed)

## Monitoring & Observability

**Error Tracking:**
- None (no external service integrated)
- Errors logged to stdout via Python `print()` statements
- Error format: `[Component] Error message` or `ERROR: Description`

**Logs:**
- Approach: Console/stdout logging only
  - Via `print()` statements in Python code
  - Prefixed with context: `[FFmpeg]`, `[Storage]`, `[Timeline Save]`, `[Cleanup]`, etc.
- Production: Captured by Railway.app logs or container stdout
- Debug logging format: `DEBUG: [details]`, `ERROR: [error]`, `WARNING: [message]`

## CI/CD & Deployment

**Hosting:**
- Primary: Railway.app (serverless platform)
- Alternative: Docker container deployment
- Configuration: `railway.toml` specifies build and start commands

**CI Pipeline:**
- None (no automated testing/deployment pipeline detected)
- Manual deployment via Railway.app git integration or Docker push
- No GitHub Actions or other CI service found

**Build Process:**
- Dockerfile support with entrypoint script (`entrypoint.sh`)
- Python requirements installed via `pip install -r requirements.txt`
- FFmpeg must be available in deployment environment

## Environment Configuration

**Required env vars:**
- `FLASK_ENV` - 'development', 'production', or 'test'
- `SECRET_KEY` - Must be set to secure random value in production (not default)
- `DB_PASSWORD` - PostgreSQL password
- Database (one of):
  - `DATABASE_PUBLIC_URL` (Railway format) - Takes precedence
  - Individual: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`
- `STORAGE_BACKEND` - 'local', 's3', or 'r2'

**For R2 Storage:**
- `R2_ACCOUNT_ID` - Cloudflare account ID
- `R2_BUCKET_NAME` - R2 bucket name
- `R2_ACCESS_KEY` - R2 API token access key
- `R2_SECRET_KEY` - R2 API token secret key
- `R2_PUBLIC_URL` - Public URL for served videos (e.g., `https://pub-xxxxx.r2.dev`)

**For S3 Storage:**
- `S3_BUCKET_NAME` - S3 bucket name
- `S3_REGION` - AWS region (default: 'us-east-1')
- `S3_ACCESS_KEY` - AWS access key
- `S3_SECRET_KEY` - AWS secret key
- `S3_ENDPOINT_URL` - Optional (for S3-compatible services)

**Optional/Advanced:**
- `HOST` - Server listen address (default: 0.0.0.0)
- `PORT` - Server port (default: 5000)
- `FLASK_DEBUG` - Debug mode (default: False)
- `UPLOAD_FOLDER` - Temp upload location (default: 'uploads')
- `OUTPUT_FOLDER` - Local video output folder (default: 'output')
- `FFMPEG_PATH` - Custom FFmpeg binary path (default: 'ffmpeg')
- `SCENE_DETECTION_THRESHOLD` - Default: 27.0
- `MIN_SCENE_LENGTH` - Default: 0.6 seconds
- `THUMBNAIL_WIDTH`, `THUMBNAIL_HEIGHT` - Default: 320x180
- `VIDEO_CODEC` - Default: 'libx264' (H.264)
- `VIDEO_PRESET` - Default: 'medium'
- `VIDEO_CRF` - Default: 23

**Secrets location:**
- `.env` file (local development - NOT committed to git)
- Railway.app environment variables (production)
- Template: `.env.example` shows all configuration options

## Webhooks & Callbacks

**Incoming:**
- `/share-receiver` (POST) - Web Share Target API callback
  - Triggered by mobile OS when user shares video from gallery
  - Handles multipart/form-data with 'video' field
  - No external webhook required

**Outgoing:**
- None detected
- No webhooks sent to external services

## Frontend APIs

**Browser APIs Used:**
- HTML5 Canvas - Timeline visualization and interaction
- Media Fragments URI - Native segment playback (`video#t=start,end`)
- Web Share Target API - PWA share receiver (manifest.json)
- Service Workers - Offline support and caching
- File API - Video upload and processing
- Fetch API - JSON requests to backend endpoints

**Backend REST Endpoints (Internal):**
- `POST /process` - Video upload and scene detection
- `POST /share-receiver` - Share Target API receiver
- `GET /download/<folder>/<filename>` - Video streaming
- `GET /get-tags` - Exercise tag autocomplete
- `POST /api/timeline/save` - Save timeline with cutting and storage
- `GET /api/exercises` - List exercises with pagination and filters
- `GET /api/exercises/<id>` - Get single exercise
- `PUT /api/exercises/<id>` - Update exercise metadata
- `DELETE /api/exercises/<id>` - Delete exercise and files
- `GET /reprocess` - Re-run scene detection with new parameters
- `GET /health` - Health check endpoint

## External Data Dependencies

**Video Formats Supported:**
- Input: MP4, AVI, MOV, MKV, FLV, WMV
- Processing: FFmpeg codec support required for each format
- Output: MP4 (H.264 video + AAC audio or silent)

**Exercise Metadata:**
- Stored in PostgreSQL (internal)
- Muscle groups and equipment stored in lookup tables
- No external exercise database integration

---

*Integration audit: 2026-02-02*
