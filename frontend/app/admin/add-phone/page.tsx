'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    ArrowLeft,
    Upload,
    Smartphone,
    Loader2,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';

const conditionOptions = [
    { value: 'mint', label: 'Mint (10/10)', grade: 10 },
    { value: 'excellent', label: 'Excellent (9/10)', grade: 9 },
    { value: 'good', label: 'Good (8/10)', grade: 8 },
    { value: 'fair', label: 'Fair (7/10)', grade: 7 },
    { value: 'poor', label: 'Poor (6/10)', grade: 6 },
];

const storageOptions = [64, 128, 256, 512, 1024];

export default function AdminAddPhonePage() {
    const router = useRouter();
    const { token, isAdmin, isLoading: authLoading } = useAuth();

    const [formData, setFormData] = useState({
        brand: '',
        model: '',
        storage_gb: 128,
        color: '',
        condition_category: 'excellent',
        price: '',
        original_price: '',
        defects: '',
        battery_health: '',
        warranty_months: 0,
        accessories_included: '',
    });
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
            setError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!formData.brand || !formData.model || !formData.price || !image) {
            setError('Please fill all required fields and upload an image.');
            return;
        }

        setLoading(true);

        try {
            const condition = conditionOptions.find(c => c.value === formData.condition_category);

            const data = new FormData();
            data.append('brand', formData.brand);
            data.append('model', formData.model);
            data.append('storage_gb', formData.storage_gb.toString());
            data.append('color', formData.color || 'Black');
            data.append('condition_grade', (condition?.grade || 9).toString());
            data.append('condition_category', formData.condition_category);
            data.append('price', formData.price);
            if (formData.original_price) data.append('original_price', formData.original_price);
            if (formData.defects) data.append('defects', formData.defects);
            if (formData.battery_health) data.append('battery_health', formData.battery_health);
            data.append('warranty_months', formData.warranty_months.toString());
            if (formData.accessories_included) data.append('accessories_included', formData.accessories_included);
            data.append('image', image);

            const response = await api.post('/admin/phones/upload', data, token || undefined);

            if (response.error) {
                setError(response.error);
            } else {
                setSuccess(true);
                // Reset form
                setFormData({
                    brand: '',
                    model: '',
                    storage_gb: 128,
                    color: '',
                    condition_category: 'excellent',
                    price: '',
                    original_price: '',
                    defects: '',
                    battery_health: '',
                    warranty_months: 0,
                    accessories_included: '',
                });
                setImage(null);
                setImagePreview(null);

                // Redirect after a short delay
                setTimeout(() => {
                    router.push('/admin/dashboard');
                }, 1500);
            }
        } catch (err) {
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!isAdmin) {
        router.push('/');
        return null;
    }

    return (
        <div className="min-h-screen bg-background py-8">
            <div className="container mx-auto max-w-3xl px-4">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Add New Phone</h1>
                        <p className="text-muted-foreground">Add a phone to the official shop inventory.</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-primary" />
                            Phone Details
                        </CardTitle>
                        <CardDescription>Fill in the details of the phone you want to add to the shop.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Image Upload */}
                            <div className="space-y-2">
                                <Label>Phone Image *</Label>
                                <div className="flex items-center gap-4">
                                    <label className="flex-1 cursor-pointer">
                                        <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Preview" className="mx-auto h-40 w-40 object-cover rounded-lg" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                    <Upload className="h-10 w-10" />
                                                    <span>Click to upload image</span>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Brand & Model */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="brand">Brand *</Label>
                                    <Input
                                        id="brand"
                                        name="brand"
                                        placeholder="e.g., Apple, Samsung"
                                        value={formData.brand}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="model">Model *</Label>
                                    <Input
                                        id="model"
                                        name="model"
                                        placeholder="e.g., iPhone 15 Pro"
                                        value={formData.model}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Storage & Condition */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Storage (GB) *</Label>
                                    <Select
                                        value={formData.storage_gb.toString()}
                                        onValueChange={(v) => setFormData({ ...formData, storage_gb: parseInt(v) })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {storageOptions.map(s => (
                                                <SelectItem key={s} value={s.toString()}>{s} GB</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Condition *</Label>
                                    <Select
                                        value={formData.condition_category}
                                        onValueChange={(v) => setFormData({ ...formData, condition_category: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {conditionOptions.map(c => (
                                                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Color & Battery */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="color">Color</Label>
                                    <Input
                                        id="color"
                                        name="color"
                                        placeholder="e.g., Midnight Black"
                                        value={formData.color}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="battery_health">Battery Health (%)</Label>
                                    <Input
                                        id="battery_health"
                                        name="battery_health"
                                        type="number"
                                        min="0"
                                        max="100"
                                        placeholder="e.g., 92"
                                        value={formData.battery_health}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Price */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Price (PKR) *</Label>
                                    <Input
                                        id="price"
                                        name="price"
                                        type="number"
                                        placeholder="e.g., 150000"
                                        value={formData.price}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="original_price">Original Price (PKR)</Label>
                                    <Input
                                        id="original_price"
                                        name="original_price"
                                        type="number"
                                        placeholder="e.g., 180000"
                                        value={formData.original_price}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Defects & Accessories */}
                            <div className="space-y-2">
                                <Label htmlFor="defects">Known Defects</Label>
                                <Textarea
                                    id="defects"
                                    name="defects"
                                    placeholder="Describe any visible defects (e.g., minor scratches on back)"
                                    value={formData.defects}
                                    onChange={handleChange}
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="accessories_included">Accessories Included</Label>
                                <Input
                                    id="accessories_included"
                                    name="accessories_included"
                                    placeholder="e.g., Charger, Box, Earphones"
                                    value={formData.accessories_included}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Error / Success Messages */}
                            {error && (
                                <div className="p-4 rounded-lg bg-destructive/10 text-destructive flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="p-4 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Phone added successfully! Redirecting...
                                </div>
                            )}

                            {/* Submit */}
                            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white">
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Adding Phone...
                                    </>
                                ) : (
                                    <>
                                        <Smartphone className="mr-2 h-4 w-4" />
                                        Add to Shop Inventory
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
