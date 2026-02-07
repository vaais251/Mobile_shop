'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Smartphone,
    Mail,
    Lock,
    User,
    Phone,
    Loader2,
    AlertCircle,
    CheckCircle,
    MapPin,
} from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const { login, signup } = useAuth();
    const { t } = useLanguage();

    const [activeTab, setActiveTab] = useState('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Login form
    const [loginData, setLoginData] = useState({
        email: '',
        password: '',
    });

    // Signup form
    const [signupData, setSignupData] = useState({
        email: '',
        password: '',
        name: '',
        phone_number: '',
        city: '',
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await login(loginData.email, loginData.password);

        if (result.success) {
            setSuccess(t.login_success);
            setTimeout(() => router.push('/'), 1000);
        } else {
            setError(result.error || 'Login failed');
        }

        setLoading(false);
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (signupData.password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        const result = await signup(signupData);

        if (result.success) {
            setSuccess(t.signup_success);
            setTimeout(() => router.push('/'), 1000);
        } else {
            setError(result.error || 'Signup failed');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-700 shadow-xl shadow-violet-500/30 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-2xl" />
                            <svg width="32" height="32" viewBox="0 0 120 120" className="relative z-10" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                        <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                            Skardu Mobile
                        </span>
                    </Link>
                </div>

                <Card className="bg-card/80 border-border backdrop-blur-xl shadow-2xl">
                    <CardContent className="p-6">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted">
                                <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    {t.login}
                                </TabsTrigger>
                                <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    {t.signup}
                                </TabsTrigger>
                            </TabsList>

                            {/* Login Tab */}
                            <TabsContent value="login">
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            {t.email}
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="email"
                                                value={loginData.email}
                                                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                                placeholder="you@example.com"
                                                className="pl-10 bg-background border-input text-foreground"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            {t.password}
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="password"
                                                value={loginData.password}
                                                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                                placeholder="••••••••"
                                                className="pl-10 bg-background border-input text-foreground"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                                            <AlertCircle className="h-4 w-4" />
                                            {error}
                                        </div>
                                    )}

                                    {success && (
                                        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm">
                                            <CheckCircle className="h-4 w-4" />
                                            {success}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            t.login
                                        )}
                                    </Button>
                                </form>
                            </TabsContent>

                            {/* Signup Tab */}
                            <TabsContent value="signup">
                                <form onSubmit={handleSignup} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            {t.name}
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="text"
                                                value={signupData.name}
                                                onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                                                placeholder="Ali Ahmed"
                                                className="pl-10 bg-background border-input text-foreground"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            {t.email}
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="email"
                                                value={signupData.email}
                                                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                                                placeholder="you@example.com"
                                                className="pl-10 bg-background border-input text-foreground"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            {t.phone_number}
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="tel"
                                                value={signupData.phone_number}
                                                onChange={(e) => setSignupData({ ...signupData, phone_number: e.target.value })}
                                                placeholder="+92 300 1234567"
                                                className="pl-10 bg-background border-input text-foreground"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            City <span className="text-destructive">*</span>
                                        </label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="text"
                                                value={signupData.city}
                                                onChange={(e) => setSignupData({ ...signupData, city: e.target.value })}
                                                placeholder="Skardu, Karachi, Lahore..."
                                                className="pl-10 bg-background border-input text-foreground"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            {t.password}
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="password"
                                                value={signupData.password}
                                                onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                                                placeholder="Min 6 characters"
                                                className="pl-10 bg-background border-input text-foreground"
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                                            <AlertCircle className="h-4 w-4" />
                                            {error}
                                        </div>
                                    )}

                                    {success && (
                                        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm">
                                            <CheckCircle className="h-4 w-4" />
                                            {success}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            t.signup
                                        )}
                                    </Button>

                                    <p className="text-center text-xs text-muted-foreground">
                                        By signing up, you agree to our Terms of Service
                                    </p>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
