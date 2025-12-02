'use client';

import { motion } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface WalletBalanceCardProps {
    balance: number;
    currency?: string;
    pendingIn?: number;
    pendingOut?: number;
    isAgency?: boolean;
    onAddFunds?: () => void;
}

export function WalletBalanceCard({
    balance,
    currency = 'GMD',
    pendingIn = 0,
    pendingOut = 0,
    isAgency = false,
    onAddFunds
}: WalletBalanceCardProps) {
    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1]
            }
        }
    };

    const statsVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: (i: number) => ({
            opacity: 1,
            x: 0,
            transition: {
                delay: i * 0.1,
                duration: 0.4,
                ease: 'easeOut'
            }
        })
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#008080] via-teal-600 to-teal-700 p-8 shadow-2xl shadow-teal-500/30"
        >
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-300 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="relative z-10 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                            className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30"
                        >
                            <Wallet size={28} className="text-white" />
                        </motion.div>
                        <div>
                            <h3 className="text-lg font-bold text-white">ConnektWallet</h3>
                            <p className="text-sm text-teal-100">
                                {isAgency ? 'Agency Balance' : 'Available Balance'}
                            </p>
                        </div>
                    </div>

                    <motion.button
                        onClick={onAddFunds}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-white text-sm font-bold transition-all border border-white/20"
                    >
                        Add Funds
                    </motion.button>
                </div>

                {/* Balance */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <div className="text-5xl font-black text-white tracking-tight">
                        D{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-teal-100 mt-1">
                        {currency === 'GMD' || currency === 'USD' ? 'Gambian Dalasis' : currency}
                    </div>
                </motion.div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                    <motion.div
                        custom={0}
                        variants={statsVariants}
                        initial="hidden"
                        animate="visible"
                        className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-green-400/20 flex items-center justify-center">
                                <ArrowDownLeft size={16} className="text-green-300" />
                            </div>
                            <span className="text-xs text-teal-100 font-medium">Pending In</span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                            D{pendingIn.toLocaleString()}
                        </div>
                    </motion.div>

                    <motion.div
                        custom={1}
                        variants={statsVariants}
                        initial="hidden"
                        animate="visible"
                        className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center">
                                <ArrowUpRight size={16} className="text-amber-300" />
                            </div>
                            <span className="text-xs text-teal-100 font-medium">Pending Out</span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                            D{pendingOut.toLocaleString()}
                        </div>
                    </motion.div>
                </div>

                {isAgency && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="pt-4 border-t border-white/20"
                    >
                        <p className="text-xs text-teal-100">
                            Shared across all agency members • Managed by agency owner
                        </p>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
