'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { TaskService } from '@/lib/services/task-service';
import { AgencyService } from '@/lib/services/agency-service';
import { Task } from '@/lib/types/workspace.types';
import { CheckSquare, Clock, AlertCircle, CheckCircle2, Loader2, Filter, Plus } from 'lucide-react';

export default function AgencyTasksStartupPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const agencyUsername = params.handle as string;
    const [loading, setLoading] = useState(true);
    const [allTasks, setAllTasks] = useState<Task[]>([]);
    const [filter, setFilter] = useState<'all' | 'todo' | 'in-progress' | 'pending-validation' | 'done'>('all');

    useEffect(() => {
        if (user && agencyUsername) {
            const fetchTasks = async () => {
                try {
                    const agency = await AgencyService.getAgencyByUsername(agencyUsername);
                    if (agency) {
                        const tasks = await TaskService.getAgencyTasks(agency.id!);
                        setAllTasks(tasks);
                    }
                } catch (error) {
                    console.error('Error fetching tasks:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchTasks();
        }
    }, [user, agencyUsername]);

    const handleTaskClick = (taskId: string) => {
        router.push(`/agency/${agencyUsername}/dashboard/tasks/${taskId}`);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-900';
            case 'high':
                return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300 dark:border-orange-900';
            case 'medium':
                return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-900';
            default:
                return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-900';
        }
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'todo':
                return { icon: CheckSquare, label: 'To Do', color: 'text-gray-500' };
            case 'in-progress':
                return { icon: Clock, label: 'In Progress', color: 'text-blue-500' };
            case 'pending-validation':
                return { icon: AlertCircle, label: 'Pending Validation', color: 'text-amber-500' };
            case 'done':
                return { icon: CheckCircle2, label: 'Done', color: 'text-green-500' };
            default:
                return { icon: CheckSquare, label: status, color: 'text-gray-500' };
        }
    };

    const filteredTasks = filter === 'all' ? allTasks : allTasks.filter(t => t.status === filter);

    const tasksByStatus = {
        todo: allTasks.filter(t => t.status === 'todo').length,
        'in-progress': allTasks.filter(t => t.status === 'in-progress').length,
        'pending-validation': allTasks.filter(t => t.status === 'pending-validation').length,
        done: allTasks.filter(t => t.status === 'done').length,
    };

    if (loading) {
        return (
            <div className="h-[calc(100vh-120px)] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#008080]" size={40} />
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Tasks</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        View and manage all agency tasks
                    </p>
                </div>
                <button
                    onClick={() => router.push(`/agency/${agencyUsername}/dashboard/tasks/create`)}
                    className="px-6 py-3 bg-gradient-to-r from-[#008080] to-teal-600 hover:from-teal-600 hover:to-[#008080] text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-105"
                >
                    <Plus size={20} />
                    Create Task
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/60 dark:bg-zinc-900/60 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{tasksByStatus.todo}</div>
                    <div className="text-sm text-gray-500">To Do</div>
                </div>
                <div className="bg-white/60 dark:bg-zinc-900/60 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{tasksByStatus['in-progress']}</div>
                    <div className="text-sm text-gray-500">In Progress</div>
                </div>
                <div className="bg-white/60 dark:bg-zinc-900/60 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
                    <div className="text-2xl font-bold text-amber-600 mb-1">{tasksByStatus['pending-validation']}</div>
                    <div className="text-sm text-gray-500">Pending Validation</div>
                </div>
                <div className="bg-white/60 dark:bg-zinc-900/60 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
                    <div className="text-2xl font-bold text-green-600 mb-1">{tasksByStatus.done}</div>
                    <div className="text-sm text-gray-500">Done</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Filter size={16} />
                    Filter:
                </div>
                {(['all', 'todo', 'in-progress', 'pending-validation', 'done'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === status
                            ? 'bg-[#008080] text-white shadow-lg shadow-teal-500/30'
                            : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700'
                            }`}
                    >
                        {status === 'all' ? 'All Tasks' : getStatusInfo(status).label}
                    </button>
                ))}
            </div>

            {/* Tasks List */}
            <div>
                {filteredTasks.length === 0 ? (
                    <div className="bg-white/60 dark:bg-zinc-900/60 rounded-2xl border border-gray-200 dark:border-zinc-800 p-12 text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                            <CheckSquare size={40} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            No tasks found
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            {filter === 'all' ? 'No tasks available' : `No tasks with status "${filter}"`}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredTasks.map((task) => {
                            const StatusIcon = getStatusInfo(task.status).icon;
                            const statusColor = getStatusInfo(task.status).color;

                            return (
                                <div
                                    key={task.id}
                                    onClick={() => handleTaskClick(task.id!)}
                                    className="group bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-zinc-800 p-5 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01] hover:border-[#008080] dark:hover:border-[#008080]"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-1 ${statusColor}`}>
                                            <StatusIcon size={24} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-[#008080] transition-colors">
                                                    {task.title}
                                                </h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(task.priority)}`}>
                                                    {task.priority}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                                                {task.description}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock size={14} />
                                                    {task.timeline.dueDate || 'No deadline'}
                                                </span>
                                                {task.assigneeUsername && (
                                                    <span>Assigned: @{task.assigneeUsername}</span>
                                                )}
                                                {task.pricing && (
                                                    <span>${task.pricing.amount}</span>
                                                )}
                                                <span className={`${statusColor} font-medium`}>
                                                    {getStatusInfo(task.status).label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
