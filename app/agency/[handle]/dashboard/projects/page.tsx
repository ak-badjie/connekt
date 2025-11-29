'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AgencyService } from '@/lib/services/agency-service';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { Project } from '@/lib/types/workspace.types';
import { Plus, Briefcase, Users, Calendar, DollarSign, ArrowRight, Loader2 } from 'lucide-react';

export default function AgencyProjectsStartupPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const agencyUsername = params.handle as string;
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<Project[]>([]);

    useEffect(() => {
        if (user && agencyUsername) {
            const fetchProjects = async () => {
                try {
                    const agency = await AgencyService.getAgencyByUsername(agencyUsername);
                    if (agency) {
                        const agencyProjects = await EnhancedProjectService.getAgencyProjects(agency.id!);
                        setProjects(agencyProjects);
                    }
                } catch (error) {
                    console.error('Error fetching projects:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchProjects();
        }
    }, [user, agencyUsername]);

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

    if (loading) {
        return (
            <div className="h-[calc(100vh-120px)] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#008080]" size={40} />
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Projects</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        All your agency projects across workspaces
                    </p>
                </div>
                <button
                    onClick={() => router.push(`/agency/@${agencyUsername}/dashboard/projects/create`)}
                    className="px-6 py-3 bg-gradient-to-r from-[#008080] to-teal-600 hover:from-teal-600 hover:to-[#008080] text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-105"
                >
                    <Plus size={20} />
                    Create Project
                </button>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Briefcase className="text-[#008080]" size={28} />
                    Agency Projects
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
                            Create your first project to start managing tasks
                        </p>
                        <button
                            onClick={() => router.push(`/agency/@${agencyUsername}/dashboard/projects/create`)}
                            className="px-6 py-3 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold transition-all inline-flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Create Project
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => router.push(`/agency/@${agencyUsername}/dashboard/projects/${project.id}`)}
                                className="group bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] hover:border-[#008080] dark:hover:border-[#008080]"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
                                        <Briefcase size={24} />
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
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
