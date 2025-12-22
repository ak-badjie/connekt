'use client';

/**
 * Connekt Analytics Dashboard
 * Real data visualization with Framer Motion animations and Recharts
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

// Animation & UI
import {
    motion,
    AnimatePresence,
    useMotionValue,
    useSpring,
    useInView,
    Variants,
    LayoutGroup
} from 'framer-motion';

// Visualization
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts';

// Icons
import {
    Activity, ArrowUpRight, ArrowDownRight, Users,
    HardDrive, DollarSign, Download, Zap, Layers,
    FolderKanban, CheckSquare, Cpu, FileText, Sparkles
} from 'lucide-react';

// Services
import { AnalyticsService, AnalyticsDashboard, RevenueDataPoint, TimeSeriesDataPoint } from '@/lib/services/analytics-service';
import { StorageQuotaService } from '@/lib/services/storage-quota-service';

// Branding
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';

// Utilities
import { format, subDays } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ==========================================
// UTILITY FUNCTIONS & TYPES
// ==========================================

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type ChartType = 'revenue' | 'ai' | 'tasks';
type TimeRange = '7d' | '30d' | '90d';

// ==========================================
// ANIMATION VARIANTS
// ==========================================

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1
        }
    }
};

const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    show: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 50, damping: 10 }
    }
};

// ==========================================
// SUB-COMPONENTS
// ==========================================

/**
 * Animated Number Counter
 */
const AnimatedCounter = ({ value, prefix = '', suffix = '', decimals = 0 }: { value: number, prefix?: string, suffix?: string, decimals?: number }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, { damping: 30, stiffness: 100 });
    const isInView = useInView(ref, { once: true, margin: "-20px" });

    useEffect(() => {
        if (isInView) {
            motionValue.set(value);
        }
    }, [motionValue, value, isInView]);

    useEffect(() => {
        return springValue.on("change", (latest) => {
            if (ref.current) {
                const formatted = decimals > 0 ? latest.toFixed(decimals) : Math.floor(latest).toLocaleString();
                ref.current.textContent = prefix + formatted + suffix;
            }
        });
    }, [springValue, decimals, prefix, suffix]);

    return <span ref={ref} />;
};

/**
 * Glassmorphic Card Container
 */
interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
    title?: string;
    subtitle?: string;
    action?: React.ReactNode;
}

