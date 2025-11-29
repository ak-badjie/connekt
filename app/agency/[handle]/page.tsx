'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AgencyProfile } from '@/components/profile/AgencyProfile';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { AgencyService, Agency } from '@/lib/services/agency-service';
import { ProfileService } from '@/lib/services/profile-service';
import { ExtendedAgencyProfile } from '@/lib/types/profile.types';

export default function AgencyProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const [agency, setAgency] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Extract handle (remove @ if present)
    const rawHandle = params.handle as string;
    const handle = rawHandle?.startsWith('@') ? rawHandle.slice(1) : rawHandle;

    useEffect(() => {
        async function fetchAgency() {
            if (!handle) return;

            try {
                // Get basic agency data
                const agencyData = await AgencyService.getAgencyByUsername(handle);

                if (!agencyData) {
                    setError('Agency not found');
                    setLoading(false);
                    return;
                }

                // Try to get extended profile
                let extendedProfile = await ProfileService.getAgencyProfile(agencyData.id!);

                // If no extended profile, initialize with basic data
                if (!extendedProfile) {
                    await ProfileService.updateAgencyProfile(agencyData.id!, {
                        name: agencyData.name,
                        username: agencyData.username,
                        domain: agencyData.domain,
                        logoUrl: agencyData.logoUrl,
                        ownerId: agencyData.ownerId,
                        members: agencyData.members,
                        services: [],
                        portfolio: [],
                        socialLinks: {},
                        stats: {
                            timeOnPlatform: 0,
                            projectsCompleted: 0,
                            tasksCompleted: 0,
                            averageRating: 0,
                            totalRatings: 0,
                            responseRate: 0,
                            hireCount: 0,
                        },
                        privacySettings: {
                            showEmail: 'authenticated',
                            showPhone: 'private',
                            showExperience: 'public',
                            showEducation: 'public',
                            showProjects: 'public',
                            showRatings: 'public',
                            showLocation: 'public',
                            showSocialLinks: 'public',
                        },
                        createdAt: agencyData.createdAt,
                    });

                    extendedProfile = await ProfileService.getAgencyProfile(agencyData.id!);
                }

                // Merge basic and extended data
                setAgency({
                    ...agencyData,
                    ...extendedProfile,
                });
            } catch (err) {
                console.error('Error fetching agency profile:', err);
                setError('Failed to load agency profile');
            } finally {
                setLoading(false);
            }
        }

        fetchAgency();
    }, [handle]);

    if (loading) {
        return <LoadingScreen />;
    }

    if (error || !agency) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Agency Not Found</h1>
                <p className="text-gray-500 dark:text-gray-400">The agency @{handle} does not exist.</p>
                <button
                    onClick={() => router.push('/')}
                    className="mt-6 px-6 py-2 bg-[#008080] text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                    Go Home
                </button>
            </div>
        );
    }

    const isOwner = currentUser?.uid === agency.ownerId;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
            <AgencyProfile agency={agency} isOwner={isOwner} />
        </div>
    );
}
