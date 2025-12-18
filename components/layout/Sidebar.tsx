'use client';

import React, { useState, useEffect, useRef, useId, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutGrid, Briefcase, FolderKanban, CheckSquare, BarChart2, 
  Users, Settings, LogOut, HardDrive, User as UserIcon, 
  Wallet, Calendar, Crown, ChevronLeft 
} from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';

// --- Services & Context Imports ---
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Agency } from '@/lib/services/agency-service';
import { StorageQuotaService, StorageQuota } from '@/lib/services/storage-quota-service';
import ConnektIcon from '@/components/branding/ConnektIcon';
import UpgradeModal from '@/components/subscription/UpgradeModal';

// ==========================================
// 1. CONTEXT: Sidebar State Management
// ==========================================
// We export this so the DashboardLayout can listen to changes and stretch the content
interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('useSidebar must be used within a SidebarProvider');
  return context;
};

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleSidebar = () => setIsCollapsed(prev => !prev);
  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

// ==========================================
// 2. UTILITY: GlassSurface (The Liquid Effect)
// ==========================================
const GlassSurface = ({
  borderRadius = 24, borderWidth = 1, opacity = 1, blur = 12, className = ''
}: any) => {
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
    </div>
  );
};

// ==========================================
// 3. COMPONENT: Spotlight Upgrade Card
// ==========================================
const SpotlightCard = ({ onClick, isCollapsed }: { onClick: () => void, isCollapsed: boolean }) => {
  const divRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <button
      ref={divRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full group overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 transition-all duration-300 ${isCollapsed ? 'h-14' : 'h-32'}`}
    >
      {/* Spotlight Effect */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(0,128,128,0.15), transparent 40%)`,
        }}
      />
      
      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center z-10 p-4">
        {isCollapsed ? (
           <Crown size={20} className="text-[#008080]" />
        ) : (
          <>
            <div className="w-10 h-10 mb-3 rounded-full bg-gradient-to-tr from-[#008080] to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Crown size={18} className="text-white" />
            </div>
            <div className="text-center">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-none mb-1">Upgrade to Pro</h4>
              <p className="text-[10px] text-gray-500 font-medium">Unlock full potential</p>
            </div>
          </>
        )}
      </div>

      {/* Border Highlight on Hover */}
      <div
        className="absolute inset-0 rounded-2xl border-2 border-[#008080] opacity-0 transition-opacity duration-300 group-hover:opacity-10 pointer-events-none"
      />
    </button>
  );
};

// ==========================================
// 4. COMPONENT: VerticalDockItem
// ==========================================
interface DockItemProps {
  icon: any;
  label: string;
  href: string;
  isActive: boolean;
  mouseY: any;
  isChild?: boolean;
  isLastChild?: boolean;
  isCollapsed: boolean;
}

