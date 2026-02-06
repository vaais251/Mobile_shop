'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { ModeToggle } from '@/components/ModeToggle';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
    Smartphone,
    Menu,
    User,
    LogOut,
    Globe,
    Store,
    Users,
    PlusCircle,
    LayoutDashboard,
    Package,
    ShoppingCart,
    MessageCircle,
} from 'lucide-react';

export function Navbar() {
    const { user, isAuthenticated, isAdmin, logout } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const { cartCount } = useCart();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navLinks = [
        { href: '/', label: t.nav_shop, icon: Store },
        { href: '/community', label: t.nav_community, icon: Users },
        { href: '/sell', label: t.nav_sell, icon: PlusCircle },
    ];

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 group-hover:shadow-violet-500/40 transition-shadow">
                            <Smartphone className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            PhoneShop
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex md:items-center md:gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all"
                            >
                                <link.icon className="h-4 w-4" />
                                {link.label}
                            </Link>
                        ))}
                        {isAdmin && (
                            <Link
                                href="/admin/dashboard"
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-400 hover:text-amber-300 hover:bg-slate-800/50 rounded-lg transition-all"
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                Admin
                            </Link>
                        )}
                    </div>

                    {/* Right side: Language toggle + User */}
                    <div className="flex items-center gap-3">
                        {/* Language Toggle */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
                            className="flex items-center gap-2 text-slate-400 hover:text-white"
                        >
                            <Globe className="h-4 w-4" />
                            <span className="text-xs font-medium">
                                {language === 'en' ? 'اردو' : 'EN'}
                            </span>
                        </Button>

                        {/* Cart Link */}
                        <Link href="/cart">
                            <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white hover:bg-slate-800/50">
                                <ShoppingCart className="h-5 w-5" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                                        {cartCount}
                                    </span>
                                )}
                            </Button>
                        </Link>

                        {/* Theme Toggle */}
                        <ModeToggle />

                        {/* User Menu / Login */}
                        {isAuthenticated ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="flex items-center gap-2 text-slate-300 hover:text-white"
                                    >
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600">
                                            <User className="h-4 w-4 text-white" />
                                        </div>
                                        <span className="hidden sm:inline text-sm font-medium">
                                            {user?.name?.split(' ')[0]}
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-800">
                                    <div className="px-3 py-2 border-b border-slate-800">
                                        <p className="text-sm font-medium text-white">{user?.name}</p>
                                        <p className="text-xs text-slate-400">{user?.email}</p>
                                    </div>
                                    <DropdownMenuItem asChild>
                                        <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                                            <User className="h-4 w-4" />
                                            Profile
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/messages" className="flex items-center gap-2 cursor-pointer">
                                            <MessageCircle className="h-4 w-4" />
                                            Messages
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-slate-800" />
                                    <DropdownMenuItem
                                        onClick={logout}
                                        className="flex items-center gap-2 text-red-400 focus:text-red-400 cursor-pointer"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        {t.nav_logout}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Link href="/login">
                                <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25"
                                >
                                    {t.nav_login}
                                </Button>
                            </Link>
                        )}

                        {/* Mobile Menu */}
                        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                            <SheetTrigger asChild className="md:hidden">
                                <Button variant="ghost" size="sm" className="text-slate-400">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-72 bg-slate-950 border-slate-800">
                                <div className="flex flex-col gap-4 mt-8">
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all"
                                        >
                                            <link.icon className="h-5 w-5" />
                                            {link.label}
                                        </Link>
                                    ))}
                                    {isAdmin && (
                                        <Link
                                            href="/admin/dashboard"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 text-amber-400 hover:bg-slate-800/50 rounded-lg transition-all"
                                        >
                                            <LayoutDashboard className="h-5 w-5" />
                                            Admin Dashboard
                                        </Link>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </nav>
    );
}
