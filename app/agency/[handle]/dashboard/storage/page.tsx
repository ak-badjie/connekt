'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { StorageQuotaService, AgencyStorageQuota } from '@/lib/services/storage-quota-service';
import { AgencyService } from '@/lib/services/agency-service';
import { HardDrive, File, Mail, FileText, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { useMinimumLoading } from '@/hooks/useMinimumLoading';

export default function AgencyStoragePage() {
    const params = useParams();
    const agencyUsername = params.handle as string;
    const { user } = useAuth();
    const [agencyStorageQuota, setAgencyStorageQuota] = useState<AgencyStorageQuota | null>(null);
    const [agencyName, setAgencyName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (agencyUsername) {
            loadAgencyData();
        }
    }, [agencyUsername]);

    const loadAgencyData = async () => {
        setLoading(true);
        try {
            // Load agency info by username
            const agency = await AgencyService.getAgencyByUsername(agencyUsername);
            if (agency) {
                setAgencyName(agency.name);
                // Load agency storage quota using the agency ID
                const quota = await StorageQuotaService.getAgencyStorageQuota(agency.id!);
                setAgencyStorageQuota(quota);
            }
        } catch (error) {
            console.error('Error loading agency storage:', error);
        } finally {
            setLoading(false);
        }
    };

    const storagePercentage = agencyStorageQuota
        ? (agencyStorageQuota.usedSpace / agencyStorageQuota.totalQuota) * 100
        : 0;

    const usedGB = agencyStorageQuota ? StorageQuotaService.bytesToGB(agencyStorageQuota.usedSpace) : 0;
    const totalGB = agencyStorageQuota ? StorageQuotaService.bytesToGB(agencyStorageQuota.totalQuota) : 1;

    const shouldShowLoading = useMinimumLoading(loading);

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
                    Manage {agencyName}'s files and storage across all agency members
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
                            {agencyName}
                        </h2>
                        <p className="text-sm text-gray-500">Agency Shared Storage</p>
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
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            {storagePercentage.toFixed(1)}% of storage used · {(totalGB - usedGB).toFixed(2)} GB available
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Users size={14} />
                            <span>{agencyStorageQuota?.mailAddresses?.length || 0} members</span>
                        </div>
                    </div>
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
                            <p className="text-xs text-gray-500">Files in team emails</p>
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {StorageQuotaService.formatBytes(0)}
                    </p>
                </div>

                {/* Team Members */}
                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-zinc-800/50 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                            <Users size={24} className="text-purple-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Team Members</h3>
                            <p className="text-xs text-gray-500">Active accounts</p>
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {agencyStorageQuota?.mailAddresses?.length || 0}
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
                        {agencyStorageQuota?.filesCount || 0}
                    </p>
                </div>
            </div>

            {/* Agency Members List */}
            {agencyStorageQuota?.mailAddresses && agencyStorageQuota.mailAddresses.length > 0 && (
                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-zinc-800/50 p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Team Members with Storage Access</h3>
                    <div className="space-y-2">
                        {agencyStorageQuota.mailAddresses.map((mailAddress: string, index: number) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl"
                            >
                                <Mail size={16} className="text-[#008080]" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{mailAddress}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Upgrade Section */}
            <div className="bg-gradient-to-r from-[#008080] to-amber-500 rounded-3xl p-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-bold mb-2">Need More Storage for Your Team?</h3>
                        <p className="text-white/80 mb-4">
                            Upgrade to ConnektStorage Pro for 50GB of shared storage and priority support
                        </p>
                        <button className="px-6 py-3 bg-white text-[#008080] rounded-xl font-bold hover:scale-105 transition-all">
                            Upgrade Agency Storage
                        </button>
                    </div>
                    <div className="hidden md:block text-6xl">📦</div>
                </div>
            </div>
        </div>
    );
}
