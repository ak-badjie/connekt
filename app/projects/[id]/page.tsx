'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ProjectService, Task } from '@/lib/services/project-service';
import { Loader2, Plus, Calendar, DollarSign, Clock, CheckCircle2, Circle } from 'lucide-react';
import TaskModal from '@/components/projects/TaskModal';

export default function ProjectWorkspace() {
    const params = useParams();
    const projectId = params.id as string;

    const [project, setProject] = useState<any>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    const handleStatusChange = async (taskId: string, newStatus: 'todo' | 'in-progress' | 'done') => {
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

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Project Header */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 border border-gray-100 dark:border-zinc-800">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{project.title}</h1>
                        <p className="text-gray-500 max-w-2xl">{project.description}</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-5 py-2.5 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-teal-500/20"
                    >
                        <Plus size={18} /> New Task
                    </button>
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
                                {tasks.filter(t => t.status === col.id).map(task => (
                                    <div key={task.id} className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm hover:shadow-md transition-all group relative">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${task.priority === 'high' ? 'bg-red-100 text-red-600' :
                                                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                                        'bg-green-100 text-green-600'
                                                }`}>
                                                {task.priority}
                                            </span>
                                            {task.assignee && (
                                                <span className="text-xs text-gray-400 font-medium">@{task.assignee}</span>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">{task.title}</h4>
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{task.description}</p>

                                        {/* Status Movers (Simple Click Logic) */}
                                        <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                                            {col.id !== 'todo' && (
                                                <button onClick={() => handleStatusChange(task.id!, 'todo')} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded" title="Move to Todo">
                                                    <Circle size={14} />
                                                </button>
                                            )}
                                            {col.id !== 'in-progress' && (
                                                <button onClick={() => handleStatusChange(task.id!, 'in-progress')} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded" title="Move to In Progress">
                                                    <Clock size={14} />
                                                </button>
                                            )}
                                            {col.id !== 'done' && (
                                                <button onClick={() => handleStatusChange(task.id!, 'done')} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded" title="Move to Done">
                                                    <CheckCircle2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <TaskModal
                projectId={projectId}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onTaskCreated={loadData}
            />
        </div>
    );
}
