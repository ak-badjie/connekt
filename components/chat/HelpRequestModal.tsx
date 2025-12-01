'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { TaskService } from '@/lib/services/task-service';
import { ContractMailService } from '@/lib/services/contract-mail-service';
import { Task } from '@/lib/types/workspace.types';
import { Loader2, Briefcase, DollarSign, Clock } from 'lucide-react';
import { ChatService } from '@/lib/services/chat-service';

interface HelpRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId: string;
    recipientId?: string; // If direct message
    recipientUsername?: string;
}

export function HelpRequestModal({ isOpen, onClose, conversationId, recipientId, recipientUsername }: HelpRequestModalProps) {
    const { user, userProfile } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [offerType, setOfferType] = useState<'free' | 'paid'>('free');
    const [budget, setBudget] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            loadTasks();
        }
    }, [isOpen, user]);

    const loadTasks = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Get tasks assigned to user that are in progress or todo
            const userTasks = await TaskService.getUserTasks(user.uid);
            setTasks(userTasks.filter(t => t.status === 'todo' || t.status === 'in-progress'));
        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!user || !userProfile || !selectedTask) return;

        setSending(true);
        try {
            let contractId: string | undefined;

            // If paid and we have a recipient (direct chat), create a contract first
            if (offerType === 'paid' && recipientId && recipientUsername) {
                contractId = await ContractMailService.createContract(
                    user.uid,
                    userProfile?.username || 'Unknown',
                    `${userProfile?.username || 'user'}@connekt.com`, // Mock email
                    recipientId,
                    recipientUsername || 'Unknown',
                    `${recipientUsername || 'user'}@connekt.com`, // Mock email
                    'task_assignment',
                    `Help Request: ${selectedTask.title}`,
                    `Requesting help for task: ${selectedTask.title}. \n\nMessage: ${message}`,
                    {
                        taskId: selectedTask.id,
                        taskTitle: selectedTask.title,
                        taskPayment: Number(budget),
                        taskDeadline: selectedTask.timeline?.dueDate ? new Date(selectedTask.timeline.dueDate as any).toLocaleDateString() : 'No deadline'
                    }
                );
            }

            // Send Help Request Message
            await ChatService.sendMessage({
                conversationId,
                senderId: user.uid,
                senderUsername: userProfile?.username || 'Unknown',
                senderAvatarUrl: userProfile.photoURL || undefined,
                content: message || `I need help with this task: ${selectedTask.title}`,
                type: 'help_request',
                helpRequest: {
                    taskId: selectedTask.id,
                    taskTitle: selectedTask.title,
                    projectId: selectedTask.projectId,
                    budget: offerType === 'paid' ? Number(budget) : 0,
                    status: 'open',
                    contractId
                }
            });

            onClose();
        } catch (error) {
            console.error('Error sending help request:', error);
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
                <DialogHeader>
                    <DialogTitle>Ask for Help</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Task Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Task</label>
                        {loading ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Loader2 size={16} className="animate-spin" /> Loading tasks...
                            </div>
                        ) : tasks.length === 0 ? (
                            <p className="text-sm text-gray-500">No active tasks found.</p>
                        ) : (
                            <select
                                className="w-full p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 border-none text-sm"
                                onChange={(e) => setSelectedTask(tasks.find(t => t.id === e.target.value) || null)}
                                value={selectedTask?.id || ''}
                            >
                                <option value="">Select a task...</option>
                                {tasks.map(task => (
                                    <option key={task.id} value={task.id}>{task.title}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Offer Type */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setOfferType('free')}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${offerType === 'free'
                                ? 'border-[#008080] bg-teal-50 dark:bg-teal-900/20 text-[#008080]'
                                : 'border-gray-200 dark:border-zinc-800 text-gray-500'
                                }`}
                        >
                            <Briefcase size={20} />
                            <span className="text-xs font-bold">Free Help</span>
                        </button>
                        <button
                            onClick={() => setOfferType('paid')}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${offerType === 'paid'
                                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-600'
                                : 'border-gray-200 dark:border-zinc-800 text-gray-500'
                                }`}
                        >
                            <DollarSign size={20} />
                            <span className="text-xs font-bold">Paid Offer</span>
                        </button>
                    </div>

                    {/* Budget Input */}
                    {offerType === 'paid' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Budget ($)</label>
                            <input
                                type="number"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                placeholder="Enter amount"
                                className="w-full p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 border-none text-sm"
                            />
                            <p className="text-xs text-amber-600">A contract will be created automatically.</p>
                        </div>
                    )}

                    {/* Message */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Describe what help you need..."
                            className="w-full p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 border-none text-sm h-24 resize-none"
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={!selectedTask || (offerType === 'paid' && !budget) || sending}
                        className="w-full py-3 bg-[#008080] text-white rounded-xl font-bold hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {sending ? <Loader2 size={18} className="animate-spin" /> : 'Send Request'}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
