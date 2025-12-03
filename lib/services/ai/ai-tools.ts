import { LucideIcon } from 'lucide-react';
import { SubscriptionTier } from '@/lib/types/subscription-tiers.types';

/**
 * AI Tool Definition
 */
export interface AITool {
    id: string;
    name: string;
    description: string;
    category: 'profile' | 'recruiting' | 'communication' | 'project' | 'interview';
    icon: LucideIcon;
    requiredTier: SubscriptionTier;
    usageFeatureKey: keyof typeof AI_FEATURE_KEYS;
    quotaWeight?: number; // How many quota points this costs (default 1)
}

/**
 * Map of AI features to subscription tier feature keys
 */
export const AI_FEATURE_KEYS = {
    resume_parser: 'aiResumeParser',
    bio_enhancer: 'aiProfileEnhancer',
    skill_suggester: 'aiProfileEnhancer',
    candidate_matcher: 'aiCandidateMatching',
    candidate_comparator: 'aiCandidateMatching',
    job_description: 'aiJobDescriptionGenerator',
    contract_drafter: 'aiContractDrafting',
    email_composer: 'aiMailComposer',
    email_summarizer: 'aiMailSummarizer',
    task_generator: 'aiTaskGeneration',
    task_assignor: 'aiTaskAutoAssignment',
    team_recommender: 'aiTeamRecommender',
} as const;

/**
 * AI Tool Categories
 */
export const AI_TOOL_CATEGORIES = {
    profile: 'Profile AI',
    recruiting: 'Recruiting AI',
    communication: 'Communication AI',
    project: 'Project AI',
    interview: 'Interview AI',
} as const;

/**
 * Quick AI Tools for Profile Page
 * These are the main AI tools accessible from the user profile
 */
export const PROFILE_AI_TOOLS = [
    'resume_parser',
    'bio_enhancer',
    'skill_suggester',
] as const;

export type ProfileAIToolId = typeof PROFILE_AI_TOOLS[number];
