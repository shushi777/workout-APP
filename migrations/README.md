# Database Migrations

This folder contains SQL migration files that update the database schema.

## Migration Files

- `000_initial_schema.sql` - Creates the initial tables (exercises, muscle_groups, equipment, junction tables)
- `001_add_timeline_tables.sql` - Adds Phase 4 columns and tables (start_time, end_time, remove_audio, thumbnail_url, videos table, timelines table)

## Running Migrations

### Option 1: Using Python Script (Recommended)

Run the migration script from the project root:

```bash
python run_migrations.py
```

This script will:
- Connect to your database using DATABASE_URL (Railway) or individual DB_ environment variables
- Run all migration files in order
- Verify the schema after completion
- Show the current state of your database

### Option 2: Using Railway CLI

If you need to run migrations on Railway production database:

```bash
# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Run migrations on Railway
railway run python run_migrations.py
```

### Option 3: Manual SQL Execution

You can also run the SQL files manually using psql or pgAdmin:

```bash
psql -U postgres -d workout_db -f migrations/000_initial_schema.sql
psql -U postgres -d workout_db -f migrations/001_add_timeline_tables.sql
```

## Troubleshooting

### Connection Refused

If you get "connection refused", make sure:
1. PostgreSQL is running (if local)
2. DATABASE_URL environment variable is set correctly (if Railway)
3. DB credentials in .env are correct

### Column Already Exists

This is normal - migrations use `IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS` to be idempotent. You can safely run migrations multiple times.

### Missing Columns Error in /api/exercises

If you get a 500 error from `/api/exercises` endpoint saying columns don't exist (like `start_time`, `end_time`, `remove_audio`, `thumbnail_url`), you need to run the `001_add_timeline_tables.sql` migration.

## Verifying Schema

After running migrations, verify the schema:

```sql
-- List all exercises table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'exercises'
ORDER BY ordinal_position;

-- Should show:
-- id, video_file_path, exercise_name, duration, created_at,
-- start_time, end_time, remove_audio, thumbnail_url, video_id
```
