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
        <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 group-hover:shadow-violet-500/40 transition-shadow">
                            <Smartphone className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                            PhoneShop
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex md:items-center md:gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all"
                            >
                                <link.icon className="h-4 w-4" />
                                {link.label}
                            </Link>
                        ))}
                        {isAdmin && (
                            <Link
                                href="/admin/dashboard"
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-500 hover:text-amber-400 hover:bg-muted/50 rounded-lg transition-all"
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
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                        >
                            <Globe className="h-4 w-4" />
                            <span className="text-xs font-medium">
                                {language === 'en' ? 'اردو' : 'EN'}
                            </span>
                        </Button>

                        {/* Cart Link */}
                        <Link href="/cart">
                            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground hover:bg-muted/50">
                                <ShoppingCart className="h-5 w-5" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
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
                                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                                    >
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600">
                                            <User className="h-4 w-4 text-white" />
                                        </div>
                                        <span className="hidden sm:inline text-sm font-medium">
                                            {user?.name?.split(' ')[0]}
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
                                    <div className="px-3 py-2 border-b border-border">
                                        <p className="text-sm font-medium text-foreground">{user?.name}</p>
                                        <p className="text-xs text-muted-foreground">{user?.email}</p>
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
                                    <DropdownMenuSeparator className="bg-border" />
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
                                <Button variant="ghost" size="sm" className="text-muted-foreground">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-72 bg-background border-border">
                                <div className="flex flex-col gap-4 mt-8">
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all"
                                        >
                                            <link.icon className="h-5 w-5" />
                                            {link.label}
                                        </Link>
                                    ))}
                                    {isAdmin && (
                                        <Link
                                            href="/admin/dashboard"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 text-amber-500 hover:bg-muted/50 rounded-lg transition-all"
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
