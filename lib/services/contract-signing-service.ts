import { db } from '@/lib/firebase';
import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
    collection,
    addDoc,
    arrayUnion,
    Timestamp
} from 'firebase/firestore';
import { NotificationHelpers } from './notification-helpers';
import { ChatService } from './chat-service';
import { EnhancedProjectService } from './enhanced-project-service';
import { WorkspaceService } from './workspace-service';
import { WalletService } from './wallet-service';
import { TaskService } from './task-service';
import { MeetingService } from './meeting-service';
import { CONTRACT_TYPES } from '@/lib/constants/contracts';

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

        await this.appendAudit(contractId, {
            by: userId,
            action: 'signed',
            details: `${username || 'user'} signed the contract`
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
        console.log(`[ContractSigningService] Granting access for contract ${contractId} to user ${userId}`);
        const terms = contract.terms || {};
        const roleForUser = terms.roles?.find((r: any) => r.userId === userId)?.role || 'member';
        const usernameForUser = contract.toUsername || 'recipient';
        const emailForUser = contract.toUserEmail || contract.toMailAddress || '';

        // Extract employment details
        const memberType = terms.memberType || 'employee'; // Default to employee if not specified (legacy fallback)
        const jobTitle = terms.jobTitle || '';

        let projectId = terms.projectId || terms.linkedProjectId || contract.relatedProjectId;
        let workspaceId = terms.workspaceId || terms.linkedWorkspaceId || contract.relatedWorkspaceId;
        const taskId = terms.taskId || terms.linkedTaskId || contract.relatedTaskId;

        console.log('[ContractSigningService] IDs identified:', { projectId, workspaceId, taskId, terms });

        // Detect contract type to determine access strategy
        const contractType = terms.contractType || contract.type;
        const isEmploymentContract = contractType === CONTRACT_TYPES.JOB ||
            contractType === 'job' ||
            memberType === 'employee';

        console.log('[ContractSigningService] Contract type analysis:', {
            contractType,
            memberType,
            isEmploymentContract
        });

        // Infer project/workspace IDs from task when missing
        if ((!projectId || !workspaceId) && taskId) {
            try {
                const t = await TaskService.getTask(taskId);
                if (t) {
                    projectId = projectId || t.projectId;
                    workspaceId = workspaceId || t.workspaceId;
                }
            } catch (inferErr) {
                console.error('Failed to infer project/workspace from task', taskId, inferErr);
            }
        }

        // 1. Ensure Project Membership (SKIP for Employment/Job contracts)
        if (projectId && !isEmploymentContract) {
            try {
                console.log('[ContractSigningService] Adding user to project:', projectId);
                // Using EnhancedProjectService to handle membership logic (idempotency, defaults)
                await EnhancedProjectService.addMember(projectId, {
                    userId,
                    username: usernameForUser || 'Unknown',
                    email: emailForUser || '',
                    role: roleForUser === 'owner' || roleForUser === 'admin' || roleForUser === 'supervisor' ? 'supervisor' : 'member',
                    type: memberType,
                    jobTitle
                });
            } catch (err) {
                console.error('Failed to add member to project', projectId, err);
            }
        } else if (projectId && isEmploymentContract) {
            console.log('[ContractSigningService] Skipping project addition for employment contract. User will be added to workspace only.');
        }

        // 2. Ensure Workspace Membership
        if (workspaceId) {
            try {
                await WorkspaceService.addMember(workspaceId, {
                    userId,
                    username: usernameForUser || 'Unknown',
                    email: emailForUser || '',
                    role: roleForUser === 'owner' || roleForUser === 'admin' ? 'admin' : 'member',
                    type: memberType,
                    jobTitle
                });
            } catch (err) {
                console.error('Failed to add member to workspace', workspaceId, err);
            }
        }

        // 3. Handle specific Task Assignment logic
        if (taskId && contract.type === 'task_assignment') {
            console.log(`[ContractSigningService] Executing task assignment for ${taskId}`);
            try {
                await TaskService.updateStatus(taskId, 'in-progress');

                const taskRef = doc(db, 'tasks', taskId);
                await updateDoc(taskRef, {
                    assigneeId: userId,
                    assigneeUsername: usernameForUser,
                    status: 'in-progress',
                    updatedAt: serverTimestamp()
                });
                console.log(`[ContractSigningService] Task ${taskId} assigned to ${userId}`);
            } catch (err) {
                console.error('Failed to update task assignment', taskId, err);
            }
        }
    },

    async syncCollaboration(
        contractId: string,
        userId: string,
        username: string,
        contract: any
    ): Promise<void> {
        const terms = contract.terms || {};
        const title = contract.title || 'Untitled Contract';

        let projectId = terms.projectId || terms.linkedProjectId || contract.relatedProjectId;
        let workspaceId = terms.workspaceId || terms.linkedWorkspaceId || contract.relatedWorkspaceId;
        const taskId = terms.taskId || terms.linkedTaskId || contract.relatedTaskId;

        // Re-infer IDs if needed 
        if ((!projectId || !workspaceId) && taskId) {
            try {
                const t = await TaskService.getTask(taskId);
                if (t) {
                    projectId = projectId || t.projectId;
                    workspaceId = workspaceId || t.workspaceId;
                }
            } catch (err) { /* ignore here */ }
        }

        // 1. Chat Sync
        try {
            // Check for linked chat
            const linkedChatId = terms.linkedChatId || terms.chatId || terms.teamChatId;
            let chatId = linkedChatId;

            if (chatId) {
                await ChatService.addMember(chatId, {
                    userId,
                    username,
                    role: 'member'
                });
            } else if (projectId) {
                // Try to add to project's default chat if accessible? 
                // Currently ChatService doesn't accept projectId to find chat. 
                // We'll leave it as is.
            }

        } catch (err) {
            console.error('Failed to sync chat membership', err);
        }

        // 2. Calendar / Meetings
        try {
            const participants = Array.from(new Set([userId, contract.fromUserId].filter(Boolean)));
            const meetingPayloads = [] as Array<{
                title: string;
                description?: string;
                startTime: number;
                endTime?: number;
                duration: number;
                hostId: string;
                hostName: string;
                participants: string[];
                type: 'video' | 'audio';
                projectId?: string;
                workspaceId?: string;
            }>;

            const startDate = terms.startDate || contract.startDate;
            const endDate = terms.endDate || contract.endDate;

            if (startDate) {
                const parsed = new Date(startDate);
                if (!isNaN(parsed.getTime())) {
                    meetingPayloads.push({
                        title: `${title} kickoff`,
                        description: 'Auto-created from signed contract',
                        startTime: parsed.getTime(),
                        duration: 60,
                        hostId: contract.fromUserId,
                        hostName: contract.fromUsername || 'Host',
                        participants,
                        type: 'video',
                        projectId,
                        workspaceId
                    });
                }
            }

            if (endDate) {
                const parsed = new Date(endDate);
                if (!isNaN(parsed.getTime())) {
                    meetingPayloads.push({
                        title: `${title} due`,
                        description: 'Auto-created from signed contract',
                        startTime: parsed.getTime(),
                        duration: 30,
                        hostId: contract.fromUserId,
                        hostName: contract.fromUsername || 'Host',
                        participants,
                        type: 'video',
                        projectId,
                        workspaceId
                    });
                }
            }

            for (const meeting of meetingPayloads) {
                await MeetingService.createMeeting(meeting as any);
            }
        } catch (err) {
            console.error('Failed to sync calendar events for contract', contractId, err);
        }
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
     * Ensure escrow funds are held before completing signature (idempotent on escrow record)
     */
    async ensureEscrowHold(contractId: string, contract: any): Promise<void> {
        const terms = contract?.terms || {};

        const roleForUser = terms.roles?.find((r: any) => r.userId === contract?.toUserId)?.role || terms.projectRole;
        const isOwnershipInvite = roleForUser && ['owner', 'admin', 'supervisor'].includes(roleForUser);
        const isAssignmentType = terms.contractType === 'project_assignment' || terms.contractType === 'workspace_assignment';

        // Also enforce escrow if it's an employment or freelance contract with a payment amount
        const memberType = terms.memberType;
        const isEmployment = memberType === 'employee' || memberType === 'freelancer';

        if (!isOwnershipInvite && !isAssignmentType && !isEmployment) {
            await this.appendAudit(contractId, {
                by: contract.fromUserId,
                action: 'escrow_skipped_not_paying_contract',
                details: 'Escrow skipped: Not an ownership/assignment or paid employment contract.'
            });
            return;
        }

        // Amount/currency constraints
        let amount = terms.paymentAmount || terms.projectBudget || terms.totalCost || terms.budgetAmount;
        if (typeof amount === 'string') {
            amount = parseFloat(amount);
        }
        const currency = terms.paymentCurrency || terms.totalCurrency || terms.currency || terms.budgetCurrency || 'GMD';

        // If amount is missing or zero, skip escrow regardless of type
        if (!amount || amount <= 0) {
            // For employment, this is expected if it's just an invite without predefined first payment?
            // But usually for "salary" or "paymentAmount" we expect it.
            // We'll log it as skipped.
            await this.appendAudit(contractId, {
                by: contract.fromUserId,
                action: 'escrow_skipped_no_amount',
                details: 'Escrow skipped: no positive amount found for contract.'
            });
            return;
        }

        if (currency && currency.toUpperCase() !== 'GMD') {
            await this.appendAudit(contractId, {
                by: contract.fromUserId,
                action: 'escrow_skipped_currency_mismatch',
                details: `Escrow skipped: currency ${currency} not supported (expected GMD)`
            });
            return;
        }

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
            const msg = err?.message || '';
            // Make insufficient funds non-blocking so memberships still proceed
            if (typeof msg === 'string' && msg.toLowerCase().includes('insufficient')) {
                await this.appendAudit(contractId, {
                    by: contract.fromUserId,
                    action: 'escrow_skipped_insufficient_funds',
                    details: `Escrow skipped: insufficient funds for amount ${amount}`
                });
                return;
            }
            throw new Error(msg || 'Unable to place funds in escrow for this contract');
        }

        await this.appendAudit(contractId, {
            by: contract.fromUserId,
            action: 'escrow_held',
            details: `Escrow hold placed for ${amount}`
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
