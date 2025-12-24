/**
 * ============================================================================
 * CONNEKT LEGAL FRAMEWORK - CONSTANTS
 * ============================================================================
 * 
 * All constants for the Legal Framework including contract types,
 * template names, enforcement rules, and configuration.
 * 
 * @module legal.constants
 */

import type { LegalDocumentType, MemberType } from './legal.types';

// ============================================================================
// CONTRACT TYPES
// ============================================================================

/**
 * Contract type constants
 */
export const LEGAL_DOCUMENT_TYPES = {
    // Employment
    JOB: 'job' as const,
    JOB_SHORT_TERM: 'job_short_term' as const,
    JOB_LONG_TERM: 'job_long_term' as const,

    // Freelance
    FREELANCE: 'freelance' as const,
    PROJECT: 'project' as const,
    TASK: 'task' as const,

    // Admin/Ownership
    PROJECT_ADMIN: 'project_admin' as const,
    TASK_ADMIN: 'task_admin' as const,

    // Invitations
    WORKSPACE_INVITE: 'workspace_invite' as const,
    AGENCY_INVITE: 'agency_invite' as const,
    PROJECT_ASSIGNMENT: 'project_assignment' as const,
    TASK_ASSIGNMENT: 'task_assignment' as const,

    // Financial
    PAYMENT_REQUEST: 'payment_request' as const,

    // Proposals
    PROPOSAL: 'proposal' as const,
    JOB_PROPOSAL: 'job_proposal' as const,
    PROJECT_PROPOSAL: 'project_proposal' as const,
    TASK_PROPOSAL: 'task_proposal' as const,

    // General
    GENERAL: 'general' as const,
} as const;

/**
 * Contract status constants
 */
export const LEGAL_DOCUMENT_STATUS = {
    DRAFT: 'draft' as const,
    PENDING: 'pending' as const,
    NEGOTIATING: 'negotiating' as const,
    SIGNED: 'signed' as const,
    ACCEPTED: 'accepted' as const,
    REJECTED: 'rejected' as const,
    EXPIRED: 'expired' as const,
    CANCELLED: 'cancelled' as const,
    COMPLETED: 'completed' as const,
    TERMINATED: 'terminated' as const,
    DISPUTED: 'disputed' as const,
} as const;

// ============================================================================
// TEMPLATE NAMES
// ============================================================================

/**
 * System template names for display
 */
export const LEGAL_TEMPLATE_NAMES = {
    // Employment
    EMPLOYMENT_CONTRACT: 'Employment Contract',
    SHORT_TERM_EMPLOYMENT: 'Short-Term Employment Contract',
    LONG_TERM_EMPLOYMENT: 'Long-Term Employment Contract',

    // Freelance
    FREELANCE_CONTRACT: 'Freelance Contract',
    PROJECT_CONTRACT: 'Project Contract',
    TASK_CONTRACT: 'Task Assignment Contract',

    // Admin
    PROJECT_ADMIN: 'Project Admin Contract (Temporal Ownership)',
    TASK_ADMIN: 'Task Admin Contract (Task Ownership)',

    // Proposals
    JOB_PROPOSAL: 'Job Application',
    PROJECT_PROPOSAL: 'Project Proposal/Bid',
    TASK_PROPOSAL: 'Task Bid',
} as const;

// ============================================================================
// ENFORCEMENT RULES
// ============================================================================

/**
 * Contract types that require escrow
 */
export const ESCROW_REQUIRED_TYPES: LegalDocumentType[] = [
    'job',
    'job_short_term',
    'job_long_term',
    'project_admin',
    'task_admin',
    'task_assignment',
];

/**
 * Contract types that add user to workspace
 */
export const WORKSPACE_ACCESS_TYPES: LegalDocumentType[] = [
    'job',
    'job_short_term',
    'job_long_term',
    'workspace_invite',
];

/**
 * Contract types that add user to project only
 */
export const PROJECT_ACCESS_TYPES: LegalDocumentType[] = [
    'freelance',
    'project',
    'project_assignment',
    'project_admin',
];

/**
 * Contract types that grant task access
 */
