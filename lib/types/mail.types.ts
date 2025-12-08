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
export type MailCategory = 'Projects' | 'Clients' | 'Personal' | 'Important' | 'Contracts' | 'Proposals';

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
    senderId: string; // Prefer UID when available
    senderUsername: string;
    senderName: string; // Display name
    senderAddress: string; // Full email address with domain
    senderPhotoURL?: string;
    senderMailType: 'personal' | 'agency';
    senderAgencyId?: string;

    // Recipient Details
    recipientId: string;
    recipientUsername: string;
    recipientAddress: string; // Full email address with domain
    recipientName?: string;
    recipientPhotoURL?: string;
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
    | 'job'
    | 'project'
    | 'task'
    | 'project_admin'
    | 'task_admin'
    | 'job_short_term'     // Short-term job (few tasks, days to weeks)
    | 'job_long_term'      // Long-term job (6+ months, monthly payment)
    | 'job_project_based'  // Project-based job (single project scope)
    | 'general';

export type ContractStatus =
    | 'pending'
    | 'accepted'
    | 'rejected'
    | 'expired'
    | 'cancelled';

/**
 * Digital Signature for Contracts
 */
export interface ContractSignature {
    userId: string;
    username: string;
    signedAt: any; // Timestamp
    ipAddress?: string;
    userAgent?: string;
    signatureHash: string; // SHA-256 hash of contract content
}

/**
 * Contract Enforcement Rules
 */
export interface ContractEnforcement {
    paymentLocked: boolean;
    paymentAmount?: number;       // Fixed amount
    paymentRangeMin?: number;     // Or range
    paymentRangeMax?: number;
    timelineLocked: boolean;
    startDate?: any;              // Timestamp
    endDate?: any;                // Timestamp
}

/**
 * Contract Violation
 */
export interface ContractViolation {
    type: 'payment' | 'timeline' | 'terms';
    description: string;
    reportedAt: any; // Timestamp
    reportedBy: string; // userId
    status: 'pending' | 'resolved' | 'dismissed';
}

/**
 * Contract Template
 */
export interface ContractTemplate {
    id?: string;
    name: string;
    type: ContractType;
    visibility: 'system' | 'agency_custom';
    agencyId?: string; // If agency_custom
    requiresEscrow?: boolean; // Defines if the contract requires automated escrow

    // Legal Header Configuration
    headerConfig: {
        showConnektLogo: boolean;
        showCoatOfArms: boolean;
        showGambianFlag: boolean;
    };

    // Template Content
    bodyTemplate: string; // Markdown with {{variable}} placeholders
    defaultTerms: string; // Markdown

    // Variables for template
    variables: Array<{
        key: string;
        label: string;
        type: 'text' | 'number' | 'date' | 'currency';
        required: boolean;
    }>;

    // Metadata
    createdAt: any; // Timestamp
    updatedAt: any; // Timestamp
}

export interface ContractVariable {
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'currency';
    required: boolean;
}

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
    defaultTerms?: string; // Standard terms from template (markdown)
    terms: ContractTerms;

    // Template
    templateId?: string;

    // Signatures
    signatures: ContractSignature[];

    // Enforcement
    enforcement?: ContractEnforcement;
    escrowId?: string;

    // Violations
    violations?: ContractViolation[];

    // Audit trail
    audit?: Array<{
        at: any;
        by: string;
        action: string;
        details?: string;
        meta?: Record<string, any>;
    }>;

    // Associated IDs
    relatedEntityId?: string; // Task ID, Project ID, Workspace ID, etc.
    relatedMailId?: string; // Mail that created this contract

    // Timestamps
    createdAt: any;
    respondedAt?: any;
    expiresAt?: any;
}

export interface ContractTerms {
    // Linking
    linkedProjectId?: string;
    linkedWorkspaceId?: string;
    linkedChatId?: string;

    // Roles
    roles?: Array<{
        userId: string;
        role: 'owner' | 'admin' | 'member' | 'supervisor';
    }>;

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

    // Job Contract Terms
    jobTitle?: string;
    jobDescription?: string;
    jobRequirements?: string[];

    // Payment Structure
    paymentType?: 'fixed' | 'hourly' | 'monthly' | 'range';
    paymentAmount?: number;       // For fixed/hourly/monthly
    paymentRangeMin?: number;     // For range-based
    paymentRangeMax?: number;     // For range-based
    paymentCurrency?: string;     // Default: GMD
    paymentSchedule?: string;     // e.g., "Monthly on 1st", "Upon completion"

    // Funding / Enforcement
    requireWalletFunding?: boolean;
    totalAmount?: number;
    totalCurrency?: string;
    paymentMode?: 'full_on_complete' | 'per_milestone';

    // Milestones
    milestones?: Array<{
        id: string;
        title: string;
        amount: number;
        currency?: string;
        dueAt?: string;
        deliverableRef?: string;
        status?: 'pending' | 'submitted' | 'approved' | 'paid';
        submittedAt?: any;
        approvedAt?: any;
        evidence?: Array<{
            url: string;
            note?: string;
            uploadedAt: any;
            by: string;
        }>;
        reviewerNotes?: string;
    }>;

    // Timeline
    startDate?: string;
    endDate?: string;
    duration?: number;            // In days
    durationUnit?: 'days' | 'weeks' | 'months';

    // Work Terms
    hoursPerWeek?: number;
    workLocation?: 'remote' | 'onsite' | 'hybrid';

    // Termination
    noticePeriod?: number;        // In days
    terminationConditions?: string;

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
