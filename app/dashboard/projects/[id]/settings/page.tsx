'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { Project, ProjectMember } from '@/lib/types/workspace.types';
import { Loader2, Settings, ArrowLeft, Save, DollarSign, UserCheck } from 'lucide-react';

export default function ProjectSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const projectId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [project, setProject] = useState<Project | null>(null);
    const [canManage, setCanManage] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        budget: '',
        deadline: '',
        assignedOwnerId: '' // For re-assignment
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [budgetStatus, setBudgetStatus] = useState<{
        spent: number;
        remaining: number;
    } | null>(null);

    useEffect(() => {
        if (user && projectId) {
            const fetchData = async () => {
                try {
                    const [projectData, ownerCheck, supervisorCheck, budgetData] = await Promise.all([
                        EnhancedProjectService.getProject(projectId),
                        EnhancedProjectService.isOwner(projectId, user.uid),
                        EnhancedProjectService.isSupervisor(projectId, user.uid),
                        EnhancedProjectService.getProjectBudgetStatus(projectId)
                    ]);

                    if (!projectData) {
                        setProject(null);
                        setLoading(false);
                        return;
                    }

                    if (!ownerCheck && !supervisorCheck) {
                        router.push(`/dashboard/projects/${projectId}`);
                        return;
                    }

                    setProject(projectData);
                    setCanManage(true);
                    setBudgetStatus(budgetData);
                    setFormData({
                        title: projectData.title,
                        description: projectData.description,
                        budget: projectData.budget?.toString() || '',
                        deadline: projectData.deadline || '',
                        assignedOwnerId: projectData.assignedOwnerId || ''
                    });
                } catch (error) {
                    console.error('Error fetching project:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [user, projectId, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) newErrors.title = 'Project title is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';

        const newBudget = parseFloat(formData.budget);
        if (!formData.budget || newBudget <= 0) {
            newErrors.budget = 'Budget must be greater than 0';
        } else if (budgetStatus && newBudget < budgetStatus.spent) {
            newErrors.budget = `Budget cannot be less than already allocated amount ($${budgetStatus.spent.toFixed(2)})`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate() || !project) return;

        setSaving(true);
        try {
            // Update project details
            await EnhancedProjectService.updateProject(projectId, {
                title: formData.title,
                description: formData.description,
                assignedOwnerId: formData.assignedOwnerId || undefined, // undefined instead of null
                assignedOwnerUsername: formData.assignedOwnerId
                    ? project.members.find(m => m.userId === formData.assignedOwnerId)?.username
                    : undefined // undefined instead of null
            });

            // Update budget separately (if changed)
            if (parseFloat(formData.budget) !== project.budget) {
                await EnhancedProjectService.updateProjectBudget(projectId, parseFloat(formData.budget));
            }

            // Update deadline if changed (Project update handles this implicitly via spread usually, but explicitly is fine)
            if (formData.deadline !== project.deadline) {
                await EnhancedProjectService.updateProject(projectId, { deadline: formData.deadline });
            }

            alert('Project settings saved successfully!');
            router.push(`/dashboard/projects/${projectId}`);
        } catch (error: any) {
            console.error('Error saving settings:', error);
            alert(error.message || 'Failed to save settings. Please try again.');
        } finally {
            setSaving(false);
        }
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Project Not Found
                </h2>
                <button
                    onClick={() => router.push('/dashboard/projects')}
                    className="px-6 py-3 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold transition-all"
                >
                    Back to Projects
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <button
                    onClick={() => router.push(`/dashboard/projects/${projectId}`)}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#008080] transition-colors mb-4"
                >
                    <ArrowLeft size={20} />
                    Back to Project
                </button>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
                        <Settings size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Project Settings</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Manage project details, budget, and assignment
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Budget Warning */}
                {budgetStatus && budgetStatus.spent > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            <strong>Note:</strong> ${budgetStatus.spent.toFixed(2)} has already been allocated to tasks.
                            New budget must be at least this amount.
                        </p>
                    </div>
                )}

                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-zinc-800 p-8 space-y-6">
                    {/* Project Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                            Project Title *
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
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
                            className={`w-full px-4 py-3 bg-white dark:bg-zinc-800 border ${errors.description ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'
                                } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20 resize-none`}
                        />
                        {errors.description && <p className="mt-2 text-sm text-red-500">{errors.description}</p>}
                    </div>

                    {/* Budget */}
                    <div>
                        <label htmlFor="budget" className="block text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            <DollarSign size={16} className="text-[#008080]" />
                            Project Budget *
                        </label>
                        {budgetStatus && (
                            <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                Currently allocated: ${budgetStatus.spent.toFixed(2)} |
                                Remaining: ${budgetStatus.remaining.toFixed(2)}
                            </div>
                        )}
                        <input
                            type="number"
                            id="budget"
                            name="budget"
                            value={formData.budget}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            className={`w-full px-4 py-3 bg-white dark:bg-zinc-800 border ${errors.budget ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'
                                } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20`}
                        />
                        {errors.budget && <p className="mt-2 text-sm text-red-500">{errors.budget}</p>}
                    </div>

                    {/* Deadline */}
                    <div>
                        <label htmlFor="deadline" className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                            Deadline (Optional)
                        </label>
                        <input
                            type="date"
                            id="deadline"
                            name="deadline"
                            value={formData.deadline}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
                        />
                    </div>

                    {/* Project Assignment (Re-assign) */}
                    <div>
                        <label htmlFor="assignedOwnerId" className="block text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            <UserCheck size={16} className="text-[#008080]" />
                            Assign Project To (Lead)
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            Designate a member as the active project lead or freelancer.
                        </p>
                        <select
                            id="assignedOwnerId"
                            name="assignedOwnerId"
                            value={formData.assignedOwnerId}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
                        >
                            <option value="">No specific assignment</option>
                            {project.members.map(member => (
                                <option key={member.userId} value={member.userId}>
                                    @{member.username} ({member.role})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-[#008080] to-teal-600 hover:from-teal-600 hover:to-[#008080] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                Save Changes
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push(`/dashboard/projects/${projectId}`)}
                        className="px-6 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
