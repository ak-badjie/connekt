'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap, Crown, Sparkles, Wallet as WalletIcon, AlertCircle, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '@/context/AuthContext';
import { SubscriptionService } from '@/lib/services/subscription.service';
import { WalletService } from '@/lib/services/wallet-service';
import {
    SubscriptionTier,
    SubscriptionPlan,
    SUBSCRIPTION_PLANS,
} from '@/lib/types/subscription-tiers.types';
import Lightning from '@/components/ui/Lightning';
import { ElectroBorder } from '@/components/ui/ElectricBorder';

interface UpgradeOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    originPosition?: { x: number; y: number };
}

export default function UpgradeOverlay({ isOpen, onClose, onSuccess, originPosition }: UpgradeOverlayProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [currentTier, setCurrentTier] = useState<SubscriptionTier>(SubscriptionTier.FREE);
    const [hasConnectAI, setHasConnectAI] = useState(false);
    const [walletBalance, setWalletBalance] = useState<number>(0);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [subscribing, setSubscribing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Default origin to bottom-left (sidebar upgrade button area)
    const origin = originPosition || { x: 150, y: typeof window !== 'undefined' ? window.innerHeight - 100 : 700 };

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen && user) {
            loadData();
            setIsClosing(false);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, user]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !isClosing) {
                handleClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, isClosing]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 600);
    };

    const handleTopUp = () => {
        handleClose();
        setTimeout(() => {
            router.push('/dashboard/wallet');
        }, 650);
    };

    async function loadData() {
        if (!user) return;

        try {
            setLoading(true);
            const tier = await SubscriptionService.getUserTier(user.uid);
            setCurrentTier(tier);

            const subscription = await SubscriptionService.getUserSubscription(user.uid);
            if (subscription?.tier === SubscriptionTier.CONNECT_AI) {
                setHasConnectAI(true);
            }

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

        if (walletBalance < price) {
            toast.error(`Insufficient funds. You need D${price.toLocaleString()} but have D${walletBalance.toFixed(2)}`, {
                duration: 5000,
            });
            return;
        }

        if (plan.tier === SubscriptionTier.PRO && currentTier === SubscriptionTier.PRO_PLUS) {
            toast.error('Cannot downgrade from Pro Plus to Pro');
            return;
        }

        const isConnectAIPlan = plan.tier === SubscriptionTier.CONNECT_AI;
        const confirmMessage = isConnectAIPlan
            ? `Add Connect AI for D${price.toLocaleString()}/${billingCycle === 'monthly' ? 'month' : 'year'}?`
            : `Upgrade to ${plan.name} for D${price.toLocaleString()}/${billingCycle === 'monthly' ? 'month' : 'year'}?`;

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
                await loadData();
                onSuccess?.();
                setTimeout(() => handleClose(), 1500);
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
                return <Zap className="w-full h-full" />;
            case SubscriptionTier.PRO_PLUS:
                return <Crown className="w-full h-full" />;
            case SubscriptionTier.CONNECT_AI:
                return <Sparkles className="w-full h-full" />;
            default:
                return <Check className="w-full h-full" />;
        }
    };

    const getPlanColor = (tier: SubscriptionTier) => {
        switch (tier) {
            case SubscriptionTier.PRO:
                return '#00cccc';
            case SubscriptionTier.PRO_PLUS:
                return '#f59e0b';
            case SubscriptionTier.CONNECT_AI:
                return '#8b5cf6';
            default:
                return '#00cccc';
        }
    };

    const highlightedFeatures: Record<string, string[]> = {
        [SubscriptionTier.PRO]: [
            '15 AI Tools Access',
            'Advanced analytics',
            'Custom branding',
            'Priority support',
        ],
        [SubscriptionTier.PRO_PLUS]: [
            '25 AI Tools Access',
            'All Pro features',
            'Verification Badge',
            'White-label branding',
        ],
        [SubscriptionTier.CONNECT_AI]: [
            '100+ AI Tools',
            'Full AI Automation',
            'AI Contract Drafting',
            'AI Candidate Matching',
        ],
    };

    const upgradePlans = SUBSCRIPTION_PLANS.filter(
        p => p.tier === SubscriptionTier.PRO || p.tier === SubscriptionTier.PRO_PLUS || p.tier === SubscriptionTier.CONNECT_AI
    );

    if (!mounted) return null;

    const shouldShow = isOpen || isClosing;

    return createPortal(
        <AnimatePresence mode="wait">
            {shouldShow && (
                <motion.div
                    key="upgrade-overlay"
                    initial={{ clipPath: `circle(0px at ${origin.x}px ${origin.y}px)` }}
                    animate={isClosing
                        ? { clipPath: `circle(0px at ${origin.x}px ${origin.y}px)` }
                        : { clipPath: `circle(150% at ${origin.x}px ${origin.y}px)` }
                    }
                    exit={{ clipPath: `circle(0px at ${origin.x}px ${origin.y}px)` }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed inset-0 z-[99999] overflow-hidden"
                >
                    {/* Dark Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0f1419] to-[#1a1a2e]" />

                    {/* Lightning Effect */}
                    <div className="absolute inset-0 opacity-30">
                        <Lightning hue={181} speed={0.5} intensity={1.2} size={1.2} />
                    </div>

                    {/* Main Content Container */}
                    <div className="relative z-10 h-[100vh] w-full flex flex-col px-6 py-4">

                        {/* Header - 3 Column Layout */}
                        <div className="grid grid-cols-3 items-center mb-4">
                            {/* Left: Title */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                                    Upgrade Your Plan
                                </h1>
                                <p className="text-gray-400 text-sm md:text-base">
                                    Current: <span className="text-teal-400 font-bold">{currentTier === SubscriptionTier.FREE ? 'Free' : currentTier.replace('_', ' ').toUpperCase()}</span>
                                    {hasConnectAI && currentTier !== SubscriptionTier.CONNECT_AI && (
                                        <span className="ml-2 text-purple-400">+ AI</span>
                                    )}
                                </p>
                            </motion.div>

                            {/* Center: Billing Toggle */}
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="flex justify-center"
                            >
                                <div className="bg-white/10 backdrop-blur-xl rounded-xl p-1 inline-flex border border-white/10">
                                    <button
                                        onClick={() => setBillingCycle('monthly')}
                                        className={`px-5 py-2 rounded-lg transition-all text-sm font-bold ${billingCycle === 'monthly'
                                                ? 'bg-teal-600 text-white shadow-lg'
                                                : 'text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        Monthly
                                    </button>
                                    <button
                                        onClick={() => setBillingCycle('yearly')}
                                        className={`px-5 py-2 rounded-lg transition-all text-sm font-bold flex items-center gap-2 ${billingCycle === 'yearly'
                                                ? 'bg-teal-600 text-white shadow-lg'
                                                : 'text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        Yearly
                                        <span className="text-xs bg-green-500/30 text-green-400 px-2 py-0.5 rounded-full">
                                            -17%
                                        </span>
                                    </button>
                                </div>
                            </motion.div>

                            {/* Right: Wallet + Close */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex items-center justify-end gap-3"
                            >
                                <div className="flex items-center gap-3 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10">
                                    <WalletIcon className="w-5 h-5 text-teal-400" />
                                    <div>
                                        <p className="text-xs text-gray-400">Balance</p>
                                        <p className="text-lg font-bold text-white leading-none">
                                            D{walletBalance.toFixed(2)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleTopUp}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg transition-colors text-sm"
                                    >
                                        <Plus size={14} />
                                        Top Up
                                    </button>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </motion.div>
                        </div>

                        {/* Plans Grid - Takes all remaining space */}
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
                            </div>
                        ) : (
                            <div className="flex-1 min-h-0">
                                <div className="grid grid-cols-3 gap-5 h-full max-w-6xl mx-auto">
                                    {upgradePlans.map((plan, index) => {
                                        const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
                                        const monthlyPrice = billingCycle === 'yearly' ? Math.round(price / 12) : price;
                                        const isCurrentPlan = currentTier === plan.tier;
                                        const canAfford = walletBalance >= price;
                                        const isConnectAI = plan.tier === SubscriptionTier.CONNECT_AI;
                                        const cannotDowngrade = plan.tier === SubscriptionTier.PRO && currentTier === SubscriptionTier.PRO_PLUS;
                                        const borderColor = getPlanColor(plan.tier);

                                        return (
                                            <motion.div
                                                key={plan.id}
                                                initial={{ opacity: 0, y: 30 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.4 + index * 0.1 }}
                                                className="h-full"
                                            >
                                                <ElectroBorder
                                                    borderColor={borderColor}
                                                    borderWidth={2}
                                                    distortion={0.6}
                                                    animationSpeed={1}
                                                    radius={20}
                                                    glow={true}
                                                    aura={true}
                                                    glowBlur={25}
                                                    className="h-full"
                                                >
                                                    <div className="h-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl overflow-hidden flex flex-col">
                                                        {/* Badge */}
                                                        {plan.popular && (
                                                            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-center py-2 text-sm font-black tracking-wide">
                                                                ★ MOST POPULAR
                                                            </div>
                                                        )}
                                                        {isConnectAI && (
                                                            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center py-2 text-sm font-black tracking-wide flex items-center justify-center gap-2">
                                                                <Sparkles size={14} />
                                                                AI POWER
                                                            </div>
                                                        )}

                                                        {/* Card Content */}
                                                        <div className="p-5 flex-1 flex flex-col">
                                                            {/* Icon */}
                                                            <div
                                                                className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 p-2.5"
                                                                style={{ backgroundColor: `${borderColor}25` }}
                                                            >
                                                                <div style={{ color: borderColor }}>
                                                                    {getPlanIcon(plan.tier)}
                                                                </div>
                                                            </div>

                                                            {/* Name & Description */}
                                                            <h3 className="text-xl font-black text-white mb-1">
                                                                {plan.name}
                                                            </h3>
                                                            <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                                                                {plan.description}
                                                            </p>

                                                            {/* Price */}
                                                            <div className="mb-4">
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-4xl font-black text-white">
                                                                        D{monthlyPrice.toLocaleString()}
                                                                    </span>
                                                                    <span className="text-gray-400 text-base">/mo</span>
                                                                </div>
                                                                {billingCycle === 'yearly' && (
                                                                    <p className="text-sm text-gray-500 mt-0.5">
                                                                        Billed D{price.toLocaleString()}/year
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* Action Button */}
                                                            {isCurrentPlan ? (
                                                                <button
                                                                    disabled
                                                                    className="w-full py-3 bg-white/10 text-gray-400 rounded-xl font-bold cursor-not-allowed text-base"
                                                                >
                                                                    Current Plan
                                                                </button>
                                                            ) : cannotDowngrade ? (
                                                                <button
                                                                    disabled
                                                                    className="w-full py-3 bg-white/10 text-gray-500 rounded-xl font-bold cursor-not-allowed text-base"
                                                                >
                                                                    Cannot Downgrade
                                                                </button>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleUpgrade(plan)}
                                                                        disabled={subscribing || !canAfford}
                                                                        className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-base ${subscribing
                                                                                ? 'bg-gray-600 text-gray-300 cursor-wait'
                                                                                : !canAfford
                                                                                    ? 'bg-red-900/40 text-red-400 cursor-not-allowed'
                                                                                    : isConnectAI
                                                                                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
                                                                                        : plan.popular
                                                                                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black'
                                                                                            : 'bg-teal-600 hover:bg-teal-500 text-white'
                                                                            }`}
                                                                    >
                                                                        {subscribing ? (
                                                                            <>
                                                                                <Loader2 className="animate-spin" size={18} />
                                                                                Processing...
                                                                            </>
                                                                        ) : !canAfford ? (
                                                                            'Insufficient Funds'
                                                                        ) : isConnectAI ? (
                                                                            <>
                                                                                <Plus size={18} />
                                                                                Add to Plan
                                                                            </>
                                                                        ) : (
                                                                            'Upgrade Now'
                                                                        )}
                                                                    </button>
                                                                    {!canAfford && (
                                                                        <div className="mt-2 flex items-center gap-1.5 text-sm text-amber-400">
                                                                            <AlertCircle size={14} />
                                                                            <p>Need D{(price - walletBalance).toFixed(0)} more</p>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}

                                                            {/* Features */}
                                                            <ul className="mt-4 space-y-2 flex-1">
                                                                {highlightedFeatures[plan.tier]?.map((feature, idx) => (
                                                                    <li key={idx} className="flex items-start gap-2 text-sm">
                                                                        <Check
                                                                            className="w-4 h-4 flex-shrink-0 mt-0.5"
                                                                            style={{ color: borderColor }}
                                                                        />
                                                                        <span className="text-gray-300">{feature}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </ElectroBorder>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="pt-4 text-center"
                        >
                            <p className="text-sm text-gray-400">
                                Payment processed through ConnektWallet • Cancel anytime • Auto-renewal enabled
                            </p>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
