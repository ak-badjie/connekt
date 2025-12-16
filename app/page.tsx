'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Code2, Cpu, Globe, Zap, Shield, ChevronDown, ArrowRight } from 'lucide-react';

// --- YOUR CONTEXT IMPORTS (From your snippet) ---
import LoadingScreen from '@/components/ui/LoadingScreen';
import { useMinimumLoading } from '@/hooks/useMinimumLoading';
import { useAnimation } from '@/context/AnimationContext';

// --- PHYSICS CONFIGURATION (The "Goopy" Elastic Feel) ---
const SPRING_OPTIONS = {
    stiffness: 45,
    damping: 12,
    mass: 1.2,
};

// --- DATA ---
const SECTIONS = [
    { id: 'hero', type: 'hero' },
    {
        id: 'adventure',
        type: 'content',
        title: "Choose Your Adventure",
        subtitle: "We build elite tech teams for companies and enhance candidate tech skills and job prospects.",
        icon: Globe,
        color: "emerald"
    },
    {
        id: 'ai',
        type: 'content',
        title: "AI Changing Development",
        subtitle: "GenAI will execute mundane tasks while developers orchestrate high-level problem solving.",
        icon: Cpu,
        align: 'right',
        color: "indigo"
    },
    {
        id: 'skills',
        type: 'content',
        title: "Skills Over Degrees",
        subtitle: "The future of hiring is based on what you can do, not where you went to school.",
        icon: Code2,
        color: "rose"
    },
    {
        id: 'security',
        type: 'content',
        title: "Secure & Private",
        subtitle: "Enterprise grade security ensuring your data is always protected.",
        icon: Shield,
        align: 'right',
        color: "cyan"
    }
];

