'use client';

import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check, Crown, Zap, ArrowRight, Sparkles, HardDrive, Bot,
    Target, TrendingUp, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function IntroPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [direction, setDirection] = useState(0);

    const handleContinue = async () => {
        if (!user) return;
        setLoading(true);
        try {
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

    const nextStep = () => {
        setDirection(1);
        setStep(2);
    };

    const prevStep = () => {
        setDirection(-1);
        setStep(1);
    };

    const slideVariants = {
        enter: (dir: number) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -100 : 100, opacity: 0 })
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50 py-12 px-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-[#008080]/10 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Step Indicators */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${step === 1 ? 'bg-[#008080] text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <Crown size={16} />
                        <span className="text-sm font-bold">Plans</span>
                    </div>
                    <div className="w-8 h-0.5 bg-gray-200" />
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${step === 2 ? 'bg-[#008080] text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <Sparkles size={16} />
                        <span className="text-sm font-bold">Connekt AI</span>
                    </div>
                </div>

                <AnimatePresence mode="wait" custom={direction}>
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                        >
                            {/* Step 1: Pro Plans */}
                            <div className="text-center mb-12">
                                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                                    Choose Your <span className="bg-gradient-to-r from-[#008080] to-amber-500 bg-clip-text text-transparent">Power Level</span>
                                </h1>
                                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                    Unlock advanced AI agents, unlimited proposals, and verified status with <span className="font-bold text-[#008080]">ConnektPro</span>.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center max-w-6xl mx-auto">
                                {/* Starter Tier */}
                                <div className="bg-white/60 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-6 hover:shadow-xl transition-all">
                                    <h3 className="text-xl font-bold mb-2 text-gray-900">Starter</h3>
                                    <div className="text-3xl font-bold mb-4 text-gray-900">$0<span className="text-base text-gray-500 font-normal">/mo</span></div>
                                    <p className="text-gray-600 text-sm mb-6">Perfect for getting started.</p>
                                    <ul className="space-y-3 mb-6">
                                        <li className="flex items-center gap-2 text-sm text-gray-700"><Check size={14} className="text-[#008080]" /> 5 Job Applications/mo</li>
                                        <li className="flex items-center gap-2 text-sm text-gray-700"><Check size={14} className="text-[#008080]" /> Basic Profile</li>
                                        <li className="flex items-center gap-2 text-sm text-gray-700"><Check size={14} className="text-[#008080]" /> 1GB ConnektStorage</li>
                                        <li className="flex items-center gap-2 text-sm text-gray-700"><Check size={14} className="text-[#008080]" /> Community Access</li>
                                    </ul>
                                    <button
                                        onClick={nextStep}
                                        className="w-full py-3 rounded-xl border border-gray-300 hover:bg-gray-100 font-medium transition-all text-gray-900"
                                    >
                                        Continue Free
                                    </button>
                                </div>

                                {/* ConnektPro Tier (Highlighted) */}
                                <div className="bg-white/80 backdrop-blur-xl border-2 border-[#008080] rounded-[2rem] p-8 relative transform md:-translate-y-4 shadow-2xl shadow-teal-500/20">
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#008080] to-teal-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 shadow-lg">
                                        <Zap size={12} fill="white" /> Most Popular
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2 text-gray-900">ConnektPro</h3>
                                    <div className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#008080] to-teal-600 bg-clip-text text-transparent">$29<span className="text-base text-gray-500 font-normal">/mo</span></div>
                                    <p className="text-gray-600 text-sm mb-6">For serious professionals.</p>
                                    <ul className="space-y-3 mb-8">
                                        <li className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                            <div className="w-5 h-5 rounded-full bg-[#008080]/20 flex items-center justify-center"><Check size={12} className="text-[#008080]" /></div>
                                            Unlimited Applications
                                        </li>
                                        <li className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                            <div className="w-5 h-5 rounded-full bg-[#008080]/20 flex items-center justify-center"><Bot size={12} className="text-[#008080]" /></div>
                                            <span className="font-bold text-[#008080]">ConnektAI</span> Agent
                                        </li>
                                        <li className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                            <div className="w-5 h-5 rounded-full bg-[#008080]/20 flex items-center justify-center"><HardDrive size={12} className="text-[#008080]" /></div>
                                            5GB <span className="font-bold text-[#008080]">ConnektStorage</span>
                                        </li>
                                        <li className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                            <div className="w-5 h-5 rounded-full bg-[#008080]/20 flex items-center justify-center"><Check size={12} className="text-[#008080]" /></div>
                                            Verified Badge
                                        </li>
                                    </ul>
                                    <button className="w-full py-3 rounded-xl bg-gradient-to-r from-[#008080] to-teal-600 hover:from-teal-600 hover:to-[#008080] text-white font-bold hover:scale-[1.02] transition-all shadow-lg shadow-teal-500/30">
                                        Get ConnektPro
                                    </button>
                                </div>

                                {/* ConnektPro Plus Tier */}
                                <div className="bg-white/60 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-6 hover:shadow-xl transition-all">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-xl font-bold text-gray-900">ConnektPro Plus</h3>
                                        <Sparkles size={18} className="text-amber-500" />
                                    </div>
                                    <div className="text-3xl font-bold mb-4 text-gray-900">$99<span className="text-base text-gray-500 font-normal">/mo</span></div>
                                    <p className="text-gray-600 text-sm mb-6">For agencies and teams.</p>
                                    <ul className="space-y-3 mb-6">
                                        <li className="flex items-center gap-2 text-sm text-gray-700"><Check size={14} className="text-amber-500" /> Everything in Pro</li>
                                        <li className="flex items-center gap-2 text-sm text-gray-700"><HardDrive size={14} className="text-amber-500" /> 50GB Storage</li>
                                        <li className="flex items-center gap-2 text-sm text-gray-700"><Check size={14} className="text-amber-500" /> 5 Team Seats</li>
                                        <li className="flex items-center gap-2 text-sm text-gray-700"><Check size={14} className="text-amber-500" /> API Access</li>
                                    </ul>
                                    <button className="w-full py-3 rounded-xl border border-gray-300 hover:bg-gray-100 font-medium transition-all text-gray-900">
                                        Contact Sales
                                    </button>
                                </div>
                            </div>

                            {/* Next Button */}
                            <div className="mt-12 flex justify-center">
                                <button
                                    onClick={nextStep}
                                    className="group flex items-center gap-2 text-gray-500 hover:text-[#008080] transition-colors"
                                >
                                    Skip for now
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className="flex flex-col items-center"
                        >
                            {/* Step 2: Connekt AI */}
                            <motion.div
                                animate={{
                                    boxShadow: ["0 0 20px rgba(0,128,128,0.2)", "0 0 50px rgba(0,128,128,0.4)", "0 0 20px rgba(0,128,128,0.2)"]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-24 h-24 rounded-2xl bg-white/60 backdrop-blur-xl border border-gray-200/50 flex items-center justify-center mb-8 relative group shadow-xl"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-[#008080]/20 to-amber-500/20 blur-xl group-hover:blur-2xl transition-all rounded-2xl" />
                                <Sparkles className="w-10 h-10 text-[#008080] relative z-10" />
                            </motion.div>

                            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight bg-gradient-to-r from-[#008080] to-amber-500 bg-clip-text text-transparent text-center">
                                Meet ConnektAI
                            </h1>

                            <p className="text-xl text-gray-600 mb-12 max-w-2xl leading-relaxed text-center">
                                Your intelligent career companion. Using advanced agentic workflows to
                                <span className="text-[#008080] font-medium mx-1">auto-optimize your resume</span>,
                                <span className="text-[#008080] font-medium mx-1">match tailored jobs</span>, and
                                <span className="text-[#008080] font-medium mx-1">draft winning proposals</span>
                                while you sleep.
                            </p>

                            {/* Feature Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-12">
                                {[
                                    { icon: Target, title: "Smart Matching", desc: "AI analyzes your bio to find the perfect role.", color: "from-[#008080] to-teal-600" },
                                    { icon: Zap, title: "Auto-Proposals", desc: "Drafts professional cover letters instantly.", color: "from-amber-500 to-orange-500" },
                                    { icon: TrendingUp, title: "Market Insights", desc: "Real-time salary and demand analytics.", color: "from-[#008080] to-teal-600" }
                                ].map((feature, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 + (i * 0.1) }}
                                        className="bg-white/60 backdrop-blur-xl border border-gray-200/50 hover:border-[#008080]/50 p-6 rounded-2xl text-left transition-all hover:-translate-y-1 hover:shadow-xl"
                                    >
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}>
                                            <feature.icon size={24} className="text-white" />
                                        </div>
                                        <h3 className="font-bold text-lg mb-2 text-gray-900">{feature.title}</h3>
                                        <p className="text-sm text-gray-600">{feature.desc}</p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={prevStep}
                                    className="flex items-center gap-2 px-6 py-3 text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    <ChevronLeft size={18} />
                                    Back
                                </button>
                                <button
                                    onClick={handleContinue}
                                    disabled={loading}
                                    className="group relative px-8 py-4 bg-gradient-to-r from-[#008080] to-teal-600 hover:from-teal-600 hover:to-[#008080] text-white font-bold text-lg rounded-full flex items-center gap-3 hover:scale-105 transition-all shadow-lg shadow-teal-500/30 disabled:opacity-50"
                                >
                                    {loading ? 'Loading...' : 'Continue to Dashboard'}
                                    <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
