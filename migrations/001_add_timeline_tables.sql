-- Migration: Add Timeline Tables and Update Exercise Schema
-- Phase 4: Support for video cutting, timelines, and cloud storage
-- Date: 2026-01-09

-- ============================================
-- Step 1: Add new columns to exercises table
-- ============================================

-- Add start_time and end_time for segment boundaries
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS start_time FLOAT,
ADD COLUMN IF NOT EXISTS end_time FLOAT;

-- Add remove_audio flag for video processing
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS remove_audio BOOLEAN DEFAULT FALSE;

-- Add thumbnail_url for video preview images
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add video_id to link exercises to their source video (for future use)
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS video_id INTEGER;

-- ============================================
-- Step 2: Create videos table
-- ============================================
-- Stores original uploaded videos before segmentation

CREATE TABLE IF NOT EXISTS videos (
    id SERIAL PRIMARY KEY,
    original_filename VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,  -- Local path or S3/R2 URL
    duration FLOAT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(50),
    fps FLOAT,
    resolution VARCHAR(20),  -- e.g., "1920x1080"
    storage_type VARCHAR(20) DEFAULT 'local',  -- 'local', 's3', 'r2'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'uploaded'  -- 'uploaded', 'processing', 'completed', 'failed'
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);

-- ============================================
-- Step 3: Create timelines table
-- ============================================
-- Stores timeline editing sessions with cut points

CREATE TABLE IF NOT EXISTS timelines (
    id SERIAL PRIMARY KEY,
    video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    cut_points JSONB,  -- Array of {time, type, id} objects
    segments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    saved_at TIMESTAMP
);

-- Index for faster video lookups
CREATE INDEX IF NOT EXISTS idx_timelines_video_id ON timelines(video_id);
CREATE INDEX IF NOT EXISTS idx_timelines_created_at ON timelines(created_at DESC);

-- ============================================
-- Step 4: Add foreign key for exercises -> videos
-- ============================================

-- Add foreign key constraint (only if column exists and isn't already constrained)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_exercises_video_id'
        AND table_name = 'exercises'
    ) THEN
        ALTER TABLE exercises
        ADD CONSTRAINT fk_exercises_video_id
        FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================
-- Step 5: Create helper views for queries
-- ============================================

-- View: exercises with all related data
CREATE OR REPLACE VIEW exercise_details AS
SELECT
    e.id,
    e.video_file_path,
    e.exercise_name,
    e.duration,
    e.start_time,
    e.end_time,
    e.remove_audio,
    e.thumbnail_url,
    e.created_at,
    v.id as video_id,
    v.original_filename,
    v.storage_type,
    ARRAY_AGG(DISTINCT mg.name) FILTER (WHERE mg.name IS NOT NULL) as muscle_groups,
    ARRAY_AGG(DISTINCT eq.name) FILTER (WHERE eq.name IS NOT NULL) as equipment
FROM exercises e
LEFT JOIN videos v ON e.video_id = v.id
LEFT JOIN exercise_muscle_groups emg ON e.id = emg.exercise_id
LEFT JOIN muscle_groups mg ON emg.muscle_group_id = mg.id
LEFT JOIN exercise_equipment ee ON e.id = ee.exercise_id
LEFT JOIN equipment eq ON ee.equipment_id = eq.id
GROUP BY e.id, v.id;

-- ============================================
-- Step 6: Update existing data (if any)
-- ============================================

-- Set default values for existing rows
UPDATE exercises
SET start_time = 0.0
WHERE start_time IS NULL;

UPDATE exercises
SET end_time = duration
WHERE end_time IS NULL AND duration IS NOT NULL;

UPDATE exercises
SET remove_audio = FALSE
WHERE remove_audio IS NULL;

-- ============================================
-- Migration Complete
-- ============================================

-- Verify tables exist
SELECT 'Migration completed successfully!' as status;
SELECT 'exercises columns:' as info, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'exercises'
ORDER BY ordinal_position;

SELECT 'videos table:' as info, COUNT(*) as row_count FROM videos;
SELECT 'timelines table:' as info, COUNT(*) as row_count FROM timelines;
