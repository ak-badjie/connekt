'use client';

import React, { useState, useEffect, useRef, useId, useMemo, Children, cloneElement } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthService } from '@/lib/services/auth-service';
import Link from 'next/link';
import { 
    Search, LogOut, Settings, LayoutDashboard, ChevronDown, 
    Compass, Briefcase, Bot, Building2, X 
} from 'lucide-react';
import ConnektIcon from '@/components/branding/ConnektIcon';
import { 
    motion, 
    AnimatePresence, 
    useMotionValue, 
    useSpring, 
    useTransform 
} from 'framer-motion';

// GSAP Imports for SplitText
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText as GSAPSplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

// Register GSAP Plugins
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
// 2. COMPONENT: GlassSurface (The Background)
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
    if(feImageRef.current) {
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

    // Fallback logic for simplicity in this merged file, prioritizing the SVG filter
    return {
        ...baseStyles,
        background: isDarkMode ? `hsl(0 0% 0% / ${backgroundOpacity})` : `hsl(0 0% 100% / ${backgroundOpacity})`,
        backdropFilter: `url(#${filterId}) saturate(${saturation})`,
        WebkitBackdropFilter: `url(#${filterId}) saturate(${saturation})`, // Safari fix
        boxShadow: isDarkMode
          ? `0 0 2px 1px color-mix(in oklch, white, transparent 65%) inset, 0 8px 32px 0 rgba(0, 128, 128, 0.1)`
          : `0 0 2px 1px color-mix(in oklch, black, transparent 85%) inset, 0 8px 32px 0 rgba(0, 128, 128, 0.15)` // Modified shadow for Teal theme
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
  rootMargin = '-100px',
  textAlign = 'center',
  tag = 'p',
  onLetterAnimationComplete
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
      
      // Cleanup previous instance if exists
      // @ts-ignore
      if (el._rbsplitInstance) {
        // @ts-ignore
        try { el._rbsplitInstance.revert(); } catch (_) {}
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
function DockItem({ children, onClick, href, isActive, label }: any) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  // Dock Physics
  const baseItemSize = 40;
  const magnification = 55; // Expanded size
  const distance = 140; // Range of effect

  const mouseDistance = useTransform(mouseX, val => {
    const rect = ref.current?.getBoundingClientRect() ?? { x: 0, width: baseItemSize };
    return val - rect.x - baseItemSize / 2;
  });

  const size = useSpring(
    useTransform(mouseDistance, [-distance, 0, distance], [baseItemSize, magnification, baseItemSize]),
    { mass: 0.1, stiffness: 150, damping: 12 }
  );

  const [tooltipVisible, setTooltipVisible] = useState(false);
  useEffect(() => isHovered.on('change', v => setTooltipVisible(v === 1)), [isHovered]);

  const Content = (
    <motion.div
      ref={ref}
      style={{ width: size, height: size }}
      onMouseMove={(e) => { mouseX.set(e.pageX); isHovered.set(1); }}
      onMouseLeave={() => { mouseX.set(Infinity); isHovered.set(0); }}
      className={`
        relative flex items-center justify-center rounded-full transition-colors duration-200
        ${isActive ? 'bg-[#008080]/10 text-[#008080]' : 'text-gray-600 dark:text-gray-300 hover:text-[#008080]'}
      `}
    >
      {/* Icon Wrapper */}
      <div className="flex items-center justify-center w-full h-full">
        {children}
      </div>

      {/* Tooltip Label */}
      <AnimatePresence>
        {tooltipVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: -35 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-[10px] rounded-md whitespace-nowrap pointer-events-none"
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Dot */}
      {isActive && (
        <motion.div layoutId="nav-dot" className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#008080]" />
      )}
    </motion.div>
  );

  if (href) return <Link href={href}>{Content}</Link>;
  return <button onClick={onClick}>{Content}</button>;
}

// ==========================================
// 5. MAIN NAVBAR COMPONENT
// ==========================================
export default function MainNavbar() {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    // Logic for hiding navbar
    const hidePrefixes = ['/auth', '/admin/auth', '/onboarding', '/intro'];
    const shouldHide = hidePrefixes.some(route => pathname?.startsWith(route)) ||
        pathname?.includes('dashboard') ||
        pathname?.includes('mail');

    if (shouldHide) return null;

    const isExplore = pathname?.startsWith('/explore');
    const handleLogout = async () => {
        await AuthService.logout();
        router.push('/');
        setDropdownOpen(false);
    };

    return (
        <div className="fixed top-6 left-0 right-0 z-50 flex justify-center items-start pointer-events-none px-4">
            
            {/* 
                THE LIQUID ISLAND 
                Using `layout` to morph the width seamlessly 
            */}
            <motion.nav
                layout
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="pointer-events-auto relative rounded-[50px] shadow-2xl shadow-[#008080]/10"
                style={{ 
                    // This min-width ensures it doesn't collapse too small during transitions
                    minWidth: isExplore ? "600px" : "500px" 
                }}
            >
                {/* Background Glass Surface */}
                <div className="absolute inset-0 rounded-[50px] overflow-hidden">
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

                {/* Navbar Content */}
                <div className="relative z-20 flex items-center justify-between h-16 px-6">
                    
                    {/* LEFT: Logo */}
                    <Link href="/" className="flex items-center gap-3 pr-6 border-r border-gray-400/20 mr-2">
                        <ConnektIcon className="w-8 h-8 text-[#008080]" />
                        <div className="hidden md:block font-bold font-headline text-[#008080] tracking-widest text-lg">
                            <SplitText text="CONNEKT" delay={200} />
                        </div>
                    </Link>

                    {/* CENTER: Navigation OR Search (Morphing Area) */}
                    <div className="flex-1 flex justify-center items-center px-2">
                        <AnimatePresence mode="popLayout" initial={false}>
                            {isExplore ? (
                                <motion.div 
                                    key="search"
                                    initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                    exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                                    transition={{ duration: 0.4, ease: "circOut" }}
                                    className="w-full max-w-md flex items-center bg-gray-100/50 dark:bg-zinc-800/50 rounded-full px-4 py-2 border border-gray-200/50 dark:border-zinc-700/50"
                                >
                                    <Search size={18} className="text-[#008080] mr-2" />
                                    <input 
                                        autoFocus
                                        placeholder="Search projects, tasks, agents..."
                                        className="bg-transparent border-none outline-none w-full text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
                                    />
                                    <button 
                                        onClick={() => router.push('/')}
                                        className="ml-2 p-1 hover:bg-gray-300/50 rounded-full transition-colors"
                                    >
                                        <X size={14} className="text-gray-500" />
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="menu"
                                    initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                    exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                                    transition={{ duration: 0.4, ease: "circOut" }}
                                    className="flex items-center gap-2"
                                >
                                    <DockItem href="/explore" isActive={pathname === '/explore'} label="Explore">
                                        <Compass size={20} />
                                    </DockItem>
                                    <DockItem href="/marketplace" isActive={pathname === '/marketplace'} label="Jobs">
                                        <Briefcase size={20} />
                                    </DockItem>
                                    <DockItem href="/agency" isActive={pathname === '/agency'} label="Agencies">
                                        <Building2 size={20} />
                                    </DockItem>
                                    <DockItem href="/intro/ai" isActive={pathname?.includes('/ai')} label="AI Agents">
                                        <Bot size={20} />
                                    </DockItem>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* RIGHT: Profile Actions */}
                    <div className="flex items-center pl-6 border-l border-gray-400/20 ml-2">
                        {user ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center gap-2 outline-none"
                                >
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#008080] to-teal-500 text-white flex items-center justify-center font-bold shadow-lg shadow-teal-500/30 ring-2 ring-white/30 hover:scale-105 transition-transform">
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
                                            className="absolute right-0 top-12 w-64 rounded-2xl overflow-hidden shadow-2xl z-50"
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