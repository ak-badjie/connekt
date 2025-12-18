'use client';

import React, { useState, useEffect, useRef, useId, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutGrid, Briefcase, FolderKanban, CheckSquare, BarChart2, 
  Users, Settings, HelpCircle, LogOut, HardDrive, User as UserIcon, 
  Wallet, Calendar, Crown, ChevronRight, Search 
} from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence, useAnimation } from 'framer-motion';

// --- Services & Context Imports (Preserved from your project) ---
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Agency } from '@/lib/services/agency-service';
import { StorageQuotaService, StorageQuota } from '@/lib/services/storage-quota-service';
import ConnektIcon from '@/components/branding/ConnektIcon';
import UpgradeModal from '@/components/subscription/UpgradeModal';

// ==========================================
// 1. UTILITY: GlassSurface (The Liquid Effect)
// ==========================================
// Matches the style of your MainNavbar exactly
const GlassSurface = ({
  width = '100%', height = '100%', borderRadius = 24, borderWidth = 1,
  brightness = 1.1, opacity = 1, blur = 12, className = ''
}: any) => {
  const uniqueId = useId().replace(/:/g, '-');
  const filterId = `glass-filter-${uniqueId}`;

  // Check for dark mode to adjust glass tint
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mq.matches);
    const handler = (e: any) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`} style={{ borderRadius }}>
      {/* SVG Filter Definition */}
      <svg className="absolute w-0 h-0" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* The Glass Layer */}
      <div 
        className="absolute inset-0 z-0 transition-colors duration-500"
        style={{
          background: isDark 
            ? `linear-gradient(135deg, rgba(20,20,20,${0.6 * opacity}), rgba(0,0,0,${0.8 * opacity}))`
            : `linear-gradient(135deg, rgba(255,255,255,${0.6 * opacity}), rgba(240,240,240,${0.4 * opacity}))`,
          backdropFilter: `blur(${blur}px)`,
          WebkitBackdropFilter: `blur(${blur}px)`,
          borderRadius,
          border: `${borderWidth}px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)'}`,
          boxShadow: isDark 
            ? '0 20px 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)' 
            : '0 20px 50px rgba(0,128,128,0.1), inset 0 0 0 1px rgba(255,255,255,0.6)'
        }}
      />
      
      {/* Iridescent Sheen */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
           style={{
             background: 'linear-gradient(45deg, transparent 40%, rgba(0,128,128,0.2) 50%, transparent 60%)',
             borderRadius
           }}
      />
    </div>
  );
};

// ==========================================
// 2. COMPONENT: VerticalDockItem
// ==========================================
// Handles the "Physics" magnification on the Y-axis
interface DockItemProps {
  icon: any;
  label: string;
  href: string;
  isActive: boolean;
  mouseY: any; // MotionValue
  isChild?: boolean;
  isLastChild?: boolean; // For tree lines
  hasChildren?: boolean; // For tree lines
}

