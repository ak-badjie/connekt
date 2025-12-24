/**
 * ============================================================================
 * CONNEKT LEGAL FRAMEWORK - LIFECYCLE
 * ============================================================================
 * 
 * Contract state machine: handles all contract lifecycle transitions.
 * This is the SINGLE ENTRY POINT for all contract operations.
 * 
 * State Flow:
 *   draft → pending → (signed | rejected | expired | cancelled)
 *                          ↓
 *                     active → (completed | terminated | disputed)
 * 
 * @module legal.lifecycle
 */

import { serverTimestamp, Timestamp } from 'firebase/firestore';

import { LegalRegistry } from './legal.registry';
import { LegalEscrow } from './legal.escrow';
import { LegalEnforcement } from './legal.enforcement';

import type {
    LegalDocument,
    LegalDocumentStatus,
    LegalSignature,
    LegalServiceResponse,
    CreateContractInput
} from './legal.types';

import {
    LEGAL_DOCUMENT_STATUS,
    LEGAL_DOCUMENT_TYPES,
    AUDIT_ACTIONS,
    PROPOSAL_TYPES
} from './legal.constants';

// ============================================================================
// HELPER: Generate signature hash
// ============================================================================

async function generateSignatureHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// LIFECYCLE SERVICE
// ============================================================================

