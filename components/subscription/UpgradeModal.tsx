'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { SubscriptionService } from '@/lib/services/subscription.service';
import { WalletService } from '@/lib/services/wallet-service';
import {
    SubscriptionTier,
    SubscriptionPlan,
    SUBSCRIPTION_PLANS,
} from '@/lib/types/subscription-tiers.types';
import { X, Check, Zap, Crown, Wallet as WalletIcon, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function UpgradeModal({ isOpen, onClose, onSuccess }: UpgradeModalProps) {
    const { user } = useAuth();
    const [currentTier, setCurrentTier] = useState<SubscriptionTier>(SubscriptionTier.FREE);
    const [walletBalance, setWalletBalance] = useState<number>(0);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [subscribing, setSubscribing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && user) {
            loadData();
        }
    }, [isOpen, user]);

    async function loadData() {
        if (!user) return;

        try {
            setLoading(true);
            const tier = await SubscriptionService.getUserTier(user.uid);
            setCurrentTier(tier);

            const wallet = await WalletService.getOrCreateWallet(user.uid, 'user');
            setWalletBalance(wallet?.balance || 0);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleUpgrade(plan: SubscriptionPlan) {
        if (!user) {
            toast.error('Please log in to upgrade');
            return;
        }

        const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;

        // Check wallet balance
        if (walletBalance < price) {
            toast.error(`Insufficient funds. You need D${price.toLocaleString()} but have D${walletBalance.toFixed(2)}`, {
                duration: 5000,
            });
            return;
        }

        // Confirm upgrade
        const confirmMessage = billingCycle === 'monthly'
            ? `Upgrade to ${plan.name} for D${price.toLocaleString()}/month?`
            : `Upgrade to ${plan.name} for D${price.toLocaleString()}/year (D${Math.round(price / 12).toLocaleString()}/month)?`;

        if (!confirm(confirmMessage)) {
            return;
        }

        setSubscribing(true);

        try {
            const result = await SubscriptionService.subscribe(
                user.uid,
                plan.id,
                billingCycle,
                'wallet'
            );

            if (result.success) {
                toast.success(`🎉 ${result.message}`, { duration: 5000 });
                await loadData(); // Refresh data
                onSuccess?.();
                setTimeout(() => onClose(), 1500);
            } else {
                toast.error(result.message);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to upgrade subscription');
        } finally {
            setSubscribing(false);
        }
    }

    const getPlanIcon = (tier: SubscriptionTier) => {
        switch (tier) {
            case SubscriptionTier.PRO:
                return <Zap className="w-6 h-6" />;
            case SubscriptionTier.PRO_PLUS:
                return <Crown className="w-6 h-6" />;
            default:
                return <Check className="w-6 h-6" />;
        }
    };

    const highlightedFeatures = {
        [SubscriptionTier.PRO]: [
            'Advanced analytics & reports',
            'Custom branding',
            'Priority support',
            'Advanced search filters',
            'Bulk operations',
            '25 team members',
            '50GB storage',
        ],
        [SubscriptionTier.PRO_PLUS]: [
            'All Pro features',
            'Talent pool management',
            'Client dashboards',
            'White-label branding',
            'API access',
            'Commission calculator',
            '100 team members',
            '200GB storage',
        ],
    };

    // Filter to show only Pro and Pro Plus
    const upgradePlans = SUBSCRIPTION_PLANS.filter(
        p => p.tier === SubscriptionTier.PRO || p.tier === SubscriptionTier.PRO_PLUS
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Upgrade Your Plan
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Current Plan: <span className="font-semibold text-teal-600">{currentTier === SubscriptionTier.FREE ? 'Free' : currentTier}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Wallet Balance */}
                        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 rounded-xl border border-teal-200 dark:border-teal-800">
                                <div className="p-3 bg-teal-600 rounded-lg">
                                    <WalletIcon className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">ConnektWallet Balance</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        D{walletBalance.toFixed(2)} <span className="text-sm text-gray-500">GMD</span>
                                    </p>
                                </div>
                                <a
                                    href="/dashboard/wallet"
                                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-lg transition-colors"
                                >
                                    Top Up
                                </a>
                            </div>
                        </div>

                        {/* Billing Cycle Toggle */}
                        <div className="p-6 flex justify-center">
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 inline-flex">
                                <button
                                    onClick={() => setBillingCycle('monthly')}
                                    className={`px-6 py-2 rounded-md transition-all text-sm font-medium ${billingCycle === 'monthly'
                                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                                        : 'text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setBillingCycle('yearly')}
                                    className={`px-6 py-2 rounded-md transition-all text-sm font-medium ${billingCycle === 'yearly'
                                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                                        : 'text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    Yearly
                                    <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-semibold">
                                        Save 17%
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Pricing Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                            {upgradePlans.map(plan => {
                                const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
                                const monthlyPrice = billingCycle === 'yearly' ? Math.round(price / 12) : price;
                                const isCurrentPlan = currentTier === plan.tier;
                                const canAfford = walletBalance >= price;

                                return (
                                    <div
                                        key={plan.id}
                                        className={`bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg overflow-hidden border-2 transition-all ${plan.popular
                                            ? 'border-teal-500 ring-2 ring-teal-200 dark:ring-teal-700'
                                            : 'border-gray-200 dark:border-gray-700'
                                            }`}
                                    >
                                        {plan.popular && (
                                            <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white text-center py-2 text-sm font-semibold">
                                                Most Popular
                                            </div>
                                        )}

                                        <div className="p-6">
                                            <div
                                                className={`inline-flex p-3 rounded-lg mb-4 ${plan.tier === SubscriptionTier.PRO_PLUS
                                                    ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white'
                                                    : 'bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400'
                                                    }`}
                                            >
                                                {getPlanIcon(plan.tier)}
                                            </div>

                                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                                {plan.name}
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                                                {plan.description}
                                            </p>

                                            <div className="mb-6">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                                        D{monthlyPrice.toLocaleString()}
                                                    </span>
                                                    <span className="text-gray-600 dark:text-gray-400">/mo</span>
                                                </div>
                                                {billingCycle === 'yearly' && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                                        Billed D{price.toLocaleString()} annually
                                                    </p>
                                                )}
                                            </div>

                                            {isCurrentPlan ? (
                                                <button
                                                    disabled
                                                    className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg font-semibold cursor-not-allowed"
                                                >
                                                    Current Plan
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleUpgrade(plan)}
                                                        disabled={subscribing || !canAfford}
                                                        className={`w-full py-3 rounded-lg font-semibold transition-all ${plan.tier === SubscriptionTier.PRO_PLUS
                                                            ? 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white'
                                                            : 'bg-teal-600 hover:bg-teal-700 text-white'
                                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                    >
                                                        {subscribing
                                                            ? 'Processing...'
                                                            : !canAfford
                                                                ? 'Insufficient Funds'
                                                                : 'Upgrade Now'}
                                                    </button>
                                                    {!canAfford && (
                                                        <div className="mt-3 flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                                                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                            <p>
                                                                You need D{(price - walletBalance).toFixed(2)} more. Top up your wallet to
                                                                continue.
                                                            </p>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            <ul className="mt-6 space-y-3">
                                                {highlightedFeatures[plan.tier as keyof typeof highlightedFeatures].map(
                                                    (feature, index) => (
                                                        <li key={index} className="flex items-start gap-2 text-sm">
                                                            <Check className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                                                            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Payment Info */}
                        <div className="p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                                Payment processed through ConnektWallet • Cancel anytime • Auto-renewal
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
