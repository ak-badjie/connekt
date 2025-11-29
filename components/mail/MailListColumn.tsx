'use client';

import { Search, Filter, Clock, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import type { MailMessage } from '@/lib/services/mail-service';

interface MailListColumnProps {
    mails: MailMessage[];
    selectedMail: MailMessage | null;
    onMailSelect: (mail: MailMessage) => void;
    loading?: boolean;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
}

export function MailListColumn({
    mails,
    selectedMail,
    onMailSelect,
    loading = false,
    searchQuery = '',
    onSearchChange
}: MailListColumnProps) {
    const [sortBy, setSortBy] = useState<'date' | 'sender'>('date');

    const formatTime = (timestamp: any) => {
        if (!timestamp) return 'Just now';
        const date = timestamp.toDate();
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}min ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="w-96 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 flex flex-col h-full">
            {/* Search & Filters */}
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800 space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                        placeholder="Search mails..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
                    />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSortBy('date')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sortBy === 'date'
                                ? 'bg-[#008080] text-white'
                                : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400'
                            }`}
                    >
                        <Clock size={12} className="inline mr-1" />
                        Date
                    </button>
                    <button
                        onClick={() => setSortBy('sender')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sortBy === 'sender'
                                ? 'bg-[#008080] text-white'
                                : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400'
                            }`}
                    >
                        <UserIcon size={12} className="inline mr-1" />
                        Sender
                    </button>
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400">
                        <Filter size={12} className="inline mr-1" />
                        Filter
                    </button>
                </div>
            </div>

            {/* Mail List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008080]"></div>
                    </div>
                ) : mails.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">
                        <p>No mails found</p>
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        {mails.map((mail) => (
                            <button
                                key={mail.id}
                                onClick={() => onMailSelect(mail)}
                                className={`w-full p-4 rounded-xl cursor-pointer transition-all text-left ${selectedMail?.id === mail.id
                                        ? 'bg-[#008080]/5 border border-[#008080] shadow-sm'
                                        : 'border border-transparent hover:bg-gray-50 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                {/* Sender & Time */}
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white font-bold text-xs">
                                            {mail.senderName[0]?.toUpperCase()}
                                        </div>
                                        <h4 className={`text-sm ${!mail.isRead
                                                ? 'font-bold text-gray-900 dark:text-white'
                                                : 'font-medium text-gray-700 dark:text-gray-300'
                                            }`}>
                                            {mail.type === 'received' ? mail.senderName : `To: @${mail.recipientUsername}`}
                                        </h4>
                                    </div>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                        {formatTime(mail.createdAt)}
                                    </span>
                                </div>

                                {/* Subject */}
                                <h5 className={`text-xs mb-1 ${!mail.isRead
                                        ? 'font-bold text-gray-900 dark:text-white'
                                        : 'text-gray-500'
                                    }`}>
                                    {mail.subject}
                                </h5>

                                {/* Preview */}
                                <p className="text-[10px] text-gray-400 line-clamp-2">
                                    {mail.body.replace(/[#*`]/g, '').substring(0, 80)}...
                                </p>

                                {/* Unread Indicator */}
                                {!mail.isRead && (
                                    <div className="mt-2 flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-[#008080]"></div>
                                        <span className="text-[10px] text-[#008080] font-medium">Unread</span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
