-- Migration: Create exercises table
-- Description: Stores physical activity/exercise data
-- Date: 2026-02-16

-- Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    activity_type VARCHAR(255) NOT NULL,
    duration INTEGER NOT NULL CHECK (duration > 0),
    exercise_time TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_exercises_user_id ON exercises(user_id);
CREATE INDEX idx_exercises_exercise_time ON exercises(exercise_time DESC);
CREATE INDEX idx_exercises_user_time ON exercises(user_id, exercise_time DESC);

-- Create updated_at trigger
CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE
    ON exercises FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE exercises IS 'Stores physical activity and exercise data';
COMMENT ON COLUMN exercises.duration IS 'Duration in minutes';
COMMENT ON COLUMN exercises.activity_type IS 'Type of physical activity (e.g., walking, running, cycling)';
COMMENT ON COLUMN exercises.exercise_time IS 'Timestamp when the exercise was performed';
