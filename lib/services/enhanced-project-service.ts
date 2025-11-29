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
        const projectData: Omit<Project, 'id'> = {
            ...data,
            status: 'planning',
            supervisors: [],
            members: [{
                userId: data.ownerId,
                username: data.ownerUsername,
                email: '', // Will be filled from user profile
                role: 'owner',
                assignedAt: serverTimestamp()
            }],
            recurringType: data.recurringType || 'none',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'projects'), projectData);
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
    }
};
