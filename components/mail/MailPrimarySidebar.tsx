'use client';

import { Inbox, Send, FileText, Trash2, Plus, Folder, ChevronDown, ChevronRight, HardDrive } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import type { MailCategory } from '@/lib/types/mail.types';

interface MailPrimarySidebarProps {
    activeFolder: 'inbox' | 'sent' | 'drafts' | 'trash';
    activeCategory?: MailCategory;
    unreadCounts?: {
        inbox: number;
        drafts: number;
    };
    categories?: MailCategory[];
    storageUsedGB?: number;
    storageTotalGB?: number;
    onFolderChange: (folder: 'inbox' | 'sent' | 'drafts' | 'trash') => void;
    onCategoryChange?: (category: MailCategory) => void;
    onCompose: () => void;
}

export function MailPrimarySidebar({
    activeFolder,
    activeCategory,
    unreadCounts = { inbox: 0, drafts: 0 },
    categories = ['Projects', 'Clients', 'Personal', 'Important'],
    storageUsedGB = 0.24,
    storageTotalGB = 1.0,
    onFolderChange,
    onCategoryChange,
    onCompose
}: MailPrimarySidebarProps) {
    const [categoriesExpanded, setCategoriesExpanded] = useState(true);

    const folders = [
        { id: 'inbox' as const, label: 'Inbox', icon: Inbox, badge: unreadCounts.inbox },
        { id: 'sent' as const, label: 'Sent', icon: Send },
        { id: 'drafts' as const, label: 'Drafts', icon: FileText, badge: unreadCounts.drafts },
        { id: 'trash' as const, label: 'Trash', icon: Trash2 }
    ];

    const storagePercentage = (storageUsedGB / storageTotalGB) * 100;

    return (
        <div className="w-64 h-full bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border-r border-gray-200/50 dark:border-zinc-800/50 flex flex-col relative">
            {/* Floating Compose Button */}
            <div className="p-4 sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
                <button
                    onClick={onCompose}
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-[#008080] to-teal-600 hover:from-teal-600 hover:to-[#008080] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 transition-all hover:scale-105"
                >
                    <Plus size={20} strokeWidth={2.5} />
                    Compose
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Folders */}
                <nav className="px-3 space-y-1 pb-4">
                    <p className="px-3 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Folders
                    </p>
                    {folders.map((folder) => {
                        const Icon = folder.icon;
                        const isActive = activeFolder === folder.id;

                        return (
                            <button
                                key={folder.id}
                                onClick={() => onFolderChange(folder.id)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${isActive
                                    ? 'bg-gradient-to-r from-[#008080]/10 to-teal-500/10 text-[#008080] border border-[#008080]/20 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-zinc-800/80'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon size={18} className={isActive ? 'text-[#008080]' : ''} />
                                    <span className="text-sm">{folder.label}</span>
                                </div>
                                {folder.badge && folder.badge > 0 && (
                                    <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                                        {folder.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Divider */}
                <div className="mx-6 my-4 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-zinc-700 to-transparent"></div>

                {/* Categories */}
                <div className="px-3 pb-4">
                    <button
                        onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-[#f97316] transition-colors"
                    >
                        <span>Categories</span>
                        {categoriesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>

                    <AnimatePresence>
                        {categoriesExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-1 overflow-hidden"
                            >
                                {categories.map((category) => {
                                    const isActive = activeCategory === category;

                                    return (
                                        <button
                                            key={category}
                                            onClick={() => onCategoryChange?.(category)}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                                ? 'bg-teal-500/10 text-teal-600 dark:text-teal-500 border border-teal-500/20'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-zinc-800/80'
                                                }`}
                                        >
                                            <Folder size={16} className={isActive ? 'text-teal-500' : 'text-gray-400'} />
                                            <span>{category}</span>
                                        </button>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ConnektStorage Link - Sticky at bottom */}
            <Link
                href="/dashboard/storage"
                className="p-4 border-t border-gray-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl hover:bg-gray-50 dark:hover:bg-zinc-800/80 transition-colors"
            >
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <HardDrive size={16} className="text-[#008080]" />
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">ConnektStorage</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Storage</span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">
                            {storageUsedGB.toFixed(2)}GB / {storageTotalGB.toFixed(1)}GB
                        </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${storagePercentage > 90
                                ? 'bg-gradient-to-r from-red-500 to-red-600'
                                : storagePercentage > 75
                                    ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                                    : 'bg-gradient-to-r from-[#008080] to-teal-500'
                                }`}
                            style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                        ></div>
                    </div>
                    <p className="text-[10px] text-gray-500 text-center">Click to manage storage</p>
                </div>
            </Link>
        </div>
    );
}
