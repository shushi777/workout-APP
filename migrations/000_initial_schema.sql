-- Migration: Initial Database Schema
-- Creates the base tables for the workout video editor
-- Date: 2026-01-10

-- ============================================
-- Create base tables
-- ============================================

-- Exercises table (main table)
CREATE TABLE IF NOT EXISTS exercises (
    id SERIAL PRIMARY KEY,
    video_file_path TEXT NOT NULL,
    exercise_name VARCHAR(255),
    duration FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Muscle groups lookup table
CREATE TABLE IF NOT EXISTS muscle_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- Equipment lookup table
CREATE TABLE IF NOT EXISTS equipment (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- Junction table: exercises to muscle groups (many-to-many)
CREATE TABLE IF NOT EXISTS exercise_muscle_groups (
    exercise_id INTEGER REFERENCES exercises(id) ON DELETE CASCADE,
    muscle_group_id INTEGER REFERENCES muscle_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (exercise_id, muscle_group_id)
);

-- Junction table: exercises to equipment (many-to-many)
CREATE TABLE IF NOT EXISTS exercise_equipment (
    exercise_id INTEGER REFERENCES exercises(id) ON DELETE CASCADE,
    equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
    PRIMARY KEY (exercise_id, equipment_id)
);

-- ============================================
-- Create indexes for better performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_exercises_created_at ON exercises(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercises_name ON exercises(exercise_name);

-- ============================================
-- Verification
-- ============================================

SELECT 'Initial schema migration completed successfully!' as status;
