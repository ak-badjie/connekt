'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { ChatService } from '@/lib/services/chat-service';
import { Loader2, Search, X, Users } from 'lucide-react';
import { AgencyService } from '@/lib/services/agency-service';
import { FirestoreService } from '@/lib/services/firestore-service';

interface CreateChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    agencyId?: string; // Optional: if creating within an agency context
}

export function CreateChatModal({ isOpen, onClose, agencyId }: CreateChatModalProps) {
    const { user, userProfile } = useAuth();
    const [groupName, setGroupName] = useState('');
    const [members, setMembers] = useState<any[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadMembers();
        }
    }, [isOpen, agencyId]);

    const loadMembers = async () => {
        // Initial load can be empty or suggested users
        // For now we'll wait for search
        setMembers([]);
    };

    // Debounced search effect would be better, but for now simple effect
    useEffect(() => {
        const search = async () => {
            if (!searchQuery || searchQuery.length < 2) {
                setMembers([]);
                return;
            }

            setLoading(true);
            try {
                if (agencyId) {
                    // Existing agency logic
                    const agency = await AgencyService.getAgencyById(agencyId);
                    if (agency && agency.members) {
                        const mappedMembers = agency.members
                            .filter(m => m.userId !== user?.uid)
                            .map(m => ({
                                userId: m.userId,
                                username: m.agencyEmail.split('@')[0],
                                email: m.agencyEmail,
                                role: m.role
                            }));
                        setMembers(mappedMembers.filter(m =>
                            m.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (m.email && m.email.toLowerCase().includes(searchQuery.toLowerCase()))
                        ));
                    }
                } else {
                    // Use FirestoreService search
                    const users = await FirestoreService.searchUsers(searchQuery);
                    setMembers(users.filter(u => u.uid !== user?.uid).map(u => ({
                        userId: u.uid,
                        username: u.username || 'Unknown',
                        role: u.role,
                        email: u.email
                    })));
                }
            } catch (error) {
                console.error("Error searching users:", error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(search, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, agencyId, user]);

    const handleCreate = async () => {
        if (!user || !userProfile || !groupName.trim()) return;

        setCreating(true);
        try {
            // Map selected members to participants format
            const participants: { userId: string; username: string; role: 'admin' | 'member' }[] = selectedMembers.map(id => {
                const member = members.find(m => m.userId === id);
                return {
                    userId: id,
                    username: member?.username || 'Unknown',
                    role: 'member'
                };
            });

            // Add current user
            participants.push({
                userId: user.uid,
                username: userProfile.username || 'Me',
                role: 'admin'
            });

            await ChatService.createConversation({
                type: 'group',
                participants,
                title: groupName,
                createdBy: user.uid,
                // memberDetails is handled by ChatService based on participants now (or we can pass it if needed, but service signature changed in my thought process? 
                // Wait, let's check ChatService signature again. It takes participants array.
            });
            onClose();
            // Reset form
            setGroupName('');
            setSelectedMembers([]);
        } catch (error) {
            console.error('Error creating group:', error);
        } finally {
            setCreating(false);
        }
    };

    const toggleMember = (memberId: string) => {
        if (selectedMembers.includes(memberId)) {
            setSelectedMembers(prev => prev.filter(id => id !== memberId));
        } else {
            setSelectedMembers(prev => [...prev, memberId]);
        }
    };

    const filteredMembers = members;

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

                        <div className="max-h-48 overflow-y-auto space-y-1 mt-2">
                            {loading ? (
                                <div className="text-center py-4 text-gray-500"><Loader2 className="animate-spin mx-auto" /></div>
                            ) : filteredMembers.length === 0 ? (
                                <div className="text-center py-4 text-gray-500 text-sm flex flex-col items-center">
                                    <Users size={24} className="mb-2 opacity-20" />
                                    <p>No people found</p>
                                </div>
                            ) : (
                                filteredMembers.map(member => (
                                    <div
                                        key={member.userId}
                                        onClick={() => toggleMember(member.userId)}
                                        className={`p-2 flex items-center gap-3 rounded-lg cursor-pointer transition-colors ${selectedMembers.includes(member.userId)
                                            ? 'bg-teal-50 dark:bg-teal-900/20'
                                            : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                                            }`}
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedMembers.includes(member.userId)
                                            ? 'bg-[#008080] border-[#008080]'
                                            : 'border-gray-300 dark:border-zinc-600'
                                            }`}>
                                            {selectedMembers.includes(member.userId) && <X size={10} className="text-white" />}
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold">
                                            {member.username[0].toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.username}</p>
                                            <p className="text-xs text-gray-500">{member.role}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={!groupName.trim() || creating}
                        className="w-full py-3 bg-[#008080] text-white rounded-xl font-bold hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {creating ? <Loader2 size={18} className="animate-spin" /> : 'Create Team Chat'}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
