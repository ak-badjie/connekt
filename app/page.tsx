'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { motion, useSpring, useTransform, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

// --- CONTEXT IMPORTS ---
// Adjust these paths based on your actual file structure
import LoadingScreen from '@/components/ui/LoadingScreen';
import MetallicPaint from '@/components/ui/MetallicPaint';
import { useMinimumLoading } from '@/hooks/useMinimumLoading';
import { useAnimation } from '@/context/AnimationContext';

// --- SLIDE IMPORTS ---
import ProfileSection from '@/components/landing/ProfileSection';
import ConnketAISection from '@/components/landing/ConnketAISection';
import KAISection from '@/components/landing/KAISection';

const SLIDES = [
    ProfileSection,
    ConnketAISection,
    KAISection,
];

const SPRING_OPTIONS = {
    stiffness: 45,
    damping: 12,
    mass: 1.2,
};

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// ==========================================
// 1. ROTATING TEXT COMPONENT
// ==========================================
const RotatingText = forwardRef((props: any, ref) => {
  const {
    texts,
    transition = { type: 'spring', damping: 25, stiffness: 300 },
    initial = { y: '100%', opacity: 0 },
    animate = { y: 0, opacity: 1 },
    exit = { y: '-120%', opacity: 0 },
    animatePresenceMode = 'wait',
    animatePresenceInitial = false,
    rotationInterval = 2000,
    staggerDuration = 0,
    staggerFrom = 'first',
    loop = true,
    auto = true,
    splitBy = 'characters',
    onNext,
    mainClassName,
    splitLevelClassName,
    elementLevelClassName,
    ...rest
  } = props;

  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  const splitIntoCharacters = (text: string) => {
    if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
      const segmenter = new (Intl as any).Segmenter('en', { granularity: 'grapheme' });
      return Array.from(segmenter.segment(text), (segment: any) => segment.segment);
    }
    return Array.from(text);
  };

  const elements = useMemo(() => {
    const currentText = texts[currentTextIndex];
    if (splitBy === 'characters') {
      const words = currentText.split(' ');
      return words.map((word: string, i: number) => ({
        characters: splitIntoCharacters(word),
        needsSpace: i !== words.length - 1
      }));
    }
    if (splitBy === 'words') {
      return currentText.split(' ').map((word: string, i: number, arr: any[]) => ({
        characters: [word],
        needsSpace: i !== arr.length - 1
      }));
    }
    if (splitBy === 'lines') {
      return currentText.split('\n').map((line: string, i: number, arr: any[]) => ({
        characters: [line],
        needsSpace: i !== arr.length - 1
      }));
    }

    return currentText.split(splitBy).map((part: string, i: number, arr: any[]) => ({
      characters: [part],
      needsSpace: i !== arr.length - 1
    }));
  }, [texts, currentTextIndex, splitBy]);

  const getStaggerDelay = useCallback(
    (index: number, totalChars: number) => {
      const total = totalChars;
      if (staggerFrom === 'first') return index * staggerDuration;
      if (staggerFrom === 'last') return (total - 1 - index) * staggerDuration;
      if (staggerFrom === 'center') {
        const center = Math.floor(total / 2);
        return Math.abs(center - index) * staggerDuration;
      }
      if (staggerFrom === 'random') {
        const randomIndex = Math.floor(Math.random() * total);
        return Math.abs(randomIndex - index) * staggerDuration;
      }
      return Math.abs((staggerFrom as number) - index) * staggerDuration;
    },
    [staggerFrom, staggerDuration]
  );

  const handleIndexChange = useCallback(
    (newIndex: number) => {
      setCurrentTextIndex(newIndex);
      if (onNext) onNext(newIndex);
    },
    [onNext]
  );

  const next = useCallback(() => {
    const nextIndex = currentTextIndex === texts.length - 1 ? (loop ? 0 : currentTextIndex) : currentTextIndex + 1;
    if (nextIndex !== currentTextIndex) {
      handleIndexChange(nextIndex);
    }
  }, [currentTextIndex, texts.length, loop, handleIndexChange]);

  const previous = useCallback(() => {
    const prevIndex = currentTextIndex === 0 ? (loop ? texts.length - 1 : currentTextIndex) : currentTextIndex - 1;
    if (prevIndex !== currentTextIndex) {
      handleIndexChange(prevIndex);
    }
  }, [currentTextIndex, texts.length, loop, handleIndexChange]);

  const jumpTo = useCallback(
    (index: number) => {
      const validIndex = Math.max(0, Math.min(index, texts.length - 1));
      if (validIndex !== currentTextIndex) {
        handleIndexChange(validIndex);
      }
    },
    [texts.length, currentTextIndex, handleIndexChange]
  );

  const reset = useCallback(() => {
    if (currentTextIndex !== 0) {
      handleIndexChange(0);
    }
  }, [currentTextIndex, handleIndexChange]);

  useImperativeHandle(
    ref,
    () => ({
      next,
      previous,
      jumpTo,
      reset
    }),
    [next, previous, jumpTo, reset]
  );

  useEffect(() => {
    if (!auto) return;
    const intervalId = setInterval(next, rotationInterval);
    return () => clearInterval(intervalId);
  }, [next, rotationInterval, auto]);

  return (
    <motion.span
      className={cn('flex flex-wrap whitespace-pre-wrap relative', mainClassName)}
      {...rest}
      layout
      transition={transition}
    >
      <span className="sr-only">{texts[currentTextIndex]}</span>
      <AnimatePresence mode={animatePresenceMode} initial={animatePresenceInitial}>
        <motion.span
          key={currentTextIndex}
          className={cn(splitBy === 'lines' ? 'flex flex-col w-full' : 'flex flex-wrap whitespace-pre-wrap relative')}
          layout
          aria-hidden="true"
        >
          {elements.map((wordObj: any, wordIndex: number, array: any[]) => {
            const previousCharsCount = array.slice(0, wordIndex).reduce((sum, word) => sum + word.characters.length, 0);
            return (
              <span key={wordIndex} className={cn('inline-flex', splitLevelClassName)}>
                {wordObj.characters.map((char: string, charIndex: number) => (
                  <motion.span
                    key={charIndex}
                    initial={initial}
                    animate={animate}
                    exit={exit}
                    transition={{
                      ...transition,
                      delay: getStaggerDelay(
                        previousCharsCount + charIndex,
                        array.reduce((sum, word) => sum + word.characters.length, 0)
                      )
                    }}
                    className={cn('inline-block', elementLevelClassName)}
                  >
                    {char}
                  </motion.span>
                ))}
                {wordObj.needsSpace && <span className="whitespace-pre"> </span>}
              </span>
            );
          })}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
});
RotatingText.displayName = 'RotatingText';

