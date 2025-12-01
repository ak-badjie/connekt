'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { ChatService } from '@/lib/services/chat-service';
import { Loader2, Search, X } from 'lucide-react';
import { AgencyService } from '@/lib/services/agency-service';

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    agencyId?: string; // If creating within an agency context
}

export function CreateGroupModal({ isOpen, onClose, agencyId }: CreateGroupModalProps) {
    const { user, userProfile } = useAuth();
    const [groupName, setGroupName] = useState('');
    const [members, setMembers] = useState<any[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen && agencyId) {
            loadMembers();
        }
    }, [isOpen, agencyId]);

    const loadMembers = async () => {
        if (!agencyId) return;
        setLoading(true);
        try {
            // Fetch agency members
            const agencyMembers = await AgencyService.getAgencyMembers(agencyId);
            setMembers(agencyMembers.filter(m => m.userId !== user?.uid)); // Exclude self
        } catch (error) {
            console.error('Error loading members:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!user || !userProfile || !groupName.trim() || selectedMembers.length === 0) return;

        setCreating(true);
        try {
            await ChatService.createConversation({
                type: 'group',
                members: [user.uid, ...selectedMembers],
                title: groupName,
                createdBy: user.uid,
                memberDetails: {
                    [user.uid]: {
                        username: userProfile.username,
                        photoURL: userProfile.photoURL || null,
                        role: 'admin'
                    },
                    // Add other members details... in real app we'd need their profiles
                    // For now we rely on the service to fetch or we pass what we have
                }
            });
            onClose();
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

    const filteredMembers = members.filter(m =>
        m.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
                <DialogHeader>
                    <DialogTitle>Create New Group</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Group Name</label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="e.g. Marketing Team"
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
                                placeholder="Search members..."
                                className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-zinc-800 border-none rounded-lg text-sm"
                            />
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-1 mt-2">
                            {loading ? (
                                <div className="text-center py-4 text-gray-500"><Loader2 className="animate-spin mx-auto" /></div>
                            ) : filteredMembers.length === 0 ? (
                                <p className="text-center py-4 text-gray-500 text-sm">No members found.</p>
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
                        disabled={!groupName.trim() || selectedMembers.length === 0 || creating}
                        className="w-full py-3 bg-[#008080] text-white rounded-xl font-bold hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {creating ? <Loader2 size={18} className="animate-spin" /> : 'Create Group'}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
