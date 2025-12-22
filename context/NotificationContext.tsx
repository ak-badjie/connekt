'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { NotificationService } from '@/lib/services/notification-service';
import type { Notification } from '@/lib/types/notification.types';
import toast from 'react-hot-toast';
import { NotificationDynamicIsland } from '@/components/ui/NotificationDynamicIsland';
import { realtimeDb } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';

export interface PendingPaymentNotification {
    amount: number;
    walletId: string;
    status: 'verifying' | 'success' | 'error';
    message?: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    markAsRead: (notificationId: string) => Promise<void>;
    markAsUnread: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (notificationId: string) => Promise<void>;
    refreshNotifications: () => Promise<void>;
    // Dynamic Island state - consumed by Navbar
    dynamicIslandNotification: Notification | null;
    dismissDynamicIsland: () => void;
    // Pending payment state
    pendingPaymentNotification: PendingPaymentNotification | null;
    showPendingPayment: (amount: number, walletId: string) => void;
    dismissPendingPayment: () => void;
    // Payment polling (persists beyond modal lifecycle)
    startPaymentPolling: (transactionId: string, amount: number, walletId: string) => void;
    // For testing
    createTestNotification: () => Promise<void>;
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
    const [pendingPaymentNotification, setPendingPaymentNotification] = useState<PendingPaymentNotification | null>(null);
    const previousBalanceRef = useRef<number | null>(null);

    const dismissDynamicIsland = useCallback(() => {
        setDynamicIslandNotification(null);
    }, []);

    const showPendingPayment = useCallback((amount: number, walletId: string) => {
        setPendingPaymentNotification({ amount, walletId, status: 'verifying' });
    }, []);

