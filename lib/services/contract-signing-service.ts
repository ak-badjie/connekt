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
        const terms = contract.terms || {};
        const roleForUser = terms.roles?.find((r: any) => r.userId === userId)?.role || 'member';
        const usernameForUser = contract.toUsername || 'recipient';
        const emailForUser = contract.toUserEmail || contract.toMailAddress || '';

        let projectId = terms.projectId || terms.linkedProjectId || contract.relatedProjectId;
        let workspaceId = terms.workspaceId || terms.linkedWorkspaceId || contract.relatedWorkspaceId;
        const taskId = terms.taskId || terms.linkedTaskId || contract.relatedTaskId;
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
        const linkedChatId = terms.linkedChatId || terms.chatId || terms.teamChatId;

        // Helper to force-add a member with verification (idempotent)
        const ensureProjectMembership = async (id: string) => {
            const projectRef = doc(db, 'projects', id);
            const projectSnap = await getDoc(projectRef);
            const members = projectSnap.exists() ? projectSnap.data().members || [] : [];
            const alreadyMember = members.some((m: any) => (m?.userId || m) === userId);
            if (!alreadyMember) {
                await updateDoc(projectRef, {
                    members: arrayUnion({ userId, username: usernameForUser, email: emailForUser, role: 'member', assignedAt: Timestamp.now() }),
                    memberIds: arrayUnion(userId)
                });
            }
        };

        const ensureWorkspaceMembership = async (id: string) => {
            const wsRef = doc(db, 'workspaces', id);
            const wsSnap = await getDoc(wsRef);
            const members = wsSnap.exists() ? wsSnap.data().members || [] : [];
            const alreadyMember = members.some((m: any) => (m?.userId || m) === userId);
            if (!alreadyMember) {
                await updateDoc(wsRef, {
                    members: arrayUnion({ userId, username: usernameForUser, email: emailForUser, role: 'member', joinedAt: Timestamp.now() }),
                    memberIds: arrayUnion(userId)
                });
            }
        };

        // If contract specifies a project, add user to project
        if (projectId) {
            try {
                await EnhancedProjectService.addMember(projectId, {
                    userId,
                    username: usernameForUser,
                    email: emailForUser,
                    role: roleForUser === 'owner' || roleForUser === 'admin' || roleForUser === 'supervisor' ? 'supervisor' : 'member'
                });
                // Verify membership and enforce if missing
                await ensureProjectMembership(projectId);
            } catch (err) {
                console.error('Failed to add member via project service for contract', contractId, err);

                // Fallback: append member shape directly if service failed (keeps data consistent)
                try {
                    await ensureProjectMembership(projectId);
                } catch (fallbackErr) {
                    console.error('Project membership fallback failed for contract', contractId, fallbackErr);
                }
            }

            // Ensure project chat membership (team chat). Create chat if missing.
            try {
                let chat = await ChatService.getConversationByContextId(projectId, 'project');
                if (!chat) {
                    try {
                        const project = await EnhancedProjectService.getProject(projectId);
                        const title = project?.title || 'Project Chat';
                        const createdBy = contract.fromUserId;
                        const newChatId = await ChatService.createConversation({
                            type: 'project',
                            title,
                            description: `Official chat for project: ${title}`,
                            projectId,
                            workspaceId: project?.workspaceId,
                            createdBy,
                            participants: [
                                { userId: createdBy, username: contract.fromUsername || 'Owner', role: 'admin' }
                            ]
                        });
                        chat = { id: newChatId } as any;
                    } catch (createErr) {
                        console.error('Failed to create missing project chat for contract', contractId, createErr);
                    }
                }
                if (chat?.id) {
                    await ChatService.addMember(chat.id, {
                        userId,
                        username: usernameForUser,
                        role: roleForUser === 'owner' || roleForUser === 'admin' ? 'admin' : 'member'
                    });
                }
            } catch (err) {
                console.error('Failed to sync project chat membership for contract', contractId, err);
            }
        }

        // If contract specifies a workspace, add user to workspace
        if (workspaceId) {
            try {
                await WorkspaceService.addMember(workspaceId, {
                    userId,
                    username: usernameForUser,
                    email: emailForUser,
                    role: roleForUser === 'owner' || roleForUser === 'admin' ? 'admin' : 'member'
                });
                await ensureWorkspaceMembership(workspaceId);
            } catch (err) {
                console.error('Failed to add workspace member for contract', contractId, err);
                // Fallback: direct write membership if service update fails
                try {
                    await ensureWorkspaceMembership(workspaceId);
                } catch (fallbackErr) {
                    console.error('Workspace membership fallback failed for contract', contractId, fallbackErr);
                }
            }

            try {
                let chat = await ChatService.getConversationByContextId(workspaceId, 'workspace');
                if (!chat) {
                    try {
                        const workspace = await WorkspaceService.getWorkspace(workspaceId);
                        const title = workspace?.name || 'Workspace Chat';
                        const createdBy = contract.fromUserId;
                        const newChatId = await ChatService.createConversation({
                            type: 'workspace',
                            title,
                            description: `Official chat for workspace: ${title}`,
                            workspaceId,
                            createdBy,
                            participants: [
                                { userId: createdBy, username: contract.fromUsername || 'Owner', role: 'admin' }
                            ]
                        });
                        chat = { id: newChatId } as any;
                    } catch (createErr) {
                        console.error('Failed to create missing workspace chat for contract', contractId, createErr);
                    }
                }
                if (chat?.id) {
                    await ChatService.addMember(chat.id, {
                        userId,
                        username: usernameForUser,
                        role: roleForUser === 'owner' || roleForUser === 'admin' ? 'admin' : 'member'
                    });
                }
            } catch (err) {
                console.error('Failed to sync workspace chat membership for contract', contractId, err);
            }
        }

        // Add user to explicitly linked/team chat when provided
        if (linkedChatId) {
            try {
                await ChatService.addMember(linkedChatId, {
                    userId,
                    username: usernameForUser,
                    role: roleForUser === 'owner' || roleForUser === 'admin' ? 'admin' : 'member'
                });
            } catch (err) {
                console.error('Failed to sync linked chat membership for contract', contractId, err);
            }
        }

        // Reassign task to the signer when contract links to a task
        if (taskId) {
            try {
                const task = await TaskService.getTask(taskId);
                if (task) {
                    if (task.assigneeId !== userId) {
                        await TaskService.reassignTask(taskId, userId, usernameForUser);
                    }
                    if (task.status === 'todo') {
                        await TaskService.updateTaskStatus(taskId, 'in-progress');
                    }
                }
            } catch (err) {
                console.error('Failed to sync task assignment for contract', contractId, err);
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

        await this.appendAudit(contractId, {
            by: userId,
            action: 'access_granted',
            details: 'Membership and chat access provisioned'
        });
    },

    /**
     * Add collaboration hooks (project membership, chat, calendar stubs)
     */
    async syncCollaboration(contractId: string, userId: string, username: string, contract: any): Promise<void> {
        const terms = contract.terms || {};
        const startDate = terms.startDate || terms.contractDate;
        const endDate = terms.endDate || terms.dueDate;

        // Project membership via enhanced service (idempotent)
        let projectId = terms.projectId || terms.linkedProjectId;
        let workspaceId = terms.workspaceId || terms.linkedWorkspaceId;
        const taskId = terms.taskId || terms.linkedTaskId || contract.relatedTaskId;
        // Infer from task if missing
        if ((!projectId || !workspaceId) && taskId) {
            try {
                const t = await TaskService.getTask(taskId);
                if (t) {
                    projectId = projectId || t.projectId;
                    workspaceId = workspaceId || t.workspaceId;
                }
            } catch (inferErr) {
                console.error('Failed to infer project/workspace from task in syncCollaboration', taskId, inferErr);
            }
        }
        if (projectId) {
            try {
                const project = await EnhancedProjectService.getProject(projectId);
                if (project && !project.members?.some((m: any) => m.userId === userId)) {
                    await EnhancedProjectService.addMember(projectId, {
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
        if (workspaceId) {
            try {
                await WorkspaceService.addMember(workspaceId, {
                    userId,
                    username,
                    email: contract.toUserEmail || '',
                    role: 'member'
                });
            } catch (err) {
                console.error('Failed to sync workspace membership for contract', contractId, err);
            }
        }

        // Calendar/meetings sync so both parties see contract timeline in their calendars
        if (startDate || endDate) {
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

                if (startDate) {
                    const parsed = new Date(startDate);
                    if (!isNaN(parsed.getTime())) {
                        meetingPayloads.push({
                            title: `${contract.title || 'Contract'} kickoff`,
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
                            title: `${contract.title || 'Contract'} due`,
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

        // Escrow is ONLY for ownership/assignment contracts, not simple member invites.
        const roleForUser = terms.roles?.find((r: any) => r.userId === contract?.toUserId)?.role || terms.projectRole;
        const isOwnershipInvite = roleForUser && ['owner', 'admin', 'supervisor'].includes(roleForUser);
        const isAssignmentType = terms.contractType === 'project_assignment' || terms.contractType === 'workspace_assignment';
        if (!isOwnershipInvite || !isAssignmentType) {
            await this.appendAudit(contractId, {
                by: contract.fromUserId,
                action: 'escrow_skipped_not_owner_assignment',
                details: 'Escrow skipped because this is a member/participant invite (not ownership assignment).'
            });
            return;
        }

        // Amount/currency constraints
        const amount = terms.paymentAmount || terms.projectBudget || terms.totalCost || terms.budgetAmount;
        const currency = terms.paymentCurrency || terms.totalCurrency || terms.currency || terms.budgetCurrency || 'GMD';
        if (!amount || amount <= 0) {
            await this.appendAudit(contractId, {
                by: contract.fromUserId,
                action: 'escrow_skipped_no_amount',
                details: 'Escrow skipped: no positive amount found for ownership assignment.'
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
