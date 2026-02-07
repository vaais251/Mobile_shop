'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Users,
    Trash2,
    Key,
    Loader2,
    ShieldCheck,
    Shield,
    User,
    Search,
    ArrowLeft,
    Mail,
    Calendar,
    AlertTriangle,
    Eye,
    Phone,
    MapPin,
    MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

interface UserInfo {
    id: number;
    name: string;
    email: string;
    phone_number?: string;
    city?: string;
    role: 'buyer' | 'seller' | 'admin';
    is_verified: boolean;
    created_at: string;
}

export default function AdminUsersPage() {
    const { isAdmin, token, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [users, setUsers] = useState<UserInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');

    // Dialog states
    const [deleteDialog, setDeleteDialog] = useState<UserInfo | null>(null);
    const [passwordDialog, setPasswordDialog] = useState<UserInfo | null>(null);
    const [viewDialog, setViewDialog] = useState<UserInfo | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        if (!authLoading) {
            if (!isAdmin) {
                router.push('/');
            } else {
                fetchUsers();
            }
        }
    }, [authLoading, isAdmin, router]);

    const fetchUsers = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await api.get<UserInfo[]>('/admin/users', token);
            if (response.data) {
                setUsers(response.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!token || !deleteDialog) return;
        setActionLoading(deleteDialog.id);
        try {
            const res = await api.delete(`/admin/users/${deleteDialog.id}`, token);
            if (!res.error) {
                setUsers(users.filter(u => u.id !== deleteDialog.id));
                setDeleteDialog(null);
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user. Please try again.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleChangePassword = async () => {
        if (!token || !passwordDialog) return;

        if (newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }

        setActionLoading(passwordDialog.id);
        try {
            const res = await api.patch(`/admin/users/${passwordDialog.id}/password`, {
                new_password: newPassword
            }, token);

            if (!res.error) {
                setPasswordDialog(null);
                setNewPassword('');
                alert('Password changed successfully!');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            alert('Failed to change password. Please try again.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleChangeRole = async (userId: number, newRole: string) => {
        if (!token) return;
        setActionLoading(userId);
        try {
            const res = await api.patch<UserInfo>(`/admin/users/${userId}/role?new_role=${newRole}`, {}, token);
            if (res.data) {
                setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as UserInfo['role'] } : u));
            }
        } catch (error) {
            console.error('Error changing role:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return (
                    <Badge className="bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-500/30">
                        <ShieldCheck className="h-3 w-3 mr-1" /> Admin
                    </Badge>
                );
            case 'seller':
                return (
                    <Badge className="bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30">
                        <Shield className="h-3 w-3 mr-1" /> Seller
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                        <User className="h-3 w-3 mr-1" /> Buyer
                    </Badge>
                );
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

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
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/dashboard">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                        <p className="text-muted-foreground">Manage user accounts, roles, and permissions.</p>
                    </div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                    <Users className="h-6 w-6 text-primary" />
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4 mb-8">
                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.length}</div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Admins</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-violet-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sellers</CardTitle>
                        <Shield className="h-4 w-4 text-cyan-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.filter(u => u.role === 'seller').length}</div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Buyers</CardTitle>
                        <User className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.filter(u => u.role === 'buyer').length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admins</SelectItem>
                        <SelectItem value="seller">Sellers</SelectItem>
                        <SelectItem value="buyer">Buyers</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Users Table */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        All Users ({filteredUsers.length})
                    </CardTitle>
                    <CardDescription>
                        Manage user accounts, change roles, reset passwords, or delete accounts.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                            No users found matching your criteria.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <span className="text-sm font-bold text-primary">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">{user.name}</p>
                                                        {user.is_verified && (
                                                            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                                                Verified
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Mail className="h-4 w-4" />
                                                    {user.email}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={user.role}
                                                    onValueChange={(value) => handleChangeRole(user.id, value)}
                                                    disabled={actionLoading === user.id}
                                                >
                                                    <SelectTrigger className="w-[130px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="buyer">Buyer</SelectItem>
                                                        <SelectItem value="seller">Seller</SelectItem>
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                                    <Calendar className="h-4 w-4" />
                                                    {formatDate(user.created_at)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    {/* View Button */}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-primary hover:text-primary/80 hover:bg-primary/10"
                                                        onClick={() => setViewDialog(user)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {/* Password Button */}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                                                        onClick={() => {
                                                            setPasswordDialog(user);
                                                            setNewPassword('');
                                                            setPasswordError('');
                                                        }}
                                                        disabled={actionLoading === user.id}
                                                    >
                                                        <Key className="h-4 w-4" />
                                                    </Button>
                                                    {/* Delete Button */}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                        onClick={() => setDeleteDialog(user)}
                                                        disabled={actionLoading === user.id || user.role === 'admin'}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
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

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 border-2">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Delete User Account
                        </DialogTitle>
                        <DialogDescription className="text-gray-600 dark:text-gray-400">
                            Are you sure you want to delete <strong>{deleteDialog?.name}</strong>'s account?
                            This action cannot be undone and will also delete all their listings.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDeleteDialog(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteUser}
                            disabled={actionLoading === deleteDialog?.id}
                        >
                            {actionLoading === deleteDialog?.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Delete Account
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Change Password Dialog */}
            <Dialog open={!!passwordDialog} onOpenChange={() => setPasswordDialog(null)}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 border-2">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                            <Key className="h-5 w-5 text-amber-500" />
                            Change Password
                        </DialogTitle>
                        <DialogDescription className="text-gray-600 dark:text-gray-400">
                            Set a new password for <strong>{passwordDialog?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            type="password"
                            placeholder="Enter new password (min 6 characters)"
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                                setPasswordError('');
                            }}
                            className={passwordError ? 'border-red-500' : ''}
                        />
                        {passwordError && (
                            <p className="text-sm text-red-500 mt-2">{passwordError}</p>
                        )}
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setPasswordDialog(null)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleChangePassword}
                            disabled={actionLoading === passwordDialog?.id || !newPassword}
                            className="bg-amber-500 hover:bg-amber-600 text-white"
                        >
                            {actionLoading === passwordDialog?.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Key className="h-4 w-4 mr-2" />
                            )}
                            Change Password
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View User Dialog */}
            <Dialog open={!!viewDialog} onOpenChange={() => setViewDialog(null)}>
                <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-950 border-2">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                            <User className="h-5 w-5 text-primary" />
                            User Details
                        </DialogTitle>
                    </DialogHeader>
                    {viewDialog && (
                        <div className="space-y-4 py-4">
                            {/* User Avatar and Name */}
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-primary">
                                        {viewDialog.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{viewDialog.name}</h3>
                                    {getRoleBadge(viewDialog.role)}
                                </div>
                            </div>

                            {/* User Info Grid */}
                            <div className="grid gap-3 bg-gray-50 dark:bg-slate-900 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                                        <Mail className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Email</p>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">{viewDialog.email}</p>
                                    </div>
                                </div>

                                {viewDialog.phone_number && (
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                                            <Phone className="h-5 w-5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Phone</p>
                                            <p className="font-medium text-gray-900 dark:text-gray-100">{viewDialog.phone_number}</p>
                                        </div>
                                    </div>
                                )}

                                {viewDialog.city && (
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                                            <MapPin className="h-5 w-5 text-orange-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">City</p>
                                            <p className="font-medium text-gray-900 dark:text-gray-100">{viewDialog.city}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                                        <Calendar className="h-5 w-5 text-violet-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Joined</p>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(viewDialog.created_at)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                                        <ShieldCheck className="h-5 w-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Verification Status</p>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                            {viewDialog.is_verified ? (
                                                <span className="text-emerald-600">Verified</span>
                                            ) : (
                                                <span className="text-amber-600">Not Verified</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex gap-2 pt-2">
                                <Link
                                    href={`/messages?userId=${viewDialog.id}`}
                                    className="flex-1"
                                >
                                    <Button variant="outline" className="w-full gap-2 text-primary border-primary/30 hover:bg-primary/10">
                                        <MessageSquare className="h-4 w-4" />
                                        Direct Message
                                    </Button>
                                </Link>
                                {viewDialog.phone_number && (
                                    <a
                                        href={`https://wa.me/${viewDialog.phone_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${viewDialog.name}, this is admin from Mobile Store.`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1"
                                    >
                                        <Button variant="outline" className="w-full gap-2 text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/10">
                                            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                            </svg>
                                            WhatsApp
                                        </Button>
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewDialog(null)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
