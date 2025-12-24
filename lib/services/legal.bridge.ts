/**
 * ============================================================================
 * CONNEKT LEGAL FRAMEWORK - BRIDGE
 * ============================================================================
 * 
 * Backward compatibility layer for existing UI components.
 * Maps old service calls to the new Legal Framework.
 * 
 * MIGRATION PATH:
 * 1. Import from legal.bridge instead of old services
 * 2. Gradually update UI to use new types
 * 3. Eventually remove bridge and use new services directly
 * 
 * @module legal.bridge
 */

import { LegalLifecycle } from './legal.lifecycle';
import { LegalRegistry } from './legal.registry';
import { LegalEscrow } from './legal.escrow';
import { LegalEnforcement } from './legal.enforcement';

import type {
    LegalDocument,
    LegalDocumentType,
    LegalDocumentStatus,
    LegalTerms,
    LegalServiceResponse,
    CreateContractInput
} from './legal.types';

import type { Contract, ContractType, ContractTerms } from '@/lib/types/mail.types';

// ============================================================================
// TYPE CONVERTERS
// ============================================================================

/**
 * Convert old Contract type to LegalDocument
 */
export function toLegalDocument(contract: Contract): LegalDocument {
    return {
        id: contract.id,
        type: contract.type as LegalDocumentType,
        status: contract.status as LegalDocumentStatus,
        fromUserId: contract.fromUserId,
        fromUsername: contract.fromUsername,
        fromMailAddress: contract.fromMailAddress,
        toUserId: contract.toUserId,
        toUsername: contract.toUsername,
        toMailAddress: contract.toMailAddress,
        title: contract.title,
        description: contract.description,
        bodyHtml: contract.bodyHtml,
        defaultTerms: contract.defaultTerms,
        terms: contract.terms as LegalTerms,
        signatures: contract.signatures?.map(s => ({
            userId: s.userId,
            username: s.username,
            fullName: s.username,
            signedAt: s.signedAt,
            signatureHash: s.signatureHash,
            ipAddress: s.ipAddress,
            userAgent: s.userAgent
        })),
        signedBy: contract.signedBy,
        signedAt: contract.signedAt,
        signatureFullName: contract.signatureFullName,
        audit: contract.audit,
        templateId: undefined,
        createdAt: contract.createdAt,
        respondedAt: contract.respondedAt,
        expiresAt: contract.expiresAt
    };
}

/**
 * Convert LegalDocument back to old Contract type (for UI compatibility)
 */
export function toContract(doc: LegalDocument): Contract {
    return {
        id: doc.id,
        type: doc.type as ContractType,
        status: doc.status as any,
        fromUserId: doc.fromUserId,
        fromUsername: doc.fromUsername,
        fromMailAddress: doc.fromMailAddress,
        toUserId: doc.toUserId,
        toUsername: doc.toUsername,
        toMailAddress: doc.toMailAddress,
        title: doc.title,
        description: doc.description,
        bodyHtml: doc.bodyHtml,
        defaultTerms: doc.defaultTerms,
        terms: doc.terms as ContractTerms,
        signatures: doc.signatures?.map(s => ({
            userId: s.userId,
            username: s.username,
            signedAt: s.signedAt,
            signatureHash: s.signatureHash,
            ipAddress: s.ipAddress,
            userAgent: s.userAgent
        })),
        signedBy: doc.signedBy,
        signedAt: doc.signedAt,
        signatureFullName: doc.signatureFullName,
        audit: doc.audit,
        createdAt: doc.createdAt,
        respondedAt: doc.respondedAt,
        expiresAt: doc.expiresAt
    } as Contract;
}

// ============================================================================
// BRIDGE: CONTRACT MAIL SERVICE REPLACEMENTS
// ============================================================================

/**
 * Bridge for ContractMailService.createContract
 */
export async function createContract(
    fromUserId: string,
    fromUsername: string,
    fromMailAddress: string,
    toUserId: string,
    toUsername: string,
    toMailAddress: string,
    type: ContractType,
    title: string,
    description: string,
    terms: ContractTerms,
    expiresInDays?: number
): Promise<string> {
    const input: CreateContractInput = {
        type: type as LegalDocumentType,
        fromUserId,
        fromUsername,
        fromMailAddress,
        toUserId,
        toUsername,
        toMailAddress,
        title,
        description,
        terms: terms as LegalTerms,
        expiresInDays,
        sendNotification: true
    };

    const result = await LegalRegistry.create(input);
    if (!result.success) {
        throw new Error(result.error || 'Failed to create contract');
    }
    return result.data!;
}

