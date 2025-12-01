'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { X, Check, CheckCheck, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import NotificationModal from './NotificationModal';
import type { Notification } from '@/lib/types/notification.types';

interface NotificationDropdownProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
    const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const recentNotifications = notifications.slice(0, 10);
    const unreadNotifications = recentNotifications.filter(n => !n.read);

    const handleNotificationClick = async (notification: Notification) => {
        setSelectedNotification(notification);
        if (!notification.read) {
            await markAsRead(notification.id);
        }
    };

    const getPriorityColor = (priority: Notification['priority']) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800';
            case 'high':
                return 'bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
            case 'medium':
                return 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
            default:
                return 'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700';
        }
    };

    const getTypeIcon = (type: Notification['type']) => {
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
        return icons[type] || '📬';
    };

    return (
        <>
            <div
                ref={dropdownRef}
                className="absolute right-0 top-full mt-2 w-96 max-h-[600px] bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-700 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200 z-[102]"
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-zinc-700 flex items-center justify-between bg-gradient-to-r from-[#008080]/5 to-transparent">
                    <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-[#008080]" />
                        <h3 className="font-bold text-gray-900 dark:text-white">
                            Notifications
                        </h3>
                        {unreadNotifications.length > 0 && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                                {unreadNotifications.length}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {unreadNotifications.length > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                                title="Mark all as read"
                            >
                                <CheckCheck className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                    {recentNotifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <Bell className="w-12 h-12 mx-auto text-gray-300 dark:text-zinc-600 mb-3" />
                            <p className="text-gray-500 dark:text-gray-400 text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-zinc-700">
                            {recentNotifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 text-2xl">
                                            {getTypeIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h4 className={`text-sm font-semibold ${!notification.read
                                                    ? 'text-gray-900 dark:text-white'
                                                    : 'text-gray-700 dark:text-gray-300'
                                                    }`}>
                                                    {notification.title}
                                                </h4>
                                                {!notification.read && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500 dark:text-gray-500">
                                                    {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(notification.priority)
                                                    }`}>
                                                    {notification.priority}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {recentNotifications.length > 0 && (
                    <div className="p-3 border-t border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50">
                        <button
                            onClick={() => {
                                onClose();
                                // Navigate to notifications page
                                window.location.href = '/dashboard/notifications';
                            }}
                            className="w-full py-2 text-sm font-medium text-[#008080] hover:text-teal-600 transition-colors"
                        >
                            View All Notifications
                        </button>
                    </div>
                )}
            </div>

            {/* Notification Modal */}
            {selectedNotification && (
                <NotificationModal
                    notification={selectedNotification}
                    isOpen={!!selectedNotification}
                    onClose={() => setSelectedNotification(null)}
                />
            )}
        </>
    );
}
