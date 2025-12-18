'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Users, Briefcase, Calendar, CheckCircle, 
  AlertCircle, ArrowRight, Clock, Database, ChevronRight, 
  ArrowLeftCircle, ArrowRightCircle
} from 'lucide-react';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { useInView, useMotionValue, useSpring, motion, AnimatePresence } from 'framer-motion';

// --- Internal Imports (Mocking your path structure) ---
import { useAuth } from '@/context/AuthContext';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { TaskService } from '@/lib/services/task-service';
import { StorageQuotaService } from '@/lib/services/storage-quota-service';
import { Project, Task, ProofOfTask } from '@/lib/types/workspace.types';

// ============================================================================
// PART 1: UTILITIES
// ============================================================================

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

// ============================================================================
// PART 2: UI COMPONENTS
// ============================================================================

// --- 2.1 CountUp Component ---
function CountUp({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 2,
  className = '',
  startWhen = true,
  separator = '',
  onStart,
  onEnd
}: any) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === 'down' ? to : from);
  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);
  const springValue = useSpring(motionValue, { damping, stiffness });
  const isInView = useInView(ref, { once: true, margin: '0px' });

  const getDecimalPlaces = (num: number) => {
    const str = num.toString();
    return str.includes('.') && parseInt(str.split('.')[1]) !== 0 ? str.split('.')[1].length : 0;
  };
  const maxDecimals = Math.max(getDecimalPlaces(from), getDecimalPlaces(to));

  const formatValue = useCallback((latest: number) => {
    const options = {
      useGrouping: !!separator,
      minimumFractionDigits: maxDecimals > 0 ? maxDecimals : 0,
      maximumFractionDigits: maxDecimals > 0 ? maxDecimals : 0
    };
    const formatted = Intl.NumberFormat('en-US', options).format(latest);
    return separator ? formatted.replace(/,/g, separator) : formatted;
  }, [maxDecimals, separator]);

  useEffect(() => {
    if (ref.current) ref.current.textContent = formatValue(direction === 'down' ? to : from);
  }, [from, to, direction, formatValue]);

  useEffect(() => {
    if (isInView && startWhen) {
      if (typeof onStart === 'function') onStart();
      const timeoutId = setTimeout(() => {
        motionValue.set(direction === 'down' ? from : to);
      }, delay * 1000);
      const durationTimeoutId = setTimeout(() => {
        if (typeof onEnd === 'function') onEnd();
      }, delay * 1000 + duration * 1000);
      return () => { clearTimeout(timeoutId); clearTimeout(durationTimeoutId); };
    }
  }, [isInView, startWhen, motionValue, direction, from, to, delay, onStart, onEnd, duration]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', latest => {
      if (ref.current) ref.current.textContent = formatValue(latest);
    });
    return () => unsubscribe();
  }, [springValue, formatValue]);

  return <span className={className} ref={ref} />;
}

