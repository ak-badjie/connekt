import { db } from '@/lib/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    addDoc,
    serverTimestamp,
    orderBy,
    Timestamp,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { Workspace, WorkspaceMember } from '@/lib/types/workspace.types';

export const WorkspaceService = {
    /**
     * Create a new workspace
     */
    async createWorkspace(data: {
        name: string;
        description: string;
        ownerId: string;
        ownerUsername: string;
        ownerEmail: string;
    }): Promise<string> {
        const workspaceData: Omit<Workspace, 'id'> = {
            name: data.name,
            description: data.description,
            ownerId: data.ownerId,
            ownerUsername: data.ownerUsername,
            members: [{
                userId: data.ownerId,
                username: data.ownerUsername,
                email: data.ownerEmail,
                role: 'owner',
                joinedAt: serverTimestamp()
            }],
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'workspaces'), workspaceData);
        return docRef.id;
    },

    /**
     * Get workspace by ID
     */
    async getWorkspace(workspaceId: string): Promise<Workspace | null> {
        const docRef = doc(db, 'workspaces', workspaceId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return null;

        return {
            id: docSnap.id,
            ...docSnap.data()
        } as Workspace;
    },

    /**
     * Get workspaces owned by user
     */
    async getUserWorkspaces(userId: string): Promise<Workspace[]> {
        const q = query(
            collection(db, 'workspaces'),
            where('ownerId', '==', userId),
            where('isActive', '==', true),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Workspace));
    },

    /**
     * Get workspaces where user is a member (but not owner)
     */
    async getWorkspacesMemberOf(userId: string): Promise<Workspace[]> {
        const q = query(
            collection(db, 'workspaces'),
            where('members', 'array-contains', { userId }),
            where('isActive', '==', true),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const workspaces = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Workspace));

        // Filter out workspaces where user is the owner
        return workspaces.filter(w => w.ownerId !== userId);
    },

    /**
     * Add member to workspace
     */
    async addMember(
        workspaceId: string,
        member: {
            userId: string;
            username: string;
            email: string;
            role: 'admin' | 'member';
        }
    ): Promise<void> {
        const workspaceMember: WorkspaceMember = {
            ...member,
            joinedAt: serverTimestamp()
        };

        await updateDoc(doc(db, 'workspaces', workspaceId), {
            members: arrayUnion(workspaceMember),
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Remove member from workspace
     */
    async removeMember(workspaceId: string, userId: string): Promise<void> {
        const workspace = await this.getWorkspace(workspaceId);
        if (!workspace) throw new Error('Workspace not found');

        const updatedMembers = workspace.members.filter(m => m.userId !== userId);

        await updateDoc(doc(db, 'workspaces', workspaceId), {
            members: updatedMembers,
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Update workspace details
     */
    async updateWorkspace(
        workspaceId: string,
        updates: Partial<Pick<Workspace, 'name' | 'description'>>
    ): Promise<void> {
        await updateDoc(doc(db, 'workspaces', workspaceId), {
            ...updates,
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Deactivate workspace (soft delete)
     */
    async deactivateWorkspace(workspaceId: string): Promise<void> {
        await updateDoc(doc(db, 'workspaces', workspaceId), {
            isActive: false,
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Check if user has access to workspace
     */
    async hasAccess(workspaceId: string, userId: string): Promise<boolean> {
        const workspace = await this.getWorkspace(workspaceId);
        if (!workspace) return false;

        return workspace.members.some(m => m.userId === userId);
    },

    /**
     * Get user's role in workspace
     */
    async getUserRole(workspaceId: string, userId: string): Promise<'owner' | 'admin' | 'member' | null> {
        const workspace = await this.getWorkspace(workspaceId);
        if (!workspace) return null;

        const member = workspace.members.find(m => m.userId === userId);
        return member?.role || null;
    },

    /**
     * Get all workspaces owned by an agency
     */
    async getAgencyWorkspaces(agencyId: string): Promise<Workspace[]> {
        const q = query(
            collection(db, 'workspaces'),
            where('ownerId', '==', agencyId),
            where('isActive', '==', true),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Workspace));
    }
};
