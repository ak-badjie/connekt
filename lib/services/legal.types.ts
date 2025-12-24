/**
 * ============================================================================
 * CONNEKT LEGAL FRAMEWORK - TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains all type definitions for the Connekt Legal Framework.
 * All contracts, proposals, and legal documents use these types.
 * 
 * @module legal.types
 */

import { Timestamp, FieldValue } from 'firebase/firestore';

// ============================================================================
// CONTRACT TYPES & STATUS
// ============================================================================

/**
 * All contract types supported by the platform
 */
export type LegalDocumentType =
    // Employment
    | 'job'                    // Full employment contract
    | 'job_short_term'         // Short-term employment
    | 'job_long_term'          // Long-term employment
    // Freelance
    | 'freelance'              // Freelance engagement
    | 'project'                // Project-based work
    | 'task'                   // Single task assignment
    // Admin/Ownership Transfers
    | 'project_admin'          // Temporal project ownership
    | 'task_admin'             // Task administration rights
    // Invitations
    | 'workspace_invite'       // Invite to workspace
    | 'agency_invite'          // Invite to agency
    | 'project_assignment'     // Assign project to user
    | 'task_assignment'        // Assign task to user
    // Financial
    | 'payment_request'        // Request for payment
    // Proposals
    | 'proposal'               // General proposal
    | 'job_proposal'           // Job application/proposal
    | 'project_proposal'       // Project bid
    | 'task_proposal'          // Task bid
    // General
    | 'general';               // Custom/general contract

/**
 * Contract lifecycle status
 */
export type LegalDocumentStatus =
    | 'draft'                  // Being drafted, not sent
    | 'pending'                // Sent, awaiting response
    | 'negotiating'            // Counter-proposal in progress
    | 'signed'                 // Fully signed and active
    | 'accepted'               // Accepted (legacy, same as signed)
    | 'rejected'               // Rejected by recipient
    | 'expired'                // Past expiration date
    | 'cancelled'              // Cancelled by sender before signature
    | 'completed'              // All obligations fulfilled
    | 'terminated'             // Early termination
    | 'disputed';              // Under dispute resolution

/**
 * Member types for employment classification
 */
export type MemberType = 'employee' | 'freelancer';

/**
 * Project/workspace roles
 */
export type MemberRole = 'owner' | 'admin' | 'supervisor' | 'member';

// ============================================================================
// CORE DOCUMENT INTERFACES
// ============================================================================

/**
 * Digital signature record
 */
export interface LegalSignature {
    userId: string;
    username: string;
    fullName: string;
    signedAt: Timestamp | Date;
    ipAddress?: string;
    userAgent?: string;
    signatureHash: string;
}

/**
 * Audit trail entry
 */
export interface LegalAuditEntry {
    at: Timestamp | Date;
    by: string;
    action: string;
    details?: string;
    meta?: Record<string, any>;
}

/**
 * Role assignment within a contract
 */
export interface LegalRoleAssignment {
    userId: string;
    username: string;
    role: MemberRole;
}

/**
 * Milestone for project/task contracts
 */
export interface LegalMilestone {
    id: string;
    title: string;
    amount: number;
    currency?: string;
    dueAt?: string;
    deliverableRef?: string;
    status?: 'pending' | 'submitted' | 'approved' | 'paid';
    submittedAt?: Timestamp | Date;
    approvedAt?: Timestamp | Date;
    evidence?: Array<{
        url: string;
        note?: string;
        uploadedAt: Timestamp | Date;
        by: string;
    }>;
    reviewerNotes?: string;
}

// ============================================================================
// CONTRACT TERMS
// ============================================================================

/**
 * Comprehensive contract terms interface
 */
export interface LegalTerms {
    // ===== LINKED ENTITIES =====
    workspaceId?: string;
    projectId?: string;
    taskId?: string;
    chatId?: string;
    agencyId?: string;

    // ===== PARTIES & ROLES =====
    roles?: LegalRoleAssignment[];
    projectRole?: MemberRole;

    // ===== CLASSIFICATION =====
    contractType?: LegalDocumentType;
    memberType?: MemberType;
    jobTitle?: string;
    isProposal?: boolean;  // True if this is a proposal, not a binding contract

