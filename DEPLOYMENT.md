# Deployment Guide - Railway Deployment

This guide walks you through deploying the Workout Video Editor app to Railway with PostgreSQL and Cloudflare R2 storage.

## 🎯 Overview

**Deployment Stack:**
- **Hosting Platform**: Railway (free tier: $5/month credit)
- **Database**: Railway PostgreSQL addon (free with Railway)
- **Storage**: Cloudflare R2 (100% FREE - 10GB storage + unlimited bandwidth)
- **WSGI Server**: Gunicorn
- **Python Version**: 3.13.3

**Total Monthly Cost**: $0-5 (Railway free tier covers most small apps)

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- ✅ Cloudflare R2 bucket created and configured (see `CLOUDFLARE_R2_SETUP.md`)
- ✅ R2 credentials ready (Account ID, Access Key, Secret Key, Public URL)
- ✅ GitHub account for repository connection
- ✅ Git repository initialized in your project
- ✅ All code committed and pushed to GitHub

---

## 🚀 Step 1: Prepare Your Code

### 1.1 Initialize Git Repository (if not already done)

```bash
# Navigate to project directory
cd workout_APP

# Initialize git
git init

# Create .gitignore file
echo "*.pyc
__pycache__/
.env
uploads/
output/
*.mp4
*.avi
*.mov
*.mkv
.DS_Store
Thumbs.db" > .gitignore

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - Workout Video Editor"
```

### 1.2 Push to GitHub

```bash
# Create a new repository on GitHub (via github.com)
# Then connect your local repo:

git remote add origin https://github.com/YOUR_USERNAME/workout-video-editor.git
git branch -M main
git push -u origin main
```

### 1.3 Verify Critical Files

Make sure these files exist in your repository:
- ✅ `Procfile` - Tells Railway how to run your app
- ✅ `runtime.txt` - Specifies Python version (3.13.3)
- ✅ `requirements.txt` - Lists all Python dependencies
- ✅ `server.py` - Main Flask application
- ✅ `.env.example` - Template for environment variables

---

## 🚂 Step 2: Deploy to Railway

### 2.1 Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click "Login" → "Login with GitHub"
3. Authorize Railway to access your GitHub account
4. You'll get **$5 free credit per month** (no credit card required initially)

### 2.2 Create New Project

1. Click "New Project" on Railway dashboard
2. Select "Deploy from GitHub repo"
3. Choose your `workout-video-editor` repository
4. Railway will automatically detect your app and start deploying

### 2.3 Add PostgreSQL Database

1. In your Railway project, click "New" → "Database" → "Add PostgreSQL"
2. Railway will automatically create a PostgreSQL instance
3. **IMPORTANT**: Railway automatically sets the `DATABASE_URL` environment variable
4. Your app will connect to the database automatically (no manual config needed)

### 2.4 Configure Environment Variables

Click on your app service → "Variables" tab → Add the following:

#### Required Variables:

```bash
# Flask Configuration
SECRET_KEY=<generate-secure-random-key>
FLASK_ENV=production
FLASK_DEBUG=False

# Storage Backend (use R2 for production)
STORAGE_BACKEND=r2

# Cloudflare R2 Configuration
R2_ACCOUNT_ID=<your-cloudflare-account-id>
R2_BUCKET_NAME=<your-r2-bucket-name>
R2_ACCESS_KEY=<your-r2-access-key-id>
R2_SECRET_KEY=<your-r2-secret-access-key>
R2_PUBLIC_URL=<your-r2-public-url>

# Video Processing (optional - these have defaults)
SCENE_DETECTION_THRESHOLD=27.0
MIN_SCENE_LENGTH=0.6
FFMPEG_PATH=ffmpeg
```

#### Generate Secure SECRET_KEY:

Run this in your local terminal to generate a secure key:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Copy the output and paste it as `SECRET_KEY` in Railway.

#### Database Variables (Auto-Configured):

Railway automatically provides:
- `DATABASE_URL` - Full PostgreSQL connection string
- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` - Individual components

You **DON'T** need to set these manually. However, you need to update `config.py` to support `DATABASE_URL`.

---

## 🔧 Step 3: Update Code for Railway

### 3.1 Update `config.py` to Support DATABASE_URL

Railway provides a single `DATABASE_URL` environment variable instead of individual DB variables. Update your `config.py`:

```python
import os
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv()

class Config:
    # ... existing config ...

    # Database Configuration
    # Support Railway's DATABASE_URL or individual variables
    DATABASE_URL = os.getenv('DATABASE_URL')

    if DATABASE_URL:
        # Parse Railway's DATABASE_URL
        parsed = urlparse(DATABASE_URL)
        DB_CONFIG = {
            'host': parsed.hostname,
            'port': parsed.port,
            'database': parsed.path[1:],  # Remove leading '/'
            'user': parsed.username,
            'password': parsed.password
        }
    else:
        # Use individual variables (local development)
        DB_CONFIG = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': int(os.getenv('DB_PORT', 5432)),
            'database': os.getenv('DB_NAME', 'workout_db'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', '1990')
        }
