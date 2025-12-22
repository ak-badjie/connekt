'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { TaskService } from '@/lib/services/task-service';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { Task, Project } from '@/lib/types/workspace.types';
import {
    Loader2, ArrowLeft, Clock, DollarSign, Calendar, AlertCircle,
    CheckCircle2, XCircle, Upload, Link as LinkIcon, Image, Video,
    FileText, CheckCheck, X, Send, UserPlus, Circle, ChevronRight,
    Briefcase, Play, MessageCircle, Layers, Settings, Edit
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import AssignTaskModal from '@/components/AssignTaskModal';
import SpotlightCard from '@/components/ui/SpotlightCard';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';

// ==========================================
// UTILITIES
// ==========================================

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');
const transitionSpring = { type: 'spring' as const, stiffness: 300, damping: 30 };

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

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================

export default function TaskDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, userProfile } = useAuth();
    const taskId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [task, setTask] = useState<Task | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [isSupervisor, setIsSupervisor] = useState(false);
    const [isAssignee, setIsAssignee] = useState(false);

    // POT Submission State
    const [showPotSubmission, setShowPotSubmission] = useState(false);
    const [potSubmitting, setPotSubmitting] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
    const [links, setLinks] = useState<string[]>(['']);
    const [potNotes, setPotNotes] = useState('');

    // POT Validation State
    const [showValidation, setShowValidation] = useState(false);
    const [validationNotes, setValidationNotes] = useState('');
    const [validating, setValidating] = useState(false);

    // Assignment State
    const [showAssignModal, setShowAssignModal] = useState(false);

    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user && taskId) {
            const fetchData = async () => {
                try {
                    const taskData = await TaskService.getTask(taskId);
                    if (!taskData) throw new Error('Task not found');

                    const projectData = await EnhancedProjectService.getProject(taskData.projectId);
                    const supervisorCheck = projectData ? await EnhancedProjectService.isSupervisor(taskData.projectId, user.uid) : false;

                    setTask(taskData);
                    setProject(projectData);
                    setIsSupervisor(supervisorCheck);
                    setIsAssignee(taskData.assigneeId === user.uid);
                } catch (error) {
                    console.error('Error fetching task:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [user, taskId]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedImages(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedVideos(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const handleAddLink = () => {
        setLinks(prev => [...prev, '']);
    };

    const handleLinkChange = (index: number, value: string) => {
        setLinks(prev => prev.map((l, i) => i === index ? value : l));
    };

    const handleSubmitPot = async () => {
        if (!user || !userProfile || !task) return;

        setPotSubmitting(true);
        try {
            const validLinks = links.filter(l => l.trim() !== '');
            await TaskService.submitProofOfTask(
                taskId,
                user.uid,
                userProfile.username || 'user',
                {
                    screenshots: selectedImages,
                    videos: selectedVideos,
                    links: validLinks,
                    notes: potNotes
                }
            );

            const updatedTask = await TaskService.getTask(taskId);
            setTask(updatedTask);
            setShowPotSubmission(false);

            // Reset form
            setSelectedImages([]);
            setSelectedVideos([]);
            setLinks(['']);
            setPotNotes('');
        } catch (error) {
            console.error('Error submitting POT:', error);
            alert('Failed to submit proof. Please try again.');
        } finally {
            setPotSubmitting(false);
        }
    };

    const handleValidatePot = async (decision: 'approved' | 'rejected' | 'revision-requested') => {
        if (!user || !userProfile || !task) return;

        setValidating(true);
        try {
            await TaskService.validateProofOfTask(
                taskId,
                user.uid,
                userProfile.username || 'user',
                decision,
                validationNotes
            );

            const updatedTask = await TaskService.getTask(taskId);
            setTask(updatedTask);
            setShowValidation(false);
            setValidationNotes('');
        } catch (error) {
            console.error('Error validating POT:', error);
            alert('Failed to validate proof. Please try again.');
        } finally {
            setValidating(false);
        }
    };

    const handleAssignSuccess = async () => {
        if (!taskId) return;
        const updatedTask = await TaskService.getTask(taskId);
        setTask(updatedTask);
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'todo': return { icon: Circle, label: 'To Do', color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800' };
            case 'in-progress': return { icon: Clock, label: 'In Progress', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' };
            case 'pending-validation': return { icon: AlertCircle, label: 'Pending Validation', color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' };
            case 'done': return { icon: CheckCircle2, label: 'Done', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' };
            default: return { icon: Circle, label: status, color: 'text-gray-500', bg: 'bg-gray-100' };
        }
    };

    const getPriorityInfo = (priority: string) => {
        switch (priority) {
            case 'urgent': return { color: 'bg-red-500 text-white', label: 'Urgent' };
            case 'high': return { color: 'bg-orange-500 text-white', label: 'High' };
            case 'medium': return { color: 'bg-yellow-500 text-white', label: 'Medium' };
            default: return { color: 'bg-green-500 text-white', label: 'Low' };
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-black">
                <Loader2 className="animate-spin text-[#008080]" size={40} />
            </div>
        );
    }

    if (!task) {
        return (
            <div className="max-w-4xl mx-auto text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Briefcase size={40} className="text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Task Not Found</h2>
                <button
                    onClick={() => router.push('/dashboard/tasks')}
                    className="px-6 py-3 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold transition-all"
                >
                    Back to Tasks
                </button>
            </div>
        );
    }

    const canSubmitPot = isAssignee && task.status === 'in-progress';
    const canValidate = isSupervisor && task.status === 'pending-validation';
    const statusInfo = getStatusInfo(task.status);
    const priorityInfo = getPriorityInfo(task.priority);
    const StatusIcon = statusInfo.icon;

    return (
        <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white pb-20">

            {/* --- BACKGROUND DECOR --- */}
            <div className="absolute top-0 left-0 w-full h-[600px] pointer-events-none opacity-30">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-teal-200/40 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-200/30 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-[1200px] mx-auto px-6 pt-8 relative z-10 space-y-8">

                {/* --- BACK BUTTON --- */}
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => router.push('/dashboard/tasks')}
                    className="flex items-center gap-2 text-gray-500 hover:text-[#008080] transition-colors font-medium"
                >
                    <ArrowLeft size={18} />
                    Back to Tasks
                </motion.button>

                {/* --- HERO HEADER --- */}
                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-[2rem] border border-white/50 dark:border-zinc-800 p-8 shadow-xl shadow-teal-500/5">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-6">
                            {/* Task Icon */}
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", damping: 12 }}
                                className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-2xl shadow-teal-500/20"
                            >
                                <ConnektAIIcon className="w-10 h-10" />
                            </motion.div>

                            <div>
                                {/* Badges */}
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={`${statusInfo.bg} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusInfo.color} flex items-center gap-1`}>
                                        <StatusIcon size={12} />
                                        {statusInfo.label}
                                    </span>
                                    <span className={`${priorityInfo.color} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider`}>
                                        {priorityInfo.label} Priority
                                    </span>
                                </div>

                                {/* Title */}
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
                                    <AnimatedText text={task.title} />
                                </h1>

                                {/* Description */}
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed"
                                >
                                    {task.description}
                                </motion.p>
                            </div>
                        </div>
                    </div>

                    {/* --- FLOATING DOCK --- */}
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, ...transitionSpring }}
                        className="flex justify-center mt-6"
                    >
                        <Dock items={[
                            // Assignee actions
                            ...(isAssignee && task.status === 'todo' ? [{
                                icon: <Play strokeWidth={2.5} size={18} />,
                                label: "Start Task",
                                onClick: async () => {
                                    try {
                                        await TaskService.updateStatus(taskId, 'in-progress');
                                        const updated = await TaskService.getTask(taskId);
                                        setTask(updated);
                                    } catch (e) {
                                        console.error('Failed to start task:', e);
                                    }
                                }
                            }] : []),
                            ...(canSubmitPot ? [{
                                icon: <Upload strokeWidth={2.5} size={18} />,
                                label: "Submit Proof",
                                onClick: () => setShowPotSubmission(true)
                            }] : []),
                            // Supervisor actions
                            ...(canValidate ? [{
                                icon: <CheckCheck strokeWidth={2.5} size={18} />,
                                label: "Review Proof",
                                onClick: () => setShowValidation(true)
                            }] : []),
                            ...(isSupervisor && !task.assigneeId ? [{
                                icon: <UserPlus strokeWidth={2.5} size={18} />,
                                label: "Assign User",
                                onClick: () => setShowAssignModal(true)
                            }] : []),
                            ...(isSupervisor && task.assigneeId ? [{
                                icon: <UserPlus strokeWidth={2.5} size={18} />,
                                label: "Reassign",
                                onClick: () => setShowAssignModal(true)
                            }] : []),
                            // Common actions
                            {
                                icon: <Layers strokeWidth={2.5} size={18} />,
                                label: "View Project",
                                onClick: () => router.push(`/dashboard/projects/${task.projectId}`)
                            },
                            {
                                icon: <MessageCircle strokeWidth={2.5} size={18} />,
                                label: "Team Chat",
                                onClick: () => router.push(`/dashboard/teams?chatWith=${task.assigneeId || ''}`)
                            }
                        ]} />
                    </motion.div>
                </div>

                {/* --- ASSIGNEE INFO --- */}
                {task.assigneeId && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-50/60 dark:bg-blue-900/20 backdrop-blur-xl rounded-2xl border border-blue-200/50 dark:border-blue-800/50 p-5 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
                                {task.assigneeUsername?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Assigned To</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">@{task.assigneeUsername}</p>
                            </div>
                        </div>
                        {isSupervisor && (
                            <button
                                onClick={() => setShowAssignModal(true)}
                                className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1"
                            >
                                Reassign <ChevronRight size={16} />
                            </button>
                        )}
                    </motion.div>
                )}

                {/* --- TASK INFO CARDS --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { icon: Calendar, label: 'Due Date', value: task.timeline.dueDate || 'No deadline', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
                        { icon: DollarSign, label: 'Payment', value: `$${task.pricing.amount} ${task.pricing.currency}`, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
                        { icon: Clock, label: 'Estimated Hours', value: task.timeline.estimatedHours || 'N/A', color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
                        { icon: CheckCircle2, label: 'Payment Status', value: task.pricing.paymentStatus, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' }
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i }}
                            className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-gray-100 dark:border-zinc-800 p-5 hover:scale-[1.02] transition-transform duration-300"
                        >
                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${item.bg} ${item.color} mb-3`}>
                                <item.icon size={24} />
                            </div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white capitalize">{String(item.value)}</p>
                        </motion.div>
                    ))}
                </div>

                {/* --- PROOF OF TASK DISPLAY --- */}
                {task.proofOfTask && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-[2rem] border border-gray-100 dark:border-zinc-800 p-8"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 text-teal-600 rounded-xl">
                                    <FileText size={24} />
                                </div>
                                Proof of Task
                            </h2>
                            {canValidate && (
                                <button
                                    onClick={() => setShowValidation(true)}
                                    className="px-5 py-2.5 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-teal-500/20"
                                >
                                    <CheckCheck size={16} />
                                    Review & Validate
                                </button>
                            )}
                        </div>

                        <div className="space-y-6">
                            {/* Screenshots */}
                            {task.proofOfTask.screenshots.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Image size={18} className="text-[#008080]" />
                                        Screenshots ({task.proofOfTask.screenshots.length})
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {task.proofOfTask.screenshots.map((url, index) => (
                                            <a
                                                key={index}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group relative aspect-video bg-gray-100 dark:bg-zinc-800 rounded-xl overflow-hidden hover:ring-2 hover:ring-[#008080] transition-all shadow-md hover:shadow-lg"
                                            >
                                                <img src={url} alt={`Screenshot ${index + 1}`} className="w-full h-full object-cover" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Videos */}
                            {task.proofOfTask.videos.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Video size={18} className="text-[#008080]" />
                                        Videos ({task.proofOfTask.videos.length})
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {task.proofOfTask.videos.map((url, index) => (
                                            <video key={index} controls className="w-full rounded-xl shadow-md">
                                                <source src={url} />
                                            </video>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Links */}
                            {task.proofOfTask.links.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <LinkIcon size={18} className="text-[#008080]" />
                                        Links ({task.proofOfTask.links.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {task.proofOfTask.links.map((link, index) => (
                                            <a
                                                key={index}
                                                href={link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-sm font-medium"
                                            >
                                                {link}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {task.proofOfTask.notes && (
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-3">Notes</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl">
                                        {task.proofOfTask.notes}
                                    </p>
                                </div>
                            )}

                            {/* Validation Info */}
                            {task.proofOfTask.validatedBy && (
                                <div className={cn(
                                    "p-5 rounded-2xl",
                                    task.proofOfTask.status === 'approved' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900' :
                                        task.proofOfTask.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900' :
                                            'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900'
                                )}>
                                    <div className="flex items-center gap-3 mb-2">
                                        {task.proofOfTask.status === 'approved' ? <CheckCircle2 className="text-green-600" size={24} /> :
                                            task.proofOfTask.status === 'rejected' ? <XCircle className="text-red-600" size={24} /> :
                                                <AlertCircle className="text-amber-600" size={24} />}
                                        <span className="text-lg font-bold capitalize">
                                            {task.proofOfTask.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Validated by <span className="font-bold">@{task.proofOfTask.validatedByUsername}</span>
                                    </p>
                                    {task.proofOfTask.validationNotes && (
                                        <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">{task.proofOfTask.validationNotes}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* ==========================================
                MODALS
               ========================================== */}

            {/* POT Submission Modal */}
            <AnimatePresence>
                {showPotSubmission && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                    >
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPotSubmission(false)} />
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="relative w-full max-w-3xl max-h-[85vh] bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl overflow-hidden"
                        >
                            <div className="sticky top-0 z-10 bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 px-6 py-4 flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Submit Proof of Task</h2>
                                <button onClick={() => setShowPotSubmission(false)} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 flex items-center justify-center transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)] space-y-6">
                                {/* Screenshots */}
                                <div>
                                    <label className="block font-bold text-gray-900 dark:text-white mb-2">Screenshots</label>
                                    <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                                    <button
                                        onClick={() => imageInputRef.current?.click()}
                                        className="w-full px-4 py-4 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl hover:border-[#008080] transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400"
                                    >
                                        <Image size={20} />
                                        Add Screenshots
                                    </button>
                                    {selectedImages.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {selectedImages.map((file, index) => (
                                                <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium">
                                                    {file.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Videos */}
                                <div>
                                    <label className="block font-bold text-gray-900 dark:text-white mb-2">Videos</label>
                                    <input ref={videoInputRef} type="file" accept="video/*" multiple onChange={handleVideoSelect} className="hidden" />
                                    <button
                                        onClick={() => videoInputRef.current?.click()}
                                        className="w-full px-4 py-4 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl hover:border-[#008080] transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400"
                                    >
                                        <Video size={20} />
                                        Add Videos
                                    </button>
                                    {selectedVideos.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {selectedVideos.map((file, index) => (
                                                <span key={index} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg text-sm font-medium">
                                                    {file.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Links */}
                                <div>
                                    <label className="block font-bold text-gray-900 dark:text-white mb-2">Links</label>
                                    {links.map((link, index) => (
                                        <input
                                            key={index}
                                            type="url"
                                            value={link}
                                            onChange={(e) => handleLinkChange(index, e.target.value)}
                                            placeholder="https://example.com"
                                            className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl mb-2 focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
                                        />
                                    ))}
                                    <button onClick={handleAddLink} className="text-[#008080] hover:text-teal-600 font-bold text-sm">
                                        + Add Another Link
                                    </button>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block font-bold text-gray-900 dark:text-white mb-2">Notes (Optional)</label>
                                    <textarea
                                        value={potNotes}
                                        onChange={(e) => setPotNotes(e.target.value)}
                                        rows={4}
                                        placeholder="Add any additional notes or context..."
                                        className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20 resize-none"
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    onClick={handleSubmitPot}
                                    disabled={potSubmitting || (selectedImages.length === 0 && selectedVideos.length === 0 && links.filter(l => l).length === 0)}
                                    className="w-full px-6 py-4 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-500/20"
                                >
                                    {potSubmitting ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={20} />
                                            Submit Proof
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Validation Modal */}
            <AnimatePresence>
                {showValidation && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                    >
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowValidation(false)} />
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl overflow-hidden"
                        >
                            <div className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 px-6 py-4 flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Validate Proof</h2>
                                <button onClick={() => setShowValidation(false)} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 flex items-center justify-center transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="block font-bold text-gray-900 dark:text-white mb-2">Validation Notes</label>
                                    <textarea
                                        value={validationNotes}
                                        onChange={(e) => setValidationNotes(e.target.value)}
                                        rows={4}
                                        placeholder="Provide feedback on the submitted proof..."
                                        className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20 resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        onClick={() => handleValidatePot('approved')}
                                        disabled={validating}
                                        className="px-4 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/20"
                                    >
                                        <CheckCircle2 size={18} />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleValidatePot('revision-requested')}
                                        disabled={validating}
                                        className="px-4 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
                                    >
                                        <AlertCircle size={18} />
                                        Revise
                                    </button>
                                    <button
                                        onClick={() => handleValidatePot('rejected')}
                                        disabled={validating}
                                        className="px-4 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/20"
                                    >
                                        <XCircle size={18} />
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Assignment Modal */}
            <AssignTaskModal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                taskId={taskId}
                taskTitle={task.title}
                projectId={task.projectId}
                project={project}
                budget={task.pricing.amount}
                currency={task.pricing.currency}
                deadline={task.timeline.dueDate}
                onAssignSuccess={handleAssignSuccess}
            />
        </div>
    );
}
