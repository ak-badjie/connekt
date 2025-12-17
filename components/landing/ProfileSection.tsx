'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
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
// 🛠️ UTILITIES
// ==============================================
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ==============================================
// 1️⃣ COMPONENT: TEXT PRESSURE
// ==============================================
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
};
  
const getAttr = (distance: number, maxDist: number, minVal: number, maxVal: number) => {
    const val = maxVal - Math.abs((maxVal * distance) / maxDist);
    return Math.max(minVal, val + minVal);
};
  
const debounce = (func: Function, delay: number) => {
    let timeoutId: any;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(null, args);
      }, delay);
    };
};
  
const TextPressure = ({
    text = 'Compressa',
    fontFamily = 'Compressa VF',
    fontUrl = 'https://res.cloudinary.com/dr6lvwubh/raw/upload/v1529908256/CompressaPRO-GX.woff2',
    width = true,
    weight = true,
    italic = true,
    alpha = false,
    flex = true,
    stroke = false,
    scale = false,
    textColor = '#000000',
    strokeColor = '#FF0000',
    strokeWidth = 2,
    className = '',
    minFontSize = 24
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const spansRef = useRef<(HTMLSpanElement | null)[]>([]);
    const mouseRef = useRef({ x: 0, y: 0 });
    
    const [fontSize, setFontSize] = useState(minFontSize);
    const [scaleY, setScaleY] = useState(1);
    const [lineHeight, setLineHeight] = useState(1);
  
    const chars = text.split('');
  
    const setSize = useCallback(() => {
      if (!containerRef.current || !titleRef.current) return;
      const { width: containerW, height: containerH } = containerRef.current.getBoundingClientRect();
      let newFontSize = containerW / (chars.length / 2);
      newFontSize = Math.max(newFontSize, minFontSize);
      setFontSize(newFontSize);
      setScaleY(1);
      setLineHeight(1);
      requestAnimationFrame(() => {
        if (!titleRef.current) return;
        const textRect = titleRef.current.getBoundingClientRect();
        if (scale && textRect.height > 0) {
          const yRatio = containerH / textRect.height;
          setScaleY(yRatio);
          setLineHeight(yRatio);
        }
      });
    }, [chars.length, minFontSize, scale]);
  
    useEffect(() => {
      const debouncedSetSize = debounce(setSize, 100);
      debouncedSetSize();
      window.addEventListener('resize', debouncedSetSize);
      return () => window.removeEventListener('resize', debouncedSetSize);
    }, [setSize]);
  
    useEffect(() => {
      let rafId: number;
      const animate = () => {
        if (titleRef.current && containerRef.current) {
             const containerRect = containerRef.current.getBoundingClientRect();
             const time = Date.now() / 1000; 
             const speed = 2; 
             const normalizedPosition = (Math.sin(time * speed) + 1) / 2;
             mouseRef.current.x = containerRect.left + (containerRect.width * normalizedPosition);
             mouseRef.current.y = containerRect.top + (containerRect.height / 2);

             const titleRect = titleRef.current.getBoundingClientRect();
             const maxDist = titleRect.width / 2;
    
             spansRef.current.forEach(span => {
                if (!span) return;
                const rect = span.getBoundingClientRect();
                const charCenter = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
                const d = dist(mouseRef.current, charCenter);
                const wdth = width ? Math.floor(getAttr(d, maxDist, 5, 200)) : 100;
                const wght = weight ? Math.floor(getAttr(d, maxDist, 100, 900)) : 400;
                const italVal = italic ? getAttr(d, maxDist, 0, 1).toFixed(2) : 0;
                const alphaVal = alpha ? getAttr(d, maxDist, 0, 1).toFixed(2) : 1;
                const newFontVariationSettings = `'wght' ${wght}, 'wdth' ${wdth}, 'ital' ${italVal}`;
    
                if (span.style.fontVariationSettings !== newFontVariationSettings) {
                  span.style.fontVariationSettings = newFontVariationSettings;
                }
                if (alpha && span.style.opacity !== alphaVal) {
                  span.style.opacity = String(alphaVal);
                }
             });
        }
        rafId = requestAnimationFrame(animate);
      };
      animate();
      return () => cancelAnimationFrame(rafId);
    }, [width, weight, italic, alpha]);
  
    return (
      <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-transparent">
        <style>{`
          @font-face {
            font-family: '${fontFamily}';
            src: url('${fontUrl}');
            font-style: normal;
          }
          .stroke span {
            position: relative;
            color: ${textColor};
          }
          .stroke span::after {
            content: attr(data-char);
            position: absolute;
            left: 0;
            top: 0;
            color: transparent;
            z-index: -1;
            -webkit-text-stroke-width: ${strokeWidth}px;
            -webkit-text-stroke-color: ${strokeColor};
          }
        `}</style>
        <h1
          ref={titleRef}
          className={`text-pressure-title ${className} ${flex ? 'flex justify-between' : ''} ${stroke ? 'stroke' : ''} uppercase text-center`}
          style={{
            fontFamily,
            fontSize: fontSize,
            lineHeight,
            transform: `scale(1, ${scaleY})`,
            transformOrigin: 'center top',
            margin: 0,
            fontWeight: 100,
            color: stroke ? undefined : textColor
          }}
        >
          {chars.map((char, i) => (
            <span key={i} ref={el => { spansRef.current[i] = el }} data-char={char} className="inline-block">
              {char}
            </span>
          ))}
        </h1>
      </div>
    );
};

// ==============================================
// 2️⃣ COMPONENT: BLUR TEXT
// ==============================================
const buildKeyframes = (from: any, steps: any[]) => {
    const keys = new Set([...Object.keys(from), ...steps.flatMap(s => Object.keys(s))]);
    const keyframes: Record<string, any[]> = {};
    keys.forEach(k => {
      keyframes[k] = [from[k], ...steps.map(s => s[k])];
    });
    return keyframes;
};
  
const BlurText = ({
    text = '',
    delay = 200,
    className = '',
    animateBy = 'words' as 'words' | 'letters',
    direction = 'top' as 'top' | 'bottom',
    threshold = 0.1,
    rootMargin = '0px',
    animationFrom,
    animationTo,
    easing = (t: number) => t,
    onAnimationComplete,
    stepDuration = 0.35
}) => {
    const elements = animateBy === 'words' ? text.split(' ') : text.split('');
    const [inView, setInView] = useState(false);
    const ref = useRef<HTMLParagraphElement>(null);
  
    useEffect(() => {
      if (!ref.current) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true);
          } else {
            setInView(false);
          }
        },
        { threshold, rootMargin }
      );
      observer.observe(ref.current);
      return () => observer.disconnect();
    }, [threshold, rootMargin]);
  
    const defaultFrom = useMemo(
      () => direction === 'top' ? { filter: 'blur(10px)', opacity: 0, y: -50 } : { filter: 'blur(10px)', opacity: 0, y: 50 },
      [direction]
    );
  
    const defaultTo = useMemo(
      () => [
        { filter: 'blur(5px)', opacity: 0.5, y: direction === 'top' ? 5 : -5 },
        { filter: 'blur(0px)', opacity: 1, y: 0 }
      ],
      [direction]
    );
  
    const fromSnapshot = animationFrom ?? defaultFrom;
    const toSnapshots = animationTo ?? defaultTo;
    const stepCount = toSnapshots.length + 1;
    const totalDuration = stepDuration * (stepCount - 1);
    const times = Array.from({ length: stepCount }, (_, i) => (stepCount === 1 ? 0 : i / (stepCount - 1)));
  
    return (
      <p ref={ref} className={`blur-text ${className} flex flex-wrap`}>
        {elements.map((segment, index) => {
          const animateKeyframes = buildKeyframes(fromSnapshot, toSnapshots);
          const spanTransition = {
            duration: totalDuration,
            times,
            delay: (index * delay) / 1000,
            ease: easing
          };
          return (
            <motion.span
              className="inline-block will-change-[transform,filter,opacity]"
              key={index}
              initial={fromSnapshot}
              animate={inView ? animateKeyframes : fromSnapshot}
              transition={spanTransition}
              onAnimationComplete={index === elements.length - 1 ? onAnimationComplete : undefined}
            >
              {segment === ' ' ? '\u00A0' : segment}
              {animateBy === 'words' && index < elements.length - 1 && '\u00A0'}
            </motion.span>
          );
        })}
      </p>
    );
};

