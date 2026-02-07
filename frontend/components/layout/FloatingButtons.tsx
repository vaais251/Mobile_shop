'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X, Send, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

export function FloatingButtons() {
    const { user, token } = useAuth();
    const [showMessageForm, setShowMessageForm] = useState(false);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const whatsappNumber = '+923129880111'; // Shop WhatsApp number
    const whatsappMessage = encodeURIComponent('Hi! I have a question about your mobile store.');
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${whatsappMessage}`;

    const handleSendMessage = async () => {
        if (!message.trim()) return;

        setSending(true);
        try {
            // For now, we'll just send to a simple endpoint
            // In production, this would create a message in the database
            await api.post('/messages', {
                content: message,
                sender_id: user?.id,
                sender_name: user?.name || 'Guest',
                sender_email: user?.email || 'anonymous',
            }, token || undefined);

            setSent(true);
            setMessage('');
            setTimeout(() => {
                setSent(false);
                setShowMessageForm(false);
            }, 2000);
        } catch (error) {
            console.error('Error sending message:', error);
            // Fallback: open email
            const emailBody = encodeURIComponent(message);
            const emailSubject = encodeURIComponent('Customer Inquiry from Mobile Store');
            window.open(`mailto:support@mobilestore.pk?subject=${emailSubject}&body=${emailBody}`);
            setShowMessageForm(false);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
            {/* Message Form Popup */}
            {showMessageForm && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-border p-4 w-80 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-foreground">Message Admin</h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setShowMessageForm(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {sent ? (
                        <div className="text-center py-6">
                            <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                                <MessageCircle className="h-6 w-6 text-emerald-500" />
                            </div>
                            <p className="text-emerald-600 dark:text-emerald-400 font-medium">Message sent!</p>
                            <p className="text-sm text-muted-foreground">We'll get back to you soon.</p>
                        </div>
                    ) : (
                        <>
                            {user ? (
                                <p className="text-xs text-muted-foreground mb-2">
                                    Sending as: <span className="font-medium">{user.name}</span>
                                </p>
                            ) : (
                                <p className="text-xs text-muted-foreground mb-2">
                                    You're sending as a guest. Log in for faster responses.
                                </p>
                            )}

                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your message here..."
                                className="w-full h-24 resize-none rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />

                            <Button
                                onClick={handleSendMessage}
                                disabled={!message.trim() || sending}
                                className="w-full mt-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium"
                            >
                                {sending ? (
                                    'Sending...'
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-2" />
                                        Send Message
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </div>
            )}

            {/* Message Button */}
            <Button
                onClick={() => setShowMessageForm(!showMessageForm)}
                className={`h-14 w-14 rounded-full shadow-xl transition-all hover:scale-110 ${showMessageForm
                    ? 'bg-zinc-800 hover:bg-zinc-700'
                    : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700'
                    } text-white`}
                title="Message Admin"
            >
                {showMessageForm ? (
                    <X className="h-6 w-6" />
                ) : (
                    <MessageCircle className="h-6 w-6" />
                )}
            </Button>

            {/* WhatsApp Button */}
            <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-14 w-14 rounded-full bg-[#25D366] hover:bg-[#1DA851] shadow-xl flex items-center justify-center transition-all hover:scale-110"
                title="Chat on WhatsApp"
            >
                <svg className="h-7 w-7 fill-white" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
            </a>
        </div>
    );
}
