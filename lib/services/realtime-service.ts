/**
 * Realtime Service Bridge
 * 
 * This file bridges the new Teams chat components to the existing ChatService.
 * It provides the exact function signatures the new components expect.
 */

import { db, storage } from '@/lib/firebase';
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
    onSnapshot,
    limit,
    arrayUnion,
    Timestamp,
    deleteField
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ProfileService } from '@/lib/services/profile-service';
import { MessageNotificationHelper } from '@/lib/services/notification-helpers';

// ============================================================================
// TYPE EXPORTS - Re-export from chat.types for component compatibility
// ============================================================================
export type { Conversation, Message, MessageType, ConversationMember, MessageAttachment } from '@/lib/types/chat.types';
export type { ExtendedUserProfile } from '@/lib/types/profile.types';
export type { WorkspaceMember, ProjectMember } from '@/lib/types/workspace.types';

import type { Conversation, Message, MessageType, ConversationMember, MessageAttachment } from '@/lib/types/chat.types';
import type { ExtendedUserProfile } from '@/lib/types/profile.types';

// ============================================================================
// EXTENDED PARTICIPANT INFO - For rich profile display
// ============================================================================
export interface ParticipantInfo {
    id: string;
    displayName: string;
    username: string;
    photoURL: string;
    connectMail?: string;
    // Workspace context
    workspaceRole?: 'owner' | 'admin' | 'member';
    workspaceType?: 'employee' | 'freelancer';
    jobTitle?: string;
    workspaceName?: string;
    // Project context (if applicable)
    projectRole?: 'owner' | 'supervisor' | 'member';
    // General
    isOnline?: boolean;
    lastSeen?: any;
}

// ============================================================================
// CONVERSATION WITH RICH PARTICIPANT DATA
// ============================================================================
export interface EnrichedConversation extends Conversation {
    enrichedParticipants?: Record<string, ParticipantInfo>;
}

// ============================================================================
// USER PRESENCE
// ============================================================================
export const RealtimeService = {
    setUserOnlineStatus(uid: string, isOnline: boolean) {
        // Update user's lastSeen in their profile
        const userRef = doc(db, 'users', uid);
        updateDoc(userRef, {
            isOnline,
            lastSeen: serverTimestamp()
        }).catch(console.error);
    }
};

// ============================================================================
// CONVERSATION FUNCTIONS
// ============================================================================

/**
 * Listen to user's conversations with real-time updates
 */
