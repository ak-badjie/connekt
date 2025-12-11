'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ChatService } from '@/lib/services/chat-service';
import { MeetingService } from '@/lib/services/meeting-service';
import { Message, Conversation } from '@/lib/types/chat.types';
import { ChatInput } from './ChatInput';
import { VideoConferenceOverlay } from '../conference/VideoConferenceOverlay';
import { Loader2, Video, MoreVertical, ArrowLeft, Search, CheckCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface ChatWindowProps {
    conversationId: string;
    onBack?: () => void;
}

export function ChatWindow({ conversationId, onBack }: ChatWindowProps) {
    const { user, userProfile } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeMeeting, setActiveMeeting] = useState<any>(null);
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch Messages & Conversation
    useEffect(() => {
        if (!conversationId || !user) return;
        setLoading(true);

        // Subscribe to Messages
        const unsubMsg = ChatService.subscribeToMessages(conversationId, (msgs) => {
            setMessages(msgs);
            setLoading(false);

            // Mark as read
            if (user?.uid) {
                const unreadIds = msgs
                    .filter(m => !m.readBy.includes(user.uid) && m.senderId !== user.uid)
                    .map(m => m.id);

                if (unreadIds.length > 0) {
                    ChatService.markAsRead(conversationId, user.uid, unreadIds);
                }
            }
        });

        return () => { unsubMsg(); };
    }, [conversationId, user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleStartMeeting = async () => {
        if (!user || !userProfile) return;
        
        try {
            // Create Meeting in DB
            const meetingId = await MeetingService.createMeeting({
                title: 'Quick Team Call',
                description: 'Video call from chat',
                startTime: Date.now(),
                duration: 60,
                hostId: user.uid,
                hostName: userProfile.username || 'Host',
                participants: [user.uid],
                type: 'video',
                conversationId: conversationId
            });
            
            // Local State update
            setActiveMeeting({ id: meetingId, title: 'Quick Team Call' });
            setIsVideoOpen(true);

            // Send message to chat
            await ChatService.sendMessage({
                conversationId,
                senderId: user.uid,
                senderUsername: 'System',
                content: `🎥 Started a video call`,
                type: 'text'
            });
        } catch (error) {
            console.error('Error starting meeting:', error);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-[#efeae2] dark:bg-[#0b141a]">
                <Loader2 className="animate-spin text-[#008080]" />
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col h-full bg-[#efeae2] dark:bg-[#0b141a] relative">
                {/* Background Pattern */}
                <div 
                    className="absolute inset-0 opacity-[0.4] dark:opacity-[0.06] pointer-events-none z-0"
                    style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }} 
                />

                {/* Header - WhatsApp Style */}
                <div className="h-16 bg-[#f0f2f5] dark:bg-[#202c33] px-4 flex items-center justify-between z-10 shadow-sm border-b border-gray-200 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        {onBack && (
                            <button onClick={onBack} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors">
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-zinc-600 overflow-hidden relative">
                            <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-300 font-bold">
                                {conversation?.title?.[0] || 'C'}
                            </div>
                        </div>
                        <div className="cursor-pointer">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight">
                                {conversation?.title || 'Design Team'}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                Tap here for group info
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-[#54656f] dark:text-[#aebac1]">
                        {/* THE JOIN BUTTON (Replaces Video Icon if active) */}
                        {activeMeeting ? (
                            <motion.button
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                onClick={() => setIsVideoOpen(true)}
                                className="bg-[#00a884] hover:bg-[#008f6f] text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 animate-pulse"
                            >
                                <Video size={16} />
                                JOIN
                            </motion.button>
                        ) : (
                            <button 
                                onClick={handleStartMeeting}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors"
                                title="Start Video Call"
                            >
                                <Video size={22} />
                            </button>
                        )}
                        
                        <button className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors">
                            <Search size={22} />
                        </button>
                        <button className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors">
                            <MoreVertical size={22} />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 z-10">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                            <div className="w-20 h-20 bg-white/50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                                <MoreVertical size={32} />
                            </div>
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isOwn = msg.senderId === user?.uid;
                            const showTail = !messages[index + 1] || messages[index + 1].senderId !== msg.senderId;

                            return (
                                <motion.div 
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div 
                                        className={`relative max-w-[85%] sm:max-w-[65%] px-3 py-1.5 rounded-lg shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] text-sm
                                            ${isOwn 
                                                ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-gray-900 dark:text-gray-100 rounded-tr-none' 
                                                : 'bg-white dark:bg-[#202c33] text-gray-900 dark:text-gray-100 rounded-tl-none'
                                            }`}
                                    >
                                        {/* Tail SVG */}
                                        {showTail && (
                                            <div className={`absolute top-0 w-3 h-3 
                                                ${isOwn 
                                                    ? '-right-2 text-[#d9fdd3] dark:text-[#005c4b]' 
                                                    : '-left-2 text-white dark:text-[#202c33] transform scale-x-[-1]'
                                                }`}>
                                                <svg viewBox="0 0 8 13" height="13" width="8" preserveAspectRatio="none" className="fill-current">
                                                    <path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"></path>
                                                </svg>
                                            </div>
                                        )}

                                        {/* Sender Name in Group */}
                                        {!isOwn && (
                                            <p className={`text-xs font-bold mb-1 ${
                                                ['text-orange-500', 'text-purple-500', 'text-blue-500', 'text-pink-500'][msg.senderUsername.length % 4]
                                            }`}>
                                                {msg.senderUsername}
                                            </p>
                                        )}

                                        {/* Content */}
                                        <div className="pr-16 min-w-[80px]">
                                            {msg.content}
                                        </div>

                                        {/* Meta (Time + Check) */}
                                        <div className="absolute bottom-1 right-2 flex items-center gap-1">
                                            <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                                {msg.createdAt?.seconds ? format(new Date(msg.createdAt.seconds * 1000), 'HH:mm') : ''}
                                            </span>
                                            {isOwn && (
                                                <span className="text-[#53bdeb]">
                                                    <CheckCheck size={14} />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="bg-[#f0f2f5] dark:bg-[#202c33] z-10 px-2 py-2">
                    <ChatInput onSendMessage={async (text, type, files) => {
                        if(!user) return;
                        ChatService.sendMessage({
                             conversationId,
                             senderId: user.uid,
                             senderUsername: userProfile?.username || 'User',
                             content: text,
                             type: type as any,
                             attachments: files
                        });
                    }} />
                </div>
            </div>

            <VideoConferenceOverlay
                isOpen={isVideoOpen}
                onClose={() => setIsVideoOpen(false)}
                meetingTitle={activeMeeting?.title || conversation?.title || "Video Call"}
                participants={[
                    { id: user?.uid || '1', name: userProfile?.username || 'You', isMuted: false },
                    { id: '2', name: 'Alice', isMuted: true },
                    { id: '3', name: 'Bob', isMuted: false },
                ]}
            />
        </>
    );
}
