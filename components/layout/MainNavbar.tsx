'use client';

import React, { useState, useEffect, useRef, useId, useMemo, Children, cloneElement } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Search, LogOut, Settings, LayoutDashboard, ChevronDown,
  Compass, Briefcase, Bot, Building2, X, Home
} from 'lucide-react';
// Assuming you have these or replace them with simple placeholders
import { useAuth } from '@/context/AuthContext'; 
import { AuthService } from '@/lib/services/auth-service'; 
import ConnektIcon from '@/components/branding/ConnektIcon'; 

import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  MotionValue
} from 'framer-motion';

// GSAP Imports for SplitText
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText as GSAPSplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

// Register GSAP Plugins (Client-side only check)
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, GSAPSplitText, useGSAP);
}

// ==========================================
// 1. UTILITY: Dark Mode Hook
// ==========================================
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isDark;
};

// ==========================================
// 2. COMPONENT: GlassSurface (Unchanged)
// ==========================================
const GlassSurface = ({
  children,
  width = '100%',
  height = '100%',
  borderRadius = 20,
  borderWidth = 0.07,
  brightness = 50,
  opacity = 0.93,
  blur = 11,
  displace = 0,
  backgroundOpacity = 0,
  saturation = 1,
  distortionScale = -180,
  redOffset = 0,
  greenOffset = 10,
  blueOffset = 20,
  xChannel = 'R',
  yChannel = 'G',
  mixBlendMode = 'difference',
  className = '',
  style = {}
}: any) => {
  const uniqueId = useId().replace(/:/g, '-');
  const filterId = `glass-filter-${uniqueId}`;
  const redGradId = `red-grad-${uniqueId}`;
  const blueGradId = `blue-grad-${uniqueId}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const feImageRef = useRef<SVGFEImageElement>(null);
  const redChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const greenChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const blueChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const gaussianBlurRef = useRef<SVGFEGaussianBlurElement>(null);

  const isDarkMode = useDarkMode();

  const generateDisplacementMap = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    const actualWidth = rect?.width || 400;
    const actualHeight = rect?.height || 200;
    const edgeSize = Math.min(actualWidth, actualHeight) * (borderWidth * 0.5);

    const svgContent = `
      <svg viewBox="0 0 ${actualWidth} ${actualHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" fill="black"></rect>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${redGradId})" />
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode: ${mixBlendMode}" />
        <rect x="${edgeSize}" y="${edgeSize}" width="${actualWidth - edgeSize * 2}" height="${actualHeight - edgeSize * 2}" rx="${borderRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" style="filter:blur(${blur}px)" />
      </svg>
    `;
    return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
  };

  const updateDisplacementMap = () => {
    if (feImageRef.current) {
      feImageRef.current.setAttribute('href', generateDisplacementMap());
    }
  };

  useEffect(() => {
    updateDisplacementMap();
    [
      { ref: redChannelRef, offset: redOffset },
      { ref: greenChannelRef, offset: greenOffset },
      { ref: blueChannelRef, offset: blueOffset }
    ].forEach(({ ref, offset }) => {
      if (ref.current) {
        ref.current.setAttribute('scale', (distortionScale + offset).toString());
        ref.current.setAttribute('xChannelSelector', xChannel);
        ref.current.setAttribute('yChannelSelector', yChannel);
      }
    });
    gaussianBlurRef.current?.setAttribute('stdDeviation', displace.toString());
  }, [width, height, borderRadius, borderWidth, brightness, opacity, blur, displace, distortionScale, redOffset, greenOffset, blueOffset, xChannel, yChannel, mixBlendMode]);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(() => setTimeout(updateDisplacementMap, 0));
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const getContainerStyles = () => {
    const baseStyles = {
      ...style,
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      borderRadius: `${borderRadius}px`,
      '--glass-frost': backgroundOpacity,
      '--glass-saturation': saturation
    };

    return {
      ...baseStyles,
      background: isDarkMode ? `hsl(0 0% 0% / ${backgroundOpacity})` : `hsl(0 0% 100% / ${backgroundOpacity})`,
      backdropFilter: `url(#${filterId}) saturate(${saturation})`,
      WebkitBackdropFilter: `url(#${filterId}) saturate(${saturation})`,
      boxShadow: isDarkMode
        ? `0 0 2px 1px color-mix(in oklch, white, transparent 65%) inset, 0 8px 32px 0 rgba(0, 128, 128, 0.1)`
        : `0 0 2px 1px color-mix(in oklch, black, transparent 85%) inset, 0 8px 32px 0 rgba(0, 128, 128, 0.15)`
    };
  };

  return (
    <div ref={containerRef} className={`relative flex items-center justify-center overflow-hidden ${className}`} style={getContainerStyles()}>
      <svg className="w-full h-full pointer-events-none absolute inset-0 opacity-0 -z-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
            <feImage ref={feImageRef} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
            <feDisplacementMap ref={redChannelRef} in="SourceGraphic" in2="map" id="redchannel" result="dispRed" />
            <feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="red" />
            <feDisplacementMap ref={greenChannelRef} in="SourceGraphic" in2="map" id="greenchannel" result="dispGreen" />
            <feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="green" />
            <feDisplacementMap ref={blueChannelRef} in="SourceGraphic" in2="map" id="bluechannel" result="dispBlue" />
            <feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="blue" />
            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="output" />
            <feGaussianBlur ref={gaussianBlurRef} in="output" stdDeviation="0.7" />
          </filter>
        </defs>
      </svg>
      <div className="w-full h-full relative z-10">{children}</div>
    </div>
  );
};

