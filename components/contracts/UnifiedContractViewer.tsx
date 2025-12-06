'use client';

import { useState } from 'react';
import { X, FileText, Download, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { ContractSigningService } from '@/lib/services/contract-signing-service';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { WorkspaceService } from '@/lib/services/workspace-service';
import { TaskService } from '@/lib/services/task-service';
import GambianLegalHeader from '@/components/mail/GambianLegalHeader';
import { StorageService } from '@/lib/services/storage-service';

interface UnifiedContractViewerProps {
    contractId: string;
    contract: {
        type: string;
        title: string;
        description: string;
        terms: any;
        defaultTerms?: string;
        status: 'pending' | 'signed' | 'rejected';
        fromUserId: string;
        fromUsername: string;
        toUserId: string;
        toUsername: string;
        signedAt?: any;
        signedBy?: string;
        signatureFullName?: string;
        escrowId?: string;
    };
    isOpen: boolean;
    onClose: () => void;
    onSign?: (contractId: string, fullName: string) => Promise<void>;
    canSign?: boolean; // Whether current user can sign
    onApproveMilestone?: (milestoneId: string) => Promise<void>;
    canApproveMilestones?: boolean;
    onSubmitMilestoneEvidence?: (milestoneId: string, payload: { url: string; note?: string }) => Promise<void>;
    canSubmitEvidence?: boolean;
}

export function UnifiedContractViewer({
    contractId,
    contract,
    isOpen,
    onClose,
    onSign,
    canSign = false,
    onApproveMilestone,
    canApproveMilestones = false,
    onSubmitMilestoneEvidence,
    canSubmitEvidence = false
}: UnifiedContractViewerProps) {
    const { user } = useAuth();
    const [fullName, setFullName] = useState('');
    const [signing, setSigning] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [submittingId, setSubmittingId] = useState<string | null>(null);
    const [evidenceInputs, setEvidenceInputs] = useState<Record<string, { url: string; note?: string }>>({});
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

    const handleSign = async () => {
        console.log('[UnifiedContractViewer] Sign clicked', { contractId, fullName, userId: user?.uid, toUserId: contract?.toUserId, hasOnSign: !!onSign });
        if (!fullName.trim()) {
            alert('Please enter your full legal name');
            return;
        }

        // If no handler is provided, fall back to signing directly
        const canFallbackSign = user?.uid && contract?.toUserId === user.uid;
        if (!onSign && !canFallbackSign) {
            alert('Signing is currently unavailable. Please try again or contact support.');
            return;
        }

        setSigning(true);
        try {
            if (onSign) {
                await onSign(contractId, fullName.trim());
            } else if (canFallbackSign) {
                const username = contract.toUsername || user?.displayName || 'recipient';
                await ContractSigningService.signContract(contractId, user.uid, username, fullName.trim());
            }
            console.log('[UnifiedContractViewer] Sign success');
            const t = contract?.terms || {};
            const projectId = t.projectId || t.linkedProjectId;
            const workspaceId = t.workspaceId || t.linkedWorkspaceId;
            const taskId = t.taskId || t.linkedTaskId;

            const names: string[] = [];
            try {
                if (projectId) {
                    const p = await EnhancedProjectService.getProject(projectId);
                    if (p?.title) names.push(`project: ${p.title}`);
                }
                if (workspaceId) {
                    const w = await WorkspaceService.getWorkspace(workspaceId);
                    if (w?.name) names.push(`workspace: ${w.name}`);
                }
                if (taskId) {
                    const tk = await TaskService.getTask(taskId);
                    if (tk?.title) names.push(`task: ${tk.title}`);
                }
            } catch (e) {
                console.warn('Lookup for entity names failed', e);
            }

            const parts: string[] = [];
            if (projectId) parts.push('added to project');
            if (workspaceId) parts.push('added to workspace');
            if (taskId) parts.push('task assigned');
            if (t.startDate || t.endDate) parts.push('calendar events created');
            const summary = parts.length ? `Sync: ${parts.join(', ')}` : 'Access and sync granted';
            const namesSummary = names.length ? ` (${names.join('; ')})` : '';
            toast.success(`Contract signed successfully. ${summary}.${namesSummary}`);
        } catch (error: any) {
            console.error('[UnifiedContractViewer] Sign error', error);
            toast.error(error?.message || 'Failed to sign contract');
            return;
        } finally {
            setSigning(false);
        }

        onClose();
    };

    const handlePrintToPDF = async () => {
        setExporting(true);
        try {
            // Use browser's print dialog which can save as PDF
            window.print();
        } catch (error) {
            console.error('Failed to export PDF:', error);
            alert('Failed to export PDF');
        } finally {
            setExporting(false);
        }
    };

    const setEvidenceField = (id: string, field: 'url' | 'note', value: string) => {
        setEvidenceInputs(prev => ({
            ...prev,
            [id]: {
                ...(prev[id] || { url: '', note: '' }),
                [field]: value
            }
        }));
    };

    const handleFileUpload = async (milestoneId: string, fileList: FileList | null) => {
        if (!fileList || !fileList[0]) return;
        const file = fileList[0];

        const type = StorageService.validateFileType(file);
        if (!type) {
            alert('Unsupported file type');
            return;
        }
        if (!StorageService.validateFileSize(file, 25)) {
            alert('File too large (max 25MB)');
            return;
        }

        if (!user?.uid) {
            alert('You must be signed in to upload evidence');
            return;
        }

        try {
            setUploadProgress(prev => ({ ...prev, [milestoneId]: 0 }));
            const url = await StorageService.uploadFile(file, user.uid, contractId, (p) => {
                setUploadProgress(prev => ({ ...prev, [milestoneId]: p }));
            });
            setEvidenceField(milestoneId, 'url', url);
            setEvidenceField(milestoneId, 'note', file.name);
        } catch (err: any) {
            alert(err?.message || 'Failed to upload evidence');
        } finally {
            setUploadProgress(prev => ({ ...prev, [milestoneId]: 0 }));
        }
    };

    if (!isOpen) return null;

    const isSigned = contract.status === 'signed';
    const isRecipient = user?.uid === contract.toUserId;
    const isProposal = !!contract?.terms?.proposal;
    const milestones = contract?.terms?.milestones || [];
    const escrowId = contract.escrowId;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-4xl h-[90vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
                        <div className="flex items-center gap-3">
                            <FileText className="text-[#008080]" size={24} />
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{isProposal ? 'Proposal Viewer' : 'Contract Viewer'}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {(isProposal ? 'PROPOSAL' : contract.type.replace(/_/g, ' ').toUpperCase())}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isSigned && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
                                    <CheckCircle size={16} />
                                    <span className="text-sm font-medium">Signed</span>
                                </div>
                            )}
                            <button
                                onClick={handlePrintToPDF}
                                disabled={exporting}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                                title="Print to PDF"
                            >
                                <Download size={20} className="text-gray-600 dark:text-gray-400" />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Contract Content */}
                    <div className="flex-1 overflow-y-auto p-8" id="contract-content">
                        {/* Gambian Legal Header */}
                        <div className="mb-8 pb-6 border-b-2 border-gray-300 dark:border-zinc-700">
                            <GambianLegalHeader size="medium" showConnektLogo showCoatOfArms showGambianFlag />
                            <div className="mt-6 text-center space-y-1">
                                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{isProposal ? 'Proposal' : 'Contract'} Document</p>
                                <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
                                    {contract.title}
                                </h1>
                                {escrowId && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Escrow: {escrowId}</p>
                                )}
                            </div>
                        </div>

                        {/* Contract Body */}
                        <div className="prose dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300">
                            <ReactMarkdown>{contract.description}</ReactMarkdown>
                        </div>

                        {/* Standard Terms */}
                        {contract.defaultTerms && (
                            <div className="mt-8 pt-6 border-t border-gray-300 dark:border-zinc-700">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Standard Terms</h2>
                                <div className="prose dark:prose-invert max-w-none text-sm prose-p:text-gray-600 dark:prose-p:text-gray-400">
                                    <ReactMarkdown>{contract.defaultTerms}</ReactMarkdown>
                                </div>
                            </div>
                        )}

                        {/* Milestones */}
                        {milestones.length > 0 && (
                            <div className="mt-8 pt-6 border-t border-gray-300 dark:border-zinc-700">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Milestones</h2>
                                <div className="space-y-3">
                                    {milestones.map((m: any) => (
                                        <div key={m.id} className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60 space-y-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{m.title}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{m.amount ? `Amount: ${m.currency || contract?.terms?.totalCurrency || 'GMD'} ${m.amount}` : 'No amount set'}</p>
                                                    {m.dueAt && <p className="text-xs text-gray-500 dark:text-gray-400">Due: {m.dueAt}</p>}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${m.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : m.status === 'submitted' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                                                        {m.status || 'pending'}
                                                    </span>
                                                    {onApproveMilestone && canApproveMilestones && m.status !== 'paid' && (
                                                        <button
                                                            onClick={async () => {
                                                                setApprovingId(m.id);
                                                                try {
                                                                    await onApproveMilestone(m.id);
                                                                } finally {
                                                                    setApprovingId(null);
                                                                }
                                                            }}
                                                            disabled={approvingId === m.id}
                                                            className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
                                                        >
                                                            {approvingId === m.id ? 'Releasing...' : 'Approve & Release'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {m.evidence?.length > 0 && (
                                                <div className="space-y-1">
                                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Evidence</p>
                                                    <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                                        {m.evidence.map((e: any, idx: number) => (
                                                            <li key={idx} className="flex items-center gap-2">
                                                                <a href={e.url} target="_blank" rel="noreferrer" className="text-[#008080] hover:underline break-all">{e.url}</a>
                                                                {e.note && <span className="text-gray-500">– {e.note}</span>}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {onSubmitMilestoneEvidence && canSubmitEvidence && m.status !== 'submitted' && m.status !== 'paid' && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <label
                                                            htmlFor={`evidence-upload-${m.id}`}
                                                            className="px-3 py-1.5 bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm cursor-pointer hover:bg-gray-200 dark:hover:bg-zinc-800"
                                                        >
                                                            Upload file
                                                        </label>
                                                        <input
                                                            id={`evidence-upload-${m.id}`}
                                                            type="file"
                                                            className="hidden"
                                                            onChange={(e) => handleFileUpload(m.id, e.target.files)}
                                                        />
                                                        {uploadProgress[m.id] ? (
                                                            <span className="text-xs text-gray-500">{Math.round(uploadProgress[m.id])}%</span>
                                                        ) : null}
                                                    </div>
                                                    <input
                                                        type="url"
                                                        value={(evidenceInputs[m.id]?.url) || ''}
                                                        onChange={(e) => setEvidenceField(m.id, 'url', e.target.value)}
                                                        placeholder="Evidence link (file/url)"
                                                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={(evidenceInputs[m.id]?.note) || ''}
                                                        onChange={(e) => setEvidenceField(m.id, 'note', e.target.value)}
                                                        placeholder="Note (optional)"
                                                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm"
                                                    />
                                                    <button
                                                        onClick={async () => {
                                                            const url = evidenceInputs[m.id]?.url;
                                                            const note = evidenceInputs[m.id]?.note;
                                                            if (!url) {
                                                                alert('Please provide an evidence link');
                                                                return;
                                                            }
                                                            setSubmittingId(m.id);
                                                            try {
                                                                await onSubmitMilestoneEvidence(m.id, { url, note });
                                                                setEvidenceInputs(prev => ({ ...prev, [m.id]: { url: '', note: '' } }));
                                                            } finally {
                                                                setSubmittingId(null);
                                                            }
                                                        }}
                                                        disabled={submittingId === m.id}
                                                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                                                    >
                                                        {submittingId === m.id ? 'Submitting...' : 'Submit Evidence'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Signature Section */}
                        <div className="mt-12 pt-8 border-t-2 border-gray-900 dark:border-white">
                            {isSigned ? (
                                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="text-green-600 dark:text-green-400 mt-1" size={24} />
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-2">
                                                Contract Signed
                                            </h3>
                                            <p className="text-sm text-green-800 dark:text-green-300 mb-2">
                                                This contract has been electronically signed and is legally binding.
                                            </p>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-green-700 dark:text-green-400 font-medium">Signed by:</span>
                                                    <p className="text-green-900 dark:text-green-100 font-semibold">
                                                        {contract.signatureFullName || contract.toUsername}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-green-700 dark:text-green-400 font-medium">Date:</span>
                                                    <p className="text-green-900 dark:text-green-100 font-semibold">
                                                        {contract.signedAt?.toDate?.().toLocaleDateString() || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Signature</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                        By signing electronically, both parties acknowledge they have read, understood, and agree to all terms stated in this contract.
                                    </p>

                                    {canSign && isRecipient ? (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Enter your full legal name to sign:
                                                </label>
                                                <input
                                                    type="text"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    placeholder="John Doe"
                                                    className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-2 border-gray-300 dark:border-zinc-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080] focus:border-transparent"
                                                />
                                            </div>
                                            <button
                                                onClick={handleSign}
                                                disabled={signing || !fullName.trim()}
                                                className="w-full py-3 bg-gradient-to-r from-[#008080] to-teal-600 text-white font-bold rounded-xl hover:from-teal-600 hover:to-[#008080] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-500/30"
                                            >
                                                {signing ? 'Signing...' : 'Sign Contract'}
                                            </button>
                                            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                                                This action is legally binding and cannot be undone
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-gray-100 dark:bg-zinc-800 rounded-xl text-center">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {isRecipient ? 'Waiting for your signature' : 'Waiting for recipient signature'}
                                            </p>
                                            {!canSign && isRecipient && (
                                                <p className="text-xs text-amber-600 mt-1">You currently cannot sign (status must be pending).</p>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer Note */}
                        <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
                            <p>This contract is governed by the laws of the Republic of The Gambia</p>
                            <p className="mt-1">Enforced by the Connekt Platform</p>
                        </div>
                    </div>
                </motion.div>

                {/* Print Styles */}
                <style jsx global>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #contract-content,
                        #contract-content * {
                            visibility: visible;
                        }
                        #contract-content {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                        }
                    }
                `}</style>
            </div>
        </AnimatePresence>
    );
}