// ==========================================
// 2. METALLIC HERO ASSETS (SVG MARKUP)
// ==========================================

const CONNEKT_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <rect width="100%" height="100%" fill="white" />
  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" fill="none" stroke="black" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" fill="none" stroke="black" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
</svg>
`;

// FIXED WORDMARK: 
// 1. viewBox="-5 5 260 55" to prevent the "C" from clipping.
// 2. stroke-width="6.5" to make it BOLD/HEAVY for better metallic reflection.
const CONNEKT_WORDMARK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-5 5 260 55" width="1000" height="250">
  <rect width="100%" height="100%" fill="white" />
  <g fill="black" stroke="black" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" paint-order="stroke fill">
    <g transform="translate(0, 0)">
      <path d="M30.15 47.63Q28.81 48.22 27.72 48.73Q26.64 49.24 24.88 49.80Q23.39 50.27 21.64 50.60Q19.90 50.93 17.80 50.93Q13.84 50.93 10.61 49.82Q7.37 48.71 4.98 46.34Q2.64 44.02 1.32 40.44Q0 36.87 0 32.13Q0 27.64 1.27 24.10Q2.54 20.56 4.93 18.12Q7.25 15.75 10.53 14.50Q13.82 13.26 17.82 13.26Q20.75 13.26 23.67 13.96Q26.59 14.67 30.15 16.46L30.15 22.19L29.79 22.19Q26.78 19.68 23.83 18.53Q20.87 17.38 17.50 17.38Q14.75 17.38 12.54 18.27Q10.33 19.17 8.59 21.04Q6.91 22.88 5.97 25.67Q5.03 28.47 5.03 32.13Q5.03 35.96 6.07 38.72Q7.10 41.48 8.74 43.21Q10.45 45.02 12.73 45.89Q15.01 46.75 17.55 46.75Q21.04 46.75 24.10 45.56Q27.15 44.36 29.81 41.97L30.15 41.97L30.15 47.63ZM64.09 18.09Q66.31 20.53 67.49 24.07Q68.68 27.61 68.68 32.10Q68.68 36.60 67.47 40.15Q66.26 43.70 64.09 46.07Q61.84 48.54 58.78 49.78Q55.71 51.03 51.78 51.03Q47.95 51.03 44.81 49.76Q41.67 48.49 39.48 46.07Q37.28 43.65 36.10 40.14Q34.91 36.62 34.91 32.10Q34.91 27.66 36.08 24.13Q37.26 20.61 39.50 18.09Q41.65 15.70 44.84 14.43Q48.02 13.16 51.78 13.16Q55.69 13.16 58.80 14.44Q61.91 15.72 64.09 18.09M63.65 32.10Q63.65 25.02 60.47 21.18Q57.30 17.33 51.81 17.33Q46.26 17.33 43.10 21.18Q39.94 25.02 39.94 32.10Q39.94 39.26 43.16 43.05Q46.39 46.85 51.81 46.85Q57.23 46.85 60.44 43.05Q63.65 39.26 63.65 32.10ZM104.08 50.27L98.10 50.27L80.86 17.75L80.86 50.27L76.34 50.27L76.34 13.92L83.84 13.92L99.56 43.60L99.56 13.92L104.08 13.92L104.08 50.27ZM141.48 50.27L135.50 50.27L118.26 17.75L118.26 50.27L113.75 50.27L113.75 13.92L121.24 13.92L136.96 43.60L136.96 13.92L141.48 13.92L141.48 50.27ZM175.10 50.27L151.15 50.27L151.15 13.92L175.10 13.92L175.10 18.21L155.98 18.21L155.98 28.17L175.10 28.17L175.10 32.47L155.98 32.47L155.98 45.97L175.10 45.97L175.10 50.27ZM211.99 50.27L205.71 50.27L191.33 34.08L187.72 37.94L187.72 50.27L182.89 50.27L182.89 13.92L187.72 13.92L187.72 32.89L205.37 13.92L211.23 13.92L195.00 31.01L211.99 50.27ZM243.33 18.21L230.35 18.21L230.35 50.27L225.51 50.27L225.51 18.21L212.52 18.21L212.52 13.92L243.33 13.92L243.33 18.21Z"/>
    </g>
  </g>
</svg>
`;

