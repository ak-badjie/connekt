'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Paperclip } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
    listenToMessages,
    sendMessage,
    getConversationById,
    EnrichedConversation
} from '@/lib/services/realtime-service';
import { Message, MessageType } from '@/lib/types/chat.types';

interface ChatWindowProps {
    conversationId: string;
    onBack: () => void;
}

export function ChatWindow({ conversationId, onBack }: ChatWindowProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [conversation, setConversation] = useState<EnrichedConversation | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Load conversation details
    useEffect(() => {
        const loadConv = async () => {
            const conv = await getConversationById(conversationId);
            setConversation(conv);
        };
        loadConv();
    }, [conversationId]);

    // Listen to messages
    useEffect(() => {
        const unsubscribe = listenToMessages(conversationId, (msgs) => {
            setMessages(msgs);
            setLoading(false);
            setTimeout(() => {
                scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
            }, 100);
        });
        return () => unsubscribe();
    }, [conversationId]);

    // Get other participant name
    const getOtherName = () => {
        if (!conversation || !user) return 'Chat';
        if (conversation.type === 'direct') {
            const otherId = conversation.members.find(id => id !== user.uid);
            return conversation.enrichedParticipants?.[otherId || '']?.displayName || 'User';
        }
        return conversation.title || 'Group';
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || sending || !user) return;

        setSending(true);
        try {
            await sendMessage({
                conversationId,
                senderId: user.uid,
                senderUsername: user.displayName || 'User',
                senderAvatarUrl: user.photoURL || '',
                content: inputText,
                type: 'text' as MessageType
            });
            setInputText('');
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="h-12 flex items-center gap-2 px-3 border-b border-gray-100 bg-white">
                <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={18} />
                </button>
                <span className="font-medium text-sm truncate">{getOtherName()}</span>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 bg-gray-50 space-y-2">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-8">
                        No messages yet. Say hello!
                    </div>
                ) : (
                    messages.map(msg => {
                        const isMe = msg.senderId === user?.uid;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${isMe
                                        ? 'bg-teal-600 text-white rounded-tr-none'
                                        : 'bg-white text-gray-900 rounded-tl-none shadow-sm'
                                    }`}>
                                    <p>{msg.content}</p>
                                    <p className={`text-[10px] mt-1 ${isMe ? 'text-teal-100' : 'text-gray-400'}`}>
                                        {formatTime(msg.createdAt)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-2 border-t border-gray-100 bg-white flex gap-2">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-teal-500/50"
                />
                <button
                    type="submit"
                    disabled={!inputText.trim() || sending}
                    className="w-9 h-9 bg-teal-600 text-white rounded-full flex items-center justify-center disabled:opacity-50"
                >
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
}
