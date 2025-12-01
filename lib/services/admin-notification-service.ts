import { NotificationService } from './notification-service';

/**
 * Admin Notification Service
 * For system-wide notifications and announcements
 * Only accessible by admin users
 */
export const AdminNotificationService = {
    /**
     * Send notification to all users
     */
    async broadcastToAll(
        title: string,
        message: string,
        category: 'announcement' | 'maintenance' | 'feature' | 'security' | 'update',
        content: string,
        imageUrl?: string,
        actionUrl?: string,
        actionLabel?: string
    ): Promise<void> {
        // Note: This would require fetching all user IDs from Firestore
        // For now, this is a placeholder. In production, you'd want to:
        // 1. Use Cloud Functions to handle this efficiently
        // 2. Or use Firebase Cloud Messaging for push notifications
        console.warn('broadcastToAll: This method should be implemented with Cloud Functions for efficiency');
        throw new Error('Use Cloud Functions for broadcasting to all users');
    },

    /**
     * Send notification to specific user group
     */
    async broadcastToGroup(
        targetAudience: 'users' | 'recruiters' | 'agencies',
        title: string,
        message: string,
        category: 'announcement' | 'maintenance' | 'feature' | 'security' | 'update',
        content: string,
        imageUrl?: string,
        actionUrl?: string,
        actionLabel?: string
    ): Promise<void> {
        // Note: Similar to broadcastToAll, this should use Cloud Functions
        // to query users by role and send notifications efficiently
        console.warn('broadcastToGroup: This method should be implemented with Cloud Functions for efficiency');
        throw new Error('Use Cloud Functions for group broadcasts');
    },

    /**
     * Send notification to specific user
     */
    async sendSystemNotification(
        userId: string,
        title: string,
        message: string,
        category: 'announcement' | 'maintenance' | 'feature' | 'security' | 'update',
        content: string,
        targetAudience: 'all' | 'users' | 'recruiters' | 'agencies' = 'all',
        imageUrl?: string,
        actionUrl?: string,
        actionLabel?: string
    ): Promise<string> {
        try {
            return await NotificationService.createNotification(
                userId,
                'system',
                title,
                message,
                category === 'security' || category === 'maintenance' ? 'urgent' : 'medium',
                {
                    type: 'system',
                    category,
                    content,
                    targetAudience,
                    imageUrl
                },
                actionUrl,
                actionLabel
            );
        } catch (error) {
            console.error('Error sending system notification:', error);
            throw error;
        }
    },

    /**
     * Schedule maintenance notification
     */
    async scheduleMaintenanceNotification(
        userId: string,
        maintenanceDate: Date,
        duration: string,
        affectedServices: string[]
    ): Promise<string> {
        const message = `Scheduled maintenance on ${maintenanceDate.toLocaleDateString()} at ${maintenanceDate.toLocaleTimeString()}. ` +
            `Duration: ${duration}. Affected services: ${affectedServices.join(', ')}.`;

        return await this.sendSystemNotification(
            userId,
            'Scheduled Maintenance',
            message,
            'maintenance',
            message
        );
    },

    /**
     * Send feature announcement
     */
    async announceFeature(
        userId: string,
        featureName: string,
        featureDescription: string,
        imageUrl?: string,
        actionUrl?: string
    ): Promise<string> {
        return await this.sendSystemNotification(
            userId,
            `New Feature: ${featureName}`,
            featureDescription,
            'feature',
            featureDescription,
            'all',
            imageUrl,
            actionUrl,
            'Learn More'
        );
    },

    /**
     * Send security alert
     */
    async sendSecurityAlert(
        userId: string,
        alertTitle: string,
        alertMessage: string,
        actionUrl?: string
    ): Promise<string> {
        return await this.sendSystemNotification(
            userId,
            alertTitle,
            alertMessage,
            'security',
            alertMessage,
            'all',
            undefined,
            actionUrl,
            'Take Action'
        );
    }
};
