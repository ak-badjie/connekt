'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Wallet,
    Shield,
    Lock,
    Receipt,
    ArrowRight,
    ArrowDownLeft,
    ArrowUpRight,
    CreditCard,
    CheckCircle,
    TrendingUp,
    TrendingDown,
    Plus,
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import Antigravity to avoid SSR issues
const Antigravity = dynamic(() => import('@/components/ui/Antigravity'), { ssr: false });

// Features of the wallet
const WALLET_FEATURES = [
    { icon: Shield, title: 'Escrow Protection', desc: 'Funds held securely until work is verified' },
    { icon: Lock, title: 'Secure Transactions', desc: 'Bank-level encryption for all payments' },
    { icon: Receipt, title: 'Automatic Receipts', desc: 'Digital receipts for every transaction' },
    { icon: CreditCard, title: 'Wave Integration', desc: 'Top up via Wave mobile money' },
];

// Sample transactions
const SAMPLE_TRANSACTIONS = [
    { type: 'in', label: 'Payment from TechCorp', amount: 2500, date: 'Dec 24' },
    { type: 'out', label: 'Task: UI Design', amount: 500, date: 'Dec 23' },
    { type: 'in', label: 'Escrow Release', amount: 1800, date: 'Dec 22' },
    { type: 'escrow', label: 'Held in Escrow', amount: 3200, date: 'Dec 21' },
];

