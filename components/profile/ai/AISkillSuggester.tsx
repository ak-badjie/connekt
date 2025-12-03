'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Plus, X } from 'lucide-react';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';
import { ProfileAIService } from '@/lib/services/ai/profile-ai.service';
import { ConnectAIService } from '@/lib/services/connect-ai.service';
import { Experience } from '@/lib/types/profile.types';
import { AIGenerationOverlay } from './AIGenerationOverlay';

interface AISkillSuggesterProps {
    currentSkills: string[];
    bio?: string;
    experience?: Experience[];
    userId: string;
    onSkillsAdded: (newSkills: string[]) => void;
    onError?: (error: string) => void;
}

export function AISkillSuggester({
    currentSkills,
    bio,
    experience,
    userId,
    onSkillsAdded,
    onError,
}: AISkillSuggesterProps) {
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
    const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());

    const handleSuggest = async () => {
        try {
            setIsSuggesting(true);

            // Check quota
            const { allowed } = await ConnectAIService.checkQuota(userId);
            if (!allowed) {
                onError?.('AI quota exceeded. Please upgrade your plan or wait until next month.');
                return;
            }

            // Get skill suggestions
            const suggestions = await ProfileAIService.suggestSkills(experience || [], currentSkills);

            // Track usage
            await ConnectAIService.trackUsage(userId, 'skill_suggester', 500, 0.0005, true);

            setSuggestedSkills(suggestions);
            // Auto-select all suggestions
            setSelectedSkills(new Set(suggestions));
        } catch (error: any) {
            console.error('Skill suggestion error:', error);
            onError?.(error.message || 'Failed to suggest skills');
        } finally {
            setIsSuggesting(false);
        }
    };

    const toggleSkill = (skill: string) => {
        const newSelected = new Set(selectedSkills);
        if (newSelected.has(skill)) {
            newSelected.delete(skill);
        } else {
            newSelected.add(skill);
        }
        setSelectedSkills(newSelected);
    };

    const handleApply = () => {
        if (selectedSkills.size > 0) {
            onSkillsAdded(Array.from(selectedSkills));
            setSuggestedSkills([]);
            setSelectedSkills(new Set());
        }
    };

    const handleDiscard = () => {
        setSuggestedSkills([]);
        setSelectedSkills(new Set());
    };

    return (
        <>
            <AIGenerationOverlay isVisible={isSuggesting} message="Analyzing your profile..." />

            {suggestedSkills.length > 0 ? (
                // Preview Mode
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-teal-50 dark:bg-teal-900/20 border-2 border-teal-500 rounded-xl"
                >
                    <div className="flex items-start gap-3 mb-3">
                        <ConnektAIIcon className="w-5 h-5 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-teal-700 dark:text-teal-300 mb-3">
                                Suggested Skills ({selectedSkills.size} selected)
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {suggestedSkills.map((skill) => (
                                    <button
                                        key={skill}
                                        onClick={() => toggleSkill(skill)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${selectedSkills.has(skill)
                                                ? 'bg-teal-600 text-white'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        {selectedSkills.has(skill) ? (
                                            <Plus className="w-3 h-3" />
                                        ) : (
                                            <X className="w-3 h-3" />
                                        )}
                                        {skill}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={handleApply}
                            disabled={selectedSkills.size === 0}
                            className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Add Selected Skills ({selectedSkills.size})
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
                // Suggest Button
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSuggest}
                    disabled={isSuggesting}
                    className="mb-3 px-5 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all shadow-sm hover:shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSuggesting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <ConnektAIIcon className="w-5 h-5" />
                            Suggest Skills
                        </>
                    )}
                </motion.button>
            )}
        </>
    );
}