```

### 3.2 Commit and Push Changes

```bash
git add config.py
git commit -m "Support Railway DATABASE_URL environment variable"
git push origin main
```

Railway will automatically redeploy your app with the changes.

---

## 🗄️ Step 4: Initialize Database Schema

After deployment, you need to create the database tables.

### 4.1 Connect to Railway PostgreSQL

Railway provides a temporary connection via the CLI:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Connect to PostgreSQL
railway run psql $DATABASE_URL
```

### 4.2 Run Migration Script

From your local machine, run:

```bash
# Set Railway environment variables locally
railway run python run_migration.py
```

Or manually copy the SQL from `migrations/001_initial_schema.sql` and execute it in the Railway PostgreSQL console.

### 4.3 Verify Tables

```sql
-- In Railway psql console
\dt  -- List all tables
-- Should show: exercises, muscle_groups, equipment, exercise_muscle_groups, exercise_equipment
```

---

## 🌐 Step 5: Configure Domain & HTTPS

### 5.1 Get Railway Domain

1. In Railway project → Your app service → "Settings" tab
2. Scroll to "Domains" section
3. Click "Generate Domain"
4. Railway will give you a free domain like: `workout-app-production.up.railway.app`
5. **HTTPS is automatic** - Railway provides free SSL certificates

### 5.2 (Optional) Add Custom Domain

If you have your own domain:

1. Click "Custom Domain" in Railway
2. Enter your domain (e.g., `workout.yourdomain.com`)
3. Add the CNAME record to your DNS provider:
   - Type: `CNAME`
   - Name: `workout` (or your subdomain)
   - Value: `<your-app>.up.railway.app`
4. Wait for DNS propagation (5-30 minutes)

---

## 📱 Step 6: Configure PWA for Production

### 6.1 Update `manifest.json`

Update the `start_url` and `scope` to use your Railway domain:

```json
{
  "name": "Workout Video Editor",
  "short_name": "Workout App",
  "start_url": "workoutapp.up.railway.app/",
  "scope": "workoutapp.up.railway.app/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#007bff",
  "icons": [
    {
      "src": "/static/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/static/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "share_target": {
    "action": "/share-receiver",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "files": [
        {
          "name": "video",
          "accept": ["video/*"]
        }
      ]
    }
  }
}
```

### 6.2 Commit and Push

```bash
git add manifest.json
git commit -m "Update PWA manifest for production domain"
git push origin main
```

---

## ✅ Step 7: Test Your Deployment

### 7.1 Basic Functionality Tests

1. **Upload Page**: Visit `workoutapp.up.railway.app`
   - Upload a video
   - Verify scene detection works
   - Check redirect to timeline editor

2. **Timeline Editor**:
   - Verify video playback
   - Test cut point dragging
   - Add manual cut points
   - Tag segments with exercise details

3. **Save & Process**:
   - Save timeline
   - Verify videos are uploaded to Cloudflare R2
   - Check database entries (via Railway psql)

4. **Exercise Library**:
   - Visit `/exercise-library.html`
   - Verify exercises appear
   - Test search and filters
   - Play videos (should load from R2 public URLs)

### 7.2 Mobile PWA Tests

1. **Install PWA on Mobile**:
   - Open `https://your-railway-domain.up.railway.app` on your phone
   - Chrome/Edge: Tap browser menu → "Install app" or "Add to Home Screen"
   - iOS Safari: Tap share → "Add to Home Screen"

2. **Test Web Share Target**:
   - Open a video file on your phone
   - Tap "Share"
   - Select "Workout App" from share sheet
   - App should open with video pre-loaded

### 7.3 Check Logs

Monitor Railway logs for errors:

```bash
# Via Railway dashboard
# Your app service → "Deployments" tab → Click latest deployment → "View Logs"

# Or via CLI
railway logs
```

---

## 🐛 Troubleshooting

### Issue: App won't start

**Error**: `ModuleNotFoundError` or `ImportError`

**Solution**:
- Check `requirements.txt` includes all dependencies
- Verify `runtime.txt` has correct Python version
- Check Railway build logs for errors

### Issue: Database connection failed

**Error**: `psycopg2.OperationalError: could not connect to server`

**Solution**:
- Verify PostgreSQL addon is added to your project
- Check `DATABASE_URL` environment variable is set
- Ensure `config.py` parses `DATABASE_URL` correctly

### Issue: Videos not uploading to R2

**Error**: `botocore.exceptions.NoCredentialsError`

**Solution**:
- Verify all R2 environment variables are set in Railway:
  - `R2_ACCOUNT_ID`
  - `R2_BUCKET_NAME`
  - `R2_ACCESS_KEY`
  - `R2_SECRET_KEY`
  - `R2_PUBLIC_URL`
