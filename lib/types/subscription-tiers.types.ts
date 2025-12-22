import { Timestamp } from 'firebase/firestore';

/**
 * Subscription Tier Enum
 */
export enum SubscriptionTier {
    FREE = 'free',
    PRO = 'pro',
    PRO_PLUS = 'pro_plus',
    CONNECT_AI = 'connect_ai'
}

/**
 * Subscription Plan with pricing
 */
export interface SubscriptionPlan {
    id: string;
    tier: SubscriptionTier;
    name: string;
    description: string;
    priceMonthly: number; // in GMD
    priceYearly: number; // in GMD
    currency: 'GMD';
    features: TierFeatures;
    popular?: boolean;
}

/**
 * Feature flags per tier
 */
export interface TierFeatures {
    // AI Features
    aiResumeParser: boolean;
    aiCandidateMatching: boolean;
    aiContractDrafting: boolean;
    aiTaskGeneration: boolean;
    aiMailComposer: boolean;
    aiProfileEnhancer: boolean;
    aiJobDescriptionGenerator: boolean;
    aiTeamRecommender: boolean;
    aiMailSummarizer: boolean;
    aiTaskAutoAssignment: boolean;
    aiProjectTimelineOptimizer: boolean;
    aiMeetingScheduler: boolean;
    aiContractRiskAnalyzer: boolean;
    aiTranslation: boolean;
    aiProofreader: boolean;

    // Pro Features (Algorithmic)
    advancedAnalytics: boolean;
    customBranding: boolean;
    prioritySupport: boolean;
    advancedSearch: boolean;
    bulkOperations: boolean;
    exportReports: boolean;
    apiAccess: boolean;
    customReportBuilder: boolean;
    smartNotifications: boolean;
    reputationScore: boolean;
    portfolioAnalytics: boolean;

    // Pro Plus Features (Agencies)
    talentPoolManagement: boolean;
    clientManagementDashboard: boolean;
    placementTracking: boolean;
    commissionCalculator: boolean;
    customDomain: boolean;
    brandedClientPortal: boolean;
    whiteLabel: boolean;
    priorityCandidateSearch: boolean;

    // Quotas & Limits
    aiRequestsPerMonth: number;
    storageGB: number;
    workspaceMembers: number;
    projectsPerWorkspace: number;
    contractTemplates: number;
    teamSize: number;
    maxProjects: number;      // -1 = unlimited
    maxWorkspaces: number;    // -1 = unlimited
}

/**
 * User Subscription Record
 */
export interface UserSubscription {
    id?: string;
    userId: string;
    tier: SubscriptionTier;
    planId: string;
    status: 'active' | 'cancelled' | 'expired' | 'past_due';
    billingCycle: 'monthly' | 'yearly';

    // Payment info
    amount: number;
    currency: 'GMD';
    paymentMethod: 'wallet' | 'modem_pay';
    lastPaymentDate?: Timestamp | any;
    nextBillingDate?: Timestamp | any;

    // Timestamps
    startDate: Timestamp | any;
    endDate?: Timestamp | any;
    cancelledAt?: Timestamp | any;
    createdAt: Timestamp | any;
    updatedAt: Timestamp | any;
}

/**
 * AI Usage Tracking & Quotas
 */
export interface AIUsageQuota {
    id?: string;
    userId: string;
    tier: SubscriptionTier;
    month: string; // Format: YYYY-MM

    // Usage tracking
    requestsUsed: number;
    requestsLimit: number;
    costAccrued: number; // in USD (Gemini API costs)
    tokensUsed: number;

    // Reset tracking
    lastResetDate: Timestamp | any;
    createdAt: Timestamp | any;
    updatedAt: Timestamp | any;
}

/**
 * AI Request Log (for detailed tracking)
 */
export interface AIRequestLog {
    id?: string;
    userId: string;
    feature: string; // e.g., 'resume_parser', 'candidate_matching'
    model: string; // e.g., 'gemini-2.5-pro'
    tokensUsed: number;
    costUSD: number;
    success: boolean;
    error?: string;
    timestamp: Timestamp | any;
}

/**
 * Payment Transaction for Subscription
 */
export interface SubscriptionPayment {
    id?: string;
    userId: string;
    subscriptionId: string;
    tier: SubscriptionTier;
    amount: number;
    currency: 'GMD';
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    paymentMethod: 'wallet' | 'modem_pay';