    // ===== SCHEDULE (Employment) =====
    workStartTime?: string;      // HH:MM format (24hr)
    workEndTime?: string;        // HH:MM format (24hr)
    workDays?: number[];         // 0=Sunday, 1=Monday, etc.
    hoursPerDay?: number;
    hoursPerWeek?: number;
    workLocation?: string;

    // ===== PAYMENT =====
    paymentAmount?: number;
    paymentCurrency?: string;    // Default: GMD
    paymentTerms?: string;       // Description of payment terms
    paymentSchedule?: string;    // e.g., "monthly", "on completion"

    // ===== SALARY (Employment) =====
    salaryAmount?: number;
    salaryCurrency?: string;
    salaryPayDay?: number;       // Day of month (1-28)
    requireSalaryEscrow?: boolean;

    // ===== PROJECT/TASK SPECIFIC =====
    projectBudget?: number;
    taskPayment?: number;
    totalAmount?: number;
    milestones?: LegalMilestone[];
    deliverables?: string;
    deadline?: string;

    // ===== ESCROW =====
    requireWalletFunding?: boolean;
    requireEscrow?: boolean;
    escrowAmount?: number;

    // ===== PENALTIES =====
    penaltiesEnabled?: boolean;
    penaltyPerMissedDeadline?: number;
    penaltyCurrency?: string;
    maxPenaltyPercentage?: number;  // Cap (0-100)

    // ===== DATES =====
    startDate?: string;
    endDate?: string;
    validityPeriod?: string;
    noticePeriod?: number;       // Days

    // ===== ADDITIONAL TERMS =====
    benefits?: string;
    terminationConditions?: string;
    specialConditions?: string;

    // ===== STRUCTURED SCHEDULE (from Job Posting) =====
    schedule?: {
        startTime?: string;       // HH:MM format
        endTime?: string;         // HH:MM format
        workDays?: number[];      // 0=Sunday, 6=Saturday
        breakDurationMinutes?: number;
        timezone?: string;
        isFlexible?: boolean;
    };

    // ===== STRUCTURED CONDITIONS (from Job Posting) =====
    conditions?: {
        penaltyPerLateTask?: number;
        penaltyUnit?: 'fixed' | 'percentage';
        overtimeRate?: number;
    };

    // ===== EXTENSIBLE =====
    [key: string]: any;
}

// ============================================================================
// MAIN CONTRACT DOCUMENT
// ============================================================================

/**
 * The core Legal Document (Contract/Proposal)
 */
export interface LegalDocument {
    id?: string;

    // ===== TYPE & STATUS =====
    type: LegalDocumentType;
    status: LegalDocumentStatus;

    // ===== PARTIES =====
    fromUserId: string;
    fromUsername: string;
    fromMailAddress: string;
    toUserId: string;
    toUsername: string;
    toMailAddress: string;

    // ===== CONTENT =====
    title: string;
    description: string;
    bodyHtml?: string;           // Rendered contract body
    defaultTerms?: string;       // Standard terms text

    // ===== TERMS =====
    terms: LegalTerms;

    // ===== SIGNATURES =====
    signatures?: LegalSignature[];
    signedBy?: string;
    signedAt?: Timestamp | FieldValue;
    signatureFullName?: string;

    // ===== AUDIT & TRACKING =====
    audit?: LegalAuditEntry[];

    // ===== RELATED ENTITIES =====
    templateId?: string;
    parentContractId?: string;   // If this is a counter-proposal
    relatedMailId?: string;
    escrowId?: string;

    // ===== TIMESTAMPS =====
    createdAt: Timestamp | FieldValue;
    updatedAt?: Timestamp | FieldValue;
    respondedAt?: Timestamp | FieldValue;
    expiresAt?: Date | Timestamp;
    completedAt?: Timestamp | FieldValue;
    terminatedAt?: Timestamp | FieldValue;

    // ===== REJECTION =====
    rejectionReason?: string;
    rejectedBy?: string;
    rejectedAt?: Timestamp | FieldValue;

    // ===== TERMINATION =====
    terminationReason?: string;
    terminatedBy?: string;
}

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

/**
 * Template variable definition
 */
export interface LegalTemplateVariable {
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'currency' | 'textarea';
    required: boolean;
    defaultValue?: any;
    placeholder?: string;
}

/**
 * Contract template
 */
export interface LegalTemplate {
    id?: string;
    name: string;
    type: LegalDocumentType;
    visibility: 'system' | 'agency_custom' | 'private';
    agencyId?: string;

