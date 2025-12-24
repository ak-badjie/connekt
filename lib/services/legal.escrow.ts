/**
 * ============================================================================
 * CONNEKT LEGAL FRAMEWORK - ESCROW
 * ============================================================================
 * 
 * Centralized escrow management for all contract types.
 * Wraps WalletService with legal-specific logic and tracking.
 * 
 * @module legal.escrow
 */

import { db } from '@/lib/firebase';
import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs
} from 'firebase/firestore';

import { WalletService } from './wallet-service';
import { LegalRegistry } from './legal.registry';

import type {
    LegalDocument,
    LegalEscrowHold,
    LegalServiceResponse
} from './legal.types';

import {
    ESCROW_PREFIX,
    LEGAL_COLLECTIONS,
    AUDIT_ACTIONS,
    DEFAULT_CURRENCY
} from './legal.constants';

// ============================================================================
// ESCROW TYPES
// ============================================================================

type EscrowType = 'contract' | 'salary' | 'project_admin' | 'task_admin';

interface HoldEscrowInput {
    contractId: string;
    amount: number;
    fromUserId: string;
    toUserId: string;
    escrowType: EscrowType;
    currency?: string;
}

interface ReleaseEscrowInput {
    escrowId: string;
    contractId: string;
    reason?: string;
}

// ============================================================================
// ESCROW SERVICE
// ============================================================================

