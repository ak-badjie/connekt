'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Users, Building2, Wallet, Briefcase, 
  CheckSquare, FileCheck, ArrowRight, Database, 
  ChevronRight, ArrowLeftCircle, ArrowRightCircle, 
  TrendingUp, ShieldCheck
} from 'lucide-react';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { useInView, useMotionValue, useSpring, motion, AnimatePresence } from 'framer-motion';

// --- Internal Imports ---
import { useAuth } from '@/context/AuthContext';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { TaskService } from '@/lib/services/task-service';
import { StorageQuotaService } from '@/lib/services/storage-quota-service';
import { Project, Task, ProofOfTask } from '@/lib/types/workspace.types';

// ============================================================================
// PART 1: UTILITIES & ANIMATIONS
// ============================================================================

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

function CountUp({ to, from = 0, direction = 'up', delay = 0, duration = 2, className = '', startWhen = true, separator = '', prefix = '', onStart }: any) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === 'down' ? to : from);
  const springValue = useSpring(motionValue, { damping: 20 + 40 * (1 / duration), stiffness: 100 * (1 / duration) });
  const isInView = useInView(ref, { once: true, margin: '0px' });

  const formatValue = useCallback((latest: number) => {
    const formatted = Intl.NumberFormat('en-US').format(Math.floor(latest));
    return prefix + (separator ? formatted.replace(/,/g, separator) : formatted);
  }, [separator, prefix]);

  useEffect(() => {
    if (isInView && startWhen) {
      const timeoutId = setTimeout(() => { motionValue.set(direction === 'down' ? from : to); }, delay * 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [isInView, startWhen, motionValue, direction, from, to, delay]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', latest => {
      if (ref.current) ref.current.textContent = formatValue(latest);
    });
    return () => unsubscribe();
  }, [springValue, formatValue]);

  return <span className={className} ref={ref} />;
}

// ============================================================================
// PART 2: UI COMPONENTS (GLASS & 3D)
// ============================================================================

