'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PhoneCard } from '@/components/phones/PhoneCard';
import { PhoneFilters } from '@/components/phones/PhoneFilters';
import { api } from '@/lib/api';
import { PhoneInventory } from '@/lib/types';
import { Users, Smartphone, Loader2, ShieldCheck } from 'lucide-react';

export default function CommunityPage() {
    const { t } = useLanguage();
    const [phones, setPhones] = useState<PhoneInventory[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        brand: '',
        minPrice: '',
        maxPrice: '',
        minCondition: '',
    });

    const fetchPhones = async () => {
        setLoading(true);
        try {
            let url = '/phones/community?';

            if (filters.brand && filters.brand !== 'all') {
                url += `brand=${filters.brand}&`;
            }
            if (filters.minPrice) {
                url += `min_price=${filters.minPrice}&`;
            }
            if (filters.maxPrice) {
                url += `max_price=${filters.maxPrice}&`;
            }
            if (filters.minCondition && filters.minCondition !== 'any') {
                url += `min_condition=${filters.minCondition}&`;
            }

            const response = await api.get<{ items: PhoneInventory[] }>(url);
            if (response.data) {
                setPhones(response.data.items);
            }
        } catch (error) {
            console.error('Error fetching phones:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPhones();
    }, []);

    const handleApplyFilters = () => {
        fetchPhones();
    };

    const handleClearFilters = () => {
        setFilters({
            brand: '',
            minPrice: '',
            maxPrice: '',
            minCondition: '',
        });
        setTimeout(fetchPhones, 0);
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-background via-cyan-500/5 to-background py-16 border-b border-border/50">
                {/* Background */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-10 right-20 w-64 h-64 bg-cyan-600/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-10 left-20 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />
                </div>

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25">
                            <Users className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-white">
                                {t.nav_community}
                            </h1>
                            <p className="text-slate-400">Marketplace</p>
                        </div>
                    </div>

                    <p className="text-slate-400 max-w-2xl mt-4">
                        Phones listed by our community members. All listings are verified and
                        approved by our admin team before appearing here.
                    </p>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap gap-4 mt-6">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm">
                            <ShieldCheck className="h-4 w-4" />
                            Admin Verified
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                            <Users className="h-4 w-4" />
                            Community Sellers
                        </div>
                    </div>
                </div>
            </section>

            {/* Listings Section */}
            <section className="py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Filters */}
                    <div className="mb-8">
                        <PhoneFilters
                            filters={filters}
                            setFilters={setFilters}
                            onApply={handleApplyFilters}
                            onClear={handleClearFilters}
                        />
                    </div>

                    {/* Phone Grid */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
                        </div>
                    ) : phones.length === 0 ? (
                        <div className="text-center py-20">
                            <Smartphone className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400 text-lg">{t.no_phones_found}</p>
                            <p className="text-slate-500 mt-2">
                                Community listings will appear here once approved by admin.
                            </p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {phones.map((phone) => (
                                <PhoneCard key={phone.id} phone={phone} variant="community" />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
