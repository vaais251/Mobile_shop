'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api, BACKEND_URL } from '@/lib/api';
import { PhoneInventory, Order, PaginatedResponse } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Smartphone,
    Package,
    Clock,
    CheckCircle2,
    AlertCircle,
    ShoppingBag,
    Eye,
    Plus,
    Loader2,
    ChevronRight,
    MapPin,
    Calendar,
    Search,
    Filter,
    LayoutDashboard,
    ArrowRight,
    TrendingUp,
    ShieldCheck,
    Trash2,
    XCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function MyListingsPage() {
    const { user, token, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const { t } = useLanguage();

    const [listings, setListings] = useState<PhoneInventory[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('listings');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/my-listings');
            return;
        }

        if (user && token) {
            fetchData();
        }
    }, [user, token, authLoading]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [listingsRes, ordersRes] = await Promise.all([
                api.get<PaginatedResponse<PhoneInventory>>('/phones/my-listings', token!),
                api.get<Order[]>('/orders/me', token!)
            ]);

            if (listingsRes.data) setListings(listingsRes.data.items);
            if (ordersRes.data) setOrders(ordersRes.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteListing = async (phoneId: number) => {
        if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
            return;
        }

        try {
            await api.delete(`/phones/my-listings/${phoneId}`, token!);
            setListings(listings.filter(p => p.id !== phoneId));
        } catch (error) {
            console.error('Error deleting listing:', error);
            alert('Failed to delete listing. Please try again.');
        }
    };

    const cancelOrder = async (orderId: number) => {
        if (!confirm('Are you sure you want to cancel this order?')) {
            return;
        }

        try {
            const response = await api.patch<Order>(`/orders/${orderId}/cancel`, {}, token!);
            if (response.data) {
                setOrders(orders.map(o => o.id === orderId ? response.data! : o));
            }
        } catch (error: unknown) {
            console.error('Error cancelling order:', error);
            const errorMessage = error instanceof Error && 'message' in error
                ? error.message
                : 'Failed to cancel order. Please try again.';
            alert(errorMessage);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative h-16 w-16">
                        <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse"></div>
                        <Loader2 className="h-16 w-16 text-primary animate-spin" />
                    </div>
                    <p className="text-muted-foreground font-medium animate-pulse">Optimizing your dashboard...</p>
                </div>
            </div>
        );
    }

    const approvedCount = listings.filter(l => l.admin_approved).length;
    const pendingCount = listings.length - approvedCount;

    const getStatusBadge = (phone: PhoneInventory) => {
        if (phone.is_sold) {
            return (
                <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-none backdrop-blur-md">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> SOLD
                </Badge>
            );
        }
        if (!phone.admin_approved) {
            return (
                <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-none backdrop-blur-md">
                    <Clock className="h-3 w-3 mr-1" /> PENDING REVIEW
                </Badge>
            );
        }
        return (
            <Badge className="bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-none backdrop-blur-md">
                <ShieldCheck className="h-3 w-3 mr-1" /> ACTIVE
            </Badge>
        );
    };

    const getOrderStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
            confirmed: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800',
            shipped: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800',
            delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
            cancelled: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800',
        };
        return (
            <Badge className={`${styles[status] || 'bg-muted'} border capitalize px-2.5 py-0.5`}>
                {status.replace('_', ' ')}
            </Badge>
        );
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] -z-10 -translate-x-1/2 translate-y-1/2"></div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 relative">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary font-bold tracking-wider uppercase text-xs">
                            <LayoutDashboard className="h-4 w-4" />
                            Hello, {user?.name.split(' ')[0]}
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
                            Personal <span className="text-primary italic">Dashboard</span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl">
                            Track your sales performance, manage your inventory, and monitor your recent purchases in one place.
                        </p>
                    </div>
                    <Link href="/sell">
                        <Button className="group relative overflow-hidden bg-primary text-primary-foreground h-14 px-8 rounded-2xl font-bold shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                            <span className="relative z-10 flex items-center">
                                <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                                List New Item
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </Button>
                    </Link>
                </div>

                {/* Stats Summary Section */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    {[
                        { label: 'Total Listings', value: listings.length, icon: Smartphone, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                        { label: 'Active Items', value: approvedCount, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                        { label: 'Pending Review', value: pendingCount, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                        { label: 'Orders Made', value: orders.length, icon: ShoppingBag, color: 'text-violet-500', bg: 'bg-violet-500/10' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-card/50 backdrop-blur-sm border border-border/50 p-6 rounded-2xl hover:border-primary/30 transition-all flex flex-col justify-between group">
                            <div className={`h-10 w-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4 ring-1 ring-inset ring-foreground/5`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-3xl font-black text-foreground mb-1 group-hover:scale-110 transition-transform origin-left">{stat.value}</p>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="listings" className="space-y-10" onValueChange={setActiveTab}>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-border/50 pb-6">
                        <TabsList className="bg-muted/50 p-1.5 rounded-2xl h-16 w-full sm:w-auto overflow-hidden ring-1 ring-border/50">
                            <TabsTrigger value="listings" className="rounded-xl px-10 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all font-bold">
                                <Smartphone className="h-4 w-4 mr-2" />
                                My Listings
                            </TabsTrigger>
                            <TabsTrigger value="orders" className="rounded-xl px-10 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all font-bold">
                                <ShoppingBag className="h-4 w-4 mr-2" />
                                My Orders
                            </TabsTrigger>
                        </TabsList>

                        {activeTab === 'listings' && listings.length > 0 && (
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-72">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search your items..."
                                        className="bg-muted/30 border border-border/50 rounded-2xl h-12 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full transition-all focus:bg-background"
                                    />
                                </div>
                                <Button variant="outline" size="icon" className="rounded-2xl h-12 w-12 border-border/50 hover:bg-muted/50">
                                    <Filter className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    <TabsContent value="listings" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {listings.length === 0 ? (
                            <Card className="border-none bg-muted/20 py-24 rounded-[40px] shadow-inner">
                                <CardContent className="flex flex-col items-center justify-center text-center">
                                    <div className="h-32 w-32 rounded-full bg-background flex items-center justify-center mb-8 shadow-xl relative">
                                        <Smartphone className="h-14 w-14 text-primary opacity-20" />
                                        <div className="absolute inset-0 border-4 border-dashed border-primary/20 rounded-full animate-spin-slow"></div>
                                    </div>
                                    <h3 className="text-3xl font-bold text-foreground mb-4 italic">No items found</h3>
                                    <p className="text-muted-foreground mb-10 max-w-sm text-lg">Your inventory is empty. Ready to turn your tech into treasure?</p>
                                    <Link href="/sell">
                                        <Button size="lg" className="rounded-2xl h-14 px-10 bg-primary shadow-xl shadow-primary/30 font-bold hover:scale-105 transition-all">List Your First Phone</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {listings.map((phone) => (
                                    <Card key={phone.id} className="group overflow-hidden border-none bg-card shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl ring-1 ring-border/50">
                                        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                                            {phone.thumbnail ? (
                                                <img
                                                    src={phone.thumbnail.startsWith('http') ? phone.thumbnail : `${BACKEND_URL}${phone.thumbnail}`}
                                                    alt={phone.model}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-muted/50 to-muted">
                                                    <Smartphone className="h-16 w-16 text-muted-foreground/30" />
                                                </div>
                                            )}

                                            {/* Top Overlay */}
                                            <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                                                <div className="pointer-events-auto">
                                                    {getStatusBadge(phone)}
                                                </div>
                                                <div className="pointer-events-auto bg-black/50 backdrop-blur-md text-white rounded-xl px-3 py-1 font-bold text-lg shadow-lg">
                                                    {formatPrice(phone.price)}
                                                </div>
                                            </div>

                                            {/* Hover Detail Button */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                                                <Link href={`/phone/${phone.id}`}>
                                                    <Button variant="secondary" className="rounded-xl font-bold gap-2">
                                                        <Eye className="h-4 w-4" /> Quick View
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>

                                        <CardContent className="p-6">
                                            <div className="mb-6 flex justify-between items-start">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-1">{phone.brand}</p>
                                                    <h3 className="text-2xl font-bold truncate group-hover:text-primary transition-colors pr-2 leading-tight">{phone.model}</h3>
                                                </div>
                                                <div className="h-12 w-12 rounded-2xl bg-muted/50 flex flex-col items-center justify-center shrink-0 border border-border/50">
                                                    <span className="text-xs font-bold leading-none">{phone.storage_gb}</span>
                                                    <span className="text-[8px] font-black opacity-50 uppercase tracking-tighter">GB</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-xs font-bold text-muted-foreground mb-6">
                                                <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {formatDate(phone.created_at)}
                                                </div>
                                                <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg">
                                                    <Package className="h-3.5 w-3.5" />
                                                    {phone.storage_gb} GB
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <Link href={`/phone/${phone.id}`} className="flex-1">
                                                    <Button className="w-full h-12 rounded-xl bg-muted text-foreground hover:bg-primary hover:text-primary-foreground font-bold transition-all border border-border/50 hover:border-primary shadow-sm hover:shadow-primary/20">
                                                        View Details
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="destructive"
                                                    className="w-12 h-12 rounded-xl p-0 shrink-0"
                                                    disabled={phone.is_sold}
                                                    onClick={() => deleteListing(phone.id)}
                                                    title={phone.is_sold ? 'Cannot delete sold items' : 'Delete listing'}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="orders" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {orders.length === 0 ? (
                            <Card className="border-none bg-muted/20 py-24 rounded-[40px] shadow-inner">
                                <CardContent className="flex flex-col items-center justify-center text-center">
                                    <div className="h-32 w-32 rounded-full bg-background flex items-center justify-center mb-8 shadow-xl relative">
                                        <ShoppingBag className="h-14 w-14 text-indigo-500 opacity-20" />
                                        <div className="absolute inset-0 border-4 border-dashed border-indigo-500/20 rounded-full animate-spin-slow"></div>
                                    </div>
                                    <h3 className="text-3xl font-bold text-foreground mb-4 italic">No orders yet</h3>
                                    <p className="text-muted-foreground mb-10 max-w-sm text-lg">You haven't made any purchases. Explore the collection to find your next favorite device.</p>
                                    <Link href="/">
                                        <Button size="lg" className="rounded-2xl h-14 px-10 bg-indigo-600 shadow-xl shadow-indigo-600/30 font-bold hover:scale-105 transition-all text-white">Browse Marketplace</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-6">
                                {orders.map((order) => (
                                    <Card key={order.id} className="overflow-hidden border-none bg-card shadow-lg hover:shadow-xl transition-all duration-300 rounded-[32px] ring-1 ring-border/50">
                                        <CardContent className="p-0">
                                            <div className="flex flex-col md:flex-row">
                                                {/* Status Gradient Bar (for desktop side) */}
                                                <div className={`hidden md:block w-3 ${order.status === 'delivered' ? 'bg-gradient-to-b from-emerald-500 to-teal-600' :
                                                    order.status === 'cancelled' ? 'bg-gradient-to-b from-red-500 to-orange-600' :
                                                        'bg-gradient-to-b from-primary to-indigo-600'
                                                    }`}></div>

                                                <div className="flex-1 p-8">
                                                    <div className="flex flex-col lg:flex-row justify-between gap-8 mb-8">
                                                        <div className="space-y-6 flex-1">
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-10 w-10 bg-muted/50 rounded-xl flex items-center justify-center text-primary border border-border/50">
                                                                    <Package className="h-5 w-5" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-xl font-black tracking-tight leading-none mb-2">Order #{order.order_number}</h3>
                                                                    {getOrderStatusBadge(order.status)}
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-2xl bg-muted/20 border border-border/50">
                                                                <div>
                                                                    <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-[0.2em] font-black">Ordered On</p>
                                                                    <p className="font-bold text-sm">{formatDate(order.created_at)}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-[0.2em] font-black">Total Amount</p>
                                                                    <p className="font-black text-primary text-sm">{formatPrice(order.total_amount)}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-[0.2em] font-black">City</p>
                                                                    <div className="flex items-center gap-1 font-bold text-sm">
                                                                        <MapPin className="h-3 w-3" />
                                                                        {order.shipping_city}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-[0.2em] font-black">Item Count</p>
                                                                    <p className="font-bold text-sm">{order.items.length} Product(s)</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col sm:flex-row lg:flex-col justify-center gap-3 min-w-[180px]">
                                                            <Button className="h-12 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20">Track My Order</Button>
                                                            {(order.status === 'pending' || order.status === 'confirmed') && (
                                                                <Button
                                                                    variant="destructive"
                                                                    className="h-12 rounded-xl font-bold"
                                                                    onClick={() => cancelOrder(order.id)}
                                                                >
                                                                    <XCircle className="h-4 w-4 mr-2" />
                                                                    Cancel Order
                                                                </Button>
                                                            )}
                                                            {order.status !== 'pending' && order.status !== 'confirmed' && (
                                                                <Button variant="outline" className="h-12 rounded-xl font-bold border-border group">
                                                                    Full Details <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Items Section */}
                                                    <div className="space-y-3">
                                                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Purchased Devices</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {order.items.map((item, idx) => (
                                                                <div key={idx} className="bg-background/80 border border-border/50 rounded-xl px-4 py-3 text-sm flex items-center gap-3 group hover:border-primary hover:shadow-lg hover:shadow-primary/5 transition-all cursor-default">
                                                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                                        <Smartphone className="h-4 w-4" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-black leading-none mb-1">{item.phone_brand} {item.phone_model}</p>
                                                                        <p className="text-[10px] text-muted-foreground font-bold tracking-tight">Verified & Authenticated</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 12s linear infinite;
                }
            `}</style>
        </div>
    );
}
