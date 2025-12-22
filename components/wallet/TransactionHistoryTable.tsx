'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WalletTransaction } from '@/lib/types/wallet.types';
import {
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    CheckCircle2,
    XCircle,
    MoreHorizontal,
    Search,
    FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import TransactionReceiptModal from './TransactionReceiptModal';

interface TransactionHistoryTableProps {
    transactions: WalletTransaction[];
    isLoading?: boolean;
}

export function TransactionHistoryTable({ transactions, isLoading = false }: TransactionHistoryTableProps) {
    const [selectedTransaction, setSelectedTransaction] = useState<WalletTransaction | null>(null);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);

    // Animation Variants
    const listVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 }
    };

    const handleTransactionClick = (transaction: WalletTransaction) => {
        setSelectedTransaction(transaction);
        setIsReceiptOpen(true);
    };

    const getIconConfig = (type: WalletTransaction['type']) => {
        switch (type) {
            case 'deposit':
            case 'escrow_release':
            case 'refund':
                return {
                    icon: ArrowDownLeft,
                    bg: 'bg-emerald-500/10',
                    color: 'text-emerald-500',
                    label: 'Income'
                };
            case 'withdrawal':
            case 'payment':
            case 'escrow_hold':
                return {
                    icon: ArrowUpRight,
                    bg: 'bg-rose-500/10',
                    color: 'text-rose-500',
                    label: 'Expense'
                };
            default:
                return {
                    icon: Clock,
                    bg: 'bg-gray-500/10',
                    color: 'text-gray-500',
                    label: 'Pending'
                };
        }
    };

    const getTypeLabel = (type: WalletTransaction['type']) => {
        const labels: Record<WalletTransaction['type'], string> = {
            deposit: 'Top Up',
            withdrawal: 'Withdrawal',
            payment: 'Payment Sent',
            escrow_hold: 'Escrow Lock',
            escrow_release: 'Funds Released',
            refund: 'Refund'
        };
        return labels[type] || type;
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-gray-100 dark:border-white/5 animate-pulse">
                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-zinc-800" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-1/3 bg-gray-200 dark:bg-zinc-800 rounded" />
                            <div className="h-3 w-1/4 bg-gray-200 dark:bg-zinc-800 rounded" />
                        </div>
                        <div className="h-4 w-20 bg-gray-200 dark:bg-zinc-800 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300 dark:border-white/10">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Transactions Found</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mt-1">
                    Your recent financial activity will show up here.
                </p>
            </div>
        );
    }

    return (
        <>
            <motion.div
                variants={listVariants}
                initial="hidden"
                animate="visible"
                className="space-y-2"
            >
                {transactions.map((t) => {
                    const isCredit = ['deposit', 'escrow_release', 'refund'].includes(t.type);
                    const config = getIconConfig(t.type);
                    const Icon = config.icon;
                    const date = t.timestamp?.toDate?.() || new Date();

                    return (
                        <motion.div
                            key={t.id}
                            variants={itemVariants}
                            onClick={() => handleTransactionClick(t)}
                            whileHover={{ scale: 1.005, x: 4 }}
                            className="group relative flex items-center justify-between p-4 rounded-2xl bg-white/40 dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-800 border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-lg hover:shadow-teal-900/5"
                        >
                            {/* Left: Icon & Info */}
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                                    "bg-gray-50 dark:bg-zinc-800 group-hover:bg-white dark:group-hover:bg-zinc-900",
                                    "border border-gray-100 dark:border-white/5 group-hover:border-teal-200 dark:group-hover:border-teal-900/50",
                                    "group-hover:shadow-md group-hover:shadow-teal-500/10"
                                )}>
                                    <Icon className={cn("w-5 h-5", config.color)} strokeWidth={2.5} />
                                </div>

                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                        {getTypeLabel(t.type)}
                                    </span>
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        {format(date, 'MMM dd, hh:mm a')}
                                    </span>
                                </div>
                            </div>

                            {/* Center: Description (Hidden on mobile) */}
                            <div className="hidden sm:flex flex-col items-start px-4 flex-1 max-w-xs">
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-full">
                                    {t.description}
                                </p>
                                {t.referenceId && (
                                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <FileText size={10} />
                                        REF: {t.referenceId.slice(0, 8)}
                                    </div>
                                )}
                            </div>

                            {/* Right: Amount & Status */}
                            <div className="text-right flex items-center gap-4">
                                <div>
                                    <div className={cn(
                                        "text-sm font-black tracking-tight",
                                        isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white"
                                    )}>
                                        {isCredit ? '+' : '-'}D{Math.abs(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="flex items-center justify-end gap-1.5 mt-1">
                                        {t.status === 'completed' && <CheckCircle2 size={12} className="text-emerald-500" />}
                                        {t.status === 'pending' && <Clock size={12} className="text-amber-500" />}
                                        {t.status === 'failed' && <XCircle size={12} className="text-rose-500" />}
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase tracking-wider",
                                            t.status === 'completed' ? "text-emerald-600/70 dark:text-emerald-400/70" :
                                                t.status === 'pending' ? "text-amber-600/70 dark:text-amber-400/70" :
                                                    "text-rose-600/70 dark:text-rose-400/70"
                                        )}>
                                            {t.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Hover Action */}
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all">
                                    <MoreHorizontal size={16} />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            <TransactionReceiptModal
                isOpen={isReceiptOpen}
                onClose={() => setIsReceiptOpen(false)}
                transaction={selectedTransaction}
            />
        </>
    );
}