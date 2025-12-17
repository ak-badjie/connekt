'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Xarrow, { Xwrapper, useXarrow } from 'react-xarrows';
import { 
    Fingerprint, 
    Video, 
    ShieldCheck, 
    Sparkles, 
    BarChart3, 
    Target,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ==============================================
// 🎛️ CONTROL PANEL - TWEAK THESE VALUES HERE
// ==============================================
const LAYOUT_CONFIG = {
    // Distance from the very top of the page (to clear your Navbar)
    // Try: 'pt-24', 'pt-32', 'pt-40'
    paddingTop: "pt-40", 

    // Space between the Video bottom and the Schematic top
    // Negative numbers pull them closer together.
    // Try: '-mt-10', 'mt-0', 'mt-10'
    gapBetweenVideoAndSchematic: "-mt-0", 

    // Size of the bubble map. 1 = 100%, 1.4 = 140% (7/5), 0.9 = 90%
    schematicScale: 0.95,

    // Video Size. 1 = Normal, 1.1 = Larger
    videoScale: 1,
};
// ==============================================

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Split Text Component (Right-to-Left Entrance) ---
const SplitText = ({ text, className, delay = 0 }: { text: string, className?: string, delay?: number }) => {
    const letters = text.split("");
    
    const container = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: { staggerChildren: 0.03, delayChildren: delay * 0.1 }
        })
    };

    const child = {
        visible: {
            opacity: 1,
            x: 0,
            transition: { type: "spring", damping: 12, stiffness: 200 }
        },
        hidden: {
            opacity: 0,
            x: 50,
            transition: { type: "spring", damping: 12, stiffness: 200 }
        }
    };

    return (
        <motion.div
            style={{ overflow: "hidden", display: "flex", flexWrap: "wrap", justifyContent: "flex-end" }}
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className={className}
        >
            {letters.map((letter, index) => (
                <motion.span variants={child} key={index}>
                    {letter === " " ? "\u00A0" : letter}
                </motion.span>
            ))}
        </motion.div>
    );
};

// --- Bouncy Bubble Feature Card ---
interface BubbleProps {
    id: string;
    icon: any;
    label: string;
    subLabel?: string;
    color: string;
    className?: string;
    delay?: number;
}

