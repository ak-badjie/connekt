'use client';

import { Sidebar, SidebarProvider, useSidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/context/AuthContext';
import { redirect, usePathname } from 'next/navigation';
import { GlobalChatWidget } from '@/components/chat/GlobalChatWidget';
import { useAnimation } from '@/context/AnimationContext';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { useMinimumLoading } from '@/hooks/useMinimumLoading';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// ============================================================================
// 1. INNER COMPONENT: Handles Logic & Animation consuming SidebarContext
// ============================================================================
function DashboardContent({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const { hasGlobalAnimationRun, setHasGlobalAnimationRun, hasTeamsAnimationRun, setHasTeamsAnimationRun } = useAnimation();

    // Access Sidebar State
    const { isCollapsed } = useSidebar();

    // --- LOGIC: Animation & Loading States (Preserved) ---
    const isWalletOrStorage = pathname?.includes('/wallet') || pathname?.includes('/storage');
    const isMainDashboard = pathname === '/dashboard';

    const [globalLoading, setGlobalLoading] = useState(true);
    useEffect(() => {
        const timer = setTimeout(() => setGlobalLoading(false), 100);
        return () => clearTimeout(timer);
    }, []);

    const showGlobalLoading = useMinimumLoading(
        (loading || globalLoading) && !hasGlobalAnimationRun,
        6000
    );

    useEffect(() => {
        if (!showGlobalLoading && !hasGlobalAnimationRun) {
            setHasGlobalAnimationRun(true);
        }
    }, [showGlobalLoading, hasGlobalAnimationRun, setHasGlobalAnimationRun]);

    const [teamsLoading, setTeamsLoading] = useState(true);
    useEffect(() => {
        if (hasGlobalAnimationRun) {
            const timer = setTimeout(() => setTeamsLoading(false), 100);
            return () => clearTimeout(timer);
        }
    }, [hasGlobalAnimationRun]);

    const shouldEnforceDelay = isMainDashboard && !hasTeamsAnimationRun && !isWalletOrStorage;
    const showTeamsLoading = useMinimumLoading(
        (loading || (teamsLoading && hasGlobalAnimationRun)) && shouldEnforceDelay,
        6000
    );

    const isAuthLoading = loading && !isWalletOrStorage;

    useEffect(() => {
        if (!showTeamsLoading && hasGlobalAnimationRun && !hasTeamsAnimationRun && !isWalletOrStorage && isMainDashboard) {
            setHasTeamsAnimationRun(true);
        }
    }, [showTeamsLoading, hasGlobalAnimationRun, hasTeamsAnimationRun, isWalletOrStorage, setHasTeamsAnimationRun, isMainDashboard]);

    // --- LOGIC: Auth Redirect ---
    if (!loading && !user) redirect('/auth');

    // --- ANIMATION CONFIG ---
    // Smoothly adjust padding based on sidebar state
    // Mobile collapsed: 5rem (72px + gap), Mobile expanded: 19rem
    // Desktop collapsed: 6.5rem, Desktop expanded: 21rem
    const mainVariants = {
        expanded: {
            paddingLeft: '19rem',
            transition: { type: "spring", stiffness: 300, damping: 30 }
        },
        collapsed: {
            paddingLeft: '5.5rem',
            transition: { type: "spring", stiffness: 300, damping: 30 }
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-gray-900 dark:text-gray-100 relative">
            {/* Global Animation Overlay */}
            {showGlobalLoading && !hasGlobalAnimationRun && (
                <LoadingScreen variant="default" className="z-[9999]" />
            )}

            {/* Teams Animation Overlay */}
            {(showTeamsLoading || isAuthLoading) && !hasTeamsAnimationRun && !isWalletOrStorage && (
                <LoadingScreen variant="team" className="z-[9999]" />
            )}

            {/* Layout Components */}
            <Sidebar />
            <Navbar />

            {/* Main Content Area - Single responsive layout */}
            <motion.main
                initial="collapsed"
                animate={isCollapsed ? "collapsed" : "expanded"}
                variants={mainVariants}
                className="pt-16 sm:pt-20 pr-2 sm:pr-4 lg:pr-6 pb-2 sm:pb-4 lg:pb-6 min-h-screen will-change-[padding]"
            >
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-2xl sm:rounded-3xl shadow-xl p-0 min-h-[calc(100vh-5rem)] sm:min-h-[calc(100vh-8rem)] overflow-hidden">
                    {children}
                </div>
            </motion.main>

            <GlobalChatWidget />
        </div>
    );
}

// ============================================================================
// 2. MAIN LAYOUT EXPORT
// ============================================================================
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <DashboardContent>{children}</DashboardContent>
        </SidebarProvider>
    );
}