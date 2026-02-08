'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import {
    MessageSquare,
    Users,
    Send,
    Loader2,
    ArrowLeft,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

interface TeamMember {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface Message {
    id: number;
    sender_id: number;
    receiver_id: number | null;
    content: string;
    message_type: 'direct' | 'group';
    read: boolean;
    created_at: string;
    sender?: {
        id: number;
        name: string;
        email: string;
        role: string;
    };
}

interface Conversation {
    team_member_id: number;
    team_member_name: string;
    team_member_email: string;
    team_member_role: string;
    last_message: string | null;
    last_message_time: string | null;
    unread_count: number;
}

export default function TeamMessagesPage() {
    const router = useRouter();
    const { user, token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // State
    const [activeTab, setActiveTab] = useState<'direct' | 'group'>('direct');
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [directMessages, setDirectMessages] = useState<Message[]>([]);
    const [groupMessages, setGroupMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [showMemberList, setShowMemberList] = useState(true);

    // Check team access
    useEffect(() => {
        if (user && user.role !== 'admin') {
            // TODO: Check if user is team member
            // For now, just allow admins
        }
    }, [user, router]);

    // Fetch conversations
    const fetchConversations = async () => {
        if (!token) return;

        try {
            const response = await api.get<Conversation[]>('/team/conversations', token);
            if (response.data) {
                setConversations(response.data);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    // Fetch direct messages
    const fetchDirectMessages = async (memberId: number) => {
        if (!token) return;

        try {
            const response = await api.get<Message[]>(`/team/messages/${memberId}`, token);
            if (response.data) {
                setDirectMessages(response.data);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    // Fetch group messages
    const fetchGroupMessages = async () => {
        if (!token) return;

        try {
            const response = await api.get<Message[]>('/team/group-chat', token);
            if (response.data) {
                setGroupMessages(response.data);
            }
        } catch (error) {
            console.error('Error fetching group messages:', error);
        }
    };

    // Initial load
    useEffect(() => {
        if (user && token) {
            setLoading(true);
            fetchConversations().finally(() => setLoading(false));
            if (activeTab === 'group') {
                fetchGroupMessages();
            }
        }
    }, [user, token, activeTab]);

    // Send message
    const sendMessage = async () => {
        if (!token || !messageInput.trim()) return;

        setSending(true);
        try {
            if (activeTab === 'direct' && selectedMember) {
                await api.post(
                    `/team/messages/${selectedMember.id}`,
                    { content: messageInput },
                    token
                );
                setMessageInput('');
                fetchDirectMessages(selectedMember.id);
                fetchConversations();
            } else if (activeTab === 'group') {
                await api.post(
                    '/team/group-chat',
                    { content: messageInput },
                    token
                );
                setMessageInput('');
                fetchGroupMessages();
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    // Select conversation
    const selectConversation = (conv: Conversation) => {
        setSelectedMember({
            id: conv.team_member_id,
            name: conv.team_member_name,
            email: conv.team_member_email,
            role: conv.team_member_role,
        });
        fetchDirectMessages(conv.team_member_id);
        setShowMemberList(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
            <div className="max-w-7xl mx-auto">
                <Card className="overflow-hidden shadow-xl">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                        <div className="border-b bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <MessageSquare className="h-8 w-8" />
                                    <div>
                                        <h1 className="text-2xl font-bold">Team Chat</h1>
                                        <p className="text-indigo-100 text-sm">Internal team communication</p>
                                    </div>
                                </div>
                            </div>
                            <TabsList className="bg-indigo-700/50 border-indigo-500">
                                <TabsTrigger value="direct" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600">
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Direct Messages
                                </TabsTrigger>
                                <TabsTrigger value="group" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600">
                                    <Users className="h-4 w-4 mr-2" />
                                    Group Chat
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Direct Messages Tab */}
                        <TabsContent value="direct" className="m-0">
                            <div className="flex h-[calc(100vh-300px)]">
                                {/* Member List Sidebar */}
                                <div className={`${showMemberList ? 'w-full md:w-80' : 'hidden md:block md:w-80'} border-r bg-gray-50 dark:bg-gray-900 overflow-y-auto`}>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-3">
                                            Team Members
                                        </h3>
                                        {conversations.length === 0 ? (
                                            <p className="text-sm text-gray-500 text-center py-8">
                                                No conversations yet
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {conversations.map((conv) => (
                                                    <button
                                                        key={conv.team_member_id}
                                                        onClick={() => selectConversation(conv)}
                                                        className={`w-full text-left p-3 rounded-lg transition-colors ${selectedMember?.id === conv.team_member_id
                                                                ? 'bg-indigo-100 dark:bg-indigo-900/30'
                                                                : 'hover:bg-gray-200 dark:hover:bg-gray-800'
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold">
                                                                {conv.team_member_name.charAt(0)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between">
                                                                    <p className="font-medium text-sm truncate">
                                                                        {conv.team_member_name}
                                                                    </p>
                                                                    {conv.unread_count > 0 && (
                                                                        <Badge className="bg-red-500 text-white ml-2">
                                                                            {conv.unread_count}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                {conv.last_message && (
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                                                        {conv.last_message}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Chat Window */}
                                <div className={`${showMemberList ? 'hidden md:flex' : 'flex'} flex-1 flex-col`}>
                                    {selectedMember ? (
                                        <>
                                            {/* Chat Header */}
                                            <div className="p-4 border-b flex items-center gap-3">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="md:hidden"
                                                    onClick={() => setShowMemberList(true)}
                                                >
                                                    <ArrowLeft className="h-4 w-4" />
                                                </Button>
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold">
                                                    {selectedMember.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold">{selectedMember.name}</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                                        {selectedMember.role}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Messages */}
                                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                                {directMessages.map((msg) => {
                                                    const isOwn = msg.sender_id === user?.id;
                                                    return (
                                                        <div
                                                            key={msg.id}
                                                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                                        >
                                                            <div
                                                                className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${isOwn
                                                                        ? 'bg-indigo-600 text-white'
                                                                        : 'bg-gray-200 dark:bg-gray-800'
                                                                    }`}
                                                            >
                                                                <p className="text-sm">{msg.content}</p>
                                                                <p className={`text-xs mt-1 ${isOwn ? 'text-indigo-200' : 'text-gray-500'}`}>
                                                                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Input */}
                                            <div className="p-4 border-t">
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="Type a message..."
                                                        value={messageInput}
                                                        onChange={(e) => setMessageInput(e.target.value)}
                                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                                    />
                                                    <Button
                                                        onClick={sendMessage}
                                                        disabled={sending || !messageInput.trim()}
                                                        className="bg-indigo-600 hover:bg-indigo-700"
                                                    >
                                                        {sending ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Send className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center text-gray-500">
                                            Select a team member to start chatting
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        {/* Group Chat Tab */}
                        <TabsContent value="group" className="m-0">
                            <div className="flex flex-col h-[calc(100vh-300px)]">
                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {groupMessages.map((msg) => {
                                        const isOwn = msg.sender_id === user?.id;
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className="max-w-2xl">
                                                    {!isOwn && msg.sender && (
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 ml-2">
                                                            {msg.sender.name}
                                                        </p>
                                                    )}
                                                    <div
                                                        className={`px-4 py-2 rounded-2xl ${isOwn
                                                                ? 'bg-indigo-600 text-white'
                                                                : 'bg-gray-200 dark:bg-gray-800'
                                                            }`}
                                                    >
                                                        <p className="text-sm">{msg.content}</p>
                                                        <p className={`text-xs mt-1 ${isOwn ? 'text-indigo-200' : 'text-gray-500'}`}>
                                                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Input */}
                                <div className="p-4 border-t">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Type a message to the team..."
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        />
                                        <Button
                                            onClick={sendMessage}
                                            disabled={sending || !messageInput.trim()}
                                            className="bg-indigo-600 hover:bg-indigo-700"
                                        >
                                            {sending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Send className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>
        </div>
    );
}
