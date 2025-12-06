'use client';

import { useEffect, useState } from 'react';
import { X, Save, Loader2, Shield, UserCog, Briefcase } from 'lucide-react';
import { createPortal } from 'react-dom';
import { WorkspaceService } from '@/lib/services/workspace-service';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { WorkspaceMember, Project } from '@/lib/types/workspace.types';
import { toast } from 'react-hot-toast';

interface ManageWorkspaceMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
    member: WorkspaceMember | null;
    onMemberUpdated?: () => void;
}

export default function ManageWorkspaceMemberModal({
    isOpen,
    onClose,
    workspaceId,
    member,
    onMemberUpdated
}: ManageWorkspaceMemberModalProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [role, setRole] = useState<'admin' | 'member'>('member');
    const [type, setType] = useState<'employee' | 'freelancer'>('employee');
    const [jobTitle, setJobTitle] = useState('');
    const [blockedProjectIds, setBlockedProjectIds] = useState<string[]>([]);

    // Data
    const [workspaceProjects, setWorkspaceProjects] = useState<Project[]>([]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen && member) {
            setRole(member.role === 'owner' ? 'admin' : member.role as 'admin' | 'member');
            setType(member.type || 'employee'); // Default key back to employee if undefined
            setJobTitle(member.jobTitle || '');
            setBlockedProjectIds(member.settings?.blockedProjectIds || []);

            // Load projects for blocking UI
            loadProjects();
        }
    }, [isOpen, member, workspaceId]);

    const loadProjects = async () => {
        setLoading(true);
        try {
            // As an admin managing members, we see all projects
            const projects = await EnhancedProjectService.getWorkspaceProjects(workspaceId);
            setWorkspaceProjects(projects);
        } catch (error) {
            console.error('Failed to load projects:', error);
            toast.error('Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!member) return;

        setSaving(true);
        try {
            // Construct update object
            // Note: WorkspaceService needs an updateMember method. 
            // If it doesn't exist, we might need to implement it or use a generic update.
            // For now assuming we can update the member array in the workspace doc.

            await WorkspaceService.updateMember(workspaceId, member.userId, {
                role: member.role === 'owner' ? 'owner' : role, // Prevent downgrading owner via this modal if not intended
                type,
                jobTitle: type === 'employee' ? jobTitle : undefined,
                settings: type === 'employee' ? { blockedProjectIds } : undefined
            });

            toast.success('Member updated successfully');
            onMemberUpdated?.();
            onClose();
        } catch (error) {
            console.error('Failed to update member:', error);
            toast.error('Failed to update member');
        } finally {
            setSaving(false);
        }
    };

    const toggleProjectBlock = (projectId: string) => {
        setBlockedProjectIds(prev =>
            prev.includes(projectId)
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId]
        );
    };

    if (!isMounted || !isOpen || !member) return null;

    const isOwner = member.role === 'owner';

    return createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-[12000] p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <UserCog size={24} className="text-[#008080]" />
                            Manage Member
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            @{member.username} ({member.email})
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Shield size={18} />
                            Role & Type
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Role Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Workspace Role</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
                                    disabled={isOwner} // Cannot change owner role here
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="member">Member</option>
                                    <option value="admin">Admin</option>
                                    {isOwner && <option value="admin">Owner (Fixed)</option>}
                                </select>
                            </div>

                            {/* Type Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Member Type</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as 'employee' | 'freelancer')}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
                                >
                                    <option value="employee">Employee</option>
                                    <option value="freelancer">Freelancer</option>
                                </select>
                            </div>
                        </div>

                        {type === 'employee' && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Job Title</label>
                                <input
                                    type="text"
                                    value={jobTitle}
                                    onChange={(e) => setJobTitle(e.target.value)}
                                    placeholder="e.g. Senior Developer"
                                    className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
                                />
                            </div>
                        )}
                    </div>

                    {/* Access Control (Employees Only) */}
                    {type === 'employee' && (
                        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-zinc-800">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Briefcase size={18} />
                                    Project Access
                                </h3>
                                <div className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                    Employees have access to all projects by default
                                </div>
                            </div>

                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Select projects to <strong>BLOCK</strong> this employee from accessing.
                            </p>

                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="animate-spin text-gray-400" />
                                </div>
                            ) : workspaceProjects.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No projects found.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
                                    {workspaceProjects.map(project => {
                                        const isBlocked = blockedProjectIds.includes(project.id!);
                                        return (
                                            <div
                                                key={project.id}
                                                onClick={() => toggleProjectBlock(project.id!)}
                                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isBlocked
                                                        ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                                                        : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 hover:border-[#008080]'
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isBlocked
                                                        ? 'bg-red-500 border-red-500 text-white'
                                                        : 'border-gray-300 dark:border-zinc-600'
                                                    }`}>
                                                    {isBlocked && <X size={14} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-semibold truncate ${isBlocked ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                                        {project.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {project.status}
                                                    </p>
                                                </div>
                                                {isBlocked && (
                                                    <span className="text-xs font-bold text-red-600 dark:text-red-400 px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                                        BLOCKED
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-3 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
