'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { WorkspaceService } from '@/lib/services/workspace-service';
import { AgencyService } from '@/lib/services/agency-service';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, Folder, ArrowLeft, Check } from 'lucide-react';

export default function CreateAgencyWorkspacePage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const agencyUsername = params.handle as string;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const validate = () => {
        const newErrors: { name?: string; description?: string } = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Workspace name is required';
        } else if (formData.name.length < 3) {
            newErrors.name = 'Workspace name must be at least 3 characters';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        } else if (formData.description.length < 10) {
            newErrors.description = 'Description must be at least 10 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate() || !user) return;

        setLoading(true);
        try {
            const agency = await AgencyService.getAgencyByUsername(agencyUsername);
            if (!agency) throw new Error('Agency not found');

            const workspaceId = await WorkspaceService.createWorkspace({
                name: formData.name,
                description: formData.description,
                ownerId: agency.id!,
                ownerUsername: agencyUsername,
                ownerEmail: `info@${agency.domain}`
            });

            router.push(`/agency/${agencyUsername}/dashboard/workspaces/${workspaceId}`);
        } catch (error) {
            console.error('Error creating workspace:', error);
            alert('Failed to create workspace. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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
                        <Folder size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Create Workspace</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Set up a new workspace for your agency
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-zinc-800 p-8">
                    <div className="mb-6">
                        <label htmlFor="name" className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                            Workspace Name *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Client Projects, Internal Team"
                            className={`w-full px-4 py-3 bg-white dark:bg-zinc-800 border ${errors.name ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'
                                } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all`}
                        />
                        {errors.name && (
                            <p className="mt-2 text-sm text-red-500">{errors.name}</p>
                        )}
                    </div>

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
                            placeholder="Describe the purpose of this workspace and what kind of projects it will contain..."
                            className={`w-full px-4 py-3 bg-white dark:bg-zinc-800 border ${errors.description ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'
                                } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all resize-none`}
                        />
                        {errors.description && (
                            <p className="mt-2 text-sm text-red-500">{errors.description}</p>
                        )}
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {formData.description.length} characters
                        </p>
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
                                Create Workspace
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

            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-6">
                <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">💡 Agency Workspaces</h3>
                <p className="text-sm text-blue-800 dark:text-blue-400">
                    Use workspaces to organize your agency's projects by client, department, or project type.
                    All team members can collaborate across workspace projects.
                </p>
            </div>
        </div>
    );
}
