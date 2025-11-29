'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { Project } from '@/lib/types/workspace.types';
import { Plus, Briefcase, Users, Calendar, DollarSign, ArrowRight, Loader2, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProjectsStartupPage() {
    const { user, userProfile } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [yourProjects, setYourProjects] = useState<Project[]>([]);
    const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
    const [otherProjects, setOtherProjects] = useState<Project[]>([]);

    useEffect(() => {
        if (user && userProfile) {
            const fetchProjects = async () => {
                try {
                    const [owned, assigned, memberOf] = await Promise.all([
                        EnhancedProjectService.getUserProjects(user.uid),
                        EnhancedProjectService.getAssignedProjects(user.uid),
                        EnhancedProjectService.getProjectsMemberOf(user.uid)
                    ]);
                    setYourProjects(owned);
                    setAssignedProjects(assigned);
                    setOtherProjects(memberOf);
                } catch (error) {
                    console.error('Error fetching projects:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchProjects();
        }
    }, [user, userProfile]);

    const handleCreateProject = () => {
        router.push('/dashboard/projects/create');
    };

    const handleProjectClick = (projectId: string) => {
        router.push(`/dashboard/projects/${projectId}`);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
            case 'planning':
                return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
            case 'completed':
                return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
            case 'on-hold':
                return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
            default:
                return 'bg-gray-100 text-gray-600 dark:bg-gray-800';
        }
    };

    const renderProject = (project: Project, isOwned: boolean = true, isAssigned: boolean = false) => (
        <div
            key={project.id}
            onClick={() => handleProjectClick(project.id!)}
            className="group bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] hover:border-[#008080] dark:hover:border-[#008080]"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-teal-500/30">
                        <Briefcase size={24} />
                    </div>
                    {isAssigned && (
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-lg flex items-center gap-1">
                            <Star size={12} />
                            Assigned
                        </span>
                    )}
                </div>
                <ArrowRight
                    size={20}
                    className="text-gray-400 group-hover:text-[#008080] group-hover:translate-x-1 transition-all"
                />
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#008080] transition-colors">
                {project.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 min-h-[2.5rem]">
                {project.description}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-xs">
                    <Calendar size={14} className="text-[#008080]" />
                    <span className="text-gray-600 dark:text-gray-400">
                        {project.deadline || 'No deadline'}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <DollarSign size={14} className="text-[#008080]" />
                    <span className="text-gray-600 dark:text-gray-400">
                        ${project.budget || 0}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <Users size={14} className="text-[#008080]" />
                    <span className="text-gray-600 dark:text-gray-400">
                        {project.members.length} members
                    </span>
                </div>
                <div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(project.status)}`}>
                        {project.status}
                    </span>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="h-[calc(100vh-120px)] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#008080]" size={40} />
            </div>
        );
    }

    const allYourProjects = [...yourProjects, ...assignedProjects];

    return (
        <div className="max-w-[1400px] mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Projects</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Manage all your projects and collaborate with your team
                    </p>
                </div>
                <button
                    onClick={handleCreateProject}
                    className="px-6 py-3 bg-gradient-to-r from-[#008080] to-teal-600 hover:from-teal-600 hover:to-[#008080] text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-105"
                >
                    <Plus size={20} />
                    Create Project
                </button>
            </div>

            {/* Your Projects */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Briefcase className="text-[#008080]" size={28} />
                    Your Projects
                    {assignedProjects.length > 0 && (
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                            ({assignedProjects.length} assigned to you)
                        </span>
                    )}
                </h2>
                {allYourProjects.length === 0 ? (
                    <div className="bg-white/60 dark:bg-zinc-900/60 rounded-2xl border border-gray-200 dark:border-zinc-800 p-12 text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                            <Briefcase size={40} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            No projects yet
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Create your first project to start managing tasks and collaborating
                        </p>
                        <button
                            onClick={handleCreateProject}
                            className="px-6 py-3 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold transition-all inline-flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Create Project
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {yourProjects.map((project) => renderProject(project, true, false))}
                        {assignedProjects.map((project) => renderProject(project, false, true))}
                    </div>
                )}
            </div>

            {/* Other Projects */}
            {otherProjects.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Users className="text-[#008080]" size={28} />
                        Other Projects
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                            (You're a member)
                        </span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {otherProjects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => handleProjectClick(project.id!)}
                                className="group bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] hover:bg-white/60 dark:hover:bg-zinc-900/60"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white">
                                        <Briefcase size={20} />
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(project.status)}`}>
                                        {project.status}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    {project.title}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">
                                    {project.description}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Users size={12} />
                                        {project.members.length}
                                    </span>
                                    <span>•</span>
                                    <span>Owner: @{project.ownerUsername}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
