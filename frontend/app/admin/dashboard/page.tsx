'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { PhoneInventory } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
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

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Manage inventory, approvals, and system stats.</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-3 mb-8">
                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total_orders || 0}</div>
                        <p className="text-xs text-muted-foreground">+2 from last month</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.pending_approvals || 0}</div>
                        <p className="text-xs text-muted-foreground">Action required</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
                        <p className="text-xs text-muted-foreground">Registered accounts</p>
                    </CardContent>
                </Card>
            </div>

            {/* Inventory Table */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Inventory Management
                    </CardTitle>
                </CardHeader>
                <CardContent>
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
                                {phones.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                            No phones found in inventory.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    phones.map((phone) => (
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
                </CardContent>
            </Card>
        </div>
    );
}
