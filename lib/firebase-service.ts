import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, limit, orderBy } from 'firebase/firestore';

export const FirebaseService = {
    // --- Projects ---
    async getProjects(userId: string) {
        try {
            const q = query(
                collection(db, 'projects'),
                where('ownerId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching projects:", error);
            return [];
        }
    },

    async getProjectStats(userId: string) {
        const projects = await this.getProjects(userId);
        const total = projects.length;
        const completed = projects.filter((p: any) => p.status === 'completed').length;
        const running = projects.filter((p: any) => p.status === 'in-progress').length;
        const pending = projects.filter((p: any) => p.status === 'pending').length;

        return { total, completed, running, pending };
    },

    // --- Jobs/Marketplace ---
    async getActiveJobs() {
        try {
            const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'), limit(10));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching jobs:", error);
            return [];
        }
    },

    // --- User Profile ---
    async getUserProfile(uid: string) {
        try {
            const docRef = doc(db, 'users', uid);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error("Error fetching profile:", error);
            return null;
        }
    },

    // --- Team / Collaboration (Mocked for now as we don't have a team structure yet) ---
    async getTeamMembers(userId: string) {
        // In future: Query 'teams' collection
        return [
            { name: 'Alexandra Deff', role: 'Github Project', status: 'Completed', avatar: 'A' },
            { name: 'Edwin Adenike', role: 'Auth System', status: 'In Progress', avatar: 'E' },
            { name: 'Isaac Oluwatemilorun', role: 'Search Logic', status: 'Pending', avatar: 'I' },
        ];
    }
};
