'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
    searchUsers,
    getOrCreateConversation,
    ParticipantInfo
} from '@/lib/services/realtime-service';

interface NewChatModalProps {
    onClose: () => void;
    onConversationCreated: (conversationId: string) => void;
}

export default function NewChatModal({ onClose, onConversationCreated }: NewChatModalProps) {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<ParticipantInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (!user?.uid || searchQuery.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const users = await searchUsers(searchQuery, user.uid, 10);
                setResults(users);
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, user?.uid]);

    const handleSelectUser = async (selectedUser: ParticipantInfo) => {
        if (!user?.uid || creating) return;

        setCreating(true);
        try {
            const conversationId = await getOrCreateConversation(
                user.uid,
                selectedUser.id,
                user.displayName || 'User',
                selectedUser.displayName,
                user.photoURL || '',
                selectedUser.photoURL
            );
            onConversationCreated(conversationId);
        } catch (error) {
            console.error('Failed to create conversation:', error);
        } finally {
            setCreating(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white z-50 flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center gap-2 p-3 border-b border-gray-100">
                <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600">
                    <X size={18} />
                </button>
                <h3 className="font-bold text-sm text-gray-900">New Chat</h3>
            </div>

            {/* Search Input */}
            <div className="p-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-[#008080]/30 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center p-8">
                        <div className="w-6 h-6 border-2 border-[#008080] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : searchQuery.length < 2 ? (
                    <div className="text-center text-gray-400 text-sm p-8">
                        <MessageSquare size={32} className="mx-auto mb-2 text-gray-300" />
                        <p>Type at least 2 characters to search</p>
                    </div>
                ) : results.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm p-8">
                        No users found
                    </div>
                ) : (
                    results.map((person) => (
                        <button
                            key={person.id}
                            onClick={() => handleSelectUser(person)}
                            disabled={creating}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            <img
                                src={person.photoURL || '/default-avatar.png'}
                                alt={person.displayName}
                                className="w-10 h-10 rounded-full object-cover border border-gray-200"
                            />
                            <div className="flex-1 text-left">
                                <h4 className="font-medium text-sm text-gray-900">{person.displayName}</h4>
                                <p className="text-xs text-gray-500">@{person.username}</p>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </motion.div>
    );
}
