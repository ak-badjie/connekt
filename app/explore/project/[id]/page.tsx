'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { Project } from '@/lib/types/workspace.types';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Briefcase, DollarSign, Calendar, Users, MapPin, Clock, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';

export default function PublicProjectPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const projectId = params?.id as string;

    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showProposalModal, setShowProposalModal] = useState(false);
    const [sending, setSending] = useState(false);
    const [sendMode, setSendMode] = useState<'email' | 'contract' | 'proposal'>('proposal');

    useEffect(() => {
        const loadProject = async () => {
            if (!projectId) return;

            try {
                const projectData = await EnhancedProjectService.getProject(projectId);
                if (projectData && projectData.isPublic) {
                    setProject(projectData);
                } else {
                    router.push('/explore');
                }
            } catch (error) {
                console.error('Error loading project:', error);
                router.push('/explore');
            } finally {
                setIsLoading(false);
            }
        };

        loadProject();
    }, [projectId, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-teal-950/20 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#008080]/10 animate-pulse" />
                    <p className="text-gray-500">Loading project...</p>
                </div>
            </div>
        );
    }

    if (!project) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-teal-950/20">
            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Back Button */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-6"
                >
                    <Link
                        href="/explore"
                        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#008080] transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Back to Explore
                    </Link>
                </motion.div>

                {/* Main Content Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl p-8 shadow-2xl mb-6"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-14 h-14 rounded-2xl bg-[#008080]/10 dark:bg-[#008080]/20 flex items-center justify-center">
                                    <Briefcase size={28} className="text-[#008080]" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                                        {project.title}
                                    </h1>
                                    <p className="text-sm text-gray-500">Project ID: {project.id}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="px-4 py-2 rounded-xl bg-[#008080]/10 text-[#008080] font-bold text-sm">
                                {project.status}
                            </div>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-100 dark:border-green-800/30"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign size={18} className="text-green-600 dark:text-green-400" />
                                <span className="text-xs font-bold text-green-600 dark:text-green-400">Budget</span>
                            </div>
                            <div className="text-2xl font-black text-gray-900 dark:text-white">
                                ${project.budget.toLocaleString()}
                            </div>
                        </motion.div>

                        {project.deadline && (
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-100 dark:border-blue-800/30"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar size={18} className="text-blue-600 dark:text-blue-400" />
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Deadline</span>
                                </div>
                                <div className="text-lg font-black text-gray-900 dark:text-white">
                                    {new Date(project.deadline).toLocaleDateString()}
                                </div>
                            </motion.div>
                        )}

                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-100 dark:border-purple-800/30"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Users size={18} className="text-purple-600 dark:text-purple-400" />
                                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">Team</span>
                            </div>
                            <div className="text-2xl font-black text-gray-900 dark:text-white">
                                {project.members.length}
                            </div>
                        </motion.div>

                        {project.recurringType && project.recurringType !== 'none' && (
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800/30"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock size={18} className="text-amber-600 dark:text-amber-400" />
                                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Type</span>
                                </div>
                                <div className="text-lg font-black text-gray-900 dark:text-white capitalize">
                                    {project.recurringType}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="mb-8">
                        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">
                            Project Description
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                            {project.description}
                        </p>
                    </div>

                    {/* Posted By */}
                    <div className="border-t border-gray-100 dark:border-zinc-800 pt-6">
                        <h3 className="text-sm font-bold text-gray-500 mb-3">Posted By</h3>
                        <Link
                            href={`/@${project.ownerUsername}`}
                            className="inline-flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white font-bold">
                                {project.ownerUsername[0].toUpperCase()}
                            </div>
                            <div>
                                <div className="font-bold text-gray-900 dark:text-white">
                                    @{project.ownerUsername}
                                </div>
                                <div className="text-xs text-gray-500">Project Owner</div>
                            </div>
                        </Link>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-4"
                >
                    {user ? (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowProposalModal(true)}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[#008080] hover:bg-teal-600 text-white font-black text-lg shadow-lg shadow-teal-500/30 transition-all"
                        >
                            <Send size={20} />
                            Send Proposal
                        </motion.button>
                    ) : (
                        <Link href="/auth" className="flex-1">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[#008080] hover:bg-teal-600 text-white font-black text-lg shadow-lg shadow-teal-500/30 transition-all"
                            >
                                Sign In to Apply
                            </motion.button>
                        </Link>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-4 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-gray-200 dark:border-zinc-700 hover:border-[#008080] text-gray-900 dark:text-white font-bold transition-all"
                    >
                        Save
                    </motion.button>
                </motion.div>

                {/* Proposal Modal */}
                {showProposalModal && project && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-2xl w-full space-y-4"
                        >
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                                Send Proposal
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Reach out to @{project.ownerUsername} with email, contract, or proposal. Use ConnektAI for instant drafting or send manually.
                            </p>

                            {/* Mode toggle */}
                            <div className="grid grid-cols-3 gap-2">
                                {(['email', 'contract', 'proposal'] as const).map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => setSendMode(mode)}
                                        className={`p-3 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center gap-1 ${sendMode === mode
                                            ? 'border-[#008080] bg-teal-50 dark:bg-teal-900/20 text-[#008080]'
                                            : 'border-gray-200 dark:border-zinc-800 text-gray-500'}`}
                                    >
                                        <span className="capitalize">{mode}</span>
                                        <span className="text-[11px] text-gray-400">{mode === 'email' ? 'Simple email' : mode === 'contract' ? 'Attach contract' : 'Business proposal'}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Action buttons */}
                            <div className="space-y-2">
                                <button
                                    disabled={sending}
                                    onClick={() => {
                                        if (!project) return;
                                        const toAddress = `${project.ownerUsername}@connekt.com`;
                                        const params = new URLSearchParams({
                                            compose: '1',
                                            to: toAddress,
                                            subject: sendMode === 'proposal' ? `Proposal for ${project.title}` : `Regarding ${project.title}`,
                                            body: project.description || '',
                                            autoStart: '0'
                                        });

                                        if (sendMode === 'contract') {
                                            params.set('templateId', 'Project-Based Job Contract');
                                            params.set('contractType', 'project_assignment');
                                            params.set('brief', `Project: ${project.title}\nBudget: ${project.budget}\nDeadline: ${project.deadline ? new Date(project.deadline).toDateString() : 'N/A'}\nDescription: ${project.description || ''}`);
                                            const variables = {
                                                contractDate: new Date().toISOString().slice(0, 10),
                                                clientName: project.ownerUsername,
                                                contractorName: project.title,
                                                projectTitle: project.title,
                                                projectDescription: project.description || 'Project proposal',
                                                deliverables: project.description || 'Deliverables to be defined',
                                                startDate: new Date().toISOString().slice(0, 10),
                                                endDate: project.deadline ? new Date(project.deadline).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
                                                duration: 30,
                                                durationUnit: 'days',
                                                paymentAmount: project.budget || 0,
                                                paymentCurrency: 'USD',
                                                paymentType: 'fixed',
                                                paymentMilestones: 'Milestones to be agreed',
                                                reviewPeriod: 5,
                                                revisionRounds: 2,
                                                noticePeriod: 7,
                                                terminationConditions: 'Either party may terminate with notice via Connekt.'
                                            } as Record<string, any>;
                                            params.set('variables', JSON.stringify(variables));
                                        }

                                        if (sendMode === 'proposal') {
                                            params.set('templateId', 'General Business Proposal');
                                            params.set('contractType', 'general');
                                            params.set('brief', `Proposal for ${project.title} from @${project.ownerUsername}`);
                                            const todayStr = new Date().toISOString().slice(0, 10);
                                            const validUntil = project.deadline ? new Date(project.deadline).toISOString().slice(0, 10) : todayStr;
                                            const variables = {
                                                proposalTitle: `Proposal: ${project.title}`,
                                                date: todayStr,
                                                recipientName: project.ownerUsername,
                                                senderName: user?.displayName || user?.email || 'Sender',
                                                executiveSummary: project.description || 'Project proposal',
                                                solutionDetails: project.description || 'Proposed delivery plan',
                                                timeline: project.deadline ? `Complete by ${new Date(project.deadline).toDateString()}` : 'Timeline to be agreed',
                                                totalCost: project.budget || 0,
                                                currency: 'USD',
                                                paymentTerms: 'Fixed payment upon completion.',
                                                validUntil
                                            } as Record<string, any>;
                                            params.set('variables', JSON.stringify(variables));
                                        }

                                        setSending(true);
                                        router.push(`/mail?${params.toString()}`);
                                        setSending(false);
                                        setShowProposalModal(false);
                                    }}
                                    className="w-full px-6 py-3 rounded-xl bg-[#008080] hover:bg-teal-600 text-white font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {sending ? 'Opening...' : sendMode === 'email' ? 'Send Email' : sendMode === 'contract' ? 'Send Contract' : 'Send Proposal'}
                                </button>

                                <button
                                    disabled={sending}
                                    onClick={() => {
                                        if (!project) return;
                                        const toAddress = `${project.ownerUsername}@connekt.com`;
                                        const params = new URLSearchParams({
                                            compose: '1',
                                            to: toAddress,
                                            subject: sendMode === 'proposal' ? `Proposal for ${project.title}` : `Regarding ${project.title}`,
                                            body: project.description || '',
                                            autoStart: '1'
                                        });

                                        if (sendMode === 'contract') {
                                            params.set('templateId', 'Project-Based Job Contract');
                                            params.set('contractType', 'project_assignment');
                                            params.set('brief', `Project: ${project.title}\nBudget: ${project.budget}\nDeadline: ${project.deadline ? new Date(project.deadline).toDateString() : 'N/A'}\nDescription: ${project.description || ''}`);
                                        }

                                        if (sendMode === 'proposal') {
                                            params.set('templateId', 'General Business Proposal');
                                            params.set('contractType', 'general');
                                            params.set('brief', `Proposal for ${project.title} from @${project.ownerUsername}`);
                                        }

                                        setSending(true);
                                        router.push(`/mail?${params.toString()}`);
                                        setSending(false);
                                        setShowProposalModal(false);
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span>Draft with</span>
                                    <ConnektAIIcon className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowProposalModal(false)}
                                    className="px-6 py-3 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
}
