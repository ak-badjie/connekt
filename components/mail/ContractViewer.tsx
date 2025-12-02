'use client';

import { useState } from 'react';
import { Contract, ContractSignature } from '@/lib/types/mail.types';
import GambianLegalHeader from './GambianLegalHeader';
import { ContractMailService } from '@/lib/services/contract-mail-service';
import { useAuth } from '@/hooks/useAuth';

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

    const isRecipient = user?.uid === contract.toUserId;
    const isSender = user?.uid === contract.fromUserId;
    const userHasSigned = contract.signatures?.some(sig => sig.userId === user?.uid);
    const canSign = isRecipient && contract.status === 'pending' && !userHasSigned;
    const canReject = isRecipient && contract.status === 'pending';

    const handleSign = async () => {
        if (!user || !canSign) return;

        setSigning(true);
        try {
            await ContractMailService.signContract(
                contract.id!,
                user.uid,
                user.displayName || user.email || 'Unknown',
                undefined, // IP address - would need server-side
                navigator.userAgent
            );
            onSign?.();
        } catch (error: any) {
            alert(error.message || 'Failed to sign contract');
        } finally {
            setSigning(false);
        }
    };

    const handleReject = async () => {
        if (!user || !canReject) return;

        setRejecting(true);
        try {
            await ContractMailService.rejectContract(
                contract.id!,
                user.uid,
                rejectReason || undefined
            );
            setShowRejectModal(false);
            onReject?.();
        } catch (error: any) {
            alert(error.message || 'Failed to reject contract');
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
                        <p className="text-sm text-gray-600 dark:text-gray-400">{contract.fromMailAddress}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">To</h3>
                        <p className="font-medium text-gray-900 dark:text-white">{contract.toUsername}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{contract.toMailAddress}</p>
                    </div>
                </div>

                {/* Contract Description (Markdown) */}
                <div className="prose dark:prose-invert max-w-none mb-8">
                    <div dangerouslySetInnerHTML={{ __html: contract.description.replace(/\n/g, '<br/>') }} />
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
