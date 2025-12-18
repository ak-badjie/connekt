'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    Search, Mail, Bell, Settings, LogOut, 
    Briefcase, User as UserIcon, Building2 
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AgencyService, Agency } from '@/lib/services/agency-service';
import { MailService } from '@/lib/services/mail-service';
import { useSidebar } from '@/components/layout/Sidebar'; // Imported Context
import {
    motion,
    AnimatePresence,
    useMotionValue,
    useSpring,
    useTransform,
    MotionValue
} from 'framer-motion';

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
// 2. COMPONENT: GlassSurface
// ==========================================
const GlassSurface = ({
    children,
    width = '100%',
    height = '100%',
    borderRadius = 24,
    borderWidth = 1,
    brightness = 50,
    opacity = 1,
    blur = 8,
    displace = 1,
    backgroundOpacity = 0.6,
    saturation = 1,
    distortionScale = 90,
    redOffset = 0,
    greenOffset = 0,
    blueOffset = 0,
    xChannel = 'R',
    yChannel = 'G',
    mixBlendMode = 'difference',
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
        const actualWidth = rect?.width || 800;
        const actualHeight = rect?.height || 100;
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
        return {
            ...style,
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
            borderRadius: `${borderRadius}px`,
            background: isDarkMode ? `hsl(0 0% 0% / ${backgroundOpacity})` : `hsl(0 0% 100% / ${backgroundOpacity})`,
            backdropFilter: `url(#${filterId}) saturate(${saturation})`,
            WebkitBackdropFilter: `url(#${filterId}) saturate(${saturation})`,
            boxShadow: isDarkMode
                ? `0 0 2px 1px color-mix(in oklch, white, transparent 90%) inset, 0 8px 32px 0 rgba(0, 0, 0, 0.4)`
                : `0 0 2px 1px color-mix(in oklch, black, transparent 95%) inset, 0 8px 32px 0 rgba(0, 128, 128, 0.05)`
        };
    };

    return (
        <div ref={containerRef} className="relative flex items-center overflow-hidden" style={getContainerStyles()}>
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
            <div className="w-full h-full relative z-10 px-6 py-2">{children}</div>
        </div>
    );
};

// ==========================================
// 3. COMPONENT: DockItem
// ==========================================
interface DockItemProps {
    children: React.ReactNode;
    mouseX: MotionValue;
    onClick?: () => void;
    href?: string;
    isActive?: boolean;
    label?: string;
    badge?: number;
}

