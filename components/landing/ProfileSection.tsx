'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Sparkles, BrainCircuit, ArrowRight } from 'lucide-react';

interface FeaturePointProps {
    icon: any;
    title: string;
    description: string;
    delay: number;
}

const FeaturePoint = ({ icon: Icon, title, description, delay }: FeaturePointProps) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.5, type: "spring", bounce: 0.4 }}
        className="flex items-start gap-4 p-4 rounded-2xl bg-white/50 border border-emerald-100 hover:border-emerald-300 hover:bg-white/80 transition-all duration-300 shadow-sm hover:shadow-md group"
    >
        <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform duration-300">
            <Icon size={24} />
        </div>
        <div>
            <h4 className="font-bold text-slate-800 text-lg mb-1">{title}</h4>
            <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
        </div>
        {/* Decorative arrow showing connection to video */}
        <div className="hidden md:flex ml-auto self-center text-emerald-200 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all">
            <ArrowRight size={20} />
        </div>
    </motion.div>
);

interface VideoCardProps {
    isVisible: boolean;
}

const VideoCard = ({ isVisible }: VideoCardProps) => {
    return (
        <motion.div
            initial={{ rotateY: -10, rotateX: 10, scale: 0.9, opacity: 0 }}
            animate={isVisible ? { rotateY: 0, rotateX: 0, scale: 1, opacity: 1 } : {}}
            transition={{ duration: 1.2, type: "spring", bounce: 0.4 }}
            className="relative w-full max-w-lg mx-auto perspective-1000"
        >
            <motion.div
                animate={{ y: [-15, 15, -15] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10"
            >
                {/* Video Container / Browser Window Style */}
                <div className="rounded-3xl overflow-hidden bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border-4 border-white ring-1 ring-slate-900/5">
                    {/* Fake Browser Header */}
                    <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <div className="w-3 h-3 rounded-full bg-emerald-400" />
                        <div className="ml-4 px-3 py-1 bg-white rounded-md text-[10px] text-slate-400 font-medium border border-slate-100 flex-1 text-center">
                            connekt.ai/profile-builder
                        </div>
                    </div>
                    
                    {/* The Video */}
                    <div className="relative aspect-video bg-slate-900">
                        <video 
                            className="w-full h-full object-cover"
                            autoPlay 
                            loop 
                            muted 
                            playsInline
                            src="/video.mp4"
                        >
                            Your browser does not support the video tag.
                        </video>
                        
                        {/* Overlay Gradient for better integration */}
                        <div className="absolute inset-0 ring-1 ring-inset ring-black/10 pointer-events-none" />
                    </div>
                </div>

                {/* Floating Badge attached to video */}
                <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1, type: "spring" }}
                    className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 z-20"
                >
                    <div className="bg-green-100 p-2 rounded-full">
                        <Sparkles className="text-green-600" size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-medium">Status</p>
                        <p className="text-sm font-bold text-slate-800">Profile Optimized</p>
                    </div>
                </motion.div>
            </motion.div>
            
            {/* Background Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-emerald-400/20 blur-[100px] -z-10 rounded-full" />
        </motion.div>
    );
};

interface SectionProps {
    isVisible: boolean;
}

export default function ProfileSection({ isVisible }: SectionProps) {
    const color = "emerald";
    
    return (
        <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center h-full py-12">
            
            {/* LEFT COLUMN - TEXT & FEATURES */}
            <motion.div 
                className="flex flex-col gap-8 order-2 lg:order-1"
                animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
                <div className="space-y-4">
                    <div className={`w-fit px-4 py-2 rounded-full bg-${color}-100 text-${color}-800 font-bold uppercase tracking-wider text-xs`}>
                        Choose Your Adventure
                    </div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-slate-900">
                        Build Elite <br/> 
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                            Tech Teams
                        </span>
                    </h2>
                </div>

                {/* Feature Tiles List */}
                <div className="flex flex-col gap-4 mt-2">
                    <FeaturePoint 
                        icon={FileText}
                        title="AI Resume Parser"
                        description="Drag & drop your PDF. Our AI instantly extracts experience, skills, and bio data."
                        delay={0.4}
                    />
                    <FeaturePoint 
                        icon={BrainCircuit}
                        title="Smart Skill Extraction"
                        description="Automatically identifies and categorizes your technical stack from your history."
                        delay={0.6}
                    />
                    <FeaturePoint 
                        icon={Sparkles}
                        title="Bio Enhancement"
                        description="Transform scattered ideas into a professional, compelling narrative in seconds."
                        delay={0.8}
                    />
                </div>
            </motion.div>

            {/* RIGHT COLUMN - VIDEO */}
            <div className="order-1 lg:order-2 flex justify-center items-center">
                <VideoCard isVisible={isVisible} />
            </div>
        </div>
    );
}