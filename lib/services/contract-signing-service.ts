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

        // Grant access based on contract terms
        await this.grantContractAccess(contractId, userId, contract);

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
