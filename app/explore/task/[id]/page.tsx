'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TaskService } from '@/lib/services/task-service';
import { Task } from '@/lib/types/workspace.types';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { CheckSquare, DollarSign, Calendar, Clock, AlertCircle, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';

export default function PublicTaskPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const taskId = params?.id as string;

    const [task, setTask] = useState<Task | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showProposalModal, setShowProposalModal] = useState(false);

    useEffect(() => {
        const loadTask = async () => {
            if (!taskId) return;

            try {
                const taskData = await TaskService.getTask(taskId);
                if (taskData && taskData.isPublic) {
                    setTask(taskData);
                } else {
                    router.push('/explore');
                }
            } catch (error) {
                console.error('Error loading task:', error);
                router.push('/explore');
            } finally {
                setIsLoading(false);
            }
        };

        loadTask();
    }, [taskId, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-teal-950/20 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#008080]/10 animate-pulse" />
                    <p className="text-gray-500">Loading task...</p>
                </div>
            </div>
        );
    }

    if (!task) {
        return null;
    }

    const priorityColors = {
        urgent: 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-100 dark:border-red-800/30 text-red-600 dark:text-red-400',
        high: 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-100 dark:border-orange-800/30 text-orange-600 dark:text-orange-400',
        medium: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-100 dark:border-blue-800/30 text-blue-600 dark:text-blue-400',
        low: 'from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border-gray-100 dark:border-gray-800/30 text-gray-600 dark:text-gray-400',
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-teal-950/20">
            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Back Button */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-6"
                >
                    <Link
                        href="/explore"
                        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#008080] transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Back to Explore
                    </Link>
                </motion.div>

                {/* Main Content Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl p-8 shadow-2xl mb-6"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-14 h-14 rounded-2xl bg-[#008080]/10 dark:bg-[#008080]/20 flex items-center justify-center">
                                    <CheckSquare size={28} className="text-[#008080]" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                                        {task.title}
                                    </h1>
                                    <p className="text-sm text-gray-500">Task ID: {task.id}</p>
                                </div>
                            </div>
                        </div>

                        <div className={`px-4 py-2 rounded-xl bg-gradient-to-br ${priorityColors[task.priority]} border font-bold text-sm`}>
                            {task.priority} priority
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-100 dark:border-green-800/30"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign size={18} className="text-green-600 dark:text-green-400" />
                                <span className="text-xs font-bold text-green-600 dark:text-green-400">Payment</span>
                            </div>
                            <div className="text-2xl font-black text-gray-900 dark:text-white">
                                ${task.pricing.amount}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{task.pricing.currency}</div>
                        </motion.div>

                        {task.timeline.dueDate && (
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-100 dark:border-blue-800/30"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar size={18} className="text-blue-600 dark:text-blue-400" />
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Due Date</span>
                                </div>
                                <div className="text-lg font-black text-gray-900 dark:text-white">
                                    {new Date(task.timeline.dueDate).toLocaleDateString()}
                                </div>
                            </motion.div>
                        )}

                        {task.timeline.estimatedHours && (
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-100 dark:border-purple-800/30"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock size={18} className="text-purple-600 dark:text-purple-400" />
                                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">Estimated</span>
                                </div>
                                <div className="text-2xl font-black text-gray-900 dark:text-white">
                                    {task.timeline.estimatedHours}h
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="mb-8">
                        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">
                            Task Description
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                            {task.description}
                        </p>
                    </div>

                    {/* Status Info */}
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 mb-6">
                        <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <div className="font-bold text-blue-900 dark:text-blue-100 mb-1">
                                Task Status: <span className="capitalize">{task.status.replace('-', ' ')}</span>
                            </div>
                            <div className="text-sm text-blue-700 dark:text-blue-300">
                                {task.isReassignable
                                    ? 'This task is open for applications'
                                    : 'This task is currently assigned'}
                            </div>
                        </div>
                    </div>

                    {/* Created By */}
                    <div className="border-t border-gray-100 dark:border-zinc-800 pt-6">
                        <h3 className="text-sm font-bold text-gray-500 mb-3">Created By</h3>
                        <div className="inline-flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white font-bold">
                                {task.createdBy[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <div className="font-bold text-gray-900 dark:text-white">
                                    User {task.createdBy.slice(0, 8)}...
                                </div>
                                <div className="text-xs text-gray-500">Task Creator</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-4"
                >
                    {user ? (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowProposalModal(true)}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[#008080] hover:bg-teal-600 text-white font-black text-lg shadow-lg shadow-teal-500/30 transition-all"
                        >
                            <Send size={20} />
                            Apply for Task
                        </motion.button>
                    ) : (
                        <Link href="/auth" className="flex-1">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[#008080] hover:bg-teal-600 text-white font-black text-lg shadow-lg shadow-teal-500/30 transition-all"
                            >
                                Sign In to Apply
                            </motion.button>
                        </Link>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-4 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-gray-200 dark:border-zinc-700 hover:border-[#008080] text-gray-900 dark:text-white font-bold transition-all"
                    >
                        Save
                    </motion.button>
                </motion.div>

                {/* Proposal Modal */}
                {showProposalModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-2xl w-full"
                        >
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">
                                Apply for Task
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Use ConnektMail to send a contract proposal for this task.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    className="flex-1 px-6 py-3 rounded-xl bg-[#008080] hover:bg-teal-600 text-white font-bold transition-colors"
                                    onClick={() => {
                                        const params = new URLSearchParams({
                                            compose: '1',
                                            to: `${task.ownerUsername}@connekt.com`,
                                            subject: `Proposal for task: ${task.title}`,
                                            body: task.description || '',
                                            contractType: 'task_assignment',
                                            brief: `Task: ${task.title}\nBudget: ${task.budget || 'N/A'}\nDeadline: ${task.dueDate ? new Date(task.dueDate).toDateString() : 'N/A'}\nDescription: ${task.description || ''}`
                                        });
                                        router.push(`/mail?${params.toString()}`);
                                        setShowProposalModal(false);
                                    }}
                                >
                                    Open ConnektMail
                                </button>
                                <button
                                    onClick={() => setShowProposalModal(false)}
                                    className="px-6 py-3 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
}