function VerticalDockItem({ icon: Icon, label, href, isActive, mouseY, isChild, isLastChild, hasChildren }: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const distance = 100; // Distance of influence
  
  // Calculate distance from mouse to center of this item (vertical)
  const y = useTransform(mouseY, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { y: 0, height: 0 };
    return val - bounds.y - bounds.height / 2;
  });

  // Scale transform based on distance
  const scaleSync = useTransform(y, [-distance, 0, distance], [1, 1.35, 1]);
  const scale = useSpring(scaleSync, { mass: 0.1, stiffness: 150, damping: 12 });
  
  // Color shifting
  const activeColor = "rgba(0, 128, 128, 1)";
  const inactiveColor = "rgba(107, 114, 128, 1)"; // gray-500
  
  return (
    <Link href={href} className="relative group w-full block outline-none">
       {/* --- VISUAL TREE LINES (Connecting Parent to Children) --- */}
       {isChild && (
        <div className="absolute left-[22px] top-[-24px] w-[16px] h-[calc(100%+8px)] -z-10 pointer-events-none">
          {/* Vertical Line Segment */}
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-gray-300/50 via-gray-300/30 to-transparent dark:from-white/20 dark:via-white/10"
               style={{ height: isLastChild ? '50%' : '100%' }} // Stop halfway for last child
          />
          {/* Horizontal Connector */}
          <div className="absolute left-0 top-1/2 w-[12px] h-[2px] bg-gray-300/50 dark:bg-white/10" />
        </div>
      )}

      {/* --- THE ITEM --- */}
      <div ref={ref} className={`relative flex items-center ${isChild ? 'pl-10 pr-2 py-1.5' : 'px-3 py-2.5'} transition-all duration-300`}>
        
        {/* Background Hover Pill */}
        {isActive && (
          <motion.div
            layoutId="activePill"
            className="absolute inset-0 bg-[#008080]/10 border border-[#008080]/20 rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}

        {/* The Animated Icon Container */}
        <motion.div 
          style={{ scale }}
          className={`relative z-10 p-2 rounded-xl transition-colors duration-200 ${
            isActive ? 'bg-[#008080] text-white shadow-lg shadow-teal-500/30' : 'text-gray-500 group-hover:text-[#008080] group-hover:bg-white/50 dark:group-hover:bg-white/10'
          }`}
        >
          <Icon size={isChild ? 16 : 20} strokeWidth={isActive ? 2.5 : 2} />
        </motion.div>

        {/* Label */}
        <div className="ml-3 flex-1">
          <span className={`text-sm font-medium transition-colors ${isActive ? 'text-[#008080] font-bold' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-white'}`}>
            {label}
          </span>
        </div>

        {/* Active Dot indicator */}
        {isActive && (
          <motion.div 
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="w-1.5 h-1.5 rounded-full bg-[#008080] shadow-[0_0_8px_rgba(0,128,128,0.8)]"
          />
        )}
      </div>
    </Link>
  );
}

// ==========================================
// 3. COMPONENT: Storage Glass Widget
// ==========================================
const StorageWidget = ({ quota }: { quota: StorageQuota | null }) => {
  if (!quota) return null;
  const percent = Math.min((quota.usedSpace / quota.totalQuota) * 100, 100);
  const usedGB = (quota.usedSpace / (1024 * 1024 * 1024)).toFixed(2);
  
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/20 p-4 group cursor-default">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <HardDrive size={14} />
          <span className="text-xs font-bold uppercase tracking-wider">Storage</span>
        </div>
        <span className="text-xs font-bold text-[#008080]">{Math.round(percent)}%</span>
      </div>
      
      {/* Progress Bar */}
      <div className="relative h-2 w-full bg-gray-200/50 dark:bg-black/40 rounded-full overflow-hidden mb-2">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1.5, ease: "circOut" }}
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#008080] to-teal-400 rounded-full shadow-[0_0_10px_rgba(20,184,166,0.5)]"
        />
      </div>
      
      <p className="text-[10px] text-gray-400 text-right">
        <span className="text-gray-700 dark:text-gray-200 font-bold">{usedGB} GB</span> used
      </p>

      {/* Decorative Glow */}
      <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-[#008080]/20 rounded-full blur-xl group-hover:bg-[#008080]/30 transition-all duration-500" />
    </div>
  );
};

// ==========================================
// 4. MAIN COMPONENT: Sidebar
// ==========================================
interface SidebarProps {
    agency?: Agency | null;
}

