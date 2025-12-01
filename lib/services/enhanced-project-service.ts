import { db } from '@/lib/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    addDoc,
    serverTimestamp,
    orderBy,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { Project, ProjectMember } from '@/lib/types/workspace.types';

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
        const project: Omit<Project, 'id'> = {
            status: 'planning',
            supervisors: [],
            members: [
                {
                    userId: data.ownerId,
                    username: data.ownerUsername,
                    email: '',
                    role: 'owner',
                    assignedAt: serverTimestamp()
                }
            ],
            recurringType: data.recurringType || 'none',
            pricing: undefined,
            isPublic: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            ...data
        };

        const docRef = await addDoc(collection(db, 'projects'), project);
        return docRef.id;
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
        // This is a simplified query - in production, you might need a separate collection
        // for project members to efficiently query
        const allProjects = await getDocs(collection(db, 'projects'));

        return allProjects.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Project))
            .filter(project =>
                project.ownerId !== userId &&
                project.assignedOwnerId !== userId &&
                project.members.some(m => m.userId === userId)
            );
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
     * Add supervisor to project
     */
    async addSupervisor(projectId: string, userId: string): Promise<void> {
        await updateDoc(doc(db, 'projects', projectId), {
            supervisors: arrayUnion(userId),
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Remove supervisor from project
     */
    async removeSupervisor(projectId: string, userId: string): Promise<void> {
        await updateDoc(doc(db, 'projects', projectId), {
            supervisors: arrayRemove(userId),
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
        }
    ): Promise<void> {
        const projectMember: ProjectMember = {
            ...member,
            assignedAt: serverTimestamp()
        };

        await updateDoc(doc(db, 'projects', projectId), {
            members: arrayUnion(projectMember),
            updatedAt: serverTimestamp()
        });
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

        return project.ownerId === userId || project.assignedOwnerId === userId;
    },

    /**
     * Check if user is supervisor in project
     */
    async isSupervisor(projectId: string, userId: string): Promise<boolean> {
        const project = await this.getProject(projectId);
        if (!project) return false;

        return project.supervisors.includes(userId);
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
    }
};
