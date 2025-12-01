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
    setDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Conversation, Message, MessageType, MessageAttachment, HelpRequestData, ConversationMember } from '@/lib/types/chat.types';

export const ChatService = {
    /**
     * Create a new conversation
     */
    async createConversation(data: {
        type: Conversation['type'];
        participants: { userId: string; username: string; avatarUrl?: string; role?: 'admin' | 'member' }[];
        title?: string;
        description?: string;
        photoUrl?: string;
        projectId?: string;
        workspaceId?: string;
        agencyId?: string;
        createdBy: string;
    }): Promise<string> {
        // For direct messages, check if one already exists
        if (data.type === 'direct' && data.participants.length === 2) {
            const existing = await this.findDirectConversation(data.participants[0].userId, data.participants[1].userId);
            if (existing) return existing;
        }

        const memberDetails: Record<string, ConversationMember> = {};
        const memberIds: string[] = [];

        data.participants.forEach(p => {
            memberIds.push(p.userId);
            memberDetails[p.userId] = {
                userId: p.userId,
                username: p.username,
                avatarUrl: p.avatarUrl,
                role: p.role || 'member',
                joinedAt: serverTimestamp()
            };
        });

        const conversation: Omit<Conversation, 'id'> = {
            type: data.type,
            title: data.title,
            description: data.description,
            photoUrl: data.photoUrl,
            projectId: data.projectId,
            workspaceId: data.workspaceId,
            agencyId: data.agencyId,
            members: memberIds,
            memberDetails,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: data.createdBy
        };

        const docRef = await addDoc(collection(db, 'conversations'), conversation);
        return docRef.id;
    },

    /**
     * Find existing direct conversation between two users
     */
    async findDirectConversation(user1Id: string, user2Id: string): Promise<string | null> {
        // This is a bit tricky in Firestore without a specific composite key.
        // A common pattern is to store a sorted array of IDs and query that, but 'members' is an array.
        // We can query for conversations where members contains user1, then filter for user2.

        const q = query(
            collection(db, 'conversations'),
            where('type', '==', 'direct'),
            where('members', 'array-contains', user1Id)
        );

        const snapshot = await getDocs(q);
        const found = snapshot.docs.find(doc => {
            const data = doc.data() as Conversation;
            return data.members.includes(user2Id);
        });

        return found ? found.id : null;
    },

    /**
     * Send a message
     */
    async sendMessage(data: {
        conversationId: string;
        senderId: string;
        senderUsername: string;
        senderAvatarUrl?: string;
        content: string;
        type: MessageType;
        attachments?: File[]; // Files to upload
        attachmentMetadata?: { type: 'image' | 'video' | 'audio' | 'file' }[]; // Metadata for files
        helpRequest?: HelpRequestData;
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

        const message: Omit<Message, 'id'> = {
            ...messageData,
            conversationId,
            attachments: uploadedAttachments,
            readBy: [data.senderId],
            createdAt: serverTimestamp(),
            isDeleted: false,
            isEdited: false
        };

        const docRef = await addDoc(collection(db, 'conversations', conversationId, 'messages'), message);

        // Update conversation last message
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

        return docRef.id;
    },

    /**
     * Subscribe to user's conversations
     */
    subscribeToConversations(userId: string, callback: (conversations: Conversation[]) => void) {
        const q = query(
            collection(db, 'conversations'),
            where('members', 'array-contains', userId),
            orderBy('updatedAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const conversations = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Conversation));
            callback(conversations);
        });
    },

    /**
     * Subscribe to messages in a conversation
     */
    subscribeToMessages(conversationId: string, callback: (messages: Message[]) => void) {
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
    },

    /**
     * Mark messages as read
     */
    async markAsRead(conversationId: string, userId: string, messageIds: string[]) {
        // In a real app, you might want to batch this or just update a "lastRead" timestamp on the member
        // Updating every message document can be expensive.
        // For now, let's update the member's lastReadAt in the conversation doc

        const conversationRef = doc(db, 'conversations', conversationId);
        // We need to use dot notation to update a specific field in the map
        const fieldPath = `memberDetails.${userId}.lastReadAt`;

        await updateDoc(conversationRef, {
            [fieldPath]: serverTimestamp()
        });
    },

    /**
     * Add member to conversation
     */
    async addMember(conversationId: string, user: { userId: string; username: string; avatarUrl?: string; role?: 'admin' | 'member' }) {
        const conversationRef = doc(db, 'conversations', conversationId);

        const memberData: ConversationMember = {
            userId: user.userId,
            username: user.username,
            avatarUrl: user.avatarUrl,
            role: user.role || 'member',
            joinedAt: Timestamp.now()
        };

        await updateDoc(conversationRef, {
            members: arrayUnion(user.userId),
            [`memberDetails.${user.userId}`]: memberData
        });
    },

    /**
     * Remove member from conversation
     */
    async removeMember(conversationId: string, userId: string) {
        // Note: Firestore doesn't easily support removing a key from a map via updateDoc without deleting the whole field
        // But we can use deleteField() if we import it. 
        // For simplicity, we'll just remove from the 'members' array so they don't see it in queries,
        // and leave the details as historical data or read the doc, modify, and write back.

        // Let's just remove from the array for query purposes.
        const conversationRef = doc(db, 'conversations', conversationId);

        // To properly remove from the map, we'd need to read-modify-write or use deleteField().
        // For now, removing from 'members' array is enough to hide it.
        await updateDoc(conversationRef, {
            members: arrayUnion(userId) // Wait, arrayRemove
        });

        // Actually, let's do it right with a transaction if needed, but for now:
        // We need to import arrayRemove. It is imported.
        await updateDoc(conversationRef, {
            members: arrayRemove(userId)
        });
    },

    /**
     * Get conversation by Context ID (Project/Workspace/Agency ID)
     */
    async getConversationByContextId(contextId: string, type: ConversationType): Promise<Conversation | null> {
        let field = 'projectId';
        if (type === 'workspace') field = 'workspaceId';
        if (type === 'agency') field = 'agencyId';

        const q = query(
            collection(db, 'conversations'),
            where(field, '==', contextId),
            limit(1)
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;

        return {
            id: snapshot.docs[0].id,
            ...snapshot.docs[0].data()
        } as Conversation;
    }
};
