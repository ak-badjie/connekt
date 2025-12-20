'use client';

import React, { Fragment, useRef, useState, useEffect, useMemo, Children, cloneElement, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { WorkspaceService } from '@/lib/services/workspace-service';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { Workspace, Project } from '@/lib/types/workspace.types'; // Removed WorkspaceMember if unused or keep if needed
import { Dialog, Transition } from '@headlessui/react';
import {
  Loader2, Folder as FolderIcon, Users, Settings, Briefcase, Plus,
  UserPlus, DollarSign, Sparkles, FileText,
  Eye, Clock, LayoutGrid, Edit2, Trash2, Home,
  Zap, Layers, Globe, ChevronRight
} from 'lucide-react';
import {
  motion, useMotionValue, useSpring, useTransform, AnimatePresence,
  useInView
} from 'framer-motion';
import { toast } from 'react-hot-toast';

import { ProfileService } from '@/lib/services/profile-service';

import CircularGallery from '@/components/ui/CircularGallery';
import ThreeDHoverGallery, { ProjectImageData } from '@/components/ui/ThreeDHoverGallery';
import Folder from '@/components/ui/Folder';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';

// --- Placeholder Imports for your existing Modals ---
import AddWorkspaceMemberModal from '@/components/AddWorkspaceMemberModal';
import ManageWorkspaceMemberModal from '@/components/ManageWorkspaceMemberModal';
import CreateJobModal from '@/components/dashboard/workspaces/CreateJobModal';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';

// ==========================================
// UTILITIES & ANIMATION HELPERS
// ==========================================

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

const darkenColor = (hex: string, percent: number) => {
  let color = hex.startsWith('#') ? hex.slice(1) : hex;
  if (color.length === 3) color = color.split('').map(c => c + c).join('');
  const num = parseInt(color, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

const transitionSpring = { type: 'spring' as const, stiffness: 300, damping: 30 };

// ==========================================
// COMPONENT: COUNT UP
// ==========================================

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
  const motionValue = useMotionValue<number>(direction === 'down' ? Number(to) : Number(from));

  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);

  const springValue = useSpring(motionValue, {
    damping,
    stiffness
  });

  const isInView = useInView(ref, { once: true, margin: '0px' });

  const getDecimalPlaces = (num: number) => {
    const str = num.toString();
    if (str.includes('.')) {
      const decimals = str.split('.')[1];
      if (parseInt(decimals) !== 0) {
        return decimals.length;
      }
    }
    return 0;
  };

  const maxDecimals = Math.max(getDecimalPlaces(from), getDecimalPlaces(to));

  const formatValue = useCallback(
    (latest: number) => {
      const hasDecimals = maxDecimals > 0;
      const options = {
        useGrouping: !!separator,
        minimumFractionDigits: hasDecimals ? maxDecimals : 0,
        maximumFractionDigits: hasDecimals ? maxDecimals : 0
      };
      const formattedNumber = Intl.NumberFormat('en-US', options).format(latest);
      return separator ? formattedNumber.replace(/,/g, separator) : formattedNumber;
    },
    [maxDecimals, separator]
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
        motionValue.set(direction === 'down' ? Number(from) : Number(to));
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
    const unsubscribe = springValue.on('change', (latest: number) => {
      if (ref.current) {
        ref.current.textContent = formatValue(latest);
      }
    });
    return () => unsubscribe();
  }, [springValue, formatValue]);

  return <span className={className} ref={ref} />;
}

// ==========================================
// COMPONENT: ELASTIC DOCK (Physics Based)
// ==========================================

function DockItem({
  children,
  className = '',
  onClick,
  mouseX,
  label,
  baseItemSize = 50,
  magnification = 70,
  distance = 150
}: any) {
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
      {Children.map(children, child =>
        cloneElement(child, { size: useTransform(size as any, (s: number) => s * 0.45) })
      )}
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
        "flex items-end h-[80px] gap-3 px-4 pb-3 rounded-3xl",
        "bg-gray-50/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-zinc-800/50",
        "shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]",
        className
      )}
    >
      {items.map((item: any, idx: number) => (
        <DockItem key={idx} onClick={item.onClick} mouseX={mouseX} label={item.label} baseItemSize={50} magnification={85}>
          <div className="flex items-center justify-center w-full h-full text-gray-600 dark:text-gray-300">
            {item.icon}
          </div>
        </DockItem>
      ))}
    </motion.div>
  );
}

// ==========================================
// COMPONENT: EXPANDING PROJECT CARDS
// ==========================================

