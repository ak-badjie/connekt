'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';
import { ProfileAIService } from '@/lib/services/ai/profile-ai.service';
import { ConnectAIService } from '@/lib/services/connect-ai.service';
import { Experience } from '@/lib/types/profile.types';
import { AIGenerationOverlay } from './AIGenerationOverlay';

interface AIBioEnhancerProps {
    currentBio: string;
    skills?: string[];
    experience?: Experience[];
    userId: string;
    onEnhanced: (enhancedBio: string) => void;
    onError?: (error: string) => void;
}

export function AIBioEnhancer({
    currentBio,
    skills,
    experience,
    userId,
    onEnhanced,
    onError,
}: AIBioEnhancerProps) {
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);

    const handleEnhance = async () => {
        try {
            setIsEnhancing(true);

            // Check quota
            const { allowed, remaining } = await ConnectAIService.checkQuota(userId);
            if (!allowed) {
                onError?.('AI quota exceeded. Please upgrade your plan or wait until next month.');
                return;
            }

            // Enhance bio
            const enhanced = await ProfileAIService.enhanceBio(currentBio, skills, experience);

            // Track usage
            await ConnectAIService.trackUsage(userId, 'bio_enhancer', 500, 0.0005, true);

            setPreview(enhanced);
        } catch (error: any) {
            console.error('Bio enhancement error:', error);
            onError?.(error.message || 'Failed to enhance bio');
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleApply = () => {
        if (preview) {
            onEnhanced(preview);
            setPreview(null);
        }
    };

    const handleDiscard = () => {
        setPreview(null);
    };

    return (
        <>
            <AIGenerationOverlay isVisible={isEnhancing} message="Enhancing your bio..." />

            {preview ? (
                // Preview Mode
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-teal-50 dark:bg-teal-900/20 border-2 border-teal-500 rounded-xl"
                >
                    <div className="flex items-start gap-3 mb-3">
                        <ConnektAIIcon className="w-5 h-5 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-teal-700 dark:text-teal-300 mb-2">
                                AI Enhanced Bio Preview
                            </h4>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                {preview}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={handleApply}
                            className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-colors"
                        >
                            Apply Changes
                        </button>
                        <button
                            onClick={handleDiscard}
                            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-colors"
                        >
                            Discard
                        </button>
                    </div>
                </motion.div>
            ) : (
                // Enhance Button - Positioned above textarea
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleEnhance}
                    disabled={isEnhancing}
                    className="mb-3 px-5 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all shadow-sm hover:shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isEnhancing ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Enhancing...
                        </>
                    ) : (
                        <>
                            <ConnektAIIcon className="w-5 h-5" />
                            Enhance Bio
                        </>
                    )}
                </motion.button>
            )}
        </>
    );
}
