'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Layout,
    FolderOpen,
    Users,
    Clock,
    ArrowRight,
    Layers,
    Grid3X3,
} from 'lucide-react';

// Workspace features
const WORKSPACE_CARDS = [
    {
        icon: Layers,
        title: 'Multi-Space Management',
        description: 'Create unlimited workspaces for different clients or projects',
        stat: '∞ Workspaces'
    },
    {
        icon: Users,
        title: 'Team Collaboration',
        description: 'Invite team members and assign roles with granular permissions',
        stat: '50+ Members'
    },
    {
        icon: FolderOpen,
        title: 'Smart Organization',
        description: 'Auto-organize files, contracts, and deliverables by project',
        stat: 'Auto-Sort'
    },
    {
        icon: Clock,
        title: 'Activity Timeline',
        description: 'Track every action with a complete audit trail',
        stat: 'Real-time'
    },
];

export default function ConnektWorkspaceSection() {
    return (
        <section className="w-full py-16 md:py-24 px-6 md:px-12 lg:px-20 bg-white">
            <div className="max-w-7xl mx-auto">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                    {/* LEFT SIDE: Interactive Workspace Preview */}
                    <div className="relative">
                        {/* Workspace UI Mockup */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xl"
                        >
                            {/* Header Bar */}
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                </div>
                                <span className="text-sm text-gray-500 font-mono">workspace.connekt.com</span>
                                <div className="w-20" />
                            </div>

                            {/* Sidebar + Content */}
                            <div className="flex">
                                {/* Sidebar */}
                                <div className="hidden sm:block w-40 md:w-48 bg-gray-50 border-r border-gray-200 p-4">
                                    <div className="text-xs text-gray-500 mb-3 font-semibold">WORKSPACES</div>
                                    {['Design Studio', 'Marketing', 'Development'].map((ws, i) => (
                                        <div
                                            key={ws}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-1 text-sm ${i === 0 ? 'bg-[#008080] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                        >
                                            <Grid3X3 className="w-4 h-4" />
                                            {ws}
                                        </div>
                                    ))}
                                    <div className="border-t border-gray-200 my-4" />
                                    <div className="text-xs text-gray-500 mb-3 font-semibold">RECENT</div>
                                    {['Brand Guidelines', 'Q4 Campaign', 'App Redesign'].map((item) => (
                                        <div key={item} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
                                            <FolderOpen className="w-4 h-4" />
                                            {item}
                                        </div>
                                    ))}
                                </div>

                                {/* Main Content */}
                                <div className="flex-1 p-6 bg-white">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-gray-900 font-bold text-lg">Design Studio</h3>
                                            <p className="text-gray-500 text-sm">12 projects • 8 members</p>
                                        </div>
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3, 4].map((i) => (
                                                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#008080] to-teal-400 border-2 border-white" />
                                            ))}
                                            <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs text-gray-600">+4</div>
                                        </div>
                                    </div>

                                    {/* Project Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {['Website Redesign', 'Mobile App', 'Brand Identity', 'Social Media'].map((proj, i) => (
                                            <div key={proj} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-[#008080] transition-colors">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-green-500' : i === 1 ? 'bg-yellow-500' : 'bg-gray-400'}`} />
                                                    <span className="text-gray-900 text-sm font-medium">{proj}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                    <div className="bg-[#008080] h-full rounded-full" style={{ width: `${[75, 45, 30, 90][i]}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* RIGHT SIDE: Text Content */}
                    <div className="flex flex-col justify-center">

                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#008080]/10 text-[#008080] text-xs font-bold w-fit mb-6">
                            <Layout className="w-4 h-4" />
                            WORKSPACES
                        </div>

                        {/* Main Heading */}
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-4">
                            Your Digital
                            <br />
                            <span className="text-[#008080]">Workspace</span>
                        </h2>

                        {/* Description */}
                        <p className="text-gray-600 text-base md:text-lg mb-8 max-w-md">
                            A sophisticated hub for all your projects, teams, and clients. Organize everything in one place with intelligent workspace management.
                        </p>

                        {/* Feature Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                            {WORKSPACE_CARDS.map((card) => {
                                const Icon = card.icon;
                                return (
                                    <div
                                        key={card.title}
                                        className="p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-[#008080] transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-[#008080]/10 flex items-center justify-center flex-shrink-0">
                                                <Icon className="w-5 h-5 text-[#008080]" />
                                            </div>
                                            <div>
                                                <p className="text-gray-900 text-sm font-bold mb-1">{card.title}</p>
                                                <p className="text-[#008080] text-xs font-semibold">{card.stat}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* CTA Button */}
                        <button className="inline-flex items-center gap-2 px-6 py-3 bg-[#008080] text-white font-bold rounded-full w-fit hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/20">
                            Create Workspace
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