// --- 3D CARD COMPONENT ---
const Card3D = ({ icon: Icon, color, isVisible }: { icon: any, color: string, isVisible: boolean }) => {
    return (
        <motion.div
            initial={{ rotateX: 20, rotateY: 20, scale: 0.8, opacity: 0 }}
            animate={isVisible ? { rotateX: 0, rotateY: 0, scale: 1, opacity: 1 } : { rotateX: 20, rotateY: 20, scale: 0.8, opacity: 0 }}
            transition={{ duration: 1.2, type: "spring", bounce: 0.4 }}
            className="relative perspective-1000"
        >
            <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
                <div className={`relative aspect-square rounded-[3rem] bg-gradient-to-br from-white/90 to-white/40 backdrop-blur-xl border border-white/60 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] p-10 flex flex-col justify-between overflow-hidden group`}>
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
                                Optimized
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default function LandingPage() {
    // --- 1. LOADING LOGIC (From your snippet) ---
    const [isLoading, setIsLoading] = useState(true);
    const { hasGlobalAnimationRun, setHasGlobalAnimationRun } = useAnimation();
    
    // Simulate asset loading for the landing page
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2000); // 2 seconds artificial load
        return () => clearTimeout(timer);
    }, []);

    const shouldShowLoading = useMinimumLoading(isLoading && !hasGlobalAnimationRun);

    useEffect(() => {
        if (!shouldShowLoading && !hasGlobalAnimationRun) {
            setHasGlobalAnimationRun(true);
        }
    }, [shouldShowLoading, hasGlobalAnimationRun, setHasGlobalAnimationRun]);


    // --- 2. SCROLL JACKING LOGIC ---
    const [activeIndex, setActiveIndex] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollAccumulator = useRef(0);
    const touchStart = useRef(0);

    const springIndex = useSpring(0, SPRING_OPTIONS);

    useEffect(() => {
        springIndex.set(activeIndex);
    }, [activeIndex, springIndex]);

    const handleWheel = useCallback((e: WheelEvent) => {
        if (isScrolling) return;

        // TENSION LOGIC: Scroll Accumulator
        scrollAccumulator.current += e.deltaY;
        const THRESHOLD = 50; 

        if (scrollAccumulator.current > THRESHOLD) {
            if (activeIndex < SECTIONS.length - 1) {
                setIsScrolling(true);
                setActiveIndex(prev => prev + 1);
                scrollAccumulator.current = 0;
                setTimeout(() => setIsScrolling(false), 1000);
            } else {
                scrollAccumulator.current = THRESHOLD;
            }
        } else if (scrollAccumulator.current < -THRESHOLD) {
            if (activeIndex > 0) {
                setIsScrolling(true);
                setActiveIndex(prev => prev - 1);
                scrollAccumulator.current = 0;
                setTimeout(() => setIsScrolling(false), 1000);
            } else {
                scrollAccumulator.current = -THRESHOLD;
            }
        }

        clearTimeout((window as any).scrollTimer);
        (window as any).scrollTimer = setTimeout(() => {
            scrollAccumulator.current = 0;
        }, 100);

    }, [activeIndex, isScrolling]);

    useEffect(() => {
        // Only attach scroll listeners if NOT loading
        if (!shouldShowLoading) {
            window.addEventListener('wheel', handleWheel, { passive: false });
            return () => window.removeEventListener('wheel', handleWheel);
        }
    }, [handleWheel, shouldShowLoading]);


    // --- 3. ANIMATION TRANSFORMS ---
    const whiteContainerY = useTransform(springIndex, [0, 1], ['100vh', '0vh']);
    const heroY = useTransform(springIndex, [0, 1], ['0vh', '20vh']);
    const heroOpacity = useTransform(springIndex, [0, 0.8], [1, 0]);
    const heroScale = useTransform(springIndex, [0, 1], [1, 0.9]);
    const internalContentY = useTransform(springIndex, 
        [1, SECTIONS.length - 1], 
        ['0vh', `-${(SECTIONS.length - 2) * 100}vh`]
    );

    // --- 4. RENDER ---
    
    // IF LOADING -> RETURN LOADING SCREEN
    if (shouldShowLoading && !hasGlobalAnimationRun) {
        return <LoadingScreen variant="default" />;
    }

    // IF LOADED -> RETURN SCROLL JACKED LANDING PAGE
    return (
        <div className="fixed inset-0 bg-black overflow-hidden font-sans text-slate-900">
            
            {/* BACKGROUND HERO LAYER */}
            <motion.div 
                style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
                className="absolute inset-0 flex flex-col items-center justify-center z-0"
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/30 via-black to-black" />
                
                <div className="relative z-10 text-center px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.2 }}
                    >
                        <h1 className="text-7xl md:text-9xl font-bold tracking-tighter text-white mb-6">
                            The future <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-600">
                                is human + AI
                            </span>
                        </h1>
                    </motion.div>
                    
                    <motion.button 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.8 }}
                        onClick={() => setActiveIndex(1)}
                        className="mt-12 px-8 py-4 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform"
                    >
                        Start the Journey
                    </motion.button>
                </div>

                <motion.div 
                    animate={{ y: [0, 10, 0], opacity: [0.2, 1, 0.2] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute bottom-12 text-white/50"
                >
                    <ChevronDown size={32} />
                </motion.div>
            </motion.div>


            {/* FOREGROUND WHITE SHEET LAYER */}
            <motion.div 
                style={{ y: whiteContainerY }}
                className="absolute inset-0 z-20"
            >
                <div className="absolute inset-0 bg-slate-50 rounded-t-[4rem] shadow-[0_-50px_100px_rgba(0,0,0,0.5)] overflow-hidden">
                    
                    {/* SCROLLABLE CONTENT CONTAINER */}
                    <motion.div 
                        style={{ y: internalContentY }}
                        className="w-full h-full"
                    >
                        {SECTIONS.slice(1).map((section, index) => {
                            const actualIndex = index + 1;
                            const isVisible = activeIndex === actualIndex;

                            return (
                                <div 
                                    key={section.id} 
                                    className="h-screen w-full flex items-center justify-center relative"
                                >
                                    <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                                        
                                        {/* TEXT CONTENT */}
                                        <motion.div 
                                            className={`flex flex-col gap-6 ${section.align === 'right' ? 'md:order-2' : ''}`}
                                            animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: section.align === 'right' ? 50 : -50 }}
                                            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                                        >
                                            <div className={`w-fit px-4 py-2 rounded-full bg-${section.color}-100 text-${section.color}-800 font-bold uppercase tracking-wider text-xs`}>
                                                {section.title}
                                            </div>
                                            <h2 className="text-5xl md:text-6xl font-bold leading-tight text-slate-900">
                                                {section.title}
                                            </h2>
                                            <p className="text-xl text-slate-500 leading-relaxed">
                                                {section.subtitle}
                                            </p>
                                        </motion.div>

                                        {/* CARD CONTENT */}
                                        <div className={`${section.align === 'right' ? 'md:order-1' : ''} flex justify-center`}>
                                            <Card3D 
                                                icon={section.icon} 
                                                color={section.color} 
                                                isVisible={isVisible} 
                                            />
                                        </div>

                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                </div>
            </motion.div>
            
            {/* NAVIGATION DOTS */}
            <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-4">
                {SECTIONS.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveIndex(idx)}
                        className={`w-3 h-3 rounded-full transition-all duration-500 ${
                            activeIndex === idx ? 'bg-emerald-500 scale-125' : 'bg-slate-300 hover:bg-slate-400'
                        }`}
                    />
                ))}
            </div>

        </div>
    );
}