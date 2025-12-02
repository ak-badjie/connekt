'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StorageQuotaService, StorageQuota } from '@/lib/services/storage-quota-service';
import { HardDrive, File, Mail, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { useMinimumLoading } from '@/hooks/useMinimumLoading';

export default function StoragePage() {
    const { user, userProfile } = useAuth();
    const [storageQuota, setStorageQuota] = useState<StorageQuota | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeMailAddress, setActiveMailAddress] = useState('');

    useEffect(() => {
        if (user && userProfile?.username) {
            const mailAddress = `${userProfile.username}@connekt.com`;
            setActiveMailAddress(mailAddress);
            loadStorageData(mailAddress);
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

    const storagePercentage = storageQuota
        ? (storageQuota.usedSpace / storageQuota.totalQuota) * 100
        : 0;

    const usedGB = storageQuota ? StorageQuotaService.bytesToGB(storageQuota.usedSpace) : 0;
    const totalGB = storageQuota ? StorageQuotaService.bytesToGB(storageQuota.totalQuota) : 1;

    const shouldShowLoading = useMinimumLoading(loading, 6000); // Ensure ConnektStorageLogo animations complete

    if (shouldShowLoading) {
        return <LoadingScreen variant="storage" />;
    }

    return (
        <div className="p-8 space-y-8 max-w-6xl">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#008080] to-amber-500 bg-clip-text text-transparent mb-2">
                    ConnektStorage
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Manage your files and storage across all your mail accounts
                </p>
            </div>

            {/* Storage Overview Card */}
            <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-zinc-800/50 p-8 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#008080] to-teal-600 rounded-2xl flex items-center justify-center">
                        <HardDrive size={32} className="text-white" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {activeMailAddress}
                        </h2>
                        <p className="text-sm text-gray-500">Personal Storage</p>
                    </div>
                </div>

                {/* Storage Bar */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-lg">
                        <span className="font-bold text-gray-700 dark:text-gray-300">
                            {usedGB.toFixed(2)} GB used
                        </span>
                        <span className="text-gray-500">
                            of {totalGB.toFixed(1)} GB
                        </span>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(storagePercentage, 100)}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className={`h-full rounded-full ${storagePercentage > 90
                                ? 'bg-gradient-to-r from-red-500 to-red-600'
                                : storagePercentage > 75
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                    : 'bg-gradient-to-r from-[#008080] to-teal-500'
                                }`}
                        />
                    </div>
                    <p className="text-sm text-gray-500">
                        {storagePercentage.toFixed(1)}% of storage used · {(totalGB - usedGB).toFixed(2)} GB available
                    </p>
                </div>
            </div>

            {/* Storage Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Mail Attachments */}
                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-zinc-800/50 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                            <Mail size={24} className="text-blue-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Mail Attachments</h3>
                            <p className="text-xs text-gray-500">Files in emails</p>
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {StorageQuotaService.formatBytes(storageQuota?.mailAttachmentsSize || 0)}
                    </p>
                </div>

                {/* Other Files */}
                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-zinc-800/50 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                            <File size={24} className="text-purple-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Other Files</h3>
                            <p className="text-xs text-gray-500">Documents & media</p>
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {StorageQuotaService.formatBytes(storageQuota?.otherFilesSize || 0)}
                    </p>
                </div>

                {/* Total Files */}
                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-zinc-800/50 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                            <FileText size={24} className="text-amber-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Total Files</h3>
                            <p className="text-xs text-gray-500">All files count</p>
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {storageQuota?.filesCount || 0}
                    </p>
                </div>
            </div>

            {/* Upgrade Section */}
            <div className="bg-gradient-to-r from-[#008080] to-amber-500 rounded-3xl p-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-bold mb-2">Need More Storage?</h3>
                        <p className="text-white/80 mb-4">
                            Upgrade to ConnektStorage Pro for 50GB of storage and priority support
                        </p>
                        <button className="px-6 py-3 bg-white text-[#008080] rounded-xl font-bold hover:scale-105 transition-all">
                            Upgrade Now
                        </button>
                    </div>
                    <div className="hidden md:block text-6xl">📦</div>
                </div>
            </div>
        </div>
    );
}
