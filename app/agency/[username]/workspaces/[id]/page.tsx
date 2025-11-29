'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { WorkspaceService } from '@/lib/services/workspace-service';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { Workspace, Project } from '@/lib/types/workspace.types';
import { Loader2, Folder, Users, Settings, Briefcase, Plus, UserPlus, ArrowLeft } from 'lucide-react';

export default function AgencyWorkspaceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const agencyUsername = params.username as string;
    const workspaceId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [userRole, setUserRole] = useState<'owner' | 'admin' | 'member' | null>(null);

    useEffect(() => {
        if (user && workspaceId) {
            const fetchData = async () => {
                try {
                    const [workspaceData, projectsData, role] = await Promise.all([
                        WorkspaceService.getWorkspace(workspaceId),
                        EnhancedProjectService.getWorkspaceProjects(workspaceId),
                        WorkspaceService.getUserRole(workspaceId, user.uid)
                    ]);

                    setWorkspace(workspaceData);
                    setProjects(projectsData);
                    setUserRole(role);
                } catch (error) {
                    console.error('Error fetching workspace:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [user, workspaceId]);

    if (loading) {
        return (
            <div className="h-[calc(100vh-120px)] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#008080]" size={40} />
            </div>
        );
    }

    if (!workspace) {
        return (
            <div className="max-w-4xl mx-auto text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Folder size={40} className="text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Workspace Not Found
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    This workspace doesn't exist or you don't have access to it.
                </p>
                <button
                    onClick={() => router.push(`/agency/${agencyUsername}/workspaces`)}
                    className="px-6 py-3 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold transition-all"
                >
                    Back to Workspaces
                </button>
            </div>
        );
    }

    const isOwner = userRole === 'owner';
    const canManage = userRole === 'owner' || userRole === 'admin';

    return (
        <div className="max-w-[1400px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push(`/agency/${agencyUsername}/workspaces`)}
                        className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-teal-500/30">
                        {workspace.name[0].toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{workspace.name}</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">{workspace.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {canManage && (
                        <button className="px-5 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2">
                            <UserPlus size={16} />
                            Invite Members
                        </button>
                    )}
                    <button
                        onClick={() => router.push(`/agency/${agencyUsername}/projects/create?workspace=${workspaceId}`)}
                        className="px-5 py-2.5 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-teal-500/20"
                    >
                        <Plus size={16} />
                        New Project
                    </button>
                    {isOwner && (
                        <button className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
                            <Settings size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Briefcase size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">{projects.length}</div>
                            <div className="text-sm text-gray-500">Projects</div>
                        </div>
                    </div>
                    <div className="text-xs text-gray-500">
                        {projects.filter(p => p.status === 'active').length} active
                    </div>
                </div>

                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <Users size={24} className="text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">{workspace.members.length}</div>
                            <div className="text-sm text-gray-500">Members</div>
                        </div>
                    </div>
                    <div className="text-xs text-gray-500">
                        {workspace.members.filter(m => m.role === 'owner').length} owner,
                        {workspace.members.filter(m => m.role === 'admin').length} admin
                    </div>
                </div>

                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Folder size={24} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white capitalize">{workspace.isActive ? 'Active' : 'Inactive'}</div>
                            <div className="text-sm text-gray-500">Status</div>
                        </div>
                    </div>
                    <div className="text-xs text-gray-500">
                        Your role: <span className="font-semibold capitalize">{userRole}</span>
                    </div>
                </div>
            </div>

            {/* Projects Section */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Briefcase className="text-[#008080]" size={28} />
                    Projects in this Workspace
                </h2>
                {projects.length === 0 ? (
                    <div className="bg-white/60 dark:bg-zinc-900/60 rounded-2xl border border-gray-200 dark:border-zinc-800 p-12 text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                            <Briefcase size={40} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            No projects yet
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Create your first project in this workspace
                        </p>
                        <button
                            onClick={() => router.push(`/agency/${agencyUsername}/projects/create?workspace=${workspaceId}`)}
                            className="px-6 py-3 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold transition-all inline-flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Create Project
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map(project => (
                            <div
                                key={project.id}
                                onClick={() => router.push(`/agency/${agencyUsername}/projects/${project.id}`)}
                                className="group bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] hover:border-[#008080] dark:hover:border-[#008080]"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-[#008080] transition-colors">
                                        {project.title}
                                    </h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${project.status === 'active' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' :
                                        project.status === 'planning' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' :
                                            project.status === 'completed' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800' :
                                                'bg-amber-100 text-amber-600 dark:bg-amber-900/30'
                                        }`}>
                                        {project.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                                    {project.description}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Users size={12} />
                                        {project.members.length}
                                    </span>
                                    <span>•</span>
                                    <span>${project.budget}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Members Section */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Users className="text-[#008080]" size={28} />
                    Team Members
                </h2>
                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {workspace.members.map((member, index) => (
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
                                    member.role === 'admin' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' :
                                        'bg-gray-100 text-gray-600 dark:bg-gray-800'
                                    }`}>
                                    {member.role}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
