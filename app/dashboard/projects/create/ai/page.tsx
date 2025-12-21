'use client';

import { useState, useEffect, useRef, useCallback, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { WorkspaceService } from '@/lib/services/workspace-service';
import { ConnectAIService, TaskAssignment } from '@/lib/services/connect-ai.service';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { TaskService } from '@/lib/services/task-service';
import { ProfileService } from '@/lib/services/profile-service';
import { WalletService } from '@/lib/services/wallet-service';
import type { Task, WorkspaceMember } from '@/lib/types/workspace.types';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { DollarSign, ArrowLeft, AlertCircle } from 'lucide-react';
import ConnektWalletLogo from '@/components/wallet/ConnektWalletLogo';
import { toast } from 'react-hot-toast';
import {
    motion,
    useMotionValue,
    useMotionValueEvent,
    useSpring,
    useInView,
} from 'framer-motion';

const MAX_OVERFLOW = 50;

function decay(value: number, max: number) {
    if (max === 0) return 0;
    const entry = value / max;
    const sigmoid = 2 * (1 / (1 + Math.exp(-entry)) - 0.5);
    return sigmoid * max;
}

type CountUpProps = {
    to: number;
    from?: number;
    duration?: number;
    className?: string;
    prefix?: string;
};

function CountUp({ to, from = 0, duration = 0.8, className = '', prefix = '' }: CountUpProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const motionValue = useMotionValue(from);
    const springValue = useSpring(motionValue, {
        damping: 20 + 40 * (1 / duration),
        stiffness: 100 * (1 / duration),
    });
    const isInView = useInView(ref, { once: false, margin: '0px' });

    const formatValue = useCallback(
        (latest: number | string) =>
            prefix +
            Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(
                typeof latest === 'number' ? latest : Number(latest)
            ),
        [prefix]
    );

    useEffect(() => {
        if (ref.current) ref.current.textContent = formatValue(from);
    }, [from, formatValue]);

    useEffect(() => {
        if (isInView) motionValue.set(to);
    }, [isInView, motionValue, to]);

    useEffect(() => {
        const unsub = springValue.on('change', latest => {
            if (ref.current) ref.current.textContent = formatValue(latest);
        });
        return () => unsub();
    }, [springValue, formatValue]);

    return <span className={className} ref={ref} />;
}

type ElasticSliderProps = {
    defaultValue?: number;
    startingValue?: number;
    maxValue?: number;
    stepSize?: number;
    onChange?: (value: number) => void;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
};

function ElasticSlider({
    defaultValue = 500,
    startingValue = 0,
    maxValue = 5000,
    stepSize = 1,
    onChange,
    leftIcon,
    rightIcon,
}: ElasticSliderProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-4 w-full">
            <SliderCore
                defaultValue={defaultValue}
                startingValue={startingValue}
                maxValue={maxValue}
                stepSize={stepSize}
                leftIcon={leftIcon}
                rightIcon={rightIcon}
                onChange={onChange}
            />
        </div>
    );
}

type SliderCoreProps = Required<Pick<ElasticSliderProps, 'defaultValue' | 'startingValue' | 'maxValue' | 'stepSize'>> &
    Pick<ElasticSliderProps, 'leftIcon' | 'rightIcon' | 'onChange'>;

