/**
 * ============================================================================
 * CONNEKT LEGAL FRAMEWORK - ENFORCEMENT
 * ============================================================================
 * 
 * Rule engine for contract enforcement. Executes actions based on contract type.
 * Called automatically by LegalLifecycle - UI doesn't trigger enforcement directly.
 * 
 * @module legal.enforcement
 */

import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';

import { LegalRegistry } from './legal.registry';
import { LegalEscrow } from './legal.escrow';
import { WorkspaceService } from './workspace-service';
import { EnhancedProjectService } from './enhanced-project-service';
import { TaskService } from './task-service';
import { NotificationService } from './notification-service';

import type {
    LegalDocument,
    LegalServiceResponse,
    EnforcementResult,
    MemberRole
} from './legal.types';

import {
    LEGAL_DOCUMENT_TYPES,
    WORKSPACE_ACCESS_TYPES,
    PROJECT_ACCESS_TYPES,
    TASK_ACCESS_TYPES,
    PROPOSAL_TYPES,
    CONTRACT_MEMBER_TYPE_MAP,
    AUDIT_ACTIONS,
    ESCROW_REQUIRED_TYPES
} from './legal.constants';

// ============================================================================
// ENFORCEMENT SERVICE
// ============================================================================

export const LegalEnforcement = {
    // ========================================================================
    // MAIN ENFORCEMENT ENTRY POINTS
    // ========================================================================

    /**
     * Execute enforcement rules when contract is signed
     * This is the central dispatcher for all contract types
     */
    async enforceOnSign(contract: LegalDocument): Promise<LegalServiceResponse<EnforcementResult[]>> {
        const results: EnforcementResult[] = [];
        const contractType = contract.type;
        const terms = contract.terms;

        console.log(`[LegalEnforcement] Enforcing on sign: ${contract.id} (${contractType})`);

        try {
            // Skip enforcement for proposals
            if (PROPOSAL_TYPES.includes(contractType)) {
                console.log(`[LegalEnforcement] Skipping enforcement for proposal type: ${contractType}`);
                return { success: true, data: results };
            }

            // 1. Handle Escrow (if required)
            if (this.requiresEscrow(contract)) {
                const escrowResult = await this.executeEscrowHold(contract);
                results.push(escrowResult);
            }

            // 2. Handle Access Grants based on contract type
            switch (contractType) {
                // Employment contracts
                case LEGAL_DOCUMENT_TYPES.JOB:
                case LEGAL_DOCUMENT_TYPES.JOB_SHORT_TERM:
                case LEGAL_DOCUMENT_TYPES.JOB_LONG_TERM:
                    results.push(await this.onJobContract(contract));
                    break;

                // Freelance/Project contracts
                case LEGAL_DOCUMENT_TYPES.FREELANCE:
                case LEGAL_DOCUMENT_TYPES.PROJECT:
                    results.push(await this.onFreelanceContract(contract));
                    break;

                // Project Admin (Temporal Ownership)
                case LEGAL_DOCUMENT_TYPES.PROJECT_ADMIN:
                    results.push(await this.onProjectAdminContract(contract));
                    break;

                // Task contracts
                case LEGAL_DOCUMENT_TYPES.TASK:
                case LEGAL_DOCUMENT_TYPES.TASK_ASSIGNMENT:
                    results.push(await this.onTaskContract(contract));
                    break;

                // Task Admin
                case LEGAL_DOCUMENT_TYPES.TASK_ADMIN:
                    results.push(await this.onTaskAdminContract(contract));
                    break;

                // Invitations
                case LEGAL_DOCUMENT_TYPES.WORKSPACE_INVITE:
                    results.push(await this.onWorkspaceInvite(contract));
                    break;

                case LEGAL_DOCUMENT_TYPES.PROJECT_ASSIGNMENT:
                    results.push(await this.onProjectAssignment(contract));
                    break;

                default:
                    console.log(`[LegalEnforcement] No specific enforcement for type: ${contractType}`);
            }

            // 3. Send notifications
            await this.notifyContractSigned(contract);

            return { success: true, data: results };
        } catch (error) {
            console.error('[LegalEnforcement.enforceOnSign] Failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Enforcement failed'
            };
        }
    },

    /**
     * Execute enforcement rules when contract is completed
     */
    async enforceOnComplete(contract: LegalDocument): Promise<LegalServiceResponse> {
        console.log(`[LegalEnforcement] Enforcing on complete: ${contract.id}`);

        try {
            // Release any remaining escrow
            const escrowResult = await this.releaseContractEscrow(contract);

            // Revoke temporary access if applicable
            if (contract.type === LEGAL_DOCUMENT_TYPES.PROJECT_ADMIN) {
                await this.revokeProjectAdminAccess(contract);
            }
            if (contract.type === LEGAL_DOCUMENT_TYPES.TASK_ADMIN) {
                await this.revokeTaskAdminAccess(contract);
            }

            return { success: true };
        } catch (error) {
            console.error('[LegalEnforcement.enforceOnComplete] Failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Completion enforcement failed'
            };
        }
    },

    /**
     * Execute enforcement rules when contract is terminated
     */
    async enforceOnTerminate(
        contract: LegalDocument,
        terminatedBy: string,
        reason: string
    ): Promise<LegalServiceResponse> {
        console.log(`[LegalEnforcement] Enforcing on terminate: ${contract.id}`);

        try {
            // Refund escrow if appropriate
            if (this.shouldRefundOnTermination(contract, terminatedBy)) {
                await LegalEscrow.refund(
                    contract.id!,
                    this.getEscrowType(contract),
                    terminatedBy,
                    reason
                );
            }

            // Revoke any granted access
            await this.revokeAllAccess(contract);

            return { success: true };
        } catch (error) {
            console.error('[LegalEnforcement.enforceOnTerminate] Failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Termination enforcement failed'
            };
        }
    },

    // ========================================================================
    // PROOF OF WORK PROCESSING
    // ========================================================================

    /**
     * Process Approved Proof of Task (POT)
     * Releases task escrow and updates task status
     */
    async processAPP_POT(taskId: string, contractId: string, clientId: string): Promise<LegalServiceResponse> {
        console.log(`[LegalEnforcement] Processing POT approval: task=${taskId}, contract=${contractId}`);

        try {
            // Release task escrow
            await LegalEscrow.release(contractId, 'task_admin', clientId);

            // Update task via TaskService (marks as completed)
            const taskRef = doc(db, 'tasks', taskId);
            await updateDoc(taskRef, {
                status: 'completed',
                completedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // Add audit
            await LegalRegistry.addAudit(contractId, {
                by: clientId,
                action: AUDIT_ACTIONS.POT_APPROVED,
                details: 'Proof of Task approved - payment released',
                meta: { taskId }
            });

            // Notify recipient
            const contractResult = await LegalRegistry.getById(contractId);
            if (contractResult.success && contractResult.data) {
                const contract = contractResult.data;
                await NotificationService.createNotification(
                    contract.toUserId,
                    'pot',
                    'Task Approved - Payment Released',
                    `Your work on task has been approved! Payment has been released.`,
                    'high',
                    {
                        type: 'pot',
                        taskId,
                        action: 'approved',
                        validatedBy: clientId
                    } as any
                );
            }

            return { success: true, message: 'POT approved and payment released' };
        } catch (error) {
            console.error('[LegalEnforcement.processAPP_POT] Failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to process POT approval'
            };
        }
    },

    /**
     * Process Approved Proof of Project Completion (POP)
     * Releases project admin escrow, calculates profit, and updates project status
     */
    async processAPP_POP(projectId: string, contractId: string, clientId: string): Promise<LegalServiceResponse> {
        console.log(`[LegalEnforcement] Processing POP approval: project=${projectId}, contract=${contractId}`);

        try {
            const contractResult = await LegalRegistry.getById(contractId);
            if (!contractResult.success || !contractResult.data) {
                throw new Error('Contract not found');
            }

            const contract = contractResult.data;
            const budget = contract.terms.projectBudget || contract.terms.paymentAmount || 0;

            // Calculate how much admin spent on tasks (for profit calculation)
            const tasksQuery = query(
                collection(db, 'tasks'),
                where('projectId', '==', projectId)
            );
            const tasksSnap = await getDocs(tasksQuery);
            const totalSpentOnTasks = tasksSnap.docs.reduce((sum, doc) => {
                const task = doc.data();
                return sum + (task.pricing?.amount || 0);
            }, 0);

            const adminProfit = budget - totalSpentOnTasks;
            console.log(`[LegalEnforcement] POP: Budget=${budget}, Spent=${totalSpentOnTasks}, Admin Profit=${adminProfit}`);

            // Release FULL project budget to admin
            // Task payments are already handled when each task's POT is approved
            await LegalEscrow.release(contractId, 'project_admin', clientId);

            // Revoke admin access (project returns to original owner)
            await this.revokeProjectAdminAccess(contract);

            // Update project status
            await EnhancedProjectService.updateStatus(projectId, 'completed');

            // Add audit
            await LegalRegistry.addAudit(contractId, {
                by: clientId,
                action: AUDIT_ACTIONS.POP_APPROVED,
                details: `POP approved - Budget: ${budget}, Spent: ${totalSpentOnTasks}, Profit: ${adminProfit}`,
                meta: { projectId, budget, totalSpentOnTasks, adminProfit }
            });

            // Notify admin with profit details
            const profitMessage = adminProfit > 0
                ? `Your Proof of Completion was approved! Budget: ${budget}, Tasks spent: ${totalSpentOnTasks}, Your profit: ${adminProfit}`
                : `Your Proof of Completion was approved. Payment of ${budget} has been released.`;

            await NotificationService.createNotification(
                contract.toUserId,
                'pot',
                'POP Approved - Payment Released',
                profitMessage,
                'high',
                {
                    type: 'pot',
                    taskId: '',
                    taskTitle: '',
                    projectId: projectId,
                    action: 'approved',
                    validatedBy: clientId,
                    budget,
                    spent: totalSpentOnTasks,
                    profit: adminProfit
                } as any
            );

            return { success: true, message: 'POP approved and payment released' };
        } catch (error) {
            console.error('[LegalEnforcement.processAPP_POP] Failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to process POP approval'
            };
        }
    },

    // ========================================================================
    // CONTRACT TYPE HANDLERS
    // ========================================================================

    /**
     * Job/Employment contract enforcement
     * - Add to workspace only (not project-scoped)
     * - Initialize salary escrow
     */
    async onJobContract(contract: LegalDocument): Promise<EnforcementResult> {
        const terms = contract.terms;
        const workspaceId = terms.workspaceId;

        try {
            // Add employee to workspace
            if (workspaceId) {
                await WorkspaceService.addMember(workspaceId, {
                    userId: contract.toUserId,
                    username: contract.toUsername,
                    email: contract.toMailAddress,
                    role: this.mapRole(terms.projectRole),
                    type: 'employee',
                    jobTitle: terms.jobTitle || ''
                });
                console.log(`[LegalEnforcement] Added employee ${contract.toUsername} to workspace ${workspaceId}`);
            }

            // Initialize salary escrow
            if (terms.requireSalaryEscrow && terms.salaryAmount) {
                await LegalEscrow.holdSalary(contract);
            }

            await LegalRegistry.addAudit(contract.id!, {
                by: 'system',
                action: AUDIT_ACTIONS.ACCESS_GRANTED,
                details: 'Employee added to workspace',
                meta: { workspaceId, memberType: 'employee' }
            });

            return { success: true, action: 'job_contract_enforced' };
        } catch (error) {
            console.error('[LegalEnforcement.onJobContract] Failed:', error);
            return {
                success: false,
                action: 'job_contract_enforcement_failed',
                error: error instanceof Error ? error.message : 'Failed'
            };
        }
    },

    /**
     * Freelance contract enforcement
     * - Add to project ONLY (not workspace)
     */
    async onFreelanceContract(contract: LegalDocument): Promise<EnforcementResult> {
        const terms = contract.terms;
        const projectId = terms.projectId;

        try {
            // Add freelancer to project ONLY (isolated from workspace)
            if (projectId) {
                await EnhancedProjectService.addMember(projectId, {
                    userId: contract.toUserId,
                    username: contract.toUsername,
                    email: contract.toMailAddress,
                    role: this.mapRole(terms.projectRole) || 'member',
                    type: 'freelancer',
                    jobTitle: terms.jobTitle || ''
                });
                console.log(`[LegalEnforcement] Added freelancer ${contract.toUsername} to project ${projectId}`);
            }

            await LegalRegistry.addAudit(contract.id!, {
                by: 'system',
                action: AUDIT_ACTIONS.ACCESS_GRANTED,
                details: 'Freelancer added to project (project-scoped only)',
                meta: { projectId, memberType: 'freelancer' }
            });

            return { success: true, action: 'freelance_contract_enforced' };
        } catch (error) {
            console.error('[LegalEnforcement.onFreelanceContract] Failed:', error);
            return {
                success: false,
                action: 'freelance_contract_enforcement_failed',
                error: error instanceof Error ? error.message : 'Failed'
            };
        }
    },

    /**
     * Project Admin (Temporal Ownership) enforcement
     * - Hold project budget in escrow
     * - Transfer project ownership
     */
    async onProjectAdminContract(contract: LegalDocument): Promise<EnforcementResult> {
        const terms = contract.terms;
        const projectId = terms.projectId;

        try {
            // Hold budget in escrow
            await LegalEscrow.holdProjectAdminBudget(contract);

            // Transfer project ownership
            if (projectId) {
                await EnhancedProjectService.reassignProject(
                    projectId,
                    contract.toUserId,
                    contract.toUsername
                );
                console.log(`[LegalEnforcement] Project ${projectId} reassigned to ${contract.toUsername}`);
            }

            await LegalRegistry.addAudit(contract.id!, {
                by: 'system',
                action: AUDIT_ACTIONS.ACCESS_GRANTED,
                details: 'Project admin access granted (temporal ownership)',
                meta: { projectId, adminId: contract.toUserId }
            });

            return { success: true, action: 'project_admin_enforced' };
        } catch (error) {
            console.error('[LegalEnforcement.onProjectAdminContract] Failed:', error);
            return {
                success: false,
                action: 'project_admin_enforcement_failed',
                error: error instanceof Error ? error.message : 'Failed'
            };
        }
    },

    /**
     * Task contract enforcement
     * - Add to project (if not already member)
     * - Assign task
     */
    async onTaskContract(contract: LegalDocument): Promise<EnforcementResult> {
        const terms = contract.terms;
        const taskId = terms.taskId;
        const projectId = terms.projectId;

        try {
            // Add to project if specified
            if (projectId) {
                try {
                    await EnhancedProjectService.addMember(projectId, {
                        userId: contract.toUserId,
                        username: contract.toUsername,
                        email: contract.toMailAddress,
                        role: 'member',
                        type: 'freelancer',
                        jobTitle: ''
                    });
                } catch (e) {
                    // May already be a member
                    console.log('[LegalEnforcement] User may already be project member');
                }
            }

            // Assign task
            if (taskId) {
                const taskRef = doc(db, 'tasks', taskId);
                await updateDoc(taskRef, {
                    assigneeId: contract.toUserId,
                    assigneeUsername: contract.toUsername,
                    status: 'in-progress',
                    updatedAt: serverTimestamp()
                });
                console.log(`[LegalEnforcement] Task ${taskId} assigned to ${contract.toUsername}`);
            }

            await LegalRegistry.addAudit(contract.id!, {
                by: 'system',
                action: AUDIT_ACTIONS.ACCESS_GRANTED,
                details: 'Task assigned',
                meta: { taskId, projectId }
            });

            return { success: true, action: 'task_contract_enforced' };
        } catch (error) {
            console.error('[LegalEnforcement.onTaskContract] Failed:', error);
            return {
                success: false,
                action: 'task_contract_enforcement_failed',
                error: error instanceof Error ? error.message : 'Failed'
            };
        }
    },

    /**
     * Task Admin enforcement
     * - Hold task payment in escrow
     * - Grant task admin access
     */
    async onTaskAdminContract(contract: LegalDocument): Promise<EnforcementResult> {
        const terms = contract.terms;
        const taskId = terms.taskId;

        try {
            // Hold payment in escrow
            await LegalEscrow.holdTaskAdminPayment(contract);

            // Assign task admin
            if (taskId) {
                const taskRef = doc(db, 'tasks', taskId);
                await updateDoc(taskRef, {
                    adminId: contract.toUserId,
                    adminUsername: contract.toUsername,
                    status: 'assigned',
                    updatedAt: serverTimestamp()
                });
            }

            await LegalRegistry.addAudit(contract.id!, {
                by: 'system',
                action: AUDIT_ACTIONS.ACCESS_GRANTED,
                details: 'Task admin access granted',
                meta: { taskId }
            });

            return { success: true, action: 'task_admin_enforced' };
        } catch (error) {
            console.error('[LegalEnforcement.onTaskAdminContract] Failed:', error);
            return {
                success: false,
                action: 'task_admin_enforcement_failed',
                error: error instanceof Error ? error.message : 'Failed'
            };
        }
    },

    /**
     * Workspace invite enforcement
     */
    async onWorkspaceInvite(contract: LegalDocument): Promise<EnforcementResult> {
        const terms = contract.terms;
        const workspaceId = terms.workspaceId;

        try {
            if (workspaceId) {
                await WorkspaceService.addMember(workspaceId, {
                    userId: contract.toUserId,
                    username: contract.toUsername,
                    email: contract.toMailAddress,
                    role: this.mapRole(terms.projectRole) || 'member',
                    type: terms.memberType || 'employee',
                    jobTitle: terms.jobTitle || ''
                });
            }

            return { success: true, action: 'workspace_invite_enforced' };
        } catch (error) {
            return {
                success: false,
                action: 'workspace_invite_enforcement_failed',
                error: error instanceof Error ? error.message : 'Failed'
            };
        }
    },

    /**
     * Project assignment enforcement
     */
    async onProjectAssignment(contract: LegalDocument): Promise<EnforcementResult> {
        const terms = contract.terms;
        const projectId = terms.projectId;

        try {
            if (projectId) {
                await EnhancedProjectService.addMember(projectId, {
                    userId: contract.toUserId,
                    username: contract.toUsername,
                    email: contract.toMailAddress,
                    role: this.mapRole(terms.projectRole) || 'member',
                    type: terms.memberType || 'freelancer',
                    jobTitle: terms.jobTitle || ''
                });
            }

            return { success: true, action: 'project_assignment_enforced' };
        } catch (error) {
            return {
                success: false,
                action: 'project_assignment_enforcement_failed',
                error: error instanceof Error ? error.message : 'Failed'
            };
        }
    },

    // ========================================================================
    // ESCROW HELPERS
    // ========================================================================

    /**
     * Check if contract requires escrow
     */
    requiresEscrow(contract: LegalDocument): boolean {
        // Check by type
        if (ESCROW_REQUIRED_TYPES.includes(contract.type)) {
            return true;
        }

        // Check by terms
        const terms = contract.terms;
        if (terms.requireWalletFunding || terms.requireEscrow) {
            return true;
        }

        return false;
    },

    /**
     * Execute escrow hold based on contract type
     */
    async executeEscrowHold(contract: LegalDocument): Promise<EnforcementResult> {
        const type = contract.type;

        try {
            if (type === LEGAL_DOCUMENT_TYPES.PROJECT_ADMIN) {
                await LegalEscrow.holdProjectAdminBudget(contract);
            } else if (type === LEGAL_DOCUMENT_TYPES.TASK_ADMIN) {
                await LegalEscrow.holdTaskAdminPayment(contract);
            } else if (type.startsWith('job')) {
                await LegalEscrow.holdSalary(contract);
            } else {
                // Generic escrow for other types
                const amount = contract.terms.paymentAmount || contract.terms.totalAmount || 0;
                if (amount > 0) {
                    await LegalEscrow.hold({
                        contractId: contract.id!,
                        amount,
                        fromUserId: contract.fromUserId,
                        toUserId: contract.toUserId,
                        escrowType: 'contract',
                        currency: contract.terms.paymentCurrency
                    });
                }
            }

            return { success: true, action: 'escrow_held' };
        } catch (error) {
            return {
                success: false,
                action: 'escrow_hold_failed',
                error: error instanceof Error ? error.message : 'Failed to hold escrow'
            };
        }
    },

    /**
     * Release contract escrow
     */
    async releaseContractEscrow(contract: LegalDocument): Promise<LegalServiceResponse> {
        return LegalEscrow.release(contract.id!, this.getEscrowType(contract), 'system');
    },

    /**
     * Get escrow type based on contract type
     */
    getEscrowType(contract: LegalDocument): 'contract' | 'salary' | 'project_admin' | 'task_admin' {
        switch (contract.type) {
            case LEGAL_DOCUMENT_TYPES.PROJECT_ADMIN:
                return 'project_admin';
            case LEGAL_DOCUMENT_TYPES.TASK_ADMIN:
                return 'task_admin';
            case LEGAL_DOCUMENT_TYPES.JOB:
            case LEGAL_DOCUMENT_TYPES.JOB_SHORT_TERM:
            case LEGAL_DOCUMENT_TYPES.JOB_LONG_TERM:
                return 'salary';
            default:
                return 'contract';
        }
    },

    /**
     * Determine if escrow should be refunded on termination
     */
    shouldRefundOnTermination(contract: LegalDocument, terminatedBy: string): boolean {
        // If terminated by sender (employer), refund goes back to sender
        // If terminated by recipient, depends on terms
        return terminatedBy === contract.fromUserId;
    },

    // ========================================================================
    // ACCESS REVOCATION
    // ========================================================================

    /**
     * Revoke all access granted by a contract
     */
    async revokeAllAccess(contract: LegalDocument): Promise<void> {
        if (contract.type === LEGAL_DOCUMENT_TYPES.PROJECT_ADMIN) {
            await this.revokeProjectAdminAccess(contract);
        } else if (contract.type === LEGAL_DOCUMENT_TYPES.TASK_ADMIN) {
            await this.revokeTaskAdminAccess(contract);
        }
        // Add more revocation logic as needed
    },

    /**
     * Revoke project admin access
     */
    async revokeProjectAdminAccess(contract: LegalDocument): Promise<void> {
        const projectId = contract.terms.projectId;
        if (!projectId) return;

        try {
            // Revert to original owner
            await EnhancedProjectService.reassignProject(
                projectId,
                contract.fromUserId,
                contract.fromUsername
            );
            console.log(`[LegalEnforcement] Project ${projectId} returned to ${contract.fromUsername}`);
        } catch (error) {
            console.error('[LegalEnforcement.revokeProjectAdminAccess] Failed:', error);
        }
    },

    /**
     * Revoke task admin access
     */
    async revokeTaskAdminAccess(contract: LegalDocument): Promise<void> {
        const taskId = contract.terms.taskId;
        if (!taskId) return;

        try {
            const taskRef = doc(db, 'tasks', taskId);
            await updateDoc(taskRef, {
                adminId: null,
                adminUsername: null,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('[LegalEnforcement.revokeTaskAdminAccess] Failed:', error);
        }
    },

    // ========================================================================
    // HELPERS
    // ========================================================================

    /**
     * Map role string to MemberRole
     */
    mapRole(role?: string): MemberRole {
        const roleMap: Record<string, MemberRole> = {
            'owner': 'owner',
            'admin': 'admin',
            'supervisor': 'supervisor',
            'member': 'member'
        };
        return roleMap[role || 'member'] || 'member';
    },

    /**
     * Send notification when contract is signed
     */
    async notifyContractSigned(contract: LegalDocument): Promise<void> {
        try {
            await NotificationService.createNotification(
                contract.fromUserId,
                'contract',
                'Contract Signed',
                `${contract.toUsername} has signed "${contract.title}"`,
                'high',
                {
                    type: 'contract_signed',
                    contractId: contract.id,
                    contractTitle: contract.title,
                    signedBy: contract.toUserId,
                    signedByName: contract.toUsername
                } as any
            );
        } catch (error) {
            console.error('[LegalEnforcement.notifyContractSigned] Failed:', error);
        }
    }
};
