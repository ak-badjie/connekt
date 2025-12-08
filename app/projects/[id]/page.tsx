'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProjectService, Task } from '@/lib/services/project-service';
import { Loader2, Plus, Calendar, DollarSign, Clock, FileCheck, Eye, Settings } from 'lucide-react';
import SubmitWorkModal from '@/components/contracts/SubmitWorkModal';
import ReviewWorkModal from '@/components/contracts/ReviewWorkModal';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import TaskModal from '@/components/projects/TaskModal';

export default function ProjectWorkspace() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const [project, setProject] = useState<any>(null);
    const { user, userProfile } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Enforcement Modal States
    const [selectedTaskForSubmit, setSelectedTaskForSubmit] = useState<Task | null>(null);
    const [selectedTaskForReview, setSelectedTaskForReview] = useState<Task | null>(null);
    const [reviewContractId, setReviewContractId] = useState<string>('');

    const findContractForTask = async (taskId: string) => {
        try {
            const q = query(
                collection(db, 'mail_contracts'),
                where('relatedEntityId', '==', taskId),
                where('status', '==', 'accepted')
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                return snapshot.docs[0].id; // Return first active contract
            }
        } catch (e) {
            console.error('Error finding contract', e);
        }
        return '';
    };

    const handleReviewClick = async (task: Task) => {
        const cId = await findContractForTask(task.id!);
        if (cId) {
            setReviewContractId(cId);
            setSelectedTaskForReview(task);
        } else {
            console.error('No active contract found for this task.');
            alert('No active contract found for this task. Cannot process review.');
        }
    };

    const loadData = async () => {
        try {
            const [p, t] = await Promise.all([
                ProjectService.getProject(projectId),
                ProjectService.getTasks(projectId)
            ]);
            setProject(p);
            setTasks(t);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [projectId]);

    const handleStatusChange = async (taskId: string, newStatus: any) => {
        // Optimistic update
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        await ProjectService.updateTaskStatus(taskId, newStatus);
    };

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#008080]" /></div>;
    if (!project) return <div className="text-center py-10">Project not found</div>;

    const columns = [
        { id: 'todo', label: 'To Do', color: 'bg-gray-200 dark:bg-zinc-700' },
        { id: 'in-progress', label: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' },
        { id: 'done', label: 'Done', color: 'bg-green-100 dark:bg-green-900/30 text-green-600' }
    ];

    const isOwner = user?.uid === project.ownerId || user?.uid === project.assignedOwnerId;
    const isSupervisor = project.supervisors?.includes(user?.uid);

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Project Header */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 border border-gray-100 dark:border-zinc-800">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{project.title}</h1>
                        <p className="text-gray-500 max-w-2xl">{project.description}</p>
                    </div>
                    <div className="flex gap-2">
                        {isOwner && (
                            <button
                                onClick={() => router.push(`/projects/${projectId}/settings`)}
                                className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                                title="Project Settings"
                            >
                                <Settings size={18} />
                            </button>
                        )}
                        {(isOwner || isSupervisor) && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="px-5 py-2.5 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-teal-500/20"
                            >
                                <Plus size={18} /> New Task
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex gap-8 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Calendar size={16} className="text-[#008080]" />
                        <span className="font-bold">Deadline:</span> {project.deadline || 'No deadline'}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <DollarSign size={16} className="text-[#008080]" />
                        <span className="font-bold">Budget:</span> ${project.budget || '0'}
                    </div>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-w-[800px]">
                    {columns.map(col => (
                        <div key={col.id} className="flex flex-col h-full bg-gray-50/50 dark:bg-zinc-900/50 rounded-2xl border border-gray-200/50 dark:border-zinc-800/50 p-4">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <h3 className="font-bold text-gray-700 dark:text-gray-200">{col.label}</h3>
                                <span className="bg-white dark:bg-zinc-800 px-2 py-1 rounded-md text-xs font-bold text-gray-500 border border-gray-100 dark:border-zinc-700">
                                    {tasks.filter(t => t.status === col.id).length}
                                </span>
                            </div>

                            <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                                {tasks.filter(t => t.status === col.id).map(task => {
                                    const isTaskAdmin = (task as any).taskAdminId === user?.uid;
                                    const isAssignee = task.assigneeId === user?.uid || task.assigneeUsername === userProfile?.username;
                                    const canSubmit = task.status === 'in-progress' && (isTaskAdmin || isAssignee);

                                    return (
                                        <div key={task.id} className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm hover:shadow-md transition-all group relative">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${task.priority === 'high' ? 'bg-red-100 text-red-600' :
                                                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                                        'bg-green-100 text-green-600'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                                {task.assigneeUsername && (
                                                    <span className="text-xs text-gray-400 font-medium">@{task.assigneeUsername}</span>
                                                )}
                                            </div>
                                            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">{task.title}</h4>
                                            <p className="text-xs text-gray-500 line-clamp-2 mb-3">{task.description}</p>

                                            {(task as any).status === 'pending-validation' && (
                                                <div className="mb-2 px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded border border-amber-100 flex items-center gap-1">
                                                    <Clock size={10} /> Review Pending
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="flex gap-1 mt-2 opacity-100 justify-end">
                                                {canSubmit && (
                                                    <button
                                                        onClick={() => setSelectedTaskForSubmit(task)}
                                                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded text-xs font-bold flex items-center gap-1 hover:bg-blue-200"
                                                        title="Submit Proof of Task"
                                                    >
                                                        <FileCheck size={12} /> Submit
                                                    </button>
                                                )}
                                                {((task as any).status === 'pending-validation' && (isOwner || isSupervisor)) && (
                                                    <button
                                                        onClick={() => handleReviewClick(task)}
                                                        className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded text-xs font-bold flex items-center gap-1 hover:bg-amber-200"
                                                        title="Review Submission"
                                                    >
                                                        <Eye size={12} /> Review
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                projectId={projectId}
                onTaskCreated={loadData}
            />

            <SubmitWorkModal
                isOpen={!!selectedTaskForSubmit}
                onClose={() => setSelectedTaskForSubmit(null)}
                taskId={selectedTaskForSubmit?.id!}
                userId={user?.uid!}
                username={userProfile?.username || user?.displayName || 'User'}
                onSubmitSuccess={loadData}
            />

            <ReviewWorkModal
                isOpen={!!selectedTaskForReview}
                onClose={() => setSelectedTaskForReview(null)}
                contractId={reviewContractId}
                taskId={selectedTaskForReview?.id!}
                clientId={user?.uid!}
                clientUsername={userProfile?.username || user?.displayName || 'User'}
                pot={selectedTaskForReview?.proofOfTask!}
                onReviewComplete={loadData}
            />
        </div>
    );
}
