import { db } from '@/lib/firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    serverTimestamp,
    increment,
    arrayUnion,
    orderBy,
    limit as firestoreLimit
} from 'firebase/firestore';
import { NotificationService } from './notification-service';
import type { Wallet, WalletTransaction, EscrowHold, PaymentRequest, WalletStats } from '@/lib/types/wallet.types';

/**
 * WalletService
 * 
 * Manages ConnektWallet financial operations including:
 * - Wallet CRUD
 * - Balance updates
 * - Transaction logging
 * - Escrow management for contracts
 */
export const WalletService = {
    /**
     * Create a new wallet for user or agency
     */
    async createWallet(ownerId: string, ownerType: 'user' | 'agency'): Promise<string> {
        const walletId = `${ownerType}_${ownerId}`;
        const wallet: Wallet = {
            id: walletId,
            ownerId,
            ownerType,
            balance: 0,
            currency: 'USD',
            transactions: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        await setDoc(doc(db, 'wallets', walletId), wallet);
        return walletId;
    },

    /**
     * Get wallet by owner ID
     */
    async getWallet(ownerId: string, ownerType: 'user' | 'agency'): Promise<Wallet | null> {
        const walletId = `${ownerType}_${ownerId}`;
        const walletRef = doc(db, 'wallets', walletId);
        const walletSnap = await getDoc(walletRef);

        if (!walletSnap.exists()) {
            return null;
        }

        return {
            id: walletSnap.id,
            ...walletSnap.data()
        } as Wallet;
    },

    /**
     * Get or create wallet (helper function)
     */
    async getOrCreateWallet(ownerId: string, ownerType: 'user' | 'agency'): Promise<Wallet> {
        let wallet = await this.getWallet(ownerId, ownerType);

        if (!wallet) {
            const walletId = await this.createWallet(ownerId, ownerType);
            wallet = await this.getWallet(ownerId, ownerType);
        }

        return wallet!;
    },

    /**
     * Update wallet balance
     */
    async updateBalance(walletId: string, amount: number): Promise<void> {
        const walletRef = doc(db, 'wallets', walletId);
        await updateDoc(walletRef, {
            balance: increment(amount),
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Add transaction to wallet
     */
    async addTransaction(
        walletId: string,
        transaction: Omit<WalletTransaction, 'id' | 'createdAt'>
    ): Promise<string> {
        const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const fullTransaction: WalletTransaction = {
            ...transaction,
            id: transactionId,
            createdAt: serverTimestamp()
        };

        const walletRef = doc(db, 'wallets', walletId);
        await updateDoc(walletRef, {
            transactions: arrayUnion(fullTransaction),
            updatedAt: serverTimestamp()
        });

        return transactionId;
    },

    /**
     * Get transaction history for a wallet
     */
    async getTransactionHistory(
        walletId: string,
        limitCount: number = 50
    ): Promise<WalletTransaction[]> {
        const wallet = await getDoc(doc(db, 'wallets', walletId));

        if (!wallet.exists()) {
            return [];
        }

        const walletData = wallet.data() as Wallet;
        const transactions = walletData.transactions || [];

        // Sort by createdAt descending and limit
        return transactions
            .sort((a, b) => {
                const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return bTime - aTime;
            })
            .slice(0, limitCount);
    },

    /**
     * Check if wallet has sufficient funds
     */
    async hasSufficientFunds(walletId: string, amount: number): Promise<boolean> {
        const walletRef = doc(db, 'wallets', walletId);
        const walletSnap = await getDoc(walletRef);

        if (!walletSnap.exists()) {
            return false;
        }

        const wallet = walletSnap.data() as Wallet;
        return wallet.balance >= amount;
    },

    /**
     * Hold payment in escrow for a contract
     */
    async holdInEscrow(
        contractId: string,
        fromWalletId: string,
        toWalletId: string,
        fromUserId: string,
        toUserId: string,
        amount: number
    ): Promise<string> {
        // Check if sender has sufficient funds
        const hasFunds = await this.hasSufficientFunds(fromWalletId, amount);
        if (!hasFunds) {
            throw new Error('Insufficient funds in wallet');
        }

        // Deduct from sender's wallet
        await this.updateBalance(fromWalletId, -amount);
        await this.addTransaction(fromWalletId, {
            type: 'escrow_hold',
            amount: -amount,
            description: `Escrow hold for contract ${contractId}`,
            relatedEntityId: contractId,
            relatedEntityType: 'contract',
            status: 'completed'
        });

        // Create escrow hold record
        const escrowId = `escrow_${contractId}`;
        const escrowHold: EscrowHold = {
            id: escrowId,
            contractId,
            amount,
            fromWalletId,
            toWalletId,
            fromUserId,
            toUserId,
            status: 'held',
            heldAt: serverTimestamp()
        };

        await setDoc(doc(db, 'escrow_holds', escrowId), escrowHold);

        // Create notifications for both parties
        try {
            // Notify sender
            await NotificationService.createNotification(
                fromUserId,
                'transaction',
                'Escrow Hold Initiated',
                `$${amount.toFixed(2)} has been held in escrow for contract.`,
                'high',
                {
                    type: 'transaction',
                    transactionId: escrowId,
                    transactionType: 'escrow_hold',
                    amount: -amount,
                    currency: 'USD',
                    fromUserId,
                    toUserId,
                    relatedEntityId: contractId,
                    relatedEntityType: 'contract'
                },
                `/wallet`,
                'View Wallet'
            );

            // Notify recipient
            await NotificationService.createNotification(
                toUserId,
                'transaction',
                'Escrow Payment Pending',
                `$${amount.toFixed(2)} is being held in escrow for your contract.`,
                'medium',
                {
                    type: 'transaction',
                    transactionId: escrowId,
                    transactionType: 'escrow_hold',
                    amount,
                    currency: 'USD',
                    fromUserId,
                    toUserId,
                    relatedEntityId: contractId,
                    relatedEntityType: 'contract'
                },
                `/wallet`,
                'View Wallet'
            );
        } catch (error) {
            console.error('Error creating escrow hold notifications:', error);
        }

        return escrowId;
    },

    /**
     * Release escrow payment to recipient
     */
    async releaseEscrow(contractId: string): Promise<void> {
        const escrowId = `escrow_${contractId}`;
        const escrowRef = doc(db, 'escrow_holds', escrowId);
        const escrowSnap = await getDoc(escrowRef);

        if (!escrowSnap.exists()) {
            throw new Error('Escrow hold not found');
        }

        const escrow = escrowSnap.data() as EscrowHold;

        if (escrow.status !== 'held') {
            throw new Error('Escrow is not in held status');
        }

        // Add to recipient's wallet
        await this.updateBalance(escrow.toWalletId, escrow.amount);
        await this.addTransaction(escrow.toWalletId, {
            type: 'escrow_release',
            amount: escrow.amount,
            description: `Payment received for contract ${contractId}`,
            relatedEntityId: contractId,
            relatedEntityType: 'contract',
            status: 'completed'
        });

        // Update escrow status
        await updateDoc(escrowRef, {
            status: 'released',
            releasedAt: serverTimestamp()
        });

        // Notify recipient
        try {
            await NotificationService.createNotification(
                escrow.toUserId,
                'transaction',
                'Payment Released',
                `$${escrow.amount.toFixed(2)} has been released from escrow to your wallet.`,
                'high',
                {
                    type: 'transaction',
                    transactionId: contractId,
                    transactionType: 'escrow_release',
                    amount: escrow.amount,
                    currency: 'USD',
                    fromUserId: escrow.fromUserId,
                    toUserId: escrow.toUserId,
                    relatedEntityId: contractId,
                    relatedEntityType: 'contract'
                },
                `/wallet`,
                'View Wallet'
            );
        } catch (error) {
            console.error('Error creating escrow release notification:', error);
        }
    },

    /**
     * Refund escrow payment to sender
     */
    async refundEscrow(contractId: string, reason?: string): Promise<void> {
        const escrowId = `escrow_${contractId}`;
        const escrowRef = doc(db, 'escrow_holds', escrowId);
        const escrowSnap = await getDoc(escrowRef);

        if (!escrowSnap.exists()) {
            throw new Error('Escrow hold not found');
        }

        const escrow = escrowSnap.data() as EscrowHold;

        if (escrow.status !== 'held') {
            throw new Error('Escrow is not in held status');
        }

        // Refund to sender's wallet
        await this.updateBalance(escrow.fromWalletId, escrow.amount);
        await this.addTransaction(escrow.fromWalletId, {
            type: 'refund',
            amount: escrow.amount,
            description: `Refund for contract ${contractId}${reason ? `: ${reason}` : ''}`,
            relatedEntityId: contractId,
            relatedEntityType: 'contract',
            status: 'completed'
        });

        // Update escrow status
        await updateDoc(escrowRef, {
            status: 'refunded',
            refundedAt: serverTimestamp(),
            reason
        });

        // Notify sender about refund
        try {
            await NotificationService.createNotification(
                escrow.fromUserId,
                'transaction',
                'Escrow Refunded',
                `$${escrow.amount.toFixed(2)} has been refunded to your wallet.${reason ? ` Reason: ${reason}` : ''}`,
                'high',
                {
                    type: 'transaction',
                    transactionId: contractId,
                    transactionType: 'refund',
                    amount: escrow.amount,
                    currency: 'USD',
                    fromUserId: escrow.fromUserId,
                    toUserId: escrow.toUserId,
                    relatedEntityId: contractId,
                    relatedEntityType: 'contract'
                },
                `/wallet`,
                'View Wallet'
            );
        } catch (error) {
            console.error('Error creating refund notification:', error);
        }
    },

    /**
     * Get all escrow holds for a wallet
     */
    async getEscrowHolds(walletId: string): Promise<EscrowHold[]> {
        const q = query(
            collection(db, 'escrow_holds'),
            where('fromWalletId', '==', walletId),
            where('status', '==', 'held')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as EscrowHold));
    },

    /**
     * Process direct payment (without escrow)
     */
    async processPayment(paymentRequest: PaymentRequest): Promise<string> {
        const { fromWalletId, toWalletId, amount, description, relatedEntityId, relatedEntityType } = paymentRequest;

        // Check if sender has sufficient funds
        const hasFunds = await this.hasSufficientFunds(fromWalletId, amount);
        if (!hasFunds) {
            throw new Error('Insufficient funds in wallet');
        }

        // Deduct from sender
        await this.updateBalance(fromWalletId, -amount);
        const senderTxnId = await this.addTransaction(fromWalletId, {
            type: 'payment',
            amount: -amount,
            description,
            relatedEntityId,
            relatedEntityType,
            status: 'completed'
        });

        // Add to recipient
        await this.updateBalance(toWalletId, amount);
        await this.addTransaction(toWalletId, {
            type: 'payment',
            amount,
            description,
            relatedEntityId,
            relatedEntityType,
            status: 'completed'
        });

        // Create notifications for both parties
        try {
            // Notify sender
            await NotificationService.createNotification(
                paymentRequest.fromWalletId.replace('user_', '').replace('agency_', ''),
                'transaction',
                'Payment Sent',
                `You sent $${amount.toFixed(2)}.`,
                'medium',
                {
                    type: 'transaction',
                    transactionId: senderTxnId,
                    transactionType: 'payment',
                    amount: -amount,
                    currency: 'USD',
                    toUserId: paymentRequest.toWalletId.replace('user_', '').replace('agency_', ''),
                    relatedEntityId,
                    relatedEntityType
                },
                `/wallet`,
                'View Wallet'
            );

            // Notify recipient
            await NotificationService.createNotification(
                paymentRequest.toWalletId.replace('user_', '').replace('agency_', ''),
                'transaction',
                'Payment Received',
                `You received $${amount.toFixed(2)}.`,
                'high',
                {
                    type: 'transaction',
                    transactionId: senderTxnId,
                    transactionType: 'payment',
                    amount,
                    currency: 'USD',
                    fromUserId: paymentRequest.fromWalletId.replace('user_', '').replace('agency_', ''),
                    relatedEntityId,
                    relatedEntityType
                },
                `/wallet`,
                'View Wallet'
            );
        } catch (error) {
            console.error('Error creating payment notifications:', error);
        }

        return senderTxnId;
    },

    /**
     * Get wallet statistics
     */
    async getWalletStats(walletId: string): Promise<WalletStats> {
        const transactions = await this.getTransactionHistory(walletId, 1000);

        const stats: WalletStats = {
            totalDeposits: 0,
            totalWithdrawals: 0,
            totalPayments: 0,
            totalRefunds: 0,
            escrowHoldings: 0,
            transactionCount: transactions.length
        };

        transactions.forEach(txn => {
            if (txn.type === 'deposit') stats.totalDeposits += txn.amount;
            if (txn.type === 'withdrawal') stats.totalWithdrawals += Math.abs(txn.amount);
            if (txn.type === 'payment') {
                if (txn.amount > 0) stats.totalPayments += txn.amount;
                else stats.totalPayments += Math.abs(txn.amount);
            }
            if (txn.type === 'refund') stats.totalRefunds += txn.amount;
        });

        // Get escrow holdings
        const escrowHolds = await this.getEscrowHolds(walletId);
        stats.escrowHoldings = escrowHolds.reduce((sum, hold) => sum + hold.amount, 0);

        return stats;
    }
};
