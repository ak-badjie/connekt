'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams } from 'next/navigation';
import { AgencyService, Agency } from '@/lib/services/agency-service';
import { StorageQuotaService, AgencyStorageQuota } from '@/lib/services/storage-quota-service';
import StatsCard from '@/components/dashboard/StatsCard';
import { Plus, Users, Briefcase, HardDrive, CheckSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AgencyDashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const agencyUsername = params.username as string;

    const [agency, setAgency] = useState<Agency | null>(null);
    const [storageQuota, setStorageQuota] = useState<AgencyStorageQuota | null>(null);
    const [loading, setLoading] = useState(true);

    // Mock stats - In production, fetch from Firestore
    const [stats, setStats] = useState({
        totalProjects: 0,
        teamMembers: 0,
        activeTasks: 0,
        storageUsed: 0
    });

    useEffect(() => {
        const loadAgencyData = async () => {
            if (!user || !agencyUsername) return;

            setLoading(true);
            try {
                const agencyData = await AgencyService.getAgencyByUsername(agencyUsername);
                if (agencyData) {
                    setAgency(agencyData);

                    // Load storage quota
                    const quota = await StorageQuotaService.getAgencyStorageQuota(agencyData.id!);
                    setStorageQuota(quota);

                    // Set stats
                    setStats({
                        totalProjects: 0, // TODO: Fetch from Firestore
                        teamMembers: agencyData.members.length,
                        activeTasks: 0, // TODO: Fetch from Firestore
                        storageUsed: quota ? StorageQuotaService.bytesToGB(quota.usedSpace) : 0
                    });
                }
            } catch (error) {
                console.error('Error loading agency data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadAgencyData();
    }, [user, agencyUsername]);

    return (
        <div className="max-w-[1600px] mx-auto space-y-6">
            {/* Header Area */}
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your agency projects and team performance</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => router.push(`/agency/${agencyUsername}/projects/create`)}
                        className="px-5 py-2.5 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-teal-500/20"
                    >
                        <Plus size={16} /> Add Project
                    </button>
                    <button
                        onClick={() => router.push(`/agency/${agencyUsername}/team`)}
                        className="px-5 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
                    >
                        <Users size={16} /> Manage Team
                    </button>
                </div>
            </div>

            {/* Row 1: Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Projects"
                    value={stats.totalProjects}
                    trend="Active projects"
                    trendValue=""
                    color="green"
                />
                <StatsCard
                    title="Team Members"
                    value={stats.teamMembers}
                    trend="Active members"
                    trendValue=""
                    color="white"
                />
                <StatsCard
                    title="Active Tasks"
                    value={stats.activeTasks}
                    trend="In progress"
                    trendValue=""
                    color="white"
                />
                <div
                    onClick={() => router.push(`/agency/${agencyUsername}/dashboard/storage`)}
                    className="cursor-pointer"
                >
                    <StatsCard
                        title="Storage Used"
                        value={`${stats.storageUsed.toFixed(1)}GB`}
                        trend="View details →"
                        trendValue=""
                        color="white"
                    />
                </div>
            </div>

            {/* Agency Overview */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Team Activity */}
                <div className="xl:col-span-2 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-zinc-800/50 p-6 shadow-lg">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Briefcase size={24} className="text-[#008080]" />
                        Recent Projects
                    </h2>
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No projects yet. Create your first project to get started!</p>
                        <button
                            onClick={() => router.push(`/agency/${agencyUsername}/projects/create`)}
                            className="mt-4 px-6 py-2.5 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-teal-500/20"
                        >
                            Create Project
                        </button>
                    </div>
                </div>

                {/* Team Members */}
                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-zinc-800/50 p-6 shadow-lg">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Users size={24} className="text-[#008080]" />
                        Team Members
                    </h2>
                    <div className="space-y-3">
                        {agency?.members.map((member, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white font-bold">
                                    {member.agencyEmail[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {member.agencyEmail.split('@')[0]}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {member.agencyEmail}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${member.role === 'owner'
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                    : member.role === 'admin'
                                        ? 'bg-[#008080]/10 text-[#008080]'
                                        : 'bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-gray-400'
                                    }`}>
                                    {member.role}
                                </span>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => router.push(`/agency/${agencyUsername}/team`)}
                        className="w-full mt-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                        Manage Team
                    </button>
                </div>
            </div>
        </div>
    );
}
