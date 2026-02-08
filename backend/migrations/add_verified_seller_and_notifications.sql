-- Migration: Add verified seller and notification features
-- Date: 2026-02-08
-- Description: Adds is_verified_seller, shipping_address to users table and creates notifications table

-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified_seller BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS shipping_address TEXT;

-- Add comments
COMMENT ON COLUMN users.is_verified_seller IS 'Verified seller trust badge (shown in community listings)';
COMMENT ON COLUMN users.shipping_address IS 'Default shipping address for smart checkout pre-fill';

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    related_id INTEGER,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc') NOT NULL
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS ix_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS ix_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS ix_notifications_created_at ON notifications(created_at DESC);

-- Add comment on table
COMMENT ON TABLE notifications IS 'Admin notification system for new listings, orders, and verification requests';
