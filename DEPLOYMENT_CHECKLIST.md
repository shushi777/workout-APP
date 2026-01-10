# 📋 Pre-Deployment Checklist

Use this checklist before deploying to Railway to ensure a smooth deployment.

---

## ✅ 1. Code Preparation

- [ ] **All code committed to Git**
  ```bash
  git status  # Should show "nothing to commit, working tree clean"
  ```

- [ ] **Critical files exist**:
  - [ ] `Procfile` (contains: `web: gunicorn server:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`)
  - [ ] `runtime.txt` (contains: `python-3.13.3`)
  - [ ] `requirements.txt` (all dependencies listed)
  - [ ] `.gitignore` (excludes `.env`, `uploads/`, `output/`, video files)
  - [ ] `.env.example` (template with all required variables)

- [ ] **Config supports DATABASE_URL**
  - [ ] `config.py` imports `urlparse` from `urllib.parse`
  - [ ] `DB_CONFIG` parses `DATABASE_URL` if present
  - [ ] Falls back to individual variables for local development

- [ ] **Git repository pushed to GitHub**
  ```bash
  git remote -v  # Should show GitHub repository URL
  git push origin main  # Push latest changes
  ```

---

## ✅ 2. Cloudflare R2 Setup

- [ ] **R2 bucket created** (see `CLOUDFLARE_R2_SETUP.md`)
  - Bucket name: `___________________________`
  - Region: Automatic

- [ ] **Public access enabled**
  - [ ] R2 bucket → Settings → Public Access → Allow Access
  - [ ] Public URL obtained: `https://pub-____________.r2.dev`

- [ ] **API token created**
  - [ ] Token name: `workout-app-token` (or similar)
  - [ ] Permissions: Object Read & Write
  - [ ] Scope: Applied to your bucket

- [ ] **Credentials saved** (write them here temporarily, then delete after setup):
  - Account ID: `___________________________`
  - Access Key ID: `___________________________`
  - Secret Access Key: `___________________________`
  - Public URL: `https://pub-____________.r2.dev`

---

## ✅ 3. Railway Account & Project

- [ ] **Railway account created**
  - [ ] Signed up at https://railway.app
  - [ ] Logged in with GitHub
  - [ ] Free $5/month credit available

- [ ] **New project created**
  - [ ] Project name: `___________________________`
  - [ ] Connected to GitHub repository
  - [ ] Initial deployment successful

- [ ] **PostgreSQL addon added**
  - [ ] Database created (Railway dashboard → New → Database → PostgreSQL)
  - [ ] `DATABASE_URL` environment variable auto-set
  - [ ] Connection successful (check Railway logs)

---

## ✅ 4. Environment Variables Configuration

Open Railway → Your app service → Variables tab → Add these:

### Flask Configuration

- [ ] **SECRET_KEY**
  - Generate with: `python -c "import secrets; print(secrets.token_hex(32))"`
  - Value: `___________________________`

- [ ] **FLASK_ENV**: `production`

- [ ] **FLASK_DEBUG**: `False`

### Storage Configuration

- [ ] **STORAGE_BACKEND**: `r2`

### Cloudflare R2 Configuration

- [ ] **R2_ACCOUNT_ID**: `___________________________`

- [ ] **R2_BUCKET_NAME**: `___________________________`

- [ ] **R2_ACCESS_KEY**: `___________________________`

- [ ] **R2_SECRET_KEY**: `___________________________`

- [ ] **R2_PUBLIC_URL**: `https://pub-____________.r2.dev`

### Optional Variables (use defaults if not set)

- [ ] **SCENE_DETECTION_THRESHOLD**: `27.0`
- [ ] **MIN_SCENE_LENGTH**: `0.6`
- [ ] **FFMPEG_PATH**: `ffmpeg`

---

## ✅ 5. Database Migration

- [ ] **Railway CLI installed**
  ```bash
  npm i -g @railway/cli
  railway --version
  ```

- [ ] **Connected to Railway project**
  ```bash
  railway login
  railway link  # Select your project
  ```

- [ ] **Database schema created**

  **Option A: Via Railway CLI (recommended)**
  ```bash
  railway run python run_migration.py
  ```

  **Option B: Manually via psql**
  ```bash
  railway run psql $DATABASE_URL
  # Then paste SQL from migrations/001_initial_schema.sql
  ```

- [ ] **Tables verified**
  ```sql
  \dt  -- Should list 5 tables: exercises, muscle_groups, equipment, exercise_muscle_groups, exercise_equipment
  ```

---

## ✅ 6. Domain & HTTPS

- [ ] **Railway domain generated**
  - Railway dashboard → Your app → Settings → Domains → Generate Domain
  - Domain: `___________________________.up.railway.app`
  - HTTPS: ✅ (automatic)

- [ ] **Custom domain added** (optional)
  - Custom domain: `___________________________`
  - CNAME record added to DNS: Points to Railway domain
  - SSL certificate provisioned (wait 5-30 minutes)

---

## ✅ 7. PWA Configuration

- [ ] **manifest.json updated** (if using custom domain)
  - `start_url`: `https://your-railway-domain.up.railway.app/`
  - `scope`: `https://your-railway-domain.up.railway.app/`

