/**
 * Chat Group Service
 * 
 * Manages workspace and project group conversations.
 * Provides functions to create, manage, and sync group chats
 * with their associated workspaces and projects.
 */

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
    arrayUnion,
    arrayRemove,
    Timestamp
} from 'firebase/firestore';
import { ProfileService } from '@/lib/services/profile-service';
import type { Conversation, ConversationMember, ConversationType } from '@/lib/types/chat.types';

// ============================================================================
// WORKSPACE GROUP CONVERSATIONS
// ============================================================================

/**
 * Get or create a workspace group conversation
 * Called when a workspace is created or when accessing its chat
 */
export async function getOrCreateWorkspaceConversation(
    workspaceId: string,
    ownerId: string,
    workspaceName: string,
    workspaceDescription?: string
): Promise<string> {
    // Check if workspace conversation already exists
    const q = query(
        collection(db, 'conversations'),
        where('type', '==', 'workspace'),
        where('workspaceId', '==', workspaceId)
    );

    const snapshot = await getDocs(q);
    if (snapshot.docs.length > 0) {
        return snapshot.docs[0].id;
    }

    // Fetch owner profile
    const ownerProfile = await ProfileService.getUserProfile(ownerId);
    const ownerName = ownerProfile?.displayName || ownerProfile?.username || 'Owner';
    const ownerPhoto = ownerProfile?.photoURL || '/default-avatar.png';

    // Create member details for owner
    const memberDetails: Record<string, ConversationMember> = {
        [ownerId]: {
            userId: ownerId,
            username: ownerName,
            avatarUrl: ownerPhoto,
            role: 'admin',
            joinedAt: Timestamp.now()
        }
    };

    // Create the workspace conversation
    const conversation: Omit<Conversation, 'id'> = {
        type: 'workspace' as ConversationType,
        title: workspaceName,
        description: workspaceDescription,
        workspaceId: workspaceId,
        members: [ownerId],
        memberDetails,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: ownerId
    };

    const docRef = await addDoc(collection(db, 'conversations'), conversation);
    return docRef.id;
}

/**
 * Add a member to workspace group conversation
 * Called when a member is added to a workspace
 */
export async function addMemberToWorkspaceConversation(
    workspaceId: string,
    userId: string
): Promise<void> {
    // Find the workspace conversation
    const q = query(
        collection(db, 'conversations'),
        where('type', '==', 'workspace'),
        where('workspaceId', '==', workspaceId)
    );

    const snapshot = await getDocs(q);
    if (snapshot.docs.length === 0) return;

    const convDoc = snapshot.docs[0];
    const convId = convDoc.id;

    // Check if user is already a member
    const convData = convDoc.data() as Conversation;
    if (convData.members.includes(userId)) return;

    // Fetch user profile
    const profile = await ProfileService.getUserProfile(userId);
    const userName = profile?.displayName || profile?.username || 'User';
    const userPhoto = profile?.photoURL || '/default-avatar.png';

    // Add member to conversation
    const convRef = doc(db, 'conversations', convId);
    await updateDoc(convRef, {
        members: arrayUnion(userId),
        [`memberDetails.${userId}`]: {
            userId,
            username: userName,
            avatarUrl: userPhoto,
            role: 'member',
            joinedAt: Timestamp.now()
        },
        updatedAt: serverTimestamp()
    });
}

/**
 * Remove a member from workspace group conversation
 * Called when a member is removed from a workspace
 */
export async function removeMemberFromWorkspaceConversation(
    workspaceId: string,
    userId: string
): Promise<void> {
    // Find the workspace conversation
    const q = query(
        collection(db, 'conversations'),
        where('type', '==', 'workspace'),
        where('workspaceId', '==', workspaceId)
    );

    const snapshot = await getDocs(q);
    if (snapshot.docs.length === 0) return;

    const convDoc = snapshot.docs[0];
    const convId = convDoc.id;

    // Remove member from conversation
    const convRef = doc(db, 'conversations', convId);
    await updateDoc(convRef, {
        members: arrayRemove(userId),
        updatedAt: serverTimestamp()
    });

    // Note: memberDetails entry remains for message history attribution
}

// ============================================================================
// PROJECT GROUP CONVERSATIONS
// ============================================================================

/**
 * Get or create a project group conversation
 * Called when a project is created or when accessing its chat
 */
export async function getOrCreateProjectConversation(
    projectId: string,
    workspaceId: string,
    ownerId: string,
    projectTitle: string,
    coverImage?: string,
    projectDescription?: string
): Promise<string> {
    // Check if project conversation already exists
    const q = query(
        collection(db, 'conversations'),
        where('type', '==', 'project'),
        where('projectId', '==', projectId)
    );

    const snapshot = await getDocs(q);
    if (snapshot.docs.length > 0) {
        return snapshot.docs[0].id;
    }

    // Fetch owner profile
    const ownerProfile = await ProfileService.getUserProfile(ownerId);
    const ownerName = ownerProfile?.displayName || ownerProfile?.username || 'Owner';
    const ownerPhoto = ownerProfile?.photoURL || '/default-avatar.png';

    // Create member details for owner
    const memberDetails: Record<string, ConversationMember> = {
        [ownerId]: {
            userId: ownerId,
            username: ownerName,
            avatarUrl: ownerPhoto,
            role: 'admin',
            joinedAt: Timestamp.now()
        }
    };

    // Create the project conversation
    const conversation: Omit<Conversation, 'id'> = {
        type: 'project' as ConversationType,
        title: projectTitle,
        description: projectDescription,
        photoUrl: coverImage,
        projectId: projectId,
        workspaceId: workspaceId,
        members: [ownerId],
        memberDetails,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: ownerId
    };

    const docRef = await addDoc(collection(db, 'conversations'), conversation);
    return docRef.id;
}

