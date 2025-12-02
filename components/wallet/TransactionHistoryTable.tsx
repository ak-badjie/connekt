'use client';

import { motion } from 'framer-motion';
import { WalletTransaction } from '@/lib/types/wallet.types';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import TransactionReceiptModal from './TransactionReceiptModal';

interface TransactionHistoryTableProps {
    transactions: WalletTransaction[];
    isLoading?: boolean;
}

export function TransactionHistoryTable({ transactions, isLoading = false }: TransactionHistoryTableProps) {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const rowVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: {
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.3,
                ease: 'easeOut'
            }
        }
    };

    const getTypeIcon = (type: WalletTransaction['type']) => {
        switch (type) {
            case 'deposit':
            case 'escrow_release':
            case 'refund':
                return <ArrowDownLeft size={18} className="text-green-500" />;
            case 'withdrawal':
            case 'payment':
            case 'escrow_hold':
                return <ArrowUpRight size={18} className="text-red-500" />;
            default:
                return <Clock size={18} className="text-gray-500" />;
        }
    };

    const getStatusIcon = (status: WalletTransaction['status']) => {
        switch (status) {
            case 'completed':
                return <CheckCircle2 size={16} className="text-green-500" />;
            case 'pending':
                return <Clock size={16} className="text-amber-500" />;
            case 'failed':
                return <XCircle size={16} className="text-red-500" />;
            default:
                return <Clock size={16} className="text-gray-500" />;
        }
    };

    const getTypeLabel = (type: WalletTransaction['type']) => {
        const labels: Record<WalletTransaction['type'], string> = {
            deposit: 'Money In',
            withdrawal: 'Withdrawal',
            payment: 'Payment',
            escrow_hold: 'Escrow Hold',
            escrow_release: 'Escrow Release',
            refund: 'Refund'
        };
        return labels[type] || type;
    };

    const [selectedTransaction, setSelectedTransaction] = useState<WalletTransaction | null>(null);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);

    const handleTransactionClick = (transaction: WalletTransaction) => {
        setSelectedTransaction(transaction);
        setIsReceiptOpen(true);
    };

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div
                        key={i}
                        className="h-20 rounded-2xl bg-gray-100 dark:bg-zinc-800/50 animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                    <Clock size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Transactions Yet</h3>
                <p className="text-sm text-gray-500">Your transaction history will appear here</p>
            </div>
        );
    }

    return (
        <>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-2"
            >
                {transactions.map((transaction) => {
                    const isCredit = transaction.type === 'deposit' || transaction.type === 'escrow_release' || transaction.type === 'refund';
                    const date = transaction.timestamp?.toDate?.() || new Date();

                    return (
                        <motion.div
                            key={transaction.id}
                            variants={rowVariants}
                            whileHover={{ scale: 1.01, x: 4 }}
                            onClick={() => handleTransactionClick(transaction)}
                            className="group bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-lg"
                        >
                            <div className="flex items-center justify-between gap-4">
                                {/* Left: Icon + Details */}
                                <div className="flex items-center gap-4 flex-1">
                                    <motion.div
                                        whileHover={{ rotate: 360 }}
                                        transition={{ duration: 0.5 }}
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${isCredit
                                            ? 'bg-green-50 dark:bg-green-900/20'
                                            : 'bg-red-50 dark:bg-red-900/20'
                                            }`}
                                    >
                                        {getTypeIcon(transaction.type)}
                                    </motion.div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                                                {getTypeLabel(transaction.type)}
                                            </h4>
                                            <div className="flex items-center gap-1">
                                                {getStatusIcon(transaction.status)}
                                                <span className={`text-xs font-medium ${transaction.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                                                    transaction.status === 'pending' ? 'text-amber-600 dark:text-amber-400' :
                                                        'text-red-600 dark:text-red-400'
                                                    }`}>
                                                    {transaction.status}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {transaction.description}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                            {format(date, 'MMM dd, yyyy • hh:mm a')}
                                        </p>
                                    </div>
                                </div>

                                {/* Right: Amount */}
                                <div className="text-right">
                                    <div className={`text-xl font-black ${isCredit
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {isCredit ? '+' : '-'}D{Math.abs(transaction.amount).toFixed(2)}
                                    </div>
                                    <div className="text-xs text-gray-500 font-medium">
                                        {transaction.currency}
                                    </div>
                                </div>
                            </div>

                            {/* Reference ID (shown on hover) */}
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                whileHover={{ height: 'auto', opacity: 1 }}
                                className="overflow-hidden"
                            >
                                {transaction.referenceId && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
                                        <span className="text-xs text-gray-400">
                                            Ref: {transaction.referenceId}
                                        </span>
                                    </div>
                                )}
                            </motion.div>
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
