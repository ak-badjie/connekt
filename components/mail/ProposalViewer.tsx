'use client';

import { useState } from 'react';
import { X, FileText, MessageSquarePlus, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/context/AuthContext';
import GambianLegalHeader from '@/components/mail/GambianLegalHeader';
import { ProposalResponseService } from '@/lib/services/proposal-response-service';
import toast from 'react-hot-toast';

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
    const { user, userProfile } = useAuth(); // Need userProfile for sender name
    const [rejecting, setRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isRecipient = user?.uid === proposal.toUserId;

    // --- THE FIX: URL Generation Logic ---
    const handleReplyWithContract = () => {
        const terms = proposal.terms || {};

        // 1. Determine Template & Type
        // Matches logic from AddWorkspaceMemberModal but adapted for Proposals
        let templateId = 'Freelance Contract';
        let contractType = 'project';

        if (terms.jobId || terms.employmentType === 'employee' || proposal.title.toLowerCase().includes('job')) {
            templateId = 'Employment Contract';
            contractType = 'job';
        } else if (terms.taskId) {
            // If you have a specific Task template, use it, otherwise Freelance
            templateId = 'Freelance Contract';
            contractType = 'task';
        }

        // 2. Prepare Sender/Recipient Info
        const recruiterName = userProfile?.displayName || userProfile?.username || 'Recruiter';
        const recipientName = terms.applicantName || proposal.fromUsername || 'Recipient';
        const toAddress = `${proposal.fromUsername}@connekt.com`;

        // 3. Date calculations (like AddMemberModal)
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

        // 4. Build Variables (EXACTLY like AddMemberModal)
        const variables = {
            // Context IDs
            proposalId: proposalId,
            projectId: terms.projectId || terms.linkedProjectId,
            workspaceId: terms.workspaceId || terms.linkedWorkspaceId,
            taskId: terms.taskId || terms.linkedTaskId,

            // Names
            clientName: recruiterName, // You
            contractorName: recipientName, // Them
            employerName: recruiterName,
            employeeName: recipientName,

            // Titles
            projectTitle: proposal.title,
            jobTitle: terms.jobTitle || proposal.title,
            taskTitle: terms.taskTitle || proposal.title,

            // Descriptions
            projectDescription: `Engagement based on accepted proposal: "${proposal.title}"`,
            deliverables: proposal.description, // Use proposal body as deliverables
            jobDescription: proposal.description,

            // Financials (CRITICAL for escrow)
            paymentAmount: terms.bidAmount || terms.taskPayment || terms.salary || terms.budget || terms.paymentAmount || 0,
            paymentCurrency: terms.currency || terms.paymentCurrency || 'GMD',
            salary: terms.desiredSalary || terms.bidAmount || terms.salary || 0,
            taskPayment: terms.taskPayment || terms.bidAmount || 0,

            // Dates
            startDate: terms.startDate || todayStr,
            endDate: deadlineStr,
            taskDeadline: deadlineStr,
            projectDeadline: deadlineStr,
            duration: durationDays,
            durationUnit: 'days',

            // Defaults for fields likely missing in proposal
            paymentSchedule: 'milestone',
            paymentType: terms.paymentType || 'on-completion',
            noticePeriod: 30,
            terminationConditions: 'Standard terms apply.',
            reviewPeriod: 3,
            revisionRounds: 2,
            paymentMilestones: 'As outlined in deliverables',

            // Logic Flags
            isProposalAcceptance: true,

            // CRITICAL: Backward compatibility (keep both formats)
            linkedProjectId: terms.projectId || terms.linkedProjectId,
            linkedWorkspaceId: terms.workspaceId || terms.linkedWorkspaceId,
            linkedTaskId: terms.taskId || terms.linkedTaskId
        };

        // 4. Construct Email Body
        const subject = `Contract Offer: ${proposal.title}`;
        const body = `Hello ${recipientName},\n\nI have accepted your proposal regarding "${proposal.title}".\n\nPlease find the formal contract attached for your review and signature.\n\nBest regards,\n${recruiterName}`;

        // 5. Build URL Params
        const params = new URLSearchParams({
            compose: '1', // Trigger modal open
            to: toAddress,
            subject: subject,
            body: body,

            // Contract specific params
            templateId: templateId,
            contractType: contractType,

            // The massive variables object
            variables: JSON.stringify(variables),

            // Auto-select dropdowns in the composer
            ...(terms.projectId && { autoSelectProjectId: terms.projectId }),
            ...(terms.workspaceId && { autoSelectWorkspaceId: terms.workspaceId }),
            ...(terms.taskId && { autoSelectTaskId: terms.taskId }),

            autoStart: '0' // 0 = Just fill fields (Manual), 1 = Run AI
        });

        // 6. Open in New Tab
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
