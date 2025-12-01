import { realtimeDb } from '@/lib/firebase';
import {
    ref,
    push,
    set,
    get,
    update,
    remove,
    query,
    orderByChild,
    limitToLast,
    onValue,
    off,
    serverTimestamp,
    DataSnapshot
} from 'firebase/database';
import type {
    Notification,
    NotificationType,
    NotificationPriority,
    NotificationMetadata,
    NotificationFilter,
    NotificationStats
} from '@/lib/types/notification.types';

export const NotificationService = {
    /**
     * Create a new notification
     */
    async createNotification(
        userId: string,
        type: NotificationType,
        title: string,
        message: string,
        priority: NotificationPriority,
        metadata: NotificationMetadata,
        actionUrl?: string,
        actionLabel?: string
    ): Promise<string> {
        try {
            const notificationsRef = ref(realtimeDb, `notifications/${userId}`);
            const newNotificationRef = push(notificationsRef);

            const notification: Omit<Notification, 'id'> = {
                userId,
                type,
                title,
                message,
                priority,
                read: false,
                createdAt: Date.now(),
                actionUrl,
                actionLabel,
                metadata
            };

            await set(newNotificationRef, notification);
            return newNotificationRef.key!;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    },

    /**
     * Get all notifications for a user
     */
    async getNotifications(
        userId: string,
        limit: number = 50
    ): Promise<Notification[]> {
        try {
            const notificationsRef = ref(realtimeDb, `notifications/${userId}`);
            const notificationsQuery = query(
                notificationsRef,
                orderByChild('createdAt'),
                limitToLast(limit)
            );

            const snapshot = await get(notificationsQuery);

            if (!snapshot.exists()) {
                return [];
            }

            const notifications: Notification[] = [];
            snapshot.forEach((childSnapshot) => {
                notifications.push({
                    id: childSnapshot.key!,
                    ...childSnapshot.val()
                } as Notification);
            });

            // Sort by createdAt descending (newest first)
            return notifications.sort((a, b) => b.createdAt - a.createdAt);
        } catch (error) {
            console.error('Error getting notifications:', error);
            return [];
        }
    },

    /**
     * Get filtered notifications
     */
    async getFilteredNotifications(
        userId: string,
        filter: NotificationFilter,
        limit: number = 50
    ): Promise<Notification[]> {
        const allNotifications = await this.getNotifications(userId, limit);

        return allNotifications.filter(notification => {
            if (filter.type && notification.type !== filter.type) return false;
            if (filter.read !== undefined && notification.read !== filter.read) return false;
            if (filter.priority && notification.priority !== filter.priority) return false;
            if (filter.startDate && notification.createdAt < filter.startDate) return false;
            if (filter.endDate && notification.createdAt > filter.endDate) return false;
            return true;
        });
    },

    /**
     * Get a single notification by ID
     */
    async getNotification(userId: string, notificationId: string): Promise<Notification | null> {
        try {
            const notificationRef = ref(realtimeDb, `notifications/${userId}/${notificationId}`);
            const snapshot = await get(notificationRef);

            if (!snapshot.exists()) {
                return null;
            }

            return {
                id: notificationId,
                ...snapshot.val()
            } as Notification;
        } catch (error) {
            console.error('Error getting notification:', error);
            return null;
        }
    },

    /**
     * Mark notification as read
     */
    async markAsRead(userId: string, notificationId: string): Promise<void> {
        try {
            const notificationRef = ref(realtimeDb, `notifications/${userId}/${notificationId}`);
            await update(notificationRef, { read: true });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    },

    /**
     * Mark notification as unread
     */
    async markAsUnread(userId: string, notificationId: string): Promise<void> {
        try {
            const notificationRef = ref(realtimeDb, `notifications/${userId}/${notificationId}`);
            await update(notificationRef, { read: false });
        } catch (error) {
            console.error('Error marking notification as unread:', error);
            throw error;
        }
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId: string): Promise<void> {
        try {
            const notifications = await this.getNotifications(userId, 1000);
            const updates: Record<string, boolean> = {};

            notifications.forEach(notification => {
                if (!notification.read) {
                    updates[`notifications/${userId}/${notification.id}/read`] = true;
                }
            });

            if (Object.keys(updates).length > 0) {
                await update(ref(realtimeDb), updates);
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    },

    /**
     * Delete a notification
     */
    async deleteNotification(userId: string, notificationId: string): Promise<void> {
        try {
            const notificationRef = ref(realtimeDb, `notifications/${userId}/${notificationId}`);
            await remove(notificationRef);
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    },

    /**
     * Delete all notifications for a user
     */
    async deleteAllNotifications(userId: string): Promise<void> {
        try {
            const notificationsRef = ref(realtimeDb, `notifications/${userId}`);
            await remove(notificationsRef);
        } catch (error) {
            console.error('Error deleting all notifications:', error);
            throw error;
        }
    },

    /**
     * Get unread notification count
     */
    async getUnreadCount(userId: string): Promise<number> {
        try {
            const notifications = await this.getNotifications(userId, 1000);
            return notifications.filter(n => !n.read).length;
        } catch (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
    },

    /**
     * Get notification statistics
     */
    async getNotificationStats(userId: string): Promise<NotificationStats> {
        try {
            const notifications = await this.getNotifications(userId, 1000);

            const stats: NotificationStats = {
                total: notifications.length,
                unread: notifications.filter(n => !n.read).length,
                byType: {
                    mail: 0,
                    transaction: 0,
                    storage: 0,
                    subscription: 0,
                    project: 0,
                    task: 0,
                    workspace: 0,
                    agency: 0,
                    pot: 0,
                    job_update: 0,
                    system: 0
                },
                byPriority: {
                    low: 0,
                    medium: 0,
                    high: 0,
                    urgent: 0
                }
            };

            notifications.forEach(notification => {
                stats.byType[notification.type]++;
                stats.byPriority[notification.priority]++;
            });

            return stats;
        } catch (error) {
            console.error('Error getting notification stats:', error);
            return {
                total: 0,
                unread: 0,
                byType: {
                    mail: 0,
                    transaction: 0,
                    storage: 0,
                    subscription: 0,
                    project: 0,
                    task: 0,
                    workspace: 0,
                    agency: 0,
                    pot: 0,
                    job_update: 0,
                    system: 0
                },
                byPriority: {
                    low: 0,
                    medium: 0,
                    high: 0,
                    urgent: 0
                }
            };
        }
    },

    /**
     * Listen to real-time notifications
     */
    listenToNotifications(
        userId: string,
        callback: (notifications: Notification[]) => void,
        limit: number = 50
    ): () => void {
        const notificationsRef = ref(realtimeDb, `notifications/${userId}`);
        const notificationsQuery = query(
            notificationsRef,
            orderByChild('createdAt'),
            limitToLast(limit)
        );

        const listener = onValue(notificationsQuery, (snapshot) => {
            if (!snapshot.exists()) {
                callback([]);
                return;
            }

            const notifications: Notification[] = [];
            snapshot.forEach((childSnapshot) => {
                notifications.push({
                    id: childSnapshot.key!,
                    ...childSnapshot.val()
                } as Notification);
            });

            // Sort by createdAt descending (newest first)
            const sortedNotifications = notifications.sort((a, b) => b.createdAt - a.createdAt);
            callback(sortedNotifications);
        });

        // Return unsubscribe function
        return () => {
            off(notificationsQuery, 'value', listener);
        };
    },

    /**
     * Listen to unread count
     */
    listenToUnreadCount(
        userId: string,
        callback: (count: number) => void
    ): () => void {
        return this.listenToNotifications(userId, (notifications) => {
            const unreadCount = notifications.filter(n => !n.read).length;
            callback(unreadCount);
        });
    }
};
