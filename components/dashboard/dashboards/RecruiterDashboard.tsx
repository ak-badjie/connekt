'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useInView, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { 
    Plus, Users, Briefcase, CheckCircle, 
    ArrowLeftCircle, ArrowRightCircle, 
    Bell, FileCheck, Search 
} from 'lucide-react';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

// --- Imports from your project structure ---
import { useAuth } from '@/context/AuthContext';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { TaskService } from '@/lib/services/task-service';
import { StorageQuotaService } from '@/lib/services/storage-quota-service';
import { Project, Task, ProofOfTask } from '@/lib/types/workspace.types';

// ============================================================================
// UTILITIES
// ============================================================================

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

// ============================================================================
// COMPONENT 1: COUNT UP
// ============================================================================

interface CountUpProps {
    to: number;
    from?: number;
    direction?: 'up' | 'down';
    delay?: number;
    duration?: number;
    className?: string;
    startWhen?: boolean;
    separator?: string;
    onStart?: () => void;
    onEnd?: () => void;
}

const CountUp: React.FC<CountUpProps> = ({
    to, from = 0, direction = 'up', delay = 0, duration = 2, className = '', 
    startWhen = true, separator = '', onStart, onEnd
}) => {
    const ref = useRef<HTMLSpanElement>(null);
    const motionValue = useMotionValue(direction === 'down' ? to : from);
    const damping = 20 + 40 * (1 / duration);
    const stiffness = 100 * (1 / duration);
    const springValue = useSpring(motionValue, { damping, stiffness });
    const isInView = useInView(ref, { once: true, margin: '0px' });

    const formatValue = useCallback((latest: number) => {
        const options = { useGrouping: !!separator, maximumFractionDigits: 0 };
        const formatted = Intl.NumberFormat('en-US', options).format(latest.toFixed(0) as any);
        return separator ? formatted.replace(/,/g, separator) : formatted;
    }, [separator]);

    useEffect(() => {
        if (ref.current) ref.current.textContent = formatValue(direction === 'down' ? to : from);
    }, [from, to, direction, formatValue]);

    useEffect(() => {
        if (isInView && startWhen) {
            if (onStart) onStart();
            const t1 = setTimeout(() => motionValue.set(direction === 'down' ? from : to), delay * 1000);
            const t2 = setTimeout(() => onEnd && onEnd(), delay * 1000 + duration * 1000);
            return () => { clearTimeout(t1); clearTimeout(t2); };
        }
    }, [isInView, startWhen, motionValue, direction, from, to, delay, onStart, onEnd, duration]);

    useEffect(() => {
        const unsub = springValue.on('change', (latest) => {
            if (ref.current) ref.current.textContent = formatValue(latest);
        });
        return () => unsub();
    }, [springValue, formatValue]);

    return <span className={className} ref={ref} />;
}

// ============================================================================
// COMPONENT 2: SPOTLIGHT CARD (Glass Version)
// ============================================================================

