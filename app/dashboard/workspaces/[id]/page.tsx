'use client';

import { useRef, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { WorkspaceService } from '@/lib/services/workspace-service';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { Workspace, Project, WorkspaceMember } from '@/lib/types/workspace.types';
import { Loader2, Folder, Users, Settings, Briefcase, Plus, UserPlus, ArrowLeft } from 'lucide-react';
import AddWorkspaceMemberModal from '@/components/AddWorkspaceMemberModal';
import ManageWorkspaceMemberModal from '@/components/ManageWorkspaceMemberModal';
import CreateJobModal from '@/components/dashboard/workspaces/CreateJobModal';

export default function WorkspaceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, userProfile } = useAuth();
    const workspaceId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [userRole, setUserRole] = useState<'owner' | 'admin' | 'member' | null>(null);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isCreateJobModalOpen, setIsCreateJobModalOpen] = useState(false);

    // Manage Member State
    const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(null);
    const [isManageMemberModalOpen, setIsManageMemberModalOpen] = useState(false);

    useEffect(() => {
        if (user && workspaceId) {
            const fetchData = async () => {
                try {
                    // First get workspace and role
                    const [workspaceData, role] = await Promise.all([
                        WorkspaceService.getWorkspace(workspaceId),
                        WorkspaceService.getUserRole(workspaceId, user.uid)
                    ]);

                    setWorkspace(workspaceData);
                    setUserRole(role);

                    // Then fetch projects based on role
                    let projectsData: Project[] = [];
                    if (role === 'owner' || role === 'admin') {
                        projectsData = await EnhancedProjectService.getWorkspaceProjects(workspaceId);
                    } else if (role === 'member') { // Basic check, enhanced service handles strict logic
                        // For regular members, only show projects they are part of
                        projectsData = await EnhancedProjectService.getWorkspaceProjectsForMember(workspaceId, user.uid);
                    } else {
                        // Not a member?
                        projectsData = [];
                    }

                    setProjects(projectsData);
                } catch (error) {
                    console.error('Error fetching workspace:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [user, workspaceId]);

    const handleMemberAdded = () => {
        if (workspaceId) {
            WorkspaceService.getWorkspace(workspaceId).then(setWorkspace);
        }
    };

    const handleMemberUpdated = () => {
        if (workspaceId) {
            WorkspaceService.getWorkspace(workspaceId).then(setWorkspace);
        }
    };

    const handleMemberClick = (member: WorkspaceMember) => {
        if (canManage) {
            setSelectedMember(member);
            setIsManageMemberModalOpen(true);
        }
    };

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
                    onClick={() => router.push('/dashboard/workspaces')}
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
            {/* ... (Header, Stats, Projects Section) ... same as before, skipping redundant replaces for clarity if possible, 
                 but replace_file_content needs context. I will assume Header/Stats/Projects are unchanged and only focus on the whole file or appropriate chunks.
                 Actually, since I need to hook up the modal and click handler, I will replace the whole return block related to members to be safe, 
                 or better, replace the file to ensure all imports and state are clean. 
                 But wait, I will try to be surgical.
            */}

            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard/workspaces')}
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
                        <>
                            <button
                                onClick={() => setIsCreateJobModalOpen(true)}
                                className="px-5 py-2.5 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-lg shadow-teal-500/20"
                            >
                                <Briefcase size={16} />
                                Post Job
                            </button>
                            <button
                                onClick={() => setIsAddMemberModalOpen(true)}
                                className="px-5 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
                            >
                                <UserPlus size={16} />
                                Invite Members
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => router.push(`/dashboard/workspaces/${workspaceId}/settings`)}
                        className="px-5 py-2.5 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-teal-500/20"
                    >
                        <Plus size={16} />
                        New Project
                    </button>
                    {isOwner && (
                        <button
                            onClick={() => router.push(`/dashboard/workspaces/${workspaceId}/settings`)}
                            className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                            title="Workspace Settings"
                        >
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
                            onClick={() => router.push(`/dashboard/projects/create?workspace=${workspaceId}`)}
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
                                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
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
                                onClick={() => handleMemberClick(member)}
                                className={`flex items-center gap-3 p-4 bg-white dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-zinc-700 transition-all ${canManage ? 'cursor-pointer hover:border-[#008080] hover:shadow-lg' : ''
                                    }`}
                            >
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white font-bold">
                                    {member.username[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                        @{member.username}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {member.jobTitle || member.type || member.role}
                                        </p>
                                        {member.type === 'freelancer' && (
                                            <span className="px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-bold">
                                                FL
                                            </span>
                                        )}
                                    </div>
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

            <AddWorkspaceMemberModal
                isOpen={isAddMemberModalOpen}
                onClose={() => setIsAddMemberModalOpen(false)}
                workspaceId={workspaceId}
                workspaceName={workspace?.name}
                onMemberAdded={handleMemberAdded}
            />

            <ManageWorkspaceMemberModal
                isOpen={isManageMemberModalOpen}
                onClose={() => setIsManageMemberModalOpen(false)}
                workspaceId={workspaceId}
                member={selectedMember}
                onMemberUpdated={handleMemberUpdated}
            />

            <CreateJobModal
                isOpen={isCreateJobModalOpen}
                onClose={() => setIsCreateJobModalOpen(false)}
                workspaceId={workspaceId}
            />
        </div>
    );
}