export const TASK_ACCESS_TYPES: LegalDocumentType[] = [
    'task',
    'task_assignment',
    'task_admin',
];

/**
 * Proposal types (not binding contracts)
 */
export const PROPOSAL_TYPES: LegalDocumentType[] = [
    'proposal',
    'job_proposal',
    'project_proposal',
    'task_proposal',
];

/**
 * Member type mapping for contract types
 */
export const CONTRACT_MEMBER_TYPE_MAP: Record<LegalDocumentType, MemberType> = {
    // Employment = always employee
    'job': 'employee',
    'job_short_term': 'employee',
    'job_long_term': 'employee',

    // Freelance = always freelancer
    'freelance': 'freelancer',
    'project': 'freelancer',
    'task': 'freelancer',
    'project_admin': 'freelancer',
    'task_admin': 'freelancer',
    'project_assignment': 'freelancer',
    'task_assignment': 'freelancer',

    // Invites - depends on context, default employee
    'workspace_invite': 'employee',
    'agency_invite': 'employee',

    // Others
    'payment_request': 'freelancer',
    'proposal': 'freelancer',
    'job_proposal': 'employee',
    'project_proposal': 'freelancer',
    'task_proposal': 'freelancer',
    'general': 'freelancer',
};

// ============================================================================
// DEFAULTS
// ============================================================================

/**
 * Default currency
 */
export const DEFAULT_CURRENCY = 'GMD';

/**
 * Default validity period for contracts (days)
 */
export const DEFAULT_VALIDITY_DAYS = 30;

/**
 * Default notice period for termination (days)
 */
export const DEFAULT_NOTICE_PERIOD = 14;

/**
 * Maximum penalty percentage for salary deductions
 */
export const MAX_PENALTY_PERCENTAGE = 50;

/**
 * Salary pay day default (day of month)
 */
export const DEFAULT_SALARY_PAY_DAY = 28;

// ============================================================================
// AUDIT ACTIONS
// ============================================================================

/**
 * Standard audit action names
 */
export const AUDIT_ACTIONS = {
    // Lifecycle
    CREATED: 'created',
    SENT: 'sent',
    VIEWED: 'viewed',
    SIGNED: 'signed',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired',
    COMPLETED: 'completed',
    TERMINATED: 'terminated',

    // Escrow
    ESCROW_HELD: 'escrow_held',
    ESCROW_RELEASED: 'escrow_released',
    ESCROW_REFUNDED: 'escrow_refunded',
    ESCROW_PARTIAL_RELEASE: 'escrow_partial_release',

    // Enforcement
    ACCESS_GRANTED: 'access_granted',
    ACCESS_REVOKED: 'access_revoked',

    // Milestones
    MILESTONE_SUBMITTED: 'milestone_submitted',
    MILESTONE_APPROVED: 'milestone_approved',
    MILESTONE_REJECTED: 'milestone_rejected',

    // Proof of Work
    POT_SUBMITTED: 'pot_submitted',
    POT_APPROVED: 'pot_approved',
    POT_REJECTED: 'pot_rejected',
    POP_SUBMITTED: 'pop_submitted',
    POP_APPROVED: 'pop_approved',
    POP_REJECTED: 'pop_rejected',

    // Penalties
    PENALTY_RECORDED: 'penalty_recorded',
    PENALTY_APPLIED: 'penalty_applied',
} as const;

// ============================================================================
// ESCROW ID PREFIXES
// ============================================================================

/**
 * Escrow ID prefix patterns
 */
export const ESCROW_PREFIX = {
    CONTRACT: 'escrow_',
    SALARY: 'salary_',
    PROJECT_ADMIN: 'project_admin_',
    TASK_ADMIN: 'task_admin_',
    PROJECT: 'project_',
} as const;

// ============================================================================
// FIRESTORE COLLECTIONS
// ============================================================================

/**
 * Collection names for legal documents
 */
export const LEGAL_COLLECTIONS = {
    CONTRACTS: 'contracts',
    TEMPLATES: 'contract_templates',
    ESCROW: 'escrow_holds',
    PENALTIES: 'penalty_records',
    AUDIT_LOG: 'contract_audit_log',
} as const;
