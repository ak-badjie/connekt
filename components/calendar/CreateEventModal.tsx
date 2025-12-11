'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Video, Calendar, CheckSquare, Users, Clock, AlignLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ChatService } from '@/lib/services/chat-service';
import { format } from 'date-fns';

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date;
    agencyId?: string;
}

export function CreateEventModal({ isOpen, onClose, selectedDate, agencyId }: CreateEventModalProps) {
    const [eventType, setEventType] = useState<'meeting' | 'task' | 'deadline'>('meeting');
    const [title, setTitle] = useState('');
    const [time, setTime] = useState('10:00');
    const [description, setDescription] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [groups, setGroups] = useState<any[]>([]);
    const { user } = useAuth();

    // Fetch available group chats
    useEffect(() => {
        if (isOpen && user) {
            // TODO: Implement fetching group chats
            // For now, using mock data
            setGroups([
                { id: 'group1', title: 'Design Team' },
                { id: 'group2', title: 'Development Team' },
                { id: 'group3', title: 'Marketing Team' }
            ]);
        }
    }, [isOpen, user]);

    const handleCreate = async () => {
        if (!title || !user) return;

        // TODO: Create event in calendar service
        // const eventData = {
        //     title,
        //     type: eventType,
        //     date: selectedDate,
        //     time,
        //     description,
        //     groupId: selectedGroup,
        //     agencyId
        // };

        // If it's a meeting and has a group, post notification to chat
        if (eventType === 'meeting' && selectedGroup) {
            await ChatService.sendMessage({
                conversationId: selectedGroup,
                senderId: user.uid,
                senderUsername: 'System',
                content: `📅 Meeting scheduled: "${title}" on ${format(selectedDate, 'MMM d')} at ${time}`,
                type: 'text'
            });
        }

        // Reset and close
        setTitle('');
        setDescription('');
        setSelectedGroup('');
        setTime('10:00');
        onClose();
    };

    const TabButton = ({ type, icon: Icon, label }: { type: 'meeting' | 'task' | 'deadline', icon: any, label: string }) => (
        <button
            onClick={() => setEventType(type)}
            className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all relative overflow-hidden ${
                eventType === type 
                    ? 'border-[#008080] bg-teal-50 dark:bg-teal-900/20 text-[#008080]' 
                    : 'border-gray-100 dark:border-zinc-800 text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50'
            }`}
        >
            {eventType === type && (
                <motion.div layoutId="activeTab" className="absolute inset-0 bg-[#008080]/5" />
            )}
            <Icon size={20} />
            <span className="text-xs font-bold relative z-10">{label}</span>
        </button>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 p-0 overflow-hidden rounded-3xl">
                <div className="p-6 bg-[#008080] text-white">
                    <h2 className="text-2xl font-bold">New Event</h2>
                    <p className="text-teal-100 text-sm">
                        Schedule something for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Event Type Tabs */}
                    <div className="flex gap-3">
                        <TabButton type="meeting" icon={Video} label="Meeting" />
                        <TabButton type="task" icon={CheckSquare} label="Task" />
                        <TabButton type="deadline" icon={Calendar} label="Deadline" />
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Title</label>
                            <input 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={eventType === 'meeting' ? "Weekly Sync" : eventType === 'task' ? "Complete Report" : "Project Deadline"}
                                className="w-full p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl border-none font-medium focus:ring-2 focus:ring-[#008080] text-gray-900 dark:text-white"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Time</label>
                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 p-3 rounded-xl">
                                    <Clock size={18} className="text-gray-400" />
                                    <input 
                                        type="time" 
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="bg-transparent border-none w-full text-sm font-bold text-gray-900 dark:text-white" 
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Assign Group</label>
                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 p-3 rounded-xl">
                                    <Users size={18} className="text-gray-400" />
                                    <select 
                                        className="bg-transparent border-none w-full text-sm font-bold appearance-none cursor-pointer text-gray-900 dark:text-white"
                                        value={selectedGroup}
                                        onChange={(e) => setSelectedGroup(e.target.value)}
                                    >
                                        <option value="">Select Team...</option>
                                        {groups.map(g => (
                                            <option key={g.id} value={g.id}>{g.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Description (Optional)</label>
                            <textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add details..."
                                rows={3}
                                className="w-full p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl border-none font-medium focus:ring-2 focus:ring-[#008080] resize-none text-gray-900 dark:text-white"
                            />
                        </div>

                        {eventType === 'meeting' && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-xl flex gap-3"
                            >
                                <div className="w-8 h-8 rounded-full bg-[#008080] flex items-center justify-center shrink-0">
                                    <Video size={14} className="text-white" />
                                </div>
                                <div className="text-xs text-teal-800 dark:text-teal-200">
                                    <p className="font-bold mb-1">Video Conference Enabled</p>
                                    <p>A &quot;Join Meeting&quot; button will be posted to the selected group chat instantly.</p>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCreate}
                        disabled={!title}
                        className="w-full py-4 bg-[#008080] text-white rounded-2xl font-bold shadow-xl shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                        Create {eventType.charAt(0).toUpperCase() + eventType.slice(1)}
                    </motion.button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
