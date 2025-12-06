'use client';

import { useEffect, useState } from 'react';
import { X, Search, UserPlus, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { FirestoreService, UserProfile } from '@/lib/services/firestore-service';
import { TaskService } from '@/lib/services/task-service';
import { useAuth } from '@/context/AuthContext';
import { Project, JobTemplate } from '@/lib/types/workspace.types';
import { WorkspaceService } from '@/lib/services/workspace-service';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { JobTemplateService } from '@/lib/services/job-template-service';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';

interface AssignTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskId: string;
    taskTitle: string;
    projectId: string;
    project: Project | null;
    budget: number;
    currency: string;
    deadline?: string;
    onAssignSuccess: () => void;
}

export default function AssignTaskModal({
    isOpen,
    onClose,
    taskId,
    taskTitle,
    projectId,
    project,
    budget,
    currency,
    deadline,
    onAssignSuccess
}: AssignTaskModalProps) {
    const [isMounted, setIsMounted] = useState(false);
    const { user, userProfile } = useAuth();

    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [isProjectMember, setIsProjectMember] = useState(false);

    const [isWorkspaceEmployee, setIsWorkspaceEmployee] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [sendingContract, setSendingContract] = useState(false);
    const [error, setError] = useState('');

    // Templates
    const [templates, setTemplates] = useState<JobTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [selectedTemplate, setSelectedTemplate] = useState<JobTemplate | null>(null);

    useEffect(() => {
        setIsMounted(true);
        if (project?.workspaceId) {
            loadTemplates(project.workspaceId);
        }
    }, [project?.workspaceId]);

    const loadTemplates = async (wsId: string) => {
        try {
            const allTemplates = await JobTemplateService.getTemplates(wsId);
            // Filter only 'task' templates for this modal
            setTemplates(allTemplates.filter(t => t.type === 'task'));
        } catch (e) {
            console.error('Error loading templates', e);
        }
    };

    const handleTemplateSelect = (tId: string) => {
        setSelectedTemplateId(tId);
        setSelectedTemplate(templates.find(t => t.id === tId) || null);
    };

    // Check if selected user is a project member or workspace employee
    useEffect(() => {
        const checkStatus = async () => {
            if (selectedUser && project) {
                // 1. Check Project Membership
                const member = project.members.find(m => m.userId === selectedUser.uid);
                setIsProjectMember(!!member);

                // 2. Check Workspace Employee Status (if not already project member)
                if (!member && project.workspaceId) {
                    const role = await WorkspaceService.getUserRole(project.workspaceId, selectedUser.uid);
                    // We need to fetch the full member to check 'type', assuming getUserRole only checks role field
                    // Let's fetch the workspace member details directly
                    const workspace = await WorkspaceService.getWorkspace(project.workspaceId);
                    const wsMember = workspace?.members.find(m => m.userId === selectedUser.uid);
                    // Default to 'employee' if type is undefined for backward compatibility with existing members
                    const isEmployee = wsMember && (wsMember.type === 'employee' || !wsMember.type);
                    setIsWorkspaceEmployee(!!isEmployee);
                } else {
                    setIsWorkspaceEmployee(false);
                }
            } else {
                setIsProjectMember(false);
                setIsWorkspaceEmployee(false);
            }
        };
        checkStatus();
    }, [selectedUser, project]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setSearching(true);
        setError('');
        try {
            const results = await FirestoreService.searchUsers(searchQuery);
            // Filter out current user from results (can't assign to self via search usually, but optional)
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

    const handleDirectAssign = async () => {
        if (!selectedUser) return;

        setAssigning(true);
        setError('');
        try {
            // If user is a Workspace Employee but not in project, add them first
            if (isWorkspaceEmployee && !isProjectMember && project) {
                await EnhancedProjectService.addMember(
                    project.id!,
                    {
                        userId: selectedUser.uid,
                        username: selectedUser.username || selectedUser.displayName || 'Unknown',
                        email: selectedUser.email || '',
                        role: 'member',
                        type: 'employee'
                    }
                );
            }

            await TaskService.reassignTask(
                taskId,
                selectedUser.uid,
                selectedUser.username || selectedUser.displayName || 'Unknown'
            );
            onAssignSuccess();
            onClose();
        } catch (err: any) {
            console.error('Assignment error:', err);
            setError(err.message || 'Failed to assign task');
        } finally {
            setAssigning(false);
        }
    };

    const openMailWithContract = async (options: { autoStartAI: boolean }) => {
        if (!selectedUser || !user || !userProfile) return;

        setSendingContract(true);
        setError('');
        try {
            const recruiterName = userProfile.displayName || userProfile.username || 'Recruiter';
            const recipientName = selectedUser.displayName || selectedUser.username || 'Recipient';
            const toAddress = `${selectedUser.username}@connekt.com`;
            const fromAddress = `${userProfile.username}@connekt.com`;

            const subject = `Task Assignment: ${taskTitle}`;
            const briefLines = [
                `Task: ${taskTitle}`,
                `Project: ${project?.title || ''}`,
                `Payment: ${budget} ${currency}`,
                deadline ? `Deadline: ${deadline}` : '',
                `Assigner: ${recruiterName} (${fromAddress})`,
                `Assignee: ${recipientName} (${toAddress})`
            ].filter(Boolean);

            const body = `Hi ${recipientName},\n\nI'd like to assign you the task "${taskTitle}" in project "${project?.title}".\n\nPlease review the attached contract details.\n\nThanks,\n${recruiterName}`;

            // Build variables for the contract template
            const variables = {
                taskId,
                projectId,
                workspaceId: project?.workspaceId,
                clientName: recruiterName,
                contractorName: recipientName,
                // Map to Freelance Contract variables
                projectTitle: taskTitle, // Mapping Task Title to Project Title
                projectDescription: `Complete task: ${taskTitle}`,
                deliverables: `Completion of task: ${taskTitle}`,
                paymentAmount: budget,
                paymentCurrency: currency,
                startDate: new Date().toISOString().slice(0, 10),
                endDate: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // Default 7 days
                duration: deadline ? '1' : '7', // Rough estimate
                durationUnit: 'days',
                paymentType: 'Fixed Price',
                reviewPeriod: '3',
                revisionRounds: '1',
                noticePeriod: '1',

                // Keep original for back-compat or detailed views if needed
                taskTitle,
                taskDescription: `Complete task: ${taskTitle}`,

                paymentTerms: selectedTemplate?.paymentSchedule === 'on-completion'
                    ? 'Payment upon task completion and approval.'
                    : 'As defined by workspace agreement.',
                // Template Injections
                condition_penaltyPerLateTask: selectedTemplate?.conditions.penaltyPerLateTask
                    ? `${selectedTemplate.conditions.penaltyPerLateTask} ${selectedTemplate.conditions.penaltyUnit} per late task`
                    : 'None'
            };

            const params = new URLSearchParams({
                compose: '1',
                to: toAddress,
                subject,
                body,
                templateId: 'Freelance Contract', // Updated to match new system template
                contractType: 'project', // Updated to 'project' (Freelance)
                brief: briefLines.join('\n'),
                autoStart: options.autoStartAI ? '1' : '0',
                variables: JSON.stringify(variables),
                autoSelectTaskId: taskId // Auto-select this task in the composer
            });

            const url = `/mail?${params.toString()}`;
            window.open(url, '_blank', 'noopener,noreferrer');
            onClose();
        } catch (err: any) {
            console.error('Contract error:', err);
            setError(err.message || 'Failed to prepare contract');
        } finally {
            setSendingContract(false);
        }
    };

    const handleClose = () => {
        setSearchQuery('');
        setSearchResults([]);
        setSelectedUser(null);
        setError('');
        onClose();
    };

    if (!isMounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-[12000] p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <UserPlus size={24} className="text-[#008080]" />
                            Assign Task
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Assign "{taskTitle}" to a user
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
                                {searchResults.map((resultUser) => {
                                    const isMember = project?.members.some(m => m.userId === resultUser.uid);
                                    return (
                                        <button
                                            key={resultUser.uid}
                                            onClick={() => setSelectedUser(resultUser)}
                                            className="w-full flex items-center gap-3 p-4 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl hover:border-[#008080] transition-colors text-left"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white font-bold">
                                                {resultUser.username?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-gray-900 dark:text-white">@{resultUser.username}</p>
                                                    {isMember && (
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded text-xs font-bold">
                                                            Member
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{resultUser.email}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Selected User Actions */}
                    {selectedUser && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {/* User User Card */}
                            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl">
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

                            {/* Action Options */}
                            <div className="grid gap-4">
                                {/* Option 1: Direct Assign (For Members & Employees) */}
                                <div className={`p-4 rounded-xl border-2 transition-all ${isProjectMember || isWorkspaceEmployee
                                    ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900'
                                    : 'bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700 opacity-60'}`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2 rounded-lg ${isProjectMember || isWorkspaceEmployee ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 dark:text-white">Direct Assignment</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {isProjectMember
                                                    ? "Assign this task immediately. The user is a project member."
                                                    : isWorkspaceEmployee
                                                        ? "Assign immediately. User is a Workspace Employee and will be added to the project."
                                                        : "This user is NOT a member/employee. You must send a contract invite."}
                                            </p>

                                            {(isProjectMember || isWorkspaceEmployee) && (
                                                <button
                                                    onClick={handleDirectAssign}
                                                    disabled={assigning}
                                                    className="mt-3 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                                                >
                                                    {assigning ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />}
                                                    Assign Now
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Option 2: Contract Assignment (Always available, but primarily for non-members) */}
                                <div className={`p-4 rounded-xl border-2 transition-all ${!isProjectMember && !isWorkspaceEmployee
                                    ? 'bg-teal-50 dark:bg-teal-900/10 border-[#008080]'
                                    : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700'}`}>
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400">
                                            <FileText size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 dark:text-white">Send Contract Offer</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                Send a formal task contract. The user will be assigned once they sign the contract.
                                            </p>

                                            {/* Template Select */}
                                            {templates.length > 0 && (
                                                <div className="mt-3">
                                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                                                        Apply Task Template (Optional)
                                                    </label>
                                                    <select
                                                        value={selectedTemplateId}
                                                        onChange={(e) => handleTemplateSelect(e.target.value)}
                                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm"
                                                    >
                                                        <option value="">-- No Template --</option>
                                                        {templates.map(t => (
                                                            <option key={t.id} value={t.id}>{t.title}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            <div className="flex flex-wrap gap-2 mt-3">
                                                <button
                                                    onClick={() => openMailWithContract({ autoStartAI: false })}
                                                    disabled={sendingContract}
                                                    className="px-5 py-2.5 bg-[#008080] hover:bg-teal-600 text-white rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                                                >
                                                    {sendingContract ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
                                                    Send Contract
                                                </button>
                                                <button
                                                    onClick={() => openMailWithContract({ autoStartAI: true })}
                                                    disabled={sendingContract}
                                                    className="px-4 py-2.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                                                >
                                                    <ConnektAIIcon className="w-4 h-4" />
                                                    Draft with AI
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
