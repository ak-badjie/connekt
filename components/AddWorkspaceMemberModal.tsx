'use client';

import { useEffect, useState } from 'react';
import { X, Search, Loader2, UserPlus, FileText } from 'lucide-react';
import { createPortal } from 'react-dom';
import { FirestoreService, UserProfile } from '@/lib/services/firestore-service';
import { useAuth } from '@/context/AuthContext';
import { JobTemplateService } from '@/lib/services/job-template-service';
import { JobTemplate } from '@/lib/types/workspace.types';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';

interface AddWorkspaceMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
    workspaceName?: string; // Helpful for email context
    onMemberAdded?: () => void;
}

export default function AddWorkspaceMemberModal({
    isOpen,
    onClose,
    workspaceId,
    workspaceName = 'Workspace',
    onMemberAdded
}: AddWorkspaceMemberModalProps) {
    const [isMounted, setIsMounted] = useState(false);
    const { user, userProfile } = useAuth();

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

    // Template State
    const [templates, setTemplates] = useState<JobTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Roles & Basic Info
    const [employmentType, setEmploymentType] = useState<'employee' | 'freelancer'>('employee');
    const [jobTitle, setJobTitle] = useState('');

    // Advanced Contract Fields (Salary, Schedule, Conditions)
    const [salary, setSalary] = useState<number>(0);
    const [currency, setCurrency] = useState('GMD');
    const [paymentSchedule, setPaymentSchedule] = useState<'monthly' | 'weekly'>('monthly');

    // Schedule
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
    const [breakDuration, setBreakDuration] = useState(60); // minutes

    // Penalties
    const [penaltyPerLateTask, setPenaltyPerLateTask] = useState<number>(0);
    const [penaltyUnit, setPenaltyUnit] = useState<'fixed' | 'percentage'>('fixed');

    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setIsMounted(true);
        if (isOpen && workspaceId) {
            loadTemplates();
        }
    }, [isOpen, workspaceId]);

    const loadTemplates = async () => {
        try {
            const temps = await JobTemplateService.getTemplates(workspaceId);
            setTemplates(temps);
        } catch (err) {
            console.error('Failed to load templates', err);
        }
    };

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplateId(templateId);
        const template = templates.find(t => t.id === templateId);
        if (template) {
            if (template.type === 'job') {
                setEmploymentType('employee');
            } else {
                setEmploymentType('freelancer');
            }
            setJobTitle(template.title);
            setSalary(template.salary);
            setCurrency(template.currency);
            setPaymentSchedule(template.paymentSchedule as any);
            setStartTime(template.schedule.startTime);
            setEndTime(template.schedule.endTime);
            setWorkDays(template.schedule.workDays);
            setBreakDuration(template.schedule.breakDurationMinutes);
            setPenaltyPerLateTask(template.conditions.penaltyPerLateTask);
            setPenaltyUnit(template.conditions.penaltyUnit);
            setShowAdvanced(true);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setSearching(true);
        setError('');
        try {
            const results = await FirestoreService.searchUsers(searchQuery);
            // Filter out self
            setSearchResults(results.filter(u => u.uid !== user?.uid));
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

        const recruiterName = userProfile?.displayName || userProfile?.username || 'Recruiter';
        const recipientName = selectedUser?.displayName || selectedUser?.username || 'Recipient';

        // Calculate Hours Per Week
        const startHour = parseInt(startTime.split(':')[0]);
        const endHour = parseInt(endTime.split(':')[0]);
        const dailyHours = Math.max(0, (endHour - startHour) - (breakDuration / 60));
        const hoursPerWeek = dailyHours * workDays.length;

        // Calculate End Date
        const endDateObj = new Date();
        endDateObj.setDate(endDateObj.getDate() + 30); // Default 30 days
        const endDateStr = endDateObj.toISOString().slice(0, 10);

        const commonVariables = {
            workspaceId,
            contractDate: todayStr,
            startDate: todayStr,
            endDate: endDateStr,
            duration: 30,
            durationUnit: 'days',
            paymentAmount: salary,
            paymentCurrency: currency,
            paymentSchedule: paymentSchedule,
            noticePeriod: 30,
            terminationConditions: penaltyPerLateTask > 0
                ? `${penaltyPerLateTask} ${penaltyUnit === 'percentage' ? '%' : currency} deduction per late task`
                : 'None',
        };

        if (employmentType === 'employee') {
            return {
                ...commonVariables,
                memberType: 'employee',
                employerName: workspaceName,
                employeeName: recipientName,
                jobTitle: jobTitle,
                jobDescription: `Full-time employment as ${jobTitle} at ${workspaceName}`,
                jobRequirements: 'As defined by the role description and standard operating procedures.',
                workLocation: 'Remote / As assigned',
                hoursPerWeek: hoursPerWeek,
                benefits: 'Standard workspace benefits apply.',
                role: 'member'
            };
        } else {
            return {
                ...commonVariables,
                memberType: 'freelancer',
                clientName: workspaceName, // Use workspace name as client for freelancer
                contractorName: recipientName,
                projectTitle: `Freelance Engagement: ${workspaceName}`,
                projectDescription: `Freelance services for ${workspaceName}`,
                deliverables: 'As defined by assigned projects and tasks.',
                paymentType: paymentSchedule,
                paymentMilestones: 'N/A',
                reviewPeriod: 7,
                revisionRounds: 2,
                role: 'member'
            };
        }
    };

    const openMailWithContract = async (options: { autoStartAI: boolean }) => {
        if (!selectedUser || !user || !userProfile) return;
        if (employmentType === 'employee' && !jobTitle.trim()) {
            setError('Job Title is required for employees');
            return;
        }

        setSending(true);
        setError('');
        try {
            const recruiterName = userProfile.displayName || userProfile.username || 'Recruiter';
            const recipientName = selectedUser.displayName || selectedUser.username || 'Recipient';
            const fromAddress = `${userProfile.username}@connekt.com`;
            const toAddress = `${selectedUser.username}@connekt.com`;

            const subject = `Workspace Invitation: ${workspaceName}`;
            const briefLines = [
                `Workspace: ${workspaceName}`,
                `Type: ${employmentType === 'employee' ? 'Employee' : 'Freelancer'}`,
                employmentType === 'employee' ? `Role: ${jobTitle}` : '',
                `Recruiter: ${recruiterName} (${fromAddress})`,
                `Recipient: ${recipientName} (${toAddress})`
            ].filter(Boolean);

            const body = `Hi ${recipientName},\n\nYou've been invited to join the workspace "${workspaceName}" as a ${employmentType}.${employmentType === 'employee' ? `\nPosition: ${jobTitle}` : ''}\n\nPlease review the attached contract.\n\nThank you,\n${recruiterName}`;

            const variables = buildContractVariables();

            const params = new URLSearchParams({
                compose: '1',
                to: toAddress,
                subject,
                body,
                templateId: employmentType === 'employee' ? 'Employment Contract' : 'Freelance Contract',
                contractType: employmentType === 'employee' ? 'job' : 'project',
                brief: briefLines.join('\n'),
                autoStart: options.autoStartAI ? '1' : '0',
                variables: JSON.stringify(variables),
                autoSelectWorkspaceId: workspaceId
            });

            const url = `/mail?${params.toString()}`;
            window.open(url, '_blank', 'noopener,noreferrer');

            // Reset and close
            handleClose();
            onMemberAdded?.(); // Optional: Trigger refresh even though they aren't added yet
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
        setEmploymentType('employee');
        setJobTitle('');
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
                            Add Workspace Member
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Invite a new member to {workspaceName}
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
                            <strong>Contract Required:</strong> New members must accept a contract before joining the workspace. You can draft this contract manually or use AI.
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

                    {/* Selected User & Configuration */}
                    {selectedUser && (
                        <div className="space-y-6">
                            {/* User Badge */}
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

                            {/* Employment Type */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                                    Employment Type
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setEmploymentType('employee')}
                                        className={`p-4 rounded-xl border-2 transition-all ${employmentType === 'employee'
                                            ? 'border-[#008080] bg-teal-50 dark:bg-teal-900/20'
                                            : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300'
                                            }`}
                                    >
                                        <p className="font-bold text-gray-900 dark:text-white">Employee</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Long-term role with title</p>
                                    </button>
                                    <button
                                        onClick={() => setEmploymentType('freelancer')}
                                        className={`p-4 rounded-xl border-2 transition-all ${employmentType === 'freelancer'
                                            ? 'border-[#008080] bg-teal-50 dark:bg-teal-900/20'
                                            : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300'
                                            }`}
                                    >
                                        <p className="font-bold text-gray-900 dark:text-white">Freelancer</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">External / Temporary</p>
                                    </button>
                                </div>
                            </div>

                            {/* Job Title (Employee) */}
                            {employmentType === 'employee' && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                                        Job Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={jobTitle}
                                        onChange={(e) => setJobTitle(e.target.value)}
                                        placeholder="e.g. Senior Product Designer"
                                        className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
                                    />
                                </div>
                            )}

                            {/* Job Templates Dropdown */}
                            {templates.length > 0 && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                                        Apply Job Template (Optional)
                                    </label>
                                    <select
                                        value={selectedTemplateId}
                                        onChange={(e) => handleTemplateSelect(e.target.value)}
                                        className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
                                    >
                                        <option value="">-- Select a Template --</option>
                                        {templates.map(t => (
                                            <option key={t.id} value={t.id}>{t.title} ({t.type})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Advanced Contract Details Toggle */}
                            <div className="pt-2">
                                <button
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="text-sm font-bold text-[#008080] hover:underline flex items-center gap-1"
                                >
                                    {showAdvanced ? 'Hide Contract Details' : 'Show Advanced Contract Details'}
                                </button>
                            </div>

                            {/* Advanced Fields */}
                            {showAdvanced && (
                                <div className="space-y-4 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-200 dark:border-zinc-700">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Items</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                                <input
                                                    type="number"
                                                    value={salary}
                                                    onChange={e => setSalary(parseFloat(e.target.value) || 0)}
                                                    className="w-full pl-6 pr-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Schedule</label>
                                            <select
                                                value={paymentSchedule}
                                                onChange={e => setPaymentSchedule(e.target.value as any)}
                                                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm"
                                            >
                                                <option value="monthly">Monthly</option>
                                                <option value="weekly">Weekly</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Start Time</label>
                                            <input
                                                type="time"
                                                value={startTime}
                                                onChange={e => setStartTime(e.target.value)}
                                                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">End Time</label>
                                            <input
                                                type="time"
                                                value={endTime}
                                                onChange={e => setEndTime(e.target.value)}
                                                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                                            Late Task Penalty (per task)
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={penaltyPerLateTask}
                                                onChange={e => setPenaltyPerLateTask(parseFloat(e.target.value) || 0)}
                                                className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm"
                                            />
                                            <select
                                                value={penaltyUnit}
                                                onChange={e => setPenaltyUnit(e.target.value as any)}
                                                className="w-24 px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm"
                                            >
                                                <option value="fixed">{currency}</option>
                                                <option value="percentage">%</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-zinc-800 flex flex-col gap-3">
                    <button
                        onClick={() => openMailWithContract({ autoStartAI: false })}
                        disabled={!selectedUser || sending || (employmentType === 'employee' && !jobTitle.trim())}
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
                        disabled={!selectedUser || sending || (employmentType === 'employee' && !jobTitle.trim())}
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

                    <div className="flex justify-end mt-2">
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
