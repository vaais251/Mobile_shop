'use client';

import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Smartphone } from 'lucide-react';

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-muted/50 border-t border-border mt-auto">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-700 shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-all">
                                <Smartphone className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                                    PhoneShop
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
                                    Premium Marketplace
                                </span>
                            </div>
                        </Link>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Your trusted marketplace for buying and selling premium second-hand phones. Quality guaranteed, prices unbeatable.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/" className="text-sm text-muted-foreground hover:text-violet-600 transition-colors">
                                    Shop Phones
                                </Link>
                            </li>
                            <li>
                                <Link href="/sell" className="text-sm text-muted-foreground hover:text-violet-600 transition-colors">
                                    Sell Your Phone
                                </Link>
                            </li>
                            <li>
                                <Link href="/community" className="text-sm text-muted-foreground hover:text-violet-600 transition-colors">
                                    Community
                                </Link>
                            </li>
                            <li>
                                <Link href="/cart" className="text-sm text-muted-foreground hover:text-violet-600 transition-colors">
                                    Shopping Cart
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Contact Us</h3>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-4 w-4 text-violet-600" />
                                <a href="mailto:support@phoneshop.com" className="hover:text-violet-600 transition-colors">
                                    support@phoneshop.com
                                </a>
                            </li>
                            <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-4 w-4 text-violet-600" />
                                <a href="tel:+923001234567" className="hover:text-violet-600 transition-colors">
                                    +92 300 1234567
                                </a>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4 text-violet-600 mt-0.5" />
                                <span>Islamabad, Pakistan</span>
                            </li>
                        </ul>
                    </div>

                    {/* Social & Legal */}
                    <div>
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Follow Us</h3>
                        <div className="flex gap-3 mb-6">
                            <a
                                href="https://facebook.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-9 w-9 rounded-lg bg-muted hover:bg-violet-600 flex items-center justify-center text-muted-foreground hover:text-white transition-all"
                            >
                                <Facebook className="h-4 w-4" />
                            </a>
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-9 w-9 rounded-lg bg-muted hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600 flex items-center justify-center text-muted-foreground hover:text-white transition-all"
                            >
                                <Instagram className="h-4 w-4" />
                            </a>
                            <a
                                href="https://twitter.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-9 w-9 rounded-lg bg-muted hover:bg-blue-500 flex items-center justify-center text-muted-foreground hover:text-white transition-all"
                            >
                                <Twitter className="h-4 w-4" />
                            </a>
                        </div>
                        <div className="space-y-2">
                            <Link href="/privacy" className="block text-sm text-muted-foreground hover:text-violet-600 transition-colors">
                                Privacy Policy
                            </Link>
                            <Link href="/terms" className="block text-sm text-muted-foreground hover:text-violet-600 transition-colors">
                                Terms of Service
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-border">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-muted-foreground">
                            © {currentYear} PhoneShop. All rights reserved.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Built with ❤️ for the best phone shopping experience
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
