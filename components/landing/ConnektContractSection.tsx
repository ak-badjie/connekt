'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    FileSignature,
    Shield,
    Zap,
    Clock,
    ArrowRight,
} from 'lucide-react';

// Contract features
const CONTRACT_FEATURES = [
    {
        icon: FileSignature,
        label: 'Digital Signatures',
        description: 'Legally binding e-signatures'
    },
    {
        icon: Shield,
        label: 'Secure & Encrypted',
        description: 'Bank-level security'
    },
    {
        icon: Zap,
        label: 'Instant Generation',
        description: 'AI-powered templates'
    },
    {
        icon: Clock,
        label: 'Track & Manage',
        description: 'Real-time status updates'
    },
];

export default function ConnektContractSection() {
    return (
        <section className="w-full py-16 md:py-24 px-6 md:px-12 lg:px-20 bg-slate-50">
            <div className="max-w-7xl mx-auto">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                    {/* LEFT SIDE: Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col justify-center"
                    >

                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#008080]/10 text-[#008080] text-xs font-bold w-fit mb-6"
                        >
                            <FileSignature className="w-4 h-4" />
                            DIGITAL CONTRACTS
                        </motion.div>

                        {/* Main Heading */}
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-4"
                        >
                            Contracts &
                            <br />
                            <span className="text-[#008080]">Proposals</span>
                        </motion.h2>

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="text-gray-600 text-base md:text-lg mb-8 max-w-md"
                        >
                            Say goodbye to paper contracts. We've digitalized the entire contract and proposal workflow — from creation to signature, all in one secure platform.
                        </motion.p>

                        {/* Feature Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-8">
                            {CONTRACT_FEATURES.map((feature, i) => {
                                const Icon = feature.icon;
                                return (
                                    <motion.div
                                        key={feature.label}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.4 + i * 0.1 }}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200 hover:border-[#008080] transition-colors shadow-sm"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-[#008080]/10 flex items-center justify-center">
                                            <Icon className="w-5 h-5 text-[#008080]" />
                                        </div>
                                        <div>
                                            <p className="text-gray-900 text-sm font-bold">{feature.label}</p>
                                            <p className="text-gray-500 text-xs">{feature.description}</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* CTA Button */}
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.8 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#008080] text-white font-bold rounded-full w-fit hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/20"
                        >
                            Create Contract
                            <ArrowRight size={18} />
                        </motion.button>
                    </motion.div>

                    {/* RIGHT SIDE: Image Only */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex items-center justify-center"
                    >
                        <motion.img
                            initial={{ scale: 0.9 }}
                            whileInView={{ scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            src="/contract.jpeg"
                            alt="Digital Contract"
                            className="w-full max-w-xl h-auto rounded-3xl shadow-2xl"
                        />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