// SpotlightOverlay for the card
const SpotlightOverlay = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setOpacity(1)}
            onMouseLeave={() => setOpacity(0)}
            className={`relative ${className}`}
        >
            <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-in-out rounded-3xl z-10"
                style={{
                    opacity: opacity * 0.4,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(0, 128, 128, 0.15), transparent 40%)`
                }}
            />
            {children}
        </div>
    );
};

export default function ConnektWalletSection() {
    return (
        <section className="w-full py-16 md:py-24 px-6 md:px-12 lg:px-20 bg-slate-50">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#008080]/10 text-[#008080] text-xs font-bold mb-6">
                        <Wallet className="w-4 h-4" />
                        DIGITAL WALLET
                    </div>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-4">
                        Connekt <span className="text-[#008080]">Wallet</span>
                    </h2>
                    <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
                        A sophisticated digital wallet with built-in escrow protection, automatic receipts,
                        and seamless Wave integration. Every transaction is secure and transparent.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">

                    {/* LEFT: Wallet Card with Antigravity */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="w-full"
                    >
                        <SpotlightOverlay>
                            <div className="relative overflow-hidden rounded-3xl border border-white/30 shadow-2xl shadow-teal-900/10">

                                {/* Base background */}
                                <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/70 via-white/50 to-teal-50/30" />

                                {/* Antigravity Particle Background */}
                                <div className="absolute inset-0 z-10 overflow-hidden rounded-3xl">
                                    <Antigravity
                                        count={360}
                                        color="#008080"
                                        particleSize={1.2}
                                        magnetRadius={22}
                                        ringRadius={22}
                                        waveSpeed={0.25}
                                        waveAmplitude={1.2}
                                        lerpSpeed={0.05}
                                        autoAnimate={true}
                                        particleShape="capsule"
                                        fieldStrength={12}
                                    />
                                </div>

                                {/* Frost Glass Surface */}
                                <div className="absolute inset-0 z-[15] pointer-events-none backdrop-blur-[1px] bg-gradient-to-br from-white/10 via-transparent to-transparent" />

                                {/* Content */}
                                <div className="relative z-20 p-8 md:p-10">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
                                                <Wallet size={24} className="text-white" />
                                            </div>
                                            <h3 className="text-lg font-black text-gray-900 tracking-tight">
                                                Your Personal Balance
                                            </h3>
                                        </div>
                                        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#008080] hover:bg-teal-600 text-white text-sm font-bold transition-all shadow-lg shadow-teal-500/25">
                                            <Plus size={18} strokeWidth={2.5} />
                                            <span>Top Up</span>
                                        </button>
                                    </div>

                                    {/* Balance Display */}
                                    <div className="mb-8">
                                        <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">
                                            Available Balance
                                        </p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xs font-bold text-gray-400">D</span>
                                            <span className="text-3xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tight">
                                                12,450.00
                                            </span>
                                        </div>
                                    </div>

                                    {/* Pending Amounts */}
                                    <div className="flex flex-wrap gap-4">
                                        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-50/80 border border-emerald-100">
                                            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                                                <TrendingUp size={16} className="text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wider">Pending In</p>
                                                <p className="text-sm font-black text-emerald-700">D3,200</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50/80 border border-amber-100">
                                            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                                                <TrendingDown size={16} className="text-amber-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-amber-600/70 uppercase tracking-wider">Pending Out</p>
                                                <p className="text-sm font-black text-amber-700">D500</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SpotlightOverlay>

                        {/* Wave Integration */}
                        <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-12 bg-gray-50 rounded-xl flex items-center justify-center p-2">
                                    <img src="/wave.png" alt="Wave" className="w-full h-full object-contain" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Wave Mobile Money</h4>
                                    <p className="text-sm text-gray-500">Instant top-ups via Wave</p>
                                </div>
                                <div className="ml-auto">
                                    <CheckCircle className="w-6 h-6 text-green-500" />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* RIGHT: Features + Transactions */}
                    <div className="space-y-8">

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            {WALLET_FEATURES.map((feature, i) => {
                                const Icon = feature.icon;
                                return (
                                    <motion.div
                                        key={feature.title}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-[#008080] transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-[#008080]/10 flex items-center justify-center mb-3">
                                            <Icon className="w-5 h-5 text-[#008080]" />
                                        </div>
                                        <h4 className="font-bold text-gray-900 text-sm mb-1">{feature.title}</h4>
                                        <p className="text-xs text-gray-500">{feature.desc}</p>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Escrow Explanation */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-gradient-to-br from-[#008080] to-teal-600 rounded-2xl p-6 text-white"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                    <Lock className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-bold">Escrow Protection</h3>
                            </div>
                            <p className="text-white/80 text-sm mb-4">
                                When you hire a freelancer or assign a task, funds are held in escrow.
                                Payment is only released when work is verified through our POT/POP system.
                            </p>
                            <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Safe for clients</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Guaranteed payment</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Recent Transactions */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
                        >
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <h4 className="font-bold text-gray-900">Recent Transactions</h4>
                                <div className="flex items-center gap-2 text-[#008080] text-sm font-medium">
                                    <Receipt className="w-4 h-4" />
                                    All receipts saved
                                </div>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {SAMPLE_TRANSACTIONS.map((tx, i) => (
                                    <div key={i} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'in' ? 'bg-green-100' :
                                            tx.type === 'out' ? 'bg-red-100' :
                                                'bg-amber-100'
                                            }`}>
                                            {tx.type === 'in' && <ArrowDownLeft className="w-5 h-5 text-green-600" />}
                                            {tx.type === 'out' && <ArrowUpRight className="w-5 h-5 text-red-600" />}
                                            {tx.type === 'escrow' && <Lock className="w-5 h-5 text-amber-600" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 text-sm">{tx.label}</p>
                                            <p className="text-xs text-gray-400">{tx.date}</p>
                                        </div>
                                        <span className={`font-bold ${tx.type === 'in' ? 'text-green-600' :
                                            tx.type === 'out' ? 'text-red-600' :
                                                'text-amber-600'
                                            }`}>
                                            {tx.type === 'in' ? '+' : tx.type === 'out' ? '-' : ''}D{tx.amount.toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center mt-16">
                    <button className="inline-flex items-center gap-2 px-8 py-4 bg-[#008080] text-white font-bold rounded-full hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/20">
                        Open Your Wallet
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </section>
    );
}
