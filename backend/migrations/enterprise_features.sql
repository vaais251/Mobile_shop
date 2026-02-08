-- Enterprise Features Database Migration
-- Adds: Team Members, Commissions, Audit Logs, and Enhanced Orders

-- ===================================
-- 1. TEAM MEMBERS TABLE
-- ===================================

CREATE TYPE team_role AS ENUM (
    'super_admin',
    'product_manager',
    'customer_service',
    'finance_manager',
    'warehouse_manager'
);

CREATE TYPE department AS ENUM (
    'management',
    'product',
    'customer_support',
    'finance',
    'warehouse',
    'marketing'
);

CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    role team_role NOT NULL DEFAULT 'customer_service',
    department department NOT NULL DEFAULT 'customer_support',
    
    -- Permissions
    can_approve_listings BOOLEAN NOT NULL DEFAULT FALSE,
    can_manage_orders BOOLEAN NOT NULL DEFAULT TRUE,
    can_view_analytics BOOLEAN NOT NULL DEFAULT FALSE,
    can_manage_inventory BOOLEAN NOT NULL DEFAULT FALSE,
    can_handle_support BOOLEAN NOT NULL DEFAULT TRUE,
    can_manage_team BOOLEAN NOT NULL DEFAULT FALSE,
    can_process_commissions BOOLEAN NOT NULL DEFAULT FALSE,
    can_manage_prices BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    
    -- Activity Metrics
    total_orders_processed INTEGER NOT NULL DEFAULT 0,
    total_listings_approved INTEGER NOT NULL DEFAULT 0,
    total_tickets_resolved INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    hired_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_role ON team_members(role);
CREATE INDEX idx_team_members_is_active ON team_members(is_active);

-- ===================================
-- 2. COMMISSIONS TABLE
-- ===================================

CREATE TYPE commission_status AS ENUM (
    'pending',
    'processing',
    'paid',
    'cancelled',
    'disputed'
);

CREATE TABLE IF NOT EXISTS commissions (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    order_item_id INTEGER NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    seller_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Financial Details
    product_price NUMERIC(10, 2) NOT NULL,
    commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 10.00, -- Percentage
    commission_amount NUMERIC(10, 2) NOT NULL,
    platform_revenue NUMERIC(10, 2) NOT NULL,
    seller_payout NUMERIC(10, 2) NOT NULL,
    
    -- Payment Status
    status commission_status NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    processed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_commissions_order_id ON commissions(order_id);
CREATE INDEX idx_commissions_seller_id ON commissions(seller_id);
CREATE INDEX idx_commissions_status ON commissions(status);
CREATE INDEX idx_commissions_created_at ON commissions(created_at);

-- ===================================
-- 3. AUDIT LOGS TABLE
-- ===================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action Details
    action_type VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id INTEGER,
    
    -- Change Tracking
    old_value JSONB,
    new_value JSONB,
    description TEXT,
    
    -- Request Context
    ip_address VARCHAR(45), -- Supports IPv6
    user_agent VARCHAR(500),
    metadata JSONB,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);

-- ===================================
-- 4. ENHANCE ORDERS TABLE
-- ===================================

-- Add new columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS assigned_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS internal_notes TEXT,
ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE,
ADD COLUMN IF NOT EXISTS proof_of_delivery_image VARCHAR(500),
ADD COLUMN IF NOT EXISTS customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
ADD COLUMN IF NOT EXISTS tags VARCHAR(50)[],
ADD COLUMN IF NOT EXISTS order_number VARCHAR(50) UNIQUE;

-- Create index for order assignment
CREATE INDEX IF NOT EXISTS idx_orders_assigned_to ON orders(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_priority ON orders(priority);

-- ===================================
-- 5. UPDATE ORDER NUMBERS FOR EXISTING ORDERS
-- ===================================

-- Generate order numbers for existing orders that don't have one
DO $$
DECLARE
    order_record RECORD;
    new_order_number VARCHAR(50);
BEGIN
    FOR order_record IN 
        SELECT id, created_at FROM orders WHERE order_number IS NULL
    LOOP
        new_order_number := 'ORD-' || TO_CHAR(order_record.created_at, 'YYYYMMDD') || '-' || LPAD(order_record.id::TEXT, 6, '0');
        
        UPDATE orders 
        SET order_number = new_order_number 
        WHERE id = order_record.id;
    END LOOP;
END $$;

-- Make order_number NOT NULL after adding values
ALTER TABLE orders ALTER COLUMN order_number SET NOT NULL;

-- ===================================
-- 6. ADD PRODUCT RATING MODEL REFERENCE
-- ===================================

CREATE TABLE IF NOT EXISTS product_ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone_id INTEGER REFERENCES phone_inventory(id) ON DELETE SET NULL,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Rating
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    
    -- Images
    images TEXT[], -- Array of image URLs
    
    -- Helpful votes
    helpful_count INTEGER NOT NULL DEFAULT 0,
    
    -- Verification
    is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_ratings_user_id ON product_ratings(user_id);
CREATE INDEX idx_product_ratings_phone_id ON product_ratings(phone_id);
CREATE INDEX idx_product_ratings_order_id ON product_ratings(order_id);
CREATE INDEX idx_product_ratings_rating ON product_ratings(rating);

-- ===================================
-- 7. SYSTEM SETTINGS TABLE
-- ===================================

CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default commission rate
INSERT INTO system_settings (setting_key, setting_value, description) 
VALUES ('commission_rate', '10.00', 'Default commission percentage for community sales')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert low stock threshold
INSERT INTO system_settings (setting_key, setting_value, description) 
VALUES ('low_stock_threshold', '5', 'Alert when product stock falls below this number')
ON CONFLICT (setting_key) DO NOTHING;

-- ===================================
-- 8. CREATE UPDATED_AT TRIGGER FUNCTION
-- ===================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON commissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_ratings_updated_at BEFORE UPDATE ON product_ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- VERIFICATION QUERIES
-- ===================================

-- Verify tables were created
SELECT 
    'team_members' as table_name, 
    COUNT(*) as row_count 
FROM team_members
UNION ALL
SELECT 
    'commissions' as table_name, 
    COUNT(*) as row_count 
FROM commissions
UNION ALL
SELECT 
    'audit_logs' as table_name, 
    COUNT(*) as row_count 
FROM audit_logs
UNION ALL
SELECT 
    'system_settings' as table_name, 
    COUNT(*) as row_count 
FROM system_settings;

-- Display system settings
SELECT * FROM system_settings;

COMMIT;
