'use client';

import { Search, Mail, Bell, Sun, Moon, User as UserIcon, LogIn, Briefcase } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { BriefcaseLogo3D } from '@/components/auth/BriefcaseLogo3D';
import { AgencyService, Agency } from '@/lib/services/agency-service';
import { MailService } from '@/lib/services/mail-service';
import { useRef } from 'react';
import NotificationIcon from './NotificationIcon';

export function Navbar() {
    const { user, userProfile } = useAuth();
    const { theme, setTheme } = useTheme();
    const pathname = usePathname();
    const [unreadMailCount, setUnreadMailCount] = useState(0);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [agency, setAgency] = useState<Agency | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Fetch unread mail count
    useEffect(() => {
        if (user) {
            const fetchMailCount = async () => {
                try {
                    const stats = await MailService.getMailStats(user.uid);
                    setUnreadMailCount(stats.unreadInbox);
                } catch (error) {
                    console.error('Error fetching mail stats:', error);
                }
            };
            fetchMailCount();
            // Refresh every 30 seconds
            const interval = setInterval(fetchMailCount, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    // Handle Ctrl+F / Cmd+F
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Check if on agency route
    const isAgencyRoute = pathname.startsWith('/agency/');
    const agencyUsername = isAgencyRoute ? pathname.split('/')[2] : null;

    useEffect(() => {
        if (isAgencyRoute && agencyUsername) {
            const fetchAgency = async () => {
                try {
                    const agencyData = await AgencyService.getAgencyByUsername(agencyUsername);
                    setAgency(agencyData);
                } catch (error) {
                    console.error('Error fetching agency:', error);
                }
            };
            fetchAgency();
        } else {
            setAgency(null);
        }
    }, [isAgencyRoute, agencyUsername]);

    // Determine if we are on a "Private" page (Dashboard, etc) where Sidebar exists
    const isPrivatePage = ['/dashboard', '/projects', '/agency', '/mail', '/contracts'].some(path => pathname.startsWith(path));

    // Calculate dynamic padding
    const layoutClass = "";

    return (
        <nav className={`fixed top-4 z-[100] transition-all duration-300 ${isPrivatePage
            ? 'left-4 lg:left-72 right-4 lg:right-6'
            : 'left-6 right-6 max-w-7xl mx-auto'
            }`}>
            <div className={`${layoutClass} flex items-center justify-between relative z-[101] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-2xl shadow-xl px-6 py-3`}>

                {/* Left Side: Search (Private) or Logo (Public) */}
                <div className="flex items-center gap-8 flex-1">
                    {!isPrivatePage && (
                        <Link href="/" className="flex items-center gap-3">
                            <BriefcaseLogo3D size="medium" color="teal" />
                            <span className="text-xl font-bold font-headline text-[#008080] tracking-widest">CONNEKT</span>
                        </Link>
                    )}

                    {/* Private Dashboard Logo + Agency Info */}
                    {isPrivatePage && (
                        <div className="flex items-center gap-3 mr-2">
                            {/* Agency Branding (if on agency route) */}
                            {isAgencyRoute && agency && (
                                <div className="flex items-center gap-3">
                                    {agency.logoUrl ? (
                                        <img
                                            src={agency.logoUrl}
                                            alt={agency.name}
                                            className="w-8 h-8 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                                            {agency.name[0].toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white leading-none">
                                            {agency.name}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 leading-none mt-0.5">
                                            @{agency.username}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Search Bar - Only on Private, or Explore */}
                    {(isPrivatePage || pathname === '/explore') && (
                        <div className="relative group flex-1 max-w-md mx-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#008080] transition-colors" size={18} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search task"
                                className="w-full pl-10 pr-16 py-2 bg-white/50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                                <kbd className="px-2 py-0.5 text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-zinc-700 rounded border border-gray-200 dark:border-zinc-600">
                                    {typeof window !== 'undefined' && window.navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                                </kbd>
                                <kbd className="px-2 py-0.5 text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-zinc-700 rounded border border-gray-200 dark:border-zinc-600">F</kbd>
                            </div>
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
                    {/* Theme Toggle Removed as per request */}

                    {user ? (
                        <>
                            {/* Notifications & Mail (Private Only) */}
                            {isPrivatePage && (
                                <>
                                    <Link href="/mail">
                                        <button className="relative w-10 h-10 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center text-gray-500 hover:text-[#008080] transition-colors shadow-sm border border-gray-100 dark:border-zinc-700 z-[101]">
                                            <Mail size={18} />
                                            {unreadMailCount > 0 && (
                                                <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#008080] rounded-full border-2 border-white dark:border-zinc-800 animate-pulse"></span>
                                            )}
                                        </button>
                                    </Link>
                                    <NotificationIcon />
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
                                        <p className="text-[10px] text-gray-500 leading-none">{userProfile?.username ? `${userProfile.username}@connekt.com` : 'user@connekt.com'}</p>
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
                                            href={`/@${userProfile?.username}`}
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
