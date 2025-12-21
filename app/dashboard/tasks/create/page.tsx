'use client';

/* 
  =============================================================================
  IMPORTS & DEPENDENCIES
  =============================================================================
*/
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { TaskService } from '@/lib/services/task-service';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { Project, ProjectMember } from '@/lib/types/workspace.types';
import {
    Loader2,
    CheckSquare,
    ArrowLeft,
    Check,
    Calendar,
    DollarSign,
    Clock,
    User,
    Sparkles,
    AlertCircle,
    TrendingUp,
    Briefcase
} from 'lucide-react';
import {
    motion,
    AnimatePresence,
    useMotionValue,
    useMotionValueEvent,
    useTransform,
    animate,
    useSpring,
    useInView
} from 'framer-motion';

/* 
  =============================================================================
  CONSTANTS & CONFIG
  =============================================================================
*/
const MAX_OVERFLOW = 50;

// Decay function for Slider physics
function decay(value: number, max: number) {
    if (max === 0) return 0;
    const entry = value / max;
    const sigmoid = 2 * (1 / (1 + Math.exp(-entry)) - 0.5);
    return sigmoid * max;
}

/* 
  =============================================================================
  COMPONENT: AnimatedText
  (Letter-by-letter animation for headers)
  =============================================================================
*/
const AnimatedText = ({ text, className, delay = 0 }: { text: string, className?: string, delay?: number }) => {
    const letters = Array.from(text);
    const container = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.02, delayChildren: delay } }
    };
    const child = {
        visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 30 } },
        hidden: { opacity: 0, y: 20 }
    };

    return (
        <motion.span variants={container} initial="hidden" animate="visible" className={className}>
            {letters.map((letter, index) => (
                <motion.span variants={child} key={index} className="inline-block">
                    {letter === " " ? "\u00A0" : letter}
                </motion.span>
            ))}
        </motion.span>
    );
};

/* 
  =============================================================================
  COMPONENT: CountUp
  (For Realtime Number Display - 3x faster animation)
  =============================================================================
*/
interface CountUpProps {
    to: number;
    from?: number;
    direction?: 'up' | 'down';
    delay?: number;
    duration?: number;
    className?: string;
    startWhen?: boolean;
    separator?: string;
    prefix?: string;
    onStart?: () => void;
    onEnd?: () => void;
}

function CountUp({
    to,
    from = 0,
    direction = 'up',
    delay = 0,
    duration = 0.35, // 3x faster than original 1s
    className = '',
    startWhen = true,
    separator = '',
    prefix = '',
    onStart,
    onEnd
}: CountUpProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const motionValue = useMotionValue(direction === 'down' ? to : from);

    // Adjusted spring parameters for faster, snappier animation
    const damping = 25 + 50 * (1 / duration);
    const stiffness = 150 * (1 / duration);

    const springValue = useSpring(motionValue, {
        damping,
        stiffness
    });

    const isInView = useInView(ref, { once: true, margin: '0px' });

    const formatValue = useCallback(
        (latest: number) => {
            const options = {
                useGrouping: !!separator,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            };
            const formattedNumber = Intl.NumberFormat('en-US', options).format(latest);
            return prefix + (separator ? formattedNumber.replace(/,/g, separator) : formattedNumber);
        },
        [separator, prefix]
    );

    useEffect(() => {
        if (ref.current) {
            ref.current.textContent = formatValue(direction === 'down' ? to : from);
        }
    }, [from, to, direction, formatValue]);

    useEffect(() => {
        if (isInView && startWhen) {
            if (typeof onStart === 'function') onStart();

            const timeoutId = setTimeout(() => {
                motionValue.set(direction === 'down' ? from : to);
            }, delay * 1000);

            const durationTimeoutId = setTimeout(
                () => {
                    if (typeof onEnd === 'function') onEnd();
                },
                delay * 1000 + duration * 1000
            );

            return () => {
                clearTimeout(timeoutId);
                clearTimeout(durationTimeoutId);
            };
        }
    }, [isInView, startWhen, motionValue, direction, from, to, delay, onStart, onEnd, duration]);

    useEffect(() => {
        const unsubscribe = springValue.on('change', latest => {
            if (ref.current) {
                ref.current.textContent = formatValue(latest);
            }
        });
        return () => unsubscribe();
    }, [springValue, formatValue]);

    return <span className={className} ref={ref} />;
}

