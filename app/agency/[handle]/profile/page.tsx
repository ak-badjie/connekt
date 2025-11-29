'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AgencyProfile } from '@/components/profile/AgencyProfile';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { Navbar } from '@/components/layout/Navbar';
import { AgencyService, Agency } from '@/lib/services/agency-service';

export default function AgencyProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const [agency, setAgency] = useState<Agency | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handle = params.handle as string;

    useEffect(() => {
        async function fetchAgency() {
            if (!handle) return;

            try {
                const agencyData = await AgencyService.getAgencyByUsername(handle);

                if (!agencyData) {
                    setError('Agency not found');
                    setLoading(false);
                    return;
                }

                setAgency(agencyData);
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
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Agency Not Found</h1>
                    <p className="text-gray-500 dark:text-gray-400">The agency @{handle} does not exist.</p>
                    <button
                        onClick={() => router.push('/')}
                        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    const isOwner = currentUser?.uid === agency.ownerId;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
            <Navbar />
            <AgencyProfile agency={agency} isOwner={isOwner} />
        </div>
    );
}