function VerticalDockItem({ icon: Icon, label, href, isActive, mouseY, isChild, isLastChild, isCollapsed }: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const distance = 100;
  
  // Physics only active when NOT collapsed
  const y = useTransform(mouseY, (val: number) => {
    if (isCollapsed) return 0;
    const bounds = ref.current?.getBoundingClientRect() ?? { y: 0, height: 0 };
    return val - bounds.y - bounds.height / 2;
  });

  const scaleSync = useTransform(y, [-distance, 0, distance], [1, 1.25, 1]);
  const scale = useSpring(scaleSync, { mass: 0.1, stiffness: 150, damping: 12 });
  
  return (
    <Link href={href} className="relative group w-full block outline-none">
       {/* Tree Lines - Only show when NOT collapsed */}
       {isChild && !isCollapsed && (
        <div className="absolute left-[22px] top-[-24px] w-[16px] h-[calc(100%+8px)] -z-10 pointer-events-none">
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-gray-300/50 via-gray-300/30 to-transparent dark:from-white/20 dark:via-white/10"
               style={{ height: isLastChild ? '50%' : '100%' }} 
          />
          <div className="absolute left-0 top-1/2 w-[12px] h-[2px] bg-gray-300/50 dark:bg-white/10" />
        </div>
      )}

      <div ref={ref} className={`relative flex items-center ${isCollapsed ? 'justify-center px-0 py-3' : isChild ? 'pl-10 pr-2 py-1.5' : 'px-3 py-2.5'} transition-all duration-300`}>
        
        {/* Hover Background */}
        {isActive && (
          <motion.div
            layoutId="activePill"
            className={`absolute inset-0 bg-[#008080]/10 border border-[#008080]/20 ${isCollapsed ? 'rounded-xl mx-2' : 'rounded-xl'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}

        {/* Icon */}
        <motion.div 
          style={{ scale: isCollapsed ? 1 : scale }}
          className={`relative z-10 p-2 rounded-xl transition-colors duration-200 ${
            isActive ? 'bg-[#008080] text-white shadow-lg shadow-teal-500/30' : 'text-gray-500 group-hover:text-[#008080] group-hover:bg-white/50 dark:group-hover:bg-white/10'
          }`}
        >
          <Icon size={isChild ? 16 : 20} strokeWidth={isActive ? 2.5 : 2} />
        </motion.div>

        {/* Label - Animate out when collapsed */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="ml-3 flex-1 overflow-hidden whitespace-nowrap"
            >
              <span className={`text-sm font-medium transition-colors ${isActive ? 'text-[#008080] font-bold' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-white'}`}>
                {label}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Link>
  );
}

// ==========================================
// 5. COMPONENT: Storage Widget (Minimal on Collapse)
// ==========================================
const StorageWidget = ({ quota, isCollapsed }: { quota: StorageQuota | null, isCollapsed: boolean }) => {
  if (!quota) return null;
  const percent = Math.min((quota.usedSpace / quota.totalQuota) * 100, 100);
  
  if (isCollapsed) {
    // Minimal Circle Version
    return (
        <div className="flex justify-center py-2 group cursor-default relative">
            <div className="relative w-8 h-8 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                    <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-gray-200 dark:text-gray-800" />
                    <circle cx="16" cy="16" r="14" stroke="#008080" strokeWidth="3" fill="transparent" strokeDasharray={88} strokeDashoffset={88 - (88 * percent) / 100} className="transition-all duration-1000" />
                </svg>
                <HardDrive size={10} className="absolute text-gray-500" />
            </div>
            {/* Tooltip on Hover */}
            <div className="absolute left-10 top-1/2 -translate-y-1/2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                {Math.round(percent)}% Storage
            </div>
        </div>
    );
  }

  // Full Version
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/20 p-4 group cursor-default">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <HardDrive size={14} />
          <span className="text-xs font-bold uppercase tracking-wider">Storage</span>
        </div>
        <span className="text-xs font-bold text-[#008080]">{Math.round(percent)}%</span>
      </div>
      <div className="relative h-2 w-full bg-gray-200/50 dark:bg-black/40 rounded-full overflow-hidden mb-2">
        <motion.div 
          initial={{ width: 0 }} animate={{ width: `${percent}%` }}
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#008080] to-teal-400 rounded-full"
        />
      </div>
      <p className="text-[10px] text-gray-400 text-right"><span className="text-gray-700 dark:text-gray-200 font-bold">{(quota.usedSpace / (1024 ** 3)).toFixed(1)} GB</span> used</p>
    </div>
  );
};

// ==========================================
// 6. MAIN COMPONENT: Sidebar
// ==========================================
interface SidebarProps {
    agency?: Agency | null;
}

export function Sidebar({ agency = null }: SidebarProps) {
    const pathname = usePathname();
    const { user, userProfile } = useAuth();
    const { isCollapsed, toggleSidebar } = useSidebar(); // Accessing context
    
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
    const getMenuItems = () => {
        const baseHref = agency ? `/agency/${agency.username}/dashboard` : '/dashboard';
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

    // Elastic Animation Config
    const sidebarVariants = {
        expanded: { width: 288, transition: { type: "spring", stiffness: 300, damping: 30 } },
        collapsed: { width: 90, transition: { type: "spring", stiffness: 300, damping: 30 } }
    };

    return (
        <>
            <motion.aside 
                initial="expanded"
                animate={isCollapsed ? "collapsed" : "expanded"}
                variants={sidebarVariants}
              className="fixed left-6 top-6 bottom-6 z-[110] hidden lg:flex flex-col relative"
                onMouseMove={(e) => mouseY.set(e.clientY)}
                onMouseLeave={() => mouseY.set(Infinity)}
                ref={containerRef}
            >
                {/* 1. Glass Background */}
                <GlassSurface 
                    opacity={0.85} 
                    blur={20} 
                    borderRadius={32}
                    className="shadow-2xl shadow-black/10"
                />

              {/* Sidebar Toggle (Pinned to collapsing container) */}
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className="absolute -right-3 top-8 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-md transition-transform duration-300 ease-in-out hover:text-[#008080] dark:border-zinc-700 dark:bg-zinc-800"
                style={{ transform: `rotate(${isCollapsed ? 180 : 0}deg)` }}
              >
                <ChevronLeft size={16} />
              </button>

                {/* 2. Content Wrapper */}
                <div className={`relative z-10 flex flex-col h-full py-6 overflow-hidden ${isCollapsed ? 'px-2' : 'px-5'}`}>
                    
                    {/* Header: Logo & Toggle */}
                    <div className="mb-8 px-2 flex items-center">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative flex-shrink-0">
                                <div className="absolute inset-0 bg-[#008080] blur-lg opacity-20 group-hover:opacity-40 transition-opacity rounded-full"/>
                                <ConnektIcon className="w-10 h-10 text-[#008080] relative z-10" />
                            </div>
                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.span 
                                        initial={{ opacity: 0, width: 0 }} 
                                        animate={{ opacity: 1, width: 'auto' }} 
                                        exit={{ opacity: 0, width: 0 }}
                                        className="text-xl font-bold font-headline text-[#008080] tracking-[0.2em] whitespace-nowrap overflow-hidden"
                                    >
                                        CONNEKT
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Link>
                    </div>

                    {/* Navigation Items */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar -mr-4 pr-4 pb-4 space-y-1">
                        <div className="space-y-1">
                            {items.map((item) => {
                                const isParentActive = pathname === item.href;
                                const isChildActive = item.children?.some(child => pathname.startsWith(child.href));
                                const isOpen = (isParentActive || isChildActive) && !isCollapsed;

                                return (
                                    <div key={item.id} className="relative">
                                        <VerticalDockItem 
                                            icon={item.icon}
                                            label={item.label}
                                            href={item.href}
                                            isActive={isParentActive || (isCollapsed && isChildActive || false)}
                                            mouseY={mouseY}
                                            isCollapsed={isCollapsed}
                                        />

                                        {/* Connector Line (Hidden when collapsed) */}
                                        {!isCollapsed && item.children && (
                                           <div className={`absolute left-[23px] top-[38px] w-[2px] bg-gray-300/30 dark:bg-white/10 transition-all duration-300 ${isOpen ? 'h-[calc(100%-45px)] opacity-100' : 'h-0 opacity-0'}`} />
                                        )}

                                        {/* Children */}
                                        <AnimatePresence initial={false}>
                                            {isOpen && item.children && (
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
                                                            isCollapsed={isCollapsed}
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

                    {/* Bottom Actions */}
                    <div className={`mt-auto pt-6 relative ${isCollapsed ? 'space-y-2' : 'space-y-4'}`}>
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent opacity-50" />

                        <StorageWidget quota={storageQuota} isCollapsed={isCollapsed} />

                        <div className="space-y-1">
                            <Link href="/settings" className={`flex items-center gap-3 py-2 rounded-xl text-gray-500 hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}>
                                <Settings size={18} />
                                {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
                            </Link>

                            <button 
                                onClick={() => signOut(auth)}
                                className={`w-full flex items-center gap-3 py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}
                            >
                                <LogOut size={18} />
                                {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
                            </button>
                        </div>

                        {/* Upgrade Button - Spotlight Card */}
                        <SpotlightCard onClick={() => setShowUpgradeModal(true)} isCollapsed={isCollapsed} />
                    </div>
                </div>
            </motion.aside>

            {/* Upgrade Modal */}
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                onSuccess={() => {}}
            />
        </>
    );
}