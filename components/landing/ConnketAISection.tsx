'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    FileText,
    Sparkles,
    MessageSquare,
    Zap,
    ArrowRight,
    Target,
    Users,
    FileSignature,
    Mail,
    Brain,
    BarChart3,
    ClipboardList,
    UserCheck,
    Briefcase,
    TrendingUp,
    Calendar,
} from 'lucide-react';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';

// All 15+ AI Tools available
const AI_TOOLS = [
    { icon: Sparkles, label: 'Bio Enhancer', description: 'AI-powered profile optimization' },
    { icon: FileText, label: 'Resume Parser', description: 'Smart document analysis' },
    { icon: MessageSquare, label: 'Proposal Writer', description: 'Generate winning proposals' },
    { icon: Target, label: 'Smart Matching', description: 'Find perfect opportunities' },
    { icon: Mail, label: 'Email Composer', description: 'Draft professional emails' },
    { icon: FileSignature, label: 'Contract Drafter', description: 'Legal document generation' },
    { icon: Brain, label: 'Skills Suggester', description: 'Discover hidden talents' },
    { icon: Users, label: 'Candidate Finder', description: 'Best-fit talent search' },
    { icon: UserCheck, label: 'Candidate Compare', description: 'Side-by-side analysis' },
    { icon: Briefcase, label: 'Job Description AI', description: 'Craft compelling listings' },
    { icon: ClipboardList, label: 'Task Generator', description: 'Auto-create project tasks' },
    { icon: Zap, label: 'Task Auto-Assign', description: 'Smart task allocation' },
    { icon: BarChart3, label: 'Market Insights', description: 'Salary & demand analytics' },
    { icon: TrendingUp, label: 'Profile Optimizer', description: 'Boost your visibility' },
    { icon: Calendar, label: 'Schedule Assistant', description: 'AI meeting coordinator' },
];

export default function ConnketAISection({ isVisible }: { isVisible: boolean }) {
    return (
        <section className="w-full py-16 md:py-24 px-6 md:px-12 lg:px-20 bg-white">
            <div className="max-w-7xl mx-auto">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">

                    {/* LEFT SIDE: Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col justify-start"
                    >

                        {/* Icon + Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="flex items-center gap-3 mb-6"
                        >
                            <ConnektAIIcon className="w-12 h-12" />
                            <span className="px-3 py-1 rounded-full bg-[#008080]/10 text-[#008080] text-xs font-bold">
                                AI POWERED
                            </span>
                        </motion.div>

                        {/* Main Heading */}
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-4"
                        >
                            Connekt
                            <br />
                            <span className="text-[#008080]">AI Services</span>
                        </motion.h2>

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="text-gray-600 text-base md:text-lg mb-6 max-w-md"
                        >
                            Leverage the power of AI to enhance your profile, parse resumes, generate proposals, and find perfect matches automatically.
                        </motion.p>

                        {/* 100+ Tools Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#008080] to-teal-600 text-white font-bold rounded-full w-fit mb-8 shadow-lg shadow-teal-500/20"
                        >
                            <Zap className="w-5 h-5" />
                            <span>100+ AI Tools Available</span>
                        </motion.div>

                        {/* CTA Button */}
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#008080] text-white font-bold rounded-full w-fit hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/20 mb-8"
                        >
                            Explore All AI Features
                            <ArrowRight size={18} />
                        </motion.button>

                        {/* Image */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.6 }}
                            className="relative w-full max-w-lg"
                        >
                            <img
                                src="/va1.jpeg"
                                alt="AI Assistant"
                                className="w-full h-auto rounded-2xl shadow-lg"
                            />
                        </motion.div>
                    </motion.div>

                    {/* RIGHT SIDE: All AI Tools Grid */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="bg-gray-50 rounded-3xl p-6 md:p-8"
                    >
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {AI_TOOLS.map((tool, i) => {
                                const Icon = tool.icon;
                                return (
                                    <motion.div
                                        key={tool.label}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.3 + i * 0.05 }}
                                        className="flex flex-col items-center text-center p-4 rounded-xl bg-white border border-gray-200 hover:border-[#008080] hover:shadow-lg transition-all cursor-pointer group"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-[#008080]/10 flex items-center justify-center mb-3 group-hover:bg-[#008080] transition-colors">
                                            <Icon className="w-6 h-6 text-[#008080] group-hover:text-white transition-colors" />
                                        </div>
                                        <p className="text-sm font-bold text-gray-900 mb-1">{tool.label}</p>
                                        <p className="text-[10px] text-gray-500 leading-tight">{tool.description}</p>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* More Tools Indicator */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 1 }}
                            className="mt-4 text-center"
                        >
                            <span className="text-sm text-gray-500">
                                + many more AI-powered tools
                            </span>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}