/* 
  =============================================================================
  COMPONENT: ElasticSlider
  (For Budget Allocation with physics)
  =============================================================================
*/
interface ElasticSliderProps {
    defaultValue?: number;
    startingValue?: number;
    maxValue?: number;
    className?: string;
    isStepped?: boolean;
    stepSize?: number;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    onChange?: (value: number) => void;
}

function ElasticSlider({
    defaultValue = 50,
    startingValue = 0,
    maxValue = 100,
    className = '',
    isStepped = false,
    stepSize = 1,
    leftIcon = <span className="text-xl font-bold text-gray-400">-</span>,
    rightIcon = <span className="text-xl font-bold text-gray-400">+</span>,
    onChange
}: ElasticSliderProps) {
    return (
        <div className={`flex flex-col items-center justify-center gap-4 w-full ${className}`}>
            <SliderCore
                defaultValue={defaultValue}
                startingValue={startingValue}
                maxValue={maxValue}
                isStepped={isStepped}
                stepSize={stepSize}
                leftIcon={leftIcon}
                rightIcon={rightIcon}
                onChange={onChange}
            />
        </div>
    );
}

function SliderCore({ defaultValue, startingValue, maxValue, isStepped, stepSize, leftIcon, rightIcon, onChange }: any) {
    const [value, setValue] = useState(defaultValue);
    const sliderRef = useRef<HTMLDivElement>(null);
    const [region, setRegion] = useState('middle');
    const clientX = useMotionValue(0);
    const overflow = useMotionValue(0);
    const scale = useMotionValue(1);

    useEffect(() => {
        setValue(defaultValue);
    }, [defaultValue]);

    useMotionValueEvent(clientX, 'change', latest => {
        if (sliderRef.current) {
            const { left, right } = sliderRef.current.getBoundingClientRect();
            let newValue;

            if (latest < left) {
                setRegion('left');
                newValue = left - latest;
            } else if (latest > right) {
                setRegion('right');
                newValue = latest - right;
            } else {
                setRegion('middle');
                newValue = 0;
            }

            overflow.jump(decay(newValue, MAX_OVERFLOW));
        }
    });

    const handlePointerMove = (e: any) => {
        if (e.buttons > 0 && sliderRef.current) {
            const { left, width } = sliderRef.current.getBoundingClientRect();
            let newValue = startingValue + ((e.clientX - left) / width) * (maxValue - startingValue);

            if (isStepped) {
                newValue = Math.round(newValue / stepSize) * stepSize;
            }

            newValue = Math.min(Math.max(newValue, startingValue), maxValue);
            setValue(newValue);
            if (onChange) onChange(newValue);
            clientX.jump(e.clientX);
        }
    };

    const handlePointerDown = (e: any) => {
        handlePointerMove(e);
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerUp = () => {
        animate(overflow, 0, { type: 'spring', bounce: 0.5 });
    };

    const getRangePercentage = () => {
        const totalRange = maxValue - startingValue;
        if (totalRange === 0) return 0;
        return ((value - startingValue) / totalRange) * 100;
    };

    return (
        <>
            <motion.div
                onHoverStart={() => animate(scale, 1.05)}
                onHoverEnd={() => animate(scale, 1)}
                onTouchStart={() => animate(scale, 1.05)}
                onTouchEnd={() => animate(scale, 1)}
                style={{
                    scale,
                }}
                className="flex w-full touch-none select-none items-center justify-center gap-6 relative z-10"
            >
                <motion.div
                    animate={{
                        scale: region === 'left' ? [1, 1.2, 1] : 1,
                        transition: { duration: 0.25 }
                    }}
                    style={{
                        x: useTransform(() => (region === 'left' ? -overflow.get() / scale.get() : 0))
                    }}
                    className="cursor-pointer hover:text-teal-500 transition-colors"
                    onClick={() => {
                        const n = Math.max(startingValue, value - (maxValue / 10));
                        setValue(n);
                        if (onChange) onChange(n);
                    }}
                >
                    {leftIcon}
                </motion.div>

                <div
                    ref={sliderRef}
                    className="relative flex w-full flex-grow cursor-grab active:cursor-grabbing touch-none select-none items-center py-6 group"
                    onPointerMove={handlePointerMove}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                >
                    {/* Track Background */}
                    <div className="absolute w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden"></div>

                    <motion.div
                        style={{
                            scaleX: useTransform(() => {
                                if (sliderRef.current) {
                                    const { width } = sliderRef.current.getBoundingClientRect();
                                    return 1 + overflow.get() / width;
                                }
                                return 1;
                            }),
                            scaleY: useTransform(overflow, [0, MAX_OVERFLOW], [1, 0.8]),
                            transformOrigin: useTransform(() => {
                                if (sliderRef.current) {
                                    const { left, width } = sliderRef.current.getBoundingClientRect();
                                    return clientX.get() < left + width / 2 ? 'right' : 'left';
                                }
                                return 'center';
                            }),
                            height: useTransform(scale, [1, 1.2], [8, 16]),
                        }}
                        className="flex flex-grow relative h-2"
                    >
                        <div className="relative h-full flex-grow rounded-full overflow-hidden">
                            <div className="absolute inset-0 bg-gray-200 dark:bg-zinc-700 opacity-50" />
                            <div
                                className="absolute h-full bg-gradient-to-r from-teal-500 to-emerald-400 shadow-[0_0_15px_rgba(20,184,166,0.5)] rounded-full transition-all duration-75 ease-linear"
                                style={{ width: `${getRangePercentage()}%` }}
                            />
                        </div>
                        {/* Thumb */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 border-teal-500 rounded-full shadow-lg z-20 pointer-events-none transform transition-transform"
                            style={{
                                left: `${getRangePercentage()}%`,
                                transform: `translate(-50%, -50%) scale(${scale.get() * 1.2})`
                            }}
                        />
                    </motion.div>
                </div>

                <motion.div
                    animate={{
                        scale: region === 'right' ? [1, 1.2, 1] : 1,
                        transition: { duration: 0.25 }
                    }}
                    style={{
                        x: useTransform(() => (region === 'right' ? overflow.get() / scale.get() : 0))
                    }}
                    className="cursor-pointer hover:text-teal-500 transition-colors"
                    onClick={() => {
                        const n = Math.min(maxValue, value + (maxValue / 10));
                        setValue(n);
                        if (onChange) onChange(n);
                    }}
                >
                    {rightIcon}
                </motion.div>
            </motion.div>

            <div className="flex justify-between w-full text-xs font-mono text-gray-400 px-2 mt-[-10px]">
                <span>{startingValue.toFixed(2)}</span>
                <span className="text-teal-600 font-bold">
                    <CountUp to={value} prefix="" duration={0.25} />
                </span>
                <span>{maxValue.toFixed(2)}</span>
            </div>
        </>
    );
}

/* 
  =============================================================================
  MAIN PAGE COMPONENT
  =============================================================================
*/
export default function CreateTaskPage() {
    const { user, userProfile } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const projectIdParam = searchParams.get('project');

    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
    const [formData, setFormData] = useState({
        projectId: projectIdParam || '',
        title: '',
        description: '',
        priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
        assigneeId: '',
        dueDate: '',
        estimatedHours: '',
        amount: '',
        currency: 'GMD'
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [budgetStatus, setBudgetStatus] = useState<{
        totalBudget: number;
        spent: number;
        remaining: number;
        currency?: string;
    } | null>(null);
    const [isOverBudget, setIsOverBudget] = useState(false);

    useEffect(() => {
        if (user) {
            const fetchProjects = async () => {
                const [owned, assigned] = await Promise.all([
                    EnhancedProjectService.getUserProjects(user.uid),
                    EnhancedProjectService.getAssignedProjects(user.uid)
                ]);
                const allProjects = [...owned, ...assigned];
                setProjects(allProjects);

                if (!projectIdParam && allProjects.length > 0) {
                    setFormData(prev => ({ ...prev, projectId: allProjects[0].id! }));
                }
            };
            fetchProjects();
        }
    }, [user, projectIdParam]);

    // Fetch budget status and members when project changes
    useEffect(() => {
        if (formData.projectId) {
            // Fetch Budget
            EnhancedProjectService.getProjectBudgetStatus(formData.projectId)
                .then(setBudgetStatus)
                .catch(console.error);

            // Fetch Members
            EnhancedProjectService.getProject(formData.projectId)
                .then(project => {
                    if (project) {
                        setProjectMembers(project.members || []);
                    }
                })
                .catch(console.error);
        } else {
            setProjectMembers([]);
        }
    }, [formData.projectId]);

    // Real-time budget validation effect
    useEffect(() => {
        if (budgetStatus && formData.amount) {
            const amount = parseFloat(formData.amount);
            const overBudget = amount > budgetStatus.remaining;
            setIsOverBudget(overBudget);
        } else {
            setIsOverBudget(false);
        }
    }, [formData.amount, budgetStatus]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Handler for Slider
    const handleBudgetSliderChange = (val: number) => {
        setFormData(prev => ({ ...prev, amount: val.toFixed(2) }));
        if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.projectId) newErrors.projectId = 'Please select a project';
        if (!formData.title.trim()) newErrors.title = 'Task title is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Payment amount must be greater than 0';

        // Budget validation
        if (budgetStatus && parseFloat(formData.amount) > budgetStatus.remaining) {
            newErrors.amount = `Amount exceeds remaining budget (${budgetStatus.currency || 'GMD'} ${budgetStatus.remaining.toFixed(2)})`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate() || !user || !userProfile) return;

        const selectedProject = projects.find(p => p.id === formData.projectId);
        if (!selectedProject) return;

        setLoading(true);
        try {
            const taskId = await TaskService.createTask({
                projectId: formData.projectId,
                workspaceId: selectedProject.workspaceId,
                title: formData.title,
                description: formData.description,
                priority: formData.priority,
                createdBy: user.uid,
                assigneeId: formData.assigneeId || undefined,
                assigneeUsername: formData.assigneeId ? projectMembers.find(m => m.userId === formData.assigneeId)?.username : undefined,
                timeline: {
                    dueDate: formData.dueDate || undefined,
                    estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined
                },
                pricing: {
                    amount: parseFloat(formData.amount),
                    currency: formData.currency,
                    paymentStatus: 'unpaid'
                }
            });

            router.push(`/dashboard/tasks/${taskId}`);
        } catch (error: any) {
            console.error('Error creating task:', error);
            if (error.message?.includes('exceeds remaining project budget')) {
                setErrors({ amount: error.message });
            } else {
                alert('Failed to create task. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const selectedProject = projects.find(p => p.id === formData.projectId);

    /* 
      EMPTY STATE
    */
    if (projects.length === 0 && !loading) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto text-center py-24 relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-50/20 to-transparent dark:via-teal-900/10 pointer-events-none" />
                <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-tr from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center shadow-2xl ring-4 ring-white dark:ring-zinc-900">
                    <CheckSquare size={48} className="text-gray-400" />
                </div>
                <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                    Create a Project First
                </h2>
                <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-md mx-auto">
                    Tasks must belong to a project. Create a project before creating tasks to unlock the full potential of Connekt.
                </p>
                <button
                    onClick={() => router.push('/dashboard/projects/create')}
                    className="px-8 py-4 bg-[#008080] hover:bg-teal-600 text-white rounded-2xl font-bold inline-flex items-center gap-3 transition-all shadow-[0_10px_20px_rgba(0,128,128,0.3)] hover:shadow-[0_15px_30px_rgba(0,128,128,0.4)] hover:-translate-y-1"
                >
                    <Sparkles size={20} />
                    Create Project
                </button>
            </motion.div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-24 relative">
            {/* 
                BACKGROUND DECORATION 
             */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50/40 via-transparent to-transparent dark:from-teal-900/10" />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 10, repeat: Infinity }}
                    className="absolute top-20 right-20 w-96 h-96 bg-teal-200/20 dark:bg-teal-900/20 rounded-full blur-3xl"
                />
            </div>

            {/* 
                HEADER SECTION
            */}
            <div className="mb-12 relative">
                <motion.button
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#008080] transition-colors mb-6 group font-medium"
                >
                    <div className="p-2 rounded-full bg-white dark:bg-zinc-800 shadow-sm group-hover:shadow-md transition-all group-hover:-translate-x-1">
                        <ArrowLeft size={18} />
                    </div>
                    <span>Back to Dashboard</span>
                </motion.button>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-4">
                    <motion.div
                        initial={{ scale: 0.8, rotate: -10, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#008080] via-teal-500 to-teal-400 flex items-center justify-center text-white shadow-2xl shadow-teal-500/30 ring-4 ring-white dark:ring-zinc-900"
                    >
                        <CheckSquare size={36} />
                    </motion.div>
                    <div>
                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl font-black text-gray-900 dark:text-white tracking-tight"
                        >
                            <AnimatedText text="Create Task" />
                        </motion.h1>
                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg text-gray-500 dark:text-gray-400 mt-2 font-medium"
                        >
                            Allocate budget from your project and assign work.
                        </motion.p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* 
                   MAIN FORM CARD
                */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COLUMN: Inputs */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="lg:col-span-2 space-y-6"
                    >
                        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-zinc-800 p-8 shadow-xl">
                            {/* Project Selection */}
                            <div className="mb-6">
                                <label htmlFor="projectId" className="block text-sm font-bold text-gray-900 dark:text-white mb-2 ml-1">
                                    Target Project
                                </label>
                                <div className="relative">
                                    <select
                                        id="projectId"
                                        name="projectId"
                                        value={formData.projectId}
                                        onChange={handleChange}
                                        className={`w-full px-5 py-4 bg-gray-50 dark:bg-zinc-800/50 border ${errors.projectId ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'
                                            } rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#008080] appearance-none font-medium transition-all hover:bg-white dark:hover:bg-zinc-800`}
                                    >
                                        {projects.map(project => (
                                            <option key={project.id} value={project.id}>
                                                {project.title}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <Briefcase size={18} />
                                    </div>
                                </div>
                                {errors.projectId && <p className="mt-2 text-sm text-red-500 ml-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.projectId}</p>}
                            </div>

                            {/* Task Title */}
                            <div className="mb-6">
                                <label htmlFor="title" className="block text-sm font-bold text-gray-900 dark:text-white mb-2 ml-1">
                                    Task Title
                                </label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="e.g. Design homepage hero section"
                                        className={`w-full px-5 py-4 bg-gray-50 dark:bg-zinc-800/50 border ${errors.title ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'
                                            } rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#008080] font-bold text-lg placeholder:font-normal transition-all group-hover:bg-white dark:group-hover:bg-zinc-800`}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#008080] transition-colors">
                                        <Sparkles size={20} />
                                    </div>
                                </div>
                                {errors.title && <p className="mt-2 text-sm text-red-500 ml-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.title}</p>}
                            </div>

                            {/* Description */}
                            <div className="mb-6">
                                <label htmlFor="description" className="block text-sm font-bold text-gray-900 dark:text-white mb-2 ml-1">
                                    Description & Requirements
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Describe what needs to be done, deliverables, and specific requirements..."
                                    className={`w-full px-5 py-4 bg-gray-50 dark:bg-zinc-800/50 border ${errors.description ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'
                                        } rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#008080] resize-none transition-all hover:bg-white dark:hover:bg-zinc-800`}
                                />
                                {errors.description && <p className="mt-2 text-sm text-red-500 ml-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.description}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-6">
                                {/* Priority */}
                                <div>
                                    <label htmlFor="priority" className="block text-sm font-bold text-gray-900 dark:text-white mb-2 ml-1">
                                        Priority
                                    </label>
                                    <select
                                        id="priority"
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleChange}
                                        className="w-full px-5 py-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#008080]"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>

                                {/* Assignee */}
                                <div>
                                    <label htmlFor="assigneeId" className="block text-sm font-bold text-gray-900 dark:text-white mb-2 ml-1 flex items-center gap-2">
                                        <User size={14} className="text-[#008080]" />
                                        Assign To
                                    </label>
                                    <select
                                        id="assigneeId"
                                        name="assigneeId"
                                        value={formData.assigneeId}
                                        onChange={handleChange}
                                        className="w-full px-5 py-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#008080]"
                                    >
                                        <option value="">-- Unassigned --</option>
                                        {projectMembers.map(member => (
                                            <option key={member.userId} value={member.userId}>
                                                @{member.username} ({member.role})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="dueDate" className="block text-sm font-bold text-gray-900 dark:text-white mb-2 ml-1 flex items-center gap-2">
                                        <Calendar size={14} className="text-[#008080]" />
                                        Due Date
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            id="dueDate"
                                            name="dueDate"
                                            value={formData.dueDate}
                                            onChange={handleChange}
                                            className="w-full px-5 py-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#008080]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="estimatedHours" className="block text-sm font-bold text-gray-900 dark:text-white mb-2 ml-1 flex items-center gap-2">
                                        <Clock size={14} className="text-[#008080]" />
                                        Estimated Hours
                                    </label>
                                    <input
                                        type="number"
                                        id="estimatedHours"
                                        name="estimatedHours"
                                        value={formData.estimatedHours}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.5"
                                        placeholder="0"
                                        className="w-full px-5 py-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#008080]"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* RIGHT COLUMN: Budget & Submit */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-6"
                    >
                        {/* Project Budget Card */}
                        <div className={`bg-gradient-to-br from-[#008080] to-teal-700 rounded-3xl p-6 text-white shadow-2xl shadow-teal-500/20 relative overflow-hidden transition-all ${isOverBudget ? 'ring-4 ring-red-500/50' : ''}`}>
                            <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                                        <TrendingUp size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">Project Budget</h3>
                                        <p className="text-teal-100 text-xs opacity-80">
                                            {selectedProject?.title || 'Select a project'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8 relative z-10">
                                <p className="text-teal-100 text-sm mb-1">Remaining Balance</p>
                                <div className="text-5xl font-black tracking-tight flex items-baseline gap-1">
                                    <span className="text-2xl opacity-70">{budgetStatus?.currency || 'GMD'}</span>
                                    <CountUp
                                        to={budgetStatus?.remaining || 0}
                                        separator=","
                                        duration={0.35}
                                    />
                                </div>
                            </div>

                            {/* Mini Stat Grid */}
                            <div className="grid grid-cols-2 gap-3 relative z-10">
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                                    <p className="text-xs text-teal-100 mb-1">Total Budget</p>
                                    <p className="font-bold text-lg flex items-center gap-1">
                                        {budgetStatus?.currency || 'GMD'} <CountUp to={budgetStatus?.totalBudget || 0} duration={0.35} />
                                    </p>
                                </div>
                                <div className={`bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 transition-colors ${isOverBudget ? 'bg-red-500/20 border-red-400/50' : ''
                                    }`}>
                                    <p className="text-xs text-teal-100 mb-1">This Task</p>
                                    <p className={`font-bold text-lg flex items-center gap-1 ${isOverBudget ? 'text-red-200' : ''
                                        }`}>
                                        {budgetStatus?.currency || 'GMD'} <CountUp
                                            to={parseFloat(formData.amount || '0')}
                                            duration={0.25}
                                        />
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Budget Control Panel */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-8 shadow-lg">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <DollarSign className="text-[#008080]" />
                                Allocate Budget
                            </h3>

                            {/* The Elastic Slider */}
                            <div className="mb-8 py-4">
                                <ElasticSlider
                                    startingValue={0}
                                    maxValue={budgetStatus?.remaining ?? 0}
                                    defaultValue={parseFloat(formData.amount || '0')}
                                    onChange={handleBudgetSliderChange}
                                    isStepped={true}
                                    stepSize={10}
                                    leftIcon={<span className="text-2xl font-bold text-gray-400 select-none">-</span>}
                                    rightIcon={<span className="text-2xl font-bold text-gray-400 select-none">+</span>}
                                />
                            </div>

                            {/* Manual Override Input */}
                            <div className="relative">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Manual Entry</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleChange}
                                        className={`w-full px-5 py-3 bg-gray-50 dark:bg-zinc-800 border ${errors.amount ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'
                                            } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080] font-mono font-bold text-gray-900 dark:text-white pl-16`}
                                        placeholder="0.00"
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        <span className="font-bold">{budgetStatus?.currency || 'GMD'}</span>
                                    </div>
                                </div>
                                {errors.amount && <p className="mt-2 text-sm text-red-500 flex items-center gap-1"><AlertCircle size={14} /> {errors.amount}</p>}
                            </div>
                        </div>

                        {/* Submit Action */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-5 bg-gradient-to-r from-[#008080] to-teal-600 hover:from-teal-600 hover:to-[#008080] text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={24} />
                                    <span>Creating Task...</span>
                                </>
                            ) : (
                                <>
                                    <Check size={24} className="group-hover:scale-125 transition-transform" />
                                    <span>Create Task</span>
                                </>
                            )}
                        </motion.button>

                        <div className="text-center">
                            <p className="text-xs text-gray-400">
                                Budget will be allocated from the project's escrow funds.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </form>
        </div>
    );
}
