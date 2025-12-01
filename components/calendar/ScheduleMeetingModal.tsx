'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { ChatService } from '@/lib/services/chat-service';
import { Conversation } from '@/lib/types/chat.types';
import { Loader2, Calendar, Video, Users } from 'lucide-react';

interface ScheduleMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date;
}

export function ScheduleMeetingModal({ isOpen, onClose, selectedDate }: ScheduleMeetingModalProps) {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [time, setTime] = useState('10:00');
    const [duration, setDuration] = useState('60');
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [groups, setGroups] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(false);
    const [scheduling, setScheduling] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            loadGroups();
        }
    }, [isOpen, user]);

    const loadGroups = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // In a real app, we'd have a method to fetch user's groups
            // For now, we'll rely on the subscription or mock it, but let's assume we can fetch them
            // Since we don't have a direct fetch method exposed yet, we might need to add one to ChatService
            // or just use the realtime listener. For this modal, a fetch is better.
            // Let's assume ChatService.getUserConversations exists or we use a temporary mock

            // Mocking for UI demonstration as per previous patterns if service method missing
            // In real implementation: const userGroups = await ChatService.getUserGroups(user.uid);
            const mockGroups: Conversation[] = [
                { id: 'g1', type: 'group', title: 'Marketing Team', members: [], createdBy: '', createdAt: null, updatedAt: null },
                { id: 'g2', type: 'project', title: 'Project Alpha', members: [], createdBy: '', createdAt: null, updatedAt: null }
            ];
            setGroups(mockGroups);
        } catch (error) {
            console.error('Error loading groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSchedule = async () => {
        if (!user || !title || !selectedGroup) return;

        setScheduling(true);
        try {
            // 1. Create meeting event (would go to MeetingService)
            // 2. Send notification/message to the group chat

            await ChatService.sendMessage({
                conversationId: selectedGroup,
                senderId: user.uid,
                senderUsername: 'System', // Or user name
                content: `📅 New Meeting Scheduled: ${title} on ${selectedDate.toLocaleDateString()} at ${time}`,
                type: 'text'
            });

            onClose();
        } catch (error) {
            console.error('Error scheduling meeting:', error);
        } finally {
            setScheduling(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
                <DialogHeader>
                    <DialogTitle>Schedule Team Meeting</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Meeting Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Weekly Sync"
                            className="w-full p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 border-none text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Time</label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 border-none text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration (min)</label>
                            <select
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="w-full p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 border-none text-sm"
                            >
                                <option value="15">15 min</option>
                                <option value="30">30 min</option>
                                <option value="45">45 min</option>
                                <option value="60">1 hour</option>
                                <option value="90">1.5 hours</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Team/Group</label>
                        {loading ? (
                            <div className="text-sm text-gray-500">Loading groups...</div>
                        ) : (
                            <select
                                value={selectedGroup}
                                onChange={(e) => setSelectedGroup(e.target.value)}
                                className="w-full p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 border-none text-sm"
                            >
                                <option value="">Select a group...</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.title}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="bg-teal-50 dark:bg-teal-900/20 p-3 rounded-xl flex items-start gap-3">
                        <Video size={18} className="text-[#008080] mt-0.5" />
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                            <p className="font-bold text-[#008080] mb-1">Video Meeting</p>
                            <p>A secure video link will be generated and sent to the selected group chat automatically.</p>
                        </div>
                    </div>

                    <button
                        onClick={handleSchedule}
                        disabled={!title || !selectedGroup || scheduling}
                        className="w-full py-3 bg-[#008080] text-white rounded-xl font-bold hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {scheduling ? <Loader2 size={18} className="animate-spin" /> : 'Schedule Meeting'}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
