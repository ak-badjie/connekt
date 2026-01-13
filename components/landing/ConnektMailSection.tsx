'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Send,
    FileText,
    Shield,
    Clock,
    ArrowRight,
    Check,
    Paperclip,
} from 'lucide-react';
import ConnektMailIcon from '@/components/branding/ConnektMailIcon';

// Mail features to showcase
const MAIL_FEATURES = [
    {
        icon: Send,
        label: '@connekt.com Email',
        description: 'Your professional email address'
    },
    {
        icon: FileText,
        label: 'Contract Attachments',
        description: 'Legally binding documents'
    },
    {
        icon: Shield,
        label: 'Secure Messaging',
        description: 'End-to-end encrypted'
    },
    {
        icon: Clock,
        label: 'Smart Scheduling',
        description: 'Automated follow-ups'
    }
];

// Mock email component to visualize the mail system
function MockEmailPreview() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200"
        >
            {/* Email Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ConnektMailIcon className="w-5 h-5" />
                    <span className="text-sm font-bold text-gray-900">Connekt Mail</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs text-gray-500">Secure</span>
                </div>
            </div>

            {/* Email Content */}
            <div className="p-4">
                {/* From/To */}
                <div className="mb-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 w-12">From:</span>
                        <span className="font-medium text-gray-900">john@connekt.com</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 w-12">To:</span>
                        <span className="font-medium text-gray-900">sarah@connekt.com</span>
                    </div>
                </div>

                {/* Subject */}
                <div className="mb-4 pb-4 border-b border-gray-100">
                    <h4 className="font-bold text-gray-900">Project Proposal: Web Development</h4>
                </div>

                {/* Body Preview */}
                <div className="space-y-2 mb-4">
                    <div className="h-2.5 w-full bg-gray-100 rounded" />
                    <div className="h-2.5 w-4/5 bg-gray-100 rounded" />
                    <div className="h-2.5 w-3/4 bg-gray-100 rounded" />
                </div>

                {/* Contract Attachment */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#008080]/5 border border-[#008080]/20"
                >
                    <div className="w-10 h-10 rounded-lg bg-[#008080]/10 flex items-center justify-center">
                        <Paperclip className="w-5 h-5 text-[#008080]" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">Contract_Agreement.pdf</p>
                        <p className="text-xs text-gray-500">Legally binding • Ready to sign</p>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-[#008080] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                    </div>
                </motion.div>
            </div>

            {/* Email Actions */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center gap-2">
                <button className="flex-1 py-2 px-4 bg-[#008080] text-white text-sm font-bold rounded-lg hover:bg-teal-600 transition-colors flex items-center justify-center gap-2">
                    <Send size={14} />
                    Reply
                </button>
                <button className="py-2 px-4 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 transition-colors">
                    Sign Contract
                </button>
            </div>
        </motion.div>
    );
}

export default function ConnektMailSection() {
    return (
        <section className="w-full py-16 md:py-24 px-6 md:px-12 lg:px-20 bg-slate-50">
            <div className="max-w-7xl mx-auto">

                <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

                    {/* LEFT SIDE: Mail Preview */}
                    <div className="relative flex items-center justify-center">
                        <MockEmailPreview />
                    </div>

                    {/* RIGHT SIDE: Text Content */}
                    <div className="flex flex-col justify-center">

                        {/* Icon + Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-3 mb-6"
                        >
                            <ConnektMailIcon className="w-12 h-12" />
                            <span className="px-3 py-1 rounded-full bg-[#008080]/10 text-[#008080] text-xs font-bold">
                                PROFESSIONAL EMAIL
                            </span>
                        </motion.div>

                        {/* Main Heading */}
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-4"
                        >
                            Connekt
                            <br />
                            <span className="text-[#008080]">Mail System</span>
                        </motion.h2>

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 }}
                            className="text-gray-600 text-base md:text-lg mb-8 max-w-md"
                        >
                            Get your professional @connekt.com email address. Send contracts, proposals, and secure messages all in one place.
                        </motion.p>

                        {/* Feature Grid */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5 }}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8"
                        >
                            {MAIL_FEATURES.map((feature, index) => {
                                const Icon = feature.icon;
                                return (
                                    <motion.div
                                        key={feature.label}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.6 + index * 0.1 }}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200 hover:border-[#008080] transition-colors cursor-pointer group shadow-sm"
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-[#008080]/10 flex items-center justify-center group-hover:bg-[#008080] transition-colors">
                                            <Icon className="w-4 h-4 text-[#008080] group-hover:text-white transition-colors" />
                                        </div>
                                        <div>
                                            <p className="text-gray-900 text-xs font-bold">{feature.label}</p>
                                            <p className="text-gray-500 text-[10px]">{feature.description}</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>

                        {/* CTA Button */}
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.7 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#008080] text-white font-bold rounded-full w-fit hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/20"
                        >
                            Get Your @connekt.com
                            <ArrowRight size={18} />
                        </motion.button>
                    </div>
                </div>
            </div>
        </section>
    );
}
