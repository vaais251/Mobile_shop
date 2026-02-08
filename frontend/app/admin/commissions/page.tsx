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
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DollarSign,
    TrendingUp,
    CreditCard,
    Package,
    CheckCircle,
    Clock,
    XCircle,
    Loader2,
    Filter,
    Download,
    Edit,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';

interface Commission {
    id: number;
    order_id: number;
    order_item_id: number;
    seller_id: number;
    product_price: string;
    commission_rate: string;
    commission_amount: string;
    platform_revenue: string;
    seller_payout: string;
    status: string;
    paid_at: string | null;
    payment_method: string | null;
    payment_reference: string | null;
    notes: string | null;
    seller: {
        id: number;
        name: string;
        email: string;
        phone_number: string;
    };
}

const PAYMENT_METHODS = [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cash', label: 'Cash' },
    { value: 'check', label: 'Check' },
    { value: 'mobile_money', label: 'Mobile Money' },
];

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
    processing: 'bg-blue-500/20 text-blue-700 border-blue-500/30',
    paid: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30',
    cancelled: 'bg-gray-500/20 text-gray-700 border-gray-500/30',
    disputed: 'bg-red-500/20 text-red-700 border-red-500/30',
};

export default function CommissionsPage() {
    const router = useRouter();
    const { user, token } = useAuth();
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [processing, setProcessing] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Payment form
    const [paymentData, setPaymentData] = useState({
        payment_method: '',
        payment_reference: '',
        notes: '',
    });

    // Edit form
    const [editData, setEditData] = useState({
        commission_rate: '',
        notes: '',
    });

    // Check admin access
    useEffect(() => {
        if (user && user.role !== 'admin') {
            router.push('/');
        }
    }, [user, router]);

    // Fetch commissions
    const fetchCommissions = async () => {
        if (!token) return;

        setLoading(true);
        try {
            let url = '/admin/commissions?';
            if (statusFilter !== 'all') url += `status_filter=${statusFilter}&`;
            if (startDate) url += `start_date=${startDate}&`;
            if (endDate) url += `end_date=${endDate}&`;

            const response = await api.get<Commission[]>(url, token);
            if (response.data) {
                setCommissions(response.data);
            }
        } catch (error) {
            console.error('Error fetching commissions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchCommissions();
        }
    }, [user, token, statusFilter, startDate, endDate]);

    const handlePayCommission = async () => {
        if (!token || !selectedCommission) return;

        setProcessing(true);
        try {
            await api.post(
                `/admin/commissions/${selectedCommission.id}/pay`,
                paymentData,
                token
            );
            setShowPaymentDialog(false);
            setSelectedCommission(null);
            setPaymentData({ payment_method: '', payment_reference: '', notes: '' });
            fetchCommissions();
        } catch (error) {
            console.error('Error processing payment:', error);
        } finally {
            setProcessing(false);
        }
    };

    const handleBulkPayout = async () => {
        if (!token || selectedIds.length === 0) return;
        if (!confirm(`Process ${selectedIds.length} commission payments?`)) return;

        setProcessing(true);
        try {
            await api.post(
                '/admin/commissions/bulk-pay',
                {
                    commission_ids: selectedIds,
                    ...paymentData,
                },
                token
            );
            setSelectedIds([]);
            setPaymentData({ payment_method: '', payment_reference: '', notes: '' });
            fetchCommissions();
        } catch (error) {
            console.error('Error processing bulk payout:', error);
        } finally {
            setProcessing(false);
        }
    };

    const handleEditCommission = async () => {
        if (!token || !selectedCommission) return;

        setProcessing(true);
        try {
            await api.patch(
                `/admin/commissions/${selectedCommission.id}`,
                {
                    commission_rate: parseFloat(editData.commission_rate),
                    notes: editData.notes,
                },
                token
            );
            setShowEditDialog(false);
            setSelectedCommission(null);
            setEditData({ commission_rate: '', notes: '' });
            fetchCommissions();
        } catch (error) {
            console.error('Error updating commission:', error);
        } finally {
            setProcessing(false);
        }
    };

    const openPaymentDialog = (commission: Commission) => {
        setSelectedCommission(commission);
        setShowPaymentDialog(true);
    };

    const openEditDialog = (commission: Commission) => {
        setSelectedCommission(commission);
        setEditData({
            commission_rate: commission.commission_rate,
            notes: commission.notes || '',
        });
        setShowEditDialog(true);
    };

    const toggleSelection = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const pendingCommissions = commissions.filter(c => c.status === 'pending');
    const totalPending = pendingCommissions.reduce(
        (sum, c) => sum + parseFloat(c.commission_amount),
        0
    );
    const totalPaidThisMonth = commissions
        .filter(c => {
            if (!c.paid_at) return false;
            const paidDate = new Date(c.paid_at);
            const now = new Date();
            return (
                paidDate.getMonth() === now.getMonth() &&
                paidDate.getFullYear() === now.getFullYear()
            );
        })
        .reduce((sum, c) => sum + parseFloat(c.commission_amount), 0);

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
                            Commission Tracking
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Manage and process marketplace commission payments
                        </p>
                    </div>
                    {selectedIds.length > 0 && (
                        <Button
                            onClick={handleBulkPayout}
                            disabled={processing}
                            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Pay {selectedIds.length} Selected
                                </>
                            )}
                        </Button>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-violet-100 text-sm">Total Pending</p>
                                    <p className="text-3xl font-bold mt-2">
                                        {formatPrice(totalPending)}
                                    </p>
                                </div>
                                <Clock className="h-12 w-12 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-emerald-100 text-sm">Paid This Month</p>
                                    <p className="text-3xl font-bold mt-2">
                                        {formatPrice(totalPaidThisMonth)}
                                    </p>
                                </div>
                                <CheckCircle className="h-12 w-12 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm">Total Commissions</p>
                                    <p className="text-3xl font-bold mt-2">{commissions.length}</p>
                                </div>
                                <Package className="h-12 w-12 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-100 text-sm">Pending Count</p>
                                    <p className="text-3xl font-bold mt-2">
                                        {pendingCommissions.length}
                                    </p>
                                </div>
                                <TrendingUp className="h-12 w-12 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <Label>Status</Label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="processing">Processing</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="disputed">Disputed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>End Date</Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                            <div className="flex items-end">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setStatusFilter('all');
                                        setStartDate('');
                                        setEndDate('');
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Commissions Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Commission List</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <input
                                            type="checkbox"
                                            checked={
                                                selectedIds.length === pendingCommissions.length &&
                                                pendingCommissions.length > 0
                                            }
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedIds(pendingCommissions.map(c => c.id));
                                                } else {
                                                    setSelectedIds([]);
                                                }
                                            }}
                                            className="h-4 w-4"
                                        />
                                    </TableHead>
                                    <TableHead>Order #</TableHead>
                                    <TableHead>Seller</TableHead>
                                    <TableHead>Product Price</TableHead>
                                    <TableHead>Rate</TableHead>
                                    <TableHead>Commission</TableHead>
                                    <TableHead>Seller Payout</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {commissions.map((commission) => (
                                    <TableRow key={commission.id}>
                                        <TableCell>
                                            {commission.status === 'pending' && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(commission.id)}
                                                    onChange={() => toggleSelection(commission.id)}
                                                    className="h-4 w-4"
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono">
                                            #{commission.order_id}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{commission.seller.name}</p>
                                                <p className="text-sm text-gray-600">
                                                    {commission.seller.email}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {formatPrice(parseFloat(commission.product_price))}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {commission.commission_rate}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-bold text-violet-600">
                                            {formatPrice(parseFloat(commission.commission_amount))}
                                        </TableCell>
                                        <TableCell className="font-medium text-emerald-600">
                                            {formatPrice(parseFloat(commission.seller_payout))}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={STATUS_COLORS[commission.status]}>
                                                {commission.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEditDialog(commission)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                {commission.status === 'pending' && (
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => openPaymentDialog(commission)}
                                                    >
                                                        <CreditCard className="h-4 w-4 mr-1" />
                                                        Pay
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Payment Dialog */}
                <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Process Commission Payment</DialogTitle>
                            <DialogDescription>
                                Pay commission to {selectedCommission?.seller.name}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            {selectedCommission && (
                                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-gray-600 dark:text-gray-400">Commission Amount</p>
                                            <p className="font-bold text-lg text-violet-600">
                                                {formatPrice(parseFloat(selectedCommission.commission_amount))}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600 dark:text-gray-400">Seller Payout</p>
                                            <p className="font-bold text-lg text-emerald-600">
                                                {formatPrice(parseFloat(selectedCommission.seller_payout))}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <Label>Payment Method</Label>
                                <Select
                                    value={paymentData.payment_method}
                                    onValueChange={(value) =>
                                        setPaymentData({ ...paymentData, payment_method: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PAYMENT_METHODS.map((method) => (
                                            <SelectItem key={method.value} value={method.value}>
                                                {method.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Payment Reference</Label>
                                <Input
                                    placeholder="TXN-20260208-001"
                                    value={paymentData.payment_reference}
                                    onChange={(e) =>
                                        setPaymentData({
                                            ...paymentData,
                                            payment_reference: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <Label>Notes (Optional)</Label>
                                <Textarea
                                    placeholder="Payment notes..."
                                    value={paymentData.notes}
                                    onChange={(e) =>
                                        setPaymentData({ ...paymentData, notes: e.target.value })
                                    }
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setShowPaymentDialog(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handlePayCommission}
                                disabled={processing || !paymentData.payment_method}
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    'Process Payment'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Commission Dialog */}
                <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Commission</DialogTitle>
                            <DialogDescription>
                                Update commission rate and details for Order #{selectedCommission?.order_id}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Commission Rate (%)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={editData.commission_rate}
                                    onChange={(e) =>
                                        setEditData({ ...editData, commission_rate: e.target.value })
                                    }
                                />
                                <p className="text-xs text-gray-600 mt-1">
                                    Current: {selectedCommission?.commission_rate}%
                                </p>
                            </div>

                            <div>
                                <Label>Notes</Label>
                                <Textarea
                                    placeholder="Commission notes..."
                                    value={editData.notes}
                                    onChange={(e) =>
                                        setEditData({ ...editData, notes: e.target.value })
                                    }
                                    rows={3}
                                />
                            </div>

                            {selectedCommission && editData.commission_rate && (
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <p className="text-sm font-medium mb-2">New Calculation:</p>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <p className="text-gray-600 dark:text-gray-400">Product Price</p>
                                            <p className="font-medium">
                                                {formatPrice(parseFloat(selectedCommission.product_price))}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600 dark:text-gray-400">New Commission</p>
                                            <p className="font-bold text-violet-600">
                                                {formatPrice(
                                                    (parseFloat(selectedCommission.product_price) *
                                                        parseFloat(editData.commission_rate)) /
                                                    100
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleEditCommission}
                                disabled={processing || !editData.commission_rate}
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Commission'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
