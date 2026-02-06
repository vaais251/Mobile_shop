'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
    CreditCard,
    Truck,
    Wallet,
    CheckCircle,
    AlertCircle,
    Loader2,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
    const { cart, cartTotal, clearCart, cartCount } = useCart();
    const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const { t } = useLanguage();

    const [loading, setLoading] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: user?.name || '',
        address: '',
        city: '',
        phone: user?.phone_number || '',
        notes: '',
    });

    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [transactionId, setTransactionId] = useState('');

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login?redirect=/checkout');
        }
        if (cart.length === 0 && !orderSuccess) {
            router.push('/cart');
        }
    }, [authLoading, isAuthenticated, cart.length, router, orderSuccess]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        if (paymentMethod === 'easypaisa' && !transactionId) {
            setError('Please provide the Transaction ID for verification.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const payload = {
                phone_ids: cart.map(item => item.id),
                payment_method: paymentMethod,
                shipping_address: formData.address,
                shipping_city: formData.city,
                shipping_phone: formData.phone,
                payment_reference: transactionId,
                notes: formData.notes
            };

            const res = await api.post<any>('/orders/', payload, token);

            if (res.error) {
                setError(res.error);
            } else {
                setOrderSuccess(res.data.order_number);
                clearCart();
            }
        } catch (err) {
            setError('An error occurred while placing the order.');
        } finally {
            setLoading(false);
        }
    };

    if (orderSuccess) {
        return (
            <div className="container mx-auto py-20 px-4 text-center">
                <div className="flex justify-center mb-6">
                    <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle className="h-10 w-10 text-emerald-500" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold mb-2">Order Placed Successfully!</h1>
                <p className="text-muted-foreground mb-4">Your order number is <span className="text-primary font-bold">#{orderSuccess}</span></p>
                <p className="text-muted-foreground mb-8">We will verify your details and contact you soon.</p>
                <Link href="/">
                    <Button size="lg" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-xl shadow-violet-500/30 font-semibold h-12 px-8 cursor-pointer">
                        Continue Shopping
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Checkout Form */}
                <div className="lg:col-span-2 space-y-6">
                    <form id="checkout-form" onSubmit={handlePlaceOrder}>
                        {/* Shipping Information */}
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Truck className="h-5 w-5 text-primary" />
                                    Shipping Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required className="bg-muted border-border" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required className="bg-muted border-border" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input id="address" name="address" value={formData.address} onChange={handleInputChange} required className="bg-muted border-border" placeholder="House#, Street#, Area" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input id="city" name="city" value={formData.city} onChange={handleInputChange} required className="bg-muted border-border" placeholder="e.g. Islamabad, Lahore" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Method */}
                        <Card className="bg-card border-border mt-6">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-primary" />
                                    Payment Method
                                </CardTitle>
                                <CardDescription>Select how you would like to pay for your order.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="relative">
                                        <RadioGroupItem value="cod" id="cod" className="peer sr-only" />
                                        <Label
                                            htmlFor="cod"
                                            className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-violet-600 peer-data-[state=checked]:bg-gradient-to-br peer-data-[state=checked]:from-violet-600/10 peer-data-[state=checked]:to-indigo-600/5 cursor-pointer transition-all relative"
                                        >
                                            <div className="absolute top-2 right-2 h-5 w-5 rounded-full border-2 border-muted peer-data-[state=checked]:border-violet-600 peer-data-[state=checked]:bg-violet-600 flex items-center justify-center opacity-0 peer-data-[state=checked]:opacity-100 transition-all">
                                                <CheckCircle className="h-3 w-3 text-white" />
                                            </div>
                                            <Truck className="mb-3 h-8 w-8 text-muted-foreground peer-data-[state=checked]:text-violet-600" />
                                            <span className="text-sm font-semibold">Cash on Delivery</span>
                                        </Label>
                                    </div>
                                    <div className="relative">
                                        <RadioGroupItem value="easypaisa" id="easypaisa" className="peer sr-only" />
                                        <Label
                                            htmlFor="easypaisa"
                                            className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-violet-600 peer-data-[state=checked]:bg-gradient-to-br peer-data-[state=checked]:from-violet-600/10 peer-data-[state=checked]:to-indigo-600/5 cursor-pointer transition-all relative"
                                        >
                                            <div className="absolute top-2 right-2 h-5 w-5 rounded-full border-2 border-muted peer-data-[state=checked]:border-violet-600 peer-data-[state=checked]:bg-violet-600 flex items-center justify-center opacity-0 peer-data-[state=checked]:opacity-100 transition-all">
                                                <CheckCircle className="h-3 w-3 text-white" />
                                            </div>
                                            <Wallet className="mb-3 h-8 w-8 text-muted-foreground peer-data-[state=checked]:text-violet-600" />
                                            <span className="text-sm font-semibold">Easypaisa / JazzCash</span>
                                        </Label>
                                    </div>
                                    <div className="relative">
                                        <RadioGroupItem value="credit_card" id="credit_card" className="peer sr-only" />
                                        <Label
                                            htmlFor="credit_card"
                                            className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-violet-600 peer-data-[state=checked]:bg-gradient-to-br peer-data-[state=checked]:from-violet-600/10 peer-data-[state=checked]:to-indigo-600/5 cursor-pointer transition-all relative"
                                        >
                                            <div className="absolute top-2 right-2 h-5 w-5 rounded-full border-2 border-muted peer-data-[state=checked]:border-violet-600 peer-data-[state=checked]:bg-violet-600 flex items-center justify-center opacity-0 peer-data-[state=checked]:opacity-100 transition-all">
                                                <CheckCircle className="h-3 w-3 text-white" />
                                            </div>
                                            <CreditCard className="mb-3 h-8 w-8 text-muted-foreground peer-data-[state=checked]:text-violet-600" />
                                            <span className="text-sm font-semibold">Credit / Debit Card</span>
                                        </Label>
                                    </div>
                                </RadioGroup>

                                {/* Conditional Payment Details */}
                                {paymentMethod === 'easypaisa' && (
                                    <div className="mt-6 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-4">
                                        <div>
                                            <h4 className="font-bold text-emerald-500">How to pay:</h4>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Send the total amount to <span className="font-bold text-foreground">0300-1234567</span> via Easypaisa or JazzCash.
                                                Once sent, enter the Transaction ID below.
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="tid">Transaction ID (TID)</Label>
                                            <Input
                                                id="tid"
                                                placeholder="Paste transaction code here"
                                                value={transactionId}
                                                onChange={(e) => setTransactionId(e.target.value)}
                                                className="bg-transparent border-emerald-500/20 focus:border-emerald-500"
                                            />
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === 'credit_card' && (
                                    <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2 space-y-2">
                                                <Label>Card Number</Label>
                                                <Input placeholder="0000 0000 0000 0000" className="bg-transparent border-primary/20" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Expiry Date</Label>
                                                <Input placeholder="MM/YY" className="bg-transparent border-primary/20" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>CVC</Label>
                                                <Input placeholder="123" className="bg-transparent border-primary/20" />
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground italic text-center">This is a simulator. No real money will be charged.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </form>
                </div>

                {/* Summary Sidebar */}
                <div className="lg:col-span-1">
                    <Card className="bg-card border-border sticky top-24">
                        <CardHeader>
                            <CardTitle>Total Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                {cart.map((item) => (
                                    <div key={item.id} className="flex justify-between text-xs">
                                        <span className="truncate max-w-[150px]">{item.brand} {item.model}</span>
                                        <span className="font-medium">{formatPrice(Number(item.price))}</span>
                                    </div>
                                ))}
                            </div>
                            <Separator />
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Order Items</span>
                                <span>{cartCount}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{formatPrice(cartTotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Delivery</span>
                                <span>{formatPrice(200)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-xl font-bold">
                                <span>Total</span>
                                <span className="text-primary">{formatPrice(cartTotal + 200)}</span>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </div>
                            )}

                            <Button
                                form="checkout-form"
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-xl shadow-violet-500/30 font-bold h-14 text-lg cursor-pointer"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                ) : (
                                    <CheckCircle className="h-5 w-5 mr-2" />
                                )}
                                Confirm & Place Order
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
