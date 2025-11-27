'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { ProjectService } from '@/lib/services/project-service';

interface TaskModalProps {
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
    onTaskCreated: () => void;
}

export default function TaskModal({ projectId, isOpen, onClose, onTaskCreated }: TaskModalProps) {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [assignee, setAssignee] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await ProjectService.createTask({
                projectId,
                title,
                description: desc,
                assignee: assignee.replace('@', ''), // Strip @ if user adds it
                status: 'todo',
                priority
            });
            onTaskCreated();
            onClose();
            setTitle('');
            setDesc('');
            setAssignee('');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-zinc-800">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create New Task</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Task Title</label>
                        <input
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-transparent focus:border-[#008080] outline-none"
                            placeholder="e.g. Design Homepage"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                        <textarea
                            value={desc}
                            onChange={e => setDesc(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-transparent focus:border-[#008080] outline-none h-24 resize-none"
                            placeholder="Task details..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assign To (@username)</label>
                            <input
                                value={assignee}
                                onChange={e => setAssignee(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-transparent focus:border-[#008080] outline-none"
                                placeholder="@username"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Priority</label>
                            <select
                                value={priority}
                                onChange={e => setPriority(e.target.value as any)}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-transparent focus:border-[#008080] outline-none appearance-none"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>
                    <button
                        disabled={loading}
                        className="w-full py-3 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Create Task'}
                    </button>
                </form>
            </div>
        </div>
    );
}
