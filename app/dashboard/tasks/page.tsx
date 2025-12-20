'use client';

import React, {
    useEffect,
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
    Clock,
    AlertCircle,
    CheckCircle2,
    Circle,
    Loader2,
    CheckSquare,
    DollarSign,
    Calendar,
    ArrowLeftCircle,
    ArrowRightCircle,
    ArrowRight,
    Briefcase,
    UserCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { TaskService } from '@/lib/services/task-service';
import { Task } from '@/lib/types/workspace.types';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';

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
// 3. 3D TASK CAROUSEL (from RecruiterDashboard)
// ==========================================

interface TaskSlide {
    id: string;
    title: string;
    description: string;
    assignee: string;
    date: string;
    status: string;
    priority: string;
    amount?: number;
}

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

const ThreeDTaskCarousel = ({ slides, onReview, className = '' }: { slides: TaskSlide[], onReview: (id: string) => void, className?: string }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const total = slides.length;

    const getSlideClasses = (index: number) => {
        const diff = index - activeIndex;
        if (diff === 0) return 'z-30 scale-100 opacity-100 translate-x-0 blur-none';
        if (diff === 1 || diff === -total + 1) return 'z-20 scale-[0.85] opacity-60 translate-x-[60%] blur-[2px]';
        if (diff === -1 || diff === total - 1) return 'z-20 scale-[0.85] opacity-60 -translate-x-[60%] blur-[2px]';
        return 'z-10 scale-50 opacity-0 pointer-events-none';
    };

    const navigate = (dir: 'next' | 'prev') => {
        setActiveIndex(c => dir === 'next' ? (c + 1) % total : (c - 1 + total) % total);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'todo': return 'bg-gray-100 text-gray-600';
            case 'in-progress': return 'bg-blue-100 text-blue-600';
            case 'pending-validation': return 'bg-amber-100 text-amber-600';
            case 'done': return 'bg-green-100 text-green-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-500 text-white';
            case 'high': return 'bg-orange-500 text-white';
            case 'medium': return 'bg-yellow-500 text-white';
            default: return 'bg-green-500 text-white';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'todo': return Circle;
            case 'in-progress': return Clock;
            case 'pending-validation': return AlertCircle;
            case 'done': return CheckCircle2;
            default: return Circle;
        }
    };

    if (!slides.length) return (
        <div className="text-slate-500/80 font-medium text-center py-20">
            <CheckSquare size={48} className="mx-auto mb-4 opacity-30" />
            No tasks to display
        </div>
    );

    return (
        <div className={cn("relative h-[420px] w-full flex items-center justify-center perspective-1000", className)}>
            {slides.map((slide, index) => {
                const StatusIcon = getStatusIcon(slide.status);
                return (
                    <div
                        key={slide.id}
                        className={cn(
                            "absolute transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer",
                            getSlideClasses(index)
                        )}
                        onClick={() => onReview(slide.id)}
                    >
                        <div className="w-[320px] h-[420px] bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-2xl flex flex-col justify-between overflow-hidden group hover:border-teal-400/50 transition-colors">

                            {/* Header Color Area */}
                            <div className="h-28 bg-gradient-to-br from-teal-500/20 to-blue-500/20 p-6 relative">
                                <span className={`absolute top-4 right-4 ${getPriorityColor(slide.priority)} text-[10px] font-black tracking-wider px-2 py-1 rounded-full uppercase`}>
                                    {slide.priority}
                                </span>
                                <span className={`absolute top-4 left-4 ${getStatusColor(slide.status)} text-[10px] font-black tracking-wider px-2 py-1 rounded-full uppercase flex items-center gap-1`}>
                                    <StatusIcon size={10} />
                                    {slide.status.replace('-', ' ')}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="-mt-12 px-6 pb-6 flex flex-col h-full">
                                <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center mb-4 text-teal-600 border border-teal-50">
                                    <ConnektAIIcon className="w-8 h-8" />
                                </div>

                                <h3 className="text-slate-800 font-bold text-xl mb-1 line-clamp-2 leading-tight">{slide.title}</h3>

                                {slide.assignee && (
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-1">
                                        <UserCheck size={12} />
                                        @{slide.assignee}
                                    </p>
                                )}

                                <p className="text-slate-600 text-sm line-clamp-3 mb-4 flex-1">{slide.description}</p>

                                <div className="mt-auto pt-4 border-t border-slate-200/50 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        {slide.date && (
                                            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                                                <Calendar size={12} />
                                                {slide.date}
                                            </span>
                                        )}
                                        {slide.amount && (
                                            <span className="text-xs font-bold text-teal-600 flex items-center gap-1">
                                                <DollarSign size={12} />
                                                {slide.amount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-bold text-teal-600 group-hover:text-teal-700 transition-colors">
                                        View <ArrowRight size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            {total > 1 && (
                <>
                    <button onClick={(e) => { e.stopPropagation(); navigate('prev'); }} className="absolute left-0 md:left-8 z-40 p-3 bg-white/20 hover:bg-white/40 backdrop-blur rounded-full text-teal-900 shadow-lg transition-all"><ArrowLeftCircle size={28} /></button>
                    <button onClick={(e) => { e.stopPropagation(); navigate('next'); }} className="absolute right-0 md:right-8 z-40 p-3 bg-white/20 hover:bg-white/40 backdrop-blur rounded-full text-teal-900 shadow-lg transition-all"><ArrowRightCircle size={28} /></button>
                </>
            )}
        </div>
    );
};

// ==========================================
// 4. MAIN PAGE COMPONENT
// ==========================================

export default function TasksStartupPage() {
    const { user, userProfile } = useAuth();
    const router = useRouter();

    // Data State
    const [allTasks, setAllTasks] = useState<Task[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'todo' | 'in-progress' | 'pending-validation' | 'done'>('all');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // --- Data Fetching ---
    useEffect(() => {
        if (user && userProfile) {
            const fetchTasks = async () => {
                try {
                    const tasks = await TaskService.getUserTasks(user.uid);
                    setAllTasks(tasks);
                    setFilteredTasks(tasks);
                } catch (error) {
                    console.error('Error fetching tasks:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchTasks();
        }
    }, [user, userProfile]);

    // --- Filtering Logic ---
    useEffect(() => {
        let result = allTasks;

        // 1. Filter by Search
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.title.toLowerCase().includes(lowerQ) ||
                t.description.toLowerCase().includes(lowerQ)
            );
        }

        // 2. Filter by Status
        if (filterType !== 'all') {
            result = result.filter(t => t.status === filterType);
        }

        setFilteredTasks(result);
    }, [searchQuery, filterType, allTasks]);

    // Stats
    const tasksByStatus = {
        todo: allTasks.filter(t => t.status === 'todo').length,
        'in-progress': allTasks.filter(t => t.status === 'in-progress').length,
        'pending-validation': allTasks.filter(t => t.status === 'pending-validation').length,
        done: allTasks.filter(t => t.status === 'done').length,
    };

    // Transform tasks for carousel
    const taskSlides: TaskSlide[] = filteredTasks.map(t => ({
        id: t.id!,
        title: t.title,
        description: t.description,
        assignee: t.assigneeUsername || '',
        date: t.timeline?.dueDate || '',
        status: t.status,
        priority: t.priority,
        amount: t.pricing?.amount
    }));

    const dockItems = [
        {
            icon: <Plus size={24} />,
            label: "Create Task",
            onClick: () => router.push('/dashboard/tasks/create')
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
                            Task Hub
                        </motion.div>

                        <SplitText
                            text="Your Tasks,"
                            className="text-6xl font-bold text-gray-900 tracking-tight leading-none"
                            delay={100}
                        />
                        <SplitText
                            text="Organized."
                            className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#008080] to-teal-600 tracking-tight leading-tight pb-4"
                            delay={300}
                        />

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="text-lg text-gray-500 max-w-md leading-relaxed mt-4"
                        >
                            Track progress, meet deadlines, and deliver outstanding work.
                            All your tasks in one beautiful hub.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="grid grid-cols-2 gap-4 max-w-sm"
                    >
                        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                            <h3 className="text-3xl font-bold text-gray-900">{tasksByStatus.todo}</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">To Do</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                            <h3 className="text-3xl font-bold text-blue-600">{tasksByStatus['in-progress']}</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">In Progress</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                            <h3 className="text-3xl font-bold text-amber-600">{tasksByStatus['pending-validation']}</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Pending</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                            <h3 className="text-3xl font-bold text-green-600">{tasksByStatus.done}</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Done</p>
                        </div>
                    </motion.div>
                </div>

                {/* --- Right Column: 3D Task Carousel (65%) --- */}
                <div className="flex-1 h-full relative flex items-center justify-center" style={{ perspective: '2000px' }}>
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="animate-spin text-[#008080]" size={40} />
                        </div>
                    ) : filteredTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center opacity-50">
                            <CheckSquare size={64} className="text-gray-300 mb-4" />
                            <p className="text-xl font-medium text-gray-400">No tasks found</p>
                            <button
                                onClick={() => router.push('/dashboard/tasks/create')}
                                className="mt-6 px-6 py-3 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold transition-all inline-flex items-center gap-2"
                            >
                                <Plus size={18} />
                                Create Task
                            </button>
                        </div>
                    ) : (
                        <ThreeDTaskCarousel
                            key={filterType + searchQuery + filteredTasks.length}
                            slides={taskSlides}
                            onReview={(id) => router.push(`/dashboard/tasks/${id}`)}
                        />
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
                                    placeholder="Filter tasks..."
                                    className="pl-9 pr-4 py-2 bg-transparent border-none outline-none text-sm w-[200px] text-gray-800 placeholder:text-gray-400"
                                    autoFocus
                                />
                            </div>
                            <div className="h-6 w-px bg-gray-200 mx-1" />
                            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
                                {[
                                    { id: 'all', label: 'All' },
                                    { id: 'todo', label: 'To Do' },
                                    { id: 'in-progress', label: 'Active' },
                                    { id: 'pending-validation', label: 'Pending' },
                                    { id: 'done', label: 'Done' }
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

            {/* --- Fixed Dock --- */}
            <Dock items={dockItems} />
        </div>
    );
}
