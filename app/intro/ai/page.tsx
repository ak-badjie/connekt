'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { useMinimumLoading } from '@/hooks/useMinimumLoading';
import { useRouter } from 'next/navigation';
import { Bot, Sparkles, ArrowRight, Zap, Target, TrendingUp } from 'lucide-react';

export default function AIIntroPage() {
    const router = useRouter();

    const shouldShowLoading = useMinimumLoading(true, 6000); // Always load for at least 6s

    if (shouldShowLoading) {
        return <LoadingScreen variant="ai" />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#008080]/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 flex flex-col items-center max-w-4xl text-center"
            >
                {/* Logo / Icon */}
                <motion.div
                    animate={{
                        boxShadow: ["0 0 20px rgba(0,128,128,0.2)", "0 0 50px rgba(0,128,128,0.4)", "0 0 20px rgba(0,128,128,0.2)"]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-24 h-24 rounded-2xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-zinc-800/50 flex items-center justify-center mb-8 relative group shadow-xl"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#008080]/20 to-amber-500/20 blur-xl group-hover:blur-2xl transition-all rounded-2xl" />
                    <Sparkles className="w-10 h-10 text-[#008080] relative z-10" />
                </motion.div>

                <h1 className="text-6xl font-bold mb-6 tracking-tight bg-gradient-to-r from-[#008080] to-amber-500 bg-clip-text text-transparent">
                    Meet ConnektAI
                </h1>

                <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl leading-relaxed">
                    Your intelligent career companion. Using advanced agentic workflows to
                    <span className="text-[#008080] font-medium mx-1">auto-optimize your resume</span>,
                    <span className="text-[#008080] font-medium mx-1">match tailored jobs</span>, and
                    <span className="text-[#008080] font-medium mx-1">draft winning proposals</span>
                    while you sleep.
                </p>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
                    {[
                        { icon: Target, title: "Smart Matching", desc: "AI analyzes your bio to find the perfect role.", color: "from-[#008080] to-teal-600" },
                        { icon: Zap, title: "Auto-Proposals", desc: "Drafts professional cover letters instantly.", color: "from-amber-500 to-orange-500" },
                        { icon: TrendingUp, title: "Market Insights", desc: "Real-time salary and demand analytics.", color: "from-[#008080] to-teal-600" }
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + (i * 0.1) }}
                            className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-zinc-800/50 hover:border-[#008080]/50 p-6 rounded-2xl text-left transition-all hover:-translate-y-1 hover:shadow-xl"
                        >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}>
                                <feature.icon size={24} className="text-white" />
                            </div>
                            <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">{feature.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>

                <button
                    onClick={() => router.push('/intro/pro')}
                    className="group relative px-8 py-4 bg-gradient-to-r from-[#008080] to-teal-600 hover:from-teal-600 hover:to-[#008080] text-white font-bold text-lg rounded-full flex items-center gap-3 hover:scale-105 transition-all shadow-lg shadow-teal-500/30"
                >
                    Experience the Future
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
            </motion.div>
        </div>
    );
}
