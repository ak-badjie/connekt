'use client';

import { Search, Mail, Bell, Sun, Moon, User as UserIcon, LogIn, Briefcase } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { BriefcaseLogo3D } from '@/components/auth/BriefcaseLogo3D';

export function Navbar() {
    const { user, userProfile } = useAuth();
    const { theme, setTheme } = useTheme();
    const pathname = usePathname();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Determine if we are on a "Private" page (Dashboard, etc) where Sidebar exists
    const isPrivatePage = ['/dashboard', '/projects', '/agency', '/mail', '/contracts'].some(path => pathname.startsWith(path));

    // Calculate dynamic padding: If private page, push navbar right to sit next to sidebar
    const layoutClass = isPrivatePage
        ? "px-6" // Private: Just padding, positioning handled by nav wrapper
        : "px-6 max-w-7xl mx-auto"; // Public: Centered

    return (
        <nav className={`fixed top-0 z-[100] transition-all duration-300 py-2 ${isPrivatePage
            ? 'left-0 lg:left-64 w-full lg:w-[calc(100%-16rem)] bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800'
            : 'left-0 w-full bg-white dark:bg-black border-b border-gray-200 dark:border-zinc-800'
            }`}>
            <div className={`${layoutClass} flex items-center justify-between relative z-[101]`}>

                {/* Left Side: Search (Private) or Logo (Public) */}
                <div className="flex items-center gap-8">
                    {!isPrivatePage && (
                        <Link href="/" className="flex items-center gap-2 text-[#008080]">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white font-bold">C</div>
                            <span className="text-xl font-bold font-headline text-gray-900 dark:text-white">Connekt</span>
                        </Link>
                    )}

                    {/* Private Dashboard Logo */}
                    {isPrivatePage && (
                        <div className="flex items-center gap-3 mr-2">
                            <BriefcaseLogo3D size="medium" color="teal" />
                            <span className="text-2xl font-bold font-headline text-[#008080] tracking-widest hidden xl:block">CONNEKT</span>
                        </div>
                    )}

                    {/* Search Bar - Only on Private, or Explore */}
                    {(isPrivatePage || pathname === '/explore') && (
                        <div className="relative group flex-1 max-w-2xl">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#008080] transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search tasks, jobs..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all shadow-sm"
                            />
                        </div>
                    )}

                    {/* Public Nav Links */}
                    {!isPrivatePage && (
                        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
                            <Link href="/explore" className="hover:text-[#008080] transition-colors">Explore</Link>
                            <Link href="/marketplace" className="hover:text-[#008080] transition-colors">Jobs</Link>
                            <Link href="/intro/ai" className="hover:text-[#008080] transition-colors">AI Agents</Link>
                        </div>
                    )}
                </div>

                {/* Right Side: Actions */}
                <div className="flex items-center gap-4 relative z-[101]">
                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center text-gray-500 hover:text-[#008080] transition-colors shadow-sm border border-gray-100 dark:border-zinc-700 relative z-[101]"
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    {user ? (
                        <>
                            {/* Notifications & Mail (Private Only) */}
                            {isPrivatePage && (
                                <>
                                    <button className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center text-gray-500 hover:text-[#008080] transition-colors shadow-sm border border-gray-100 dark:border-zinc-700 relative z-[101]">
                                        <Mail size={18} />
                                    </button>
                                    <button className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center text-gray-500 hover:text-[#008080] transition-colors shadow-sm border border-gray-100 dark:border-zinc-700 relative z-[101]">
                                        <Bell size={18} />
                                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-800"></span>
                                    </button>
                                </>
                            )}

                            {/* User Profile Dropdown */}
                            <div className="relative ml-2 z-[101]">
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 hover:shadow-md transition-all"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#008080] to-teal-500 p-[2px]">
                                        <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                                            {user.photoURL ? (
                                                <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-bold text-xs text-[#008080]">{user.email?.[0]?.toUpperCase() || 'U'}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="hidden md:block text-left">
                                        <p className="text-xs font-bold text-gray-900 dark:text-white leading-none mb-0.5">{userProfile?.displayName || 'User'}</p>
                                        <p className="text-[10px] text-gray-500 leading-none">@{userProfile?.username || 'username'}</p>
                                    </div>
                                </button>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-700 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[102]">
                                        {/* User Info Section */}
                                        <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-700">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{userProfile?.displayName || user?.displayName || 'User'}</p>
                                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                        </div>

                                        {/* Menu Items */}
                                        <Link
                                            href="/dashboard"
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            Dashboard
                                        </Link>
                                        <Link
                                            href={`/u/${userProfile?.username}`}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            Profile
                                        </Link>

                                        <div className="border-t border-gray-100 dark:border-zinc-700 my-2"></div>

                                        <button
                                            onClick={() => { signOut(auth); setIsDropdownOpen(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <Link
                            href="/auth"
                            className="px-5 py-2.5 bg-[#008080] hover:bg-teal-600 text-white rounded-full text-sm font-bold shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2"
                        >
                            <LogIn size={16} /> Sign In
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
