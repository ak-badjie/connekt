import { db } from '@/lib/firebase';
import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    getDocs,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { WalletService } from './wallet-service';
// import { ModemPayService } from './modem-pay-service'; // Removed after migration
import { NotificationService } from './notification-service';
import { SubscriptionNotificationMetadata } from '@/lib/types/notification.types';
import {
    SubscriptionTier,
    UserSubscription,
    SubscriptionPlan,
    SUBSCRIPTION_PLANS,
    TIER_FEATURES,
    TierFeatures,
    SubscriptionPayment,
} from '@/lib/types/subscription-tiers.types';

/**
 * Subscription Service
 * Manages subscription tiers, payments via ConnektWallet, and feature gating
 */
export const SubscriptionService = {
    /**
     * Get user's current subscription tier
     */
    async getUserTier(userId: string): Promise<SubscriptionTier> {
        try {
            const subRef = doc(db, 'user_subscriptions', userId);
            const subSnap = await getDoc(subRef);

            if (!subSnap.exists()) {
                return SubscriptionTier.FREE;
            }

            const subscription = subSnap.data() as UserSubscription;

            // Check if subscription is active
            if (subscription.status !== 'active') {
                return SubscriptionTier.FREE;
            }

            // Check if subscription has expired
            if (subscription.endDate) {
                const endDate = subscription.endDate.toDate ? subscription.endDate.toDate() : new Date(subscription.endDate);
                if (endDate < new Date()) {
                    // Expired, update status
                    await updateDoc(subRef, {
                        status: 'expired',
                        updatedAt: serverTimestamp(),
                    });
                    return SubscriptionTier.FREE;
                }
            }

            return subscription.tier;
        } catch (error) {
            console.error('Error getting user tier:', error);
            return SubscriptionTier.FREE;
        }
    },

    /**
     * Get user's subscription record
     */
    async getUserSubscription(userId: string): Promise<UserSubscription | null> {
        try {
            const subRef = doc(db, 'user_subscriptions', userId);
            const subSnap = await getDoc(subRef);

            if (!subSnap.exists()) {
                return null;
            }

            return { id: subSnap.id, ...subSnap.data() } as UserSubscription;
        } catch (error) {
            console.error('Error getting user subscription:', error);
            return null;
        }
    },

    /**
     * Get features for a specific tier
     */
    getTierFeatures(tier: SubscriptionTier): TierFeatures {
        return TIER_FEATURES[tier];
    },

    /**
     * Check if user has access to a specific feature
     */
    async hasFeature(userId: string, feature: keyof TierFeatures): Promise<boolean> {
        const tier = await this.getUserTier(userId);
        const features = this.getTierFeatures(tier);
        return features[feature] as boolean;
    },

    /**
     * Get available subscription plans
     */
    getPlans(): SubscriptionPlan[] {
        return SUBSCRIPTION_PLANS;
    },

    /**
     * Get plan by ID
     */
    getPlanById(planId: string): SubscriptionPlan | null {
        return SUBSCRIPTION_PLANS.find(p => p.id === planId) || null;
    },

    /**
     * Subscribe to a plan (via ConnektWallet)
     */
    async subscribe(
        userId: string,
        planId: string,
        billingCycle: 'monthly' | 'yearly',
        paymentMethod: 'wallet' | 'modem_pay' = 'wallet'
    ): Promise<{ success: boolean; message: string; subscription?: UserSubscription }> {
        try {
            const plan = this.getPlanById(planId);
            if (!plan) {
                return { success: false, message: 'Invalid plan selected' };
            }

            // Free tier doesn't require payment
            if (plan.tier === SubscriptionTier.FREE) {
                return { success: false, message: 'You are already on the free tier' };
            }

            const amount = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;

            // Process payment via wallet
            if (paymentMethod === 'wallet') {
                const walletId = `user_${userId}`;
                const wallet = await WalletService.getWallet(userId, 'user');

                if (!wallet) {
                    return { success: false, message: 'Wallet not found. Please create a wallet first.' };
                }

                const hasFunds = await WalletService.hasSufficientFunds(walletId, amount);
                if (!hasFunds) {
                    return { success: false, message: `Insufficient funds. Required: D${amount}` };
                }

                // Deduct from wallet
                await WalletService.updateBalance(walletId, -amount);
                await WalletService.addTransaction(walletId, {
                    type: 'payment',
                    walletId,
                    currency: 'GMD',
                    amount: -amount,
                    description: `Subscription to ${plan.name} (${billingCycle})`,
                    relatedEntityType: 'subscription',
                    status: 'completed',
                });
            }

            // Calculate subscription dates
            const startDate = Timestamp.now();
            const endDate = new Date();
            if (billingCycle === 'monthly') {
                endDate.setMonth(endDate.getMonth() + 1);
            } else {
                endDate.setFullYear(endDate.getFullYear() + 1);
            }

            const nextBillingDate = new Date(endDate);

            // Create subscription record
            const subscription: UserSubscription = {
                userId,
                tier: plan.tier,
                planId,
                status: 'active',
                billingCycle,
                amount,
                currency: 'GMD',
                paymentMethod,
                lastPaymentDate: startDate,
                nextBillingDate: Timestamp.fromDate(nextBillingDate),
                startDate,
                endDate: Timestamp.fromDate(endDate),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await setDoc(doc(db, 'user_subscriptions', userId), subscription);

            // Create payment record
            const payment: SubscriptionPayment = {
                userId,
                subscriptionId: userId,
                tier: plan.tier,
                amount,
                currency: 'GMD',
                status: 'completed',
                paymentMethod,
                createdAt: serverTimestamp(),
                completedAt: serverTimestamp(),
            };

            await setDoc(doc(collection(db, 'subscription_payments')), payment);

            // Send notification
            await NotificationService.createNotification(
                userId,
                'system',
                `Welcome to ${plan.name}!`,
                `Your subscription is now active. Enjoy all ${plan.name} features!`,
                'high',
                { type: 'subscription', subscriptionType: plan.tier === SubscriptionTier.PRO ? 'connect_pro' : 'connect_pro_plus', action: 'activated' } as SubscriptionNotificationMetadata,
                '/settings',
                'View Subscription'
            );

            return { success: true, message: 'Subscription activated successfully!', subscription };
        } catch (error: any) {
            console.error('Subscription error:', error);
            return { success: false, message: error.message || 'Failed to process subscription' };
        }
    },

    /**
     * Initiate subscription payment via Modem Pay
     */
    async initiateModemPaySubscription(
        userId: string,
        planId: string,
        billingCycle: 'monthly' | 'yearly',
        returnUrl: string
    ): Promise<{ success: boolean; paymentUrl?: string; message?: string }> {
        try {
            const plan = this.getPlanById(planId);
            if (!plan) {
                return { success: false, message: 'Invalid plan selected' };
            }

            const amount = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;

            // Initiate payment via Cloud Function
            // Use initiateTopUp endpoint which is generic enough for payments
            const functionsUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL;
            const endpoint = functionsUrl
                ? `${functionsUrl}/initiateTopUp`
                : '/api/wallet/topup'; // Fallback if still needed, but we want to move away

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    walletId: `subscription_${userId}`, // Virtual wallet ID for subscription
                    returnUrl
                    // We might need to pass metadata to link it to subscription, 
                    // but initiateTopUp currently handles generic payments.
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to initiate payment');
            }

            const { paymentUrl, transactionId, reference } = await response.json();

            // Store pending payment record
            const payment: SubscriptionPayment = {
                userId,
                subscriptionId: userId,
                tier: plan.tier,
                amount,
                currency: 'GMD',
                status: 'pending',
                paymentMethod: 'modem_pay',
                modemPayTransactionId: transactionId,
                modemPayReference: reference,
                createdAt: serverTimestamp(),
            };

            await setDoc(doc(collection(db, 'subscription_payments')), payment);

            return { success: true, paymentUrl };
        } catch (error: any) {
            console.error('Modem Pay subscription error:', error);
            return { success: false, message: error.message || 'Failed to initiate payment' };
        }
    },

    /**
     * Cancel subscription
     */
    async cancelSubscription(userId: string): Promise<{ success: boolean; message: string }> {
        try {
            const subRef = doc(db, 'user_subscriptions', userId);
            const subSnap = await getDoc(subRef);

            if (!subSnap.exists()) {
                return { success: false, message: 'No active subscription found' };
            }

            const subscription = subSnap.data() as UserSubscription;

            await updateDoc(subRef, {
                status: 'cancelled',
                cancelledAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            await NotificationService.createNotification(
                userId,
                'system',
                'Subscription Cancelled',
                'Your subscription has been cancelled. You will retain access until the end of your billing period.',
                'medium',
                { type: 'subscription', subscriptionType: subscription.tier === SubscriptionTier.PRO ? 'connect_pro' : 'connect_pro_plus', action: 'cancelled' } as SubscriptionNotificationMetadata,
                '/settings'
            );

            return { success: true, message: 'Subscription cancelled successfully' };
        } catch (error: any) {
            console.error('Cancel subscription error:', error);
            return { success: false, message: error.message || 'Failed to cancel subscription' };
        }
    },

    /**
     * Renew subscription (called automatically or manually)
     */
    async renewSubscription(userId: string): Promise<{ success: boolean; message: string }> {
        try {
            const subscription = await this.getUserSubscription(userId);
            if (!subscription) {
                return { success: false, message: 'No subscription found' };
            }

            if (subscription.status === 'cancelled') {
                return { success: false, message: 'Subscription was cancelled' };
            }

            const plan = this.getPlanById(subscription.planId);
            if (!plan) {
                return { success: false, message: 'Plan not found' };
            }

            const amount = subscription.billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;

            // Process payment
            if (subscription.paymentMethod === 'wallet') {
                const walletId = `user_${userId}`;
                const hasFunds = await WalletService.hasSufficientFunds(walletId, amount);

                if (!hasFunds) {
                    // Mark as past due
                    await updateDoc(doc(db, 'user_subscriptions', userId), {
                        status: 'past_due',
                        updatedAt: serverTimestamp(),
                    });

                    await NotificationService.createNotification(
                        userId,
                        'system',
                        'Payment Failed',
                        `Insufficient funds for subscription renewal. Please top up your wallet with D${amount}.`,
                        'urgent',
                        { type: 'subscription', subscriptionType: subscription.tier === SubscriptionTier.PRO ? 'connect_pro' : 'connect_pro_plus', action: 'renewed' } as SubscriptionNotificationMetadata,
                        '/wallet',
                        'Top Up'
                    );

                    return { success: false, message: 'Insufficient funds for renewal' };
                }

                // Process payment
                await WalletService.updateBalance(walletId, -amount);
                await WalletService.addTransaction(walletId, {
                    type: 'payment',
                    walletId,
                    currency: 'GMD',
                    amount: -amount,
                    description: `Subscription renewal: ${plan.name}`,
                    relatedEntityType: 'subscription',
                    status: 'completed',
                });
            }

            // Update subscription dates
            const newEndDate = new Date();
            if (subscription.billingCycle === 'monthly') {
                newEndDate.setMonth(newEndDate.getMonth() + 1);
            } else {
                newEndDate.setFullYear(newEndDate.getFullYear() + 1);
            }

            await updateDoc(doc(db, 'user_subscriptions', userId), {
                status: 'active',
                lastPaymentDate: serverTimestamp(),
                nextBillingDate: Timestamp.fromDate(newEndDate),
                endDate: Timestamp.fromDate(newEndDate),
                updatedAt: serverTimestamp(),
            });

            // Record payment
            const payment: SubscriptionPayment = {
                userId,
                subscriptionId: userId,
                tier: plan.tier,
                amount,
                currency: 'GMD',
                status: 'completed',
                paymentMethod: subscription.paymentMethod,
                createdAt: serverTimestamp(),
                completedAt: serverTimestamp(),
            };

            await setDoc(doc(collection(db, 'subscription_payments')), payment);

            return { success: true, message: 'Subscription renewed successfully' };
        } catch (error: any) {
            console.error('Renewal error:', error);
            return { success: false, message: error.message || 'Failed to renew subscription' };
        }
    },
};
