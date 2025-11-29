'use client';

import { useState } from 'react';
import { Users, BarChart3, AlertCircle } from 'lucide-react';

export default function TeamWorkload() {
    const [members] = useState([
        {
            id: 1,
            name: 'Sarah Chen',
            role: 'Senior Designer',
            load: 85,
            tasks: 12,
            avatar: 'SC'
        },
        {
            id: 2,
            name: 'Mike Ross',
            role: 'Copywriter',
            load: 45,
            tasks: 5,
            avatar: 'MR'
        },
        {
            id: 3,
            name: 'Jessica Pearson',
            role: 'Project Manager',
            load: 92,
            tasks: 18,
            avatar: 'JP'
        },
        {
            id: 4,
            name: 'Harvey Specter',
            role: 'Creative Director',
            load: 60,
            tasks: 8,
            avatar: 'HS'
        }
    ]);

    const getLoadColor = (load: number) => {
        if (load >= 90) return 'bg-red-500';
        if (load >= 70) return 'bg-amber-500';
        return 'bg-green-500';
    };

    const getLoadText = (load: number) => {
        if (load >= 90) return 'text-red-600';
        if (load >= 70) return 'text-amber-600';
        return 'text-green-600';
    };

    return (
        <div className="h-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-lg border border-white/20 dark:border-white/5 rounded-2xl p-6 overflow-y-auto custom-scrollbar shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users size={20} className="text-[#008080]" />
                        Team Workload
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Capacity planning</p>
                </div>
                <button className="text-gray-400 hover:text-[#008080] transition-colors">
                    <BarChart3 size={18} />
                </button>
            </div>

            <div className="space-y-5">
                {members.map((member) => (
                    <div key={member.id} className="group">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 border border-white/10">
                                    {member.avatar}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{member.name}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{member.role}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`text-xs font-bold ${getLoadText(member.load)}`}>
                                    {member.load}%
                                </span>
                                <p className="text-[10px] text-gray-400">{member.tasks} active tasks</p>
                            </div>
                        </div>

                        <div className="relative h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${getLoadColor(member.load)}`}
                                style={{ width: `${member.load}%` }}
                            />
                        </div>

                        {member.load >= 90 && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] text-red-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                <AlertCircle size={10} />
                                Over capacity warning
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
