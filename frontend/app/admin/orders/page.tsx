'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Package,
    MessageCircle,
    CheckCircle2,
    Clock,
    Truck,
    User,
    Phone,
    Mail,
    ShoppingCart,
    TrendingUp,
    Calendar,
    DollarSign,
    Star,
    Loader2,
    MessageSquare,
    Store,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface SellerStats {
    seller_id: number;
    seller_name: string;
    total_listed: number;
    total_sold: number;
    pending_approval: number;
    approved_active: number;
    total_revenue: number;
    avg_rating: number | null;
    join_date: string;
}

interface PhoneDetails {
    ram_gb: number | null;
    camera_mp: number | null;
    battery_health: number | null;
    battery_mah: number | null;
    condition_grade: number;
    defects: string | null;
    accessories_included: string | null;
    images: string | null;
    thumbnail: string | null;
    pta_approved: boolean;
    warranty_months: number;
}

interface OrderItem {
    id: number;
    phone_brand: string;
    phone_model: string;
    phone_storage_gb: number;
    phone_color: string;
    phone_condition: string;
    price_at_purchase: number;
    is_shop_owned: boolean;
    phone_details: PhoneDetails | null;
    seller?: {
        id: number;
        name: string;
        email: string;
        phone_number: string;
        city: string;
    } | null;
}

interface Order {
    id: number;
    order_number: string;
    status: string;
    total_amount: number;
    created_at: string;
    completed_at: string | null;
    can_be_rated: boolean;
    shipping_address: string;
    shipping_city: string;
    shipping_phone: string;
    buyer: {
        id: number;
        name: string;
        email: string;
        phone_number: string;
    };
    items: OrderItem[];
}

