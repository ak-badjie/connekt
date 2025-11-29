'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Image, FileVideo, FileText, HardDrive } from 'lucide-react';

interface StorageQuotaProps {
    usedSpace: number; // in bytes
    totalQuota: number; // in bytes
    filesCount: number;
}

export default function StorageQuota({ usedSpace, totalQuota, filesCount }: StorageQuotaProps) {
    const usedGB = usedSpace / (1024 * 1024 * 1024);
    const totalGB = totalQuota / (1024 * 1024 * 1024);
    const percentage = Math.min((usedGB / totalGB) * 100, 100);

    // Mock breakdown data based on percentage (since we might not have exact breakdown yet)
    // In a real app, this would come from props
    const breakdown = [
        { name: 'Images', value: usedGB * 0.4, color: '#008080', icon: Image },
        { name: 'Videos', value: usedGB * 0.3, color: '#f59e0b', icon: FileVideo },
        { name: 'Documents', value: usedGB * 0.3, color: '#10b981', icon: FileText },
    ];

    const data = [
        { name: 'Used', value: percentage },
        { name: 'Remaining', value: 100 - percentage },
    ];

    return (
        <div className="h-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-lg border border-white/20 dark:border-white/5 rounded-2xl p-6 flex flex-col shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Storage Quota</h3>
                <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-[#008080]">
                    <HardDrive size={18} />
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative min-h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="70%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={0}
                            dataKey="value"
                            stroke="none"
                        >
                            <Cell key="used" fill="#008080" />
                            <Cell key="remaining" fill="#e5e7eb" />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-[60%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{Math.round(percentage)}%</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Used</p>
                </div>
            </div>

            <div className="space-y-3 mt-2">
                <div className="flex justify-between text-sm font-medium">
                    <span className="text-gray-500 dark:text-gray-400">Total Space</span>
                    <span className="text-gray-900 dark:text-white">{totalGB.toFixed(1)} GB</span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
                    {breakdown.map((item, i) => (
                        <div key={i} className="flex flex-col items-center p-2 rounded-xl bg-white/40 dark:bg-zinc-800/40 border border-white/10">
                            <div className="mb-1 p-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
                                <item.icon size={12} style={{ color: item.color }} />
                            </div>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">{item.name}</span>
                            <span className="text-xs font-bold text-gray-900 dark:text-white">{item.value.toFixed(1)}GB</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
