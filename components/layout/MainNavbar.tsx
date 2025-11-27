'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthService } from '@/lib/services/auth-service';
import { Search, Moon, Sun, LogOut, Settings, LayoutDashboard, ChevronDown, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import Image from 'next/image';

export default function MainNavbar() {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();
    const { theme, setTheme } = useTheme();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Don't show on dashboard, auth, or mail routes
    const hideRoutes = ['/dashboard', '/auth', '/admin/auth', '/mail', '/projects'];
    if (hideRoutes.some(route => pathname?.startsWith(route))) {
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
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
                        <div className="w-10 h-10 bg-gradient-to-br from-[#008080] to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                            <div className="w-5 h-5 bg-white rounded-full"></div>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Connekt</h1>
                    </div>

                    {/* Center - Navigation Links */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="/#features" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#008080] dark:hover:text-teal-400 transition-colors">
                            Features
                        </a>
                        <a href="/#how-it-works" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#008080] dark:hover:text-teal-400 transition-colors">
                            How It Works
                        </a>
                        <a href="/#pricing" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#008080] dark:hover:text-teal-400 transition-colors">
                            Pricing
                        </a>
                        <a href="/#testimonials" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#008080] dark:hover:text-teal-400 transition-colors">
                            Testimonials
                        </a>
                    </div>

                    {/* Right - Actions */}
                    <div className="flex items-center gap-4">
                        {/* Theme Toggle */}
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-2.5 rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                            {theme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-gray-600" />}
                        </button>

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
