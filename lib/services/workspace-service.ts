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
import { ChatService } from './chat-service';

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
                type: 'employee', // Owner is always an employee
                joinedAt: Timestamp.now()
            }],
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'workspaces'), workspaceData);

        // Create Workspace Chat
        try {
            await ChatService.createConversation({
                type: 'workspace',
                title: data.name,
                description: `Official chat for workspace: ${data.name}`,
                workspaceId: docRef.id,
                createdBy: data.ownerId,
                participants: [{
                    userId: data.ownerId,
                    username: data.ownerUsername,
                    role: 'admin'
                }]
            });
        } catch (error) {
            console.error('Failed to create workspace chat:', error);
        }

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
        // Prefer memberIds array if present; fallback to scanning
        const byMemberId = query(
            collection(db, 'workspaces'),
            where('memberIds', 'array-contains', userId),
            where('isActive', '==', true),
            orderBy('createdAt', 'desc')
        );

        let snapshot = await getDocs(byMemberId);

        // If no results (older docs without memberIds), scan all active workspaces and filter
        if (snapshot.empty) {
            const all = await getDocs(
                query(collection(db, 'workspaces'), where('isActive', '==', true))
            );
            const filtered = all.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Workspace))
                .filter(w => w.members?.some(m => m.userId === userId));
            return filtered.filter(w => w.ownerId !== userId);
        }

        const workspaces = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Workspace));

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
            type: 'employee' | 'freelancer'; // NEW
            jobTitle?: string; // NEW
            settings?: { blockedProjectIds?: string[] }; // NEW
        }
    ): Promise<void> {
        const workspaceMember: WorkspaceMember = {
            userId: member.userId,
            username: member.username,
            email: member.email,
            role: member.role,
            type: member.type,
            joinedAt: Timestamp.now()
        };

        if (member.jobTitle) {
            workspaceMember.jobTitle = member.jobTitle;
        }

        if (member.settings) {
            workspaceMember.settings = member.settings;
        }

        await updateDoc(doc(db, 'workspaces', workspaceId), {
            members: arrayUnion(workspaceMember),
            memberIds: arrayUnion(member.userId),
            updatedAt: serverTimestamp()
        });

        // Add to Workspace Chat
        try {
            const chat = await ChatService.getConversationByContextId(workspaceId, 'workspace');
            if (chat) {
                await ChatService.addMember(chat.id, {
                    userId: member.userId,
                    username: member.username,
                    role: member.role === 'admin' ? 'admin' : 'member'
                });
            }
        } catch (error) {
            console.error('Failed to add member to workspace chat:', error);
        }
    },

    /**
     * Update a workspace member's details
     */
    async updateMember(
        workspaceId: string,
        userId: string,
        updates: {
            role?: 'owner' | 'admin' | 'member';
            type?: 'employee' | 'freelancer';
            jobTitle?: string;
            settings?: { blockedProjectIds?: string[] };
        }
    ): Promise<void> {
        const workspaceRef = doc(db, 'workspaces', workspaceId);
        const workspaceSnap = await getDoc(workspaceRef);

        if (!workspaceSnap.exists()) {
            throw new Error('Workspace not found');
        }

        const workspace = workspaceSnap.data() as Workspace;
        const members = workspace.members || [];
        const memberIndex = members.findIndex(m => m.userId === userId);

        if (memberIndex === -1) {
            throw new Error('Member not found');
        }

        // Update member fields
        const updatedMember = { ...members[memberIndex], ...updates };

        // Handle nested settings merge if needed
        if (updates.settings) {
            updatedMember.settings = { ...members[memberIndex].settings, ...updates.settings };
        }

        members[memberIndex] = updatedMember;

        await updateDoc(workspaceRef, { members });
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
