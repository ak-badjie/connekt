'use client';

import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface StatsCardProps {
    title: string;
    value: number | string;
    trend: string;
    trendValue: string;
    color: 'green' | 'white';
    onClick?: () => void;
    icon?: LucideIcon;
    showMiniChart?: boolean;
    chartData?: number[];
    actionButton?: ReactNode;
}

export default function StatsCard({
    title,
    value,
    trend,
    trendValue,
    color,
    onClick,
    icon: Icon,
    showMiniChart = false,
    chartData = [3, 5, 2, 8, 1, 4, 6],
    actionButton
}: StatsCardProps) {
    const isGreen = color === 'green';
    const isClickable = !!onClick;

    // Normalize chart data for display (0-1 range)
    const maxValue = Math.max(...chartData);
    const normalizedData = chartData.map(v => v / maxValue);

    return (
        <div
            onClick={onClick}
            className={`relative p-6 rounded-2xl backdrop-blur-lg border transition-all overflow-hidden ${isClickable ? 'cursor-pointer hover:scale-[1.03] active:scale-[0.98]' : 'hover:scale-[1.02]'
                } ${isGreen
                    ? 'bg-gradient-to-br from-[#008080] to-teal-600 border-teal-500/20 text-white shadow-lg shadow-teal-500/20'
                    : 'bg-white/50 dark:bg-zinc-900/50 border-white/20 dark:border-white/5'
                }`}
        >
            {/* Decorative background pattern */}
            {!isGreen && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#008080]/5 to-teal-600/5 rounded-full blur-3xl -z-10" />
            )}

            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                    {Icon && (
                        <div className={`p-2 rounded-lg ${isGreen
                                ? 'bg-white/20'
                                : 'bg-gradient-to-br from-[#008080]/10 to-teal-600/10'
                            }`}>
                            <Icon size={16} className={isGreen ? 'text-white' : 'text-[#008080]'} />
                        </div>
                    )}
                    <h3 className={`text-sm font-medium ${isGreen ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}`}>
                        {title}
                    </h3>
                </div>
                {trendValue && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isGreen
                            ? 'bg-white/20'
                            : 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        }`}>
                        {trendValue}
                    </span>
                )}
            </div>

            <p className={`text-4xl font-bold mb-3 ${isGreen ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                {value}
            </p>

            <div className="flex items-center gap-2 text-xs mb-3">
                <TrendingUp size={14} className={isGreen ? 'text-white/80' : 'text-gray-400'} />
                <span className={isGreen ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}>{trend}</span>
            </div>

            {/* Mini chart visualization */}
            {showMiniChart && (
                <div className="flex items-end gap-1 h-12 mt-4">
                    {normalizedData.map((height, index) => (
                        <div
                            key={index}
                            className={`flex-1 rounded-t transition-all ${isGreen
                                    ? 'bg-white/30 hover:bg-white/40'
                                    : 'bg-gradient-to-t from-[#008080]/40 to-teal-600/40 hover:from-[#008080]/50 hover:to-teal-600/50'
                                }`}
                            style={{
                                height: `${Math.max(height * 100, 20)}%`,
                                animation: `slideUp 0.3s ease-out ${index * 0.05}s backwards`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Action button */}
            {actionButton && (
                <div className="mt-4">
                    {actionButton}
                </div>
            )}

            {isClickable && (
                <div className={`absolute bottom-2 right-2 text-xs font-medium opacity-50 ${isGreen ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                    Click to view →
                </div>
            )}

            <style jsx>{`
                @keyframes slideUp {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}
