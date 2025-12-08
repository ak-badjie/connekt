'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { Project } from '@/lib/types/workspace.types';
import SupervisorManagement from '@/components/projects/SupervisorManagement';
import { ArrowLeft, Loader2, Settings, Briefcase, Trash2 } from 'lucide-react';
// We can reuse WorkspaceSettings generic logic or create specificProjectSettings component
// For now, let's implement inline general settings for simplicity

export default function ProjectSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const projectId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [project, setProject] = useState<Project | null>(null);
    const [saving, setSaving] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [budget, setBudget] = useState(0);

    const fetchData = async () => {
        if (!user || !projectId) return;
        try {
            const p = await EnhancedProjectService.getProject(projectId);
            setProject(p);
            if (p) {
                setTitle(p.title);
                setDescription(p.description);
                setBudget(p.budget);
            }
        } catch (error) {
            console.error('Error fetching project settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user, projectId]);

    const handleSave = async () => {
        if (!project) return;
        setSaving(true);
        try {
            await EnhancedProjectService.updateProject(project.id!, {
                title,
                description,
                budget
            });
            // Toast success
            alert('Project updated!');
        } catch (e) {
            console.error(e);
            alert('Failed to update project');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!project) return <div>Project not found</div>;

    const isOwner = user?.uid === project.ownerId || user?.uid === project.assignedOwnerId;

    if (!isOwner) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                <p className="text-gray-500 mb-4">Only the project owner can manage settings.</p>
                <button onClick={() => router.back()} className="text-[#008080] hover:underline">Go Back</button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.push(`/dashboard/projects/${projectId}`)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Settings className="text-[#008080]" />
                        Project Settings
                    </h1>
                    <p className="text-gray-500">Manage {project.title}</p>
                </div>
            </div>

            <div className="space-y-8">
                {/* General */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <Briefcase className="text-[#008080]" size={24} />
                        Details
                    </h3>
                    <div className="space-y-4 max-w-xl">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Project Title</label>
                            <input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 h-24 resize-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Budget</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    value={budget}
                                    onChange={e => setBudget(Number(e.target.value))}
                                    className="w-full pl-8 pr-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2 bg-[#008080] text-white rounded-xl font-bold disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                {/* Supervisors */}
                <SupervisorManagement
                    project={project}
                    canManage={isOwner}
                    onUpdate={fetchData}
                />

                {/* Danger Zone - Placeholder */}
                <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-900/30 p-6 opacity-60">
                    <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                        <Trash2 size={20} /> Danger Zone
                    </h3>
                    <p className="text-sm">Archiving projects is not yet enabled.</p>
                </div>
            </div>
        </div>
    );
}