function SliderCore({ defaultValue, startingValue, maxValue, stepSize, leftIcon, rightIcon, onChange }: SliderCoreProps) {
    const [value, setValue] = useState(defaultValue);
    const sliderRef = useRef<HTMLDivElement>(null);
    const clientX = useMotionValue(0);
    const overflow = useMotionValue(0);
    const scale = useMotionValue(1);

    useEffect(() => {
        setValue(defaultValue);
    }, [defaultValue]);

    useMotionValueEvent(clientX, 'change', latest => {
        if (!sliderRef.current) return;
        const { left, right } = sliderRef.current.getBoundingClientRect();
        let newValue = 0;
        if (latest < left) newValue = left - latest;
        else if (latest > right) newValue = latest - right;
        overflow.jump(decay(newValue, MAX_OVERFLOW));
    });

    const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
        clientX.set(e.clientX);
        if (e.buttons > 0 && sliderRef.current) {
            const { left, width } = sliderRef.current.getBoundingClientRect();
            let newValue = startingValue + ((e.clientX - left) / width) * (maxValue - startingValue);
            newValue = Math.round(newValue / stepSize) * stepSize;
            newValue = Math.min(Math.max(newValue, startingValue), maxValue);
            setValue(newValue);
            if (onChange) onChange(newValue);
        }
    };

    const handlePointerDown = () => {
        scale.set(1.02);
    };

    const handlePointerUp = () => {
        scale.set(1);
    };

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-2">
                <button
                    type="button"
                    onClick={() => {
                        const next = Math.max(startingValue, value - stepSize);
                        setValue(next);
                        onChange?.(next);
                    }}
                    className="h-10 w-10 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 backdrop-blur flex items-center justify-center"
                >
                    {leftIcon}
                </button>
                <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Budget</p>
                    <p className="text-xl font-black text-gray-900 dark:text-white">
                        <CountUp to={value} from={value} prefix="" />
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        const next = Math.min(maxValue, value + stepSize);
                        setValue(next);
                        onChange?.(next);
                    }}
                    className="h-10 w-10 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 backdrop-blur flex items-center justify-center"
                >
                    {rightIcon}
                </button>
            </div>

            <motion.div
                ref={sliderRef}
                style={{ scale }}
                onPointerMove={handlePointerMove}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onPointerEnter={(e: ReactPointerEvent<HTMLDivElement>) => clientX.set(e.clientX)}
                className="relative w-full h-12 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/50 backdrop-blur overflow-hidden"
            >
                <motion.div
                    style={{
                        width: `${((value - startingValue) / (maxValue - startingValue)) * 100}%`,
                    }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#008080] to-teal-500"
                />
                <motion.div
                    style={{
                        x: overflow,
                    }}
                    className="absolute inset-0 pointer-events-none"
                />
                <div className="absolute inset-0 flex items-center justify-between px-4">
                    <span className="text-xs font-bold text-white/90">{startingValue}</span>
                    <span className="text-xs font-bold text-white/90">{maxValue}</span>
                </div>
            </motion.div>
        </div>
    );
}

