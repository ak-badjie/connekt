'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams } from 'next/navigation';
import { AgencyService, Agency } from '@/lib/services/agency-service';
import { StorageQuotaService, AgencyStorageQuota } from '@/lib/services/storage-quota-service';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { TaskService } from '@/lib/services/task-service';
import { Project, Task } from '@/lib/types/workspace.types';
import StatsCard from '@/components/dashboard/StatsCard';
import StatsModal from '@/components/dashboard/StatsModal';
import ProjectAnalytics from '@/components/dashboard/ProjectAnalytics';
import Reminders from '@/components/dashboard/Reminders';
import StorageQuota from '@/components/dashboard/StorageQuota';
import { Plus, Users, Briefcase, HardDrive, CheckSquare, FileCheck } from 'lucide-react';
import ClientApprovalQueue from '@/components/dashboard/ClientApprovalQueue';
import ActiveCampaigns from '@/components/dashboard/ActiveCampaigns';
import TeamWorkload from '@/components/dashboard/TeamWorkload';
import { useRouter } from 'next/navigation';

export default function AgencyDashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const agencyUsername = params.handle as string;

    const [agency, setAgency] = useState<Agency | null>(null);
    const [storageQuota, setStorageQuota] = useState<AgencyStorageQuota | null>(null);
    const [loading, setLoading] = useState(true);

    // Stats data
    const [stats, setStats] = useState({
        totalProjects: 0,
        activeTasks: 0,
        potsPending: 0,
        teamMembers: 0,
        storageUsed: 0,
        // New stats
        tasksCreated: 0,
        talentsManaged: 0,
        activeJobs: 0
    });

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'projects' | 'tasks' | 'pots-pending' | null>(null);
    const [modalData, setModalData] = useState<{
        projects?: Project[];
        tasks?: Task[];
    }>({});

    useEffect(() => {
        const loadAgencyData = async () => {
            if (!user || !agencyUsername) return;

            setLoading(true);
            try {
                const agencyData = await AgencyService.getAgencyByUsername(agencyUsername);
                if (agencyData) {
                    setAgency(agencyData);

                    // Load storage quota
                    const quota = await StorageQuotaService.getAgencyStorageQuota(agencyData.id!);
                    setStorageQuota(quota);

                    // Fetch real statistics
                    const [projects, tasks] = await Promise.all([
                        EnhancedProjectService.getAgencyProjects(agencyData.id!),
                        TaskService.getAgencyTasks(agencyData.id!)
                    ]);

                    // Fetch created tasks for stats
                    const createdTasks = await TaskService.getCreatedTasks(agencyData.ownerId); // Assuming owner creates tasks for agency

                    const activeTasks = tasks.filter(t => t.status === 'in-progress');
                    const potsPending = tasks.filter(t => t.status === 'pending-validation');
                    const activeJobs = projects.filter(p => p.status === 'active');

                    // Calculate Talents Managed (Unique members in projects)
                    const uniqueMembers = new Set<string>();
                    projects.forEach(p => {
                        p.members.forEach(m => uniqueMembers.add(m.userId));
                    });

                    setStats({
                        totalProjects: projects.length,
                        activeTasks: activeTasks.length,
                        potsPending: potsPending.length,
                        teamMembers: agencyData.members.length,
                        storageUsed: quota ? StorageQuotaService.bytesToGB(quota.usedSpace) : 0,
                        tasksCreated: createdTasks.length,
                        talentsManaged: uniqueMembers.size,
                        activeJobs: activeJobs.length
                    });

                    // Store data for modal
                    setModalData({ projects, tasks });
                }
            } catch (error) {
                console.error('Error loading agency data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadAgencyData();
    }, [user, agencyUsername]);

    const handleStatClick = (type: 'projects' | 'tasks' | 'pots-pending') => {
        setModalType(type);
        setModalOpen(true);
    };

    const handleModalItemClick = (id: string) => {
        if (modalType === 'projects') {
            router.push(`/agency/@${agencyUsername}/dashboard/projects/${id}`);
        } else if (modalType === 'tasks' || modalType === 'pots-pending') {
            router.push(`/agency/@${agencyUsername}/dashboard/tasks/${id}`);
        }
        setModalOpen(false);
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-6">
            {/* Header Area */}
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your agency projects and team performance</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => router.push(`/agency/@${agencyUsername}/dashboard/projects/create`)}
                        className="px-5 py-2.5 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-teal-500/20"
                    >
                        <Plus size={16} /> Add Project
                    </button>
                    <button
                        onClick={() => router.push(`/agency/@${agencyUsername}/team`)}
                        className="px-5 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
                    >
                        <Users size={16} /> Manage Team
                    </button>
                </div>
            </div>

            {/* Row 1: Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {agency?.agencyType === 'recruiter_collective' ? (
                    <>
                        <StatsCard
                            title="Projects Created"
                            value={stats.totalProjects}
                            trend="Total projects"
                            trendValue={`${stats.activeJobs} active`}
                            color="green"
                            onClick={() => handleStatClick('projects')}
                            icon={Briefcase}
                        />
                        <StatsCard
                            title="Tasks Created"
                            value={stats.tasksCreated}
                            trend="Total tasks assigned"
                            trendValue=""
                            color="white"
                            onClick={() => {}}
                            icon={CheckSquare}
                        />
                        <StatsCard
                            title="Talents Managed"
                            value={stats.talentsManaged}
                            trend="Unique talents"
                            trendValue=""
                            color="white"
                            onClick={() => {}}
                            icon={Users}
                        />
                        <StatsCard
                            title="Task Validations"
                            value={stats.potsPending}
                            trend="Submissions to validate"
                            trendValue={stats.potsPending > 0 ? '⚠️ Action needed' : ''}
                            color="white"
                            onClick={() => handleStatClick('pots-pending')}
                            icon={FileCheck}
                        />
                    </>
                ) : (
                    <>
                        <StatsCard
                            title="Total Projects"
                            value={stats.totalProjects}
                            trend="All agency projects"
                            trendValue=""
                            color="green"
                            onClick={() => handleStatClick('projects')}
                            icon={Briefcase}
                        />
                        <StatsCard
                            title="Active Tasks"
                            value={stats.activeTasks}
                            trend="Currently in progress"
                            trendValue=""
                            color="white"
                            onClick={() => handleStatClick('tasks')}
                            icon={CheckSquare}
                            showMiniChart={true}
                            chartData={[2, 4, 3, 6, 5, 7, 4]}
                        />
                        <StatsCard
                            title="POTs Pending Review"
                            value={stats.potsPending}
                            trend="Awaiting validation"
                            trendValue=""
                            color="white"
                            onClick={() => handleStatClick('pots-pending')}
                            icon={FileCheck}
                            showMiniChart={true}
                            chartData={[1, 3, 2, 5, 4, 3, 2]}
                        />
                        <div className="h-full">
                            <StorageQuota
                                usedSpace={storageQuota?.usedSpace || 0}
                                totalQuota={storageQuota?.totalQuota || 1073741824}
                                filesCount={storageQuota?.filesCount || 0}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Agency Overview */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Left Column (2/3 width) */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Row 2: Analytics & Reminders */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[320px]">
                        <ProjectAnalytics />
                        <Reminders />
                    </div>

                    {/* Row 3: Workflow Components Under Analytics & Reminders */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[320px]">
                        <ClientApprovalQueue />
                        <ActiveCampaigns />
                    </div>
                </div>

                {/* Right Column (1/3 width) - Team Members & Team Workload */}
                <div className="space-y-6">
                    {/* Team Members */}
                    <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-lg rounded-2xl border border-white/20 dark:border-white/5 p-6 shadow-lg h-[320px] overflow-y-auto custom-scrollbar">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Users size={20} className="text-[#008080]" />
                            Team Members
                        </h2>
                        <div className="space-y-3">
                            {agency?.members.map((member, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 p-3 bg-white/40 dark:bg-zinc-800/40 border border-white/10 rounded-xl"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white font-bold text-xs">
                                        {member.agencyEmail[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {member.agencyEmail.split('@')[0]}
                                        </p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                            {member.role}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => router.push(`/agency/@${agencyUsername}/team`)}
                            className="w-full mt-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Manage Team
                        </button>
                    </div>

                    {/* Team Workload - Under Team Members */}
                    <div className="h-[320px]">
                        <TeamWorkload />
                    </div>
                </div>

            </div>

            {/* Stats Modal */}
            <StatsModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                type={modalType === 'projects' ? 'projects' : modalType === 'pots-pending' ? 'pots' : 'tasks'}
                data={
                    modalType === 'projects' ? modalData.projects || [] :
                        modalType === 'tasks' ? (modalData.tasks || []).filter(t => t.status === 'in-progress') :
                            modalType === 'pots-pending' ? (modalData.tasks || []).filter(t => t.status === 'pending-validation') :
                                []
                }
                onItemClick={handleModalItemClick}
            />
        </div>
    );
}
