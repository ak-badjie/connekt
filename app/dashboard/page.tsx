'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FirestoreService } from '@/lib/services/firestore-service';
import StatsCard from '@/components/dashboard/StatsCard';
import ProjectAnalytics from '@/components/dashboard/ProjectAnalytics';
import Reminders from '@/components/dashboard/Reminders';
import TeamCollaboration from '@/components/dashboard/TeamCollaboration';
import ProjectProgress from '@/components/dashboard/ProjectProgress';
import ProjectList from '@/components/dashboard/ProjectList';
import TimeTracker from '@/components/dashboard/TimeTracker';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({ total: 0, completed: 0, running: 0, pending: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const fetchData = async () => {
                const s = await FirestoreService.getProjectStats(user.uid);
                setStats(s);
                setLoading(false);
            };
            fetchData();
        }
    }, [user]);

    return (
        <div className="max-w-[1600px] mx-auto space-y-6">
            {/* Header Area */}
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Plan, prioritize, and accomplish your tasks with ease.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => router.push('/projects/create')}
                        className="px-5 py-2.5 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-teal-500/20"
                    >
                        <Plus size={16} /> Add Project
                    </button>
                    <button className="px-5 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
                        Import Data
                    </button>
                </div>
            </div>

            {/* Row 1: Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard title="Total Projects" value={stats.total} trend="Increased from last month" trendValue="5+" color="green" />
                <StatsCard title="Ended Projects" value={stats.completed} trend="Increased from last month" trendValue="6+" color="white" />
                <StatsCard title="Running Projects" value={stats.running} trend="Increased from last month" trendValue="2+" color="white" />
                <StatsCard title="Pending Project" value={stats.pending} trend="On Discuss" trendValue="" color="white" />
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
                        <ProjectProgress />
                    </div>
                </div>

                {/* Right Column (1/3 width) */}
                <div className="space-y-6">
                    <ProjectList />
                    <TimeTracker />
                </div>
            </div>
        </div>
    );
}
