'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { AgencyService, Agency } from '@/lib/services/agency-service';
import { Building2, Users, Plus, Briefcase, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function AgencyWelcomePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [userAgencies, setUserAgencies] = useState<Agency[]>([]);
    const [memberAgencies, setMemberAgencies] = useState<Agency[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const loadAgencies = async () => {
            if (!user) return;

            setLoading(true);
            try {
                const owned = await AgencyService.getUserAgencies(user.uid);
                const member = await AgencyService.getAgenciesUserBelongsTo(user.uid);

                setUserAgencies(owned);
                setMemberAgencies(member);
            } catch (error) {
                console.error('Error loading agencies:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            loadAgencies();
        }
    }, [user]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900 flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-[#008080]" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const hasAgencies = userAgencies.length > 0 || memberAgencies.length > 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900 p-8 pt-24 pb-16">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
                                <Building2 className="text-white" size={32} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#008080] to-amber-500 bg-clip-text text-transparent">
                                    Agencies
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    Manage your team workspaces and collaborations
                                </p>
                            </div>
                        </div>

                        <Link href="/agency/create">
                            <button className="px-6 py-3 bg-gradient-to-r from-[#008080] to-teal-600 hover:from-teal-600 hover:to-[#008080] text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-teal-500/25 transition-all hover:scale-105">
                                <Plus size={20} />
                                Create Agency
                            </button>
                        </Link>
                    </div>
                </motion.div>

                {!hasAgencies ? (
                    /* Empty State */
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-zinc-800/50 p-16 text-center shadow-xl"
                    >
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#008080]/10 to-amber-500/10 flex items-center justify-center mx-auto mb-6">
                            <Briefcase className="text-[#008080]" size={48} />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                            Welcome to Connekt Agencies
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                            Create your first agency to collaborate with your team, manage projects together,
                            and get your own agency domain on the Connekt platform.
                        </p>
                        <Link href="/agency/create">
                            <button className="px-8 py-4 bg-gradient-to-r from-[#008080] to-teal-600 hover:from-teal-600 hover:to-[#008080] text-white rounded-xl font-bold text-lg flex items-center gap-3 shadow-lg shadow-teal-500/25 transition-all hover:scale-105 mx-auto">
                                <Plus size={24} />
                                Create Your First Agency
                                <ChevronRight size={24} />
                            </button>
                        </Link>
                    </motion.div>
                ) : (
                    <div className="space-y-12">
                        {/* Your Agencies */}
                        {userAgencies.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                    <Building2 size={28} className="text-[#008080]" />
                                    Your Agencies
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {userAgencies.map((agency, index) => (
                                        <AgencyCard
                                            key={agency.id}
                                            agency={agency}
                                            isOwner={true}
                                            index={index}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Other Agencies (Member Of) */}
                        {memberAgencies.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                    <Users size={28} className="text-amber-500" />
                                    Member Of
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {memberAgencies.map((agency, index) => (
                                        <AgencyCard
                                            key={agency.id}
                                            agency={agency}
                                            isOwner={false}
                                            index={index}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

interface AgencyCardProps {
    agency: Agency;
    isOwner: boolean;
    index: number;
}

function AgencyCard({ agency, isOwner, index }: AgencyCardProps) {
    const router = useRouter();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ scale: 1.02, y: -4 }}
            onClick={() => router.push(`/agency/@${agency.username}/dashboard`)}
            className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-zinc-800/50 p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
        >
            {/* Agency Logo */}
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center mb-4 shadow-md">
                {agency.logoUrl ? (
                    <img
                        src={agency.logoUrl}
                        alt={agency.name}
                        className="w-full h-full object-cover rounded-xl"
                    />
                ) : (
                    <Building2 className="text-white" size={32} />
                )}
            </div>

            {/* Agency Info */}
            <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-[#008080] transition-colors">
                    {agency.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                    @{agency.username}
                </p>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-zinc-700/50">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Users size={16} />
                    <span>{agency.members?.length || 0} {(agency.members?.length || 0) === 1 ? 'member' : 'members'}</span>
                </div>
                {isOwner && (
                    <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold">
                        Owner
                    </span>
                )}
            </div>

            {/* Hover Arrow */}
            <div className="mt-4 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="text-[#008080]" size={20} />
            </div>
        </motion.div>
    );
}
