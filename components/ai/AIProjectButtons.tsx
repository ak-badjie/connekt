'use client';

import { useState } from 'react';
import { Loader2, Users, Briefcase } from 'lucide-react';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';
import { useAuth } from '@/context/AuthContext';
import { ConnectAIService, TaskSuggestion } from '@/lib/services/connect-ai.service';
import { SubscriptionService } from '@/lib/services/subscription.service';
import toast from 'react-hot-toast';

interface AITaskGeneratorProps {
    projectDescription: string;
    teamMembers: any[];
    onTasksGenerated: (tasks: TaskSuggestion[]) => void;
}

/**
 * AI Task Generator Button
 * Add this to project creation/edit page
 * 
 * Usage:
 * <AITaskGeneratorButton 
 *   projectDescription={projectDescription}
 *   teamMembers={projectMembers}
 *   onTasksGenerated={(tasks) => {
 *     // Add generated tasks to project
 *     addTasksToProject(tasks);
 *   }}
 * />
 */
export function AITaskGeneratorButton({
    projectDescription,
    teamMembers,
    onTasksGenerated
}: AITaskGeneratorProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    async function generateTasks() {
        if (!user) return;
        setLoading(true);

        try {
            const hasAccess = await SubscriptionService.hasFeature(user.uid, 'aiTaskGeneration');
            if (!hasAccess) {
                toast.error('This feature requires Connect AI subscription');
                window.location.href = '/ai-tools';
                return;
            }

            const tasks = await ConnectAIService.generateTasksFromProject(
                projectDescription,
                teamMembers,
                user.uid
            );

            toast.success(`Generated ${tasks.length} tasks!`);
            onTasksGenerated(tasks);
        } catch (error: any) {
            toast.error(error.message || 'Failed to generate tasks');
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={generateTasks}
            disabled={loading || !projectDescription.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
        >
            {loading ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Tasks...
                </>
            ) : (
                <>
                    <ConnektAIIcon className="w-5 h-5" />
                    Generate Tasks with AI
                </>
            )}
        </button>
    );
}

interface AICandidateFinderProps {
    jobDescription: string;
    requiredSkills: string[];
    onCandidatesFound: (candidates: any[]) => void;
}

/**
 * AI Candidate Finder Button
 * Add this to job posting page or recruiting sections
 */
export function AICandidateFinderButton({
    jobDescription,
    requiredSkills,
    onCandidatesFound
}: AICandidateFinderProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    async function findCandidates() {
        if (!user) return;
        setLoading(true);

        try {
            const hasAccess = await SubscriptionService.hasFeature(user.uid, 'aiCandidateMatching');
            if (!hasAccess) {
                toast.error('This feature requires Connect AI subscription');
                window.location.href = '/ai-tools';
                return;
            }

            const candidates = await ConnectAIService.findBestCandidates(
                jobDescription,
                requiredSkills,
                10,
                user.uid
            );

            toast.success(`Found ${candidates.length} matching candidates!`);
            onCandidatesFound(candidates);
        } catch (error: any) {
            toast.error(error.message || 'Failed to find candidates');
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={findCandidates}
            disabled={loading || !jobDescription.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
        >
            {loading ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Finding Candidates...
                </>
            ) : (
                <>
                    <Users className="w-5 h-5" />
                    Find Best Candidates (AI)
                </>
            )}
        </button>
    );
}

interface AITeamRecommenderProps {
    projectDescription: string;
    requiredSkills: string[];
    onTeamMembersRecommended: (members: any[]) => void;
}

/**
 * AI Team Member Recommender
 * Suggests best team members for a project
 */
export function AITeamRecommenderButton({
    projectDescription,
    requiredSkills,
    onTeamMembersRecommended
}: AITeamRecommenderProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    async function recommendTeam() {
        if (!user) return;
        setLoading(true);

        try {
            const hasAccess = await SubscriptionService.hasFeature(user.uid, 'aiTeamRecommender');
            if (!hasAccess) {
                toast.error('This feature requires Connect AI subscription');
                return;
            }

            const teamMembers = await ConnectAIService.suggestTeamMembers(
                projectDescription,
                requiredSkills,
                5,
                user.uid
            );

            toast.success(`Found ${teamMembers.length} recommended team members!`);
            onTeamMembersRecommended(teamMembers);
        } catch (error: any) {
            toast.error(error.message || 'Failed to recommend team');
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={recommendTeam}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-medium transition-all disabled:opacity-50"
        >
            {loading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Finding Team...
                </>
            ) : (
                <>
                    <Briefcase className="w-4 h-4" />
                    Recommend Team (AI)
                </>
            )}
        </button>
    );
}
