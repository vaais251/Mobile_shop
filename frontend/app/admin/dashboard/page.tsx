'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { PhoneInventory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatPrice, PHONE_BRANDS, PHONE_CONDITIONS, PHONE_COLORS } from '@/lib/utils';
import {
    Smartphone,
    CheckCircle,
    Trash2,
    Users,
    Clock,
    Package,
    TrendingUp,
    Loader2,
    ShieldCheck,
    Ban,
    PlusCircle,
    Eye,
    Phone,
    MapPin,
    MessageSquare,
    Edit2,
    Save,
} from 'lucide-react';

interface Stats {
    total_users: number;
    pending_approvals: number;
    total_orders: number;
}

export default function AdminDashboard() {
    const { user, isAdmin, token, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [phones, setPhones] = useState<PhoneInventory[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [selectedPhone, setSelectedPhone] = useState<PhoneInventory | null>(null);
    const [editingPhone, setEditingPhone] = useState<PhoneInventory | null>(null);
    const [editFormData, setEditFormData] = useState<any>(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            if (!isAdmin) {
                router.push('/');
            } else {
                fetchDashboardData();
            }
        }
    }, [authLoading, isAdmin, router]);

    const fetchDashboardData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [phonesRes, statsRes] = await Promise.all([
                api.get<{ items: PhoneInventory[] }>('/admin/phones', token),
                api.get<Stats>('/admin/stats', token),
            ]);

            if (phonesRes.data) setPhones(phonesRes.data.items);
            if (statsRes.data) setStats(statsRes.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (phoneId: number) => {
        if (!token) return;
        setActionLoading(phoneId);
        try {
            const res = await api.patch(`/admin/phones/${phoneId}/approve`, {}, token);
            if (!res.error) {
                setPhones(phones.map(p => p.id === phoneId ? { ...p, admin_approved: true } : p));
                setStats(prev => prev ? { ...prev, pending_approvals: prev.pending_approvals - 1 } : null);
            }
        } catch (error) {
            console.error('Error approving phone:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (phoneId: number) => {
        if (!token || !confirm('Are you sure you want to delete this listing?')) return;
        setActionLoading(phoneId);
        try {
            const res = await api.delete(`/admin/phones/${phoneId}`, token);
            if (!res.error) {
                setPhones(phones.filter(p => p.id !== phoneId));
                // Refresh stats if necessary
            }
        } catch (error) {
            console.error('Error deleting phone:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleEditClick = (phone: PhoneInventory) => {
        setEditingPhone(phone);
        setSelectedPhone(null); // Close view dialog if open
        setEditFormData({
            brand: phone.brand,
            model: phone.model,
            storage_gb: phone.storage_gb,
            ram_gb: phone.ram_gb,
            camera_mp: phone.camera_mp,
            color: phone.color,
            price: Number(phone.price),
            original_price: phone.original_price ? Number(phone.original_price) : undefined,
            condition_grade: phone.condition_grade,
            condition_category: phone.condition_category,
            battery_health: phone.battery_health,
            battery_mah: phone.battery_mah,
            warranty_months: phone.warranty_months,
            defects: phone.defects || '',
            accessories_included: phone.accessories_included || '',
            seller_phone: phone.seller_phone || '',
            seller_city: phone.seller_city || '',
            pta_approved: phone.pta_approved,
        });
    };

    const handleUpdatePhone = async () => {
        if (!editingPhone || !token) return;
        setUpdating(true);
        try {
            const res = await api.patch<PhoneInventory>(
                `/admin/phones/${editingPhone.id}`,
                editFormData,
                token
            );
            if (!res.error) {
                setPhones(phones.map(p => p.id === editingPhone.id ? { ...p, ...res.data } : p));
                setEditingPhone(null);
            }
        } catch (error) {
            console.error('Error updating phone:', error);
        } finally {
            setUpdating(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!isAdmin) return null;

    // Helper function to render phone table
    const renderPhoneTable = (phoneList: PhoneInventory[]) => (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">Thumbnail</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {phoneList.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                No phones found in this category.
                            </TableCell>
                        </TableRow>
                    ) : (
                        phoneList.map((phone) => (
                            <TableRow key={phone.id}>
                                <TableCell>
                                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                        <Smartphone className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                    <div>{phone.brand} {phone.model}</div>
                                    <div className="text-xs text-muted-foreground">{phone.storage_gb}GB • {phone.color}</div>
                                </TableCell>
                                <TableCell>{formatPrice(Number(phone.price))}</TableCell>
                                <TableCell>
                                    {phone.seller?.name || (
                                        <Badge variant="outline" className="text-primary border-primary/20">Official Shop</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {!phone.admin_approved ? (
                                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                                            Pending
                                        </Badge>
                                    ) : phone.is_sold ? (
                                        <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/20">
                                            Sold
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                            Approved
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-primary hover:text-primary/80 hover:bg-primary/10"
                                            onClick={() => setSelectedPhone(phone)}
                                        >
                                            <Eye className="h-4 w-4" />
                                            <span className="ml-2 hidden sm:inline">View</span>
                                        </Button>
                                        {!phone.admin_approved && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                                                onClick={() => handleApprove(phone.id)}
                                                disabled={actionLoading === phone.id}
                                            >
                                                {actionLoading === phone.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="h-4 w-4" />
                                                )}
                                                <span className="ml-2 hidden sm:inline">Approve</span>
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-indigo-500 hover:text-indigo-600 hover:bg-indigo-500/10"
                                            onClick={() => handleEditClick(phone)}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                            <span className="ml-2 hidden sm:inline">Edit</span>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                            onClick={() => handleDelete(phone.id)}
                                            disabled={actionLoading === phone.id}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="ml-2 hidden sm:inline">Delete</span>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Manage inventory, approvals, and system stats.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/admin/add-phone">
                        <Button className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white">
                            <PlusCircle className="h-4 w-4" />
                            Add New Phone
                        </Button>
                    </Link>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 mb-8">
                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total_orders || 0}</div>
                        <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-500">{stats?.pending_approvals || 0}</div>
                        <p className="text-xs text-muted-foreground">Needs review</p>
                    </CardContent>
                </Card>
                <Link href="/admin/users">
                    <Card className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Users</CardTitle>
                            <Users className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
                            <p className="text-xs text-muted-foreground">Manage →</p>
                        </CardContent>
                    </Card>
                </Link>
                <Card className="bg-card border-border bg-gradient-to-br from-primary/5 to-primary/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Shop Phones</CardTitle>
                        <Smartphone className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{phones.filter(p => !p.seller_id).length}</div>
                        <p className="text-xs text-muted-foreground">Shop inventory</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border bg-gradient-to-br from-cyan-500/5 to-cyan-500/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Community</CardTitle>
                        <Smartphone className="h-4 w-4 text-cyan-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-cyan-500">{phones.filter(p => !!p.seller_id).length}</div>
                        <p className="text-xs text-muted-foreground">User listings</p>
                    </CardContent>
                </Card>
                <Link href="/admin/messages">
                    <Card className="bg-card border-border hover:border-violet-500/50 transition-all cursor-pointer h-full bg-gradient-to-br from-violet-500/5 to-violet-500/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Messages</CardTitle>
                            <MessageSquare className="h-4 w-4 text-violet-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-violet-500">View</div>
                            <p className="text-xs text-muted-foreground">Inbox →</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Inventory Management with Tabs */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Inventory Management
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                            <TabsTrigger value="all" className="gap-2">
                                <Package className="h-4 w-4" />
                                All ({phones.length})
                            </TabsTrigger>
                            <TabsTrigger value="shop" className="gap-2">
                                <ShieldCheck className="h-4 w-4" />
                                Shop ({phones.filter(p => !p.seller_id).length})
                            </TabsTrigger>
                            <TabsTrigger value="community" className="gap-2">
                                <Users className="h-4 w-4" />
                                Community ({phones.filter(p => !!p.seller_id).length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="all">
                            {renderPhoneTable(phones)}
                        </TabsContent>

                        <TabsContent value="shop">
                            {renderPhoneTable(phones.filter(p => !p.seller_id))}
                        </TabsContent>

                        <TabsContent value="community">
                            {renderPhoneTable(phones.filter(p => !!p.seller_id))}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Phone Detail Dialog */}
            <Dialog open={!!selectedPhone} onOpenChange={() => setSelectedPhone(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-950 border-2 shadow-2xl">
                    <DialogHeader className="border-b border-border pb-4 bg-white dark:bg-slate-950">
                        <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">Phone Listing Details</DialogTitle>
                        <DialogDescription className="text-gray-600 dark:text-gray-400">
                            Review complete information before approval
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPhone && (
                        <div className="space-y-6 py-4 bg-white dark:bg-slate-950">
                            {/* Images Section */}
                            {selectedPhone.images && (
                                <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
                                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                        <Package className="h-5 w-5 text-violet-600" />
                                        Product Images
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {(() => {
                                            try {
                                                console.log('Raw images data:', selectedPhone.images);
                                                const imageArray = JSON.parse(selectedPhone.images as string);
                                                console.log('Parsed image array:', imageArray);

                                                if (!imageArray || imageArray.length === 0) {
                                                    return (
                                                        <div className="col-span-full text-center text-gray-500 py-8 bg-gray-100 dark:bg-slate-800 rounded-lg">
                                                            No images uploaded for this listing
                                                        </div>
                                                    );
                                                }

                                                return imageArray.map((img: string, index: number) => {
                                                    // Prepend backend URL if the path is relative
                                                    const imageUrl = img.startsWith('http') ? img : `http://localhost:8000${img}`;
                                                    console.log(`Image ${index}:`, imageUrl);

                                                    return (
                                                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-300 dark:border-slate-700 bg-gray-200 dark:bg-slate-800">
                                                            <img
                                                                src={imageUrl}
                                                                alt={`${selectedPhone.brand} ${selectedPhone.model} - Image ${index + 1}`}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    console.error('Image load error:', imageUrl);
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.style.display = 'none';
                                                                    const parent = target.parentElement;
                                                                    if (parent) {
                                                                        parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-slate-700 text-gray-600 dark:text-gray-400"><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                                                                    }
                                                                }}
                                                            />
                                                            {index === 0 && (
                                                                <Badge className="absolute top-2 left-2 bg-violet-600 text-white font-semibold">
                                                                    Thumbnail
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    );
                                                });
                                            } catch (e) {
                                                console.error('Image parsing error:', e);
                                                return (
                                                    <div className="col-span-full text-center text-amber-600 py-8 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                                        ⚠️ Unable to load images (invalid format)
                                                    </div>
                                                );
                                            }
                                        })()}
                                    </div>
                                </div>
                            )}

                            {/* Basic Info */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
                                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                        <Smartphone className="h-5 w-5 text-violet-600" />
                                        Phone Details
                                    </h3>
                                    <dl className="space-y-2 text-sm">
                                        <div className="flex justify-between py-2 border-b border-gray-300 dark:border-slate-700">
                                            <dt className="text-gray-600 dark:text-gray-400 font-medium">Brand</dt>
                                            <dd className="font-semibold text-gray-900 dark:text-gray-100">{selectedPhone.brand}</dd>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-gray-300 dark:border-slate-700">
                                            <dt className="text-gray-600 dark:text-gray-400 font-medium">Model</dt>
                                            <dd className="font-semibold text-gray-900 dark:text-gray-100">{selectedPhone.model}</dd>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-gray-300 dark:border-slate-700">
                                            <dt className="text-gray-600 dark:text-gray-400 font-medium">Storage</dt>
                                            <dd className="font-semibold text-gray-900 dark:text-gray-100">{selectedPhone.storage_gb}GB</dd>
                                        </div>
                                        {selectedPhone.ram_gb && (
                                            <div className="flex justify-between py-2 border-b border-gray-300 dark:border-slate-700">
                                                <dt className="text-gray-600 dark:text-gray-400 font-medium">RAM</dt>
                                                <dd className="font-semibold text-gray-900 dark:text-gray-100">{selectedPhone.ram_gb}GB</dd>
                                            </div>
                                        )}
                                        {selectedPhone.camera_mp && (
                                            <div className="flex justify-between py-2 border-b border-gray-300 dark:border-slate-700">
                                                <dt className="text-gray-600 dark:text-gray-400 font-medium">Camera</dt>
                                                <dd className="font-semibold text-gray-900 dark:text-gray-100">{selectedPhone.camera_mp}MP</dd>
                                            </div>
                                        )}
                                        <div className="flex justify-between py-2 border-b border-gray-300 dark:border-slate-700">
                                            <dt className="text-gray-600 dark:text-gray-400 font-medium">Color</dt>
                                            <dd className="font-semibold text-gray-900 dark:text-gray-100">{selectedPhone.color}</dd>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <dt className="text-gray-600 dark:text-gray-400 font-medium">PTA Approved</dt>
                                            <dd>
                                                {selectedPhone.pta_approved ? (
                                                    <Badge variant="outline" className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 font-semibold">
                                                        ✓ Yes
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-slate-500/20 text-slate-600 border-slate-500/30">
                                                        ✗ No
                                                    </Badge>
                                                )}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>

                                <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
                                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                        <CheckCircle className="h-5 w-5 text-violet-600" />
                                        Condition & Price
                                    </h3>
                                    <dl className="space-y-2 text-sm">
                                        <div className="flex justify-between py-2 border-b border-gray-300 dark:border-slate-700">
                                            <dt className="text-gray-600 dark:text-gray-400 font-medium">Condition Grade</dt>
                                            <dd className="font-bold text-lg text-violet-600">{selectedPhone.condition_grade}/10</dd>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-gray-300 dark:border-slate-700">
                                            <dt className="text-gray-600 dark:text-gray-400 font-medium">Category</dt>
                                            <dd className="font-semibold text-gray-900 dark:text-gray-100 capitalize">{selectedPhone.condition_category}</dd>
                                        </div>
                                        {selectedPhone.battery_health && (
                                            <div className="flex justify-between py-2 border-b border-gray-300 dark:border-slate-700">
                                                <dt className="text-gray-600 dark:text-gray-400 font-medium">Battery Health</dt>
                                                <dd className="font-semibold text-gray-900 dark:text-gray-100">{selectedPhone.battery_health}%</dd>
                                            </div>
                                        )}
                                        <div className="flex justify-between py-2 border-b border-gray-300 dark:border-slate-700">
                                            <dt className="text-gray-600 dark:text-gray-400 font-medium">Warranty</dt>
                                            <dd className="font-semibold text-gray-900 dark:text-gray-100">{selectedPhone.warranty_months || 0} months</dd>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-gray-300 dark:border-slate-700">
                                            <dt className="text-gray-600 dark:text-gray-400 font-medium">Price</dt>
                                            <dd className="font-bold text-xl text-violet-600">{formatPrice(Number(selectedPhone.price))}</dd>
                                        </div>
                                        {selectedPhone.original_price && (
                                            <div className="flex justify-between py-2">
                                                <dt className="text-gray-600 dark:text-gray-400 font-medium">Original Price</dt>
                                                <dd className="text-gray-500 line-through">{formatPrice(Number(selectedPhone.original_price))}</dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>
                            </div>

                            {/* Seller Information */}
                            <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
                                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                    <Users className="h-5 w-5 text-violet-600" />
                                    Seller Information
                                </h3>
                                <div className="space-y-3">
                                    {selectedPhone.seller ? (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Name:</span>
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedPhone.seller.name}</span>
                                            </div>
                                            {selectedPhone.seller.email && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Email:</span>
                                                    <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedPhone.seller.email}</span>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <Badge variant="outline" className="text-violet-600 border-violet-300 bg-violet-50 dark:bg-violet-900/20 font-semibold">
                                            🏪 Official Shop
                                        </Badge>
                                    )}
                                    {selectedPhone.seller_phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-violet-600" />
                                            <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedPhone.seller_phone}</span>
                                        </div>
                                    )}
                                    {selectedPhone.seller_city && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-violet-600" />
                                            <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedPhone.seller_city}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Additional Info */}
                            {(selectedPhone.defects || selectedPhone.accessories_included) && (
                                <div className="space-y-3">
                                    {selectedPhone.defects && (
                                        <div>
                                            <h4 className="font-semibold text-sm mb-2 text-gray-900 dark:text-gray-100">⚠️ Defects / Issues:</h4>
                                            <p className="text-sm text-gray-900 dark:text-gray-100 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-3">
                                                {selectedPhone.defects}
                                            </p>
                                        </div>
                                    )}
                                    {selectedPhone.accessories_included && (
                                        <div>
                                            <h4 className="font-semibold text-sm mb-2 text-gray-900 dark:text-gray-100">📦 Accessories Included:</h4>
                                            <p className="text-sm text-gray-900 dark:text-gray-100 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700 rounded-lg p-3">
                                                {selectedPhone.accessories_included}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Listing Status & Actions */}
                            <div className="flex items-center justify-between pt-4 border-t-2 border-gray-300 dark:border-slate-700">
                                <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Approval Status:</span>
                                    <div className="mt-1">
                                        {!selectedPhone.admin_approved ? (
                                            <Badge variant="outline" className="bg-amber-500/20 text-amber-700 dark:text-amber-500 border-amber-500/30 font-semibold">
                                                ⏳ Pending Review
                                            </Badge>
                                        ) : selectedPhone.is_sold ? (
                                            <Badge variant="outline" className="bg-slate-500/20 text-slate-700 dark:text-slate-400 border-slate-500/30 font-semibold">
                                                🔒 Sold
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-500 border-emerald-500/30 font-semibold">
                                                ✓ Approved & Active
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {!selectedPhone.admin_approved && (
                                    <Button
                                        onClick={() => {
                                            handleApprove(selectedPhone.id);
                                            setSelectedPhone(null);
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approve Now
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Phone Dialog */}
            <Dialog open={!!editingPhone} onOpenChange={(open) => !open && setEditingPhone(null)}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Edit Phone (Admin)</DialogTitle>
                        <DialogDescription>
                            Edit any phone listing in the system.
                        </DialogDescription>
                    </DialogHeader>

                    {editFormData && (
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="brand">Brand</Label>
                                    <Select
                                        value={editFormData.brand}
                                        onValueChange={(v) => setEditFormData({ ...editFormData, brand: v })}
                                    >
                                        <SelectTrigger id="brand">
                                            <SelectValue placeholder="Brand" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PHONE_BRANDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="model">Model</Label>
                                    <Input
                                        id="model"
                                        value={editFormData.model}
                                        onChange={(e) => setEditFormData({ ...editFormData, model: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Price (PKR)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={editFormData.price}
                                        onChange={(e) => setEditFormData({ ...editFormData, price: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="color">Color</Label>
                                    <Input
                                        id="color"
                                        value={editFormData.color}
                                        onChange={(e) => setEditFormData({ ...editFormData, color: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="storage">Storage (GB)</Label>
                                    <Input
                                        id="storage"
                                        type="number"
                                        value={editFormData.storage_gb}
                                        onChange={(e) => setEditFormData({ ...editFormData, storage_gb: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ram">RAM (GB)</Label>
                                    <Input
                                        id="ram"
                                        type="number"
                                        value={editFormData.ram_gb}
                                        onChange={(e) => setEditFormData({ ...editFormData, ram_gb: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="battery_mah">Battery (mAh)</Label>
                                    <Input
                                        id="battery_mah"
                                        type="number"
                                        value={editFormData.battery_mah}
                                        onChange={(e) => setEditFormData({ ...editFormData, battery_mah: Number(e.target.value) })}
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="condition">Condition Grade</Label>
                                    <Select
                                        value={String(editFormData.condition_grade)}
                                        onValueChange={(v) => setEditFormData({ ...editFormData, condition_grade: Number(v) })}
                                    >
                                        <SelectTrigger id="condition">
                                            <SelectValue placeholder="Grade" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[10, 9.5, 9, 8.5, 8, 7.5, 7, 6].map(g => (
                                                <SelectItem key={g} value={String(g)}>{g}/10</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="battery_health">Battery Health (%)</Label>
                                    <Input
                                        id="battery_health"
                                        type="number"
                                        value={editFormData.battery_health}
                                        onChange={(e) => setEditFormData({ ...editFormData, battery_health: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="defects">Defects</Label>
                                <Textarea
                                    id="defects"
                                    value={editFormData.defects}
                                    onChange={(e) => setEditFormData({ ...editFormData, defects: e.target.value })}
                                    placeholder="Enter any defects..."
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingPhone(null)}>Cancel</Button>
                        <Button onClick={handleUpdatePhone} disabled={updating} className="gap-2">
                            {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
