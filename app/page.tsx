'use client';

import React, { useState, useEffect, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Search, ChevronDown } from 'lucide-react';
import Image from 'next/image';

// --- CONTEXT IMPORTS ---
import LoadingScreen from '@/components/ui/LoadingScreen';
import MetallicPaint from '@/components/ui/MetallicPaint';
import { useMinimumLoading } from '@/hooks/useMinimumLoading';
import { useAnimation } from '@/context/AnimationContext';

// --- SLIDE IMPORTS ---
import ProfileSection from '@/components/landing/ProfileSection';
import ConnketAISection from '@/components/landing/ConnketAISection';
import ConnektMailSection from '@/components/landing/ConnektMailSection';
import KAISection from '@/components/landing/KAISection';
import ExploreSection from '@/components/landing/ExploreSection';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// ==========================================
// ROTATING TEXT COMPONENT
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

  const getStaggerDelay = React.useCallback(
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

  const handleIndexChange = React.useCallback(
    (newIndex: number) => {
      setCurrentTextIndex(newIndex);
      if (onNext) onNext(newIndex);
    },
    [onNext]
  );

  const next = React.useCallback(() => {
    const nextIndex = currentTextIndex === texts.length - 1 ? (loop ? 0 : currentTextIndex) : currentTextIndex + 1;
    if (nextIndex !== currentTextIndex) {
      handleIndexChange(nextIndex);
    }
  }, [currentTextIndex, texts.length, loop, handleIndexChange]);

  const previous = React.useCallback(() => {
    const prevIndex = currentTextIndex === 0 ? (loop ? texts.length - 1 : currentTextIndex) : currentTextIndex - 1;
    if (prevIndex !== currentTextIndex) {
      handleIndexChange(prevIndex);
    }
  }, [currentTextIndex, texts.length, loop, handleIndexChange]);

  const jumpTo = React.useCallback(
    (index: number) => {
      const validIndex = Math.max(0, Math.min(index, texts.length - 1));
      if (validIndex !== currentTextIndex) {
        handleIndexChange(validIndex);
      }
    },
    [texts.length, currentTextIndex, handleIndexChange]
  );

  const reset = React.useCallback(() => {
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
// METALLIC SVGs
// ==========================================
const CONNEKT_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <rect width="100%" height="100%" fill="white" />
  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" fill="none" stroke="black" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" fill="none" stroke="black" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" />
</svg>
`;

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
// MAIN LANDING PAGE
// ==========================================
export default function LandingPage() {
  // --- LOADING LOGIC ---
  const [isLoading, setIsLoading] = useState(true);
  const { hasGlobalAnimationRun, setHasGlobalAnimationRun } = useAnimation();
  const [activeTab, setActiveTab] = useState<'talent' | 'jobs'>('talent');

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

  // --- RENDER ---
  if (shouldShowLoading && !hasGlobalAnimationRun) {
    return <LoadingScreen variant="default" />;
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden font-sans text-slate-900">

      {/* HERO SECTION */}
      <section className="relative w-full min-h-[85vh] md:min-h-screen overflow-hidden">
        {/* Background container with rounded corners */}
        <div className="absolute inset-4 md:inset-8 rounded-3xl md:rounded-[2.5rem] overflow-hidden">

          {/* Full-width Background Image */}
          <div className="absolute inset-0">
            <Image
              src="/hero_image.jpeg"
              alt="Professional working on laptop"
              fill
              className="object-cover object-center"
              priority
            />
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
          </div>

          {/* Content Grid */}
          <div className="relative h-full w-full flex flex-col justify-center px-6 md:px-12 lg:px-20 py-12">

            {/* Left Content - Text & Controls */}
            <div className="flex flex-col items-start justify-center max-w-2xl z-10">

              {/* Main Metallic Logo + Text */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex items-center gap-4 md:gap-6 mb-6"
              >
                {/* Metallic Briefcase Icon */}
                <div className="w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 shrink-0">
                  <MetallicPaint
                    svg={CONNEKT_ICON_SVG}
                    className="block w-full h-full"
                  />
                </div>

                {/* Metallic CONNEKT Wordmark */}
                <div className="relative w-[280px] md:w-[400px] lg:w-[500px] h-20 md:h-28 lg:h-36">
                  <MetallicPaint
                    svg={CONNEKT_WORDMARK_SVG}
                    className="block w-full h-full"
                    params={{
                      speed: 0.2,
                      liquid: 0.1,
                      edge: 0.5,
                      patternScale: 3,
                      refraction: 0.02
                    }}
                  />
                </div>
              </motion.div>

              {/* Subtitle with rotating text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="mb-8"
              >
                <LayoutGroup id="hero-slogan">
                  <motion.div
                    layout="position"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3 text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight"
                  >
                    <motion.span
                      layout="position"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      className="text-teal-400 drop-shadow-lg"
                    >
                      Scale Beyond
                    </motion.span>

                    <motion.div
                      layout
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      className="bg-white/10 border border-white/20 backdrop-blur-md rounded-full px-5 py-1.5 md:py-2 flex items-center justify-center min-w-[120px]"
                    >
                      <RotatingText
                        texts={[
                          "Yourself",
                          "Your Team",
                          "Borders",
                          "Limits"
                        ]}
                        mainClassName="text-white font-bold"
                        rotationInterval={3000}
                        staggerDuration={0.05}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        animatePresenceMode="popLayout"
                      />
                    </motion.div>
                  </motion.div>
                </LayoutGroup>
              </motion.div>

              {/* Tab Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="flex gap-2 mb-4"
              >
                <button
                  onClick={() => setActiveTab('talent')}
                  className={cn(
                    "px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300",
                    activeTab === 'talent'
                      ? "bg-white text-slate-900 shadow-lg"
                      : "bg-slate-800/80 text-white hover:bg-slate-700"
                  )}
                >
                  Find talent
                </button>
                <button
                  onClick={() => setActiveTab('jobs')}
                  className={cn(
                    "px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300",
                    activeTab === 'jobs'
                      ? "bg-white text-slate-900 shadow-lg"
                      : "bg-teal-600 text-white hover:bg-teal-500"
                  )}
                >
                  Browse jobs
                </button>
              </motion.div>

              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="w-full max-w-lg mb-8"
              >
                <div className="flex items-center bg-white rounded-full shadow-xl border border-slate-200/80 overflow-hidden">
                  <input
                    type="text"
                    placeholder="Search by role, skills, or keywords"
                    className="flex-1 px-6 py-4 text-slate-700 placeholder-slate-400 outline-none text-sm md:text-base"
                  />
                  <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-5 py-3 m-1.5 rounded-full font-medium transition-colors">
                    <Search size={18} />
                    <span className="hidden sm:inline">Search</span>
                  </button>
                </div>
              </motion.div>

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.1 }}
                className="flex items-center gap-6 text-white/60 text-xs"
              >
                <span className="font-medium text-white/80">Trusted by:</span>
                <div className="flex items-center gap-6">
                  <span className="font-semibold text-white/70">Microsoft</span>
                  <span className="font-semibold text-white/70">Airbnb</span>
                  <span className="font-semibold text-white/70">Bissap</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0], opacity: [0.3, 0.8, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-400"
        >
          <ChevronDown size={28} />
        </motion.div>
      </section>


      {/* EXPLORE PROS SECTION */}
      <ExploreSection />

      {/* PROFILE SECTION */}
      <ProfileSection />

      {/* CONNEKT AI SECTION */}
      <ConnketAISection isVisible={true} />

      {/* CONNEKT MAIL SECTION */}
      <ConnektMailSection />

      {/* KAI SECTION */}
      <section className="min-h-screen w-full">
        <KAISection isVisible={true} />
      </section>
    </div>
  );
}