import { db } from '@/lib/firebase';
import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
    arrayUnion,
    Timestamp
} from 'firebase/firestore';
import { MailService } from './mail-service';
import { ProposalNotificationHelper } from './notification-helpers';

export const ProposalResponseService = {
    /**
     * Reject a proposal
     */
    async rejectProposal(
        proposalId: string,
        userId: string,
        username: string,
        reason: string
    ): Promise<void> {
        const proposalRef = doc(db, 'contracts', proposalId); // Proposals live in contracts col
        const snap = await getDoc(proposalRef);

        if (!snap.exists()) throw new Error('Proposal not found');
        const proposal = snap.data();

        if (proposal.toUserId !== userId) {
            throw new Error('Unauthorized: You are not the recipient of this proposal');
        }

        await updateDoc(proposalRef, {
            status: 'rejected',
            rejectionReason: reason,
            rejectedBy: userId,
            rejectedAt: serverTimestamp(),
            audit: arrayUnion({
                action: 'proposal_rejected',
                by: userId,
                at: Timestamp.now(),
                details: reason
            })
        });

        // Send notification to proposal sender
        try {
            await ProposalNotificationHelper.notifyProposalRejected(
                proposal.fromUserId,
                proposalId,
                proposal.title,
                userId,
                username,
                reason
            );
        } catch (error) {
            console.error('Error sending proposal rejection notification:', error);
        }

        // Notify the sender via mail
        await MailService.sendMail(
            userId,
            username,
            username,
            proposal.fromUsername,
            `Proposal Rejected: ${proposal.title}`,
            `The proposal "${proposal.title}" was rejected.\n\nReason: ${reason}`,
            undefined // No attachment
        );
    },

    /**
     * Mark a proposal as "Accepted/In Negotiation".
     * This usually happens when the recipient decides to reply with a Contract.
     */
    async acknowledgeProposal(proposalId: string, userId: string, username?: string): Promise<void> {
        const proposalRef = doc(db, 'contracts', proposalId);
        const snap = await getDoc(proposalRef);

        if (!snap.exists()) throw new Error('Proposal not found');
        const proposal = snap.data();

        await updateDoc(proposalRef, {
            status: 'negotiating', // Intermediate status before a contract replaces it
            lastViewedAt: serverTimestamp(),
            lastViewedBy: userId
        });

        // Send notification to proposal sender
        try {
            await ProposalNotificationHelper.notifyProposalAccepted(
                proposal.fromUserId,
                proposalId,
                proposal.title,
                userId,
                username || 'User'
            );
        } catch (error) {
            console.error('Error sending proposal accepted notification:', error);
        }
    }
};
