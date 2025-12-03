'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { SubscriptionService } from '@/lib/services/subscription.service';
import { SubscriptionTier } from '@/lib/types/subscription-tiers.types';
import { Zap, Crown } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionCardProps {
    onUpgradeClick: () => void;
}

export function SubscriptionCard({ onUpgradeClick }: SubscriptionCardProps) {
    const { user } = useAuth();
    const [currentTier, setCurrentTier] = useState<SubscriptionTier>(SubscriptionTier.FREE);

    useEffect(() => {
        if (user) {
            SubscriptionService.getUserTier(user.uid).then(setCurrentTier);
        }
    }, [user]);

    // Free tier users
    if (currentTier === SubscriptionTier.FREE) {
        return (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#008080] to-teal-900 relative overflow-hidden text-white shadow-xl mt-4 mb-8">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-[50px] opacity-20 translate-x-10 -translate-y-10" />
                <div className="relative z-10">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-3 backdrop-blur-md border border-white/10">
                        <Zap size={18} className="text-white" />
                    </div>
                    <h4 className="font-bold text-base mb-1">Get Connect Pro</h4>
                    <p className="text-xs text-teal-100 mb-4 opacity-90">
                        Unlock advanced analytics, priority support, and premium features.
                    </p>
                    <button
                        onClick={onUpgradeClick}
                        className="w-full py-2.5 bg-white text-[#008080] hover:bg-teal-50 rounded-xl text-xs font-bold transition-colors shadow-lg"
                    >
                        Upgrade Now
                    </button>
                </div>
            </div>
        );
    }

    // Pro tier users
    if (currentTier === SubscriptionTier.PRO) {
        return (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 relative overflow-hidden text-white shadow-xl mt-4 mb-8">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-[50px] opacity-20 translate-x-10 -translate-y-10" />
                <div className="relative z-10">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-3 backdrop-blur-md border border-white/10">
                        <Crown size={18} className="text-white" />
                    </div>
                    <h4 className="font-bold text-base mb-1">You're on Pro</h4>
                    <p className="text-xs text-yellow-100 mb-4 opacity-90">
                        Upgrade to Pro Plus for agency tools and white-label.
                    </p>
                    <button
                        onClick={onUpgradeClick}
                        className="w-full py-2.5 bg-white text-amber-600 hover:bg-yellow-50 rounded-xl text-xs font-bold transition-colors shadow-lg"
                    >
                        Upgrade to Pro Plus
                    </button>
                </div>
            </div>
        );
    }

    // Pro Plus or higher
    return (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 relative overflow-hidden text-white shadow-xl mt-4 mb-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-[50px] opacity-20 translate-x-10 -translate-y-10" />
            <div className="relative z-10">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-3 backdrop-blur-md border border-white/10">
                    <Crown size={18} className="text-white" />
                </div>
                <h4 className="font-bold text-base mb-1">
                    You're on {currentTier === SubscriptionTier.PRO_PLUS ? 'Pro Plus' : 'Premium'}
                </h4>
                <p className="text-xs text-purple-100 mb-4 opacity-90">
                    You have access to all premium features.
                </p>
                <Link
                    href="/settings"
                    className="block w-full py-2.5 bg-white text-purple-600 hover:bg-purple-50 rounded-xl text-xs font-bold transition-colors shadow-lg text-center"
                >
                    Manage Subscription
                </Link>
            </div>
        </div>
    );
}
