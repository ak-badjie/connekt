import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, ExternalLink, Video, Loader2 } from 'lucide-react';
import { ContractEnforcementService } from '@/lib/services/contract-enforcement-service';
import { TaskService } from '@/lib/services/task-service';
import { ProofOfTask } from '@/lib/types/workspace.types';

interface ReviewWorkModalProps {
    isOpen: boolean;
    onClose: () => void;
    pot: ProofOfTask;
    contractId: string; // Required to release escrow
    taskId: string;
    clientId: string;
    clientUsername: string;
    onReviewComplete: () => void;
}

export default function ReviewWorkModal({
    isOpen,
    onClose,
    pot,
    contractId,
    taskId,
    clientId,
    clientUsername,
    onReviewComplete
}: ReviewWorkModalProps) {
    const [notes, setNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [action, setAction] = useState<'approve' | 'reject' | 'revise' | null>(null);

    if (!isOpen) return null;

    const handleConfirmAction = async () => {
        if (!action) return;

        setIsProcessing(true);
        try {
            if (action === 'approve') {
                // 1. Process Payment & Access Revocation via Enforcement Service
                await ContractEnforcementService.processAPP_POT(taskId, contractId, clientId);

                // 2. Mark POT as approved in Task Service (Double check state)
                await TaskService.validateProofOfTask(taskId, clientId, clientUsername, 'approved', notes);
            } else {
                // Reject or Revise
                const decision = action === 'reject' ? 'rejected' : 'revision-requested';
                await TaskService.validateProofOfTask(taskId, clientId, clientUsername, decision, notes);
            }

            onReviewComplete();
            onClose();
        } catch (error) {
            console.error('Failed to process review:', error);
            alert('Failed to process review. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-[#1A1A1A] p-6 text-left shadow-xl transition-all border border-white/10 animate-in fade-in zoom-in-95 duration-200 block overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium leading-6 text-white">
                        Review Proof of Task
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="bg-white/5 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Submission Notes</h4>
                    <p className="text-sm text-gray-400 italic">
                        "{pot.notes || 'No notes provided.'}"
                    </p>
                    <div className="mt-2 text-xs text-gray-500">
                        Submitted by <span className="text-white">{pot.submittedByUsername}</span>
                    </div>
                </div>

                <div className="space-y-6 mb-8">
                    {/* Media Gallery */}
                    {(pot.screenshots.length > 0 || pot.videos.length > 0) && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-3">Evidence</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {pot.screenshots.map((url, idx) => (
                                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block relative aspect-square bg-gray-800 rounded-lg overflow-hidden border border-white/5 hover:border-blue-500/50 transition-colors group">
                                        <img src={url} alt={`Evidence ${idx}`} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <ExternalLink size={20} className="text-white" />
                                        </div>
                                    </a>
                                ))}
                                {pot.videos.map((url, idx) => (
                                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block relative aspect-square bg-gray-800 rounded-lg overflow-hidden border border-white/5 hover:border-blue-500/50 transition-colors group flex flex-col items-center justify-center">
                                        <Video size={32} className="text-blue-400 mb-2" />
                                        <span className="text-xs text-gray-400">View Video</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Links */}
                    {pot.links && pot.links.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-3">External Links</h4>
                            <div className="flex flex-col gap-2">
                                {pot.links.map((link, idx) => (
                                    <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-400 hover:text-blue-300 hover:underline">
                                        <ExternalLink size={14} className="mr-2" />
                                        {link}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Review Actions */}
                <div className="border-t border-white/10 pt-6">
                    {!action ? (
                        <div className="flex gap-4 justify-end">
                            <button
                                onClick={() => setAction('revise')}
                                className="px-4 py-2 rounded-lg text-sm bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 font-medium transition-colors border border-yellow-500/20 flex items-center"
                            >
                                <AlertCircle size={16} className="mr-2" />
                                Request Changes
                            </button>
                            <button
                                onClick={() => setAction('reject')}
                                className="px-4 py-2 rounded-lg text-sm bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium transition-colors border border-red-500/20 flex items-center"
                            >
                                <XCircle size={16} className="mr-2" />
                                Reject Spec
                            </button>
                            <button
                                onClick={() => setAction('approve')}
                                className="px-6 py-2 rounded-lg text-sm bg-green-600 hover:bg-green-500 text-white font-medium transition-all shadow-lg shadow-green-500/20 flex items-center"
                            >
                                <CheckCircle size={16} className="mr-2" />
                                Approve & Pay
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    {action === 'approve' ? 'Approval Notes (Optional)' : 'Reason for ' + (action === 'reject' ? 'Rejection' : 'Revision')}
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
                                    placeholder={action === 'approve' ? "Great work!" : "Please address the following items..."}
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setAction(null)}
                                    className="px-4 py-2 rounded-lg text-sm bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleConfirmAction}
                                    disabled={isProcessing}
                                    className={`px-6 py-2 rounded-lg text-sm text-white font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${action === 'approve' ? 'bg-green-600 hover:bg-green-500 shadow-green-500/20' :
                                            action === 'revise' ? 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-500/20' :
                                                'bg-red-600 hover:bg-red-500 shadow-red-500/20'
                                        }`}
                                >
                                    {isProcessing ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                                    {isProcessing ? 'Processing...' : `Confirm ${action.charAt(0).toUpperCase() + action.slice(1)}`}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
