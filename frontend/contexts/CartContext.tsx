'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PhoneInventory } from '@/lib/types';

interface CartContextType {
    cart: PhoneInventory[];
    addToCart: (phone: PhoneInventory) => void;
    removeFromCart: (phoneId: number) => void;
    clearCart: () => void;
    cartTotal: number;
    cartCount: number;
    isInCart: (phoneId: number) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<PhoneInventory[]>([]);

    useEffect(() => {
        // Load cart from localStorage
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (error) {
                localStorage.removeItem('cart');
            }
        }
    }, []);

    useEffect(() => {
        // Persist cart to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (phone: PhoneInventory) => {
        if (!cart.find((p) => p.id === phone.id)) {
            setCart([...cart, phone]);
        }
    };

    const removeFromCart = (phoneId: number) => {
        setCart(cart.filter((p) => p.id !== phoneId));
    };

    const clearCart = () => {
        setCart([]);
    };

    const cartTotal = cart.reduce((sum, item) => sum + Number(item.price), 0);
    const cartCount = cart.length;

    const isInCart = (phoneId: number) => {
        return !!cart.find((p) => p.id === phoneId);
    };

    const value: CartContextType = {
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        cartTotal,
        cartCount,
        isInCart,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
