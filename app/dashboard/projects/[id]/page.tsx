'use client';

import { Fragment, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { TaskService } from '@/lib/services/task-service';
import { ProfileService } from '@/lib/services/profile-service';
import { Project, Task } from '@/lib/types/workspace.types';
import {
    Loader2, Briefcase, ArrowLeft, Plus, Users, Calendar, DollarSign, Settings,
    UserPlus, Clock, CheckCircle2, Circle, AlertCircle, Globe, Eye, X, ArrowRight,
    Layers, Search, FileText
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useInView } from 'framer-motion';
import { Dialog, Transition } from '@headlessui/react';

import SendProjectInviteModal from '@/components/AddMemberModal';
import AITeamMatcherModal from '@/components/projects/AITeamMatcherModal';
import ProjectTaskGeneratorModal from '@/components/projects/ProjectTaskGeneratorModal';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';
import CircularGallery from '@/components/ui/CircularGallery';

// ==========================================
// UTILITIES & HELPERS
// ==========================================

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');
const transitionSpring = { type: 'spring' as const, stiffness: 300, damping: 30 };

// ==========================================
// COUNT UP COMPONENT
// ==========================================

function CountUp({ to, from = 0, duration = 2, className = '' }: any) {
    const ref = useRef<HTMLSpanElement>(null);
    const motionValue = useMotionValue(from);
    const springValue = useSpring(motionValue, { damping: 20 + 40 * (1 / duration), stiffness: 100 * (1 / duration) });
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (ref.current) ref.current.textContent = String(from);
    }, [from]);

    useEffect(() => {
        if (isInView) motionValue.set(to);
    }, [isInView, motionValue, to]);

    useEffect(() => {
        const unsubscribe = springValue.on('change', (latest) => {
            if (ref.current) ref.current.textContent = String(Math.floor(latest));
        });
        return () => unsubscribe();
    }, [springValue]);

    return <span className={className} ref={ref} />;
}

// ==========================================
// ELASTIC DOCK COMPONENT
// ==========================================

function DockItem({ children, className = '', onClick, mouseX, label, baseItemSize = 45, magnification = 70, distance = 150 }: any) {
    const ref = useRef<HTMLDivElement>(null);
    const isHovered = useMotionValue(0);
    const mouseDistance = useTransform(mouseX, (val: number) => {
        const rect = ref.current?.getBoundingClientRect() ?? { x: 0, width: baseItemSize };
        return val - rect.x - baseItemSize / 2;
    });
    const targetSize = useTransform(mouseDistance, [-distance, 0, distance], [baseItemSize, magnification, baseItemSize]);
    const size = useSpring(targetSize, { mass: 0.1, stiffness: 150, damping: 12 });
    const [labelVisible, setLabelVisible] = useState(false);

    return (
        <motion.div
            ref={ref}
            style={{ width: size, height: size }}
            onHoverStart={() => { isHovered.set(1); setLabelVisible(true); }}
            onHoverEnd={() => { isHovered.set(0); setLabelVisible(false); }}
            onClick={onClick}
            className={cn(
                "relative inline-flex items-center justify-center rounded-2xl",
                "bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700",
                "shadow-lg cursor-pointer hover:border-teal-500/50 transition-colors",
                className
            )}
        >
            <AnimatePresence>
                {labelVisible && label && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, x: "-50%" }}
                        animate={{ opacity: 1, y: -45, x: "-50%" }}
                        exit={{ opacity: 0, y: 10, x: "-50%" }}
                        className="absolute left-1/2 top-0 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-50 pointer-events-none font-bold tracking-wide"
                    >
                        {label}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="flex items-center justify-center w-full h-full text-gray-600 dark:text-gray-300">{children}</div>
        </motion.div>
    );
}

