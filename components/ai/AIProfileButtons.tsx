'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';
import { useAuth } from '@/context/AuthContext';
import { ConnectAIService } from '@/lib/services/connect-ai.service';
import { SubscriptionService } from '@/lib/services/subscription.service';
import toast from 'react-hot-toast';

interface AIResumeParserButtonProps {
    onProfileDataExtracted: (profileData: any) => void;
}

/**
 * AI Resume Parser Button Component
 * Add this to your profile edit page
 * 
 * Usage:
 * <AIResumeParserButton onProfileDataExtracted={(data) => {
 *   // Auto-fill form with extracted data
 *   setFormData({ ...formData, ...data });
 * }} />
 */
export function AIResumeParserButton({ onProfileDataExtracted }: AIResumeParserButtonProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setLoading(true);

        try {
            // Check if user has access
            const hasAccess = await SubscriptionService.hasFeature(user.uid, 'aiResumeParser');
            if (!hasAccess) {
                toast.error('This feature requires Connect AI subscription');
                window.location.href = '/ai-tools';
                return;
            }

            // Extract text from file
            const text = await extractTextFromFile(file);

            // Parse with AI
            const profileData = await ConnectAIService.parseResumeToProfile(text, user.uid);

            toast.success('Resume parsed successfully! Review the auto-filled data.');
            onProfileDataExtracted(profileData);
        } catch (error: any) {
            toast.error(error.message || 'Failed to parse resume');
        } finally {
            setLoading(false);
        }
    }

    async function extractTextFromFile(file: File): Promise<string> {
        // For PDF files, you'd use a PDF parsing library
        // For now, simple text extraction
        return await file.text();
    }

    return (
        <div className="flex items-center gap-2">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50">
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Parsing Resume...
                    </>
                ) : (
                    <>
                        <ConnektAIIcon className="w-5 h-5" />
                        Fill from Resume (AI)
                    </>
                )}
                <input
                    type="file"
                    accept=".txt,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    disabled={loading}
                    className="hidden"
                />
            </label>
            <div className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">
                Connect AI
            </div>
        </div>
    );
}

interface AIProfileEnhancerButtonProps {
    currentBio: string;
    skills: string[];
    experience: any[];
    onBioGenerated: (bio: string) => void;
}

/**
 * AI Profile Bio Enhancer
 * Enhances existing bio with AI
 */
export function AIProfileEnhancerButton({
    currentBio,
    skills,
    experience,
    onBioGenerated
}: AIProfileEnhancerButtonProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    async function enhanceBio() {
        if (!user) return;
        setLoading(true);

        try {
            const hasAccess = await SubscriptionService.hasFeature(user.uid, 'aiProfileEnhancer');
            if (!hasAccess) {
                toast.error('This feature requires Connect AI subscription');
                return;
            }

            const enhancedBio = await ConnectAIService.enhanceProfileDescription(
                currentBio,
                skills,
                experience,
                user.uid
            );

            toast.success('Bio enhanced with AI!');
            onBioGenerated(enhancedBio);
        } catch (error: any) {
            toast.error(error.message || 'Failed to enhance bio');
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={enhanceBio}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <ConnektAIIcon className="w-4 h-4" />
            )}
            {loading ? 'Enhancing...' : 'Enhance with AI'}
        </button>
    );
}

interface AISuggestSkillsButtonProps {
    experience: any[];
    currentSkills: string[];
    onSkillsSuggested: (skills: string[]) => void;
}

/**
 * AI Skills Suggester
 */
export function AISuggestSkillsButton({
    experience,
    currentSkills,
    onSkillsSuggested
}: AISuggestSkillsButtonProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    async function suggestSkills() {
        if (!user) return;
        setLoading(true);

        try {
            const hasAccess = await SubscriptionService.hasFeature(user.uid, 'aiProfileEnhancer');
            if (!hasAccess) {
                toast.error('This feature requires Connect AI subscription');
                return;
            }

            const suggestedSkills = await ConnectAIService.suggestSkillsFromExperience(
                experience,
                currentSkills,
                user.uid
            );

            toast.success(`Found ${suggestedSkills.length} suggested skills`);
            onSkillsSuggested(suggestedSkills);
        } catch (error: any) {
            toast.error(error.message || 'Failed to suggest skills');
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={suggestSkills}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <ConnektAIIcon className="w-4 h-4" />
            )}
            {loading ? 'Finding Skills...' : 'Suggest Skills (AI)'}
        </button>
    );
}
