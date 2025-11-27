'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: number;
    trend: string;
    trendValue: string;
    color: 'green' | 'white';
}

export default function StatsCard({ title, value, trend, trendValue, color }: StatsCardProps) {
    const isGreen = color === 'green';

    return (
        <div className={`relative p-6 rounded-2xl backdrop-blur-lg border transition-all hover:scale-[1.02] ${isGreen
                ? 'bg-gradient-to-br from-[#008080] to-teal-600 border-teal-500/20 text-white shadow-lg shadow-teal-500/20'
                : 'bg-white/50 dark:bg-zinc-900/50 border-white/20 dark:border-white/5'
            }`}>
            <div className="flex items-start justify-between mb-4">
                <h3 className={`text-sm font-medium ${isGreen ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}`}>{title}</h3>
                {trendValue && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isGreen ? 'bg-white/20' : 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        }`}>
                        {trendValue}
                    </span>
                )}
            </div>
            <p className={`text-4xl font-bold mb-3 ${isGreen ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{value}</p>
            <div className="flex items-center gap-2 text-xs">
                <TrendingUp size={14} className={isGreen ? 'text-white/80' : 'text-gray-400'} />
                <span className={isGreen ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}>{trend}</span>
            </div>
        </div>
    );
}
