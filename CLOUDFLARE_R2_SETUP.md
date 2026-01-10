# Cloudflare R2 Setup Guide

Complete guide to setting up Cloudflare R2 for FREE cloud storage in the Workout Video Editor app.

## Why Cloudflare R2?

**100% FREE Solution** (up to 10GB storage):
- ✅ **10GB storage** (~1,000-1,250 exercise videos)
- ✅ **Unlimited bandwidth** (no data transfer costs!)
- ✅ **Built-in CDN** (fast global delivery)
- ✅ **No credit card required** for free tier
- ✅ **Internet accessible** with HTTPS URLs
- ✅ **S3-compatible API** (works with boto3)

**Cost Comparison:**
- **Cloudflare R2**: $0/month (under 10GB)
- **AWS S3**: $4-8/month (data transfer costs)
- **Local storage**: Not accessible from internet

## Setup Instructions

### Step 1: Create Cloudflare Account

1. Go to [https://cloudflare.com](https://cloudflare.com)
2. Click **Sign Up** (no credit card required)
3. Verify your email address
4. Log in to your Cloudflare dashboard

### Step 2: Create R2 Bucket

1. In the Cloudflare dashboard, navigate to:
   ```
   Dashboard → R2 Object Storage
   ```

2. Click **Create bucket**

3. Configure bucket settings:
   - **Bucket name**: `workout-app-videos` (or your choice)
   - **Location**: Automatic (Cloudflare chooses closest region)
   - Click **Create bucket**

### Step 3: Enable Public Access

1. Go to your bucket → **Settings** → **Public Access**

2. Click **Allow Access**

3. Choose one of two options:

   **Option A: R2.dev Subdomain (Easiest - FREE)**
   - Click **Connect a public bucket to a r2.dev subdomain**
   - Cloudflare generates a public URL like: `https://pub-xxxxx.r2.dev`
   - Copy this URL (you'll need it for `.env` file)

   **Option B: Custom Domain (Advanced)**
   - If you own a domain, you can connect it
   - Example: `https://videos.yourdomain.com`
   - Requires DNS configuration

### Step 4: Create API Token

1. In R2 dashboard, click **Manage R2 API Tokens**

2. Click **Create API Token**

3. Configure token settings:
   - **Token name**: `workout-app-token`
   - **Permissions**: **Object Read & Write**
   - **Bucket scope**: **Apply to specific buckets**
   - Select your bucket: `workout-app-videos`
   - Click **Create API Token**

4. **IMPORTANT**: Copy these credentials (you can only see them once!):
   ```
   Account ID: abc123def456...
   Access Key ID: 1a2b3c4d5e6f7g8h9i0j...
   Secret Access Key: k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6...
   ```

### Step 5: Configure Your Application

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` file and add R2 credentials:
   ```env
   # Storage Configuration
   STORAGE_BACKEND=r2

   # Cloudflare R2 Configuration
   R2_ACCOUNT_ID=abc123def456
   R2_BUCKET_NAME=workout-app-videos
   R2_ACCESS_KEY=1a2b3c4d5e6f7g8h9i0j
   R2_SECRET_KEY=k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
   R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
   ```

3. Save the file

### Step 6: Test the Connection

1. Start your Flask server:
   ```bash
   python server.py
   ```

2. Check the startup logs:
   ```
   [Storage] Using r2 storage backend
   [FFmpeg] FFmpeg is available and ready
   ```

3. Upload a test video and process it:
   - Open `http://localhost:5000`
   - Upload a video
   - Edit timeline and save exercises
   - Check if videos are uploaded to R2

4. Verify in Cloudflare dashboard:
   - Go to R2 bucket → **Objects**
   - You should see uploaded video files and thumbnails

## Folder Structure in R2

When you save exercises, files are organized in R2 as:

```
workout-app-videos/
├── video_name_timestamp/
│   ├── segments/
│   │   ├── video_name_segment_1.mp4
│   │   ├── video_name_segment_2.mp4
│   │   └── ...
│   └── thumbnails/
│       ├── video_name_segment_1.jpg
│       ├── video_name_segment_2.jpg
│       └── ...
```

## Public URLs

Exercise videos are accessible via public URLs:
```
https://pub-xxxxx.r2.dev/video_name_timestamp/segments/video_name_segment_1.mp4
https://pub-xxxxx.r2.dev/video_name_timestamp/thumbnails/video_name_segment_1.jpg
```

These URLs are:
- ✅ Publicly accessible (anyone with URL can view)
- ✅ Served via Cloudflare CDN (fast global delivery)
- ✅ HTTPS enabled by default (secure)
- ✅ Compatible with HTML5 video players

## Free Tier Limits

**Storage:**
- 10GB free storage
- Approximately 1,000-1,250 exercise videos (assuming 8-10MB per video)

**Operations:**
- 1 million Class A operations/month (PUT, LIST)
- 10 million Class B operations/month (GET, HEAD)
- Unlimited data transfer OUT (this is the key advantage!)

**What happens if you exceed limits?**
- You'll need to upgrade to a paid plan
- OR delete old exercises to stay under 10GB

## Troubleshooting

### Error: "Bucket not found" or "Access Denied"

**Check:**
1. R2_ACCOUNT_ID is correct (from API token page)
2. R2_BUCKET_NAME matches your bucket name exactly
3. R2_ACCESS_KEY and R2_SECRET_KEY are correct
4. API token has "Object Read & Write" permissions
5. API token is scoped to your specific bucket

**Fix:**
```bash
# Verify credentials in .env file
cat .env | grep R2_

# Restart server to reload .env
python server.py
```

### Error: "Public access is not enabled"

**Check:**
1. Bucket settings → Public Access is enabled
2. R2.dev subdomain is connected
3. R2_PUBLIC_URL in .env matches the public URL exactly

**Fix:**
```bash
# Go to Cloudflare dashboard
# Bucket → Settings → Public Access → Connect r2.dev subdomain
# Copy the public URL and update .env
```

### Videos not playing in Exercise Library

**Check:**
1. Browser console for CORS errors
2. Public URL is accessible (open in browser)
3. Video file exists in R2 bucket

**Fix:**
```bash
# Test public URL directly in browser
# Should download/play the video
https://pub-xxxxx.r2.dev/path/to/video.mp4

# If 403 Forbidden, check public access settings in R2 dashboard
```

### "ModuleNotFoundError: No module named 'boto3'"

**Fix:**
```bash
# Install boto3 (should already be in requirements.txt)
pip install boto3
```

## Switching Between Storage Backends

You can switch between storage backends without losing data:

**Development (Local Storage):**
```env
STORAGE_BACKEND=local
LOCAL_STORAGE_PATH=output
```

**Production (Cloudflare R2):**
```env
STORAGE_BACKEND=r2
R2_ACCOUNT_ID=...
R2_BUCKET_NAME=...
```

**Alternative (AWS S3):**
```env
STORAGE_BACKEND=s3
S3_BUCKET_NAME=...
S3_REGION=...
```

## Security Best Practices

1. **Never commit `.env` file to git**
   - `.env` is already in `.gitignore`
   - Only commit `.env.example` with placeholder values

2. **Rotate API tokens periodically**
   - Create new token in Cloudflare dashboard
   - Update `.env` with new credentials
   - Delete old token

3. **Use environment variables in production**
   - Don't hardcode credentials in code
   - Use hosting platform's environment variables (e.g., Heroku Config Vars)

4. **Limit token permissions**
   - Only grant "Object Read & Write" (not "Admin")
   - Scope to specific bucket only

## Cost Estimation

**Typical usage:**
- 1 video upload per day
- Average 5 segments per video
- 8MB per segment = 40MB per day
- 1.2GB per month
- Well under 10GB free tier

**With 1,000 exercises saved:**
- 1,000 videos × 8MB = 8GB storage
- Still FREE (under 10GB limit)

**Cloudflare R2 will remain FREE indefinitely** as long as:
- Storage < 10GB
- Operations within free tier limits (very generous)

## Support

If you encounter issues:
1. Check this guide's Troubleshooting section
2. Review [Cloudflare R2 documentation](https://developers.cloudflare.com/r2/)
3. Check application logs: `python server.py` output
4. Verify R2 bucket settings in Cloudflare dashboard

## Next Steps

After R2 setup is complete:
1. Test uploading and processing videos
2. Verify videos appear in Exercise Library
3. Test video playback from R2 URLs
4. Monitor storage usage in Cloudflare dashboard

**Congratulations! You now have FREE cloud video storage! 🎉**
