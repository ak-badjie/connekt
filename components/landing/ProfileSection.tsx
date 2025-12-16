'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';

interface LandingCardProps {
    icon: any;
    color: string;
    isVisible: boolean;
    statusText?: string;
}

const LandingCard = ({ icon: Icon, color, isVisible, statusText = "Optimized" }: LandingCardProps) => {
    return (
        <motion.div
            initial={{ rotateX: 20, rotateY: 20, scale: 0.8, opacity: 0 }}
            animate={isVisible ? { rotateX: 0, rotateY: 0, scale: 1, opacity: 1 } : { rotateX: 20, rotateY: 20, scale: 0.8, opacity: 0 }}
            transition={{ duration: 1.2, type: "spring", bounce: 0.4 }}
            className="relative perspective-1000 w-full max-w-md"
        >
            <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
                <div className={`relative aspect-square rounded-[3rem] bg-gradient-to-br from-white/90 to-white/40 backdrop-blur-xl border border-white/60 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] p-10 flex flex-col justify-between overflow-hidden group`}>
                    
                    {/* Abstract Blob Background */}
                    <div className={`absolute top-0 right-0 w-64 h-64 bg-${color}-200/50 rounded-full blur-[60px] group-hover:bg-${color}-300/60 transition-colors duration-700`} />
                    
                    <div className="relative z-10">
                        <div className={`w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center text-${color}-600 mb-6`}>
                            <Icon size={32} />
                        </div>
                        <div className="space-y-4 opacity-80">
                            <div className="h-3 w-1/3 bg-slate-800/10 rounded-full" />
                            <div className="h-3 w-full bg-slate-800/10 rounded-full" />
                            <div className="h-3 w-3/4 bg-slate-800/10 rounded-full" />
                        </div>
                    </div>
                    
                    <div className="relative z-10 bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white/50 shadow-sm mt-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-slate-600">Status</span>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full bg-${color}-100 text-${color}-700`}>
                                {statusText}
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

interface SectionProps {
    isVisible: boolean;
}

export default function ProfileSection({ isVisible }: SectionProps) {
    const color = "emerald";
    
    return (
        <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-16 items-center h-full">
            {/* TEXT CONTENT - LEFT */}
            <motion.div 
                className="flex flex-col gap-6"
                animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
                <div className={`w-fit px-4 py-2 rounded-full bg-${color}-100 text-${color}-800 font-bold uppercase tracking-wider text-xs`}>
                    Choose Your Adventure
                </div>
                <h2 className="text-5xl md:text-6xl font-bold leading-tight text-slate-900">
                    Build Elite <br/> Tech Teams
                </h2>
                <p className="text-xl text-slate-500 leading-relaxed">
                    We build elite tech teams for companies and enhance candidate tech skills and job prospects. Connect with the best talent globally.
                </p>
            </motion.div>

            {/* CARD CONTENT - RIGHT */}
            <div className="flex justify-center">
                <LandingCard 
                    icon={Globe} 
                    color={color} 
                    isVisible={isVisible}
                    statusText="Global"
                />
            </div>
        </div>
    );
}