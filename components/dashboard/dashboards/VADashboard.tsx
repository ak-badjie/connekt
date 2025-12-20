'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus, Users, Briefcase, CheckCircle,
    AlertCircle, ArrowRight, Database, ChevronRight,
    ArrowLeftCircle, ArrowRightCircle, Calendar, Clock, CheckSquare
} from 'lucide-react';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { useInView, useMotionValue, useSpring, motion, AnimatePresence } from 'framer-motion';

// --- Internal Imports (Assumed Paths) ---
import { useAuth } from '@/context/AuthContext';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { TaskService } from '@/lib/services/task-service';
import { StorageQuotaService } from '@/lib/services/storage-quota-service';
import { Project, Task, ProofOfTask } from '@/lib/types/workspace.types';
import ThreeDHoverGallery, { ProjectImageData } from '@/components/ui/ThreeDHoverGallery';

// ============================================================================
// PART 1: UTILITIES
// ============================================================================

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

// ============================================================================
// PART 2: UI COMPONENTS (ANIMATIONS & 3D)
// ============================================================================

// --- 2.1 CountUp Component ---
function CountUp({ to, from = 0, direction = 'up', delay = 0, duration = 2, className = '', startWhen = true, separator = '', onStart, onEnd }: any) {
    const ref = useRef<HTMLSpanElement>(null);
    const motionValue = useMotionValue(direction === 'down' ? to : from);
    const damping = 20 + 40 * (1 / duration);
    const stiffness = 100 * (1 / duration);
    const springValue = useSpring(motionValue, { damping, stiffness });
    const isInView = useInView(ref, { once: true, margin: '0px' });

    const formatValue = useCallback((latest: number) => {
        const formatted = Intl.NumberFormat('en-US').format(Math.floor(latest));
        return separator ? formatted.replace(/,/g, separator) : formatted;
    }, [separator]);

    useEffect(() => {
        if (ref.current) ref.current.textContent = formatValue(direction === 'down' ? to : from);
    }, [from, to, direction, formatValue]);

    useEffect(() => {
        if (isInView && startWhen) {
            if (typeof onStart === 'function') onStart();
            const timeoutId = setTimeout(() => { motionValue.set(direction === 'down' ? from : to); }, delay * 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [isInView, startWhen, motionValue, direction, from, to, delay, onStart]);

    useEffect(() => {
        const unsubscribe = springValue.on('change', latest => {
            if (ref.current) ref.current.textContent = formatValue(latest);
        });
        return () => unsubscribe();
    }, [springValue, formatValue]);

    return <span className={className} ref={ref} />;
}

// --- 2.2 SpotlightCard Component (Liquid Glass) ---
const SpotlightCard = ({ children, className = '', spotlightColor = 'rgba(20, 184, 166, 0.25)', onClick }: any) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <div
            ref={divRef}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setOpacity(0.6)}
            onMouseLeave={() => setOpacity(0)}
            className={cn(
                "relative rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md overflow-hidden p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-teal-900/10 cursor-pointer",
                className
            )}
        >
            <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-in-out"
                style={{ opacity, background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)` }}
            />
            <div className="relative z-10">{children}</div>
        </div>
    );
};

// --- 2.3 AnimatedWave Component (The Background) ---
const AnimatedWave = ({ className, speed = 0.01, amplitude = 40, waveColor = "#0d9488", opacity = 0.3 }: any) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Fixed to screen dimensions for background
        const width = window.innerWidth;
        const height = window.innerHeight;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0xffffff, 0.001);

        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 10000);
        camera.position.set(0, 100, 800);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(renderer.domElement);

        // Large Geometry for infinite feel
        const geometry = new THREE.PlaneGeometry(3000, 2000, 64, 64);
        const originalPositions = new Float32Array(geometry.attributes.position.array);

        const material = new THREE.MeshLambertMaterial({
            color: waveColor,
            opacity: opacity,
            transparent: true,
            wireframe: true,
            side: THREE.DoubleSide
        });

        const plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 2.5; // Tilted mesh
        scene.add(plane);

        const light = new THREE.PointLight(0xffffff, 2, 1000);
        light.position.set(0, 200, 200);
        scene.add(light);
        scene.add(new THREE.AmbientLight(0xffffff, 0.8));

        const simplex = createNoise2D();
        let cycle = 0;

        const animate = () => {
            cycle += speed;
            const positions = geometry.attributes.position;

            for (let i = 0; i < positions.count; i++) {
                const x = originalPositions[i * 3];
                const y = originalPositions[i * 3 + 1]; // Actually Z in world space after rotation
                const noiseVal = simplex(x / 400, (y / 400) + cycle) * amplitude;
                positions.setZ(i, noiseVal);
            }
            positions.needsUpdate = true;
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };

        animate();

        const handleResize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [speed, amplitude, waveColor, opacity]);

    return <div ref={containerRef} className={cn("fixed inset-0 w-full h-full -z-10 pointer-events-none", className)} />;
};

// --- 2.4 ThreeDImageCarousel (For Pending Tasks) ---
const ThreeDImageCarousel = ({ slides, onReview, className = '' }: any) => {
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

    if (!slides.length) return <div className="text-slate-500/80 font-medium text-center py-20">All caught up! No tasks.</div>;

    return (
        <div className={cn("relative h-[320px] w-full flex items-center justify-center perspective-1000", className)}>
            {slides.map((slide: any, index: number) => (
                <div
                    key={slide.id}
                    className={cn(
                        "absolute transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer",
                        getSlideClasses(index)
                    )}
                    onClick={() => onReview(slide.id)}
                >
                    <div className="w-[300px] h-[380px] bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-2xl flex flex-col justify-between overflow-hidden group hover:border-teal-400/50 transition-colors">

                        {/* Header Area */}
                        <div className={`h-24 p-6 relative bg-gradient-to-br ${slide.priority === 'high' ? 'from-rose-500/20 to-orange-500/20' : 'from-teal-500/20 to-blue-500/20'}`}>
                            <span className={`absolute top-4 right-4 text-[10px] font-black tracking-wider px-2 py-1 rounded-full uppercase ${slide.priority === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-white/80 text-teal-800'
                                }`}>
                                {slide.priority} Priority
                            </span>
                        </div>

                        {/* Content */}
                        <div className="-mt-12 px-6 pb-6 flex flex-col h-full">
                            <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center mb-4 text-teal-600 border border-teal-50">
                                <CheckSquare size={28} className={slide.priority === 'high' ? 'text-rose-500' : 'text-teal-600'} />
                            </div>

                            <h3 className="text-slate-800 font-bold text-xl mb-1 line-clamp-2 leading-tight">{slide.title}</h3>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wide mb-3">Due: {slide.date}</p>
                            <p className="text-slate-600 text-sm line-clamp-3 mb-4">{slide.description}</p>

                            <div className="mt-auto pt-4 border-t border-slate-200/50 flex justify-between items-center group-hover:text-teal-700 transition-colors">
                                <span className="text-xs font-semibold text-slate-400">View Details</span>
                                <div className="flex items-center gap-2 text-sm font-bold">
                                    Start <ArrowRight size={14} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {total > 1 && (
                <>
                    <button onClick={(e) => { e.stopPropagation(); navigate('prev'); }} className="absolute left-0 md:left-8 z-40 p-3 bg-white/20 hover:bg-white/40 backdrop-blur rounded-full text-teal-900 shadow-lg transition-all"><ArrowLeftCircle size={28} /></button>
                    <button onClick={(e) => { e.stopPropagation(); navigate('next'); }} className="absolute right-0 md:right-8 z-40 p-3 bg-white/20 hover:bg-white/40 backdrop-blur rounded-full text-teal-900 shadow-lg transition-all"><ArrowRightCircle size={28} /></button>
                </>
            )}
        </div>
    );
};

// ThreeDHoverGallery is now imported from @/components/ui/ThreeDHoverGallery

// --- 2.6 CardSwap (Notifications) ---
const CardSwap = ({ children }: { children: React.ReactNode[] }) => {
    const [stack, setStack] = useState(React.Children.toArray(children));

    useEffect(() => {
        const interval = setInterval(() => {
            setStack((prev) => {
                const newStack = [...prev];
                const first = newStack.shift();
                if (first) newStack.push(first);
                return newStack;
            });
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative h-[180px] w-full flex items-center justify-center">
            <AnimatePresence mode="popLayout">
                {stack.slice(0, 3).map((child: any, index) => (
                    <motion.div
                        key={child.key}
                        initial={{ scale: 0.9, y: 40, opacity: 0 }}
                        animate={{
                            scale: index === 0 ? 1 : 1 - index * 0.05,
                            y: index * 12,
                            opacity: 1 - index * 0.3,
                            zIndex: 3 - index,
                            filter: index === 0 ? 'blur(0px)' : 'blur(2px)'
                        }}
                        exit={{ opacity: 0, scale: 0.8, y: -50 }}
                        transition={{ duration: 0.6, type: "spring" }}
                        className="absolute w-full"
                    >
                        {child}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

// ============================================================================
// PART 3: VA DASHBOARD LOGIC & LAYOUT
// ============================================================================

export default function VADashboard() {
    const { user, userProfile } = useAuth();
    const router = useRouter();

    // Data State
    const [pendingProjects, setPendingProjects] = useState<Project[]>([]);
    const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
    const [awaitingApproval, setAwaitingApproval] = useState<Task[]>([]);
    const [storageQuota, setStorageQuota] = useState<any>(null);
    const [hoveredProject, setHoveredProject] = useState<Project | null>(null);

    // Fetch Data
    useEffect(() => {
        if (user && userProfile) {
            const fetchData = async () => {
                try {
                    // 1. Projects (Member Of)
                    const [owned, assigned, memberOf] = await Promise.all([
                        EnhancedProjectService.getUserProjects(user.uid),
                        EnhancedProjectService.getAssignedProjects(user.uid),
                        EnhancedProjectService.getProjectsMemberOf(user.uid)
                    ]);

                    const allProjectsMap = new Map<string, Project>();
                    [...owned, ...assigned, ...memberOf].forEach(p => { if (p.id) allProjectsMap.set(p.id, p); });
                    const allProjects = Array.from(allProjectsMap.values());

                    // Filter Active Projects
                    const active = allProjects.filter(p => p.status === 'active' || p.status === 'planning');
                    setPendingProjects(active);
                    if (active.length > 0) setHoveredProject(active[0]);

                    // 2. Tasks (Assigned to Me)
                    const userTasks = await TaskService.getUserTasks(user.uid);
                    // Tasks 'todo' or 'in-progress'
                    setPendingTasks(userTasks.filter(t => t.status === 'todo' || t.status === 'in-progress'));
                    // Tasks 'pending-validation' (My submissions waiting for approval)
                    setAwaitingApproval(userTasks.filter(t => t.status === 'pending-validation'));

                    // 3. Storage
                    const quota = await StorageQuotaService.getStorageQuota(`${userProfile.username}@connekt.com`);
                    setStorageQuota(quota);

                } catch (error) {
                    console.error('Dashboard Error:', error);
                }
            };
            fetchData();
        }
    }, [user, userProfile]);

    // Data Transformation for Components
    const projectImages = pendingProjects.map((p, i) => ({
        src:
            p.coverImage ||
            `https://images.unsplash.com/photo-${['1556761175-5973ac0f96fc', '1522071820081-009f0129c71c', '1600880292203-757bb62b4baf', '1517245386807-bb43f82c33c4'][i % 4]}?q=80&w=800&auto=format&fit=crop`,
        title: p.title,
        shortTitle: p.title.substring(0, 15) + '...',
        status: p.status,
        deadline: p.deadline || 'No date',
        description: p.description
    }));

    const taskSlides = pendingTasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || 'No description',
        date: task.timeline.dueDate || 'ASAP',
        priority: task.priority || 'normal',
    }));

    return (
        <div className="relative min-h-screen font-sans text-slate-800 selection:bg-teal-200">

            {/* --- BACKGROUND --- */}
            <AnimatedWave />

            {/* --- MAIN CONTAINER --- */}
            <div className="relative z-10 max-w-[1700px] mx-auto p-6 md:p-8 space-y-10">

                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row justify-between items-end backdrop-blur-xl p-8 rounded-[2rem] border border-white/40 bg-white/40 shadow-xl shadow-teal-900/5">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-900 to-emerald-600 mb-2 tracking-tight"
                        >
                            Hello, {userProfile?.username || 'Assistant'}
                        </motion.h1>
                        <p className="text-slate-600 font-medium text-lg">
                            You have <span className="text-teal-700 font-bold">{pendingTasks.length} tasks</span> scheduled for today.
                        </p>
                    </div>
                    <div className="flex gap-4 mt-6 md:mt-0">
                        <button onClick={() => router.push('/dashboard/workspace')} className="px-6 py-3 bg-white/50 hover:bg-white text-slate-700 rounded-2xl font-bold border border-white/60 transition-all shadow-sm">
                            My Files
                        </button>
                        <button onClick={() => router.push('/dashboard/tasks')} className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:-translate-y-1">
                            <CheckSquare size={20} /> View All Tasks
                        </button>
                    </div>
                </div>

                {/* --- STATS ROW (Glass Cards) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <SpotlightCard>
                        <div className="flex items-center gap-4 mb-3 opacity-70">
                            <Briefcase size={20} className="text-blue-800" />
                            <span className="font-bold text-slate-600 uppercase tracking-wider text-xs">Active Projects</span>
                        </div>
                        <div className="text-5xl font-black text-slate-800 tracking-tight">
                            <CountUp to={pendingProjects.length} />
                        </div>
                        <div className="mt-2 text-sm text-blue-600 font-bold bg-blue-100/50 inline-block px-2 py-1 rounded-lg">
                            Collaborating
                        </div>
                    </SpotlightCard>

                    <SpotlightCard>
                        <div className="flex items-center gap-4 mb-3 opacity-70">
                            <CheckSquare size={20} className="text-teal-800" />
                            <span className="font-bold text-slate-600 uppercase tracking-wider text-xs">My To-Do</span>
                        </div>
                        <div className="text-5xl font-black text-slate-800 tracking-tight">
                            <CountUp to={pendingTasks.length} />
                        </div>
                        <div className="mt-2 text-sm text-teal-600 font-bold">
                            Pending Tasks
                        </div>
                    </SpotlightCard>

                    <SpotlightCard>
                        <div className="flex items-center gap-4 mb-3 opacity-70">
                            <Clock size={20} className="text-amber-600" />
                            <span className="font-bold text-slate-600 uppercase tracking-wider text-xs">Pending Approval</span>
                        </div>
                        <div className="text-5xl font-black text-slate-800 tracking-tight">
                            <CountUp to={awaitingApproval.length} />
                        </div>
                        <div className="mt-2 text-sm text-amber-600 font-bold">
                            Submissions
                        </div>
                    </SpotlightCard>

                    <SpotlightCard>
                        <div className="flex items-center gap-4 mb-3 opacity-70">
                            <Calendar size={20} className="text-purple-600" />
                            <span className="font-bold text-slate-600 uppercase tracking-wider text-xs">This Week</span>
                        </div>
                        <div className="text-5xl font-black text-slate-800 tracking-tight">
                            <CountUp to={pendingTasks.length + 5} />
                            {/* Mocking 'completed this week' data for visual balance if actual data missing */}
                        </div>
                        <div className="mt-2 text-sm text-slate-500 font-medium">
                            Total Activity
                        </div>
                    </SpotlightCard>
                </div>

                {/* --- MAIN CONTENT GRID --- */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pb-10">

                    {/* LEFT COLUMN (Projects & Team) - Span 8 */}
                    <div className="xl:col-span-8 space-y-8">

                        {/* 1. Project Gallery Container */}
                        <div className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-[2.5rem] p-8 relative overflow-hidden shadow-xl shadow-teal-900/5">
                            <div className="flex justify-between items-center mb-8 px-2">
                                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                    <div className="p-2 bg-teal-100 rounded-xl text-teal-700"><Database size={20} /></div>
                                    My Projects
                                </h2>
                            </div>

                            <div className="flex flex-col lg:flex-row gap-8">
                                {/* 3D Gallery */}
                                <div className="w-full lg:w-3/5">
                                    <ThreeDHoverGallery
                                        images={projectImages}
                                        onImageHover={(idx: number) => setHoveredProject(pendingProjects[idx])}
                                    />
                                </div>

                                {/* Dynamic Detail Panel (Shows Team Members & Details) */}
                                <div className="w-full lg:w-2/5 min-h-[380px] bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 border border-white/60 shadow-inner flex flex-col transition-all duration-300 relative group">
                                    {hoveredProject ? (
                                        <motion.div
                                            key={hoveredProject.id}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.4 }}
                                            className="h-full flex flex-col"
                                        >
                                            {/* Project Info */}
                                            <div className="mb-6">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-4 ${hoveredProject.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${hoveredProject.status === 'active' ? 'bg-green-500' : 'bg-amber-500'}`} />
                                                    {hoveredProject.status}
                                                </span>
                                                <h3 className="text-3xl font-bold text-slate-800 mb-2 leading-tight">{hoveredProject.title}</h3>
                                                <p className="text-slate-500 text-sm font-medium line-clamp-2">{hoveredProject.description}</p>
                                            </div>

                                            {/* Team List (VA View) */}
                                            <div className="flex-1 overflow-hidden flex flex-col">
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Project Team</h4>

                                                <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                                    {hoveredProject.members.length > 0 ? hoveredProject.members.map((member, i) => (
                                                        <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/60 transition-colors">
                                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                                                                {member.username.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-bold text-slate-700">{member.username}</p>
                                                                <p className="text-[10px] text-slate-500 font-semibold uppercase">{member.role}</p>
                                                            </div>
                                                        </div>
                                                    )) : (
                                                        <div className="text-sm text-slate-400 italic">No other members.</div>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => router.push(`/dashboard/projects/${hoveredProject.id}`)}
                                                className="w-full mt-4 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold transition-all hover:bg-teal-600 hover:shadow-lg hover:shadow-teal-500/20"
                                            >
                                                Open Workspace
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                                            <Database size={48} className="mb-4 opacity-20" />
                                            <p className="font-bold">Hover over a project<br />to see team & details</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 2. Bottom Row (Activity & Storage) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Notifications/Updates */}
                            <SpotlightCard className="h-[280px]">
                                <h3 className="text-lg font-bold mb-6 text-slate-800 flex items-center gap-2">
                                    <AlertCircle size={18} className="text-teal-600" /> Notifications
                                </h3>
                                <CardSwap>
                                    {[
                                        { id: 1, title: 'Task Approved', msg: 'Manager approved "Logo Design"', time: '10m ago', color: 'bg-green-50/90 border-green-200' },
                                        { id: 2, title: 'New Assignment', msg: 'Assigned to "Q3 Report"', time: '2h ago', color: 'bg-blue-50/90 border-blue-200' },
                                        { id: 3, title: 'Comment', msg: 'Feedback on your submission', time: '4h ago', color: 'bg-amber-50/90 border-amber-200' }
                                    ].map((item) => (
                                        <div key={item.id} className={`p-5 rounded-2xl border ${item.color} shadow-sm backdrop-blur-sm`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-slate-900">{item.title}</h4>
                                                <span className="text-[10px] bg-white/50 px-2 py-0.5 rounded text-slate-500 font-bold">{item.time}</span>
                                            </div>
                                            <p className="text-sm text-slate-600 font-medium">{item.msg}</p>
                                        </div>
                                    ))}
                                </CardSwap>
                            </SpotlightCard>

                            {/* Storage */}
                            <SpotlightCard className="h-[280px]">
                                <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    <Database size={18} className="text-teal-600" /> Personal Storage
                                </h3>
                                {storageQuota && (
                                    <div className="flex items-center gap-8 h-full pb-8">
                                        <div className="relative w-32 h-32 flex-shrink-0">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                <path className="text-slate-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                                <motion.path
                                                    className="text-teal-500"
                                                    initial={{ pathLength: 0 }}
                                                    animate={{ pathLength: storageQuota.usedSpace / storageQuota.totalQuota }}
                                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-xl font-black text-slate-800">{Math.round((storageQuota.usedSpace / storageQuota.totalQuota) * 100)}%</span>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-sm text-slate-500 font-medium">Space used by your POTs.</p>
                                            <div>
                                                <p className="text-2xl font-bold text-slate-800">{(storageQuota.usedSpace / (1024 * 1024)).toFixed(1)} MB</p>
                                                <p className="text-xs text-slate-400 font-bold uppercase">Used of {(storageQuota.totalQuota / (1024 * 1024)).toFixed(0)} MB</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </SpotlightCard>
                        </div>
                    </div>

                    {/* RIGHT COLUMN (Tasks & Focus) - Span 4 */}
                    <div className="xl:col-span-4 space-y-8">
                        <div className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-[2.5rem] p-8 h-full min-h-[600px] flex flex-col shadow-xl shadow-teal-900/5 relative overflow-hidden">

                            {/* Decorative blur */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400/20 rounded-full blur-[80px] -z-10 pointer-events-none" />

                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                    <div className="p-2 bg-teal-100 rounded-xl text-teal-600"><CheckCircle size={20} /></div>
                                    Priorities
                                </h2>
                                <span className="bg-teal-600 text-white text-xs px-2.5 py-1 rounded-lg font-bold shadow-md shadow-teal-500/30">
                                    {pendingTasks.length} Todo
                                </span>
                            </div>

                            {/* 3D Carousel for TASKS */}
                            <div className="flex-1 flex items-center justify-center -mt-4">
                                <ThreeDImageCarousel
                                    slides={taskSlides}
                                    onReview={(id: string) => router.push(`/dashboard/tasks/${id}`)}
                                />
                            </div>

                            {/* Mini Quick Actions */}
                            <div className="mt-8 pt-6 border-t border-white/50">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Quick Links</h3>
                                <div className="space-y-3">
                                    <button onClick={() => router.push('/dashboard/calendar')} className="w-full flex items-center justify-between p-4 bg-white/40 hover:bg-white/80 rounded-2xl border border-white/50 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Calendar size={16} /></div>
                                            <span className="font-bold text-slate-700 text-sm">My Calendar</span>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                                    </button>
                                    <button onClick={() => router.push('/dashboard/messages')} className="w-full flex items-center justify-between p-4 bg-white/40 hover:bg-white/80 rounded-2xl border border-white/50 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Briefcase size={16} /></div>
                                            <span className="font-bold text-slate-700 text-sm">Supervisor Chat</span>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-400 group-hover:text-purple-600 transition-colors" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}