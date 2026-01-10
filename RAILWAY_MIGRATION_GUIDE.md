# Railway Database Migration Guide

## Problem: Exercise Library Shows 500 Error

If you're getting a 500 Internal Server Error when trying to view exercises (`/api/exercises`), it's likely because the database is missing the Phase 4 columns that were added to the `exercises` table.

## Solution: Run Database Migrations

You have two options to fix this:

### Option 1: Run Migrations via Railway Dashboard (Easiest)

1. **Open Railway Dashboard**: Go to https://railway.app and open your project

2. **Open PostgreSQL Database Shell**:
   - Click on your PostgreSQL service
   - Click on the "Data" tab
   - Click "Query" to open the SQL editor

3. **Run Migration 001**:
   - Copy the content from `migrations/001_add_timeline_tables.sql`
   - Paste it into the query editor
   - Click "Run Query"
   - You should see success messages

4. **Verify Columns**:
   Run this query to verify the new columns exist:
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'exercises'
   ORDER BY ordinal_position;
   ```

   You should see these columns:
   - id
   - video_file_path
   - exercise_name
   - duration
   - created_at
   - **start_time** ← NEW
   - **end_time** ← NEW
   - **remove_audio** ← NEW
   - **thumbnail_url** ← NEW
   - **video_id** ← NEW

### Option 2: Run Migrations via Railway CLI

1. **Install Railway CLI** (if not installed):
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Link to Your Project**:
   ```bash
   railway link
   ```
   Select your workout app project from the list

4. **Run Migrations**:
   ```bash
   railway run python run_migrations.py
   ```

   This will:
   - Connect to your Railway PostgreSQL database
   - Run all migration files
   - Show the current schema
   - Display any errors

### Option 3: Connect to Railway DB Locally

1. **Get Database Credentials from Railway**:
   - Go to Railway Dashboard → PostgreSQL service → Variables tab
   - Copy the `DATABASE_URL` value

2. **Run Migrations Locally**:
   ```bash
   export DATABASE_URL="postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway"
   python run_migrations.py
   ```

   Replace the DATABASE_URL with your actual connection string from Railway.

## What Do These Migrations Do?

The `001_add_timeline_tables.sql` migration adds:

1. **New columns to `exercises` table**:
   - `start_time` - Start time of the exercise segment
   - `end_time` - End time of the exercise segment
   - `remove_audio` - Boolean flag to remove audio from video
   - `thumbnail_url` - URL to video thumbnail
   - `video_id` - Foreign key to videos table

2. **New `videos` table**:
   - Stores original uploaded videos before segmentation

3. **New `timelines` table**:
   - Stores timeline editing sessions with cut points

These changes are required for Phase 4+ features (video cutting, cloud storage, thumbnails).

## Troubleshooting

### "column already exists" Errors

This is normal! The migrations use `ADD COLUMN IF NOT EXISTS`, so you can safely run them multiple times. The error just means the column was already added previously.

### Connection Refused

- Make sure you're using the correct DATABASE_URL from Railway
- Check that your Railway database is running (not paused)

### Permission Denied

- Make sure you're using the PostgreSQL admin user credentials
- Railway's DATABASE_URL already includes the correct credentials

### Still Getting 500 Error After Migration?

1. Check Railway logs to see the exact error:
   ```bash
   railway logs
   ```

2. Verify migrations ran successfully:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'exercises';
   ```

3. Restart your Railway deployment:
   - Go to Railway Dashboard → Your service → Deploy tab
   - Click "Restart" button

## Next Steps

After running migrations successfully:

1. ✅ Your `/api/exercises` endpoint should work without errors
2. ✅ You can save exercises with video segments
3. ✅ Thumbnails and video URLs will be stored properly
4. ✅ Exercise library page will display saved exercises

---

**Need Help?**
If you're still having issues after running migrations, check the Railway logs:
```bash
railway logs
```

Look for database connection errors or SQL errors that might indicate what went wrong.
