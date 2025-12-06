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
    currency: string; // Default: 'GMD'
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
    metadata?: Record<string, any>; // Flexible metadata for payment details, etc.
    timestamp?: any; // Timestamp | FieldValue
    createdAt: any; // Timestamp | FieldValue
}

export interface EscrowHold {
    id?: string;
    contractId?: string; // Optional: funds can be held for a project without a specific contract yet
    projectId?: string;  // NEW: Link to project
    type?: 'contract' | 'project'; // NEW: Type of hold
    fromWalletId: string;
    toWalletId?: string; // Optional: Project holds might not have a destination wallet yet
    fromUserId: string;
    toUserId?: string;   // Optional
    amount: number;
    currency: string;
    status: 'held' | 'released' | 'refunded' | 'partially_released';
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
    fromUserId: string;
    toUserId: string;
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
