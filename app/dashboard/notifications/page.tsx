'use client';

import React, { useState } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { Bell, CheckCheck, Trash2, Filter, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import NotificationModal from '@/components/layout/NotificationModal';
import type { Notification, NotificationType, NotificationPriority } from '@/lib/types/notification.types';

export default function NotificationsPage() {
    const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
    const [filterPriority, setFilterPriority] = useState<NotificationPriority | 'all'>('all');
    const [filterRead, setFilterRead] = useState<'all' | 'read' | 'unread'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const getTypeIcon = (type: NotificationType) => {
        const icons: Record<NotificationType, string> = {
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
        return icons[type];
    };

    const getPriorityColor = (priority: NotificationPriority) => {
        const colors: Record<NotificationPriority, string> = {
            urgent: 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
            high: 'bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400',
            medium: 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
            low: 'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-400'
        };
        return colors[priority];
    };

    // Filter notifications
    const filteredNotifications = notifications.filter(notification => {
        if (filterType !== 'all' && notification.type !== filterType) return false;
        if (filterPriority !== 'all' && notification.priority !== filterPriority) return false;
        if (filterRead === 'read' && !notification.read) return false;
        if (filterRead === 'unread' && notification.read) return false;
        if (searchQuery && !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !notification.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const handleNotificationClick = async (notification: Notification) => {
        setSelectedNotification(notification);
        if (!notification.read) {
            await markAsRead(notification.id);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-zinc-900 dark:via-black dark:to-zinc-900 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-[#008080] to-teal-600 rounded-2xl shadow-lg">
                                <Bell className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    Notifications
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                                </p>
                            </div>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="flex items-center gap-2 px-4 py-2 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-teal-500/20"
                            >
                                <CheckCheck className="w-4 h-4" />
                                Mark All as Read
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="glass-card p-6 rounded-2xl mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <h2 className="font-semibold text-gray-900 dark:text-white">Filters</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080] text-gray-900 dark:text-white"
                            />
                        </div>

                        {/* Type Filter */}
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as NotificationType | 'all')}
                            className="px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080] text-gray-900 dark:text-white"
                        >
                            <option value="all">All Types</option>
                            <option value="mail">Mail</option>
                            <option value="transaction">Transaction</option>
                            <option value="storage">Storage</option>
                            <option value="project">Project</option>
                            <option value="task">Task</option>
                            <option value="pot">POT</option>
                            <option value="workspace">Workspace</option>
                            <option value="agency">Agency</option>
                            <option value="job_update">Job Update</option>
                            <option value="system">System</option>
                        </select>

                        {/* Priority Filter */}
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value as NotificationPriority | 'all')}
                            className="px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080] text-gray-900 dark:text-white"
                        >
                            <option value="all">All Priorities</option>
                            <option value="urgent">Urgent</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>

                        {/* Read Status Filter */}
                        <select
                            value={filterRead}
                            onChange={(e) => setFilterRead(e.target.value as 'all' | 'read' | 'unread')}
                            className="px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080] text-gray-900 dark:text-white"
                        >
                            <option value="all">All Status</option>
                            <option value="unread">Unread</option>
                            <option value="read">Read</option>
                        </select>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="space-y-3">
                    {filteredNotifications.length === 0 ? (
                        <div className="glass-card p-12 rounded-2xl text-center">
                            <Bell className="w-16 h-16 mx-auto text-gray-300 dark:text-zinc-600 mb-4" />
                            <p className="text-lg text-gray-500 dark:text-gray-400">
                                {searchQuery || filterType !== 'all' || filterPriority !== 'all' || filterRead !== 'all'
                                    ? 'No notifications match your filters'
                                    : 'No notifications yet'}
                            </p>
                        </div>
                    ) : (
                        filteredNotifications.map((notification) => (
                            <button
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`w-full glass-card p-5 rounded-2xl text-left hover:shadow-lg transition-all ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10 ring-2 ring-blue-200 dark:ring-blue-800' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className="text-3xl flex-shrink-0">
                                        {getTypeIcon(notification.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <h3 className={`text-lg font-semibold ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                                                }`}>
                                                {notification.title}
                                            </h3>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {!notification.read && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                                )}
                                                <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getPriorityColor(notification.priority)}`}>
                                                    {notification.priority}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500 dark:text-gray-500">
                                                {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-500 capitalize">
                                                {notification.type.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteNotification(notification.id);
                                        }}
                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                                        title="Delete notification"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </button>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Notification Modal */}
            {selectedNotification && (
                <NotificationModal
                    notification={selectedNotification}
                    isOpen={!!selectedNotification}
                    onClose={() => setSelectedNotification(null)}
                />
            )}
        </div>
    );
}
