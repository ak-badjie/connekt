'use client';

import { useState, useEffect } from 'react';
import { X, Send, Paperclip, Image as ImageIcon, Video, FileText, Link as LinkIcon, Loader2, Maximize2, Minimize2, FileSignature } from 'lucide-react';
import { AdvancedRichTextEditor } from './AdvancedRichTextEditor';
import ContractMailComposer from './ContractMailComposer';
import ProposalComposer from './ProposalComposer';
import { ProposalViewer } from '@/components/contracts/ProposalViewer';
import { Signature } from '@/lib/services/mail-service';
import { Attachment, StorageService } from '@/lib/services/storage-service';
import { motion, AnimatePresence } from 'framer-motion';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';
import { AIEmailComposerModal } from './ai/AIEmailComposerModal';
import { useAuth } from '@/context/AuthContext';
import { UnifiedContractViewer } from '@/components/contracts/UnifiedContractViewer';
import { Eye } from 'lucide-react';

interface ComposeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (
        recipient: string,
        subject: string,
        body: string,
        attachments?: Attachment[],
        category?: string,
        signatureId?: string,
        contractData?: { templateId?: string; terms?: any; defaultTerms?: string; description?: string } | null
    ) => Promise<void>;
    onSaveDraft?: (recipient: string, subject: string, body: string, attachments?: Attachment[], category?: string) => Promise<void>;
    signatures?: Signature[];
    initialData?: {
        recipient?: string;
        subject?: string;
        body?: string;
        isProposalResponse?: boolean; // New Flag
    };
    autoContractDraftRequest?: {
        templateId?: string;
        contractType?: string;
        brief?: string;
        variables?: Record<string, any>;
        autoStart?: boolean;
        autoSelectTaskId?: string;
        autoSelectProjectId?: string;
        autoSelectWorkspaceId?: string;
    };
}

