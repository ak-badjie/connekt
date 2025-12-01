'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { ChatService } from '@/lib/services/chat-service';
import { MeetingService } from '@/lib/services/meeting-service';
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
            // Subscribe to user's conversations
            // We'll use the subscription to get initial data and then just set it
            // In a real app, we might want to keep the subscription active, but for a modal, 
            // fetching once or using a subscription that updates state is fine.
            const unsubscribe = ChatService.subscribeToConversations(user.uid, (conversations) => {
                // Filter for groups or projects (exclude direct messages if needed, or keep all)
                // Usually meetings are for groups/projects
                const groupChats = conversations.filter(c => c.type === 'group' || c.type === 'project' || c.type === 'workspace' || c.type === 'agency');
                setGroups(groupChats);
                setLoading(false);
            });

            // Clean up subscription when modal closes or unmounts
            return () => unsubscribe();
        } catch (error) {
            console.error('Error loading groups:', error);
            setLoading(false);
        }
    };

    const handleSchedule = async () => {
        if (!user || !title || !selectedGroup) return;

        setScheduling(true);
        try {
            // 1. Create meeting event
            const meetingId = await MeetingService.createMeeting({
                title,
                startTime: new Date(`${selectedDate.toLocaleDateString()} ${time}`).getTime(),
                duration: parseInt(duration),
                hostId: user.uid,
                hostName: user.displayName || 'Host',
                participants: [user.uid], // In real app, add group members
                type: 'video',
                conversationId: selectedGroup
            });

            // 2. Send notification/message to the group chat
            await ChatService.sendMessage({
                conversationId: selectedGroup,
                senderId: user.uid,
                senderUsername: 'System',
                content: `📅 New Meeting Scheduled: ${title} on ${selectedDate.toLocaleDateString()} at ${time}. [Join Link](${meetingId})`,
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
