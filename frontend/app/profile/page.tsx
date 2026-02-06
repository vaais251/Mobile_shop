'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api, BACKEND_URL } from '@/lib/api';
import { Order, PhoneInventory, User } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    User as UserIcon,
    Package,
    Smartphone,
    Settings,
    LogOut,
    CheckCircle,
    Clock,
    Truck,
    AlertCircle,
    Loader2
} from 'lucide-react';

export default function ProfilePage() {
    const router = useRouter();
    const { user, token, isAuthenticated, logout } = useAuth();
    const { t } = useLanguage();

    const [orders, setOrders] = useState<Order[]>([]);
    const [listings, setListings] = useState<PhoneInventory[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [listingsLoading, setListingsLoading] = useState(true);

    // Settings state
    const [settingsData, setSettingsData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone_number: user?.phone_number || '',
        password: '',
    });
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (user) {
            setSettingsData({
                name: user.name,
                email: user.email,
                phone_number: user.phone_number || '',
                password: '',
            });
        }
    }, [user]);

    useEffect(() => {
        if (isAuthenticated && token) {
            fetchOrders();
            fetchListings();
        }
    }, [isAuthenticated, token]);

    const fetchOrders = async () => {
        try {
            const response = await api.get<Order[]>('/orders', token);
            if (response.data) {
                setOrders(response.data);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setOrdersLoading(false);
        }
    };

    const fetchListings = async () => {
        try {
            const response = await api.get<{ items: PhoneInventory[] }>('/phones/my-listings', token);
            if (response.data) {
                setListings(response.data.items);
            }
        } catch (error) {
            console.error('Error fetching listings:', error);
        } finally {
            setListingsLoading(false);
        }
    };

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await api.patch<User>('/auth/me', {
                name: settingsData.name,
                phone_number: settingsData.phone_number,
                password: settingsData.password || undefined
            }, token);

            if (response.error) {
                setMessage({ type: 'error', text: response.error });
            } else {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                setSettingsData(prev => ({ ...prev, password: '' }));
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred.' });
        } finally {
            setUpdating(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="h-4 w-4 text-amber-500" />;
            case 'shipped': return <Truck className="h-4 w-4 text-blue-500" />;
            case 'delivered': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
            case 'cancelled': return <AlertCircle className="h-4 w-4 text-red-500" />;
            default: return <Clock className="h-4 w-4 text-muted-foreground" />;
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-background py-8">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                {/* Profile Header */}
                <div className="flex flex-col md:flex-row items-center gap-6 mb-8 bg-card border rounded-2xl p-6 shadow-sm">
                    <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background shadow-inner">
                        <UserIcon className="h-12 w-12 text-primary" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-3xl font-bold">{user?.name}</h1>
                        <p className="text-muted-foreground">{user?.email}</p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                            <Badge variant="secondary" className="capitalize">{user?.role}</Badge>
                            {user?.is_verified && <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Verified</Badge>}
                        </div>
                    </div>
                    <Button variant="outline" onClick={logout} className="gap-2">
                        <LogOut className="h-4 w-4" />
                        {t.nav_logout}
                    </Button>
                </div>

                <Tabs defaultValue="orders" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 h-12 bg-muted/50 p-1 rounded-xl">
                        <TabsTrigger value="orders" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Package className="h-4 w-4 mr-2" />
                            My Orders
                        </TabsTrigger>
                        <TabsTrigger value="listings" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Smartphone className="h-4 w-4 mr-2" />
                            My Listings
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab 1: My Orders */}
                    <TabsContent value="orders">
                        <div className="space-y-4">
                            {ordersLoading ? (
                                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                            ) : orders.length === 0 ? (
                                <Card><CardContent className="p-12 text-center text-muted-foreground">No orders yet.</CardContent></Card>
                            ) : (
                                orders.map(order => (
                                    <Card key={order.id} className="overflow-hidden">
                                        <div className="bg-muted/30 p-4 border-b flex justify-between items-center flex-wrap gap-2">
                                            <div className="flex gap-4">
                                                <div>
                                                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Order #</p>
                                                    <p className="text-sm font-mono">{order.order_number}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Date</p>
                                                    <p className="text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="gap-2 bg-background">
                                                {getStatusIcon(order.status)}
                                                <span className="capitalize">{order.status}</span>
                                            </Badge>
                                        </div>
                                        <CardContent className="p-4">
                                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                                <div className="space-y-4 flex-1">
                                                    {order.items.map(item => (
                                                        <div key={item.id} className="flex gap-4 items-center">
                                                            <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                                                                <Smartphone className="h-6 w-6 text-muted-foreground" />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-sm">{item.phone_brand} {item.phone_model}</p>
                                                                <p className="text-xs text-muted-foreground">{item.phone_storage_gb}GB • {item.phone_color}</p>
                                                            </div>
                                                            <p className="ml-auto font-bold">{formatPrice(item.price_at_purchase)}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="md:w-48 pt-4 md:pt-0 md:border-l md:pl-6 flex flex-col justify-between">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
                                                        <p className="text-xl font-bold text-primary">{formatPrice(order.total_amount)}</p>
                                                    </div>
                                                    <Button variant="outline" size="sm" className="mt-4 w-full">Track Order</Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    {/* Tab 2: My Listings */}
                    <TabsContent value="listings">
                        <div className="grid sm:grid-cols-2 gap-4">
                            {listingsLoading ? (
                                <div className="col-span-full flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                            ) : listings.length === 0 ? (
                                <Card className="col-span-full"><CardContent className="p-12 text-center text-muted-foreground">You haven't listed any phones yet.</CardContent></Card>
                            ) : (
                                listings.map(phone => (
                                    <Card key={phone.id}>
                                        <CardContent className="p-4 flex gap-4">
                                            <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                {phone.images ? (
                                                    <img src={phone.images.startsWith('http') ? phone.images : `${BACKEND_URL}${phone.images}`} className="w-full h-full object-cover rounded-lg" />
                                                ) : (
                                                    <Smartphone className="h-10 w-10 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold truncate">{phone.brand} {phone.model}</h3>
                                                <p className="text-xs text-muted-foreground mb-2">{formatPrice(phone.price)}</p>
                                                <div className="flex gap-2">
                                                    {phone.admin_approved ? (
                                                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Approved</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-amber-500 border-amber-500/20">Pending</Badge>
                                                    )}
                                                    {phone.is_sold && <Badge className="bg-slate-500">Sold</Badge>}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    {/* Tab 3: Settings */}
                    <TabsContent value="settings">
                        <Card>
                            <CardHeader>
                                <CardTitle>Update Profile</CardTitle>
                                <CardDescription>Update your personal information and password.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleUpdateSettings} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Full Name</label>
                                            <Input
                                                value={settingsData.name}
                                                onChange={e => setSettingsData({ ...settingsData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Email (read-only)</label>
                                            <Input value={settingsData.email} disabled className="opacity-60" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Phone Number</label>
                                            <Input
                                                value={settingsData.phone_number}
                                                onChange={e => setSettingsData({ ...settingsData, phone_number: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">New Password</label>
                                            <Input
                                                type="password"
                                                placeholder="Leave blank to keep current"
                                                value={settingsData.password}
                                                onChange={e => setSettingsData({ ...settingsData, password: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {message.text && (
                                        <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                            <AlertCircle className="h-4 w-4" />
                                            {message.text}
                                        </div>
                                    )}

                                    <Button type="submit" disabled={updating} className="w-full md:w-auto px-8">
                                        {updating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : 'Save Changes'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
