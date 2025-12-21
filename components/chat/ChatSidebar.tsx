'use client';

import { useEffect, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { listenToConversations, EnrichedConversation } from '@/lib/services/realtime-service';
import { getInitials, generateCircularInitialAvatar } from '@/lib/utils/generateInitialAvatar';

interface ChatSidebarProps {
    onSelectConversation: (conversationId: string) => void;
}

export function ChatSidebar({ onSelectConversation }: ChatSidebarProps) {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<EnrichedConversation[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) return;

        const unsubscribe = listenToConversations(user.uid, (convs) => {
            setConversations(convs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

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
            // Group/workspace/project chat
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

    const formatLastMessage = (conv: EnrichedConversation) => {
        if (!conv.lastMessage) return 'No messages yet';
        const content = conv.lastMessage.content;
        if (content.length > 30) return content.substring(0, 30) + '...';
        return content;
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col">
            {/* Search */}
            <div className="p-3 border-b border-gray-100">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/50"
                    />
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-sm">
                        No conversations found
                    </div>
                ) : (
                    filteredConversations.map(conv => {
                        const { name, photo, isGroup } = getDisplayInfo(conv);
                        return (
                            <div
                                key={conv.id}
                                onClick={() => onSelectConversation(conv.id)}
                                className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50"
                            >
                                <div className="relative">
                                    <img
                                        src={photo}
                                        alt={name}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    {isGroup && (
                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-[8px] font-bold">
                                                {conv.members.length}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm text-gray-900 truncate">{name}</h4>
                                    <p className="text-xs text-gray-500 truncate">
                                        {formatLastMessage(conv)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