    // ===== CONFIGURATION =====
    requiresEscrow?: boolean;
    headerConfig: {
        showConnektLogo: boolean;
        showCoatOfArms: boolean;
        showGambianFlag: boolean;
    };

    // ===== CONTENT =====
    bodyTemplate: string;        // Template with {{variables}}
    defaultTerms: string;        // Standard terms text

    // ===== VARIABLES =====
    variables: LegalTemplateVariable[];

    // ===== TIMESTAMPS =====
    createdAt: Timestamp | FieldValue;
    updatedAt: Timestamp | FieldValue;
}

// ============================================================================
// ESCROW TYPES
// ============================================================================

/**
 * Escrow hold status
 */
export type EscrowStatus =
    | 'held'
    | 'released'
    | 'partially_released'
    | 'refunded'
    | 'disputed';

/**
 * Escrow hold record
 */
export interface LegalEscrowHold {
    id: string;
    contractId: string;

    // ===== PARTIES =====
    fromWalletId: string;
    toWalletId: string;
    fromUserId: string;
    toUserId: string;

    // ===== AMOUNT =====
    amount: number;
    originalAmount: number;
    currency: string;

    // ===== STATUS =====
    status: EscrowStatus;

    // ===== TYPE =====
    escrowType: 'contract' | 'salary' | 'project_admin' | 'task_admin';

    // ===== TIMESTAMPS =====
    createdAt: Timestamp | FieldValue;
    updatedAt?: Timestamp | FieldValue;
    releasedAt?: Timestamp | FieldValue;
    refundedAt?: Timestamp | FieldValue;
}

// ============================================================================
// ENFORCEMENT TYPES
// ============================================================================

/**
 * Enforcement action result
 */
export interface EnforcementResult {
    success: boolean;
    action: string;
    message?: string;
    error?: string;
    metadata?: Record<string, any>;
}

/**
 * Penalty record
 */
export interface LegalPenaltyRecord {
    id?: string;
    contractId: string;
    userId: string;

    // ===== PENALTY DETAILS =====
    type: 'missed_deadline' | 'incomplete_work' | 'policy_violation';
    amount: number;
    currency: string;
    reason: string;

    // ===== STATUS =====
    processed: boolean;
    processedAt?: Timestamp | FieldValue;

    // ===== RELATED =====
    taskId?: string;
    projectId?: string;

    // ===== TIMESTAMPS =====
    createdAt: Timestamp | FieldValue;
}

// ============================================================================
// PROOF OF WORK TYPES
// ============================================================================

/**
 * Proof of Task Completion
 */
export interface ProofOfTask {
    taskId: string;
    contractId?: string;
    submittedBy: string;
    submittedAt: Timestamp | FieldValue;

    description: string;
    screenshots?: string[];
    externalLinks?: string[];
    additionalNotes?: string;

    status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
    reviewedBy?: string;
    reviewedAt?: Timestamp | FieldValue;
    reviewNotes?: string;
}

/**
 * Proof of Project Completion
 */
export interface ProofOfProject {
    projectId: string;
    contractId?: string;
    submittedBy: string;
    submittedAt: Timestamp | FieldValue;

    description: string;
    screenshots?: string[];
    externalLinks?: string[];
    additionalNotes?: string;

    status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
    reviewedBy?: string;
    reviewedAt?: Timestamp | FieldValue;
    reviewNotes?: string;
}

// ============================================================================
// SERVICE RESPONSE TYPES
// ============================================================================

/**
 * Standard service response
 */
export interface LegalServiceResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

/**
 * Contract creation input
 */
export interface CreateContractInput {
    type: LegalDocumentType;
    fromUserId: string;
    fromUsername: string;
    fromMailAddress: string;
    toUserId: string;
    toUsername: string;
    toMailAddress: string;
    title: string;
    description: string;
    terms: LegalTerms;
    templateId?: string;
    expiresInDays?: number;
    sendNotification?: boolean;
}

/**
 * Contract query filters
 */
export interface ContractQueryFilters {
    userId?: string;
    workspaceId?: string;
    projectId?: string;
    taskId?: string;
    type?: LegalDocumentType | LegalDocumentType[];
    status?: LegalDocumentStatus | LegalDocumentStatus[];
    direction?: 'sent' | 'received' | 'both';
    limit?: number;
    orderBy?: 'createdAt' | 'updatedAt';
    orderDirection?: 'asc' | 'desc';
}
