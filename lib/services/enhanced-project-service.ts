import { db } from '@/lib/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    setDoc,
    addDoc,
    serverTimestamp,
    orderBy,
    arrayUnion,
    arrayRemove,
    Timestamp
} from 'firebase/firestore';
import { Project, ProjectMember, Task } from '@/lib/types/workspace.types';
import { ChatService } from './chat-service';
import { TaskService } from './task-service';
import { WorkspaceService } from './workspace-service';
import { WalletService } from './wallet-service';

export const EnhancedProjectService = {
    /**
     * Create a new project
     */
    async createProject(data: {
        workspaceId: string;
        ownerId: string;
        ownerUsername: string;
        title: string;
        description: string;
        budget: number;
        deadline?: string;
        recurringType?: 'none' | 'daily' | 'weekly' | 'monthly';
    }): Promise<string> {
        // 1. Create potential Project ID first (for escrow reference)
        const projectRef = doc(collection(db, 'projects'));
        const projectId = projectRef.id;

        // 2. Prepare Project Data (Sanitize input to remove undefined)
        // 2. Prepare Project Data (Sanitize input to remove undefined)
        const sanitizedData = { ...data };
        Object.keys(sanitizedData).forEach(key => {
            if (sanitizedData[key as keyof typeof sanitizedData] === undefined) {
                delete sanitizedData[key as keyof typeof sanitizedData];
            }
        });

        const project: Project = {
            id: projectId,
            status: 'planning',
            supervisors: [],
            members: [
                {
                    userId: data.ownerId,
                    username: data.ownerUsername,
                    email: '',
                    role: 'owner',
                    type: 'employee', // Owner is always an employee
                    assignedAt: Timestamp.now()
                }
            ],
            recurringType: data.recurringType || 'none',
            isPublic: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            ...sanitizedData
        };

        // 3. Hold Funds in Escrow (if budget > 0)
        let escrowId = null;
        if (data.budget > 0) {
            try {
                // Determine wallet hold amount (Project Budget)
                escrowId = await WalletService.holdProjectFunds(
                    projectId,
                    data.ownerId,
                    data.budget
                );
            } catch (error) {
                console.error('Failed to hold project funds:', error);
                throw new Error('Insufficient funds to create project. Please top up your wallet.');
            }
        }

        // 4. Create Project Document
        try {
            await setDoc(projectRef, project);

            // 5. Create Project Chat
            try {
                await ChatService.createConversation({
                    type: 'project',
                    title: data.title,
                    description: `Official chat for project: ${data.title}`,
                    projectId: projectId,
                    workspaceId: data.workspaceId,
                    createdBy: data.ownerId,
                    participants: [{
                        userId: data.ownerId,
                        username: data.ownerUsername,
                        role: 'admin'
                    }]
                });
            } catch (error) {
                console.error('Failed to create project chat:', error);
                // Chat creation failure is non-critical, do not rollback project
            }
        } catch (error) {
            console.error('Failed to create project document:', error);
            // ROLLBACK: If funds were held, refund them
            if (escrowId) {
                console.log(`Rolling back escrow ${escrowId} due to project creation failure`);
                await WalletService.refundProjectEscrow(projectId, 'Project creation failed');
            }
            throw new Error('Failed to create project. Funds have been refunded.');
        }

        return projectId;
    },

    /**
     * Get project budget status
     */
    async getProjectBudgetStatus(projectId: string): Promise<{
        totalBudget: number;
        spent: number;
        remaining: number;
        currency?: string;
    }> {
        const project = await this.getProject(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        const tasks = await TaskService.getProjectTasks(projectId);

        // Calculate spent amount from all tasks
        const spent = tasks.reduce((sum, task) => {
            // Only count tasks if they match project budget currency (if project has currency)
            // Or count all if project has no specific currency
            if (project.pricing?.currency && task.pricing?.currency !== project.pricing.currency) {
                return sum;
            }
            return sum + (task.pricing?.amount || 0);
        }, 0);

        return {
            totalBudget: project.budget || 0,
            spent,
            remaining: (project.budget || 0) - spent,
            currency: project.pricing?.currency
        };
    },

    /**
     * Update project budget
     */
    async updateProjectBudget(projectId: string, newBudget: number): Promise<void> {
        await updateDoc(doc(db, 'projects', projectId), {
            budget: newBudget,
            updatedAt: serverTimestamp()
        });
    },

    async addSupervisor(projectId: string, userId: string): Promise<void> {
        await updateDoc(doc(db, 'projects', projectId), {
            supervisors: arrayUnion(userId),
            updatedAt: serverTimestamp()
        });
    },

    async removeSupervisor(projectId: string, userId: string): Promise<void> {
        await updateDoc(doc(db, 'projects', projectId), {
            supervisors: arrayRemove(userId),
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Get project by ID
     */
    async getProject(projectId: string): Promise<Project | null> {
        const docRef = doc(db, 'projects', projectId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return null;

        return {
            id: docSnap.id,
            ...docSnap.data()
        } as Project;
    },

    /**
     * Get projects owned by user
     */
    async getUserProjects(userId: string): Promise<Project[]> {
        const q = query(
            collection(db, 'projects'),
            where('ownerId', '==', userId),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Project));
    },

    /**
     * Get projects where user is assigned as owner (transferred ownership)
     */
    async getAssignedProjects(userId: string): Promise<Project[]> {
        const q = query(
            collection(db, 'projects'),
            where('assignedOwnerId', '==', userId),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Project));
    },

    /**
     * Get projects where user is a member (but not owner)
     */
    async getProjectsMemberOf(userId: string): Promise<Project[]> {
        const q = query(
            collection(db, 'projects'),
            where('memberIds', 'array-contains', userId),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Project))
            .filter(project => project.ownerId !== userId && project.assignedOwnerId !== userId);
    },

    /**
     * Get projects in a workspace
     */
    async getWorkspaceProjects(workspaceId: string): Promise<Project[]> {
        const q = query(
            collection(db, 'projects'),
            where('workspaceId', '==', workspaceId),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Project));
    },

    /**
     * Get projects in a workspace where user is a member/owner
     */
    async getWorkspaceProjectsForMember(workspaceId: string, userId: string): Promise<Project[]> {
        // 1. Get Workspace Member details to determine role (Employee vs Freelancer)
        const workspace = await WorkspaceService.getWorkspace(workspaceId);
        if (!workspace) return [];

        const member = workspace.members.find(m => m.userId === userId);

        let isEmployee = false;
        let blockedProjectIds: string[] = [];

        if (workspace.ownerId === userId) {
            isEmployee = true; // Owner is super-employee
        } else if (member) {
            // Treat existing members as employees if type is undefined (backward compatibility)
            if (member.type === 'employee' || !member.type) {
                isEmployee = true;
                blockedProjectIds = member.settings?.blockedProjectIds || [];
            }
        }

        if (isEmployee) {
            // Employees see all projects in workspace (except blocked ones)
            const q = query(
                collection(db, 'projects'),
                where('workspaceId', '==', workspaceId),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Project))
                .filter(p => !blockedProjectIds.includes(p.id!));
        } else {
            // Freelancers (or non-workspace members) see only assigned projects
            // Note: This query automatically handles strict isolation
            const q = query(
                collection(db, 'projects'),
                where('workspaceId', '==', workspaceId),
                where('memberIds', 'array-contains', userId),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
        }
    },

    /**
     * Reassign project to another user
     */
    async reassignProject(
        projectId: string,
        newOwnerId: string,
        newOwnerUsername: string
    ): Promise<void> {
        await updateDoc(doc(db, 'projects', projectId), {
            assignedOwnerId: newOwnerId,
            assignedOwnerUsername: newOwnerUsername,
            updatedAt: serverTimestamp()
        });
    },



    /**
     * Add member to project
     */
    async addMember(
        projectId: string,
        member: {
            userId: string;
            username: string;
            email: string;
            role: 'supervisor' | 'member';
            type: 'employee' | 'freelancer'; // NEW
        }
    ): Promise<void> {
        const projectMember: ProjectMember = {
            userId: member.userId,
            username: member.username,
            email: member.email,
            role: member.role,
            type: member.type,
            assignedAt: Timestamp.now()
        };

        await updateDoc(doc(db, 'projects', projectId), {
            members: arrayUnion(projectMember),
            memberIds: arrayUnion(member.userId),
            updatedAt: serverTimestamp()
        });

        // Add to Project Chat
        try {
            const chat = await ChatService.getConversationByContextId(projectId, 'project');
            if (chat) {
                await ChatService.addMember(chat.id, {
                    userId: member.userId,
                    username: member.username,
                    role: 'member'
                });
            }
        } catch (error) {
            console.error('Failed to add member to project chat:', error);
        }
    },

    /**
     * Remove member from project
     */
    async removeMember(projectId: string, userId: string): Promise<void> {
        const project = await this.getProject(projectId);
        if (!project) throw new Error('Project not found');

        // Remove from project members array
        const updatedMembers = project.members.filter(m => m.userId !== userId);

        await updateDoc(doc(db, 'projects', projectId), {
            members: updatedMembers,
            updatedAt: serverTimestamp()
        });

        // Remove from project chat
        try {
            const chat = await ChatService.getConversationByContextId(projectId, 'project');
            if (chat) {
                await ChatService.removeMember(chat.id, userId);
            }
        } catch (error) {
            console.error('Failed to remove member from project chat:', error);
        }
    },

    /**
     * Update project status
     */
    async updateStatus(
        projectId: string,
        status: Project['status']
    ): Promise<void> {
        await updateDoc(doc(db, 'projects', projectId), {
            status,
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Get project statistics
     */
    async getProjectStats(userId: string): Promise<{ owned: Project[]; assigned: Project[] }> {
        const [owned, assigned] = await Promise.all([
            EnhancedProjectService.getUserProjects(userId),
            EnhancedProjectService.getAssignedProjects(userId)
        ]);

        return { owned, assigned };
    },

    /**
     * Check if user has access to project
     */
    async hasAccess(projectId: string, userId: string): Promise<boolean> {
        const project = await this.getProject(projectId);
        if (!project) return false;

        return (
            project.ownerId === userId ||
            project.assignedOwnerId === userId ||
            project.members.some(m => m.userId === userId)
        );
    },

    /**
     * Check if user is owner or assigned owner of project
     */
    async isOwner(projectId: string, userId: string): Promise<boolean> {
        const project = await this.getProject(projectId);
        if (!project) return false;

        // 1. Primary Owner - Always has access
        if (project.ownerId === userId) return true;

        // 2. Assigned Owner (Temporal) - Check Expiry
        if (project.assignedOwnerId === userId) {
            try {
                // Find the active administration contract for this user and project
                const contractsRef = collection(db, 'mail_contracts');
                const q = query(
                    contractsRef,
                    where('type', '==', 'project_admin'),
                    where('relatedEntityId', '==', projectId),
                    where('toUserId', '==', userId),
                    where('status', '==', 'accepted')
                );

                const snapshot = await getDocs(q);
                if (snapshot.empty) {
                    // No active contract found, but user is assignedOwner? 
                    // This implies data inconsistency or expired/revoked but not cleaned up.
                    // Safe default: Deny access (or allowed if we trust assignedOwnerId more? Secure choice: Deny)
                    console.warn(`Temporal owner ${userId} has no active contract for project ${projectId}. Denying access.`);
                    return false;
                }

                // Check dates
                const contractData = snapshot.docs[0].data();
                const now = new Date();
                const validFrom = contractData.startDate ? new Date(contractData.startDate) : null;
                const validTo = contractData.endDate ? new Date(contractData.endDate) : null;

                if (validFrom && now < validFrom) return false; // Not started yet
                if (validTo && now > validTo) {
                    console.warn(`Temporal owner ${userId} contract expired on ${validTo}. Denying access.`);
                    return false; // Expired
                }

                return true;
            } catch (error) {
                console.error('Error checking contract validity:', error);
                return false; // Fail safe
            }
        }

        return false;
    },

    /**
     * Check if user is supervisor in project
     */
    async isSupervisor(projectId: string, userId: string): Promise<boolean> {
        const project = await this.getProject(projectId);
        if (!project) return false;

        return (
            project.ownerId === userId ||
            project.assignedOwnerId === userId ||
            (project.supervisors || []).includes(userId)
        );
    },

    /**
     * Get all projects for an agency (across all agency workspaces)
     */
    async getAgencyProjects(agencyId: string): Promise<Project[]> {
        // First get all workspaces owned by the agency
        const workspacesSnapshot = await getDocs(
            query(
                collection(db, 'workspaces'),
                where('ownerId', '==', agencyId)
            )
        );

        const workspaceIds = workspacesSnapshot.docs.map(doc => doc.id);

        if (workspaceIds.length === 0) return [];

        // Get all projects in these workspaces
        const allProjects: Project[] = [];
        for (const workspaceId of workspaceIds) {
            const projects = await this.getWorkspaceProjects(workspaceId);
            allProjects.push(...projects);
        }

        return allProjects;
    },

    /**
     * Get agency project statistics
     */
    async getAgencyProjectStats(agencyId: string) {
        const projects = await this.getAgencyProjects(agencyId);

        return {
            total: projects.length,
            active: projects.filter(p => p.status === 'active').length,
            completed: projects.filter(p => p.status === 'completed').length,
            planning: projects.filter(p => p.status === 'planning').length,
            onHold: projects.filter(p => p.status === 'on-hold').length
        };
    },


    /**
     * Update project details
     */
    async updateProject(projectId: string, data: Partial<Project>): Promise<void> {
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Update project budget
     */


    /**
     * Push project to public (Explore page)
     */
    async pushToPublic(projectId: string): Promise<void> {
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, {
            isPublic: true,
            publishedAt: serverTimestamp()
        });
    },

    /**
     * Remove project from public
     */
    async removeFromPublic(projectId: string): Promise<void> {
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, {
            isPublic: false,
            publishedAt: null
        });
    },

    /**
     * Get Project Members
     */
    async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
        const docRef = doc(db, 'projects', projectId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return [];

        const data = docSnap.data();
        return data.members || [];
    },


};
