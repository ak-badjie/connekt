'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { WorkspaceService } from '@/lib/services/workspace-service';
import { ConnectAIService, TaskSuggestion, TaskAssignment } from '@/lib/services/connect-ai.service';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { TaskService } from '@/lib/services/task-service';
import { ProfileService } from '@/lib/services/profile-service';
import type { WorkspaceMember } from '@/lib/types/workspace.types';

import LoadingScreen from '@/components/ui/LoadingScreen';
import { Sparkles, DollarSign, Check, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Helper for the Connekt Brand Icon
const ConnektIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <Sparkles className={`text-[#008080] ${className}`} />
);

type Step = 'input' | 'generating' | 'review' | 'matching' | 'finalizing';

export default function AIProjectCreatorPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, userProfile } = useAuth();
    const workspaceId = searchParams.get('workspaceId');

    // State
    const [step, setStep] = useState<Step>('input');
    const [loadingMessage, setLoadingMessage] = useState('Analyzing...');

    // Data State
    const [projectData, setProjectData] = useState({
        title: '',
        description: '',
        totalBudget: 1000,
        currency: 'GMD',
        numTasks: 5,
    });

    const [generatedTasks, setGeneratedTasks] = useState<TaskSuggestion[]>([]);
    const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
    const [assignments, setAssignments] = useState<TaskAssignment[]>([]);

    useEffect(() => {
        if (!workspaceId || !user) return;
        const fetchMembers = async () => {
            const workspace = await WorkspaceService.getWorkspace(workspaceId);
            if (workspace) setWorkspaceMembers(workspace.members);
        };
        fetchMembers();
    }, [workspaceId, user]);

    // ------------------------------------------------------------------
    // STEP 1: GENERATE TASKS
    // ------------------------------------------------------------------
    const handleGenerateTasks = async () => {
        if (!projectData.description || projectData.totalBudget <= 0) {
            toast.error('Please provide a description and budget.');
            return;
        }

        if (!user) return;

        setStep('generating');
        setLoadingMessage('Structuring project & splitting budget...');

        try {
            const minDelay = new Promise(resolve => setTimeout(resolve, 3000));
            const aiPromise = ConnectAIService.generateTasksFromProject(
                projectData.description,
                projectData.totalBudget,
                projectData.currency,
                projectData.numTasks,
                user.uid
            );

            const [tasks] = await Promise.all([aiPromise, minDelay]);
            setGeneratedTasks(tasks);
            setStep('review');
        } catch (error) {
            console.error(error);
            toast.error('Generation failed. Please try again.');
            setStep('input');
        }
    };

    // ------------------------------------------------------------------
    // STEP 2: TEAM MATCHING
    // ------------------------------------------------------------------
    const handleAutoAssign = async () => {
        if (workspaceMembers.length === 0) {
            toast.error('No team members found in this workspace.');
            return;
        }

        if (!user) return;

        setStep('matching');
        setLoadingMessage('Matching skills to tasks...');

        try {
            const minDelay = new Promise(resolve => setTimeout(resolve, 3000));

            // Fetch skills for members (required for matching)
            const memberProfiles = await Promise.all(
                workspaceMembers.map(async m => {
                    const profile = await ProfileService.getUserProfile(m.userId);
                    return {
                        userId: m.userId,
                        username: m.username,
                        role: m.role,
                        skills: profile?.skills || [],
                    };
                })
            );

            const matchPromise = ConnectAIService.autoAssignTasks(generatedTasks, memberProfiles, user.uid);

            const [matches] = await Promise.all([matchPromise, minDelay]);
            setAssignments(matches);
            setStep('finalizing');
        } catch (error) {
            console.error(error);
            toast.error('Matching failed.');
            setStep('review');
        }
    };

    // ------------------------------------------------------------------
    // STEP 3: FINAL SAVE
    // ------------------------------------------------------------------
    const handleSaveProject = async () => {
        if (!workspaceId || !user) return;
        const toastId = toast.loading('Launching project...');

        try {
            const projectId = await EnhancedProjectService.createProject({
                workspaceId,
                ownerId: user.uid,
                ownerUsername: userProfile?.username || 'Owner',
                title: projectData.title,
                description: projectData.description,
                budget: projectData.totalBudget,
            });

            await Promise.all(
                generatedTasks.map(async t => {
                    const assignment = assignments.find(a => a.taskTitle === t.title);
                    await TaskService.createTask({
                        projectId,
                        workspaceId,
                        title: t.title,
                        description: t.description,
                        priority: t.priority as any,
                        pricing: {
                            amount: t.budget || 0,
                            currency: t.currency || 'GMD',
                            paymentStatus: 'unpaid',
                        },
                        assigneeId: assignment?.assigneeId,
                        assigneeUsername: assignment?.assigneeUsername,
                        createdBy: user.uid,
                    });
                })
            );

            toast.success('Project launched!', { id: toastId });
            router.push(`/dashboard/projects/${projectId}`);
        } catch (error) {
            console.error(error);
            toast.error('Failed to save project', { id: toastId });
        }
    };

    // ------------------------------------------------------------------
    // LOADING UI
    // ------------------------------------------------------------------
    if (step === 'generating' || step === 'matching') {
        return (
            <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-950 flex flex-col items-center justify-center">
                <LoadingScreen />
                <p className="mt-8 text-lg font-medium text-[#008080] animate-pulse flex items-center gap-2">
                    <ConnektIcon className="animate-spin" /> {loadingMessage}
                </p>
            </div>
        );
    }

    // ------------------------------------------------------------------
    // INPUT UI
    // ------------------------------------------------------------------
    if (step === 'input') {
        return (
            <div className="max-w-3xl mx-auto py-12 px-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 mb-6 hover:text-[#008080] transition-colors"
                >
                    <ArrowLeft size={20} /> Back
                </button>

                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border-2 border-[#008080] mb-6 shadow-lg shadow-teal-500/10">
                        <ConnektIcon className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Project Architect</h1>
                    <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
                        Describe your goals. We'll structure the tasks, split the budget, and find your team.
                    </p>
                </div>

                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Project Title</label>
                            <input
                                type="text"
                                className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#008080]"
                                placeholder="e.g. Website Overhaul"
                                value={projectData.title}
                                onChange={e => setProjectData({ ...projectData, title: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Detailed Description</label>
                            <textarea
                                className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#008080] min-h-[150px]"
                                placeholder="What needs to be done? Who do we need?"
                                value={projectData.description}
                                onChange={e => setProjectData({ ...projectData, description: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Total Budget ({projectData.currency})
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                    <input
                                        type="number"
                                        className="w-full pl-10 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#008080]"
                                        value={projectData.totalBudget}
                                        onChange={e => setProjectData({ ...projectData, totalBudget: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tasks to Generate</label>
                                <input
                                    type="number"
                                    className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#008080]"
                                    value={projectData.numTasks}
                                    onChange={e => setProjectData({ ...projectData, numTasks: parseInt(e.target.value) })}
                                    min={1}
                                    max={20}
                                />
                            </div>
                        </div>

                        {/* BRANDED BUTTON */}
                        <button
                            onClick={handleGenerateTasks}
                            className="w-full py-4 mt-4 bg-white dark:bg-zinc-900 border-2 border-[#008080] text-[#008080] hover:bg-teal-50 dark:hover:bg-zinc-800 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10 hover:scale-[1.02] transition-all"
                        >
                            <ConnektIcon />
                            Generate Structure
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ------------------------------------------------------------------
    // REVIEW UI
    // ------------------------------------------------------------------
    return (
        <div className="max-w-5xl mx-auto py-12 px-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <ConnektIcon className="w-8 h-8" />
                        Project Proposal
                    </h1>
                    <p className="text-gray-500">Review structure before confirming.</p>
                </div>
                {step === 'review' && (
                    <div className="flex gap-3">
                        <button
                            onClick={() => setStep('input')}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                        >
                            Edit Input
                        </button>
                        <button
                            onClick={handleGenerateTasks}
                            className="px-4 py-2 text-[#008080] border border-[#008080] rounded-lg font-medium hover:bg-teal-50 transition-colors flex items-center gap-2"
                        >
                            <RefreshCw size={16} />
                            Regenerate
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Tasks List */}
                <div className="lg:col-span-2 space-y-4">
                    {generatedTasks.map((task, idx) => {
                        const assignment = assignments.find(a => a.taskTitle === task.title);

                        return (
                            <div
                                key={idx}
                                className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 transition-all hover:border-[#008080]/50"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            {task.title}
                                            {assignment && (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <Check size={10} /> Assigned
                                                </span>
                                            )}
                                        </h3>
                                        {/* Skill Tags */}
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {(task.categories || []).map(skill => (
                                                <span
                                                    key={skill}
                                                    className="text-xs bg-teal-50 dark:bg-zinc-800 text-[#008080] border border-[#008080]/20 px-2 py-1 rounded-md"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-[#008080]">
                                            {task.currency} {task.budget}
                                        </div>
                                        <div className="text-xs text-gray-400">Estimated</div>
                                    </div>
                                </div>

                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{task.description}</p>

                                {/* Assignment UI */}
                                {step === 'finalizing' && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
                                        {assignment ? (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                                                        {assignment.assigneeUsername[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold dark:text-white">@{assignment.assigneeUsername}</div>
                                                        <div className="text-xs text-green-600 font-medium">
                                                            {assignment.confidence}% Match
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-400 italic max-w-[200px] text-right truncate">
                                                    "{assignment.reason}"
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-amber-500 text-sm">
                                                <AlertCircle size={16} />
                                                <span>No suitable match found</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Right: Summary & Actions */}
                <div className="space-y-6">
                    <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 sticky top-6">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Summary</h3>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Total Budget</span>
                                <span className="font-bold dark:text-white">
                                    {projectData.currency} {projectData.totalBudget}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Tasks</span>
                                <span className="font-bold dark:text-white">{generatedTasks.length}</span>
                            </div>
                            <div className="flex justify-between text-sm border-t pt-2">
                                <span className="text-gray-500">Unallocated</span>
                                <span className="font-bold text-gray-900 dark:text-white">
                                    {projectData.currency}{' '}
                                    {(
                                        projectData.totalBudget -
                                        generatedTasks.reduce((sum, t) => sum + (t.budget || 0), 0)
                                    ).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {step === 'review' ? (
                            <button
                                onClick={handleAutoAssign}
                                className="w-full py-3 bg-white dark:bg-zinc-900 border-2 border-[#008080] text-[#008080] hover:bg-teal-50 dark:hover:bg-zinc-800 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10 hover:scale-[1.02] transition-all"
                            >
                                <ConnektIcon />
                                Auto-Match Team
                            </button>
                        ) : (
                            <button
                                onClick={handleSaveProject}
                                className="w-full py-3 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 hover:scale-[1.02] transition-all"
                            >
                                <Check size={18} />
                                Confirm & Launch
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
  