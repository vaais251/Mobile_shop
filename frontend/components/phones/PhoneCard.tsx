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
    MessageCircle,
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

            <CardContent className="p-5">
                {/* Brand & Model */}
                <div className="mb-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{phone.brand}</p>
                    <h3 className="text-lg font-semibold text-foreground truncate mt-1">{phone.model}</h3>
                </div>

                {/* Specs Row */}
                <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
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

            <CardFooter className="p-5 pt-3 flex flex-col gap-4">
                {/* Price */}
                <div className="flex items-center justify-between w-full">
                    <div>
                        <p className="text-2xl font-bold text-foreground leading-tight">
                            {formatPrice(Number(phone.price))}
                        </p>
                        {phone.original_price && (
                            <p className="text-xs text-muted-foreground line-through mt-0.5">
                                {formatPrice(Number(phone.original_price))}
                            </p>
                        )}
                    </div>
                </div>

                {/* Buy Now Button - Full Width */}
                <Link href={`/phone/${phone.id}`} className="w-full">
                    <Button
                        size="lg"
                        className={
                            variant === 'shop'
                                ? 'w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/30 font-semibold h-12 text-base cursor-pointer'
                                : 'w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30 font-semibold h-12 text-base cursor-pointer'
                        }
                    >
                        Buy Now
                    </Button>
                </Link>

                {/* WhatsApp and Add to Cart Row */}
                <div className="grid grid-cols-2 gap-3 w-full">
                    <Button
                        size="default"
                        asChild
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md font-medium h-10 cursor-pointer"
                    >
                        <a
                            href={`https://wa.me/?text=Hi, I'm interested in ${phone.brand} ${phone.model} - ${formatPrice(Number(phone.price))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2"
                        >
                            <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                            WhatsApp
                        </a>
                    </Button>
                    <Button
                        size="default"
                        disabled={inCart}
                        onClick={() => addToCart(phone)}
                        className={
                            inCart
                                ? 'bg-muted text-muted-foreground cursor-not-allowed h-10'
                                : variant === 'shop'
                                    ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-md font-medium h-10 cursor-pointer'
                                    : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-md font-medium h-10 cursor-pointer'
                        }
                    >
                        {inCart ? (
                            <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                In Cart
                            </>
                        ) : (
                            <>
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Add to Cart
                            </>
                        )}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
