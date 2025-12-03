'use client';

import { useState } from 'react';
import { Loader2, Zap } from 'lucide-react';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';
import { useAuth } from '@/context/AuthContext';
import { ConnectAIService } from '@/lib/services/connect-ai.service';
import { SubscriptionService } from '@/lib/services/subscription.service';
import toast from 'react-hot-toast';

interface AIEmailComposerProps {
    onEmailGenerated: (email: { subject: string; body: string }) => void;
}

/**
 * AI Email Composer Button
 * Add this to your mail compose page
 * 
 * Usage:
 * <AIEmailComposerButton onEmailGenerated={(email) => {
 *   setSubject(email.subject);
 *   setBody(email.body);
 * }} />
 */
export function AIEmailComposerButton({ onEmailGenerated }: AIEmailComposerProps) {
    const { user } = useAuth();
    const [showPrompt, setShowPrompt] = useState(false);
    const [description, setDescription] = useState('');
    const [tone, setTone] = useState<'formal' | 'casual' | 'persuasive'>('formal');
    const [loading, setLoading] = useState(false);

    async function generateEmail() {
        if (!user || !description.trim()) return;
        setLoading(true);

        try {
            const hasAccess = await SubscriptionService.hasFeature(user.uid, 'aiMailComposer');
            if (!hasAccess) {
                toast.error('This feature requires Connect AI subscription');
                window.location.href = '/ai-tools';
                return;
            }

            const email = await ConnectAIService.draftEmail(description, tone, user.uid);

            toast.success('Email generated successfully!');
            onEmailGenerated(email);
            setShowPrompt(false);
            setDescription('');
        } catch (error: any) {
            toast.error(error.message || 'Failed to generate email');
        } finally {
            setLoading(false);
        }
    }

    if (showPrompt) {
        return (
            <div className="bg-white border border-purple-200 rounded-lg p-4 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                    <ConnektAIIcon className="w-5 h-5" />
                    <h3 className="font-semibold text-gray-900">Draft Email with AI</h3>
                </div>

                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you want to write about... (e.g., 'Request project status update from team')"
                    className="w-full px-3 py-2 border rounded-lg mb-3 min-h-[100px]"
                    autoFocus
                />

                <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                    <div className="flex gap-2">
                        {(['formal', 'casual', 'persuasive'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTone(t)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${tone === t
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={generateEmail}
                        disabled={loading || !description.trim()}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Zap className="w-4 h-4" />
                                Generate Email
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => setShowPrompt(false)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={() => setShowPrompt(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all"
        >
            <ConnektAIIcon className="w-5 h-5" />
            Draft with AI
        </button>
    );
}

interface AIContractDrafterProps {
    contractType: string;
    variables: Record<string, any>;
    onContractGenerated: (contract: string) => void;
}

/**
 * AI Contract Drafter
 * Add this to contract creation flows
 */
export function AIContractDrafterButton({
    contractType,
    variables,
    onContractGenerated
}: AIContractDrafterProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    async function generateContract() {
        if (!user) return;
        setLoading(true);

        try {
            const hasAccess = await SubscriptionService.hasFeature(user.uid, 'aiContractDrafting');
            if (!hasAccess) {
                toast.error('This feature requires Connect AI subscription');
                return;
            }

            const contract = await ConnectAIService.draftContract(
                contractType as any,
                variables,
                user.uid
            );

            toast.success('Contract generated successfully!');
            onContractGenerated(contract);
        } catch (error: any) {
            toast.error(error.message || 'Failed to generate contract');
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={generateContract}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
        >
            {loading ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Contract...
                </>
            ) : (
                <>
                    <ConnektAIIcon className="w-5 h-5" />
                    Generate Contract with AI
                </>
            )}
        </button>
    );
}
