# 🔧 Quick Fix for OpenCV Error on Railway

## The Problem

Railway deployment failed with error:
```
ImportError: libGL.so.1: cannot open shared object file: No such file or directory
```

This happens because OpenCV requires system libraries that aren't installed by default.

## The Solution

Two files were created/updated to fix this:

### 1. `nixpacks.toml` (NEW FILE)
Tells Railway to install required system libraries:
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

### 2. `requirements.txt` (UPDATED)
Changed from `opencv-python` to `opencv-python-headless`:
```diff
- scenedetect[opencv]==0.6.3
- opencv-python==4.10.0.84
+ scenedetect==0.6.3
+ opencv-python-headless==4.10.0.84
```

## 📝 Steps to Deploy Fix

### 1. Commit the Changes

```bash
# Make sure you're in the project directory
cd C:\Users\OmriS\Desktop\workout_APP

# Check what files were changed
git status

# Add all changed files
git add .

# Commit with descriptive message
git commit -m "Fix OpenCV dependencies for Railway deployment

- Add nixpacks.toml with required system libraries
- Switch to opencv-python-headless (no GUI dependencies)
- Update DEPLOYMENT.md with troubleshooting steps"

# Push to GitHub
git push origin main
```

### 2. Railway Will Auto-Deploy

Railway is connected to your GitHub repo, so it will:
1. Detect the new commit
2. Start a new build automatically
3. Install system packages from `nixpacks.toml`
4. Install Python packages from `requirements.txt`
5. Start your app with Gunicorn

### 3. Monitor the Deployment

**Option A: Via Railway Dashboard**
1. Go to https://railway.app/dashboard
2. Click your project
3. Click "Deployments" tab
4. Watch the latest deployment
5. Click "View Logs" to see build progress

**Option B: Via Railway CLI** (if installed)
```bash
railway logs --follow
```

### 4. Verify Success

Look for these lines in the logs:
```
[INFO] Installing system packages...
[INFO] ✓ ffmpeg
[INFO] ✓ libgl1-mesa-glx
[INFO] Starting gunicorn...
[INFO] Listening at: http://0.0.0.0:8080
```

If you see "Worker failed to boot" again, check the error message.

## ✅ Expected Result

After successful deployment:
- ✅ No more OpenCV errors
- ✅ App starts successfully
- ✅ You can access your Railway URL
- ✅ Video upload and processing works

## 🐛 If It Still Fails

### Check Build Logs

Look for these potential issues:

**1. nixpacks.toml not found**
```
Error: Could not find nixpacks.toml
```
**Fix**: Make sure `nixpacks.toml` is committed and pushed

**2. Package installation failed**
```
Error: Unable to install libgl1-mesa-glx
```
**Fix**: Try redeploying (sometimes transient network issues)

**3. Different error message**
- Copy the full error from Railway logs
- Check `DEPLOYMENT.md` troubleshooting section
- Or search the error on Railway Discord

## 📋 Checklist

- [ ] `nixpacks.toml` file exists in project root
- [ ] `requirements.txt` uses `opencv-python-headless`
- [ ] All changes committed to Git
- [ ] Pushed to GitHub (`git push origin main`)
- [ ] Railway detected new commit and started building
- [ ] Build completed successfully (check Railway dashboard)
- [ ] App is running (Railway URL loads)
- [ ] Tested video upload

## 🚀 Next Steps After Fix

Once the app is running:

1. **Test basic functionality**
   - Upload a test video
   - Verify scene detection works
   - Tag and save segments

2. **Check R2 storage**
   - Verify videos are uploading to Cloudflare R2
   - Check exercise library shows videos

3. **Set up database**
   - Run migration if you haven't: `railway run python run_migration.py`
   - Verify tables exist: `railway run psql $DATABASE_URL` then `\dt`

4. **Update README with live URL**
   - Add your Railway URL to README.md
   - Commit and push

---

**Need Help?**
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Check `DEPLOYMENT.md` for detailed troubleshooting
