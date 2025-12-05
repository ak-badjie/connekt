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
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Task));
    },

    /**
     * Get all tasks for a user (assigned to OR created by them)
     */
    async getUserTasks(userId: string): Promise<Task[]> {
        // Query for tasks assigned to the user
        const assignedQuery = query(
            collection(db, 'tasks'),
            where('assigneeId', '==', userId),
            orderBy('createdAt', 'desc')
        );

        // Query for tasks created by the user  
        const createdQuery = query(
            collection(db, 'tasks'),
            where('createdBy', '==', userId),
            orderBy('createdAt', 'desc')
        );

        const [assignedSnapshot, createdSnapshot] = await Promise.all([
            getDocs(assignedQuery),
            getDocs(createdQuery)
        ]);

        const assignedTasks = assignedSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Task));

        const createdTasks = createdSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Task));

        // Merge and deduplicate (in case user created and assigned to themselves)
        const taskMap = new Map<string, Task>();
        [...assignedTasks, ...createdTasks].forEach(task => {
            if (task.id) {
                taskMap.set(task.id, task);
            }
        });

        return Array.from(taskMap.values()).sort((a, b) => {
            const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return bTime - aTime; // Most recent first
        });
    },

    /**
     * Get pending tasks (not yet attended to) for user
     */
    async getPendingTasks(userId: string): Promise<Task[]> {
        const tasks = await this.getUserTasks(userId);
        return tasks.filter(t => t.status === 'todo');
    },

    /**
     * Get tasks with POTs awaiting approval (submitted by user)
     */
    async getTasksAwaitingApproval(userId: string): Promise<Task[]> {
        const tasks = await this.getUserTasks(userId);
        return tasks.filter(t => t.status === 'pending-validation');
    },

    /**
     * Get POTs to review (user is supervisor)
     */
    async getPotsToReview(userId: string, projectIds: string[]): Promise<ProofOfTask[]> {
        const potsToReview: ProofOfTask[] = [];

        for (const projectId of projectIds) {
            const tasks = await this.getProjectTasks(projectId);
            const pendingTasks = tasks.filter(t => t.status === 'pending-validation');

            for (const task of pendingTasks) {
                if (task.proofOfTask && task.assigneeId !== userId) {
                    potsToReview.push(task.proofOfTask);
                }
            }
        }

        return potsToReview;
    },

    /**
     * Update task status
     */
    async updateTaskStatus(taskId: string, status: Task['status']): Promise<void> {
        await updateDoc(doc(db, 'tasks', taskId), {
            status,
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Reassign task to another user
     */
    async reassignTask(
        taskId: string,
        newAssigneeId: string,
        newAssigneeUsername: string
    ): Promise<void> {
        const task = await this.getTask(taskId);
        if (!task || !task.isReassignable) {
            throw new Error('Task cannot be reassigned');
        }

        await updateDoc(doc(db, 'tasks', taskId), {
            assigneeId: newAssigneeId,
            assigneeUsername: newAssigneeUsername,
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Submit Proof of Task
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
        // Upload files to Firebase Storage
        const screenshotUrls: string[] = [];
        const videoUrls: string[] = [];

        // Upload screenshots
        for (const file of data.screenshots) {
            const storageRef = ref(storage, `pot/${taskId}/screenshots/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            screenshotUrls.push(url);
        }

        // Upload videos
        for (const file of data.videos) {
            const storageRef = ref(storage, `pot/${taskId}/videos/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            videoUrls.push(url);
        }

        const pot: Omit<ProofOfTask, 'id'> = {
            taskId,
            submittedBy: userId,
            submittedByUsername: username,
            submittedAt: serverTimestamp(),
            status: 'pending',
            screenshots: screenshotUrls,
            videos: videoUrls,
            links: data.links,
            notes: data.notes
        };

        // Update task with POT
        await updateDoc(doc(db, 'tasks', taskId), {
            proofOfTask: pot,
            status: 'pending-validation',
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Validate Proof of Task (Supervisor action)
     */
    async validateProofOfTask(
        taskId: string,
        supervisorId: string,
        supervisorUsername: string,
        decision: 'approved' | 'rejected' | 'revision-requested',
        notes?: string
    ): Promise<void> {
        const task = await this.getTask(taskId);
        if (!task || !task.proofOfTask) {
            throw new Error('Task or POT not found');
        }

        const updatedPot: ProofOfTask = {
            ...task.proofOfTask,
            status: decision,
            validatedBy: supervisorId,
            validatedByUsername: supervisorUsername,
            validatedAt: serverTimestamp(),
            validationNotes: notes
        };

        const newTaskStatus = decision === 'approved' ? 'done' :
            decision === 'revision-requested' ? 'in-progress' :
                'pending-validation';

        await updateDoc(doc(db, 'tasks', taskId), {
            proofOfTask: updatedPot,
            status: newTaskStatus,
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Create help request for a task
     */
    async createHelpRequest(data: {
        taskId: string;
        projectId: string;
        requestedBy: string;
        requestedByUsername: string;
        message: string;
        isPublic: boolean;
    }): Promise<string> {
        const helpRequest: Omit<HelpRequest, 'id'> = {
            ...data,
            status: 'open',
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'help_requests'), helpRequest);
        return docRef.id;
    },

    /**
     * Resolve help request
     */
    async resolveHelpRequest(requestId: string): Promise<void> {
        await updateDoc(doc(db, 'help_requests', requestId), {
            status: 'resolved',
            resolvedAt: serverTimestamp()
        });
    },

    /**
     * Get task statistics for dashboard
     */
    async getTaskStats(userId: string, supervisedProjectIds: string[]) {
        const [userTasks, supervisorTasks] = await Promise.all([
            this.getUserTasks(userId),
            Promise.all(supervisedProjectIds.map(id => this.getProjectTasks(id)))
        ]);

        const flatSupervisorTasks = supervisorTasks.flat();

        return {
            pendingTasks: userTasks.filter(t => t.status === 'todo').length,
            potsAwaitingApproval: userTasks.filter(t => t.status === 'pending-validation').length,
            potsToReview: flatSupervisorTasks.filter(t =>
                t.status === 'pending-validation' && t.assigneeId !== userId
            ).length,
            totalTasks: userTasks.length
        };
    },

    /**
     * Get all tasks for an agency (across all agency projects)
     */
    async getAgencyTasks(agencyId: string): Promise<Task[]> {
        // Get all agency projects
        const projectsSnapshot = await getDocs(
            query(collection(db, 'projects'))
        );

        const agencyProjectIds: string[] = [];

        // Filter projects that belong to agency workspaces
        for (const projectDoc of projectsSnapshot.docs) {
            const project = projectDoc.data();
            // Check if workspace belongs to agency
            const workspaceDoc = await getDoc(doc(db, 'workspaces', project.workspaceId));
            if (workspaceDoc.exists() && workspaceDoc.data().ownerId === agencyId) {
                agencyProjectIds.push(projectDoc.id);
            }
        }

        // Get all tasks for these projects
        const allTasks: Task[] = [];
        for (const projectId of agencyProjectIds) {
            const tasks = await this.getProjectTasks(projectId);
            allTasks.push(...tasks);
        }

        return allTasks;
    },

    /**
     * Get agency task statistics
     */
    async getAgencyTaskStats(agencyId: string) {
        const tasks = await this.getAgencyTasks(agencyId);

        return {
            total: tasks.length,
            active: tasks.filter(t => t.status === 'in-progress').length,
            pending: tasks.filter(t => t.status === 'todo').length,
            pendingValidation: tasks.filter(t => t.status === 'pending-validation').length,
            done: tasks.filter(t => t.status === 'done').length
        };
    },

    /**
     * Push task to public (Explore page)
     */
    async pushToPublic(taskId: string): Promise<void> {
        const taskRef = doc(db, 'tasks', taskId);
        await updateDoc(taskRef, {
            isPublic: true,
            publishedAt: serverTimestamp()
        });
    },

    /**
     * Remove task from public
     */
    async removeFromPublic(taskId: string): Promise<void> {
        const taskRef = doc(db, 'tasks', taskId);
        await updateDoc(taskRef, {
            isPublic: false,
            publishedAt: null
        });
    },

    /**
     * Update task budget/pricing
     */
    async updateTaskBudget(
        taskId: string,
        amount: number,
        currency: string
    ): Promise<void> {
        const task = await this.getTask(taskId);
        if (!task) throw new Error('Task not found');

        // Validate against project budget
        try {
            const { EnhancedProjectService } = await import('./enhanced-project-service');
            const budgetStatus = await EnhancedProjectService.getProjectBudgetStatus(task.projectId);

            // Calculate what the new total would be if we update this task
            const currentTaskAmount = task.pricing?.amount || 0;
            const difference = amount - currentTaskAmount;
            const newRemaining = budgetStatus.remaining - difference;

            if (budgetStatus.currency && currency !== budgetStatus.currency) {
                console.warn(`Task currency (${currency}) doesn't match project currency (${budgetStatus.currency})`);
            } else if (newRemaining < 0) {
                throw new Error(
                    `Updated task budget (${currency} ${amount}) would exceed project budget. ` +
                    `Current remaining: ${budgetStatus.remaining.toFixed(2)}, Difference: ${difference.toFixed(2)}`
                );
            }
        } catch (error: any) {
            if (error.message.includes('would exceed project budget')) {
                throw error;
            }
            console.warn('Budget validation failed:', error);
        }

        await updateDoc(doc(db, 'tasks', taskId), {
            'pricing.amount': amount,
            'pricing.currency': currency,
            updatedAt: serverTimestamp()
        });
    }
};
