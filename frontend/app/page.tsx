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
  Sparkles,
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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        {/* Background Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-500/15 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Certified Quality Guaranteed
              </div>

              {/* Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-foreground">{t.hero_title.split(' ').slice(0, -2).join(' ')}</span>
                <span className="gradient-text"> {t.hero_title.split(' ').slice(-2).join(' ')}</span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                {t.hero_subtitle}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="#inventory">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 text-base px-8"
                  >
                    {t.hero_cta}
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/sell">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-border hover:bg-accent hover:text-accent-foreground text-base px-8"
                  >
                    {t.sell_your_phone}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Phone Visual */}
            <div className="hidden lg:flex justify-center">
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-violet-500 to-indigo-500 rounded-3xl blur-2xl opacity-30 animate-pulse-glow" />

                {/* Phone Container */}
                <div className="relative bg-card p-12 rounded-3xl border border-border shadow-2xl animate-float">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-3xl" />
                  <Smartphone className="h-48 w-48 text-primary relative z-10" />
                </div>
              </div>
            </div>
          </div>

          {/* Features Row */}
          <div className="grid sm:grid-cols-3 gap-8 mt-20 pt-12 border-t border-border">
            <div className="flex items-center gap-4 group">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Verified Quality</h3>
                <p className="text-sm text-muted-foreground">Every phone inspected</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                <Award className="h-7 w-7 text-cyan-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Condition Graded</h3>
                <p className="text-sm text-muted-foreground">10/10 scale rating</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                <Truck className="h-7 w-7 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Fast Delivery</h3>
                <p className="text-sm text-muted-foreground">Nationwide shipping</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Inventory Section */}
      <section id="inventory" className="py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Premium Shop Inventory
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Handpicked phones from our curated collection. Each device is thoroughly
              inspected and rated for quality.
            </p>
          </div>

          {/* Filters */}
          <div className="mb-10">
            <PhoneFilters
              filters={filters}
              setFilters={setFilters}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
            />
          </div>

          {/* Phone Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-muted-foreground">Loading inventory...</p>
              </div>
            </div>
          ) : phones.length === 0 ? (
            <div className="text-center py-24">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                <Smartphone className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg">{t.no_phones_found}</p>
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
