'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { WorkspaceService } from '@/lib/services/workspace-service';
import { Workspace } from '@/lib/types/workspace.types';
import WorkspaceSettings from '@/components/workspaces/WorkspaceSettings';
import MemberManagement from '@/components/workspaces/MemberManagement';
import { ArrowLeft, Loader2, Settings as SettingsIcon } from 'lucide-react';

export default function WorkspaceSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const workspaceId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [userRole, setUserRole] = useState<'owner' | 'admin' | 'member' | null>(null);
    const [activeTab, setActiveTab] = useState<'general' | 'members'>('general');

    const fetchData = async () => {
        if (!user || !workspaceId) return;
        try {
            const [ws, role] = await Promise.all([
                WorkspaceService.getWorkspace(workspaceId),
                WorkspaceService.getUserRole(workspaceId, user.uid)
            ]);
            setWorkspace(ws);
            setUserRole(role);
        } catch (error) {
            console.error('Error fetching workspace settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user, workspaceId]);

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!workspace) return <div>Workspace not found</div>;

    // Authorization check
    if (userRole !== 'owner' && userRole !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                <p className="text-gray-500 mb-4">You do not have permission to view settings for this workspace.</p>
                <button onClick={() => router.back()} className="text-[#008080] hover:underline">Go Back</button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.push(`/dashboard/workspaces/${workspaceId}`)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <SettingsIcon className="text-[#008080]" />
                        Workspace Settings
                    </h1>
                    <p className="text-gray-500">Manage {workspace.name}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-zinc-800/50 p-1 rounded-xl w-fit mb-8">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'general' ? 'bg-white dark:bg-zinc-800 shadow text-[#008080]' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    General
                </button>
                <button
                    onClick={() => setActiveTab('members')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'members' ? 'bg-white dark:bg-zinc-800 shadow text-[#008080]' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Members & Roles
                </button>
            </div>

            {/* Content */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                {activeTab === 'general' && (
                    <WorkspaceSettings workspace={workspace} onUpdate={fetchData} />
                )}
                {activeTab === 'members' && (
                    <MemberManagement workspace={workspace} currentUserRole={userRole} onUpdate={fetchData} />
                )}
            </div>
        </div>
    );
}
