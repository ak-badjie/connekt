'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, MessageSquare, Copy, CheckCircle, Sparkles } from 'lucide-react';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';
import { ConnectAIService } from '@/lib/services/connect-ai.service';
import { AIGenerationOverlay } from '@/components/profile/ai/AIGenerationOverlay';
import { Message } from '@/lib/types/chat.types';
import { ExtendedMailMessage } from '@/lib/types/mail.types';

interface AIConversationSummarizerModalProps {
    userId: string;
    messages: (Message | ExtendedMailMessage)[];
    lastReadIndex?: number; // Index of last read message
    onClose: () => void;
}

export function AIConversationSummarizerModal({
    userId,
    messages,
    lastReadIndex,
    onClose
}: AIConversationSummarizerModalProps) {
    const [summaryType, setSummaryType] = useState<'all' | 'unread'>('all');
    const [isGenerating, setIsGenerating] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const hasUnreadMessages = lastReadIndex !== undefined && lastReadIndex < messages.length - 1;

    const handleGenerate = async () => {
        try {
            setIsGenerating(true);
            setError(null);

            // Check quota
            const { allowed } = await ConnectAIService.checkQuota(userId);
            if (!allowed) {
                throw new Error('AI quota exceeded. Please upgrade your plan or wait until next month.');
            }

            // Determine which messages to summarize
            let messagesToSummarize = messages;
            if (summaryType === 'unread' && lastReadIndex !== undefined) {
                messagesToSummarize = messages.slice(lastReadIndex + 1);
            }

            if (messagesToSummarize.length === 0) {
                setError('No messages to summarize');
                setIsGenerating(false);
                return;
            }

            // Format messages for AI
            const formattedMessages = messagesToSummarize.map((msg: any, i) => {
                const sender = msg.senderUsername || msg.senderName || 'Unknown';
                const content = msg.content || msg.body || '';
                const subject = (msg as any).subject || '';

                if (subject) {
                    return `Email ${i + 1} (${sender}): ${subject}\n${content}`;
                } else {
                    return `Message ${i + 1} (${sender}): ${content}`;
                }
            });

            // Generate summary
            const generatedSummary = await ConnectAIService.summarizeConversation(
                formattedMessages as any,
                userId
            );

            // Track usage
            await ConnectAIService.trackUsage(userId, 'email_summarizer', 1000, 0.001, true);

            setSummary(generatedSummary);
        } catch (error: any) {
            console.error('Summarization error:', error);
            setError(error.message || 'Failed to generate summary');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        if (summary) {
            navigator.clipboard.writeText(summary);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <>
            <AIGenerationOverlay isVisible={isGenerating} message="Analyzing conversation..." />

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
                    className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                <ConnektAIIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    AI Conversation Summarizer
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Get instant insights from your conversations
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
                        {!summary ? (
                            <>
                                {/* Summary Type Selection */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                                        What would you like to summarize?
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setSummaryType('all')}
                                            className={`p-4 rounded-xl border-2 transition-all ${summaryType === 'all'
                                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
                                                }`}
                                        >
                                            <div className="text-center">
                                                <div className="text-2xl mb-2">📚</div>
                                                <div className="font-semibold text-gray-900 dark:text-white">
                                                    Entire Conversation
                                                </div>
                                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                    All {messages.length} messages
                                                </div>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setSummaryType('unread')}
                                            disabled={!hasUnreadMessages}
                                            className={`p-4 rounded-xl border-2 transition-all ${summaryType === 'unread'
                                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            <div className="text-center">
                                                <div className="text-2xl mb-2">🆕</div>
                                                <div className="font-semibold text-gray-900 dark:text-white">
                                                    Unread Only
                                                </div>
                                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                    {hasUnreadMessages
                                                        ? `${messages.length - (lastReadIndex! + 1)} new messages`
                                                        : 'No unread messages'}
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Info Box */}
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                                    <div className="flex items-start gap-3">
                                        <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-blue-700 dark:text-blue-400">
                                            <p className="font-semibold mb-1">AI will provide:</p>
                                            <ul className="list-disc list-inside space-y-1 ml-2">
                                                <li>Brief overview (2-3 sentences)</li>
                                                <li>Key points discussed</li>
                                                <li>Action items (if any)</li>
                                                <li>Decisions made</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                                    >
                                        <MessageSquare className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                                    </motion.div>
                                )}
                            </>
                        ) : (
                            <>
                                {/* Summary Display */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            Summary
                                        </h3>
                                        <button
                                            onClick={handleCopy}
                                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm"
                                        >
                                            {copied ? (
                                                <>
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                    Copied!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4" />
                                                    Copy
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                            {summary}
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex gap-3">
                        {!summary ? (
                            <>
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-6 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating || (summaryType === 'unread' && !hasUnreadMessages)}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Summarizing...
                                        </>
                                    ) : (
                                        <>
                                            <ConnektAIIcon className="w-5 h-5" />
                                            Generate Summary
                                        </>
                                    )}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all"
                            >
                                Done
                            </button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </>
    );
}