export default function AdminOrdersPage() {
    const { user, token } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [sellerStats, setSellerStats] = useState<SellerStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [completingOrder, setCompletingOrder] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [changingStatus, setChangingStatus] = useState(false);

    useEffect(() => {
        // Don't redirect until we know the user is loaded
        if (!user) return;

        if (user.role !== 'admin') {
            router.push('/');
            return;
        }
        fetchOrders();
    }, [user, router]);

    const fetchOrders = async (filter = statusFilter) => {
        try {
            const url = filter === 'all' ? '/admin/orders' : `/admin/orders?status_filter=${filter}`;
            const response = await api.get<{ orders: Order[] }>(url, token ?? undefined);
            if (response.data) {
                setOrders(response.data.orders);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSellerStats = async (sellerId: number) => {
        setLoadingStats(true);
        try {
            const response = await api.get<SellerStats>(`/admin/sellers/${sellerId}/statistics`, token ?? undefined);
            if (response.data) {
                setSellerStats(response.data);
            }
        } catch (error) {
            console.error('Error fetching seller stats:', error);
        } finally {
            setLoadingStats(false);
        }
    };

    const completeOrder = async (orderId: number) => {
        setCompletingOrder(true);
        try {
            await api.post(`/admin/orders/${orderId}/complete`,
                { completion_notes: 'Order fulfilled successfully' },
                token ?? undefined
            );
            // Refresh orders
            await fetchOrders();
            setSelectedOrder(null);
        } catch (error) {
            console.error('Error completing order:', error);
        } finally {
            setCompletingOrder(false);
        }
    };

    const changeOrderStatus = async (orderId: number, newStatus: string) => {
        setChangingStatus(true);
        try {
            await api.patch(`/admin/orders/${orderId}/status?new_status=${newStatus}`, {}, token ?? undefined);
            // Refresh orders
            await fetchOrders();
            // Update selected order if it's open
            if (selectedOrder && selectedOrder.id === orderId) {
                const updated = orders.find(o => o.id === orderId);
                if (updated) setSelectedOrder(updated);
            }
        } catch (error) {
            console.error('Error changing status:', error);
            alert('Failed to change order status');
        } finally {
            setChangingStatus(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { variant: any; icon: any; color: string }> = {
            pending: { variant: 'outline', icon: Clock, color: 'bg-amber-500/20 text-amber-700 dark:text-amber-500 border-amber-500/30' },
            confirmed: { variant: 'outline', icon: CheckCircle2, color: 'bg-blue-500/20 text-blue-700 dark:text-blue-500 border-blue-500/30' },
            processing: { variant: 'outline', icon: Package, color: 'bg-violet-500/20 text-violet-700 dark:text-violet-500 border-violet-500/30' },
            shipped: { variant: 'outline', icon: Truck, color: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-500 border-cyan-500/30' },
            delivered: { variant: 'outline', icon: CheckCircle2, color: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-500 border-emerald-500/30' },
        };

        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className={`${config.color} font-semibold`}>
                <Icon className="h-3 w-3 mr-1" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Order Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage customer orders, contact buyers and sellers, and track fulfillment
                    </p>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
                        {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((filter) => (
                            <Button
                                key={filter}
                                variant={statusFilter === filter ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => {
                                    setStatusFilter(filter);
                                    setLoading(true);
                                    fetchOrders(filter);
                                }}
                                className={statusFilter === filter ? 'bg-violet-600 hover:bg-violet-700 text-white' : ''}
                            >
                                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                <Badge variant="secondary" className="ml-2 text-xs">
                                    {filter === 'all' ? orders.length : orders.filter(o => o.status === filter).length}
                                </Badge>
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Orders List */}
                <div className="space-y-4">
                    {orders.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center text-gray-500">
                                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                No orders yet
                            </CardContent>
                        </Card>
                    ) : (
                        orders.map((order) => (
                            <Card
                                key={order.id}
                                className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-2 border-gray-200 dark:border-gray-800"
                            >
                                {/* Order Header */}
                                <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 p-4 border-b-2 border-gray-200 dark:border-gray-800">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex items-center gap-6">
                                            <div>
                                                <p className="text-xs uppercase text-gray-600 dark:text-gray-400 font-bold">Order #</p>
                                                <p className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
                                                    {order.order_number}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase text-gray-600 dark:text-gray-400 font-bold">Date</p>
                                                <p className="text-sm text-gray-900 dark:text-gray-100">
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase text-gray-600 dark:text-gray-400 font-bold">Total</p>
                                                <p className="text-lg font-bold text-violet-600">
                                                    {formatPrice(order.total_amount)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {getStatusBadge(order.status)}
                                            {order.completed_at && (
                                                <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                    Completed
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <CardContent className="p-6">
                                    {/* Customer Info */}
                                    <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-800">
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                            <User className="h-4 w-4 text-violet-600" />
                                            Customer
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                <User className="h-3 w-3" />
                                                {order.buyer.name}
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                <Mail className="h-3 w-3" />
                                                {order.buyer.email}
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                <Phone className="h-3 w-3" />
                                                {order.buyer.phone_number || 'N/A'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    <div className="space-y-3 mb-4">
                                        {order.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-12 w-12 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-lg flex items-center justify-center">
                                                        <Package className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                            {item.phone_brand} {item.phone_model}
                                                        </p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                                            {item.phone_storage_gb}GB • {item.phone_color}
                                                        </p>
                                                        <div className="mt-1">
                                                            {item.is_shop_owned ? (
                                                                <Badge className="bg-violet-500/20 text-violet-700 dark:text-violet-400 border-violet-500/30 text-xs">
                                                                    Shop Owned
                                                                </Badge>
                                                            ) : (
                                                                <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs">
                                                                    Community Seller
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="font-bold text-gray-900 dark:text-gray-100">
                                                    {formatPrice(item.price_at_purchase)}
                                                </p>
                                            </div>
                                        ))}\r
                                    </div>

                                    {/* Seller Info (for community products) */}
                                    {order.items.some(item => !item.is_shop_owned && item.seller) && (
                                        <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-800">
                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                                <Store className="h-4 w-4 text-emerald-600" />
                                                Community Seller
                                            </h4>
                                            {/* Get unique sellers from items */}
                                            {Array.from(new Set(order.items
                                                .filter(item => !item.is_shop_owned && item.seller)
                                                .map(item => item.seller!.id)))
                                                .map(sellerId => {
                                                    const seller = order.items.find(item => item.seller?.id === sellerId)?.seller;
                                                    if (!seller) return null;
                                                    return (
                                                        <div key={seller.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm mb-2">
                                                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                                <User className="h-3 w-3" />
                                                                {seller.name}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                                <Mail className="h-3 w-3" />
                                                                {seller.email}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                                <Phone className="h-3 w-3" />
                                                                {seller.phone_number || 'N/A'}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            }
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-3">
                                        {/* Contact Customer Button */}
                                        <Button
                                            onClick={() => router.push(`/messages?userId=${order.buyer.id}&orderNumber=${order.order_number}`)}
                                            className="h-11 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-[1.02]"
                                        >
                                            <MessageCircle className="h-4 w-4 mr-2" />
                                            Contact Customer
                                        </Button>

                                        {/* Contact Seller Button (only if community product) */}
                                        {order.items.some(item => !item.is_shop_owned && item.seller) && (
                                            <Button
                                                onClick={() => {
                                                    const seller = order.items.find(item => item.seller)?.seller;
                                                    if (seller) {
                                                        router.push(`/messages?userId=${seller.id}&orderNumber=${order.order_number}`);
                                                    }
                                                }}
                                                className="h-11 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-[1.02]"
                                            >
                                                <MessageSquare className="h-4 w-4 mr-2" />
                                                Contact Seller
                                            </Button>
                                        )}

                                        {/* View Details Button */}
                                        <Button
                                            onClick={() => {
                                                setSelectedOrder(order);
                                                // Fetch seller stats if community product
                                                const communityItem = order.items.find(item => !item.is_shop_owned && item.seller);
                                                if (communityItem?.seller) {
                                                    fetchSellerStats(communityItem.seller.id);
                                                }
                                            }}
                                            variant="outline"
                                            className="h-11 px-5 rounded-xl border-2 border-gray-300 dark:border-gray-700 hover:border-violet-500 dark:hover:border-violet-500 transition-all duration-300"
                                        >
                                            <Package className="h-4 w-4 mr-2" />
                                            View Details
                                        </Button>

                                        {/* Change Status Dropdown */}
                                        <div className="flex items-center gap-2">
                                            <label htmlFor={`status-${order.id}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Status:
                                            </label>
                                            <select
                                                id={`status-${order.id}`}
                                                value={order.status}
                                                onChange={(e) => changeOrderStatus(order.id, e.target.value)}
                                                disabled={changingStatus}
                                                className="h-11 px-4 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all disabled:opacity-50 cursor-pointer"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="confirmed">Confirmed</option>
                                                <option value="shipped">Shipped</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </div>

                                        {/* Complete Order Button */}
                                        {!order.completed_at && (
                                            <Button
                                                onClick={() => completeOrder(order.id)}
                                                disabled={completingOrder}
                                                className="h-11 px-5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
                                            >
                                                {completingOrder ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                                )}
                                                Mark Complete
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Order Detail Dialog */}
                <Dialog open={!!selectedOrder} onOpenChange={() => {
                    setSelectedOrder(null);
                    setSellerStats(null);
                }}>
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-950 border-2 shadow-2xl">
                        <DialogHeader className="border-b border-border pb-4">
                            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                Order Details
                            </DialogTitle>
                            <DialogDescription className="text-gray-600 dark:text-gray-400">
                                Complete order information with customer, product, and seller details
                            </DialogDescription>
                        </DialogHeader>

                        {selectedOrder && (
                            <div className="space-y-6 py-4">
                                {/* Order Summary */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Card>
                                        <CardContent className="p-4">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Order Number</p>
                                            <p className="font-mono font-bold text-gray-900 dark:text-gray-100">
                                                {selectedOrder.order_number}
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</p>
                                            {getStatusBadge(selectedOrder.status)}
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Amount</p>
                                            <p className="text-2xl font-bold text-violet-600">
                                                {formatPrice(selectedOrder.total_amount)}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Customer Information */}
                                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-2">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                                            <User className="h-5 w-5" />
                                            Customer Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Name</p>
                                                <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedOrder.buyer.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Email</p>
                                                <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedOrder.buyer.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Phone</p>
                                                <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedOrder.buyer.phone_number || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">City</p>
                                                <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedOrder.shipping_city || 'Not provided'}</p>
                                            </div>
                                            <div className="md:col-span-2">
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Shipping Address</p>
                                                <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedOrder.shipping_address || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Contact Phone</p>
                                                <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedOrder.shipping_phone || 'Not provided'}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Products */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                        <Package className="h-5 w-5 text-violet-600" />
                                        Order Items
                                    </h3>
                                    <div className="space-y-4">
                                        {selectedOrder.items.map((item) => {
                                            let images: string[] = [];
                                            try {
                                                images = item.phone_details?.images ? JSON.parse(item.phone_details.images) : [];
                                            } catch (e) {
                                                console.warn('Failed to parse product images:', e);
                                            }
                                            const thumbnail = item.phone_details?.thumbnail || (images.length > 0 ? images[0] : null);

                                            return (
                                                <Card key={item.id} className="overflow-hidden border-2">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                                                        {/* Product Image */}
                                                        <div className="md:col-span-1">
                                                            {thumbnail ? (
                                                                <img
                                                                    src={`http://localhost:8000${thumbnail}`}
                                                                    alt={`${item.phone_brand} ${item.phone_model}`}
                                                                    className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="w-full h-48 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-lg flex items-center justify-center">
                                                                    <Package className="h-16 w-16 text-white" />
                                                                </div>
                                                            )}
                                                            {/* Additional Images */}
                                                            {images.length > 1 && (
                                                                <div className="flex gap-2 mt-2 overflow-x-auto">
                                                                    {images.slice(1, 4).map((img: string, idx: number) => (
                                                                        <img
                                                                            key={idx}
                                                                            src={`http://localhost:8000${img}`}
                                                                            alt={`Product ${idx + 2}`}
                                                                            className="w-16 h-16 object-cover rounded border border-gray-300 dark:border-gray-600"
                                                                            onError={(e) => {
                                                                                e.currentTarget.style.display = 'none';
                                                                            }}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Product Details */}
                                                        <div className="md:col-span-2">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div>
                                                                    <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                                                        {item.phone_brand} {item.phone_model}
                                                                    </h4>
                                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                        {item.phone_storage_gb}GB • {item.phone_color}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-2xl font-bold text-violet-600">
                                                                        {formatPrice(item.price_at_purchase)}
                                                                    </p>
                                                                    {item.is_shop_owned ? (
                                                                        <Badge className="bg-violet-500/20 text-violet-700 dark:text-violet-400 border-violet-500/30 mt-1">
                                                                            Shop Owned
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 mt-1">
                                                                            Community Seller
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Specifications */}
                                                            {item.phone_details ? (
                                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                                                                    {item.phone_details.ram_gb && (
                                                                        <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
                                                                            <p className="text-xs text-gray-600 dark:text-gray-400">RAM</p>
                                                                            <p className="font-semibold text-gray-900 dark:text-gray-100">{item.phone_details.ram_gb}GB</p>
                                                                        </div>
                                                                    )}
                                                                    {item.phone_details.camera_mp && (
                                                                        <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
                                                                            <p className="text-xs text-gray-600 dark:text-gray-400">Camera</p>
                                                                            <p className="font-semibold text-gray-900 dark:text-gray-100">{item.phone_details.camera_mp}MP</p>
                                                                        </div>
                                                                    )}
                                                                    {item.phone_details.battery_mah && (
                                                                        <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
                                                                            <p className="text-xs text-gray-600 dark:text-gray-400">Battery</p>
                                                                            <p className="font-semibold text-gray-900 dark:text-gray-100">{item.phone_details.battery_mah}mAh</p>
                                                                        </div>
                                                                    )}
                                                                    {item.phone_details.battery_health !== null && (
                                                                        <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
                                                                            <p className="text-xs text-gray-600 dark:text-gray-400">Battery Health</p>
                                                                            <p className="font-semibold text-gray-900 dark:text-gray-100">{item.phone_details.battery_health}%</p>
                                                                        </div>
                                                                    )}
                                                                    {item.phone_details.condition_grade && (
                                                                        <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
                                                                            <p className="text-xs text-gray-600 dark:text-gray-400">Condition</p>
                                                                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                                                {item.phone_details.condition_grade.toFixed(1)}/10
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                    {item.phone_details.warranty_months > 0 && (
                                                                        <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
                                                                            <p className="text-xs text-gray-600 dark:text-gray-400">Warranty</p>
                                                                            <p className="font-semibold text-gray-900 dark:text-gray-100">{item.phone_details.warranty_months} months</p>
                                                                        </div>
                                                                    )}
                                                                    {item.phone_details.pta_approved && (
                                                                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded">
                                                                            <p className="text-xs text-emerald-600 dark:text-emerald-400">PTA Approved</p>
                                                                            <p className="font-semibold text-emerald-700 dark:text-emerald-300">✓ Yes</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                                                    <p className="text-sm text-amber-700 dark:text-amber-400">
                                                                        ℹ️ Detailed product specifications not available for this order
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* Additional Details */}
                                                            {item.phone_details && (
                                                                <div className="mt-4 space-y-2">
                                                                    {item.phone_details.defects && (
                                                                        <div>
                                                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Defects</p>
                                                                            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                                                                {item.phone_details.defects}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                    {item.phone_details.accessories_included && (
                                                                        <div>
                                                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Accessories Included</p>
                                                                            <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 p-2 rounded">
                                                                                {item.phone_details.accessories_included}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Seller Info (for community products) */}
                                                    {!item.is_shop_owned && item.seller && (
                                                        <div className="border-t-2 border-gray-200 dark:border-gray-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-4">
                                                            <h5 className="text-sm font-bold text-emerald-900 dark:text-emerald-100 mb-3 flex items-center gap-2">
                                                                <Store className="h-4 w-4" />
                                                                Seller Information
                                                            </h5>
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                                <div>
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Name</p>
                                                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{item.seller.name}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Email</p>
                                                                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{item.seller.email}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Phone</p>
                                                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{item.seller.phone_number}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400">City</p>
                                                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{item.seller.city || 'N/A'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Seller Statistics (if available) */}
                                {sellerStats && (
                                    <Card className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border-2 border-violet-200 dark:border-violet-800">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-violet-900 dark:text-violet-100">
                                                <TrendingUp className="h-5 w-5" />
                                                Seller Performance: {sellerStats.seller_name}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-violet-200 dark:border-violet-800">
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Products Listed</p>
                                                    <p className="text-2xl font-bold text-violet-600">{sellerStats.total_listed}</p>
                                                </div>
                                                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-violet-200 dark:border-violet-800">
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Products Sold</p>
                                                    <p className="text-2xl font-bold text-emerald-600">{sellerStats.total_sold}</p>
                                                </div>
                                                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-violet-200 dark:border-violet-800">
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Pending Approval</p>
                                                    <p className="text-2xl font-bold text-amber-600">{sellerStats.pending_approval}</p>
                                                </div>
                                                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-violet-200 dark:border-violet-800">
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Active Listings</p>
                                                    <p className="text-2xl font-bold text-blue-600">{sellerStats.approved_active}</p>
                                                </div>
                                                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-violet-200 dark:border-violet-800">
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
                                                    <p className="text-xl font-bold text-violet-600">{formatPrice(sellerStats.total_revenue)}</p>
                                                </div>
                                                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-violet-200 dark:border-violet-800">
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Rating</p>
                                                    <p className="text-2xl font-bold text-amber-600 flex items-center gap-1">
                                                        <Star className="h-5 w-5 fill-amber-600" />
                                                        {sellerStats.avg_rating?.toFixed(1) || 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-violet-200 dark:border-violet-800 col-span-2">
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Member Since</p>
                                                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                        {new Date(sellerStats.join_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
