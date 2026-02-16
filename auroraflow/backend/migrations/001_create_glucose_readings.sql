-- Migration: Create glucose_readings table
-- Description: Stores glucose readings with user association and timestamps
-- Date: 2026-02-16

-- Create glucose_readings table
CREATE TABLE IF NOT EXISTS glucose_readings (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    glucose_level DECIMAL(5,2) NOT NULL CHECK (glucose_level >= 20 AND glucose_level <= 600),
    reading_time TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_glucose_user_id ON glucose_readings(user_id);
CREATE INDEX idx_glucose_reading_time ON glucose_readings(reading_time DESC);
CREATE INDEX idx_glucose_user_time ON glucose_readings(user_id, reading_time DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_glucose_readings_updated_at BEFORE UPDATE
    ON glucose_readings FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE glucose_readings IS 'Stores glucose readings for diabetes management';
COMMENT ON COLUMN glucose_readings.glucose_level IS 'Glucose level in mg/dL (valid range: 20-600)';
COMMENT ON COLUMN glucose_readings.reading_time IS 'Timestamp when the reading was taken';
COMMENT ON COLUMN glucose_readings.user_id IS 'User identifier (supports both authenticated and guest users)';