// ==========================================
// 3. COMPONENT: SplitText (GSAP Animation)
// ==========================================
const SplitText = ({
  text,
  className = '',
  delay = 100,
  duration = 0.6,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 20 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  textAlign = 'center',
  tag = 'p',
}: any) => {
  const ref = useRef<HTMLDivElement>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    if (document.fonts.status === 'loaded') {
      setFontsLoaded(true);
    } else {
      document.fonts.ready.then(() => setFontsLoaded(true));
    }
  }, []);

  useGSAP(() => {
    if (!ref.current || !text || !fontsLoaded) return;
    const el = ref.current;

    // @ts-ignore
    if (el._rbsplitInstance) {
      // @ts-ignore
      try { el._rbsplitInstance.revert(); } catch (_) { }
      // @ts-ignore
      el._rbsplitInstance = null;
    }

    const splitInstance = new GSAPSplitText(el, {
      type: splitType,
      linesClass: 'split-line',
      wordsClass: 'split-word',
      charsClass: 'split-char',
      reduceWhiteSpace: false,
    });

    const targets = splitType.includes('chars') ? splitInstance.chars : splitInstance.words;

    gsap.fromTo(targets,
      { ...from },
      {
        ...to,
        duration,
        ease,
        stagger: delay / 1000,
        scrollTrigger: {
          trigger: el,
          start: 'top 100%',
          once: true,
        },
        willChange: 'transform, opacity',
      }
    );
    // @ts-ignore
    el._rbsplitInstance = splitInstance;

    return () => {
      // @ts-ignore
      if (el._rbsplitInstance) el._rbsplitInstance.revert();
    };
  },
    { dependencies: [text, fontsLoaded], scope: ref }
  );

  return React.createElement(tag, { ref, className: `inline-block ${className}`, style: { textAlign } }, text);
};

// ==========================================
// 4. COMPONENT: DockItem (Physics & Logic)
// ==========================================
interface DockItemProps {
  children: React.ReactNode;
  mouseX: MotionValue;
  onClick?: () => void;
  href?: string;
  isActive?: boolean;
  label?: string;
}