// ==============================================
// 3️⃣ COMPONENT: BUBBLE & SCHEMATIC ORCHESTRATOR
// ==============================================

const TEAL_HEX = "#0d9488"; 

interface BubbleProps {
    id: string;
    icon: any;
    label: string;
    subLabel?: string;
    className?: string;
    show: boolean; 
}

const BubbleFeature = ({ id, icon: Icon, label, subLabel, className, show }: BubbleProps) => {
    return (
        <motion.div
            id={id}
            initial={{ scale: 0, opacity: 0 }}
            animate={show ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 25, 
                mass: 0.5 // Lighter mass for snappier pop
            }}
            className={cn(
                "relative flex items-center gap-3 px-4 py-2 rounded-full border border-teal-100/50 bg-white shadow-lg shadow-teal-900/5 cursor-pointer z-20 group transition-all duration-300",
                "hover:border-teal-500 hover:shadow-teal-500/20",
                className
            )}
        >
            <div className="p-1.5 rounded-full bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                <Icon size={18} />
            </div>
            <div className="flex flex-col text-left">
                <span className="text-sm font-bold leading-tight text-zinc-900">{label}</span>
                {subLabel && <span className="text-[9px] uppercase font-semibold text-teal-600/70 tracking-wider">{subLabel}</span>}
            </div>
        </motion.div>
    );
};

