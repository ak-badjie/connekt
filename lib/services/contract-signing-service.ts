import { db } from '@/lib/firebase';
import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
    collection,
    addDoc
} from 'firebase/firestore';
import { NotificationHelpers } from './notification-helpers';
import { ChatService } from './chat-service';
import { EnhancedProjectService } from './enhanced-project-service';
import { WorkspaceService } from './workspace-service';
import { WalletService } from './wallet-service';

export const ContractSigningService = {
    /**
     * Sign a contract electronically
     */
    async signContract(
        contractId: string,
        userId: string,
        username: string,
        fullName: string
    ): Promise<void> {
        // Get contract
        const contractRef = doc(db, 'contracts', contractId);
        const contractSnap = await getDoc(contractRef);

        if (!contractSnap.exists()) {
            throw new Error('Contract not found');
        }

        const contract = contractSnap.data();

        // Enforce funding before marking signed (escrow/hold) if payment amount is specified
        await this.ensureEscrowHold(contractId, contract);

        // Verify user is the recipient
        if (contract.toUserId !== userId) {
            throw new Error('You are not authorized to sign this contract');
        }

        // Check if already signed
        if (contract.status === 'signed') {
            throw new Error('Contract has already been signed');
        }

        // Update contract with signature
        await updateDoc(contractRef, {
            status: 'signed',
            signedBy: userId,
            signatureFullName: fullName,
            signedAt: serverTimestamp()
        });

        // Grant access based on contract terms and sync collaboration surfaces
        await this.grantContractAccess(contractId, userId, contract);
        await this.syncCollaboration(contractId, userId, username, contract);

        // Send notification to contract creator
        await NotificationHelpers.sendContractSignedNotification(
            contract.fromUserId,
            contract.fromUsername,
            userId,
            username,
            fullName,
            contract.title,
            contractId
        );
    },

    /**
     * Grant access based on contract terms
     */
    async grantContractAccess(
        contractId: string,
        userId: string,
        contract: any
    ): Promise<void> {
        const terms = contract.terms || {};

        // If contract specifies a project, add user to project
        if (terms.projectId) {
            // Add user as project member
            const projectRef = doc(db, 'projects', terms.projectId);
            const projectSnap = await getDoc(projectRef);

            if (projectSnap.exists()) {
                const project = projectSnap.data();
                const members = project.members || [];

                if (!members.includes(userId)) {
                    await updateDoc(projectRef, {
                        members: [...members, userId]
                    });
                }

                // Ensure project chat membership
                try {
                    const chat = await ChatService.getConversationByContextId(terms.projectId, 'project');
                    if (chat) {
                        await ChatService.addMember(chat.id, {
                            userId,
                            username: contract.toUsername || 'recipient',
                            role: 'member'
                        });
                    }
                } catch (err) {
                    console.error('Failed to sync project chat membership for contract', contractId, err);
                }
            }
        }

        // If contract specifies a workspace, add user to workspace
        if (terms.workspaceId) {
            const workspaceRef = doc(db, 'workspaces', terms.workspaceId);
            const workspaceSnap = await getDoc(workspaceRef);

            if (workspaceSnap.exists()) {
                const workspace = workspaceSnap.data();
                const members = workspace.members || [];

                if (!members.includes(userId)) {
                    await updateDoc(workspaceRef, {
                        members: [...members, userId]
                    });
                }

                // Ensure workspace chat membership
                try {
                    const chat = await ChatService.getConversationByContextId(terms.workspaceId, 'workspace');
                    if (chat) {
                        await ChatService.addMember(chat.id, {
                            userId,
                            username: contract.toUsername || 'recipient',
                            role: 'member'
                        });
                    }
                } catch (err) {
                    console.error('Failed to sync workspace chat membership for contract', contractId, err);
                }
            }
        }

        // Store contract reference on user profile
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            [`contracts.${contractId}`]: {
                contractId,
                type: contract.type,
                signedAt: serverTimestamp(),
                status: 'active'
            }
        });
    },

    /**
     * Add collaboration hooks (project membership, chat, calendar stubs)
     */
    async syncCollaboration(contractId: string, userId: string, username: string, contract: any): Promise<void> {
        const terms = contract.terms || {};

        // Project membership via enhanced service (idempotent)
        if (terms.projectId) {
            try {
                const project = await EnhancedProjectService.getProject(terms.projectId);
                if (project && !project.members?.some((m: any) => m.userId === userId)) {
                    await EnhancedProjectService.addMember(terms.projectId, {
                        userId,
                        username,
                        email: contract.toUserEmail || '',
                        role: 'member'
                    } as any);
                }
            } catch (err) {
                console.error('Failed to sync project membership for contract', contractId, err);
            }
        }

        // Workspace membership via service (already handles chat join)
        if (terms.workspaceId) {
            try {
                await WorkspaceService.addMember(terms.workspaceId, {
                    userId,
                    username,
                    email: contract.toUserEmail || '',
                    role: 'member'
                });
            } catch (err) {
                console.error('Failed to sync workspace membership for contract', contractId, err);
            }
        }

        // TODO: Calendar/meetings sync can be hooked here when calendar service is available
    },

    /**
     * Ensure escrow funds are held before completing signature (idempotent on escrow record)
     */
    async ensureEscrowHold(contractId: string, contract: any): Promise<void> {
        const terms = contract?.terms || {};
        const amount = terms.paymentAmount || terms.totalCost || terms.budgetAmount;
        if (!amount || amount <= 0) return;

        const escrowRef = doc(db, 'escrow_holds', `escrow_${contractId}`);
        const escrowSnap = await getDoc(escrowRef);
        if (escrowSnap.exists()) return; // already held

        const payerWalletId = `user_${contract.fromUserId}`;
        const payeeWalletId = `user_${contract.toUserId}`;

        try {
            await WalletService.holdInEscrow(
                contractId,
                payerWalletId,
                payeeWalletId,
                contract.fromUserId,
                contract.toUserId,
                amount
            );
        } catch (err: any) {
            console.error('Escrow hold failed', err);
            throw new Error(err?.message || 'Unable to place funds in escrow for this contract');
        }
    },

    /**
     * Get signed contracts for a user
     */
    async getUserSignedContracts(userId: string): Promise<any[]> {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return [];
        }

        const userData = userSnap.data();
        const contracts = userData.contracts || {};

        return Object.values(contracts);
    },

    /**
     * Get contract by ID
     */
    async getContract(contractId: string): Promise<any | null> {
        const contractRef = doc(db, 'contracts', contractId);
        const contractSnap = await getDoc(contractRef);

        if (!contractSnap.exists()) {
            return null;
        }

        return {
            id: contractSnap.id,
            ...contractSnap.data()
        };
    }
};