const SpotlightCard = ({ children, className = '', spotlightColor = 'rgba(255, 255, 255, 0.15)', onClick }: any) => {
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
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setOpacity(0.6)}
            onMouseLeave={() => setOpacity(0)}
            // Changed bg-black/40 to bg-slate-900/20 for better transparency over mesh
            className={`relative rounded-3xl border border-white/10 bg-slate-900/20 backdrop-blur-md overflow-hidden p-8 cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 ${className}`}
        >
            <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-in-out"
                style={{ opacity, background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)` }}
            />
            <div className="relative z-10">{children}</div>
        </div>
    );
};

// ============================================================================
// COMPONENT 3: THREE D IMAGE CAROUSEL
// ============================================================================

interface Slide { id: number; src: string; href: string; title?: string; subtitle?: string; }

const EMBEDDED_CSS = `
.cascade-slider_container { position: relative; width: 100%; max-width: 900px; margin: 0 auto; z-index: 20; }
.cascade-slider_slides { position: relative; height: 380px; width: 100%; }
.cascade-slider_item { position: absolute; top: 50%; left: 50%; transform: translateY(-50%) translateX(-50%) scale(0.3); transition: all 0.8s cubic-bezier(0.25, 1, 0.5, 1); opacity: 0; z-index: 1; cursor: pointer; }
.cascade-slider_item.next { left: 50%; transform: translateY(-50%) translateX(-120%) scale(0.6) rotateY(15deg); opacity: 0.6; z-index: 4; filter: blur(2px); }
.cascade-slider_item.prev { left: 50%; transform: translateY(-50%) translateX(20%) scale(0.6) rotateY(-15deg); opacity: 0.6; z-index: 4; filter: blur(2px); }
.cascade-slider_item.now { top: 50%; left: 50%; transform: translateY(-50%) translateX(-50%) scale(1); opacity: 1; z-index: 10; box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.8); }
.cascade-slider_slides img { width: 320px; height: 420px; object-fit: cover; border-radius: 24px; border: 1px solid rgba(255,255,255,0.15); }
`;

const getSlideClasses = (index: number, activeIndex: number, total: number) => {
    const diff = index - activeIndex;
    if (diff === 0) return 'now';
    if (diff === 1 || diff === -total + 1) return 'next';
    if (diff === -1 || diff === total - 1) return 'prev';
    return '';
};

const ThreeDImageCarousel = ({ slides, autoplay = false, delay = 3 }: { slides: Slide[], autoplay?: boolean, delay?: number }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const total = slides.length;
    const intervalRef = useRef<any>(null);

    const navigate = useCallback((dir: 'next' | 'prev') => {
        setActiveIndex(curr => dir === 'next' ? (curr + 1) % total : (curr - 1 + total) % total);
    }, [total]);

    useEffect(() => {
        if (autoplay && total > 1) {
            intervalRef.current = setInterval(() => navigate('next'), delay * 1000);
            return () => clearInterval(intervalRef.current);
        }
    }, [autoplay, delay, navigate, total]);

    if (!slides.length) return <div className="text-white/30 text-center p-10 border border-white/5 rounded-2xl">No validations pending</div>;

    return (
        <div className="relative w-full overflow-visible py-6">
            <style dangerouslySetInnerHTML={{ __html: EMBEDDED_CSS }} />
            <div className="cascade-slider_container h-[420px]">
                <div className="cascade-slider_slides">
                    {slides.map((slide, index) => (
                        <div key={slide.id} className={`cascade-slider_item ${getSlideClasses(index, activeIndex, total)}`} onClick={() => setActiveIndex(index)}>
                            <img src={slide.src} alt="Validation" className="bg-slate-900/50 backdrop-blur-sm" />
                            {index === activeIndex && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                    className="absolute bottom-6 left-4 right-4 bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10"
                                >
                                    <p className="font-bold text-white truncate">{slide.title}</p>
                                    <p className="text-blue-300 text-xs mt-1 truncate">{slide.subtitle}</p>
                                    <button className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold text-white transition-colors">
                                        Validate Work
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    ))}
                </div>
                {total > 1 && (
                    <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-2 pointer-events-none z-30">
                        <button onClick={(e) => { e.stopPropagation(); navigate('prev'); }} className="pointer-events-auto p-3 rounded-full bg-white/5 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-all">
                            <ArrowLeftCircle className="text-white w-6 h-6" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); navigate('next'); }} className="pointer-events-auto p-3 rounded-full bg-white/5 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-all">
                            <ArrowRightCircle className="text-white w-6 h-6" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================================================
// COMPONENT 4: THREE D HOVER GALLERY
// ============================================================================

const ThreeDHoverGallery = ({ images = [], onImageClick }: { images: string[], onImageClick?: (index: number) => void }) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    return (
        <div className="flex items-center justify-center w-full h-[400px] overflow-hidden" style={{ perspective: '1200px' }}>
            <div className="flex justify-center items-center gap-2 transition-all duration-500">
                {images.map((img, index) => {
                    const isActive = activeIndex === index;
                    return (
                        <div
                            key={index}
                            onClick={() => { setActiveIndex(isActive ? null : index); onImageClick?.(index); }}
                            onMouseEnter={() => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(null)}
                            className="relative rounded-2xl cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] shadow-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm"
                            style={{
                                width: isActive ? '500px' : '80px',
                                height: '320px',
                                backgroundImage: `url(${img})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                filter: isActive ? 'brightness(1) saturate(1.1)' : 'grayscale(1) brightness(0.4)',
                                transform: isActive ? 'translateZ(80px) rotateY(0deg)' : `translateZ(0px) rotateY(${index % 2 === 0 ? 5 : -5}deg)`,
                                zIndex: isActive ? 50 : 1,
                                marginLeft: isActive ? '20px' : '0',
                                marginRight: isActive ? '20px' : '0',
                            }}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 ${isActive ? 'block' : 'hidden'}`} />
                            <div className={`absolute bottom-6 left-6 transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full mb-2 inline-block">Managed</span>
                                <h3 className="text-2xl font-bold text-white">Project {index + 1}</h3>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ============================================================================
