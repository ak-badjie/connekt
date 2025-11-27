'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FirebaseService } from '@/lib/firebase-service';

export default function TeamCollaboration() {
    const { user } = useAuth();
    const [team, setTeam] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            FirebaseService.getTeamMembers(user.uid).then(setTeam);
        }
    }, [user]);

    return (
        <div className="h-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-lg border border-white/20 dark:border-white/5 rounded-2xl p-6 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Team Collaboration</h3>
                <button className="text-xs text-[#008080] hover:underline font-medium">Invite</button>
            </div>
            <div className="space-y-4">
                {team.map((member, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#008080] to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                            {member.avatar}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{member.role}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${member.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/20 text-green-600' :
                                member.status === 'In Progress' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600' :
                                    'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                            }`}>
                            {member.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