- Check R2 bucket has public access enabled
- Test R2 credentials locally first

### Issue: OpenCV/libGL error

**Error**: `ImportError: libGL.so.1: cannot open shared object file: No such file or directory`

**Solution**:
This error occurs when OpenCV can't find required system libraries. The project already includes a `nixpacks.toml` file that installs these dependencies:

```toml
[phases.setup]
aptPkgs = [
    "ffmpeg",
    "libgl1-mesa-glx",
    "libglib2.0-0",
    "libsm6",
    "libxext6",
    "libxrender-dev",
    "libgomp1"
]
```

**If the error persists**:
1. Verify `nixpacks.toml` is committed to your Git repository
2. Redeploy from Railway dashboard (Settings → Redeploy)
3. Check that `requirements.txt` uses `opencv-python-headless` instead of `opencv-python`

### Issue: FFmpeg not found

**Error**: `FileNotFoundError: [Errno 2] No such file or directory: 'ffmpeg'`

**Solution**:
The `nixpacks.toml` file already includes FFmpeg. If this error occurs:
1. Verify `nixpacks.toml` exists in your repository
2. Check Railway build logs to confirm packages were installed
3. Redeploy the application

### Issue: CORS errors

**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**:
- Verify `flask-cors` is in `requirements.txt`
- Check `CORS(app)` is called in `server.py`
- For custom domains, update CORS settings if needed

---

## 📊 Monitoring & Maintenance

### View Logs

```bash
# Real-time logs
railway logs --follow

# Last 100 lines
railway logs --tail 100
```

### Database Backups

Railway provides automatic backups for PostgreSQL. To create manual backup:

```bash
# Connect to database
railway run psql $DATABASE_URL

# Export to file
railway run pg_dump $DATABASE_URL > backup.sql
```

### Check Resource Usage

- Railway Dashboard → Your project → "Metrics" tab
- Monitor CPU, memory, and bandwidth usage
- Free tier includes $5/month credit (~500 hours of runtime)

### Update Environment Variables

```bash
# Via CLI
railway variables set SECRET_KEY=new-secret-key

# Or via dashboard
# Your app service → "Variables" tab → Edit
```

---

## 🎉 Next Steps

After successful deployment:

1. **Share your app**: Send the Railway URL to users
2. **Install PWA on mobile**: Add to home screen for app-like experience
3. **Monitor usage**: Check Railway metrics and R2 storage usage
4. **Iterate**: Make improvements based on user feedback
5. **Scale if needed**: Upgrade Railway plan if you exceed free tier

---

## 📝 Environment Variables Summary

### Required for Production:

| Variable | Example | Description |
|----------|---------|-------------|
| `SECRET_KEY` | `a1b2c3d4e5f6...` | Flask secret key (generate with `secrets.token_hex(32)`) |
| `FLASK_ENV` | `production` | Environment mode |
| `FLASK_DEBUG` | `False` | Debug mode (must be False in production) |
| `STORAGE_BACKEND` | `r2` | Storage type (use 'r2' for production) |
| `R2_ACCOUNT_ID` | `abc123...` | Cloudflare account ID |
| `R2_BUCKET_NAME` | `workout-app-videos` | R2 bucket name |
| `R2_ACCESS_KEY` | `xyz789...` | R2 access key ID |
| `R2_SECRET_KEY` | `secret123...` | R2 secret access key |
| `R2_PUBLIC_URL` | `https://pub-xxx.r2.dev` | R2 public URL for serving videos |

### Auto-Configured by Railway:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Full PostgreSQL connection string |
| `PORT` | Port number for web server (Railway assigns dynamically) |

---

## 🔗 Useful Links

- **Railway Dashboard**: https://railway.app/dashboard
- **Railway Docs**: https://docs.railway.app
- **Cloudflare R2 Docs**: https://developers.cloudflare.com/r2/
- **Flask Deployment Guide**: https://flask.palletsprojects.com/en/2.3.x/deploying/
- **Gunicorn Configuration**: https://docs.gunicorn.org/en/stable/configure.html

---

## 💡 Cost Breakdown

### Free Tier Limits:

**Railway:**
- $5 credit per month (no credit card required)
- ~500 hours of runtime (24/7 uptime for hobby projects)
- After free credit: $0.000463/GB-hour for resources

**Cloudflare R2:**
- 10 GB storage (FREE forever)
- Unlimited bandwidth (FREE - no data transfer costs!)
- ~1,000-1,250 exercise videos before needing to upgrade

**Total Monthly Cost**: **$0-5** for most small to medium apps

---

## 🎓 Support

If you encounter issues:

1. Check Railway logs: `railway logs`
2. Review this deployment guide
3. Check Railway status: https://railway.statuspage.io
4. Railway Discord: https://discord.gg/railway
5. GitHub Issues: Create an issue in your repository

---

**Happy Deploying! 🚀**