/**
 * Bridge for ContractMailService.getUserContracts
 */
export async function getUserContracts(userId: string, status?: string): Promise<Contract[]> {
    const docs = await LegalRegistry.getReceivedByUser(userId, status as LegalDocumentStatus);
    return docs.map(toContract);
}

/**
 * Bridge for ContractMailService.getSentContracts
 */
export async function getSentContracts(userId: string, status?: string): Promise<Contract[]> {
    const docs = await LegalRegistry.getSentByUser(userId, status as LegalDocumentStatus);
    return docs.map(toContract);
}

/**
 * Bridge for ContractMailService.createContractDocument
 * Creates a contract document (for use with mail attachments)
 */
export async function createContractDocument(
    fromUserId: string,
    fromUsername: string,
    fromMailAddress: string,
    toUserId: string,
    toUsername: string,
    toMailAddress: string,
    type: string,
    title: string,
    description: string,
    terms: any,
    expiresInDays?: number,
    defaultTerms?: string
): Promise<string> {
    const input: CreateContractInput = {
        type: type as LegalDocumentType,
        fromUserId,
        fromUsername,
        fromMailAddress,
        toUserId,
        toUsername,
        toMailAddress,
        title,
        description,
        terms: terms as LegalTerms,
        expiresInDays,
        sendNotification: false // Mail will handle notification
    };

    // Add bodyHtml if we have defaultTerms
    if (defaultTerms) {
        (input as any).bodyHtml = defaultTerms;
    }

    const result = await LegalRegistry.create(input);
    if (!result.success) {
        throw new Error(result.error || 'Failed to create contract');
    }
    return result.data!;
}

// ============================================================================
// BRIDGE: CONTRACT SIGNING SERVICE REPLACEMENTS
// ============================================================================

/**
 * Bridge for ContractSigningService.signContract
 * 
 * This is the main entry point for signing contracts.
 * Automatically triggers enforcement based on contract type.
 */
export async function signContract(
    contractId: string,
    userId: string,
    username: string,
    fullName: string
): Promise<void> {
    const result = await LegalLifecycle.sign(contractId, userId, username, fullName);
    if (!result.success) {
        throw new Error(result.error || 'Failed to sign contract');
    }
}

/**
 * Bridge for ContractSigningService.getContract
 */
export async function getContract(contractId: string): Promise<Contract | null> {
    const result = await LegalRegistry.getById(contractId);
    if (!result.success || !result.data) {
        return null;
    }
    return toContract(result.data);
}

// ============================================================================
// BRIDGE: CONTRACT ENFORCEMENT SERVICE REPLACEMENTS
// ============================================================================

/**
 * Bridge for ContractEnforcementService.grantAccess
 */
export async function grantAccess(contract: Contract): Promise<void> {
    const doc = toLegalDocument(contract);
    await LegalEnforcement.enforceOnSign(doc);
}

/**
 * Bridge for ContractEnforcementService.revokeAccess
 */
export async function revokeAccess(contract: Contract): Promise<void> {
    const doc = toLegalDocument(contract);
    await LegalEnforcement.revokeAllAccess(doc);
}

// ============================================================================
// BRIDGE: PROPOSAL RESPONSE SERVICE REPLACEMENTS
// ============================================================================

/**
 * Bridge for ProposalResponseService.rejectProposal
 */
export async function rejectProposal(
    proposalId: string,
    userId: string,
    username: string,
    reason: string
): Promise<void> {
    const result = await LegalLifecycle.reject(proposalId, userId, username, reason);
    if (!result.success) {
        throw new Error(result.error || 'Failed to reject proposal');
    }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export {
    LegalLifecycle,
    LegalRegistry,
    LegalEscrow,
    LegalEnforcement
};

export type {
    LegalDocument,
    LegalDocumentType,
    LegalDocumentStatus,
    LegalTerms
};
