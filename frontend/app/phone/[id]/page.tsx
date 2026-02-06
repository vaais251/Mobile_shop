'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { api } from '@/lib/api';
import { PhoneInventory } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    Smartphone,
    Battery,
    HardDrive,
    Palette,
    ShieldCheck,
    AlertTriangle,
    Calendar,
    Package,
    ArrowLeft,
    Loader2,
    MessageCircle,
    CheckCircle,
    XCircle,
    ShoppingCart,
} from 'lucide-react';
import Link from 'next/link';
import { BACKEND_URL } from '@/lib/api';

export default function PhoneDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { t } = useLanguage();
    const { addToCart, isInCart } = useCart();
    const [phone, setPhone] = useState<PhoneInventory | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPhone = async () => {
            try {
                const response = await api.get<PhoneInventory>(`/phones/${params.id}`);
                if (response.data) {
                    setPhone(response.data);
                }
            } catch (error) {
                console.error('Error fetching phone:', error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchPhone();
        }
    }, [params.id]);

    const getConditionColor = (grade: number) => {
        if (grade >= 9) return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
        if (grade >= 7) return 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
        return 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30';
    };

    const inCart = phone ? isInCart(phone.id) : false;

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!phone) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Smartphone className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg">Phone not found</p>
                    <Button className="mt-4" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    const imageUrl = phone.images
        ? (phone.images.startsWith('http') ? phone.images : `${BACKEND_URL}${phone.images}`)
        : null;

    const isShopOwned = !phone.seller_id;
    const discountPercentage = phone.original_price
        ? Math.round(((Number(phone.original_price) - Number(phone.price)) / Number(phone.original_price)) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-background py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    className="mb-6 text-muted-foreground hover:text-foreground"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left: Image */}
                    <div className="relative">
                        <div className={`aspect-square rounded-2xl overflow-hidden bg-muted border ${isShopOwned ? 'border-primary/30' : 'border-cyan-500/30'
                            }`}>
                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt={`${phone.brand} ${phone.model}`}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className={`p-16 rounded-full ${isShopOwned ? 'bg-primary/10' : 'bg-cyan-500/10'
                                        }`}>
                                        <Smartphone className={`h-32 w-32 ${isShopOwned ? 'text-primary' : 'text-cyan-500'
                                            }`} />
                                    </div>
                                </div>
                            )}

                            {/* Badges */}
                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                {phone.is_featured && (
                                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                                        Featured
                                    </Badge>
                                )}
                                {isShopOwned && (
                                    <Badge className="bg-primary/20 text-primary border-primary/30">
                                        <ShieldCheck className="h-3 w-3 mr-1" />
                                        {t.shop_owned}
                                    </Badge>
                                )}
                            </div>

                            {discountPercentage > 0 && (
                                <div className="absolute top-4 right-4">
                                    <Badge className="bg-red-500 text-white border-0 text-lg px-3 py-1">
                                        -{discountPercentage}%
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Details */}
                    <div>
                        {/* Brand & Model */}
                        <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
                            {phone.brand}
                        </p>
                        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                            {phone.model}
                        </h1>

                        {/* Price */}
                        <div className="mb-6">
                            <p className="text-4xl font-bold text-foreground">
                                {formatPrice(Number(phone.price))}
                            </p>
                            {phone.original_price && (
                                <p className="text-lg text-muted-foreground line-through">
                                    {formatPrice(Number(phone.original_price))}
                                </p>
                            )}
                        </div>

                        {/* Condition Badge */}
                        <div className="mb-6">
                            <Badge className={`${getConditionColor(phone.condition_grade)} border text-lg px-4 py-2`}>
                                {t.condition}: {phone.condition_grade.toFixed(1)}/10 • {phone.condition_category}
                            </Badge>
                        </div>

                        {/* Specs Grid */}
                        <Card className="bg-card border-border mb-6">
                            <CardContent className="p-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                            <HardDrive className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">{t.storage}</p>
                                            <p className="font-medium text-foreground">{phone.storage_gb}GB</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                            <Palette className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Color</p>
                                            <p className="font-medium text-foreground">{phone.color}</p>
                                        </div>
                                    </div>
                                    {phone.battery_health && (
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                                <Battery className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">{t.battery_health}</p>
                                                <p className="font-medium text-foreground">{phone.battery_health}%</p>
                                            </div>
                                        </div>
                                    )}
                                    {phone.warranty_months > 0 && (
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">{t.warranty}</p>
                                                <p className="font-medium text-foreground">{phone.warranty_months} {t.months}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Defects Section */}
                        <Card className="bg-card border-border mb-6">
                            <CardContent className="p-6">
                                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    {t.defects}
                                </h3>
                                {phone.defects ? (
                                    <p className="text-muted-foreground">{phone.defects}</p>
                                ) : (
                                    <p className="text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4" />
                                        {t.no_defects}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Accessories */}
                        {phone.accessories_included && (
                            <Card className="bg-card border-border mb-6">
                                <CardContent className="p-6">
                                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                        <Package className="h-4 w-4 text-primary" />
                                        {t.accessories}
                                    </h3>
                                    <p className="text-muted-foreground">{phone.accessories_included}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Seller Info */}
                        {phone.seller && (
                            <Card className="bg-card border-border mb-6">
                                <CardContent className="p-6">
                                    <h3 className="font-semibold text-foreground mb-3">{t.seller}</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20">
                                            <Smartphone className="h-5 w-5 text-cyan-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{phone.seller.name}</p>
                                            {phone.seller.is_verified ? (
                                                <p className="text-sm text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                                                    <ShieldCheck className="h-3 w-3" />
                                                    {t.verified_seller}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">Community Seller</p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <Button
                                size="lg"
                                disabled={inCart}
                                onClick={() => phone && addToCart(phone)}
                                className={`flex-1 ${inCart
                                    ? 'bg-muted text-muted-foreground'
                                    : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25'
                                    }`}
                            >
                                {inCart ? (
                                    <>
                                        <CheckCircle className="mr-2 h-5 w-5" />
                                        {t.in_cart}
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart className="mr-2 h-5 w-5" />
                                        {t.add_to_cart}
                                    </>
                                )}
                            </Button>
                            {!isShopOwned && (
                                <Link href={`/messages?userId=${phone.seller_id}&userName=${encodeURIComponent(phone.seller?.name || '')}&phoneId=${phone.id}`} className="flex-1">
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="w-full border-border text-foreground hover:bg-accent"
                                    >
                                        <MessageCircle className="mr-2 h-4 w-4" />
                                        Chat with Seller
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
