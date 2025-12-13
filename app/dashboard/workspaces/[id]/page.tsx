'use client';

import { Fragment, useRef, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { WorkspaceService } from '@/lib/services/workspace-service';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { Workspace, Project, WorkspaceMember } from '@/lib/types/workspace.types';
import { Dialog, Transition } from '@headlessui/react';
import { Loader2, Folder, Users, Settings, Briefcase, Plus, UserPlus, ArrowLeft, X, DollarSign, Sparkles, FileText } from 'lucide-react';
import AddWorkspaceMemberModal from '@/components/AddWorkspaceMemberModal';
import ManageWorkspaceMemberModal from '@/components/ManageWorkspaceMemberModal';
import CreateJobModal from '@/components/dashboard/workspaces/CreateJobModal';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import { toast } from 'react-hot-toast';

export default function WorkspaceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const workspaceId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [jobs, setJobs] = useState<any[]>([]);
    const [userRole, setUserRole] = useState<'owner' | 'admin' | 'member' | null>(null);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isCreateJobModalOpen, setIsCreateJobModalOpen] = useState(false);

    // Create Project Mode Selection
    const [isProjectModeOpen, setIsProjectModeOpen] = useState(false);

    // Edit Job State
    const [jobToEdit, setJobToEdit] = useState<any | null>(null);
    const [isEditJobModalOpen, setIsEditJobModalOpen] = useState(false);

    // Delete Job State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [jobToDelete, setJobToDelete] = useState<any>(null);

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

                    // Fetch Jobs if Owner/Admin
                    if (role === 'owner' || role === 'admin') {
                        const jobsData = await WorkspaceService.getWorkspaceJobs(workspaceId);
                        setJobs(jobsData);
                    }

                } catch (error) {
                    console.error('Error fetching workspace:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [user, workspaceId]);

    const handleJobCreated = () => {
        if (workspaceId) {
            WorkspaceService.getWorkspaceJobs(workspaceId).then(setJobs);
        }
    };

    const handleEditJob = (job: any) => {
        setJobToEdit(job);
        setIsEditJobModalOpen(true);
    };

    const handleDeleteJob = async (job: any) => {
        setJobToDelete(job);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteJob = async () => {
        if (!jobToDelete) return;
        try {
            await WorkspaceService.deleteJob(jobToDelete.id);
            setJobs(prev => prev.filter(j => j.id !== jobToDelete.id)); // Optimistic update
            toast.success('Opportunity deleted successfully');
        } catch (error) {
            console.error('Failed to delete job', error);
            toast.error('Failed to delete opportunity');
        }
    };

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

    const isOwner = userRole === 'owner';
    const canManage = userRole === 'owner' || userRole === 'admin';

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

    return (
        <div className="max-w-[1400px] mx-auto space-y-6">
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
                        onClick={() => setIsProjectModeOpen(true)}
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

            {/* Jobs Section (Owner/Admin Only) */}
            {(userRole === 'owner' || userRole === 'admin') && (
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Briefcase className="text-[#008080]" size={28} />
                        Hosted Opportunities
                    </h2>
                    {jobs.length === 0 ? (
                        <div className="bg-white/60 dark:bg-zinc-900/60 rounded-2xl border border-dashed border-gray-300 dark:border-zinc-700 p-8 text-center mb-8">
                            <p className="text-gray-500 mb-4">No active opportunities posted yet.</p>
                            <button
                                onClick={() => setIsCreateJobModalOpen(true)}
                                className="px-5 py-2.5 bg-white dark:bg-zinc-800 text-[#008080] border border-[#008080] rounded-xl font-bold hover:bg-teal-50 dark:hover:bg-zinc-700 transition-all text-sm inline-flex items-center gap-2"
                            >
                                <Plus size={16} />
                                Post Opportunity
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                            {jobs.map(job => (
                                <div
                                    key={job.id}
                                    className="group bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="bg-teal-50 dark:bg-teal-900/20 text-[#008080] dark:text-teal-400 px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                                            {job.type}
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditJob(job); }}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Settings size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteJob(job); }}
                                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">{job.title}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 h-10">
                                        {job.description}
                                    </p>
                                    <div className="flex items-center gap-1 text-sm font-bold text-gray-900 dark:text-white">
                                        <DollarSign size={14} className="text-[#008080]" />
                                        {job.salary} {job.currency}
                                        <span className="text-gray-400 font-normal text-xs ml-1">/ {job.paymentSchedule}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Projects Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Folder className="text-[#008080]" size={28} />
                        Projects
                    </h2>
                </div>

                {projects.length === 0 ? (
                    <div className="text-center py-12 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-dashed border-gray-300 dark:border-zinc-700">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                            <Folder size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Projects Yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                            Start organizing your work by creating your first project in this workspace.
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
                onClose={() => {
                    setIsCreateJobModalOpen(false);
                    handleJobCreated(); // Refresh list on close/submit
                }}
                workspaceId={workspaceId}
            />

            {/* Edit Job Modal */}
            <CreateJobModal
                isOpen={isEditJobModalOpen}
                onClose={() => {
                    setIsEditJobModalOpen(false);
                    setJobToEdit(null);
                    handleJobCreated();
                }}
                workspaceId={workspaceId}
                jobToEdit={jobToEdit}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDeleteJob}
                title="Delete Opportunity?"
                message="This will permanently remove this job posting. All active applications and proposals linked to this opportunity will be archived. This action cannot be undone."
                itemType="Opportunity"
            />

            {/* Project Mode Selection Modal */}
            <Transition appear show={isProjectModeOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsProjectModeOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-8 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-2xl font-bold leading-6 text-gray-900 dark:text-white mb-2"
                                    >
                                        Create Project
                                    </Dialog.Title>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            How would you like to structure your new project?
                                        </p>
                                    </div>

                                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <button
                                            onClick={() => {
                                                setIsProjectModeOpen(false);
                                                router.push(`/dashboard/projects/create/ai?workspaceId=${workspaceId}`);
                                            }}
                                            className="group relative flex flex-col items-center p-8 rounded-2xl border-2 border-[#008080] bg-white dark:bg-zinc-900 hover:bg-teal-50 dark:hover:bg-zinc-800/50 transition-all text-center shadow-lg shadow-teal-500/10"
                                        >
                                            <div className="absolute top-4 right-4">
                                                <span className="bg-[#008080] text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                                    Branded
                                                </span>
                                            </div>
                                            <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#008080] flex items-center justify-center text-[#008080] mb-6 shadow-sm group-hover:scale-110 transition-transform">
                                                <Sparkles size={32} />
                                            </div>
                                            <h4 className="text-xl font-bold text-[#008080] mb-2 flex items-center gap-2">
                                                <Sparkles size={18} /> Project Architect
                                            </h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Describe your vision. We structure the tasks, split the budget, and find the team.
                                            </p>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setIsProjectModeOpen(false);
                                                router.push(`/dashboard/projects/create?workspace=${workspaceId}`);
                                            }}
                                            className="group flex flex-col items-center p-8 rounded-2xl border-2 border-dashed border-gray-300 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all text-center"
                                        >
                                            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 dark:text-gray-400 mb-6 group-hover:scale-110 transition-transform">
                                                <FileText size={32} />
                                            </div>
                                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Manual Setup</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Build from scratch. Create specific tasks and assign members yourself.
                                            </p>
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}
