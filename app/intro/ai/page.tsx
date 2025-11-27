'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Bot, Sparkles, ArrowRight } from 'lucide-react';

export default function AIIntroPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-midnight text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Magical Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 flex flex-col items-center max-w-4xl text-center"
            >
                {/* Logo / Icon */}
                <motion.div
                    animate={{
                        boxShadow: ["0 0 20px rgba(245,158,11,0.2)", "0 0 50px rgba(245,158,11,0.5)", "0 0 20px rgba(245,158,11,0.2)"]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-amber-500/30 flex items-center justify-center mb-8 relative group"
                >
                    <div className="absolute inset-0 bg-amber-500/20 blur-xl group-hover:blur-2xl transition-all" />
                    <Sparkles className="w-10 h-10 text-gold relative z-10" />
                </motion.div>

                <h1 className="text-6xl font-bold mb-6 tracking-tight">
                    Meet <span className="text-gold">Connekt AI</span>
                </h1>

                <p className="text-xl text-gray-400 mb-12 max-w-2xl leading-relaxed">
                    Your intelligent career companion. Using advanced agentic workflows to
                    <span className="text-amber-200 mx-1">auto-optimize your resume</span>,
                    <span className="text-amber-200 mx-1">match tailored jobs</span>, and
                    <span className="text-amber-200 mx-1">draft winning proposals</span>
                    while you sleep.
                </p>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
                    {[
                        { title: "Smart Matching", desc: "AI analyzes your bio to find the perfect role." },
                        { title: "Auto-Proposals", desc: "Drafts professional cover letters instantly." },
                        { title: "Market Insights", desc: "Real-time salary and demand analytics." }
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + (i * 0.1) }}
                            className="bg-white/5 border border-white/10 hover:border-amber-500/50 p-6 rounded-2xl text-left transition-all hover:-translate-y-1 hover:bg-white/[0.07]"
                        >
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 text-amber-400">
                                <Bot size={20} />
                            </div>
                            <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                            <p className="text-sm text-gray-500">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>

                <button
                    onClick={() => router.push('/intro/pro')}
                    className="group relative px-8 py-4 bg-gradient-to-r from-amber-300 to-yellow-600 text-black font-bold text-lg rounded-full flex items-center gap-3 hover:scale-105 transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                >
                    Experience the Future
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
            </motion.div>
        </div>
    );
}
