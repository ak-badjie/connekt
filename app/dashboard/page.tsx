'use client';

import { useAuth } from '@/context/AuthContext';
import VADashboard from '@/components/dashboard/dashboards/VADashboard';
import RecruiterDashboard from '@/components/dashboard/dashboards/RecruiterDashboard';
import AgencyDashboard from '@/components/dashboard/dashboards/AgencyDashboard';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function DashboardPage() {
    const { userProfile, loading } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    if (!userProfile) {
        return null; // Or redirect to login
    }

    // Check for Agency Profile (if agencyType exists)
    // We cast to any because ExtendedUserProfile might not have agencyType explicitly defined in the base type yet
    if ((userProfile as any).agencyType) {
        return <AgencyDashboard />;
    }

    // Check for Recruiter Role
    // Handle potential case sensitivity issues
    const role = userProfile.role?.toLowerCase();
    if (role === 'recruiter') {
        return <RecruiterDashboard />;
    }

    // Default to VA Dashboard (for 'va', 'employer', 'admin', etc. unless specified otherwise)
    return <VADashboard />;
}
