'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

import ConnektAIIcon from '@/components/branding/ConnektAIIcon';
import { ConnectAIService, TaskAssignment } from '@/lib/services/connect-ai.service';
import { ProfileService } from '@/lib/services/profile-service';
import { TaskService } from '@/lib/services/task-service';
import { WorkspaceService } from '@/lib/services/workspace-service';
import { Task } from '@/lib/types/workspace.types';

const ConnektIcon = ({ className }: { className?: string }) => (
    <ConnektAIIcon className={`w-5 h-5 ${className || ''}`} />
);

interface AITeamMatcherModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    workspaceId: string;
    currentTasks: Task[];
    userId: string;
    onAssignmentsApplied: () => void;
}

export default function AITeamMatcherModal({
    isOpen,
    onClose,
    projectId,
    workspaceId,
    currentTasks,
    userId,
    onAssignmentsApplied
}: AITeamMatcherModalProps) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(''); // '', 'complete', or human-readable progress
    const [assignments, setAssignments] = useState<(TaskAssignment & { taskId?: string })[]>([]);

    const activeTasks = useMemo(
        () => currentTasks.filter(t => t.status !== 'done' && t.status !== 'paid'),
        [currentTasks]
    );

    useEffect(() => {
        if (!isOpen) {
            setLoading(false);
            setStatus('');
            setAssignments([]);
        }
    }, [isOpen]);

    const runAIMatching = async () => {
        setLoading(true);
        setAssignments([]);

        try {
            setStatus('Fetching team data...');
            const workspace = await WorkspaceService.getWorkspace(workspaceId);
            if (!workspace || !Array.isArray(workspace.members) || workspace.members.length === 0) {
                throw new Error('No team members found.');
            }

            if (activeTasks.length === 0) {
                throw new Error('No active tasks to analyze.');
            }

            // Ensure tasks have IDs so we can reassign them.
            const tasksToProcess = activeTasks.filter(t => !!t.id);
            if (tasksToProcess.length === 0) {
                throw new Error('Tasks are missing IDs; cannot apply assignments.');
            }

            setStatus('AI is analyzing tasks & generating skill categories...');
            const categorizedTasks = await ConnectAIService.generateCategoriesForExistingTasks(
                tasksToProcess.map(t => ({
                    id: t.id!,
                    title: t.title,
                    description: t.description
                })),
                userId
            );

            const categoriesByTaskId = new Map<string, string[]>();
            for (const item of categorizedTasks) {
                categoriesByTaskId.set(item.taskId, Array.isArray(item.categories) ? item.categories : []);
            }

            setStatus('AI is finding the best team members...');
            const memberProfiles = await Promise.all(
                workspace.members.map(async m => {
                    const profile = await ProfileService.getUserProfile(m.userId);
                    return {
                        userId: m.userId,
                        username: m.username,
                        role: (m as any).jobTitle || m.role,
                        skills: profile?.skills || []
                    };
                })
            );

            // Build TaskSuggestions for matching; autoAssignTasks will internally create IDs task_0..task_n.
            const idByInternalTaskId = new Map<string, string>();
            const tasksForMatching = tasksToProcess.map((t, index) => {
                idByInternalTaskId.set(`task_${index}`, t.id!);
                return {
                    title: t.title,
                    description: t.description,
                    skills: categoriesByTaskId.get(t.id!) || []
                };
            });

            const matches = await ConnectAIService.autoAssignTasks(tasksForMatching as any, memberProfiles as any, userId);

            const finalAssignments = (matches || [])
                .map(m => {
                    const originalTaskId = m.taskId ? idByInternalTaskId.get(m.taskId) : undefined;
                    return {
                        ...m,
                        taskId: originalTaskId,
                        taskTitle: m.taskTitle || (originalTaskId
                            ? (tasksToProcess.find(t => t.id === originalTaskId)?.title || 'Unknown')
                            : 'Unknown')
                    };
                })
                .filter(a => !!a.taskId);

            setAssignments(finalAssignments);
            setStatus('complete');
        } catch (error: any) {
            console.error(error);
            toast.error(error?.message || 'AI Matching failed');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const applyAssignments = async () => {
        const toastId = toast.loading('Applying assignments...');
        try {
            await Promise.all(
                assignments.map(a => TaskService.reassignTask(a.taskId!, a.assigneeId, a.assigneeUsername))
            );
            toast.success('Tasks assigned successfully!', { id: toastId });
            onAssignmentsApplied();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to apply changes', { id: toastId });
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={loading ? () => { } : onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 text-left align-middle shadow-xl transition-all">
                            <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <ConnektIcon />
                                Team Matcher
                            </Dialog.Title>

                            {/* INITIAL STATE UI */}
                            {!loading && status === '' && (
                                <div className="mt-4">
                                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                                        We will analyze your {currentTasks.length} tasks and match them to the most qualified members in your workspace based on skill compatibility.
                                    </p>
                                    <div className="flex justify-end gap-3">
                                        <button onClick={onClose} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl">Cancel</button>
                                        <button
                                            onClick={runAIMatching}
                                            className="px-6 py-2 bg-white border-2 border-[#008080] text-[#008080] hover:bg-teal-50 rounded-xl font-bold flex items-center gap-2 transition-all"
                                        >
                                            <ConnektIcon />
                                            Match Team
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* LOADING STATE UI */}
                            {loading && (
                                <div className="py-12 flex flex-col items-center justify-center text-center">
                                    <div className="relative w-16 h-16 mb-6">
                                        <div className="absolute inset-0 border-4 border-[#008080]/20 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-[#008080] rounded-full border-t-transparent animate-spin"></div>
                                        <ConnektIcon className="absolute inset-0 m-auto" />
                                    </div>
                                    <h4 className="text-lg font-bold text-[#008080] mb-2">Analyzing Skills...</h4>
                                    <p className="text-gray-500 animate-pulse">{status}</p>
                                </div>
                            )}

                            {/* RESULTS STATE UI */}
                            {!loading && status === 'complete' && (
                                <div className="mt-4">
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-4">Recommended Assignments</h4>
                                    <div className="max-h-[300px] overflow-y-auto space-y-3 mb-6 pr-2">
                                        {assignments.length > 0 ? assignments.map((a, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-zinc-700">
                                                <div className="min-w-0">
                                                    <div className="font-bold text-sm text-gray-900 dark:text-white truncate">{a.taskTitle}</div>
                                                    <div className="text-xs text-gray-500 italic truncate">"{a.reason}"</div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <div className="text-right">
                                                        <div className="text-xs font-bold text-[#008080]">@{a.assigneeUsername}</div>
                                                        <div className="text-[10px] text-green-600">{a.confidence}% Match</div>
                                                    </div>
                                                    <Check size={16} className="text-green-500" />
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-center py-4 text-gray-500 italic bg-gray-50 dark:bg-zinc-800/30 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700">
                                                No high-confidence matches found for these tasks based on team skills.
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-zinc-800 pt-4">
                                        <button onClick={onClose} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl">Discard</button>
                                        <button
                                            onClick={applyAssignments}
                                            disabled={assignments.length === 0}
                                            className="px-6 py-2 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-500/20"
                                        >
                                            <Check size={18} />
                                            Apply Assignments
                                        </button>
                                    </div>
                                </div>
                            )}
                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
