'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
    id: number;
    email: string;
    name: string;
    phone_number?: string;
    role: 'admin' | 'seller' | 'buyer';
    is_verified: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

interface SignupData {
    email: string;
    password: string;
    name: string;
    phone_number?: string;
}

interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for stored token on mount
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await api.post<AuthResponse>('/auth/login/json', {
                email,
                password,
            });

            if (response.error) {
                return { success: false, error: response.error };
            }

            if (response.data) {
                const { access_token, user } = response.data;
                setToken(access_token);
                setUser(user);
                localStorage.setItem('token', access_token);
                localStorage.setItem('user', JSON.stringify(user));
                return { success: true };
            }

            return { success: false, error: 'Unknown error' };
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    };

    const signup = async (data: SignupData) => {
        try {
            const response = await api.post<AuthResponse>('/auth/signup', data);

            if (response.error) {
                return { success: false, error: response.error };
            }

            if (response.data) {
                const { access_token, user } = response.data;
                setToken(access_token);
                setUser(user);
                localStorage.setItem('token', access_token);
                localStorage.setItem('user', JSON.stringify(user));
                return { success: true };
            }

            return { success: false, error: 'Unknown error' };
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const value: AuthContextType = {
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin',
        login,
        signup,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
