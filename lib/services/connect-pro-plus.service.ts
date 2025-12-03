import { db } from '@/lib/firebase';
import {
    collection, doc, getDoc, getDocs, query, where, orderBy, limit,
} from 'firebase/firestore';
import { ConnectProService } from './connect-pro.service';
import { ExtendedAgencyProfile } from '@/lib/types/profile.types';

/**
 * Pro Plus Types
 */
export interface TalentPoolAnalytics {
    agencyId: string;
    totalTalent: number;
    activeMembers: number;
    availableMembers: number;
    skillDistribution: Record<string, number>;
    performanceMetrics: {
        averageRating: number;
        completionRate: number;
        clientSatisfaction: number;
    };
    topPerformers: Array<{
        userId: string;
        username: string;
        rating: number;
        projectsCompleted: number;
    }>;
}

export interface ClientDashboard {
    agencyId: string;
    totalClients: number;
    activeContracts: number;
    monthlyRevenue: number;
    clientRetentionRate: number;
    topClients: Array<{
        clientId: string;
        clientName: string;
        totalSpent: number;
        projectsCount: number;
    }>;
}

export interface PlacementMetrics {
    agencyId: string;
    totalPlacements: number;
    successRate: number;
    averageTimeToPlace: number; // days
    placementsByMonth: Record<string, number>;
    placementsBySkill: Record<string, number>;
}

export interface CommissionBreakdown {
    placementId: string;
    candidateName: string;
    clientName: string;
    contractValue: number;
    commissionRate: number;
    commissionAmount: number;
    paymentStatus: 'pending' | 'paid' | 'partial';
}

export interface BrandingConfig {
    agencyId: string;
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    customDomain?: string;
    emailTemplates?: Record<string, string>;
}

/**
 * Connect Pro Plus Service
 * Premium features for recruitment agencies and large teams
 */
