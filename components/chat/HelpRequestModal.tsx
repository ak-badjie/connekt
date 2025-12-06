'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { TaskService } from '@/lib/services/task-service';
import { ContractMailService } from '@/lib/services/contract-mail-service';
import { Task } from '@/lib/types/workspace.types';
import { Loader2, Briefcase, DollarSign, Clock, Sparkles } from 'lucide-react';
import { ChatService } from '@/lib/services/chat-service';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';
import { JobTemplateService } from '@/lib/services/job-template-service';
import { JobTemplate } from '@/lib/types/workspace.types';

interface HelpRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId: string;
    recipientId?: string; // If direct message
    recipientUsername?: string;
}

export function HelpRequestModal({ isOpen, onClose, conversationId, recipientId, recipientUsername }: HelpRequestModalProps) {
    const { user, userProfile } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [offerType, setOfferType] = useState<'free' | 'paid'>('free');
    const [budget, setBudget] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sendMode, setSendMode] = useState<'email' | 'contract' | 'proposal'>('email');

    // Templates
    const [templates, setTemplates] = useState<JobTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [selectedTemplate, setSelectedTemplate] = useState<JobTemplate | null>(null);

    useEffect(() => {
        if (isOpen && user) {
            loadTasks();
            // Load templates from user's workspaces? 
            // Since Help Request is "Personal" or "Project" based, maybe just load generic or all?
            // For now, let's load templates if the task has a workspace.
        }
    }, [isOpen, user]);

    // Load templates when task is selected
    useEffect(() => {
        if (selectedTask?.workspaceId) {
            loadTemplates(selectedTask.workspaceId);
        }
    }, [selectedTask]);

    const loadTemplates = async (wsId: string) => {
        try {
            const allTemplates = await JobTemplateService.getTemplates(wsId);
            // Filter for 'task' type templates suitable for help requests
            setTemplates(allTemplates.filter(t => t.type === 'task'));
        } catch (e) {
            console.error('Error loading templates', e);
        }
    };

    const loadTasks = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Get tasks assigned to user that are in progress or todo
            const userTasks = await TaskService.getUserTasks(user.uid);
            setTasks(userTasks.filter(t => t.status === 'todo' || t.status === 'in-progress'));
        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const buildContractVariables = () => {
        if (!selectedTask) return {};

        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        const due = selectedTask.timeline?.dueDate ? new Date(selectedTask.timeline.dueDate as any) : null;
        const endStr = due ? due.toISOString().slice(0, 10) : todayStr;
        const durationDays = due ? Math.max(1, Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))) : 7;

        return {
            contractDate: todayStr,
            clientName: userProfile?.displayName || userProfile?.username || 'Client',
            contractorName: recipientUsername || 'Recipient',
            projectTitle: selectedTask.title,
            projectDescription: message || selectedTask.description || 'Help request',
            deliverables: selectedTask.description || 'Task assistance',
            startDate: todayStr,
            endDate: endStr,
            duration: durationDays,
            durationUnit: 'days',
            paymentAmount: offerType === 'paid' ? Number(budget || 0) : 0,
            paymentCurrency: 'USD',
            paymentType: selectedTemplate?.paymentSchedule || (offerType === 'paid' ? 'fixed' : 'none'),
            paymentMilestones: 'Milestones will be defined in the task plan.',
            reviewPeriod: 3,
            revisionRounds: 1,
            noticePeriod: 7,
            terminationConditions: 'Either party may terminate with notice via Connekt.',

            // Template Injections
            condition_penaltyPerLateTask: selectedTemplate?.conditions?.penaltyPerLateTask
                ? `${selectedTemplate.conditions.penaltyPerLateTask} ${selectedTemplate.conditions.penaltyUnit}`
                : 'None'
        } as Record<string, any>;
    };

    const buildProposalVariables = () => {
        if (!selectedTask) return {};
        const todayStr = new Date().toISOString().slice(0, 10);
        const due = selectedTask.timeline?.dueDate ? new Date(selectedTask.timeline.dueDate as any) : null;
        const validUntil = due ? due.toISOString().slice(0, 10) : todayStr;

        return {
            proposalTitle: `Proposal: ${selectedTask.title}`,
            date: todayStr,
            recipientName: recipientUsername || 'Recipient',
            senderName: userProfile?.displayName || userProfile?.username || 'Sender',
            executiveSummary: message || 'Assistance proposal for your task.',
            solutionDetails: selectedTask.description || 'I will help complete this task.',
            timeline: due ? `Complete by ${due.toDateString()}` : 'Timeline to be agreed',
            totalCost: offerType === 'paid' ? Number(budget || 0) : 0,
            currency: 'USD',
            paymentTerms: offerType === 'paid' ? 'Fixed payment upon completion.' : 'No payment required.',
            validUntil
        } as Record<string, any>;
    };

    const openMailCompose = (autoStartAI: boolean) => {
        if (!selectedTask || !recipientUsername) return;

        const toAddress = `${recipientUsername}@connekt.com`;
        const subjectBase = `Help Request: ${selectedTask.title}`;
        const baseBody = `Hi ${recipientUsername},\n\nI need help with "${selectedTask.title}".${message ? `\n\nDetails: ${message}` : ''}\n\nThanks,\n${userProfile?.displayName || userProfile?.username || 'A teammate'}`;

        const params = new URLSearchParams({
            compose: '1',
            to: toAddress,
            subject: subjectBase,
            body: baseBody,
            autoStart: autoStartAI ? '1' : '0'
        });

        let templateId: string | undefined;
        let contractType: string | undefined;
        let variables: Record<string, any> | undefined;
        let brief: string | undefined;

        if (sendMode === 'contract') {
            templateId = 'Project-Based Job Contract';
            contractType = 'task_assignment';
            variables = buildContractVariables();
            brief = `Task: ${selectedTask.title}\nOffer: ${offerType === 'paid' ? `$${budget}` : 'Free'}\nFrom: ${userProfile?.username}\nTo: ${recipientUsername}`;
        } else if (sendMode === 'proposal') {
            templateId = 'General Business Proposal';
            contractType = 'general';
            variables = buildProposalVariables();
            brief = `Proposal for ${selectedTask.title} from @${userProfile?.username} to @${recipientUsername}`;
        }

        if (templateId) params.set('templateId', templateId);
        if (contractType) params.set('contractType', contractType);
        if (brief) params.set('brief', brief);
        if (variables) params.set('variables', JSON.stringify(variables));

        const url = `/mail?${params.toString()}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleSubmit = async () => {
        if (!user || !userProfile || !selectedTask) return;

        // For contract/proposal, we primarily deep-link to mail; still drop a chat marker so teammates see context.
        if (sendMode === 'contract' || sendMode === 'proposal') {
            if (!recipientUsername) return;
            openMailCompose(false);
        }

        setSending(true);
        try {
            // Send Help Request Message to chat regardless, so thread has context
            await ChatService.sendMessage({
                conversationId,
                senderId: user.uid,
                senderUsername: userProfile?.username || 'Unknown',
                senderAvatarUrl: userProfile.photoURL || undefined,
                content: message || `I need help with this task: ${selectedTask.title}`,
                type: 'help_request',
                helpRequest: {
                    taskId: selectedTask.id,
                    taskTitle: selectedTask.title,
                    projectId: selectedTask.projectId,
                    budget: offerType === 'paid' ? Number(budget) : 0,
                    status: 'open'
                }
            });

            onClose();
        } catch (error) {
            console.error('Error sending help request:', error);
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
                <DialogHeader>
                    <DialogTitle>Ask for Help</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Send Mode Toggle */}
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
                                <span className="text-[11px] text-gray-400">{mode === 'email' ? 'Chat + mail' : mode === 'contract' ? 'Attach contract' : 'Send proposal'}</span>
                            </button>
                        ))}
                    </div>
                    {/* Task Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Task</label>
                        {loading ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Loader2 size={16} className="animate-spin" /> Loading tasks...
                            </div>
                        ) : tasks.length === 0 ? (
                            <p className="text-sm text-gray-500">No active tasks found.</p>
                        ) : (
                            <select
                                className="w-full p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 border-none text-sm"
                                onChange={(e) => setSelectedTask(tasks.find(t => t.id === e.target.value) || null)}
                                value={selectedTask?.id || ''}
                            >
                                <option value="">Select a task...</option>
                                {tasks.map(task => (
                                    <option key={task.id} value={task.id}>{task.title}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Offer Type */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setOfferType('free')}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${offerType === 'free'
                                ? 'border-[#008080] bg-teal-50 dark:bg-teal-900/20 text-[#008080]'
                                : 'border-gray-200 dark:border-zinc-800 text-gray-500'
                                }`}
                        >
                            <Briefcase size={20} />
                            <span className="text-xs font-bold">Free Help</span>
                        </button>
                        <button
                            onClick={() => setOfferType('paid')}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${offerType === 'paid'
                                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-600'
                                : 'border-gray-200 dark:border-zinc-800 text-gray-500'
                                }`}
                        >
                            <DollarSign size={20} />
                            <span className="text-xs font-bold">Paid Offer</span>
                        </button>
                    </div>

                    {/* Budget Input */}
                    {offerType === 'paid' && (
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Budget ($)</label>
                                <input
                                    type="number"
                                    value={budget}
                                    onChange={(e) => setBudget(e.target.value)}
                                    placeholder="Enter amount"
                                    className="w-full p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 border-none text-sm"
                                />
                                <p className="text-xs text-amber-600">A contract will be created automatically.</p>
                            </div>

                            {/* Template Selection for Paid Tasks */}
                            {templates.length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Use Template (Conditions)</label>
                                    <select
                                        className="w-full p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 border-none text-sm"
                                        onChange={(e) => {
                                            const t = templates.find(temp => temp.id === e.target.value);
                                            setSelectedTemplate(t || null);
                                            setSelectedTemplateId(e.target.value);
                                        }}
                                        value={selectedTemplateId}
                                    >
                                        <option value="">-- No Template --</option>
                                        {templates.map(t => (
                                            <option key={t.id} value={t.id}>{t.title}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Message */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Describe what help you need..."
                            className="w-full p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 border-none text-sm h-24 resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedTask || (offerType === 'paid' && !budget) || sending || (!recipientUsername && sendMode !== 'email')}
                            className="w-full py-3 bg-[#008080] text-white rounded-xl font-bold hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {sending ? <Loader2 size={18} className="animate-spin" /> : sendMode === 'email' ? 'Send Request' : sendMode === 'contract' ? 'Send Contract' : 'Send Proposal'}
                        </button>

                        <button
                            onClick={() => openMailCompose(true)}
                            disabled={!selectedTask || !recipientUsername || sending || sendMode === 'email'}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed self-center"
                        >
                            {sending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Drafting...
                                </>
                            ) : (
                                <>
                                    <span>Draft {sendMode === 'proposal' ? 'proposal' : 'contract'} with</span>
                                    <ConnektAIIcon className="w-4 h-4" />
                                </>
                            )}
                        </button>
                        {sendMode !== 'email' && !recipientUsername && (
                            <p className="text-xs text-amber-600 text-center">Direct recipient required to send {sendMode} via mail.</p>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