const ProjectCard = ({ project, index, onClick }: any) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, ...transitionSpring }}
      onClick={() => onClick(project.id)}
      className="group relative h-[400px] min-w-[280px] flex-1 rounded-3xl overflow-hidden cursor-pointer bg-gray-900 border border-white/10"
      whileHover={{ flex: 3 }}
    >
      {/* Background Image with Parallax Effect */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-100"
        style={{
          backgroundImage: `url(${project.coverImage || `https://picsum.photos/seed/${project.id}/600/800`})`
        }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

      {/* Vertical Text (Default State) */}
      <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0 delay-100">
        <h3 className="text-3xl font-black text-white/30 uppercase tracking-[0.2em] [writing-mode:vertical-rl] rotate-180">
          {project.title.substring(0, 15)}
        </h3>
      </div>

      {/* Expanded Content */}
      <div className="absolute inset-x-0 bottom-0 p-8 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out">
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${project.status === 'active' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
            }`}>
            {project.status}
          </span>
          <span className="text-gray-400 text-xs flex items-center gap-1">
            <Clock size={10} /> 2 days ago
          </span>
        </div>

        <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{project.title}</h3>
        <p className="text-gray-400 text-sm line-clamp-2 mb-4">{project.description}</p>

        <div className="flex justify-between items-center border-t border-white/10 pt-4">
          <div className="flex -space-x-2">
            {project.members && project.members.slice(0, 3).map((m: any, i: number) => (
              <div key={i} className="w-8 h-8 rounded-full bg-gray-800 border-2 border-black flex items-center justify-center text-xs text-white">
                {m.username?.[0]}
              </div>
            ))}
          </div>
          <div className="text-teal-400 font-mono font-bold">
            ${project.budget?.toLocaleString() ?? '0'}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ==========================================
// UTILITY: ANIMATED TEXT
// ==========================================

const AnimatedText = ({ text, className, delay = 0 }: { text: string, className?: string, delay?: number }) => {
  const letters = Array.from(text);
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.03, delayChildren: delay }
    })
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
// MAIN PAGE COMPONENT
// ==========================================

export default function WorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const workspaceId = params.id as string;

  // --- State ---
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'member' | null>(null);
  const [teamMemberCards, setTeamMemberCards] = useState<any[]>([]);

  // Modals
  const [modals, setModals] = useState({
    addMember: false,
    createJob: false,
    projectMode: false,
    editJob: false,
    deleteJob: false,
    manageMember: false
  });
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // --- Fetch Data ---
  useEffect(() => {
    if (!user || !workspaceId) return;

    const fetchData = async () => {
      try {
        const [ws, role] = await Promise.all([
          WorkspaceService.getWorkspace(workspaceId),
          WorkspaceService.getUserRole(workspaceId, user.uid)
        ]);

        setWorkspace(ws);
        setUserRole(role);

        // Fetch Projects
        const projs = role !== 'member'
          ? await EnhancedProjectService.getWorkspaceProjects(workspaceId)
          : await EnhancedProjectService.getWorkspaceProjectsForMember(workspaceId, user.uid);
        setProjects(projs);

        // Fetch Jobs (Owners only)
        if (role !== 'member') {
          const jobsData = await WorkspaceService.getWorkspaceJobs(workspaceId);
          setJobs(jobsData);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load workspace data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, workspaceId]);

  // --- Handlers ---
  const toggleModal = (name: keyof typeof modals, value: boolean) => {
    setModals(prev => ({ ...prev, [name]: value }));
  };

  const handleJobAction = async (action: 'create' | 'update' | 'delete') => {
    const jobsData = await WorkspaceService.getWorkspaceJobs(workspaceId);
    setJobs(jobsData);
    if (action === 'delete') toast.success('Opportunity removed');
  };

  const canManage = userRole === 'owner' || userRole === 'admin';

  const workspaceMembersKey = useMemo(() => {
    if (!workspace?.members) return '';
    return workspace.members
      .map((m: any) => `${m.userId}|${m.type || ''}|${m.jobTitle || ''}|${m.username || ''}`)
      .join(',');
  }, [workspace?.members]);

  // Team Data for WebGL Gallery (Real member profiles)
  useEffect(() => {
    if (!workspace?.members || workspace.members.length === 0) {
      setTeamMemberCards([]);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        // Prefer unique members; we'll duplicate for the ring after enrichment.
        const uniqueMembers = Array.from(
          new Map(workspace.members.map(m => [m.userId, m])).values()
        );

        const enriched = await Promise.all(
          uniqueMembers.map(async (m: any) => {
            const profile = await ProfileService.getUserProfile(m.userId);
            const photoURL = (profile as any)?.photoURL as string | undefined;
            const displayName = (profile as any)?.displayName as string | undefined;
            const username = (profile as any)?.username as string | undefined;

            const title = displayName || username || m.username || 'Member';
            const job = m.jobTitle || (profile as any)?.title;
            const subTitle = m.type === 'employee'
              ? `${job ? `${job} • ` : ''}Employee`
              : 'Freelancer';

            const image = photoURL
              ? photoURL
              : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.username || title)}&backgroundColor=b6e3f4`;

            return {
              userId: m.userId,
              title,
              subTitle,
              type: m.type,
              image,
              onClick: () => router.push(`/dashboard/teams?chatWith=${m.userId}`)
            };
          })
        );

        if (!cancelled) setTeamMemberCards(enriched);
      } catch (e) {
        console.error('Failed to load team member profiles', e);
        if (!cancelled) {
          const fallback = workspace.members.map((m: any) => ({
            userId: m.userId,
            title: m.username || 'Member',
            subTitle: m.type === 'employee' ? (m.jobTitle || 'Employee') : 'Freelancer',
            type: m.type,
            image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.username || 'member')}&backgroundColor=b6e3f4`,
            onClick: () => router.push(`/dashboard/teams?chatWith=${m.userId}`)
          }));
          setTeamMemberCards(fallback);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [workspace?.id, workspaceMembersKey, router]);

  const teamGalleryItems = useMemo(() => teamMemberCards, [teamMemberCards]);

  // Dock Navigation Items
  const dockItems = [
    {
      icon: <Home strokeWidth={2.5} />,
      label: "Dashboard",
      onClick: () => router.push('/dashboard/workspaces')
    },
    ...(canManage ? [
      {
        icon: <Briefcase strokeWidth={2.5} />,
        label: "Post Job",
        onClick: () => toggleModal('createJob', true)
      },
      {
        icon: <UserPlus strokeWidth={2.5} />,
        label: "Invite Team",
        onClick: () => toggleModal('addMember', true)
      },
    ] : []),
    {
      icon: <Plus strokeWidth={2.5} />,
      label: "New Project",
      onClick: () => toggleModal('projectMode', true)
    },
    {
      icon: <Globe strokeWidth={2.5} />,
      label: "Explore",
      onClick: () => { }
    },
    ...(userRole === 'owner' ? [
      {
        icon: <Settings strokeWidth={2.5} />,
        label: "Settings",
        onClick: () => router.push(`/dashboard/workspaces/${workspaceId}/settings`)
      }
    ] : [])
  ];

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-black">
      <Loader2 className="animate-spin text-teal-500 w-12 h-12" />
    </div>
  );

  if (!workspace) return <div>Workspace not found</div>;

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white pb-32">

      {/* --- HERO HEADER --- */}
      <div className="relative pt-24 pb-12 px-6 max-w-[1400px] mx-auto flex flex-col items-center">
        {/* Background Decor */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[300px] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12 }}
          className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-2xl shadow-teal-500/20 mb-6 z-10"
        >
          <span className="text-4xl font-black text-white">{workspace.name[0]}</span>
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-center mb-4 z-10">
          <AnimatedText text={workspace.name} />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl text-center font-medium leading-relaxed mb-8 z-10"
        >
          {workspace.description}
        </motion.p>

        {/* --- DOCK (Nested Relative) --- */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, ...transitionSpring }}
          className="z-50"
        >
          <Dock items={dockItems} />
        </motion.div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 space-y-24">

        {/* --- STATS ROW --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Active Projects", value: projects.filter(p => p.status === 'active').length, icon: Layers, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Team Members", value: workspace.members.length, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
            { label: "Opportunities", value: jobs.length, icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-6 rounded-3xl flex items-center gap-5 hover:scale-[1.02] transition-transform duration-300"
            >
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={28} />
              </div>
              <div>
                <div className="text-4xl font-bold font-mono tracking-tight">{stat.value}</div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* --- OPPORTUNITIES (Folders) --- */}
        {canManage && (
          <section>
            <div className="flex items-end justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 text-teal-600 rounded-xl"><Briefcase size={24} /></div>
                <h2 className="text-3xl font-bold">Opportunities</h2>
              </div>
              <button onClick={() => toggleModal('createJob', true)} className="text-sm font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                View Archive <ChevronRight size={16} />
              </button>
            </div>

            {jobs.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-3xl p-12 text-center">
                <p className="text-gray-400 mb-4">No active opportunities posted.</p>
                <button onClick={() => toggleModal('createJob', true)} className="bg-teal-600 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:shadow-teal-500/25 transition-all">Create One</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                {jobs.map(job => (
                  <Folder
                    key={job.id}
                    label={job.title}
                    color="#0d9488"
                    size={1.2}
                    jobDetails={{
                      title: job.title,
                      payRate: job.payRate || job.budget?.toString(),
                      payType: job.payType || 'fixed',
                      postedAt: job.createdAt,
                      description: job.description
                    }}
                    stats={{
                      views: job.views || 0,
                      applicants: job.applicantCount || 0
                    }}
                    onEdit={() => { setSelectedItem(job); toggleModal('editJob', true); }}
                    onDelete={() => { setSelectedItem(job); toggleModal('deleteJob', true); }}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* --- PROJECTS GALLERY --- */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl"><LayoutGrid size={24} /></div>
            <h2 className="text-3xl font-bold">Projects</h2>
          </div>

          {projects.length > 0 ? (
            <div className="bg-white/30 dark:bg-zinc-900/30 backdrop-blur-xl border border-white/50 dark:border-zinc-800 rounded-[2.5rem] p-8 relative overflow-hidden shadow-xl shadow-teal-900/5">
              <ThreeDHoverGallery
                images={projects.map((p, i) => ({
                  src: p.coverImage || `https://picsum.photos/seed/${p.id}/600/800`,
                  title: p.title,
                  shortTitle: p.title.substring(0, 15) + (p.title.length > 15 ? '...' : ''),
                  status: p.status,
                  memberCount: p.members?.length || 0,
                  budget: p.budget,
                  description: p.description,
                }))}
                onImageClick={(index) => router.push(`/dashboard/projects/${projects[index].id}`)}
                height={380}
              />
            </div>
          ) : (
            <div className="w-full h-[200px] flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-12">
              <p className="text-gray-400">No projects yet.</p>
            </div>
          )}
        </section>

        {/* --- TEAM 3D VIEW --- */}
        <section className="pb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl"><Users size={24} /></div>
            <h2 className="text-3xl font-bold">The Team</h2>
          </div>
          {/* The Inline WebGL Component */}
          <CircularGallery items={teamGalleryItems} height={680} />
        </section>

      </div>

      {/* ========================================== */}
      {/* MODAL WRAPPERS (Logic imported) */}
      {/* ========================================== */}

      <AddWorkspaceMemberModal
        isOpen={modals.addMember}
        onClose={() => toggleModal('addMember', false)}
        workspaceId={workspaceId}
        workspaceName={workspace.name}
        onMemberAdded={() => window.location.reload()}
      />

      <ManageWorkspaceMemberModal
        isOpen={modals.manageMember}
        onClose={() => toggleModal('manageMember', false)}
        workspaceId={workspaceId}
        member={selectedItem}
        onMemberUpdated={() => window.location.reload()}
      />

      <CreateJobModal
        isOpen={modals.createJob}
        onClose={() => { toggleModal('createJob', false); handleJobAction('create'); }}
        workspaceId={workspaceId}
      />

      <CreateJobModal
        isOpen={modals.editJob}
        onClose={() => { toggleModal('editJob', false); setSelectedItem(null); handleJobAction('update'); }}
        workspaceId={workspaceId}
        jobToEdit={selectedItem}
      />

      <DeleteConfirmationModal
        isOpen={modals.deleteJob}
        onClose={() => { toggleModal('deleteJob', false); setSelectedItem(null); }}
        onConfirm={async () => {
          await WorkspaceService.deleteJob(selectedItem.id);
          handleJobAction('delete');
          toggleModal('deleteJob', false);
        }}
        title="Delete Opportunity"
        message="Are you sure? This cannot be undone."
        itemType="Job"
      />

      {/* Project Creator Modal (Inline for visual consistency) */}
      <Transition appear show={modals.projectMode} as={Fragment}>
        <Dialog as="div" className="relative z-[150]" onClose={() => toggleModal('projectMode', false)}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150]" />
          <div className="fixed inset-0 overflow-y-auto z-[150]">
            <div className="flex min-h-full items-center justify-center p-4">
              <Dialog.Panel className="relative w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-8 shadow-2xl transition-all">
                <button
                  onClick={() => toggleModal('projectMode', false)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
                <Dialog.Title as="h3" className="text-2xl font-black text-gray-900 dark:text-white mb-8 text-center">
                  Start a New Project
                </Dialog.Title>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button
                    onClick={() => router.push(`/dashboard/projects/create/ai?workspaceId=${workspaceId}`)}
                    className="group relative p-8 rounded-3xl border-2 border-teal-500 bg-teal-50/50 dark:bg-teal-900/10 hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-all text-center overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10" />
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                      <ConnektAIIcon className="w-10 h-10" />
                    </div>
                    <h4 className="text-xl font-bold text-teal-900 dark:text-teal-400 mb-2">AI Architect</h4>
                    <p className="text-sm text-teal-700/70">Let AI structure the tasks, budget, and timeline automatically.</p>
                  </button>

                  <button
                    onClick={() => router.push(`/dashboard/projects/create?workspace=${workspaceId}`)}
                    className="group p-8 rounded-3xl border-2 border-dashed border-gray-200 dark:border-zinc-700 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all text-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 mx-auto mb-6 group-hover:scale-110 transition-transform">
                      <FileText size={32} />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Manual Setup</h4>
                    <p className="text-sm text-gray-500">Build the project from scratch yourself.</p>
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
} 