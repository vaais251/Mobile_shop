import Link from 'next/link';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

export function NotificationBell() {
    const { isAuthenticated } = useAuth();
    const unreadCount = useUnreadCount();

    if (!isAuthenticated) return null;

    return (
        <Link href="/messages">
            <Button
                variant="ghost"
                size="icon"
                className="relative text-muted-foreground hover:text-foreground hover:bg-accent/80 h-11 w-11 rounded-xl transition-all hover:scale-105"
            >
                <MessageSquare className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg ring-2 ring-background animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </Button>
        </Link>
    );
}