// --- Sequenced Schematic Component (REFACTORED FOR SMOOTHNESS) ---
const SchematicSequence = () => {
    const updateXarrow = useXarrow();
  const updateXarrowRef = useRef(updateXarrow);
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { amount: 0.4, once: false });
    
    // Using a counter to progress the animation scene
    const [sequenceStep, setSequenceStep] = useState(0);

    useEffect(() => {
        if (isInView) {
            // Sequence: 
            // 0: Hub appears
            // 1: Arrow to Video draws
            // 2: Video Bubble pops
            // 3: Arrow to Bio draws
            // 4: Bio Bubble pops
            // ... etc
            
            const interval = setInterval(() => {
                setSequenceStep(prev => (prev < 12 ? prev + 1 : prev)); 
            }, 300); // 300ms beat for the animation

            return () => clearInterval(interval);
        } else {
            setSequenceStep(0); // Reset when scrolled out
        }
    }, [isInView]);

    useEffect(() => {
      updateXarrowRef.current = updateXarrow;
    }, [updateXarrow]);

    // Force redraw on window resize or step change
    useEffect(() => {
      updateXarrowRef.current();
    }, [sequenceStep]);

    // Helper to calculate visibility
    const isVisible = (stepThreshold: number) => sequenceStep >= stepThreshold;

    return (
        <div 
            ref={containerRef}
            className="relative w-full h-[300px] md:h-[350px] hidden md:block origin-top-left -mt-0"
            style={{ 
                transform: `scale(0.95)`,
                width: `${100 / 0.95}%`
            }}
        >
            <Xwrapper>
                {/* 1. The Core Hub (Appears at Step 1) */}
                <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 z-10">
                    <BubbleFeature 
                        id="hub" 
                        icon={Fingerprint} 
                        label="Your Profile" 
                        subLabel="The Core"
                        className="scale-125 border-teal-200 bg-white"
                        show={isVisible(1)}
                    />
                </div>

                {/* 2. Top Left: Trailer Video (Arrow at 2, Node at 3) */}
                <div className="absolute top-0 left-[18%]">
                    <BubbleFeature id="f1" icon={Video} label="Trailer Video" subLabel="Visual Intro" show={isVisible(3)} />
                </div>

                {/* 3. Top Right: Bio Enhancer (Arrow at 4, Node at 5) */}
                <div className="absolute top-4 right-[22%]">
                    <BubbleFeature id="f3" icon={Sparkles} label="Bio Enhancer" subLabel="AI Written" show={isVisible(5)} />
                </div>

                {/* 4. Bottom Right: Auto Match (Arrow at 6, Node at 7) */}
                <div className="absolute bottom-20 right-[15%]">
                    <BubbleFeature id="f4" icon={Target} label="Auto Match" subLabel="Best Fit" show={isVisible(7)} />
                </div>

                {/* 5. Bottom Left: Trust Score (Arrow at 8, Node at 9) */}
                <div className="absolute bottom-16 left-[20%]">
                    <BubbleFeature id="f2" icon={ShieldCheck} label="Trust Score" subLabel="Verified" show={isVisible(9)} />
                </div>
                
                {/* 6. Middle Left: Metrics (Dashed Line at 10, Node at 11) */}
                <div className="absolute top-[45%] left-[5%]">
                    <BubbleFeature id="f5" icon={BarChart3} label="Skill Metrics" subLabel="Analytic" show={isVisible(11)} />
                </div>

                {/* 
                   ARROWS 
                   We use `animateDrawing={0.4}` which takes 400ms.
                   Our step interval is 300ms. 
                   This creates a slight overlap where the node pops just as the line finishes.
                */}
                
                {/* Hub -> Video */}
                {isVisible(2) && (
                    <Xarrow 
                        start="hub" end="f1" 
                        color={TEAL_HEX} strokeWidth={2} showHead={true} 
                        path="smooth" curveness={0.5} 
                        animateDrawing={0.4} 
                    />
                )}

                {/* Hub -> Bio */}
                {isVisible(4) && (
                    <Xarrow 
                        start="hub" end="f3" 
                        color={TEAL_HEX} strokeWidth={2} showHead={true} 
                        path="smooth" curveness={0.5} 
                        animateDrawing={0.4} 
                    />
                )}
                
                {/* Hub -> Match */}
                {isVisible(6) && (
                    <Xarrow 
                        start="hub" end="f4" 
                        color={TEAL_HEX} strokeWidth={2} showHead={true} 
                        path="smooth" curveness={0.5} 
                        animateDrawing={0.4} 
                    />
                )}

                {/* Hub -> Trust */}
                {isVisible(8) && (
                    <Xarrow 
                        start="hub" end="f2" 
                        color={TEAL_HEX} strokeWidth={2} showHead={true} 
                        path="smooth" curveness={0.5} 
                        animateDrawing={0.4} 
                    />
                )}
                
                {/* Metric -> Trust (Dashed) */}
                {isVisible(10) && (
                    <Xarrow 
                        start="f5" end="f2" 
                        color={TEAL_HEX} strokeWidth={1} dashed showHead={false} 
                        path="grid" zIndex={0} 
                        animateDrawing={0.4} 
                    />
                )}

            </Xwrapper>
        </div>
    );
};