export const LegalEscrow = {
    // ========================================================================
    // ESCROW ID GENERATION
    // ========================================================================

    /**
     * Generate escrow ID based on type and contract
     */
    generateEscrowId(contractId: string, type: EscrowType, suffix?: string): string {
        const prefix = ESCROW_PREFIX[type.toUpperCase() as keyof typeof ESCROW_PREFIX] || ESCROW_PREFIX.CONTRACT;
        return suffix ? `${prefix}${contractId}_${suffix}` : `${prefix}${contractId}`;
    },

    // ========================================================================
    // HOLD OPERATIONS
    // ========================================================================

    /**
     * Hold funds in escrow for a contract
     */
    async hold(input: HoldEscrowInput): Promise<LegalServiceResponse<string>> {
        try {
            const { contractId, amount, fromUserId, toUserId, escrowType, currency } = input;

            if (amount <= 0) {
                return { success: true, data: '', message: 'No escrow needed for zero amount' };
            }

            const escrowId = this.generateEscrowId(contractId, escrowType);
            const fromWalletId = `user_${fromUserId}`;
            const toWalletId = `user_${toUserId}`;

            // Check if already held
            const existing = await this.getEscrowHold(escrowId);
            if (existing.success && existing.data) {
                console.log(`[LegalEscrow] Escrow already held: ${escrowId}`);
                return { success: true, data: escrowId, message: 'Escrow already exists' };
            }

            // Check sufficient funds
            const hasFunds = await WalletService.hasSufficientFunds(fromWalletId, amount);
            if (!hasFunds) {
                return {
                    success: false,
                    error: `Insufficient funds. Required: ${currency || DEFAULT_CURRENCY} ${amount}`
                };
            }

            // Hold in escrow via WalletService
            await WalletService.holdInEscrow(
                escrowId,
                fromWalletId,
                toWalletId,
                fromUserId,
                toUserId,
                amount
            );

            // Add audit
            await LegalRegistry.addAudit(contractId, {
                by: fromUserId,
                action: AUDIT_ACTIONS.ESCROW_HELD,
                details: `${currency || DEFAULT_CURRENCY} ${amount} held in escrow`,
                meta: { escrowId, amount, escrowType }
            });

            console.log(`[LegalEscrow] Held ${amount} for ${escrowType}: ${escrowId}`);

            return {
                success: true,
                data: escrowId,
                message: `Escrow held: ${currency || DEFAULT_CURRENCY} ${amount}`
            };
        } catch (error) {
            console.error('[LegalEscrow.hold] Failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to hold escrow'
            };
        }
    },

    /**
     * Hold salary escrow for employment contract
     * For job contracts, we hold escrow automatically if there's any payment amount
     */
    async holdSalary(contract: LegalDocument): Promise<LegalServiceResponse<string>> {
        const terms = contract.terms;

        // Get salary from multiple possible fields
        const salaryAmount = terms.salaryAmount || terms.salary || terms.paymentAmount || terms.totalAmount || 0;
        const currency = terms.salaryCurrency || terms.paymentCurrency || terms.currency || DEFAULT_CURRENCY;

        // For job contracts, ALWAYS hold escrow if there's a salary amount
        // (Don't require explicit requireSalaryEscrow flag)
        if (salaryAmount <= 0) {
            console.log('[LegalEscrow.holdSalary] No salary amount found in contract terms');
            return { success: true, data: '', message: 'No salary to hold' };
        }

        console.log(`[LegalEscrow.holdSalary] Holding salary: ${salaryAmount} ${currency}`);

        const month = new Date().getMonth();
        const escrowId = this.generateEscrowId(contract.id!, 'salary', String(month));

        return this.hold({
            contractId: contract.id!,
            amount: salaryAmount,
            fromUserId: contract.fromUserId,
            toUserId: contract.toUserId,
            escrowType: 'salary',
            currency: currency
        });
    },

    /**
     * Hold project admin escrow (budget)
     */
    async holdProjectAdminBudget(contract: LegalDocument): Promise<LegalServiceResponse<string>> {
        const budget = contract.terms.projectBudget || contract.terms.paymentAmount || 0;

        if (budget <= 0) {
            return { success: true, data: '', message: 'No budget to hold' };
        }

        return this.hold({
            contractId: contract.id!,
            amount: budget,
            fromUserId: contract.fromUserId,
            toUserId: contract.toUserId,
            escrowType: 'project_admin',
            currency: contract.terms.paymentCurrency
        });
    },

    /**
     * Hold task admin escrow (payment)
     */
    async holdTaskAdminPayment(contract: LegalDocument): Promise<LegalServiceResponse<string>> {
        const payment = contract.terms.taskPayment || contract.terms.paymentAmount || 0;

        if (payment <= 0) {
            return { success: true, data: '', message: 'No payment to hold' };
        }

        return this.hold({
            contractId: contract.id!,
            amount: payment,
            fromUserId: contract.fromUserId,
            toUserId: contract.toUserId,
            escrowType: 'task_admin',
            currency: contract.terms.paymentCurrency
        });
    },

    // ========================================================================
    // RELEASE OPERATIONS
    // ========================================================================

    /**
     * Release full escrow to recipient
     */
    async release(contractId: string, escrowType: EscrowType, userId: string): Promise<LegalServiceResponse> {
        try {
            const escrowId = this.generateEscrowId(contractId, escrowType);

            await WalletService.releaseEscrow(escrowId);

            await LegalRegistry.addAudit(contractId, {
                by: userId,
                action: AUDIT_ACTIONS.ESCROW_RELEASED,
                details: 'Escrow released to recipient',
                meta: { escrowId, escrowType }
            });

            console.log(`[LegalEscrow] Released: ${escrowId}`);

            return {
                success: true,
                message: 'Escrow released successfully'
            };
        } catch (error) {
            console.error('[LegalEscrow.release] Failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to release escrow'
            };
        }
    },

    /**
     * Release partial escrow (for milestones)
     */
    async releasePartial(
        contractId: string,
        escrowType: EscrowType,
        amount: number,
        userId: string,
        reason?: string
    ): Promise<LegalServiceResponse> {
        try {
            const escrowId = this.generateEscrowId(contractId, escrowType);

            await WalletService.releaseEscrowPartial(escrowId, amount);

            await LegalRegistry.addAudit(contractId, {
                by: userId,
                action: AUDIT_ACTIONS.ESCROW_PARTIAL_RELEASE,
                details: reason || `Partial release: ${amount}`,
                meta: { escrowId, amount, escrowType }
            });

            console.log(`[LegalEscrow] Partial release: ${amount} from ${escrowId}`);

            return {
                success: true,
                message: `Released ${amount} from escrow`
            };
        } catch (error) {
            console.error('[LegalEscrow.releasePartial] Failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to release partial escrow'
            };
        }
    },

    /**
     * Release monthly salary with penalty deductions
     */
    async releaseSalary(
        contract: LegalDocument,
        penalties: number = 0
    ): Promise<LegalServiceResponse<{ netSalary: number; penalties: number }>> {
        try {
            const terms = contract.terms;
            if (!terms.salaryAmount) {
                return { success: false, error: 'No salary amount specified' };
            }

            const month = new Date().getMonth();
            const escrowId = this.generateEscrowId(contract.id!, 'salary', String(month));

            const netSalary = Math.max(0, terms.salaryAmount - penalties);

            if (netSalary > 0) {
                await WalletService.releaseEscrowPartial(escrowId, netSalary);
            }

            await LegalRegistry.addAudit(contract.id!, {
                by: 'system',
                action: AUDIT_ACTIONS.ESCROW_RELEASED,
                details: penalties > 0
                    ? `Salary released: ${netSalary} (${penalties} deducted for penalties)`
                    : `Salary released: ${netSalary}`,
                meta: { escrowId, salary: terms.salaryAmount, penalties, netSalary }
            });

            return {
                success: true,
                data: { netSalary, penalties },
                message: `Salary of ${netSalary} released`
            };
        } catch (error) {
            console.error('[LegalEscrow.releaseSalary] Failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to release salary'
            };
        }
    },

    // ========================================================================
    // REFUND OPERATIONS
    // ========================================================================

    /**
     * Refund escrow to sender
     */
    async refund(
        contractId: string,
        escrowType: EscrowType,
        userId: string,
        reason: string
    ): Promise<LegalServiceResponse> {
        try {
            const escrowId = this.generateEscrowId(contractId, escrowType);

            await WalletService.refundEscrow(escrowId, reason);

            await LegalRegistry.addAudit(contractId, {
                by: userId,
                action: AUDIT_ACTIONS.ESCROW_REFUNDED,
                details: `Escrow refunded: ${reason}`,
                meta: { escrowId, escrowType, reason }
            });

            console.log(`[LegalEscrow] Refunded: ${escrowId} - ${reason}`);

            return {
                success: true,
                message: 'Escrow refunded successfully'
            };
        } catch (error) {
            console.error('[LegalEscrow.refund] Failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to refund escrow'
            };
        }
    },

    // ========================================================================
    // QUERY OPERATIONS
    // ========================================================================

    /**
     * Get escrow hold by ID
     */
    async getEscrowHold(escrowId: string): Promise<LegalServiceResponse<LegalEscrowHold>> {
        try {
            const docRef = doc(db, LEGAL_COLLECTIONS.ESCROW, escrowId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                return { success: false, error: 'Escrow hold not found' };
            }

            return {
                success: true,
                data: { id: docSnap.id, ...docSnap.data() } as LegalEscrowHold
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get escrow'
            };
        }
    },

    /**
     * Get all escrow holds for a contract
     */
    async getContractEscrows(contractId: string): Promise<LegalEscrowHold[]> {
        try {
            const q = query(
                collection(db, LEGAL_COLLECTIONS.ESCROW),
                where('contractId', '==', contractId)
            );
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as LegalEscrowHold));
        } catch (error) {
            console.error('[LegalEscrow.getContractEscrows] Failed:', error);
            return [];
        }
    },

    /**
     * Check if escrow exists and is held
     */
    async isHeld(contractId: string, escrowType: EscrowType): Promise<boolean> {
        const escrowId = this.generateEscrowId(contractId, escrowType);
        const result = await this.getEscrowHold(escrowId);
        return result.success && result.data?.status === 'held';
    }
};