export function Sidebar({ agency = null }: SidebarProps) {
    const pathname = usePathname();
    const { user, userProfile } = useAuth();
    const [storageQuota, setStorageQuota] = useState<StorageQuota | null>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    
    // Physics State
    const mouseY = useMotionValue(Infinity);
    const containerRef = useRef<HTMLDivElement>(null);

    // --- Data Loading ---
    useEffect(() => {
        const loadData = async () => {
            if (!userProfile?.username || !user) return;
            try {
                if (agency) {
                    const agencyQuota = await StorageQuotaService.getAgencyStorageQuota(agency.id!);
                    if (agencyQuota) setStorageQuota({ userId: user?.uid || '', mailAddress: `@${agency.username}.com`, ...agencyQuota });
                } else {
                    const personalMail = `${userProfile.username}@connekt.com`;
                    const quota = await StorageQuotaService.getStorageQuota(personalMail);
                    setStorageQuota(quota);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };
        loadData();
    }, [user, userProfile, agency]);

    // --- Menu Configuration ---
    // Defined inside component to access dynamic routes
    const getMenuItems = () => {
        const baseHref = agency ? `/agency/${agency.username}/dashboard` : '/dashboard';
        
        // Structure: Main items, with optional 'children' array
        const items = agency ? [
            { 
                id: 'teams', label: 'Teams', icon: LayoutGrid, href: baseHref,
                children: [
                    { id: 'workspaces', label: 'Workspaces', icon: FolderKanban, href: `${baseHref}/workspaces` },
                    { id: 'projects', label: 'Projects', icon: Briefcase, href: `${baseHref}/projects` },
                    { id: 'tasks', label: 'Tasks', icon: CheckSquare, href: `${baseHref}/tasks` },
                    { id: 'members', label: 'Members', icon: Users, href: `${baseHref}/teams` },
                    { id: 'calendar', label: 'Calendar', icon: Calendar, href: `${baseHref}/calendar` },
                ]
            },
            { id: 'wallet', label: 'Wallet', icon: Wallet, href: `${baseHref}/wallet` },
            { id: 'storage', label: 'Storage', icon: HardDrive, href: `${baseHref}/storage` },
            { id: 'profile', label: 'Profile', icon: UserIcon, href: `/agency/@${agency.username}` },
        ] : [
            { 
                id: 'teams', label: 'Teams', icon: LayoutGrid, href: '/dashboard',
                children: [
                    { id: 'workspaces', label: 'Workspaces', icon: FolderKanban, href: '/dashboard/workspaces' },
                    { id: 'projects', label: 'Projects', icon: Briefcase, href: '/dashboard/projects' },
                    { id: 'tasks', label: 'Tasks', icon: CheckSquare, href: '/dashboard/tasks' },
                    { id: 'members', label: 'Members', icon: Users, href: '/dashboard/teams' },
                    { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/dashboard/calendar' },
                ]
            },
            { id: 'analytics', label: 'Analytics', icon: BarChart2, href: '/analytics' },
            { id: 'wallet', label: 'Wallet', icon: Wallet, href: '/dashboard/wallet' },
            { id: 'storage', label: 'Storage', icon: HardDrive, href: '/dashboard/storage' },
            { id: 'profile', label: 'Profile', icon: UserIcon, href: userProfile?.username ? `/@${userProfile.username}` : '#' },
        ];
        return items;
    };

    const items = getMenuItems();

    return (
        <>
            <aside 
                className="fixed left-6 top-6 bottom-6 w-72 z-[110] hidden lg:flex flex-col"
                onMouseMove={(e) => mouseY.set(e.clientY)}
                onMouseLeave={() => mouseY.set(Infinity)}
                ref={containerRef}
            >
                {/* 1. The Glass Background Container */}
                <GlassSurface 
                    opacity={0.85} 
                    blur={20} 
                    borderRadius={32}
                    className="shadow-2xl shadow-black/10"
                />

                {/* 2. Content Wrapper */}
                <div className="relative z-10 flex flex-col h-full px-5 py-6 overflow-hidden">
                    
                    {/* Header: Logo */}
                    <div className="mb-8 px-2">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#008080] blur-lg opacity-20 group-hover:opacity-40 transition-opacity rounded-full"/>
                                <ConnektIcon className="w-10 h-10 text-[#008080] relative z-10" />
                            </div>
                            <span className="text-xl font-bold font-headline text-[#008080] tracking-[0.2em] group-hover:text-teal-600 transition-colors">
                                CONNEKT
                            </span>
                        </Link>
                    </div>

                    {/* Scrollable Navigation Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar -mr-4 pr-4 pb-4 space-y-1">
                        
                        {/* Main Navigation Loop */}
                        <div className="space-y-1">
                            {items.map((item) => {
                                // Logic to determine if Parent is active based on children
                                const isParentActive = pathname === item.href;
                                const isChildActive = item.children?.some(child => pathname.startsWith(child.href));
                                const isOpen = isParentActive || isChildActive;

                                return (
                                    <div key={item.id} className="relative">
                                        {/* Parent Item */}
                                        <VerticalDockItem 
                                            icon={item.icon}
                                            label={item.label}
                                            href={item.href}
                                            isActive={isParentActive} // Only active if exact match or specific logic
                                            mouseY={mouseY}
                                        />

                                        {/* Vertical Connector Line from Parent */}
                                        {item.children && (
                                           <div className={`absolute left-[23px] top-[38px] w-[2px] bg-gray-300/30 dark:bg-white/10 transition-all duration-300 ${isOpen ? 'h-[calc(100%-45px)] opacity-100' : 'h-0 opacity-0'}`} />
                                        )}

                                        {/* Children Items (Rendered if parent group "Teams" is relevant) */}
                                        <AnimatePresence initial={false}>
                                            {(true) && item.children && ( // Always render structure, let visual cues handle focus
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden ml-1"
                                                >
                                                    {item.children.map((child, idx) => (
                                                        <VerticalDockItem
                                                            key={child.id}
                                                            icon={child.icon}
                                                            label={child.label}
                                                            href={child.href}
                                                            isActive={pathname.startsWith(child.href)}
                                                            mouseY={mouseY}
                                                            isChild={true}
                                                            isLastChild={idx === item.children!.length - 1}
                                                        />
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom Actions Area */}
                    <div className="mt-auto space-y-4 pt-6 relative">
                        {/* Divider */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent opacity-50" />

                        {/* Storage Widget */}
                        <StorageWidget quota={storageQuota} />

                        {/* General Links */}
                        <div className="space-y-1">
                            <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-500 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                                <Settings size={18} />
                                <span className="text-sm font-medium">Settings</span>
                            </Link>

                            <button 
                                onClick={() => signOut(auth)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <LogOut size={18} />
                                <span className="text-sm font-medium">Logout</span>
                            </button>
                        </div>

                        {/* Upgrade Button (Animated Gradient) */}
                        <button
                            onClick={() => setShowUpgradeModal(true)}
                            className="relative w-full group overflow-hidden rounded-xl p-[1px]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-teal-400 via-emerald-500 to-teal-600 animate-gradient-x" />
                            <div className="relative bg-white dark:bg-zinc-900 rounded-[11px] px-4 py-3 flex items-center justify-center gap-2 group-hover:bg-opacity-90 transition-all">
                                <Crown size={16} className="text-[#008080] fill-current" />
                                <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
                                    Upgrade to Pro
                                </span>
                            </div>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Upgrade Modal */}
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                onSuccess={() => {}}
            />
        </>
    );
}