- [ ] **Changes committed and pushed**
  ```bash
  git add manifest.json
  git commit -m "Update PWA manifest for production domain"
  git push origin main
  ```

---

## ✅ 8. Testing

### Basic Functionality

- [ ] **Upload page accessible**
  - Visit: `https://your-railway-domain.up.railway.app`
  - Page loads without errors

- [ ] **Video upload works**
  - Upload a test video
  - Scene detection completes
  - Redirects to timeline editor

- [ ] **Timeline editor works**
  - Video plays correctly
  - Cut points visible and draggable
  - Can add manual cut points
  - Can tag segments

- [ ] **Save & Process works**
  - Click "שמור" (Save) button
  - Videos upload to Cloudflare R2 (check Railway logs)
  - No errors in console
  - Redirects to exercise library

- [ ] **Exercise library works**
  - Exercises appear with thumbnails
  - Videos play from R2 URLs
  - Search works
  - Filters work (muscle groups, equipment)

### Mobile PWA Testing

- [ ] **Install on mobile**
  - Open Railway URL on phone (Chrome/Safari)
  - Tap "Add to Home Screen" / "Install app"
  - App icon appears on home screen

- [ ] **Web Share Target works**
  - Open video file on phone
  - Tap "Share"
  - "Workout App" appears in share sheet
  - Selecting it opens app with video pre-loaded

### Error Checking

- [ ] **Railway logs clean**
  ```bash
  railway logs --tail 100
  # Look for errors, warnings, or crashes
  ```

- [ ] **Browser console clean**
  - Open browser DevTools → Console
  - No JavaScript errors
  - No CORS errors

- [ ] **Database has entries**
  ```bash
  railway run psql $DATABASE_URL
  SELECT COUNT(*) FROM exercises;  -- Should show > 0 if you saved exercises
  ```

---

## ✅ 9. Monitoring & Maintenance

- [ ] **Bookmark Railway dashboard**
  - URL: https://railway.app/dashboard

- [ ] **Check resource usage**
  - Railway dashboard → Your project → Metrics
  - Verify CPU, memory, bandwidth usage is within free tier

- [ ] **Check R2 storage usage**
  - Cloudflare dashboard → R2 → Your bucket → Metrics
  - Verify storage is within 10GB free tier

- [ ] **Set up alerts** (optional)
  - Railway: Settings → Notifications
  - Cloudflare: R2 bucket → Usage alerts

---

## ✅ 10. Documentation

- [ ] **Update README.md** with production URL
  - Add "Live Demo" link
  - Update installation instructions

- [ ] **Document deployment process** (this file!)
  - Save this checklist for future reference
  - Note any issues encountered and solutions

- [ ] **Share with team/users**
  - Send production URL
  - Provide usage instructions
  - Collect feedback

---

## 🎉 Deployment Complete!

Once all checkboxes are ticked, your app is **live and ready for users**!

**Next steps:**
1. Monitor Railway logs for errors
2. Check R2 storage usage weekly
3. Gather user feedback
4. Iterate and improve

---

## 🐛 Common Issues & Solutions

### Issue: App won't start on Railway

**Symptoms**: Build succeeds but app crashes immediately

**Check**:
- [ ] Railway logs show `ModuleNotFoundError`
  - **Fix**: Add missing dependency to `requirements.txt`
- [ ] Railway logs show `Configuration Error`
  - **Fix**: Verify all environment variables are set
- [ ] Railway logs show `Database connection failed`
  - **Fix**: Ensure PostgreSQL addon is added and `DATABASE_URL` is set

### Issue: Videos not uploading to R2

**Symptoms**: Save button works but videos don't appear in library

**Check**:
- [ ] Railway logs show `NoCredentialsError`
  - **Fix**: Set all R2 environment variables (Account ID, Access Key, Secret Key)
- [ ] Railway logs show `Access Denied`
  - **Fix**: Verify R2 API token has correct permissions
- [ ] Videos saved locally instead of R2
  - **Fix**: Set `STORAGE_BACKEND=r2` in Railway variables

### Issue: Database tables missing

**Symptoms**: Errors about missing tables (e.g., `exercises`, `muscle_groups`)

**Check**:
- [ ] Migration not run
  - **Fix**: Run `railway run python run_migration.py`
- [ ] Connected to wrong database
  - **Fix**: Verify `DATABASE_URL` points to Railway PostgreSQL

### Issue: PWA won't install on mobile

**Symptoms**: "Add to Home Screen" option doesn't appear

**Check**:
- [ ] Not using HTTPS
  - **Fix**: Use Railway domain (has automatic HTTPS)
- [ ] `manifest.json` has wrong `start_url`
  - **Fix**: Update to Railway production URL
- [ ] Service worker not registered
  - **Fix**: Check browser console for service worker errors

---

## 📞 Support Resources

- **Railway Docs**: https://docs.railway.app
- **Cloudflare R2 Docs**: https://developers.cloudflare.com/r2/
- **Railway Discord**: https://discord.gg/railway
- **Project Repository**: `___________________________`

---

**Good luck with your deployment! 🚀**
