'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Briefcase, FolderKanban, CheckSquare, BarChart2, Users, Settings, HelpCircle, LogOut, Download, HardDrive } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Agency } from '@/lib/services/agency-service';
import { useState, useEffect } from 'react';
import { StorageQuotaService, StorageQuota } from '@/lib/services/storage-quota-service';

interface SidebarProps {
    agency?: Agency | null;
}

export function Sidebar({ agency = null }: SidebarProps) {
    const pathname = usePathname();
    const { user, userProfile } = useAuth();
    const [storageQuota, setStorageQuota] = useState<StorageQuota | null>(null);

    useEffect(() => {
        const loadStorage = async () => {
            if (!userProfile?.username) return;

            try {
                if (agency) {
                    const agencyQuota = await StorageQuotaService.getAgencyStorageQuota(agency.id!);
                    if (agencyQuota) {
                        setStorageQuota({
                            userId: user?.uid || '',
                            mailAddress: `@${agency.username}.com`,
                            totalQuota: agencyQuota.totalQuota,
                            usedSpace: agencyQuota.usedSpace,
                            filesCount: agencyQuota.filesCount,
                            mailAttachmentsSize: 0,
                            otherFilesSize: 0,
                            lastUpdated: agencyQuota.lastUpdated
                        });
                    }
                } else {
                    const personalMail = `${userProfile.username}@connekt.com`;
                    const quota = await StorageQuotaService.getStorageQuota(personalMail);
                    setStorageQuota(quota);
                }
            } catch (error) {
                console.error('Error loading storage:', error);
            }
        };

        loadStorage();
    }, [user, userProfile, agency]);

    const menuItems = agency ? [
        { icon: LayoutGrid, label: 'Dashboard', href: `/agency/${agency.username}/dashboard` },
        { icon: Briefcase, label: 'Projects', href: `/agency/${agency.username}/projects` },
        { icon: CheckSquare, label: 'Tasks', href: `/agency/${agency.username}/tasks` },
        { icon: Users, label: 'Team', href: `/agency/${agency.username}/team` },
    ] : [
        { icon: LayoutGrid, label: 'Dashboard', href: '/dashboard' },
        { icon: FolderKanban, label: 'Workspaces', href: '/dashboard/workspaces' },
        { icon: Briefcase, label: 'Projects', href: '/dashboard/projects' },
        { icon: CheckSquare, label: 'Tasks', href: '/dashboard/tasks' },
        { icon: BarChart2, label: 'Analytics', href: '/analytics' },
        { icon: Users, label: 'Team', href: '/agency' },
    ];

    const storageUsedGB = storageQuota ? StorageQuotaService.bytesToGB(storageQuota.usedSpace) : 0;
    const storageTotalGB = storageQuota ? StorageQuotaService.bytesToGB(storageQuota.totalQuota) : 1.0;
    const storagePercentage = (storageUsedGB / storageTotalGB) * 100;

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border-r border-white/20 dark:border-white/5 flex flex-col p-6 z-[110] hidden lg:flex transition-all duration-300 overflow-y-auto">
            <div className="space-y-1 mb-8">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-3">Menu</h3>
                {menuItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${isActive
                                ? 'bg-[#008080] text-white shadow-lg shadow-teal-500/20'
                                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 dark:text-gray-400'
                                }`}
                        >
                            <item.icon size={20} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#008080]'} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>

            {/* General */}
            <div className="space-y-1 mb-auto">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-3">General</h3>

                {/* ConnektStorage Card - First Item */}
                <Link
                    href={agency ? `/agency/${agency.username}/dashboard/storage` : '/dashboard/storage'}
                    className="mx-3 mb-3 p-4 rounded-2xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-zinc-700/50 hover:border-[#008080]/30 transition-all cursor-pointer block"
                >
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <HardDrive size={16} className="text-[#008080]" />
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">ConnektStorage</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 dark:text-gray-400">
                                {agency ? 'Agency Storage' : 'Your Storage'}
                            </span>
                            <span className="font-bold text-gray-700 dark:text-gray-300">
                                {storageUsedGB.toFixed(2)}GB / {storageTotalGB.toFixed(1)}GB
                            </span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${storagePercentage > 90
                                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                                    : storagePercentage > 75
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                        : 'bg-gradient-to-r from-[#008080] to-teal-500'
                                    }`}
                                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                            ></div>
                        </div>
                        {agency && (
                            <p className="text-[10px] text-gray-500">Shared across all members</p>
                        )}
                    </div>
                </Link>

                <Link href="/settings" className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                    <Settings size={20} /> Settings
                </Link>
                <Link href="/help" className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                    <HelpCircle size={20} /> Help
                </Link>
                <button
                    onClick={() => signOut(auth)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                >
                    <LogOut size={20} /> Logout
                </button>
            </div>

            {/* Promo Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-900 to-black relative overflow-hidden text-white shadow-xl">
                <div className="absolute top-0 right-0 w-20 h-20 bg-[#008080] rounded-full blur-[40px] opacity-30" />
                <div className="relative z-10">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-3">
                        <Download size={14} />
                    </div>
                    <h4 className="font-bold text-sm mb-1">Upgrade to Pro</h4>
                    <p className="text-[10px] text-gray-400 mb-3">Get AI agents & unlimited jobs.</p>
                    <button className="w-full py-2 bg-[#008080] hover:bg-teal-600 rounded-lg text-xs font-bold transition-colors">
                        Upgrade Now
                    </button>
                </div>
            </div>
        </aside>
    );
}
