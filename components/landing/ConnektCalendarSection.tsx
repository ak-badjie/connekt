'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Plus,
    ArrowRight,
    Clock,
    MapPin,
    Users,
} from 'lucide-react';

// Calendar days (December 2024)
const CALENDAR_DAYS = [
    { day: 22, events: [] },
    { day: 23, events: [{ color: '#008080' }] },
    { day: 24, events: [{ color: '#f59e0b' }] },
    { day: 25, events: [] },
    { day: 26, events: [{ color: '#008080' }, { color: '#ef4444' }] },
    { day: 27, events: [] },
    { day: 28, events: [{ color: '#008080' }] },
];

// Upcoming events
const EVENTS = [
    {
        title: 'Design Review',
        time: '10:00 AM - 11:30 AM',
        type: 'Meeting',
        attendees: 4,
        color: 'bg-[#008080]'
    },
    {
        title: 'Client Call - TechCorp',
        time: '2:00 PM - 3:00 PM',
        type: 'Call',
        attendees: 2,
        color: 'bg-amber-500'
    },
    {
        title: 'Sprint Planning',
        time: '4:00 PM - 5:00 PM',
        type: 'Meeting',
        attendees: 8,
        color: 'bg-purple-500'
    },
];

export default function ConnektCalendarSection() {
    return (
        <section className="w-full py-16 md:py-24 px-6 md:px-12 lg:px-20 bg-white">
            <div className="max-w-7xl mx-auto">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                    {/* LEFT SIDE: Calendar UI Mockup */}
                    <div className="relative">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xl"
                        >
                            {/* Header */}
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                </div>
                                <span className="text-sm text-gray-500 font-mono">calendar.connekt.com</span>
                                <div className="w-20" />
                            </div>

                            <div className="p-6">
                                {/* Calendar Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-xl font-bold text-gray-900">December 2024</h3>
                                        <div className="flex items-center gap-1">
                                            <button className="p-1 hover:bg-gray-100 rounded"><ChevronLeft className="w-5 h-5 text-gray-500" /></button>
                                            <button className="p-1 hover:bg-gray-100 rounded"><ChevronRight className="w-5 h-5 text-gray-500" /></button>
                                        </div>
                                    </div>
                                    <button className="flex items-center gap-2 px-3 py-2 bg-[#008080] text-white text-sm font-bold rounded-lg">
                                        <Plus className="w-4 h-4" />
                                        Add Event
                                    </button>
                                </div>

                                {/* Week Days Header */}
                                <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                                        <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
                                    ))}
                                </div>

                                {/* Calendar Grid */}
                                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                                    {CALENDAR_DAYS.map((item, i) => (
                                        <div
                                            key={item.day}
                                            className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 cursor-pointer transition-colors ${item.day === 24
                                                ? 'bg-[#008080] text-white'
                                                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            <span className="text-sm font-semibold">{item.day}</span>
                                            {item.events.length > 0 && (
                                                <div className="flex gap-0.5 mt-1">
                                                    {item.events.map((e, j) => (
                                                        <div key={j} className={`w-1.5 h-1.5 rounded-full ${item.day === 24 ? 'bg-white' : ''}`} style={{ backgroundColor: item.day !== 24 ? e.color : undefined }} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Today's Events */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h4 className="text-sm font-bold text-gray-700 mb-4">Today's Schedule</h4>
                                    <div className="space-y-3">
                                        {EVENTS.map((event) => (
                                            <div key={event.title} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                                                <div className={`w-1 h-12 rounded-full ${event.color}`} />
                                                <div className="flex-1">
                                                    <p className="font-semibold text-gray-900 text-sm">{event.title}</p>
                                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {event.time}</span>
                                                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {event.attendees}</span>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">{event.type}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* RIGHT SIDE: Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex flex-col justify-center"
                    >

                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#008080]/10 text-[#008080] text-xs font-bold w-fit mb-6"
                        >
                            <Calendar className="w-4 h-4" />
                            SCHEDULING
                        </motion.div>

                        {/* Main Heading */}
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 }}
                            className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-4"
                        >
                            Connekt
                            <br />
                            <span className="text-[#008080]">Calendar</span>
                        </motion.h2>

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5 }}
                            className="text-gray-600 text-base md:text-lg mb-8 max-w-md"
                        >
                            Never miss a deadline or meeting. Our smart calendar syncs with your projects, tasks, and team availability to keep you perfectly organized.
                        </motion.p>

                        {/* Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.6 }}
                            className="grid grid-cols-3 gap-2 sm:gap-4 mb-8"
                        >
                            <div className="text-center">
                                <div className="text-3xl font-black text-[#008080]">24/7</div>
                                <div className="text-xs text-gray-500">Sync</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-black text-[#008080]">∞</div>
                                <div className="text-xs text-gray-500">Events</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-black text-[#008080]">50+</div>
                                <div className="text-xs text-gray-500">Integrations</div>
                            </div>
                        </motion.div>

                        {/* CTA Button */}
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.7 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#008080] text-white font-bold rounded-full w-fit hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/20"
                        >
                            Open Calendar
                            <ArrowRight size={18} />
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
