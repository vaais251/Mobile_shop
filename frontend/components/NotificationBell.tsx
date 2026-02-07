'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { api } from '@/lib/api';
import { Notification } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface NotificationBellProps {
    token: string;
}

export function NotificationBell({ token }: NotificationBellProps) {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        const res = await api.get<Notification[]>('/notifications?limit=10', token);
        if (res.data) {
            setNotifications(res.data);
        }
    };

    const fetchUnreadCount = async () => {
        const res = await api.get<{ unread_count: number }>('/notifications/unread-count', token);
        if (res.data) {
            setUnreadCount(res.data.unread_count);
        }
    };

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 30000);

        return () => clearInterval(interval);
    }, [token]);

    const handleMarkAsRead = async (notificationId: number) => {
        setLoading(true);
        const res = await api.patch(`/notifications/${notificationId}/read`, {}, token);
        if (!res.error) {
            setNotifications(notifications.map(n =>
                n.id === notificationId ? { ...n, is_read: true } : n
            ));
            setUnreadCount(Math.max(0, unreadCount - 1));
        }
        setLoading(false);
    };

    const handleMarkAllAsRead = async () => {
        setLoading(true);
        const res = await api.patch('/notifications/mark-all-read', {}, token);
        if (!res.error) {
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        }
        setLoading(false);
    };

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read if not already
        if (!notification.is_read) {
            await handleMarkAsRead(notification.id);
        }

        // Navigate to related item based on notification type
        if (notification.related_id) {
            switch (notification.type) {
                case 'new_listing':
                    // Navigate to admin dashboard to approve/view the listing
                    router.push('/admin/dashboard');
                    break;
                case 'new_order':
                    // Navigate to admin orders page (or dashboard)
                    router.push('/admin/dashboard');
                    break;
                case 'verification_request':
                    // Navigate to users management
                    router.push('/admin/users');
                    break;
                default:
                    break;
            }
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'new_listing':
                return '📱';
            case 'new_order':
                return '🛒';
            case 'verification_request':
                return '✅';
            default:
                return '🔔';
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between px-4 py-2 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            disabled={loading}
                            className="text-xs h-7"
                        >
                            Mark all read
                        </Button>
                    )}
                </div>

                {notifications.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground text-sm">
                        No notifications yet
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <DropdownMenuItem
                            key={notification.id}
                            className={`flex flex-col items-start gap-1 p-4 cursor-pointer ${!notification.is_read ? 'bg-primary/5' : ''
                                }`}
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <div className="flex items-start gap-2 w-full">
                                <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm">{notification.title}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                                {!notification.is_read && (
                                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                                )}
                            </div>
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
