'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Mail, Bell, Command, ChevronDown, LogOut, LayoutDashboard, Settings, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

const TopNavBar = () => {
    const { user, userProfile } = useAuth();
    const { theme, setTheme } = useTheme();
    const pathname = usePathname();
    const router = useRouter();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Hide navbar on specific routes: dashboard (/), auth routes, and mail routes
    const hiddenRoutes = ['/', '/auth', '/mail', '/admin/auth', '/admin/mail'];
    const shouldHideNavbar = hiddenRoutes.some(route => {
        if (route === '/') return pathname === '/';
        return pathname.startsWith(route);
    });

    if (shouldHideNavbar) return null;

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setIsDropdownOpen(false);
            router.push('/auth');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <div className="fixed top-0 left-0 w-full z-50 px-4 py-3 bg-gradient-to-b from-gray-50/80 to-transparent dark:from-zinc-900/80 backdrop-blur-sm">
            {/* Navbar Container */}
            <div className="flex items-center justify-between w-full px-6 py-3 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-xl border border-white/20 dark:border-zinc-700/50 shadow-lg shadow-gray-200/50 dark:shadow-black/20 rounded-3xl transition-all duration-300">

                {/* Logo - Left Side */}
                <Link href="/dashboard" className="flex items-center gap-2.5 mr-4 shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white font-bold shadow-lg shadow-teal-500/30">
                        C
                    </div>
                    <span className="text-xl font-bold font-headline text-gray-900 dark:text-white hidden lg:block">
                        Connekt
                    </span>
                </Link>

                {/* Search Bar */}
                <div className="relative flex items-center flex-1 max-w-xl">
                    <Search className="absolute left-4 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search tasks, projects, messages..."
                        className="w-full py-3 pl-12 pr-20 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-zinc-800 rounded-full focus:outline-none focus:ring-2 focus:ring-[#008080]/30 dark:focus:ring-[#008080]/50 shadow-sm border border-gray-100 dark:border-zinc-700 transition-all"
                    />
                    <div className="absolute right-3 flex items-center justify-center gap-0.5 px-2 py-1 bg-gray-100 dark:bg-zinc-700 rounded-lg text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-zinc-600">
                        <Command className="w-3 h-3" />
                        <span className="text-xs font-semibold">F</span>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3 ml-6">
                    {/* Mail Icon */}
                    <Link href="/mail">
                        <button className="p-3 bg-white dark:bg-zinc-800 rounded-full shadow-sm hover:shadow-md hover:scale-105 text-gray-600 dark:text-gray-300 hover:text-[#008080] dark:hover:text-[#008080] transition-all duration-200 border border-gray-100 dark:border-zinc-700">
                            <Mail className="w-5 h-5" />
                        </button>
                    </Link>

                    {/* Notifications Icon */}
                    <button className="relative p-3 bg-white dark:bg-zinc-800 rounded-full shadow-sm hover:shadow-md hover:scale-105 text-gray-600 dark:text-gray-300 hover:text-[#008080] dark:hover:text-[#008080] transition-all duration-200 border border-gray-100 dark:border-zinc-700">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-800 animate-pulse"></span>
                    </button>

                    {/* Session Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-3 pl-2 pr-4 py-2 bg-white dark:bg-zinc-800 rounded-full shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-zinc-700 hover:border-[#008080]/30 dark:hover:border-[#008080]/50 group"
                        >
                            {/* Profile Image */}
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#008080] to-teal-500 p-[2px]">
                                    <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                                        {user?.photoURL ? (
                                            <img
                                                src={user.photoURL}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="font-bold text-sm text-[#008080]">
                                                {userProfile?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="hidden md:block text-left">
                                <h4 className="text-sm font-bold text-gray-800 dark:text-white leading-tight">
                                    {userProfile?.displayName || 'User'}
                                </h4>
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                    {user?.email || 'user@example.com'}
                                </p>
                            </div>

                            {/* Dropdown Arrow */}
                            <ChevronDown
                                className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 top-full mt-3 w-56 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-700 py-2 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
                                {/* Dashboard */}
                                <Link href="/dashboard">
                                    <button
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        <LayoutDashboard className="w-4 h-4 text-[#008080]" />
                                        <span className="font-medium">Dashboard</span>
                                    </button>
                                </Link>

                                {/* Settings */}
                                <Link href="/settings">
                                    <button
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        <Settings className="w-4 h-4 text-[#008080]" />
                                        <span className="font-medium">Settings</span>
                                    </button>
                                </Link>

                                {/* Theme Toggle */}
                                <button
                                    onClick={() => {
                                        toggleTheme();
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors"
                                >
                                    {theme === 'dark' ? (
                                        <>
                                            <Sun className="w-4 h-4 text-[#008080]" />
                                            <span className="font-medium">Light Mode</span>
                                        </>
                                    ) : (
                                        <>
                                            <Moon className="w-4 h-4 text-[#008080]" />
                                            <span className="font-medium">Dark Mode</span>
                                        </>
                                    )}
                                </button>

                                {/* Divider */}
                                <div className="h-px bg-gray-100 dark:bg-zinc-700 my-2" />

                                {/* Logout */}
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopNavBar;
