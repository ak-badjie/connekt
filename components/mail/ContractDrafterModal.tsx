'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import ContractMailComposer from './ContractMailComposer';

interface ContractDrafterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onContractGenerated: (contractData: {
        title: string;
        description: string;
        terms: any;
        templateId?: string;
    }) => void;
}

export function ContractDrafterModal({ isOpen, onClose, onContractGenerated }: ContractDrafterModalProps) {
    const [isMinimized, setIsMinimized] = useState(false);

    const handleContractGenerated = (contractData: any) => {
        onContractGenerated(contractData);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{
                            scale: isMinimized ? 0.8 : 1,
                            opacity: 1,
                            y: isMinimized ? '70vh' : 0
                        }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full h-full bg-white dark:bg-gray-900 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-teal-600 to-teal-700">
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    Contract Drafter
                                </h2>
                                <p className="text-sm text-teal-100">
                                    Select template • Fill details • Preview in real-time
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                    title={isMinimized ? "Maximize" : "Minimize"}
                                >
                                    {isMinimized ? (
                                        <Maximize2 className="w-5 h-5 text-white" />
                                    ) : (
                                        <Minimize2 className="w-5 h-5 text-white" />
                                    )}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                    title="Close"
                                >
                                    <X className="w-6 h-6 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Content - Contract Composer (already has split view) */}
                        {!isMinimized && (
                            <div className="flex-1 overflow-hidden">
                                <ContractMailComposer onContractGenerated={handleContractGenerated} />
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
