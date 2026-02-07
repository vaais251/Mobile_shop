import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format price in PKR
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Phone brand options
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
  'Nothing',
  'Motorola',
  'Nokia',
  'Sony',
  'Asus',
  'Infinix',
  'Tecno',
];

/**
 * Condition categories
 */
export const PHONE_CONDITIONS = [
  { value: 'mint', label: 'Mint - Like New' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

/**
 * Phone color options
 */
export const PHONE_COLORS = [
  'Space Black',
  'Midnight Black',
  'Titanium Black',
  'Graphite',
  'Space Gray',
  'Silver',
  'White',
  'Gold',
  'Rose Gold',
  'Deep Purple',
  'Purple',
  'Blue',
  'Pacific Blue',
  'Sierra Blue',
  'Alpine Green',
  'Green',
  'Mint',
  'Pink',
  'Red',
  'Yellow',
  'Orange',
  'Natural Titanium',
  'Blue Titanium',
  'White Titanium',
  'Phantom Black',
  'Cream',
  'Lavender',
  'Other',
];

/**
 * Truncate text with ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Format date
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}
