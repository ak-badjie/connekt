import { db } from '@/lib/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    addDoc,
    serverTimestamp,
    orderBy,
    limit,
    DocumentData,
    Timestamp,
    increment
} from 'firebase/firestore';

// --- Types (Exported for reuse) ---

export interface UserProfile {
    uid: string;
    username?: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
    role: 'employer' | 'va' | 'agency' | 'admin';
    subRole?: string; // For admin users
    bio?: string;
    skills?: string[];
    onboardingCompleted: boolean;
    introSeen?: boolean; // For post-onboarding intro flow
    agencyId?: string; // If they belong to an agency
    createdAt: any;
}

export interface Project {
    id?: string;
    ownerId: string;
    title: string;
    description: string;
    budget: number;
    deadline: string;
    status: 'active' | 'completed' | 'on-hold';
    createdAt: any;
}

export interface Task {
    id?: string;
    projectId: string;
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'done' | 'paid'; // Added 'paid'
    priority: 'low' | 'medium' | 'high';
    assignee?: string; // Username
    value?: number; // For milestone payments
    createdAt: any;
}

export interface Job {
    id?: string;
    ownerId: string;
    title: string;
    description: string;
    budget: string;
    type: 'fixed' | 'hourly';
    skills: string[];
    location?: string;
    timezone?: string;
    language?: string;
    createdAt: any;
}

export interface Transaction {
    id?: string;
    fromId: string;
    toId: string;
    amount: number;
    type: 'payment' | 'deposit' | 'withdrawal';
    status: 'pending' | 'completed' | 'failed';
    taskId?: string; // If linked to a task
    createdAt: any;
}

export const FirestoreService = {

    // ==========================================
    // USER & IDENTITY MANAGEMENT
    // ==========================================

    async createUserProfile(uid: string, data: Partial<UserProfile>) {
        await setDoc(doc(db, 'users', uid), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }, { merge: true });
    },

    async getUserProfile(uid: string): Promise<UserProfile | null> {
        const snap = await getDoc(doc(db, 'users', uid));
        return snap.exists() ? (snap.data() as UserProfile) : null;
    },

    async checkUsernameAvailability(username: string): Promise<boolean> {
        if (!username) return false;
        const snap = await getDoc(doc(db, 'usernames', username.toLowerCase()));
        return !snap.exists();
    },

    async reserveUsername(username: string, uid: string) {
        await setDoc(doc(db, 'usernames', username.toLowerCase()), { uid });
    },

    async getUidByUsername(username: string): Promise<string | null> {
        const snap = await getDoc(doc(db, 'usernames', username.toLowerCase()));
        return snap.exists() ? snap.data().uid : null;
    },

    // ==========================================
    // PROJECTS & WORKSPACE
    // ==========================================

    async createProject(project: Omit<Project, 'id' | 'createdAt'>) {
        return await addDoc(collection(db, 'projects'), {
            ...project,
            createdAt: serverTimestamp()
        });
    },

    async getProjects(userId: string, role: string) {
        // If VA/Agency, might need to query 'members' subcollection in future
        // For now, simple owner check
        const q = query(
            collection(db, 'projects'),
            where('ownerId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Project));
    },

    async getProjectById(projectId: string): Promise<Project | null> {
        const snap = await getDoc(doc(db, 'projects', projectId));
        return snap.exists() ? ({ id: snap.id, ...snap.data() } as Project) : null;
    },

    async getProjectStats(userId: string) {
        const projects = await this.getProjects(userId, 'employer'); // logic can expand
        const total = projects.length;
        const completed = projects.filter(p => p.status === 'completed').length;
        const active = projects.filter(p => p.status === 'active').length;
        const pending = projects.filter(p => p.status === 'on-hold').length;

        return { total, completed, running: active, pending };
    },

    // ==========================================
    // TASKS (KANBAN)
    // ==========================================

    async createTask(task: Omit<Task, 'id' | 'createdAt'>) {
        return await addDoc(collection(db, 'tasks'), {
            ...task,
            createdAt: serverTimestamp()
        });
    },

    async getTasks(projectId: string) {
        const q = query(
            collection(db, 'tasks'),
            where('projectId', '==', projectId),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Task));
    },

    async updateTaskStatus(taskId: string, status: Task['status']) {
        await updateDoc(doc(db, 'tasks', taskId), { status });
    },

    async deleteTask(taskId: string) {
        await deleteDoc(doc(db, 'tasks', taskId));
    },

    // ==========================================
    // JOBS & MARKETPLACE
    // ==========================================

    async createJob(job: Omit<Job, 'id' | 'createdAt'>) {
        return await addDoc(collection(db, 'jobs'), {
            ...job,
            createdAt: serverTimestamp()
        });
    },

    async getJobs(limitCount = 20) {
        const q = query(
            collection(db, 'jobs'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Job));
    },

    async getJobById(jobId: string): Promise<Job | null> {
        const snap = await getDoc(doc(db, 'jobs', jobId));
        return snap.exists() ? ({ id: snap.id, ...snap.data() } as Job) : null;
    },

    // ==========================================
    // AGENCY MANAGEMENT
    // ==========================================

    async createAgency(ownerId: string, data: any) {
        const agencyRef = await addDoc(collection(db, 'agencies'), {
            ownerId,
            ...data,
            members: [ownerId], // Owner is first member
            createdAt: serverTimestamp()
        });

        // Link owner to agency
        await updateDoc(doc(db, 'users', ownerId), {
            agencyId: agencyRef.id,
            role: 'agency' // Upgrade role
        });

        return agencyRef.id;
    },

    async getAgency(agencyId: string) {
        const snap = await getDoc(doc(db, 'agencies', agencyId));
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    },

    // ==========================================
    // WALLET & TRANSACTIONS (Basic)
    // ==========================================

    async releasePayment(taskId: string, amount: number, fromUid: string, toUsername: string) {
        // 1. Get Recipient UID
        const toUid = await this.getUidByUsername(toUsername);
        if (!toUid) throw new Error("Recipient not found");

        // 2. Create Transaction Record
        await addDoc(collection(db, 'transactions'), {
            fromId: fromUid,
            toId: toUid,
            amount: amount,
            taskId: taskId,
            type: 'payment',
            status: 'completed',
            createdAt: serverTimestamp()
        });

        // 3. Mark Task as Paid
        await updateDoc(doc(db, 'tasks', taskId), { status: 'paid' });

        // Note: Real balance updates would require Cloud Functions or Transactions
        // to safely increment/decrement wallet fields atomically.
    }
};