export default function AIProjectCreatorPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, userProfile } = useAuth();
    const workspaceId = searchParams.get('workspaceId');

    const [isProcessing, setIsProcessing] = useState(false);
    const [processingMessage, setProcessingMessage] = useState('Preparing...');

    // Data State
    const [projectData, setProjectData] = useState({
        title: '',
        description: '',
        totalBudget: 500,
        currency: 'GMD',
        numTasks: 6,
    });

    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [, setCoverImageUrl] = useState<string | null>(null);

    const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
    const [, setAssignments] = useState<TaskAssignment[]>([]);

    useEffect(() => {
        if (!workspaceId || !user) return;
        const fetchMembers = async () => {
            const workspace = await WorkspaceService.getWorkspace(workspaceId);
            if (workspace) setWorkspaceMembers(workspace.members);
        };
        fetchMembers();
    }, [workspaceId, user]);

    useEffect(() => {
        if (!user) return;
        const fetchWallet = async () => {
            try {
                const wallet = await WalletService.getWallet(user.uid, 'user');
                if (wallet) setWalletBalance(wallet.balance);
            } catch (e) {
                console.error(e);
            }
        };
        fetchWallet();
    }, [user]);

    const base64ToBlob = (base64: string, mimeType: string) => {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i += 1) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    };

    const generateAndUploadCover = async (): Promise<string> => {
        if (!user || !workspaceId) throw new Error('Missing user/workspace');
        const title = projectData.title.trim();
        const description = projectData.description.trim();
        if (!title || !description) throw new Error('Project title and description are required');

        const res = await fetch('/api/projects/generate-cover', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description }),
        });

        const json: any = await res.json().catch(() => ({}));
        if (!res.ok) {
            const message = json?.error || 'Failed to generate cover image';
            throw new Error(message);
        }

        const imageBase64: string | undefined = json?.imageBase64;
        const mimeType: string = json?.mimeType || 'image/png';

        if (!imageBase64) throw new Error('No image returned from generator');

        const blob = base64ToBlob(imageBase64, mimeType);
        const fileName = `cover_${Date.now()}.png`;
        const storagePath = `project-covers/${workspaceId}/${user.uid}/${fileName}`;
        const storageRef = ref(storage, storagePath);

        await uploadBytes(storageRef, blob, { contentType: mimeType });
        const url = await getDownloadURL(storageRef);

        setCoverImageUrl(url);
        return url;
    };
    const validate = () => {
        const titleOk = !!projectData.title.trim();
        const descOk = !!projectData.description.trim();
        const budgetOk = Number.isFinite(projectData.totalBudget) && projectData.totalBudget > 0;
        if (!titleOk || !descOk || !budgetOk) return 'Please provide a title, description, and budget.';
        if (walletBalance !== null && projectData.totalBudget > walletBalance) {
            return `Insufficient funds. Available: ${projectData.currency}${walletBalance.toFixed(2)}`;
        }
        return null;
    };

    const handleCreateWithAI = async () => {
        const err = validate();
        if (err) {
            toast.error(err);
            return;
        }
        if (!workspaceId || !user) return;

        setIsProcessing(true);
        const toastId = toast.loading('Creating project with AI...');

        try {
            setProcessingMessage('Generating project cover...');
            const cover = await generateAndUploadCover();

            setProcessingMessage('Structuring tasks & budget...');
            const tasks = await ConnectAIService.generateTasksFromProject(
                projectData.description,
                projectData.totalBudget,
                projectData.currency,
                projectData.numTasks,
                user.uid
            );

            setProcessingMessage('Matching your team...');
            const members = workspaceMembers.length
                ? workspaceMembers
                : (await WorkspaceService.getWorkspace(workspaceId))?.members || [];

            const memberProfiles = await Promise.all(
                members.map(async m => {
                    const profile = await ProfileService.getUserProfile(m.userId);
                    return {
                        userId: m.userId,
                        username: m.username,
                        role: m.role,
                        skills: profile?.skills || [],
                    };
                })
            );

            const matches = await ConnectAIService.autoAssignTasks(tasks, memberProfiles, user.uid);
            setAssignments(matches);

            setProcessingMessage('Creating project...');
            const projectId = await EnhancedProjectService.createProject({
                workspaceId,
                ownerId: user.uid,
                ownerUsername: userProfile?.username || 'Owner',
                title: projectData.title,
                description: projectData.description,
                budget: projectData.totalBudget,
                coverImage: cover,
            });

            setProcessingMessage('Creating tasks...');
            await Promise.all(
                tasks.map(async t => {
                    const assignment = matches.find(a => a.taskTitle === t.title);
                    await TaskService.createTask({
                        projectId,
                        workspaceId,
                        title: t.title,
                        description: t.description,
                        priority: t.priority as Task['priority'],
                        pricing: {
                            amount: t.budget || 0,
                            currency: t.currency || projectData.currency,
                            paymentStatus: 'unpaid',
                        },
                        assigneeId: assignment?.assigneeId,
                        assigneeUsername: assignment?.assigneeUsername,
                        createdBy: user.uid,
                    });
                })
            );

            toast.success('Project created!', { id: toastId });
            router.push(`/dashboard/projects/${projectId}`);
        } catch (e: unknown) {
            console.error(e);
            const message = e instanceof Error ? e.message : 'Failed to create project';
            toast.error(message, { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-24 relative px-6 pt-12">
            {/* Background decoration (matches standard create page) */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50/40 via-transparent to-transparent dark:from-teal-900/10" />
                <div className="absolute top-20 right-20 w-96 h-96 bg-teal-200/20 dark:bg-teal-900/20 rounded-full blur-3xl" />
            </div>

            {/* Processing overlay */}
            {isProcessing && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl" />
                    <div className="relative h-full flex flex-col items-center justify-center px-6">
                        <div className="w-20 h-20 flex items-center justify-center">
                            <div className="animate-pulse">
                                <ConnektAIIcon className="w-20 h-20" />
                            </div>
                        </div>
                        <p className="mt-8 text-lg font-black text-gray-900 dark:text-white text-center">Connekt AI</p>
                        <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-300 text-center">{processingMessage}</p>
                    </div>
                </div>
            )}

            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#008080] transition-colors mb-8 group font-medium"
            >
                <div className="p-2 rounded-full bg-white dark:bg-zinc-800 shadow-sm group-hover:shadow-md transition-all group-hover:-translate-x-1">
                    <ArrowLeft size={18} />
                </div>
                <span>Back to Dashboard</span>
            </button>

            <div className="mb-10">
                <div className="flex items-start md:items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-gray-200 dark:border-zinc-800 flex items-center justify-center shadow-xl">
                        <ConnektAIIcon className="w-12 h-12" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tight">Create Project</h1>
                        <p className="text-lg text-gray-500 dark:text-gray-400 mt-2 font-medium">
                            Tell Connekt AI what you want. It handles the rest.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Project Title</label>
                        <input
                            type="text"
                            className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#008080]"
                            placeholder="e.g. Website Overhaul"
                            value={projectData.title}
                            onChange={e => setProjectData({ ...projectData, title: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Project Description</label>
                        <textarea
                            className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#008080] min-h-[170px]"
                            placeholder="Describe your goals, deliverables, timeline, and the kind of team you need."
                            value={projectData.description}
                            onChange={e => setProjectData({ ...projectData, description: e.target.value })}
                        />
                    </div>

                    {/* Wallet & Budget Section - Matching standard project create page */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Interactive Wallet Card */}
                        <div className="bg-gradient-to-br from-[#008080] to-teal-700 rounded-3xl p-6 text-white shadow-2xl shadow-teal-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                                        <ConnektWalletLogo size="small" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">My Wallet</h3>
                                        <p className="text-teal-100 text-xs opacity-80">Available for Allocation</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6 relative z-10">
                                <p className="text-teal-100 text-sm mb-1">Current Balance</p>
                                <div className="text-4xl font-black tracking-tight flex items-baseline gap-1">
                                    <span className="text-xl opacity-70">{projectData.currency}</span>
                                    <CountUp
                                        to={walletBalance || 0}
                                        duration={0.35}
                                    />
                                </div>
                            </div>

                            {/* Mini Stat Grid */}
                            <div className="grid grid-cols-2 gap-3 relative z-10">
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                                    <p className="text-xs text-teal-100 mb-1">Allocated</p>
                                    <p className="font-bold text-lg flex items-center gap-1">
                                        {projectData.currency} <CountUp to={projectData.totalBudget} duration={0.35} />
                                    </p>
                                </div>
                                <div className={`bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 transition-colors ${(walletBalance !== null && projectData.totalBudget > walletBalance) ? 'bg-red-500/20 border-red-400/50' : ''
                                    }`}>
                                    <p className="text-xs text-teal-100 mb-1">Remaining</p>
                                    <p className={`font-bold text-lg flex items-center gap-1 ${(walletBalance !== null && projectData.totalBudget > walletBalance) ? 'text-red-200' : ''
                                        }`}>
                                        {projectData.currency} <CountUp
                                            to={(walletBalance || 0) - projectData.totalBudget}
                                            duration={0.35}
                                        />
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Budget Control Panel */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-6 shadow-lg">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <DollarSign className="text-[#008080]" size={20} />
                                Set Budget
                            </h3>

                            {/* The Elastic Slider */}
                            <div className="mb-6 py-2">
                                <ElasticSlider
                                    startingValue={0}
                                    maxValue={walletBalance !== null ? Math.max(1, Math.floor(walletBalance)) : 5000}
                                    defaultValue={projectData.totalBudget}
                                    onChange={(v: number) => setProjectData(prev => ({ ...prev, totalBudget: Math.round(v) }))}
                                    stepSize={50}
                                    leftIcon={<span className="text-xl font-bold text-gray-400 select-none">-</span>}
                                    rightIcon={<span className="text-xl font-bold text-gray-400 select-none">+</span>}
                                />
                            </div>

                            {/* Manual Override Input */}
                            <div className="relative">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Manual Entry</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={projectData.totalBudget}
                                        onChange={e => setProjectData({ ...projectData, totalBudget: Math.max(0, Number(e.target.value)) })}
                                        className="w-full px-5 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080] font-mono font-bold text-gray-900 dark:text-white pl-16"
                                        placeholder="0.00"
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        <span className="font-bold">{projectData.currency}</span>
                                    </div>
                                </div>
                                {walletBalance !== null && projectData.totalBudget > walletBalance && (
                                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle size={14} />
                                        Insufficient funds. Available: {projectData.currency}{walletBalance.toFixed(2)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleCreateWithAI}
                        disabled={isProcessing}
                        className="w-full py-4 bg-[#008080] hover:bg-teal-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-lg shadow-teal-500/20 hover:scale-[1.01]"
                    >
                        <ConnektAIIcon className="w-6 h-6" />
                        Create with AI
                    </button>
                </div>
            </div>
        </div>
    );
}
