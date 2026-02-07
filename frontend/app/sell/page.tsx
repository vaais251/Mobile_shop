'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { PHONE_BRANDS, PHONE_CONDITIONS, PHONE_COLORS } from '@/lib/utils';
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
import { Switch } from '@/components/ui/switch';
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
        seller_phone: '',
        seller_city: '',
        pta_approved: false,
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
        // Clear field-specific error when user updates the field
        setFieldErrors(prev => {
            const updated = { ...prev };
            delete updated[field];
            return updated;
        });
    };

    // Professional validation function
    const validateForm = (): boolean => {
        const errors: { [key: string]: string } = {};

        // Brand validation
        if (!formData.brand) {
            errors.brand = 'Please select a brand';
        } else if (formData.brand === 'Other' && !formData.customBrand.trim()) {
            errors.customBrand = 'Please enter a custom brand name';
        }

        // Model validation
        if (!formData.model.trim()) {
            errors.model = 'Model name is required';
        } else if (formData.model.trim().length < 2) {
            errors.model = 'Model name must be at least 2 characters';
        }

        // Storage validation
        if (!formData.storage_gb) {
            errors.storage_gb = 'Storage capacity is required';
        } else {
            const storage = parseInt(formData.storage_gb);
            if (isNaN(storage) || storage < 8 || storage > 2048) {
                errors.storage_gb = 'Storage must be between 8 GB and 2048 GB';
            }
        }

        // Color validation
        if (!formData.color.trim()) {
            errors.color = 'Color is required';
        } else if (formData.color.trim().length < 2) {
            errors.color = 'Color name must be at least 2 characters';
        }

        // RAM validation (required)
        if (!formData.ram_gb) {
            errors.ram_gb = 'RAM is required';
        } else {
            const ram = parseInt(formData.ram_gb);
            if (isNaN(ram) || ram < 1 || ram > 64) {
                errors.ram_gb = 'RAM must be between 1 GB and 64 GB';
            }
        }

        // Camera validation (optional but must be valid if provided)
        if (formData.camera_mp) {
            const camera = parseInt(formData.camera_mp);
            if (isNaN(camera) || camera < 1 || camera > 200) {
                errors.camera_mp = 'Camera resolution must be between 1 MP and 200 MP';
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
            } else if (price < 1000) {
                errors.price = 'Price seems too low. Please verify.';
            } else if (price > 10000000) {
                errors.price = 'Price seems too high. Please verify.';
            }
        }

        // Original price validation (optional but must be valid if provided)
        if (formData.original_price) {
            const originalPrice = parseInt(formData.original_price);
            const currentPrice = parseInt(formData.price);
            if (isNaN(originalPrice) || originalPrice <= 0) {
                errors.original_price = 'Original price must be greater than 0';
            } else if (!isNaN(currentPrice) && originalPrice < currentPrice) {
                errors.original_price = 'Original price cannot be less than current price';
            }
        }

        // Battery health validation (optional but must be valid if provided)
        if (formData.battery_health) {
            const battery = parseInt(formData.battery_health);
            if (isNaN(battery) || battery < 0 || battery > 100) {
                errors.battery_health = 'Battery health must be between 0% and 100%';
            } else if (battery < 50) {
                errors.battery_health = 'Battery health is below 50%. Are you sure?';
            }
        }

        // Warranty validation
        if (formData.warranty_months) {
            const warranty = parseInt(formData.warranty_months);
            if (isNaN(warranty) || warranty < 0 || warranty > 24) {
                errors.warranty_months = 'Warranty must be between 0 and 24 months';
            }
        }

        // Seller phone validation
        if (!formData.seller_phone.trim()) {
            errors.seller_phone = 'Phone number is required';
        } else {
            // Remove all non-digit characters for validation
            const digitsOnly = formData.seller_phone.replace(/\D/g, '');
            if (digitsOnly.length < 10 || digitsOnly.length > 15) {
                errors.seller_phone = 'Please enter a valid phone number (10-15 digits)';
            }
        }

        // Seller city validation
        if (!formData.seller_city.trim()) {
            errors.seller_city = 'City is required';
        } else if (formData.seller_city.trim().length < 2) {
            errors.seller_city = 'City name must be at least 2 characters';
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

        if (!isAuthenticated || !token) {
            setError(t.login_required);
            return;
        }

        // Use professional validation
        const isValid = validateForm();
        if (!isValid) {
            setError('Please fix the errors highlighted below to continue.');
            // Scroll to first error
            const firstErrorElement = document.querySelector('[data-error="true"]');
            if (firstErrorElement) {
                firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        setLoading(true);
        setUploadProgress(0);

        try {
            const data = new FormData();
            // Use custom brand if 'Other' is selected
            const finalBrand = formData.brand === 'Other' ? formData.customBrand : formData.brand;
            data.append('brand', finalBrand);
            data.append('model', formData.model);
            data.append('storage_gb', formData.storage_gb);
            data.append('color', formData.color);
            data.append('condition_grade', formData.condition_grade);
            data.append('condition_category', formData.condition_category);
            data.append('price', formData.price);
            data.append('seller_phone', formData.seller_phone);
            data.append('seller_city', formData.seller_city);

            if (formData.ram_gb) data.append('ram_gb', formData.ram_gb);
            if (formData.camera_mp) data.append('camera_mp', formData.camera_mp);
            if (formData.defects) data.append('defects', formData.defects);
            if (formData.original_price) data.append('original_price', formData.original_price);
            if (formData.battery_health) data.append('battery_health', formData.battery_health);
            data.append('warranty_months', formData.warranty_months);
            if (formData.accessories_included) data.append('accessories_included', formData.accessories_included);
            data.append('pta_approved', String(formData.pta_approved));

            // Append all images as 'images' array (backend expects List[UploadFile])
            setUploadProgress(20); // Starting upload
            images.forEach((img) => {
                data.append('images', img);
            });

            // Set the first image as thumbnail (index 0)
            data.append('thumbnail_index', '0');
            setUploadProgress(40); // Images prepared

            setUploadProgress(60); // Uploading to server
            const response = await api.post('/phones/sell', data, token);
            setUploadProgress(80); // Upload complete

            if (response.error) {
                // Log the full error for debugging
                console.error('Backend error response:', response.error);
                setUploadProgress(0);

                // Check for authentication error
                const errorString = typeof response.error === 'string' ? response.error : JSON.stringify(response.error);
                if (errorString.toLowerCase().includes('credential') ||
                    errorString.toLowerCase().includes('authenticate') ||
                    errorString.toLowerCase().includes('unauthorized')) {
                    setError('Your session has expired. Redirecting to login...');
                    setTimeout(() => router.push('/login'), 2000);
                    return;
                }

                // Handle different error formats
                if (typeof response.error === 'string') {
                    setError(response.error);
                } else if (response.error && typeof response.error === 'object' && 'detail' in response.error) {
                    // Handle FastAPI validation errors
                    const errorDetail = (response.error as any).detail;
                    if (Array.isArray(errorDetail)) {
                        const errorMessages = errorDetail.map((err: any) =>
                            `${err.loc?.join(' > ') || 'Field'}: ${err.msg}`
                        ).join('\n');
                        setError(errorMessages);
                    } else if (typeof errorDetail === 'string') {
                        setError(errorDetail);
                    } else {
                        setError(JSON.stringify(errorDetail));
                    }
                } else {
                    // Fallback: try to stringify the entire error object
                    setError(JSON.stringify(response.error) || 'An error occurred while submitting your listing.');
                }
            } else {
                setUploadProgress(100); // Complete!
                setTimeout(() => setShowSuccess(true), 300);
            }
        } catch (err: any) {
            console.error('Sell phone error:', err);
            if (err.message) {
                setError(err.message);
            } else {
                setError('An error occurred. Please try again.');
            }
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
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-violet-50/20 dark:to-violet-950/10 py-12">
            <div className="mx-auto max-w-3xl px-4 sm:px-6">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 via-indigo-600 to-purple-600 shadow-2xl shadow-violet-500/40 mb-6 animate-in zoom-in duration-500">
                        <PlusCircle className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-foreground mb-3 bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                        {t.sell_form_title}
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                        {t.sell_form_subtitle}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
                        <span className="text-xs font-medium text-violet-700 dark:text-violet-300">✨ Professional listing form with validation</span>
                    </div>
                </div>

                {/* Form */}
                <Card className="bg-card/80 backdrop-blur-sm border-2 border-border/50 shadow-2xl shadow-violet-500/10 overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-600 to-purple-600"></div>
                    <CardContent className="p-6 sm:p-10">
                        <form onSubmit={handleSubmit} className="space-y-7">
                            {/* Brand & Model Row */}
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div data-error={!!fieldErrors.brand || !!fieldErrors.customBrand}>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        {t.brand} *
                                    </label>
                                    <Select
                                        value={formData.brand}
                                        onValueChange={(value) => handleChange('brand', value)}
                                    >
                                        <SelectTrigger className={`bg-background border-input text-foreground transition-all ${fieldErrors.brand ? 'border-red-500 ring-2 ring-red-500/20' : 'hover:border-violet-500'}`}>
                                            <SelectValue placeholder={t.select_brand} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border">
                                            {PHONE_BRANDS.map((brand) => (
                                                <SelectItem key={brand} value={brand}>
                                                    {brand}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value="Other">Other (Custom Brand)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {fieldErrors.brand && (
                                        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {fieldErrors.brand}
                                        </p>
                                    )}

                                    {/* Custom Brand Input - Shows when "Other" is selected */}
                                    {formData.brand === 'Other' && (
                                        <>
                                            <Input
                                                type="text"
                                                placeholder="Enter custom brand name"
                                                value={formData.customBrand}
                                                onChange={(e) => handleChange('customBrand', e.target.value)}
                                                className={`mt-2 bg-background border-input text-foreground transition-all ${fieldErrors.customBrand ? 'border-red-500 ring-2 ring-red-500/20' : 'focus:border-violet-500'}`}
                                                required
                                            />
                                            {fieldErrors.customBrand && (
                                                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {fieldErrors.customBrand}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div data-error={!!fieldErrors.model}>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        {t.model} *
                                    </label>
                                    <Input
                                        value={formData.model}
                                        onChange={(e) => handleChange('model', e.target.value)}
                                        placeholder={t.enter_model}
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
                                        {t.storage} (GB) *
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
                                        {t.color} *
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

                            {/* Phone Specifications Row */}
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
                                <div data-error={!!fieldErrors.camera_mp}>
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
                                        className={`bg-background border-input text-foreground transition-all ${fieldErrors.camera_mp ? 'border-red-500 ring-2 ring-red-500/20' : 'focus:border-violet-500 hover:border-violet-400'}`}
                                    />
                                    {fieldErrors.camera_mp && (
                                        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {fieldErrors.camera_mp}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Seller Contact Information */}
                            <div className="space-y-2 p-4 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 rounded-xl border border-violet-200 dark:border-violet-800">
                                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Smartphone className="h-4 w-4 text-violet-600" />
                                    Seller Contact Information
                                </h3>
                                <p className="text-xs text-muted-foreground">Provide your contact details for potential buyers</p>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div data-error={!!fieldErrors.seller_phone}>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Phone Number *
                                    </label>
                                    <Input
                                        type="tel"
                                        value={formData.seller_phone}
                                        onChange={(e) => handleChange('seller_phone', e.target.value)}
                                        placeholder="e.g., +923001234567"
                                        className={`bg-background border-input text-foreground transition-all ${fieldErrors.seller_phone ? 'border-red-500 ring-2 ring-red-500/20' : 'focus:border-violet-500 hover:border-violet-400'}`}
                                    />
                                    {fieldErrors.seller_phone && (
                                        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {fieldErrors.seller_phone}
                                        </p>
                                    )}
                                </div>
                                <div data-error={!!fieldErrors.seller_city}>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        City *
                                    </label>
                                    <Input
                                        value={formData.seller_city}
                                        onChange={(e) => handleChange('seller_city', e.target.value)}
                                        placeholder="e.g., Karachi, Lahore, Islamabad"
                                        className={`bg-background border-input text-foreground transition-all ${fieldErrors.seller_city ? 'border-red-500 ring-2 ring-red-500/20' : 'focus:border-violet-500 hover:border-violet-400'}`}
                                    />
                                    {fieldErrors.seller_city && (
                                        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {fieldErrors.seller_city}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Condition Row */}
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div data-error={!!fieldErrors.condition_grade}>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        {t.condition} Grade (6-10) *
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
                                    <p className="text-xs text-muted-foreground mt-1.5">
                                        💡 Higher grades indicate better condition
                                    </p>
                                </div>
                                <div data-error={!!fieldErrors.condition_category}>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        {t.condition} Category *
                                    </label>
                                    <Select
                                        value={formData.condition_category}
                                        onValueChange={(value) => handleChange('condition_category', value)}
                                    >
                                        <SelectTrigger className={`bg-background border-input text-foreground ${fieldErrors.condition_category ? 'border-red-500 ring-2 ring-red-500/20' : ''}`}>
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
                                        {t.price} (PKR) *
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) => handleChange('price', e.target.value)}
                                        placeholder={t.enter_price}
                                        className={`bg-background border-input text-foreground transition-all ${fieldErrors.price ? 'border-red-500 ring-2 ring-red-500/20' : 'focus:border-violet-500 hover:border-violet-400'}`}
                                    />
                                    {fieldErrors.price && (
                                        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {fieldErrors.price}
                                        </p>
                                    )}
                                </div>
                                <div data-error={!!fieldErrors.original_price}>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Original Price (PKR) <span className="text-muted-foreground text-xs">(Optional)</span>
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={formData.original_price}
                                        onChange={(e) => handleChange('original_price', e.target.value)}
                                        placeholder="Optional"
                                        className={`bg-background border-input text-foreground transition-all ${fieldErrors.original_price ? 'border-red-500 ring-2 ring-red-500/20' : 'focus:border-violet-500 hover:border-violet-400'}`}
                                    />
                                    {fieldErrors.original_price && (
                                        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {fieldErrors.original_price}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Battery & Warranty Row */}
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div data-error={!!fieldErrors.battery_health}>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        {t.battery_health} (%) <span className="text-muted-foreground text-xs">(Optional)</span>
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.battery_health}
                                        onChange={(e) => handleChange('battery_health', e.target.value)}
                                        placeholder="e.g., 92"
                                        className={`bg-background border-input text-foreground transition-all ${fieldErrors.battery_health ? 'border-red-500 ring-2 ring-red-500/20' : 'focus:border-violet-500 hover:border-violet-400'}`}
                                    />
                                    {fieldErrors.battery_health && (
                                        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {fieldErrors.battery_health}
                                        </p>
                                    )}
                                </div>
                                <div data-error={!!fieldErrors.warranty_months}>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        {t.warranty} ({t.months}) <span className="text-muted-foreground text-xs">(Optional)</span>
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="24"
                                        value={formData.warranty_months}
                                        onChange={(e) => handleChange('warranty_months', e.target.value)}
                                        placeholder="0"
                                        className={`bg-background border-input text-foreground transition-all ${fieldErrors.warranty_months ? 'border-red-500 ring-2 ring-red-500/20' : 'focus:border-violet-500 hover:border-violet-400'}`}
                                    />
                                    {fieldErrors.warranty_months && (
                                        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {fieldErrors.warranty_months}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* PTA Approval - Enhanced Visibility */}
                            <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-2 border-emerald-400 dark:border-emerald-600 rounded-xl shadow-lg">
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
                                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <label className="text-base font-bold text-foreground block">
                                                        PTA Approved Device
                                                    </label>
                                                    <p className="text-xs text-muted-foreground">
                                                        Pakistan Telecommunication Authority Approval
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground pl-12">
                                                Toggle to indicate if this phone is PTA approved for use in Pakistan
                                            </p>
                                        </div>

                                        {/* Large Toggle with Label */}
                                        <div className="flex flex-col items-center gap-2 shrink-0">
                                            <Switch
                                                checked={formData.pta_approved}
                                                onCheckedChange={(checked: boolean) => handleChange('pta_approved', checked)}
                                                className="data-[state=checked]:bg-emerald-500 h-8 w-16 scale-125"
                                            />
                                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${formData.pta_approved
                                                ? 'bg-emerald-500 text-white shadow-lg'
                                                : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                                }`}>
                                                {formData.pta_approved ? '✓ Approved' : '✗ Not Approved'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Information Box */}
                                    <div className="pl-12 pt-2 border-t border-emerald-200 dark:border-emerald-800">
                                        <p className="text-xs text-muted-foreground flex items-start gap-2">
                                            <span className="text-lg">💡</span>
                                            <span className="leading-relaxed">
                                                <strong className="text-emerald-700 dark:text-emerald-400">Important:</strong> PTA approved phones have better resale value, are legally compliant, and can be used without restrictions in Pakistan.
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Image Upload Section */}
                            <div className="space-y-6">
                                {/* Section Header */}
                                <div className="p-4 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 rounded-xl border border-violet-200 dark:border-violet-800">
                                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4 text-violet-600" />
                                        Product Images
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1">Upload high-quality photos (up to 6 images)</p>
                                </div>

                                {/* Display Images Error if present */}
                                {fieldErrors.images && images.length === 0 && (
                                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                                        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            {fieldErrors.images}
                                        </p>
                                    </div>
                                )}

                                {/* Thumbnail Image (Required) */}
                                <div data-error={!!fieldErrors.images && images.length === 0}>
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
                                    {t.defects} <span className="text-muted-foreground text-xs">(Optional)</span>
                                </label>
                                <textarea
                                    value={formData.defects}
                                    onChange={(e) => handleChange('defects', e.target.value)}
                                    placeholder={t.enter_defects}
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all hover:border-violet-400"
                                />
                                <p className="text-xs text-muted-foreground mt-1.5">
                                    💡 Be honest about any defects to build trust with buyers
                                </p>
                            </div>

                            {/* Accessories */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    {t.accessories} <span className="text-muted-foreground text-xs">(Optional)</span>
                                </label>
                                <Input
                                    value={formData.accessories_included}
                                    onChange={(e) => handleChange('accessories_included', e.target.value)}
                                    placeholder="e.g., Original box, charger, cable"
                                    className="bg-background border-input text-foreground transition-all focus:border-violet-500 hover:border-violet-400"
                                />
                                <p className="text-xs text-muted-foreground mt-1.5">
                                    💡 Including original accessories can increase your phone's value
                                </p>
                            </div>

                            {/* Error Display */}
                            {(error || Object.keys(fieldErrors).length > 0) && (
                                <div className="space-y-3">
                                    {/* General Error */}
                                    {error && (
                                        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 shadow-lg shrink-0">
                                                <AlertCircle className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">Validation Error</h4>
                                                <div className="whitespace-pre-line text-sm text-red-600 dark:text-red-300">{error}</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Field Errors Summary */}
                                    {Object.keys(fieldErrors).length > 0 && (
                                        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-800">
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertCircle className="h-4 w-4 text-amber-600" />
                                                <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                                                    {Object.keys(fieldErrors).length} field{Object.keys(fieldErrors).length > 1 ? 's' : ''} need{Object.keys(fieldErrors).length === 1 ? 's' : ''} attention
                                                </h4>
                                            </div>
                                            <p className="text-xs text-amber-700 dark:text-amber-400">
                                                Please scroll up and fix the highlighted fields marked in red
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="pt-4 space-y-4">
                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-2xl shadow-violet-500/40 font-bold h-16 text-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                            <span>Submitting Your Listing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <PlusCircle className="mr-2 h-6 w-6" />
                                            <span>{t.submit_listing}</span>
                                        </>
                                    )}
                                </Button>

                                {/* Upload Progress Bar */}
                                {loading && uploadProgress > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground font-medium">
                                                {uploadProgress < 20 ? 'Preparing upload...' :
                                                    uploadProgress < 40 ? 'Uploading images...' :
                                                        uploadProgress < 60 ? 'Processing...' :
                                                            uploadProgress < 80 ? 'Saving listing...' :
                                                                'Almost done!'}
                                            </span>
                                            <span className="text-primary font-bold">{uploadProgress}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-500 ease-out rounded-full"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Notice */}
                                <div className="p-3 bg-muted/30 border border-border rounded-lg">
                                    <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                                        <span className="text-base">⚠️</span>
                                        <span>Your listing will be reviewed by our admin team before it goes live.</span>
                                    </p>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

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
                                {t.listing_success}
                            </DialogTitle>
                            <DialogDescription className="text-center text-muted-foreground text-base">
                                {t.listing_pending}
                                <p className="mt-2 text-sm italic font-medium text-emerald-600 dark:text-emerald-400">
                                    Our team will review it within 24 hours.
                                </p>
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
                                        seller_phone: '',
                                        seller_city: '',
                                        pta_approved: false,
                                    });
                                    setImages([]);
                                    setImagePreviews([]);
                                    setFieldErrors({});
                                }}
                                className="border-border hover:bg-muted font-semibold rounded-xl h-12"
                            >
                                List Another
                            </Button>
                            <Button
                                onClick={() => router.push('/my-listings')}
                                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20 font-bold rounded-xl h-12"
                            >
                                View My Listings
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