    const dismissPendingPayment = useCallback(() => {
        setPendingPaymentNotification(null);
    }, []);

    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Start polling for payment verification (called from TopUpModal)
    const startPaymentPolling = useCallback((transactionId: string, amount: number, walletId: string) => {
        console.log('[NotificationContext] Starting payment polling for:', transactionId);

        // Show verifying notification immediately
        setPendingPaymentNotification({ amount, walletId, status: 'verifying' });

        // Clear any existing polling
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        const pollVerification = async () => {
            try {
                console.log('[NotificationContext] Polling verification...');
                const response = await fetch('/api/wallet/verify-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transactionId, walletId, amount })
                });

                const data = await response.json();
                console.log('[NotificationContext] Poll result:', data);

                if (data.success && data.status === 'completed') {
                    // Success!
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = null;
                    }
                    setPendingPaymentNotification({
                        amount,
                        walletId,
                        status: 'success',
                        message: data.message || `Wallet credited with GMD ${amount.toFixed(2)}`
                    });
                    // Auto-dismiss after 4 seconds
                    setTimeout(() => setPendingPaymentNotification(null), 4000);
                } else if (data.status === 'failed' || data.status === 'error') {
                    // Failed
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = null;
                    }
                    setPendingPaymentNotification({
                        amount,
                        walletId,
                        status: 'error',
                        message: data.message || 'Payment verification failed'
                    });
                    setTimeout(() => setPendingPaymentNotification(null), 5000);
                }
                // If pending, keep polling
            } catch (err) {
                console.error('[NotificationContext] Polling error:', err);
            }
        };

        // Initial poll
        pollVerification();
        // Poll every 2 seconds
        pollingIntervalRef.current = setInterval(pollVerification, 2000);

        // Stop after 2 minutes
        setTimeout(() => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
                setPendingPaymentNotification(prev => {
                    if (prev?.status === 'verifying') {
                        return { ...prev, status: 'error', message: 'Verification timed out' };
                    }
                    return prev;
                });
            }
        }, 120000);
    }, []);

    useEffect(() => {
        if (!user) {
            console.log('[NotificationContext] No user, clearing notifications');
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            setHasShownInitialNotification(false);
            return;
        }

        console.log('[NotificationContext] Setting up listener for user:', user.uid);
        setLoading(true);

        // Set up real-time listener
        const unsubscribe = NotificationService.listenToNotifications(
            user.uid,
            (newNotifications) => {
                console.log('[NotificationContext] Received notifications:', newNotifications.length);
                setNotifications(newNotifications);
                const unread = newNotifications.filter(n => !n.read).length;
                setUnreadCount(unread);
                setLoading(false);

                // Show Dynamic Island for notifications
                if (newNotifications.length > 0) {
                    const latestNotification = newNotifications[0];
                    console.log('[NotificationContext] Latest notification:', latestNotification.title, 'read:', latestNotification.read);

                    // On first load: show the most recent unread notification immediately
                    if (!hasShownInitialNotification && !latestNotification.read) {
                        console.log('[NotificationContext] Showing initial notification');
                        showNotificationToast(latestNotification);
                        setDynamicIslandNotification(latestNotification);
                        setLastNotificationTime(latestNotification.createdAt);
                        setHasShownInitialNotification(true);
                    }
                    // For subsequent updates: only show toast if it's a new notification
                    else if (hasShownInitialNotification && latestNotification.createdAt > lastNotificationTime) {
                        console.log('[NotificationContext] New notification arriving');
                        showNotificationToast(latestNotification);
                        setDynamicIslandNotification(latestNotification);
                        setLastNotificationTime(latestNotification.createdAt);
                    }
                } else {
                    console.log('[NotificationContext] No notifications found');
                    setHasShownInitialNotification(true);
                }
            },
            50 // Limit to 50 most recent notifications
        );

        return () => {
            console.log('[NotificationContext] Cleaning up listener');
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

    // Create a test notification for debugging
    const createTestNotification = async () => {
        if (!user) return;

        try {
            console.log('[NotificationContext] Creating test notification for user:', user.uid);
            await NotificationService.createNotification(
                user.uid,
                'system',
                'Test Notification',
                'This is a test notification to verify the system is working!',
                'high',
                {
                    type: 'system',
                    category: 'announcement',
                    content: 'Test notification content',
                    targetAudience: 'all'
                },
                '/dashboard',
                'Go to Dashboard'
            );
            console.log('[NotificationContext] Test notification created successfully');
        } catch (error) {
            console.error('Error creating test notification:', error);
        }
    };
    // Listen to payment status from webhook (RTDB)
    // The webhook writes to /payment_status/{walletId} with status updates
    useEffect(() => {
        if (!user) return;

        // Listen to payment status for the current user's wallet
        const paymentStatusRef = ref(realtimeDb, `payment_status/${user.uid}`);

        const handlePaymentStatusChange = (snapshot: any) => {
            const data = snapshot.val();

            if (!data) return;

            console.log('[NotificationContext] Payment status update:', data);

            // Ignore stale data - only process if the payment was started within the last 60 seconds
            // This prevents showing old "success" notifications when the listener first connects
            const paymentAge = Date.now() - (data.timestamp || 0);
            const MAX_PAYMENT_AGE_MS = 60 * 1000; // 60 seconds

            if (paymentAge > MAX_PAYMENT_AGE_MS) {
                console.log('[NotificationContext] Ignoring stale payment status (age:', Math.round(paymentAge / 1000), 'seconds)');
                return;
            }

            if (data.status === 'verifying') {
                setPendingPaymentNotification({
                    amount: data.amount,
                    walletId: user.uid,
                    status: 'verifying'
                });
            } else if (data.status === 'success') {
                // Stop polling since webhook completed successfully
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                    console.log('[NotificationContext] Stopped polling - RTDB success received');
                }

                setPendingPaymentNotification({
                    amount: data.amount,
                    walletId: user.uid,
                    status: 'success',
                    message: data.message || `Wallet credited with GMD ${data.amount?.toFixed(2)}`
                });

                // Auto-dismiss after showing success
                setTimeout(() => {
                    setPendingPaymentNotification(null);
                }, 4000);
            } else if (data.status === 'failed' || data.status === 'error') {
                // Stop polling since webhook completed with error
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                    console.log('[NotificationContext] Stopped polling - RTDB error received');
                }

                setPendingPaymentNotification({
                    amount: data.amount,
                    walletId: user.uid,
                    status: 'error',
                    message: data.message || 'Payment failed'
                });

                // Auto-dismiss after showing error
                setTimeout(() => {
                    setPendingPaymentNotification(null);
                }, 5000);
            }
        };

        onValue(paymentStatusRef, handlePaymentStatusChange);

        return () => {
            off(paymentStatusRef, 'value', handlePaymentStatusChange);
        };
    }, [user]);

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
                refreshNotifications,
                // Dynamic Island state for Navbar to use
                dynamicIslandNotification,
                dismissDynamicIsland,
                // Pending payment state
                pendingPaymentNotification,
                showPendingPayment,
                dismissPendingPayment,
                // Payment polling
                startPaymentPolling,
                // For testing
                createTestNotification
            }}
        >
            {children}
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
