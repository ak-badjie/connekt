'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { SubscriptionService } from '@/lib/services/subscription.service';
import { ConnectAIService } from '@/lib/services/connect-ai.service';
import { SubscriptionTier, TierFeatures, SubscriptionPlan, SUBSCRIPTION_PLANS } from '@/lib/types/subscription-tiers.types';
import { Sparkles, Zap, Brain, TrendingUp, Users, Shield, Check, X, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

interface AIToolCard {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    category: 'Profile' | 'Recruiting' | 'Communication' | 'Project Management' | 'Analytics';
    requiredTier: SubscriptionTier;
    feature: keyof TierFeatures;
}

const AI_TOOLS: AIToolCard[] = [
    {
        id: 'resume-parser',
        name: 'AI Resume Parser',
        description: 'Upload your resume and auto-fill your entire profile with AI-extracted data',
        icon: <Brain className="w-6 h-6" />,
        category: 'Profile',
        requiredTier: SubscriptionTier.CONNECT_AI,
        feature: 'aiResumeParser',
    },
    {
        id: 'profile-enhancer',
        name: 'Profile Bio Enhancer',
        description: 'Generate a compelling professional bio based on your experience',
        icon: <Sparkles className="w-6 h-6" />,
        category: 'Profile',
        requiredTier: SubscriptionTier.CONNECT_AI,
        feature: 'aiProfileEnhancer',
    },
    {
        id: 'candidate-matcher',
        name: 'Smart Candidate Matching',
        description: 'Find the best candidates for your job posting with AI-powered ranking',
        icon: <Users className="w-6 h-6" />,
        category: 'Recruiting',
        requiredTier: SubscriptionTier.CONNECT_AI,
        feature: 'aiCandidateMatching',
    },
    {
        id: 'contract-drafter',
        name: 'AI Contract Generator',
        description: 'Draft professional contracts with legal language in seconds',
        icon: <Shield className="w-6 h-6" />,
        category: 'Communication',
        requiredTier: SubscriptionTier.CONNECT_AI,
        feature: 'aiContractDrafting',
    },
    {
        id: 'email-composer',
        name: 'AI Email Writer',
        description: 'Compose professional emails from simple descriptions',
        icon: <Zap className="w-6 h-6" />,
        category: 'Communication',
        requiredTier: SubscriptionTier.CONNECT_AI,
        feature: 'aiMailComposer',
    },
    {
        id: 'task-generator',
        name: 'AI Task Generator',
        description: 'Break down projects into actionable tasks automatically',
        icon: <Brain className="w-6 h-6" />,
        category: 'Project Management',
        requiredTier: SubscriptionTier.CONNECT_AI,
        feature: 'aiTaskGeneration',
    },
    {
        id: 'advanced-analytics',
        name: 'Advanced Analytics',
        description: 'Deep insights into workspace performance and team productivity',
        icon: <TrendingUp className="w-6 h-6" />,
        category: 'Analytics',
        requiredTier: SubscriptionTier.PRO,
        feature: 'advancedAnalytics',
    },
];

export default function AIToolsPage() {
    const { user } = useAuth();
    const [currentTier, setCurrentTier] = useState<SubscriptionTier>(SubscriptionTier.FREE);
    const [quota, setQuota] = useState<{ remaining: number; limit: number }>({ remaining: 0, limit: 0 });
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUserData();
    }, [user]);

    async function loadUserData() {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            const tier = await SubscriptionService.getUserTier(user.uid);
            setCurrentTier(tier);

            const quotaData = await ConnectAIService.checkQuota(user.uid);
            setQuota({ remaining: quotaData.remaining, limit: quotaData.limit });
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    }

    const categories = ['All', 'Profile', 'Recruiting', 'Communication', 'Project Management', 'Analytics'];

    const filteredTools = AI_TOOLS.filter(tool =>
        selectedCategory === 'All' || tool.category === selectedCategory
    );

    const getTierBadgeColor = (tier: SubscriptionTier) => {
        switch (tier) {
            case SubscriptionTier.FREE:
                return 'bg-gray-100 text-gray-800';
            case SubscriptionTier.PRO:
                return 'bg-blue-100 text-blue-800';
            case SubscriptionTier.PRO_PLUS:
                return 'bg-purple-100 text-purple-800';
            case SubscriptionTier.CONNECT_AI:
                return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const canUseFeature = (requiredTier: SubscriptionTier): boolean => {
        const tierOrder = [SubscriptionTier.FREE, SubscriptionTier.PRO, SubscriptionTier.PRO_PLUS, SubscriptionTier.CONNECT_AI];
        return tierOrder.indexOf(currentTier) >= tierOrder.indexOf(requiredTier);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex items-center gap-3 mb-4">
                        <Sparkles className="w-10 h-10" />
                        <h1 className="text-4xl font-bold">Connect AI Tools</h1>
                    </div>
                    <p className="text-purple-100 text-lg max-w-2xl">
                        Supercharge your workflow with AI-powered automation and intelligent insights
                    </p>

                    {/* Quota Display for AI users */}
                    {currentTier === SubscriptionTier.CONNECT_AI && (
                        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4 inline-block">
                            <div className="flex items-center gap-3">
                                <Brain className="w-5 h-5" />
                                <div>
                                    <p className="text-sm text-purple-100">AI Requests This Month</p>
                                    <p className="text-xl font-bold">
                                        {quota.remaining} / {quota.limit} remaining
                                    </p>
                                </div>
                            </div>
                            <div className="mt-2 bg-white/20 rounded-full h-2">
                                <div
                                    className="bg-white rounded-full h-2 transition-all"
                                    style={{ width: `${(quota.remaining / quota.limit) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Current Tier Badge */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
                <div className="bg-white rounded-lg shadow-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-gray-600">Your Plan:</span>
                        <span className={`px-4 py-2 rounded-full font-semibold ${getTierBadgeColor(currentTier)}`}>
                            {currentTier === 'free' ? 'Free' :
                                currentTier === 'pro' ? 'Connect Pro' :
                                    currentTier === 'pro_plus' ? 'Connect Pro Plus' :
                                        'Connect AI'}
                        </span>
                    </div>
                    <a href="/settings?tab=subscription" className="text-purple-600 hover:text-purple-700 font-medium">
                        Manage Subscription →
                    </a>
                </div>
            </div>

            {/* Category Filter */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${selectedCategory === category
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tools Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTools.map(tool => {
                        const hasAccess = canUseFeature(tool.requiredTier);

                        return (
                            <div
                                key={tool.id}
                                className={`bg-white rounded-xl shadow-lg p-6 transition-all hover:shadow-xl ${!hasAccess ? 'opacity-75' : ''
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-lg ${hasAccess
                                            ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                                            : 'bg-gray-100 text-gray-400'
                                        }`}>
                                        {tool.icon}
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTierBadgeColor(tool.requiredTier)}`}>
                                        {tool.requiredTier === 'free' ? 'Free' :
                                            tool.requiredTier === 'pro' ? 'Pro' :
                                                tool.requiredTier === 'pro_plus' ? 'Pro+' :
                                                    'AI'}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {tool.name}
                                </h3>
                                <p className="text-gray-600 mb-4 text-sm">
                                    {tool.description}
                                </p>

                                {hasAccess ? (
                                    <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2">
                                        <Check className="w-4 h-4" />
                                        Available - Try Now
                                    </button>
                                ) : (
                                    <button className="w-full bg-gray-100 hover:bg-purple-50 text-purple-600 font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2">
                                        <Lock className="w-4 h-4" />
                                        Upgrade to Unlock
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* CTA Section */}
            {currentTier !== SubscriptionTier.CONNECT_AI && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white text-center">
                        <Sparkles className="w-16 h-16 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold mb-4">
                            Unlock the Full Power of AI
                        </h2>
                        <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
                            Upgrade to Connect AI and get access to all AI-powered features, advanced analytics, and priority support
                        </p>
                        <a
                            href="/settings?tab=subscription"
                            className="inline-block bg-white text-purple-600 px-8 py-3 rounded-lg font-bold hover:bg-purple-50 transition-all"
                        >
                            View Plans & Pricing
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
