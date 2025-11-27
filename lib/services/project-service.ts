import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc, serverTimestamp, orderBy } from 'firebase/firestore';

export interface Task {
    id?: string;
    projectId: string;
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'done';
    assignee?: string; // Username
    priority: 'low' | 'medium' | 'high';
    createdAt: any;
}

export const ProjectService = {
    // Get single project details
    async getProject(projectId: string) {
        const docRef = doc(db, 'projects', projectId);
        const snap = await getDoc(docRef);
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    },

    // Get tasks for a project
    async getTasks(projectId: string) {
        const q = query(
            collection(db, 'tasks'),
            where('projectId', '==', projectId),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    },

    // Create a task
    async createTask(task: Omit<Task, 'id' | 'createdAt'>) {
        return await addDoc(collection(db, 'tasks'), {
            ...task,
            createdAt: serverTimestamp()
        });
    },

    // Update task status (Drag & Drop logic)
    async updateTaskStatus(taskId: string, status: 'todo' | 'in-progress' | 'done') {
        await updateDoc(doc(db, 'tasks', taskId), { status });
    },

    // Delete task
    async deleteTask(taskId: string) {
        await deleteDoc(doc(db, 'tasks', taskId));
    }
};
