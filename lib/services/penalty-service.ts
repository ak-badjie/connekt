import { db } from '@/lib/firebase';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { getContract } from './legal';

/**
 * PenaltyService
 * 
 * Manages penalty tracking for contracts:
 * - Records missed task deadlines
 * - Calculates monthly penalty deductions for employees
 * - Updates freelancer task completion rates
 */
export const PenaltyService = {
    /**
     * Record a missed deadline for a contract member
     */
    async recordMissedDeadline(
        contractId: string,
        taskId: string,
        userId: string,
        missedAt: Date
    ): Promise<string> {
        const penaltyRef = await addDoc(collection(db, 'penalty_records'), {
            contractId,
            taskId,
            userId,
            type: 'missed_deadline',
            missedAt: Timestamp.fromDate(missedAt),
            processed: false,
            createdAt: serverTimestamp()
        });

        console.log(`Penalty recorded: ${penaltyRef.id} for task ${taskId}`);
        return penaltyRef.id;
    },

    /**
     * Calculate penalties for an employee's monthly period
     */
    async calculateMonthlyPenalties(contractId: string): Promise<number> {
        const contract = await getContract(contractId);
        if (!contract?.terms?.penaltiesEnabled) return 0;

        const penaltyPerMiss = contract.terms.penaltyPerMissedDeadline || 0;
        const maxPercentage = contract.terms.maxPenaltyPercentage || 50;
        const salary = contract.terms.salaryAmount || 0;

        // Get unprocessed penalties for this contract
        const q = query(
            collection(db, 'penalty_records'),
            where('contractId', '==', contractId),
            where('processed', '==', false)
        );
        const snap = await getDocs(q);

        const totalPenalty = snap.size * penaltyPerMiss;
        const maxPenalty = salary * (maxPercentage / 100);

        return Math.min(totalPenalty, maxPenalty);
    },

    /**
     * Mark penalties as processed after salary release
     */
    async markPenaltiesProcessed(contractId: string): Promise<void> {
        const q = query(
            collection(db, 'penalty_records'),
            where('contractId', '==', contractId),
            where('processed', '==', false)
        );
        const snap = await getDocs(q);

        const updates = snap.docs.map(penaltyDoc =>
            updateDoc(doc(db, 'penalty_records', penaltyDoc.id), {
                processed: true,
                processedAt: serverTimestamp()
            })
        );

        await Promise.all(updates);
        console.log(`Marked ${snap.size} penalties as processed for contract ${contractId}`);
    },

    /**
     * Update freelancer's task completion rate
     * Called when a task is completed or deadline is missed
     */
    async updateFreelancerCompletionRate(userId: string, completed: boolean): Promise<void> {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) return;

        const userData = userSnap.data();
        const stats = userData.taskStats || { completed: 0, missed: 0 };

        if (completed) {
            stats.completed++;
        } else {
            stats.missed++;
        }

        const total = stats.completed + stats.missed;
        const completionRate = total > 0 ? Math.round((stats.completed / total) * 100) : 100;

        await updateDoc(userRef, {
            taskStats: stats,
            taskCompletionRate: completionRate,
            updatedAt: serverTimestamp()
        });

        console.log(`Updated completion rate for user ${userId}: ${completionRate}%`);
    },

    /**
     * Get pending penalties for a contract
     */
    async getPendingPenalties(contractId: string): Promise<any[]> {
        const q = query(
            collection(db, 'penalty_records'),
            where('contractId', '==', contractId),
            where('processed', '==', false)
        );
        const snap = await getDocs(q);

        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    /**
     * Get penalty summary for a contract
     */
    async getPenaltySummary(contractId: string): Promise<{
        totalPending: number;
        totalProcessed: number;
        pendingAmount: number;
    }> {
        const contract = await getContract(contractId);
        const penaltyPerMiss = contract?.terms?.penaltyPerMissedDeadline || 0;

        // Get pending
        const pendingQ = query(
            collection(db, 'penalty_records'),
            where('contractId', '==', contractId),
            where('processed', '==', false)
        );
        const pendingSnap = await getDocs(pendingQ);

        // Get processed
        const processedQ = query(
            collection(db, 'penalty_records'),
            where('contractId', '==', contractId),
            where('processed', '==', true)
        );
        const processedSnap = await getDocs(processedQ);

        return {
            totalPending: pendingSnap.size,
            totalProcessed: processedSnap.size,
            pendingAmount: pendingSnap.size * penaltyPerMiss
        };
    }
};