function Dock({ items, className = '' }: any) {
    const mouseX = useMotionValue(Infinity);

    return (
        <motion.div
            onMouseMove={(e) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
            className={cn(
                "flex items-end h-[65px] gap-3 px-4 pb-2.5 rounded-3xl",
                "bg-gray-50/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-zinc-800/50",
                "shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]",
                className
            )}
        >
            {items.map((item: any, idx: number) => (
                <DockItem key={idx} onClick={item.onClick} mouseX={mouseX} label={item.label} baseItemSize={40} magnification={65}>
                    {item.icon}
                </DockItem>
            ))}
        </motion.div>
    );
}

// ==========================================
// ANIMATED TEXT
// ==========================================

const AnimatedText = ({ text, className, delay = 0 }: { text: string, className?: string, delay?: number }) => {
    const letters = Array.from(text);
    const container = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.03, delayChildren: delay } }
    };
    const child = {
        visible: { opacity: 1, y: 0, transition: transitionSpring },
        hidden: { opacity: 0, y: 20, transition: transitionSpring }
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

// ==========================================
// SPOTLIGHT CARD (LIGHT THEME VERSION)
// ==========================================

const SpotlightCardLight = ({ children, className = '', spotlightColor = 'rgba(0, 128, 128, 0.15)' }: any) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!divRef.current || isFocused) return;
        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onFocus={() => { setIsFocused(true); setOpacity(0.6); }}
            onBlur={() => { setIsFocused(false); setOpacity(0); }}
            onMouseEnter={() => setOpacity(0.6)}
            onMouseLeave={() => setOpacity(0)}
            className={`relative rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden p-5 transition-all hover:shadow-lg hover:border-teal-300 ${className}`}
        >
            <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-in-out"
                style={{
                    opacity,
                    background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`
                }}
            />
            {children}
        </div>
    );
};

// ==========================================
// TASK CARD (Light Theme SpotlightCard)
// ==========================================

const TaskCard = ({ task, onClick }: { task: Task, onClick: () => void }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'todo': return { bg: 'bg-gray-100', text: 'text-gray-600', icon: Circle, label: 'To Do' };
            case 'in-progress': return { bg: 'bg-blue-100', text: 'text-blue-600', icon: Clock, label: 'In Progress' };
            case 'pending-validation': return { bg: 'bg-amber-100', text: 'text-amber-600', icon: AlertCircle, label: 'Pending' };
            case 'done': return { bg: 'bg-green-100', text: 'text-green-600', icon: CheckCircle2, label: 'Done' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-600', icon: Circle, label: status };
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

    const status = getStatusColor(task.status);
    const StatusIcon = status.icon;

    return (
        <SpotlightCardLight className="cursor-pointer group h-full">
            <div onClick={onClick} className="h-full flex flex-col">
                {/* Status & Priority Labels */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className={`${status.bg} ${status.text} px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1`}>
                        <StatusIcon size={10} />
                        {status.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                    </span>
                </div>

                <h4 className="text-gray-900 dark:text-white font-bold text-sm mb-1 line-clamp-2 group-hover:text-[#008080] transition-colors">
                    {task.title}
                </h4>
                <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2 mb-3 flex-1">{task.description}</p>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-zinc-800 text-xs">
                    {task.assigneeUsername && (
                        <span className="text-gray-400">@{task.assigneeUsername}</span>
                    )}
                    {task.pricing && (
                        <span className="text-[#008080] font-bold">${task.pricing.amount}</span>
                    )}
                </div>
            </div>
        </SpotlightCardLight>
    );
};

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const projectId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isOwner, setIsOwner] = useState(false);
    const [isSupervisor, setIsSupervisor] = useState(false);
    const [budgetStatus, setBudgetStatus] = useState<{ totalBudget: number; spent: number; remaining: number; } | null>(null);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [isAIMatcherOpen, setIsAIMatcherOpen] = useState(false);
    const [isTaskGeneratorOpen, setIsTaskGeneratorOpen] = useState(false);

    // Modal states for popups
    const [showTaskModePopup, setShowTaskModePopup] = useState(false);

    // Search/filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in-progress' | 'pending-validation' | 'done'>('all');

    // Team member gallery data
    const [teamMemberCards, setTeamMemberCards] = useState<any[]>([]);

    const handleAssignmentsApplied = async () => {
        const updatedTasks = await TaskService.getProjectTasks(projectId);
        setTasks(updatedTasks);
    };

    useEffect(() => {
        if (user && projectId) {
            const fetchData = async () => {
                try {
                    const hasAccess = await EnhancedProjectService.hasAccess(projectId, user.uid);
                    if (!hasAccess) {
                        router.push('/dashboard/projects');
                        return;
                    }

                    const [projectData, allTasks, ownerCheck, supervisorCheck, budgetData] = await Promise.all([
                        EnhancedProjectService.getProject(projectId),
                        TaskService.getProjectTasks(projectId),
                        EnhancedProjectService.isOwner(projectId, user.uid),
                        EnhancedProjectService.isSupervisor(projectId, user.uid),
                        EnhancedProjectService.getProjectBudgetStatus(projectId)
                    ]);

                    setProject(projectData);
                    if (ownerCheck || supervisorCheck) {
                        setTasks(allTasks);
                    } else {
                        setTasks(allTasks.filter(t => t.assigneeId === user.uid || t.createdBy === user.uid));
                    }
                    setIsOwner(ownerCheck);
                    setIsSupervisor(supervisorCheck);
                    setBudgetStatus(budgetData);
                } catch (error) {
                    console.error('Error fetching project:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [user, projectId]);

    // Fetch team member profiles for gallery
    useEffect(() => {
        if (!project?.members || project.members.length === 0) {
            setTeamMemberCards([]);
            return;
        }

        let cancelled = false;

        const load = async () => {
            try {
                const uniqueMembers = Array.from(
                    new Map(project.members.map(m => [m.userId, m])).values()
                );

                const enriched = await Promise.all(
                    uniqueMembers.map(async (m: any) => {
                        const profile = await ProfileService.getUserProfile(m.userId);
                        const photoURL = (profile as any)?.photoURL as string | undefined;
                        const displayName = (profile as any)?.displayName as string | undefined;
                        const username = (profile as any)?.username as string | undefined;

                        const title = displayName || username || m.username || 'Member';
                        const subTitle = m.role === 'owner' ? 'Owner' : m.role === 'supervisor' ? 'Supervisor' : 'Member';

                        const image = photoURL
                            ? photoURL
                            : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.username || title)}&backgroundColor=b6e3f4`;

                        return {
                            userId: m.userId,
                            title,
                            subTitle,
                            image,
                            onClick: () => router.push(`/${username || m.username}`)
                        };
                    })
                );

                if (!cancelled) setTeamMemberCards(enriched);
            } catch (e) {
                console.error('Failed to load team member profiles', e);
                if (!cancelled) {
                    const fallback = project.members.map((m: any) => ({
                        userId: m.userId,
                        title: m.username || 'Member',
                        subTitle: m.role === 'owner' ? 'Owner' : m.role === 'supervisor' ? 'Supervisor' : 'Member',
                        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.username || 'member')}&backgroundColor=b6e3f4`,
                        onClick: () => router.push(`/${m.username}`)
                    }));
                    setTeamMemberCards(fallback);
                }
            }
        };

        load();
        return () => { cancelled = true; };
    }, [project?.id, project?.members, router]);

    const handleRemoveMember = async (userId: string, username: string) => {
        if (!confirm(`Remove @${username} from this project?`)) return;
        try {
            await EnhancedProjectService.removeMember(projectId, userId);
            const updatedProject = await EnhancedProjectService.getProject(projectId);
            setProject(updatedProject);
        } catch (error: any) {
            alert(error.message || 'Failed to remove member');
        }
    };

    const canManage = isOwner || isSupervisor;

    // Filter tasks
    const filteredTasks = useMemo(() => {
        let result = tasks;

        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.title.toLowerCase().includes(lowerQ) ||
                t.description.toLowerCase().includes(lowerQ)
            );
        }

        if (statusFilter !== 'all') {
            result = result.filter(t => t.status === statusFilter);
        }

        return result;
    }, [tasks, searchQuery, statusFilter]);

    // Task counts
    const taskCounts = useMemo(() => ({
        all: tasks.length,
        todo: tasks.filter(t => t.status === 'todo').length,
        'in-progress': tasks.filter(t => t.status === 'in-progress').length,
        'pending-validation': tasks.filter(t => t.status === 'pending-validation').length,
        done: tasks.filter(t => t.status === 'done').length,
    }), [tasks]);

    // Dock items
    const dockItems = [
        ...(canManage ? [
            { icon: <Plus strokeWidth={2.5} size={18} />, label: "New Task", onClick: () => setShowTaskModePopup(true) },
            { icon: <UserPlus strokeWidth={2.5} size={18} />, label: "Add Member", onClick: () => setShowAddMemberModal(true) },
            { icon: <ConnektAIIcon className="w-5 h-5" />, label: "AI Matcher", onClick: () => setIsAIMatcherOpen(true) },
        ] : []),
        ...(isOwner ? [
            {
                icon: project?.isPublic ? <Eye strokeWidth={2.5} size={18} /> : <Globe strokeWidth={2.5} size={18} />,
                label: project?.isPublic ? "Public" : "Make Public",
                onClick: async () => {
                    if (!project) return;
                    if (project.isPublic) {
                        await EnhancedProjectService.removeFromPublic(projectId);
                        setProject({ ...project, isPublic: false });
                    } else {
                        await EnhancedProjectService.pushToPublic(projectId);
                        setProject({ ...project, isPublic: true });
                    }
                }
            },
        ] : []),
        { icon: <Settings strokeWidth={2.5} size={18} />, label: "Settings", onClick: () => router.push(`/dashboard/projects/${projectId}/settings`) },
    ];

    if (loading) return (
        <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-black">
            <Loader2 className="animate-spin text-teal-500 w-12 h-12" />
        </div>
    );

    if (!project) return (
        <div className="max-w-4xl mx-auto text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <Briefcase size={40} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Project Not Found</h2>
            <button onClick={() => router.push('/dashboard/projects')} className="px-6 py-3 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold">
                Back to Projects
            </button>
        </div>
    );

    const coverImage = (project as any).coverImage || `https://picsum.photos/seed/${project.id}/800/600`;

    return (
        <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white pb-32">

            {/* --- BACKGROUND DECOR --- */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[400px] bg-teal-500/5 blur-[150px] rounded-full pointer-events-none" />

            {/* --- HERO HEADER SECTION --- */}
            <div className="relative max-w-[1400px] mx-auto pt-8 px-6">

                {/* Back Button */}
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => router.push('/dashboard/projects')}
                    className="mb-6 flex items-center gap-2 text-gray-500 hover:text-[#008080] transition-colors font-medium"
                >
                    <ArrowLeft size={18} />
                    Back to Projects
                </motion.button>

                {/* Header Layout: Cover Image (1/4) | Content (3/4) */}
                <div className="flex gap-8 mb-8">
                    {/* Cover Image */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-1/4 aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl shadow-teal-500/10 flex-shrink-0"
                    >
                        <div
                            className="w-full h-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${coverImage})` }}
                        />
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-center">
                        {/* Status Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-3 mb-3"
                        >
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${project.status === 'active' ? 'bg-green-100 text-green-700' :
                                project.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                    'bg-amber-100 text-amber-700'
                                }`}>
                                {project.status}
                            </span>
                            {project.isPublic && (
                                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-700 flex items-center gap-1">
                                    <Globe size={12} /> Public
                                </span>
                            )}
                        </motion.div>

                        {/* Title */}
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
                            <AnimatedText text={project.title} />
                        </h1>

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed"
                        >
                            {project.description}
                        </motion.p>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="max-w-[1400px] mx-auto px-6 space-y-12">

                {/* --- STATS ROW (Smaller) --- */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Deadline", value: project.deadline || 'No deadline', icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/10" },
                        {
                            label: "Budget", icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10",
                            value: budgetStatus ? `$${budgetStatus.spent} / $${budgetStatus.totalBudget}` : `$${project.budget || 0}`
                        },
                        { label: "Members", value: project.members.length, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
                        { label: "Tasks", value: tasks.length, icon: Layers, color: "text-amber-500", bg: "bg-amber-500/10" }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-2xl flex items-center gap-3 hover:scale-[1.02] transition-transform duration-300"
                        >
                            <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={18} />
                            </div>
                            <div>
                                <div className="text-lg font-bold font-mono tracking-tight">
                                    {typeof stat.value === 'number' ? <CountUp to={stat.value} /> : stat.value}
                                </div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* --- FLOATING DOCK --- */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, ...transitionSpring }}
                    className="flex justify-center"
                >
                    <Dock items={dockItems} />
                </motion.div>

                {/* --- SEARCH & FILTER --- */}
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative flex-1 max-w-lg">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search tasks..."
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-zinc-800 rounded-2xl">
                        {[
                            { id: 'all', label: 'All', count: taskCounts.all },
                            { id: 'todo', label: 'To Do', count: taskCounts.todo },
                            { id: 'in-progress', label: 'Active', count: taskCounts['in-progress'] },
                            { id: 'pending-validation', label: 'Pending', count: taskCounts['pending-validation'] },
                            { id: 'done', label: 'Done', count: taskCounts.done }
                        ].map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setStatusFilter(filter.id as any)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${statusFilter === filter.id
                                    ? 'bg-white dark:bg-zinc-900 text-[#008080] shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {filter.label}
                                <span className="bg-gray-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded-md text-[10px]">{filter.count}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- TASKS GRID --- */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-teal-100 dark:bg-teal-900/30 text-teal-600 rounded-xl"><Layers size={20} /></div>
                        <h2 className="text-2xl font-bold">Tasks</h2>
                    </div>

                    {filteredTasks.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredTasks.map((task, index) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <TaskCard
                                        task={task}
                                        onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800">
                            <Layers size={48} className="mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-400 mb-4">No tasks found</p>
                            {canManage && (
                                <button
                                    onClick={() => setShowTaskModePopup(true)}
                                    className="px-5 py-2.5 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold text-sm inline-flex items-center gap-2"
                                >
                                    <Plus size={16} />
                                    Create Task
                                </button>
                            )}
                        </div>
                    )}
                </section>

                {/* --- TEAM MEMBERS (CircularGallery - 30% smaller) --- */}
                {project.members.length > 0 && teamMemberCards.length > 0 && (
                    <section className="pb-20">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl"><Users size={20} /></div>
                            <h2 className="text-2xl font-bold">Team Members</h2>
                        </div>

                        {/* CircularGallery at 70% of original size (476px instead of 680px) */}
                        <CircularGallery items={teamMemberCards} height={476} />
                    </section>
                )}
            </div>

            {/* ==========================================
                MODALS
               ========================================== */}

            {/* Task Creation Mode Popup (Like workspace projectMode popup) */}
            <Transition appear show={showTaskModePopup} as={Fragment}>
                <Dialog as="div" className="relative z-[200]" onClose={() => setShowTaskModePopup(false)}>
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200]" />
                    <div className="fixed inset-0 overflow-y-auto z-[200]">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Dialog.Panel className="relative w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-8 shadow-2xl transition-all">
                                <button
                                    onClick={() => setShowTaskModePopup(false)}
                                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                                <Dialog.Title as="h3" className="text-2xl font-black text-gray-900 dark:text-white mb-8 text-center">
                                    Create a New Task
                                </Dialog.Title>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <button
                                        onClick={() => {
                                            setShowTaskModePopup(false);
                                            setIsTaskGeneratorOpen(true);
                                        }}
                                        className="group relative p-8 rounded-3xl border-2 border-teal-500 bg-teal-50/50 dark:bg-teal-900/10 hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-all text-center overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10" />
                                        <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                            <ConnektAIIcon className="w-10 h-10" />
                                        </div>
                                        <h4 className="text-xl font-bold text-teal-900 dark:text-teal-400 mb-2">AI Generator</h4>
                                        <p className="text-sm text-teal-700/70">Let AI generate tasks based on project description.</p>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setShowTaskModePopup(false);
                                            router.push(`/dashboard/tasks/create?project=${projectId}`);
                                        }}
                                        className="group p-8 rounded-3xl border-2 border-dashed border-gray-200 dark:border-zinc-700 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all text-center"
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 mx-auto mb-6 group-hover:scale-110 transition-transform">
                                            <FileText size={32} />
                                        </div>
                                        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Manual Setup</h4>
                                        <p className="text-sm text-gray-500">Create the task from scratch yourself.</p>
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {project && user && (
                <AITeamMatcherModal
                    isOpen={isAIMatcherOpen}
                    onClose={() => setIsAIMatcherOpen(false)}
                    projectId={projectId}
                    workspaceId={project.workspaceId}
                    currentTasks={tasks}
                    userId={user.uid}
                    onAssignmentsApplied={handleAssignmentsApplied}
                />
            )}

            {project && user && (
                <ProjectTaskGeneratorModal
                    isOpen={isTaskGeneratorOpen}
                    onClose={() => setIsTaskGeneratorOpen(false)}
                    projectId={projectId}
                    workspaceId={project.workspaceId}
                    userId={user.uid}
                    projectDescription={project.description}
                    remainingBudget={budgetStatus ? budgetStatus.remaining : project.budget}
                    currency={(project as any).pricing?.currency || 'GMD'}
                    onTasksAdded={handleAssignmentsApplied}
                />
            )}

            <SendProjectInviteModal
                isOpen={showAddMemberModal}
                onClose={() => setShowAddMemberModal(false)}
                projectId={projectId}
                projectTitle={project?.title || ''}
                projectBudget={project?.budget}
                projectDeadline={project?.deadline}
            />
        </div>
    );
}
