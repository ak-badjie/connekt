'use client';

/**
 * Connekt Storage Page
 * Redesigned to match analytics dashboard styling
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StorageQuotaService, StorageQuota } from '@/lib/services/storage-quota-service';
import {
    HardDrive, File, Mail, Sparkles, FolderTree, ArrowRight, Crown,
    MessageSquare, User, FileText, CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { useMinimumLoading } from '@/hooks/useMinimumLoading';
import { SubscriptionService } from '@/lib/services/subscription.service';
import { TIER_FEATURES, SubscriptionTier } from '@/lib/types/subscription-tiers.types';
import FileExplorer from '@/components/storage/FileExplorer';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ResponsiveContainer, RadialBarChart, RadialBar, PieChart, Pie, Cell } from 'recharts';

// Branding
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';

// ==========================================
// UTILITIES
// ==========================================

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// ==========================================
// ANIMATION VARIANTS
// ==========================================

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1
        }
    }
};

const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    show: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 50, damping: 10 }
    }
};

// ==========================================
// GLASSMORPHIC CARD
// ==========================================

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
    title?: string;
    subtitle?: string;
    action?: React.ReactNode;
}

const GlassCard = ({
    children,
    className,
    noPadding = false,
    title,
    subtitle,
    action
}: GlassCardProps) => (
    <motion.div
        variants={itemVariants}
        className={cn(
            "relative overflow-hidden rounded-3xl",
            "bg-white/70 dark:bg-[#0A0A0A]/60 backdrop-blur-2xl",
            "border border-white/20 dark:border-white/5",
            "shadow-xl shadow-black/5 dark:shadow-black/20",
            "transition-colors duration-300",
            className
        )}
    >
        {/* Shine effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none z-10" />

        {(title || action) && (
            <div className="flex items-start justify-between p-6 pb-2 relative z-20">
                <div>
                    {title && <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>}
                    {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{subtitle}</p>}
                </div>
                {action && <div>{action}</div>}
            </div>
        )}

        <div className={cn("relative z-10", !noPadding && "p-6")}>
            {children}
        </div>
    </motion.div>
);

// ==========================================
// STORAGE CATEGORY COLORS
// ==========================================

const STORAGE_COLORS = {
    ai: { bg: 'bg-amber-500/10', color: '#F59E0B', icon: () => <ConnektAIIcon className="w-6 h-6" /> },
    mail: { bg: 'bg-blue-500/10', color: '#3B82F6', icon: Mail },
    other: { bg: 'bg-purple-500/10', color: '#8B5CF6', icon: File },
    files: { bg: 'bg-green-500/10', color: '#10B981', icon: FolderTree },
    chat: { bg: 'bg-pink-500/10', color: '#EC4899', icon: MessageSquare },
    profile: { bg: 'bg-indigo-500/10', color: '#6366F1', icon: User },
    contracts: { bg: 'bg-amber-500/10', color: '#F59E0B', icon: FileText },
    proofs: { bg: 'bg-emerald-500/10', color: '#10B981', icon: CheckSquare },
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function StoragePage() {
    const { user, userProfile } = useAuth();
    const [storageQuota, setStorageQuota] = useState<StorageQuota | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeMailAddress, setActiveMailAddress] = useState('');
    const [aiQuota, setAiQuota] = useState<{ tierName: string; quota: number; used: number; isUnlimited: boolean } | null>(null);
    const [showFileExplorer, setShowFileExplorer] = useState(false);
    const [currentTier, setCurrentTier] = useState<SubscriptionTier>(SubscriptionTier.FREE);

    useEffect(() => {
        if (user && userProfile?.username) {
            const mailAddress = `${userProfile.username}@connekt.com`;
            setActiveMailAddress(mailAddress);
            loadStorageData(mailAddress);
            loadAiQuota(user.uid);
        }
    }, [user, userProfile]);

    const loadStorageData = async (mailAddress: string) => {
        setLoading(true);
        try {
            const quota = await StorageQuotaService.getStorageQuota(mailAddress);
            setStorageQuota(quota);
        } catch (error) {
            console.error('Error loading storage:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAiQuota = async (uid: string) => {
        try {
            const tier = await SubscriptionService.getUserTier(uid);
            setCurrentTier(tier);
            const features = TIER_FEATURES[tier];
            const limit = features.aiRequestsPerMonth;
            const isUnlimited = limit === -1;

            const currentMonth = new Date().toISOString().slice(0, 7);
            const quotaRef = doc(db, 'ai_usage_quotas', `${uid}_${currentMonth}`);
            const quotaSnap = await getDoc(quotaRef);

            let used = 0;
            if (quotaSnap.exists()) {
                used = quotaSnap.data().requestsUsed || 0;
            }

            setAiQuota({ tierName: tier, quota: isUnlimited ? Infinity : limit, used, isUnlimited });
        } catch (error) {
            console.error('Error loading AI quota:', error);
        }
    };

    const storagePercentage = storageQuota
        ? (storageQuota.usedSpace / storageQuota.totalQuota) * 100
        : 0;

    const usedGB = storageQuota ? StorageQuotaService.bytesToGB(storageQuota.usedSpace) : 0;
    const tierFeatures = TIER_FEATURES[currentTier];
    const totalGB = tierFeatures.storageGB;

    const shouldShowLoading = useMinimumLoading(loading, 3000);

    // Prepare storage breakdown data for chart
    const storageBreakdown = storageQuota ? [
        { name: 'Mail Attachments', value: storageQuota.mailAttachmentsSize || 0, color: STORAGE_COLORS.mail.color },
        { name: 'Chat Media', value: (storageQuota as any)?.chatAttachmentsSize || 0, color: STORAGE_COLORS.chat.color },
        { name: 'Profile Media', value: (storageQuota as any)?.profileMediaSize || 0, color: STORAGE_COLORS.profile.color },
        { name: 'Contracts', value: ((storageQuota as any)?.contractsSize || 0) + ((storageQuota as any)?.proposalsSize || 0), color: STORAGE_COLORS.contracts.color },
        { name: 'Task Proofs', value: (storageQuota as any)?.proofOfTaskSize || 0, color: STORAGE_COLORS.proofs.color },
        { name: 'Other Files', value: storageQuota.otherFilesSize || 0, color: STORAGE_COLORS.other.color },
    ].filter(item => item.value > 0) : [];

    const gaugeData = [{
        name: 'Used',
        value: Math.min(storagePercentage, 100),
        fill: storagePercentage > 90 ? '#EF4444' : storagePercentage > 75 ? '#F59E0B' : '#10B981'
    }];

    if (shouldShowLoading) {
        return <LoadingScreen variant="storage" />;
    }

    return (
        <div className="min-h-screen bg-[#F3F4F6] dark:bg-black p-4 md:p-8 pb-24">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vh] bg-teal-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-amber-500/5 rounded-full blur-[100px]" />
            </div>

            <motion.div
                className="max-w-7xl mx-auto relative z-10 space-y-8"
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                {/* Header */}
                <motion.div variants={itemVariants}>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-[#008080] text-sm font-bold mb-4">
                        <HardDrive size={14} />
                        Connect Storage
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2">
                        Your Storage
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Manage your files, attachments, and AI usage across Connekt
                    </p>
                </motion.div>

                {/* Main Storage Overview - Full Width */}
                <GlassCard className="overflow-visible">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Gauge Section */}
                        <div className="flex flex-col items-center justify-center">
                            <div className="relative w-48 h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadialBarChart
                                        cx="50%"
                                        cy="50%"
                                        innerRadius="70%"
                                        outerRadius="100%"
                                        barSize={14}
                                        data={gaugeData}
                                        startAngle={180}
                                        endAngle={0}
                                    >
                                        <RadialBar
                                            background={{ fill: '#E5E7EB' }}
                                            dataKey="value"
                                            cornerRadius={10}
                                        />
                                    </RadialBarChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                        {storagePercentage.toFixed(0)}%
                                    </span>
                                    <span className="text-sm text-gray-500">Used</span>
                                </div>
                            </div>
                            <div className="text-center mt-4">
                                <p className="text-xl font-bold text-gray-900 dark:text-white">
                                    {usedGB.toFixed(2)} GB <span className="text-gray-400 font-normal">of {totalGB} GB</span>
                                </p>
                                <p className="text-sm text-gray-500">{(totalGB - usedGB).toFixed(2)} GB available</p>
                            </div>
                        </div>

                        {/* Breakdown Bars */}
                        <div className="lg:col-span-2 space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Storage Distribution</h3>
                            {storageBreakdown.length > 0 ? (
                                storageBreakdown.map((cat, i) => (
                                    <motion.div
                                        key={cat.name}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * i }}
                                        className="flex items-center gap-4"
                                    >
                                        <div className="w-32 flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate">{cat.name}</span>
                                        </div>
                                        <div className="flex-1 h-3 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: cat.color }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${storageQuota ? Math.min((cat.value / storageQuota.usedSpace) * 100, 100) : 0}%` }}
                                                transition={{ duration: 1, delay: 0.2 + (i * 0.1) }}
                                            />
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white w-20 text-right">
                                            {StorageQuotaService.formatBytes(cat.value)}
                                        </span>
                                    </motion.div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-sm">No files stored yet</p>
                            )}
                        </div>
                    </div>
                </GlassCard>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* AI Quota Card */}
                    <GlassCard>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", STORAGE_COLORS.ai.bg)}>
                                <ConnektAIIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Connect AI</h3>
                                <p className="text-xs text-gray-500">Monthly requests</p>
                            </div>
                        </div>
                        {aiQuota ? (
                            <>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-3xl font-black text-gray-900 dark:text-white">
                                        {aiQuota.isUnlimited ? '∞' : aiQuota.used}
                                    </p>
                                    {!aiQuota.isUnlimited && (
                                        <span className="text-sm text-gray-500">/ {aiQuota.quota}</span>
                                    )}
                                </div>
                                {!aiQuota.isUnlimited && (
                                    <div className="mt-3 h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min((aiQuota.used / aiQuota.quota) * 100, 100)}%` }}
                                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                                        />
                                    </div>
                                )}
                                <p className="text-xs text-gray-400 mt-2">
                                    {aiQuota.isUnlimited ? 'Unlimited AI power!' : `${aiQuota.quota - aiQuota.used} remaining`}
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-gray-500">Loading...</p>
                        )}
                    </GlassCard>

                    {/* Mail Attachments */}
                    <GlassCard>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", STORAGE_COLORS.mail.bg)}>
                                <Mail size={24} className="text-blue-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Mail Attachments</h3>
                                <p className="text-xs text-gray-500">Email files</p>
                            </div>
                        </div>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">
                            {StorageQuotaService.formatBytes(storageQuota?.mailAttachmentsSize || 0)}
                        </p>
                    </GlassCard>

                    {/* Other Files */}
                    <GlassCard>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", STORAGE_COLORS.other.bg)}>
                                <File size={24} className="text-purple-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Other Files</h3>
                                <p className="text-xs text-gray-500">Media & docs</p>
                            </div>
                        </div>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">
                            {StorageQuotaService.formatBytes(storageQuota?.otherFilesSize || 0)}
                        </p>
                    </GlassCard>

                    {/* Total Files */}
                    <GlassCard>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", STORAGE_COLORS.files.bg)}>
                                <FolderTree size={24} className="text-green-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Total Files</h3>
                                <p className="text-xs text-gray-500">All stored</p>
                            </div>
                        </div>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">
                            {storageQuota?.filesCount || 0}
                        </p>
                    </GlassCard>
                </div>

                {/* Additional Categories Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Chat Media */}
                    <GlassCard>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", STORAGE_COLORS.chat.bg)}>
                                <MessageSquare size={24} className="text-pink-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Chat Media</h3>
                                <p className="text-xs text-gray-500">Images, videos, audio</p>
                            </div>
                        </div>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">
                            {StorageQuotaService.formatBytes((storageQuota as any)?.chatAttachmentsSize || 0)}
                        </p>
                    </GlassCard>

                    {/* Profile Media */}
                    <GlassCard>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", STORAGE_COLORS.profile.bg)}>
                                <User size={24} className="text-indigo-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Profile Media</h3>
                                <p className="text-xs text-gray-500">Photos & videos</p>
                            </div>
                        </div>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">
                            {StorageQuotaService.formatBytes((storageQuota as any)?.profileMediaSize || 0)}
                        </p>
                    </GlassCard>

                    {/* Contracts & Proposals */}
                    <GlassCard>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", STORAGE_COLORS.contracts.bg)}>
                                <FileText size={24} className="text-amber-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Contracts</h3>
                                <p className="text-xs text-gray-500">Contracts & proposals</p>
                            </div>
                        </div>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">
                            {StorageQuotaService.formatBytes(((storageQuota as any)?.contractsSize || 0) + ((storageQuota as any)?.proposalsSize || 0))}
                        </p>
                    </GlassCard>

                    {/* Task Proofs */}
                    <GlassCard>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", STORAGE_COLORS.proofs.bg)}>
                                <CheckSquare size={24} className="text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Task Proofs</h3>
                                <p className="text-xs text-gray-500">Completion files</p>
                            </div>
                        </div>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">
                            {StorageQuotaService.formatBytes((storageQuota as any)?.proofOfTaskSize || 0)}
                        </p>
                    </GlassCard>
                </div>

                {/* File Explorer Section */}
                <GlassCard noPadding>
                    <button
                        onClick={() => setShowFileExplorer(!showFileExplorer)}
                        className="w-full p-6 flex items-center justify-between hover:bg-white/30 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <FolderTree size={24} className="text-white" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">File Explorer</h3>
                                <p className="text-sm text-gray-500">Browse your uploaded files and attachments</p>
                            </div>
                        </div>
                        <motion.div
                            animate={{ rotate: showFileExplorer ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ArrowRight size={24} className="text-gray-400" />
                        </motion.div>
                    </button>

                    <AnimatePresence>
                        {showFileExplorer && user && userProfile?.username && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="border-t border-gray-200/50 dark:border-zinc-800/50"
                            >
                                <div className="p-6 max-h-[500px] overflow-y-auto">
                                    <FileExplorer
                                        userId={user.uid}
                                        username={userProfile.username}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </GlassCard>

                {/* Upgrade CTA */}
                {currentTier !== SubscriptionTier.CONNECT_AI && (
                    <GlassCard noPadding className="overflow-hidden">
                        <div className="bg-gradient-to-r from-[#008080] via-teal-500 to-amber-500 p-8 text-white relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Crown size={20} />
                                        <span className="text-sm font-bold uppercase tracking-wider opacity-90">Upgrade Your Plan</span>
                                    </div>
                                    <h3 className="text-2xl font-black mb-2">Need More Storage & AI?</h3>
                                    <p className="text-white/80 mb-4 max-w-md">
                                        Get up to 50GB storage and 1,000 AI requests with Pro Plus, or go unlimited with Connect AI!
                                    </p>
                                    <Link
                                        href="/settings"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#008080] rounded-xl font-bold hover:scale-105 transition-all shadow-lg"
                                    >
                                        View Plans
                                        <ArrowRight size={18} />
                                    </Link>
                                </div>
                                <div className="hidden md:block text-8xl opacity-20">
                                    📦
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                )}
            </motion.div>
        </div>
    );
}
