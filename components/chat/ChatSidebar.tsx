'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Check, CheckCheck, Image, Mic, Paperclip } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { listenToConversations, EnrichedConversation } from '@/lib/services/realtime-service';
import { getInitials, generateCircularInitialAvatar } from '@/lib/utils/generateInitialAvatar';
import NewChatModal from './NewChatModal';

interface ChatSidebarProps {
    onSelectConversation: (conversationId: string) => void;
    onTotalUnreadChange?: (count: number) => void;
}

// Format relative time
const formatRelativeTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export function ChatSidebar({ onSelectConversation, onTotalUnreadChange }: ChatSidebarProps) {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<EnrichedConversation[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showNewChat, setShowNewChat] = useState(false);

    useEffect(() => {
        if (!user?.uid) return;

        const unsubscribe = listenToConversations(user.uid, (convs) => {
            setConversations(convs);
            setLoading(false);

            // Calculate total unread count
            let totalUnread = 0;
            convs.forEach(conv => {
                const unread = getUnreadCount(conv, user.uid);
                totalUnread += unread;
            });
            onTotalUnreadChange?.(totalUnread);
        });

        return () => unsubscribe();
    }, [user?.uid, onTotalUnreadChange]);

    // Get unread count for a conversation
    const getUnreadCount = (conv: EnrichedConversation, userId: string): number => {
        const memberDetail = conv.memberDetails?.[userId];
        const lastReadAt = memberDetail?.lastReadAt;

        if (conv.lastMessage && lastReadAt) {
            const lastMessageTime = conv.lastMessage.sentAt?.toMillis?.() || 0;
            const lastReadTime = lastReadAt?.toMillis?.() || 0;

            if (lastMessageTime > lastReadTime && conv.lastMessage.senderId !== userId) {
                return 1; // Simplified - just showing 1 for now
            }
        } else if (conv.lastMessage && conv.lastMessage.senderId !== userId) {
            return 1;
        }
        return 0;
    };

    // Get display info for a conversation
    const getDisplayInfo = (conv: EnrichedConversation) => {
        if (conv.type === 'direct') {
            const otherId = conv.members.find(id => id !== user?.uid);
            const otherParticipant = otherId ? conv.enrichedParticipants?.[otherId] : null;
            return {
                name: otherParticipant?.displayName || conv.memberDetails?.[otherId || '']?.username || 'User',
                photo: otherParticipant?.photoURL || '/default-avatar.png',
                isGroup: false
            };
        } else {
            return {
                name: conv.title || 'Group Chat',
                photo: conv.photoUrl || generateCircularInitialAvatar(conv.title || 'G'),
                isGroup: true
            };
        }
    };

    const filteredConversations = conversations.filter(conv => {
        const { name } = getDisplayInfo(conv);
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Format last message with type indicator
    const formatLastMessage = (conv: EnrichedConversation) => {
        if (!conv.lastMessage) return 'No messages yet';

        const type = conv.lastMessage.type;
        const content = conv.lastMessage.content;
        const isMe = conv.lastMessage.senderId === user?.uid;
        const prefix = isMe ? 'You: ' : '';

        if (type === 'image') return `${prefix}📷 Photo`;
        if (type === 'video') return `${prefix}🎥 Video`;
        if (type === 'audio') return `${prefix}🎵 Voice message`;
        if (type === 'file') return `${prefix}📎 Document`;

        const truncated = content.length > 25 ? content.substring(0, 25) + '...' : content;
        return `${prefix}${truncated}`;
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin w-6 h-6 border-2 border-[#008080] border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col relative overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-gray-100">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-[#008080]/30 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto pb-16">
                {filteredConversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-sm">
                        No conversations found
                    </div>
                ) : (
                    filteredConversations.map(conv => {
                        const { name, photo, isGroup } = getDisplayInfo(conv);
                        const unreadCount = getUnreadCount(conv, user?.uid || '');
                        const hasUnread = unreadCount > 0;
                        const isMyLastMessage = conv.lastMessage?.senderId === user?.uid;

                        return (
                            <motion.div
                                key={conv.id}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => onSelectConversation(conv.id)}
                                className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-colors ${hasUnread ? 'bg-teal-50/50' : ''}`}
                            >
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                    <img
                                        src={photo}
                                        alt={name}
                                        className="w-11 h-11 rounded-full object-cover border border-gray-200"
                                    />
                                    {isGroup && (
                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#008080] rounded-full flex items-center justify-center border-2 border-white">
                                            <span className="text-white text-[8px] font-bold">
                                                {conv.members.length}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className={`text-sm truncate ${hasUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}`}>
                                            {name}
                                        </h4>
                                        <span className={`text-[10px] flex-shrink-0 ${hasUnread ? 'text-[#008080] font-bold' : 'text-gray-400'}`}>
                                            {formatRelativeTime(conv.lastMessage?.sentAt)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1 flex-1 min-w-0">
                                            {/* Read status for my messages */}
                                            {isMyLastMessage && (
                                                <span className="flex-shrink-0 text-gray-400">
                                                    {conv.lastMessage?.type === 'text' && (conv.lastMessage as any)?.readBy?.length > 1
                                                        ? <CheckCheck size={14} className="text-blue-500" />
                                                        : <Check size={14} />
                                                    }
                                                </span>
                                            )}
                                            <p className={`text-xs truncate ${hasUnread ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                                                {formatLastMessage(conv)}
                                            </p>
                                        </div>
                                        {/* Unread Badge */}
                                        {hasUnread && (
                                            <span className="flex-shrink-0 w-5 h-5 bg-[#008080] rounded-full flex items-center justify-center">
                                                <span className="text-white text-[10px] font-bold">{unreadCount}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* New Chat FAB */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNewChat(true)}
                className="absolute bottom-3 right-3 w-11 h-11 bg-[#008080] text-white rounded-full shadow-xl flex items-center justify-center hover:bg-teal-700 transition-colors z-20"
            >
                <Plus size={20} />
            </motion.button>

            {/* New Chat Modal */}
            <AnimatePresence>
                {showNewChat && (
                    <NewChatModal
                        onClose={() => setShowNewChat(false)}
                        onConversationCreated={(convId) => {
                            setShowNewChat(false);
                            onSelectConversation(convId);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
