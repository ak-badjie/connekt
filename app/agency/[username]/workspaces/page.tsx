'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AgencyService, Agency } from '@/lib/services/agency-service';
import { WorkspaceService } from '@/lib/services/workspace-service';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { Workspace } from '@/lib/types/workspace.types';
import { Loader2, FolderKanban, Plus, Users, Briefcase, ArrowRight } from 'lucide-react';

export default function AgencyWorkspacesPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const agencyUsername = params.username as string;

    const [loading, setLoading] = useState(true);
    const [agency, setAgency] = useState<Agency | null>(null);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [workspaceStats, setWorkspaceStats] = useState<Record<string, { projects: number; members: number }>>({});

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !agencyUsername) return;

            setLoading(true);
            try {
                const agencyData = await AgencyService.getAgencyByUsername(agencyUsername);
                if (agencyData) {
                    setAgency(agencyData);
                    const workspacesData = await WorkspaceService.getAgencyWorkspaces(agencyData.id!);
                    setWorkspaces(workspacesData);

                    // Fetch stats for each workspace
                    const stats: Record<string, { projects: number; members: number }> = {};
                    for (const workspace of workspacesData) {
                        const projects = await EnhancedProjectService.getWorkspaceProjects(workspace.id!);
                        stats[workspace.id!] = {
                            projects: projects.length,
                            members: workspace.members.length
                        };
                    }
                    setWorkspaceStats(stats);
                }
            } catch (error) {
                console.error('Error fetching workspaces:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, agencyUsername]);

    if (loading) {
        return (
            <div className="h-[calc(100vh-120px)] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#008080]" size={40} />
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-4xl fond-bold text-gray-900 dark:text-white mb-2">Workspaces</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage your agency workspaces and projects</p>
                </div>
                <button
                    onClick={() => router.push(`/agency/${agencyUsername}/workspaces/create`)}
                    className="px-6 py-3 bg-gradient-to-r from-[#008080] to-teal-600 hover:from-teal-600 hover:to-[#008080] text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-teal-500/30"
                >
                    <Plus size={20} />
                    Create Workspace
                </button>
            </div>

            {/* Workspaces Grid */}
            {workspaces.length === 0 ? (
                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-zinc-800 p-16 text-center">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                        <FolderKanban size={48} className="text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        No Workspaces Yet
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                        Create your first workspace to organize projects and collaborate with your team
                    </p>
                    <button
                        onClick={() => router.push(`/agency/${agencyUsername}/workspaces/create`)}
                        className="px-6 py-3 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold inline-flex items-center gap-2 transition-all"
                    >
                        <Plus size={20} />
                        Create First Workspace
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workspaces.map((workspace) => (
                        <div
                            key={workspace.id}
                            onClick={() => router.push(`/agency/${agencyUsername}/workspaces/${workspace.id}`)}
                            className="group relative bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
                                    <FolderKanban size={28} />
                                </div>
                                <ArrowRight className="text-gray-400 group-hover:text-[#008080] group-hover:translate-x-1 transition-all" size={20} />
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#008080] transition-colors">
                                {workspace.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                                {workspace.description}
                            </p>

                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                    <Briefcase size={16} />
                                    <span className="font-medium">{workspaceStats[workspace.id!]?.projects || 0}</span>
                                    <span className="text-gray-400">projects</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                    <Users size={16} />
                                    <span className="font-medium">{workspaceStats[workspace.id!]?.members || 0}</span>
                                    <span className="text-gray-400">members</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
