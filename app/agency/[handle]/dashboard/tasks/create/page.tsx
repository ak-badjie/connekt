'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { TaskService } from '@/lib/services/task-service';
import { AgencyService } from '@/lib/services/agency-service';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { Loader2, CheckSquare, ArrowLeft, Check, Calendar, DollarSign, Clock } from 'lucide-react';
import { Project } from '@/lib/types/workspace.types';

function CreateTaskForm() {
    const { user, userProfile } = useAuth();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const agencyUsername = params.handle as string;
    const preselectedProjectId = searchParams.get('project');

    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [fetchingProjects, setFetchingProjects] = useState(true);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        projectId: preselectedProjectId || '',
        priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
        dueDate: '',
        estimatedHours: '',
        amount: '',
        currency: 'GMD'
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        const loadProjects = async () => {
            if (!user || !agencyUsername) return;
            try {
                const agency = await AgencyService.getAgencyByUsername(agencyUsername);
                if (agency) {
                    const data = await EnhancedProjectService.getAgencyProjects(agency.id!);
                    setProjects(data);
                }
            } catch (error) {
                console.error('Error loading projects:', error);
            } finally {
                setFetchingProjects(false);
            }
        };
        loadProjects();
    }, [user, agencyUsername]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.title.trim()) newErrors.title = 'Task title is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.projectId) newErrors.projectId = 'Please select a project';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate() || !user || !userProfile) return;

        setLoading(true);
        try {
            const taskId = await TaskService.createTask({
                title: formData.title,
                description: formData.description,
                projectId: formData.projectId,
                assigneeId: user.uid, // Initially assigned to creator or can be changed later
                assigneeUsername: userProfile.username || 'user',
                priority: formData.priority,
                timeline: {
                    dueDate: formData.dueDate,
                    estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined
                },
                pricing: {
                    amount: formData.amount ? parseFloat(formData.amount) : 0,
                    currency: formData.currency,
                    paymentStatus: 'pending'
                }
            });

            router.push(`/agency/@${agencyUsername}/dashboard/tasks/${taskId}`);
        } catch (error) {
            console.error('Error creating task:', error);
            alert('Failed to create task. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-zinc-800 p-8">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                            Task Title *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g. Design Homepage Mockup"
                            className={`w-full px-4 py-3 bg-white dark:bg-zinc-800 border ${errors.title ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all`}
                        />
                        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                            Description *
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Describe the task requirements and deliverables..."
                            className={`w-full px-4 py-3 bg-white dark:bg-zinc-800 border ${errors.description ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all resize-none`}
                        />
                        {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                            Project *
                        </label>
                        {fetchingProjects ? (
                            <div className="h-12 bg-gray-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
                        ) : (
                            <div className="relative">
                                <select
                                    name="projectId"
                                    value={formData.projectId}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 bg-white dark:bg-zinc-800 border ${errors.projectId ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all appearance-none`}
                                >
                                    <option value="">Select a project</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                    <CheckSquare size={16} />
                                </div>
                            </div>
                        )}
                        {errors.projectId && <p className="mt-1 text-sm text-red-500">{errors.projectId}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                            Priority
                        </label>
                        <div className="relative">
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all appearance-none"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                            Due Date
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                <Calendar size={16} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                            Estimated Hours
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                name="estimatedHours"
                                value={formData.estimatedHours}
                                onChange={handleChange}
                                placeholder="0"
                                min="0"
                                step="0.5"
                                className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                <Clock size={16} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                            Payment Amount ($)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                <DollarSign size={16} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
    );
}

export default function CreateAgencyTaskPage() {
    const router = useRouter();

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
                            Add a new task to an agency project
                        </p>
                    </div>
                </div>
            </div>

            <Suspense fallback={<div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-[#008080]" /></div>}>
                <CreateTaskForm />
            </Suspense>
        </div>
    );
}
