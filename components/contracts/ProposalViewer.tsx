'use client';

import { useState, useEffect } from 'react';
import { X, FileText, Download, MessageSquarePlus, XCircle, CheckCircle, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/context/AuthContext';
import GambianLegalHeader from '@/components/mail/GambianLegalHeader';
import { ProposalResponseService } from '@/lib/services/proposal-response-service';
import { ExploreService } from '@/lib/services/explore-service';
import toast from 'react-hot-toast';
import { CONTRACT_TYPES, TEMPLATE_IDS } from '@/lib/constants/contracts';
import { JobTemplate } from '@/lib/types/workspace.types';

interface ProposalViewerProps {
    proposalId?: string;
    proposal: {
        title: string;
        description: string;
        terms: any;
        status: string;
        fromUserId: string;
        fromUsername: string;
        toUserId: string;
        toUsername: string;
        createdAt?: any;
    };
    isOpen: boolean;
    onClose: () => void;
    onReplyWithContract?: any;
}

export function ProposalViewer({
    proposalId,
    proposal,
    isOpen,
    onClose
}: ProposalViewerProps) {
    const { user, userProfile } = useAuth();
    const [rejecting, setRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [jobData, setJobData] = useState<JobTemplate | null>(null);

    const isRecipient = user?.uid === proposal.toUserId;
    const isOwner = user?.uid === proposal.fromUserId;

    // Fetch job data if proposal has jobId reference
    useEffect(() => {
        const fetchJobData = async () => {
            const jobId = proposal.terms?.jobId || proposal.terms?.linkedJobId;
            if (jobId && isOpen) {
                try {
                    const job = await ExploreService.getJobById(jobId);
                    if (job) {
                        setJobData(job);
                        console.log('Fetched job data by ID:', job);
                    }
                } catch (err) {
                    console.error('Failed to fetch job data:', err);
                }
            }
        };
        fetchJobData();
    }, [proposal.terms?.jobId, proposal.terms?.linkedJobId, isOpen]);

    // --- HELPER: Strip Markdown for Form Fields ---
    const cleanMarkdown = (text: string) => {
        if (!text) return '';
        return text
            .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
            .replace(/__(.*?)__/g, '$1') // Italics
            .replace(/#+\s/g, '') // Headers
            .replace(/`{3}[\s\S]*?`{3}/g, '[Code Block]') // Code blocks
            .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links (keep text only)
            .replace(/\n{3,}/g, '\n\n') // Reduce massive spacing
            .trim();
    };

    // --- HELPER: Format work days array to readable text ---
    const formatWorkDays = (days: number[] | undefined): string => {
        if (!days || days.length === 0) return 'Mon, Tue, Wed, Thu, Fri';
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days.map(d => dayNames[d]).join(', ');
    };

    // --- HELPER: Format penalty for display ---
    const formatPenalty = (amount: number | undefined, unit: string | undefined, currency: string | undefined): string => {
        if (!amount || amount === 0) return 'None';
        if (unit === 'percentage') return `${amount}% of payment per late task`;
        return `${amount} ${currency || 'GMD'} per late task`;
    };

    // --- HELPER: Calculate hours per week ---
    const calculateHoursPerWeek = (startTime: string | undefined, endTime: string | undefined, workDays: number[] | undefined): number => {
        if (!startTime || !endTime || !workDays) return 40;
        try {
            const start = parseInt(startTime.split(':')[0]);
            const end = parseInt(endTime.split(':')[0]);
            const hoursPerDay = end - start;
            return hoursPerDay * workDays.length;
        } catch {
            return 40;
        }
    };


    // --- MAIN LOGIC ---
    const handleReplyWithContract = () => {
        const terms = proposal.terms || {};

        // PRIORITY: Use fetched job data from Firestore, fallback to URL params
        const job = jobData;

        // 1. ROBUST ID EXTRACTION (job data has priority)
        const workspaceId = job?.workspaceId || terms.workspaceId || terms.linkedWorkspaceId || terms.proposalContext?.workspaceId;
        const projectId = terms.projectId || terms.linkedProjectId || terms.proposalContext?.projectId;
        const taskId = terms.taskId || terms.linkedTaskId || terms.proposalContext?.taskId;
        const jobId = job?.id || terms.jobId || terms.linkedJobId;

        // 2. Determine Template & Type
        let templateId: string = TEMPLATE_IDS.FREELANCE_CONTRACT;
        let contractType: string = CONTRACT_TYPES.PROJECT;

        const isEmployment = jobId || terms.employmentType === 'employee' || proposal.title.toLowerCase().includes('job') || terms.contractType === CONTRACT_TYPES.JOB;

        if (isEmployment) {
            templateId = TEMPLATE_IDS.EMPLOYMENT_CONTRACT;
            contractType = CONTRACT_TYPES.JOB;
        } else if (taskId) {
            templateId = TEMPLATE_IDS.FREELANCE_CONTRACT;
            contractType = CONTRACT_TYPES.TASK;
        }

        // 3. Prepare Names (use job owner info if available)
        const recruiterName = userProfile?.displayName || userProfile?.username || 'Recruiter';
        const recipientName = terms.applicantName || terms.contractorName || proposal.fromUsername || 'Recipient';
        const toAddress = `${proposal.fromUsername}@connekt.com`;

        // 4. Date calculations (like AddMemberModal)
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        let deadlineStr = terms.endDate || terms.taskDeadline || todayStr;
        let durationDays = 7;
        try {
            const startMs = Date.parse(todayStr);
            const endMs = Date.parse(deadlineStr);
            if (!Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs >= startMs) {
                durationDays = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)));
                deadlineStr = new Date(endMs).toISOString().slice(0, 10);
            }
        } catch (_) { }

        // 5. Clean Description
        const cleanedDescription = cleanMarkdown(proposal.description);

        // 6. Build Variables - PRIORITY: Fetched job data > URL params > defaults
        // First, extract the raw schedule/conditions data
        const scheduleData = job?.schedule || terms.schedule || {};
        const conditionsData = job?.conditions || terms.conditions || {};
        const rawWorkDays = job?.schedule?.workDays || terms.workDays || terms.schedule?.workDays || [1, 2, 3, 4, 5];
        const rawStartTime = job?.schedule?.startTime || terms.workStartTime || terms.schedule?.startTime || '09:00';
        const rawEndTime = job?.schedule?.endTime || terms.workEndTime || terms.schedule?.endTime || '17:00';
        const rawBreakDuration = job?.schedule?.breakDurationMinutes || terms.schedule?.breakDurationMinutes || 60;
        const rawPenalty = job?.conditions?.penaltyPerLateTask || terms.penaltyPerLateTask || terms.conditions?.penaltyPerLateTask || 0;
        const rawPenaltyUnit = job?.conditions?.penaltyUnit || terms.penaltyUnit || terms.conditions?.penaltyUnit || 'fixed';
        const rawCurrency = job?.currency || terms.currency || terms.paymentCurrency || 'GMD';

        const variables = {
            // ===== CRITICAL IDs =====
            proposalId: proposalId,
            jobId: jobId,
            projectId: isEmployment ? undefined : projectId,
            workspaceId: workspaceId,
            taskId: taskId,
            // Duplicate with linked prefix for backward compatibility
            linkedJobId: jobId,
            linkedProjectId: projectId,
            linkedWorkspaceId: workspaceId,
            linkedTaskId: taskId,

            // ===== Contract metadata =====
            contractDate: todayStr,
            contractType: contractType,

            // ===== Parties =====
            clientName: recruiterName,
            contractorName: recipientName,
            employerName: recruiterName,
            employeeName: recipientName,

            // ===== Titles (job data has priority) =====
            projectTitle: job?.title || terms.projectTitle || proposal.title,
            jobTitle: job?.title || terms.jobTitle || proposal.title,
            taskTitle: terms.taskTitle || proposal.title,

            // ===== Descriptions =====
            projectDescription: job?.description || `Engagement based on accepted proposal: "${proposal.title}"`,
            deliverables: cleanedDescription,
            jobDescription: job?.description || terms.jobDescription || cleanedDescription,
            taskDescription: cleanedDescription,
            jobRequirements: terms.jobRequirements || 'As specified in job posting',

            // ===== CRITICAL: Raw schedule data for enforcement =====
            schedule: {
                startTime: rawStartTime,
                endTime: rawEndTime,
                workDays: rawWorkDays,
                isFlexible: scheduleData.isFlexible || false,
                breakDurationMinutes: rawBreakDuration,
                timezone: scheduleData.timezone || 'UTC'
            },
            // Raw values for enforcement
            workStartTime: rawStartTime,
            workEndTime: rawEndTime,
            workDays: rawWorkDays,

            // ===== FORMATTED VALUES for template display =====
            scheduleType: scheduleData.isFlexible ? 'Flexible' : 'Fixed Schedule',
            workDaysFormatted: formatWorkDays(rawWorkDays),
            breakDuration: rawBreakDuration,
            hoursPerWeek: calculateHoursPerWeek(rawStartTime, rawEndTime, rawWorkDays),
            timezone: scheduleData.timezone || 'UTC',
            workLocation: 'Remote',

            // ===== CRITICAL: Raw conditions for enforcement =====
            conditions: {
                penaltyPerLateTask: rawPenalty,
                penaltyUnit: rawPenaltyUnit,
                overtimeRate: conditionsData.overtimeRate || 1.5
            },
            penaltyPerLateTask: rawPenalty,
            penaltyUnit: rawPenaltyUnit,
            overtimeRate: conditionsData.overtimeRate || 1.5,

            // ===== FORMATTED penalty for template display =====
            penaltyDisplay: formatPenalty(rawPenalty, rawPenaltyUnit, rawCurrency),

            // ===== CRITICAL: Payment for escrow (JOB DATA HAS PRIORITY) =====
            paymentAmount: job?.salary || terms.bidAmount || terms.salary || terms.paymentAmount || terms.taskPayment || terms.budget || 0,
            salary: job?.salary || terms.salary || terms.bidAmount || terms.paymentAmount || 0,
            paymentCurrency: rawCurrency,
            currency: rawCurrency,
            taskPayment: terms.taskPayment || terms.bidAmount || 0,

            // ===== CRITICAL: Escrow flags for LegalEscrow.holdSalary =====
            requireSalaryEscrow: true, // ALWAYS require escrow for job contracts
            salaryAmount: job?.salary || terms.salary || terms.bidAmount || terms.paymentAmount || 0,
            salaryCurrency: rawCurrency,
            requireEscrow: true, // Generic escrow flag
            requireWalletFunding: true, // Alternative flag checked by enforcement
            totalAmount: job?.salary || terms.salary || terms.bidAmount || terms.paymentAmount || 0,

            // ===== Dates =====
            startDate: terms.startDate || todayStr,
            endDate: deadlineStr,
            taskDeadline: deadlineStr,
            projectDeadline: deadlineStr,
            duration: durationDays,
            durationUnit: 'days',

            // ===== Work terms (JOB DATA HAS PRIORITY) =====
            paymentSchedule: job?.paymentSchedule || terms.paymentSchedule || 'milestone',
            paymentType: terms.paymentType || 'on-completion',
            noticePeriod: 30,
            terminationConditions: 'Standard terms apply via Connekt.',
            reviewPeriod: 3,
            revisionRounds: 2,
            paymentMilestones: 'As outlined in deliverables',

            // ===== Flags =====
            isProposalAcceptance: true
        };

        // 6. Build URL Params
        const params = new URLSearchParams();

        // Mail Basics
        params.set('compose', '1');
        params.set('to', toAddress);
        params.set('subject', `Contract Offer: ${proposal.title}`);
        params.set('body', `Hello ${recipientName},\n\nI have accepted your proposal regarding "${proposal.title}".\n\nPlease find the formal contract attached for your review and signature.\n\nBest regards,\n${recruiterName}`);

        // Contract Basics
        params.set('templateId', templateId);
        params.set('contractType', contractType);
        params.set('autoStart', '0'); // 0 = Manual Fill

        // Data Payload
        params.set('variables', JSON.stringify(variables));

        // Auto-Select Dropdowns (Only set if valid ID exists)
        // Only auto-select project if it is NOT an employment contract
        if (!isEmployment && projectId) params.set('autoSelectProjectId', projectId);
        if (workspaceId) params.set('autoSelectWorkspaceId', workspaceId);
        if (taskId) params.set('autoSelectTaskId', taskId);

        // 7. Open New Tab
        const url = `/mail?${params.toString()}`;
        window.open(url, '_blank', 'noopener,noreferrer');

        onClose();
    };

    const handleReject = async () => {
        if (!proposalId || !user) return;
        if (!rejectionReason.trim()) {
            toast.error('Please provide a reason');
            return;
        }
        setIsSubmitting(true);
        try {
            await ProposalResponseService.rejectProposal(
                proposalId,
                user.uid,
                user.displayName || 'User',
                rejectionReason
            );
            toast.success('Proposal rejected');
            onClose();
        } catch (e: any) {
            toast.error(e.message || 'Failed to reject');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const getStatusBadge = () => {
        const s = proposal.status || 'pending';
        if (s === 'rejected') return (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">
                <Ban size={14} /> REJECTED
            </div>
        );
        if (s === 'accepted' || s === 'converted') return (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                <CheckCircle size={14} /> ACCEPTED
            </div>
        );
        return (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">
                ⏳ PENDING REVIEW
            </div>
        );
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="w-full max-w-4xl h-[90vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                        <div className="flex items-center gap-3">
                            <FileText className="text-teal-600" size={24} />
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Proposal Viewer</h2>
                                <p className="text-xs text-gray-500">Document ID: {proposalId || 'PREVIEW'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {getStatusBadge()}
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {/* Content Scrollable Area */}
                    <div className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-black/20">
                        <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-800 shadow-sm border border-gray-200 dark:border-zinc-700 p-10 min-h-[60vh]">

                            {/* Document Header */}
                            <GambianLegalHeader
                                size="medium"
                                showConnektLogo={true}
                                showCoatOfArms={false}
                                showGambianFlag={false}
                            />

                            <h1 className="text-2xl font-bold mt-8 text-gray-900 dark:text-white text-center uppercase tracking-wide">
                                {proposal.title}
                            </h1>
                            <p className="text-center text-sm text-gray-500 mt-2">
                                Submitted by: {proposal.terms?.applicantName || proposal.fromUsername}
                            </p>

                            {/* Markdown Description */}
                            <div className="prose dark:prose-invert max-w-none mt-8 pb-8 border-b border-gray-100 dark:border-zinc-700">
                                <ReactMarkdown>{proposal.description}</ReactMarkdown>
                            </div>

                            {/* Terms Grid */}
                            {proposal.terms && (
                                <div className="mt-8">
                                    <h3 className="text-sm font-bold uppercase text-gray-500 mb-4">Summary of Terms</h3>
                                    <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-gray-100 dark:border-zinc-700 p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                            {Object.entries(proposal.terms)
                                                // Filter out technical fields
                                                .filter(([key]) =>
                                                    !['proposal', 'description', 'body', 'contractType', 'proposalId', 'workspaceId', 'projectId', 'taskId', 'linkedWorkspaceId', 'linkedProjectId'].includes(key) &&
                                                    typeof proposal.terms[key] !== 'object'
                                                )
                                                .map(([key, value]) => (
                                                    <div key={key} className="flex flex-col">
                                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                                                            {key.replace(/([A-Z])/g, ' $1')}
                                                        </span>
                                                        <span className="font-medium text-gray-900 dark:text-white text-base">
                                                            {String(value)}
                                                        </span>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center">
                        <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300">
                            <Download size={16} /> Print / Download PDF
                        </button>

                        <div className="flex gap-3">
                            {rejecting ? (
                                <div className="flex items-center gap-2 animate-in slide-in-from-right">
                                    <input
                                        type="text"
                                        placeholder="Reason for rejection..."
                                        className="px-3 py-2 border rounded-lg text-sm w-64 dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:border-red-500"
                                        value={rejectionReason}
                                        onChange={e => setRejectionReason(e.target.value)}
                                    />
                                    <button
                                        onClick={() => setRejecting(false)}
                                        className="px-3 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-xs"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        disabled={isSubmitting}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Rejecting...' : 'Confirm Reject'}
                                    </button>
                                </div>
                            ) : (
                                isRecipient && proposal.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => setRejecting(true)}
                                            className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 dark:border-red-900/30 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                        >
                                            <XCircle size={18} /> Reject
                                        </button>
                                        <button
                                            onClick={handleReplyWithContract}
                                            className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium text-sm shadow-lg shadow-teal-500/20 transition-all hover:scale-105"
                                        >
                                            <MessageSquarePlus size={18} /> Reply with Contract
                                        </button>
                                    </>
                                )
                            )}

                            {!isRecipient && !isOwner && (
                                <span className="text-sm text-gray-400 italic">View Only Mode</span>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}