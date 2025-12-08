'use client';

import { useState } from 'react';
import { Workspace, WorkspaceMember } from '@/lib/types/workspace.types';
import { WorkspaceService } from '@/lib/services/workspace-service';
import { MoreVertical, UserPlus, Shield, User, Trash2, Loader2, X } from 'lucide-react';
import AddWorkspaceMemberModal from '@/components/AddWorkspaceMemberModal';

interface MemberManagementProps {
    workspace: Workspace;
    currentUserRole: 'owner' | 'admin' | 'member' | null;
    onUpdate: () => void;
}

export default function MemberManagement({ workspace, currentUserRole, onUpdate }: MemberManagementProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [actionMemberId, setActionMemberId] = useState<string | null>(null); // For loading states per row

    const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';

    const handleRoleChange = async (userId: string, newRole: 'admin' | 'member') => {
        setActionMemberId(userId);
        try {
            await WorkspaceService.updateMember(workspace.id!, userId, { role: newRole });
            onUpdate();
        } catch (error) {
            console.error('Failed to update role', error);
        } finally {
            setActionMemberId(null);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        setActionMemberId(userId);
        try {
            await WorkspaceService.removeMember(workspace.id!, userId);
            onUpdate();
        } catch (error) {
            console.error('Failed to remove member', error);
        } finally {
            setActionMemberId(null);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Team Members</h3>
                    <p className="text-sm text-gray-500 mt-1">Manage access and roles for your workspace</p>
                </div>
                {canManage && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-2 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-colors"
                    >
                        <UserPlus size={16} /> Invite Member
                    </button>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-zinc-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-bold">
                        <tr>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {workspace.members.map((member) => (
                            <tr key={member.userId} className="hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                                            {member.username[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white">@{member.username}</div>
                                            <div className="text-xs text-gray-500">{member.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {member.role === 'owner' ? (
                                            <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 text-xs font-bold flex items-center gap-1 w-fit">
                                                <Shield size={12} fill="currentColor" /> Owner
                                            </span>
                                        ) : canManage ? (
                                            <select
                                                value={member.role}
                                                onChange={(e) => handleRoleChange(member.userId, e.target.value as 'admin' | 'member')}
                                                disabled={actionMemberId === member.userId}
                                                className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 border border-transparent focus:border-[#008080] text-sm font-medium outline-none cursor-pointer"
                                            >
                                                <option value="admin">Admin</option>
                                                <option value="member">Member</option>
                                            </select>
                                        ) : (
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold w-fit ${member.role === 'admin' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-gray-100 text-gray-600 dark:bg-zinc-800'
                                                }`}>
                                                {member.role === 'admin' ? 'Admin' : 'Member'}
                                            </span>
                                        )}
                                        {actionMemberId === member.userId && <Loader2 size={14} className="animate-spin text-gray-400" />}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                                        {member.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {canManage && member.role !== 'owner' && (
                                        <button
                                            onClick={() => handleRemoveMember(member.userId)}
                                            disabled={actionMemberId === member.userId}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Remove Member"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AddWorkspaceMemberModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                workspaceId={workspace.id!}
                workspaceName={workspace.name}
                onMemberAdded={onUpdate}
            />
        </div>
    );
}