// --- 2.1 SpotlightCard ---
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
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500"
        style={{ opacity, background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)` }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

// --- 2.2 AnimatedWave (Background) ---
const AnimatedWave = ({ className, speed = 0.01, amplitude = 40, waveColor = "#0d9488", opacity = 0.3 }: any) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
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

    const geometry = new THREE.PlaneGeometry(3000, 2000, 64, 64);
    const originalPositions = new Float32Array(geometry.attributes.position.array);
    const material = new THREE.MeshLambertMaterial({ color: waveColor, opacity, transparent: true, wireframe: true, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2.5; 
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
        for(let i = 0; i < positions.count; i++) {
            const x = originalPositions[i * 3];
            const y = originalPositions[i * 3 + 1]; 
            positions.setZ(i, simplex(x / 400, (y / 400) + cycle) * amplitude);
        }
        positions.needsUpdate = true;
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [speed, amplitude, waveColor, opacity]);

  return <div ref={containerRef} className={cn("fixed inset-0 w-full h-full -z-10 pointer-events-none", className)} />;
};

// --- 2.3 ThreeDImageCarousel (Validations/Reviews) ---
const ThreeDImageCarousel = ({ slides, onAction, className = '' }: any) => {
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

    if (!slides.length) return <div className="text-slate-500/80 font-medium text-center py-20">No pending validations.</div>;

    return (
        <div className={cn("relative h-[320px] w-full flex items-center justify-center perspective-1000", className)}>
            {slides.map((slide: any, index: number) => (
                <div key={slide.id} className={cn("absolute transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer", getSlideClasses(index))} onClick={() => onAction(slide.id)}>
                    <div className="w-[300px] h-[380px] bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-2xl flex flex-col justify-between overflow-hidden group hover:border-teal-400/50 transition-colors">
                        <div className="h-24 bg-gradient-to-br from-indigo-500/20 to-teal-500/20 p-6 relative">
                            <span className="absolute top-4 right-4 bg-white/80 backdrop-blur text-indigo-900 text-[10px] font-black tracking-wider px-2 py-1 rounded-full uppercase">POT Review</span>
                        </div>
                        <div className="-mt-12 px-6 pb-6 flex flex-col h-full">
                            <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center mb-4 text-indigo-600 border border-indigo-50"><ShieldCheck size={28} /></div>
                            <h3 className="text-slate-800 font-bold text-xl mb-1 line-clamp-2 leading-tight">{slide.title}</h3>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wide mb-3">By: {slide.submittedBy}</p>
                            <p className="text-slate-600 text-sm line-clamp-3 mb-4">{slide.description}</p>
                            <div className="mt-auto pt-4 border-t border-slate-200/50 flex justify-between items-center group-hover:text-indigo-700 transition-colors">
                                <span className="text-xs font-semibold text-slate-400">{slide.itemCount} items</span>
                                <div className="flex items-center gap-2 text-sm font-bold">Validate <ArrowRight size={14} /></div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            {total > 1 && (
                <>
                   <button onClick={(e) => { e.stopPropagation(); navigate('prev'); }} className="absolute left-0 md:left-8 z-40 p-3 bg-white/20 hover:bg-white/40 backdrop-blur rounded-full text-teal-900 shadow-lg transition-all"><ArrowLeftCircle size={28}/></button>
                   <button onClick={(e) => { e.stopPropagation(); navigate('next'); }} className="absolute right-0 md:right-8 z-40 p-3 bg-white/20 hover:bg-white/40 backdrop-blur rounded-full text-teal-900 shadow-lg transition-all"><ArrowRightCircle size={28}/></button>
                </>
            )}
        </div>
    );
};

// --- 2.4 ThreeDHoverGallery (Projects) ---
const ThreeDHoverGallery = ({ images = [], onImageHover, className }: any) => {
    return (
        <div className={cn("flex justify-center items-center gap-2 perspective-1000 h-[380px]", className)}>
            {images.map((img: any, i: number) => (
                <div key={i} onMouseEnter={() => onImageHover(i)} className="relative w-16 h-full transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] hover:w-[320px] hover:z-20 group rounded-3xl overflow-hidden cursor-pointer border border-white/40 shadow-xl hover:shadow-2xl hover:shadow-teal-900/20 bg-slate-200" style={{ transform: 'translateZ(0)' }}>
                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url(${img.src})` }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-teal-950/90 via-teal-900/40 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none">
                        <span className="rotate-90 text-white font-bold tracking-widest text-sm whitespace-nowrap uppercase opacity-80">{img.shortTitle}</span>
                    </div>
                    <div className="absolute bottom-0 left-0 p-6 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100 w-full transform translate-y-4 group-hover:translate-y-0">
                        <div className="flex items-center gap-2 mb-2">
                             <span className={`w-2 h-2 rounded-full ${img.status === 'active' ? 'bg-green-400' : 'bg-amber-400'}`} />
                             <span className="text-teal-100 text-xs font-bold uppercase tracking-wide">{img.status}</span>
                        </div>
                        <h4 className="text-white text-2xl font-bold leading-tight mb-2 drop-shadow-md">{img.title}</h4>
                        <div className="flex items-center gap-3 text-white/80 text-xs font-medium">
                            <span className="flex items-center gap-1"><Users size={12}/> {img.memberCount} Members</span>
                            {img.budget && <span>• ${img.budget.toLocaleString()}</span>}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- 2.5 CardSwap (Notifications) ---
