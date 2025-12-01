import { Timestamp } from 'firebase/firestore';

/**
 * Wallet Types for ConnektWallet System
 * 
 * Manages user and agency financial accounts with transaction history,
 * escrow holdings, and payment processing.
 */

export interface Wallet {
    id?: string;
    ownerId: string; // userId or agencyId
    ownerType: 'user' | 'agency';
    balance: number; // Current available balance
    currency: string; // Default: 'USD'
    transactions: WalletTransaction[];
    escrowHolds: EscrowHold[];
    createdAt: any; // Timestamp | Date | FieldValue
    updatedAt: any; // Timestamp | Date | FieldValue
}

export interface WalletTransaction {
    id?: string;
    walletId: string;
    type: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'escrow_hold' | 'escrow_release';
    amount: number;
    currency: string;
    description: string;
    status: 'pending' | 'completed' | 'failed';
    relatedUserId?: string;
    relatedContractId?: string;
    relatedEntityId?: string;
    relatedEntityType?: 'contract' | 'project' | 'task' | 'subscription';
    referenceId?: string;
    timestamp?: any; // Timestamp | FieldValue
    createdAt: any; // Timestamp | FieldValue
}

export interface EscrowHold {
    id?: string;
    contractId: string;
    fromWalletId: string;
    toWalletId: string;
    fromUserId: string;
    toUserId: string;
    amount: number;
    currency: string;
    status: 'held' | 'released' | 'refunded';
    referenceId?: string;
    createdAt: any; // Timestamp | FieldValue
    heldAt?: any; // Timestamp | FieldValue
    releasedAt?: any; // Timestamp | FieldValue
    refundedAt?: any; // Timestamp | FieldValue
    reason?: string;
}

/**
 * Payment Request for wallet operations
 */
export interface PaymentRequest {
    fromWalletId: string;
    toWalletId: string;
    amount: number;
    description: string;
    relatedEntityId?: string;
    relatedEntityType?: 'contract' | 'project' | 'task' | 'subscription';
}

/**
 * Wallet statistics for display
 */
export interface WalletStats {
    totalDeposits: number;
    totalWithdrawals: number;
    totalPayments: number;
    totalRefunds: number;
    escrowHoldings: number;
    transactionCount: number;
}
