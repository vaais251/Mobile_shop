'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { ModeToggle } from '@/components/ModeToggle';
import { Button } from '@/components/ui/button';
import { NotificationBell } from './NotificationBell';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
    ShoppingCart,
    MessageCircle,
    Package,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Navbar() {
    const { user, isAuthenticated, isAdmin, logout } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const { cartCount } = useCart();
    const unreadCount = useUnreadCount();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();

    const navLinks = [
        { href: '/', label: t.nav_shop, icon: Store },
        { href: '/community', label: t.nav_community, icon: Users },
        { href: '/sell', label: t.nav_sell, icon: PlusCircle },
        ...(isAuthenticated ? [{ href: '/my-listings', label: 'Dashboard', icon: LayoutDashboard }] : []),
    ];

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/90 shadow-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-20 items-center justify-between gap-6">
                    {/* Logo - Skardu Mobile Branding */}
                    <Link href="/" className="flex items-center gap-3 group shrink-0">
                        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-700 shadow-xl shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-all duration-300 group-hover:scale-105 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-2xl" />
                            <svg width="28" height="28" viewBox="0 0 120 120" className="relative z-10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M35 45 Q35 30, 50 30 L70 30 Q75 30, 75 35 Q75 40, 70 40 L50 40 Q45 40, 45 45 Q45 50, 50 50 L70 50 Q85 50, 85 65 Q85 80, 70 80 L50 80 Q35 80, 35 65"
                                    stroke="white"
                                    strokeWidth="6"
                                    fill="none"
                                    strokeLinecap="round" />
                                <path d="M45 75 L45 35 L60 55 L75 35 L75 75"
                                    stroke="white"
                                    strokeWidth="6"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    transform="translate(15, 0)" />
                            </svg>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                                Skardu Mobile
                            </span>
                            <span className="text-[10px] text-muted-foreground font-semibold tracking-[0.15em] uppercase hidden sm:block">
                                Premium Collection
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation - Enhanced */}
                    <div className="hidden md:flex md:items-center md:gap-2 flex-1 justify-center">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="group flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/80 rounded-full transition-all duration-200 hover:scale-105"
                            >
                                <link.icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                <span>{link.label}</span>
                            </Link>
                        ))}
                        {isAdmin && (
                            <Link
                                href="/admin/dashboard"
                                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 hover:from-amber-500/20 hover:to-orange-500/20 rounded-full transition-all duration-200 border border-amber-500/20"
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                <span className="hidden lg:inline">Admin</span>
                            </Link>
                        )}
                    </div>

                    {/* Right Actions - Enhanced */}
                    <div className="flex items-center gap-3 shrink-0">
                        {/* Messages Notification */}
                        <NotificationBell />

                        {/* Cart Link - Premium Badge */}
                        <Link href="/cart">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative text-muted-foreground hover:text-foreground hover:bg-accent/80 h-11 w-11 rounded-xl transition-all hover:scale-105"
                            >
                                <ShoppingCart className="h-5 w-5" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-[11px] font-bold text-white shadow-lg shadow-violet-500/50 ring-2 ring-background">
                                        {cartCount > 9 ? '9+' : cartCount}
                                    </span>
                                )}
                            </Button>
                        </Link>

                        {/* Desktop: Theme + Language + User - Enhanced */}
                        <div className="hidden md:flex items-center gap-2">
                            <ModeToggle />

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
                                className="text-muted-foreground hover:text-foreground hover:bg-accent/80 h-10 px-4 rounded-xl font-medium"
                            >
                                <Globe className="h-4 w-4 mr-2" />
                                <span className="text-sm">
                                    {language === 'en' ? 'اردو' : 'EN'}
                                </span>
                            </Button>

                            {isAuthenticated ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="flex items-center gap-2.5 text-foreground hover:bg-accent/80 h-11 px-4 rounded-xl font-medium"
                                        >
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md">
                                                <User className="h-4 w-4 text-white" />
                                            </div>
                                            <span className="hidden lg:inline text-sm font-semibold">
                                                {user?.name?.split(' ')[0]}
                                            </span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-64 bg-popover border-border shadow-xl p-2">
                                        <div className="px-3 py-3 border-b border-border mb-2">
                                            <p className="text-sm font-bold text-foreground">{user?.name}</p>
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
                                        </div>
                                        <DropdownMenuItem asChild>
                                            <Link href="/profile" className="flex items-center gap-3 cursor-pointer px-3 py-2.5 rounded-lg">
                                                <User className="h-4 w-4" />
                                                <span className="font-medium">Profile</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/messages" className="flex items-center justify-between cursor-pointer px-3 py-2.5 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <MessageCircle className="h-4 w-4" />
                                                    <span className="font-medium">Messages</span>
                                                </div>
                                                {unreadCount > 0 && (
                                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                                        {unreadCount}
                                                    </span>
                                                )}
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-border my-2" />
                                        <DropdownMenuItem
                                            onClick={logout}
                                            className="flex items-center gap-3 text-destructive focus:text-destructive cursor-pointer px-3 py-2.5 rounded-lg font-medium"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            {t.nav_logout}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Link href="/login">
                                    <Button
                                        size="default"
                                        className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/30 h-11 px-6 rounded-xl font-semibold"
                                    >
                                        {t.nav_login}
                                    </Button>
                                </Link>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden text-muted-foreground h-9 w-9"
                                >
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-80 sm:w-96 bg-background/98 backdrop-blur-xl border-border p-0 z-[100]">
                                <SheetHeader className="px-6 py-5 border-b border-border">
                                    <SheetTitle className="text-left text-xl font-bold">Menu</SheetTitle>
                                </SheetHeader>

                                <div className="flex flex-col h-[calc(100%-80px)]">
                                    {/* Navigation Links */}
                                    <div className="flex-1 px-3 py-4 space-y-1">
                                        {navLinks.map((link) => (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className="flex items-center gap-3 px-4 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all"
                                            >
                                                <link.icon className="h-5 w-5" />
                                                {link.label}
                                            </Link>
                                        ))}
                                        {isAdmin && (
                                            <Link
                                                href="/admin/dashboard"
                                                onClick={() => setMobileMenuOpen(false)}
                                                className="flex items-center gap-3 px-4 py-3 text-base font-medium text-amber-600 dark:text-amber-400 hover:bg-accent rounded-lg transition-all"
                                            >
                                                <LayoutDashboard className="h-5 w-5" />
                                                Admin Dashboard
                                            </Link>
                                        )}

                                        <div className="pt-4 mt-4 border-t border-border">
                                            <p className="px-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                Settings
                                            </p>

                                            {/* Theme Toggle */}
                                            <div className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-accent">
                                                <span className="text-sm font-medium text-foreground">Theme</span>
                                                <ModeToggle />
                                            </div>

                                            {/* Language Toggle */}
                                            <button
                                                onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
                                                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-accent rounded-lg transition-all"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Globe className="h-4 w-4" />
                                                    Language
                                                </span>
                                                <span className="text-xs font-semibold text-muted-foreground">
                                                    {language === 'en' ? 'اردو' : 'EN'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* User Section */}
                                    <div className="border-t border-border px-6 py-4 bg-muted/30">
                                        {isAuthenticated ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600">
                                                        <User className="h-5 w-5 text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        asChild
                                                        className="w-full"
                                                    >
                                                        <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                                                            <User className="h-4 w-4 mr-1.5" />
                                                            Profile
                                                        </Link>
                                                    </Button>
                                                    <Link href="/messages" onClick={() => setMobileMenuOpen(false)} className="w-full">
                                                        <Button variant="outline" size="sm" className="w-full justify-between">
                                                            <div className="flex items-center">
                                                                <MessageCircle className="h-4 w-4 mr-1.5" />
                                                                Messages
                                                            </div>
                                                            {unreadCount > 0 && (
                                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                                                    {unreadCount}
                                                                </span>
                                                            )}
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            logout();
                                                            setMobileMenuOpen(false);
                                                        }}
                                                        className="w-full text-destructive hover:text-destructive col-span-2"
                                                    >
                                                        <LogOut className="h-4 w-4 mr-1.5" />
                                                        Logout
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                                                <Button
                                                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25"
                                                >
                                                    {t.nav_login}
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </nav>
    );
}
