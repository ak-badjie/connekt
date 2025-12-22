import { db } from '@/lib/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    orderBy,
    limit,
    Timestamp
} from 'firebase/firestore';
import { WalletService } from './wallet-service';
import { StorageQuotaService } from './storage-quota-service';
import { TaskService } from './task-service';
import { EnhancedProjectService } from './enhanced-project-service';
import { SubscriptionService } from './subscription.service';
import { TIER_FEATURES } from '@/lib/types/subscription-tiers.types';

/**
 * Analytics Data Types
 */
export interface AnalyticsDashboard {
    aiTokens: {
        used: number;
        limit: number;
        isUnlimited: boolean;
        percentage: number;
    };
    storage: {
        usedBytes: number;
        totalBytes: number;
        percentage: number;
        breakdown: StorageBreakdown;
    };
    revenue: {
        total: number;
        currency: string;
        deposits: number;
        payments: number;
        escrowHoldings: number;
    };
    projects: {
        total: number;
        active: number;
        completed: number;
        planning: number;
    };
    tasks: {
        created: number;
        completed: number;
        inProgress: number;
        pending: number;
        total: number;
    };
    collaborators: number;
}

export interface StorageBreakdown {
    mailAttachments: number;
    chatAttachments: number;
    profileMedia: number;
    proofOfTask: number;
    proposals: number;
    contracts: number;
    otherFiles: number;
}

export interface TimeSeriesDataPoint {
    date: string;
    value: number;
    label?: string;
}

export interface RevenueDataPoint {
    date: string;
    revenue: number;
    deposits: number;
    payments: number;
}

/**
 * Analytics Service
 * Aggregates data from various services for the analytics dashboard
 */
