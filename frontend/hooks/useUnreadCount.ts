'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

export function useUnreadCount() {
    const { token, isAuthenticated } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = async () => {
        if (!token || !isAuthenticated) return;
        try {
            const response = await api.get<{ count: number }>('/chat/unread-count', token);
            if (response.data) {
                setUnreadCount(response.data.count);
            }
        } catch (error) {
            // Silently fail to not disturb user
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 10000); // Check every 10 seconds
            return () => clearInterval(interval);
        } else {
            setUnreadCount(0);
        }
    }, [isAuthenticated, token]);

    return unreadCount;
}