    // Modem Pay details if applicable
    modemPayTransactionId?: string;
    modemPayReference?: string;

    // Timestamps
    createdAt: Timestamp | any;
    completedAt?: Timestamp | any;
}

/**
 * Default tier features
 */
export const TIER_FEATURES: Record<SubscriptionTier, TierFeatures> = {
    [SubscriptionTier.FREE]: {
        // AI Features - None
        aiResumeParser: false,
        aiCandidateMatching: false,
        aiContractDrafting: false,
        aiTaskGeneration: false,
        aiMailComposer: false,
        aiProfileEnhancer: false,
        aiJobDescriptionGenerator: false,
        aiTeamRecommender: false,
        aiMailSummarizer: false,
        aiTaskAutoAssignment: false,
        aiProjectTimelineOptimizer: false,
        aiMeetingScheduler: false,
        aiContractRiskAnalyzer: false,
        aiTranslation: false,
        aiProofreader: false,

        // Pro Features - Basic only
        advancedAnalytics: false,
        customBranding: false,
        prioritySupport: false,
        advancedSearch: false,
        bulkOperations: false,
        exportReports: false,
        apiAccess: false,
        customReportBuilder: false,
        smartNotifications: false,
        reputationScore: false,
        portfolioAnalytics: false,

        // Pro Plus Features - None
        talentPoolManagement: false,
        clientManagementDashboard: false,
        placementTracking: false,
        commissionCalculator: false,
        customDomain: false,
        brandedClientPortal: false,
        whiteLabel: false,
        priorityCandidateSearch: false,

        // Quotas
        aiRequestsPerMonth: 0,
        storageGB: 1, // Free tier: 1 GB
        workspaceMembers: 5,
        projectsPerWorkspace: 10,
        contractTemplates: 3,
        teamSize: 5,
        maxProjects: 10,      // Free: 10 projects total
        maxWorkspaces: 3,     // Free: 3 workspaces total
    },

    [SubscriptionTier.PRO]: {
        // AI Features - Basic AI enabled for Pro
        aiResumeParser: true,
        aiCandidateMatching: false,
        aiContractDrafting: false,
        aiTaskGeneration: false,
        aiMailComposer: true,
        aiProfileEnhancer: true,
        aiJobDescriptionGenerator: true,
        aiTeamRecommender: false,
        aiMailSummarizer: false,
        aiTaskAutoAssignment: false,
        aiProjectTimelineOptimizer: false,
        aiMeetingScheduler: false,
        aiContractRiskAnalyzer: false,
        aiTranslation: false,
        aiProofreader: false,

        // Pro Features - All enabled
        advancedAnalytics: true,
        customBranding: true,
        prioritySupport: true,
        advancedSearch: true,
        bulkOperations: true,
        exportReports: true,
        apiAccess: false,
        customReportBuilder: true,
        smartNotifications: true,
        reputationScore: true,
        portfolioAnalytics: true,

        // Pro Plus Features - None
        talentPoolManagement: false,
        clientManagementDashboard: false,
        placementTracking: false,
        commissionCalculator: false,
        customDomain: false,
        brandedClientPortal: false,
        whiteLabel: false,
        priorityCandidateSearch: false,

        // Quotas
        aiRequestsPerMonth: 100, // Pro: 100 AI requests/month
        storageGB: 5, // Pro tier: 5 GB
        workspaceMembers: 25,
        projectsPerWorkspace: 50,
        contractTemplates: 20,
        teamSize: 25,
        maxProjects: 50,      // Pro: 50 projects total
        maxWorkspaces: 10,    // Pro: 10 workspaces total
    },

    [SubscriptionTier.PRO_PLUS]: {
        // AI Features - All enabled (Pro Plus includes AI + agency tools)
        aiResumeParser: true,
        aiCandidateMatching: true,
        aiContractDrafting: true,
        aiTaskGeneration: true,
        aiMailComposer: true,
        aiProfileEnhancer: true,
        aiJobDescriptionGenerator: true,
        aiTeamRecommender: true,
        aiMailSummarizer: true,
        aiTaskAutoAssignment: true,
        aiProjectTimelineOptimizer: true,
        aiMeetingScheduler: true,
        aiContractRiskAnalyzer: true,
        aiTranslation: true,
        aiProofreader: true,

        // Pro Features - All enabled
        advancedAnalytics: true,
        customBranding: true,
        prioritySupport: true,
        advancedSearch: true,
        bulkOperations: true,
        exportReports: true,
        apiAccess: true,
        customReportBuilder: true,
        smartNotifications: true,
        reputationScore: true,
        portfolioAnalytics: true,

        // Pro Plus Features - All enabled
        talentPoolManagement: true,
        clientManagementDashboard: true,
        placementTracking: true,
        commissionCalculator: true,
        customDomain: true,
        brandedClientPortal: true,
        whiteLabel: true,
        priorityCandidateSearch: true,

        // Quotas
        aiRequestsPerMonth: 1000, // Pro Plus: 1,000 AI requests/month
        storageGB: 50, // Pro Plus tier: 50 GB
        workspaceMembers: 100,
        projectsPerWorkspace: 200,
        contractTemplates: 100,
        teamSize: 100,
        maxProjects: -1,      // Pro Plus: Unlimited
        maxWorkspaces: -1,    // Pro Plus: Unlimited
    },

    [SubscriptionTier.CONNECT_AI]: {
        // AI Features - All enabled
        aiResumeParser: true,
        aiCandidateMatching: true,
        aiContractDrafting: true,
        aiTaskGeneration: true,
        aiMailComposer: true,
        aiProfileEnhancer: true,
        aiJobDescriptionGenerator: true,
        aiTeamRecommender: true,
        aiMailSummarizer: true,
        aiTaskAutoAssignment: true,
        aiProjectTimelineOptimizer: true,
        aiMeetingScheduler: true,
        aiContractRiskAnalyzer: true,
        aiTranslation: true,
        aiProofreader: true,

        // Pro Features - All enabled
        advancedAnalytics: true,
        customBranding: true,
        prioritySupport: true,
        advancedSearch: true,
        bulkOperations: true,
        exportReports: true,
        apiAccess: true,
        customReportBuilder: true,
        smartNotifications: true,
        reputationScore: true,
        portfolioAnalytics: true,

        // Pro Plus Features - All enabled
        talentPoolManagement: true,
        clientManagementDashboard: true,
        placementTracking: true,
        commissionCalculator: true,
        customDomain: true,
        brandedClientPortal: true,
        whiteLabel: true,
        priorityCandidateSearch: true,

        // Quotas
        aiRequestsPerMonth: -1, // Connect AI: Unlimited AI requests (-1 = unlimited)
        storageGB: 50, // Connect AI tier: 50 GB (same as Pro Plus)
        workspaceMembers: 500,
        projectsPerWorkspace: 1000,
        contractTemplates: 500,
        teamSize: 500,
        maxProjects: -1,      // Connect AI: Unlimited
        maxWorkspaces: -1,    // Connect AI: Unlimited
    },
};

