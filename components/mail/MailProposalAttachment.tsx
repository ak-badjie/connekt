'use client';

import { useState } from 'react';
import { FileText, Eye } from 'lucide-react';
import { ProposalViewer } from './ProposalViewer';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface MailProposalAttachmentProps {
    proposal: {
        title: string;
        description: string;
        terms: any;
        status: 'pending' | 'accepted' | 'rejected';
        fromUserId: string;
        fromUsername: string;
        toUserId: string;
        toUsername: string;
        createdAt?: any;
    };
    proposalId?: string;
    mailId?: string;
}

export function MailProposalAttachment({ proposal, proposalId, mailId }: MailProposalAttachmentProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [viewing, setViewing] = useState(false);

    const isSender = user?.uid === proposal.fromUserId;
    const isRecipient = user?.uid === proposal.toUserId;
    const isPending = proposal.status === 'pending';

    const handleAccept = () => {
        // Close viewer
        setViewing(false);

        // Navigate or trigger Compose Modal in 'contract' mode with proposal data
        // We use URL search params to trigger the modal if the page listens for it, 
        // or we dispatch a custom event if that's the pattern.
        // Assuming we are in a context where we can trigger it:

        // Construct params for the contract drafter
        const params = new URLSearchParams();
        params.set('compose', '1'); // page.tsx expects '1'

        // Map proposal type to contract type
        const contextType = proposal.terms?.proposalContext?.jobType || 'general';
        // If it's a job proposal, we want a 'job' contract
        // If it's a project proposal, we want 'project' contract
        params.set('contractType', contextType);

        params.set('source', 'proposal_accept');
        if (proposalId) params.set('proposalId', proposalId);

        // Pass proposal terms as variables
        const variables = {
            ...proposal.terms,
            // Ensure we map proposal fields to contract fields
            contractorName: proposal.terms.applicantName,
            jobTitle: proposal.title,
            // Add implicit acceptance context
            isProposalAcceptance: true
        };
        params.set('variables', JSON.stringify(variables));

        // Push to URL (this might need to be adapted based on where this component runs)
        router.push(`?${params.toString()}`);
    };

    const handleReject = (reason?: string) => {
        setViewing(false);

        // Draft rejection mail
        const params = new URLSearchParams();
        params.set('compose', '1');
        if (proposal.fromUsername) params.set('to', proposal.fromUsername); // Or find their email
        params.set('subject', `Update regarding your proposal: ${proposal.title}`);
        params.set('body', `Dear ${proposal.terms?.applicantName || 'Applicant'},\n\nThank you for your proposal regarding "${proposal.title}".\n\nAfter careful review, we have decided not to proceed at this time.\n\nReason: ${reason || 'Not specified'}\n\nWe wish you the best in your future endeavors.\n\nSincerely,\n${user?.displayName || 'The Team'}`);

        router.push(`?${params.toString()}`);
    };

    return (
        <>
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
                <div className="flex items-start gap-3">
                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg">
                        <FileText className="text-blue-600 dark:text-blue-400" size={24} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                            {proposal.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Proposal / Application
                        </p>

                        {isPending ? (
                            isRecipient ? (
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-semibold">
                                    Needs Review
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-semibold">
                                    Submitted
                                </div>
                            )
                        ) : (
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold ${proposal.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {proposal.status.toUpperCase()}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setViewing(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/30"
                    >
                        <Eye size={16} />
                        View
                    </button>
                </div>
            </div>

            <ProposalViewer
                isOpen={viewing}
                onClose={() => setViewing(false)}
                proposal={proposal}
                proposalId={proposalId}
                onAccept={handleAccept}
                onReject={handleReject}
            />
        </>
    );
}
