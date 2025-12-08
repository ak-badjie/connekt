'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ExploreService, ExploreFilters } from '@/lib/services/explore-service';
import { useRouter } from 'next/navigation';
import { Project, Task } from '@/lib/types/workspace.types';
import { ExtendedUserProfile } from '@/lib/types/profile.types';
import { Agency } from '@/lib/services/agency-service';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Users, DollarSign, MapPin } from 'lucide-react';
import Link from 'next/link';
import { ExploreSidebar } from '@/components/explore/ExploreSidebar';
import { AdvertisementBanner } from '@/components/explore/AdvertisementBanner';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { useMinimumLoading } from '@/hooks/useMinimumLoading';
import { useAnimation } from '@/context/AnimationContext';
// import { ComposeModal } from '@/components/mail/ComposeModal';
// import { MailService } from '@/lib/services/mail-service';
import { toast } from 'react-hot-toast';

export default function ExplorePage() {
    const { user, userProfile } = useAuth();
    const [viewMode, setViewMode] = useState<'jobs' | 'people'>('jobs');
    const [isLoading, setIsLoading] = useState(true);

    // Data states
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [jobs, setJobs] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<ExtendedUserProfile[]>([]);
    const [agencies, setAgencies] = useState<Agency[]>([]);

    // Filter states
    const [filters, setFilters] = useState<ExploreFilters>({});

    // Determine default view based on user role
    useEffect(() => {
        if (userProfile?.role === 'va') {
            setViewMode('jobs');
        } else if (userProfile?.role === 'employer' || userProfile?.role === 'recruiter') {
            setViewMode('people');
        }
    }, [userProfile]);

    // Load data
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                if (viewMode === 'jobs') {
                    const [projectData, taskData, jobData] = await Promise.all([
                        ExploreService.getPublicProjects(filters),
                        ExploreService.getPublicTasks(filters),
                        ExploreService.getPublicJobs(filters)
                    ]);
                    setProjects(projectData);
                    setTasks(taskData);
                    setJobs(jobData);
                } else {
                    const [profileData, agencyData] = await Promise.all([
                        ExploreService.getPublicUserProfiles(
                            userProfile?.role === 'va' ? 'recruiter' : 'va',
                            filters
                        ),
                        ExploreService.getPublicAgencies(
                            userProfile?.role === 'va' ? 'recruiter_collective' : 'va_collective'
                        )
                    ]);
                    setProfiles(profileData);
                    setAgencies(agencyData);
                }
            } catch (error) {
                console.error('Error loading explore data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [viewMode, filters, userProfile]);

    const { hasGlobalAnimationRun, setHasGlobalAnimationRun } = useAnimation();
    const shouldShowLoading = useMinimumLoading(isLoading && !hasGlobalAnimationRun);

    useEffect(() => {
        if (!shouldShowLoading && !hasGlobalAnimationRun) {
            setHasGlobalAnimationRun(true);
        }
    }, [shouldShowLoading, hasGlobalAnimationRun, setHasGlobalAnimationRun]);

    if (shouldShowLoading && !hasGlobalAnimationRun) {
        return <LoadingScreen variant="default" />;
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-gray-900 dark:text-gray-100">
            <ExploreSidebar
                viewMode={viewMode}
                filters={filters}
                onFiltersChange={setFilters}
            />

            <main className="lg:pl-72 pt-24 pr-6 pl-6 pb-6 min-h-screen transition-all duration-300">
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl shadow-xl p-6 min-h-[calc(100vh-8rem)] overflow-hidden">
                    {/* Advertisement Banner */}
                    <AdvertisementBanner />

                    {/* View Toggle */}
                    <div className="flex items-center justify-center mt-6">
                        <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 shadow-xl">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setViewMode('jobs')}
                                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-black text-sm transition-all ${viewMode === 'jobs'
                                    ? 'bg-[#008080] text-white shadow-lg shadow-teal-500/30'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <Briefcase size={18} />
                                Find Work
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setViewMode('people')}
                                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-black text-sm transition-all ${viewMode === 'people'
                                    ? 'bg-[#008080] text-white shadow-lg shadow-teal-500/30'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <Users size={18} />
                                Find Talent
                            </motion.button>
                        </div>
                    </div>

                    {/* Results Count */}
                    <div className="flex items-center justify-between mt-6">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                            {viewMode === 'jobs' ? (
                                <>{projects.length + tasks.length + jobs.length} Opportunities Available</>
                            ) : (
                                <>{profiles.length + agencies.length} Talents & Agencies</>
                            )}
                        </h2>
                    </div>

                    {/* Content Grid */}
                    <div className="mt-6">
                        <AnimatePresence mode="wait">
                            {viewMode === 'jobs' ? (
                                <motion.div
                                    key="jobs"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-8"
                                >
                                    {/* Jobs Section */}
                                    {jobs.length > 0 && (
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4">
                                                Jobs ({jobs.length})
                                            </h3>
                                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                                {jobs.map((job, index) => (
                                                    <JobCard key={job.id} job={job} index={index} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Projects Section */}
                                    {projects.length > 0 && (
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4">
                                                Projects ({projects.length})
                                            </h3>
                                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                                {projects.map((project, index) => (
                                                    <ProjectCard key={project.id} project={project} index={index} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Tasks Section */}
                                    {tasks.length > 0 && (
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4">
                                                Tasks ({tasks.length})
                                            </h3>
                                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                                {tasks.map((task, index) => (
                                                    <TaskCard key={task.id} task={task} index={index} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {projects.length === 0 && tasks.length === 0 && jobs.length === 0 && !isLoading && (
                                        <EmptyState mode="jobs" />
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="people"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-8"
                                >
                                    {/* Profiles Section */}
                                    {profiles.length > 0 && (
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4">
                                                Virtual Assistants ({profiles.length})
                                            </h3>
                                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                                {profiles.map((profile, index) => (
                                                    <UserProfileCard key={profile.uid} profile={profile} index={index} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Agencies Section */}
                                    {agencies.length > 0 && (
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4">
                                                Professional Agencies ({agencies.length})
                                            </h3>
                                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                                {agencies.map((agency, index) => (
                                                    <AgencyCard key={agency.id} agency={agency} index={index} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {profiles.length === 0 && agencies.length === 0 && !isLoading && (
                                        <EmptyState mode="people" />
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
}

// Project Card Component
function ProjectCard({ project, index }: { project: Project; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            whileHover={{ scale: 1.02, y: -4 }}
        >
            <Link href={`/explore/project/${project.id}`}>
                <div className="h-full p-6 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-white/5 hover:border-[#008080]/30 transition-all cursor-pointer shadow-lg hover:shadow-xl group">
                    <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white group-hover:text-[#008080] transition-colors line-clamp-2 flex-1">
                            {project.title}
                        </h3>
                        <div className="px-2.5 py-1 rounded-lg bg-[#008080]/10 text-[#008080] text-xs font-bold flex-shrink-0 ml-2">
                            {project.status}
                        </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                        {project.description}
                    </p>

                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-zinc-800 pt-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                            <DollarSign size={16} className="text-[#008080]" />
                            ${project.budget.toLocaleString()}
                        </div>
                        <motion.div
                            whileHover={{ x: 4 }}
                            className="text-[#008080] font-bold text-sm"
                        >
                            View Details →
                        </motion.div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

// Task Card Component
function TaskCard({ task, index }: { task: Task; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            whileHover={{ scale: 1.02, y: -4 }}
        >
            <Link href={`/explore/task/${task.id}`}>
                <div className="h-full p-6 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-white/5 hover:border-[#008080]/30 transition-all cursor-pointer shadow-lg hover:shadow-xl group">
                    <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white group-hover:text-[#008080] transition-colors line-clamp-2 flex-1">
                            {task.title}
                        </h3>
                        <div className={`px-2.5 py-1 rounded-lg text-xs font-bold flex-shrink-0 ml-2 ${task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                            task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                'bg-blue-100 text-blue-700'
                            }`}>
                            {task.priority}
                        </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                        {task.description}
                    </p>

                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-zinc-800 pt-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                            <DollarSign size={16} className="text-[#008080]" />
                            ${task.pricing.amount}
                        </div>
                        <motion.div
                            whileHover={{ x: 4 }}
                            className="text-[#008080] font-bold text-sm"
                        >
                            View Details →
                        </motion.div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

// User Profile Card Component
function UserProfileCard({ profile, index }: { profile: ExtendedUserProfile; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            whileHover={{ scale: 1.02, y: -4 }}
        >
            <Link href={`/@${profile.username}`}>
                <div className="h-full p-6 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-white/5 hover:border-[#008080]/30 transition-all cursor-pointer shadow-lg hover:shadow-xl group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                            {profile.displayName[0]}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white group-hover:text-[#008080] transition-colors">
                                {profile.displayName}
                            </h3>
                            <p className="text-sm text-gray-500">@{profile.username}</p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {profile.bio}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {profile.skills.slice(0, 3).map((skill) => (
                            <span key={skill} className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-zinc-800 text-xs font-bold text-gray-700 dark:text-gray-300">
                                {skill}
                            </span>
                        ))}
                        {profile.skills.length > 3 && (
                            <span className="px-2.5 py-1 text-xs font-bold text-gray-500">
                                +{profile.skills.length - 3}
                            </span>
                        )}
                    </div>

                    {profile.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                            <MapPin size={14} />
                            {profile.location}
                        </div>
                    )}

                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-zinc-800 pt-4">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                            ⭐ {profile.stats?.averageRating?.toFixed(1) || 'New'}
                        </div>
                        <motion.div
                            whileHover={{ x: 4 }}
                            className="text-[#008080] font-bold text-sm"
                        >
                            View Profile →
                        </motion.div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

// Agency Card Component
function AgencyCard({ agency, index }: { agency: Agency; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            whileHover={{ scale: 1.02, y: -4 }}
        >
            <Link href={`/agency/@${agency.username}`}>
                <div className="h-full p-6 rounded-2xl bg-gradient-to-br from-[#008080]/5 to-teal-100/5 dark:from-[#008080]/10 dark:to-teal-900/10 backdrop-blur-xl border-2 border-[#008080]/20 hover:border-[#008080]/40 transition-all cursor-pointer shadow-lg hover:shadow-xl group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 rounded-xl bg-[#008080] flex items-center justify-center text-white text-xl font-black shadow-lg">
                            {agency.name[0]}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white group-hover:text-[#008080] transition-colors">
                                {agency.name}
                            </h3>
                            <p className="text-xs text-gray-500">@{agency.username}</p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {agency.description || 'Professional agency services'}
                    </p>

                    <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                            {agency.members?.length || 0} members
                        </div>
                        <motion.div
                            whileHover={{ x: 4 }}
                            className="text-[#008080] font-bold text-sm"
                        >
                            View Agency →
                        </motion.div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

// Empty State Component
function EmptyState({ mode }: { mode: 'jobs' | 'people' }) {
    return (
        <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-6">
                {mode === 'jobs' ? <Briefcase size={40} className="text-gray-400" /> : <Users size={40} className="text-gray-400" />}
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                No {mode === 'jobs' ? 'Jobs' : 'People'} Found
            </h3>
            <p className="text-gray-500 mb-6">
                {mode === 'jobs'
                    ? 'No public projects or tasks available yet. Check back soon!'
                    : 'No profiles match your current filters. Try adjusting your search.'}
            </p>
        </div>
    );
}

function JobCard({ job, index }: { job: any; index: number }) {
    const router = useRouter();

    const handleApply = (withAI: boolean = false) => {
        const params = new URLSearchParams();
        params.set('compose', '1');
        params.set('to', job.ownerUsername);
        params.set('subject', `Proposal: ${job.title}`);

        // Construct detailed job context for the proposal/AI
        const proposalContext = {
            jobId: job.id,
            jobTitle: job.title,
            jobType: job.type || 'job',
            description: job.description,
            budget: job.salary ? `${job.salary} ${job.currency}` : 'Negotiable',
            paymentSchedule: job.paymentSchedule,
            requirements: job.requirements || '', // Assuming job object might have this
            skills: job.skills || [],
            ownerUsername: job.ownerUsername
        };

        params.set('variables', JSON.stringify({
            isProposal: true,
            proposalContext: proposalContext,
            useAI: withAI // Explicit flag for AI usage
        }));

        if (withAI) {
            params.set('autoStart', '1'); // Trigger auto-start mechanisms in Mail
        } else {
            params.set('autoStart', '0'); // Prevent auto-start for standard apply
        }

        router.push(`/mail?${params.toString()}`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-200 dark:border-zinc-800 hover:border-teal-500/50 transition-all group relative overflow-hidden"
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-teal-500 transition-colors">
                        {job.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                        {job.description}
                    </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 text-xs font-bold whitespace-nowrap">
                    {job.type === 'job' ? 'Full-time' : job.type === 'project' ? 'Project' : 'Task'}
                </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
                <div className="flex items-center gap-1.5">
                    <DollarSign size={14} />
                    <span>{job.currency} {job.salary}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Briefcase size={14} />
                    <span className="capitalize">{job.paymentSchedule}</span>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <button
                    onClick={() => handleApply(false)}
                    className="w-full py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm hover:bg-teal-600 dark:hover:bg-teal-400 dark:hover:text-white transition-all shadow-lg hover:shadow-teal-500/20"
                >
                    Apply Now
                </button>
                <button
                    onClick={() => handleApply(true)}
                    className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-bold text-sm hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L14.4 7.2L20 8L16 12L17.2 17.6L12 14.8L6.8 17.6L8 12L4 8L9.6 7.2L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Apply with AI
                </button>
            </div>
        </motion.div>
    );
}