export function ComposeModal({ isOpen, onClose, onSend, onSaveDraft, signatures = [], initialData, autoContractDraftRequest }: ComposeModalProps) {
    if (isOpen) {
        console.log('ComposeModal Open. Data:', { initialData, autoContractDraftRequest });
    }
    const [recipient, setRecipient] = useState(initialData?.recipient || '');
    const [subject, setSubject] = useState(initialData?.subject || '');
    const [body, setBody] = useState(initialData?.body || '');
    const [category, setCategory] = useState('');
    const [selectedSignature, setSelectedSignature] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [sending, setSending] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [mode, setMode] = useState<'email' | 'contract' | 'proposal'>('email');
    const [contractData, setContractData] = useState<{
        templateId?: string;
        terms?: any;
        defaultTerms?: string;
        description?: string;
        contractId?: string;
        type?: 'contract' | 'proposal';
        title?: string; // Add title field
    } | null>(null);
    const [showAIComposer, setShowAIComposer] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [viewingContract, setViewingContract] = useState<any | null>(null);
    const [showContractPreview, setShowContractPreview] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (initialData) {
            setRecipient(initialData.recipient || '');
            setSubject(initialData.subject || '');
            setBody(initialData.body || '');

            // If replying to a proposal, switch to Contract mode automatically
            if (initialData.isProposalResponse) {
                setMode('contract');
            }
        }
    }, [initialData]);

    // Determine default mode based on request and auto-open contract drafter
    useEffect(() => {
        if (isOpen && autoContractDraftRequest) {
            console.log('Auto-opening Contract Drafter with:', autoContractDraftRequest);
            const { variables, contractType } = autoContractDraftRequest;

            if (variables?.isProposal || contractType === 'general' || contractType?.includes('proposal')) {
                setMode('proposal');
            } else {
                setMode('contract');
            }
        }
    }, [autoContractDraftRequest, isOpen]);


    // Set default signature
    useEffect(() => {
        const defaultSig = signatures.find(sig => sig.isDefault);
        if (defaultSig) {
            setSelectedSignature(defaultSig.id || '');
        }
    }, [signatures]);

    const handleFileUpload = async (files: FileList | null) => {
        if (!files) return;

        setUploading(true);
        const newAttachments: Attachment[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileType = StorageService.validateFileType(file);
            if (!fileType) {
                alert(`File type not supported: ${file.name}`);
                continue;
            }

            if (!StorageService.validateFileSize(file, 25)) {
                alert(`File too large (max 25MB): ${file.name}`);
                continue;
            }

            try {
                const tempMailId = `draft_${Date.now()}`;
                const userId = 'temp_user';
                const url = await StorageService.uploadFile(
                    file,
                    userId,
                    tempMailId,
                    (progress) => setUploadProgress(progress)
                );
                const attachment = StorageService.createAttachment(file, url);
                newAttachments.push(attachment);
            } catch (error) {
                console.error('Upload error:', error);
                alert(`Failed to upload: ${file.name}`);
            }
        }

        setAttachments([...attachments, ...newAttachments]);
        setUploading(false);
        setUploadProgress(0);
    };

    const handleAddLink = () => {
        if (!linkUrl) return;
        const linkAttachment = StorageService.createLinkAttachment(linkUrl);
        setAttachments([...attachments, linkAttachment]);
        setLinkUrl('');
        setShowLinkInput(false);
    };

    const handleRemoveAttachment = (attachmentId: string) => {
        setAttachments(attachments.filter(a => a.id !== attachmentId));
    };

    const handleContractGenerated = (data: {
        title: string;
        description: string;
        terms: any;
        templateId?: string;
        defaultTerms?: string;
    }) => {
        // Helper to format work days array to readable text
        const formatWorkDays = (days: number[] | undefined): string => {
            if (!days || days.length === 0) return 'Mon, Tue, Wed, Thu, Fri';
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return days.map(d => dayNames[d]).join(', ');
        };

        // Helper to format penalty for display
        const formatPenalty = (amount: number | undefined, unit: string | undefined, currency: string | undefined): string => {
            if (!amount || amount === 0) return 'None';
            if (unit === 'percentage') return `${amount}% of payment per late task`;
            return `${amount} ${currency || 'GMD'} per late task`;
        };

        // Get schedule from job posting (passed via autoContractDraftRequest.variables)
        const jobSchedule = autoContractDraftRequest?.variables?.schedule;
        const jobConditions = autoContractDraftRequest?.variables?.conditions;
        const currency = autoContractDraftRequest?.variables?.paymentCurrency || 'GMD';

        // Build schedule-related template variables (matching new template format)
        const scheduleVars = {
            scheduleType: jobSchedule?.isFlexible ? 'Flexible' : 'Fixed Schedule',
            workDaysFormatted: formatWorkDays(jobSchedule?.workDays),
            workStartTime: jobSchedule?.startTime || '09:00',
            workEndTime: jobSchedule?.endTime || '17:00',
            breakDuration: jobSchedule?.breakDurationMinutes || 60,
            timezone: jobSchedule?.timezone || 'UTC',
            hoursPerWeek: 40,
            // Store raw schedule for enforcement
            schedule: jobSchedule
        };

        // Build penalty-related template variables (matching new template format)
        const penaltyVars = {
            penaltyDisplay: formatPenalty(jobConditions?.penaltyPerLateTask, jobConditions?.penaltyUnit, currency),
            overtimeRate: jobConditions?.overtimeRate || 1.5,
            // Store raw conditions for enforcement
            conditions: jobConditions
        };

        if (!subject) setSubject(data.title);
        // Don't overwrite body
        setContractData({
            templateId: data.templateId,
            terms: {
                ...data.terms,
                ...scheduleVars,
                ...penaltyVars
            },
            defaultTerms: data.defaultTerms,
            description: data.description,
            type: 'contract',
            title: data.title
        });
        // Switch back to normal mode to review and send
        setMode('email');
        // Add a category automatically
        setCategory('Contracts');
    };

    const handleProposalGenerated = (data: {
        title: string;
        description: string;
        terms: any;
        templateId?: string;
        defaultTerms?: string;
    }) => {
        // Helper to format work days array to readable text
        const formatWorkDays = (days: number[] | undefined): string => {
            if (!days || days.length === 0) return 'Mon, Tue, Wed, Thu, Fri';
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return days.map(d => dayNames[d]).join(', ');
        };

        // Helper to format penalty for display
        const formatPenalty = (amount: number | undefined, unit: string | undefined, currency: string | undefined): string => {
            if (!amount || amount === 0) return 'None';
            if (unit === 'percentage') return `${amount}% of payment per late task`;
            return `${amount} ${currency || 'GMD'} per late task`;
        };

        // Get schedule from job posting (passed via autoContractDraftRequest.variables)
        const jobSchedule = autoContractDraftRequest?.variables?.schedule;
        const jobConditions = autoContractDraftRequest?.variables?.conditions;
        const currency = autoContractDraftRequest?.variables?.paymentCurrency || 'GMD';

        // Build schedule-related template variables (matching new template format)
        const scheduleVars = {
            scheduleType: jobSchedule?.isFlexible ? 'Flexible' : 'Fixed Schedule',
            workDaysFormatted: formatWorkDays(jobSchedule?.workDays),
            workStartTime: jobSchedule?.startTime || '09:00',
            workEndTime: jobSchedule?.endTime || '17:00',
            breakDuration: jobSchedule?.breakDurationMinutes || 60,
            timezone: jobSchedule?.timezone || 'UTC',
            hoursPerWeek: 40,
            // Store raw schedule for enforcement
            schedule: jobSchedule
        };

        // Build penalty-related template variables (matching new template format)
        const penaltyVars = {
            penaltyDisplay: formatPenalty(jobConditions?.penaltyPerLateTask, jobConditions?.penaltyUnit, currency),
            overtimeRate: jobConditions?.overtimeRate || 1.5,
            // Store raw conditions for enforcement
            conditions: jobConditions
        };

        // Payment details from job
        const paymentVars = {
            ...(autoContractDraftRequest?.variables?.paymentAmount ? { paymentAmount: autoContractDraftRequest.variables.paymentAmount } : {}),
            ...(autoContractDraftRequest?.variables?.paymentCurrency ? { paymentCurrency: autoContractDraftRequest.variables.paymentCurrency } : {}),
            ...(autoContractDraftRequest?.variables?.paymentSchedule ? { paymentSchedule: autoContractDraftRequest.variables.paymentSchedule } : {})
        };

        // Save the generated proposal data
        setContractData({
            templateId: data.templateId,
            terms: {
                ...data.terms,
                proposal: true, // Mark terms as proposal for identification
                // Merge schedule and penalty variables
                ...scheduleVars,
                ...penaltyVars,
                ...paymentVars,
                // Persist context IDs from the initial request if available
                ...(autoContractDraftRequest?.variables?.proposalContext ? {
                    linkedJobId: autoContractDraftRequest.variables.proposalContext.jobId,
                    linkedProjectId: autoContractDraftRequest.variables.proposalContext.projectId || autoContractDraftRequest.variables.proposalContext.jobId,
                    linkedTaskId: autoContractDraftRequest.variables.proposalContext.taskId
                } : {}),
                // Also check direct autoSelect params if they were passed in variables
                ...(autoContractDraftRequest?.variables?.autoSelectProjectId ? { linkedProjectId: autoContractDraftRequest.variables.autoSelectProjectId } : {}),
                ...(autoContractDraftRequest?.variables?.autoSelectTaskId ? { linkedTaskId: autoContractDraftRequest.variables.autoSelectTaskId } : {})
            },
            defaultTerms: data.defaultTerms,
            description: data.description,
            type: 'proposal',
            title: data.title
        });

        // Set Email Metadata
        setCategory('Proposals');
        if (!subject) setSubject(data.title);

        // Auto-fill body if empty
        if (!body || body.trim() === '') {
            setBody(`Dear Hiring Manager,\n\nPlease find attached my proposal regarding "${data.title}".\n\nI look forward to discussing how I can contribute to your project.\n\nBest regards,`);
        }

        // CRITICAL: Switch view back to Email
        setMode('email');
    };

    const handleSend = async () => {
        if (!recipient || !subject) {
            alert('Please fill in recipient and subject');
            return;
        }

        if (!recipient.includes('@') || !recipient.includes('.com')) {
            alert('Please enter a valid Connekt address (e.g., user@connekt.com)');
            return;
        }

        setSending(true);
        try {
            // Pass contract/proposal data to onSend handler if available
            await onSend(
                recipient,
                subject,
                body,
                attachments,
                category || undefined,
                selectedSignature || undefined,
                contractData
            );
            setRecipient('');
            setSubject('');
            setBody('');
            setCategory('');
            setAttachments([]);
            setContractData(null);
            onClose();
        } catch (error: any) {
            alert(error.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleSaveDraft = async () => {
        if (onSaveDraft) {
            await onSaveDraft(recipient, subject, body, attachments, category || undefined);
        }
    };

    const categories = ['Projects', 'Clients', 'Personal', 'Important', 'Contracts', 'Proposals'];

    const getAttachmentIcon = (attachment: Attachment) => {
        switch (attachment.type) {
            case 'image':
                return <ImageIcon size={20} className="text-blue-500" />;
            case 'video':
                return <Video size={20} className="text-purple-500" />;
            case 'link':
                return <LinkIcon size={20} className="text-green-500" />;
            default:
                return <FileText size={20} className="text-gray-500" />;
        }
    };

    const isProposalAttachment = contractData?.type === 'proposal' || contractData?.terms?.proposal;

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl border border-gray-200/50 dark:border-zinc-800/50 flex flex-col overflow-hidden ${isFullScreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[85vh] rounded-3xl'
                        }`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Message</h2>
                            <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
                                {(['email', 'contract', 'proposal'] as const).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setMode(m)}
                                        className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${mode === m
                                            ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                            }`}
                                    >
                                        {m.charAt(0).toUpperCase() + m.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsFullScreen(!isFullScreen)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                            >
                                {isFullScreen ? (
                                    <Minimize2 size={20} className="text-gray-500 dark:text-gray-400" />
                                ) : (
                                    <Maximize2 size={20} className="text-gray-500 dark:text-gray-400" />
                                )}
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                title="Close"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="px-6 py-4 space-y-3 border-b border-gray-200/50 dark:border-zinc-800/50">
                        <div>
                            <input
                                type="text"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                placeholder="To: name@connekt.com or name@agencyhandle.com"
                                className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/30 transition-all"
                            />
                            <p className="text-xs text-gray-500 mt-1 px-1">Enter full Connekt mail address</p>
                        </div>

                        {mode === 'email' && (
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Subject"
                                    className="flex-1 px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/30 transition-all font-medium"
                                />
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/30 transition-all text-sm"
                                >
                                    <option value="">Category (optional)</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Editor or Contract Composer */}
                    <div className="flex-1 overflow-hidden p-4">
                        {mode === 'contract' && (
                            <div className="h-full overflow-y-auto">
                                <ContractMailComposer
                                    onContractGenerated={handleContractGenerated}
                                    autoAIRequest={autoContractDraftRequest}
                                    recipientEmail={recipient}
                                    autoSelectTaskId={autoContractDraftRequest?.autoSelectTaskId}
                                    autoSelectProjectId={autoContractDraftRequest?.autoSelectProjectId}
                                    autoSelectWorkspaceId={autoContractDraftRequest?.autoSelectWorkspaceId}
                                />
                            </div>
                        )}
                        {mode === 'proposal' && (
                            <div className="h-full overflow-y-auto">
                                <ProposalComposer
                                    onProposalGenerated={handleProposalGenerated}
                                    autoAIRequest={autoContractDraftRequest}
                                    templateId={autoContractDraftRequest?.templateId}
                                    initialData={autoContractDraftRequest?.variables}
                                />
                            </div>
                        )}
                        {mode === 'email' && (
                            <AdvancedRichTextEditor
                                value={body}
                                onChange={setBody}
                                minHeight="400px"
                            />
                        )}
                    </div>

                    {/* Attachments */}
                    {
                        mode === 'email' && attachments.length > 0 && (
                            <div className="px-6 py-3 border-t border-gray-200/50 dark:border-zinc-800/50 max-h-32 overflow-y-auto">
                                <div className="flex flex-wrap gap-2">
                                    {attachments.map((attachment) => (
                                        <div
                                            key={attachment.id}
                                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-zinc-800 rounded-xl group"
                                        >
                                            {getAttachmentIcon(attachment)}
                                            <span className="text-sm text-gray-700 dark:text-gray-300 max-w-[150px] truncate">
                                                {attachment.name}
                                            </span>
                                            {attachment.size && (
                                                <span className="text-xs text-gray-500">
                                                    {StorageService.formatFileSize(attachment.size)}
                                                </span>
                                            )}
                                            <button
                                                onClick={() => handleRemoveAttachment(attachment.id)}
                                                className="ml-1 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <X size={14} className="text-red-500" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    }

                    {/* Contract Attachment */}
                    {
                        mode !== 'contract' && mode !== 'proposal' && contractData && (
                            <div className="px-6 py-3 border-t border-gray-200/50 dark:border-zinc-800/50">
                                <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#008080]/10 to-teal-600/10 border-2 border-[#008080]/30 rounded-xl">
                                    <FileSignature size={24} className="text-[#008080]" />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{isProposalAttachment ? 'Proposal Attached' : 'Contract Attached'}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">{subject || (isProposalAttachment ? 'Untitled Proposal' : 'Untitled Contract')}</p>
                                    </div>
                                    <button
                                        onClick={() => setShowContractPreview(true)}
                                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-[#008080] hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
                                    >
                                        <Eye size={16} />
                                        {isProposalAttachment ? 'View Proposal' : 'View Contract'}
                                    </button>
                                    <button
                                        onClick={() => setContractData(null)}
                                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                                    >
                                        <X size={16} className="text-red-500" />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-1">
                                    Recipients will be able to view and sign this {isProposalAttachment ? 'proposal' : 'contract'}
                                </p>
                            </div>
                        )
                    }

                    {/* Link Input */}
                    {
                        mode === 'email' && showLinkInput && (
                            <div className="px-6 py-3 border-t border-gray-200/50 dark:border-zinc-800/50 flex gap-2">
                                <input
                                    type="url"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    placeholder="https://example.com"
                                    className="flex-1 px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]/30"
                                />
                                <button
                                    onClick={handleAddLink}
                                    className="px-4 py-2 bg-[#008080] text-white rounded-xl text-sm font-medium hover:bg-teal-600 transition-colors"
                                >
                                    Add
                                </button>
                                <button
                                    onClick={() => { setShowLinkInput(false); setLinkUrl(''); }}
                                    className="px-4 py-2 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        )
                    }

                    {/* Footer */}
                    {
                        mode === 'email' && (
                            <div className="px-6 py-4 border-t border-gray-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        id="file-upload"
                                        multiple
                                        onChange={(e) => handleFileUpload(e.target.files)}
                                        className="hidden"
                                        accept="image/*,video/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
                                        title="Attach file"
                                    >
                                        <Paperclip size={18} className="text-gray-600 dark:text-gray-400" />
                                    </label>
                                    <button
                                        onClick={() => setShowLinkInput(!showLinkInput)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                        title="Add link"
                                    >
                                        <LinkIcon size={18} className="text-gray-600 dark:text-gray-400" />
                                    </button>
                                    <button
                                        onClick={() => setShowAIComposer(true)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                        title="AI Email Composer"
                                    >
                                        <ConnektAIIcon className="w-[18px] h-[18px]" />
                                    </button>

                                    {signatures.length > 0 && (
                                        <select
                                            value={selectedSignature}
                                            onChange={(e) => setSelectedSignature(e.target.value)}
                                            className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]/30"
                                        >
                                            <option value="">No signature</option>
                                            {signatures.map(sig => (
                                                <option key={sig.id} value={sig.id}>{sig.name}</option>
                                            ))}
                                        </select>
                                    )}

                                    {uploading && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <Loader2 className="animate-spin" size={16} />
                                            <span>{Math.round(uploadProgress)}%</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleSaveDraft}
                                        disabled={sending}
                                        className="px-6 py-2.5 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-zinc-600 transition-all disabled:opacity-50"
                                    >
                                        Save Draft
                                    </button>
                                    <button
                                        onClick={handleSend}
                                        disabled={sending || !recipient || !subject}
                                        className="px-8 py-2.5 bg-gradient-to-r from-[#008080] to-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {sending ? (
                                            <>
                                                <Loader2 className="animate-spin" size={18} />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={18} />
                                                Send
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )
                    }
                </motion.div >

                {/* AI Email Composer Modal */}
                {
                    showAIComposer && user && (
                        <AIEmailComposerModal
                            userId={user.uid}
                            onClose={() => setShowAIComposer(false)}
                            onGenerated={(email) => {
                                setSubject(email.subject);
                                setBody(email.body);
                                setShowAIComposer(false);
                            }}
                        />
                    )
                }

                {
                    showContractPreview && contractData && (
                        isProposalAttachment ? (
                            <ProposalViewer
                                proposal={{
                                    title: contractData.title || subject || contractData.terms?.jobTitle || 'Proposal',
                                    description: contractData.description || '',
                                    terms: contractData.terms || {},
                                    status: 'draft',
                                    fromUserId: user?.uid || '',
                                    fromUsername: 'You',
                                    toUserId: recipient || 'recipient',
                                    toUsername: recipient || 'Recipient',
                                }}
                                isOpen={showContractPreview}
                                onClose={() => setShowContractPreview(false)}
                            />
                        ) : (
                            <UnifiedContractViewer
                                contractId={contractData.contractId || 'draft-contract'}
                                contract={{
                                    type: (contractData.terms?.contractType as string) || 'draft',
                                    title: contractData.title || subject || contractData.terms?.jobTitle || contractData.terms?.projectTitle || 'Draft Contract',
                                    description: contractData.description || '',
                                    terms: contractData.terms || {},
                                    defaultTerms: contractData.defaultTerms,
                                    status: 'pending',
                                    fromUserId: user?.uid || '',
                                    fromUsername: 'You',
                                    toUserId: recipient || 'recipient',
                                    toUsername: recipient || 'Recipient',
                                }}
                                isOpen={showContractPreview}
                                onClose={() => setShowContractPreview(false)}
                                canSign={false}
                            />
                        )
                    )
                }
            </div >
        </AnimatePresence >
    );
}