function DockItem({ children, onClick, href, isActive, label, mouseX }: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isHovered = useMotionValue(0);

  // --- PHYSICS CONFIGURATION ---
  const baseItemSize = 45; // Base size of icon container
  const magnification = 80; // How big it gets when hovered
  const distance = 150; // The reach of the mouse influence
  
  // Calculate distance from mouse to center of this icon
  const mouseDistance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect() ?? { x: 0, width: baseItemSize };
    return val - rect.x - baseItemSize / 2;
  });

  // Transform distance into size (Swell effect)
  const widthSync = useTransform(mouseDistance, [-distance, 0, distance], [baseItemSize, magnification, baseItemSize]);
  
  // Add elasticity (The rubber effect)
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 180, damping: 12 });
  
  // Optional: Make it rise slightly when expanding
  // const ySync = useTransform(width, [baseItemSize, magnification], [0, -5]);
  
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const Content = (
    <motion.div
      ref={ref}
      style={{ width, height: width }}
      onHoverStart={() => {
        isHovered.set(1);
        setTooltipVisible(true);
      }}
      onHoverEnd={() => {
        isHovered.set(0);
        setTooltipVisible(false);
      }}
      className={`relative flex items-center justify-center rounded-full transition-colors duration-200 
        ${isActive 
          ? 'bg-[#008080]/10 text-[#008080] border border-[#008080]/20' 
          : 'text-gray-600 dark:text-gray-300 hover:text-[#008080] border border-transparent'
        }`}
    >
      {/* Icon */}
      <div className="flex items-center justify-center w-full h-full relative z-10">
        {children}
      </div>

      {/* Tooltip Label */}
      <AnimatePresence>
        {tooltipVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.85 }}
            animate={{ opacity: 1, y: -22, scale: .8 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            className="absolute left-2.1 -translate-x-1/2 px-3 py-1 bg-black/80 backdrop-blur-md border border-white/10 text-white text-[10px] font-medium rounded-lg whitespace-nowrap pointer-events-none z-50 shadow-xl"
          >
            {label}
            {/* Tiny arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/80" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Dot */}
      {isActive && (
        <motion.div 
          layoutId="nav-dot" 
          className="absolute -bottom-2 w-1 h-1 rounded-full bg-[#008080]" 
        />
      )}
    </motion.div>
  );

  if (href) return <Link href={href}>{Content}</Link>;
  return <button onClick={onClick} className="outline-none">{Content}</button>;
}

