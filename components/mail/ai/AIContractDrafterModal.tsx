'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, FileText, Sparkles, Info } from 'lucide-react';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';
import { ConnectAIService } from '@/lib/services/connect-ai.service';
import { AIGenerationOverlay } from '@/components/profile/ai/AIGenerationOverlay';

interface AIContractDrafterModalProps {
    userId: string;
    onClose: () => void;
    onGenerated: (contract: string) => void;
}

const CONTRACT_TYPES = [
    { value: 'gig', label: 'Gig Contract', icon: '⚡', description: 'One-time project work' },
    { value: 'freelance', label: 'Freelance Agreement', icon: '📝', description: 'Ongoing freelance service' },
    { value: 'nda', label: 'NDA', icon: '🔒', description: 'Non-disclosure agreement' },
    { value: 'service', label: 'Service Agreement', icon: '🤝', description: 'Professional services' },
] as const;

export function AIContractDrafterModal({ userId, onClose, onGenerated }: AIContractDrafterModalProps) {
    const [contractType, setContractType] = useState<string>('gig');
    const [projectName, setProjectName] = useState('');
    const [clientName, setClientName] = useState('');
    const [deliverables, setDeliverables] = useState('');
    const [duration, setDuration] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!projectName.trim() || !clientName.trim()) {
            setError('Please fill in at least the project name and client name');
            return;
        }

        try {
            setIsGenerating(true);
            setError(null);

            // Check quota
            const { allowed } = await ConnectAIService.checkQuota(userId);
            if (!allowed) {
                throw new Error('AI quota exceeded. Please upgrade your plan or wait until next month.');
            }

            // Build variables object
            const variables = {
                projectName,
                clientName,
                deliverables: deliverables || 'To be defined',
                duration: duration || 'To be defined',
            };

            // Generate contract
            const contract = await ConnectAIService.draftContract(contractType as any, variables, userId);

            // Track usage
            await ConnectAIService.trackUsage(userId, 'contract_drafter', 1200, 0.0012, true);

            onGenerated(contract);
            onClose();
        } catch (error: any) {
            console.error('Contract generation error:', error);
            setError(error.message || 'Failed to generate contract');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            <AIGenerationOverlay isVisible={isGenerating} message="Drafting your contract..." />

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                                <ConnektAIIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    AI Contract Drafter
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Generate professional contracts instantly
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Contract Type Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                                Contract Type
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {CONTRACT_TYPES.map((type) => (
                                    <button
                                        key={type.value}
                                        onClick={() => setContractType(type.value)}
                                        className={`p-4 rounded-xl border-2 transition-all text-left ${contractType === type.value
                                                ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-purple-400'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="text-2xl">{type.icon}</div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900 dark:text-white">
                                                    {type.label}
                                                </div>
                                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                                    {type.description}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Input Fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                    Project/Service Name *
                                </label>
                                <input
                                    type="text"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    placeholder="e.g., Website Redesign Project"
                                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                    Client Name *
                                </label>
                                <input
                                    type="text"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    placeholder="e.g., Acme Corporation"
                                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                    Deliverables (Optional)
                                </label>
                                <textarea
                                    value={deliverables}
                                    onChange={(e) => setDeliverables(e.target.value)}
                                    placeholder="e.g., Homepage design, 5 landing pages, responsive mobile design"
                                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                    Duration (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    placeholder="e.g., 3 months, 2 weeks, 6 days"
                                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                            >
                                <FileText className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                            </motion.div>
                        )}

                        {/* Info Box */}
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                            <div className="flex items-start gap-3">
                                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-amber-700 dark:text-amber-400">
                                    <p className="font-semibold mb-1">Important:</p>
                                    <p>AI-generated contracts should always be reviewed by a legal professional before use. This is a starting template only.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={!projectName.trim() || !clientName.trim() || isGenerating}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <ConnektAIIcon className="w-5 h-5" />
                                    Generate Contract
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </>
    );
}
