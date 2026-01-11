# Railway Database Migration Guide

## Problem
The save button returns a 500 error because the database is missing required columns added in Phase 4/5 updates.

## Solution
Run the database migrations on Railway to add the missing columns to the `exercises` table.

## How to Fix (Railway CLI Method)

### Option 1: Using Railway CLI (Recommended)

1. **Install Railway CLI** (if not already installed):
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Link your project**:
   ```bash
   railway link
   ```
   Select your workout-app project.

4. **Run the migration script**:
   ```bash
   railway run python run_migrations.py
   ```

   This will:
   - Connect to your Railway PostgreSQL database
   - Run all migration files in the `migrations/` folder
   - Add the missing columns: `start_time`, `end_time`, `remove_audio`, `thumbnail_url`
   - Display verification output

5. **Verify the fix**:
   After migrations complete, try saving exercises again. The 500 error should be fixed.

### Option 2: Using Railway Dashboard (Alternative)

1. Go to your Railway project dashboard
2. Click on your PostgreSQL database service
3. Go to the "Data" tab
4. Click "Query" and run this SQL:

```sql
-- Add missing columns to exercises table
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS start_time FLOAT,
ADD COLUMN IF NOT EXISTS end_time FLOAT,
ADD COLUMN IF NOT EXISTS remove_audio BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS video_id INTEGER;

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'exercises'
ORDER BY ordinal_position;
```

### Option 3: One-Command Fix

If you have Python and `psycopg2` installed:

```bash
railway run python fix_database.py
```

## What the Migration Does

The migration adds these columns to the `exercises` table:

- **start_time** (FLOAT): Start timestamp of the exercise segment
- **end_time** (FLOAT): End timestamp of the exercise segment
- **remove_audio** (BOOLEAN): Flag indicating if audio was removed
- **thumbnail_url** (TEXT): URL to the exercise thumbnail image
- **video_id** (INTEGER): Link to source video (for future use)

These columns are required for Phase 4+ features including:
- Video cutting with FFmpeg
- Cloud storage (Cloudflare R2) integration
- Thumbnail generation
- Audio removal option

## Troubleshooting

### Error: "relation 'exercises' does not exist"
This means the database is completely empty. Run:
```bash
railway run python run_migrations.py
```
This will create all tables from scratch.

### Error: "password authentication failed"
Check that your `DATABASE_PUBLIC_URL` environment variable is set correctly in Railway.

### Still getting 500 errors after migration?
1. Check Railway logs: `railway logs`
2. Look for specific SQL errors
3. Verify migrations ran successfully by checking the exercises table schema

## Verification

After running migrations, verify the schema:

```bash
railway run python -c "
import psycopg2
import os
conn = psycopg2.connect(os.getenv('DATABASE_PUBLIC_URL'))
cur = conn.cursor()
cur.execute(\"SELECT column_name FROM information_schema.columns WHERE table_name='exercises' ORDER BY ordinal_position\")
print('Exercises table columns:')
for row in cur.fetchall():
    print(f'  - {row[0]}')
cur.close()
conn.close()
"
```

You should see all these columns:
- id
- video_file_path
- exercise_name
- duration
- created_at
- start_time ✅ (NEW)
- end_time ✅ (NEW)
- remove_audio ✅ (NEW)
- thumbnail_url ✅ (NEW)
- video_id ✅ (NEW)

## Need Help?

If you still have issues after running migrations, check:
1. Railway logs for detailed error messages
2. Database connection settings in Railway environment variables
3. CLAUDE.md for project documentation
