'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useParams, redirect } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AgencyService, Agency } from '@/lib/services/agency-service';

export default function AgencyDashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const params = useParams();
    const agencyUsername = params.handle as string;
    const [agency, setAgency] = useState<Agency | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            redirect('/auth');
        }
    }, [user, authLoading]);

    useEffect(() => {
        const loadAgency = async () => {
            if (!user || !agencyUsername) return;

            setLoading(true);
            try {
                const agencyData = await AgencyService.getAgencyByUsername(agencyUsername);

                if (!agencyData) {
                    redirect('/agency');
                    return;
                }

                // Check if user has access
                const access = await AgencyService.userHasAccess(agencyData.id!, user.uid);
                setHasAccess(access);

                if (!access) {
                    redirect('/agency');
                    return;
                }

                setAgency(agencyData);
            } catch (error) {
                console.error('Error loading agency:', error);
                redirect('/agency');
            } finally {
                setLoading(false);
            }
        };

        if (user && agencyUsername) {
            loadAgency();
        }
    }, [user, agencyUsername]);

    if (authLoading || loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
                <Loader2 className="animate-spin text-[#008080]" />
            </div>
        );
    }

    if (!user || !hasAccess || !agency) {
        return null;
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-gray-900 dark:text-gray-100">
            <Sidebar agency={agency} />
            <Navbar />
            <main className="lg:pl-72 pt-24 pr-6 pl-6 pb-6 min-h-screen transition-all duration-300">
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl shadow-xl p-6 min-h-[calc(100vh-8rem)]">
                    {children}
                </div>
            </main>
        </div>
    );
}
