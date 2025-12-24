import { db, storage } from '@/lib/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    addDoc,
    serverTimestamp,
    orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Task, TaskTimeline, TaskPricing, ProofOfTask, HelpRequest } from '@/lib/types/workspace.types';

export const TaskService = {
    /**
     * Create a new task
     */
    async createTask(data: {
        projectId: string;
        workspaceId: string;
        title: string;
        description: string;
        priority: Task['priority'];
        assigneeId?: string;
        assigneeUsername?: string;
        timeline?: Partial<TaskTimeline>;
        pricing: TaskPricing;
        createdBy: string;
    }): Promise<string> {
        // Validate budget before creating task
        try {
            const { EnhancedProjectService } = await import('./enhanced-project-service');
            const budgetStatus = await EnhancedProjectService.getProjectBudgetStatus(data.projectId);

            // Check if task amount exceeds remaining budget (only if currencies match or no project currency set)
            const taskCurrency = data.pricing.currency;
            const projectCurrency = budgetStatus.currency;

            if (!projectCurrency || taskCurrency === projectCurrency) {
                if (data.pricing.amount > budgetStatus.remaining) {
                    throw new Error(
                        `Task budget (${taskCurrency} ${data.pricing.amount}) exceeds remaining project budget (${projectCurrency || taskCurrency} ${budgetStatus.remaining.toFixed(2)}). ` +
                        `Total budget: ${budgetStatus.totalBudget.toFixed(2)}, Already allocated: ${budgetStatus.spent.toFixed(2)}`
                    );
                }
            }
        } catch (error: any) {
            // If it's a budget validation error, rethrow it
            if (error.message.includes('exceeds remaining project budget')) {
                throw error;
            }
            // Otherwise, log the error and continue (budget check is not critical)
            console.warn('Budget validation failed:', error);
        }

        const task: Omit<Task, 'id'> = {
            projectId: data.projectId,
            workspaceId: data.workspaceId,
            title: data.title,
            description: data.description,
            status: 'todo',
            priority: data.priority,
            ...(data.assigneeId && { assigneeId: data.assigneeId }),
            ...(data.assigneeUsername && { assigneeUsername: data.assigneeUsername }),
            isReassignable: true,
            timeline: {
                ...(data.timeline?.startDate && { startDate: data.timeline.startDate }),
                ...(data.timeline?.dueDate && { dueDate: data.timeline.dueDate }),
                ...(data.timeline?.estimatedHours && { estimatedHours: data.timeline.estimatedHours }),
                actualHours: 0
            },
            pricing: data.pricing,
            createdBy: data.createdBy,
            isPublic: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'tasks'), task);
        return docRef.id;
    },

    /**
     * Get task by ID
     */
    async getTask(taskId: string): Promise<Task | null> {
        const docRef = doc(db, 'tasks', taskId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return null;

        return {
            id: docSnap.id,
            ...docSnap.data()
        } as Task;
    },

    /**
     * Get tasks for a project
     */
    async getProjectTasks(projectId: string): Promise<Task[]> {
        const q = query(
            collection(db, 'tasks'),
            where('projectId', '==', projectId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    },

    /**
     * Get tasks assigned to a user
     */
    async getUserTasks(userId: string): Promise<Task[]> {
        const q = query(
            collection(db, 'tasks'),
            where('assigneeId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    },

    /**
     * Get tasks created by a user
     */
    async getCreatedTasks(userId: string): Promise<Task[]> {
        const q = query(
            collection(db, 'tasks'),
            where('createdBy', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    },

    /**
     * Update task status
     */
    async updateStatus(taskId: string, status: Task['status']) {
        const docRef = doc(db, 'tasks', taskId);
        await updateDoc(docRef, {
            status,
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Update task visibility (Public/Private)
     */
    async updateVisibility(taskId: string, isPublic: boolean) {
        const docRef = doc(db, 'tasks', taskId);
        await updateDoc(docRef, {
            isPublic,
            publishedAt: isPublic ? serverTimestamp() : null,
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Reassign task
     */
    async reassignTask(taskId: string, assigneeId: string, assigneeUsername: string) {
        const docRef = doc(db, 'tasks', taskId);
        await updateDoc(docRef, {
            assigneeId,
            assigneeUsername,
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Submit Proof of Task with file uploads
     * Handles uploading screenshots and videos to Firebase Storage,
     * tracks storage usage, and calls submitProof
     */
    async submitProofOfTask(
        taskId: string,
        userId: string,
        username: string,
        data: {
            screenshots: File[];
            videos: File[];
            links: string[];
            notes?: string;
        }
    ): Promise<void> {
        const screenshotUrls: string[] = [];
        const videoUrls: string[] = [];
        let totalUploadSize = 0;

        // Upload screenshots
        for (const file of data.screenshots) {
            const filePath = `tasks/${taskId}/proofs/screenshots/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, filePath);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            screenshotUrls.push(downloadURL);
            totalUploadSize += file.size;
        }

        // Upload videos
        for (const file of data.videos) {
            const filePath = `tasks/${taskId}/proofs/videos/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, filePath);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            videoUrls.push(downloadURL);
            totalUploadSize += file.size;
        }

        // Track storage usage for proof of task files
        if (totalUploadSize > 0) {
            try {
                const { ProfileService } = await import('./profile-service');
                const profile = await ProfileService.getUserProfile(userId);
                if (profile?.username) {
                    const { StorageQuotaService } = await import('./storage-quota-service');
                    const mailAddress = `${profile.username}@connekt.com`;
                    await StorageQuotaService.updateProofOfTaskUsage(
                        mailAddress,
                        totalUploadSize,
                        data.screenshots.length + data.videos.length
                    );
                }
            } catch (error) {
                console.error('Failed to update storage quota for POT:', error);
            }
        }

        // Call the existing submitProof method
        await this.submitProof(taskId, {
            submittedBy: userId,
            submittedByUsername: username,
            screenshots: screenshotUrls,
            videos: videoUrls,
            links: data.links,
            notes: data.notes
        });
    },

    /**
     * Validate Proof of Task (wrapper for reviewProof)
     */
    async validateProofOfTask(
        taskId: string,
        validatorId: string,
        validatorUsername: string,
        decision: 'approved' | 'rejected' | 'revision-requested',
        notes?: string
    ): Promise<void> {
        await this.reviewProof(taskId, decision, notes, validatorId, validatorUsername);
    },

    /**
     * Submit Proof of Task
     */
    async submitProof(taskId: string, proofData: Omit<ProofOfTask, 'taskId' | 'submittedAt' | 'status'>) {
        const taskRef = doc(db, 'tasks', taskId);

        const proof: ProofOfTask = {
            taskId,
            ...proofData,
            status: 'pending',
            submittedAt: new Date().toISOString() // Use ISO string for easier frontend parsing or serverTimestamp() if preferred
        };

        await updateDoc(taskRef, {
            proofOfTask: proof,
            status: 'pending-validation',
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Review Proof of Task
     */
    async reviewProof(taskId: string, status: 'approved' | 'rejected' | 'revision-requested', notes?: string, validatorId?: string, validatorUsername?: string) {
        const taskRef = doc(db, 'tasks', taskId);
        const taskSnap = await getDoc(taskRef);

        if (!taskSnap.exists()) throw new Error('Task not found');

        const currentProof = taskSnap.data().proofOfTask;

        const updatedProof = {
            ...currentProof,
            status,
            validatedBy: validatorId,
            validatedByUsername: validatorUsername,
            validatedAt: new Date().toISOString(),
            validationNotes: notes
        };

        const updates: any = {
            proofOfTask: updatedProof,
            updatedAt: serverTimestamp()
        };

        if (status === 'approved') {
            updates.status = 'done';
            // Here you might trigger payment release via ContractService integration
        } else if (status === 'rejected' || status === 'revision-requested') {
            updates.status = 'in-progress'; // Send back to in-progress
        }

        await updateDoc(taskRef, updates);
    },

    /**
     * Get task statistics for dashboard
     */
    async getTaskStats(userId: string, supervisedProjects: string[] = []) {
        // Simple implementation: fetch all user tasks and aggregate
        // In a real app, you might use aggregation queries or a dedicated stats document
        const tasks = await this.getUserTasks(userId);

        return {
            total: tasks.length,
            completed: tasks.filter(t => t.status === 'done').length,
            inProgress: tasks.filter(t => t.status === 'in-progress').length,
            pending: tasks.filter(t => t.status === 'pending-validation').length,
            todo: tasks.filter(t => t.status === 'todo').length
        };
    },

    /**
     * Get Proofs of Task to review for a supervisor
     */
    async getPotsToReview(userId: string, supervisedProjectIds: string[]): Promise<ProofOfTask[]> {
        if (!supervisedProjectIds.length) return [];

        // Firestore 'in' query is limited to 10 items.
        // For production, batches would be needed. For now, slice to 10.
        const q = query(
            collection(db, 'tasks'),
            where('projectId', 'in', supervisedProjectIds.slice(0, 10)),
            where('status', '==', 'pending-validation'),
            orderBy('updatedAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));

        // Extract the proofs
        return tasks
            .filter(t => t.proofOfTask)
            .map(t => ({
                ...t.proofOfTask!,
                submittedByUsername: t.assigneeUsername || 'Unknown'
            }));
    },

    /**
     * Check if a task can be assigned to a user based on their employment contract terms
     * Enforces working hours and working days from employment contracts
     */
    async checkAssignmentAvailability(
        userId: string,
        workspaceId: string,
        proposedDeadline: Date
    ): Promise<{ allowed: boolean; reason?: string }> {
        try {
            // Get user's employment contracts
            const contractsQuery = query(
                collection(db, 'contracts'),
                where('toUserId', '==', userId),
                where('status', '==', 'signed')
            );
            const contractsSnap = await getDocs(contractsQuery);

            // Find employment contract for this workspace
            const workspaceContract = contractsSnap.docs.find(d => {
                const data = d.data();
                return (
                    data.terms?.linkedWorkspaceId === workspaceId &&
                    data.terms?.memberType === 'employee'
                );
            });

            if (!workspaceContract) {
                return { allowed: true }; // No employment restrictions
            }

            const terms = workspaceContract.data().terms;

            // Check working days
            if (terms.workDays?.length) {
                const deadlineDay = proposedDeadline.getDay();
                if (!terms.workDays.includes(deadlineDay)) {
                    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const allowedDays = terms.workDays.map((d: number) => dayNames[d]).join(', ');
                    return {
                        allowed: false,
                        reason: `Task deadline falls on ${dayNames[deadlineDay]}, but employee only works on: ${allowedDays}`
                    };
                }
            }

            // Check working hours for same-day deadlines
            if (terms.workStartTime && terms.workEndTime) {
                const now = new Date();
                const isSameDay = proposedDeadline.toDateString() === now.toDateString();

                if (isSameDay) {
                    const [startHour, startMin] = terms.workStartTime.split(':').map(Number);
                    const [endHour, endMin] = terms.workEndTime.split(':').map(Number);

                    const deadlineHour = proposedDeadline.getHours();
                    const deadlineMin = proposedDeadline.getMinutes();
                    const deadlineTime = deadlineHour * 60 + deadlineMin;
                    const startTime = startHour * 60 + startMin;
                    const endTime = endHour * 60 + endMin;

                    if (deadlineTime < startTime || deadlineTime > endTime) {
                        return {
                            allowed: false,
                            reason: `Task deadline is outside employee's working hours (${terms.workStartTime} - ${terms.workEndTime})`
                        };
                    }
                }
            }

            return { allowed: true };
        } catch (error) {
            console.error('Error checking assignment availability:', error);
            return { allowed: true }; // Default to allowing if check fails
        }
    }
};

