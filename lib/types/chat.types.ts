import { Timestamp } from 'firebase/firestore';

export type ConversationType = 'direct' | 'group' | 'project' | 'workspace' | 'agency';

export interface ConversationMember {
    userId: string;
    username: string;
    avatarUrl?: string;
    role: 'admin' | 'member';
    joinedAt: Timestamp | any;
    lastReadAt?: Timestamp | any;
}

export interface Conversation {
    id: string;
    type: ConversationType;
    title?: string; // For groups/projects
    description?: string;
    photoUrl?: string;

    // Context IDs (optional, links chat to specific entity)
    projectId?: string;
    workspaceId?: string;
    agencyId?: string;

    members: string[]; // Array of userIds for querying
    memberDetails: Record<string, ConversationMember>; // Map for easy access

    lastMessage?: {
        content: string;
        senderId: string;
        senderUsername: string;
        sentAt: Timestamp | any;
        type: MessageType;
    };

    createdAt: Timestamp | any;
    updatedAt: Timestamp | any;
    createdBy: string;
}

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'help_request' | 'system' | 'call';

export interface MessageAttachment {
    type: 'image' | 'video' | 'audio' | 'file';
    url: string;
    name: string;
    size?: number;
    mimeType?: string;
}

export interface HelpRequestData {
    taskId?: string;
    taskTitle?: string;
    projectId?: string;
    projectTitle?: string;
    budget?: number;
    currency?: string;
    contractId?: string; // If a contract was created
    status: 'open' | 'accepted' | 'rejected' | 'completed';
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    senderUsername: string;
    senderAvatarUrl?: string;

    content: string;
    type: MessageType;
    attachments?: MessageAttachment[];
    helpRequest?: HelpRequestData;
    relatedMeetingId?: string;

    readBy: string[]; // Array of userIds

    replyToId?: string; // For threading/replies

    createdAt: Timestamp | any;
    updatedAt?: Timestamp | any;
    isEdited?: boolean;
    isDeleted?: boolean;
}
