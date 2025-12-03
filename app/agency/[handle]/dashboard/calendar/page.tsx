'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CalendarView } from '@/components/calendar/CalendarView';
import { AgencyService } from '@/lib/services/agency-service';
import { useAuth } from '@/context/AuthContext';

export default function AgencyCalendarPage() {
    const params = useParams();
    const { user } = useAuth();
    const [agencyId, setAgencyId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const handle = params.handle as string;
    const username = handle?.startsWith('@') ? handle.slice(1) : handle;

    useEffect(() => {
        async function fetchAgencyId() {
            if (!username) return;
            try {
                const agency = await AgencyService.getAgencyByUsername(username);
                if (agency) {
                    setAgencyId(agency.id!);
                }
            } catch (error) {
                console.error('Error fetching agency:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchAgencyId();
    }, [username]);

    if (loading) {
        return <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008080]"></div>
        </div>;
    }

    if (!agencyId) {
        return <div className="h-full flex items-center justify-center text-gray-500">Agency not found</div>;
    }

    return (
        <div className="h-full">
            <CalendarView agencyId={agencyId} />
        </div>
    );
}