const GlassCard = ({
    children,
    className,
    noPadding = false,
    title,
    subtitle,
    action
}: GlassCardProps) => (
    <motion.div
        variants={itemVariants}
        className={cn(
            "relative overflow-hidden rounded-3xl",
            "bg-white/70 dark:bg-[#0A0A0A]/60 backdrop-blur-2xl",
            "border border-white/20 dark:border-white/5",
            "shadow-xl shadow-black/5 dark:shadow-black/20",
            "transition-colors duration-300",
            className
        )}
    >
        {/* Shine effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none z-10" />

        {(title || action) && (
            <div className="flex items-start justify-between p-6 pb-2 relative z-20">
                <div>
                    {title && <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>}
                    {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{subtitle}</p>}
                </div>
                {action && <div>{action}</div>}
            </div>
        )}

        <div className={cn("relative z-10", !noPadding && "p-6")}>
            {children}
        </div>
    </motion.div>
);

/**
 * Custom Chart Tooltip
 */
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        let formattedLabel = label;
        try {
            formattedLabel = format(new Date(label), 'PPP');
        } catch (e) {
            // Keep original label
        }

        return (
            <div className="bg-white/90 dark:bg-black/90 backdrop-blur-md border border-gray-100 dark:border-zinc-800 p-4 rounded-xl shadow-2xl">
                <p className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">{formattedLabel}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm my-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-gray-500 dark:text-gray-400 capitalize">{entry.name}:</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                            {typeof entry.value === 'number' && entry.value > 1000
                                ? `${(entry.value / 1000).toFixed(1)}k`
                                : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

/**
 * Pill Toggle Button Group
 */
const PillToggle = ({ options, value, onChange }: { options: { value: string; label: string }[], value: string, onChange: (v: string) => void }) => (
    <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
        {options.map((opt) => (
            <button
                key={opt.value}
                onClick={() => onChange(opt.value)}
                className={cn(
                    "px-4 py-2 text-sm font-semibold rounded-md transition-all",
                    value === opt.value
                        ? "bg-white dark:bg-black shadow-sm text-black dark:text-white"
                        : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                )}
            >
                {opt.label}
            </button>
        ))}
    </div>
);

// ==========================================
// KPI METRICS ROW
// ==========================================

interface MetricsRowProps {
    data: AnalyticsDashboard | null;
    role: string;
}

const MetricsRow = ({ data, role }: MetricsRowProps) => {
    if (!data) return null;

    const isRecruiter = role === 'recruiter';

    const cards = [
        {
            label: "AI Tokens Used",
            value: data.aiTokens.isUnlimited ? 0 : data.aiTokens.used,
            displayValue: data.aiTokens.isUnlimited ? '∞' : data.aiTokens.used.toString(),
            suffix: data.aiTokens.isUnlimited ? '' : ` / ${data.aiTokens.limit}`,
            trend: data.aiTokens.percentage < 50 ? 5 : -2,
            icon: () => <ConnektAIIcon className="w-6 h-6" />,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            useCustomIcon: true
        },
        {
            label: "Cloud Storage",
            value: data.storage.usedBytes / (1024 * 1024 * 1024), // Convert to GB
            prefix: "",
            suffix: " GB",
            trend: data.storage.percentage < 80 ? 1 : -5,
            icon: HardDrive,
            color: "text-violet-500",
            bg: "bg-violet-500/10",
            decimals: 2
        },
        {
            label: "Total Revenue",
            value: data.revenue.total,
            prefix: "D",
            trend: data.revenue.total > 0 ? 12 : 0,
            icon: DollarSign,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            decimals: 2
        },
        {
            label: isRecruiter ? "Tasks Created" : "Tasks Completed",
            value: isRecruiter ? data.tasks.created : data.tasks.completed,
            trend: 8,
            icon: CheckSquare,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
            {cards.map((metric, idx) => (
                <GlassCard key={idx} noPadding className="group">
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className={cn("p-3 rounded-2xl transition-colors group-hover:bg-white group-hover:shadow-md", metric.bg)}>
                                {metric.useCustomIcon ? (
                                    <metric.icon />
                                ) : (
                                    <metric.icon className={cn("w-6 h-6", metric.color)} />
                                )}
                            </div>
                            <div className={cn(
                                "flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-full",
                                metric.trend > 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            )}>
                                {metric.trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {Math.abs(metric.trend)}%
                            </div>
                        </div>

                        <h4 className="text-gray-500 dark:text-gray-400 font-medium text-sm">{metric.label}</h4>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                            {metric.displayValue ? (
                                <>{metric.displayValue}{metric.suffix}</>
                            ) : (
                                <AnimatedCounter
                                    value={metric.value}
                                    prefix={metric.prefix}
                                    suffix={metric.suffix}
                                    decimals={metric.decimals || 0}
                                />
                            )}
                        </div>
                    </div>
                </GlassCard>
            ))}
        </div>
    );
};

// ==========================================
// MAIN CHART WITH TOGGLE
// ==========================================

interface MainChartProps {
    userId: string;
}

const MainChart = ({ userId }: MainChartProps) => {
    const [chartType, setChartType] = useState<ChartType>('revenue');
    const [timeRange, setTimeRange] = useState<TimeRange>('30d');
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

            try {
                let data: any[] = [];

                if (chartType === 'revenue') {
                    const revenueData = await AnalyticsService.getRevenueOverTime(userId, days);
                    data = revenueData.map(d => ({
                        date: d.date,
                        revenue: d.revenue,
                        deposits: d.deposits,
                        payments: d.payments
                    }));
                } else if (chartType === 'ai') {
                    const aiData = await AnalyticsService.getAIRequestsOverTime(userId, days);
                    data = aiData.map(d => ({
                        date: d.date,
                        requests: d.value
                    }));
                } else if (chartType === 'tasks') {
                    const taskData = await AnalyticsService.getTasksOverTime(userId, days);
                    data = taskData.map(d => ({
                        date: d.date,
                        completed: d.value
                    }));
                }

                setChartData(data);
            } catch (error) {
                console.error('Error fetching chart data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId, chartType, timeRange]);

    const chartConfig = {
        revenue: {
            title: "Revenue & Cash Flow",
            subtitle: "Income over time",
            dataKey: "revenue",
            color: "#10B981",
            gradientId: "colorRevenue"
        },
        ai: {
            title: "AI Requests",
            subtitle: "Connect AI usage over time",
            dataKey: "requests",
            color: "#F59E0B",
            gradientId: "colorAI"
        },
        tasks: {
            title: "Tasks Completed",
            subtitle: "Task completion rate over time",
            dataKey: "completed",
            color: "#3B82F6",
            gradientId: "colorTasks"
        }
    };

    const config = chartConfig[chartType];

    return (
        <GlassCard
            className="col-span-full h-[480px]"
            title={config.title}
            subtitle={config.subtitle}
            action={
                <div className="flex items-center gap-4">
                    <PillToggle
                        options={[
                            { value: 'revenue', label: 'Revenue' },
                            { value: 'ai', label: 'AI Requests' },
                            { value: 'tasks', label: 'Tasks' }
                        ]}
                        value={chartType}
                        onChange={(v) => setChartType(v as ChartType)}
                    />
                    <PillToggle
                        options={[
                            { value: '7d', label: '7D' },
                            { value: '30d', label: '30D' },
                            { value: '90d', label: '90D' }
                        ]}
                        value={timeRange}
                        onChange={(v) => setTimeRange(v as TimeRange)}
                    />
                </div>
            }
        >
            <div className="h-[360px] w-full mt-4">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full"
                        />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id={config.gradientId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={config.color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.3} />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                tickFormatter={(str) => {
                                    try {
                                        return format(new Date(str), 'd MMM');
                                    } catch {
                                        return str;
                                    }
                                }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                tickFormatter={(val) => chartType === 'revenue' ? `D${val}` : val.toString()}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey={config.dataKey}
                                stroke={config.color}
                                strokeWidth={3}
                                fillOpacity={1}
                                fill={`url(#${config.gradientId})`}
                                activeDot={{ r: 8, strokeWidth: 0, fill: config.color }}
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </GlassCard>
    );
};

// ==========================================
// STORAGE DISTRIBUTION
// ==========================================

interface StorageDistributionProps {
    data: AnalyticsDashboard | null;
}

const StorageDistribution = ({ data }: StorageDistributionProps) => {
    if (!data) return null;

    const storageCategories = [
        { name: 'Mail Attachments', value: data.storage.breakdown.mailAttachments, color: '#3B82F6' },
        { name: 'Chat Media', value: data.storage.breakdown.chatAttachments, color: '#EC4899' },
        { name: 'Profile Media', value: data.storage.breakdown.profileMedia, color: '#6366F1' },
        { name: 'Contracts', value: data.storage.breakdown.contracts + data.storage.breakdown.proposals, color: '#F59E0B' },
        { name: 'Task Proofs', value: data.storage.breakdown.proofOfTask, color: '#10B981' },
        { name: 'Other Files', value: data.storage.breakdown.otherFiles, color: '#8B5CF6' },
    ].filter(cat => cat.value > 0);

    const gaugeData = [{
        name: 'Used',
        value: Math.min(data.storage.percentage, 100),
        fill: data.storage.percentage > 90 ? '#EF4444' : data.storage.percentage > 75 ? '#F59E0B' : '#10B981'
    }];

    return (
        <GlassCard className="col-span-full" title="Storage Distribution" subtitle={`${StorageQuotaService.formatBytes(data.storage.usedBytes)} of ${StorageQuotaService.formatBytes(data.storage.totalBytes)} used`}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
                {/* Gauge Chart */}
                <div className="flex items-center justify-center">
                    <div className="relative w-48 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart
                                cx="50%"
                                cy="50%"
                                innerRadius="70%"
                                outerRadius="100%"
                                barSize={12}
                                data={gaugeData}
                                startAngle={180}
                                endAngle={0}
                            >
                                <RadialBar
                                    background={{ fill: '#E5E7EB' }}
                                    dataKey="value"
                                    cornerRadius={10}
                                />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                {data.storage.percentage.toFixed(0)}%
                            </span>
                            <span className="text-sm text-gray-500">Used</span>
                        </div>
                    </div>
                </div>

                {/* Breakdown Bars */}
                <div className="lg:col-span-2 space-y-4">
                    {storageCategories.map((cat, i) => (
                        <motion.div
                            key={cat.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * i }}
                            className="flex items-center gap-4"
                        >
                            <div className="w-32 flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate">{cat.name}</span>
                            </div>
                            <div className="flex-1 h-3 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: cat.color }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min((cat.value / data.storage.usedBytes) * 100, 100)}%` }}
                                    transition={{ duration: 1, delay: 0.2 + (i * 0.1) }}
                                />
                            </div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white w-20 text-right">
                                {StorageQuotaService.formatBytes(cat.value)}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </GlassCard>
    );
};

// ==========================================
// SECONDARY STATS ROW
// ==========================================

interface SecondaryStatsProps {
    data: AnalyticsDashboard | null;
}

const SecondaryStats = ({ data }: SecondaryStatsProps) => {
    if (!data) return null;

    const stats = [
        { label: "Total Projects", value: data.projects.total, icon: FolderKanban, color: "text-indigo-500", bg: "bg-indigo-500/10" },
        { label: "Active Projects", value: data.projects.active, icon: Activity, color: "text-green-500", bg: "bg-green-500/10" },
        { label: "Collaborators", value: data.collaborators, icon: Users, color: "text-pink-500", bg: "bg-pink-500/10" },
        { label: "Tasks In Progress", value: data.tasks.inProgress, icon: Layers, color: "text-orange-500", bg: "bg-orange-500/10" },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
                <motion.div
                    key={idx}
                    variants={itemVariants}
                    className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-zinc-800/50 p-4"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className={cn("p-2 rounded-xl", stat.bg)}>
                            <stat.icon className={cn("w-5 h-5", stat.color)} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        <AnimatedCounter value={stat.value} />
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                </motion.div>
            ))}
        </div>
    );
};

// ==========================================
// GENERATE REPORT BUTTON
// ==========================================

interface GenerateReportProps {
    data: AnalyticsDashboard | null;
    username: string;
}

const GenerateReport = ({ data, username }: GenerateReportProps) => {
    const [generating, setGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!data) return;

        setGenerating(true);

        try {
            // Dynamic import to avoid SSR issues
            const jsPDF = (await import('jspdf')).default;

            const pdf = new jsPDF();
            const pageWidth = pdf.internal.pageSize.getWidth();

            // Title
            pdf.setFontSize(24);
            pdf.setTextColor(0, 128, 128);
            pdf.text('Connekt Analytics Report', pageWidth / 2, 20, { align: 'center' });

            // Date
            pdf.setFontSize(10);
            pdf.setTextColor(128, 128, 128);
            pdf.text(`Generated on ${format(new Date(), 'PPP')} for @${username}`, pageWidth / 2, 28, { align: 'center' });

            // Divider
            pdf.setDrawColor(0, 128, 128);
            pdf.line(20, 35, pageWidth - 20, 35);

            // Stats
            pdf.setFontSize(14);
            pdf.setTextColor(0, 0, 0);

            let y = 50;

            pdf.text('Overview', 20, y);
            y += 10;

            pdf.setFontSize(11);
            pdf.text(`• AI Tokens Used: ${data.aiTokens.isUnlimited ? 'Unlimited' : `${data.aiTokens.used} / ${data.aiTokens.limit}`}`, 25, y);
            y += 7;
            pdf.text(`• Cloud Storage: ${StorageQuotaService.formatBytes(data.storage.usedBytes)} / ${StorageQuotaService.formatBytes(data.storage.totalBytes)} (${data.storage.percentage.toFixed(1)}%)`, 25, y);
            y += 7;
            pdf.text(`• Total Revenue: D${data.revenue.total.toFixed(2)}`, 25, y);
            y += 7;
            pdf.text(`• Escrow Holdings: D${data.revenue.escrowHoldings.toFixed(2)}`, 25, y);
            y += 15;

            pdf.setFontSize(14);
            pdf.text('Projects', 20, y);
            y += 10;

            pdf.setFontSize(11);
            pdf.text(`• Total: ${data.projects.total}`, 25, y);
            y += 7;
            pdf.text(`• Active: ${data.projects.active}`, 25, y);
            y += 7;
            pdf.text(`• Completed: ${data.projects.completed}`, 25, y);
            y += 15;

            pdf.setFontSize(14);
            pdf.text('Tasks', 20, y);
            y += 10;

            pdf.setFontSize(11);
            pdf.text(`• Created: ${data.tasks.created}`, 25, y);
            y += 7;
            pdf.text(`• Completed: ${data.tasks.completed}`, 25, y);
            y += 7;
            pdf.text(`• In Progress: ${data.tasks.inProgress}`, 25, y);
            y += 7;
            pdf.text(`• Pending Validation: ${data.tasks.pending}`, 25, y);
            y += 15;

            pdf.setFontSize(14);
            pdf.text('Storage Breakdown', 20, y);
            y += 10;

            pdf.setFontSize(11);
            const breakdown = data.storage.breakdown;
            if (breakdown.mailAttachments > 0) {
                pdf.text(`• Mail Attachments: ${StorageQuotaService.formatBytes(breakdown.mailAttachments)}`, 25, y);
                y += 7;
            }
            if (breakdown.chatAttachments > 0) {
                pdf.text(`• Chat Media: ${StorageQuotaService.formatBytes(breakdown.chatAttachments)}`, 25, y);
                y += 7;
            }
            if (breakdown.profileMedia > 0) {
                pdf.text(`• Profile Media: ${StorageQuotaService.formatBytes(breakdown.profileMedia)}`, 25, y);
                y += 7;
            }
            if (breakdown.contracts + breakdown.proposals > 0) {
                pdf.text(`• Contracts & Proposals: ${StorageQuotaService.formatBytes(breakdown.contracts + breakdown.proposals)}`, 25, y);
                y += 7;
            }
            if (breakdown.proofOfTask > 0) {
                pdf.text(`• Task Proofs: ${StorageQuotaService.formatBytes(breakdown.proofOfTask)}`, 25, y);
                y += 7;
            }
            if (breakdown.otherFiles > 0) {
                pdf.text(`• Other Files: ${StorageQuotaService.formatBytes(breakdown.otherFiles)}`, 25, y);
                y += 7;
            }

            // Footer
            pdf.setFontSize(9);
            pdf.setTextColor(128, 128, 128);
            pdf.text('Powered by Connekt', pageWidth / 2, 280, { align: 'center' });

            pdf.save(`connekt-analytics-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <motion.button
            onClick={handleGenerate}
            disabled={generating || !data}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all",
                "bg-gradient-to-r from-[#008080] to-teal-500 text-white shadow-lg shadow-teal-500/20",
                "hover:shadow-xl hover:shadow-teal-500/30",
                "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
        >
            {generating ? (
                <>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    Generating...
                </>
            ) : (
                <>
                    <FileText size={20} />
                    Generate Report
                </>
            )}
        </motion.button>
    );
};

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================

export default function AnalyticsDashboard() {
    const { user, userProfile } = useAuth();
    const [dashboardData, setDashboardData] = useState<AnalyticsDashboard | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.uid || !userProfile?.username) return;

            setLoading(true);
            try {
                const data = await AnalyticsService.getAnalyticsDashboard(
                    user.uid,
                    userProfile.username,
                    userProfile.role || 'va'
                );
                setDashboardData(data);
            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user?.uid, userProfile?.username, userProfile?.role]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] dark:bg-black flex flex-col items-center justify-center relative overflow-hidden">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-tr from-teal-500/20 to-purple-500/20 blur-3xl"
                />
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: 200 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="h-1 bg-gradient-to-r from-teal-400 to-blue-600 rounded-full z-10"
                />
                <p className="mt-4 text-sm text-gray-400 font-mono tracking-widest animate-pulse">LOADING ANALYTICS</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#000000] text-gray-900 dark:text-gray-100 selection:bg-teal-500/30 selection:text-teal-900 font-sans transition-colors duration-500">

            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-teal-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vh] bg-blue-500/5 rounded-full blur-[100px]" />
                <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[80px]" />
            </div>

            {/* Main Content */}
            <div className="relative z-10">
                <main className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8">

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                    >
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-[#008080] text-sm font-bold mb-2">
                                <Sparkles size={14} />
                                Analytics Dashboard
                            </div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                                Your Performance
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">
                                Overview of your Connekt activity and metrics
                            </p>
                        </div>
                        <GenerateReport data={dashboardData} username={userProfile?.username || ''} />
                    </motion.div>

                    {/* 1. KEY METRICS ROW */}
                    <motion.section variants={containerVariants} initial="hidden" animate="show">
                        <MetricsRow data={dashboardData} role={userProfile?.role || 'va'} />
                    </motion.section>

                    {/* 2. MAIN CHART */}
                    <LayoutGroup>
                        <motion.section
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                        >
                            {user?.uid && <MainChart userId={user.uid} />}
                        </motion.section>

                        {/* 3. STORAGE DISTRIBUTION */}
                        <motion.section
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, margin: "-100px" }}
                        >
                            <StorageDistribution data={dashboardData} />
                        </motion.section>

                        {/* 4. SECONDARY STATS */}
                        <motion.section
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, margin: "-50px" }}
                        >
                            <SecondaryStats data={dashboardData} />
                        </motion.section>
                    </LayoutGroup>

                    {/* Footer */}
                    <footer className="pt-10 border-t border-gray-200 dark:border-zinc-800 mt-20">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <div>© {new Date().getFullYear()} Connekt. All rights reserved.</div>
                        </div>
                    </footer>

                </main>
            </div>
        </div>
    );
}