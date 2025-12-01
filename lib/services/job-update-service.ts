import { db } from '@/lib/firebase';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    orderBy,
    serverTimestamp,
    doc,
    updateDoc,
    deleteDoc
} from 'firebase/firestore';
import { NotificationService } from './notification-service';

/**
 * Job Update Subscription
 */
export interface JobSubscription {
    id?: string;
    userId: string;
    categories: string[]; // e.g., ['tech', 'design', 'marketing']
    jobTypes: ('short_term' | 'long_term' | 'project_based')[];
    keywords: string[];
    minPayment?: number;
    maxPayment?: number;
    isActive: boolean;
    createdAt: any;
    updatedAt: any;
}

export const JobUpdateService = {
    /**
     * Create or update job subscription
     */
    async createSubscription(subscription: Omit<JobSubscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        try {
            // Check if subscription already exists
            const existingQuery = query(
                collection(db, 'job_subscriptions'),
                where('userId', '==', subscription.userId)
            );
            const existingSnapshot = await getDocs(existingQuery);

            if (!existingSnapshot.empty) {
                // Update existing subscription
                const docId = existingSnapshot.docs[0].id;
                await updateDoc(doc(db, 'job_subscriptions', docId), {
                    ...subscription,
                    updatedAt: serverTimestamp()
                });
                return docId;
            }

            // Create new subscription
            const docRef = await addDoc(collection(db, 'job_subscriptions'), {
                ...subscription,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            return docRef.id;
        } catch (error) {
            console.error('Error creating job subscription:', error);
            throw error;
        }
    },

    /**
     * Get user's job subscription
     */
    async getSubscription(userId: string): Promise<JobSubscription | null> {
        try {
            const q = query(
                collection(db, 'job_subscriptions'),
                where('userId', '==', userId)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                return null;
            }

            return {
                id: snapshot.docs[0].id,
                ...snapshot.docs[0].data()
            } as JobSubscription;
        } catch (error) {
            console.error('Error getting job subscription:', error);
            return null;
        }
    },

    /**
     * Update subscription
     */
    async updateSubscription(subscriptionId: string, updates: Partial<JobSubscription>): Promise<void> {
        try {
            await updateDoc(doc(db, 'job_subscriptions', subscriptionId), {
                ...updates,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating job subscription:', error);
            throw error;
        }
    },

    /**
     * Delete subscription
     */
    async deleteSubscription(subscriptionId: string): Promise<void> {
        try {
            await deleteDoc(doc(db, 'job_subscriptions', subscriptionId));
        } catch (error) {
            console.error('Error deleting job subscription:', error);
            throw error;
        }
    },

    /**
     * Notify subscribed users about new job
     */
    async notifySubscribers(jobData: {
        id: string;
        title: string;
        category: string;
        jobType: 'short_term' | 'long_term' | 'project_based';
        payment?: number;
        postedBy: string;
        postedByUsername: string;
        keywords?: string[];
    }): Promise<void> {
        try {
            // Get all active subscriptions
            const subscriptionsQuery = query(
                collection(db, 'job_subscriptions'),
                where('isActive', '==', true)
            );
            const subscriptionsSnapshot = await getDocs(subscriptionsQuery);

            const notificationPromises: Promise<any>[] = [];

            subscriptionsSnapshot.forEach((docSnapshot) => {
                const subscription = docSnapshot.data() as JobSubscription;

                // Check if job matches subscription criteria
                const matchesCategory = subscription.categories.length === 0 ||
                    subscription.categories.includes(jobData.category);
                const matchesJobType = subscription.jobTypes.length === 0 ||
                    subscription.jobTypes.includes(jobData.jobType);
                const matchesPayment = (!subscription.minPayment || !jobData.payment || jobData.payment >= subscription.minPayment) &&
                    (!subscription.maxPayment || !jobData.payment || jobData.payment <= subscription.maxPayment);

                // Check keywords
                let matchesKeywords = subscription.keywords.length === 0;
                if (subscription.keywords.length > 0 && jobData.keywords) {
                    matchesKeywords = subscription.keywords.some(keyword =>
                        jobData.keywords!.some(jobKeyword =>
                            jobKeyword.toLowerCase().includes(keyword.toLowerCase())
                        )
                    );
                }

                if (matchesCategory && matchesJobType && matchesPayment && (subscription.keywords.length === 0 || matchesKeywords)) {
                    // Send notification
                    notificationPromises.push(
                        NotificationService.createNotification(
                            subscription.userId,
                            'job_update',
                            'New Job Posted',
                            `A new ${jobData.jobType.replace('_', ' ')} job "${jobData.title}" has been posted.`,
                            'medium',
                            {
                                type: 'job_update',
                                jobId: jobData.id,
                                jobTitle: jobData.title,
                                jobCategory: jobData.category,
                                jobType: jobData.jobType,
                                postedBy: jobData.postedBy,
                                postedByUsername: jobData.postedByUsername
                            },
                            `/explore/jobs/${jobData.id}`,
                            'View Job'
                        )
                    );
                }
            });

            await Promise.all(notificationPromises);
        } catch (error) {
            console.error('Error notifying job subscribers:', error);
        }
    }
};
