'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { TaskService } from '@/lib/services/task-service';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { Project } from '@/lib/types/workspace.types';
import { Loader2, CheckSquare, ArrowLeft, Check, Calendar, DollarSign, Clock } from 'lucide-react';

export default function CreateTaskPage() {
    const { user, userProfile } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const projectIdParam = searchParams.get('project');

    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [formData, setFormData] = useState({
        projectId: projectIdParam || '',
        title: '',
        description: '',
        priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
        dueDate: '',
        estimatedHours: '',
        amount: '',
        currency: 'GMD'
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (user) {
            const fetchProjects = async () => {
                const [owned, assigned] = await Promise.all([
                    EnhancedProjectService.getUserProjects(user.uid),
                    EnhancedProjectService.getAssignedProjects(user.uid)
                ]);
                const allProjects = [...owned, ...assigned];
                setProjects(allProjects);

                if (!projectIdParam && allProjects.length > 0) {
                    setFormData(prev => ({ ...prev, projectId: allProjects[0].id! }));
                }
            };
            fetchProjects();
        }
    }, [user, projectIdParam]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.projectId) newErrors.projectId = 'Please select a project';
        if (!formData.title.trim()) newErrors.title = 'Task title is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Payment amount must be greater than 0';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate() || !user || !userProfile) return;

        const selectedProject = projects.find(p => p.id === formData.projectId);
        if (!selectedProject) return;

        setLoading(true);
        try {
            const taskId = await TaskService.createTask({
                projectId: formData.projectId,
                workspaceId: selectedProject.workspaceId,
                title: formData.title,
                description: formData.description,
                priority: formData.priority,
                createdBy: user.uid,
                timeline: {
                    dueDate: formData.dueDate || undefined,
                    estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined
                },
                pricing: {
                    amount: parseFloat(formData.amount),
                    currency: formData.currency,
                    paymentStatus: 'pending'
                }
            });

            router.push(`/dashboard/tasks/${taskId}`);
        } catch (error) {
            console.error('Error creating task:', error);
            alert('Failed to create task. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (projects.length === 0 && !loading) {
        return (
            <div className="max-w-3xl mx-auto text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    <CheckSquare size={40} className="text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Create a Project First
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    Tasks must belong to a project. Create a project before creating tasks.
                </p>
                <button
                    onClick={() => router.push('/dashboard/projects/create')}
                    className="px-6 py-3 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold inline-flex items-center gap-2 transition-all"
                >
                    Create Project
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#008080] transition-colors mb-4"
                >
                    <ArrowLeft size={20} />
                    Back
                </button>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
                        <CheckSquare size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Create Task</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Add a new task to your project
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-zinc-800 p-8 space-y-6">
                    {/* Project Selection */}
                    <div>
                        <label htmlFor="projectId" className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                            Project *
                        </label>
                        <select
                            id="projectId"
                            name="projectId"
                            value={formData.projectId}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 bg-white dark:bg-zinc-800 border ${errors.projectId ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'
                                } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20`}
                        >
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>
                                    {project.title}
                                </option>
                            ))}
                        </select>
                        {errors.projectId && <p className="mt-2 text-sm text-red-500">{errors.projectId}</p>}
                    </div>

                    {/* Task Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                            Task Title *
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g. Design homepage hero section, Fix login bug"
                            className={`w-full px-4 py-3 bg-white dark:bg-zinc-800 border ${errors.title ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'
                                } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20`}
                        />
                        {errors.title && <p className="mt-2 text-sm text-red-500">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                            Description *
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Describe what needs to be done..."
                            className={`w-full px-4 py-3 bg-white dark:bg-zinc-800 border ${errors.description ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'
                                } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20 resize-none`}
                        />
                        {errors.description && <p className="mt-2 text-sm text-red-500">{errors.description}</p>}
                    </div>

                    {/* Priority */}
                    <div>
                        <label htmlFor="priority" className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                            Priority
                        </label>
                        <select
                            id="priority"
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>

                    {/* Timeline Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="dueDate" className="block text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <Calendar size={16} className="text-[#008080]" />
                                Due Date (Optional)
                            </label>
                            <input
                                type="date"
                                id="dueDate"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
                            />
                        </div>

                        <div>
                            <label htmlFor="estimatedHours" className="block text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <Clock size={16} className="text-[#008080]" />
                                Estimated Hours
                            </label>
                            <input
                                type="number"
                                id="estimatedHours"
                                name="estimatedHours"
                                value={formData.estimatedHours}
                                onChange={handleChange}
                                min="0"
                                step="0.5"
                                placeholder="0"
                                className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
                            />
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                            <label htmlFor="amount" className="block text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <DollarSign size={16} className="text-[#008080]" />
                                Payment Amount *
                            </label>
                            <input
                                type="number"
                                id="amount"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                className={`w-full px-4 py-3 bg-white dark:bg-zinc-800 border ${errors.amount ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'
                                    } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20`}
                            />
                            {errors.amount && <p className="mt-2 text-sm text-red-500">{errors.amount}</p>}
                        </div>

                        <div>
                            <label htmlFor="currency" className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                                Currency
                            </label>
                            <select
                                id="currency"
                                name="currency"
                                value={formData.currency}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
                            >
                                <option value="GMD">GMD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-[#008080] to-teal-600 hover:from-teal-600 hover:to-[#008080] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Check size={20} />
                                Create Task
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
