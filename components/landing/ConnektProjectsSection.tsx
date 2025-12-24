'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Briefcase,
    Calendar,
    DollarSign,
    CheckCircle2,
    Clock,
    ArrowRight,
    Target,
    TrendingUp,
} from 'lucide-react';
import Folder from '@/components/ui/Folder';

// Project milestones for the timeline
const MILESTONES = [
    { status: 'completed', label: 'Project Brief', date: 'Dec 1' },
    { status: 'completed', label: 'Design Phase', date: 'Dec 10' },
    { status: 'current', label: 'Development', date: 'Dec 20' },
    { status: 'upcoming', label: 'Testing', date: 'Jan 5' },
    { status: 'upcoming', label: 'Launch', date: 'Jan 15' },
];

export default function ConnektProjectsSection() {
    return (
        <section className="w-full py-16 md:py-24 px-6 md:px-12 lg:px-20 bg-white">
            <div className="max-w-7xl mx-auto">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                    {/* LEFT SIDE: Text Content */}
                    <div className="flex flex-col justify-center order-2 lg:order-1">

                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#008080]/10 text-[#008080] text-xs font-bold w-fit mb-6">
                            <Briefcase className="w-4 h-4" />
                            PROJECT MANAGEMENT
                        </div>

                        {/* Main Heading */}
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-4">
                            Connekt
                            <br />
                            <span className="text-[#008080]">Projects</span>
                        </h2>

                        {/* Description */}
                        <p className="text-gray-600 text-base md:text-lg mb-8 max-w-md">
                            From proposal to payment, manage every project milestone with precision. Track deliverables, budgets, and deadlines in one sophisticated dashboard.
                        </p>

                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="bg-gray-50 rounded-xl p-4 text-center">
                                <div className="text-2xl font-black text-[#008080]">98%</div>
                                <div className="text-xs text-gray-500">On-Time Delivery</div>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 text-center">
                                <div className="text-2xl font-black text-[#008080]">$2.4M</div>
                                <div className="text-xs text-gray-500">Projects Managed</div>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 text-center">
                                <div className="text-2xl font-black text-[#008080]">15K+</div>
                                <div className="text-xs text-gray-500">Active Projects</div>
                            </div>
                        </div>

                        {/* CTA Button */}
                        <button className="inline-flex items-center gap-2 px-6 py-3 bg-[#008080] text-white font-bold rounded-full w-fit hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/20">
                            Start a Project
                            <ArrowRight size={18} />
                        </button>
                    </div>

                    {/* RIGHT SIDE: Project Dashboard Preview */}
                    <div className="relative order-1 lg:order-2">
                        {/* Main Project Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-gray-50 rounded-3xl p-6 border border-gray-200"
                        >
                            {/* Project Header */}
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <Folder
                                        color="#008080"
                                        size={0.5}
                                        label="E-Commerce"
                                    />
                                    <div>
                                        <h3 className="text-gray-900 font-bold text-lg">E-Commerce Platform</h3>
                                        <p className="text-gray-500 text-sm">Client: TechCorp Inc.</p>
                                    </div>
                                </div>
                                <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                    In Progress
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="mb-6">
                                <div className="text-sm font-bold text-gray-700 mb-4">Project Timeline</div>
                                <div className="relative">
                                    {/* Timeline Line */}
                                    <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gray-200" />

                                    {MILESTONES.map((milestone, i) => (
                                        <div key={milestone.label} className="flex items-center gap-4 mb-3 relative">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${milestone.status === 'completed' ? 'bg-[#008080]' :
                                                    milestone.status === 'current' ? 'bg-[#008080] ring-4 ring-[#008080]/20' :
                                                        'bg-gray-200'
                                                }`}>
                                                {milestone.status === 'completed' && (
                                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                                )}
                                                {milestone.status === 'current' && (
                                                    <div className="w-2 h-2 bg-white rounded-full" />
                                                )}
                                            </div>
                                            <div className="flex-1 flex items-center justify-between">
                                                <span className={`text-sm ${milestone.status === 'upcoming' ? 'text-gray-400' : 'text-gray-700'}`}>
                                                    {milestone.label}
                                                </span>
                                                <span className="text-xs text-gray-400">{milestone.date}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Budget & Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white rounded-xl p-4 border border-gray-200">
                                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                                        <DollarSign className="w-4 h-4" />
                                        Budget Spent
                                    </div>
                                    <div className="text-xl font-bold text-gray-900">$12,500 <span className="text-sm text-gray-400">/ $18,000</span></div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
                                        <div className="bg-[#008080] h-full rounded-full" style={{ width: '69%' }} />
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl p-4 border border-gray-200">
                                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                                        <Clock className="w-4 h-4" />
                                        Time Tracked
                                    </div>
                                    <div className="text-xl font-bold text-gray-900">156h <span className="text-sm text-gray-400">/ 200h</span></div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
                                        <div className="bg-amber-500 h-full rounded-full" style={{ width: '78%' }} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
