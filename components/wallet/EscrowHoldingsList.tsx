'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { EscrowHold } from '@/lib/types/wallet.types';
import {
    Lock,
    Unlock,
    User,
    FileText,
    Calendar,
    Briefcase,
    ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ProfileService } from '@/lib/services/profile-service';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';

// --- Internal Spotlight Component ---
const SpotlightCard = ({
    children,
    className = '',
    spotlightColor = 'rgba(0, 128, 128, 0.15)', // Teal spotlight
    onClick
}: {
    children: React.ReactNode;
    className?: string;
    spotlightColor?: string;
    onClick?: () => void;
}) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <motion.div
            ref={divRef}
            onClick={onClick}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setOpacity(1)}
            onMouseLeave={() => setOpacity(0)}
            className={cn(
                "relative rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 overflow-hidden p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-teal-900/5 cursor-default dark:hover:border-teal-500/30",
                className
            )}
        >
            <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-in-out"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`
                }}
            />
            <div className="relative z-10">{children}</div>
        </motion.div>
    );
};

interface EscrowHoldingsListProps {
    holdings: EscrowHold[];
    isLoading?: boolean;
}

// Cache for user and project names to avoid refetching
const nameCache: Record<string, string> = {};

export function EscrowHoldingsList({ holdings, isLoading = false }: EscrowHoldingsListProps) {
    const [userNames, setUserNames] = useState<Record<string, string>>({});
    const [projectNames, setProjectNames] = useState<Record<string, string>>({});
    const [loadingNames, setLoadingNames] = useState(true);

    // Fetch user and project names
    useEffect(() => {
        const fetchNames = async () => {
            if (holdings.length === 0) {
                setLoadingNames(false);
                return;
            }

            const userIds = new Set<string>();
            const projectIds = new Set<string>();

            holdings.forEach(h => {
                if (h.fromUserId) userIds.add(h.fromUserId);
                if (h.toUserId) userIds.add(h.toUserId);
                if (h.projectId) projectIds.add(h.projectId);
            });

            // Fetch user names
            const newUserNames: Record<string, string> = {};
            for (const userId of userIds) {
                if (nameCache[`user_${userId}`]) {
                    newUserNames[userId] = nameCache[`user_${userId}`];
                    continue;
                }
                try {
                    const profile = await ProfileService.getUserProfile(userId);
                    const name = profile?.displayName || profile?.username || userId.slice(0, 8) + '...';
                    newUserNames[userId] = name;
                    nameCache[`user_${userId}`] = name;
                } catch {
                    newUserNames[userId] = userId.slice(0, 8) + '...';
                }
            }

            // Fetch project names
            const newProjectNames: Record<string, string> = {};
            for (const projectId of projectIds) {
                if (nameCache[`project_${projectId}`]) {
                    newProjectNames[projectId] = nameCache[`project_${projectId}`];
                    continue;
                }
                try {
                    const project = await EnhancedProjectService.getProject(projectId);
                    const name = project?.title || projectId.slice(0, 8) + '...';
                    newProjectNames[projectId] = name;
                    nameCache[`project_${projectId}`] = name;
                } catch {
                    newProjectNames[projectId] = projectId.slice(0, 8) + '...';
                }
            }

            setUserNames(newUserNames);
            setProjectNames(newProjectNames);
            setLoadingNames(false);
        };

        fetchNames();
    }, [holdings]);

    const getUserName = (userId: string | undefined): string => {
        if (!userId) return 'N/A';
        return userNames[userId] || userId.slice(0, 8) + '...';
    };

    const getProjectName = (projectId: string | undefined): string => {
        if (!projectId) return 'N/A';
        return projectNames[projectId] || projectId.slice(0, 8) + '...';
    };

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2">
                {[1, 2].map((i) => (
                    <div
                        key={i}
                        className="h-56 rounded-3xl bg-gray-100 dark:bg-zinc-900/50 animate-pulse border border-gray-200 dark:border-white/5"
                    />
                ))}
            </div>
        );
    }

    if (holdings.length === 0) {
        return (
            <div className="text-center py-16 px-6 bg-white/50 dark:bg-zinc-900/30 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-white/5 border-dashed">
                <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                    <Unlock size={28} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Active Escrow</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    Funds held safely for pending projects or transactions will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-5 md:grid-cols-2">
            {holdings.map((holding) => {
                const createdAt = holding.createdAt?.toDate?.() || new Date();
                const isActive = holding.status === 'held';
                const isProject = holding.type === 'project';

                return (
                    <SpotlightCard key={holding.id}>
                        {/* Header: Amount & Status */}
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <div className="text-3xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">
                                    D{(Number(holding.amount) || 0).toLocaleString()}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        {holding.currency}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-zinc-700" />
                                    <span className="text-xs font-medium text-teal-600 dark:text-teal-400">
                                        {isActive ? 'Held securely' : 'Released'}
                                    </span>
                                </div>
                            </div>

                            <div className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border",
                                isActive
                                    ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50"
                                    : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50"
                            )}>
                                {isActive ? <Lock size={12} /> : <Unlock size={12} />}
                                <span className="uppercase tracking-wide">{holding.status}</span>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="space-y-4">
                            {/* Route - Show actual names */}
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-white/5">
                                <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0 text-teal-700 dark:text-teal-400">
                                    <User size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Counterparty</div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-white truncate flex items-center gap-2">
                                        <span className="truncate max-w-[100px]" title={holding.fromUserId}>
                                            {loadingNames ? '...' : getUserName(holding.fromUserId)}
                                        </span>
                                        <ArrowRight size={12} className="text-gray-400 flex-shrink-0" />
                                        <span className="truncate max-w-[100px]" title={holding.toUserId}>
                                            {holding.toUserId
                                                ? (loadingNames ? '...' : getUserName(holding.toUserId))
                                                : (isProject ? 'Project Fund' : 'Escrow')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Context */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-white/5">
                                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                                        {isProject ? <Briefcase size={14} /> : <FileText size={14} />}
                                        <span className="text-[10px] uppercase font-bold tracking-wider">
                                            {isProject ? 'Project' : 'Reference'}
                                        </span>
                                    </div>
                                    <div className="text-xs font-medium text-gray-900 dark:text-gray-200 truncate" title={holding.projectId || holding.referenceId}>
                                        {holding.projectId
                                            ? (loadingNames ? '...' : getProjectName(holding.projectId))
                                            : (holding.referenceId || 'N/A')}
                                    </div>
                                </div>

                                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-white/5">
                                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                                        <Calendar size={14} />
                                        <span className="text-[10px] uppercase font-bold tracking-wider">Date</span>
                                    </div>
                                    <div className="text-xs font-medium text-gray-900 dark:text-gray-200">
                                        {format(createdAt, 'MMM dd, yyyy')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Released Footer */}
                        {holding.releasedAt && (
                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
                                <div className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    Released on {format(holding.releasedAt.toDate(), 'PPP')}
                                </div>
                            </div>
                        )}
                    </SpotlightCard>
                );
            })}
        </div>
    );
}
