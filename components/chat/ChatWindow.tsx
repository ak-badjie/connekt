'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ChatService } from '@/lib/services/chat-service';
import { Conversation, Message } from '@/lib/types/chat.types';
import { ChatInput } from './ChatInput';
import { MessageBubble } from './MessageBubble';
import { HelpRequestModal } from './HelpRequestModal';
import { ContractReviewModal } from './ContractReviewModal';
import { Loader2, MoreVertical, Phone, Video, Info, ArrowLeft, HandHelping } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MeetingService } from '@/lib/services/meeting-service';
import { useConference } from '@/components/conference/ConferenceProvider';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';
import { AIConversationSummarizerModal } from './ai/AIConversationSummarizerModal';

interface ChatWindowProps {
    conversationId: string;
    onBack?: () => void; // For mobile or sidebar view
}

export function ChatWindow({ conversationId, onBack }: ChatWindowProps) {
    const { user, userProfile } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [loading, setLoading] = useState(true);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [selectedHelpMessage, setSelectedHelpMessage] = useState<Message | null>(null);
    const [showSummarizer, setShowSummarizer] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { startMeeting } = useConference();

    useEffect(() => {
        if (!conversationId) return;

        setLoading(true);

        // Fetch conversation details
        // In a real app, we might want to subscribe to this too for title changes etc.
        const fetchConv = async () => {
            // We need a getConversation method in ChatService, or just use onSnapshot
            // For now, let's assume we can get it or it's passed in.
            // Actually, let's just use the listener for messages and maybe a one-time fetch for details
            // or a separate listener for the conversation doc.
        };

        // Subscribe to messages
        const unsubscribeMessages = ChatService.subscribeToMessages(conversationId, (msgs) => {
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

        return () => {
            unsubscribeMessages();
        };
    }, [conversationId, user]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (content: string, type: 'text' | 'image' | 'video' | 'audio' | 'file', attachments?: File[]) => {
        if (!user || !userProfile) return;

        await ChatService.sendMessage({
            conversationId,
            senderId: user.uid,
            senderUsername: userProfile.username || 'Unknown',
            senderAvatarUrl: userProfile.photoURL || undefined,
            content,
            type,
            attachments,
            attachmentMetadata: attachments?.map(f => {
                const mime = f.type;
                if (mime.startsWith('image/')) return { type: 'image' };
                if (mime.startsWith('video/')) return { type: 'video' };
                if (mime.startsWith('audio/')) return { type: 'audio' };
                return { type: 'file' };
            })
        });
    };

    if (loading) {
        return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#008080]" /></div>;
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900">
            {/* Header */}
            <div className="h-16 border-b border-gray-200 dark:border-zinc-800 flex items-center px-4 justify-between bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button onClick={onBack} className="md:hidden p-2 -ml-2 text-gray-500">
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold">
                        {/* Avatar placeholder - would use conversation.photoUrl or initials */}
                        C
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100">Chat</h3>
                        <p className="text-xs text-gray-500">
                            {/* Member count or status */}
                            Active now
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-gray-500">
                    <button
                        onClick={() => setIsHelpModalOpen(true)}
                        className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-full transition-colors mr-2"
                        title="Ask for Help"
                    >
                        <HandHelping size={20} />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <Phone size={20} />
                    </button>
                    <button
                        onClick={async () => {
                            if (!user) return;
                            try {
                                // Create a new meeting
                                const meetingId = await MeetingService.createMeeting({
                                    title: 'Instant Meeting',
                                    startTime: Date.now(),
                                    duration: 60,
                                    hostId: user.uid,
                                    hostName: userProfile?.username || 'Host',
                                    participants: [user.uid], // Add other members if available
                                    type: 'video',
                                    conversationId: conversationId
                                });

                                // Send system message with join link
                                await ChatService.sendMessage({
                                    conversationId,
                                    senderId: user.uid,
                                    senderUsername: 'System',
                                    content: `🎥 Video meeting started. Join here: [Join Meeting](${meetingId})`, // In real app, use a proper link or action
                                    type: 'text'
                                });

                                // Start meeting locally
                                startMeeting(meetingId);
                            } catch (error) {
                                console.error("Failed to start meeting:", error);
                            }
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                    >
                        <Video size={20} />
                    </button>
                    <button
                        onClick={() => setShowSummarizer(true)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                        title="AI Conversation Summarizer"
                    >
                        <ConnektAIIcon className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <Info size={20} />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-black/20">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                        <div className="w-20 h-20 bg-gray-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                            <MoreVertical size={32} />
                        </div>
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        // Check if previous message was from same sender to group avatars
                        const isSequence = index > 0 && messages[index - 1].senderId === msg.senderId;
                        return (
                            <MessageBubble
                                key={msg.id}
                                message={msg}
                                isOwn={msg.senderId === user?.uid}
                                showAvatar={!isSequence}
                                onAcceptHelpRequest={(m) => setSelectedHelpMessage(m)}
                            />
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <ChatInput onSendMessage={handleSendMessage} />

            <HelpRequestModal
                isOpen={isHelpModalOpen}
                onClose={() => setIsHelpModalOpen(false)}
                conversationId={conversationId}
            // Pass recipient info if it's a direct chat (logic simplified here)
            // In real app, check conversation.type === 'direct' and find other member
            />

            {selectedHelpMessage && (
                <ContractReviewModal
                    isOpen={!!selectedHelpMessage}
                    onClose={() => setSelectedHelpMessage(null)}
                    message={selectedHelpMessage}
                    conversationId={conversationId}
                />
            )}

            {/* AI Conversation Summarizer Modal */}
            {showSummarizer && user && (
                <AIConversationSummarizerModal
                    userId={user.uid}
                    messages={messages}
                    lastReadIndex={undefined} // Can be calculated from conversation.memberDetails if needed
                    onClose={() => setShowSummarizer(false)}
                />
            )}
        </div>
    );
}
