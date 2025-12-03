'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Briefcase, FolderKanban, CheckSquare, BarChart2, Users, Settings, HelpCircle, LogOut, Download, HardDrive, User as UserIcon, Wallet, MessageSquare, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Agency } from '@/lib/services/agency-service';
import ConnektIcon from '@/components/branding/ConnektIcon';
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
        { icon: LayoutGrid, label: 'Teams', href: `/agency/${agency.username}/dashboard` },
        { icon: FolderKanban, label: 'Workspaces', href: `/agency/${agency.username}/dashboard/workspaces`, indent: true },
        { icon: Briefcase, label: 'Projects', href: `/agency/${agency.username}/dashboard/projects`, indent: true },
        { icon: CheckSquare, label: 'Tasks', href: `/agency/${agency.username}/dashboard/tasks`, indent: true },
        { icon: Users, label: 'Team Members', href: `/agency/${agency.username}/dashboard/teams`, indent: true },
        { icon: Calendar, label: 'Calendar', href: `/agency/${agency.username}/dashboard/calendar`, indent: true },
        { icon: Wallet, label: 'Wallet', href: `/agency/${agency.username}/dashboard/wallet` },
        { icon: HardDrive, label: 'Storage', href: `/agency/${agency.username}/dashboard/storage` },
        { icon: UserIcon, label: 'Profile', href: `/agency/@${agency.username}` },
    ] : [
        { icon: LayoutGrid, label: 'Teams', href: '/dashboard' },
        { icon: FolderKanban, label: 'Workspaces', href: '/dashboard/workspaces', indent: true },
        { icon: Briefcase, label: 'Projects', href: '/dashboard/projects', indent: true },
        { icon: CheckSquare, label: 'Tasks', href: '/dashboard/tasks', indent: true },
        { icon: Users, label: 'Team Members', href: '/dashboard/teams', indent: true },
        { icon: Calendar, label: 'Calendar', href: '/dashboard/calendar', indent: true },
        { icon: BarChart2, label: 'Analytics', href: '/analytics' },

        { icon: Wallet, label: 'Wallet', href: '/dashboard/wallet' },
        { icon: HardDrive, label: 'Storage', href: '/dashboard/storage' },
        { icon: UserIcon, label: 'Profile', href: userProfile?.username ? `/@${userProfile.username}` : '#' },
    ];
    const storageUsedGB = storageQuota ? StorageQuotaService.bytesToGB(storageQuota.usedSpace) : 0;
    const storageTotalGB = storageQuota ? StorageQuotaService.bytesToGB(storageQuota.totalQuota) : 1.0;
    const storagePercentage = (storageUsedGB / storageTotalGB) * 100;

    return (
        <aside className="fixed left-4 top-4 bottom-4 w-64 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-white/5 flex flex-col p-6 z-[110] hidden lg:flex transition-all duration-300 overflow-y-auto rounded-3xl shadow-2xl shadow-black/5">
            {/* Logo Section */}
            <Link href="/" className="flex items-center gap-3 mb-8 px-2 cursor-pointer hover:opacity-80 transition-opacity">
                <ConnektIcon className="w-12 h-12 text-[#008080]" />
                <span className="text-xl font-bold font-headline text-[#008080] tracking-widest">CONNEKT</span>
            </Link>

            <div className="space-y-1 mb-8">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-3">Menu</h3>
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

                    // Special highlighting logic for "Teams" (formerly Dashboard)
                    const isTeamsItem = item.label === 'Teams';
                    const isSubItem = (item as any).indent;
                    const isTeamToolsActive = menuItems.some(mi => (mi as any).indent && pathname.startsWith(mi.href));
                    const isOtherMainItemActive = menuItems.some(mi => !(mi as any).indent && mi.label !== 'Teams' && pathname.startsWith(mi.href));

                    let itemClasses = 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 dark:text-gray-400';
                    let iconClasses = 'text-gray-400 group-hover:text-[#008080]';

                    if (isActive) {
                        if (isTeamsItem) {
                            itemClasses = 'bg-[#008080] text-white shadow-lg shadow-teal-500/20';
                            iconClasses = 'text-white';
                        } else if (isSubItem) {
                            itemClasses = 'bg-[#008080]/10 text-[#008080] font-bold border border-[#008080]/20';
                            iconClasses = 'text-[#008080]';
                        } else {
                            // Other main items (Wallet, Storage, etc)
                            itemClasses = 'bg-[#008080] text-white shadow-lg shadow-teal-500/20';
                            iconClasses = 'text-white';
                        }
                    } else if (isTeamsItem && isTeamToolsActive && !isOtherMainItemActive) {
                        // Highlight Teams parent if a sub-item is active, BUT NOT if another main item is active
                        itemClasses = 'bg-[#008080] text-white shadow-lg shadow-teal-500/20';
                        iconClasses = 'text-white';
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${itemClasses} ${(item as any).indent ? 'ml-4 border-l-2 border-gray-100 dark:border-zinc-800 pl-4' : ''}`}
                        >
                            <item.icon size={20} className={iconClasses} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>

            {/* General */}
            <div className="space-y-1 mb-auto">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-3">General</h3>

                {/* ConnektStorage Card Removed from General - Moved to Main Menu */}

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
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#008080] to-teal-900 relative overflow-hidden text-white shadow-xl mt-4">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-[50px] opacity-20 translate-x-10 -translate-y-10" />
                <div className="relative z-10">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-3 backdrop-blur-md border border-white/10">
                        <Download size={18} className="text-white" />
                    </div>
                    <h4 className="font-bold text-base mb-1">Get Connect Pro</h4>
                    <p className="text-xs text-teal-100 mb-4 opacity-90">Unlock AI agents, unlimited jobs, and premium features.</p>
                    <button className="w-full py-2.5 bg-white text-[#008080] hover:bg-teal-50 rounded-xl text-xs font-bold transition-colors shadow-lg">
                        Upgrade Now
                    </button>
                </div>
            </div>
        </aside>
    );
}
