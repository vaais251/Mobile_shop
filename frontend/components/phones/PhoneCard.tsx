'use client';

import { PhoneInventory } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { BACKEND_URL } from '@/lib/api';
import {
    Smartphone,
    Battery,
    HardDrive,
    Star,
    CheckCircle,
    ShieldCheck,
    ShoppingCart,
} from 'lucide-react';

interface PhoneCardProps {
    phone: PhoneInventory;
    variant?: 'shop' | 'community';
}

export function PhoneCard({ phone, variant = 'shop' }: PhoneCardProps) {
    const { t } = useLanguage();
    const { addToCart, isInCart } = useCart();
    const inCart = isInCart(phone.id);

    const getConditionColor = (grade: number) => {
        if (grade >= 9) return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
        if (grade >= 7) return 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
        return 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30';
    };

    const discountPercentage = phone.original_price
        ? Math.round(((Number(phone.original_price) - Number(phone.price)) / Number(phone.original_price)) * 100)
        : 0;

    const imageUrl = phone.images
        ? (phone.images.startsWith('http') ? phone.images : `${BACKEND_URL}${phone.images}`)
        : null;

    return (
        <Card className="card-premium group relative overflow-hidden">
            {/* Featured Badge */}
            {phone.is_featured && (
                <div className="absolute top-3 left-3 z-10">
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        {t.featured}
                    </Badge>
                </div>
            )}

            {/* Discount Badge */}
            {discountPercentage > 0 && (
                <div className="absolute top-3 right-3 z-10">
                    <Badge className="bg-red-500 text-white border-0 shadow-lg">
                        -{discountPercentage}%
                    </Badge>
                </div>
            )}

            {/* Image Section */}
            <div className="relative aspect-square overflow-hidden bg-muted">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={`${phone.brand} ${phone.model}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`p-8 rounded-full ${variant === 'shop'
                            ? 'bg-primary/10'
                            : 'bg-cyan-500/10'
                            }`}>
                            <Smartphone className={`h-20 w-20 ${variant === 'shop'
                                ? 'text-primary'
                                : 'text-cyan-500'
                                }`} />
                        </div>
                    </div>
                )}

                {/* Overlay on hover */}
                <Link href={`/phone/${phone.id}`}>
                    <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="secondary" size="sm">
                            {t.view_details}
                        </Button>
                    </div>
                </Link>
            </div>

            <CardContent className="p-4">
                {/* Brand & Model */}
                <div className="mb-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{phone.brand}</p>
                    <h3 className="text-lg font-semibold text-foreground truncate">{phone.model}</h3>
                </div>

                {/* Specs Row */}
                <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {phone.storage_gb}GB
                    </span>
                    {phone.battery_health && (
                        <span className="flex items-center gap-1">
                            <Battery className="h-3 w-3" />
                            {phone.battery_health}%
                        </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {phone.color}
                    </span>
                </div>

                {/* Condition Badge */}
                <Badge className={`${getConditionColor(phone.condition_grade)} border`}>
                    {phone.condition_grade.toFixed(1)}/10 • {phone.condition_category}
                </Badge>

                {/* Seller Info (for community) */}
                {variant === 'community' && phone.seller && (
                    <div className="mt-3 flex items-center gap-2 text-xs">
                        {phone.seller.is_verified ? (
                            <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
                                <ShieldCheck className="h-3 w-3" />
                                {t.verified_seller}
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-muted-foreground">
                                <CheckCircle className="h-3 w-3" />
                                {phone.seller.name}
                            </span>
                        )}
                    </div>
                )}

                {/* Shop Owned Badge */}
                {variant === 'shop' && (
                    <div className="mt-3 flex items-center gap-1 text-xs text-primary">
                        <ShieldCheck className="h-3 w-3" />
                        {t.shop_owned}
                    </div>
                )}
            </CardContent>

            <CardFooter className="p-4 pt-0 flex items-center justify-between">
                {/* Price */}
                <div>
                    <p className="text-xl font-bold text-foreground">
                        {formatPrice(Number(phone.price))}
                    </p>
                    {phone.original_price && (
                        <p className="text-xs text-muted-foreground line-through">
                            {formatPrice(Number(phone.original_price))}
                        </p>
                    )}
                </div>

                {/* Add to Cart Button */}
                <Button
                    size="sm"
                    disabled={inCart}
                    onClick={() => addToCart(phone)}
                    className={
                        inCart
                            ? 'bg-muted text-muted-foreground'
                            : variant === 'shop'
                                ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25'
                                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25'
                    }
                >
                    {inCart ? (
                        <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {t.in_cart || 'In Cart'}
                        </>
                    ) : (
                        <>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {t.add_to_cart || 'Add to Cart'}
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
