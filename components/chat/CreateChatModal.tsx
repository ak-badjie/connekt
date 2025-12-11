'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { ChatService } from '@/lib/services/chat-service';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, orderBy, startAt, endAt } from 'firebase/firestore';
import { Loader2, Search, X, Briefcase, Mail } from 'lucide-react';

interface CreateChatModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateChatModal({ isOpen, onClose }: CreateChatModalProps) {
    const { user, userProfile } = useAuth();
    const [groupName, setGroupName] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setSearchResults([]);
            setSelectedMembers([]);
            setGroupName('');
        }
    }, [isOpen]);

    // REAL DB Search Effect
    useEffect(() => {
        const search = async () => {
            if (!searchQuery || searchQuery.length < 2) {
                setSearchResults([]);
                return;
            }

            setLoading(true);
            try {
                // Search user_profiles collection
                const usersRef = collection(db, 'user_profiles');
                const q = query(
                    usersRef, 
                    orderBy('username'), 
                    startAt(searchQuery.toLowerCase()), 
                    endAt(searchQuery.toLowerCase() + '\uf8ff'),
                    limit(10)
                );

                const snapshot = await getDocs(q);
                const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
                
                // Filter out self and already selected
                const filtered = users
                    .filter(u => u.uid !== user?.uid)
                    .filter(u => !selectedMembers.some(s => s.uid === u.uid));

                setSearchResults(filtered);
            } catch (error) {
                console.error("Error searching users:", error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(search, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, user, selectedMembers]);

    const handleCreate = async () => {
        if (!user || !userProfile || !groupName.trim()) return;

        try {
            const participants: { userId: string; username: string; avatarUrl?: string; role: 'admin' | 'member' }[] = selectedMembers.map(m => ({
                userId: m.uid,
                username: m.username,
                avatarUrl: m.photoURL,
                role: 'member'
            }));

            // Add current user
            participants.push({
                userId: user.uid,
                username: userProfile.username || 'Me',
                avatarUrl: userProfile.photoURL,
                role: 'admin'
            });

            await ChatService.createConversation({
                type: 'group',
                participants,
                title: groupName,
                createdBy: user.uid,
            });
            onClose();
        } catch (error) {
            console.error('Error creating group:', error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
                <DialogHeader>
                    <DialogTitle>Create New Team Chat</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Team Name</label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="e.g. Project Alpha Team"
                            className="w-full p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 border-none text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Members</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search people..."
                                className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-zinc-800 border-none rounded-lg text-sm"
                            />
                        </div>

                        {/* Selected Tags */}
                        {selectedMembers.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedMembers.map(m => (
                                    <div key={m.uid} className="flex items-center gap-1 bg-teal-100 dark:bg-teal-900/30 text-[#008080] px-2 py-1 rounded-lg text-xs font-bold">
                                        {m.username}
                                        <button onClick={() => setSelectedMembers(prev => prev.filter(p => p.uid !== m.uid))}>
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Search Results */}
                        <div className="max-h-60 overflow-y-auto space-y-1 mt-2 border border-gray-100 dark:border-zinc-800 rounded-xl">
                            {loading ? (
                                <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
                            ) : searchResults.length > 0 ? (
                                searchResults.map(member => (
                                    <button
                                        key={member.uid}
                                        onClick={() => {
                                            setSelectedMembers(prev => [...prev, member]);
                                            setSearchResults(prev => prev.filter(p => p.uid !== member.uid));
                                            setSearchQuery('');
                                        }}
                                        className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800 text-left transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center overflow-hidden">
                                            {member.photoURL ? (
                                                <img src={member.photoURL} alt={member.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-bold">{member.username?.[0]?.toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{member.username}</p>
                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                {member.title && <span className="flex items-center gap-1"><Briefcase size={10} /> {member.title}</span>}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            ) : searchQuery.length > 1 && (
                                <div className="p-4 text-center text-gray-400 text-xs">No users found matching &quot;{searchQuery}&quot;</div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={!groupName.trim() || selectedMembers.length === 0}
                        className="w-full py-3 bg-[#008080] text-white rounded-xl font-bold hover:bg-teal-600 transition-colors disabled:opacity-50"
                    >
                        Create Group
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
