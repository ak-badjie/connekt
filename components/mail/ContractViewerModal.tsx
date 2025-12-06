'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { X, FileText, CheckCircle, XCircle, Printer } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import GambianLegalHeader from './GambianLegalHeader';
import { ContractMailService } from '@/lib/services/contract-mail-service';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { WorkspaceService } from '@/lib/services/workspace-service';
import { TaskService } from '@/lib/services/task-service';

interface ContractViewerModalProps {
    contractId: string;
    userId: string;
    isOpen: boolean;
    onClose: () => void;
    onSigned?: (contract: ContractData) => void;
}

interface ContractData {
    id: string;
    type: string;
    title: string;
    description: string;
    defaultTerms?: string;
    terms: any;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
    createdBy: string;
    createdFor: string;
    createdAt: any;
    acceptedAt?: any;
    rejectedAt?: any;
    expiresAt: any;
    relatedEntityId?: string;
    signatures?: any[];
    signatureFullName?: string;
    signedAt?: any;
    signedBy?: string;
    fromUserId?: string;
    fromUsername?: string;
    toUserId?: string;
    toUsername?: string;
}
export function ContractViewerModal({ contractId, userId, isOpen, onClose, onSigned }: ContractViewerModalProps) {
    const [contract, setContract] = useState<ContractData | null>(null);
    const [loading, setLoading] = useState(true);
    const [signing, setSigning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fullName, setFullName] = useState('');

    useEffect(() => {
        if (isOpen && contractId) {
            loadContract();
        }
    }, [isOpen, contractId]);

    const loadContract = async () => {
        setLoading(true);
        setError(null);
        try {
            const contractRef = doc(db, 'contracts', contractId);
            const contractSnap = await getDoc(contractRef);

            if (contractSnap.exists()) {
                setContract({ id: contractSnap.id, ...contractSnap.data() } as ContractData);
            } else {
                setError('Contract not found');
                toast.error('Contract not found');
            }
        } catch (err: any) {
            console.error('Error loading contract:', err);
            setError(err.message || 'Failed to load contract');
            toast.error(err?.message || 'Failed to load contract');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!contract) return;
        if (!fullName.trim()) {
            setError('Please enter your full legal name to sign.');
            toast.error('Please enter your full legal name to sign.');
            return;
        }
        setSigning(true);
        setError(null);

        try {
            await ContractMailService.signContract(contract.id, userId, fullName.trim());
            await loadContract(); // Reload to show updated status
            if (onSigned) onSigned(contract);
            // Success toast with simple summary
            const t = contract.terms || {};
            const parts: string[] = [];
            if (t.projectId || t.linkedProjectId) parts.push('added to project');
            if (t.workspaceId || t.linkedWorkspaceId) parts.push('added to workspace');
            if (t.taskId || t.linkedTaskId) parts.push('task assigned');
            if (t.startDate || t.endDate) parts.push('calendar events created');
            const summary = parts.length ? `Sync: ${parts.join(', ')}` : 'Access and sync granted';
            // Fetch names for richer toast
            try {
                const names: string[] = [];
                const projectId = t.projectId || t.linkedProjectId;
                const workspaceId = t.workspaceId || t.linkedWorkspaceId;
                const taskId = t.taskId || t.linkedTaskId;
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
                const namesSummary = names.length ? ` (${names.join('; ')})` : '';
                toast.success(`Contract signed successfully. ${summary}.${namesSummary}`);
            } catch (e) {
                toast.success(`Contract signed successfully. ${summary}.`);
            }
        } catch (err: any) {
            console.error('Error accepting contract:', err);
            setError(err.message || 'Failed to accept contract');
            toast.error(err?.message || 'Failed to accept contract');
        } finally {
            setSigning(false);
        }
    };

    const handleReject = async () => {
        if (!contract) return;
        const reason = prompt('Reason for rejection (optional):');

        setSigning(true);
        setError(null);

        try {
            await ContractMailService.rejectContract(contract.id, userId, reason || undefined);
            await loadContract(); // Reload to show updated status
            if (onSigned) onSigned();
            toast.success('Contract rejected.');
        } catch (err: any) {
            console.error('Error rejecting contract:', err);
            setError(err.message || 'Failed to reject contract');
            toast.error(err?.message || 'Failed to reject contract');
        } finally {
            setSigning(false);
        }
    };

    const isExpired = contract && contract.expiresAt && contract.expiresAt.toDate() < new Date();
    const contractRecipientId = contract?.createdFor || (contract as any)?.toUserId;
    const canSign = contract && contract.status === 'pending' && !isExpired && contractRecipientId === userId;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[1001] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-teal-600 to-teal-700">
                            <div className="flex items-center gap-3">
                                <FileText className="w-6 h-6 text-white" />
                                <div>
                                    <h2 className="text-xl font-bold text-white">Contract Viewer</h2>
                                    {contract && (
                                        <p className="text-sm text-teal-100">{contract.type.replace(/_/g, ' ')}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => window.print()}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                    title="Print / Save as PDF"
                                >
                                    <Printer className="w-5 h-5 text-white" />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                    title="Close"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {loading && (
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                                        <p className="text-gray-600 dark:text-gray-400">Loading contract...</p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                                    <p className="text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            {contract && !loading && (
                                <div>
                                    {/* Status Badge */}
                                    <div className="mb-6 flex items-center gap-3">
                                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${contract.status === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            contract.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                isExpired ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' :
                                                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}>
                                            {isExpired ? 'Expired' : contract.status.toUpperCase()}
                                        </span>
                                        {isExpired && (
                                            <span className="text-sm text-gray-500">
                                                Expired on {contract.expiresAt.toDate().toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>

                                    {/* Contract Document */}
                                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        <GambianLegalHeader
                                            size="small"
                                            showConnektLogo={true}
                                            showCoatOfArms={true}
                                            showGambianFlag={true}
                                        />

                                        <div className="p-8 prose dark:prose-invert max-w-none prose-p:my-4 prose-p:leading-relaxed prose-headings:mt-8 prose-headings:mb-4">
                                            <h1 className="text-2xl font-bold mb-6">{contract.title}</h1>

                                            <div className="space-y-4 mb-8">
                                                <ReactMarkdown>
                                                    {contract.description}
                                                </ReactMarkdown>
                                            </div>

                                            {/* Standard Terms Section */}
                                            {contract.defaultTerms && (
                                                <div className="mt-12 pt-8 border-t-2 border-gray-200 dark:border-gray-700">
                                                    <h3 className="text-lg font-semibold mb-6">Standard Terms and Conditions</h3>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-3">
                                                        <ReactMarkdown>{contract.defaultTerms}</ReactMarkdown>
                                                    </div>
                                                </div>
                                            )}

                                            {contract.terms && Object.keys(contract.terms).length > 0 && (
                                                <div className="mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
                                                    <h3 className="text-lg font-semibold mb-4">Contract Terms</h3>
                                                    <div className="text-sm space-y-2">
                                                        {Object.entries(contract.terms).map(([key, value]) => (
                                                            <div key={key} className="flex gap-2">
                                                                <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                                                <span className="text-gray-600 dark:text-gray-400">{String(value)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Signatures */}
                                            <div className="mt-10 pt-6 border-t-2 border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="p-4 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800">
                                                    <p className="text-xs uppercase tracking-wide text-teal-700 dark:text-teal-300 font-semibold mb-1">Contractor</p>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{contract.terms?.fromName || contract.fromUsername || 'Contractor'}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Signed by: {contract.signatureFullName || (contract.signatures || []).find(s => s.userId === contract.fromUserId)?.username || '—'}</p>
                                                    {contract.signedAt?.toDate && (
                                                        <p className="text-xs text-gray-500">On: {contract.signedAt.toDate().toLocaleString()}</p>
                                                    )}
                                                </div>
                                                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                                                    <p className="text-xs uppercase tracking-wide text-gray-700 dark:text-gray-300 font-semibold mb-1">Contractee</p>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{contract.terms?.clientName || contract.toUsername || 'Contractee'}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Signed by: {(contract.signatures || []).find(s => s.userId === contract.toUserId)?.username || 'Pending'}</p>
                                                    {contract.signatures && (contract.signatures as any[]).find(s => s.userId === contract.toUserId)?.signedAt?.toDate && (
                                                        <p className="text-xs text-gray-500">On: {(contract.signatures as any[]).find(s => s.userId === contract.toUserId)?.signedAt?.toDate().toLocaleString()}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        {contract && canSign && !loading && (
                            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
                                <div className="flex-1 md:max-w-sm">
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Full legal name (signature)</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Type your full name to sign"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                                <button
                                    onClick={handleReject}
                                    disabled={signing}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all disabled:opacity-50"
                                >
                                    <XCircle size={18} />
                                    Reject
                                </button>
                                <button
                                    onClick={handleAccept}
                                    disabled={signing}
                                    className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                                >
                                    {signing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Signing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={18} />
                                            Accept & Sign
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
