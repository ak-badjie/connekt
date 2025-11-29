'use client';

import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Check, Crown, Zap, ArrowRight, Sparkles, HardDrive, Bot } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ProIntroPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleContinue = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Mark intro as seen so they don't get redirected back here
            await updateDoc(doc(db, 'users', user.uid), {
                introSeen: true
            });
            router.push('/dashboard');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900 py-20 px-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-[#008080]/10 to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-5xl font-bold mb-6">
                        Choose Your <span className="bg-gradient-to-r from-[#008080] to-amber-500 bg-clip-text text-transparent">Power Level</span>
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Unlock advanced AI agents, unlimited proposals, and verified status with <span className="font-bold text-[#008080]">ConnektPro</span>.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">

                    {/* Starter Tier */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-zinc-800/50 rounded-3xl p-8 relative hover:shadow-xl transition-all"
                    >
                        <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Starter</h3>
                        <div className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">$0<span className="text-lg text-gray-500 font-normal">/mo</span></div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-8">Perfect for getting started with basic job matching.</p>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"><Check size={16} className="text-[#008080]" /> 5 Job Applications/mo</li>
                            <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"><Check size={16} className="text-[#008080]" /> Basic Profile</li>
                            <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"><Check size={16} className="text-[#008080]" /> 1GB ConnektStorage</li>
                            <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"><Check size={16} className="text-[#008080]" /> Community Access</li>
                        </ul>
                        <button onClick={handleContinue} className="w-full py-3 rounded-xl border border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 font-medium transition-all text-gray-900 dark:text-white">
                            Continue with Free
                        </button>
                    </motion.div>

                    {/* ConnektPro Tier (Highlighted) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-2 border-[#008080] rounded-[2rem] p-10 relative transform md:-translate-y-4 shadow-2xl shadow-teal-500/20"
                    >
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#008080] to-teal-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 shadow-lg">
                            <Zap size={12} fill="white" /> Most Popular
                        </div>
                        <h3 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">ConnektPro</h3>
                        <div className="text-5xl font-bold mb-6 bg-gradient-to-r from-[#008080] to-teal-600 bg-clip-text text-transparent">$29<span className="text-lg text-gray-500 font-normal">/mo</span></div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-8">For serious professionals scaling their career.</p>
                        <ul className="space-y-4 mb-10">
                            <li className="flex items-center gap-3 text-sm font-medium text-gray-900 dark:text-white">
                                <div className="w-6 h-6 rounded-full bg-[#008080]/20 flex items-center justify-center">
                                    <Check size={14} className="text-[#008080]" />
                                </div>
                                Unlimited Applications
                            </li>
                            <li className="flex items-center gap-3 text-sm font-medium text-gray-900 dark:text-white">
                                <div className="w-6 h-6 rounded-full bg-[#008080]/20 flex items-center justify-center">
                                    <Bot size={14} className="text-[#008080]" />
                                </div>
                                <span className="font-bold text-[#008080]">ConnektAI</span> Agent Access
                            </li>
                            <li className="flex items-center gap-3 text-sm font-medium text-gray-900 dark:text-white">
                                <div className="w-6 h-6 rounded-full bg-[#008080]/20 flex items-center justify-center">
                                    <HardDrive size={14} className="text-[#008080]" />
                                </div>
                                5GB <span className="font-bold text-[#008080]">ConnektStorage</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm font-medium text-gray-900 dark:text-white">
                                <div className="w-6 h-6 rounded-full bg-[#008080]/20 flex items-center justify-center">
                                    <Check size={14} className="text-[#008080]" />
                                </div>
                                Verified Badge
                            </li>
                            <li className="flex items-center gap-3 text-sm font-medium text-gray-900 dark:text-white">
                                <div className="w-6 h-6 rounded-full bg-[#008080]/20 flex items-center justify-center">
                                    <Check size={14} className="text-[#008080]" />
                                </div>
                                Priority Support
                            </li>
                        </ul>
                        <button className="w-full py-4 rounded-xl bg-gradient-to-r from-[#008080] to-teal-600 hover:from-teal-600 hover:to-[#008080] text-white font-bold text-lg hover:scale-[1.02] transition-all shadow-lg shadow-teal-500/30">
                            Get ConnektPro
                        </button>
                    </motion.div>

                    {/* ConnektPro Plus Tier */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-zinc-800/50 rounded-3xl p-8 relative hover:shadow-xl transition-all"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">ConnektPro Plus</h3>
                            <Sparkles size={20} className="text-amber-500" />
                        </div>
                        <div className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">$99<span className="text-lg text-gray-500 font-normal">/mo</span></div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-8">Complete toolkit for agencies and teams.</p>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"><Check size={16} className="text-amber-500" /> Everything in ConnektPro</li>
                            <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                                <HardDrive size={16} className="text-amber-500" /> 50GB <span className="font-bold">ConnektStorage</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"><Check size={16} className="text-amber-500" /> 5 Team Seats</li>
                            <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"><Check size={16} className="text-amber-500" /> White-label Reports</li>
                            <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"><Check size={16} className="text-amber-500" /> API Access</li>
                        </ul>
                        <button className="w-full py-3 rounded-xl border border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 font-medium transition-all text-gray-900 dark:text-white">
                            Contact Sales
                        </button>
                    </motion.div>

                </div>

                {/* Skip Button */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-16 text-center"
                >
                    <button onClick={handleContinue} className="text-gray-500 hover:text-gray-900 dark:hover:text-white text-sm transition-colors flex items-center justify-center gap-2 mx-auto group">
                        Skip for now
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
