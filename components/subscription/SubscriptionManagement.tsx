'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { SubscriptionService } from '@/lib/services/subscription.service';
import { WalletService } from '@/lib/services/wallet-service';
import {
    SubscriptionTier,
    SubscriptionPlan,
    SUBSCRIPTION_PLANS,
    UserSubscription
} from '@/lib/types/subscription-tiers.types';
import { Check, Zap, Crown, Sparkles, CreditCard, Wallet as WalletIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubscriptionManagement() {
    const { user } = useAuth();
    const [currentTier, setCurrentTier] = useState<SubscriptionTier>(SubscriptionTier.FREE);
    const [subscription, setSubscription] = useState<UserSubscription | null>(null);
    const [walletBalance, setWalletBalance] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [subscribing, setSubscribing] = useState(false);

    useEffect(() => {
        loadData();
    }, [user]);

    async function loadData() {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            const tier = await SubscriptionService.getUserTier(user.uid);
            setCurrentTier(tier);

            const sub = await SubscriptionService.getUserSubscription(user.uid);
            setSubscription(sub);

            const wallet = await WalletService.getWallet(user.uid, 'user');
            setWalletBalance(wallet?.balance || 0);
        } catch (error) {
            console.error('Error loading subscription data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubscribe(plan: SubscriptionPlan) {
        if (!user) {
            toast.error('Please log in to subscribe');
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
                toast.success(result.message);
                await loadData();
                setSelectedPlan(null);
            } else {
                toast.error(result.message);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to subscribe');
        } finally {
            setSubscribing(false);
        }
    }

    async function handleCancel() {
        if (!confirm('Are you sure you want to cancel your subscription?')) {
            return;
        }

        try {
            const result = await SubscriptionService.cancelSubscription(user!.uid);
            if (result.success) {
                toast.success(result.message);
                await loadData();
            } else {
                toast.error(result.message);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to cancel subscription');
        }
    }

    const getPlanIcon = (tier: SubscriptionTier) => {
        switch (tier) {
            case SubscriptionTier.PRO:
                return <Zap className="w-8 h-8" />;
            case SubscriptionTier.PRO_PLUS:
                return <Crown className="w-8 h-8" />;
            case SubscriptionTier.CONNECT_AI:
                return <Sparkles className="w-8 h-8" />;
            default:
                return <Check className="w-8 h-8" />;
        }
    };

    const highlightedFeatures = {
        [SubscriptionTier.FREE]: [
            'Basic workspace features',
            '5 team members',
            '10 projects per workspace',
            '5GB storage',
        ],
        [SubscriptionTier.PRO]: [
            'Advanced analytics',
            'Custom branding',
            'Priority support',
            'Bulk operations',
            '25 team members',
            '50GB storage',
        ],
        [SubscriptionTier.PRO_PLUS]: [
            'All Pro features',
            'Talent pool management',
            'Client dashboards',
            'White-label options',
            'API access',
            '100 team members',
            '200GB storage',
        ],
        [SubscriptionTier.CONNECT_AI]: [
            'All Pro Plus features',
            '1,000 AI requests/month',
            'AI resume parser',
            'Smart candidate matching',
            'AI contract generation',
            'Task auto-generation',
            'Unlimited team members',
            '500GB storage',
        ],
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Current Subscription Status */}
            {subscription && subscription.status === 'active' && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 mb-8">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Current Plan: {SUBSCRIPTION_PLANS.find(p => p.tier === currentTier)?.name}
                            </h3>
                            <p className="text-gray-600 mb-1">
                                Status: <span className="font-medium text-green-600">Active</span>
                            </p>
                            <p className="text-gray-600 mb-1">
                                Billing Cycle: <span className="font-medium">{subscription.billingCycle}</span>
                            </p>
                            {subscription.nextBillingDate && (
                                <p className="text-gray-600">
                                    Next Billing: {subscription.nextBillingDate.toDate?.().toLocaleDateString() || 'N/A'}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            Cancel Subscription
                        </button>
                    </div>
                </div>
            )}

            {/* Wallet Balance */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <WalletIcon className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">ConnektWallet Balance</p>
                            <p className="text-2xl font-bold text-gray-900">
                                D{walletBalance.toFixed(2)} <span className="text-sm text-gray-500">GMD</span>
                            </p>
                        </div>
                    </div>
                    <a
                        href="/wallet"
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                        Top Up Wallet
                    </a>
                </div>
            </div>

            {/* Billing Cycle Toggle */}
            <div className="flex justify-center mb-8">
                <div className="bg-gray-100 rounded-lg p-1 inline-flex">
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-6 py-2 rounded-md transition-all ${billingCycle === 'monthly'
                                ? 'bg-white text-gray-900 shadow'
                                : 'text-gray-600'
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-6 py-2 rounded-md transition-all ${billingCycle === 'yearly'
                                ? 'bg-white text-gray-900 shadow'
                                : 'text-gray-600'
                            }`}
                    >
                        Yearly
                        <span className="ml-2 text-xs text-green-600 font-semibold">Save 17%</span>
                    </button>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {SUBSCRIPTION_PLANS.map(plan => {
                    const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
                    const monthlyPrice = billingCycle === 'yearly' ? price / 12 : price;
                    const isCurrentPlan = currentTier === plan.tier;

                    return (
                        <div
                            key={plan.id}
                            className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all ${plan.popular ? 'ring-2 ring-purple-600 scale-105' : ''
                                }`}
                        >
                            {plan.popular && (
                                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 text-sm font-semibold">
                                    Most Popular
                                </div>
                            )}

                            <div className="p-6">
                                <div className={`inline-flex p-3 rounded-lg mb-4 ${plan.tier === SubscriptionTier.CONNECT_AI
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                        : 'bg-purple-100 text-purple-600'
                                    }`}>
                                    {getPlanIcon(plan.tier)}
                                </div>

                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    {plan.name}
                                </h3>
                                <p className="text-gray-600 text-sm mb-4">
                                    {plan.description}
                                </p>

                                <div className="mb-6">
                                    {price > 0 ? (
                                        <>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-bold text-gray-900">
                                                    D{monthlyPrice.toLocaleString()}
                                                </span>
                                                <span className="text-gray-600">/mo</span>
                                            </div>
                                            {billingCycle === 'yearly' && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Billed D{price.toLocaleString()} annually
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-4xl font-bold text-gray-900">Free</span>
                                    )}
                                </div>

                                {isCurrentPlan ? (
                                    <button
                                        disabled
                                        className="w-full py-3 bg-gray-100 text-gray-500 rounded-lg font-semibold"
                                    >
                                        Current Plan
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleSubscribe(plan)}
                                        disabled={subscribing || plan.tier === SubscriptionTier.FREE}
                                        className={`w-full py-3 rounded-lg font-semibold transition-all ${plan.tier === SubscriptionTier.CONNECT_AI
                                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {subscribing ? 'Processing...' : plan.tier === SubscriptionTier.FREE ? 'Active' : 'Upgrade Now'}
                                    </button>
                                )}

                                <ul className="mt-6 space-y-3">
                                    {highlightedFeatures[plan.tier].map((feature, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm">
                                            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-gray-700">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* FAQs or Additional Info */}
            <div className="mt-12 bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Payment Information
                </h3>
                <div className="space-y-3 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        All payments are processed through ConnektWallet in Gambian Dalasis (GMD)
                    </p>
                    <p className="flex items-center gap-2">
                        <Check className="w-5 h-5" />
                        Cancel anytime - you'll retain access until the end of your billing period
                    </p>
                    <p className="flex items-center gap-2">
                        <Check className="w-5 h-5" />
                        Automatic renewal - ensure your wallet has sufficient balance
                    </p>
                </div>
            </div>
        </div>
    );
}
