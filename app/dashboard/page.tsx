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
import TimeTracker from '@/components/dashboard/TimeTracker';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Project, Task, ProofOfTask } from '@/lib/types/workspace.types';

type ModalType = 'pending-projects' | 'pending-tasks' | 'pots-pending' | 'pots-review' | null;

export default function DashboardPage() {
    const { user, userProfile } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState<ModalType>(null);

    // Statistics
    const [pendingProjects, setPendingProjects] = useState<Project[]>([]);
    const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
    const [potsAwaitingApproval, setPotsAwaitingApproval] = useState<Task[]>([]);
    const [potsToReview, setPotsToReview] = useState<ProofOfTask[]>([]);
    const [storageQuota, setStorageQuota] = useState<StorageQuotaType | null>(null);

    useEffect(() => {
        if (user && userProfile) {
            const fetchData = async () => {
                try {
                    // Fetch all user's projects
                    const [owned, assigned, memberOf] = await Promise.all([
                        EnhancedProjectService.getUserProjects(user.uid),
                        EnhancedProjectService.getAssignedProjects(user.uid),
                        EnhancedProjectService.getProjectsMemberOf(user.uid)
                    ]);

                    // Merge and deduplicate projects
                    const allProjectsMap = new Map<string, Project>();
                    [...owned, ...assigned, ...memberOf].forEach(p => {
                        if (p.id) allProjectsMap.set(p.id, p);
                    });
                    const allProjects = Array.from(allProjectsMap.values());

                    // Pending projects (started but not finished)
                    const pending = allProjects.filter(p =>
                        p.status === 'active' || p.status === 'planning' || p.status === 'on-hold'
                    );
                    setPendingProjects(pending);

                    // Get supervised project IDs
                    const supervisedProjects = allProjects
                        .filter(p => p.supervisors.includes(user.uid))
                        .map(p => p.id!);

                    // Fetch task stats
                    const taskStats = await TaskService.getTaskStats(user.uid, supervisedProjects);
                    const userTasks = await TaskService.getUserTasks(user.uid);

                    setPendingTasks(userTasks.filter(t => t.status === 'todo'));
                    setPotsAwaitingApproval(userTasks.filter(t => t.status === 'pending-validation'));

                    // Get POTs to review
                    const potsForReview = await TaskService.getPotsToReview(user.uid, supervisedProjects);
                    setPotsToReview(potsForReview);

                    // Fetch Storage Quota
                    const personalMail = `${userProfile.username}@connekt.com`;
                    const quota = await StorageQuotaService.getStorageQuota(personalMail);
                    setStorageQuota(quota);

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
                    title: 'Pending Projects',
                    items: pendingProjects.map(p => ({
                        id: p.id!,
                        title: p.title,
                        description: p.description,
                        status: p.status,
                        progress: 0, // Calculate based on tasks
                        date: p.deadline,
                        amount: p.budget,
                        tags: []
                    })),
                    type: 'projects' as const
                };
            case 'pending-tasks':
                return {
                    title: 'Pending Tasks',
                    items: pendingTasks.map(t => ({
                        id: t.id!,
                        title: t.title,
                        description: t.description,
                        priority: t.priority,
                        date: t.timeline.dueDate,
                        tags: [t.assigneeUsername || 'Unassigned']
                    })),
                    type: 'tasks' as const
                };
            case 'pots-pending':
                return {
                    title: 'POTs Awaiting Approval',
                    items: potsAwaitingApproval.map(t => ({
                        id: t.id!,
                        title: t.title,
                        description: t.description,
                        priority: t.priority,
                        date: t.proofOfTask?.submittedAt?.toString(),
                        tags: ['Pending Validation']
                    })),
                    type: 'pots-pending' as const
                };
            case 'pots-review':
                return {
                    title: 'POTs to Review',
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
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Track your projects, tasks, and proof submissions in real-time.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => router.push('/dashboard/projects')}
                        className="px-5 py-2.5 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-teal-500/20"
                    >
                        <Plus size={16} /> New Project
                    </button>
                    <button
                        onClick={() => router.push('/dashboard/workspaces')}
                        className="px-5 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                    >
                        Workspaces
                    </button>
                </div>
            </div>

            {/* Row 1: New Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Pending Projects"
                    value={pendingProjects.length}
                    trend="Active projects in progress"
                    trendValue={`${pendingProjects.filter(p => p.status === 'active').length} active`}
                    color="green"
                    onClick={() => openModal('pending-projects')}
                />
                <StatsCard
                    title="Pending Tasks"
                    value={pendingTasks.length}
                    trend="Tasks not yet started"
                    trendValue=""
                    color="white"
                    onClick={() => openModal('pending-tasks')}
                />
                <StatsCard
                    title="POTs Awaiting Approval"
                    value={potsAwaitingApproval.length}
                    trend="Your submissions under review"
                    trendValue=""
                    color="white"
                    onClick={() => openModal('pots-pending')}
                />
                <StatsCard
                    title="POTs to Review"
                    value={potsToReview.length}
                    trend="Submissions to validate"
                    trendValue={potsToReview.length > 0 ? '⚠️ Action needed' : ''}
                    color="white"
                    onClick={() => openModal('pots-review')}
                />
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

                    {/* Row 3: Team & Progress */}
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
                    <TimeTracker />
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
