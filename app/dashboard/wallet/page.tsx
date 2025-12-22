'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { WalletService } from '@/lib/services/wallet-service';
import { Wallet as WalletType, WalletTransaction, EscrowHold } from '@/lib/types/wallet.types';
import { WalletBalanceCard } from '@/components/wallet/WalletBalanceCard';
import { TransactionHistoryTable } from '@/components/wallet/TransactionHistoryTable';
import { EscrowHoldingsList } from '@/components/wallet/EscrowHoldingsList';
import { TopUpModal } from '@/components/wallet/TopUpModal';
import { motion } from 'framer-motion';
import { ArrowUpDown, Filter, Download } from 'lucide-react';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { useMinimumLoading } from '@/hooks/useMinimumLoading';

export default function WalletPage() {
    const { user } = useAuth();
    const [wallet, setWallet] = useState<WalletType | null>(null);
    const [realtimeBalance, setRealtimeBalance] = useState<number | null>(null);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [escrowHoldings, setEscrowHoldings] = useState<EscrowHold[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);

    // Load initial wallet data
    const loadWalletData = useCallback(async () => {
        if (!user?.uid) return;

        try {
            setIsLoading(true);
            const walletId = `user_${user.uid}`;

            // Load wallet
            let walletData = await WalletService.getWallet(user.uid, 'user');

            // Create wallet if it doesn't exist
            if (!walletData) {
                await WalletService.createWallet(user.uid, 'user');
                walletData = await WalletService.getWallet(user.uid, 'user');
            }

            setWallet(walletData);

            // Load transaction history
            if (walletData) {
                const txHistory = await WalletService.getTransactionHistory(walletId, 50);
                setTransactions(txHistory);

                // Load active escrow holdings
                const activeHolds = await WalletService.getEscrowHoldings(walletId);
                setEscrowHoldings(activeHolds);
            }
        } catch (error) {
            console.error('Error loading wallet:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.uid]);

    // Initial load
    useEffect(() => {
        loadWalletData();
    }, [loadWalletData]);

    // Set up real-time listener for wallet balance updates
    useEffect(() => {
        if (!user?.uid) return;

        const unsubscribe = WalletService.listenToWallet(
            user.uid,
            'user',
            (rtWallet) => {
                if (rtWallet) {
                    setRealtimeBalance(rtWallet.balance);

                    // If there's a new transaction, reload full data
                    if (rtWallet.lastTransaction) {
                        loadWalletData();
                    }
                }
            }
        );

        return () => {
            unsubscribe();
        };
    }, [user?.uid, loadWalletData]);

    // Use realtime balance if available, otherwise use Firestore balance
    const displayBalance = realtimeBalance !== null ? realtimeBalance : (wallet?.balance || 0);

    const pendingIn = escrowHoldings
        .filter(h => h.status === 'held' && h.toUserId === user?.uid)
        .reduce((sum, h) => sum + h.amount, 0);

    const pendingOut = escrowHoldings
        .filter(h => h.status === 'held' && h.fromUserId === user?.uid)
        .reduce((sum, h) => sum + h.amount, 0);

    const handlePaymentComplete = useCallback(() => {
        // Refresh wallet data after successful payment
        loadWalletData();
    }, [loadWalletData]);

    const shouldShowLoading = useMinimumLoading(isLoading, 6000);

    if (shouldShowLoading) {
        return <LoadingScreen variant="wallet" />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-teal-950/20 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
                        ConnektWallet
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage your balance, transactions, and escrow holdings
                    </p>
                </motion.div>

                {/* Balance Card - uses realtime balance */}
                <WalletBalanceCard
                    balance={displayBalance}
                    currency={wallet?.currency}
                    pendingIn={pendingIn}
                    pendingOut={pendingOut}
                    isAgency={false}
                    onAddFunds={() => setIsTopUpModalOpen(true)}
                />

                {/* Escrow Holdings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                            Escrow Holdings
                        </h2>
                        <span className="text-sm text-gray-500">
                            {escrowHoldings.filter(h => h.status === 'held').length} active
                        </span>
                    </div>
                    <EscrowHoldingsList holdings={escrowHoldings} isLoading={isLoading} />
                </motion.div>

                {/* Transaction History */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl p-6 shadow-2xl"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                            Transaction History
                        </h2>
                        <div className="flex items-center gap-2">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsTopUpModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#008080] hover:bg-teal-600 text-white text-sm font-bold transition-colors shadow-lg shadow-teal-500/20"
                            >
                                <ArrowUpDown size={16} />
                                Top Up
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-sm font-medium transition-colors"
                            >
                                <Filter size={16} />
                                Filter
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-sm font-medium transition-colors"
                            >
                                <Download size={16} />
                                Export
                            </motion.button>
                        </div>
                    </div>

                    <TransactionHistoryTable transactions={transactions} isLoading={isLoading} />
                </motion.div>
            </div>

            <TopUpModal
                isOpen={isTopUpModalOpen}
                onClose={() => setIsTopUpModalOpen(false)}
                walletId={wallet?.id || ''}
                onPaymentComplete={handlePaymentComplete}
            />
        </div>
    );
}