const BubbleFeature = ({ id, icon: Icon, label, subLabel, color, className, delay = 0 }: BubbleProps) => {
    return (
        <motion.div
            id={id}
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: delay }}
            className={cn(
                "relative flex items-center gap-3 px-4 py-2 rounded-full border bg-white/90 backdrop-blur-md shadow-lg cursor-pointer z-20 group",
                `border-${color}-200 hover:border-${color}-400`,
                className
            )}
        >
            <div className={`p-1.5 rounded-full bg-${color}-100 text-${color}-600 group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={18} />
            </div>
            <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-slate-800 leading-tight">{label}</span>
                {subLabel && <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider">{subLabel}</span>}
            </div>
        </motion.div>
    );
};

// --- Video Component (Clean) ---
const VideoShowcase = () => {
    return (
        <motion.div 
            style={{ scale: LAYOUT_CONFIG.videoScale }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative w-full group origin-bottom" 
        >
            {/* Ambient Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-[3rem] blur-3xl opacity-50 group-hover:opacity-75 transition-opacity duration-700" />
            
            {/* The Video */}
            <video 
                src="/video.mp4"
                autoPlay 
                loop 
                muted 
                playsInline
                className="relative z-10 w-full h-auto object-cover rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
            />
        </motion.div>
    );
};

// --- Main Section Export ---
export default function ProfileSection() {
    const updateXarrow = useXarrow();

    return (
        <section className={cn(
            "relative w-full pb-0 bg-slate-50/50 overflow-hidden",
            LAYOUT_CONFIG.paddingTop // Applies the variable padding
        )}>
            <div className="container mx-auto px-6 md:px-12">
                
                {/* TOP SECTION: Grid Layout */}
                {/* items-center keeps video centered vertically relative to text, preventing it from sinking */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center"> 
                    
                    {/* LEFT: Video & Schematic Container */}
                    <div className="lg:col-span-7 order-2 lg:order-1 flex flex-col relative z-10">
                        
                        {/* 1. The Video */}
                        <VideoShowcase />

                        {/* 2. The Schematic - Directly Underneath */}
                        <div 
                            className={cn(
                                "relative w-full h-[300px] md:h-[350px] hidden md:block origin-top-left",
                                LAYOUT_CONFIG.gapBetweenVideoAndSchematic // Applies gap variable
                            )}
                            style={{ 
                                transform: `scale(${LAYOUT_CONFIG.schematicScale})`,
                                width: `${100 / LAYOUT_CONFIG.schematicScale}%` // Fix width when scaling
                            }}
                        >
                            <Xwrapper>
                                {/* Central Hub */}
                                <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 z-10">
                                    <BubbleFeature 
                                        id="hub" 
                                        icon={Fingerprint} 
                                        label="Your Profile" 
                                        subLabel="The Core"
                                        color="purple" 
                                        className="scale-125 shadow-2xl border-purple-400 bg-purple-50"
                                        delay={0.8}
                                    />
                                </div>

                                {/* Satellite Features */}
                                <div className="absolute top-0 left-[18%]">
                                    <BubbleFeature id="f1" icon={Video} label="Trailer Video" subLabel="Visual Intro" color="pink" delay={1.0} />
                                </div>
                                <div className="absolute bottom-16 left-[20%]">
                                    <BubbleFeature id="f2" icon={ShieldCheck} label="Trust Score" subLabel="Verified" color="emerald" delay={1.1} />
                                </div>
                                <div className="absolute top-4 right-[22%]">
                                    <BubbleFeature id="f3" icon={Sparkles} label="Bio Enhancer" subLabel="AI Written" color="blue" delay={1.2} />
                                </div>
                                <div className="absolute bottom-20 right-[15%]">
                                    <BubbleFeature id="f4" icon={Target} label="Auto Match" subLabel="Best Fit" color="orange" delay={1.3} />
                                </div>
                                <div className="absolute top-[45%] left-[5%]">
                                    <BubbleFeature id="f5" icon={BarChart3} label="Skill Metrics" subLabel="Analytic" color="cyan" delay={1.4} />
                                </div>

                                {/* Arrows */}
                                <Xarrow start="f1" end="hub" color="#cbd5e1" strokeWidth={2} showHead={true} path="smooth" animateDrawing={true} dashness={{ animation: true }} />
                                <Xarrow start="f3" end="hub" color="#cbd5e1" strokeWidth={2} showHead={true} path="smooth" animateDrawing={true} dashness={{ animation: true }} />
                                
                                <Xarrow start="hub" end="f2" color="#a855f7" strokeWidth={2} showHead={true} path="smooth" animateDrawing={true} />
                                <Xarrow start="hub" end="f4" color="#a855f7" strokeWidth={2} showHead={true} path="smooth" animateDrawing={true} />
                                
                                <Xarrow start="f5" end="f2" color="#e2e8f0" strokeWidth={1} dashed showHead={false} path="grid" zIndex={0} />

                            </Xwrapper>
                        </div>
                    </div>

                    {/* RIGHT: Text Content - Aligned Right */}
                    <div className="lg:col-span-5 flex flex-col gap-6 order-1 lg:order-2 items-end text-right pb-20">
                        <motion.div 
                            initial={{ opacity: 0, x: 50 }} 
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex flex-row-reverse items-center gap-2 px-4 py-2 rounded-full bg-purple-100 w-fit"
                        >
                            <span className="text-lg">✨</span>
                            <span className="text-xs font-bold uppercase tracking-widest text-purple-800">
                                The Mirror of Talent
                            </span>
                        </motion.div>
                        
                        <div className="space-y-2 w-full flex flex-col items-end">
                            <SplitText 
                                text="Your Digital" 
                                className="text-5xl md:text-6xl font-black text-slate-900 leading-tight" 
                                delay={0}
                            />
                            <SplitText 
                                text="Essence." 
                                className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-l from-purple-600 to-indigo-500 leading-tight" 
                                delay={5}
                            />
                        </div>

                        <motion.p 
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-lg text-slate-500 leading-relaxed font-medium"
                        >
                            Static resumes are history. Use our <b>Trailer Videos</b> to showcase your personality. Our AI tools—like the Bio Enhancer and Resume Parser—streamline your story, while our deep metrics automatically match you with the perfect opportunities.
                        </motion.p>

                        {/* Bullet points aligned right */}
                        <motion.ul 
                            initial="hidden"
                            whileInView="visible"
                            variants={{
                                visible: { transition: { staggerChildren: 0.1 } }
                            }}
                            className="space-y-3 pt-2 flex flex-col items-end"
                        >
                            {[
                                "AI-Powered Bio & Resume Enhancement",
                                "Video Trailers for authentic expression",
                                "Automated Compatibility Matching"
                            ].map((item, i) => (
                                <motion.li 
                                    key={i}
                                    variants={{
                                        hidden: { opacity: 0, x: 50 },
                                        visible: { opacity: 1, x: 0 }
                                    }}
                                    className="flex items-center flex-row-reverse gap-3 text-slate-700 font-semibold"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                    {item}
                                </motion.li>
                            ))}
                        </motion.ul>
                    </div>
                </div>
                
                {/* Mobile Fallback */}
                <div className="md:hidden grid grid-cols-2 gap-4 mt-8 pb-12">
                     <BubbleFeature id="m1" icon={Fingerprint} label="Your Profile" color="purple" className="col-span-2 justify-center" />
                     <BubbleFeature id="m2" icon={Video} label="Video Intro" color="pink" />
                     <BubbleFeature id="m3" icon={Sparkles} label="AI Enhancer" color="blue" />
                     <BubbleFeature id="m4" icon={ShieldCheck} label="Trust Score" color="emerald" />
                     <BubbleFeature id="m5" icon={Target} label="Auto Match" color="orange" />
                </div>

            </div>
        </section>
    );
}