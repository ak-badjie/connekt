'use client';

import { useState } from 'react';
import { Workspace } from '@/lib/types/workspace.types';
import { WorkspaceService } from '@/lib/services/workspace-service';
import { Save, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface WorkspaceSettingsProps {
    workspace: Workspace;
    onUpdate: () => void;
}

export default function WorkspaceSettings({ workspace, onUpdate }: WorkspaceSettingsProps) {
    const router = useRouter();
    const [name, setName] = useState(workspace.name);
    const [description, setDescription] = useState(workspace.description);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await WorkspaceService.updateWorkspace(workspace.id!, {
                name,
                description
            });
            onUpdate();
            // Show success toast ideally
        } catch (error) {
            console.error('Failed to update workspace:', error);
            alert('Failed to update workspace.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) return;

        setDeleting(true);
        try {
            await WorkspaceService.deactivateWorkspace(workspace.id!);
            router.push('/dashboard/workspaces');
        } catch (error) {
            console.error('Failed to delete workspace:', error);
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* General Settings */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">General Settings</h3>

                <div className="space-y-4 max-w-xl">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Workspace Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#008080]/50"
                            placeholder="e.g. Acme Agency"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#008080]/50 min-h-[100px]"
                            placeholder="Brief description of your workspace..."
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-3 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-900/30 p-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                        <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">Danger Zone</h3>
                        <p className="text-red-600/80 dark:text-red-400/80 mb-6 text-sm">
                            Deactivating a workspace will hide it from all members. This action usually requires support to reverse.
                        </p>

                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="px-6 py-3 bg-white dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl font-bold flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            {deleting ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                            Deactivate Workspace
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
