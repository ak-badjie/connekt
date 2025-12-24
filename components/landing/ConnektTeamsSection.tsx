'use client';

import React from 'react';
import {
    Users,
    MessageSquare,
    Calendar,
    Shield,
    ArrowRight,
} from 'lucide-react';
import CircularGallery from '@/components/ui/CircularGallery';

// Team features
const TEAM_FEATURES = [
    {
        icon: Users,
        label: 'Smart Collaboration',
        description: 'Work seamlessly with your team'
    },
    {
        icon: MessageSquare,
        label: 'Real-time Chat',
        description: 'Instant team communication'
    },
    {
        icon: Calendar,
        label: 'Task Management',
        description: 'Track projects together'
    },
    {
        icon: Shield,
        label: 'Role Permissions',
        description: 'Secure access control'
    },
];

// Team members for the gallery
const TEAM_MEMBERS = [
    { image: '/potrait2.png', name: 'Sarah', role: 'Designer' },
    { image: '/potrait3.png', name: 'James', role: 'Developer' },
    { image: '/potrait4.png', name: 'Amara', role: 'Manager' },
    { image: '/potrait5.png', name: 'David', role: 'Marketing' },
    { image: '/potrait6.png', name: 'Fatou', role: 'Finance' },
];

export default function ConnektTeamsSection() {
    return (
        <section className="w-full py-16 md:py-24 px-6 md:px-12 lg:px-20 bg-white">
            <div className="max-w-7xl mx-auto">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                    {/* LEFT SIDE: Text Content */}
                    <div className="flex flex-col justify-center">

                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#008080]/10 text-[#008080] text-xs font-bold w-fit mb-6">
                            <Users className="w-4 h-4" />
                            TEAM MANAGEMENT
                        </div>

                        {/* Main Heading */}
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-4">
                            Connekt
                            <br />
                            <span className="text-[#008080]">Teams</span>
                        </h2>

                        {/* Description */}
                        <p className="text-gray-600 text-base md:text-lg mb-8 max-w-md">
                            Manage your teams in ways no other platform has ever done. Collaborate, communicate, and conquer projects together with powerful team tools.
                        </p>

                        {/* Feature Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-8">
                            {TEAM_FEATURES.map((feature) => {
                                const Icon = feature.icon;
                                return (
                                    <div
                                        key={feature.label}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 hover:border-[#008080] transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-[#008080]/10 flex items-center justify-center">
                                            <Icon className="w-5 h-5 text-[#008080]" />
                                        </div>
                                        <div>
                                            <p className="text-gray-900 text-sm font-bold">{feature.label}</p>
                                            <p className="text-gray-500 text-xs">{feature.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* CTA Button */}
                        <button className="inline-flex items-center gap-2 px-6 py-3 bg-[#008080] text-white font-bold rounded-full w-fit hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/20">
                            Build Your Team
                            <ArrowRight size={18} />
                        </button>
                    </div>

                    {/* RIGHT SIDE: Circular Gallery */}
                    <div className="relative h-[550px] md:h-[600px]">
                        <CircularGallery
                            items={TEAM_MEMBERS}
                            height={550}
                            cardWidth={5}
                            cardHeight={6.5}
                            radius={4}
                            autoRotateSpeed={0.006}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
