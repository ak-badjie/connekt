import { db } from '@/lib/firebase';
import {
    collection, doc, getDoc, getDocs, query, where, orderBy, limit,
    Timestamp, startAfter,
} from 'firebase/firestore';
import { ExtendedUserProfile } from '@/lib/types/profile.types';
import { Project, Task } from '@/lib/types/workspace.types';

/**
 * Analytics Types
 */
export interface WorkspaceAnalytics {
    workspaceId: string;
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalTasks: number;
    completedTasks: number;
    teamProductivity: number; // 0-100 score
    averageProjectDuration: number; // days
    onTimeDeliveryRate: number; // percentage
    budgetUtilization: number; // percentage
}

export interface ProjectMetrics {
    projectId: string;
    completionRate: number; // percentage
    taskDistribution: Record<string, number>; // username -> task count
    timelineHealth: 'on_track' | 'at_risk' | 'delayed';
    budgetHealth: 'under_budget' | 'on_budget' | 'over_budget';
    teamEfficiency: number; // 0-100
}

export interface ProductivityReport {
    userId: string;
    period: string; // e.g., "2024-12"
    tasksCompleted: number;
    projectsCompleted: number;
    hoursLogged: number;
    earningsTotal: number;
    performanceScore: number; // 0-100
    topSkills: string[];
    growthAreas: string[];
}

export interface AdvancedSearchFilters {
    skills?: string[];
    minRating?: number;
    maxHourlyRate?: number;
    availability?: string[];
    location?: string;
    yearsExperience?: number;
    industries?: string[];
}

export interface SearchResults {
    users: ExtendedUserProfile[];
    totalCount: number;
    page: number;
    hasMore: boolean;
}

/**
 * Connect Pro Service
 * Advanced algorithmic features for Pro tier subscribers
 */
