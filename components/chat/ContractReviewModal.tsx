'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { ContractMailService } from '@/lib/services/contract-mail-service';
import { TaskService } from '@/lib/services/task-service';
import { ChatService } from '@/lib/services/chat-service';
import { Message } from '@/lib/types/chat.types';
import { Loader2, CheckCircle2, FileText } from 'lucide-react';

interface ContractReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    message: Message;
    conversationId: string;
}

export function ContractReviewModal({ isOpen, onClose, message, conversationId }: ContractReviewModalProps) {
    const { user, userProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [accepted, setAccepted] = useState(false);

    if (!message.helpRequest) return null;

    const handleAccept = async () => {
        if (!user || !userProfile) return;
        setLoading(true);
        try {
            // 1. If paid, update contract status (mocked here as we don't have full contract signing flow in this modal)
            // In a real app, this would open the full contract view.
            // For now, we assume "Accepting" here signs it.

            if (message.helpRequest.contractId) {
                await ContractMailService.updateContractStatus(message.helpRequest.contractId, 'active');
            }

            // 2. Assign task to current user (helper)
            await TaskService.assignTask(message.helpRequest.taskId, user.uid, userProfile.username);

            // 3. Update Help Request status in Chat
            // We need a way to update the specific message or help request status
            // For now, we'll send a system message confirming acceptance
            await ChatService.sendMessage({
                conversationId,
                senderId: 'system',
                senderUsername: 'System',
                content: `${userProfile.username} accepted the help request for "${message.helpRequest.taskTitle}"`,
                type: 'text'
            });

            // Ideally we should update the original message status too, but Firestore structure might need a specific update method
            // Let's assume we have one or we just rely on the system message for now.

            setAccepted(true);
            setTimeout(() => {
                onClose();
                setAccepted(false);
            }, 2000);

        } catch (error) {
            console.error('Error accepting help request:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
                <DialogHeader>
                    <DialogTitle>Review Help Request</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {accepted ? (
                        <div className="flex flex-col items-center justify-center py-8 text-green-600">
                            <CheckCircle2 size={48} className="mb-4" />
                            <h3 className="text-xl font-bold">Accepted!</h3>
                            <p className="text-sm text-gray-500">You have been assigned to this task.</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">{message.helpRequest.taskTitle}</h4>
                                        <p className="text-xs text-gray-500">Requested by {message.senderUsername}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${message.helpRequest.budget ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'
                                        }`}>
                                        {message.helpRequest.budget ? `$${message.helpRequest.budget}` : 'Free Help'}
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-zinc-700 pt-3">
                                    {message.content}
                                </p>

                                {message.helpRequest.budget && (
                                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/10 p-2 rounded-lg">
                                        <FileText size={14} />
                                        <span>Contract #{message.helpRequest.contractId?.substring(0, 8)}... included</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    Decline
                                </button>
                                <button
                                    onClick={handleAccept}
                                    disabled={loading}
                                    className="flex-1 py-3 bg-[#008080] text-white rounded-xl font-bold hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Accept & Start'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
