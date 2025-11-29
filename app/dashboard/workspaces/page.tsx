'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { WorkspaceService } from '@/lib/services/workspace-service';
import { Workspace } from '@/lib/types/workspace.types';
import { Plus, Folder, Users, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WorkspacesStartupPage() {
    const { user, userProfile } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [yourWorkspaces, setYourWorkspaces] = useState<Workspace[]>([]);
    const [otherWorkspaces, setOtherWorkspaces] = useState<Workspace[]>([]);

    useEffect(() => {
        if (user && userProfile) {
            const fetchWorkspaces = async () => {
                try {
                    const [owned, memberOf] = await Promise.all([
                        WorkspaceService.getUserWorkspaces(user.uid),
                        WorkspaceService.getWorkspacesMemberOf(user.uid)
                    ]);
                    setYourWorkspaces(owned);
                    setOtherWorkspaces(memberOf);
                } catch (error) {
                    console.error('Error fetching workspaces:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchWorkspaces();
        }
    }, [user, userProfile]);

    const handleCreateWorkspace = () => {
        router.push('/dashboard/workspaces/create');
    };

    const handleWorkspaceClick = (workspaceId: string) => {
        router.push(`/dashboard/workspaces/${workspaceId}`);
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
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Workspaces</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Organize your projects in dedicated workspaces for better collaboration
                    </p>
                </div>
                <button
                    onClick={handleCreateWorkspace}
                    className="px-6 py-3 bg-gradient-to-r from-[#008080] to-teal-600 hover:from-teal-600 hover:to-[#008080] text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-105"
                >
                    <Plus size={20} />
                    Create Workspace
                </button>
            </div>

            {/* Your Workspaces */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Folder className="text-[#008080]" size={28} />
                    Your Workspaces
                </h2>
                {yourWorkspaces.length === 0 ? (
                    <div className="bg-white/60 dark:bg-zinc-900/60 rounded-2xl border border-gray-200 dark:border-zinc-800 p-12 text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                            <Folder size={40} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            No workspaces yet
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Create your first workspace to start organizing your projects
                        </p>
                        <button
                            onClick={handleCreateWorkspace}
                            className="px-6 py-3 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold transition-all inline-flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Create Workspace
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {yourWorkspaces.map((workspace) => (
                            <div
                                key={workspace.id}
                                onClick={() => handleWorkspaceClick(workspace.id!)}
                                className="group bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] hover:border-[#008080] dark:hover:border-[#008080]"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-teal-500/30">
                                        {workspace.name[0].toUpperCase()}
                                    </div>
                                    <ArrowRight
                                        size={20}
                                        className="text-gray-400 group-hover:text-[#008080] group-hover:translate-x-1 transition-all"
                                    />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#008080] transition-colors">
                                    {workspace.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                                    {workspace.description}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Users size={14} />
                                        {workspace.members.length} {workspace.members.length === 1 ? 'member' : 'members'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} />
                                        Active
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Other Workspaces */}
            {otherWorkspaces.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Users className="text-[#008080]" size={28} />
                        Other Workspaces
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                            (You're a member)
                        </span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {otherWorkspaces.map((workspace) => (
                            <div
                                key={workspace.id}
                                onClick={() => handleWorkspaceClick(workspace.id!)}
                                className="group bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] hover:bg-white/60 dark:hover:bg-zinc-900/60"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-xl font-bold">
                                        {workspace.name[0].toUpperCase()}
                                    </div>
                                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg">
                                        Member
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    {workspace.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">
                                    {workspace.description}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Users size={12} />
                                        {workspace.members.length}
                                    </span>
                                    <span>•</span>
                                    <span>Owner: @{workspace.ownerUsername}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
