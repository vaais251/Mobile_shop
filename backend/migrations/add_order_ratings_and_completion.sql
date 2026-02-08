-- Migration: Add Product Ratings and Order Completion Tracking
-- Created: 2026-02-08
-- Purpose: Enable customer ratings for products and track order completion

-- Add completion tracking to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS completion_notes TEXT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS can_be_rated BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN orders.completed_at IS 'Timestamp when order was marked as completed by admin';
COMMENT ON COLUMN orders.completion_notes IS 'Admin notes when completing the order';
COMMENT ON COLUMN orders.can_be_rated IS 'Whether customer can rate products in this order';

-- Create product_ratings table
CREATE TABLE IF NOT EXISTS product_ratings (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    phone_id INTEGER NOT NULL REFERENCES phone_inventory(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating DECIMAL(2,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    review TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(order_id, phone_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ratings_phone ON product_ratings(phone_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON product_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_order ON product_ratings(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_completed ON orders(completed_at) WHERE completed_at IS NOT NULL;

COMMENT ON TABLE product_ratings IS 'Customer ratings and reviews for purchased products';
COMMENT ON COLUMN product_ratings.rating IS 'Rating from 1.0 to 5.0';
COMMENT ON COLUMN product_ratings.review IS 'Optional text review from customer';
