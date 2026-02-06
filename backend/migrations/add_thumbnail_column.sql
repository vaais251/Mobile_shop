-- Add thumbnail column for multi-image support
-- This migration adds a thumbnail column to store the main cover image path

ALTER TABLE phone_inventory ADD COLUMN IF NOT EXISTS thumbnail VARCHAR(255);

-- Update existing rows to use images as thumbnail (if they have images)
UPDATE phone_inventory 
SET thumbnail = images 
WHERE thumbnail IS NULL AND images IS NOT NULL AND images != '';
