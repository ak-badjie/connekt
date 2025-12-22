'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { NotificationService } from '@/lib/services/notification-service';
import type { Notification } from '@/lib/types/notification.types';
import toast from 'react-hot-toast';
import { NotificationDynamicIsland } from '@/components/ui/NotificationDynamicIsland';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    markAsRead: (notificationId: string) => Promise<void>;
    markAsUnread: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (notificationId: string) => Promise<void>;
    refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);
    const [hasShownInitialNotification, setHasShownInitialNotification] = useState(false);
    const [dynamicIslandNotification, setDynamicIslandNotification] = useState<Notification | null>(null);

    const dismissDynamicIsland = useCallback(() => {
        setDynamicIslandNotification(null);
    }, []);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            setHasShownInitialNotification(false);
            return;
        }

        setLoading(true);

        // Set up real-time listener
        const unsubscribe = NotificationService.listenToNotifications(
            user.uid,
            (newNotifications) => {
                setNotifications(newNotifications);
                const unread = newNotifications.filter(n => !n.read).length;
                setUnreadCount(unread);
                setLoading(false);

                // Show toast for notifications
                if (newNotifications.length > 0) {
                    const latestNotification = newNotifications[0];

                    // On first load: show the most recent unread notification immediately
                    if (!hasShownInitialNotification && !latestNotification.read) {
                        showNotificationToast(latestNotification);
                        setDynamicIslandNotification(latestNotification);
                        setLastNotificationTime(latestNotification.createdAt);
                        setHasShownInitialNotification(true);
                    }
                    // For subsequent updates: only show toast if it's a new notification
                    else if (hasShownInitialNotification && latestNotification.createdAt > lastNotificationTime) {
                        showNotificationToast(latestNotification);
                        setDynamicIslandNotification(latestNotification);
                        setLastNotificationTime(latestNotification.createdAt);
                    }
                } else {
                    setHasShownInitialNotification(true);
                }
            },
            50 // Limit to 50 most recent notifications
        );

        return () => {
            unsubscribe();
        };
    }, [user]);

    const showNotificationToast = (notification: Notification) => {
        const priorityConfig = {
            urgent: { icon: '🚨', duration: 8000 },
            high: { icon: '⚠️', duration: 6000 },
            medium: { icon: 'ℹ️', duration: 5000 },
            low: { icon: '📢', duration: 4000 }
        };

        const config = priorityConfig[notification.priority];

        toast.custom(
            (t) => (
                <div
                    className={`${t.visible ? 'animate-enter' : 'animate-leave'
                        } max-w-md w-full bg-white dark:bg-zinc-800 shadow-lg rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-gray-100 dark:border-zinc-700`}
                >
                    <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                                <span className="text-2xl">{config.icon}</span>
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {notification.title}
                                </p>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {notification.message}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex border-l border-gray-200 dark:border-zinc-700">
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-medium text-[#008080] hover:text-teal-600 focus:outline-none"
                        >
                            Close
                        </button>
                    </div>
                </div>
            ),
            {
                duration: config.duration,
                position: 'bottom-right'
            }
        );
    };

    const markAsRead = async (notificationId: string) => {
        if (!user) return;

        try {
            await NotificationService.markAsRead(user.uid, notificationId);
            // The real-time listener will update the state automatically
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAsUnread = async (notificationId: string) => {
        if (!user) return;

        try {
            await NotificationService.markAsUnread(user.uid, notificationId);
            // The real-time listener will update the state automatically
        } catch (error) {
            console.error('Error marking notification as unread:', error);
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;

        try {
            await NotificationService.markAllAsRead(user.uid);
            // The real-time listener will update the state automatically
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const deleteNotification = async (notificationId: string) => {
        if (!user) return;

        try {
            await NotificationService.deleteNotification(user.uid, notificationId);
            // The real-time listener will update the state automatically
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const refreshNotifications = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const freshNotifications = await NotificationService.getNotifications(user.uid, 50);
            setNotifications(freshNotifications);
            const unread = freshNotifications.filter(n => !n.read).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error('Error refreshing notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                loading,
                markAsRead,
                markAsUnread,
                markAllAsRead,
                deleteNotification,
                refreshNotifications
            }}
        >
            {children}
            <NotificationDynamicIsland
                notification={dynamicIslandNotification}
                onDismiss={dismissDynamicIsland}
                autoDismissMs={5000}
            />
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
