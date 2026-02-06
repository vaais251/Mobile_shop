'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { PHONE_BRANDS, PHONE_CONDITIONS } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    PlusCircle,
    Smartphone,
    CheckCircle,
    AlertCircle,
    Loader2,
    LogIn,
    Upload,
    X,
    Image as ImageIcon,
} from 'lucide-react';
import Link from 'next/link';

export default function SellPage() {
    const router = useRouter();
    const { isAuthenticated, token } = useAuth();
    const { t } = useLanguage();

    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        brand: '',
        model: '',
        storage_gb: '',
        color: '',
        condition_grade: '',
        condition_category: '',
        defects: '',
        price: '',
        original_price: '',
        battery_health: '',
        warranty_months: '0',
        accessories_included: '',
    });
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleFilesSelect = (files: FileList | null) => {
        if (!files) return;

        const newFiles = Array.from(files);
        const remainingSlots = 6 - images.length;
        const filesToAdd = newFiles.slice(0, remainingSlots);

        // Validate files
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

            // Create previews
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

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        handleFilesSelect(e.dataTransfer.files);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isAuthenticated || !token) {
            setError(t.login_required);
            return;
        }

        // Validation
        if (!formData.brand || !formData.model || !formData.storage_gb ||
            !formData.color || !formData.condition_grade || !formData.condition_category ||
            !formData.price || images.length === 0) {
            setError('Please fill in all required fields and upload at least one image.');
            return;
        }

        setLoading(true);

        try {
            const data = new FormData();
            data.append('brand', formData.brand);
            data.append('model', formData.model);
            data.append('storage_gb', formData.storage_gb);
            data.append('color', formData.color);
            data.append('condition_grade', formData.condition_grade);
            data.append('condition_category', formData.condition_category);
            data.append('price', formData.price);

            if (formData.defects) data.append('defects', formData.defects);
            if (formData.original_price) data.append('original_price', formData.original_price);
            if (formData.battery_health) data.append('battery_health', formData.battery_health);
            data.append('warranty_months', formData.warranty_months);
            if (formData.accessories_included) data.append('accessories_included', formData.accessories_included);

            // Append all images (first one is the thumbnail)
            images.forEach((img, index) => {
                if (index === 0) {
                    data.append('image', img); // Main thumbnail
                } else {
                    data.append('additional_images', img); // Additional images
                }
            });

            const response = await api.post('/phones/sell', data, token);

            if (response.error) {
                setError(response.error);
            } else {
                setShowSuccess(true);
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Not authenticated view
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-background py-16">
                <div className="mx-auto max-w-md px-4">
                    <Card className="bg-card border-border">
                        <CardContent className="p-8 text-center">
                            <LogIn className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-foreground mb-2">
                                {t.login_required}
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                Please login to list your phone for sale.
                            </p>
                            <Link href="/login">
                                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                    {t.nav_login}
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-12">
            <div className="mx-auto max-w-2xl px-4 sm:px-6">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-primary/25 mb-4">
                        <PlusCircle className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        {t.sell_form_title}
                    </h1>
                    <p className="text-muted-foreground">
                        {t.sell_form_subtitle}
                    </p>
                </div>

                {/* Form */}
                <Card className="bg-card border-border shadow-lg">
                    <CardContent className="p-6 sm:p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Brand & Model Row */}
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        {t.brand} *
                                    </label>
                                    <Select
                                        value={formData.brand}
                                        onValueChange={(value) => handleChange('brand', value)}
                                    >
                                        <SelectTrigger className="bg-background border-input text-foreground">
                                            <SelectValue placeholder={t.select_brand} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border">
                                            {PHONE_BRANDS.map((brand) => (
                                                <SelectItem key={brand} value={brand}>
                                                    {brand}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        {t.model} *
                                    </label>
                                    <Input
                                        value={formData.model}
                                        onChange={(e) => handleChange('model', e.target.value)}
                                        placeholder={t.enter_model}
                                        className="bg-background border-input text-foreground"
                                    />
                                </div>
                            </div>

                            {/* Storage & Color Row */}
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        {t.storage} (GB) *
                                    </label>
                                    <Select
                                        value={formData.storage_gb}
                                        onValueChange={(value) => handleChange('storage_gb', value)}
                                    >
                                        <SelectTrigger className="bg-background border-input text-foreground">
                                            <SelectValue placeholder="Select storage" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border">
                                            <SelectItem value="64">64 GB</SelectItem>
                                            <SelectItem value="128">128 GB</SelectItem>
                                            <SelectItem value="256">256 GB</SelectItem>
                                            <SelectItem value="512">512 GB</SelectItem>
                                            <SelectItem value="1024">1 TB</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        {t.color} *
                                    </label>
                                    <Input
                                        value={formData.color}
                                        onChange={(e) => handleChange('color', e.target.value)}
                                        placeholder="e.g., Space Black"
                                        className="bg-background border-input text-foreground"
                                    />
                                </div>
                            </div>

                            {/* Condition Row */}
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        {t.condition} Grade (1-10) *
                                    </label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="10"
                                        step="0.5"
                                        value={formData.condition_grade}
                                        onChange={(e) => handleChange('condition_grade', e.target.value)}
                                        placeholder={t.condition_placeholder}
                                        className="bg-background border-input text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        {t.condition} Category *
                                    </label>
                                    <Select
                                        value={formData.condition_category}
                                        onValueChange={(value) => handleChange('condition_category', value)}
                                    >
                                        <SelectTrigger className="bg-background border-input text-foreground">
                                            <SelectValue placeholder={t.select_condition} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border">
                                            {PHONE_CONDITIONS.map((condition) => (
                                                <SelectItem key={condition.value} value={condition.value}>
                                                    {condition.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Price Row */}
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        {t.price} (PKR) *
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) => handleChange('price', e.target.value)}
                                        placeholder={t.enter_price}
                                        className="bg-background border-input text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Original Price (PKR)
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={formData.original_price}
                                        onChange={(e) => handleChange('original_price', e.target.value)}
                                        placeholder="Optional"
                                        className="bg-background border-input text-foreground"
                                    />
                                </div>
                            </div>

                            {/* Battery & Warranty Row */}
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        {t.battery_health} (%)
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.battery_health}
                                        onChange={(e) => handleChange('battery_health', e.target.value)}
                                        placeholder="e.g., 92"
                                        className="bg-background border-input text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        {t.warranty} ({t.months})
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="24"
                                        value={formData.warranty_months}
                                        onChange={(e) => handleChange('warranty_months', e.target.value)}
                                        placeholder="0"
                                        className="bg-background border-input text-foreground"
                                    />
                                </div>
                            </div>

                            {/* Image Upload Section */}
                            <div className="space-y-6">
                                {/* Thumbnail Image (Required) */}
                                <div>
                                    <label className="block text-sm font-bold text-foreground mb-2">
                                        Thumbnail Image * <span className="text-xs font-normal text-muted-foreground">(Main photo)</span>
                                    </label>
                                    <p className="text-xs text-muted-foreground mb-3">
                                        This will be the main image shown in listings
                                    </p>

                                    {images.length === 0 ? (
                                        <label
                                            htmlFor="thumbnail-upload"
                                            onDrop={handleDrop}
                                            onDragOver={handleDragOver}
                                            className="block border-2 border-dashed border-border hover:border-violet-500 rounded-xl p-8 transition-all cursor-pointer bg-muted/30 hover:bg-muted/50"
                                        >
                                            <div className="flex flex-col items-center text-center">
                                                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-4 hover:scale-105 transition-transform">
                                                    <Upload className="h-8 w-8 text-white" />
                                                </div>
                                                <span className="text-violet-600 dark:text-violet-400 font-semibold hover:underline">
                                                    Click to upload thumbnail
                                                </span>
                                                <span className="text-muted-foreground text-sm mt-1">or drag and drop</span>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    PNG, JPG, GIF up to 10MB
                                                </p>
                                            </div>
                                            <input
                                                id="thumbnail-upload"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="sr-only"
                                            />
                                        </label>
                                    ) : (
                                        <div className="relative group rounded-xl overflow-hidden border-2 border-violet-500 aspect-square max-w-xs">
                                            <img
                                                src={imagePreviews[0]}
                                                alt="Thumbnail preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute top-2 left-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-lg">
                                                Thumbnail
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeImage(0)}
                                                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Additional Product Images (Optional) */}
                                <div>
                                    <label className="block text-sm font-bold text-foreground mb-2">
                                        Additional Product Images <span className="text-xs font-normal text-muted-foreground">(Optional - up to 5 more)</span>
                                    </label>
                                    <p className="text-xs text-muted-foreground mb-3">
                                        Add more photos to show different angles and details
                                    </p>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {/* Show existing additional images */}
                                        {images.slice(1).map((_, index) => {
                                            const actualIndex = index + 1;
                                            return (
                                                <div
                                                    key={actualIndex}
                                                    className="relative group rounded-xl overflow-hidden border-2 border-border hover:border-violet-500 transition-all aspect-square"
                                                >
                                                    <img
                                                        src={imagePreviews[actualIndex]}
                                                        alt={`Product image ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(actualIndex)}
                                                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 px-2 text-center">
                                                        Image {index + 1}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Add More Button - Show when thumbnail exists and less than 6 total images */}
                                        {images.length > 0 && images.length < 6 && (
                                            <label
                                                htmlFor="additional-images-upload"
                                                className="relative rounded-xl border-2 border-dashed border-border hover:border-violet-500 transition-all cursor-pointer aspect-square flex flex-col items-center justify-center bg-muted/30 hover:bg-muted/50 group"
                                            >
                                                <div className="flex flex-col items-center">
                                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                                        <PlusCircle className="h-6 w-6 text-white" />
                                                    </div>
                                                    <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                                                        Add Photo
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground mt-1">
                                                        {6 - images.length} left
                                                    </span>
                                                </div>
                                                <input
                                                    id="additional-images-upload"
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="sr-only"
                                                />
                                            </label>
                                        )}
                                    </div>

                                    {images.length === 0 && (
                                        <p className="text-xs text-muted-foreground mt-2 text-center italic">
                                            Upload thumbnail first to add additional images
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Defects */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    {t.defects}
                                </label>
                                <textarea
                                    value={formData.defects}
                                    onChange={(e) => handleChange('defects', e.target.value)}
                                    placeholder={t.enter_defects}
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>

                            {/* Accessories */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    {t.accessories}
                                </label>
                                <Input
                                    value={formData.accessories_included}
                                    onChange={(e) => handleChange('accessories_included', e.target.value)}
                                    placeholder="e.g., Original box, charger, cable"
                                    className="bg-background border-input text-foreground"
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
                                    <AlertCircle className="h-5 w-5" />
                                    {error}
                                </div>
                            )}

                            {/* Submit */}
                            <Button
                                type="submit"
                                size="lg"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-xl shadow-violet-500/30 font-bold h-14 text-lg cursor-pointer"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <PlusCircle className="mr-2 h-5 w-5" />
                                        {t.submit_listing}
                                    </>
                                )}
                            </Button>

                            {/* Notice */}
                            <p className="text-center text-sm text-muted-foreground">
                                ⚠️ Your listing will be reviewed by our admin team before it goes live.
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Success Dialog */}
            <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
                <DialogContent className="bg-card border-border">
                    <DialogHeader>
                        <div className="flex justify-center mb-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                                <CheckCircle className="h-8 w-8 text-emerald-500" />
                            </div>
                        </div>
                        <DialogTitle className="text-center text-xl text-foreground">
                            {t.listing_success}
                        </DialogTitle>
                        <DialogDescription className="text-center text-muted-foreground">
                            {t.listing_pending}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center gap-4 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowSuccess(false);
                                setFormData({
                                    brand: '',
                                    model: '',
                                    storage_gb: '',
                                    color: '',
                                    condition_grade: '',
                                    condition_category: '',
                                    defects: '',
                                    price: '',
                                    original_price: '',
                                    battery_health: '',
                                    warranty_months: '0',
                                    accessories_included: '',
                                });
                            }}
                            className="border-border"
                        >
                            List Another
                        </Button>
                        <Button
                            onClick={() => router.push('/my-listings')}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            View My Listings
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