/**
 * Add a member to project group conversation
 * Called when a member is added to a project
 */
export async function addMemberToProjectConversation(
    projectId: string,
    userId: string
): Promise<void> {
    // Find the project conversation
    const q = query(
        collection(db, 'conversations'),
        where('type', '==', 'project'),
        where('projectId', '==', projectId)
    );

    const snapshot = await getDocs(q);
    if (snapshot.docs.length === 0) return;

    const convDoc = snapshot.docs[0];
    const convId = convDoc.id;

    // Check if user is already a member
    const convData = convDoc.data() as Conversation;
    if (convData.members.includes(userId)) return;

    // Fetch user profile
    const profile = await ProfileService.getUserProfile(userId);
    const userName = profile?.displayName || profile?.username || 'User';
    const userPhoto = profile?.photoURL || '/default-avatar.png';

    // Add member to conversation
    const convRef = doc(db, 'conversations', convId);
    await updateDoc(convRef, {
        members: arrayUnion(userId),
        [`memberDetails.${userId}`]: {
            userId,
            username: userName,
            avatarUrl: userPhoto,
            role: 'member',
            joinedAt: Timestamp.now()
        },
        updatedAt: serverTimestamp()
    });
}

/**
 * Remove a member from project group conversation
 * Called when a member is removed from a project
 */
export async function removeMemberFromProjectConversation(
    projectId: string,
    userId: string
): Promise<void> {
    // Find the project conversation
    const q = query(
        collection(db, 'conversations'),
        where('type', '==', 'project'),
        where('projectId', '==', projectId)
    );

    const snapshot = await getDocs(q);
    if (snapshot.docs.length === 0) return;

    const convDoc = snapshot.docs[0];
    const convId = convDoc.id;

    // Remove member from conversation
    const convRef = doc(db, 'conversations', convId);
    await updateDoc(convRef, {
        members: arrayRemove(userId),
        updatedAt: serverTimestamp()
    });
}

/**
 * Update project conversation metadata
 * Called when project details change (title, cover image, etc.)
 */
export async function updateProjectConversationMetadata(
    projectId: string,
    updates: {
        title?: string;
        coverImage?: string;
        description?: string;
    }
): Promise<void> {
    // Find the project conversation
    const q = query(
        collection(db, 'conversations'),
        where('type', '==', 'project'),
        where('projectId', '==', projectId)
    );

    const snapshot = await getDocs(q);
    if (snapshot.docs.length === 0) return;

    const convRef = doc(db, 'conversations', snapshot.docs[0].id);

    const updateData: any = { updatedAt: serverTimestamp() };
    if (updates.title) updateData.title = updates.title;
    if (updates.coverImage) updateData.photoUrl = updates.coverImage;
    if (updates.description) updateData.description = updates.description;

    await updateDoc(convRef, updateData);
}

/**
 * Update workspace conversation metadata
 * Called when workspace details change
 */
export async function updateWorkspaceConversationMetadata(
    workspaceId: string,
    updates: {
        name?: string;
        description?: string;
    }
): Promise<void> {
    // Find the workspace conversation
    const q = query(
        collection(db, 'conversations'),
        where('type', '==', 'workspace'),
        where('workspaceId', '==', workspaceId)
    );

    const snapshot = await getDocs(q);
    if (snapshot.docs.length === 0) return;

    const convRef = doc(db, 'conversations', snapshot.docs[0].id);

    const updateData: any = { updatedAt: serverTimestamp() };
    if (updates.name) updateData.title = updates.name;
    if (updates.description) updateData.description = updates.description;

    await updateDoc(convRef, updateData);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get conversation by workspace ID
 */
export async function getWorkspaceConversation(workspaceId: string): Promise<Conversation | null> {
    const q = query(
        collection(db, 'conversations'),
        where('type', '==', 'workspace'),
        where('workspaceId', '==', workspaceId)
    );

    const snapshot = await getDocs(q);
    if (snapshot.docs.length === 0) return null;

    return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
    } as Conversation;
}

/**
 * Get conversation by project ID
 */
export async function getProjectConversation(projectId: string): Promise<Conversation | null> {
    const q = query(
        collection(db, 'conversations'),
        where('type', '==', 'project'),
        where('projectId', '==', projectId)
    );

    const snapshot = await getDocs(q);
    if (snapshot.docs.length === 0) return null;

    return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
    } as Conversation;
}

// Export as ChatGroupService object for consistent API
export const ChatGroupService = {
    // Workspace
    getOrCreateWorkspaceConversation,
    addMemberToWorkspaceConversation,
    removeMemberFromWorkspaceConversation,
    updateWorkspaceConversationMetadata,
    getWorkspaceConversation,

    // Project
    getOrCreateProjectConversation,
    addMemberToProjectConversation,
    removeMemberFromProjectConversation,
    updateProjectConversationMetadata,
    getProjectConversation
};