const CardSwap = ({ children }: { children: React.ReactNode[] }) => {
    const [stack, setStack] = useState(React.Children.toArray(children));
    useEffect(() => {
        const interval = setInterval(() => { setStack((prev) => { const newStack = [...prev]; const first = newStack.shift(); if (first) newStack.push(first); return newStack; }); }, 5000); 
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative h-[180px] w-full flex items-center justify-center">
            <AnimatePresence mode="popLayout">
                {stack.slice(0, 3).map((child: any, index) => (
                    <motion.div key={child.key} initial={{ scale: 0.9, y: 40, opacity: 0 }} animate={{ scale: index === 0 ? 1 : 1 - index * 0.05, y: index * 12, opacity: 1 - index * 0.3, zIndex: 3 - index, filter: index === 0 ? 'blur(0px)' : 'blur(2px)' }} exit={{ opacity: 0, scale: 0.8, y: -50 }} transition={{ duration: 0.6, type: "spring" }} className="absolute w-full">
                        {child}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

// ============================================================================
// PART 3: AGENCY DASHBOARD LOGIC & LAYOUT
// ============================================================================

export default function AgencyDashboard() {
    const { user, userProfile } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    // Statistics & Data
    const [pendingProjects, setPendingProjects] = useState<Project[]>([]);
    const [potsToReview, setPotsToReview] = useState<ProofOfTask[]>([]);
    const [storageQuota, setStorageQuota] = useState<any>(null);
    const [hoveredProject, setHoveredProject] = useState<Project | null>(null);

    // Agency Metrics
    const [membersCount, setMembersCount] = useState<number>(0);
    const [totalEarnings, setTotalEarnings] = useState<number>(0);
    const [tasksCreated, setTasksCreated] = useState<number>(0);
    const [talentsManaged, setTalentsManaged] = useState<number>(0);
    const [activeJobs, setActiveJobs] = useState<number>(0);

    const isRecruiterCollective = (userProfile as any)?.agencyType === 'recruiter_collective';

    useEffect(() => {
        if (user && userProfile) {
            const fetchData = async () => {
                try {
                    // 1. Projects
                    const ownedProjects = await EnhancedProjectService.getUserProjects(user.uid);
                    const pending = ownedProjects.filter(p => p.status === 'active' || p.status === 'planning' || p.status === 'on-hold');
                    setPendingProjects(pending);
                    if (pending.length > 0) setHoveredProject(pending[0]);
                    setActiveJobs(ownedProjects.filter(p => p.status === 'active').length);

                    // 2. Reviews (POTs)
                    const supervisedProjects = ownedProjects.map(p => p.id!);
                    const potsForReview = await TaskService.getPotsToReview(user.uid, supervisedProjects);
                    setPotsToReview(potsForReview);

                    // 3. Storage
                    const quota = await StorageQuotaService.getStorageQuota(`${userProfile.username}@connekt.com`);
                    setStorageQuota(quota);

                    // 4. Members & Stats
                    const uniqueMembers = new Set<string>();
                    ownedProjects.forEach(p => p.members.forEach(m => uniqueMembers.add(m.userId)));
                    setMembersCount(uniqueMembers.size);
                    setTalentsManaged(uniqueMembers.size);

                    const allAgencyTasks = await TaskService.getCreatedTasks(user.uid);
                    setTasksCreated(allAgencyTasks.length);

                    // Earnings Logic
                    const earnings = allAgencyTasks
                        .filter(t => t.status === 'paid')
                        .reduce((sum, t) => sum + (t.pricing?.amount || 0), 0);
                    setTotalEarnings(earnings);

                } catch (error) {
                    console.error('Error fetching dashboard data:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [user, userProfile]);

    // --- Data Maps for UI ---
    const projectImages = pendingProjects.map((p, i) => ({
        src:
            p.coverImage ||
            `https://images.unsplash.com/photo-${['1486406146926-c627a92ad1ab', '1600880292203-757bb62b4baf', '1556761175-5973ac0f96fc', '1517245386807-bb43f82c33c4'][i % 4]}?q=80&w=800&auto=format&fit=crop`,
        title: p.title,
        shortTitle: p.title.substring(0, 15) + '...',
        status: p.status,
        memberCount: p.members.length,
        budget: p.budget,
        description: p.description
    }));

    const reviewSlides = potsToReview.map(pot => ({
        id: pot.taskId,
        title: `Validation: Task #${pot.taskId.slice(-4)}`,
        description: pot.notes || 'No description provided.',
        submittedBy: pot.submittedByUsername,
        itemCount: (pot.screenshots?.length || 0) + (pot.videos?.length || 0)
    }));

    return (
        <div className="relative min-h-screen font-sans text-slate-800 selection:bg-teal-200">
            {/* Background */}
            <AnimatedWave />

            <div className="relative z-10 max-w-[1700px] mx-auto p-6 md:p-8 space-y-10">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end backdrop-blur-xl p-8 rounded-[2rem] border border-white/40 bg-white/40 shadow-xl shadow-teal-900/5">
                    <div>
                        <motion.h1 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-900 to-indigo-600 mb-2 tracking-tight"
                        >
                            Agency Dashboard
                        </motion.h1>
                        <p className="text-slate-600 font-medium text-lg">
                            Managing <span className="text-teal-700 font-bold">{isRecruiterCollective ? talentsManaged : membersCount} Members</span> and <span className="text-indigo-700 font-bold">{pendingProjects.length} Projects</span>.
                        </p>
                    </div>
                    <div className="flex gap-4 mt-6 md:mt-0">
                        <button onClick={() => router.push('/dashboard/teams')} className="px-6 py-3 bg-white/50 hover:bg-white text-slate-700 rounded-2xl font-bold border border-white/60 transition-all shadow-sm flex items-center gap-2">
                            <Users size={18} /> Manage Members
                        </button>
                        <button onClick={() => router.push('/dashboard/projects/new')} className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-teal-500/30 hover:-translate-y-1">
                            <Plus size={20} /> New Project
                        </button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {isRecruiterCollective ? (
                        <>
                            <SpotlightCard>
                                <div className="flex items-center gap-4 mb-3 opacity-70"><Briefcase size={20} className="text-teal-800" /><span className="font-bold text-slate-600 text-xs uppercase">Projects</span></div>
                                <div className="text-5xl font-black text-slate-800"><CountUp to={pendingProjects.length} /></div>
                                <div className="mt-2 text-sm text-green-600 font-bold bg-green-100/50 inline-block px-2 py-1 rounded-lg">{activeJobs} Active</div>
                            </SpotlightCard>
                            <SpotlightCard>
                                <div className="flex items-center gap-4 mb-3 opacity-70"><CheckSquare size={20} className="text-blue-800" /><span className="font-bold text-slate-600 text-xs uppercase">Tasks Created</span></div>
                                <div className="text-5xl font-black text-slate-800"><CountUp to={tasksCreated} /></div>
                            </SpotlightCard>
                            <SpotlightCard>
                                <div className="flex items-center gap-4 mb-3 opacity-70"><Users size={20} className="text-purple-800" /><span className="font-bold text-slate-600 text-xs uppercase">Talents Managed</span></div>
                                <div className="text-5xl font-black text-slate-800"><CountUp to={talentsManaged} /></div>
                            </SpotlightCard>
                        </>
                    ) : (
                        <>
                            <SpotlightCard>
                                <div className="flex items-center gap-4 mb-3 opacity-70"><Building2 size={20} className="text-teal-800" /><span className="font-bold text-slate-600 text-xs uppercase">Active Projects</span></div>
                                <div className="text-5xl font-black text-slate-800"><CountUp to={pendingProjects.length} /></div>
                                <div className="mt-2 text-sm text-green-600 font-bold">{activeJobs} Ongoing</div>
                            </SpotlightCard>
                            <SpotlightCard>
                                <div className="flex items-center gap-4 mb-3 opacity-70"><Users size={20} className="text-blue-800" /><span className="font-bold text-slate-600 text-xs uppercase">Agency Members</span></div>
                                <div className="text-5xl font-black text-slate-800"><CountUp to={membersCount} /></div>
                            </SpotlightCard>
                            <SpotlightCard>
                                <div className="flex items-center gap-4 mb-3 opacity-70"><Wallet size={20} className="text-emerald-800" /><span className="font-bold text-slate-600 text-xs uppercase">Total Earnings</span></div>
                                <div className="text-5xl font-black text-slate-800"><CountUp to={totalEarnings} prefix="$" separator="," /></div>
                                <div className="mt-2 text-sm text-emerald-600 font-bold">Gross Revenue</div>
                            </SpotlightCard>
                        </>
                    )}
                    <SpotlightCard>
                        <div className="flex items-center gap-4 mb-3 opacity-70"><FileCheck size={20} className="text-rose-600" /><span className="font-bold text-slate-600 text-xs uppercase">Pending Review</span></div>
                        <div className="text-5xl font-black text-slate-800"><CountUp to={potsToReview.length} /></div>
                        <div className={`mt-2 text-sm font-bold ${potsToReview.length > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`}>
                            {potsToReview.length > 0 ? "Action Required" : "All Clear"}
                        </div>
                    </SpotlightCard>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pb-10">
                    
                    {/* Left Col (Projects & Members) */}
                    <div className="xl:col-span-8 space-y-8">
                        {/* Gallery */}
                        <div className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-[2.5rem] p-8 relative overflow-hidden shadow-xl shadow-teal-900/5">
                            <div className="flex justify-between items-center mb-8 px-2">
                                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                    <div className="p-2 bg-teal-100 rounded-xl text-teal-700"><Database size={20}/></div>
                                    Agency Projects
                                </h2>
                                <button onClick={() => router.push('/dashboard/projects')} className="text-sm font-bold text-teal-700 hover:text-teal-900 bg-white/50 px-4 py-2 rounded-xl transition-all">View All</button>
                            </div>
                            
                            <div className="flex flex-col lg:flex-row gap-8">
                                <div className="w-full lg:w-3/5">
                                    <ThreeDHoverGallery images={projectImages} onImageHover={(idx: number) => setHoveredProject(pendingProjects[idx])} />
                                </div>
                                
                                {/* Detail Panel */}
                                <div className="w-full lg:w-2/5 min-h-[380px] bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 border border-white/60 shadow-inner flex flex-col transition-all duration-300 relative">
                                    {hoveredProject ? (
                                        <motion.div key={hoveredProject.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="h-full flex flex-col">
                                            <div className="mb-6">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-4 ${hoveredProject.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${hoveredProject.status === 'active' ? 'bg-green-500' : 'bg-amber-500'}`} />
                                                    {hoveredProject.status}
                                                </span>
                                                <h3 className="text-3xl font-bold text-slate-800 mb-2 leading-tight">{hoveredProject.title}</h3>
                                                <p className="text-slate-500 text-sm font-medium line-clamp-2">{hoveredProject.description}</p>
                                                {hoveredProject.budget && <p className="mt-2 text-teal-700 font-bold text-lg">${hoveredProject.budget.toLocaleString()}</p>}
                                            </div>
                                            <div className="flex-1 overflow-hidden flex flex-col">
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Assigned Members</h4>
                                                <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                                    {hoveredProject.members.length > 0 ? hoveredProject.members.map((member, i) => (
                                                        <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/60 transition-colors">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold text-xs shadow-md">{member.username.charAt(0).toUpperCase()}</div>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-bold text-slate-700">{member.username}</p>
                                                                <p className="text-[10px] text-slate-500 font-semibold uppercase">{member.role}</p>
                                                            </div>
                                                        </div>
                                                    )) : <div className="text-sm text-slate-400 italic">No members assigned.</div>}
                                                </div>
                                            </div>
                                            <button onClick={() => router.push(`/dashboard/projects/${hoveredProject.id}`)} className="w-full mt-4 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold transition-all hover:bg-teal-600 hover:shadow-lg">Manage Project</button>
                                        </motion.div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-400"><Database size={48} className="mb-4 opacity-20" /><p className="font-bold">Hover over a project<br/>to see details</p></div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <SpotlightCard className="h-[280px]">
                                <h3 className="text-lg font-bold mb-6 text-slate-800 flex items-center gap-2"><TrendingUp size={18} className="text-teal-600"/> Agency Activity</h3>
                                <CardSwap>
                                    {[
                                        { id: 1, title: 'Revenue Milestone', msg: 'Crossed $5k in earnings', time: '1d ago', color: 'bg-emerald-50/90 border-emerald-200' },
                                        { id: 2, title: 'New Member', msg: 'Dev Team joined Project Alpha', time: '4h ago', color: 'bg-indigo-50/90 border-indigo-200' },
                                        { id: 3, title: 'Submission', msg: 'Design task submitted for review', time: '10m ago', color: 'bg-rose-50/90 border-rose-200' }
                                    ].map((item) => (
                                        <div key={item.id} className={`p-5 rounded-2xl border ${item.color} shadow-sm backdrop-blur-sm`}>
                                            <div className="flex justify-between items-start mb-2"><h4 className="font-bold text-slate-900">{item.title}</h4><span className="text-[10px] bg-white/50 px-2 py-0.5 rounded text-slate-500 font-bold">{item.time}</span></div>
                                            <p className="text-sm text-slate-600 font-medium">{item.msg}</p>
                                        </div>
                                    ))}
                                </CardSwap>
                             </SpotlightCard>

                             <SpotlightCard className="h-[280px]">
                                <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2"><Database size={18} className="text-teal-600"/> Agency Storage</h3>
                                {storageQuota && (
                                    <div className="flex items-center gap-8 h-full pb-8">
                                        <div className="relative w-32 h-32 flex-shrink-0">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                <path className="text-slate-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                                <motion.path className="text-teal-500" initial={{ pathLength: 0 }} animate={{ pathLength: storageQuota.usedSpace / storageQuota.totalQuota }} transition={{ duration: 1.5, ease: "easeOut" }} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-xl font-black text-slate-800">{Math.round((storageQuota.usedSpace / storageQuota.totalQuota) * 100)}%</span></div>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-sm text-slate-500 font-medium">Shared workspace usage.</p>
                                            <div><p className="text-2xl font-bold text-slate-800">{(storageQuota.usedSpace / (1024 * 1024)).toFixed(1)} MB</p><p className="text-xs text-slate-400 font-bold uppercase">Used of {(storageQuota.totalQuota / (1024 * 1024)).toFixed(0)} MB</p></div>
                                        </div>
                                    </div>
                                )}
                             </SpotlightCard>
                        </div>
                    </div>

                    {/* Right Col (Validations) */}
                    <div className="xl:col-span-4 space-y-8">
                        <div className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-[2.5rem] p-8 h-full min-h-[600px] flex flex-col shadow-xl shadow-teal-900/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/20 rounded-full blur-[80px] -z-10 pointer-events-none" />
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3"><div className="p-2 bg-indigo-100 rounded-xl text-indigo-600"><FileCheck size={20}/></div>Validations</h2>
                                <span className="bg-indigo-500 text-white text-xs px-2.5 py-1 rounded-lg font-bold shadow-md shadow-indigo-500/30">{potsToReview.length} Pending</span>
                            </div>
                            <div className="flex-1 flex items-center justify-center -mt-4"><ThreeDImageCarousel slides={reviewSlides} onAction={(id: string) => router.push(`/dashboard/tasks/${id}`)} /></div>
                            <div className="mt-8 pt-6 border-t border-white/50">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Quick Actions</h3>
                                <div className="space-y-3">
                                    <button onClick={() => router.push('/dashboard/payouts')} className="w-full flex items-center justify-between p-4 bg-white/40 hover:bg-white/80 rounded-2xl border border-white/50 transition-all group">
                                        <div className="flex items-center gap-3"><div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><Wallet size={16}/></div><span className="font-bold text-slate-700 text-sm">Payouts & Finance</span></div>
                                        <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-600 transition-colors"/>
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