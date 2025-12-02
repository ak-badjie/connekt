'use client';

import { Search, ChevronDown, User } from 'lucide-react';
import { useState } from 'react';
import type { MailAddress } from '@/lib/types/mail.types';
import Image from 'next/image';
import ConnektMailIcon from '@/components/branding/ConnektMailIcon';

interface MailHeaderProps {
    mailAddresses: MailAddress[];
    selectedAddress?: MailAddress;
    onAddressChange: (address: MailAddress) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    userProfile: any;
}

export function MailHeader({
    mailAddresses,
    selectedAddress,
    onAddressChange,
    searchQuery,
    onSearchChange,
    userProfile
}: MailHeaderProps) {
    const [showAddressDropdown, setShowAddressDropdown] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    return (
        <div className="h-16 border-b border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl flex items-center justify-between px-6 relative z-[100]">
            {/* Left: Mail Address Selector */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <ConnektMailIcon className="w-10 h-10" />
                    <span className="text-xl font-bold font-headline text-[#008080]">ConnektMail</span>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowAddressDropdown(!showAddressDropdown)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 hover:border-[#008080] transition-colors"
                    >
                        <div className="flex flex-col items-start">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Sending from</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {selectedAddress?.address || 'Select address'}
                            </span>
                        </div>
                        <ChevronDown size={16} className="text-gray-500" />
                    </button>

                    {showAddressDropdown && (
                        <div className="absolute top-full mt-2 left-0 w-80 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 py-2 z-[200]">
                            <div className="px-3 py-2 border-b border-gray-200 dark:border-zinc-700">
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Your Mail Addresses</p>
                            </div>
                            {mailAddresses.map((address) => (
                                <button
                                    key={address.address}
                                    onClick={() => {
                                        onAddressChange(address);
                                        setShowAddressDropdown(false);
                                    }}
                                    className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors ${selectedAddress?.address === address.address ? 'bg-[#008080]/5' : ''
                                        }`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                        {address.type === 'personal' ? 'P' : 'A'}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {address.address}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {address.type === 'personal' ? 'Personal' : `${address.agencyName} Agency`}
                                        </p>
                                    </div>
                                    {selectedAddress?.address === address.address && (
                                        <div className="w-2 h-2 rounded-full bg-[#008080] mt-2"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Center: Search Bar */}
            <div className="flex-1 max-w-md mx-8">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search mails..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20 transition-all"
                    />
                </div>
            </div>

            {/* Right: Profile */}
            <div className="relative">
                <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                >
                    {userProfile?.photoURL ? (
                        <Image
                            src={userProfile.photoURL}
                            alt={userProfile.displayName || 'User'}
                            width={36}
                            height={36}
                            className="rounded-full"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white font-bold">
                            {userProfile?.displayName?.[0]?.toUpperCase() || 'U'}
                        </div>
                    )}
                    <div className="hidden md:block text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {userProfile?.displayName || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {selectedAddress?.address || ''}
                        </p>
                    </div>
                    <ChevronDown size={16} className="text-gray-500" />
                </button>

                {showProfileDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 py-2 z-[200]">
                        <a
                            href="/dashboard"
                            className="w-full px-4 py-2.5 flex items-center gap-3 text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors text-gray-700 dark:text-gray-300"
                        >
                            <User size={16} />
                            Back to Dashboard
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
