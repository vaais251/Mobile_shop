'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    MessageSquare,
    Loader2,
    ArrowLeft,
    Mail,
    Clock,
    CheckCircle,
    Send,
    Trash2,
    User,
} from 'lucide-react';
import Link from 'next/link';

interface Message {
    id: number;
    sender_id: number | null;
    sender_name: string;
    sender_email: string;
    content: string;
    is_read: boolean;
    is_from_admin: boolean;
    created_at: string;
}

export default function AdminMessagesPage() {
    const { isAdmin, token, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [sending, setSending] = useState(false);
    const [filterUnread, setFilterUnread] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            if (!isAdmin) {
                router.push('/');
            } else {
                fetchMessages();
            }
        }
    }, [authLoading, isAdmin, router]);

    const fetchMessages = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await api.get<Message[]>('/messages/admin/all', token);
            if (response.data) {
                setMessages(response.data);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (messageId: number) => {
        if (!token) return;
        try {
            await api.patch(`/messages/admin/${messageId}/read`, {}, token);
            setMessages(messages.map(m => m.id === messageId ? { ...m, is_read: true } : m));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleReply = async () => {
        if (!token || !selectedMessage || !replyContent.trim()) return;
        setSending(true);
        try {
            await api.post('/messages/admin/reply', {
                content: replyContent,
                user_email: selectedMessage.sender_email
            }, token);

            // Mark original message as read
            if (!selectedMessage.is_read) {
                await handleMarkAsRead(selectedMessage.id);
            }

            setReplyContent('');
            setSelectedMessage(null);
            alert('Reply sent successfully!');
        } catch (error) {
            console.error('Error sending reply:', error);
            alert('Failed to send reply. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (messageId: number) => {
        if (!token) return;
        if (!confirm('Are you sure you want to delete this message?')) return;

        try {
            await api.delete(`/messages/admin/${messageId}`, token);
            setMessages(messages.filter(m => m.id !== messageId));
            if (selectedMessage?.id === messageId) {
                setSelectedMessage(null);
            }
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    };

    const openWhatsApp = (email: string) => {
        // Try to find user's phone from messages or use email
        const message = encodeURIComponent(`Hi! This is admin from Mobile Store. Regarding your inquiry...`);
        window.open(`mailto:${email}?subject=${encodeURIComponent('Reply from Mobile Store')}&body=${message}`);
    };

    const filteredMessages = filterUnread ? messages.filter(m => !m.is_read) : messages;
    const unreadCount = messages.filter(m => !m.is_read).length;

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <div className="container mx-auto py-10 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/dashboard">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
                        <p className="text-muted-foreground">View and respond to customer inquiries.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant={filterUnread ? "default" : "outline"}
                        onClick={() => setFilterUnread(!filterUnread)}
                        className="gap-2"
                    >
                        <Mail className="h-4 w-4" />
                        {filterUnread ? 'Show All' : `Unread (${unreadCount})`}
                    </Button>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                        <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3 mb-8">
                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{messages.length}</div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unread</CardTitle>
                        <Mail className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-500">{unreadCount}</div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Read</CardTitle>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">{messages.length - unreadCount}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Messages List */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Messages */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Inbox ({filteredMessages.length})
                        </CardTitle>
                        <CardDescription>
                            Click on a message to view details and reply.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                        {filteredMessages.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No messages found.</p>
                            </div>
                        ) : (
                            filteredMessages.map((msg) => (
                                <div
                                    key={msg.id}
                                    onClick={() => {
                                        setSelectedMessage(msg);
                                        if (!msg.is_read) handleMarkAsRead(msg.id);
                                    }}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${selectedMessage?.id === msg.id
                                            ? 'border-primary bg-primary/5'
                                            : msg.is_read
                                                ? 'border-border bg-card'
                                                : 'border-amber-500/50 bg-amber-500/5'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">{msg.sender_name}</p>
                                                <p className="text-xs text-muted-foreground">{msg.sender_email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!msg.is_read && (
                                                <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-xs">
                                                    New
                                                </Badge>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(msg.id);
                                                }}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{msg.content}</p>
                                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {formatDate(msg.created_at)}
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Message Detail & Reply */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5" />
                            {selectedMessage ? 'Reply to Message' : 'Select a Message'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedMessage ? (
                            <div className="space-y-4">
                                {/* Original Message */}
                                <div className="bg-muted/50 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-semibold">{selectedMessage.sender_name}</p>
                                                <p className="text-sm text-muted-foreground">{selectedMessage.sender_email}</p>
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {formatDate(selectedMessage.created_at)}
                                        </div>
                                    </div>
                                    <p className="text-foreground whitespace-pre-wrap">{selectedMessage.content}</p>
                                </div>

                                {/* Quick Actions */}
                                <div className="flex gap-2">
                                    <a
                                        href={`mailto:${selectedMessage.sender_email}?subject=${encodeURIComponent('Reply from Mobile Store')}`}
                                        className="flex-1"
                                    >
                                        <Button variant="outline" className="w-full gap-2">
                                            <Mail className="h-4 w-4" />
                                            Email
                                        </Button>
                                    </a>
                                </div>

                                {/* Reply Form */}
                                <div className="space-y-3">
                                    <Textarea
                                        placeholder="Type your reply here..."
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        className="min-h-[120px] resize-none"
                                    />
                                    <Button
                                        onClick={handleReply}
                                        disabled={!replyContent.trim() || sending}
                                        className="w-full gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                                    >
                                        {sending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                        {sending ? 'Sending...' : 'Send Reply'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-16 text-muted-foreground">
                                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
                                <p>Select a message to view details and reply.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
