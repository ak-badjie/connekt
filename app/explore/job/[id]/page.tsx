'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ExploreService } from '@/lib/services/explore-service';
import { JobTemplate } from '@/lib/types/workspace.types';
import { ExtendedUserProfile } from '@/lib/types/profile.types';
import { Briefcase, DollarSign, Clock, Calendar, MapPin, Check, ArrowLeft, Share2, MoreHorizontal } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { formatDistanceToNow } from 'date-fns';
import { TEMPLATE_IDS, CONTRACT_TYPES } from '@/lib/constants/contracts';

export default function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { user, userProfile } = useAuth();
    // Unwrap params using React.use()
    const { id } = use(params);

    const [job, setJob] = useState<JobTemplate | null>(null);
    const [ownerProfile, setOwnerProfile] = useState<ExtendedUserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadJob = async () => {
            try {
                // In a real app, we'd have a getJobById method. 
                // For now we might need to search or assume we can fetch it.
                // Let's assume ExploreService has a getJobById or we fetch all and find.
                // Since we don't have getJobById in the viewer snippets, I'll simulate or add it.
                // Ideally I should implement ExploreService.getJobById.
                // For now, let's fetch public jobs and find the one (inefficient but works for prototype).
                const allJobs: JobTemplate[] = await ExploreService.getPublicJobs({});
                const foundJob = allJobs.find(j => j.id === id);

                if (foundJob) {
                    setJob(foundJob);
                    // Fetch owner profile
                    // Assuming we have a service for this or can deduce.
                    // ExploreService.getPublicUserProfiles might help if we filter?
                    // Or maybe we just use what we have on the job object if expanded.
                    // Let's just mock the profile fetch or implement a simple user fetch if needed.
                    // There is no userService exposed here. 
                    // I will leave owner profile as partial for now or rely on job.ownerUsername.
                }
            } catch (error) {
                console.error('Error loading job:', error);
            } finally {
                setLoading(false);
            }
        };
        loadJob();
    }, [id]);

    const handleApply = (withAI: boolean = false) => {
        if (!job) return;

        const params = new URLSearchParams();
        params.set('compose', '1');
        // FIX: Use Connekt Mail Address format
        params.set('to', `${(job as any).ownerUsername}@connekt.com`);
        params.set('subject', `Proposal: ${job.title}`);

        // Context for AI
        const proposalContext = {
            jobId: job.id,
            jobTitle: job.title,
            jobType: job.type || 'job',
            // Ensure we don't accidentally pass projectId for standard jobs
            projectId: job.type === 'project' ? job.id : undefined,
            budget: job.salary ? `${job.salary} ${job.currency}` : 'Negotiable',
        };

        // The "Brief" is what fills the AI text box initially
        const brief = `JOB TITLE: ${job.title} (${job.type || 'job'})
BUDGET: ${job.salary ? `${job.salary} ${job.currency}` : 'Negotiable'}
SCHEDULE: ${job.paymentSchedule || 'To be discussed'}

JOB DESCRIPTION:
${job.description}

REQUIREMENTS:
${Array.isArray((job as any).requirements) ? (job as any).requirements.join('\n- ') : (job as any).requirements || 'N/A'}

MY PROFILE:
Applicant: ${user?.displayName || 'Your Name'}
Email: ${user?.email || 'your.email@example.com'}
`;

        params.set('brief', brief);

        // Pass detailed variables for Composer state
        params.set('variables', JSON.stringify({
            isProposal: true, // IMPORTANT FLAG
            proposalContext: proposalContext,
            brief: brief, // Redundant but safe
            autoStart: withAI, // Triggers modal open
            // Explicitly set linked Workspace ID for later contract generation
            workspaceId: job.workspaceId,

            // Standard Contract Variables
            clientName: (job as any).ownerName || (job as any).ownerUsername || 'Client',
            contractorName: userProfile?.displayName || userProfile?.username || 'Contractor',
            applicantName: userProfile?.displayName || userProfile?.username || 'Contractor', // NEW: Required by templates
            jobTitle: job.title,
            projectTitle: job.title,
            taskTitle: job.title,
        }));

        // Mapping Job Type to Template ID
        // job -> job_proposal
        // project -> project_proposal
        // task -> task_proposal
        // job -> job_proposal
        // project -> project_proposal
        // task -> task_proposal
        let templateId: string = TEMPLATE_IDS.JOB_PROPOSAL;
        if (job.type === CONTRACT_TYPES.PROJECT) templateId = TEMPLATE_IDS.PROJECT_PROPOSAL;
        if (job.type === CONTRACT_TYPES.TASK) templateId = TEMPLATE_IDS.TASK_PROPOSAL;

        params.set('templateId', templateId);
        params.set('contractType', CONTRACT_TYPES.PROPOSAL); // CRITICAL: Tells modal this is a proposal

        if (withAI) {
            params.set('autoStart', '1');
        }

        // Add auto-select params for Mail context
        if (job.workspaceId) params.set('autoSelectWorkspaceId', job.workspaceId);
        // FIX: Strict check to only set project ID if it is actually a project type
        if (job.type === 'project' && job.id) params.set('autoSelectProjectId', job.id);
        if (job.type === 'task' && job.id) params.set('autoSelectTaskId', job.id);

        router.push(`/mail?${params.toString()}`);
    };

    if (loading) return <LoadingScreen />;
    if (!job) return <div className="p-10 text-center">Job not found</div>;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-gray-900 dark:text-gray-100 p-6 pt-24 lg:pl-72">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span>Back to Explore</span>
                </button>

                {/* Main Content */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-200 dark:border-zinc-800 shadow-xl">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                        <div>
                            <span className="inline-block px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs font-bold mb-3 uppercase tracking-wider">
                                {job.type}
                            </span>
                            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">
                                {job.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-1.5">
                                    <Clock size={16} />
                                    <span>Posted {job.createdAt ? formatDistanceToNow(job.createdAt.toDate(), { addSuffix: true }) : 'Recently'}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={16} />
                                    <span>Remote</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <DollarSign size={16} />
                                    <span>{job.currency} {job.salary} / {job.paymentSchedule}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 min-w-[200px]">
                            <button
                                onClick={() => handleApply(false)}
                                className="w-full py-3 bg-[#008080] text-white rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-500/30"
                            >
                                Apply Now
                            </button>
                            <button
                                onClick={() => handleApply(true)}
                                className="w-full py-3 bg-white dark:bg-zinc-800 text-[#008080] border-2 border-[#008080] rounded-xl font-bold hover:bg-teal-50 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
                            >
                                <ConnektAIIcon className="w-5 h-5 text-[#008080]" />
                                Apply with AI
                            </button>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 dark:bg-zinc-800 my-8"></div>

                    {/* Job Description */}
                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="md:col-span-2 space-y-8">
                            <section>
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Briefcase className="text-teal-500" size={24} />
                                    About the Role
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {job.description}
                                </p>
                            </section>

                            {(job as any).requirements && (job as any).requirements.length > 0 && (
                                <section>
                                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <Check className="text-teal-500" size={24} />
                                        Requirements
                                    </h2>
                                    <ul className="space-y-3">
                                        {Array.isArray((job as any).requirements) ? (job as any).requirements.map((req: string, i: number) => (
                                            <li key={i} className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                                                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 flex-shrink-0"></div>
                                                <span>{req}</span>
                                            </li>
                                        )) : (
                                            <li className="text-gray-600 dark:text-gray-300">
                                                {(job as any).requirements}
                                            </li>
                                        )}
                                    </ul>
                                </section>
                            )}
                        </div>

                        {/* Sidebar / Owner Info */}
                        <div className="space-y-6">
                            <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Posted By</h3>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                        {(job as any).ownerUsername?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            {(job as any).ownerUsername || 'Workspace Owner'}
                                        </p>
                                        <p className="text-xs text-gray-500">Member since 2024</p>
                                    </div>
                                </div>
                                <Link
                                    href={`/@${(job as any).ownerUsername}`}
                                    className="block w-full py-2 text-center text-sm font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 rounded-xl hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors"
                                >
                                    View Profile
                                </Link>
                            </div>

                            <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Job Details</h3>
                                <div className="space-y-4 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Pay</span>
                                        <span className="font-bold">{job.currency} {job.salary}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Schedule</span>
                                        <span className="font-bold capitalize">{job.paymentSchedule}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Type</span>
                                        <span className="font-bold capitalize">{job.type}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
