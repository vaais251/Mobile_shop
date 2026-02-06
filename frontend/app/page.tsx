'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PhoneCard } from '@/components/phones/PhoneCard';
import { PhoneFilters } from '@/components/phones/PhoneFilters';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { PhoneInventory } from '@/lib/types';
import {
  Smartphone,
  Shield,
  Award,
  Truck,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
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
      let url = '/phones/shop?';

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
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-violet-500/5 to-background py-20 lg:py-32 border-b border-border/50">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm mb-6">
                <Award className="h-4 w-4" />
                Certified Quality Guaranteed
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                {t.hero_title}
              </h1>

              <p className="text-lg text-slate-400 mb-8 max-w-lg">
                {t.hero_subtitle}
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="#inventory">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-xl shadow-violet-500/25 text-lg px-8"
                  >
                    {t.hero_cta}
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/sell">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 text-lg px-8"
                  >
                    {t.sell_your_phone}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Phone Visual */}
            <div className="hidden lg:flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl blur-2xl opacity-30 animate-pulse" />
                <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-12 rounded-3xl border border-slate-700/50">
                  <Smartphone className="h-48 w-48 text-violet-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid sm:grid-cols-3 gap-6 mt-16 pt-16 border-t border-slate-800">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
                <Shield className="h-6 w-6 text-violet-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Verified Quality</h3>
                <p className="text-sm text-slate-400">Every phone inspected</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10">
                <Award className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Condition Graded</h3>
                <p className="text-sm text-slate-400">10/10 scale rating</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                <Truck className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Fast Delivery</h3>
                <p className="text-sm text-slate-400">Nationwide shipping</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Inventory Section */}
      <section id="inventory" className="py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">
              Premium Shop Inventory
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Handpicked phones from our curated collection. Each device is thoroughly
              inspected and rated for quality.
            </p>
          </div>

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
              <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
            </div>
          ) : phones.length === 0 ? (
            <div className="text-center py-20">
              <Smartphone className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">{t.no_phones_found}</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {phones.map((phone) => (
                <PhoneCard key={phone.id} phone={phone} variant="shop" />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
