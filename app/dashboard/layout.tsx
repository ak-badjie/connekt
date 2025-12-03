'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/context/AuthContext';
import { redirect, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { GlobalChatWidget } from '@/components/chat/GlobalChatWidget';
import { useAnimation } from '@/context/AnimationContext';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { useMinimumLoading } from '@/hooks/useMinimumLoading';
import { useEffect, useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const { hasGlobalAnimationRun, setHasGlobalAnimationRun, hasTeamsAnimationRun, setHasTeamsAnimationRun } = useAnimation();

    // Check if we should skip teams animation (Wallet and Storage have their own)
    const isWalletOrStorage = pathname?.includes('/wallet') || pathname?.includes('/storage');

    // Check if we are on the main dashboard route (exact match)
    const isMainDashboard = pathname === '/dashboard';

    // Global Animation Logic (Initial App Load)
    const [globalLoading, setGlobalLoading] = useState(true);
    useEffect(() => {
        const timer = setTimeout(() => setGlobalLoading(false), 100);
        return () => clearTimeout(timer);
    }, []);

    // We combine auth loading with our animation delay
    // If it's the first run, we want to ensure the animation plays for at least 6s
    const showGlobalLoading = useMinimumLoading(
        (loading || globalLoading) && !hasGlobalAnimationRun,
        6000
    );

    useEffect(() => {
        if (!showGlobalLoading && !hasGlobalAnimationRun) {
            setHasGlobalAnimationRun(true);
        }
    }, [showGlobalLoading, hasGlobalAnimationRun, setHasGlobalAnimationRun]);

    // Teams Animation Logic
    // Only trigger if global animation is done (or skipped)
    const [teamsLoading, setTeamsLoading] = useState(true);
    useEffect(() => {
        if (hasGlobalAnimationRun) {
            const timer = setTimeout(() => setTeamsLoading(false), 100);
            return () => clearTimeout(timer);
        }
    }, [hasGlobalAnimationRun]);

    // Show teams animation if:
    // 1. Auth is loading (replace spinner) AND we are not in wallet/storage
    // 2. OR we are in the "artificial delay" phase AND we haven't run it yet AND we are on main dashboard
    // Note: User wants to remove animation from sub-routes (workspaces, etc) entirely.
    // So we only enforce the 6s delay if isMainDashboard is true.
    // However, if Auth is loading, we MUST show something. We show the Team Loading screen.

    const shouldEnforceDelay = isMainDashboard && !hasTeamsAnimationRun && !isWalletOrStorage;

    const showTeamsLoading = useMinimumLoading(
        (loading || (teamsLoading && hasGlobalAnimationRun)) && shouldEnforceDelay,
        6000
    );

    // If we are loading Auth but NOT enforcing delay (e.g. sub-route refresh),
    // we still want to show the loading screen instead of nothing/spinner, but maybe without the 6s lock?
    // Actually, useMinimumLoading with false condition returns false immediately.
    // So if loading is true, but shouldEnforceDelay is false, showTeamsLoading is false.
    // We need a fallback for "Just Auth Loading".

    const isAuthLoading = loading && !isWalletOrStorage;

    useEffect(() => {
        if (!showTeamsLoading && hasGlobalAnimationRun && !hasTeamsAnimationRun && !isWalletOrStorage && isMainDashboard) {
            setHasTeamsAnimationRun(true);
        }
    }, [showTeamsLoading, hasGlobalAnimationRun, hasTeamsAnimationRun, isWalletOrStorage, setHasTeamsAnimationRun, isMainDashboard]);

    if (!loading && !user) redirect('/auth');

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-gray-900 dark:text-gray-100 relative">
            {/* Global Animation Overlay */}
            {showGlobalLoading && !hasGlobalAnimationRun && (
                <LoadingScreen variant="default" className="z-[9999]" />
            )}

            {/* Teams Animation Overlay - Shows during 6s delay OR during simple Auth load */}
            {(showTeamsLoading || isAuthLoading) && !hasTeamsAnimationRun && !isWalletOrStorage && (
                <LoadingScreen variant="team" className="z-[9999]" />
            )}

            <Sidebar />
            <Navbar />
            <main className="lg:pl-72 pt-24 pr-6 pl-6 pb-6 min-h-screen transition-all duration-300">
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl shadow-xl p-6 min-h-[calc(100vh-8rem)] overflow-hidden">
                    {children}
                </div>
            </main>
            <GlobalChatWidget />
        </div>
    );
}