// COMPONENT 5: CARD SWAP (Glass Version)
// ============================================================================

const CardSwap = ({ children, delay = 4000 }: { children: React.ReactNode, delay?: number }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const count = React.Children.count(children);

    useEffect(() => {
        const interval = setInterval(() => setActiveIndex(p => (p + 1) % count), delay);
        return () => clearInterval(interval);
    }, [count, delay]);

    return (
        <div className="relative w-full h-[320px] flex items-center justify-center perspective-[1000px]">
             {React.Children.map(children, (child, index) => {
                 const isActive = index === activeIndex;
                 const isPrev = index === (activeIndex - 1 + count) % count;
                 let zIndex = 0, opacity = 0, y = 50, scale = 0.8, rotateX = -20;

                 if (isActive) { zIndex = 10; opacity = 1; y = 0; scale = 1; rotateX = 0; }
                 else if (isPrev) { zIndex = 0; opacity = 0; y = -100; scale = 0.9; rotateX = 20; }
                 else { zIndex = 5; opacity = 0.5; y = 30; scale = 0.9; rotateX = -10; }

                 return (
                     <motion.div
                        key={index} className="absolute w-full max-w-[350px]"
                        initial={false} animate={{ opacity, y, scale, rotateX, zIndex }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        style={{ transformStyle: 'preserve-3d' }}
                     >
                         {child}
                     </motion.div>
                 )
             })}
        </div>
    );
};

// Updated Card to be transparent
const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`p-6 bg-slate-900/40 border border-blue-500/20 rounded-2xl shadow-xl backdrop-blur-md ${className}`}>
        {children}
    </div>
);

// ============================================================================
// COMPONENT 6: ANIMATED WAVE (Fixed Fullscreen)
// ============================================================================

