'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Mail, Sparkles } from 'lucide-react';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';
import { ConnectAIService } from '@/lib/services/connect-ai.service';
import { AIGenerationOverlay } from '@/components/profile/ai/AIGenerationOverlay';

interface AIEmailComposerModalProps {
    userId: string;
    onClose: () => void;
    onGenerated: (email: { subject: string; body: string }) => void;
}

export function AIEmailComposerModal({ userId, onClose, onGenerated }: AIEmailComposerModalProps) {
    const [description, setDescription] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!description.trim()) {
            setError('Please enter a description for your email');
            return;
        }

        try {
            setIsGenerating(true);
            setError(null);

            // Generate email
            const email = await ConnectAIService.draftEmail(description, 'formal', userId);

            onGenerated(email);
            onClose();
        } catch (error: any) {
            console.error('Email generation error:', error);
            setError(error.message || 'Failed to generate email');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            <AIGenerationOverlay isVisible={isGenerating} message="Drafting your email..." />

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
                            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
                                <ConnektAIIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    AI Email Composer
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Generate professional emails instantly
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
                        {/* Description Input */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                What should the email be about?
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g., Request project status update from team, Ask for payment extension, Follow up on job application..."
                                className="w-full p-4 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none"
                                rows={4}
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                            >
                                <Mail className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                            </motion.div>
                        )}

                        {/* Info Box */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                            <div className="flex items-start gap-3">
                                <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-700 dark:text-blue-400">
                                    <p className="font-semibold mb-1">AI will generate:</p>
                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                        <li>Compelling subject line</li>
                                        <li>Well-structured email body</li>
                                        <li>Professional formatting</li>
                                        <li>Appropriate tone and language</li>
                                    </ul>
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
                            disabled={!description.trim() || isGenerating}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <ConnektAIIcon className="w-5 h-5" />
                                    Generate Email
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </>
    );
}
