'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Folder, ExternalLink, Calendar, Users } from 'lucide-react';
import { ProjectItemControls } from './ProjectItemControls';
import { ExternalProjectForm } from './ExternalProjectForm';
import Image from 'next/image';

interface Project {
    id: string;
    title: string;
    description: string;
    url?: string;
    role?: string;
    startDate?: any;
    endDate?: any;
    status: 'active' | 'completed' | 'archived';
    technologies?: string[];
    media?: any[];
    isExternal?: boolean;
    isVisible: boolean;
}

interface ProjectsSectionProps {
    projects: Project[];
    isOwner: boolean;
    uid: string;
    onProjectsUpdate?: (projects: Project[]) => void;
}

export function ProjectsSection({ projects: initialProjects, isOwner, uid, onProjectsUpdate }: ProjectsSectionProps) {
    const [projects, setProjects] = useState(initialProjects);
    const [showExternalForm, setShowExternalForm] = useState(false);

    const handleToggleVisibility = (projectId: string, visible: boolean) => {
        const updated = projects.map(p =>
            p.id === projectId ? { ...p, isVisible: visible } : p
        );
        setProjects(updated);
        onProjectsUpdate?.(updated);
    };

    const handleDeleteProject = (projectId: string) => {
        const updated = projects.filter(p => p.id !== projectId);
        setProjects(updated);
        onProjectsUpdate?.(updated);
    };

    const handleAddExternalProject = (project: any) => {
        const newProject = {
            id: `ext_${Date.now()}`,
            ...project,
        };
        const updated = [...projects, newProject];
        setProjects(updated);
        onProjectsUpdate?.(updated);
    };

    // Filter projects based on visibility and ownership
    const visibleProjects = isOwner
        ? projects
        : projects.filter(p => p.isVisible);

    if (visibleProjects.length === 0 && !isOwner) {
        return null; // Don't show section if no visible projects
    }

    return (
        <div className="profile-section">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Folder className="w-6 h-6 text-teal-600" />
                    Projects
                </h3>
                {isOwner && (
                    <button
                        onClick={() => setShowExternalForm(true)}
                        className="px-4 py-2 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-xl transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add External Project
                    </button>
                )}
            </div>

            {visibleProjects.length === 0 ? (
                <div className="text-center py-12 glass-card-subtle rounded-2xl">
                    <Folder className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No projects yet</p>
                    {isOwner && (
                        <button
                            onClick={() => setShowExternalForm(true)}
                            className="mt-4 px-6 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors"
                        >
                            Add Your First Project
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {visibleProjects.map((project, index) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`glass-card rounded-2xl p-5 hover:shadow-lg transition-all relative ${!project.isVisible && isOwner ? 'opacity-60 border-2 border-dashed border-yellow-400 dark:border-yellow-600' : ''
                                }`}
                        >
                            {/* Hidden Badge (only visible to owner) */}
                            {!project.isVisible && isOwner && (
                                <div className="absolute top-3 left-3 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg text-xs font-semibold">
                                    Hidden
                                </div>
                            )}

                            {/* Controls Menu (owner only) */}
                            {isOwner && (
                                <div className="absolute top-3 right-3">
                                    <ProjectItemControls
                                        projectId={project.id}
                                        isVisible={project.isVisible}
                                        isExternal={project.isExternal}
                                        onToggleVisibility={handleToggleVisibility}
                                        onDelete={project.isExternal ? handleDeleteProject : undefined}
                                    />
                                </div>
                            )}

                            {/* Project Image/Thumbnail */}
                            {project.media && project.media.length > 0 && (
                                <div className="aspect-video rounded-xl overflow-hidden mb-4 bg-gray-100 dark:bg-zinc-800">
                                    {project.media[0].type === 'image' ? (
                                        <Image
                                            src={project.media[0].url}
                                            alt={project.title}
                                            width={400}
                                            height={225}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <video
                                            src={project.media[0].url}
                                            className="w-full h-full object-cover"
                                            controls
                                        />
                                    )}
                                </div>
                            )}

                            {/* Project Info */}
                            <div className={isOwner ? 'pr-8' : ''}>
                                <div className="flex items-start gap-2 mb-2">
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white flex-1">
                                        {project.title}
                                    </h4>
                                    {project.isExternal && (
                                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-semibold flex items-center gap-1">
                                            <ExternalLink className="w-3 h-3" />
                                            External
                                        </span>
                                    )}
                                </div>

                                {project.role && (
                                    <p className="text-teal-600 dark:text-teal-400 font-medium text-sm mb-2">
                                        {project.role}
                                    </p>
                                )}

                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-3">
                                    {project.description}
                                </p>

                                {/* Technologies */}
                                {project.technologies && project.technologies.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {project.technologies.slice(0, 4).map((tech) => (
                                            <span
                                                key={tech}
                                                className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded text-xs font-medium"
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                        {project.technologies.length > 4 && (
                                            <span className="px-2 py-1 text-gray-500 dark:text-gray-400 text-xs">
                                                +{project.technologies.length - 4} more
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-zinc-700">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                        {project.startDate && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(project.startDate).getFullYear()}
                                            </span>
                                        )}
                                        <span className={`px-2 py-0.5 rounded ${project.status === 'completed'
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                : project.status === 'active'
                                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400'
                                            }`}>
                                            {project.status}
                                        </span>
                                    </div>

                                    {project.url && (
                                        <a
                                            href={project.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 text-xs font-medium flex items-center gap-1"
                                        >
                                            View Project
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* External Project Form */}
            {showExternalForm && (
                <ExternalProjectForm
                    uid={uid}
                    onClose={() => setShowExternalForm(false)}
                    onProjectAdded={handleAddExternalProject}
                />
            )}
        </div>
    );
}
