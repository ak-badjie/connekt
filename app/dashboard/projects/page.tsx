'use client';

import React, {
    Fragment,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';
import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    AnimatePresence,
    MotionValue
} from 'framer-motion';
import gsap from 'gsap';
import {
    Plus,
    Search,
    Settings,
    Users,
    ArrowRight,
    Loader2,
    Briefcase,
    Star
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { Project } from '@/lib/types/workspace.types';
import { Dialog, Transition } from '@headlessui/react';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';
import ThreeDHoverGallery, { ProjectImageData } from '@/components/ui/ThreeDHoverGallery';

// ==========================================
// 1. ANIMATION UTILS (SplitText)
// ==========================================

const SplitText = ({
    text,
    className = "",
    delay = 0,
    duration = 0.5,
    ease = "power2.out",
    splitType = "chars",
    from = { opacity: 0, y: 20 },
    to = { opacity: 1, y: 0 },
    threshold = 0.1,
    rootMargin = "-50px",
    textAlign = "left",
    onLetterAnimationComplete,
}: any) => {
    const elementRef = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (!elementRef.current || hasAnimated.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    hasAnimated.current = true;
                    const target = splitType === 'chars' ? ".char" : ".word";
                    const elements = elementRef.current?.querySelectorAll(target);

                    if (elements) {
                        gsap.fromTo(
                            elements,
                            from,
                            {
                                ...to,
                                duration,
                                ease,
                                stagger: 0.05,
                                delay: delay / 1000,
                                onComplete: onLetterAnimationComplete,
                            }
                        );
                    }
                    observer.disconnect();
                }
            },
            { threshold, rootMargin }
        );

        observer.observe(elementRef.current);
        return () => observer.disconnect();
    }, [text, delay, duration, ease, splitType, from, to, threshold, rootMargin, onLetterAnimationComplete]);

    const renderContent = () => {
        if (splitType === 'words') {
            return text.split(" ").map((word: string, i: number) => (
                <div key={i} style={{ display: 'inline-block', overflow: 'hidden' }}>
                    <span className="word" style={{ display: 'inline-block' }}>{word}&nbsp;</span>
                </div>
            ));
        }
        return text.split("").map((char: string, i: number) => (
            <div key={i} style={{ display: 'inline-block', overflow: 'hidden' }}>
                <span className="char" style={{ display: 'inline-block' }}>{char === " " ? "\u00A0" : char}</span>
            </div>
        ));
    };

    return (
        <div ref={elementRef} className={className} style={{ textAlign }}>
            {renderContent()}
        </div>
    );
};

// ==========================================
// 2. DOCK COMPONENT
// ==========================================

function useDockItemSize(
    mouseX: MotionValue<number>,
    baseItemSize: number,
    magnification: number,
    distance: number,
    ref: React.RefObject<HTMLDivElement>,
    spring: { mass: number; stiffness: number; damping: number }
) {
    const mouseDistance = useTransform(mouseX, (val) => {
        if (typeof val !== "number" || isNaN(val)) return 0;
        const rect = ref.current?.getBoundingClientRect() ?? {
            x: 0,
            width: baseItemSize,
        };
        return val - rect.x - baseItemSize / 2;
    });

    const targetSize = useTransform(
        mouseDistance,
        [-distance, 0, distance],
        [baseItemSize, magnification, baseItemSize]
    );

    return useSpring(targetSize, spring);
}

