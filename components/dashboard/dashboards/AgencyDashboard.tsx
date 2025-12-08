'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { TaskService } from '@/lib/services/task-service';
import { StorageQuotaService, StorageQuota as StorageQuotaType } from '@/lib/services/storage-quota-service';
import StatsCard from '@/components/dashboard/StatsCard';
import StatsModal from '@/components/dashboard/StatsModal';
import ProjectAnalytics from '@/components/dashboard/ProjectAnalytics';
import Reminders from '@/components/dashboard/Reminders';
import TeamCollaboration from '@/components/dashboard/TeamCollaboration';
import StorageQuota from '@/components/dashboard/StorageQuota';
import ProjectList from '@/components/dashboard/ProjectList';
import { Plus, Users, Building2, Wallet, Briefcase, CheckSquare, FileCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Project, Task, ProofOfTask } from '@/lib/types/workspace.types';

type ModalType = 'pending-projects' | 'pots-review' | 'members' | null;

export default function AgencyDashboard() {
    const { user, userProfile } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState<ModalType>(null);

    // Statistics
    const [pendingProjects, setPendingProjects] = useState<Project[]>([]);
    const [potsToReview, setPotsToReview] = useState<ProofOfTask[]>([]);
    const [storageQuota, setStorageQuota] = useState<StorageQuotaType | null>(null);
    
    // Agency Stats
    const [membersCount, setMembersCount] = useState<number>(0);
    const [totalEarnings, setTotalEarnings] = useState<number>(0);
    const [completedTasksCount, setCompletedTasksCount] = useState<number>(0);
    
    // Recruiter Agency Stats
    const [tasksCreated, setTasksCreated] = useState<number>(0);
    const [talentsManaged, setTalentsManaged] = useState<number>(0);
    const [activeJobs, setActiveJobs] = useState<number>(0);

    useEffect(() => {
        if (user && userProfile) {
            const fetchData = async () => {
                try {
                    // Fetch all agency projects (Owned by this account)
                    const ownedProjects = await EnhancedProjectService.getUserProjects(user.uid);

                    // Pending projects
                    const pending = ownedProjects.filter(p =>
                        p.status === 'active' || p.status === 'planning' || p.status === 'on-hold'
                    );
                    setPendingProjects(pending);
                    
                    const activeJobsCount = ownedProjects.filter(p => p.status === 'active').length;
                    setActiveJobs(activeJobsCount);

                    // Get supervised project IDs (Agency validates work done for them)
                    const supervisedProjects = ownedProjects.map(p => p.id!);

                    // Get POTs to review
                    const potsForReview = await TaskService.getPotsToReview(user.uid, supervisedProjects);
                    setPotsToReview(potsForReview);

                    // Fetch Storage Quota
                    const personalMail = `${userProfile.username}@connekt.com`;
                    const quota = await StorageQuotaService.getStorageQuota(personalMail);
                    setStorageQuota(quota);

                    // Calculate Members (Unique members in owned projects)
                    const uniqueMembers = new Set<string>();
                    ownedProjects.forEach(p => {
                        p.members.forEach(m => uniqueMembers.add(m.userId));
                    });
                    setMembersCount(uniqueMembers.size);
                    setTalentsManaged(uniqueMembers.size);

                    // Fetch all tasks created by the agency to calculate stats
                    const allAgencyTasks = await TaskService.getCreatedTasks(user.uid);
                    setTasksCreated(allAgencyTasks.length);
                    
                    // Calculate Completed Tasks
                    const completedCount = allAgencyTasks.filter(t => t.status === 'done' || t.status === 'paid').length;
                    setCompletedTasksCount(completedCount);

                    // Calculate Total Earnings (Sum of paid tasks)
                    // Assuming 'paid' tasks represent revenue or value delivered
                    const earnings = allAgencyTasks
                        .filter(t => t.status === 'paid')
                        .reduce((sum, t) => sum + (t.pricing?.amount || 0), 0);
                    setTotalEarnings(earnings);

                } catch (error) {
                    console.error('Error fetching dashboard data:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [user, userProfile]);

    const openModal = (type: ModalType) => {
        setModalOpen(type);
    };

    const getModalData = () => {
        switch (modalOpen) {
            case 'pending-projects':
                return {
                    title: 'Agency Projects',
                    items: pendingProjects.map(p => ({
                        id: p.id!,
                        title: p.title,
                        description: p.description,
                        status: p.status,
                        progress: 0,
                        date: p.deadline,
                        amount: p.budget,
                        tags: []
                    })),
                    type: 'projects' as const
                };
            case 'pots-review':
                return {
                    title: 'Member Validations',
                    items: potsToReview.map(pot => ({
                        id: pot.taskId,
                        title: `Review POT for Task`,
                        description: pot.notes || 'No notes provided',
                        submittedBy: pot.submittedByUsername,
                        screenshotCount: pot.screenshots.length,
                        videoCount: pot.videos.length,
                        linkCount: pot.links.length
                    })),
                    type: 'pots-review' as const
                };
            default:
                return { title: '', items: [], type: 'projects' as const };
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-6">
            {/* Header Area */}
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Agency Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your agency, members, and collective performance.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => router.push('/dashboard/projects')}
                        className="px-5 py-2.5 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-teal-500/20"
                    >
                        <Plus size={16} /> New Project
                    </button>
                    <button
                        onClick={() => router.push('/dashboard/teams')}
                        className="px-5 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <Users size={16} className="mr-2" /> Members
                    </button>
                </div>
            </div>

            {/* Row 1: Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(userProfile as any)?.agencyType === 'recruiter_collective' ? (
                    <>
                        <StatsCard
                            title="Projects Created"
                            value={pendingProjects.length} // Or total projects created
                            trend="Active projects"
                            trendValue={`${activeJobs} active`}
                            color="green"
                            onClick={() => openModal('pending-projects')}
                            icon={Briefcase}
                        />
                        <StatsCard
                            title="Tasks Created"
                            value={tasksCreated}
                            trend="Total tasks assigned"
                            trendValue=""
                            color="white"
                            onClick={() => {}}
                            icon={CheckSquare}
                        />
                        <StatsCard
                            title="Talents Managed"
                            value={talentsManaged}
                            trend="Unique talents"
                            trendValue=""
                            color="white"
                            onClick={() => {}}
                            icon={Users}
                        />
                        <StatsCard
                            title="Task Validations"
                            value={potsToReview.length}
                            trend="Submissions to validate"
                            trendValue={potsToReview.length > 0 ? '⚠️ Action needed' : ''}
                            color="white"
                            onClick={() => openModal('pots-review')}
                            icon={FileCheck}
                        />
                    </>
                ) : (
                    <>
                        <StatsCard
                            title="Agency Projects"
                            value={pendingProjects.length}
                            trend="Active projects"
                            trendValue={`${activeJobs} active`}
                            color="green"
                            onClick={() => openModal('pending-projects')}
                            icon={Briefcase}
                        />
                        <StatsCard
                            title="Agency Members"
                            value={membersCount}
                            trend="Active VAs"
                            trendValue=""
                            color="white"
                            onClick={() => {}}
                            icon={Users}
                        />
                        <StatsCard
                            title="Total Earnings"
                            value={`$${totalEarnings.toLocaleString()}`}
                            trend="Collective Revenue"
                            trendValue=""
                            color="white"
                            onClick={() => {}}
                            icon={Wallet}
                        />
                        <StatsCard
                            title="Validations"
                            value={potsToReview.length}
                            trend="Pending Reviews"
                            trendValue={potsToReview.length > 0 ? '⚠️ Action needed' : ''}
                            color="white"
                            onClick={() => openModal('pots-review')}
                            icon={FileCheck}
                        />
                    </>
                )}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-auto">
                {/* Left Column (2/3 width) */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Row 2: Analytics & Reminders */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[320px]">
                        <ProjectAnalytics />
                        <Reminders />
                    </div>

                    {/* Row 3: Team & Storage */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[280px]">
                        <TeamCollaboration />
                        <StorageQuota
                            usedSpace={storageQuota?.usedSpace || 0}
                            totalQuota={storageQuota?.totalQuota || 1073741824} // Default 1GB
                            filesCount={storageQuota?.filesCount || 0}
                        />
                    </div>
                </div>

                {/* Right Column (1/3 width) */}
                <div className="space-y-6">
                    <ProjectList />
                    {/* Could add an "Agency Activity Feed" here */}
                </div>
            </div>

            {/* Stats Modal */}
            {modalOpen && (
                <StatsModal
                    isOpen={true}
                    onClose={() => setModalOpen(null)}
                    {...getModalData()}
                />
            )}
        </div>
    );
}
