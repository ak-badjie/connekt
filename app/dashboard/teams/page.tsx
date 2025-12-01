'use client';

import { AgencyTeamsView } from '@/components/teams/AgencyTeamsView';

export default function UserTeamsPage() {
    // Reusing AgencyTeamsView for now as the structure is similar, 
    // but in real app might want a simplified version for users
    return (
        <div className="h-full">
            <AgencyTeamsView />
        </div>
    );
}
