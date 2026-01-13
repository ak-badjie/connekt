'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    Mail,
    MessageCircle,
    Wallet,
    HardDrive,
    Cpu,
    FileText,
    Briefcase,
    ArrowRight,
    Zap,
    Globe,
    Shield,
} from 'lucide-react';

// Sample notifications for demo
const DEMO_NOTIFICATIONS = [
    { icon: Mail, title: 'New Mail', message: 'Sarah sent you a contract', color: 'bg-blue-500', priority: 'high' },
    { icon: Wallet, title: 'Payment Received', message: '$2,500 from TechCorp', color: 'bg-green-500', priority: 'medium' },
    { icon: MessageCircle, title: 'New Message', message: 'James: "Ready to review?"', color: 'bg-cyan-500', priority: 'low' },
    { icon: Briefcase, title: 'Project Update', message: 'E-Commerce milestone completed', color: 'bg-indigo-500', priority: 'medium' },
    { icon: Cpu, title: 'AI Credit Alert', message: '1000 credits remaining', color: 'bg-purple-500', priority: 'high' },
];

// Notification categories
const NOTIFICATION_CATEGORIES = [
    { icon: Mail, label: 'Mail', count: 12 },
    { icon: MessageCircle, label: 'Messages', count: 5 },
    { icon: Wallet, label: 'Payments', count: 3 },
    { icon: Briefcase, label: 'Projects', count: 8 },
    { icon: HardDrive, label: 'Storage', count: 1 },
    { icon: Cpu, label: 'AI', count: 2 },
];

export default function ConnektNotificationsSection() {
    const [activeNotifIndex, setActiveNotifIndex] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);

    // Auto-cycle through notifications
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveNotifIndex((prev) => (prev + 1) % DEMO_NOTIFICATIONS.length);
            setIsExpanded(true);
            setTimeout(() => setIsExpanded(false), 2500);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const activeNotif = DEMO_NOTIFICATIONS[activeNotifIndex];
    const Icon = activeNotif.icon;

    return (
        <section className="w-full py-16 md:py-24 px-6 md:px-12 lg:px-20 bg-white">
            <div className="max-w-7xl mx-auto">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                    {/* LEFT SIDE: Dynamic Island Demo */}
                    <div className="relative flex flex-col items-center">

                        {/* Dynamic Island */}
                        <motion.div
                            initial={{ opacity: 0, y: -50, scale: 0.8 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", damping: 20, stiffness: 200, delay: 0.2 }}
                        >
                            <motion.div
                                layout
                                animate={{
                                    width: isExpanded ? 340 : 200,
                                    height: isExpanded ? 100 : 44,
                                    borderRadius: isExpanded ? 24 : 22
                                }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="bg-black rounded-full shadow-2xl overflow-hidden cursor-pointer"
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                <AnimatePresence mode="wait">
                                    {!isExpanded ? (
                                        <motion.div
                                            key="compact"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center justify-center gap-3 h-full px-4"
                                        >
                                            <div className={`w-6 h-6 rounded-full ${activeNotif.color} flex items-center justify-center`}>
                                                <Icon className="w-3.5 h-3.5 text-white" />
                                            </div>
                                            <span className="text-white text-sm font-medium truncate">
                                                {activeNotif.title}
                                            </span>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="expanded"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="p-4 h-full flex flex-col justify-center"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full ${activeNotif.color} flex items-center justify-center`}>
                                                    <Icon className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-semibold text-sm">{activeNotif.title}</h3>
                                                    <p className="text-gray-400 text-xs">{activeNotif.message}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-end mt-2">
                                                <span className="text-[#008080] text-xs font-medium">View →</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </motion.div>

                        {/* Arrow pointing to Dynamic Island */}
                        <div className="mt-6 text-center">
                            <motion.div
                                animate={{ y: [0, -8, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="text-gray-400"
                            >
                                ↑
                            </motion.div>
                            <p className="text-sm text-gray-500 mt-1">Dynamic Island</p>
                        </div>

                        {/* Notification Categories */}
                        <div className="mt-10 w-full max-w-md">
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                                <h4 className="text-sm font-bold text-gray-700 mb-4">All Notification Types</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                                    {NOTIFICATION_CATEGORIES.map((cat) => {
                                        const CatIcon = cat.icon;
                                        return (
                                            <div key={cat.label} className="bg-white rounded-xl p-3 border border-gray-200 hover:border-[#008080] transition-colors cursor-pointer text-center">
                                                <div className="w-10 h-10 mx-auto rounded-lg bg-[#008080]/10 flex items-center justify-center mb-2">
                                                    <CatIcon className="w-5 h-5 text-[#008080]" />
                                                </div>
                                                <p className="text-xs font-semibold text-gray-700">{cat.label}</p>
                                                <p className="text-[10px] text-[#008080]">{cat.count} new</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: Text Content */}
                    <div className="flex flex-col justify-center">

                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#008080]/10 text-[#008080] text-xs font-bold w-fit mb-6">
                            <Bell className="w-4 h-4" />
                            NOTIFICATIONS
                        </div>

                        {/* Main Heading */}
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-4">
                            Updates &
                            <br />
                            <span className="text-[#008080]">Notifications</span>
                        </h2>

                        {/* Description */}
                        <p className="text-gray-600 text-base md:text-lg mb-8 max-w-md">
                            Never miss a beat. Our intelligent notification system has ears everywhere — from payments to messages, AI alerts to project updates. Everything arrives instantly through our beautiful Dynamic Island interface.
                        </p>

                        {/* Feature List */}
                        <div className="space-y-4 mb-8">
                            {[
                                { icon: Zap, label: 'Instant Delivery', desc: 'Real-time updates across all devices' },
                                { icon: Globe, label: 'Unified Inbox', desc: 'All notifications in one place' },
                                { icon: Shield, label: 'Smart Filtering', desc: 'Priority-based organization' },
                            ].map((item) => {
                                const FeatureIcon = item.icon;
                                return (
                                    <div key={item.label} className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-[#008080]/10 flex items-center justify-center">
                                            <FeatureIcon className="w-6 h-6 text-[#008080]" />
                                        </div>
                                        <div>
                                            <p className="text-gray-900 font-bold">{item.label}</p>
                                            <p className="text-gray-500 text-sm">{item.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* CTA Button */}
                        <button className="inline-flex items-center gap-2 px-6 py-3 bg-[#008080] text-white font-bold rounded-full w-fit hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/20">
                            Manage Notifications
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
