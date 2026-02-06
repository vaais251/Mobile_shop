-- Migration: Add phone specifications and seller contact fields
-- Created: 2026-02-07
-- Description: Adds RAM, camera megapixels, seller phone, and seller city columns to phone_inventory table

-- Add phone specifications
ALTER TABLE phone_inventory ADD COLUMN ram_gb INTEGER;
ALTER TABLE phone_inventory ADD COLUMN camera_mp INTEGER;

-- Add seller contact information
ALTER TABLE phone_inventory ADD COLUMN seller_phone VARCHAR(20);
ALTER TABLE phone_inventory ADD COLUMN seller_city VARCHAR(100);
