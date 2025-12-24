/**
 * ============================================================================
 * CONNEKT LEGAL FRAMEWORK
 * ============================================================================
 * 
 * The bedrock of Connekt Teams contract and proposal system.
 * 
 * ARCHITECTURE:
 * - legal.types.ts     → Type definitions
 * - legal.constants.ts → Contract type constants & rules
 * - legal.registry.ts  → Contract CRUD & queries
 * - legal.escrow.ts    → Escrow operations
 * - legal.lifecycle.ts → Contract state machine (MAIN ENTRY POINT)
 * - legal.enforcement.ts → Rule engine (auto-triggered)
 * - legal.bridge.ts    → Backward compatibility
 * 
 * USAGE:
 * ```ts
 * import { LegalLifecycle, LegalRegistry } from '@/lib/services/legal';
 * 
 * // Create contract
 * const contractId = await LegalLifecycle.create({ ... });
 * 
 * // Sign contract (auto-enforces based on type)
 * await LegalLifecycle.sign(contractId, userId, username, fullName);
 * ```
 * 
 * @module legal
 */

// ============================================================================
// CORE SERVICES
// ============================================================================

export { LegalRegistry } from './legal.registry';
export { LegalEscrow } from './legal.escrow';
export { LegalLifecycle } from './legal.lifecycle';
export { LegalEnforcement } from './legal.enforcement';

// ============================================================================
// TYPES
// ============================================================================

export type {
    // Document types
    LegalDocument,
    LegalDocumentType,
    LegalDocumentStatus,
    LegalTerms,
    LegalSignature,
    LegalAuditEntry,

    // Role types
    MemberType,
    MemberRole,
    LegalRoleAssignment,

    // Milestone
    LegalMilestone,

    // Template types
    LegalTemplate,
    LegalTemplateVariable,

    // Escrow types
    EscrowStatus,
    LegalEscrowHold,

    // Enforcement types
    EnforcementResult,
    LegalPenaltyRecord,

    // Proof of work
    ProofOfTask,
    ProofOfProject,

    // Service types
    LegalServiceResponse,
    CreateContractInput,
    ContractQueryFilters
} from './legal.types';

// ============================================================================
// CONSTANTS
// ============================================================================

export {
    // Contract types
    LEGAL_DOCUMENT_TYPES,
    LEGAL_DOCUMENT_STATUS,
    LEGAL_TEMPLATE_NAMES,

    // Enforcement rules
    ESCROW_REQUIRED_TYPES,
    WORKSPACE_ACCESS_TYPES,
    PROJECT_ACCESS_TYPES,
    TASK_ACCESS_TYPES,
    PROPOSAL_TYPES,
    CONTRACT_MEMBER_TYPE_MAP,

    // Defaults
    DEFAULT_CURRENCY,
    DEFAULT_VALIDITY_DAYS,
    DEFAULT_NOTICE_PERIOD,
    MAX_PENALTY_PERCENTAGE,
    DEFAULT_SALARY_PAY_DAY,

    // Audit
    AUDIT_ACTIONS,

    // Escrow
    ESCROW_PREFIX,

    // Collections
    LEGAL_COLLECTIONS
} from './legal.constants';

// ============================================================================
// BRIDGE (for backward compatibility)
// ============================================================================

export {
    // Type converters
    toLegalDocument,
    toContract,

    // Bridge functions
    createContract,
    createContractDocument,
    getUserContracts,
    getSentContracts,
    signContract,
    getContract,
    grantAccess,
    revokeAccess,
    rejectProposal
} from './legal.bridge';
