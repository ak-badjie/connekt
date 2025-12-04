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
    serverTimestamp
} from 'firebase/firestore';
import type { Contract, ContractType, ContractTerms, ContractStatus } from '@/lib/types/mail.types';
import { MailService } from './mail-service';

/**
 * Service for handling contract-based mail operations
 * Contracts are used for all two-party interactions in ConnektMail
 */
export const ContractMailService = {
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
            defaultTerms, // Store standard terms
            terms,
            createdAt: serverTimestamp(),
            expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000) : undefined
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
    async acceptContract(contractId: string, acceptedByUserId: string): Promise<void> {
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
            respondedAt: serverTimestamp()
        });

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

        const signature = {
            userId,
            username: fullName,
            signedAt: serverTimestamp(),
            ipAddress,
            userAgent,
            signatureHash
        };

        // Update contract with signature
        const currentSignatures = contract.signatures || [];
        await updateDoc(contractRef, {
            signatures: [...currentSignatures, signature],
            status: 'accepted',
            respondedAt: serverTimestamp()
        });

        // Execute contract-specific actions
        await this.executeContractAcceptance(contract);
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