export const LegalLifecycle = {
    // ========================================================================
    // CREATE & SEND
    // ========================================================================

    /**
     * Create and send a new contract
     */
    async create(input: CreateContractInput): Promise<LegalServiceResponse<string>> {
        return LegalRegistry.create(input);
    },

    /**
     * Create a draft (not sent yet)
     */
    async createDraft(input: CreateContractInput): Promise<LegalServiceResponse<string>> {
        return LegalRegistry.createDraft(input);
    },

    /**
     * Send a draft contract
     */
    async send(contractId: string, userId: string): Promise<LegalServiceResponse> {
        // Get draft
        const result = await LegalRegistry.checkStatus(contractId, LEGAL_DOCUMENT_STATUS.DRAFT);
        if (!result.success) return result;

        const contract = result.data!;

        // Verify sender
        if (contract.fromUserId !== userId) {
            return { success: false, error: 'Unauthorized: Only the sender can send this contract' };
        }

        // Update to pending
        return LegalRegistry.update(
            contractId,
            { status: LEGAL_DOCUMENT_STATUS.PENDING },
            {
                by: userId,
                action: AUDIT_ACTIONS.SENT,
                details: 'Contract sent to recipient'
            }
        );
    },

    // ========================================================================
    // SIGN CONTRACT
    // ========================================================================

    /**
     * Sign a contract
     * This is the main entry point for contract signing.
     * Automatically triggers enforcement based on contract type.
     */
    async sign(
        contractId: string,
        userId: string,
        username: string,
        fullName: string
    ): Promise<LegalServiceResponse> {
        try {
            // 1. Validate contract exists and is pending
            const result = await LegalRegistry.checkStatus(
                contractId,
                [LEGAL_DOCUMENT_STATUS.PENDING, LEGAL_DOCUMENT_STATUS.NEGOTIATING]
            );
            if (!result.success) return result;

            const contract = result.data!;

            // 2. Verify signer is the recipient
            if (contract.toUserId !== userId) {
                return { success: false, error: 'Unauthorized: Only the recipient can sign this contract' };
            }

            // 3. Check if already signed
            if (contract.status === LEGAL_DOCUMENT_STATUS.SIGNED ||
                contract.status === LEGAL_DOCUMENT_STATUS.ACCEPTED) {
                return { success: false, error: 'Contract is already signed' };
            }

            // 4. Generate signature
            const signatureHash = await generateSignatureHash(JSON.stringify(contract));
            const signature: LegalSignature = {
                userId,
                username,
                fullName,
                signedAt: Timestamp.now(),
                signatureHash
            };

            // 5. Update contract with signature
            const updateResult = await LegalRegistry.update(
                contractId,
                {
                    status: LEGAL_DOCUMENT_STATUS.SIGNED,
                    signedBy: userId,
                    signedAt: serverTimestamp(),
                    signatureFullName: fullName,
                    signatures: [...(contract.signatures || []), signature]
                },
                {
                    by: userId,
                    action: AUDIT_ACTIONS.SIGNED,
                    details: `Signed by ${fullName}`
                }
            );

            if (!updateResult.success) {
                return updateResult;
            }

            // 6. CRITICAL: Execute enforcement based on contract type
            // This is automatic - the UI doesn't decide what to enforce
            const updatedContract = { ...contract, id: contractId };
            const enforcementResult = await LegalEnforcement.enforceOnSign(updatedContract);

            if (!enforcementResult.success) {
                console.error('[LegalLifecycle.sign] Enforcement failed:', enforcementResult.error);
                // Don't rollback signature, but log the failure
            }

            console.log(`[LegalLifecycle] Contract ${contractId} signed by ${username}`);

            return {
                success: true,
                message: 'Contract signed successfully'
            };
        } catch (error) {
            console.error('[LegalLifecycle.sign] Failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to sign contract'
            };
        }
    },

    // ========================================================================
    // REJECT CONTRACT
    // ========================================================================

    /**
     * Reject a contract
     */
    async reject(
        contractId: string,
        userId: string,
        username: string,
        reason: string
    ): Promise<LegalServiceResponse> {
        try {
            // Validate
            const result = await LegalRegistry.checkStatus(
                contractId,
                [LEGAL_DOCUMENT_STATUS.PENDING, LEGAL_DOCUMENT_STATUS.NEGOTIATING]
            );
            if (!result.success) return result;

            const contract = result.data!;

            // Verify rejector is the recipient
            if (contract.toUserId !== userId) {
                return { success: false, error: 'Unauthorized: Only the recipient can reject this contract' };
            }

            // Update status
            const updateResult = await LegalRegistry.update(
                contractId,
                {
                    status: LEGAL_DOCUMENT_STATUS.REJECTED,
                    rejectedBy: userId,
                    rejectedAt: serverTimestamp(),
                    rejectionReason: reason
                },
                {
                    by: userId,
                    action: AUDIT_ACTIONS.REJECTED,
                    details: reason
                }
            );

            if (!updateResult.success) return updateResult;

            console.log(`[LegalLifecycle] Contract ${contractId} rejected by ${username}`);

            return {
                success: true,
                message: 'Contract rejected'
            };
        } catch (error) {
            console.error('[LegalLifecycle.reject] Failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to reject contract'
            };
        }
    },

    // ========================================================================
    // CANCEL CONTRACT
    // ========================================================================

    /**
     * Cancel a contract (by sender, before signature)
     */
    async cancel(
        contractId: string,
        userId: string,
        reason: string
    ): Promise<LegalServiceResponse> {
        try {
            // Validate - can only cancel pending/draft
            const result = await LegalRegistry.checkStatus(
                contractId,
                [LEGAL_DOCUMENT_STATUS.PENDING, LEGAL_DOCUMENT_STATUS.DRAFT]
            );
            if (!result.success) return result;

            const contract = result.data!;

            // Verify canceller is the sender
            if (contract.fromUserId !== userId) {
                return { success: false, error: 'Unauthorized: Only the sender can cancel this contract' };
            }

            // Update status
            const updateResult = await LegalRegistry.update(
                contractId,
                { status: LEGAL_DOCUMENT_STATUS.CANCELLED },
                {
                    by: userId,
                    action: AUDIT_ACTIONS.CANCELLED,
                    details: reason
                }
            );

            return updateResult;
        } catch (error) {
            console.error('[LegalLifecycle.cancel] Failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to cancel contract'
            };
        }
    },

    // ========================================================================
    // COMPLETE CONTRACT
    // ========================================================================

    /**
     * Mark a contract as completed (all obligations fulfilled)
     */
    async complete(
        contractId: string,
        userId: string,
        details?: string
    ): Promise<LegalServiceResponse> {
        try {
            // Validate - must be signed/accepted
            const result = await LegalRegistry.checkStatus(
                contractId,
                [LEGAL_DOCUMENT_STATUS.SIGNED, LEGAL_DOCUMENT_STATUS.ACCEPTED]
            );
            if (!result.success) return result;

            const contract = result.data!;

            // Verify user is a party to the contract
            const isParty = contract.fromUserId === userId || contract.toUserId === userId;
            if (!isParty) {
                return { success: false, error: 'Unauthorized: Only parties to the contract can complete it' };
            }

            // Execute completion enforcement
            const enforcementResult = await LegalEnforcement.enforceOnComplete(contract);
            if (!enforcementResult.success) {
                console.error('[LegalLifecycle.complete] Enforcement failed:', enforcementResult.error);
            }

            // Update status
            const updateResult = await LegalRegistry.update(
                contractId,
                {
                    status: LEGAL_DOCUMENT_STATUS.COMPLETED,
                    completedAt: serverTimestamp()
                },
                {
                    by: userId,
                    action: AUDIT_ACTIONS.COMPLETED,
                    details: details || 'All obligations fulfilled'
                }
            );

            return updateResult;
        } catch (error) {
            console.error('[LegalLifecycle.complete] Failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to complete contract'
            };
        }
    },

    // ========================================================================
    // TERMINATE CONTRACT
    // ========================================================================

    /**
     * Terminate a contract early
     */
    async terminate(
        contractId: string,
        userId: string,
        reason: string
    ): Promise<LegalServiceResponse> {
        try {
            // Validate - must be signed/accepted
            const result = await LegalRegistry.checkStatus(
                contractId,
                [LEGAL_DOCUMENT_STATUS.SIGNED, LEGAL_DOCUMENT_STATUS.ACCEPTED]
            );
            if (!result.success) return result;

            const contract = result.data!;

            // Verify user is a party
            const isParty = contract.fromUserId === userId || contract.toUserId === userId;
            if (!isParty) {
                return { success: false, error: 'Unauthorized: Only parties to the contract can terminate it' };
            }

            // Execute termination enforcement (refunds, access revocation)
            const enforcementResult = await LegalEnforcement.enforceOnTerminate(contract, userId, reason);
            if (!enforcementResult.success) {
                console.error('[LegalLifecycle.terminate] Enforcement failed:', enforcementResult.error);
            }

            // Update status
            const updateResult = await LegalRegistry.update(
                contractId,
                {
                    status: LEGAL_DOCUMENT_STATUS.TERMINATED,
                    terminatedBy: userId,
                    terminatedAt: serverTimestamp(),
                    terminationReason: reason
                },
                {
                    by: userId,
                    action: AUDIT_ACTIONS.TERMINATED,
                    details: reason
                }
            );

            return updateResult;
        } catch (error) {
            console.error('[LegalLifecycle.terminate] Failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to terminate contract'
            };
        }
    },

    // ========================================================================
    // EXPIRE CONTRACT
    // ========================================================================

    /**
     * Expire a contract (called by scheduled job or manually)
     */
    async expire(contractId: string): Promise<LegalServiceResponse> {
        try {
            // Validate - must be pending
            const result = await LegalRegistry.checkStatus(contractId, LEGAL_DOCUMENT_STATUS.PENDING);
            if (!result.success) return result;

            // Update status
            const updateResult = await LegalRegistry.update(
                contractId,
                { status: LEGAL_DOCUMENT_STATUS.EXPIRED },
                {
                    by: 'system',
                    action: AUDIT_ACTIONS.EXPIRED,
                    details: 'Contract expired automatically'
                }
            );

            return updateResult;
        } catch (error) {
            console.error('[LegalLifecycle.expire] Failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to expire contract'
            };
        }
    },

    // ========================================================================
    // QUERY HELPERS
    // ========================================================================

    /**
     * Get contract by ID
     */
    async get(contractId: string): Promise<LegalServiceResponse<LegalDocument>> {
        return LegalRegistry.getById(contractId);
    },

    /**
     * Get pending contracts for user
     */
    async getPendingForUser(userId: string): Promise<LegalDocument[]> {
        return LegalRegistry.getPendingForUser(userId);
    },

    /**
     * Get active contracts for user
     */
    async getActiveForUser(userId: string): Promise<LegalDocument[]> {
        return LegalRegistry.getActiveForUser(userId);
    }
};
