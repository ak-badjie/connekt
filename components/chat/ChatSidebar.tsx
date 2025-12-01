'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ChatService } from '@/lib/services/chat-service';
import { Conversation } from '@/lib/types/chat.types';
import { formatDistanceToNow } from 'date-fns';
import { Search, Plus, MessageSquare } from 'lucide-react';

import { CreateChatModal } from './CreateChatModal';

interface ChatSidebarProps {
    onSelectConversation: (conversationId: string) => void;
    selectedId?: string;
}

export function ChatSidebar({ onSelectConversation, selectedId }: ChatSidebarProps) {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        if (!user) return;

        const unsubscribe = ChatService.subscribeToConversations(user.uid, (convs) => {
            setConversations(convs);
        });

        return () => unsubscribe();
    }, [user]);

    const filteredConversations = conversations.filter(c => {
        const name = c.title || c.type; // Simplified
        return name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const getConversationName = (c: Conversation) => {
        if (c.title) return c.title;
        if (c.type === 'direct') {
            // Find other member
            const otherMemberId = c.members.find(m => m !== user?.uid);
            return c.memberDetails[otherMemberId!]?.username || 'User';
        }
        return `${c.type} Chat`;
    };

    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800">
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h2>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="p-2 bg-[#008080]/10 text-[#008080] rounded-full hover:bg-[#008080]/20 transition-colors"
                    >
                        <Plus size={20} />
                    </button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search messages..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#008080]/50"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <MessageSquare size={48} className="mx-auto mb-3 opacity-20" />
                        <p className="text-sm">No conversations yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {filteredConversations.map(conv => {
                            const name = getConversationName(conv);
                            const lastMsg = conv.lastMessage;
                            const time = lastMsg?.sentAt?.seconds
                                ? formatDistanceToNow(new Date(lastMsg.sentAt.seconds * 1000), { addSuffix: true })
                                : '';

                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => onSelectConversation(conv.id)}
                                    className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors text-left ${selectedId === conv.id ? 'bg-teal-50 dark:bg-teal-900/10 border-l-4 border-[#008080]' : 'border-l-4 border-transparent'
                                        }`}
                                >
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-lg">
                                        {name.substring(0, 1).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className="font-bold text-gray-900 dark:text-gray-100 truncate pr-2">{name}</h4>
                                            <span className="text-[10px] text-gray-400 flex-shrink-0">{time}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {lastMsg ? (
                                                <>
                                                    <span className="text-gray-900 dark:text-gray-300 font-medium mr-1">
                                                        {lastMsg.senderId === user?.uid ? 'You:' : `${lastMsg.senderUsername}:`}
                                                    </span>
                                                    {lastMsg.content}
                                                </>
                                            ) : (
                                                <span className="italic opacity-70">New conversation</span>
                                            )}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
            <CreateChatModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
}
