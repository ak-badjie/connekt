import { Timestamp } from 'firebase/firestore';

/**
 * Mail Address Types
 */
export interface MailAddress {
    address: string; // Full email address (e.g., "abdul@connekt.com" or "abdul@garden.com")
    type: 'personal' | 'agency';
    displayName: string; // User's display name
    username: string; // Username part before @
    domain: string; // Domain part after @
    agencyId?: string; // If type is 'agency', the agency ID
    agencyName?: string; // If type is 'agency', the agency name
}

/**
 * Mail Categories
 */
export type MailCategory = 'Projects' | 'Clients' | 'Personal' | 'Important';

/**
 * Mail Signature
 */
export interface MailSignature {
    id?: string;
    userId: string;
    name: string; // Signature name (e.g., "Professional", "Casual")
    content: string; // Markdown content
    isDefault: boolean;
    createdAt?: any;
    updatedAt?: any;
}

/**
 * Extended Mail Message with new features
 */
export interface ExtendedMailMessage {
    id?: string;
    ownerId: string;
    type: 'received' | 'sent';

    // Sender Details
    senderId: string;
    senderUsername: string;
    senderName: string;
    senderAddress: string; // Full email address with domain
    senderMailType: 'personal' | 'agency';
    senderAgencyId?: string;

    // Recipient Details
    recipientId: string;
    recipientUsername: string;
    recipientAddress: string; // Full email address with domain
    recipientMailType: 'personal' | 'agency';
    recipientAgencyId?: string;

    // Content
    subject: string;
    body: string; // Markdown content
    attachments?: Attachment[];

    // Metadata
    isRead: boolean;
    folder: 'inbox' | 'sent' | 'trash' | 'drafts';
    category?: MailCategory;
    signatureId?: string;
    contractId?: string; // If this mail is associated with a contract

    // Threading (future feature)
    threadId?: string;
    replyToId?: string;

    // Timestamps
    createdAt: any;
    updatedAt?: any;
}

/**
 * Mail Draft
 */
export interface MailDraft extends Omit<ExtendedMailMessage, 'isRead' | 'type' | 'ownerId'> {
    userId: string;
    lastSavedAt: any;
}

/**
 * Attachment type from storage service
 */
export interface Attachment {
    id: string;
    type: 'image' | 'video' | 'document' | 'link';
    name: string;
    url: string;
    size?: number;
    mimeType?: string;
    thumbnailUrl?: string;
}

/**
 * Contract Types for Mail Integration
 */
export type ContractType =
    | 'task_assignment'
    | 'project_assignment'
    | 'workspace_invite'
    | 'agency_invite'
    | 'payment_request'
    | 'general';

export type ContractStatus =
    | 'pending'
    | 'accepted'
    | 'rejected'
    | 'expired'
    | 'cancelled';

export interface Contract {
    id?: string;
    type: ContractType;
    status: ContractStatus;

    // Parties
    fromUserId: string;
    fromUsername: string;
    fromMailAddress: string;
    toUserId: string;
    toUsername: string;
    toMailAddress: string;

    // Content
    title: string;
    description: string;
    terms: ContractTerms;

    // Associated IDs
    relatedEntityId?: string; // Task ID, Project ID, Workspace ID, etc.
    relatedMailId?: string; // Mail that created this contract

    // Timestamps
    createdAt: any;
    respondedAt?: any;
    expiresAt?: any;
}

export interface ContractTerms {
    // Task Assignment Terms
    taskId?: string;
    taskTitle?: string;
    taskDeadline?: string;
    taskPayment?: number;

    // Project Assignment Terms
    projectId?: string;
    projectTitle?: string;
    projectBudget?: number;
    projectDeadline?: string;
    projectRole?: 'member' | 'supervisor';

    // Workspace Invite Terms
    workspaceId?: string;
    workspaceName?: string;
    workspaceRole?: 'member' | 'admin';

    // Agency Invite Terms  
    agencyId?: string;
    agencyName?: string;
    agencyRole?: 'member' | 'admin';
    agencyEmail?: string;

    // General Terms
    customTerms?: Record<string, any>;
}

/**
 * Mail Search/Filter Options
 */
export interface MailFilters {
    folder?: 'inbox' | 'sent' | 'trash' | 'drafts';
    category?: MailCategory;
    isRead?: boolean;
    fromAddress?: string;
    toAddress?: string;
    hasAttachments?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
    searchQuery?: string;
}

/**
 * Mail Statistics
 */
export interface MailStats {
    totalInbox: number;
    unreadInbox: number;
    totalSent: number;
    totalDrafts: number;
    totalTrash: number;
    storageUsedByAttachments: number; // in bytes
}
