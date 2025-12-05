'use client';

import { useState } from 'react';
import { X, FileText, Download, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/context/AuthContext';

interface UnifiedContractViewerProps {
    contractId: string;
    contract: {
        type: string;
        title: string;
        description: string;
        terms: any;
        defaultTerms?: string;
        status: 'pending' | 'signed' | 'rejected';
        fromUserId: string;
        fromUsername: string;
        toUserId: string;
        toUsername: string;
        signedAt?: any;
        signedBy?: string;
        signatureFullName?: string;
    };
    isOpen: boolean;
    onClose: () => void;
    onSign?: (contractId: string, fullName: string) => Promise<void>;
    canSign?: boolean; // Whether current user can sign
}

export function UnifiedContractViewer({
    contractId,
    contract,
    isOpen,
    onClose,
    onSign,
    canSign = false
}: UnifiedContractViewerProps) {
    const { user } = useAuth();
    const [fullName, setFullName] = useState('');
    const [signing, setSigning] = useState(false);
    const [exporting, setExporting] = useState(false);

    const handleSign = async () => {
        if (!fullName.trim()) {
            alert('Please enter your full legal name');
            return;
        }

        if (!onSign) return;

        setSigning(true);
        try {
            await onSign(contractId, fullName.trim());
            alert('Contract signed successfully!');
            onClose();
        } catch (error: any) {
            alert(error.message || 'Failed to sign contract');
        } finally {
            setSigning(false);
        }
    };

    const handlePrintToPDF = async () => {
        setExporting(true);
        try {
            // Use browser's print dialog which can save as PDF
            window.print();
        } catch (error) {
            console.error('Failed to export PDF:', error);
            alert('Failed to export PDF');
        } finally {
            setExporting(false);
        }
    };

    if (!isOpen) return null;

    const isSigned = contract.status === 'signed';
    const isRecipient = user?.uid === contract.toUserId;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-4xl h-[90vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
                        <div className="flex items-center gap-3">
                            <FileText className="text-[#008080]" size={24} />
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Contract Viewer</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {contract.type.replace(/_/g, ' ').toUpperCase()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isSigned && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
                                    <CheckCircle size={16} />
                                    <span className="text-sm font-medium">Signed</span>
                                </div>
                            )}
                            <button
                                onClick={handlePrintToPDF}
                                disabled={exporting}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                                title="Print to PDF"
                            >
                                <Download size={20} className="text-gray-600 dark:text-gray-400" />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Contract Content */}
                    <div className="flex-1 overflow-y-auto p-8" id="contract-content">
                        {/* Gambian Legal Header */}
                        <div className="mb-8 pb-6 border-b-2 border-gray-300 dark:border-zinc-700">
                            <div className="flex items-center justify-between mb-4">
                                {/* Connekt Logo */}
                                <div className="flex items-center gap-2">
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#008080] to-teal-600 rounded-lg flex items-center justify-center">
                                        <span className="text-white font-bold text-xl">C</span>
                                    </div>
                                    <div>
                                        <div className="font-bold text-lg text-[#008080] tracking-wider">CONNEKT</div>
                                        <div className="text-xs text-gray-500">Africa</div>
                                    </div>
                                </div>

                                {/* Gambian Symbols */}
                                <div className="flex items-center gap-4">
                                    <div className="text-center">
                                        <div className="text-3xl">🇬🇲</div>
                                        <div className="text-xs text-gray-500 mt-1">The Gambia</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl">⚖️</div>
                                        <div className="text-xs text-gray-500 mt-1">Legal Document</div>
                                    </div>
                                </div>
                            </div>

                            {/* Contract Title */}
                            <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mt-6">
                                {contract.title}
                            </h1>
                        </div>

                        {/* Contract Body */}
                        <div className="prose dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300">
                            <ReactMarkdown>{contract.description}</ReactMarkdown>
                        </div>

                        {/* Standard Terms */}
                        {contract.defaultTerms && (
                            <div className="mt-8 pt-6 border-t border-gray-300 dark:border-zinc-700">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Standard Terms</h2>
                                <div className="prose dark:prose-invert max-w-none text-sm prose-p:text-gray-600 dark:prose-p:text-gray-400">
                                    <ReactMarkdown>{contract.defaultTerms}</ReactMarkdown>
                                </div>
                            </div>
                        )}

                        {/* Signature Section */}
                        <div className="mt-12 pt-8 border-t-2 border-gray-900 dark:border-white">
                            {isSigned ? (
                                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="text-green-600 dark:text-green-400 mt-1" size={24} />
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-2">
                                                Contract Signed
                                            </h3>
                                            <p className="text-sm text-green-800 dark:text-green-300 mb-2">
                                                This contract has been electronically signed and is legally binding.
                                            </p>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-green-700 dark:text-green-400 font-medium">Signed by:</span>
                                                    <p className="text-green-900 dark:text-green-100 font-semibold">
                                                        {contract.signatureFullName || contract.toUsername}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-green-700 dark:text-green-400 font-medium">Date:</span>
                                                    <p className="text-green-900 dark:text-green-100 font-semibold">
                                                        {contract.signedAt?.toDate?.().toLocaleDateString() || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Signature</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                        By signing electronically, both parties acknowledge they have read, understood, and agree to all terms stated in this contract.
                                    </p>

                                    {canSign && isRecipient ? (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Enter your full legal name to sign:
                                                </label>
                                                <input
                                                    type="text"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    placeholder="John Doe"
                                                    className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-2 border-gray-300 dark:border-zinc-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080] focus:border-transparent"
                                                />
                                            </div>
                                            <button
                                                onClick={handleSign}
                                                disabled={signing || !fullName.trim()}
                                                className="w-full py-3 bg-gradient-to-r from-[#008080] to-teal-600 text-white font-bold rounded-xl hover:from-teal-600 hover:to-[#008080] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-500/30"
                                            >
                                                {signing ? 'Signing...' : 'Sign Contract'}
                                            </button>
                                            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                                                This action is legally binding and cannot be undone
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-gray-100 dark:bg-zinc-800 rounded-xl text-center">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {isRecipient ? 'Waiting for your signature' : 'Waiting for recipient signature'}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer Note */}
                        <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
                            <p>This contract is governed by the laws of the Republic of The Gambia</p>
                            <p className="mt-1">Enforced by the Connekt Platform</p>
                        </div>
                    </div>
                </motion.div>

                {/* Print Styles */}
                <style jsx global>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #contract-content,
                        #contract-content * {
                            visibility: visible;
                        }
                        #contract-content {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                        }
                    }
                `}</style>
            </div>
        </AnimatePresence>
    );
}