// --- 2.2 SpotlightCard Component (Glass) ---
const SpotlightCard = ({ children, className = '', spotlightColor = 'rgba(13, 148, 136, 0.2)', onClick }: any) => {
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
        // Transparent glass bg to reveal mesh
        "relative rounded-3xl border border-teal-900/10 bg-white/20 backdrop-blur-sm overflow-hidden p-8 transition-transform duration-300 hover:scale-[1.02] cursor-pointer shadow-lg shadow-teal-900/5",
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

// --- 2.3 AnimatedWave Component (Scroll-Aware) ---
const AnimatedWave = ({
  className, speed = 0.015, amplitude = 50, waveColor = "#0d9488", opacity = 0.4, mouseInteraction = true
}: any) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneElementsRef = useRef<any>({});

  useEffect(() => {
    if (!containerRef.current) return;
    
    const cleanup = () => {
       const current = sceneElementsRef.current;
       if (current.renderer) {
         current.renderer.dispose();
         if(containerRef.current?.contains(current.renderer.domElement)) {
            containerRef.current.removeChild(current.renderer.domElement);
         }
       }
    };
    cleanup();

    // Get exact container dimensions (which matches content height)
    const width = containerRef.current.offsetWidth;
    const height = containerRef.current.offsetHeight;

    const scene = new THREE.Scene();
    // Very light fog to fade out edges if huge
    scene.fog = new THREE.FogExp2(0xffffff, 0.0002); 

    // Camera Setup
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 20000);
    
    // DYNAMIC Z-POSITION:
    // If height is large (long scroll), move camera back so mesh density remains consistent.
    // 800 is a base distance, height * 0.6 adds distance as page gets longer.
    const cameraZ = Math.max(800, height * 0.6); 
    camera.position.set(0, 0, cameraZ);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // HUGE GEOMETRY:
    // 20000 x 20000 units to ensure it covers the canvas even if you scroll down forever.
    const geometry = new THREE.PlaneGeometry(20000, 20000, 100, 100);
    const originalPositions = new Float32Array(geometry.attributes.position.array);
    const material = new THREE.MeshLambertMaterial({
      color: waveColor, 
      opacity: opacity, 
      transparent: true, 
      wireframe: true, 
      side: THREE.DoubleSide
    });
    const plane = new THREE.Mesh(geometry, material);
    
    const group = new THREE.Object3D();
    group.add(plane);
    group.rotation.x = 0; // Stand upright
    group.position.y = 0; 
    group.position.z = -1000; // Behind camera
    
    scene.add(group);

    // Lights
    const light = new THREE.PointLight(0xffffff, 2, cameraZ * 3);
    light.position.set(0, height / 2, cameraZ); 
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 1.2)); 

    const simplex = createNoise2D();
    let cycle = 0;

    const animate = () => {
        cycle += speed;
        const positions = geometry.attributes.position;
        
        for(let i = 0; i < positions.count; i++) {
            const x = originalPositions[i * 3];
            const y = originalPositions[i * 3 + 1];
            // Looser noise for larger geometry
            const noiseVal = simplex(x / 1000, (y / 1000) + cycle) * amplitude;
            positions.setZ(i, noiseVal);
        }
        positions.needsUpdate = true;
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    };

    animate();
    sceneElementsRef.current = { renderer, scene, camera };

    const handleResize = () => {
        if(!containerRef.current) return;
        const newW = containerRef.current.offsetWidth;
        const newH = containerRef.current.offsetHeight;
        
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
        window.removeEventListener('resize', handleResize);
        cleanup();
    }
  }, [speed, amplitude, waveColor, opacity]);

  // Changed to ABSOLUTE h-full to fill parent scrollHeight
  return <div ref={containerRef} className={cn("absolute inset-0 h-full w-full -z-10 overflow-hidden", className)} style={{ pointerEvents: 'none' }} />;
};

