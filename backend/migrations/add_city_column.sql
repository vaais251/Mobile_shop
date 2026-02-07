-- Migration: Add city column to users table
-- Date: 2026-02-07

-- Add city column with default value for existing users
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT 'Unknown' NOT NULL;

-- Update any NULL values (in case column already exists but has NULLs)
UPDATE users SET city = 'Unknown' WHERE city IS NULL;
