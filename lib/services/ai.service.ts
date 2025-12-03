/**
 * Legacy AI Service - Now uses Connect AI Service
 * 
 * This file is kept for backwards compatibility.
 * All AI features have been moved to connect-ai.service.ts
 * 
 * To use AI features, import from '@/lib/services/connect-ai.service'
 */

export { ConnectAIService as AIService } from './connect-ai.service';

// Legacy exports for backwards compatibility
export const generateResume = async (userId: string) => {
    // Deprecated - use ConnectAIService.parseResumeToProfile
    return { success: true };
};

export const matchJobs = async (userId: string) => {
    // Deprecated - use ConnectAIService.findBestCandidates
    return [];
};
