'use client';

import { useEffect, useState } from 'react';
import { X, Search, UserPlus, Loader2, FileText } from 'lucide-react';
import { createPortal } from 'react-dom';
import { FirestoreService, UserProfile } from '@/lib/services/firestore-service';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';

interface SendProjectInviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    projectTitle: string;
    projectBudget?: number;
    projectDeadline?: string;
}

export default function SendProjectInviteModal({
    isOpen,
    onClose,
    projectId,
    projectTitle,
    projectBudget,
    projectDeadline
}: SendProjectInviteModalProps) {
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();
    const { user, userProfile } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [selectedRole, setSelectedRole] = useState<'supervisor' | 'member'>('member');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [workspaceId, setWorkspaceId] = useState<string | undefined>();

    // Load workspaceId for the project so we can embed it in the contract terms
    useEffect(() => {
        const fetchProjectContext = async () => {
            try {
                const project = await FirestoreService.getProjectById(projectId);
                if (project?.workspaceId) {
                    setWorkspaceId(project.workspaceId);
                }
            } catch (err) {
                console.warn('Unable to fetch project context for contract invite', err);
            }
        };

        if (isOpen && projectId) {
            fetchProjectContext();
        }
    }, [isOpen, projectId]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setSearching(true);
        setError('');
        try {
            const results = await FirestoreService.searchUsers(searchQuery);
            setSearchResults(results);
            if (results.length === 0) {
                setError('No users found');
            }
        } catch (err) {
            console.error('Search error:', err);
            setError('Failed to search users');
        } finally {
            setSearching(false);
        }
    };

    const buildContractVariables = () => {
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);

        let deadlineStr = projectDeadline || todayStr;
        let durationDays = 7;
        try {
            const startMs = Date.parse(todayStr);
            const endMs = Date.parse(projectDeadline || todayStr);
            if (!Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs >= startMs) {
                durationDays = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)));
                deadlineStr = new Date(endMs).toISOString().slice(0, 10);
            }
        } catch (_) {
            // Keep defaults if parsing fails
        }

        const recruiterName = userProfile?.displayName || userProfile?.username || 'Recruiter';
        const recipientName = selectedUser?.displayName || selectedUser?.username || 'Recipient';

        return {
            projectId,
            workspaceId: workspaceId || undefined,
            contractDate: todayStr,
            clientName: recruiterName,
            contractorName: recipientName,
            projectTitle: projectTitle || 'Project',
            projectDescription: `Project invitation for ${projectTitle || 'project'} as ${selectedRole}`,
            deliverables: 'Deliverables to be detailed with the assignee.',
            startDate: todayStr,
            endDate: deadlineStr,
            duration: durationDays,
            durationUnit: 'days',
            paymentAmount: projectBudget || 0,
            paymentCurrency: 'GMD',
            paymentType: 'fixed',
            paymentMilestones: 'Milestones will be outlined in the project plan.',
            reviewPeriod: 3,
            revisionRounds: 2,
            noticePeriod: 7,
            terminationConditions: 'Either party may terminate with notice via Connekt.',
        } as Record<string, any>;
    };

    const openMailWithContract = async (options: { autoStartAI: boolean }) => {
        if (!selectedUser || !user || !userProfile) return;

        setSending(true);
        setError('');
        try {
            const recruiterName = userProfile.displayName || userProfile.username || 'Recruiter';
            const recipientName = selectedUser.displayName || selectedUser.username || 'Recipient';
            const fromAddress = `${userProfile.username}@connekt.com`;
            const toAddress = `${selectedUser.username}@connekt.com`;

            const subject = `Project Invitation: ${projectTitle}`;
            const briefLines = [
                `Project: ${projectTitle || ''}`,
                `Role: ${selectedRole}`,
                projectBudget ? `Budget: ${projectBudget}` : '',
                projectDeadline ? `Deadline: ${projectDeadline}` : '',
                `Recruiter: ${recruiterName} (${fromAddress})`,
                `Recipient: ${recipientName} (${toAddress})`
            ].filter(Boolean);

            const body = `Hi ${recipientName},\n\nYou've been invited to join "${projectTitle}" as a ${selectedRole}. Please review the attached contract.\n\nThank you,\n${recruiterName}`;

            const variables = buildContractVariables();

            const params = new URLSearchParams({
                compose: '1',
                to: toAddress,
                subject,
                body,
                templateId: 'Project-Based Job Contract',
                contractType: 'project_assignment',
                brief: briefLines.join('\n'),
                autoStart: options.autoStartAI ? '1' : '0',
                variables: JSON.stringify(variables)
            });

            const url = `/mail?${params.toString()}`;
            window.open(url, '_blank', 'noopener,noreferrer');

            // Reset and close
            setSearchQuery('');
            setSearchResults([]);
            setSelectedUser(null);
            setSelectedRole('member');
            onClose();
        } catch (err: any) {
            console.error('Send contract error:', err);
            setError(err.message || 'Failed to send contract invitation');
        } finally {
            setSending(false);
        }
    };

    const handleClose = () => {
        setSearchQuery('');
        setSearchResults([]);
        setSelectedUser(null);
        setSelectedRole('member');
        setError('');
        onClose();
    };

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-[12000] p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText size={24} className="text-[#008080]" />
                            Send Project Invitation
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Send contract invitation for {projectTitle}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Info Alert */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Contract Invitation:</strong> The selected user will receive a formal contract via ConnektMail. They must review and accept the contract before being added to the project.
                        </p>
                    </div>

                    {/* Search Section */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                            Search Users
                        </label>
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Search by username or email..."
                                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={searching || !searchQuery.trim()}
                                className="px-6 py-3 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {searching ? <Loader2 className="animate-spin" size={20} /> : 'Search'}
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Search Results */}
                    {searchResults.length > 0 && !selectedUser && (
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-900 dark:text-white">
                                Select User
                            </label>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {searchResults.map((user) => (
                                    <button
                                        key={user.uid}
                                        onClick={() => setSelectedUser(user)}
                                        className="w-full flex items-center gap-3 p-4 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl hover:border-[#008080] transition-colors text-left"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white font-bold">
                                            {user.username?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 dark:text-white">@{user.username}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Selected User & Role Selection */}
                    {selectedUser && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                                    Contract Recipient
                                </label>
                                <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white font-bold">
                                        {selectedUser.username?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 dark:text-white">@{selectedUser.username}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{selectedUser.email}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedUser(null)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                                    Project Role
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setSelectedRole('member')}
                                        className={`p-4 rounded-xl border-2 transition-all ${selectedRole === 'member'
                                                ? 'border-[#008080] bg-teal-50 dark:bg-teal-900/20'
                                                : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300'
                                            }`}
                                    >
                                        <p className="font-bold text-gray-900 dark:text-white">Member</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Can work on tasks</p>
                                    </button>
                                    <button
                                        onClick={() => setSelectedRole('supervisor')}
                                        className={`p-4 rounded-xl border-2 transition-all ${selectedRole === 'supervisor'
                                                ? 'border-[#008080] bg-teal-50 dark:bg-teal-900/20'
                                                : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300'
                                            }`}
                                    >
                                        <p className="font-bold text-gray-900 dark:text-white">Supervisor</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Can manage tasks</p>
                                    </button>
                                </div>
                            </div>

                            {/* Contract Preview */}
                            <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-700">
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">CONTRACT PREVIEW</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    <strong>Project:</strong> {projectTitle}
                                    <br />
                                    <strong>Role:</strong> {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                                    {projectBudget && (
                                        <>
                                            <br />
                                            <strong>Budget:</strong> GMD {projectBudget}
                                        </>
                                    )}
                                    {projectDeadline && (
                                        <>
                                            <br />
                                            <strong>Deadline:</strong> {projectDeadline}
                                        </>
                                    )}
                                    <br />
                                    <strong>Expires:</strong> 7 days
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-zinc-800 flex flex-col gap-3">
                    <button
                        onClick={() => openMailWithContract({ autoStartAI: false })}
                        disabled={!selectedUser || sending}
                        className="w-full px-6 py-3 bg-gradient-to-r from-[#008080] to-teal-600 hover:from-teal-600 hover:to-[#008080] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sending ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Sending...
                            </>
                        ) : (
                            <>
                                <FileText size={20} />
                                Send Contract
                            </>
                        )}
                    </button>

                    <button
                        onClick={() => openMailWithContract({ autoStartAI: true })}
                        disabled={!selectedUser || sending}
                        className="inline-flex items-center gap-2 self-center px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Drafting...
                            </>
                        ) : (
                            <>
                                <span>Draft contract with</span>
                                <ConnektAIIcon className="w-4 h-4" />
                            </>
                        )}
                    </button>

                    <div className="flex justify-end">
                        <button
                            onClick={handleClose}
                            className="px-6 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
