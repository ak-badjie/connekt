'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Video,
    Mic,
    MicOff,
    VideoOff,
    Monitor,
    MessageSquare,
    Users,
    Phone,
    ArrowRight,
    Settings,
    Hand,
} from 'lucide-react';

// Meeting participants
const PARTICIPANTS = [
    { name: 'Sarah Chen', role: 'Host', speaking: true },
    { name: 'James Wilson', role: 'Designer', speaking: false },
    { name: 'Amara Diallo', role: 'Developer', speaking: false },
    { name: 'David Kim', role: 'Manager', speaking: false },
];

export default function ConnektMeetingsSection() {
    return (
        <section className="w-full py-16 md:py-24 px-6 md:px-12 lg:px-20 bg-slate-50">
            <div className="max-w-7xl mx-auto">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                    {/* LEFT SIDE: Text Content */}
                    <div className="flex flex-col justify-center order-2 lg:order-1">

                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#008080]/10 text-[#008080] text-xs font-bold w-fit mb-6">
                            <Video className="w-4 h-4" />
                            VIDEO MEETINGS
                        </div>

                        {/* Main Heading */}
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-4">
                            Connekt
                            <br />
                            <span className="text-[#008080]">Meetings</span>
                        </h2>

                        {/* Description */}
                        <p className="text-gray-600 text-base md:text-lg mb-8 max-w-md">
                            Crystal-clear video meetings integrated with your projects. Screen share, record, and collaborate in real-time without leaving the platform.
                        </p>

                        {/* Feature Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            {[
                                { icon: Monitor, label: 'Screen Share', desc: 'Present with ease' },
                                { icon: MessageSquare, label: 'Live Chat', desc: 'In-meeting messages' },
                                { icon: Users, label: 'Up to 100', desc: 'Participants per call' },
                                { icon: Settings, label: 'HD Quality', desc: '1080p video' },
                            ].map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.label} className="bg-white rounded-xl p-4 border border-gray-200 hover:border-[#008080] transition-colors">
                                        <div className="w-10 h-10 rounded-lg bg-[#008080]/10 flex items-center justify-center mb-3">
                                            <Icon className="w-5 h-5 text-[#008080]" />
                                        </div>
                                        <p className="font-bold text-gray-900 text-sm">{item.label}</p>
                                        <p className="text-gray-500 text-xs">{item.desc}</p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* CTA Button */}
                        <button className="inline-flex items-center gap-2 px-6 py-3 bg-[#008080] text-white font-bold rounded-full w-fit hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/20">
                            Start a Meeting
                            <ArrowRight size={18} />
                        </button>
                    </div>

                    {/* RIGHT SIDE: Video Meeting UI Mockup */}
                    <div className="relative order-1 lg:order-2">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl"
                        >
                            {/* Header */}
                            <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-sm text-white font-mono">32:15</span>
                                </div>
                                <span className="text-sm text-gray-400">Design Review Meeting</span>
                            </div>

                            {/* Video Grid */}
                            <div className="p-4">
                                <div className="grid grid-cols-2 gap-3">
                                    {PARTICIPANTS.map((p, i) => (
                                        <div
                                            key={p.name}
                                            className={`relative aspect-video rounded-xl overflow-hidden ${i === 0 ? 'bg-gradient-to-br from-[#008080] to-teal-600' : 'bg-zinc-800'
                                                } ${p.speaking ? 'ring-2 ring-[#008080]' : ''}`}
                                        >
                                            {/* Avatar placeholder */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${i === 0 ? 'bg-white/20 text-white' : 'bg-zinc-700 text-gray-400'
                                                    }`}>
                                                    {p.name[0]}
                                                </div>
                                            </div>
                                            {/* Name tag */}
                                            <div className="absolute bottom-2 left-2 flex items-center gap-2">
                                                <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">{p.name}</span>
                                                {p.speaking && (
                                                    <div className="flex items-center gap-0.5">
                                                        <div className="w-1 h-3 bg-[#008080] rounded-full animate-pulse" />
                                                        <div className="w-1 h-4 bg-[#008080] rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                                                        <div className="w-1 h-2 bg-[#008080] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                                                    </div>
                                                )}
                                            </div>
                                            {/* Host badge */}
                                            {p.role === 'Host' && (
                                                <div className="absolute top-2 right-2 text-[10px] bg-[#008080] text-white px-2 py-0.5 rounded">HOST</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="px-4 py-4 flex items-center justify-center gap-4 border-t border-zinc-800">
                                <button className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-full">
                                    <Mic className="w-5 h-5 text-white" />
                                </button>
                                <button className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-full">
                                    <Video className="w-5 h-5 text-white" />
                                </button>
                                <button className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-full">
                                    <Monitor className="w-5 h-5 text-white" />
                                </button>
                                <button className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-full">
                                    <Hand className="w-5 h-5 text-white" />
                                </button>
                                <button className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-full">
                                    <MessageSquare className="w-5 h-5 text-white" />
                                </button>
                                <button className="p-4 bg-red-500 hover:bg-red-600 rounded-full">
                                    <Phone className="w-5 h-5 text-white rotate-[135deg]" />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