// --- 2.4 ThreeDImageCarousel ---
const ThreeDImageCarousel = ({ slides, itemCount = 5, className = '' }: any) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const total = slides.length;

    const getSlideClasses = (index: number) => {
        const diff = index - activeIndex;
        if (diff === 0) return 'z-30 scale-100 opacity-100 translate-x-0';
        if (diff === 1 || diff === -total + 1) return 'z-20 scale-75 opacity-70 translate-x-[60%]';
        if (diff === -1 || diff === total - 1) return 'z-20 scale-75 opacity-70 -translate-x-[60%]';
        return 'z-10 scale-50 opacity-0';
    };

    const navigate = (dir: 'next' | 'prev') => {
        setActiveIndex(c => dir === 'next' ? (c + 1) % total : (c - 1 + total) % total);
    };

    if (!slides.length) return <div className="text-slate-500 text-center py-10">No pending tasks</div>;

    return (
        <div className={cn("relative h-[300px] w-full flex items-center justify-center perspective-1000", className)}>
            {slides.map((slide: any, index: number) => (
                <div 
                    key={slide.id}
                    className={cn(
                        "absolute transition-all duration-500 ease-in-out cursor-pointer",
                        getSlideClasses(index)
                    )}
                    onClick={() => window.location.href = slide.href}
                >
                    <div className="w-[280px] h-[360px] bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl p-6 flex flex-col justify-between hover:border-teal-500 transition-colors">
                        <div>
                            <span className="inline-block px-3 py-1 bg-teal-500/20 text-teal-800 text-xs font-bold rounded-full mb-3">Task</span>
                            <h3 className="text-slate-900 font-bold text-lg mb-2 line-clamp-2">{slide.title}</h3>
                            <p className="text-slate-700 text-sm line-clamp-3">{slide.description || "No description provided."}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-teal-900/10 flex justify-between items-center">
                            <span className="text-xs text-slate-600">{slide.date}</span>
                            <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-800">
                                <ArrowRight size={14} />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            {total > 1 && (
                <>
                   <button onClick={(e) => { e.stopPropagation(); navigate('prev'); }} className="absolute left-4 z-40 p-2 text-slate-500 hover:text-teal-700"><ArrowLeftCircle size={32}/></button>
                   <button onClick={(e) => { e.stopPropagation(); navigate('next'); }} className="absolute right-4 z-40 p-2 text-slate-500 hover:text-teal-700"><ArrowRightCircle size={32}/></button>
                </>
            )}
        </div>
    );
};

// --- 2.5 ThreeDHoverGallery ---
const ThreeDHoverGallery = ({ images = [], onImageHover, className }: any) => {
    return (
        <div className={cn("flex justify-center items-center gap-2 perspective-1000 h-[300px]", className)}>
            {images.map((img: any, i: number) => (
                <div 
                    key={i}
                    onMouseEnter={() => onImageHover(i)}
                    className="relative w-16 h-full transition-all duration-500 hover:w-[300px] hover:z-20 group rounded-2xl overflow-hidden cursor-pointer border-2 border-white/30 hover:border-teal-400 shadow-lg"
                    style={{ 
                        backgroundImage: `url(${img.src})`, 
                        backgroundSize: 'cover', 
                        backgroundPosition: 'center',
                        transform: 'translateZ(0)' 
                    }}
                >
                    <div className="absolute inset-0 bg-transparent group-hover:bg-gradient-to-t from-teal-900/90 to-transparent transition-all duration-300" />
                    <div className="absolute bottom-0 left-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 w-full">
                        <h4 className="text-white font-bold truncate drop-shadow-md">{img.title}</h4>
                        <p className="text-teal-200 text-xs font-semibold">{img.status}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- 2.6 CardSwap ---
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
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative h-[220px] w-full flex items-center justify-center">
            <AnimatePresence>
                {stack.slice(0, 3).map((child: any, index) => (
                    <motion.div
                        key={child.key}
                        initial={{ scale: 0.8, y: 50, opacity: 0, zIndex: 0 }}
                        animate={{ 
                            scale: index === 0 ? 1 : 1 - index * 0.1, 
                            y: index * 15, 
                            opacity: 1 - index * 0.2, 
                            zIndex: 3 - index 
                        }}
                        exit={{ opacity: 0, scale: 0.5, y: 100 }}
                        transition={{ duration: 0.5 }}
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
// PART 3: MAIN DASHBOARD COMPONENT
// ============================================================================

export default function VADashboard() {
    const { user, userProfile } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    
    // Data State
    const [pendingProjects, setPendingProjects] = useState<Project[]>([]);
    const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
    const [potsAwaitingApproval, setPotsAwaitingApproval] = useState<Task[]>([]);
    const [potsToReview, setPotsToReview] = useState<ProofOfTask[]>([]);
    const [storageQuota, setStorageQuota] = useState<any>(null);
    const [hoveredProject, setHoveredProject] = useState<Project | null>(null);

    useEffect(() => {
        if (user && userProfile) {
            const fetchData = async () => {
                try {
                    // Fetch all user's projects
                    const [owned, assigned, memberOf] = await Promise.all([
                        EnhancedProjectService.getUserProjects(user.uid),
                        EnhancedProjectService.getAssignedProjects(user.uid),
                        EnhancedProjectService.getProjectsMemberOf(user.uid)
                    ]);

                    const allProjectsMap = new Map<string, Project>();
                    [...owned, ...assigned, ...memberOf].forEach(p => { if (p.id) allProjectsMap.set(p.id, p); });
                    const allProjects = Array.from(allProjectsMap.values());

                    const pending = allProjects.filter(p => p.status === 'active' || p.status === 'planning');
                    setPendingProjects(pending);
                    if (pending.length > 0) setHoveredProject(pending[0]);

                    const supervisedProjects = allProjects.filter(p => p.supervisors.includes(user.uid)).map(p => p.id!);
                    const userTasks = await TaskService.getUserTasks(user.uid);
                    setPendingTasks(userTasks.filter(t => t.status === 'todo'));
                    setPotsAwaitingApproval(userTasks.filter(t => t.status === 'pending-validation'));

                    const potsForReview = await TaskService.getPotsToReview(user.uid, supervisedProjects);
                    setPotsToReview(potsForReview);

                    const personalMail = `${userProfile.username}@connekt.com`;
                    const quota = await StorageQuotaService.getStorageQuota(personalMail);
                    setStorageQuota(quota);

                } catch (error) {
                    console.error('Error fetching dashboard data:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [user, userProfile]);

    const projectImages = pendingProjects.map((p, i) => ({
        src: `https://images.unsplash.com/photo-${['1497215728101-856f4ea42174', '1556761175-5973ac0f96fc', '1504384308090-c54be830a996', '1557804506-669a67965ba0'][i % 4]}?q=80&w=600&auto=format&fit=crop`,
        title: p.title,
        status: p.status
    }));

    const taskSlides = pendingTasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        date: t.timeline.dueDate,
        href: `/dashboard/tasks/${t.id}`
    }));

    return (
        // KEY CHANGE: RELATIVE positioning + min-h-screen ensures this container sets the height for the child mesh
        <div className="relative min-h-screen text-slate-800 bg-white/40 font-sans">
            
            {/* Background 3D Wave - Absolute covering full scroll height */}
            <AnimatedWave 
                waveColor="#0d9488" 
                amplitude={60} 
                speed={0.01} 
                opacity={0.3} 
            />

            <div className="relative z-10 max-w-[1600px] mx-auto p-6 md:p-8 space-y-12">
                
                {/* Header */}
                <div className="flex justify-between items-end backdrop-blur-sm p-6 rounded-3xl border border-teal-900/5 bg-white/30 shadow-sm">
                    <div>
                        <motion.h1 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-800 to-emerald-600 mb-2"
                        >
                            Hello, {userProfile?.username || 'Assistant'}
                        </motion.h1>
                        <p className="text-slate-700 font-medium">Here's what's happening in your workspace today.</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => router.push('/dashboard/projects')} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-teal-600/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95">
                            <Plus size={18} /> New Project
                        </button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <SpotlightCard>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-blue-100/80 rounded-xl text-blue-600"><Briefcase size={24} /></div>
                            <h3 className="text-slate-700 font-bold">Pending Projects</h3>
                        </div>
                        <div className="text-5xl font-bold text-slate-900 mb-2">
                            <CountUp to={pendingProjects.length} />
                        </div>
                        <p className="text-sm text-green-700 font-medium flex items-center gap-1">
                            <ArrowRight size={14} className="-rotate-45" /> Active now
                        </p>
                    </SpotlightCard>

                    <SpotlightCard>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-teal-100/80 rounded-xl text-teal-600"><CheckCircle size={24} /></div>
                            <h3 className="text-slate-700 font-bold">Pending Tasks</h3>
                        </div>
                        <div className="text-5xl font-bold text-slate-900 mb-2">
                            <CountUp to={pendingTasks.length} />
                        </div>
                        <p className="text-sm text-slate-600 font-medium">To do list</p>
                    </SpotlightCard>

                    <SpotlightCard>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-amber-100/80 rounded-xl text-amber-600"><Clock size={24} /></div>
                            <h3 className="text-slate-700 font-bold">Awaiting Approval</h3>
                        </div>
                        <div className="text-5xl font-bold text-slate-900 mb-2">
                            <CountUp to={potsAwaitingApproval.length} />
                        </div>
                        <p className="text-sm text-amber-700 font-medium">Pending Validation</p>
                    </SpotlightCard>

                    <SpotlightCard>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-rose-100/80 rounded-xl text-rose-600"><AlertCircle size={24} /></div>
                            <h3 className="text-slate-700 font-bold">POTs to Review</h3>
                        </div>
                        <div className="text-5xl font-bold text-slate-900 mb-2">
                            <CountUp to={potsToReview.length} />
                        </div>
                        <p className="text-sm text-rose-600 font-medium">{potsToReview.length > 0 ? "Action Required" : "All clear"}</p>
                    </SpotlightCard>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    
                    {/* LEFT COL: Projects */}
                    <div className="xl:col-span-8 space-y-8">
                        {/* Projects 3D Gallery Section */}
                        <div className="border border-teal-900/10 rounded-3xl p-8 relative overflow-hidden backdrop-blur-sm bg-white/20">
                            
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    <Database size={24} className="text-teal-700"/> Active Projects
                                </h2>
                                <button onClick={() => router.push('/dashboard/projects')} className="text-sm text-teal-700 hover:text-teal-900 transition-colors font-bold">View All</button>
                            </div>
                            
                            <div className="flex flex-col lg:flex-row gap-8 items-center">
                                {/* The 3D Gallery */}
                                <div className="w-full lg:w-2/3">
                                    {pendingProjects.length > 0 ? (
                                        <ThreeDHoverGallery 
                                            images={projectImages} 
                                            onImageHover={(idx: number) => setHoveredProject(pendingProjects[idx])}
                                            className="h-[350px]"
                                        />
                                    ) : (
                                        <div className="h-[300px] flex items-center justify-center text-slate-500 border border-dashed border-slate-400/50 rounded-2xl bg-white/5">
                                            No active projects
                                        </div>
                                    )}
                                </div>
                                
                                {/* Dynamic Detail Panel */}
                                <div className="w-full lg:w-1/3 min-h-[300px] bg-white/40 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-lg flex flex-col justify-center transition-all duration-300">
                                    {hoveredProject ? (
                                        <motion.div 
                                            key={hoveredProject.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <span className={`inline-block px-2 py-1 rounded text-xs uppercase font-bold mb-4 ${
                                                hoveredProject.status === 'active' ? 'bg-green-100/80 text-green-800' : 'bg-amber-100/80 text-amber-800'
                                            }`}>
                                                {hoveredProject.status}
                                            </span>
                                            <h3 className="text-2xl font-bold text-slate-900 mb-3">{hoveredProject.title}</h3>
                                            <p className="text-slate-700 text-sm mb-6 line-clamp-4 font-medium">{hoveredProject.description}</p>
                                            
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-600 font-semibold">Deadline</span>
                                                    <span className="text-slate-900 font-bold">{hoveredProject.deadline || 'No Date'}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-600 font-semibold">Budget</span>
                                                    <span className="text-slate-900 font-bold">${hoveredProject.budget?.toLocaleString()}</span>
                                                </div>
                                                <div className="w-full bg-slate-200/50 h-2 rounded-full mt-4 overflow-hidden border border-white/50">
                                                    <div className="bg-teal-600 h-full w-[45%]" />
                                                </div>
                                                <div className="flex justify-end text-xs text-teal-800 font-bold">45% Complete</div>
                                            </div>
                                            
                                            <button 
                                                onClick={() => router.push(`/dashboard/projects/${hoveredProject.id}`)}
                                                className="w-full mt-6 py-3 bg-white/50 hover:bg-white/70 text-teal-900 rounded-xl text-sm font-bold transition-colors border border-teal-900/10"
                                            >
                                                Open Project
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <div className="text-center text-slate-600 font-medium">Hover over a project to see details</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Reminders & Notifications */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <SpotlightCard className="h-[300px]">
                                <h3 className="text-xl font-bold mb-4 text-slate-900 flex items-center gap-2">
                                    <Users size={20} className="text-blue-600"/> Team Activity
                                </h3>
                                <div className="mt-8">
                                    <CardSwap>
                                        {[
                                            { id: 1, title: 'New Comment', msg: 'Alex commented on UI Task', time: '2m ago', color: 'bg-blue-50/80 border-blue-200' },
                                            { id: 2, title: 'Submission', msg: 'Sarah submitted a POT', time: '1h ago', color: 'bg-teal-50/80 border-teal-200' },
                                            { id: 3, title: 'System', msg: 'Storage quota at 80%', time: '3h ago', color: 'bg-rose-50/80 border-rose-200' }
                                        ].map((item) => (
                                            <div key={item.id} className={`p-4 rounded-2xl border ${item.color} shadow-sm backdrop-blur-sm`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-slate-900">{item.title}</h4>
                                                    <span className="text-xs text-slate-500">{item.time}</span>
                                                </div>
                                                <p className="text-sm text-slate-700">{item.msg}</p>
                                                <div className="mt-3 flex justify-end">
                                                    <button className="text-xs text-slate-500 hover:text-teal-700 flex items-center gap-1 font-bold">View <ChevronRight size={12}/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </CardSwap>
                                </div>
                             </SpotlightCard>

                             {/* Storage */}
                             <SpotlightCard className="h-[300px]">
                                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <Database size={20} className="text-teal-700"/> Storage
                                </h3>
                                {storageQuota && (
                                    <div className="flex flex-col items-center justify-center h-[180px]">
                                        <div className="relative w-32 h-32">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                <path
                                                    className="text-slate-300"
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />
                                                <motion.path
                                                    className="text-teal-600"
                                                    initial={{ pathLength: 0 }}
                                                    animate={{ pathLength: storageQuota.usedSpace / storageQuota.totalQuota }}
                                                    transition={{ duration: 2, ease: "easeOut" }}
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    strokeDasharray="1, 1"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-2xl font-bold text-slate-900">
                                                    {Math.round((storageQuota.usedSpace / storageQuota.totalQuota) * 100)}%
                                                </span>
                                                <span className="text-xs text-slate-500 font-bold">Used</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 text-sm text-slate-600 font-medium">
                                            {(storageQuota.usedSpace / (1024 * 1024)).toFixed(1)} MB / {(storageQuota.totalQuota / (1024 * 1024)).toFixed(1)} MB
                                        </div>
                                    </div>
                                )}
                             </SpotlightCard>
                        </div>
                    </div>

                    {/* RIGHT COL: Tasks */}
                    <div className="xl:col-span-4 space-y-8">
                        <div className="bg-white/20 backdrop-blur-sm border border-teal-900/10 rounded-3xl p-8 h-full min-h-[500px] flex flex-col shadow-sm">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    <Calendar size={24} className="text-teal-700"/> Your Tasks
                                </h2>
                                <span className="bg-teal-100 text-xs px-2 py-1 rounded-md text-teal-800 font-bold border border-teal-200">{pendingTasks.length} pending</span>
                            </div>

                            {/* 3D Carousel */}
                            <div className="flex-1 flex items-center justify-center">
                                <ThreeDImageCarousel slides={taskSlides} />
                            </div>

                            {/* Mini Task List */}
                            <div className="mt-8 space-y-3">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Priority Queue</h3>
                                {pendingTasks.slice(0, 3).map((task) => (
                                    <div key={task.id} className="group flex items-center gap-4 p-3 hover:bg-white/40 rounded-xl transition-all cursor-pointer border border-transparent hover:border-teal-100 hover:shadow-sm" onClick={() => router.push(`/dashboard/tasks/${task.id}`)}>
                                        <div className={`w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-red-500' : 'bg-green-500'}`} />
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold text-slate-800 group-hover:text-teal-800 transition-colors">{task.title}</h4>
                                            <p className="text-xs text-slate-600 font-medium">{task.timeline.dueDate}</p>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-400 group-hover:text-teal-700" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}