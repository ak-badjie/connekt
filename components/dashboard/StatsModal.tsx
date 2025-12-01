'use client';

import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface StatDetail {
    id: string;
    title: string;
    description?: string;
    status?: string;
    progress?: number;
    tags?: string[];
    date?: string;
    amount?: number;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    [key: string]: any;
}

interface StatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    items?: StatDetail[];
    data?: any[];
    type: 'projects' | 'tasks' | 'pots-pending' | 'pots-review' | 'pots';
    onItemClick?: (id: string) => void;
}

export default function StatsModal({ isOpen, onClose, title, items, data, type, onItemClick }: StatsModalProps) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    // Support both 'items' and 'data' props
    const modalItems = items || data || [];

    // Generate title if not provided
    const modalTitle = title || (
        type === 'projects' ? 'Projects' :
            type === 'tasks' ? 'Active Tasks' :
                type === 'pots-pending' || type === 'pots' ? 'POTs Pending Review' :
                    'POTs to Review'
    );

    // Set mounted state for portal rendering
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    const handleItemClick = (item: StatDetail) => {
        if (onItemClick) {
            onItemClick(item.id);
        } else {
            // Fallback to default routing
            if (type === 'projects') {
                router.push(`/dashboard/projects/${item.id}`);
            } else {
                router.push(`/dashboard/tasks/${item.id}`);
            }
            onClose();
        }
    };

    const renderItem = (item: StatDetail) => {
        switch (type) {
            case 'projects':
                return (
                    <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="p-5 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 hover:border-[#008080] dark:hover:border-[#008080] cursor-pointer transition-all hover:shadow-lg group"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-[#008080] transition-colors">
                                    {item.title}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                    {item.description}
                                </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === 'active' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' :
                                item.status === 'planning' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' :
                                    item.status === 'completed' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800' :
                                        'bg-amber-100 text-amber-600 dark:bg-amber-900/30'
                                }`}>
                                {item.status}
                            </span>
                        </div>

                        {item.progress !== undefined && (
                            <div className="mb-3">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-500">Progress</span>
                                    <span className="font-bold text-gray-700 dark:text-gray-300">{item.progress}%</span>
                                </div>
                                <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#008080] to-teal-500 transition-all"
                                        style={{ width: `${item.progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            {item.date && <span>📅 {item.date}</span>}
                            {item.amount && <span>💰 ${item.amount}</span>}
                            {item.tags && item.tags.length > 0 && (
                                <div className="flex gap-1">
                                    {item.tags.slice(0, 2).map((tag, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-700 rounded-md">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'tasks':
            case 'pots-pending':
                return (
                    <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="p-4 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 hover:border-[#008080] dark:hover:border-[#008080] cursor-pointer transition-all hover:shadow-md group"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-[#008080] transition-colors flex-1">
                                {item.title}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ml-2 ${item.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                                item.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                                    item.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                        'bg-green-100 text-green-600'
                                }`}>
                                {item.priority}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">
                            {item.description}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">
                                {type === 'pots-pending' ? '⏳ Awaiting approval' : `Due: ${item.date || 'No deadline'}`}
                            </span>
                            {item.tags && <span className="text-gray-400">{item.tags[0]}</span>}
                        </div>
                    </div>
                );

            case 'pots-review':
                return (
                    <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="p-4 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 hover:border-[#008080] dark:hover:border-[#008080] cursor-pointer transition-all hover:shadow-md group"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-[#008080] transition-colors">
                                    {item.title}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">
                                    Submitted by <span className="font-medium text-[#008080]">@{item.submittedBy}</span>
                                </p>
                            </div>
                            <span className="px-2 py-1 bg-amber-100 text-amber-600 dark:bg-amber-900/30 rounded-full text-xs font-bold">
                                Review
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">
                            {item.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>📸 {item.screenshotCount || 0} screenshots</span>
                            <span>🎥 {item.videoCount || 0} videos</span>
                            <span>🔗 {item.linkCount || 0} links</span>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200 pointer-events-auto">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-4xl max-h-[85vh] bg-gray-50 dark:bg-zinc-900 rounded-3xl shadow-2xl drop-shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 pointer-events-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{modalTitle}</h2>
                        <p className="text-sm text-gray-500 mt-0.5">{modalItems?.length || 0} items</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 flex items-center justify-center transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)] custom-scrollbar">
                    {modalItems.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center">
                                <span className="text-3xl">📭</span>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400">No items to display</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {modalItems.map(item => renderItem(item))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
