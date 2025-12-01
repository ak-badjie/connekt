'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthService } from '@/lib/services/auth-service';
import { Search, LogOut, Settings, LayoutDashboard, ChevronDown, User, Compass, Briefcase, Bot, Building2 } from 'lucide-react';
import { BriefcaseLogo3D } from '@/components/auth/BriefcaseLogo3D';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function MainNavbar() {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Don't show on dashboard, auth, or mail routes
    const hidePrefixes = ['/auth', '/admin/auth', '/onboarding', '/intro'];
    const shouldHide = hidePrefixes.some(route => pathname?.startsWith(route)) ||
        pathname?.includes('dashboard') ||
        pathname?.includes('mail');

    if (shouldHide) {
        return null;
    }

    const handleLogout = async () => {
        await AuthService.logout();
        router.push('/');
        setDropdownOpen(false);
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-40 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-zinc-800/50">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3">
                        <BriefcaseLogo3D size="medium" color="teal" />
                        <span className="text-xl font-bold font-headline text-[#008080] tracking-widest">CONNEKT</span>
                    </Link>

                    {/* Center - Conditional Content */}
                    <AnimatePresence mode="wait">
                        {pathname?.startsWith('/explore') ? (
                            /* Search Bar for Explore Page */
                            <motion.div
                                key="explore-search"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="hidden md:block flex-1 max-w-2xl mx-8"
                            >
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search for projects, tasks, people, agencies..."
                                        className="w-full pl-12 pr-4 py-2.5 rounded-full bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:border-[#008080] focus:ring-2 focus:ring-teal-500/20 outline-none transition-all text-sm"
                                    />
                                </div>
                            </motion.div>
                        ) : (
                            /* Navigation Links for Other Pages */
                            <motion.div
                                key="nav-links"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="hidden md:flex items-center gap-6"
                            >
                                <Link href="/explore" className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#008080] dark:hover:text-teal-400 transition-colors">
                                    <Compass size={16} />
                                    Explore
                                </Link>
                                <Link href="/marketplace" className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#008080] dark:hover:text-teal-400 transition-colors">
                                    <Briefcase size={16} />
                                    Jobs
                                </Link>
                                <Link href="/agency" className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#008080] dark:hover:text-teal-400 transition-colors">
                                    <Building2 size={16} />
                                    Agencies
                                </Link>
                                <Link href="/intro/ai" className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#008080] dark:hover:text-teal-400 transition-colors">
                                    <Bot size={16} />
                                    AI Agents
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Right - Actions */}
                    <div className="flex items-center gap-4">

                        {user ? (
                            /* User Dropdown */
                            <div className="relative">
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center gap-3 px-4 py-2 rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-teal-500/20">
                                        {user.email?.[0].toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white hidden sm:block">
                                        {user.displayName || user.email?.split('@')[0]}
                                    </span>
                                    <ChevronDown size={16} className={`text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-700 py-2 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-700">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.displayName || 'User'}</p>
                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                        </div>

                                        <button
                                            onClick={() => {
                                                router.push('/dashboard');
                                                setDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                                        >
                                            <LayoutDashboard size={16} className="text-[#008080]" />
                                            Dashboard
                                        </button>

                                        <button
                                            onClick={() => {
                                                router.push('/settings');
                                                setDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                                        >
                                            <Settings size={16} className="text-gray-500" />
                                            Settings
                                        </button>

                                        <div className="border-t border-gray-100 dark:border-zinc-700 my-2"></div>

                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        >
                                            <LogOut size={16} />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Auth Buttons */
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => router.push('/auth')}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-[#008080] transition-colors"
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => router.push('/auth')}
                                    className="px-5 py-2.5 bg-[#008080] hover:bg-teal-600 text-white rounded-full font-bold text-sm shadow-lg shadow-teal-500/20 transition-all"
                                >
                                    Get Started
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