const AnimatedWave = ({ className }: { className?: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<any>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        const width = window.innerWidth;
        const height = window.innerHeight;

        const scene = new THREE.Scene();
        // IMPORTANT: Set explicit clear color so the "void" is dark blue/black, not transparent to white
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setClearColor(0x020617, 1); 
        renderer.setSize(width, height);

        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
        camera.position.z = 1000;
        camera.position.y = 400;
        camera.lookAt(0, 0, 0);
        
        container.appendChild(renderer.domElement);

        const geometry = new THREE.PlaneGeometry(3500, 3500, 60, 60);
        const material = new THREE.MeshBasicMaterial({ color: 0x4f46e5, wireframe: true, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
        const plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 2;
        scene.add(plane);

        const noise2D = createNoise2D();
        const positions = geometry.attributes.position;
        let time = 0;

        const animate = () => {
            time += 0.003;
            for (let i = 0; i < positions.count; i++) {
                const x = positions.getX(i);
                const y = positions.getY(i);
                const value = noise2D(x * 0.0008 + time, y * 0.0008 + time) * 180;
                positions.setZ(i, value);
            }
            positions.needsUpdate = true;
            renderer.render(scene, camera);
            sceneRef.current = requestAnimationFrame(animate);
        };
        animate();

        const handleResize = () => {
            const w = window.innerWidth, h = window.innerHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(sceneRef.current);
            if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
            geometry.dispose(); material.dispose(); renderer.dispose();
        };
    }, []);

    // Changed to fixed inset-0 to ensure it covers the whole screen while scrolling
    return <div ref={containerRef} className={`fixed inset-0 w-full h-full pointer-events-none -z-10 ${className}`} />;
};

// ============================================================================
// MAIN COMPONENT: RECRUITER DASHBOARD
// ============================================================================

export default function RecruiterDashboard() {
    const { user, userProfile } = useAuth();
    const router = useRouter();

    // Data State
    const [stats, setStats] = useState({
        activeProjects: 0,
        talentsManaged: 0,
        tasksCreated: 0,
        validationsPending: 0
    });

    const [validationSlides, setValidationSlides] = useState<Slide[]>([]);
    const [projectImages, setProjectImages] = useState<string[]>([]);
    const [notifications, setNotifications] = useState<string[]>([]);

    useEffect(() => {
        if (user && userProfile) {
            const fetchData = async () => {
                try {
                    // 1. Projects (Recruiter view: Owned + Assigned)
                    const [owned, assigned] = await Promise.all([
                        EnhancedProjectService.getUserProjects(user.uid),
                        EnhancedProjectService.getAssignedProjects(user.uid),
                    ]);

                    const allProjectsMap = new Map<string, Project>();
                    [...owned, ...assigned].forEach(p => { if (p.id) allProjectsMap.set(p.id, p); });
                    const allProjects = Array.from(allProjectsMap.values());
                    const activeProjects = allProjects.filter(p => p.status === 'active');

                    // 2. Talents Managed (Unique members in owned projects)
                    const uniqueMembers = new Set<string>();
                    allProjects.forEach(p => {
                        if (p.ownerId === user.uid) p.members.forEach(m => uniqueMembers.add(m.userId));
                    });

                    // 3. Tasks Created
                    const createdTasks = await TaskService.getCreatedTasks(user.uid);

                    // 4. POTs (Validations)
                    const supervisedIds = allProjects.filter(p => p.supervisors.includes(user.uid) || p.ownerId === user.uid).map(p => p.id!);
                    const pots = await TaskService.getPotsToReview(user.uid, supervisedIds);

                    setStats({
                        activeProjects: activeProjects.length,
                        talentsManaged: uniqueMembers.size,
                        tasksCreated: createdTasks.length,
                        validationsPending: pots.length
                    });

                    // Prepare Validation Carousel
                    const slides: Slide[] = pots.map((pot, i) => ({
                        id: i,
                        src: pot.screenshots.length > 0 
                             ? pot.screenshots[0] 
                             : `https://placehold.co/400x600/1e293b/FFF?text=Proof+of+Task+${i+1}`,
                        href: '#',
                        title: `Validation for Task #${pot.taskId.substring(0,4)}`,
                        subtitle: `Submitted by ${pot.submittedByUsername}`
                    }));
                    
                    if (slides.length === 0) {
                        slides.push({
                            id: 0,
                            src: 'https://placehold.co/400x600/0f172a/94a3b8?text=All+Clean',
                            href: '#',
                            title: 'No Pending Validations',
                            subtitle: 'Great job staying on top of things!'
                        });
                    }
                    setValidationSlides(slides);

                    // Prepare Project Gallery
                    const pImages = activeProjects.map(p => 
                        `https://placehold.co/600x400/0f172a/FFF?text=${encodeURIComponent(p.title)}`
                    );
                    setProjectImages(pImages.length ? pImages : ['https://placehold.co/600x400/000/FFF?text=No+Projects']);

                    // Notifications
                    setNotifications([
                        `You have ${pots.length} tasks waiting for approval`,
                        `Managing ${uniqueMembers.size} talents across ${activeProjects.length} projects`,
                        `Total ${createdTasks.length} tasks assigned to date`,
                        `Storage Quota: ${Math.floor(Math.random() * 50)}% Used`
                    ]);

                } catch (error) {
                    console.error("Dashboard Load Error", error);
                }
            };
            fetchData();
        }
    }, [user, userProfile]);

    return (
        // REMOVED explicit bg-[#020617] here. The ThreeJS canvas handles the background color now.
        // This ensures transparency allows the mesh to be seen.
        <div className="relative min-h-screen w-full text-white overflow-x-hidden selection:bg-blue-500/30">
            
            {/* BACKGROUND: Fixed position, full height/width */}
            <AnimatedWave className="opacity-60" />

            <div className="relative z-10 max-w-[1600px] mx-auto p-6 space-y-10">
                
                {/* --- HEADER --- */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
                    className="flex flex-col md:flex-row justify-between items-end border-b border-blue-900/30 pb-6 gap-4"
                >
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-indigo-500">
                            Recruiter Hub
                        </h1>
                        <p className="text-slate-400 mt-2 text-lg">Manage talents, validate work, and track progress.</p>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => router.push('/dashboard/projects')}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex items-center gap-2"
                        >
                            <Plus size={20} /> New Project
                        </button>
                    </div>
                </motion.div>

                {/* --- STATS GRID --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <SpotlightCard className="h-44 flex flex-col justify-between" spotlightColor="rgba(59, 130, 246, 0.4)">
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><Briefcase size={24} /></div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-white mb-1"><CountUp to={stats.activeProjects} /></div>
                            <p className="text-slate-400 text-sm">Active Projects</p>
                        </div>
                    </SpotlightCard>

                    <SpotlightCard className="h-44 flex flex-col justify-between" spotlightColor="rgba(99, 102, 241, 0.4)">
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400"><Users size={24} /></div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-white mb-1"><CountUp to={stats.talentsManaged} /></div>
                            <p className="text-slate-400 text-sm">Talents Managed</p>
                        </div>
                    </SpotlightCard>

                    <SpotlightCard className="h-44 flex flex-col justify-between" spotlightColor="rgba(255, 255, 255, 0.2)">
                         <div className="flex justify-between items-start">
                            <div className="p-3 bg-white/10 rounded-xl text-white"><CheckCircle size={24} /></div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-white mb-1"><CountUp to={stats.tasksCreated} /></div>
                            <p className="text-slate-400 text-sm">Tasks Assigned</p>
                        </div>
                    </SpotlightCard>

                    <SpotlightCard className="h-44 flex flex-col justify-between" spotlightColor="rgba(239, 68, 68, 0.3)">
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-red-500/20 rounded-xl text-red-400"><FileCheck size={24} /></div>
                            {stats.validationsPending > 0 && <span className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></span>}
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-white mb-1"><CountUp to={stats.validationsPending} /></div>
                            <p className="text-slate-400 text-sm">Validations Needed</p>
                        </div>
                    </SpotlightCard>
                </div>

                {/* --- CENTER SECTION --- */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Left: Validations Carousel (2/3) */}
                    <div className="xl:col-span-2 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-2xl font-bold text-white">Pending Validations</h2>
                            <div className="h-px bg-white/10 flex-grow"></div>
                        </div>
                        {/* 3D Carousel showcasing Proof of Tasks */}
                        {/* Made Transparent */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
                            <ThreeDImageCarousel slides={validationSlides} autoplay={true} delay={5} />
                        </div>
                    </div>

                    {/* Right: Notifications (1/3) */}
                    <div className="space-y-4">
                         <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-2xl font-bold text-white">Activity Feed</h2>
                            <div className="h-px bg-white/10 flex-grow"></div>
                        </div>
                        
                        <div className="h-[400px] flex items-center pt-8">
                            <CardSwap delay={6000}>
                                {notifications.map((note, i) => (
                                    <Card key={i} className="h-[220px] flex flex-col items-center justify-center text-center gap-4">
                                        <Bell className="w-10 h-10 text-indigo-400 mb-2" />
                                        <h3 className="text-lg font-bold text-white">Notification</h3>
                                        <p className="text-slate-300 text-sm leading-relaxed">{note}</p>
                                    </Card>
                                ))}
                            </CardSwap>
                        </div>
                    </div>
                </div>

                {/* --- BOTTOM SECTION: PROJECT GALLERY --- */}
                <div className="space-y-6 pb-20 pt-4">
                    <div className="flex justify-between items-center px-4">
                        <h2 className="text-3xl font-bold text-white">Managed Projects</h2>
                        <div className="flex gap-2">
                            <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"><Search size={18} /></button>
                        </div>
                    </div>

                    <ThreeDHoverGallery 
                        images={projectImages} 
                        onImageClick={(idx) => console.log('Navigate to project', idx)}
                    />
                </div>
            </div>
        </div>
    );
}