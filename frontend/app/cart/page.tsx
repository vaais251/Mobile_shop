'use client';

import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    Trash2,
    ShoppingCart,
    ArrowRight,
    ArrowLeft,
    Smartphone,
    ShieldCheck
} from 'lucide-react';

export default function CartPage() {
    const { cart, removeFromCart, cartTotal, cartCount } = useCart();
    const { t } = useLanguage();

    if (cartCount === 0) {
        return (
            <div className="container mx-auto py-20 px-4 text-center">
                <div className="flex justify-center mb-6">
                    <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
                <p className="text-muted-foreground mb-8">Looks like you haven't added any phones to your cart yet.</p>
                <Link href="/">
                    <Button size="lg" className="bg-primary hover:bg-primary/90">
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Back to Shop
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
                <ShoppingCart className="h-8 w-8 text-primary" />
                Shopping Cart ({cartCount})
            </h1>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {cart.map((phone) => (
                        <Card key={phone.id} className="bg-card border-border overflow-hidden">
                            <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-6">
                                <div className="h-24 w-24 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                    <Smartphone className="h-12 w-12 text-muted-foreground" />
                                </div>

                                <div className="flex-1 text-center sm:text-left">
                                    <h3 className="text-lg font-semibold">{phone.brand} {phone.model}</h3>
                                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-1">
                                        <span className="text-sm text-muted-foreground">{phone.storage_gb}GB</span>
                                        <span className="text-muted-foreground">•</span>
                                        <span className="text-sm text-muted-foreground">{phone.color}</span>
                                        <span className="text-muted-foreground">•</span>
                                        <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{phone.condition_grade}/10</span>
                                    </div>
                                    {!phone.seller_id && (
                                        <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                                            <ShieldCheck className="h-3 w-3" />
                                            Shop Certified
                                        </div>
                                    )}
                                </div>

                                <div className="text-center sm:text-right w-full sm:w-auto mt-4 sm:mt-0">
                                    <div className="text-xl font-bold mb-2">{formatPrice(Number(phone.price))}</div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                        onClick={() => removeFromCart(phone.id)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Remove
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <Card className="bg-card border-border sticky top-24">
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{formatPrice(cartTotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Shipping</span>
                                <span>{formatPrice(200)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total</span>
                                <span className="text-primary">{formatPrice(cartTotal + 200)}</span>
                            </div>

                            <Link href="/checkout" className="block w-full">
                                <Button className="w-full bg-primary hover:bg-primary/90 py-6 text-lg font-bold shadow-lg shadow-primary/20">
                                    Checkout
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>

                            <div className="pt-4">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                    Secure checkout with buyer protection
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
