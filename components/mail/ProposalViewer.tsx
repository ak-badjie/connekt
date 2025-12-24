'use client';

import { useState, useEffect } from 'react';
import { X, FileText, MessageSquarePlus, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/context/AuthContext';
import GambianLegalHeader from '@/components/mail/GambianLegalHeader';
import { ProposalResponseService } from '@/lib/services/proposal-response-service';
import { ExploreService } from '@/lib/services/explore-service';
import toast from 'react-hot-toast';
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
    };
    isOpen: boolean;
    onClose: () => void;
    // We don't need the complex callback anymore
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

    // --- THE FIX: URL Generation Logic ---
    const handleReplyWithContract = () => {
        const terms = proposal.terms || {};

        // PRIORITY: Use fetched job data from Firestore, fallback to URL params
        const job = jobData;

        // Extract IDs (job data has priority)
        const jobId = job?.id || terms.jobId || terms.linkedJobId;
        const workspaceId = job?.workspaceId || terms.workspaceId || terms.linkedWorkspaceId;
        const projectId = terms.projectId || terms.linkedProjectId;
        const taskId = terms.taskId || terms.linkedTaskId;

        // 1. Determine Template & Type based on job type from proposal
        let templateId = 'Freelance Contract';
        let contractType = 'project';

        if (jobId || terms.employmentType === 'employee' || proposal.title.toLowerCase().includes('job')) {
            templateId = 'Employment Contract';
            contractType = 'job';
        } else if (taskId) {
            templateId = 'Freelance Contract';
            contractType = 'task';
        } else if (projectId) {
            templateId = 'Project Admin Contract (Temporal Owner)';
            contractType = 'project_admin';
        }

        // 2. Prepare Sender/Recipient Info
        const recruiterName = userProfile?.displayName || userProfile?.username || 'Recruiter';
        const recipientName = terms.applicantName || terms.contractorName || proposal.fromUsername || 'Recipient';
        const toAddress = `${proposal.fromUsername}@connekt.com`;

        // 3. Date calculations
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
        } catch (_) {
            // Keep defaults
        }

        // 4. Build Variables - First, extract the raw schedule/conditions data
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
            // CRITICAL: Context IDs for escrow and enforcement
            proposalId: proposalId,
            jobId: jobId,
            projectId: projectId,
            workspaceId: workspaceId,
            taskId: taskId,
            // Duplicate with linked prefix for backward compatibility
            linkedJobId: jobId,
            linkedProjectId: projectId,
            linkedWorkspaceId: workspaceId,
            linkedTaskId: taskId,

            // Names
            clientName: recruiterName,
            contractorName: recipientName,
            employerName: recruiterName,
            employeeName: recipientName,

            // Titles (job data has priority)
            projectTitle: job?.title || terms.projectTitle || proposal.title,
            jobTitle: job?.title || terms.jobTitle || proposal.title,
            taskTitle: terms.taskTitle || proposal.title,

            // Descriptions
            projectDescription: job?.description || `Engagement based on accepted proposal: "${proposal.title}"`,
            jobDescription: job?.description || terms.jobDescription || proposal.description,
            deliverables: proposal.description,
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

            // CRITICAL: Financials for escrow (JOB DATA HAS PRIORITY)
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

            // Dates (ISO format for proper date input handling)
            startDate: terms.startDate || todayStr,
            contractDate: todayStr,
            endDate: deadlineStr,
            taskDeadline: deadlineStr,
            projectDeadline: deadlineStr,
            duration: durationDays,
            durationUnit: 'days',

            // Defaults for fields likely missing in proposal (JOB DATA HAS PRIORITY)
            paymentSchedule: job?.paymentSchedule || terms.paymentSchedule || 'milestone',
            paymentType: terms.paymentType || 'on-completion',
            noticePeriod: 30,
            terminationConditions: 'Standard terms apply.',
            reviewPeriod: 3,
            revisionRounds: 2,
            paymentMilestones: 'As outlined in deliverables',

            // Logic Flags
            isProposalAcceptance: true
        };

        // 5. Construct Email Body
        const subject = `Contract Offer: ${proposal.title}`;
        const body = `Hello ${recipientName},\n\nI have accepted your proposal regarding "${proposal.title}".\n\nPlease find the formal contract attached for your review and signature.\n\nBest regards,\n${recruiterName}`;

        // 6. Build URL Params - CRITICAL: Include auto-select IDs
        const paramsObj: Record<string, string> = {
            compose: '1',
            to: toAddress,
            subject: subject,
            body: body,
            templateId: templateId,
            contractType: contractType,
            variables: JSON.stringify(variables),
            autoStart: '0' // 0 = Just fill fields (Manual), 1 = Run AI
        };

        // CRITICAL: Add auto-select params for workspace/project/task selection
        if (terms.workspaceId || terms.linkedWorkspaceId) {
            paramsObj.autoSelectWorkspaceId = terms.workspaceId || terms.linkedWorkspaceId;
        }
        if (terms.projectId || terms.linkedProjectId) {
            paramsObj.autoSelectProjectId = terms.projectId || terms.linkedProjectId;
        }
        if (terms.taskId || terms.linkedTaskId) {
            paramsObj.autoSelectTaskId = terms.taskId || terms.linkedTaskId;
        }

        const params = new URLSearchParams(paramsObj);

        // 7. Open in New Tab
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
            await ProposalResponseService.rejectProposal(proposalId, user.uid, user.displayName || 'User', rejectionReason);
            toast.success('Proposal rejected');
            onClose();
        } catch (e: any) {
            toast.error(e.message || 'Failed to reject');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

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
                                <p className="text-xs text-gray-500">ID: {proposalId || 'PREVIEW'}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-black/20">
                        <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-800 shadow-sm border border-gray-200 dark:border-zinc-700 p-10 min-h-[60vh]">
                            <GambianLegalHeader size="medium" showConnektLogo={true} showCoatOfArms={false} showGambianFlag={false} />
                            <h1 className="text-2xl font-bold mt-6 text-gray-900 dark:text-white text-center uppercase">
                                {proposal.title}
                            </h1>
                            <div className="prose dark:prose-invert max-w-none mt-8">
                                <ReactMarkdown>{proposal.description}</ReactMarkdown>
                            </div>

                            {proposal.terms && (
                                <div className="mt-10 p-6 bg-gray-50 dark:bg-zinc-900/50 rounded-lg border border-gray-100 dark:border-zinc-700">
                                    <h3 className="text-sm font-bold uppercase text-gray-500 mb-4">Proposed Terms</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        {Object.entries(proposal.terms)
                                            .filter(([key]) => typeof proposal.terms[key] !== 'object' && key !== 'description')
                                            .map(([key, value]) => (
                                                <div key={key}>
                                                    <span className="text-gray-500 block capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                                    <span className="font-medium text-gray-900 dark:text-white">{String(value)}</span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-end items-center gap-3">
                        {rejecting ? (
                            <div className="flex gap-2 w-full justify-end">
                                <input
                                    className="border rounded px-2 py-1 text-sm w-1/2 dark:bg-zinc-800 dark:border-zinc-700"
                                    placeholder="Reason..."
                                    value={rejectionReason}
                                    onChange={e => setRejectionReason(e.target.value)}
                                />
                                <button onClick={() => setRejecting(false)} className="px-3 py-2 text-sm text-gray-500">Cancel</button>
                                <button onClick={handleReject} disabled={isSubmitting} className="px-4 py-2 bg-red-600 text-white rounded text-sm">Confirm</button>
                            </div>
                        ) : (
                            isRecipient && proposal.status === 'pending' && (
                                <>
                                    <button onClick={() => setRejecting(true)} className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50">
                                        <XCircle size={18} /> Reject
                                    </button>
                                    <button
                                        onClick={handleReplyWithContract}
                                        className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium text-sm shadow-lg shadow-teal-500/20"
                                    >
                                        <MessageSquarePlus size={18} /> Reply with Contract
                                    </button>
                                </>
                            )
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
