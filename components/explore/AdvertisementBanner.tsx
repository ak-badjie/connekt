'use client';

import { motion } from 'framer-motion';
import { ExternalLink, TrendingUp, Users, Eye } from 'lucide-react';
import Link from 'next/link';

interface AdBanner {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    link: string;
    sponsor: string;
    type: 'user' | 'agency';
}

interface AdvertisementBannerProps {
    ads?: AdBanner[];
}

export function AdvertisementBanner({ ads }: AdvertisementBannerProps) {
    // Mock ad if none provided
    const defaultAd: AdBanner = {
        id: '1',
        title: 'Top-Rated VA Services',
        description: 'Need a virtual assistant? Browse our premium VA collective with 500+ verified professionals.',
        imageUrl: undefined,
        link: '/explore?view=people',
        sponsor: 'ConnektPro',
        type: 'agency'
    };

    const currentAd = ads?.[0] || defaultAd;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#008080] via-teal-600 to-cyan-600 p-1 shadow-2xl shadow-teal-500/30"
        >
            {/* Inner Content */}
            <div className="relative overflow-hidden rounded-[22px] bg-white dark:bg-zinc-900 p-6">
                {/* Glassmorphic Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 via-cyan-50/30 to-blue-50/50 dark:from-teal-950/30 dark:via-cyan-950/20 dark:to-blue-950/30" />

                {/* Animated Circles */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#008080] rounded-full blur-[120px] opacity-10 translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400 rounded-full blur-[100px] opacity-10 -translate-x-1/2 translate-y-1/2" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Left: Content */}
                    <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="px-3 py-1 rounded-full bg-[#008080]/10 dark:bg-[#008080]/20">
                                <span className="text-xs font-bold text-[#008080] uppercase tracking-wide">
                                    Sponsored
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <Eye size={12} />
                                <span>Premium Listing</span>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-2">
                                {currentAd.title}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                {currentAd.description}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                {currentAd.type === 'agency' ? (
                                    <Users size={16} className="text-[#008080]" />
                                ) : (
                                    <TrendingUp size={16} className="text-[#008080]" />
                                )}
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                    by {currentAd.sponsor}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: CTA */}
                    <div className="flex-shrink-0">
                        <Link href={currentAd.link}>
                            <motion.button
                                whileHover={{ scale: 1.05, x: 4 }}
                                whileTap={{ scale: 0.95 }}
                                className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#008080] to-teal-600 hover:from-teal-600 hover:to-[#008080] text-white rounded-2xl font-black text-lg shadow-xl shadow-teal-500/30 transition-all"
                            >
                                View More
                                <motion.div
                                    animate={{ x: [0, 4, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    <ExternalLink size={20} />
                                </motion.div>
                            </motion.button>
                        </Link>
                    </div>
                </div>

                {/* Advertise Here Link */}
                <div className="relative z-10 mt-4 pt-4 border-t border-gray-200 dark:border-zinc-800">
                    <Link href="/advertise" className="inline-flex items-center gap-2 text-sm font-bold text-[#008080] hover:text-teal-600 transition-colors group">
                        <TrendingUp size={14} />
                        <span className="group-hover:underline">Advertise your services here</span>
                        <ExternalLink size={12} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
