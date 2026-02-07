'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { PHONE_BRANDS } from '@/lib/utils';
import { Filter, X, Search } from 'lucide-react';

interface PhoneFiltersProps {
    filters: {
        brand: string;
        minPrice: string;
        maxPrice: string;
        minCondition: string;
        search: string;
        color: string;
    };
    setFilters: (filters: PhoneFiltersProps['filters']) => void;
    onApply: () => void;
    onClear: () => void;
}

export function PhoneFilters({ filters, setFilters, onApply, onClear }: PhoneFiltersProps) {
    const { t } = useLanguage();

    return (
        <div className="space-y-4">
            {/* Search Bar - Premium Style */}
            <div className="relative rounded-2xl bg-card shadow-sm" style={{
                border: '1px solid hsl(var(--border) / 0.5)',
                boxShadow: '0 1px 2px -1px hsl(var(--foreground) / 0.06), 0 2px 4px -1px hsl(var(--foreground) / 0.08), 0 4px 8px -2px hsl(var(--foreground) / 0.1)'
            }}>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by iPhone X, Samsung S21..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-11 h-12 bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                />
            </div>

            {/* Filters Grid - Premium Style */}
            <div className="p-5 rounded-2xl bg-card shadow-sm" style={{
                border: '1px solid hsl(var(--border) / 0.5)',
                boxShadow: '0 1px 2px -1px hsl(var(--foreground) / 0.06), 0 2px 4px -1px hsl(var(--foreground) / 0.08), 0 4px 8px -2px hsl(var(--foreground) / 0.1)'
            }}>
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-4 w-4 text-primary" />
                    <h3 className="font-medium text-foreground">{t.filter_by}</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                    {/* Brand */}
                    <Select
                        value={filters.brand}
                        onValueChange={(value) => setFilters({ ...filters, brand: value })}
                    >
                        <SelectTrigger className="bg-background border-input text-foreground">
                            <SelectValue placeholder={t.all_brands} />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                            <SelectItem value="all">{t.all_brands}</SelectItem>
                            {PHONE_BRANDS.map((brand) => (
                                <SelectItem key={brand} value={brand}>
                                    {brand}
                                </SelectItem>
                            ))}
                            <SelectItem value="Other">Other Brands</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Color */}
                    <Select
                        value={filters.color}
                        onValueChange={(value) => setFilters({ ...filters, color: value })}
                    >
                        <SelectTrigger className="bg-background border-input text-foreground">
                            <SelectValue placeholder="Color" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                            <SelectItem value="all">All Colors</SelectItem>
                            <SelectItem value="Black">Black</SelectItem>
                            <SelectItem value="White">White</SelectItem>
                            <SelectItem value="Gold">Gold</SelectItem>
                            <SelectItem value="Silver">Silver</SelectItem>
                            <SelectItem value="Blue">Blue</SelectItem>
                            <SelectItem value="Red">Red</SelectItem>
                            <SelectItem value="Green">Green</SelectItem>
                            <SelectItem value="Purple">Purple</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Min Price */}
                    <Input
                        type="number"
                        placeholder={t.min_price}
                        value={filters.minPrice}
                        onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                        className="bg-background border-input text-foreground placeholder:text-muted-foreground"
                    />

                    {/* Max Price */}
                    <Input
                        type="number"
                        placeholder={t.max_price}
                        value={filters.maxPrice}
                        onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                        className="bg-background border-input text-foreground placeholder:text-muted-foreground"
                    />

                    {/* Min Condition */}
                    <Select
                        value={filters.minCondition}
                        onValueChange={(value) => setFilters({ ...filters, minCondition: value })}
                    >
                        <SelectTrigger className="bg-background border-input text-foreground">
                            <SelectValue placeholder={t.min_condition} />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                            <SelectItem value="any">Any Condition</SelectItem>
                            <SelectItem value="10">10/10 Only</SelectItem>
                            <SelectItem value="9">9/10+</SelectItem>
                            <SelectItem value="8">8/10+</SelectItem>
                            <SelectItem value="7">7/10+</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Buttons */}
                    <div className="flex justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onClear}
                            className="border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                        >
                            <X className="h-4 w-4 mr-1.5" />
                            Clear Filters
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
