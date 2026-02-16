-- Migration: Create meals table
-- Description: Stores meal/food intake with carbohydrate tracking
-- Date: 2026-02-16

-- Create meals table
CREATE TABLE IF NOT EXISTS meals (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    food_name VARCHAR(255) NOT NULL,
    carbs DECIMAL(6,2) NOT NULL CHECK (carbs >= 0),
    meal_time TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_meals_user_id ON meals(user_id);
CREATE INDEX idx_meals_meal_time ON meals(meal_time DESC);
CREATE INDEX idx_meals_user_time ON meals(user_id, meal_time DESC);

-- Create updated_at trigger
CREATE TRIGGER update_meals_updated_at BEFORE UPDATE
    ON meals FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE meals IS 'Stores meal and food intake data';
COMMENT ON COLUMN meals.carbs IS 'Carbohydrates in grams';
COMMENT ON COLUMN meals.meal_time IS 'Timestamp when the meal was consumed';