function DockItem({
    icon,
    label,
    onClick,
    mouseX,
    baseItemSize,
    magnification,
    distance,
    spring,
    badgeCount,
}: any) {
    const ref = useRef<HTMLDivElement>(null);
    const isHovered = useMotionValue(0);
    const size = useDockItemSize(
        mouseX,
        baseItemSize,
        magnification,
        distance,
        ref,
        spring
    );
    const [showLabel, setShowLabel] = useState(false);

    useEffect(() => {
        const unsubscribe = isHovered.on("change", (value) =>
            setShowLabel(value === 1)
        );
        return () => unsubscribe();
    }, [isHovered]);

    return (
        <motion.div
            ref={ref}
            style={{ width: size, height: size }}
            onHoverStart={() => isHovered.set(1)}
            onHoverEnd={() => isHovered.set(0)}
            onFocus={() => isHovered.set(1)}
            onBlur={() => isHovered.set(0)}
            onClick={onClick}
            className="relative inline-flex items-center justify-center rounded-2xl 
      bg-white/80 backdrop-blur-md border border-white/20 shadow-xl shadow-teal-900/10 cursor-pointer
      hover:bg-white hover:border-[#008080]/30 transition-colors"
            tabIndex={0}
            role="button"
        >
            <div className="flex items-center justify-center text-gray-600 hover:text-[#008080]">{icon}</div>
            {badgeCount !== undefined && badgeCount > 0 && (
                <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {badgeCount > 99 ? "99+" : badgeCount}
                </span>
            )}
            <AnimatePresence>
                {showLabel && (
                    <motion.div
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: 1, y: -15 }}
                        exit={{ opacity: 0, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute -top-8 left-1/2 w-fit whitespace-pre rounded-lg 
            border border-gray-100 bg-white px-3 py-1 text-xs font-semibold text-[#008080] shadow-lg"
                        style={{ x: "-50%" }}
                    >
                        {label}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function Dock({
    items,
    className = "",
    spring = { mass: 0.1, stiffness: 150, damping: 12 },
    magnification = 70,
    distance = 200,
    panelHeight = 80,
    baseItemSize = 50,
}: any) {
    const mouseX = useMotionValue(Infinity);
    const isHovered = useMotionValue(0);

    return (
        <motion.div
            style={{ height: panelHeight }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center"
        >
            <motion.div
                onMouseMove={({ pageX }) => {
                    isHovered.set(1);
                    mouseX.set(pageX);
                }}
                onMouseLeave={() => {
                    isHovered.set(0);
                    mouseX.set(Infinity);
                }}
                className={`flex items-end gap-4 rounded-3xl 
            bg-white/40 backdrop-blur-xl border border-white/50 shadow-2xl shadow-teal-900/10 px-6 pb-3 pt-3 ${className}`}
                style={{ height: panelHeight }}
            >
                {items.map((item: any, index: number) => (
                    <DockItem
                        key={index}
                        {...item}
                        mouseX={mouseX}
                        baseItemSize={baseItemSize}
                        magnification={magnification}
                        distance={distance}
                        spring={spring}
                    />
                ))}
            </motion.div>
        </motion.div>
    );
}

// ==========================================
// 3. MAIN PAGE COMPONENT
// ==========================================

export default function ProjectsStartupPage() {
    const { user, userProfile } = useAuth();
    const router = useRouter();

    // Data State
    const [allProjects, setAllProjects] = useState<Project[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'owned' | 'assigned' | 'member'>('all');

    // Modal State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [showProjectTypeModal, setShowProjectTypeModal] = useState(false);

    // --- Data Fetching ---
    useEffect(() => {
        if (user && userProfile) {
            const fetchProjects = async () => {
                try {
                    const [owned, assigned, memberOf] = await Promise.all([
                        EnhancedProjectService.getUserProjects(user.uid),
                        EnhancedProjectService.getAssignedProjects(user.uid),
                        EnhancedProjectService.getProjectsMemberOf(user.uid)
                    ]);

                    // Mark ownership for UI logic
                    const ownedWithFlag = owned.map(p => ({ ...p, _isOwner: true, _isAssigned: false }));
                    const assignedWithFlag = assigned.map(p => ({ ...p, _isOwner: false, _isAssigned: true }));
                    const memberWithFlag = memberOf.map(p => ({ ...p, _isOwner: false, _isAssigned: false }));

                    const combined = [...ownedWithFlag, ...assignedWithFlag, ...memberWithFlag];
                    // Remove duplicates by id
                    const unique = Array.from(new Map(combined.map(p => [p.id, p])).values());
                    setAllProjects(unique);
                    setFilteredProjects(unique);
                } catch (error) {
                    console.error('Error fetching projects:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchProjects();
        }
    }, [user, userProfile]);

    // --- Filtering Logic ---
    useEffect(() => {
        let result = allProjects;

        // 1. Filter by Search
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.title.toLowerCase().includes(lowerQ) ||
                p.description.toLowerCase().includes(lowerQ)
            );
        }

        // 2. Filter by Type
        if (filterType === 'owned') {
            result = result.filter(p => (p as any)._isOwner);
        } else if (filterType === 'assigned') {
            result = result.filter(p => (p as any)._isAssigned);
        } else if (filterType === 'member') {
            result = result.filter(p => !(p as any)._isOwner && !(p as any)._isAssigned);
        }

        setFilteredProjects(result);
    }, [searchQuery, filterType, allProjects]);

    // Stats
    const ownedCount = useMemo(() => allProjects.filter((p: any) => p._isOwner).length, [allProjects]);
    const assignedCount = useMemo(() => allProjects.filter((p: any) => p._isAssigned).length, [allProjects]);

    // Transform projects for ThreeDHoverGallery
    const galleryImages: ProjectImageData[] = useMemo(() => {
        return filteredProjects.map(p => ({
            src: (p as any).coverImage || `https://picsum.photos/seed/${p.id}/600/800`,
            title: p.title,
            shortTitle: p.title.substring(0, 12) + (p.title.length > 12 ? '...' : ''),
            status: p.status,
            memberCount: p.members?.length || 0,
            budget: p.budget,
            progress: (p as any).progress,
            deadline: p.deadline,
            description: p.description
        }));
    }, [filteredProjects]);

    const handleProjectClick = (index: number) => {
        const project = filteredProjects[index];
        if (project?.id) {
            router.push(`/dashboard/projects/${project.id}`);
        }
    };

    const dockItems = [
        {
            icon: <Plus size={24} />,
            label: "Create",
            onClick: () => setShowProjectTypeModal(true)
        },
        {
            icon: <Search size={24} />,
            label: "Search",
            onClick: () => setIsSearchOpen(prev => !prev)
        },
        {
            icon: <Settings size={24} />,
            label: "Settings",
            onClick: () => router.push('/dashboard/settings')
        }
    ];

    return (
        <div className="h-screen w-full overflow-hidden bg-slate-50 relative font-sans text-gray-900 selection:bg-[#008080]/20 selection:text-[#008080]">

            {/* --- Background Elements --- */}
            <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-teal-200/40 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-200/30 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-[1600px] mx-auto h-full flex pt-12 px-12 relative z-10">

                {/* --- Left Column: Text & Stats (35%) --- */}
                <div className="w-[35%] flex flex-col justify-center space-y-8 z-20">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-[#008080] text-sm font-bold mb-6"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                            </span>
                            Live Project Hub
                        </motion.div>

                        <SplitText
                            text="Your Digital"
                            className="text-6xl font-bold text-gray-900 tracking-tight leading-none"
                            delay={100}
                        />
                        <SplitText
                            text="Projects."
                            className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#008080] to-teal-600 tracking-tight leading-tight pb-4"
                            delay={300}
                        />

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="text-lg text-gray-500 max-w-md leading-relaxed mt-4"
                        >
                            Manage all your projects and collaborate with your team.
                            Track progress, budgets, and deadlines in one unified hub.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="grid grid-cols-3 gap-4 max-w-md"
                    >
                        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                            <h3 className="text-3xl font-bold text-gray-900">{allProjects.length}</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Total</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                            <h3 className="text-3xl font-bold text-[#008080]">{ownedCount}</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Owned</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                            <h3 className="text-3xl font-bold text-purple-600">{assignedCount}</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Assigned</p>
                        </div>
                    </motion.div>
                </div>

                {/* --- Right Column: ThreeDHoverGallery (65%) --- */}
                <div className="flex-1 h-full relative flex items-center justify-center">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="animate-spin text-[#008080]" size={40} />
                        </div>
                    ) : filteredProjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center opacity-50">
                            <Briefcase size={64} className="text-gray-300 mb-4" />
                            <p className="text-xl font-medium text-gray-400">No projects found</p>
                            <button
                                onClick={() => setShowProjectTypeModal(true)}
                                className="mt-6 px-6 py-3 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold transition-all inline-flex items-center gap-2"
                            >
                                <Plus size={18} />
                                Create Project
                            </button>
                        </div>
                    ) : (
                        <div className="w-full h-[400px] flex items-center justify-center">
                            <ThreeDHoverGallery
                                key={filterType + searchQuery + filteredProjects.length}
                                images={galleryImages}
                                onImageClick={handleProjectClick}
                                height={380}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* ==========================================
                OVERLAYS & MODALS
               ========================================== */}

            {/* --- Search Overlay (Pill Toggle) --- */}
            <AnimatePresence>
                {isSearchOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-32 left-1/2 -translate-x-1/2 z-40"
                    >
                        <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl p-2 flex items-center gap-2">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Filter projects..."
                                    className="pl-9 pr-4 py-2 bg-transparent border-none outline-none text-sm w-[200px] text-gray-800 placeholder:text-gray-400"
                                    autoFocus
                                />
                            </div>
                            <div className="h-6 w-px bg-gray-200 mx-1" />
                            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
                                {[
                                    { id: 'all', label: 'All' },
                                    { id: 'owned', label: 'Owned' },
                                    { id: 'assigned', label: 'Assigned' },
                                    { id: 'member', label: 'Member' }
                                ].map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setFilterType(type.id as any)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === type.id
                                            ? 'bg-white text-[#008080] shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- Project Type Selection Modal --- */}
            <Transition appear show={showProjectTypeModal} as={Fragment}>
                <Dialog as="div" className="relative z-[150]" onClose={() => setShowProjectTypeModal(false)}>
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150]" />
                    <div className="fixed inset-0 overflow-y-auto z-[150]">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Dialog.Panel className="relative w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-8 shadow-2xl transition-all">
                                <button
                                    onClick={() => setShowProjectTypeModal(false)}
                                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </button>
                                <Dialog.Title as="h3" className="text-2xl font-black text-gray-900 dark:text-white mb-8 text-center">
                                    Start a New Project
                                </Dialog.Title>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <button
                                        onClick={() => router.push('/dashboard/projects/create/ai')}
                                        className="group relative p-8 rounded-3xl border-2 border-teal-500 bg-teal-50/50 dark:bg-teal-900/10 hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-all text-center overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10" />
                                        <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                            <ConnektAIIcon className="w-10 h-10" />
                                        </div>
                                        <h4 className="text-xl font-bold text-teal-900 dark:text-teal-400 mb-2">AI Architect</h4>
                                        <p className="text-sm text-teal-700/70">Let AI structure the tasks, budget, and timeline automatically.</p>
                                    </button>

                                    <button
                                        onClick={() => router.push('/dashboard/projects/create')}
                                        className="group p-8 rounded-3xl border-2 border-dashed border-gray-200 dark:border-zinc-700 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all text-center"
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 mx-auto mb-6 group-hover:scale-110 transition-transform">
                                            <Briefcase size={32} />
                                        </div>
                                        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Manual Setup</h4>
                                        <p className="text-sm text-gray-500">Build the project from scratch yourself.</p>
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* --- Fixed Dock --- */}
            <Dock items={dockItems} />
        </div>
    );
}
