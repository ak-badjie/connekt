'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

// --- CONTEXT IMPORTS ---
import LoadingScreen from '@/components/ui/LoadingScreen';
import { useMinimumLoading } from '@/hooks/useMinimumLoading';
import { useAnimation } from '@/context/AnimationContext';

// --- YOUR NEW SECTION IMPORTS ---
// Simply import your new VPH pages here
import ProfileSection from '@/components/landing/ProfileSection';
import ConnketAISection from '@/components/landing/ConnketAISection';
import KAISection from '@/components/landing/KAISection';

// --- CONFIGURATION ---
// 1. Add your imported components to this array. 
// The order here determines the scroll order.
const SLIDES = [
    ProfileSection,
    ConnketAISection,
    KAISection,
    // Add more here (e.g., SecuritySection, PricingSection...)
];

const SPRING_OPTIONS = {
    stiffness: 45,
    damping: 12,
    mass: 1.2,
};

export default function LandingPage() {
    // --- LOADING LOGIC ---
    const [isLoading, setIsLoading] = useState(true);
    const { hasGlobalAnimationRun, setHasGlobalAnimationRun } = useAnimation();
    
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    const shouldShowLoading = useMinimumLoading(isLoading && !hasGlobalAnimationRun);

    useEffect(() => {
        if (!shouldShowLoading && !hasGlobalAnimationRun) {
            setHasGlobalAnimationRun(true);
        }
    }, [shouldShowLoading, hasGlobalAnimationRun, setHasGlobalAnimationRun]);


    // --- SCROLL JACKING LOGIC ---
    // Total indices = 1 (Hero) + Number of Slides
    const TOTAL_INDICES = SLIDES.length + 1;
    
    const [activeIndex, setActiveIndex] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollAccumulator = useRef(0);

    const springIndex = useSpring(0, SPRING_OPTIONS);

    useEffect(() => {
        springIndex.set(activeIndex);
    }, [activeIndex, springIndex]);

    const handleWheel = useCallback((e: WheelEvent) => {
        if (isScrolling) return;

        scrollAccumulator.current += e.deltaY;
        const THRESHOLD = 50; 

        if (scrollAccumulator.current > THRESHOLD) {
            // Scroll Down
            if (activeIndex < TOTAL_INDICES - 1) {
                setIsScrolling(true);
                setActiveIndex(prev => prev + 1);
                scrollAccumulator.current = 0;
                setTimeout(() => setIsScrolling(false), 1000);
            } else {
                scrollAccumulator.current = THRESHOLD;
            }
        } else if (scrollAccumulator.current < -THRESHOLD) {
            // Scroll Up
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

    }, [activeIndex, isScrolling, TOTAL_INDICES]);

    useEffect(() => {
        if (!shouldShowLoading) {
            window.addEventListener('wheel', handleWheel, { passive: false });
            return () => window.removeEventListener('wheel', handleWheel);
        }
    }, [handleWheel, shouldShowLoading]);


    // --- ANIMATION TRANSFORMS ---
    // Hero moves away when index goes 0 -> 1
    const whiteContainerY = useTransform(springIndex, [0, 1], ['100vh', '0vh']);
    const heroY = useTransform(springIndex, [0, 1], ['0vh', '20vh']);
    const heroOpacity = useTransform(springIndex, [0, 0.8], [1, 0]);
    const heroScale = useTransform(springIndex, [0, 1], [1, 0.9]);
    
    // Internal content slides up based on how many slides we have
    // If we have 3 slides, we move from 0vh to -200vh
    const internalContentY = useTransform(springIndex, 
        [1, TOTAL_INDICES - 1], 
        ['0vh', `-${(SLIDES.length - 1) * 100}vh`]
    );

    // --- RENDER ---
    if (shouldShowLoading && !hasGlobalAnimationRun) {
        return <LoadingScreen variant="default" />;
    }

    return (
        <div className="fixed inset-0 bg-black overflow-hidden font-sans text-slate-900">
            
            {/* LAYER 1: HERO SECTION (Fixed Background) */}
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


            {/* LAYER 2: WHITE SHEET (Foreground Content) */}
            <motion.div 
                style={{ y: whiteContainerY }}
                className="absolute inset-0 z-20"
            >
                <div className="absolute inset-0 bg-slate-50 rounded-t-[4rem] shadow-[0_-50px_100px_rgba(0,0,0,0.5)] overflow-hidden">
                    
                    {/* SCROLLABLE CONTAINER */}
                    <motion.div 
                        style={{ y: internalContentY }}
                        className="w-full h-full"
                    >
                        {SLIDES.map((Component, index) => {
                            // Determine if this specific slide is the active one
                            // We add 1 because index 0 is the Hero
                            const isVisible = activeIndex === index + 1;

                            return (
                                <div 
                                    key={index} 
                                    className="h-screen w-full flex items-center justify-center relative"
                                >
                                    <Component isVisible={isVisible} />
                                </div>
                            );
                        })}
                    </motion.div>
                </div>
            </motion.div>
            
            {/* Dots removed as requested */}

        </div>
    );
}