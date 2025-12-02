import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, CheckCircle, AlertCircle, Calendar, CreditCard, Hash, User, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import type { WalletTransaction } from '@/lib/types/wallet.types';
import ConnektWalletLogo from './ConnektWalletLogo';

interface TransactionReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: WalletTransaction | null;
}

export default function TransactionReceiptModal({ isOpen, onClose, transaction }: TransactionReceiptModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted || !isOpen || !transaction) return null;

    const handlePrint = () => {
        window.print();
    };

    const modalContent = (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] print:hidden"
            />

            {/* Modal Container - Centered */}
            <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none p-4">
                <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                    {/* Header / Actions */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5 print:hidden">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Transaction Receipt
                        </h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrint}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-gray-500 dark:text-gray-400"
                                title="Print Receipt"
                            >
                                <Printer size={20} />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-gray-500 dark:text-gray-400"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Receipt Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible" id="receipt-content">
                        {/* Brand Header */}
                        <div className="flex flex-col items-center justify-center mb-8 space-y-4">
                            <ConnektWalletLogo size="large" />
                            <div className="text-center">
                                <h1 className="text-2xl font-black text-gray-900 dark:text-black print:text-black">
                                    ConnektWallet
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 print:text-gray-500">
                                    Official Transaction Receipt
                                </p>
                            </div>
                        </div>

                        {/* Amount Card */}
                        <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-2xl p-8 mb-8 text-center border border-gray-100 dark:border-white/5 print:border-gray-200 print:bg-gray-50">
                            <p className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">
                                Amount
                            </p>
                            <div className="text-5xl font-black text-gray-900 dark:text-white print:text-black">
                                {transaction.currency} {Math.abs(transaction.amount).toLocaleString()}
                            </div>
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold mt-4 ${transaction.status === 'completed'
                                ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                                }`}>
                                {transaction.status === 'completed' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                <span className="capitalize">{transaction.status}</span>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-zinc-800/30 rounded-xl">
                                    <div className="flex items-center gap-3 text-gray-500">
                                        <Calendar className="w-5 h-5" />
                                        <span className="text-sm font-medium">Date & Time</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-gray-900 dark:text-white print:text-black">
                                            {transaction.createdAt?.toDate ? format(transaction.createdAt.toDate(), 'PPP') : 'N/A'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {transaction.createdAt?.toDate ? format(transaction.createdAt.toDate(), 'p') : ''}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-zinc-800/30 rounded-xl">
                                    <div className="flex items-center gap-3 text-gray-500">
                                        <Hash className="w-5 h-5" />
                                        <span className="text-sm font-medium">Reference ID</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white font-mono print:text-black">
                                        {transaction.referenceId || transaction.id}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {transaction.metadata?.paymentMethod && (
                                    <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-zinc-800/30 rounded-xl">
                                        <div className="flex items-center gap-3 text-gray-500">
                                            <CreditCard className="w-5 h-5" />
                                            <span className="text-sm font-medium">Payment Method</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white capitalize print:text-black">
                                            {transaction.metadata.paymentMethod}
                                        </span>
                                    </div>
                                )}

                                {transaction.relatedEntityType && (
                                    <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-zinc-800/30 rounded-xl">
                                        <div className="flex items-center gap-3 text-gray-500">
                                            <User className="w-5 h-5" />
                                            <span className="text-sm font-medium">Related To</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white capitalize print:text-black">
                                            {transaction.relatedEntityType}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-white/5 flex flex-col items-center justify-center text-center">
                            <div className="flex items-center gap-2 mb-2 text-gray-900 dark:text-white">
                                <Briefcase size={16} className="text-teal-600" />
                                <span className="font-black tracking-tight">Connekt</span>
                                <span className="text-[10px] align-top text-gray-400">TM</span>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                Transaction ID: {transaction.id}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #receipt-content, #receipt-content * {
                        visibility: visible;
                    }
                    #receipt-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 40px !important;
                    }
                    /* Force light mode for print */
                    .dark {
                        color-scheme: light;
                    }
                    .dark * {
                        color: black !important;
                        background-color: white !important;
                        border-color: #e5e7eb !important;
                    }
                }
            `}</style>
        </>
    );

    return createPortal(modalContent, document.body);
}
