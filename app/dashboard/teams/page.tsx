'use client';

import { useState, useEffect } from 'react';
import { AgencyTeamsView } from '@/components/teams/AgencyTeamsView';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { useMinimumLoading } from '@/hooks/useMinimumLoading';

export default function UserTeamsPage() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate loading
        const timer = setTimeout(() => {
            setLoading(false);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const shouldShowLoading = useMinimumLoading(loading, 6000); // ConnektTeamLogo animations complete around 6s

    if (shouldShowLoading) {
        return <LoadingScreen variant="team" />;
    }

    return (
        <div className="h-full">
            <AgencyTeamsView />
        </div>
    );
}