export const AnalyticsService = {
    /**
     * Get complete analytics dashboard data for a user
     */
    async getAnalyticsDashboard(
        userId: string,
        username: string,
        role: 'recruiter' | 'va' | 'employer'
    ): Promise<AnalyticsDashboard> {
        const mailAddress = `${username}@connekt.com`;
        const walletId = `user_${userId}`;

        // Fetch all data in parallel
        const [
            aiQuota,
            storageBreakdown,
            walletStats,
            projectStats,
            userTasks,
            createdTasks,
            collaboratorCount
        ] = await Promise.all([
            this.getAIQuota(userId),
            StorageQuotaService.getDetailedStorageBreakdown(mailAddress),
            WalletService.getWalletStats(walletId),
            EnhancedProjectService.getProjectStats(userId),
            TaskService.getUserTasks(userId),
            TaskService.getCreatedTasks(userId),
            this.getCollaboratorCount(userId)
        ]);

        // Get tier for storage limit
        const tier = await SubscriptionService.getUserTier(userId);
        const features = TIER_FEATURES[tier];
        const storageTotal = features.storageGB * 1073741824; // GB to bytes

        return {
            aiTokens: {
                used: aiQuota.used,
                limit: aiQuota.limit,
                isUnlimited: aiQuota.isUnlimited,
                percentage: aiQuota.isUnlimited ? 0 : (aiQuota.used / aiQuota.limit) * 100
            },
            storage: {
                usedBytes: storageBreakdown?.total || 0,
                totalBytes: storageTotal,
                percentage: storageBreakdown ? (storageBreakdown.total / storageTotal) * 100 : 0,
                breakdown: {
                    mailAttachments: storageBreakdown?.mailAttachments || 0,
                    chatAttachments: storageBreakdown?.chatAttachments || 0,
                    profileMedia: storageBreakdown?.profileMedia || 0,
                    proofOfTask: storageBreakdown?.proofOfTask || 0,
                    proposals: storageBreakdown?.proposals || 0,
                    contracts: storageBreakdown?.contracts || 0,
                    otherFiles: storageBreakdown?.otherFiles || 0
                }
            },
            revenue: {
                total: walletStats.totalDeposits + walletStats.totalRefunds - walletStats.totalWithdrawals,
                currency: 'GMD',
                deposits: walletStats.totalDeposits,
                payments: walletStats.totalPayments,
                escrowHoldings: walletStats.escrowHoldings
            },
            projects: {
                total: projectStats.owned.length + projectStats.assigned.length,
                active: [...projectStats.owned, ...projectStats.assigned].filter(p => p.status === 'active').length,
                completed: [...projectStats.owned, ...projectStats.assigned].filter(p => p.status === 'completed').length,
                planning: [...projectStats.owned, ...projectStats.assigned].filter(p => p.status === 'planning').length
            },
            tasks: {
                created: createdTasks.length,
                completed: userTasks.filter(t => t.status === 'done').length,
                inProgress: userTasks.filter(t => t.status === 'in-progress').length,
                pending: userTasks.filter(t => t.status === 'pending-validation').length,
                total: userTasks.length
            },
            collaborators: collaboratorCount
        };
    },

    /**
     * Get AI usage quota
     */
    async getAIQuota(userId: string): Promise<{ used: number; limit: number; isUnlimited: boolean }> {
        try {
            const tier = await SubscriptionService.getUserTier(userId);
            const features = TIER_FEATURES[tier];
            const requestLimit = features.aiRequestsPerMonth;
            const isUnlimited = requestLimit === -1;

            // Fetch actual usage from Firestore
            const currentMonth = new Date().toISOString().slice(0, 7);
            const quotaRef = doc(db, 'ai_usage_quotas', `${userId}_${currentMonth}`);
            const quotaSnap = await getDoc(quotaRef);

            let used = 0;
            if (quotaSnap.exists()) {
                used = quotaSnap.data().requestsUsed || 0;
            }

            return {
                used,
                limit: isUnlimited ? Infinity : requestLimit,
                isUnlimited
            };
        } catch (error) {
            console.error('Error getting AI quota:', error);
            return { used: 0, limit: 0, isUnlimited: false };
        }
    },

    /**
     * Get revenue data over time
     */
    async getRevenueOverTime(userId: string, days: number = 30): Promise<RevenueDataPoint[]> {
        const walletId = `user_${userId}`;
        const transactions = await WalletService.getTransactionHistory(walletId, 500);

        // Group transactions by date
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const dataByDate: Record<string, { deposits: number; payments: number }> = {};

        // Initialize all dates
        for (let i = 0; i <= days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            dataByDate[dateStr] = { deposits: 0, payments: 0 };
        }

        // Aggregate transactions
        transactions.forEach(txn => {
            if (!txn.createdAt) return;

            const txnDate = txn.createdAt.toDate ? txn.createdAt.toDate() : new Date(txn.createdAt);
            if (txnDate < startDate) return;

            const dateStr = txnDate.toISOString().split('T')[0];
            if (!dataByDate[dateStr]) return;

            if (txn.type === 'deposit' || txn.type === 'escrow_release') {
                dataByDate[dateStr].deposits += Math.abs(txn.amount);
            } else if (txn.type === 'payment' || txn.type === 'escrow_hold') {
                dataByDate[dateStr].payments += Math.abs(txn.amount);
            }
        });

        return Object.entries(dataByDate)
            .map(([date, data]) => ({
                date,
                revenue: data.deposits - data.payments,
                deposits: data.deposits,
                payments: data.payments
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
    },

    /**
     * Get AI requests over time
     */
    async getAIRequestsOverTime(userId: string, days: number = 30): Promise<TimeSeriesDataPoint[]> {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const q = query(
                collection(db, 'ai_request_logs'),
                where('userId', '==', userId),
                orderBy('timestamp', 'desc'),
                limit(1000)
            );

            const snapshot = await getDocs(q);

            // Initialize all dates
            const dataByDate: Record<string, number> = {};
            for (let i = 0; i <= days; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                dataByDate[date.toISOString().split('T')[0]] = 0;
            }

            // Aggregate requests
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (!data.timestamp) return;

                const timestamp = data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
                if (timestamp < startDate) return;

                const dateStr = timestamp.toISOString().split('T')[0];
                if (dataByDate[dateStr] !== undefined) {
                    dataByDate[dateStr]++;
                }
            });

            return Object.entries(dataByDate)
                .map(([date, value]) => ({ date, value }))
                .sort((a, b) => a.date.localeCompare(b.date));
        } catch (error) {
            console.error('Error getting AI requests over time:', error);
            return [];
        }
    },

    /**
     * Get task completion data over time
     */
    async getTasksOverTime(userId: string, days: number = 30): Promise<TimeSeriesDataPoint[]> {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            // Get all user tasks
            const tasks = await TaskService.getUserTasks(userId);

            // Initialize all dates
            const dataByDate: Record<string, number> = {};
            for (let i = 0; i <= days; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                dataByDate[date.toISOString().split('T')[0]] = 0;
            }

            // Aggregate completed tasks by date
            tasks.forEach(task => {
                if (task.status !== 'done') return;
                if (!task.updatedAt) return;

                const updatedAt = task.updatedAt.toDate ? task.updatedAt.toDate() : new Date(task.updatedAt);
                if (updatedAt < startDate) return;

                const dateStr = updatedAt.toISOString().split('T')[0];
                if (dataByDate[dateStr] !== undefined) {
                    dataByDate[dateStr]++;
                }
            });

            return Object.entries(dataByDate)
                .map(([date, value]) => ({ date, value }))
                .sort((a, b) => a.date.localeCompare(b.date));
        } catch (error) {
            console.error('Error getting tasks over time:', error);
            return [];
        }
    },

    /**
     * Count unique collaborators (people worked with)
     */
    async getCollaboratorCount(userId: string): Promise<number> {
        try {
            const collaborators = new Set<string>();

            // Get projects where user is owner or member
            const [ownedProjects, assignedProjects] = await Promise.all([
                EnhancedProjectService.getUserProjects(userId),
                EnhancedProjectService.getAssignedProjects(userId)
            ]);

            // Collect unique member IDs from all projects
            [...ownedProjects, ...assignedProjects].forEach(project => {
                project.members?.forEach(member => {
                    if (member.userId !== userId) {
                        collaborators.add(member.userId);
                    }
                });
            });

            return collaborators.size;
        } catch (error) {
            console.error('Error getting collaborator count:', error);
            return 0;
        }
    },

    /**
     * Format bytes to human readable string
     */
    formatBytes(bytes: number): string {
        return StorageQuotaService.formatBytes(bytes);
    }
};
