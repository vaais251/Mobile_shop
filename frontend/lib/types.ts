/**
 * TypeScript types matching the backend SQLAlchemy models
 */

// User types
export type UserRole = 'admin' | 'seller' | 'buyer';

export interface User {
    id: number;
    email: string;
    name: string;
    phone_number?: string;
    city?: string;
    profile_image_url?: string;
    address?: string;
    shipping_address?: string;
    role: UserRole;
    is_verified: boolean;
    is_verified_seller: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface UserCreate {
    email: string;
    password: string;
    name: string;
    phone_number?: string;
    role?: UserRole;
}

export interface UserLogin {
    email: string;
    password: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
}

// Phone Inventory types
export type PhoneCondition = 'mint' | 'excellent' | 'good' | 'fair' | 'poor';

export interface PhoneInventory {
    id: number;
    brand: string;
    model: string;
    storage_gb: number;
    ram_gb?: number;
    camera_mp?: number;
    color: string;
    condition_grade: number;
    condition_category: PhoneCondition;
    defects?: string;
    price: number;
    original_price?: number;
    is_sold: boolean;
    is_featured: boolean;
    is_active: boolean;
    stock: number;
    pta_approved: boolean;
    seller_id?: number;
    seller_phone?: string;
    seller_city?: string;
    admin_approved: boolean;
    images?: string; // JSON array of image paths
    thumbnail?: string; // Main cover image path
    imei?: string;
    battery_health?: number;
    battery_mah?: number;
    warranty_months: number;
    accessories_included?: string;
    created_at: string;
    updated_at: string;

    // Relations
    seller?: {
        id: number;
        name: string;
        email: string;
        is_verified: boolean;
        is_verified_seller: boolean;
    };

    // Computed properties
    is_shop_owned?: boolean;
    is_available?: boolean;
    condition_display?: string;
    discount_percentage?: number;
}

export interface PhoneCreate {
    brand: string;
    model: string;
    storage_gb: number;
    ram_gb?: number;
    color: string;
    condition_grade: number;
    condition_category: PhoneCondition;
    defects?: string;
    price: number;
    original_price?: number;
    images?: string; // JSON array of image paths
    thumbnail?: string; // Main cover image path
    battery_health?: number;
    battery_mah?: number;
    warranty_months?: number;
    accessories_included?: string;
    pta_approved?: boolean;
}

export interface PhoneFilter {
    brand?: string;
    min_price?: number;
    max_price?: number;
    min_condition?: number;
    storage_gb?: number;
    search?: string; // Search by model or brand
    color?: string; // Filter by color
    is_sold?: boolean;
    is_featured?: boolean;
}

// Order types
export type OrderStatus =
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled'
    | 'returned'
    | 'refunded';

export type PaymentMethod =
    | 'cod'
    | 'credit_card'
    | 'easypaisa'
    | 'jazzcash'
    | 'bank_transfer';

export interface Order {
    id: number;
    order_number: string;
    buyer_id: number;
    status: OrderStatus;
    payment_method: PaymentMethod;
    payment_status: boolean;
    payment_reference?: string;
    subtotal: number;
    shipping_cost: number;
    tax_amount: number;
    total_amount: number;
    shipping_address: string;
    shipping_city: string;
    shipping_phone: string;
    tracking_id?: string;
    courier_name?: string;
    notes?: string;
    cancellation_reason?: string;
    created_at: string;
    updated_at: string;
    confirmed_at?: string;
    shipped_at?: string;
    delivered_at?: string;
    cancelled_at?: string;
    items: OrderItem[];
}

export interface OrderItem {
    id: number;
    order_id: number;
    phone_id?: number;
    price_at_purchase: number;
    phone_brand: string;
    phone_model: string;
    phone_storage_gb: number;
    phone_color: string;
    phone_condition: string;
    created_at: string;
}

export interface OrderCreate {
    payment_method: PaymentMethod;
    shipping_address: string;
    shipping_city: string;
    shipping_phone: string;
    notes?: string;
    phone_ids: number[];
}

// Chat types
export interface ChatMessage {
    id: number;
    sender_id: number;
    receiver_id: number;
    phone_id?: number;
    message: string;
    message_type: 'text' | 'image' | 'system';
    is_read: boolean;
    read_at?: string;
    created_at: string;
}

export interface ChatConversation {
    id: number;
    user1_id: number;
    user2_id: number;
    phone_id?: number;
    last_message_at?: string;
    user1_unread_count: number;
    user2_unread_count: number;
    created_at: string;
    updated_at: string;
    other_user?: User;
    last_message?: ChatMessage;
}

export interface SendMessage {
    receiver_id: number;
    message: string;
    phone_id?: number;
}

// API Response types
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    size: number;
    pages: number;
}

export interface ApiError {
    detail: string;
    status_code: number;
}

// Notification types
export type NotificationType =
    | 'new_listing'
    | 'new_order'
    | 'verification_request'
    | 'listing_approved'
    | 'listing_rejected';

export interface Notification {
    id: number;
    type: NotificationType;
    title: string;
    message: string;
    is_read: boolean;
    related_id?: number;
    created_at: string;
}