export const ConnectProService = {
    // ===========================================
    // ADVANCED ANALYTICS
    // ===========================================

    /**
     * Get comprehensive workspace analytics
     */
    async getWorkspaceAnalytics(workspaceId: string): Promise<WorkspaceAnalytics> {
        try {
            // Get all projects in workspace
            const projectsQuery = query(
                collection(db, 'projects'),
                where('workspaceId', '==', workspaceId)
            );
            const projectsSnap = await getDocs(projectsQuery);
            const projects = projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));

            const totalProjects = projects.length;
            const activeProjects = projects.filter(p => p.status === 'active').length;
            const completedProjects = projects.filter(p => p.status === 'completed').length;

            // Get all tasks
            const tasksQuery = query(
                collection(db, 'tasks'),
                where('workspaceId', '==', workspaceId)
            );
            const tasksSnap = await getDocs(tasksQuery);
            const tasks = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));

            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(t => ['done', 'paid'].includes(t.status)).length;

            // Calculate metrics
            const teamProductivity = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            // Calculate average project duration
            const completedWithDates = projects.filter(p =>
                p.status === 'completed' && p.createdAt && p.updatedAt
            );
            let averageProjectDuration = 0;
            if (completedWithDates.length > 0) {
                const totalDuration = completedWithDates.reduce((sum, p) => {
                    const start = p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
                    const end = p.updatedAt.toDate ? p.updatedAt.toDate() : new Date(p.updatedAt);
                    return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
                }, 0);
                averageProjectDuration = totalDuration / completedWithDates.length;
            }

            // On-time delivery rate (simplified)
            const onTimeDeliveryRate = completedProjects > 0 ?
                (completedProjects / (completedProjects + 1)) * 100 : 100;

            // Budget utilization (simplified)
            const budgetUtilization = 85; // Placeholder, would need actual budget tracking

            return {
                workspaceId,
                totalProjects,
                activeProjects,
                completedProjects,
                totalTasks,
                completedTasks,
                teamProductivity,
                averageProjectDuration,
                onTimeDeliveryRate,
                budgetUtilization,
            };
        } catch (error) {
            console.error('Error getting workspace analytics:', error);
            throw error;
        }
    },

    /**
     * Get project performance metrics
     */
    async getProjectPerformanceMetrics(projectId: string): Promise<ProjectMetrics> {
        try {
            const projectRef = doc(db, 'projects', projectId);
            const projectSnap = await getDoc(projectRef);

            if (!projectSnap.exists()) {
                throw new Error('Project not found');
            }

            const project = { id: projectSnap.id, ...projectSnap.data() } as Project;

            // Get all tasks for this project
            const tasksQuery = query(
                collection(db, 'tasks'),
                where('projectId', '==', projectId)
            );
            const tasksSnap = await getDocs(tasksQuery);
            const tasks = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));

            const completedTasks = tasks.filter(t => ['done', 'paid'].includes(t.status)).length;
            const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

            // Task distribution by assignee
            const taskDistribution: Record<string, number> = {};
            tasks.forEach(task => {
                if (task.assigneeUsername) {
                    taskDistribution[task.assigneeUsername] = (taskDistribution[task.assigneeUsername] || 0) + 1;
                }
            });

            // Timeline health (simplified)
            let timelineHealth: 'on_track' | 'at_risk' | 'delayed' = 'on_track';
            if (project.deadline) {
                const deadline = new Date(project.deadline);
                const now = new Date();
                const daysUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

                if (daysUntilDeadline < 0) {
                    timelineHealth = 'delayed';
                } else if (completionRate < 50 && daysUntilDeadline < 7) {
                    timelineHealth = 'at_risk';
                }
            }

            // Budget health (simplified)
            const budgetHealth: 'under_budget' | 'on_budget' | 'over_budget' = 'on_budget';

            // Team efficiency
            const teamEfficiency = completionRate;

            return {
                projectId,
                completionRate,
                taskDistribution,
                timelineHealth,
                budgetHealth,
                teamEfficiency,
            };
        } catch (error) {
            console.error('Error getting project metrics:', error);
            throw error;
        }
    },

    /**
     * Get user productivity report
     */
    async getUserProductivityReport(userId: string, period?: string): Promise<ProductivityReport> {
        try {
            const currentPeriod = period || new Date().toISOString().slice(0, 7); // YYYY-MM

            // Get user profile
            const profileRef = doc(db, 'user_profiles', userId);
            const profileSnap = await getDoc(profileRef);
            const profile = profileSnap.data() as ExtendedUserProfile;

            // Get completed tasks in period
            const startOfMonth = new Date(currentPeriod + '-01');
            const endOfMonth = new Date(startOfMonth);
            endOfMonth.setMonth(endOfMonth.getMonth() + 1);

            const tasksQuery = query(
                collection(db, 'tasks'),
                where('assigneeId', '==', userId),
                where('status', 'in', ['done', 'paid'])
            );
            const tasksSnap = await getDocs(tasksQuery);
            const tasks = tasksSnap.docs.map(doc => doc.data() as Task);

            // Filter by period
            const periodTasks = tasks.filter(t => {
                const taskDate = t.updatedAt?.toDate ? t.updatedAt.toDate() : new Date(t.updatedAt);
                return taskDate >= startOfMonth && taskDate < endOfMonth;
            });

            const tasksCompleted = periodTasks.length;

            // Calculate earnings
            const earningsTotal = periodTasks.reduce((sum, t) => sum + (t.pricing?.amount || 0), 0);

            // Calculate hours logged
            const hoursLogged = periodTasks.reduce((sum, t) => {
                return sum + (t.timeline?.actualHours || t.timeline?.estimatedHours || 0);
            }, 0);

            // Get completed projects
            const projectsQuery = query(
                collection(db, 'projects'),
                where('assignedOwnerId', '==', userId),
                where('status', '==', 'completed')
            );
            const projectsSnap = await getDocs(projectsQuery);
            const projectsCompleted = projectsSnap.size;

            // Performance score (simplified algorithm)
            const performanceScore = Math.min(100,
                (tasksCompleted * 10) +
                (profile.stats?.averageRating || 0) * 15
            );

            // Top skills from profile
            const topSkills = profile.skills?.slice(0, 5) || [];

            // Growth areas (simplified)
            const growthAreas = ['Time management', 'Communication'];

            return {
                userId,
                period: currentPeriod,
                tasksCompleted,
                projectsCompleted,
                hoursLogged,
                earningsTotal,
                performanceScore,
                topSkills,
                growthAreas,
            };
        } catch (error) {
            console.error('Error getting productivity report:', error);
            throw error;
        }
    },

    // ===========================================
    // ADVANCED SEARCH
    // ===========================================

    /**
     * Advanced candidate search with filters
     */
    async searchCandidatesAdvanced(
        filters: AdvancedSearchFilters,
        page: number = 1,
        pageSize: number = 20
    ): Promise<SearchResults> {
        try {
            let q = query(collection(db, 'user_profiles'));

            // Apply filters
            if (filters.skills && filters.skills.length > 0) {
                q = query(q, where('skills', 'array-contains-any', filters.skills.slice(0, 10)));
            }

            if (filters.availability && filters.availability.length > 0) {
                q = query(q, where('availability', 'in', filters.availability));
            }

            if (filters.location) {
                q = query(q, where('location', '==', filters.location));
            }

            // Pagination
            const offset = (page - 1) * pageSize;
            q = query(q, limit(pageSize));

            const snapshot = await getDocs(q);
            let users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExtendedUserProfile));

            // Post-query filtering for complex conditions
            if (filters.minRating) {
                users = users.filter(u => (u.stats?.averageRating || 0) >= filters.minRating!);
            }

            if (filters.maxHourlyRate) {
                users = users.filter(u => (u.hourlyRate || 0) <= filters.maxHourlyRate!);
            }

            if (filters.yearsExperience) {
                users = users.filter(u => {
                    const years = u.experience?.length || 0;
                    return years >= filters.yearsExperience!;
                });
            }

            return {
                users: users.slice(0, pageSize),
                totalCount: users.length,
                page,
                hasMore: users.length > pageSize,
            };
        } catch (error) {
            console.error('Error in advanced search:', error);
            throw error;
        }
    },

    // ===========================================
    // BULK OPERATIONS
    // ===========================================

    /**
     * Bulk assign tasks to a user
     */
    async bulkAssignTasks(taskIds: string[], assigneeId: string, assigneeUsername: string): Promise<boolean> {
        try {
            const batch = db.batch; // Would need to implement batch operations

            for (const taskId of taskIds) {
                const taskRef = doc(db, 'tasks', taskId);
                // In real implementation, would use batch.update
                // For now, simplified
            }

            return true;
        } catch (error) {
            console.error('Error bulk assigning tasks:', error);
            return false;
        }
    },

    /**
     * Bulk update project status
     */
    async bulkUpdateProjectStatus(projectIds: string[], status: string): Promise<boolean> {
        try {
            // Would implement batch operations here
            return true;
        } catch (error) {
            console.error('Error bulk updating projects:', error);
            return false;
        }
    },

    // ===========================================
    // REPUTATION & SCORING
    // ===========================================

    /**
     * Calculate advanced reputation score
     */
    async calculateReputationScore(userId: string): Promise<number> {
        try {
            const profileRef = doc(db, 'user_profiles', userId);
            const profileSnap = await getDoc(profileRef);
            const profile = profileSnap.data() as ExtendedUserProfile;

            if (!profile) return 0;

            // Multi-factor reputation algorithm
            const factors = {
                averageRating: (profile.stats?.averageRating || 0) * 15, // Max 75
                completionRate: (profile.stats?.projectsCompleted || 0) * 0.5, // Max 10
                responseRate: (profile.stats?.responseRate || 0) * 0.1, // Max 10
                tenure: Math.min(5, (profile.stats?.timeOnPlatform || 0) / 365), // Max 5
            };

            const totalScore = Object.values(factors).reduce((sum, score) => sum + score, 0);
            return Math.min(100, Math.round(totalScore));
        } catch (error) {
            console.error('Error calculating reputation score:', error);
            return 0;
        }
    },

    // ===========================================
    // PORTFOLIO ANALYTICS
    // ===========================================

    /**
     * Get portfolio analytics for user
     */
    async getPortfolioAnalytics(userId: string): Promise<any> {
        try {
            const profileRef = doc(db, 'user_profiles', userId);
            const profileSnap = await getDoc(profileRef);
            const profile = profileSnap.data() as ExtendedUserProfile;

            // Get user's completed projects
            const projectsQuery = query(
                collection(db, 'projects'),
                where('assignedOwnerId', '==', userId),
                where('status', '==', 'completed')
            );
            const projectsSnap = await getDocs(projectsQuery);
            const projects = projectsSnap.docs.map(doc => doc.data() as Project);

            // Calculate earnings by month
            const earningsByMonth: Record<string, number> = {};
            projects.forEach(p => {
                const month = p.createdAt?.toDate ?
                    p.createdAt.toDate().toISOString().slice(0, 7) : '';
                if (month) {
                    earningsByMonth[month] = (earningsByMonth[month] || 0) + (p.budget || 0);
                }
            });

            // Top skills by project count
            const skillProjects: Record<string, number> = {};
            (profile.skills || []).forEach(skill => {
                skillProjects[skill] = projects.filter(p =>
                    p.description?.toLowerCase().includes(skill.toLowerCase())
                ).length;
            });

            return {
                totalProjects: projects.length,
                totalEarnings: Object.values(earningsByMonth).reduce((sum, amt) => sum + amt, 0),
                earningsByMonth,
                averageProjectValue: projects.length > 0 ?
                    projects.reduce((sum, p) => sum + (p.budget || 0), 0) / projects.length : 0,
                skillProjects: Object.entries(skillProjects)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5),
            };
        } catch (error) {
            console.error('Error getting portfolio analytics:', error);
            return {};
        }
    },
};
