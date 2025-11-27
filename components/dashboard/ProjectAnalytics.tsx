'use client';

import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

const data = [
    { name: 'Jan', completed: 4, running: 2 },
    { name: 'Feb', completed: 3, running: 4 },
    { name: 'Mar', completed: 7, running: 3 },
    { name: 'Apr', completed: 5, running: 5 },
    { name: 'May', completed: 9, running: 2 },
    { name: 'Jun', completed: 6, running: 6 },
];

export default function ProjectAnalytics() {
    return (
        <div className="h-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-lg border border-white/20 dark:border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Project Analytics</h3>
                <select className="text-xs bg-transparent border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 outline-none">
                    <option>This Month</option>
                    <option>Last 3 Months</option>
                    <option>This Year</option>
                </select>
            </div>
            <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                        <YAxis stroke="#9ca3af" fontSize={12} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(0,0,0,0.8)',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '12px'
                            }}
                        />
                        <Bar dataKey="completed" fill="#008080" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="running" fill="#f97316" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
