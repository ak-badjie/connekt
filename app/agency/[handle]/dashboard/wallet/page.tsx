'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { WalletService } from '@/lib/services/wallet-service';
import { AgencyService } from '@/lib/services/agency-service';
import { Wallet as WalletType, WalletTransaction, EscrowHold } from '@/lib/types/wallet.types';
import { WalletBalanceCard } from '@/components/wallet/WalletBalanceCard';
import { TransactionHistoryTable } from '@/components/wallet/TransactionHistoryTable';
import { EscrowHoldingsList } from '@/components/wallet/EscrowHoldingsList';
import { motion } from 'framer-motion';
import { Download, Filter, Users } from 'lucide-react';

export default function AgencyWalletPage() {
    const params = useParams();
    const agencyHandle = params?.handle as string;

    const [wallet, setWallet] = useState<WalletType | null>(null);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [escrowHoldings, setEscrowHoldings] = useState<EscrowHold[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [agencyName, setAgencyName] = useState('');

    useEffect(() => {
        const loadWalletData = async () => {
            if (!agencyHandle) return;

            try {
                setIsLoading(true);

                // Get agency info
                const agency = await AgencyService.getAgencyByUsername(agencyHandle);
                if (!agency) {
                    console.error('Agency not found');
                    return;
                }

                setAgencyName(agency.name);
                const walletId = `agency_${agency.id}`;

                // Load wallet
                let walletData = await WalletService.getWallet(walletId);

                // Create wallet if it doesn't exist
                if (!walletData) {
                    await WalletService.createWallet(walletId, agency.id!, 'agency');
                    walletData = await WalletService.getWallet(walletId);
                }

                setWallet(walletData);

                // Load transaction history
                if (walletData) {
                    const txHistory = await WalletService.getTransactionHistory(walletId, 50);
                    setTransactions(txHistory);
                    setEscrowHoldings(walletData.escrowHolds);
                }
            } catch (error) {
                console.error('Error loading agency wallet:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadWalletData();
    }, [agencyHandle]);

    const pendingIn = escrowHoldings
        .filter(h => h.status === 'held' && h.toUserId === wallet?.ownerId)
        .reduce((sum, h) => sum + h.amount, 0);

    const pendingOut = escrowHoldings
        .filter(h => h.status === 'held' && h.fromUserId === wallet?.ownerId)
        .reduce((sum, h) => sum + h.amount, 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-teal-950/20 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-[#008080]/10 dark:bg-[#008080]/20 flex items-center justify-center">
                            <Users size={24} className="text-[#008080]" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 dark:text-white">
                                Agency Wallet
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">{agencyName}</p>
                        </div>
                    </div>
                    <p className="text-gray-500 dark:text-gray-500 mt-2">
                        Collective wallet shared across all agency members
                    </p>
                </motion.div>

                {/* Balance Card */}
                <WalletBalanceCard
                    balance={wallet?.balance || 0}
                    currency={wallet?.currency}
                    pendingIn={pendingIn}
                    pendingOut={pendingOut}
                    isAgency={true}
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
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-sm font-medium transition-colors"
                            >
                                <Filter size={16} />
                                Filter
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#008080] hover:bg-teal-600 text-white text-sm font-bold transition-colors"
                            >
                                <Download size={16} />
                                Export
                            </motion.button>
                        </div>
                    </div>

                    <TransactionHistoryTable transactions={transactions} isLoading={isLoading} />
                </motion.div>
            </div>
        </div>
    );
}
