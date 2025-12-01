'use client';

import React from 'react';
import { X, ExternalLink, Trash2, CheckCircle } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import type { Notification } from '@/lib/types/notification.types';

interface NotificationModalProps {
    notification: Notification;
    isOpen: boolean;
    onClose: () => void;
}

export default function NotificationModal({ notification, isOpen, onClose }: NotificationModalProps) {
    const { markAsRead, markAsUnread, deleteNotification } = useNotifications();
    const router = useRouter();

    if (!isOpen) return null;

    const handleAction = () => {
        if (notification.actionUrl) {
            router.push(notification.actionUrl);
            onClose();
        }
    };

    const handleDelete = async () => {
        await deleteNotification(notification.id);
        onClose();
    };

    const toggleRead = async () => {
        if (notification.read) {
            await markAsUnread(notification.id);
        } else {
            await markAsRead(notification.id);
        }
    };

    const getPriorityStyle = () => {
        switch (notification.priority) {
            case 'urgent':
                return 'bg-red-500';
            case 'high':
                return 'bg-orange-500';
            case 'medium':
                return 'bg-blue-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getTypeIcon = () => {
        const icons = {
            mail: '✉️',
            transaction: '💰',
            storage: '💾',
            subscription: '⭐',
            project: '📁',
            task: '✅',
            workspace: '👥',
            agency: '🏢',
            pot: '📋',
            job_update: '💼',
            system: '📢'
        };
        return icons[notification.type] || '📬';
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-700 animate-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-zinc-700">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                            <span className="text-3xl">{getTypeIcon()}</span>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                    {notification.title}
                                </h2>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 text-xs font-semibold text-white rounded-full ${getPriorityStyle()}`}>
                                        {notification.priority}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                        {notification.message}
                    </p>

                    {/* Metadata */}
                    {notification.metadata && (
                        <div className="p-4 bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-gray-100 dark:border-zinc-700">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Details</h3>
                            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                {Object.entries(notification.metadata).map(([key, value]) => {
                                    if (key === 'type') return null;
                                    return (
                                        <div key={key} className="flex justify-between">
                                            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                                            <span className="text-right">{String(value)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-gray-100 dark:border-zinc-700 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleRead}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                            title={notification.read ? 'Mark as unread' : 'Mark as read'}
                        >
                            <CheckCircle
                                className={`w-5 h-5 ${notification.read
                                    ? 'text-green-500'
                                    : 'text-gray-400 dark:text-gray-600'
                                    }`}
                            />
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete notification"
                        >
                            <Trash2 className="w-5 h-5 text-red-500" />
                        </button>
                    </div>

                    {notification.actionUrl && (
                        <button
                            onClick={handleAction}
                            className="px-5 py-2.5 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-teal-500/20"
                        >
                            {notification.actionLabel || 'View'}
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
