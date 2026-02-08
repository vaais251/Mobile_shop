'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Users,
    UserPlus,
    Shield,
    Activity,
    CheckCircle,
    XCircle,
    Loader2,
    Settings,
    Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TeamMember {
    id: number;
    user_id: number;
    role: string;
    department: string;
    can_approve_listings: boolean;
    can_manage_orders: boolean;
    can_view_analytics: boolean;
    can_manage_inventory: boolean;
    can_handle_support: boolean;
    can_manage_team: boolean;
    can_process_commissions: boolean;
    can_manage_prices: boolean;
    is_active: boolean;
    total_orders_processed: number;
    total_listings_approved: number;
    total_tickets_resolved: number;
    hired_at: string;
    user: {
        id: number;
        name: string;
        email: string;
        phone_number: string;
    };
}

interface User {
    id: number;
    name: string;
    email: string;
}

const TEAM_ROLES = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'product_manager', label: 'Product Manager' },
    { value: 'customer_service', label: 'Customer Service' },
    { value: 'finance_manager', label: 'Finance Manager' },
    { value: 'warehouse_manager', label: 'Warehouse Manager' },
];

const DEPARTMENTS = [
    { value: 'management', label: 'Management' },
    { value: 'product', label: 'Product' },
    { value: 'customer_support', label: 'Customer Support' },
    { value: 'finance', label: 'Finance' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'marketing', label: 'Marketing' },
];

