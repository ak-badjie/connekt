'use client';

import { MoreVertical } from 'lucide-react';

const projects = [
    { name: 'E-Commerce Platform', status: 'In Progress', date: 'Due Dec 5', color: 'orange' },
    { name: 'Dashboard Analytics', status: 'Completed', date: 'Nov 28', color: 'green' },
    { name: 'Mobile App Launch', status: 'Pending', date: 'Dec 15', color: 'gray' },
    { name: 'API Documentation', status: 'In Progress', date: 'Dec 3', color: 'orange' },
];

export default function ProjectList() {
    return (
        <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-lg border border-white/20 dark:border-white/5 rounded-2xl p-6 h-[420px] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Projects</h3>
                <button className="text-xs text-[#008080] hover:underline font-medium">View All</button>
            </div>
            <div className="space-y-3">
                {projects.map((project, i) => (
                    <div key={i} className="flex items-start justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors group">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{project.name}</p>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${project.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600' :
                                        project.color === 'green' ? 'bg-green-100 dark:bg-green-900/20 text-green-600' :
                                            'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                    }`}>
                                    {project.status}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{project.date}</span>
                            </div>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical size={16} className="text-gray-400" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
