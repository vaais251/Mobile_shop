import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 * Handles conflicts and removes duplicates
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format price with currency
 */
export function formatPrice(price: number, currency = 'PKR'): string {
    return new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
}

/**
 * Format condition grade as display string
 */
export function formatCondition(grade: number): string {
    return `${grade.toFixed(1)}/10`;
}

/**
 * Get condition color class based on grade
 */
export function getConditionColor(grade: number): string {
    if (grade >= 9) return 'text-green-500';
    if (grade >= 7) return 'text-yellow-500';
    if (grade >= 5) return 'text-orange-500';
    return 'text-red-500';
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('en-PK', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(date));
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.slice(0, length).trim() + '...';
}

/**
 * Generate order number
 */
export function generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, '0');
    return `ORD-${year}-${random}`;
}

/**
 * Calculate discount percentage
 */
export function calculateDiscount(
    originalPrice: number,
    currentPrice: number
): number {
    if (originalPrice <= 0) return 0;
    const discount = ((originalPrice - currentPrice) / originalPrice) * 100;
    return Math.round(discount);
}

/**
 * Storage options for phones
 */
export const STORAGE_OPTIONS = [64, 128, 256, 512, 1024] as const;

/**
 * Phone brands
 */
export const PHONE_BRANDS = [
    'Apple',
    'Samsung',
    'Google',
    'OnePlus',
    'Xiaomi',
    'Oppo',
    'Vivo',
    'Realme',
    'Huawei',
    'Motorola',
    'Nokia',
    'Other',
] as const;

/**
 * Phone conditions
 */
export const PHONE_CONDITIONS = [
    { value: 'mint', label: 'Mint (10/10)', description: 'Like new, perfect condition' },
    { value: 'excellent', label: 'Excellent (9/10)', description: 'Minimal signs of use' },
    { value: 'good', label: 'Good (8/10)', description: 'Light scratches/marks' },
    { value: 'fair', label: 'Fair (7/10)', description: 'Visible wear but functional' },
    { value: 'poor', label: 'Poor (6/10 or below)', description: 'Significant wear/damage' },
] as const;

/**
 * Order statuses
 */
export const ORDER_STATUSES = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
    { value: 'processing', label: 'Processing', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'shipped', label: 'Shipped', color: 'bg-purple-100 text-purple-800' },
    { value: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-cyan-100 text-cyan-800' },
    { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
    { value: 'returned', label: 'Returned', color: 'bg-gray-100 text-gray-800' },
    { value: 'refunded', label: 'Refunded', color: 'bg-orange-100 text-orange-800' },
] as const;

/**
 * Payment methods
 */
export const PAYMENT_METHODS = [
    { value: 'cod', label: 'Cash on Delivery', icon: '💵' },
    { value: 'credit_card', label: 'Credit/Debit Card', icon: '💳' },
    { value: 'easypaisa', label: 'Easypaisa', icon: '📱' },
    { value: 'jazzcash', label: 'JazzCash', icon: '📲' },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
] as const;