export default function TeamManagementPage() {
    const router = useRouter();
    const { user, token } = useAuth();
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        user_id: '',
        role: '',
        department: '',
        can_approve_listings: false,
        can_manage_orders: false,
        can_view_analytics: false,
        can_manage_inventory: false,
        can_handle_support: false,
        can_manage_team: false,
        can_process_commissions: false,
        can_manage_prices: false,
    });

    // Check admin access
    useEffect(() => {
        if (user && user.role !== 'admin') {
            router.push('/');
        }
    }, [user, router]);

    // Fetch team members
    const fetchTeamMembers = async () => {
        if (!token) return;

        setLoading(true);
        try {
            const response = await api.get<TeamMember[]>('/admin/team', token);
            // Ensure we always set an array, even if API returns unexpected data
            if (response.data && Array.isArray(response.data)) {
                setTeamMembers(response.data);
            } else {
                console.error('Invalid team members data:', response.data);
                setTeamMembers([]);
            }
        } catch (error) {
            console.error('Error fetching team members:', error);
            setTeamMembers([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch available users
    const fetchUsers = async () => {
        if (!token) return;

        try {
            const response = await api.get<User[]>('/admin/users', token);
            if (response.data) {
                setUsers(response.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchTeamMembers();
            fetchUsers();
        }
    }, [user, token]);

    const handleAddMember = async () => {
        if (!token) return;

        setSaving(true);
        try {
            await api.post('/admin/team', formData, token);
            setShowAddDialog(false);
            resetForm();
            fetchTeamMembers();
        } catch (error) {
            console.error('Error adding team member:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateMember = async () => {
        if (!token || !selectedMember) return;

        setSaving(true);
        try {
            await api.patch(`/admin/team/${selectedMember.id}`, formData, token);
            setShowEditDialog(false);
            setSelectedMember(null);
            resetForm();
            fetchTeamMembers();
        } catch (error) {
            console.error('Error updating team member:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async (memberId: number) => {
        if (!token || !confirm('Are you sure you want to deactivate this team member?')) return;

        try {
            await api.delete(`/admin/team/${memberId}`, token);
            fetchTeamMembers();
        } catch (error) {
            console.error('Error deactivating team member:', error);
        }
    };

    const openEditDialog = (member: TeamMember) => {
        setSelectedMember(member);
        setFormData({
            user_id: member.user_id.toString(),
            role: member.role,
            department: member.department,
            can_approve_listings: member.can_approve_listings,
            can_manage_orders: member.can_manage_orders,
            can_view_analytics: member.can_view_analytics,
            can_manage_inventory: member.can_manage_inventory,
            can_handle_support: member.can_handle_support,
            can_manage_team: member.can_manage_team,
            can_process_commissions: member.can_process_commissions,
            can_manage_prices: member.can_manage_prices,
        });
        setShowEditDialog(true);
    };

    const resetForm = () => {
        setFormData({
            user_id: '',
            role: '',
            department: '',
            can_approve_listings: false,
            can_manage_orders: false,
            can_view_analytics: false,
            can_manage_inventory: false,
            can_handle_support: false,
            can_manage_team: false,
            can_process_commissions: false,
            can_manage_prices: false,
        });
    };

    const getRoleBadgeColor = (role: string) => {
        const colors: Record<string, string> = {
            super_admin: 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30',
            product_manager: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
            customer_service: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
            finance_manager: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
            warehouse_manager: 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30',
        };
        return colors[role] || 'bg-gray-500/20 text-gray-700 border-gray-500/30';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                            Team Management
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Manage team members, roles, and permissions
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowAddDialog(true)}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
                    >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Team Member
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-emerald-100 text-sm">Total Members</p>
                                    <p className="text-3xl font-bold mt-2">{teamMembers.length}</p>
                                </div>
                                <Users className="h-12 w-12 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm">Active Members</p>
                                    <p className="text-3xl font-bold mt-2">
                                        {Array.isArray(teamMembers) ? teamMembers.filter(m => m.is_active).length : 0}
                                    </p>
                                </div>
                                <CheckCircle className="h-12 w-12 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm">Total Activity</p>
                                    <p className="text-3xl font-bold mt-2">
                                        {Array.isArray(teamMembers) ? teamMembers.reduce((sum, m) =>
                                            sum + m.total_orders_processed + m.total_listings_approved, 0
                                        ) : 0}
                                    </p>
                                </div>
                                <Activity className="h-12 w-12 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Team Members Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {!Array.isArray(teamMembers) || teamMembers.length === 0 ? (
                        <Card className="col-span-full">
                            <CardContent className="p-12 text-center">
                                <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                <p className="text-gray-600 dark:text-gray-400">
                                    No team members yet. Click "Add Team Member" to get started.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        teamMembers.map((member) => (
                            <Card
                                key={member.id}
                                className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                                                {member.user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{member.user.name}</CardTitle>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {member.user.email}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className={getRoleBadgeColor(member.role)}>
                                            {member.role.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Department */}
                                    <div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Department</p>
                                        <Badge variant="secondary">
                                            {member.department.replace('_', ' ')}
                                        </Badge>
                                    </div>

                                    {/* Permissions */}
                                    <div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Permissions</p>
                                        <div className="flex flex-wrap gap-1">
                                            {member.can_approve_listings && (
                                                <Badge variant="outline" className="text-xs">Approve</Badge>
                                            )}
                                            {member.can_manage_orders && (
                                                <Badge variant="outline" className="text-xs">Orders</Badge>
                                            )}
                                            {member.can_view_analytics && (
                                                <Badge variant="outline" className="text-xs">Analytics</Badge>
                                            )}
                                            {member.can_manage_inventory && (
                                                <Badge variant="outline" className="text-xs">Inventory</Badge>
                                            )}
                                            {member.can_process_commissions && (
                                                <Badge variant="outline" className="text-xs">Commissions</Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Activity Stats */}
                                    <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                                        <div className="text-center">
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Orders</p>
                                            <p className="text-lg font-bold">{member.total_orders_processed}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Listings</p>
                                            <p className="text-lg font-bold">{member.total_listings_approved}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Tickets</p>
                                            <p className="text-lg font-bold">{member.total_tickets_resolved}</p>
                                        </div>
                                    </div>

                                    {/* Status & Actions */}
                                    <div className="flex items-center justify-between pt-2">
                                        {member.is_active ? (
                                            <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Active
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-gray-500/20 text-gray-700 border-gray-500/30">
                                                <XCircle className="h-3 w-3 mr-1" />
                                                Inactive
                                            </Badge>
                                        )}
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEditDialog(member)}
                                            >
                                                <Settings className="h-4 w-4" />
                                            </Button>
                                            {member.is_active && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeactivate(member.id)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Add Member Dialog */}
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add Team Member</DialogTitle>
                            <DialogDescription>
                                Add a new team member and configure their role and permissions
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            {/* User Selection */}
                            <div>
                                <Label>Select User</Label>
                                <Select
                                    value={formData.user_id}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, user_id: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose user" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map((u) => (
                                            <SelectItem key={u.id} value={u.id.toString()}>
                                                {u.name} ({u.email})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Role */}
                            <div>
                                <Label>Role</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, role: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TEAM_ROLES.map((role) => (
                                            <SelectItem key={role.value} value={role.value}>
                                                {role.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Department */}
                            <div>
                                <Label>Department</Label>
                                <Select
                                    value={formData.department}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, department: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DEPARTMENTS.map((dept) => (
                                            <SelectItem key={dept.value} value={dept.value}>
                                                {dept.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Permissions */}
                            <div>
                                <Label className="mb-3 block">Permissions</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { key: 'can_approve_listings', label: 'Approve Listings' },
                                        { key: 'can_manage_orders', label: 'Manage Orders' },
                                        { key: 'can_view_analytics', label: 'View Analytics' },
                                        { key: 'can_manage_inventory', label: 'Manage Inventory' },
                                        { key: 'can_handle_support', label: 'Handle Support' },
                                        { key: 'can_manage_team', label: 'Manage Team' },
                                        { key: 'can_process_commissions', label: 'Process Commissions' },
                                        { key: 'can_manage_prices', label: 'Manage Prices' },
                                    ].map((perm) => (
                                        <div key={perm.key} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id={perm.key}
                                                checked={formData[perm.key as keyof typeof formData] as boolean}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        [perm.key]: e.target.checked,
                                                    })
                                                }
                                                className="h-4 w-4"
                                            />
                                            <Label htmlFor={perm.key} className="cursor-pointer">
                                                {perm.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddMember} disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    'Add Member'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Member Dialog */}
                <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Team Member</DialogTitle>
                            <DialogDescription>
                                Update role, department, and permissions for {selectedMember?.user.name}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            {/* Role */}
                            <div>
                                <Label>Role</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, role: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TEAM_ROLES.map((role) => (
                                            <SelectItem key={role.value} value={role.value}>
                                                {role.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Department */}
                            <div>
                                <Label>Department</Label>
                                <Select
                                    value={formData.department}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, department: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DEPARTMENTS.map((dept) => (
                                            <SelectItem key={dept.value} value={dept.value}>
                                                {dept.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Permissions */}
                            <div>
                                <Label className="mb-3 block">Permissions</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { key: 'can_approve_listings', label: 'Approve Listings' },
                                        { key: 'can_manage_orders', label: 'Manage Orders' },
                                        { key: 'can_view_analytics', label: 'View Analytics' },
                                        { key: 'can_manage_inventory', label: 'Manage Inventory' },
                                        { key: 'can_handle_support', label: 'Handle Support' },
                                        { key: 'can_manage_team', label: 'Manage Team' },
                                        { key: 'can_process_commissions', label: 'Process Commissions' },
                                        { key: 'can_manage_prices', label: 'Manage Prices' },
                                    ].map((perm) => (
                                        <div key={perm.key} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id={`edit-${perm.key}`}
                                                checked={formData[perm.key as keyof typeof formData] as boolean}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        [perm.key]: e.target.checked,
                                                    })
                                                }
                                                className="h-4 w-4"
                                            />
                                            <Label htmlFor={`edit-${perm.key}`} className="cursor-pointer">
                                                {perm.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpdateMember} disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Member'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
