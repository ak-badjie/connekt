'use client';

import { useState } from 'react';
import { Megaphone, TrendingUp, Users, MousePointer, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function ActiveCampaigns() {
    const [campaigns] = useState([
        {
            id: 1,
            name: 'Summer Sale 2025',
            platform: 'Instagram',
            status: 'active',
            reach: '125K',
            engagement: '4.8%',
            roi: '+215%',
            progress: 65,
            trend: 'up'
        },
        {
            id: 2,
            name: 'B2B Lead Gen',
            platform: 'LinkedIn',
            status: 'active',
            reach: '45K',
            engagement: '2.1%',
            roi: '+180%',
            progress: 40,
            trend: 'up'
        },
        {
            id: 3,
            name: 'Retargeting Ads',
            platform: 'Google Ads',
            status: 'paused',
            reach: '89K',
            engagement: '1.5%',
            roi: '-12%',
            progress: 85,
            trend: 'down'
        }
    ]);

    return (
        <div className="h-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-lg border border-white/20 dark:border-white/5 rounded-2xl p-6 overflow-y-auto custom-scrollbar shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Megaphone size={20} className="text-[#008080]" />
                        Active Campaigns
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Live performance tracking</p>
                </div>
                <button className="text-[#008080] hover:bg-[#008080]/10 p-2 rounded-lg transition-colors">
                    <TrendingUp size={18} />
                </button>
            </div>

            <div className="space-y-4">
                {campaigns.map((campaign) => (
                    <div
                        key={campaign.id}
                        className="p-4 bg-white/40 dark:bg-zinc-800/40 border border-white/10 rounded-xl hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-all"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{campaign.name}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{campaign.platform}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${campaign.status === 'active'
                                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700'
                                    : 'bg-amber-100 dark:bg-amber-900/20 text-amber-700'
                                }`}>
                                {campaign.status}
                            </span>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="text-center p-2 bg-white/50 dark:bg-zinc-900/50 rounded-lg">
                                <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500 mb-1">
                                    <Users size={10} /> Reach
                                </div>
                                <div className="text-xs font-bold text-gray-900 dark:text-white">{campaign.reach}</div>
                            </div>
                            <div className="text-center p-2 bg-white/50 dark:bg-zinc-900/50 rounded-lg">
                                <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500 mb-1">
                                    <MousePointer size={10} /> Eng.
                                </div>
                                <div className="text-xs font-bold text-gray-900 dark:text-white">{campaign.engagement}</div>
                            </div>
                            <div className="text-center p-2 bg-white/50 dark:bg-zinc-900/50 rounded-lg">
                                <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500 mb-1">
                                    <TrendingUp size={10} /> ROI
                                </div>
                                <div className={`text-xs font-bold flex items-center justify-center gap-1 ${campaign.trend === 'up' ? 'text-green-600' : 'text-red-500'
                                    }`}>
                                    {campaign.roi}
                                    {campaign.trend === 'up' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-gray-500">
                                <span>Duration</span>
                                <span>{campaign.progress}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[#008080] to-teal-400 rounded-full transition-all duration-500"
                                    style={{ width: `${campaign.progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