// --- Mobile Bubble (Self-Triggered) ---
const MobileBubble = (props: BubbleProps) => (
    <motion.div
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: false }}
        className="flex justify-center"
    >
        <BubbleFeature {...props} show={true} />
    </motion.div>
);

// --- Video Component (Borderless with Teal Glow) ---
const VideoShowcase = () => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative w-full group origin-bottom" 
        >
            <div className="absolute -inset-4 bg-teal-500/20 rounded-[3rem] blur-3xl opacity-40 group-hover:opacity-70 transition-opacity duration-700" />
            <video 
                src="/video.mp4" // Ensure this path is correct
                autoPlay 
                loop 
                muted 
                playsInline
                className="relative z-10 w-full h-auto object-cover rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(13,148,136,0.3)] bg-zinc-900"
            />
        </motion.div>
    );
};

// ==============================================
// 4️⃣ MAIN EXPORT
// ==============================================
export default function ProfileSection() {
    return (
        <section className="relative w-full pb-0 bg-white overflow-hidden pt-40">
            <div className="container mx-auto px-6 md:px-12">
                
                {/* TOP SECTION: Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center"> 
                    
                    {/* LEFT: Video & Schematic */}
                    <div className="lg:col-span-7 order-2 lg:order-1 flex flex-col relative z-10">
                        <VideoShowcase />
                        {/* The Orchestrated Diagram */}
                        <SchematicSequence />
                    </div>

                    {/* RIGHT: Text Content */}
                    <div className="lg:col-span-5 flex flex-col gap-6 order-1 lg:order-2 items-end text-right pb-20">
                        {/* 1. Badge */}
                        <motion.div 
                            initial={{ opacity: 0, x: 50 }} 
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: false }}
                            className="inline-flex flex-row-reverse items-center gap-2 px-4 py-2 rounded-full bg-teal-600 w-fit shadow-lg shadow-teal-600/20"
                        >
                            <span className="text-xs font-bold uppercase tracking-widest text-white">
                                The Mirror of Talent
                            </span>
                        </motion.div>
                        
                        <div className="space-y-4 w-full flex flex-col items-end">
                            {/* 2. "Your Digital" */}
                            <BlurText 
                                text="Your Digital" 
                                className="text-5xl md:text-6xl font-black text-teal-600 leading-tight justify-end"
                                delay={50}
                            />
                            
                            {/* 3. "ESSENCE" */}
                            <div className="w-full h-24 md:h-32 relative">
                                <TextPressure 
                                    text="ESSENCE"
                                    flex={true}
                                    alpha={false}
                                    stroke={false}
                                    width={true}
                                    weight={true}
                                    italic={true}
                                    textColor={TEAL_HEX}
                                    minFontSize={40}
                                />
                            </div>
                        </div>

                        {/* 4. Description */}
                        <div className="text-lg text-zinc-600 leading-relaxed font-medium flex justify-end">
                             <BlurText 
                                text="Static resumes are history. Use our Trailer Videos to showcase your personality. Our AI tools—like the Bio Enhancer and Resume Parser—streamline your story, while our deep metrics automatically match you with the perfect opportunities."
                                delay={10}
                                className="justify-end text-right"
                             />
                        </div>

                        {/* 5. Bullets */}
                        <div className="space-y-3 pt-2 flex flex-col items-end">
                            {[
                                "AI-Powered Bio & Resume Enhancement",
                                "Video Trailers for authentic expression",
                                "Automated Compatibility Matching"
                            ].map((item, i) => (
                                <div key={i} className="flex flex-row-reverse items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                                    <BlurText 
                                        text={item} 
                                        className="text-zinc-800 font-bold justify-end"
                                        delay={20} 
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* Mobile Fallback */}
                <div className="md:hidden grid grid-cols-2 gap-4 mt-8 pb-12">
                     <div className="col-span-2">
                        <MobileBubble id="m1" icon={Fingerprint} label="Your Profile" show={true} />
                     </div>
                     <MobileBubble id="m2" icon={Video} label="Video Intro" show={true} />
                     <MobileBubble id="m3" icon={Sparkles} label="AI Enhancer" show={true} />
                     <MobileBubble id="m4" icon={ShieldCheck} label="Trust Score" show={true} />
                     <MobileBubble id="m5" icon={Target} label="Auto Match" show={true} />
                </div>

            </div>
        </section>
    );
}