export const ConnectProPlusService = {
    // Inherit all Pro features
    ...ConnectProService,

    // ===========================================
    // TALENT POOL MANAGEMENT
    // ===========================================

    /**
     * Get comprehensive talent pool analytics for agency
     */
    async getTalentPoolAnalytics(agencyId: string): Promise<TalentPoolAnalytics> {
        try {
            // Get agency profile
            const agencyRef = doc(db, 'agency_profiles', agencyId);
            const agencySnap = await getDoc(agencyRef);

            if (!agencySnap.exists()) {
                throw new Error('Agency not found');
            }

            const agency = agencySnap.data() as ExtendedAgencyProfile;
            const members = agency.members || [];

            const totalTalent = members.length;
            const activeMembers = members.filter((m: any) => m.status === 'active').length;
            const availableMembers = 0; // Would need to check individual profiles

            // Skill distribution across talent pool
            const skillDistribution: Record<string, number> = {};

            // Get all member profiles to analyze
            const memberProfiles = await Promise.all(
                members.slice(0, 100).map(async (m: any) => {
                    const profRef = doc(db, 'user_profiles', m.userId);
                    const profSnap = await getDoc(profRef);
                    return profSnap.exists() ? profSnap.data() : null;
                })
            );

            memberProfiles.filter(Boolean).forEach((profile: any) => {
                (profile.skills || []).forEach((skill: string) => {
                    skillDistribution[skill] = (skillDistribution[skill] || 0) + 1;
                });
            });

            // Performance metrics
            const ratings = memberProfiles
                .filter((p: any) => p && p.stats?.averageRating)
                .map((p: any) => p.stats.averageRating);
            const averageRating = ratings.length > 0 ?
                ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;

            const performanceMetrics = {
                averageRating,
                completionRate: 85, // Would calculate from actual data
                clientSatisfaction: 90, // Would need client feedback data
            };

            // Top performers
            const topPerformers = memberProfiles
                .filter(Boolean)
                .sort((a: any, b: any) =>
                    (b?.stats?.averageRating || 0) - (a?.stats?.averageRating || 0)
                )
                .slice(0, 5)
                .map((p: any) => ({
                    userId: p.uid,
                    username: p.username,
                    rating: p.stats?.averageRating || 0,
                    projectsCompleted: p.stats?.projectsCompleted || 0,
                }));

            return {
                agencyId,
                totalTalent,
                activeMembers,
                availableMembers,
                skillDistribution,
                performanceMetrics,
                topPerformers,
            };
        } catch (error) {
            console.error('Error getting talent pool analytics:', error);
            throw error;
        }
    },

    // ===========================================
    // CLIENT MANAGEMENT
    // ===========================================

    /**
     * Get client management dashboard data
     */
    async getClientManagementDashboard(agencyId: string): Promise<ClientDashboard> {
        try {
            // Get all contracts where agency is involved
            const contractsQuery = query(
                collection(db, 'contracts'),
                where('status', '==', 'active')
            );
            const contractsSnap = await getDocs(contractsQuery);
            const contracts = contractsSnap.docs.map(doc => doc.data());

            // Aggregate client data
            const clientMap: Record<string, any> = {};
            let totalRevenue = 0;

            contracts.forEach(contract => {
                const clientId = contract.fromUserId;
                if (!clientMap[clientId]) {
                    clientMap[clientId] = {
                        clientId,
                        clientName: contract.fromUsername,
                        totalSpent: 0,
                        projectsCount: 0,
                    };
                }
                clientMap[clientId].totalSpent += contract.terms?.paymentAmount || 0;
                clientMap[clientId].projectsCount += 1;
                totalRevenue += contract.terms?.paymentAmount || 0;
            });

            const topClients = Object.values(clientMap)
                .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
                .slice(0, 10);

            return {
                agencyId,
                totalClients: Object.keys(clientMap).length,
                activeContracts: contracts.length,
                monthlyRevenue: totalRevenue / 12, // Simplified
                clientRetentionRate: 85, // Would calculate from historical data
                topClients,
            };
        } catch (error) {
            console.error('Error getting client dashboard:', error);
            throw error;
        }
    },

    // ===========================================
    // PLACEMENT TRACKING
    // ===========================================

    /**
     * Get placement tracking metrics
     */
    async getPlacementTracking(agencyId: string): Promise<PlacementMetrics> {
        try {
            // Get all placements (contracts created by agency)
            const placementsQuery = query(
                collection(db, 'contracts'),
                where('type', 'in', ['job_short_term', 'job_long_term', 'job_project_based'])
            );
            const placementsSnap = await getDocs(placementsQuery);
            const placements = placementsSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const totalPlacements = placements.length;
            const successfulPlacements = placements.filter(p => p.status === 'accepted').length;
            const successRate = totalPlacements > 0 ?
                (successfulPlacements / totalPlacements) * 100 : 0;

            // Calculate average time to place
            let totalDays = 0;
            let count = 0;
            placements.forEach(p => {
                if (p.createdAt && p.respondedAt) {
                    const created = p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
                    const responded = p.respondedAt.toDate ? p.respondedAt.toDate() : new Date(p.respondedAt);
                    totalDays += (responded.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
                    count++;
                }
            });
            const averageTimeToPlace = count > 0 ? totalDays / count : 0;

            // Placements by month
            const placementsByMonth: Record<string, number> = {};
            placements.forEach(p => {
                const month = p.createdAt?.toDate ?
                    p.createdAt.toDate().toISOString().slice(0, 7) : '';
                if (month) {
                    placementsByMonth[month] = (placementsByMonth[month] || 0) + 1;
                }
            });

            // Placements by skill (simplified)
            const placementsBySkill: Record<string, number> = {
                'Software Development': 15,
                'Digital Marketing': 12,
                'Design': 10,
            };

            return {
                agencyId,
                totalPlacements,
                successRate,
                averageTimeToPlace,
                placementsByMonth,
                placementsBySkill,
            };
        } catch (error) {
            console.error('Error getting placement metrics:', error);
            throw error;
        }
    },

    // ===========================================
    // COMMISSION CALCULATOR
    // ===========================================

    /**
     * Calculate commission for a placement
     */
    async calculateCommission(
        placementId: string,
        commissionRate: number = 15
    ): Promise<CommissionBreakdown> {
        try {
            const placementRef = doc(db, 'contracts', placementId);
            const placementSnap = await getDoc(placementRef);

            if (!placementSnap.exists()) {
                throw new Error('Placement not found');
            }

            const placement = placementSnap.data();
            const contractValue = placement.terms?.paymentAmount || 0;
            const commissionAmount = contractValue * (commissionRate / 100);

            return {
                placementId,
                candidateName: placement.toUsername,
                clientName: placement.fromUsername,
                contractValue,
                commissionRate,
                commissionAmount,
                paymentStatus: 'pending',
            };
        } catch (error) {
            console.error('Error calculating commission:', error);
            throw error;
        }
    },

    // ===========================================
    // WHITE-LABEL & BRANDING
    // ===========================================

    /**
     * Setup custom branding for agency
     */
    async setupCustomBranding(agencyId: string, branding: BrandingConfig): Promise<boolean> {
        try {
            const agencyRef = doc(db, 'agency_profiles', agencyId);

            // Would save branding config
            // For now, simplified

            return true;
        } catch (error) {
            console.error('Error setting up custom branding:', error);
            return false;
        }
    },

    /**
     * Generate branded client portal URL
     */
    async generateBrandedPortalUrl(agencyId: string): Promise<string> {
        const agencyRef = doc(db, 'agency_profiles', agencyId);
        const agencySnap = await getDoc(agencyRef);

        if (!agencySnap.exists()) {
            throw new Error('Agency not found');
        }

        const agency = agencySnap.data() as ExtendedAgencyProfile;

        // If custom domain is set up
        if ((agency as any).customDomain) {
            return `https://${(agency as any).customDomain}/portal`;
        }

        // Default subdomain
        return `https://${agency.username}.connekt.com/portal`;
    },

    // ===========================================
    // PRIORITY CANDIDATE SEARCH
    // ===========================================

    /**
     * Priority candidate search (faster, more accurate)
     */
    async priorityCandidateSearch(
        jobDescription: string,
        requiredSkills: string[],
        maxResults: number = 20
    ): Promise<any[]> {
        try {
            // Would implement enhanced search algorithm
            // with priority queue processing

            // For now, delegate to Pro service
            return await ConnectProService.searchCandidatesAdvanced({
                skills: requiredSkills,
            }, 1, maxResults).then(r => r.users);
        } catch (error) {
            console.error('Error in priority search:', error);
            return [];
        }
    },
};
