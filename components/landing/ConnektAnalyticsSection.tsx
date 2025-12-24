'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

export default function ConnektAnalyticsSection() {
    return (
        <section className="w-full py-16 md:py-24 px-6 md:px-12 lg:px-20 bg-white">
            <div className="max-w-7xl mx-auto">

                {/* Full Image Container with Text Overlay */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="relative w-full rounded-3xl overflow-hidden"
                >

                    {/* Laptop Image - Full Width */}
                    <motion.img
                        initial={{ scale: 1.1 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        src="/laptop.jpeg"
                        alt="Connekt Analytics Dashboard"
                        className="w-full h-auto"
                    />

                    {/* Text Overlay - Top Left */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="absolute top-6 left-6 md:top-10 md:left-10 lg:top-12 lg:left-12"
                    >
                        <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 max-w-sm">

                            {/* Badge */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.5 }}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#008080]/30 text-[#008080] text-xs font-bold mb-4"
                            >
                                <BarChart3 className="w-4 h-4" />
                                ANALYTICS
                            </motion.div>

                            {/* Heading */}
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.6 }}
                                className="text-2xl md:text-3xl font-black text-white leading-tight mb-3"
                            >
                                Connekt <span className="text-[#008080]">Analytics</span>
                            </motion.h2>

                            {/* Simple Description */}
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.7 }}
                                className="text-white/80 text-sm md:text-base"
                            >
                                Track revenue, monitor projects, and watch your business grow with real-time insights.
                            </motion.p>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
