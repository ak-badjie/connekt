'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, CheckSquare, Calendar, BarChart2, Users, Settings, HelpCircle, LogOut, Download } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

const menuItems = [
    { icon: LayoutGrid, label: 'Dashboard', href: '/dashboard' },
    { icon: CheckSquare, label: 'Tasks', href: '/projects', badge: '12+' },
    { icon: Calendar, label: 'Calendar', href: '/calendar' },
    { icon: BarChart2, label: 'Analytics', href: '/analytics' },
    { icon: Users, label: 'Team', href: '/agency' },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuth();

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border-r border-white/20 dark:border-white/5 flex flex-col p-6 z-[110] hidden lg:flex transition-all duration-300 overflow-y-auto">
            {/* Menu */}
            <div className="space-y-1 mb-8">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-3">Menu</h3>
                {menuItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-200 group ${isActive
                                ? 'bg-[#008080] text-white shadow-lg shadow-teal-500/20'
                                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 dark:text-gray-400'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon size={20} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#008080]'} />
                                <span className="font-medium">{item.label}</span>
                            </div>
                            {item.badge && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-gray-900 text-white'
                                    }`}>
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* General */}
            <div className="space-y-1 mb-auto">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-3">General</h3>
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
            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-gray-900 to-black relative overflow-hidden text-white shadow-xl">
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
