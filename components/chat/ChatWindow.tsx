'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ChatService } from '@/lib/services/chat-service';
import { MeetingService } from '@/lib/services/meeting-service';
import { Message, Conversation, ConversationMember } from '@/lib/types/chat.types';
import { Meeting } from '@/lib/types/meeting.types';
import { ChatInput } from './ChatInput';
import { VideoConferenceOverlay } from '@/components/conference/VideoConferenceOverlay';
import { Loader2, Video, MoreVertical, ArrowLeft, Search, CheckCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ChatWindowProps {
    conversationId: string;
    onBack?: () => void;
}

export function ChatWindow({ conversationId, onBack }: ChatWindowProps) {
    const { user, userProfile } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [loading, setLoading] = useState(true);
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [meetingActionLoading, setMeetingActionLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. Fetch Conversation Details (Realtime)
    useEffect(() => {
        if (!conversationId) return;
        setLoading(true);

        const convRef = doc(db, 'conversations', conversationId);
        const unsubConv = onSnapshot(convRef, (docSnap) => {
            if (docSnap.exists()) {
                setConversation({ id: docSnap.id, ...docSnap.data() } as Conversation);
            }
        });

        // 2. Fetch Messages (Realtime)
        const unsubMsg = ChatService.subscribeToMessages(conversationId, (msgs) => {
            setMessages(msgs);

            const callMessage = [...msgs]
                .reverse()
                .find(msg => msg.type === 'call' && msg.relatedMeetingId);

            if (callMessage?.relatedMeetingId) {
                setActiveMeetingId(callMessage.relatedMeetingId);
            } else {
                setActiveMeetingId(null);
            }

             setLoading(false);
            
            // Mark read logic
            if (user?.uid) {
                const unread = msgs.filter(m => !m.readBy.includes(user.uid) && m.senderId !== user.uid);
                if (unread.length > 0) {
                    ChatService.markAsRead(conversationId, user.uid, unread.map(m => m.id));
                }
            }
        });

        return () => {
            unsubConv();
            unsubMsg();
        };
    }, [conversationId, user]);

    useEffect(() => {
        if (!activeMeetingId) {
            setMeeting(null);
            return;
        }

        const unsubscribe = MeetingService.subscribeToMeeting(activeMeetingId, (meetingData) => {
            if (!meetingData || meetingData.status === 'completed' || meetingData.status === 'cancelled') {
                setMeeting(null);
                setActiveMeetingId(null);
                setIsVideoOpen(false);
                return;
            }

            setMeeting(meetingData);
        });

        return () => unsubscribe();
    }, [activeMeetingId]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const getDisplayTitle = () => {
        if (!conversation) return 'Chat';
        if (conversation.title) return conversation.title;
        if (conversation.type === 'direct' && user) {
            const otherMemberId = conversation.members.find(m => m !== user.uid);
            if (otherMemberId && conversation.memberDetails?.[otherMemberId]) {
                return conversation.memberDetails[otherMemberId].username;
            }
        }
        return 'Unknown Chat';
    };

    const handleStartMeeting = async () => {
        if (!user || !userProfile || !conversation) return;

        setMeetingActionLoading(true);
        try {
            const meetingId = await MeetingService.createMeeting({
                title: conversation.title || getDisplayTitle(),
                startTime: Date.now(),
                duration: 60,
                hostId: user.uid,
                hostName: userProfile.username || user.displayName || 'Host',
                participants: conversation.members,
                type: 'video',
                conversationId: conversation.id,
            });

            await MeetingService.updateMeetingStatus(meetingId, 'active');

            await ChatService.sendMessage({
                conversationId,
                senderId: user.uid,
                senderUsername: userProfile.username || 'User',
                content: `🎥 ${userProfile.username || 'Host'} started a secure video call.`,
                type: 'call',
                relatedMeetingId: meetingId
            });

            setActiveMeetingId(meetingId);
            setIsVideoOpen(true);
        } catch (error) {
            console.error('Error starting meeting:', error);
        } finally {
            setMeetingActionLoading(false);
        }
    };

    const handleJoinMeeting = async () => {
        if (!user || !activeMeetingId) return;

        setMeetingActionLoading(true);
        try {
            await MeetingService.joinMeeting(activeMeetingId, user.uid);
            setIsVideoOpen(true);
        } catch (error) {
            console.error('Error joining meeting:', error);
        } finally {
            setMeetingActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-[#e5ddd5] dark:bg-[#0b141a]">
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

                {/* Header */}
                <div className="h-16 bg-[#f0f2f5] dark:bg-[#202c33] px-4 flex items-center justify-between z-10 shadow-sm border-b border-gray-200 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        {onBack && (
                            <button onClick={onBack} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors">
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-zinc-600 overflow-hidden relative flex items-center justify-center">
                            {conversation?.photoUrl ? (
                                <img src={conversation.photoUrl} alt="Group" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-gray-500 dark:text-gray-300 font-bold">
                                    {getDisplayTitle()[0]?.toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div className="cursor-pointer">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight">
                                {getDisplayTitle()}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {conversation?.members.length} members
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-[#54656f] dark:text-[#aebac1]">
                        {/* Video / Join Button */}
                        {activeMeetingId ? (
                            <motion.button
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                onClick={handleJoinMeeting}
                                disabled={meetingActionLoading}
                                className={`bg-[#00a884] text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 animate-pulse transition-all ${meetingActionLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#008f6f]'}`}
                            >
                                <Video size={16} />
                                JOIN LIVE
                            </motion.button>
                        ) : (
                            <button 
                                onClick={handleStartMeeting}
                                disabled={meetingActionLoading}
                                className={`p-2 rounded-full transition-colors ${meetingActionLoading ? 'opacity-50 cursor-not-allowed bg-gray-200/80 text-gray-400 dark:bg-zinc-700/80' : 'hover:bg-gray-200 dark:hover:bg-zinc-700 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-200'}`}
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
                    {messages.map((msg, index) => {
                        const isOwn = msg.senderId === user?.uid;
                        
                        // Handle 'call' system messages differently
                        if (msg.type === 'call') {
                             return (
                                 <div key={msg.id} className="flex justify-center my-4">
                                     <div className="bg-[#e1f5fe] dark:bg-[#1f2c33] px-4 py-2 rounded-lg text-xs text-gray-600 dark:text-gray-300 shadow-sm border border-blue-100 dark:border-transparent">
                                         🎥 {msg.senderUsername} started a video call
                                     </div>
                                 </div>
                             );
                        }

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
                                    {/* Sender Name (if group and not own) */}
                                    {!isOwn && conversation?.type !== 'direct' && (
                                        <p className={`text-xs font-bold mb-1 ${
                                            ['text-orange-500', 'text-purple-500', 'text-blue-500', 'text-pink-500'][msg.senderUsername.length % 4]
                                        }`}>
                                            {msg.senderUsername}
                                        </p>
                                    )}

                                    {/* Content */}
                                    <div className="pr-16 min-w-[80px] break-words">
                                        {msg.content}
                                        {/* Render attachments links if any */}
                                        {msg.attachments && msg.attachments.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {msg.attachments.map((att, i) => (
                                                     <a key={i} href={att.url} target="_blank" rel="noreferrer" className="block text-xs text-blue-500 underline">
                                                         📎 {att.name}
                                                     </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Meta (Time + Check) */}
                                    <div className="absolute bottom-1 right-2 flex items-center gap-1">
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                            {msg.createdAt?.seconds ? format(new Date(msg.createdAt.seconds * 1000), 'HH:mm') : ''}
                                        </span>
                                        {isOwn && (
                                            <span className={msg.readBy.length > 1 ? "text-[#53bdeb]" : "text-gray-400"}>
                                                <CheckCheck size={14} />
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="bg-[#f0f2f5] dark:bg-[#202c33] z-10 px-2 py-2">
                    <ChatInput 
                        onSendMessage={async (text, type, files) => {
                            if(!user) return;
                            await ChatService.sendMessage({
                                 conversationId,
                                 senderId: user.uid,
                                 senderUsername: userProfile?.username || 'User',
                                 senderAvatarUrl: userProfile?.photoURL || undefined,
                                 content: text,
                                 type: type as any,
                                 attachments: files,
                                 attachmentMetadata: files?.map(f => ({ type: f.type.startsWith('image') ? 'image' : 'file' }))
                            });
                        }} 
                    />
                </div>
            </div>

            <VideoConferenceOverlay
                isOpen={isVideoOpen}
                onClose={() => setIsVideoOpen(false)}
                meetingTitle={meeting?.title || getDisplayTitle()}
                meetingId={activeMeetingId}
                meeting={meeting}
                conversationId={conversationId}
                members={conversation?.memberDetails || {}}
                currentUserId={user?.uid || ''}
            />
        </>
    );
}
