'use client';

import { motion } from 'framer-motion';
import { EscrowHold } from '@/lib/types/wallet.types';
import { Lock, Unlock, User, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface EscrowHoldingsListProps {
    holdings: EscrowHold[];
    isLoading?: boolean;
}

export function EscrowHoldingsList({ holdings, isLoading = false }: EscrowHoldingsListProps) {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08
            }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1]
            }
        }
    };

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2">
                {[1, 2].map((i) => (
                    <div
                        key={i}
                        className="h-48 rounded-2xl bg-gray-100 dark:bg-zinc-800/50 animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (holdings.length === 0) {
        return (
            <div className="text-center py-12 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/5">
                <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                    <Unlock size={28} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Active Escrow</h3>
                <p className="text-sm text-gray-500">Funds held in escrow will appear here</p>
            </div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-4 md:grid-cols-2"
        >
            {holdings.map((holding) => {
                const createdAt = holding.createdAt?.toDate?.() || new Date();
                const isActive = holding.status === 'held';

                return (
                    <motion.div
                        key={holding.id}
                        variants={cardVariants}
                        whileHover={{ scale: 1.02, y: -4 }}
                        className="relative overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
                    >
                        {/* Status Indicator */}
                        <div className="absolute top-4 right-4">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${isActive
                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                    : holding.status === 'released'
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                                }`}>
                                {isActive ? <Lock size={12} /> : <Unlock size={12} />}
                                {holding.status}
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="mb-4">
                            <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">
                                ${holding.amount.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500 font-medium">{holding.currency}</div>
                        </div>

                        {/* Details */}
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#008080]/10 dark:bg-[#008080]/20 flex items-center justify-center flex-shrink-0">
                                    <User size={16} className="text-[#008080]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-gray-500 mb-1">From → To</div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                        {holding.fromUserId.slice(0, 8)}... → {holding.toUserId.slice(0, 8)}...
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                                    <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-gray-500 mb-1">Reference</div>
                                    <div className="text-sm font-mono text-gray-900 dark:text-white truncate">
                                        {holding.referenceId}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                                    <Calendar size={16} className="text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-gray-500 mb-1">Created</div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {format(createdAt, 'MMM dd, yyyy • hh:mm a')}
                                    </div>
                                </div>
                            </div>

                            {holding.releasedAt && (
                                <div className="pt-3 border-t border-gray-100 dark:border-zinc-800">
                                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                                        Released: {format(holding.releasedAt.toDate(), 'MMM dd, yyyy')}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Glassmorphic Background Effect */}
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#008080] rounded-full blur-[80px] opacity-5 translate-x-1/2 translate-y-1/2" />
                    </motion.div>
                );
            })}
        </motion.div>
    );
}