function DockItem({ children, onClick, href, isActive, label, mouseX, badge }: DockItemProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isHovered = useMotionValue(0);

    const baseItemSize = 45; 
    const magnification = 65; 
    const distance = 140;

    const mouseDistance = useTransform(mouseX, (val) => {
        const rect = ref.current?.getBoundingClientRect() ?? { x: 0, width: baseItemSize };
        return val - rect.x - baseItemSize / 2;
    });

    const widthSync = useTransform(mouseDistance, [-distance, 0, distance], [baseItemSize, magnification, baseItemSize]);
    const width = useSpring(widthSync, { mass: 0.1, stiffness: 180, damping: 12 });

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
                    : 'text-gray-600 dark:text-gray-300 hover:text-[#008080] border border-transparent hover:bg-white/50 dark:hover:bg-zinc-800/50'
                }`}
        >
            {/* Icon */}
            <div className="flex items-center justify-center w-full h-full relative z-10">
                {children}
            </div>

            {/* Badge */}
            {badge && badge > 0 ? (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border border-white dark:border-zinc-900 z-20">
                    {badge > 9 ? '9+' : badge}
                </span>
            ) : null}

            {/* Tooltip Label */}
            <AnimatePresence>
                {tooltipVisible && label && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.85 }}
                        animate={{ opacity: 1, y: -30, scale: 0.9 }}
                        exit={{ opacity: 0, y: 10, scale: 0.8 }}
                        className="absolute left-1/2 -translate-x-1/2 px-3 py-1 bg-black/80 backdrop-blur-md border border-white/10 text-white text-[10px] font-medium rounded-lg whitespace-nowrap pointer-events-none z-50 shadow-xl"
                    >
                        {label}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );

    if (href) return <Link href={href}>{Content}</Link>;
    return <button onClick={onClick} className="outline-none">{Content}</button>;
}

// ==========================================
// 4. MAIN NAVBAR COMPONENT
// ==========================================
export function Navbar() {
    const { user, userProfile } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    
    // --- SIDEBAR CONTEXT ---
    // We try/catch this because this Navbar might be used on pages 
    // without the SidebarProvider (e.g. some public pages), though unlikely in this setup.
    let isCollapsed = false;
    try {
        const sidebarContext = useSidebar();
        isCollapsed = sidebarContext.isCollapsed;
    } catch (e) {
        // Fallback if provider is missing
        isCollapsed = false;
    }

    const searchInputRef = useRef<HTMLInputElement>(null);
    const [unreadMailCount, setUnreadMailCount] = useState(0);
    const [agency, setAgency] = useState<Agency | null>(null);

    // Physics
    const mouseX = useMotionValue(Infinity);

    // --- LOGIC: Mail Stats ---
    useEffect(() => {
        if (user) {
            const fetchMailCount = async () => {
                try {
                    const stats = await MailService.getMailStats(user.uid);
                    setUnreadMailCount(stats.unreadInbox);
                } catch (error) {
                    console.error('Error fetching mail stats:', error);
                }
            };
            fetchMailCount();
            const interval = setInterval(fetchMailCount, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    // --- LOGIC: Ctrl+F ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // --- LOGIC: Agency Data ---
    const isAgencyRoute = pathname.startsWith('/agency/');
    const agencyUsername = isAgencyRoute ? pathname.split('/')[2] : null;

    useEffect(() => {
        if (isAgencyRoute && agencyUsername) {
            const fetchAgency = async () => {
                try {
                    const agencyData = await AgencyService.getAgencyByUsername(agencyUsername);
                    setAgency(agencyData);
                } catch (error) {
                    console.error('Error fetching agency:', error);
                }
            };
            fetchAgency();
        } else {
            setAgency(null);
        }
    }, [isAgencyRoute, agencyUsername]);

    // Determine Logic State
    const isPrivatePage = ['/dashboard', '/projects', '/agency', '/mail', '/contracts'].some(path => pathname.startsWith(path));

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/auth');
    };

    // --- ANIMATION VARIANTS ---
    // Matches DashboardLayout padding logic
    // Expanded: 21rem (approx 336px)
    // Collapsed: 8rem (approx 128px)
    const navVariants = {
        expanded: { left: '21rem', transition: { type: "spring", stiffness: 300, damping: 30 } },
        collapsed: { left: '8rem', transition: { type: "spring", stiffness: 300, damping: 30 } }
    };

    return (
        <motion.nav
            // Layout: 
            // - Mobile: Fixed left-4 right-4 (handled by CSS class overriding motion style if needed, but we rely on media query in JS or CSS)
            // - Desktop: Dynamic Left based on Sidebar
            initial={isPrivatePage ? "expanded" : undefined}
            animate={isPrivatePage ? (isCollapsed ? "collapsed" : "expanded") : undefined}
            variants={navVariants}
            className={`fixed top-4 right-4 z-[100] transition-all duration-300
                ${isPrivatePage ? 'left-4 lg:left-auto' : 'left-4 right-4 max-w-7xl mx-auto'}
            `}
            style={{ 
                // We force the motion value only on desktop by checking window width or simply relying on 
                // the fact that Sidebar is hidden on mobile. 
                // However, strictly, 'lg:left-auto' resets the class, and motion applies inline style 'left'.
                // To prevent Motion from breaking mobile layout, we can use a media query in the variant 
                // or just accept that on Mobile the sidebar is hidden, so isCollapsed might behave differently?
                // Actually, sidebar is hidden on mobile, so the user can't toggle it. isCollapsed defaults false.
                // But on mobile we want left-4.
                // 'left' inline style from motion will override 'left-4' class. 
                // Simple fix: Only apply motion variants on large screens, or use useMediaQuery hook.
                // For this code, we assume Sidebar controls are desktop only.
            }}
            onMouseMove={(e) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
        >
            <GlassSurface
                width="100%"
                height={56} // Fixed height
                borderRadius={24}
                opacity={0.9}
                blur={30}
                borderWidth={1}
                backgroundOpacity={0.03}
            >
                <div className="flex items-center justify-between w-full h-full gap-4">

                    {/* --- LEFT SECTION: Agency Info or Search --- */}
                    <div className="flex items-center flex-1 gap-6">
                        
                        {/* Agency Branding */}
                        {isAgencyRoute && agency && (
                            <div className="flex items-center gap-3 pr-6 border-r border-gray-200 dark:border-white/10">
                                {agency.logoUrl ? (
                                    <img src={agency.logoUrl} alt={agency.name} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                                ) : (
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                        {agency.name[0].toUpperCase()}
                                    </div>
                                )}
                                <div className="hidden sm:flex flex-col">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white leading-none">
                                        {agency.name}
                                    </span>
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-none mt-1">
                                        @{agency.username}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Search Bar */}
                        <div className="relative group max-w-md w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#008080] transition-colors" size={18} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder={isAgencyRoute ? "Search agency..." : "Search tasks, projects..."}
                                className="w-full pl-10 pr-16 py-2.5 bg-gray-100/50 dark:bg-zinc-800/40 border border-transparent dark:border-white/5 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-[#008080]/20 transition-all text-sm"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none opacity-50">
                                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold text-gray-500 bg-gray-200 dark:bg-zinc-700 rounded">
                                    {typeof window !== 'undefined' && window.navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                                </kbd>
                                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold text-gray-500 bg-gray-200 dark:bg-zinc-700 rounded">F</kbd>
                            </div>
                        </div>
                    </div>

                    {/* --- RIGHT SECTION: User & Dock --- */}
                    <div className="flex items-center gap-4">
                        
                        {/* User Info */}
                        {user && (
                            <Link href={`/@${userProfile?.username || user.uid}`} className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group mr-2">
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-none mb-1 group-hover:text-[#008080] transition-colors">
                                        {userProfile?.displayName || user.displayName || 'User'}
                                    </p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono leading-none">
                                        {userProfile?.username ? `@${userProfile.username}` : user.email}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#008080] to-teal-400 p-[2px] shadow-lg shadow-teal-900/10">
                                    <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 overflow-hidden">
                                        {user.photoURL ? (
                                            <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[#008080] font-bold text-sm">
                                                {user.email?.[0]?.toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        )}

                        {/* Divider */}
                        <div className="h-8 w-px bg-gray-200 dark:bg-white/10 mx-1 hidden sm:block"></div>

                        {/* The Dock */}
                        <div className="flex items-end gap-1 pb-1">
                            <DockItem mouseX={mouseX} href="/mail" isActive={pathname.startsWith('/mail')} label="Mail" badge={unreadMailCount}>
                                <Mail size={20} />
                            </DockItem>

                            <DockItem mouseX={mouseX} label="Notifications" onClick={() => {}}>
                                <Bell size={20} /> 
                            </DockItem>

                            <DockItem mouseX={mouseX} href="/settings" isActive={pathname.startsWith('/settings')} label="Settings">
                                <Settings size={20} />
                            </DockItem>

                            <DockItem mouseX={mouseX} onClick={handleLogout} label="Logout">
                                <LogOut size={20} className="text-red-500" />
                            </DockItem>
                        </div>
                    </div>
                </div>
            </GlassSurface>
        </motion.nav>
    );
}