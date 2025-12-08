'use client';

import { useState } from 'react';
import { Project } from '@/lib/types/workspace.types';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { Shield, Plus, X, Loader2, Search } from 'lucide-react';
import { FirestoreService } from '@/lib/services/firestore-service';

interface SupervisorManagementProps {
    project: Project;
    canManage: boolean;
    onUpdate: () => void;
}

export default function SupervisorManagement({ project, canManage, onUpdate }: SupervisorManagementProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    // To display enhanced user details for IDs, we would usually fetch profiles. 
    // For now, assuming project.supervisors is just an ID array. 
    // We might need to fetch user details to show names.
    // Let's assume onUpdate re-fetches project which might include expanded details or we just show IDs if no profiles available.
    // Ideally we want to show Names. 
    // A quick hack is to rely on "Assigned Supervisors" list if we had their names.
    // For now, let's keep it simple: Search users to add.

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length > 2) {
            setSearching(true);
            try {
                const results = await FirestoreService.searchUsers(query);
                setSearchResults(results);
            } catch (e) {
                console.error(e);
            } finally {
                setSearching(false);
            }
        }
    };

    const addSupervisor = async (userId: string) => {
        try {
            await EnhancedProjectService.addSupervisor(project.id!, userId);
            setSearchResults([]);
            setSearchQuery('');
            setIsAdding(false);
            onUpdate();
        } catch (error) {
            console.error('Failed to add supervisor', error);
        }
    };

    const removeSupervisor = async (userId: string) => {
        if (!confirm('Remove this supervisor?')) return;
        try {
            await EnhancedProjectService.removeSupervisor(project.id!, userId);
            onUpdate();
        } catch (error) {
            console.error('Failed to remove supervisor', error);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Shield className="text-purple-600" size={24} />
                        Supervisors
                    </h3>
                    <p className="text-sm text-gray-500">Supervisors can create tasks and review work.</p>
                </div>
                {canManage && (
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl font-bold text-sm hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    >
                        {isAdding ? 'Cancel' : 'Add Supervisor'}
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="mb-6 animate-in fade-in slide-in-from-top-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search by username or email..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                    </div>
                    {searchResults.length > 0 && (
                        <div className="mt-2 bg-white dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-xl overflow-hidden z-10">
                            {searchResults.map(user => (
                                <button
                                    key={user.uid}
                                    onClick={() => addSupervisor(user.uid)}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center justify-between group"
                                >
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-white">{user.displayName}</div>
                                        <div className="text-xs text-gray-500">@{user.username}</div>
                                    </div>
                                    <Plus className="text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-3">
                {project.supervisors && project.supervisors.length > 0 ? (
                    project.supervisors.map(userId => (
                        <div key={userId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 font-bold text-xs">
                                    S
                                </div>
                                <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                                    {userId === project.ownerId ? 'Project Owner' : `User ID: ${userId.substring(0, 8)}...`}
                                </span>
                            </div>
                            {canManage && userId !== project.ownerId && (
                                <button
                                    onClick={() => removeSupervisor(userId)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-4 text-sm text-gray-500">No supervisors assigned (except Owner)</div>
                )}
            </div>
        </div>
    );
}
