import { db } from '@/lib/firebase';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
    arrayUnion,
    Timestamp
} from 'firebase/firestore';
import type { Contract, ContractType, ContractTerms, ContractStatus } from '@/lib/types/mail.types';
import { MailService } from './mail-service';
import { WalletService } from './wallet-service';

/**
 * Service for handling contract-based mail operations
 * Contracts are used for all two-party interactions in ConnektMail
 */
export const ContractMailService = {
    /**
     * Create a contract document without sending notification
     */
    async createContractDocument(
        fromUserId: string,
        fromUsername: string,
        fromMailAddress: string,
        toUserId: string,
        toUsername: string,
        toMailAddress: string,
        type: ContractType,
        title: string,
        description: string,
        terms: ContractTerms,
        expiresIn?: number, // days
        defaultTerms?: string // Standard terms from template
    ): Promise<string> {
        // Create contract
        const contract: Partial<Contract> = {
            type,
            status: 'pending',
            fromUserId,
            fromUsername,
            fromMailAddress,
            toUserId,
            toUsername,
            toMailAddress,
            title,
            description,
            ...(defaultTerms && { defaultTerms }),
            terms,
            createdAt: serverTimestamp(),
            ...(expiresIn && { expiresAt: new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000) })
        };

        const contractRef = await addDoc(collection(db, 'contracts'), contract);
        return contractRef.id;
    },

    /**
     * Create a contract and send notification mail
     */
    async createContract(
        fromUserId: string,
        fromUsername: string,
        fromMailAddress: string,
        toUserId: string,
        toUsername: string,
        toMailAddress: string,
        type: ContractType,
        title: string,
        description: string,
        terms: ContractTerms,
        expiresIn?: number, // days
        defaultTerms?: string // Standard terms from template
    ): Promise<string> {
        // Create contract
        const contract: Partial<Contract> = {
            type,
            status: 'pending',
            fromUserId,
            fromUsername,
            fromMailAddress,
            toUserId,
            toUsername,
            toMailAddress,
            title,
            description,
            ...(defaultTerms && { defaultTerms }), // Only include if provided
            terms,
            createdAt: serverTimestamp(),
            ...(expiresIn && { expiresAt: new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000) })
        };

        const contractRef = await addDoc(collection(db, 'contracts'), contract);
        const contractId = contractRef.id;

        // Send notification mail
        const mailBody = this.generateContractMailBody(type, title, description, terms, contractId);

        // Send notification mail with contractId attached
        await MailService.sendMail(
            fromUserId,
            fromUsername,
            fromUsername, // displayName
            toUsername,
            title,
            mailBody,
            contractId // Pass contractId so it appears in mail document
        );

        return contractId;
    },

    /**
     * Generate mail body for contract notification
     */
    generateContractMailBody(
        type: ContractType,
        title: string,
        description: string,
        terms: ContractTerms,
        contractId: string
    ): string {
        let body = `# ${title}\n\n${description}\n\n`;

        switch (type) {
            case 'task_assignment':
                body += `## Task Details\n\n`;
                body += `- **Task**: ${terms.taskTitle}\n`;
                body += `- **Payment**: $${terms.taskPayment}\n`;
                body += `- **Deadline**: ${terms.taskDeadline}\n\n`;
                break;

            case 'project_assignment':
                body += `## Project Details\n\n`;
                body += `- **Project**: ${terms.projectTitle}\n`;
                body += `- **Budget**: $${terms.projectBudget}\n`;
                body += `- **Deadline**: ${terms.projectDeadline}\n`;
                body += `- **Role**: ${terms.projectRole}\n\n`;
                break;

            case 'workspace_invite':
                body += `## Workspace Invitation\n\n`;
                body += `- **Workspace**: ${terms.workspaceName}\n`;
                body += `- **Role**: ${terms.workspaceRole}\n\n`;
                break;

            case 'agency_invite':
                body += `## Agency Invitation\n\n`;
                body += `- **Agency**: ${terms.agencyName}\n`;
                body += `- **Role**: ${terms.agencyRole}\n`;
                body += `- **Your Agency Email**: ${terms.agencyEmail}\n\n`;
                break;
        }

        body += `---\n\n`;
        body += `*This is a contract proposal. Please accept or reject this contract.*\n\n`;
        body += `Contract ID: \`${contractId}\``;

        return body;
    },

    /**
     * Accept a contract
     */
    async acceptContract(contractId: string, acceptedByUserId: string, fullName?: string): Promise<void> {
        const contractRef = doc(db, 'contracts', contractId);
        const contractSnap = await getDoc(contractRef);

        if (!contractSnap.exists()) {
            throw new Error('Contract not found');
        }

        const contract = contractSnap.data() as Contract;

        if (contract.toUserId !== acceptedByUserId) {
            throw new Error('Unauthorized to accept this contract');
        }

        if (contract.status !== 'pending') {
            throw new Error('Contract is not in pending state');
        }

        await updateDoc(contractRef, {
            status: 'accepted',
            respondedAt: serverTimestamp(),
            ...(fullName ? { signatureFullName: fullName, signedAt: serverTimestamp(), signedBy: acceptedByUserId } : {})
        });

        await this.appendAudit(contractId, {
            by: acceptedByUserId,
            action: 'accepted',
            details: fullName ? `Accepted and signed by ${fullName}` : 'Accepted'
        });

        // Hold funds in escrow if required
        await this.ensureEscrow(contractId, contract);

        // Execute contract-specific actions
        await this.executeContractAcceptance(contract);
    },

    /**
     * Reject a contract
     */
    async rejectContract(contractId: string, rejectedByUserId: string, reason?: string): Promise<void> {
        const contractRef = doc(db, 'contracts', contractId);
        const contractSnap = await getDoc(contractRef);

        if (!contractSnap.exists()) {
            throw new Error('Contract not found');
        }

        const contract = contractSnap.data() as Contract;

        if (contract.toUserId !== rejectedByUserId) {
            throw new Error('Unauthorized to reject this contract');
        }

        if (contract.status !== 'pending') {
            throw new Error('Contract is not in pending state');
        }

        await updateDoc(contractRef, {
            status: 'rejected',
            respondedAt: serverTimestamp(),
            rejectionReason: reason
        });
    },

    /**
     * Sign a contract with digital signature
     */
    async signContract(
        contractId: string,
        userId: string,
        fullName: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        const contractRef = doc(db, 'contracts', contractId);
        const contractSnap = await getDoc(contractRef);

        if (!contractSnap.exists()) {
            throw new Error('Contract not found');
        }

        const contract = contractSnap.data() as Contract;

        if (contract.toUserId !== userId) {
            throw new Error('Unauthorized to sign this contract');
        }

        if (contract.status !== 'pending') {
            throw new Error('Contract is not in pending state');
        }

        // Generate signature hash
        const contractContent = JSON.stringify(contract);
        const signatureHash = await this.generateHash(contractContent);

        const safeFullName = fullName || 'Signed User';
        const signature = {
            userId,
            username: safeFullName,
            // Firestore forbids serverTimestamp inside arrays; store client timestamp instead.
            signedAt: new Date(),
            ...(ipAddress ? { ipAddress } : {}),
            ...(userAgent ? { userAgent } : {}),
            signatureHash
        };

        // Update contract with signature
        const currentSignatures = contract.signatures || [];
        await updateDoc(contractRef, {
            signatures: [...currentSignatures, signature],
            status: 'accepted',
            respondedAt: serverTimestamp(),
            signatureFullName: safeFullName,
            signedAt: serverTimestamp(),
            signedBy: userId
        });

        await this.appendAudit(contractId, {
            by: userId,
            action: 'signed',
            details: `Signed by ${safeFullName}`
        });

        // Hold funds in escrow if required
        await this.ensureEscrow(contractId, contract);

        // Execute contract-specific actions
        await this.executeContractAcceptance(contract);
    },

    async appendAudit(contractId: string, entry: { by: string; action: string; details?: string; meta?: Record<string, any> }) {
        const contractRef = doc(db, 'contracts', contractId);
        await updateDoc(contractRef, {
            audit: arrayUnion({
                at: Timestamp.now(),
                ...entry
            })
        });
    },

    /**
     * Approve a contract milestone and trigger partial escrow release
     */
    async approveMilestone(
        contractId: string,
        milestoneId: string,
        approverUserId: string
    ): Promise<void> {
        const contractRef = doc(db, 'contracts', contractId);
        const contractSnap = await getDoc(contractRef);

        if (!contractSnap.exists()) {
            throw new Error('Contract not found');
        }

        const contract = contractSnap.data() as Contract;
        const terms = contract.terms || {};
        const milestones = terms.milestones || [];
        const milestoneIndex = milestones.findIndex(m => m.id === milestoneId);

        if (milestoneIndex === -1) {
            throw new Error('Milestone not found');
        }

        // Only payer (fromUserId) can approve and release funds
        if (contract.fromUserId !== approverUserId) {
            throw new Error('Only the contract issuer can approve milestones');
        }

        const milestone = milestones[milestoneIndex];
        if (milestone.status === 'paid') {
            return; // idempotent
        }

        if (milestone.status === 'pending') {
            // allow approving from pending (no submission), but note in audit
        }

        const amount = milestone.amount;
        if (!amount || amount <= 0) {
            throw new Error('Milestone has no payable amount');
        }

        // Release partial escrow for this milestone
        await WalletService.releaseEscrowPartial(contractId, amount);

        // Update milestone status locally
        const updatedMilestone = {
            ...milestone,
            status: 'paid',
            approvedAt: serverTimestamp()
        };
        const updatedMilestones = [...milestones];
        updatedMilestones[milestoneIndex] = updatedMilestone;

        await updateDoc(contractRef, {
            'terms.milestones': updatedMilestones,
            updatedAt: serverTimestamp()
        });

        await this.appendAudit(contractId, {
            by: approverUserId,
            action: 'milestone_paid',
            details: `Milestone ${milestone.title || milestone.id} paid (${amount})`,
            meta: { milestoneId }
        });
    },

    /**
     * Submit milestone evidence by recipient
     */
    async submitMilestoneEvidence(
        contractId: string,
        milestoneId: string,
        submitterUserId: string,
        evidence: { url: string; note?: string }
    ): Promise<void> {
        const contractRef = doc(db, 'contracts', contractId);
        const contractSnap = await getDoc(contractRef);

        if (!contractSnap.exists()) throw new Error('Contract not found');
        const contract = contractSnap.data() as Contract;

        if (contract.toUserId !== submitterUserId) {
            throw new Error('Only the contract recipient can submit milestone evidence');
        }

        const terms = contract.terms || {};
        const milestones = terms.milestones || [];
        const milestoneIndex = milestones.findIndex(m => m.id === milestoneId);
        if (milestoneIndex === -1) throw new Error('Milestone not found');

        const milestone = milestones[milestoneIndex];
        if (milestone.status === 'paid') return; // no-op

        const updatedMilestone = {
            ...milestone,
            status: 'submitted',
            submittedAt: serverTimestamp(),
            evidence: [...(milestone.evidence || []), {
                url: evidence.url,
                note: evidence.note,
                uploadedAt: serverTimestamp(),
                by: submitterUserId
            }]
        };

        const updatedMilestones = [...milestones];
        updatedMilestones[milestoneIndex] = updatedMilestone;

        await updateDoc(contractRef, {
            'terms.milestones': updatedMilestones,
            updatedAt: serverTimestamp()
        });

        await this.appendAudit(contractId, {
            by: submitterUserId,
            action: 'milestone_submitted',
            details: `Milestone ${milestone.title || milestone.id} submitted` ,
            meta: { milestoneId }
        });
    },

    /**
     * Ensure wallet has funds and hold in escrow when contract terms require it
     */
    async ensureEscrow(contractId: string, contract: Contract): Promise<void> {
        const terms = contract.terms || {};
        const amount = terms.totalAmount || terms.paymentAmount || terms.projectBudget || terms.taskPayment;
        if (!terms.requireWalletFunding || !amount || amount <= 0) return;

        const escrowId = `escrow_${contractId}`;
        const escrowSnap = await getDoc(doc(db, 'escrow_holds', escrowId));
        if (escrowSnap.exists()) return; // already held

        const payerWalletId = `user_${contract.fromUserId}`;
        const payeeWalletId = `user_${contract.toUserId}`;

        const hasFunds = await WalletService.hasSufficientFunds(payerWalletId, amount);
        if (!hasFunds) {
            throw new Error('Insufficient wallet balance to fund this contract. Please top up.');
        }

        await WalletService.holdInEscrow(
            contractId,
            payerWalletId,
            payeeWalletId,
            contract.fromUserId,
            contract.toUserId,
            amount
        );

        await updateDoc(doc(db, 'contracts', contractId), {
            escrowId
        });
    },

    /**
     * Generate SHA-256 hash for signature
     */
    async generateHash(content: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Execute actions when a contract is accepted
     */
    async executeContractAcceptance(contract: Contract): Promise<void> {
        switch (contract.type) {
            case 'task_assignment':
                // Assign task to user
                if (contract.terms.taskId) {
                    const taskRef = doc(db, 'tasks', contract.terms.taskId);
                    await updateDoc(taskRef, {
                        assigneeId: contract.toUserId,
                        assigneeUsername: contract.toUsername,
                        status: 'in-progress',
                        updatedAt: serverTimestamp()
                    });
                }
                break;

            case 'project_assignment':
                // Add user to project
                if (contract.terms.projectId) {
                    const projectRef = doc(db, 'projects', contract.terms.projectId);
                    await updateDoc(projectRef, {
                        assignedOwnerId: contract.toUserId,
                        assignedOwnerUsername: contract.toUsername,
                        status: 'active',
                        updatedAt: serverTimestamp()
                    });
                }
                break;

            case 'workspace_invite':
                // Add user to workspace (handled by workspace service)
                // This is a placeholder - actual implementation in workspace service
                break;

            case 'agency_invite':
                // Add user to agency (handled by agency service)
                // This is a placeholder - actual implementation in agency service
                break;
        }
    },

    /**
     * Get contracts for a user
     */
    async getUserContracts(userId: string, status?: ContractStatus): Promise<Contract[]> {
        let q;

        if (status) {
            q = query(
                collection(db, 'contracts'),
                where('toUserId', '==', userId),
                where('status', '==', status)
            );
        } else {
            q = query(
                collection(db, 'contracts'),
                where('toUserId', '==', userId)
            );
        }

        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contract));
    },

    /**
     * Get sent contracts
     */
    async getSentContracts(userId: string, status?: ContractStatus): Promise<Contract[]> {
        let q;

        if (status) {
            q = query(
                collection(db, 'contracts'),
                where('fromUserId', '==', userId),
                where('status', '==', status)
            );
        } else {
            q = query(
                collection(db, 'contracts'),
                where('fromUserId', '==', userId)
            );
        }

        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contract));
    }
};
