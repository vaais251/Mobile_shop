'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
    Send,
    User as UserIcon,
    Smartphone,
    ArrowLeft,
    Loader2,
    MessageCircle,
    Trash2,
    Package
} from 'lucide-react';
import { format } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface Message {
    id: number;
    sender_id: number;
    receiver_id: number;
    message: string;
    created_at: string;
    phone_id?: number;
}

interface Conversation {
    other_user_id: number;
    other_user_name: string;
    last_message: string;
    last_message_at: string;
    unread_count: number;
}

function MessagesContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, token, isAuthenticated } = useAuth();
    const { t } = useLanguage();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedUser, setSelectedUser] = useState<{ id: number, name: string } | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [conversationsLoading, setConversationsLoading] = useState(true);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [orderNumber, setOrderNumber] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial load from query params - Auto-open chat with user
    useEffect(() => {
        const userId = searchParams.get('userId');
        const userName = searchParams.get('userName');

        if (userId) {
            const uid = parseInt(userId);
            // Set selected user immediately
            setSelectedUser({
                id: uid,
                name: userName || 'User'
            });
        }
    }, [searchParams]);

    // Fetch conversations
    const fetchConversations = async () => {
        if (!token) return;
        try {
            const response = await api.get<Conversation[]>('/chat/conversations', token);
            if (response.data) {
                setConversations(response.data);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setConversationsLoading(false);
        }
    };

    // Fetch messages for selected user
    const fetchMessages = async (otherUserId: number) => {
        if (!token) return;
        try {
            const response = await api.get<Message[]>(`/chat/messages/${otherUserId}`, token);
            if (response.data) {
                setMessages(response.data);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchConversations();
            const interval = setInterval(fetchConversations, 5000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, token]);

    useEffect(() => {
        if (selectedUser && token) {
            setLoading(true);
            fetchMessages(selectedUser.id);
            const interval = setInterval(() => fetchMessages(selectedUser.id), 3000);
            return () => clearInterval(interval);
        }
    }, [selectedUser, token]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser || !token) return;

        const phoneId = searchParams.get('phoneId');

        try {
            const response = await api.post<Message>('/chat/messages', {
                receiver_id: selectedUser.id,
                message: newMessage.trim(),
                phone_id: phoneId ? parseInt(phoneId) : null
            }, token);

            if (response.data) {
                setMessages([...messages, response.data]);
                setNewMessage('');
                fetchConversations();
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleDeleteConversation = async () => {
        if (!selectedUser || !token) return;

        setDeleting(true);
        try {
            await api.delete(`/chat/conversations/${selectedUser.id}`, token);
            // Remove conversation from list
            setConversations(conversations.filter(c => c.other_user_id !== selectedUser.id));
            setSelectedUser(null);
            setMessages([]);
            setShowDeleteDialog(false);
        } catch (error) {
            console.error('Error deleting conversation:', error);
        } finally {
            setDeleting(false);
        }
    };

    // Extract order number from query params
    useEffect(() => {
        const order = searchParams.get('orderNumber');
        setOrderNumber(order);
    }, [searchParams]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="p-8 text-center">
                        <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-4">Login Required</h2>
                        <p className="text-muted-foreground mb-6">Please login to access your messages.</p>
                        <Button onClick={() => router.push('/login')} className="w-full">Login</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-background flex overflow-hidden">
            {/* Conversations Sidebar */}
            <div className={`w-full md:w-80 border-r flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-primary" />
                        Messages
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversationsLoading ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            No conversations yet.
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv.other_user_id}
                                onClick={() => setSelectedUser({ id: conv.other_user_id, name: conv.other_user_name })}
                                className={`p-4 border-b cursor-pointer transition-colors hover:bg-muted/50 ${selectedUser?.id === conv.other_user_id ? 'bg-muted border-l-4 border-l-primary' : ''
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <p className="font-semibold truncate">{conv.other_user_name}</p>
                                    <span className="text-[10px] text-muted-foreground">
                                        {format(new Date(conv.last_message_at), 'p')}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
                                {conv.unread_count > 0 && (
                                    <div className="mt-2 flex justify-end">
                                        <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                                            {conv.unread_count}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className={`flex-1 flex flex-col ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b flex items-center justify-between bg-background/50 backdrop-blur">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden"
                                    onClick={() => setSelectedUser(null)}
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <UserIcon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">{selectedUser.name}</h3>
                                        {orderNumber ? (
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                                    <Package className="h-3 w-3" />
                                                    Order #{orderNumber}
                                                </Badge>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-emerald-500 font-medium">Online</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Delete button for admins */}
                            {user?.role === 'admin' && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowDeleteDialog(true)}
                                    className="hover:bg-destructive/10 hover:text-destructive"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            )}
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
                            {loading && messages.length === 0 ? (
                                <div className="flex items-center justify-center p-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isMe = msg.sender_id === user?.id;
                                    return (
                                        <div
                                            key={msg.id || idx}
                                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[75%] rounded-2xl p-3 shadow-sm ${isMe
                                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                : 'bg-card border rounded-tl-none'
                                                }`}>
                                                {msg.phone_id && (
                                                    <div className="mb-2 p-2 bg-black/10 rounded flex items-center gap-2 text-xs">
                                                        <Smartphone className="h-3 w-3" />
                                                        Inquiry about item #{msg.phone_id}
                                                    </div>
                                                )}
                                                <p className="text-sm">{msg.message}</p>
                                                <p className={`text-[10px] mt-1 text-right opacity-70`}>
                                                    {format(new Date(msg.created_at), 'p')}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t bg-background">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1"
                                />
                                <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                                    <Send className="h-5 w-5" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <div className="p-8 rounded-full bg-muted mb-4">
                            <MessageCircle className="h-16 w-16" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Your Conversations</h3>
                        <p>Select a message to start chatting</p>
                    </div>
                )}
            </div>

            {/* Delete Conversation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Conversation?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete all messages between you and {selectedUser?.name}.
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(false)}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConversation}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
        }>
            <MessagesContent />
        </Suspense>
    );
}
