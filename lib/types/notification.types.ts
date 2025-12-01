import { Timestamp } from 'firebase/firestore';

/**
 * Notification Types
 */
export type NotificationType =
    | 'mail'
    | 'transaction'
    | 'storage'
    | 'subscription'
    | 'project'
    | 'task'
    | 'workspace'
    | 'agency'
    | 'pot'
    | 'job_update'
    | 'system';

/**
 * Notification Priority
 */
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * User Role for notification filtering
 */
export type UserRole = 'user' | 'recruiter' | 'agency';

/**
 * Base Notification Interface
 */
export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    priority: NotificationPriority;
    read: boolean;
    createdAt: number; // Unix timestamp
    actionUrl?: string;
    actionLabel?: string;
    metadata: NotificationMetadata;
}

/**
 * Type-specific metadata for notifications
 */
export type NotificationMetadata =
    | MailNotificationMetadata
    | TransactionNotificationMetadata
    | StorageNotificationMetadata
    | SubscriptionNotificationMetadata
    | ProjectNotificationMetadata
    | TaskNotificationMetadata
    | WorkspaceNotificationMetadata
    | AgencyNotificationMetadata
    | PotNotificationMetadata
    | JobUpdateNotificationMetadata
    | SystemNotificationMetadata;

/**
 * Mail Notification Metadata
 */
export interface MailNotificationMetadata {
    type: 'mail';
    mailId: string;
    senderId: string;
    senderUsername: string;
    senderName: string;
    subject: string;
}

/**
 * Transaction Notification Metadata
 */
export interface TransactionNotificationMetadata {
    type: 'transaction';
    transactionId: string;
    transactionType: 'payment' | 'escrow_hold' | 'escrow_release' | 'refund' | 'deposit' | 'withdrawal';
    amount: number;
    currency: string;
    fromUserId?: string;
    toUserId?: string;
    relatedEntityId?: string;
    relatedEntityType?: 'contract' | 'task' | 'project';
}

/**
 * Storage Notification Metadata
 */
export interface StorageNotificationMetadata {
    type: 'storage';
    usedSpace: number;
    totalQuota: number;
    usagePercentage: number;
    mailAddress: string;
    threshold: 80 | 90 | 95 | 100;
}

/**
 * Subscription Notification Metadata
 */
export interface SubscriptionNotificationMetadata {
    type: 'subscription';
    subscriptionType: 'connect_pro' | 'connect_pro_plus';
    action: 'activated' | 'renewed' | 'expiring' | 'expired' | 'cancelled';
    expiryDate?: number;
    daysUntilExpiry?: number;
}

/**
 * Project Notification Metadata
 */
export interface ProjectNotificationMetadata {
    type: 'project';
    projectId: string;
    projectTitle: string;
    action: 'assigned' | 'reassigned' | 'member_added' | 'member_removed' | 'supervisor_added' | 'supervisor_removed' | 'deadline_reminder' | 'status_changed';
    assignerId?: string;
    assignerUsername?: string;
    deadline?: string;
    daysUntilDeadline?: number;
    newStatus?: string;
}

/**
 * Task Notification Metadata
 */
export interface TaskNotificationMetadata {
    type: 'task';
    taskId: string;
    taskTitle: string;
    projectId: string;
    action: 'assigned' | 'reassigned' | 'help_requested' | 'deadline_reminder' | 'status_changed';
    assignerId?: string;
    assignerUsername?: string;
    deadline?: string;
    daysUntilDeadline?: number;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
}

/**
 * Workspace Notification Metadata
 */
export interface WorkspaceNotificationMetadata {
    type: 'workspace';
    workspaceId: string;
    workspaceName: string;
    action: 'added' | 'removed' | 'role_changed';
    addedBy?: string;
    addedByUsername?: string;
    role?: 'owner' | 'admin' | 'member';
}

/**
 * Agency Notification Metadata
 */
export interface AgencyNotificationMetadata {
    type: 'agency';
    agencyId: string;
    agencyName: string;
    action: 'member_added' | 'member_removed' | 'announcement';
    addedBy?: string;
    addedByUsername?: string;
    agencyEmail?: string;
    announcementContent?: string;
}

/**
 * Proof of Task (POT) Notification Metadata
 */
export interface PotNotificationMetadata {
    type: 'pot';
    taskId: string;
    taskTitle: string;
    projectId: string;
    action: 'submitted' | 'approved' | 'rejected' | 'revision_requested';
    submittedBy?: string;
    submittedByUsername?: string;
    validatedBy?: string;
    validatedByUsername?: string;
    validationNotes?: string;
}

/**
 * Job Update Notification Metadata
 */
export interface JobUpdateNotificationMetadata {
    type: 'job_update';
    jobId: string;
    jobTitle: string;
    jobCategory: string;
    jobType: 'short_term' | 'long_term' | 'project_based';
    postedBy: string;
    postedByUsername: string;
}

/**
 * System/Admin Notification Metadata
 */
export interface SystemNotificationMetadata {
    type: 'system';
    category: 'announcement' | 'maintenance' | 'feature' | 'security' | 'update';
    content: string;
    targetAudience: 'all' | 'users' | 'recruiters' | 'agencies';
    imageUrl?: string;
}

/**
 * Notification Filter Options
 */
export interface NotificationFilter {
    type?: NotificationType;
    read?: boolean;
    priority?: NotificationPriority;
    startDate?: number;
    endDate?: number;
}

/**
 * Notification Stats
 */
export interface NotificationStats {
    total: number;
    unread: number;
    byType: Record<NotificationType, number>;
    byPriority: Record<NotificationPriority, number>;
}
