'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';

export default function ConnektAnalyticsSection() {
    return (
        <section className="w-full py-16 md:py-24 px-6 md:px-12 lg:px-20 bg-white">
            <div className="max-w-7xl mx-auto">

                {/* Full Image Container with Text Overlay */}
                <div className="relative w-full rounded-3xl overflow-hidden">

                    {/* Laptop Image - Full Width */}
                    <img
                        src="/laptop.jpeg"
                        alt="Connekt Analytics Dashboard"
                        className="w-full h-auto"
                    />

                    {/* Text Overlay - Top Left */}
                    <div className="absolute top-6 left-6 md:top-10 md:left-10 lg:top-12 lg:left-12">
                        <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 max-w-sm">

                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#008080]/30 text-[#008080] text-xs font-bold mb-4">
                                <BarChart3 className="w-4 h-4" />
                                ANALYTICS
                            </div>

                            {/* Heading */}
                            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-3">
                                Connekt <span className="text-[#008080]">Analytics</span>
                            </h2>

                            {/* Simple Description */}
                            <p className="text-white/80 text-sm md:text-base">
                                Track revenue, monitor projects, and watch your business grow with real-time insights.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
