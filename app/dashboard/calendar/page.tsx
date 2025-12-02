'use client';

import { useState, useEffect } from 'react';
import { CalendarView } from '@/components/calendar/CalendarView';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { useMinimumLoading } from '@/hooks/useMinimumLoading';

export default function CalendarPage() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate loading calendar data
        const timer = setTimeout(() => {
            setLoading(false);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const shouldShowLoading = useMinimumLoading(loading, 6000); // ConnektTeamLogo animations

    if (shouldShowLoading) {
        return <LoadingScreen variant="team" />;
    }

    return (
        <div className="h-full">
            <CalendarView />
        </div>
    );
}