/**
 * Subscription Plans with GMD pricing
 */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: 'free',
        tier: SubscriptionTier.FREE,
        name: 'Free',
        description: 'Perfect for getting started',
        priceMonthly: 0,
        priceYearly: 0,
        currency: 'GMD',
        features: TIER_FEATURES[SubscriptionTier.FREE],
    },
    {
        id: 'pro-monthly',
        tier: SubscriptionTier.PRO,
        name: 'Connect Pro',
        description: '15 AI tools + Advanced analytics and priority support',
        priceMonthly: 500, // GMD
        priceYearly: 5000, // GMD (2 months free)
        currency: 'GMD',
        features: TIER_FEATURES[SubscriptionTier.PRO],
        popular: true,
    },
    {
        id: 'pro-plus-monthly',
        tier: SubscriptionTier.PRO_PLUS,
        name: 'Connect Pro Plus',
        description: '25 AI tools + Pro features + Agency tools and white-label',
        priceMonthly: 1500, // GMD
        priceYearly: 15000, // GMD (2 months free)
        currency: 'GMD',
        features: TIER_FEATURES[SubscriptionTier.PRO_PLUS],
    },
    {
        id: 'connect-ai-monthly',
        tier: SubscriptionTier.CONNECT_AI,
        name: 'Connect AI',
        description: '100+ AI tools for full automation across the entire platform',
        priceMonthly: 750, // GMD
        priceYearly: 7500, // GMD (2 months free)
        currency: 'GMD',
        features: TIER_FEATURES[SubscriptionTier.CONNECT_AI],
        popular: false,
    },
];
