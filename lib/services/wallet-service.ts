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
    limit as firestoreLimit,
    runTransaction,
    Timestamp
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
            currency: 'GMD',
            transactions: [],
            escrowHolds: [],
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
     * Partially release escrow funds for a contract (e.g., per milestone)
     */
    async releaseEscrowPartial(contractId: string, amount: number): Promise<void> {
        if (amount <= 0) throw new Error('Invalid release amount');

        const escrowId = `escrow_${contractId}`;
        const escrowRef = doc(db, 'escrow_holds', escrowId);
        const escrowSnap = await getDoc(escrowRef);

        if (!escrowSnap.exists()) {
            throw new Error('Escrow hold not found');
        }

        const escrow = escrowSnap.data() as EscrowHold;

        if (escrow.status !== 'held' && escrow.status !== 'partially_released') {
            throw new Error('Escrow is not available for release');
        }

        if (amount > escrow.amount) {
            throw new Error('Release amount exceeds escrow balance');
        }

        // Add to recipient's wallet
        await this.updateBalance(escrow.toWalletId, amount);
        await this.addTransaction(escrow.toWalletId, {
            type: 'escrow_release',
            walletId: escrow.toWalletId,
            currency: escrow.currency || 'GMD',
            amount,
            description: `Partial escrow release for contract ${contractId}`,
            relatedEntityId: contractId,
            relatedEntityType: 'contract',
            status: 'completed'
        });

        // Update escrow record
        const remaining = escrow.amount - amount;
        await updateDoc(escrowRef, {
            amount: remaining,
            status: remaining > 0 ? 'partially_released' : 'released',
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
            createdAt: Timestamp.now() // Use Timestamp.now() instead of serverTimestamp() for arrayUnion
        };

        const walletRef = doc(db, 'wallets', walletId);
        await updateDoc(walletRef, {
            transactions: arrayUnion(fullTransaction),
            updatedAt: serverTimestamp()
        });

        return transactionId;
    },

    /**
     * Process top-up transaction atomically
     */
    async processTopUpTransaction(
        walletId: string,
        amount: number,
        referenceId: string,
        description: string,
        metadata?: Record<string, any>
    ): Promise<{ success: boolean; message: string }> {
        return await runTransaction(db, async (transaction) => {
            const walletRef = doc(db, 'wallets', walletId);
            const walletDoc = await transaction.get(walletRef);

            if (!walletDoc.exists()) {
                throw new Error('Wallet not found');
            }

            const walletData = walletDoc.data() as Wallet;
            const transactions = walletData.transactions || [];

            // Idempotency Check: Check if transaction with this referenceId already exists
            const exists = transactions.some(t => t.referenceId === referenceId);
            if (exists) {
                return { success: true, message: 'Transaction already processed' };
            }

            // Create new transaction object
            const newTransaction: WalletTransaction = {
                id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'deposit',
                walletId,
                amount,
                currency: 'GMD',
                description,
                status: 'completed',
                referenceId,
                createdAt: Timestamp.now(),
                metadata // Save metadata (e.g., paymentMethod)
            };

            // Update wallet atomically: increment balance AND add transaction
            transaction.update(walletRef, {
                balance: increment(amount),
                transactions: arrayUnion(newTransaction),
                updatedAt: serverTimestamp()
            });

            // Create notification (after transaction, though technically outside atomic block, it's safe enough for notifs)
            try {
                const userId = walletId.replace('user_', ''); // Extract userId
                await NotificationService.createNotification(
                    userId,
                    'transaction',
                    'Wallet Top-up Successful',
                    `Your wallet has been credited with ${newTransaction.currency} ${amount.toFixed(2)}.`,
                    'high',
                    {
                        type: 'transaction',
                        transactionId: newTransaction.id!,
                        transactionType: 'deposit',
                        amount: amount,
                        currency: newTransaction.currency,
                        fromUserId: 'system',
                        toUserId: userId,
                        relatedEntityId: referenceId,
                        relatedEntityType: 'subscription' as any // Generic entity type for top-ups
                    },
                    '/dashboard/wallet',
                    'View Wallet'
                );
            } catch (e) {
                console.error('Failed to send notification for top-up', e);
            }

            return { success: true, message: 'Top-up successful' };
        });
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

        const walletData = walletSnap.data() as Wallet;
        return walletData.balance >= amount;
    },

    /**
     * Hold funds in escrow for a contract
     */
    async holdInEscrow(
        contractId: string,
        fromWalletId: string,
        toWalletId: string,
        fromUserId: string,
        toUserId: string,
        amount: number
    ): Promise<string> {
        const hasFunds = await this.hasSufficientFunds(fromWalletId, amount);

        if (!hasFunds) {
            throw new Error('Insufficient funds');
        }

        // Deduct from sender's wallet
        await this.updateBalance(fromWalletId, -amount);
        await this.addTransaction(fromWalletId, {
            type: 'escrow_hold',
            walletId: fromWalletId,
            currency: 'GMD',
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
            currency: 'GMD',
            status: 'held',
            createdAt: serverTimestamp(),
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
                `D${amount.toFixed(2)} has been held in escrow for contract.`,
                'high',
                {
                    type: 'transaction',
                    transactionId: escrowId,
                    transactionType: 'escrow_hold',
                    amount: -amount,
                    currency: 'GMD',
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
                `D${amount.toFixed(2)} is being held in escrow for your contract.`,
                'medium',
                {
                    type: 'transaction',
                    transactionId: escrowId,
                    transactionType: 'escrow_hold',
                    amount,
                    currency: 'GMD',
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
            walletId: escrow.toWalletId,
            currency: 'GMD',
            amount: escrow.amount,
            description: `Escrow release for contract ${contractId}`,
            relatedEntityId: contractId,
            relatedEntityType: 'contract',
            status: 'completed'
        });

        // Update escrow status
        await updateDoc(escrowRef, {
            status: 'released',
            releasedAt: serverTimestamp()
        });

        // Create notifications
        try {
            await NotificationService.createNotification(
                escrow.toUserId,
                'transaction',
                'Payment Received',
                `D${escrow.amount.toFixed(2)} has been released from escrow.`,
                'high',
                {
                    type: 'transaction',
                    transactionId: escrowId,
                    transactionType: 'escrow_release',
                    amount: escrow.amount,
                    currency: 'GMD',
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
     * Refund escrow to sender
     */
    async refundEscrow(contractId: string, reason: string): Promise<void> {
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
            walletId: escrow.fromWalletId,
            currency: 'GMD',
            amount: escrow.amount,
            description: `Escrow refund for contract ${contractId}: ${reason || 'Contract cancelled'}`,
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

        // Create notifications
        try {
            await NotificationService.createNotification(
                escrow.fromUserId,
                'transaction',
                'Escrow Refunded',
                `D${escrow.amount.toFixed(2)} has been refunded. Reason: ${reason || 'Contract cancelled'}`,
                'medium',
                {
                    type: 'transaction',
                    transactionId: escrowId,
                    transactionType: 'refund',
                    amount: escrow.amount,
                    currency: 'GMD',
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
     * Get escrow holds for a wallet
     */
    async getEscrowHolds(walletId: string): Promise<EscrowHold[]> {
        const q = query(
            collection(db, 'escrow_holds'),
            where('fromWalletId', '==', walletId)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EscrowHold));
    },

    /**
     * Process a direct payment between wallets
     */
    async processPayment(paymentRequest: PaymentRequest): Promise<string> {
        const { fromWalletId, toWalletId, amount, description, relatedEntityId, relatedEntityType } = paymentRequest;

        const hasFunds = await this.hasSufficientFunds(fromWalletId, amount);

        if (!hasFunds) {
            throw new Error('Insufficient funds');
        }

        try {
            // Deduct from sender
            await this.updateBalance(fromWalletId, -amount);
            const senderTxnId = await this.addTransaction(fromWalletId, {
                type: 'payment',
                walletId: fromWalletId,
                currency: 'GMD',
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
                walletId: toWalletId,
                currency: 'GMD',
                amount,
                description,
                relatedEntityId,
                relatedEntityType,
                status: 'completed'
            });

            // Notify sender
            try {
                await NotificationService.createNotification(
                    paymentRequest.fromUserId,
                    'transaction',
                    'Payment Sent',
                    `D${amount.toFixed(2)} sent successfully.`,
                    'medium',
                    {
                        type: 'transaction',
                        transactionId: senderTxnId,
                        transactionType: 'payment',
                        amount: -amount,
                        currency: 'GMD',
                        fromUserId: paymentRequest.fromUserId,
                        toUserId: paymentRequest.toUserId,
                        relatedEntityId,
                        relatedEntityType: relatedEntityType as any
                    },
                    `/wallet`,
                    'View Wallet'
                );

                // Notify recipient
                await NotificationService.createNotification(
                    paymentRequest.toUserId,
                    'transaction',
                    'Payment Received',
                    `D${amount.toFixed(2)} received.`,
                    'high',
                    {
                        type: 'transaction',
                        transactionId: senderTxnId,
                        transactionType: 'payment',
                        amount,
                        currency: 'GMD',
                        fromUserId: paymentRequest.fromUserId,
                        toUserId: paymentRequest.toUserId,
                        relatedEntityId,
                        relatedEntityType: relatedEntityType as any
                    },
                    `/wallet`,
                    'View Wallet'
                );
            } catch (error) {
                console.error('Error creating payment notifications:', error);
            }

            return senderTxnId;
        } catch (error) {
            console.error('Payment processing error:', error);
            throw error;
        }
    },

    /**
     * Get wallet statistics
     */
    async getWalletStats(walletId: string): Promise<WalletStats> {
        const transactions = await this.getTransactionHistory(walletId);

        const stats: WalletStats = {
            totalDeposits: 0,
            totalWithdrawals: 0,
            totalPayments: 0,
            totalRefunds: 0,
            escrowHoldings: 0,
            transactionCount: transactions.length
        };

        transactions.forEach((txn) => {
            if (txn.type === 'deposit') stats.totalDeposits += txn.amount;
            if (txn.type === 'withdrawal') stats.totalWithdrawals += Math.abs(txn.amount);
            if (txn.type === 'payment') {
                stats.totalPayments += Math.abs(txn.amount);
            }
            if (txn.type === 'refund') stats.totalRefunds += txn.amount;
        });

        const escrowHolds = await this.getEscrowHolds(walletId);
        stats.escrowHoldings = escrowHolds
            .filter(hold => hold.status === 'held')
            .reduce((sum, hold) => sum + hold.amount, 0);

        return stats;
    }
};
