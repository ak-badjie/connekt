'use client';

import React, {
    Children,
    cloneElement,
    forwardRef,
    isValidElement,
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
    Folder,
    Users,
    ArrowRight,
    Check,
    X,
    Briefcase,
    Loader2,
    Filter
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { WorkspaceService } from '@/lib/services/workspace-service';
import { Workspace } from '@/lib/types/workspace.types';

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
// 3. 3D CARD SWAP COMPONENT
// ==========================================

const Card = forwardRef(({ customClass, children, className, style, ...rest }: any, ref: any) => (
    <div
        ref={ref}
        style={style}
        {...rest}
        className="absolute top-1/2 left-1/2 [transform-style:preserve-3d] [will-change:transform] [backface-visibility:hidden]"
    >
        <div className={`w-full h-full rounded-3xl border border-white/60 bg-white/90 shadow-2xl 
    backdrop-blur-xl overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] hover:scale-[1.05] hover:shadow-teal-900/20
    ${customClass ?? ''} ${className ?? ''}`.trim()}>
            {children}
        </div>
    </div>
));
Card.displayName = 'Card';

const makeSlot = (i: number, distX: number, distY: number, total: number) => ({
    x: i * distX,
    y: -i * distY, // Negative Y moves items UP, allowing headers to be seen
    z: -i * distX * 1.5,
    zIndex: total - i
});

const placeNow = (el: any, slot: any, skew: any) =>
    gsap.set(el, {
        x: slot.x,
        y: slot.y,
        z: slot.z,
        xPercent: -50,
        yPercent: -40, // Centering adjustment
        skewY: skew,
        transformOrigin: 'center center',
        zIndex: slot.zIndex,
        force3D: true
    });

const CardSwap = ({
    width = 500,
    height = 400,
    cardDistance = 40,
    verticalDistance = 60,
    delay = 5000,
    pauseOnHover = true,
    onCardClick,
    skewAmount = 2,
    easing = 'elastic',
    children
}: any) => {
    const config = useMemo(() => {
        if (easing === 'slick') return {
            ease: "expo.out",
            durDrop: 0.6,
            durMove: 0.8,
            durReturn: 0.8,
            promoteOverlap: 0.2,
            returnDelay: 0.1
        };
        return easing === 'elastic'
            ? {
                ease: 'elastic.out(0.6,0.9)',
                durDrop: 2,
                durMove: 2,
                durReturn: 2,
                promoteOverlap: 0.9,
                returnDelay: 0.05
            }
            : {
                ease: 'power1.inOut',
                durDrop: 0.8,
                durMove: 0.8,
                durReturn: 0.8,
                promoteOverlap: 0.45,
                returnDelay: 0.2
            };
    }, [easing]);

    const childArr = useMemo(() => Children.toArray(children), [children]);
    const refs = useMemo(
        () => childArr.map(() => React.createRef()),
        [childArr.length]
    );

    const order = useRef(Array.from({ length: childArr.length }, (_, i) => i));
    const tlRef = useRef<gsap.core.Timeline | null>(null);
    const intervalRef = useRef<number>();
    const container = useRef<HTMLDivElement>(null);

    // Initial placement
    useEffect(() => {
        const total = refs.length;
        refs.forEach((r: any, i) => {
            if (r.current) placeNow(r.current, makeSlot(i, cardDistance, verticalDistance, total), skewAmount)
        });
    }, [refs, cardDistance, verticalDistance, skewAmount]);

    const moveToFront = (targetIndex: number) => {
        const currentOrderIndex = order.current.indexOf(targetIndex);
        if (currentOrderIndex === 0) {
            onCardClick?.(targetIndex);
            return;
        }

        const newOrder = [
            targetIndex,
            ...order.current.filter(idx => idx !== targetIndex)
        ];

        const tl = gsap.timeline();
        tlRef.current = tl;

        const elTarget = refs[targetIndex].current;

        // 1. Lift target card logic
        tl.to(elTarget, {
            y: '-=150',
            z: -200,
            rotationX: -5,
            scale: 1.1,
            duration: 0.4,
            ease: "power2.out"
        });

        // 2. Shuffle others back
        newOrder.forEach((idx, i) => {
            if (idx === targetIndex) return;
            const el = refs[idx].current;
            const slot = makeSlot(i, cardDistance, verticalDistance, refs.length);
            tl.to(el, {
                x: slot.x,
                y: slot.y,
                z: slot.z,
                zIndex: slot.zIndex,
                duration: config.durMove,
                ease: config.ease
            }, 0.1);
        });

        // 3. Drop target to front
        const frontSlot = makeSlot(0, cardDistance, verticalDistance, refs.length);
        tl.set(elTarget, { zIndex: frontSlot.zIndex });
        tl.to(elTarget, {
            x: frontSlot.x,
            y: frontSlot.y,
            z: frontSlot.z,
            rotationX: 0,
            scale: 1,
            duration: 0.6,
            ease: "elastic.out(1, 0.8)"
        }, "-=0.2");

        order.current = newOrder;
    };

    const swap = () => {
        if (order.current.length < 2) return;
        const [front, ...rest] = order.current;
        const elFront = refs[front].current;
        const tl = gsap.timeline();
        tlRef.current = tl;

        tl.to(elFront, {
            y: '+=600',
            rotationX: -20,
            opacity: 0,
            duration: config.durDrop,
            ease: config.ease
        });

        // ... (rest of simple swap logic retained if needed, but moveToFront is primary now)
        // For simplicity, we just implement moveToFront as the main interaction

        // Restore order for swap logic if auto-play was enabled (it's not)
        order.current = [...rest, front];
    };

    const rendered = childArr.map((child: any, i) =>
        isValidElement(child)
            ? cloneElement(child, {
                key: i,
                ref: refs[i],
                style: { width, height, ...(child.props.style ?? {}) },
                onClick: (e: any) => {
                    // Intercept click: If back card, bring to front. If front, trigger prop.
                    moveToFront(i);
                }
            })
            : child
    );

    return (
        <div
            ref={container}
            className="absolute top-[20%] right-[10%] transform origin-center perspective-[1200px]"
            style={{ width, height }}
        >
            {rendered}
        </div>
    );
};

// ==========================================
// 4. MAIN PAGE COMPONENT
// ==========================================

export default function WorkspacesStartupPage() {
    const { user, userProfile } = useAuth();
    const router = useRouter();

    // Data State
    const [allWorkspaces, setAllWorkspaces] = useState<Workspace[]>([]);
    const [filteredWorkspaces, setFilteredWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'owned' | 'member'>('all');

    // Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Form State
    const [createForm, setCreateForm] = useState({ name: '', description: '' });
    const [creating, setCreating] = useState(false);

    // --- Data Fetching ---
    useEffect(() => {
        if (user && userProfile) {
            const fetchWorkspaces = async () => {
                try {
                    const [owned, memberOf] = await Promise.all([
                        WorkspaceService.getUserWorkspaces(user.uid),
                        WorkspaceService.getWorkspacesMemberOf(user.uid)
                    ]);

                    // Mark ownership for UI logic
                    const ownedWithFlag = owned.map(w => ({ ...w, _isOwner: true }));
                    const memberWithFlag = memberOf.map(w => ({ ...w, _isOwner: false }));

                    const combined = [...ownedWithFlag, ...memberWithFlag];
                    setAllWorkspaces(combined);
                    setFilteredWorkspaces(combined);
                } catch (error) {
                    console.error('Error fetching workspaces:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchWorkspaces();
        }
    }, [user, userProfile]);

    // --- Filtering Logic ---
    useEffect(() => {
        let result = allWorkspaces;

        // 1. Filter by Search
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            result = result.filter(w =>
                w.name.toLowerCase().includes(lowerQ) ||
                w.description.toLowerCase().includes(lowerQ)
            );
        }

        // 2. Filter by Type
        if (filterType === 'owned') {
            result = result.filter(w => (w as any)._isOwner);
        } else if (filterType === 'member') {
            result = result.filter(w => !(w as any)._isOwner);
        }

        setFilteredWorkspaces(result);
    }, [searchQuery, filterType, allWorkspaces]);

    // --- Handlers ---
    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !userProfile || !createForm.name) return;

        setCreating(true);
        try {
            const newId = await WorkspaceService.createWorkspace({
                name: createForm.name,
                description: createForm.description,
                ownerId: user.uid,
                ownerUsername: userProfile.username || 'user',
                ownerEmail: userProfile.email || user.email || ''
            });

            // Optimistic Update
            const newWorkspace: any = {
                id: newId,
                name: createForm.name,
                description: createForm.description,
                members: [{ userId: user.uid, role: 'owner' }], // Minimal mock
                _isOwner: true
            };

            setAllWorkspaces(prev => [newWorkspace, ...prev]);
            setIsCreateOpen(false);
            setCreateForm({ name: '', description: '' });

            // Highlight the new one in filter
            setFilterType('all');
            setSearchQuery('');

        } catch (error) {
            console.error(error);
        } finally {
            setCreating(false);
        }
    };

    const handleCardClick = (index: number) => {
        // Now handled via Arrow Button. 
        // We can leave this empty or remove it.
    };

    const dockItems = [
        {
            icon: <Plus size={24} />,
            label: "Create",
            onClick: () => setIsCreateOpen(true)
        },
        {
            icon: <Search size={24} />,
            label: "Search",
            onClick: () => setIsSearchOpen(prev => !prev) // Toggle
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

                {/* --- Left Column: Text & Stats (30%) --- */}
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
                            Live Workspace Hub
                        </motion.div>

                        <SplitText
                            text="Your Digital"
                            className="text-6xl font-bold text-gray-900 tracking-tight leading-none"
                            delay={100}
                        />
                        <SplitText
                            text="HQ Is Here."
                            className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#008080] to-teal-600 tracking-tight leading-tight pb-4"
                            delay={300}
                        />

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="text-lg text-gray-500 max-w-md leading-relaxed mt-4"
                        >
                            Unlock infinite possibilities. Collaborate in real-time, manage tasks effortlessly,
                            and scale your vision with our unified workspace ecosystem.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="grid grid-cols-2 gap-4 max-w-sm"
                    >
                        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                            <h3 className="text-3xl font-bold text-gray-900">{allWorkspaces.length}</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Total Spaces</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                            <h3 className="text-3xl font-bold text-[#008080]">
                                {allWorkspaces.filter((w: any) => w._isOwner).length}
                            </h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Owned</p>
                        </div>
                    </motion.div>
                </div>

                {/* --- Right Column: 3D Stack (65%) --- */}
                <div className="flex-1 h-full relative" style={{ perspective: '2000px' }}>
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="animate-spin text-[#008080]" size={40} />
                        </div>
                    ) : filteredWorkspaces.length === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50">
                            <Folder size={64} className="text-gray-300 mb-4" />
                            <p className="text-xl font-medium text-gray-400">No workspaces found</p>
                        </div>
                    ) : (
                        // Key forces re-render when filters change to reset stack positions correctly
                        <CardSwap
                            key={filterType + searchQuery + filteredWorkspaces.length}
                            width={500}
                            height={320}
                            cardDistance={50}
                            verticalDistance={75}
                            skewAmount={0}
                            delay={null} // Disabled auto-swap
                            pauseOnHover={true}
                            easing="slick" // New mode
                            onCardClick={(index: number) => {
                                // Optional: You could log selection here
                            }}
                        >
                            {filteredWorkspaces.map((workspace, idx) => (
                                <Card
                                    key={workspace.id}
                                    className="cursor-pointer group hover:border-[#008080] transition-colors duration-300"
                                >
                                    {/* --- Card Header (Visible in Stack) --- */}
                                    <div className={`h-[60px] px-6 flex items-center justify-between border-b border-gray-100
                                        ${(workspace as any)._isOwner
                                            ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white'
                                            : 'bg-white text-gray-900'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${(workspace as any)._isOwner ? 'bg-[#008080]' : 'bg-gray-300'}`} />
                                            <h3 className="font-bold text-sm truncate max-w-[250px]">{workspace.name}</h3>
                                        </div>
                                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">
                                            {(workspace as any)._isOwner ? 'Owner' : 'Member'}
                                        </span>
                                    </div>

                                    {/* --- Card Body (Visible on Front) --- */}
                                    <div className="p-6 h-[calc(100%-60px)] flex flex-col justify-between bg-white relative">
                                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <Folder size={120} />
                                        </div>

                                        <div>
                                            <p className="text-gray-500 text-sm line-clamp-3 leading-relaxed mb-4">
                                                {workspace.description}
                                            </p>

                                            <div className="flex items-center gap-4 mt-2">
                                                <div className="flex -space-x-2">
                                                    {[...Array(Math.min(3, workspace.members?.length || 1))].map((_, i) => (
                                                        <div key={i} className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                            {workspace.name[0]}
                                                        </div>
                                                    ))}
                                                    {(workspace.members?.length || 0) > 3 && (
                                                        <div className="w-8 h-8 rounded-full bg-gray-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-400">
                                                            +{(workspace.members?.length || 0) - 3}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-xs font-medium text-gray-400">Active Team</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                                <Briefcase size={14} />
                                                <span>Projects</span>
                                            </div>
                                            {/* ARROW BUTTON - NAVIGATES */}
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/dashboard/workspaces/${workspace.id}`);
                                                }}
                                                className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-[#008080] hover:bg-[#008080] hover:text-white transition-all hover:scale-110 shadow-sm cursor-pointer z-20"
                                            >
                                                <ArrowRight size={14} />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </CardSwap>
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
                                    placeholder="Filter workspaces..."
                                    className="pl-9 pr-4 py-2 bg-transparent border-none outline-none text-sm w-[200px] text-gray-800 placeholder:text-gray-400"
                                    autoFocus
                                />
                            </div>
                            <div className="h-6 w-px bg-gray-200 mx-1" />
                            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
                                {[
                                    { id: 'all', label: 'All' },
                                    { id: 'owned', label: 'Owned' },
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

            {/* --- Create Workspace Modal --- */}
            <AnimatePresence>
                {isCreateOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCreateOpen(false)}
                            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-white/50 overflow-hidden"
                        >
                            {/* Decorative header blob */}
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#008080] to-teal-400" />

                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">New Workspace</h2>
                                <button
                                    onClick={() => setIsCreateOpen(false)}
                                    className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Workspace Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.name}
                                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20 focus:bg-white transition-all font-medium"
                                        placeholder="e.g. Design Studio"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Description</label>
                                    <textarea
                                        rows={3}
                                        value={createForm.description}
                                        onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20 focus:bg-white transition-all text-sm resize-none"
                                        placeholder="What's this workspace for?"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="w-full py-4 mt-2 bg-[#008080] hover:bg-teal-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-900/20 active:scale-[0.98]"
                                >
                                    {creating ? <Loader2 className="animate-spin" size={20} /> : <><Check size={20} /> Create Workspace</>}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- Fixed Dock --- */}
            <Dock items={dockItems} />
        </div>
    );
}