// ==========================================
// 3. MAIN TITLE COMPONENT (LOGO + TEXT)
// ==========================================
const MetallicLogoGroup = () => {
    return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mt-10 md:mt-0">
            {/* SVG LOGO */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="w-24 h-24 md:w-32 md:h-32 relative shrink-0"
            >
                <MetallicPaint
                  svg={CONNEKT_ICON_SVG}
                  className="block w-full h-full"
                />
            </motion.div>

      {/* METALLIC TEXT - SIGNIFICANTLY INCREASED SIZE */}
      {/* w-[95vw] on mobile, w-[70rem] on desktop */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="relative w-[95vw] md:w-[70rem] h-24 md:h-52"
      >
        <MetallicPaint
          svg={CONNEKT_WORDMARK_SVG}
          className="block w-full h-full"
          params={{
              speed: 0.2,   // Slower speed for heavier look
              liquid: 0.1,  // Enhanced liquid distortion
              edge: 0.5     // Softer edges
          }}
        />
      </motion.div>
        </div>
    );
}

// ==========================================
// 4. MAIN LANDING PAGE
// ==========================================
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
            if (activeIndex < TOTAL_INDICES - 1) {
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

    }, [activeIndex, isScrolling, TOTAL_INDICES]);

    useEffect(() => {
        if (!shouldShowLoading) {
            window.addEventListener('wheel', handleWheel, { passive: false });
            return () => window.removeEventListener('wheel', handleWheel);
        }
    }, [handleWheel, shouldShowLoading]);


    // --- ANIMATION TRANSFORMS ---
    const whiteContainerY = useTransform(springIndex, [0, 1], ['100vh', '0vh']);
    const heroY = useTransform(springIndex, [0, 1], ['0vh', '20vh']);
    const heroOpacity = useTransform(springIndex, [0, 0.8], [1, 0]);
    const heroScale = useTransform(springIndex, [0, 1], [1, 0.9]);
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
            
            {/* LAYER 1: HERO SECTION */}
            <motion.div 
                style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
                className="absolute inset-0 flex flex-col items-center justify-center z-0"
            >
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/40 via-black to-black" />
                
                <div className="relative z-10 w-full flex flex-col items-center justify-center px-4">
                    
                    {/* METALLIC LOGO + TEXT */}
                    <div className="mb-6 md:mb-12">
                        <MetallicLogoGroup />
                    </div>

                    {/* ROTATING SLOGAN: "Scale Beyond" (Teal) + Pill */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 2.5 }}
                        className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 text-3xl md:text-5xl font-bold tracking-tight relative z-10"
                    >
                         {/* FIXED PART - TEAL */}
                         <span className="text-teal-400 drop-shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                            Scale Beyond
                         </span>

                         {/* DYNAMIC PILL PART */}
                         <LayoutGroup>
                             <motion.div 
                                layout
                                className="bg-slate-900/90 border border-slate-700/50 backdrop-blur-md rounded-full px-6 py-2 md:py-3 shadow-[0_0_30px_rgba(255,255,255,0.05)] flex items-center justify-center min-w-[150px]"
                                transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 30
                                }}
                             >
                                <RotatingText
                                    texts={[
                                        "Yourself",
                                        "Your Team",
                                        "Borders",
                                        "Limits"
                                    ]}
                                    mainClassName="text-white font-extrabold"
                                    rotationInterval={3000}
                                    staggerDuration={0.05}
                                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                />
                            </motion.div>
                        </LayoutGroup>
                    </motion.div>
                    
                    <motion.button 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 3.2 }}
                        onClick={() => setActiveIndex(1)}
                        className="mt-16 px-10 py-4 bg-teal-500 text-black text-lg rounded-full font-bold hover:scale-105 hover:bg-teal-400 hover:shadow-[0_0_30px_rgba(20,184,166,0.6)] transition-all"
                    >
                        Start the Journey
                    </motion.button>
                </div>

                <motion.div 
                    animate={{ y: [0, 10, 0], opacity: [0.2, 1, 0.2] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute bottom-12 text-teal-500/50"
                >
                    <ChevronDown size={32} />
                </motion.div>
            </motion.div>


            {/* LAYER 2: FOREGROUND CONTENT */}
            <motion.div 
                style={{ y: whiteContainerY }}
                className="absolute inset-0 z-20"
            >
                <div className="absolute inset-0 bg-slate-50 rounded-t-[4rem] shadow-[0_-50px_100px_rgba(0,0,0,0.5)] overflow-hidden">
                    <motion.div 
                        style={{ y: internalContentY }}
                        className="w-full h-full"
                    >
                        {SLIDES.map((Component, index) => {
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
        </div>
    );
}