export function listenToConversations(
    userId: string,
    callback: (conversations: EnrichedConversation[]) => void
): () => void {
    const q = query(
        collection(db, 'conversations'),
        where('members', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, async (snapshot) => {
        const conversations: EnrichedConversation[] = [];

        for (const docSnap of snapshot.docs) {
            const conv = {
                id: docSnap.id,
                ...docSnap.data()
            } as EnrichedConversation;

            // Enrich with full participant data
            conv.enrichedParticipants = {};
            for (const memberId of conv.members) {
                const profile = await ProfileService.getUserProfile(memberId);
                if (profile) {
                    conv.enrichedParticipants[memberId] = {
                        id: memberId,
                        displayName: profile.displayName || profile.username,
                        username: profile.username,
                        photoURL: profile.photoURL || '/default-avatar.png',
                        connectMail: profile.connectMail,
                        isOnline: (profile as any).isOnline,
                        lastSeen: (profile as any).lastSeen
                    };
                }
            }

            conversations.push(conv);
        }

        callback(conversations);
    });
}

/**
 * Get conversations once (non-realtime)
 */
export async function getConversations(userId: string): Promise<EnrichedConversation[]> {
    const q = query(
        collection(db, 'conversations'),
        where('members', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const conversations: EnrichedConversation[] = [];

    for (const docSnap of snapshot.docs) {
        const conv = {
            id: docSnap.id,
            ...docSnap.data()
        } as EnrichedConversation;

        // Enrich with full participant data
        conv.enrichedParticipants = {};
        for (const memberId of conv.members) {
            const profile = await ProfileService.getUserProfile(memberId);
            if (profile) {
                conv.enrichedParticipants[memberId] = {
                    id: memberId,
                    displayName: profile.displayName || profile.username,
                    username: profile.username,
                    photoURL: profile.photoURL || '/default-avatar.png',
                    connectMail: profile.connectMail,
                    isOnline: (profile as any).isOnline,
                    lastSeen: (profile as any).lastSeen
                };
            }
        }

        conversations.push(conv);
    }

    return conversations;
}

/**
 * Get a single conversation by ID
 */
export async function getConversationById(conversationId: string): Promise<EnrichedConversation | null> {
    const docRef = doc(db, 'conversations', conversationId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const conv = {
        id: docSnap.id,
        ...docSnap.data()
    } as EnrichedConversation;

    // Enrich with full participant data
    conv.enrichedParticipants = {};
    for (const memberId of conv.members) {
        const profile = await ProfileService.getUserProfile(memberId);
        if (profile) {
            conv.enrichedParticipants[memberId] = {
                id: memberId,
                displayName: profile.displayName || profile.username,
                username: profile.username,
                photoURL: profile.photoURL || '/default-avatar.png',
                connectMail: profile.connectMail,
                isOnline: (profile as any).isOnline,
                lastSeen: (profile as any).lastSeen
            };
        }
    }

    return conv;
}

/**
 * Get or create a direct conversation between two users
 */
export async function getOrCreateConversation(
    user1Id: string,
    user2Id: string,
    user1Name: string,
    user2Name: string,
    user1Photo: string,
    user2Photo: string
): Promise<string> {
    // Check for existing direct conversation
    const q = query(
        collection(db, 'conversations'),
        where('type', '==', 'direct'),
        where('members', 'array-contains', user1Id)
    );

    const snapshot = await getDocs(q);
    const existing = snapshot.docs.find(doc => {
        const data = doc.data() as Conversation;
        return data.members.includes(user2Id);
    });

    if (existing) return existing.id;

    // Create new conversation
    const memberDetails: Record<string, ConversationMember> = {
        [user1Id]: {
            userId: user1Id,
            username: user1Name,
            avatarUrl: user1Photo,
            role: 'member',
            joinedAt: Timestamp.now()
        },
        [user2Id]: {
            userId: user2Id,
            username: user2Name,
            avatarUrl: user2Photo,
            role: 'member',
            joinedAt: Timestamp.now()
        }
    };

    const conversation: Omit<Conversation, 'id'> = {
        type: 'direct',
        members: [user1Id, user2Id],
        memberDetails,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user1Id
    };

    const docRef = await addDoc(collection(db, 'conversations'), conversation);
    return docRef.id;
}

/**
 * Create a group conversation
 */
export async function createGroupConversation(data: {
    name: string;
    memberIds: string[];
    createdBy: string;
    photoUrl?: string;
    description?: string;
}): Promise<string> {
    // Fetch all member details
    const memberDetails: Record<string, ConversationMember> = {};

    for (const memberId of data.memberIds) {
        const profile = await ProfileService.getUserProfile(memberId);
        if (profile) {
            memberDetails[memberId] = {
                userId: memberId,
                username: profile.username,
                avatarUrl: profile.photoURL,
                role: memberId === data.createdBy ? 'admin' : 'member',
                joinedAt: Timestamp.now()
            };
        }
    }

    const conversation: Omit<Conversation, 'id'> = {
        type: 'group',
        title: data.name,
        description: data.description,
        photoUrl: data.photoUrl,
        members: data.memberIds,
        memberDetails,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: data.createdBy
    };

    const docRef = await addDoc(collection(db, 'conversations'), conversation);
    return docRef.id;
}

// ============================================================================
// MESSAGE FUNCTIONS
// ============================================================================

/**
 * Listen to messages in a conversation
 */
export function listenToMessages(
    conversationId: string,
    callback: (messages: Message[]) => void
): () => void {
    const q = query(
        collection(db, 'conversations', conversationId, 'messages'),
        orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Message));
        callback(messages);
    });
}

/**
 * Send a message
 */
export async function sendMessage(data: {
    conversationId: string;
    senderId: string;
    senderUsername: string;
    senderAvatarUrl?: string;
    content: string;
    type: MessageType;
    attachments?: File[];
    attachmentMetadata?: { type: 'image' | 'video' | 'audio' | 'file' }[];
    replyToId?: string;
}): Promise<string> {
    const { conversationId, attachments, attachmentMetadata, ...messageData } = data;

    const uploadedAttachments: MessageAttachment[] = [];

    // Handle file uploads if any
    if (attachments && attachments.length > 0 && attachmentMetadata) {
        for (let i = 0; i < attachments.length; i++) {
            const file = attachments[i];
            const meta = attachmentMetadata[i];
            const path = `chat/${conversationId}/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, path);

            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            uploadedAttachments.push({
                type: meta.type,
                url,
                name: file.name,
                size: file.size,
                mimeType: file.type
            });
        }
    }

    // Build message without undefined fields (Firebase doesn't accept undefined)
    const message: Omit<Message, 'id'> = {
        conversationId,
        senderId: data.senderId,
        senderUsername: data.senderUsername,
        content: data.content,
        type: data.type,
        attachments: uploadedAttachments,
        readBy: [data.senderId],
        createdAt: serverTimestamp(),
        isDeleted: false,
        isEdited: false,
        // Only include optional fields if they have values
        ...(data.senderAvatarUrl ? { senderAvatarUrl: data.senderAvatarUrl } : {}),
        ...(data.replyToId ? { replyToId: data.replyToId } : {})
    };

    const docRef = await addDoc(
        collection(db, 'conversations', conversationId, 'messages'),
        message
    );

    // Update conversation's last message
    await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: {
            content: message.type === 'text' ? message.content : `Sent a ${message.type}`,
            senderId: message.senderId,
            senderUsername: message.senderUsername,
            sentAt: serverTimestamp(),
            type: message.type
        },
        updatedAt: serverTimestamp()
    });

    // Send notifications to other participants
    try {
        const convRef = doc(db, 'conversations', conversationId);
        const convSnap = await getDoc(convRef);

        if (convSnap.exists()) {
            const convData = convSnap.data() as Conversation;
            const otherMembers = convData.members.filter(m => m !== data.senderId);

            // Get sender display name from profile
            const senderProfile = await ProfileService.getUserProfile(data.senderId);
            const senderName = senderProfile?.displayName || data.senderUsername;

            // Send notification to each other member
            for (const memberId of otherMembers) {
                await MessageNotificationHelper.notifyNewMessage(
                    memberId,
                    conversationId,
                    convData.type === 'group' ? 'group' : 'direct',
                    docRef.id,
                    data.senderId,
                    data.senderUsername,
                    senderName,
                    data.content,
                    data.senderAvatarUrl,
                    convData.title
                );
            }
        }
    } catch (error) {
        console.error('Error sending message notifications:', error);
    }

    return docRef.id;
}

/**
 * Forward a message to another conversation
 */
export async function forwardMessage(
    originalMessage: Message,
    targetConversationId: string,
    senderId: string,
    senderUsername: string,
    senderAvatarUrl?: string
): Promise<string> {
    const forwardedMessage: Omit<Message, 'id'> = {
        conversationId: targetConversationId,
        senderId,
        senderUsername,
        senderAvatarUrl,
        content: originalMessage.content,
        type: originalMessage.type,
        attachments: originalMessage.attachments,
        readBy: [senderId],
        createdAt: serverTimestamp(),
        isDeleted: false,
        isEdited: false
    };

    const docRef = await addDoc(
        collection(db, 'conversations', targetConversationId, 'messages'),
        forwardedMessage
    );

    // Update conversation's last message
    await updateDoc(doc(db, 'conversations', targetConversationId), {
        lastMessage: {
            content: forwardedMessage.type === 'text' ? forwardedMessage.content : `Sent a ${forwardedMessage.type}`,
            senderId: forwardedMessage.senderId,
            senderUsername: forwardedMessage.senderUsername,
            sentAt: serverTimestamp(),
            type: forwardedMessage.type
        },
        updatedAt: serverTimestamp()
    });

    return docRef.id;
}

/**
 * Delete a message (soft delete)
 */
export async function deleteMessage(
    conversationId: string,
    messageId: string
): Promise<void> {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    await updateDoc(messageRef, {
        isDeleted: true,
        content: 'This message was deleted',
        attachments: [],
        updatedAt: serverTimestamp()
    });
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
    conversationId: string,
    userId: string,
    messageIds: string[]
): Promise<void> {
    // Update member's lastReadAt in conversation
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
        [`memberDetails.${userId}.lastReadAt`]: serverTimestamp()
    });

    // Optionally update individual messages' readBy arrays
    for (const messageId of messageIds) {
        const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
        await updateDoc(messageRef, {
            readBy: arrayUnion(userId)
        }).catch(() => { }); // Ignore errors for individual messages
    }
}

// ============================================================================
// BLOCKING & MODERATION
// ============================================================================

/**
 * Block a user in a conversation
 */
export async function blockUserInConversation(
    conversationId: string,
    blockerId: string,
    blockedUserId?: string
): Promise<void> {
    const conversationRef = doc(db, 'conversations', conversationId);
    const convSnap = await getDoc(conversationRef);

    if (!convSnap.exists()) return;

    const conv = convSnap.data() as Conversation;

    // For direct convos, find the other user
    const targetUserId = blockedUserId || conv.members.find(id => id !== blockerId);
    if (!targetUserId) return;

    // Add to blocked list (stored in user's document or conversation)
    await updateDoc(conversationRef, {
        [`blockedBy.${blockerId}`]: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
}

/**
 * Unblock a user in a conversation
 */
export async function unblockUserInConversation(
    conversationId: string,
    unblockerId: string
): Promise<void> {
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
        [`blockedBy.${unblockerId}`]: deleteField(),
        updatedAt: serverTimestamp()
    });
}

// ============================================================================
// WORKSPACE/PROJECT CONTEXT ENRICHMENT
// ============================================================================

/**
 * Enrich participant with workspace context
 */
export async function enrichParticipantWithWorkspaceContext(
    userId: string,
    workspaceId: string
): Promise<ParticipantInfo | null> {
    const profile = await ProfileService.getUserProfile(userId);
    if (!profile) return null;

    const info: ParticipantInfo = {
        id: userId,
        displayName: profile.displayName || profile.username,
        username: profile.username,
        photoURL: profile.photoURL || '/default-avatar.png',
        connectMail: profile.connectMail
    };

    // Fetch workspace to get member role
    const wsRef = doc(db, 'workspaces', workspaceId);
    const wsSnap = await getDoc(wsRef);

    if (wsSnap.exists()) {
        const wsData = wsSnap.data();
        const member = wsData.members?.find((m: any) => m.userId === userId);

        if (member) {
            info.workspaceRole = member.role; // 'owner' | 'admin' | 'member'
            info.workspaceType = member.type; // 'employee' | 'freelancer'
            info.jobTitle = member.jobTitle;
            info.workspaceName = wsData.name;
        }
    }

    return info;
}

/**
 * Search users for starting new conversations
 */
export async function searchUsers(
    queryText: string,
    currentUserId: string,
    limitCount: number = 20
): Promise<ParticipantInfo[]> {
    if (queryText.length < 2) return [];

    // Simple client-side search (for production, use Algolia/Typesense)
    const usersRef = collection(db, 'users');
    const q = query(usersRef, limit(50));
    const snapshot = await getDocs(q);

    const results: ParticipantInfo[] = [];
    const lowerQuery = queryText.toLowerCase();

    for (const docSnap of snapshot.docs) {
        if (docSnap.id === currentUserId) continue;

        const data = docSnap.data();
        const matchesName = data.displayName?.toLowerCase().includes(lowerQuery);
        const matchesUsername = data.username?.toLowerCase().includes(lowerQuery);
        const matchesEmail = data.email?.toLowerCase().includes(lowerQuery);

        if (matchesName || matchesUsername || matchesEmail) {
            results.push({
                id: docSnap.id,
                displayName: data.displayName || data.username,
                username: data.username,
                photoURL: data.photoURL || data.profileImage || '/default-avatar.png',
                connectMail: data.connectMail
            });

            if (results.length >= limitCount) break;
        }
    }

    return results;
}

/**
 * Get unread message count for a user across all conversations
 */
export async function getUnreadCount(userId: string): Promise<number> {
    const conversations = await getConversations(userId);
    let totalUnread = 0;

    for (const conv of conversations) {
        const memberDetail = conv.memberDetails?.[userId];
        const lastReadAt = memberDetail?.lastReadAt;

        if (conv.lastMessage && lastReadAt) {
            const lastMessageTime = conv.lastMessage.sentAt?.toMillis?.() || 0;
            const lastReadTime = lastReadAt?.toMillis?.() || 0;

            if (lastMessageTime > lastReadTime && conv.lastMessage.senderId !== userId) {
                totalUnread++;
            }
        } else if (conv.lastMessage && conv.lastMessage.senderId !== userId) {
            totalUnread++;
        }
    }

    return totalUnread;
}

// ============================================================================
// STATUS/STORIES FUNCTIONS
// ============================================================================

export interface UserStatus {
    id: string;
    userId: string;
    userName: string;
    userPhoto: string;
    content: string;
    type: 'text' | 'image' | 'video';
    background?: string; // For text statuses (gradient class)
    viewers: string[];
    createdAt: any;
    expiresAt: any;
}

/**
 * Listen to active statuses (stories that haven't expired)
 */
export function listenToStatuses(callback: (statuses: UserStatus[]) => void): () => void {
    const now = new Date();
    const q = query(
        collection(db, 'statuses'),
        where('expiresAt', '>', now),
        orderBy('expiresAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const statuses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as UserStatus));
        callback(statuses);
    });
}

/**
 * Add a new status (expires after 24 hours)
 */
export async function addStatus(
    userId: string,
    userName: string,
    userPhoto: string,
    content: string,
    type: 'text' | 'image' | 'video',
    background?: string
): Promise<string> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const status: Omit<UserStatus, 'id'> = {
        userId,
        userName,
        userPhoto,
        content,
        type,
        background,
        viewers: [],
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt)
    };

    const docRef = await addDoc(collection(db, 'statuses'), status);
    return docRef.id;
}

/**
 * Mark status as viewed
 */
export async function viewStatus(statusId: string, viewerId: string): Promise<void> {
    const statusRef = doc(db, 'statuses', statusId);
    await updateDoc(statusRef, {
        viewers: arrayUnion(viewerId)
    });
}

// ============================================================================
// FILE UPLOAD HELPERS
// ============================================================================

/**
 * Upload image to Firebase Storage
 */
export async function uploadImage(file: File, path: string): Promise<string> {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `${path}/${fileName}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
}

/**
 * Upload video to Firebase Storage
 */
export async function uploadVideo(file: File, path: string): Promise<string> {
    return uploadImage(file, path); // Same logic, different path convention
}