// ==========================================
// 5. MAIN NAVBAR COMPONENT
// ==========================================
export default function MainNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth(); // Assuming Context Exists
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Shared MotionValue for the Dock Physics
  const mouseX = useMotionValue(Infinity);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hiding logic
  const hidePrefixes = ['/auth', '/admin/auth', '/onboarding', '/intro'];
  const shouldHide = hidePrefixes.some(route => pathname?.startsWith(route)) ||
    pathname?.includes('dashboard') ||
    pathname?.includes('mail');

  if (shouldHide) return null;

  // Determining "Explore" mode -> Triggers expansion
  const isExplore = pathname?.startsWith('/explore');

  const handleLogout = async () => {
    await AuthService.logout();
    router.push('/');
    setDropdownOpen(false);
  };

  return (
    <div className="fixed top-8 left-0 right-0 z-50 flex justify-center items-start pointer-events-none px-4">
      
      {/* 
        THE LIQUID ISLAND
        The `layout` prop makes this container morph elastically when content changes.
        The style `width` changes drastically between modes.
      */}
      <motion.nav
        layout
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
          mass: 0.8 // Lightweight feel for snappier bounce
        }}
        className="pointer-events-auto relative rounded-[50px] shadow-2xl shadow-[#008080]/10 flex items-center"
        style={{
          height: '70px', // Fixed height for consistency
          // This width constraint forces the physical expansion
          width: isExplore ? '850px' : 'fit-content',
          minWidth: '500px'
        }}
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
      >
        
        {/* Background Glass Surface - Stretches with parent */}
        <div className="absolute inset-0 rounded-[50px] overflow-hidden z-0">
          <GlassSurface
            width="100%"
            height="100%"
            borderRadius={50}
            opacity={0.85}
            blur={16}
            borderWidth={0.5}
            backgroundOpacity={0.05}
          />
        </div>

        {/* Navbar Content Wrapper */}
        <div className="relative z-20 flex items-center justify-between w-full h-full px-6">

          {/* LEFT: Logo */}
          <Link href="/" className="flex items-center gap-3 pr-6 border-r border-gray-400/20 mr-2 flex-shrink-0">
            <ConnektIcon className="w-8 h-8 text-[#008080]" />
            <div className="hidden md:block font-bold font-headline text-[#008080] tracking-widest text-lg">
              <SplitText text="CONNEKT" delay={200} />
            </div>
          </Link>

          {/* CENTER: Morphing Area (Dock <-> Search) */}
          <div className="flex-1 flex justify-center items-center px-2 overflow-hidden h-full">
            <AnimatePresence mode="popLayout">
              {isExplore ? (
                // STATE B: SEARCH BAR (Wide)
                <motion.div
                  key="search-bar"
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20, filter: "blur(10px)" }}
                  transition={{ duration: 0.4, ease: "circOut" }}
                  className="w-full flex items-center gap-2"
                >
                  <div className="relative w-full group">
                    <input
                      autoFocus
                      placeholder="Search jobs, projects, or agents..."
                      className="w-full bg-gray-100/50 dark:bg-zinc-800/50 border border-gray-200/50 dark:border-zinc-700/50 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]/50 transition-all"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#008080]" size={16} />
                  </div>
                  
                  <button
                    onClick={() => router.push('/')}
                    className="p-2 rounded-full hover:bg-gray-200/50 dark:hover:bg-zinc-700/50 transition-colors"
                  >
                    <X size={18} className="text-gray-500" />
                  </button>
                </motion.div>
              ) : (
                // STATE A: DOCK (Compact)
                <motion.div
                  key="dock-menu"
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20, filter: "blur(10px)" }}
                  transition={{ duration: 0.3 }}
                  className="flex items-end gap-2 pb-1" // align items-end for "rising" effect if needed
                >
                  <DockItem mouseX={mouseX} href="/" isActive={pathname === '/'} label="Home">
                    <Home size={20} />
                  </DockItem>
                  <DockItem mouseX={mouseX} href="/explore" isActive={pathname === '/explore'} label="Explore">
                    <Compass size={20} />
                  </DockItem>
                  <DockItem mouseX={mouseX} href="/marketplace" isActive={pathname === '/marketplace'} label="Marketplace">
                    <Briefcase size={20} />
                  </DockItem>
                  <DockItem mouseX={mouseX} href="/agency" isActive={pathname === '/agency'} label="Agencies">
                    <Building2 size={20} />
                  </DockItem>
                  <DockItem mouseX={mouseX} href="/intro/ai" isActive={pathname?.includes('/ai')} label="AI Agents">
                    <Bot size={20} />
                  </DockItem>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT: Profile Actions */}
          <div className="flex items-center pl-6 border-l border-gray-400/20 ml-2 flex-shrink-0">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 outline-none group"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#008080] to-teal-500 text-white flex items-center justify-center font-bold shadow-lg shadow-teal-500/30 ring-2 ring-white/30 group-hover:scale-105 transition-transform">
                    {user.email?.[0].toUpperCase()}
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-gray-500 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-14 w-64 rounded-2xl overflow-hidden shadow-2xl z-50"
                    >
                      <div className="absolute inset-0">
                        <GlassSurface width="100%" height="100%" borderRadius={16} blur={20} opacity={0.95} />
                      </div>

                      <div className="relative z-10 p-2">
                        <div className="px-4 py-3 border-b border-gray-200/10 mb-2">
                          <p className="font-bold text-gray-900 dark:text-white truncate">{user.displayName || 'User'}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>

                        <button onClick={() => router.push('/dashboard')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-[#008080]/10 hover:text-[#008080] transition-colors">
                          <LayoutDashboard size={16} /> Dashboard
                        </button>
                        <button onClick={() => router.push('/settings')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-[#008080]/10 hover:text-[#008080] transition-colors">
                          <Settings size={16} /> Settings
                        </button>

                        <div className="h-px bg-gray-200/10 my-2" />

                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors">
                          <LogOut size={16} /> Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/auth">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2 bg-[#008080] hover:bg-teal-700 text-white rounded-full text-sm font-bold shadow-lg shadow-teal-500/25 transition-colors"
                >
                  Sign In
                </motion.button>
              </Link>
            )}
          </div>

        </div>
      </motion.nav>
    </div>
  );
}