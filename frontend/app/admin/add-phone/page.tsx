'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { PHONE_BRANDS, PHONE_CONDITIONS, PHONE_COLORS } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    ArrowLeft,
    Upload,
    Smartphone,
    Loader2,
    CheckCircle,
    AlertCircle,
    X,
    Image as ImageIcon,
    ShieldCheck,
    Store,
} from 'lucide-react';

export default function AdminAddPhonePage() {
    const router = useRouter();
    const { token, isAdmin, isLoading: authLoading } = useAuth();

    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

    const [formData, setFormData] = useState({
        brand: '',
        customBrand: '',
        model: '',
        storage_gb: '',
        ram_gb: '',
        camera_mp: '',
        color: '',
        condition_grade: '',
        condition_category: '',
        defects: '',
        price: '',
        original_price: '',
        battery_health: '',
        warranty_months: '0',
        accessories_included: '',
        pta_approved: false,
        is_featured: false,
    });
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    // Condition grade options (6-10 scale)
    const CONDITION_GRADES = [
        { value: '10', label: '10 - Perfect (Like New)' },
        { value: '9.5', label: '9.5 - Excellent+' },
        { value: '9', label: '9 - Excellent' },
        { value: '8.5', label: '8.5 - Very Good+' },
        { value: '8', label: '8 - Very Good' },
        { value: '7.5', label: '7.5 - Good+' },
        { value: '7', label: '7 - Good' },
        { value: '6.5', label: '6.5 - Fair+' },
        { value: '6', label: '6 - Fair' },
    ];

    const handleChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
        setFieldErrors(prev => {
            const updated = { ...prev };
            delete updated[field];
            return updated;
        });
    };

    const validateForm = (): boolean => {
        const errors: { [key: string]: string } = {};

        // Brand validation
        if (!formData.brand) {
            errors.brand = 'Brand is required';
        } else if (formData.brand === 'Other' && !formData.customBrand.trim()) {
            errors.customBrand = 'Please enter a custom brand name';
        }

        // Model validation
        if (!formData.model.trim()) {
            errors.model = 'Model is required';
        } else if (formData.model.trim().length < 2) {
            errors.model = 'Model name must be at least 2 characters';
        }

        // Storage validation
        if (!formData.storage_gb) {
            errors.storage_gb = 'Storage is required';
        } else {
            const storage = parseInt(formData.storage_gb);
            if (isNaN(storage) || storage < 8 || storage > 2048) {
                errors.storage_gb = 'Storage must be between 8 GB and 2048 GB';
            }
        }

        // Color validation
        if (!formData.color.trim()) {
            errors.color = 'Color is required';
        }

        // RAM validation
        if (!formData.ram_gb) {
            errors.ram_gb = 'RAM is required';
        } else {
            const ram = parseInt(formData.ram_gb);
            if (isNaN(ram) || ram < 1 || ram > 64) {
                errors.ram_gb = 'RAM must be between 1 GB and 64 GB';
            }
        }

        // Condition grade validation
        if (!formData.condition_grade) {
            errors.condition_grade = 'Please select a condition grade';
        }

        // Condition category validation
        if (!formData.condition_category) {
            errors.condition_category = 'Please select a condition category';
        }

        // Price validation
        if (!formData.price) {
            errors.price = 'Price is required';
        } else {
            const price = parseInt(formData.price);
            if (isNaN(price) || price <= 0) {
                errors.price = 'Price must be greater than 0';
            }
        }

        // Image validation
        if (images.length === 0) {
            errors.images = 'At least one image is required';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleFilesSelect = (files: FileList | null) => {
        if (!files) return;

        const newFiles = Array.from(files);
        const remainingSlots = 6 - images.length;
        const filesToAdd = newFiles.slice(0, remainingSlots);

        const validFiles: File[] = [];
        for (const file of filesToAdd) {
            if (file.size > 10 * 1024 * 1024) {
                setError(`File ${file.name} is too large. Maximum size is 10MB.`);
                continue;
            }
            if (!file.type.startsWith('image/')) {
                setError(`File ${file.name} is not an image.`);
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length > 0) {
            const newImages = [...images, ...validFiles];
            setImages(newImages);

            validFiles.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreviews(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
            setError('');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFilesSelect(e.target.files);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        handleFilesSelect(e.dataTransfer.files);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isAdmin || !token) {
            setError('Admin access required');
            return;
        }

        const isValid = validateForm();
        if (!isValid) {
            setError('Please fix the errors highlighted below to continue.');
            return;
        }

        setLoading(true);
        setUploadProgress(0);

        try {
            const data = new FormData();
            const finalBrand = formData.brand === 'Other' ? formData.customBrand : formData.brand;
            data.append('brand', finalBrand);
            data.append('model', formData.model);
            data.append('storage_gb', formData.storage_gb);
            data.append('color', formData.color);
            data.append('condition_grade', formData.condition_grade);
            data.append('condition_category', formData.condition_category);
            data.append('price', formData.price);

            if (formData.ram_gb) data.append('ram_gb', formData.ram_gb);
            if (formData.camera_mp) data.append('camera_mp', formData.camera_mp);
            if (formData.defects) data.append('defects', formData.defects);
            if (formData.original_price) data.append('original_price', formData.original_price);
            if (formData.battery_health) data.append('battery_health', formData.battery_health);
            data.append('warranty_months', formData.warranty_months);
            if (formData.accessories_included) data.append('accessories_included', formData.accessories_included);
            data.append('pta_approved', String(formData.pta_approved));
            data.append('is_featured', String(formData.is_featured));

            setUploadProgress(20);
            images.forEach((img) => {
                data.append('images', img);
            });
            data.append('thumbnail_index', '0');
            setUploadProgress(40);

            setUploadProgress(60);
            const response = await api.post('/admin/phones/upload', data, token);
            setUploadProgress(80);

            if (response.error) {
                console.error('Backend error response:', response.error);
                setUploadProgress(0);
                if (typeof response.error === 'string') {
                    setError(response.error);
                } else {
                    setError(JSON.stringify(response.error) || 'An error occurred.');
                }
            } else {
                setUploadProgress(100);
                setTimeout(() => setShowSuccess(true), 300);
            }
        } catch (err: any) {
            console.error('Add phone error:', err);
            setError(err.message || 'An error occurred. Please try again.');
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
        <div className="min-h-screen bg-background">
            {/* Premium Header */}
            <section className="relative overflow-hidden bg-gradient-to-br from-background via-violet-500/5 to-background py-12 border-b border-border/50">
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-10 right-20 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-10 left-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl" />
                </div>

                <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Link href="/admin/dashboard">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
                            <Store className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                                Add Shop Phone
                            </h1>
                            <p className="text-muted-foreground">Add a phone to the official shop inventory</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Form Section */}
            <section className="py-8">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <Card className="bg-card/50 backdrop-blur border-border/50 shadow-2xl rounded-3xl overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-violet-500"></div>
                        <CardHeader className="pb-6 pt-8 px-8">
                            <CardTitle className="flex items-center gap-3 text-xl">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600">
                                    <Smartphone className="h-5 w-5 text-white" />
                                </div>
                                Phone Details
                            </CardTitle>
                            <CardDescription>
                                Fill in the details of the phone you want to add to the shop inventory.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-8 pb-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Image Upload Section */}
                                <div className="space-y-4" data-error={!!fieldErrors.images}>
                                    <label className="block text-sm font-medium text-foreground">
                                        Phone Images * <span className="text-muted-foreground text-xs">(Up to 6 images, first one is thumbnail)</span>
                                    </label>

                                    {/* Upload area */}
                                    <div
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer group
                                            ${images.length >= 6
                                                ? 'border-muted bg-muted/30 cursor-not-allowed'
                                                : fieldErrors.images
                                                    ? 'border-red-500/50 bg-red-500/5'
                                                    : 'border-border hover:border-violet-500/50 hover:bg-violet-500/5'
                                            }`}
                                    >
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                            disabled={images.length >= 6}
                                        />
                                        <div className="flex flex-col items-center gap-3">
                                            <div className={`p-4 rounded-full transition-colors ${images.length >= 6 ? 'bg-muted' : 'bg-violet-500/10 group-hover:bg-violet-500/20'}`}>
                                                <Upload className={`h-8 w-8 ${images.length >= 6 ? 'text-muted-foreground' : 'text-violet-500'}`} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    {images.length >= 6 ? 'Maximum images reached' : 'Drag & drop or click to upload'}
                                                </p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {images.length}/6 images • PNG, JPG up to 10MB each
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Image Previews */}
                                    {imagePreviews.length > 0 && (
                                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                            {imagePreviews.map((preview, index) => (
                                                <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-border">
                                                    <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                                                    {index === 0 && (
                                                        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-violet-600 text-white text-xs rounded font-medium">
                                                            Thumbnail
                                                        </div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(index)}
                                                        className="absolute top-1 right-1 p-1 bg-red-500/90 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {fieldErrors.images && (
                                        <p className="text-xs text-red-500 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {fieldErrors.images}
                                        </p>
                                    )}
                                </div>

                                {/* Brand & Model Row */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div data-error={!!fieldErrors.brand || !!fieldErrors.customBrand}>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Brand *
                                        </label>
                                        <Select
                                            value={formData.brand}
                                            onValueChange={(value) => handleChange('brand', value)}
                                        >
                                            <SelectTrigger className={`bg-background border-input text-foreground ${fieldErrors.brand ? 'border-red-500 ring-2 ring-red-500/20' : ''}`}>
                                                <SelectValue placeholder="Select brand" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border">
                                                {PHONE_BRANDS.map((brand) => (
                                                    <SelectItem key={brand} value={brand}>
                                                        {brand}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {formData.brand === 'Other' && (
                                            <Input
                                                value={formData.customBrand}
                                                onChange={(e) => handleChange('customBrand', e.target.value)}
                                                placeholder="Enter brand name"
                                                className="mt-2 bg-background border-input text-foreground"
                                            />
                                        )}
                                        {(fieldErrors.brand || fieldErrors.customBrand) && (
                                            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {fieldErrors.brand || fieldErrors.customBrand}
                                            </p>
                                        )}
                                    </div>
                                    <div data-error={!!fieldErrors.model}>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Model *
                                        </label>
                                        <Input
                                            value={formData.model}
                                            onChange={(e) => handleChange('model', e.target.value)}
                                            placeholder="e.g. iPhone 15 Pro Max"
                                            className={`bg-background border-input text-foreground transition-all ${fieldErrors.model ? 'border-red-500 ring-2 ring-red-500/20' : 'focus:border-violet-500 hover:border-violet-400'}`}
                                        />
                                        {fieldErrors.model && (
                                            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {fieldErrors.model}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Storage & Color Row */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div data-error={!!fieldErrors.storage_gb}>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Storage (GB) *
                                        </label>
                                        <Input
                                            type="number"
                                            min="8"
                                            max="2048"
                                            value={formData.storage_gb}
                                            onChange={(e) => handleChange('storage_gb', e.target.value)}
                                            placeholder="e.g., 128, 256, 512"
                                            className={`bg-background border-input text-foreground transition-all ${fieldErrors.storage_gb ? 'border-red-500 ring-2 ring-red-500/20' : 'focus:border-violet-500 hover:border-violet-400'}`}
                                        />
                                        {fieldErrors.storage_gb && (
                                            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {fieldErrors.storage_gb}
                                            </p>
                                        )}
                                    </div>
                                    <div data-error={!!fieldErrors.color}>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Color *
                                        </label>
                                        <Select
                                            value={formData.color}
                                            onValueChange={(value) => handleChange('color', value)}
                                        >
                                            <SelectTrigger className={`bg-background border-input text-foreground ${fieldErrors.color ? 'border-red-500 ring-2 ring-red-500/20' : ''}`}>
                                                <SelectValue placeholder="Select color" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border max-h-60">
                                                {PHONE_COLORS.map((color) => (
                                                    <SelectItem key={color} value={color}>
                                                        {color}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {fieldErrors.color && (
                                            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {fieldErrors.color}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* RAM & Camera Row */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div data-error={!!fieldErrors.ram_gb}>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            RAM (GB) *
                                        </label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="64"
                                            value={formData.ram_gb}
                                            onChange={(e) => handleChange('ram_gb', e.target.value)}
                                            placeholder="e.g., 4, 6, 8, 12"
                                            className={`bg-background border-input text-foreground transition-all ${fieldErrors.ram_gb ? 'border-red-500 ring-2 ring-red-500/20' : 'focus:border-violet-500 hover:border-violet-400'}`}
                                        />
                                        {fieldErrors.ram_gb && (
                                            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {fieldErrors.ram_gb}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Camera (MP) <span className="text-muted-foreground text-xs">(Optional)</span>
                                        </label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="200"
                                            value={formData.camera_mp}
                                            onChange={(e) => handleChange('camera_mp', e.target.value)}
                                            placeholder="e.g., 12, 48, 108"
                                            className="bg-background border-input text-foreground transition-all focus:border-violet-500 hover:border-violet-400"
                                        />
                                    </div>
                                </div>

                                {/* Condition Row */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div data-error={!!fieldErrors.condition_grade}>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Condition Grade (6-10) *
                                        </label>
                                        <Select
                                            value={formData.condition_grade}
                                            onValueChange={(value) => handleChange('condition_grade', value)}
                                        >
                                            <SelectTrigger className={`bg-background border-input text-foreground ${fieldErrors.condition_grade ? 'border-red-500 ring-2 ring-red-500/20' : ''}`}>
                                                <SelectValue placeholder="Select grade (6-10 scale)" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border">
                                                {CONDITION_GRADES.map((grade) => (
                                                    <SelectItem key={grade.value} value={grade.value}>
                                                        {grade.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {fieldErrors.condition_grade && (
                                            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {fieldErrors.condition_grade}
                                            </p>
                                        )}
                                    </div>
                                    <div data-error={!!fieldErrors.condition_category}>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Condition Category *
                                        </label>
                                        <Select
                                            value={formData.condition_category}
                                            onValueChange={(value) => handleChange('condition_category', value)}
                                        >
                                            <SelectTrigger className={`bg-background border-input text-foreground ${fieldErrors.condition_category ? 'border-red-500 ring-2 ring-red-500/20' : ''}`}>
                                                <SelectValue placeholder="Select condition" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border">
                                                {PHONE_CONDITIONS.map((condition) => (
                                                    <SelectItem key={condition.value} value={condition.value}>
                                                        {condition.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {fieldErrors.condition_category && (
                                            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {fieldErrors.condition_category}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Price Row */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div data-error={!!fieldErrors.price}>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Price (PKR) *
                                        </label>
                                        <Input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => handleChange('price', e.target.value)}
                                            placeholder="e.g., 150000"
                                            className={`bg-background border-input text-foreground transition-all ${fieldErrors.price ? 'border-red-500 ring-2 ring-red-500/20' : 'focus:border-violet-500 hover:border-violet-400'}`}
                                        />
                                        {fieldErrors.price && (
                                            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {fieldErrors.price}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Original Price (PKR) <span className="text-muted-foreground text-xs">(Optional)</span>
                                        </label>
                                        <Input
                                            type="number"
                                            value={formData.original_price}
                                            onChange={(e) => handleChange('original_price', e.target.value)}
                                            placeholder="e.g., 180000"
                                            className="bg-background border-input text-foreground transition-all focus:border-violet-500 hover:border-violet-400"
                                        />
                                    </div>
                                </div>

                                {/* Battery & Warranty Row */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Battery Health (%) <span className="text-muted-foreground text-xs">(Optional)</span>
                                        </label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={formData.battery_health}
                                            onChange={(e) => handleChange('battery_health', e.target.value)}
                                            placeholder="e.g., 92"
                                            className="bg-background border-input text-foreground transition-all focus:border-violet-500 hover:border-violet-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Warranty (Months) <span className="text-muted-foreground text-xs">(Optional)</span>
                                        </label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="24"
                                            value={formData.warranty_months}
                                            onChange={(e) => handleChange('warranty_months', e.target.value)}
                                            placeholder="e.g., 3"
                                            className="bg-background border-input text-foreground transition-all focus:border-violet-500 hover:border-violet-400"
                                        />
                                    </div>
                                </div>

                                {/* Defects & Accessories */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Known Defects <span className="text-muted-foreground text-xs">(Optional)</span>
                                        </label>
                                        <Input
                                            value={formData.defects}
                                            onChange={(e) => handleChange('defects', e.target.value)}
                                            placeholder="e.g., Minor scratches on back"
                                            className="bg-background border-input text-foreground transition-all focus:border-violet-500 hover:border-violet-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Accessories <span className="text-muted-foreground text-xs">(Optional)</span>
                                        </label>
                                        <Input
                                            value={formData.accessories_included}
                                            onChange={(e) => handleChange('accessories_included', e.target.value)}
                                            placeholder="e.g., Box, Charger, Earphones"
                                            className="bg-background border-input text-foreground transition-all focus:border-violet-500 hover:border-violet-400"
                                        />
                                    </div>
                                </div>

                                {/* Toggle Switches */}
                                <div className="space-y-4 p-4 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 rounded-xl border border-violet-200 dark:border-violet-800">
                                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-violet-600" />
                                        Phone Status
                                    </h3>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                                            <div>
                                                <p className="font-medium text-sm">PTA Approved</p>
                                                <p className="text-xs text-muted-foreground">Is this phone PTA approved?</p>
                                            </div>
                                            <Switch
                                                checked={formData.pta_approved}
                                                onCheckedChange={(checked) => handleChange('pta_approved', checked)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                                            <div>
                                                <p className="font-medium text-sm">Featured</p>
                                                <p className="text-xs text-muted-foreground">Show in featured section?</p>
                                            </div>
                                            <Switch
                                                checked={formData.is_featured}
                                                onCheckedChange={(checked) => handleChange('is_featured', checked)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                {loading && uploadProgress > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Uploading...</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Error Message */}
                                {error && (
                                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-red-600 dark:text-red-400 text-sm whitespace-pre-line">{error}</p>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative w-full overflow-hidden bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 text-white h-14 rounded-2xl font-bold text-lg shadow-2xl shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Adding Phone...
                                            </>
                                        ) : (
                                            <>
                                                <Store className="h-5 w-5" />
                                                Add to Shop Inventory
                                            </>
                                        )}
                                    </span>
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Success Dialog */}
            <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border border-border shadow-2xl p-0 overflow-hidden rounded-3xl">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                    <div className="p-8">
                        <DialogHeader>
                            <div className="flex justify-center mb-6">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse"></div>
                                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
                                        <CheckCircle className="h-10 w-10 text-white" />
                                    </div>
                                </div>
                            </div>
                            <DialogTitle className="text-center text-2xl font-extrabold text-foreground mb-2">
                                Phone Added!
                            </DialogTitle>
                            <DialogDescription className="text-center text-muted-foreground text-base">
                                The phone has been successfully added to the shop inventory.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowSuccess(false);
                                    setFormData({
                                        brand: '',
                                        customBrand: '',
                                        model: '',
                                        storage_gb: '',
                                        ram_gb: '',
                                        camera_mp: '',
                                        color: '',
                                        condition_grade: '',
                                        condition_category: '',
                                        defects: '',
                                        price: '',
                                        original_price: '',
                                        battery_health: '',
                                        warranty_months: '0',
                                        accessories_included: '',
                                        pta_approved: false,
                                        is_featured: false,
                                    });
                                    setImages([]);
                                    setImagePreviews([]);
                                    setFieldErrors({});
                                }}
                                className="border-border hover:bg-muted font-semibold rounded-xl h-12"
                            >
                                Add Another
                            </Button>
                            <Button
                                onClick={() => router.push('/admin/dashboard')}
                                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20 font-bold rounded-xl h-12"
                            >
                                Go to Dashboard
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
