'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { TaskService } from '@/lib/services/task-service';
import { Project, Task } from '@/lib/types/workspace.types';
import { Loader2, Briefcase, ArrowLeft, Plus, Users, Calendar, DollarSign, Settings, UserPlus, Clock, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const projectId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isOwner, setIsOwner] = useState(false);
    const [isSupervisor, setIsSupervisor] = useState(false);

    useEffect(() => {
        if (user && projectId) {
            const fetchData = async () => {
                try {
                    const [projectData, tasksData, ownerCheck, supervisorCheck] = await Promise.all([
                        EnhancedProjectService.getProject(projectId),
                        TaskService.getProjectTasks(projectId),
                        EnhancedProjectService.isOwner(projectId, user.uid),
                        EnhancedProjectService.isSupervisor(projectId, user.uid)
                    ]);

                    setProject(projectData);
                    setTasks(tasksData);
                    setIsOwner(ownerCheck);
                    setIsSupervisor(supervisorCheck);
                } catch (error) {
                    console.error('Error fetching project:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [user, projectId]);

    const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        await TaskService.updateTaskStatus(taskId, newStatus);
    };

    if (loading) {
        return (
            <div className="h-[calc(100vh-120px)] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#008080]" size={40} />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="max-w-4xl mx-auto text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Briefcase size={40} className="text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Project Not Found
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    This project doesn't exist or you don't have access to it.
                </p>
                <button
                    onClick={() => router.push('/dashboard/projects')}
                    className="px-6 py-3 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold transition-all"
                >
                    Back to Projects
                </button>
            </div>
        );
    }

    const columns = [
        { id: 'todo', label: 'To Do', icon: Circle, color: 'text-gray-500' },
        { id: 'in-progress', label: 'In Progress', icon: Clock, color: 'text-blue-500' },
        { id: 'pending-validation', label: 'Pending Validation', icon: AlertCircle, color: 'text-amber-500' },
        { id: 'done', label: 'Done', icon: CheckCircle2, color: 'text-green-500' }
    ];

    const canManage = isOwner || isSupervisor;

    return (
        <div className="max-w-[1600px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard/projects')}
                        className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
                        <Briefcase size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{project.title}</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">{project.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {canManage && (
                        <>
                            <button className="px-5 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2">
                                <UserPlus size={16} />
                                Add Member
                            </button>
                            <button
                                onClick={() => router.push(`/dashboard/tasks/create?project=${projectId}`)}
                                className="px-5 py-2.5 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-teal-500/20"
                            >
                                <Plus size={16} />
                                New Task
                            </button>
                        </>
                    )}
                    {isOwner && (
                        <button className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
                            <Settings size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Project Info Bar */}
            <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Calendar size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Deadline</div>
                            <div className="font-bold text-gray-900 dark:text-white">{project.deadline || 'No deadline'}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <DollarSign size={20} className="text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Budget</div>
                            <div className="font-bold text-gray-900 dark:text-white">${project.budget || 0}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Users size={20} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Members</div>
                            <div className="font-bold text-gray-900 dark:text-white">{project.members.length}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Briefcase size={20} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</div>
                            <div className="font-bold text-gray-900 dark:text-white capitalize">{project.status}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Kanban Board */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Tasks</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[500px]">
                    {columns.map(col => {
                        const StatusIcon = col.icon;
                        const columnTasks = tasks.filter(t => t.status === col.id);

                        return (
                            <div key={col.id} className="flex flex-col bg-gray-50/50 dark:bg-zinc-900/50 rounded-2xl border border-gray-200/50 dark:border-zinc-800/50 p-4">
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <div className="flex items-center gap-2">
                                        <StatusIcon size={18} className={col.color} />
                                        <h3 className="font-bold text-gray-700 dark:text-gray-200">{col.label}</h3>
                                    </div>
                                    <span className="bg-white dark:bg-zinc-800 px-2 py-1 rounded-md text-xs font-bold text-gray-500 border border-gray-100 dark:border-zinc-700">
                                        {columnTasks.length}
                                    </span>
                                </div>

                                <div className="flex-1 space-y-3 overflow-y-auto">
                                    {columnTasks.map(task => (
                                        <div
                                            key={task.id}
                                            onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                                            className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${task.priority === 'urgent' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' :
                                                        task.priority === 'high' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' :
                                                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30' :
                                                                'bg-green-100 text-green-600 dark:bg-green-900/30'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                                {task.assigneeUsername && (
                                                    <span className="text-xs text-gray-400 font-medium">@{task.assigneeUsername}</span>
                                                )}
                                            </div>
                                            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1 group-hover:text-[#008080] transition-colors">{task.title}</h4>
                                            <p className="text-xs text-gray-500 line-clamp-2 mb-2">{task.description}</p>
                                            {task.pricing && (
                                                <div className="text-xs font-bold text-[#008080]">${task.pricing.amount}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Team Members */}
            {project.members.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Users className="text-[#008080]" size={28} />
                        Team Members
                    </h2>
                    <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {project.members.map((member, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-zinc-700"
                                >
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white font-bold">
                                        {member.username[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                            @{member.username}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {member.email}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${member.role === 'owner' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' :
                                            member.role === 'supervisor' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' :
                                                'bg-gray-100 text-gray-600 dark:bg-gray-800'
                                        }`}>
                                        {member.role}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
