'use client';

import { useState } from 'react';
import { Contract, ContractSignature } from '@/lib/types/mail.types';
import GambianLegalHeader from './GambianLegalHeader';
import { signContract, LegalLifecycle } from '@/lib/services/legal';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { WorkspaceService } from '@/lib/services/workspace-service';
import { TaskService } from '@/lib/services/task-service';
import { useAuth } from '@/context/AuthContext';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

interface ContractViewerProps {
    contract: Contract;
    onSign?: () => void;
    onReject?: () => void;
}

/**
 * Contract Viewer Component
 * 
 * Displays contract details with Gambian legal header and signing functionality.
 * Shows all terms, signatures, and allows recipient to sign or reject.
 */
export default function ContractViewer({ contract, onSign, onReject }: ContractViewerProps) {
    const { user } = useAuth();
    const [signing, setSigning] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [signatureName, setSignatureName] = useState('');

    const isRecipient = user?.uid === contract.toUserId;
    const isSender = user?.uid === contract.fromUserId;
    const userHasSigned = contract.signatures?.some(sig => sig.userId === user?.uid);
    const canSign = isRecipient && contract.status === 'pending' && !userHasSigned;
    const canReject = isRecipient && contract.status === 'pending';

    const handleSign = async () => {
        if (!user || !canSign) return;

        // Validate signature
        if (!signatureName.trim()) {
            toast.error('Please type your full legal name to sign the contract');
            return;
        }

        setSigning(true);
        try {
            await signContract(
                contract.id!,
                user.uid,
                user.displayName || 'User',
                signatureName.trim()
            );

            // Redirect to project if applicable
            if (contract.relatedEntityId && contract.type.includes('project')) {
                window.location.href = `/projects/${contract.relatedEntityId}`;
            }

            // Success toast with summary based on terms
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

            onSign?.();
        } catch (error: any) {
            toast.error(error?.message || 'Failed to sign contract');
        } finally {
            setSigning(false);
        }
    };

    const handleReject = async () => {
        if (!user || !canReject) return;

        setRejecting(true);
        try {
            await LegalLifecycle.reject(
                contract.id!,
                user.uid,
                user.displayName || 'User',
                rejectReason || 'No reason provided'
            );
            setShowRejectModal(false);
            toast.success('Contract rejected.');
            onReject?.();
        } catch (error: any) {
            toast.error(error?.message || 'Failed to reject contract');
        } finally {
            setRejecting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'accepted': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'expired': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-900 shadow-lg rounded-lg overflow-hidden">
            {/* Gambian Legal Header */}
            <GambianLegalHeader size="medium" />

            {/* Contract Content */}
            <div className="p-8">
                {/* Status Badge */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contract.status)}`}>
                            {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                        </span>
                    </div>
                    <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                        <p>Contract ID: {contract.id}</p>
                        <p>Created: {new Date(contract.createdAt?.toDate?.() || contract.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Contract Title */}
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                    {contract.title}
                </h1>

                {/* Parties */}
                <div className="grid grid-cols-2 gap-6 mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">From</h3>
                        <p className="font-medium text-gray-900 dark:text-white">{contract.fromUsername}</p>
                        <p className="text-sm text-teal-600 dark:text-teal-400 font-mono">{contract.fromMailAddress}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">To</h3>
                        <p className="font-medium text-gray-900 dark:text-white">{contract.toUsername}</p>
                        <p className="text-sm text-teal-600 dark:text-teal-400 font-mono">{contract.toMailAddress}</p>
                    </div>
                </div>

                {/* Contract Description (Markdown) */}
                <div className="prose dark:prose-invert max-w-none prose-p:my-4 prose-p:leading-relaxed prose-headings:mt-8 prose-headings:mb-4 prose-li:my-2 mb-8">
                    <div className="space-y-4">
                        <ReactMarkdown>{contract.description}</ReactMarkdown>
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
                </div>

                {/* Contract Terms Summary */}
                {contract.terms && (
                    <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Contract Terms</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            {contract.terms.paymentAmount && (
                                <div>
                                    <span className="font-semibold">Payment:</span> {contract.terms.paymentAmount} {contract.terms.paymentCurrency || 'GMD'}
                                </div>
                            )}
                            {contract.terms.paymentType && (
                                <div>
                                    <span className="font-semibold">Payment Type:</span> {contract.terms.paymentType}
                                </div>
                            )}
                            {contract.terms.startDate && (
                                <div>
                                    <span className="font-semibold">Start Date:</span> {contract.terms.startDate}
                                </div>
                            )}
                            {contract.terms.endDate && (
                                <div>
                                    <span className="font-semibold">End Date:</span> {contract.terms.endDate}
                                </div>
                            )}
                            {contract.terms.workLocation && (
                                <div>
                                    <span className="font-semibold">Location:</span> {contract.terms.workLocation}
                                </div>
                            )}
                            {contract.terms.hoursPerWeek && (
                                <div>
                                    <span className="font-semibold">Hours/Week:</span> {contract.terms.hoursPerWeek}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Signatures */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Signatures</h2>
                    {contract.signatures && contract.signatures.length > 0 ? (
                        <div className="space-y-3">
                            {contract.signatures.map((sig, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{sig.username}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Signed on {new Date(sig.signedAt?.toDate?.() || sig.signedAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-600 dark:text-gray-400 italic">No signatures yet</p>
                    )}
                </div>

                {/* Digital Signature Input */}
                {canSign && (
                    <div className="mb-8 p-6 bg-amber-50 dark:bg-amber-900/20 rounded-lg border-2 border-amber-300 dark:border-amber-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Digital Signature
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            By typing your full legal name below, you electronically sign this contract and agree to all terms and conditions stated herein. This signature is legally binding.
                        </p>
                        <input
                            type="text"
                            value={signatureName}
                            onChange={(e) => setSignatureName(e.target.value)}
                            placeholder="Type your full legal name here"
                            className="w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium text-lg focus:outline-none focus:ring-2 focus:ring-[#008080] focus:border-[#008080]"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            ⚠️ This serves as your legal signature and cannot be undone.
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                {(canSign || canReject) && (
                    <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                        {canSign && (
                            <button
                                onClick={handleSign}
                                disabled={signing}
                                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {signing ? 'Signing...' : 'Sign Contract'}
                            </button>
                        )}
                        {canReject && (
                            <button
                                onClick={() => setShowRejectModal(true)}
                                disabled={rejecting}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Reject
                            </button>
                        )}
                    </div>
                )}

                {/* Enforcement Notice */}
                {contract.enforcement?.paymentLocked && (
                    <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <p className="text-sm text-amber-900 dark:text-amber-200">
                            <strong>Payment Enforcement:</strong> This contract locks payment to{' '}
                            {contract.enforcement.paymentAmount
                                ? `${contract.enforcement.paymentAmount} ${contract.terms.paymentCurrency || 'GMD'}`
                                : `${contract.enforcement.paymentRangeMin}-${contract.enforcement.paymentRangeMax} ${contract.terms.paymentCurrency || 'GMD'}`
                            }
                        </p>
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Reject Contract
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Please provide a reason for rejecting this contract (optional):
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
                            rows={4}
                            placeholder="Reason for rejection..."
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={rejecting}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg disabled:opacity-50"
                            >
                                {rejecting ? 'Rejecting...' : 'Confirm Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
