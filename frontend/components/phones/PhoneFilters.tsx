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
import { Filter, X } from 'lucide-react';

interface PhoneFiltersProps {
    filters: {
        brand: string;
        minPrice: string;
        maxPrice: string;
        minCondition: string;
    };
    setFilters: (filters: PhoneFiltersProps['filters']) => void;
    onApply: () => void;
    onClear: () => void;
}

export function PhoneFilters({ filters, setFilters, onApply, onClear }: PhoneFiltersProps) {
    const { t } = useLanguage();

    return (
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4 text-primary" />
                <h3 className="font-medium text-foreground">{t.filter_by}</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <div className="flex gap-2">
                    <Button
                        onClick={onApply}
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                        {t.apply_filters}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onClear}
                        className="border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
