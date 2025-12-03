import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { SubscriptionService } from '@/lib/services/subscription.service';
import { ConnectAIService } from '@/lib/services/connect-ai.service';
import { SubscriptionTier, TierFeatures } from '@/lib/types/subscription-tiers.types';

interface AIAccessState {
    hasAccess: boolean;
    tier: SubscriptionTier;
    features: TierFeatures | null;
    quota: {
        used: number;
        limit: number;
        remaining: number;
    } | null;
    loading: boolean;
    error: string | null;
}

/**
 * Hook for checking AI feature access and quota
 */
export function useAIAccess() {
    const { user } = useAuth();
    const [state, setState] = useState<AIAccessState>({
        hasAccess: false,
        tier: SubscriptionTier.FREE,
        features: null,
        quota: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        async function checkAccess() {
            if (!user) {
                setState({
                    hasAccess: false,
                    tier: SubscriptionTier.FREE,
                    features: null,
                    quota: null,
                    loading: false,
                    error: null,
                });
                return;
            }

            try {
                setState(prev => ({ ...prev, loading: true, error: null }));

                // Get user's subscription tier
                const tier = await SubscriptionService.getUserTier(user.uid);
                const features = SubscriptionService.getTierFeatures(tier);

                // Check if user has any AI features
                const hasAnyAIFeature = features.aiResumeParser ||
                    features.aiProfileEnhancer ||
                    features.aiCandidateMatching ||
                    features.aiContractDrafting ||
                    features.aiTaskGeneration;

                // Get AI quota if they have access
                let quota = null;
                if (hasAnyAIFeature) {
                    const quotaInfo = await ConnectAIService.checkQuota(user.uid);
                    quota = {
                        used: quotaInfo.limit - quotaInfo.remaining,
                        limit: quotaInfo.limit,
                        remaining: quotaInfo.remaining,
                    };
                }

                setState({
                    hasAccess: hasAnyAIFeature,
                    tier,
                    features,
                    quota,
                    loading: false,
                    error: null,
                });
            } catch (error: any) {
                console.error('Error checking AI access:', error);
                setState(prev => ({
                    ...prev,
                    loading: false,
                    error: error.message || 'Failed to check AI access',
                }));
            }
        }

        checkAccess();
    }, [user]);

    /**
     * Check if user has a specific AI feature
     */
    const hasFeature = (featureKey: keyof TierFeatures): boolean => {
        if (!state.features) return false;
        return state.features[featureKey] as boolean;
    };

    /**
     * Check if user has quota remaining
     */
    const hasQuota = (): boolean => {
        if (!state.quota) return false;
        return state.quota.remaining > 0;
    };

    /**
     * Refresh quota information
     */
    const refreshQuota = async () => {
        if (!user || !state.hasAccess) return;

        try {
            const quotaInfo = await ConnectAIService.checkQuota(user.uid);
            setState(prev => ({
                ...prev,
                quota: {
                    used: quotaInfo.limit - quotaInfo.remaining,
                    limit: quotaInfo.limit,
                    remaining: quotaInfo.remaining,
                },
            }));
        } catch (error: any) {
            console.error('Error refreshing quota:', error);
        }
    };

    return {
        ...state,
        hasFeature,
        hasQuota,
        refreshQuota,
    };
}
