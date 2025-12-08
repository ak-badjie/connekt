import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { Contract } from '@/lib/types/mail.types';
import { EnhancedProjectService } from './enhanced-project-service';
import { TaskService } from './task-service';
import { WalletService } from './wallet-service';
import { NotificationService } from './notification-service';

export const ContractEnforcementService = {
    /**
     * Grant access based on contract type
     */
    async grantAccess(contract: Contract): Promise<void> {
        console.log(`Granting access for contract ${contract.id} (${contract.type})`);

        if (contract.type === 'project_admin') {
            await this.grantProjectAdminAccess(contract);
        } else if (contract.type === 'task_admin') {
            await this.grantTaskAdminAccess(contract);
        }
    },

    /**
     * Revoke access and revert to original owner
     */
    async revokeAccess(contract: Contract): Promise<void> {
        console.log(`Revoking access for contract ${contract.id}`);

        if (contract.type === 'project_admin') {
            const projectId = contract.terms.projectId;
            if (!projectId) throw new Error('No projectId in contract terms');

            // Revert assignment (clear assigned owner)
            await updateDoc(doc(db, 'projects', projectId), {
                assignedOwnerId: null,
                assignedOwnerUsername: null,
                updatedAt: serverTimestamp()
            });

        } else if (contract.type === 'task_admin') {
            const taskId = contract.terms.taskId;
            if (!taskId) throw new Error('No taskId in contract terms');

            // Revert task admin
            await updateDoc(doc(db, 'tasks', taskId), {
                taskAdminId: null,
                updatedAt: serverTimestamp()
            });
        }
    },

    /**
     * Grant Temporal Ownership for Project Admin
     */
    async grantProjectAdminAccess(contract: Contract): Promise<void> {
        const projectId = contract.terms.projectId;
        const contractorId = contract.toUserId; // The Admin
        const contractorName = contract.toUsername;

        if (!projectId || !contractorId) {
            console.error('Missing details for project admin grant', { projectId, contractorId });
            return;
        }

        // Use core service to reassign
        await EnhancedProjectService.reassignProject(projectId, contractorId, contractorName);

        // Notify
        await NotificationService.createNotification(
            contractorId,
            'project', // Correct type
            'Project Access Granted',
            `You are now the Temporal Owner of ${contract.title}.`,
            'high',
            {
                type: 'project',
                projectId: projectId,
                projectTitle: contract.title,
                action: 'assigned',
                assignerId: 'system'
            }
        );
    },

    /**
     * Grant Totalitarian Access for Task Admin
     */
    async grantTaskAdminAccess(contract: Contract): Promise<void> {
        const taskId = contract.terms.taskId;
        const contractorId = contract.toUserId;

        if (!taskId || !contractorId) return;

        // Directly update task with taskAdminId (will be supported in schema)
        await updateDoc(doc(db, 'tasks', taskId), {
            taskAdminId: contractorId,
            updatedAt: serverTimestamp()
        });

        await NotificationService.createNotification(
            contractorId,
            'task', // Correct type
            'Task Access Granted',
            `You have Totalitarian Access to task: ${contract.title}.`,
            'high',
            {
                type: 'task',
                taskId: taskId,
                taskTitle: contract.title,
                projectId: contract.terms.projectId || '',
                action: 'assigned',
                assignerId: 'system'
            }
        );
    },

    /**
     * Process Proof of Project Completion (POP) Approval
     */
    async processAPP_POP(projectId: string, contractId: string, clientId: string): Promise<void> {
        // 1. Validate
        const contractRef = doc(db, 'mail_contracts', contractId); // Assuming collection name
        const contractSnap = await getDoc(contractRef);
        if (!contractSnap.exists()) throw new Error('Contract not found');

        const contract = { id: contractSnap.id, ...contractSnap.data() } as Contract;

        // 2. Transact: Release funds + Revoke Access
        // We'll call services sequentially for now as they isolate their own constraints
        try {
            await WalletService.releaseEscrow(contractId);
            await this.revokeAccess(contract);
            await EnhancedProjectService.updateStatus(projectId, 'completed');

            await NotificationService.createNotification(
                contract.toUserId,
                'pot', // Use 'pot' type or 'transaction'? 'pot' is for POP/POT, seems appropriate
                'POP Approved - Payment Released',
                'Your Proof of Completion was approved. Payment has been released.',
                'high',
                {
                    type: 'pot',
                    taskId: '', // Project has no Task ID
                    taskTitle: '',
                    projectId: projectId,
                    action: 'approved',
                    validatedBy: clientId
                }
            );

        } catch (error) {
            console.error('POP Processing Failed', error);
            throw new Error('Failed to process POP approval');
        }
    },

    /**
     * Process Proof of Task Completion (POT) Approval
     */
    async processAPP_POT(taskId: string, contractId: string, clientId: string): Promise<void> {
        // Similar flow for task
        const contractRef = doc(db, 'mail_contracts', contractId);
        const contractSnap = await getDoc(contractRef);
        if (!contractSnap.exists()) throw new Error('Contract not found');

        const contract = { id: contractSnap.id, ...contractSnap.data() } as Contract;

        try {
            await WalletService.releaseEscrow(contractId);
            await this.revokeAccess(contract);
            // Complete task
            await TaskService.updateTaskStatus(taskId, 'done');
            await updateDoc(doc(db, 'tasks', taskId), {
                status: 'paid', // Mark as paid and done
                updatedAt: serverTimestamp()
            });

            await NotificationService.createNotification(
                contract.toUserId,
                'pot',
                'POT Approved - Payment Released',
                'Your Proof of Task Completion was approved. Payment sent.',
                'high',
                {
                    type: 'pot',
                    taskId: taskId,
                    taskTitle: contract.title,
                    projectId: contract.terms.projectId || '',
                    action: 'approved',
                    validatedBy: clientId
                }
            );
        } catch (e) {
            console.error('POT Processing Failed', e);
            throw e;
        }
    }
};
