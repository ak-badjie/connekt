import { db } from '@/lib/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit as firestoreLimit,
    startAfter,
    DocumentSnapshot
} from 'firebase/firestore';
import type { Project, Task } from '@/lib/types/workspace.types';
import type { ExtendedUserProfile, ExtendedAgencyProfile } from '@/lib/types/profile.types';
import { Agency } from '../services/agency-service';

/**
 * ExploreService
 * 
 * Manages public content discovery for the Explore marketplace:
 * - Public projects and tasks
 * - User profiles (VAs, recruiters, employers)
 * - Agency profiles
 * - Search and filtering
 */

export interface ExploreFilters {
    skills?: string[];
    budgetMin?: number;
    budgetMax?: number;
    location?: string;
    minRating?: number;
    availability?: 'available' | 'busy' | 'unavailable';
    agencyType?: 'va_collective' | 'recruiter_collective';
}

export const ExploreService = {
    /**
     * Get public projects with optional filtering
     */
    async getPublicProjects(filters?: ExploreFilters, limitCount: number = 20): Promise<Project[]> {
        let q = query(
            collection(db, 'projects'),
            where('isPublic', '==', true),
            orderBy('publishedAt', 'desc'),
            firestoreLimit(limitCount)
        );

        const snapshot = await getDocs(q);
        let projects = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Project));

        // Apply filters (client-side for now, can be optimized with indexes)
        if (filters) {
            if (filters.budgetMin !== undefined) {
                projects = projects.filter(p => p.budget >= filters.budgetMin!);
            }
            if (filters.budgetMax !== undefined) {
                projects = projects.filter(p => p.budget <= filters.budgetMax!);
            }
        }

        return projects;
    },

    /**
     * Get public tasks with optional filtering
     */
    async getPublicTasks(filters?: ExploreFilters, limitCount: number = 20): Promise<Task[]> {
        let q = query(
            collection(db, 'tasks'),
            where('isPublic', '==', true),
            orderBy('publishedAt', 'desc'),
            firestoreLimit(limitCount)
        );

        const snapshot = await getDocs(q);
        let tasks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Task));

        // Apply filters (client-side)
        if (filters) {
            if (filters.budgetMin !== undefined) {
                tasks = tasks.filter(t => t.pricing.amount >= filters.budgetMin!);
            }
            if (filters.budgetMax !== undefined) {
                tasks = tasks.filter(t => t.pricing.amount <= filters.budgetMax!);
            }
        }

        return tasks;
    },

    /**
     * Get public jobs with optional filtering
     */
    async getPublicJobs(filters?: ExploreFilters, limitCount: number = 20): Promise<any[]> {
        let q = query(
            collection(db, 'jobs'),
            where('isPublic', '==', true),
            orderBy('createdAt', 'desc'),
            firestoreLimit(limitCount)
        );

        const snapshot = await getDocs(q);
        let jobs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Apply filters (client-side)
        if (filters) {
            if (filters.budgetMin !== undefined) {
                jobs = jobs.filter((j: any) => j.salary >= filters.budgetMin!);
            }
            if (filters.budgetMax !== undefined) {
                jobs = jobs.filter((j: any) => j.salary <= filters.budgetMax!);
            }
        }

        return jobs;
    },

    /**
     * Get public agencies by type
     */
    async getPublicAgencies(
        agencyType?: 'va_collective' | 'recruiter_collective',
        limitCount: number = 20
    ): Promise<Agency[]> {
        let q;

        if (agencyType) {
            q = query(
                collection(db, 'agencies'),
                where('agencyType', '==', agencyType),
                orderBy('createdAt', 'desc'),
                firestoreLimit(limitCount)
            );
        } else {
            q = query(
                collection(db, 'agencies'),
                orderBy('createdAt', 'desc'),
                firestoreLimit(limitCount)
            );
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Agency));
    },

    /**
     * Get public user profiles by role
     */
    async getPublicUserProfiles(
        role?: 'va' | 'employer' | 'recruiter',
        filters?: ExploreFilters,
        limitCount: number = 20
    ): Promise<ExtendedUserProfile[]> {
        let q;

        if (role) {
            q = query(
                collection(db, 'user_profiles'),
                where('role', '==', role),
                orderBy('createdAt', 'desc'),
                firestoreLimit(limitCount)
            );
        } else {
            q = query(
                collection(db, 'user_profiles'),
                orderBy('createdAt', 'desc'),
                firestoreLimit(limitCount)
            );
        }

        const snapshot = await getDocs(q);
        let profiles = snapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
        } as ExtendedUserProfile));

        // Apply filters
        if (filters) {
            if (filters.skills && filters.skills.length > 0) {
                profiles = profiles.filter(p =>
                    filters.skills!.some(skill => p.skills.includes(skill))
                );
            }
            if (filters.location) {
                profiles = profiles.filter(p =>
                    p.location?.toLowerCase().includes(filters.location!.toLowerCase())
                );
            }
            if (filters.minRating !== undefined) {
                profiles = profiles.filter(p => p.stats.averageRating >= filters.minRating!);
            }
            if (filters.availability) {
                profiles = profiles.filter(p => p.availability === filters.availability);
            }
        }

        return profiles;
    },

    /**
     * Global search across projects, tasks, users, and agencies
     */
    async searchExplore(
        searchQuery: string,
        type?: 'projects' | 'tasks' | 'users' | 'agencies',
        limitCount: number = 20
    ): Promise<{
        projects: Project[];
        tasks: Task[];
        users: ExtendedUserProfile[];
        agencies: Agency[];
    }> {
        const results = {
            projects: [] as Project[],
            tasks: [] as Task[],
            users: [] as ExtendedUserProfile[],
            agencies: [] as Agency[]
        };

        const lowerQuery = searchQuery.toLowerCase();

        // Search projects
        if (!type || type === 'projects') {
            const projects = await this.getPublicProjects(undefined, 50);
            results.projects = projects.filter(p =>
                p.title.toLowerCase().includes(lowerQuery) ||
                p.description.toLowerCase().includes(lowerQuery)
            ).slice(0, limitCount);
        }

        // Search tasks
        if (!type || type === 'tasks') {
            const tasks = await this.getPublicTasks(undefined, 50);
            results.tasks = tasks.filter(t =>
                t.title.toLowerCase().includes(lowerQuery) ||
                t.description.toLowerCase().includes(lowerQuery)
            ).slice(0, limitCount);
        }

        // Search users
        if (!type || type === 'users') {
            const users = await this.getPublicUserProfiles(undefined, undefined, 50);
            results.users = users.filter(u =>
                u.displayName.toLowerCase().includes(lowerQuery) ||
                u.username.toLowerCase().includes(lowerQuery) ||
                u.bio?.toLowerCase().includes(lowerQuery) ||
                u.skills.some(skill => skill.toLowerCase().includes(lowerQuery))
            ).slice(0, limitCount);
        }

        // Search agencies
        if (!type || type === 'agencies') {
            const agencies = await this.getPublicAgencies(undefined, 50);
            results.agencies = agencies.filter(a =>
                a.name.toLowerCase().includes(lowerQuery) ||
                a.username.toLowerCase().includes(lowerQuery)
            ).slice(0, limitCount);
        }

        return results;
    },

    /**
     * Get recommended content for a user based on their role
     */
    async getRecommendedForUser(
        userId: string,
        userRole: 'va' | 'employer' | 'recruiter',
        limitCount: number = 10
    ): Promise<{
        projects: Project[];
        tasks: Task[];
        users: ExtendedUserProfile[];
        agencies: Agency[];
    }> {
        const results = {
            projects: [] as Project[],
            tasks: [] as Task[],
            users: [] as ExtendedUserProfile[],
            agencies: [] as Agency[]
        };

        // VAs see jobs and recruiters
        if (userRole === 'va') {
            results.projects = await this.getPublicProjects(undefined, limitCount);
            results.tasks = await this.getPublicTasks(undefined, limitCount);
            results.users = await this.getPublicUserProfiles('recruiter', undefined, limitCount);
            results.agencies = await this.getPublicAgencies('recruiter_collective', limitCount);
        }

        // Employers see VAs and VA agencies
        if (userRole === 'employer') {
            results.users = await this.getPublicUserProfiles('va', undefined, limitCount);
            results.agencies = await this.getPublicAgencies('va_collective', limitCount);
        }

        // Recruiters see VAs
        if (userRole === 'recruiter') {
            results.users = await this.getPublicUserProfiles('va', undefined, limitCount);
            results.agencies = await this.getPublicAgencies('va_collective', limitCount);
        }

        return results;
    }
};
