'use client';

import { useState } from 'react';
import { Reply, Forward, Trash2, MoreHorizontal, Paperclip, Download, ExternalLink, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import type { MailMessage } from '@/lib/services/mail-service';
import Image from 'next/image';
import { UnifiedContractViewer } from '@/components/contracts/UnifiedContractViewer';
import { ContractSigningService } from '@/lib/services/contract-signing-service';
import { ContractMailService } from '@/lib/services/contract-mail-service';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface MailViewerColumnProps {
    mail: MailMessage | null;
    onReply?: (prefill: { recipient?: string; subject?: string; body?: string; contractId?: string }) => void;
    onForward?: (prefill: { recipient?: string; subject?: string; body?: string; contractId?: string }) => void;
    onDelete?: () => void;
    onMarkUnread?: () => void;
    onResponse?: (mail: MailMessage) => void;
}

export function MailViewerColumn({
    mail,
    onReply,
    onForward,
    onDelete,
    onMarkUnread,
    onResponse
}: MailViewerColumnProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [showContractViewer, setShowContractViewer] = useState(false);
    const [loadedContract, setLoadedContract] = useState<any | null>(null);
    const [loadingContract, setLoadingContract] = useState(false);
    // Load the full contract by ID when viewer opens
    useEffect(() => {
        const load = async () => {
            if (!showContractViewer || !hasContract) return;
            const contractId = (mail as any).contractId as string;
            setLoadingContract(true);
            try {
                const c = await ContractSigningService.getContract(contractId);
                setLoadedContract(c);
            } catch (err: any) {
                console.error('Failed to load contract', err);
                toast.error(err?.message || 'Failed to load contract');
            } finally {
                setLoadingContract(false);
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showContractViewer]);

    // Check if this mail has a contract
    const hasContract = (mail as any)?.contractId;

    if (!mail) {
        return (
            <div className="flex-1 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center text-gray-400">
                <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                    <Paperclip size={40} className="text-gray-300" />
                </div>
                <p>Select a mail to read</p>
            </div>
        );
    }

    const formatTime = (timestamp: any) => {
        if (!timestamp) return 'Just now';
        const date = timestamp.toDate();
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    return (
        <div className="flex-1 bg-white dark:bg-zinc-900 flex flex-col h-full overflow-hidden">
            {/* Mail Header */}
            <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
                {/* Actions */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        {/* Response Button for Proposals */}
                        {(mail as any).category === 'Proposals' && (
                            <button
                                onClick={() => onResponse?.(mail)}
                                className="px-3 py-1.5 bg-teal-600 text-white rounded-lg font-bold text-xs hover:bg-teal-700 transition-colors flex items-center gap-2"
                            >
                                <FileText size={14} />
                                Response
                            </button>
                        )}
                        <button
                            onClick={() => {
                                if (!mail) return;
                                onReply?.({
                                    recipient: mail.senderAddress,
                                    subject: mail.subject ? `Re: ${mail.subject}` : 'Re:',
                                    body: `\n\n--- Original message ---\n${mail.body || ''}`,
                                    contractId: (mail as any).contractId
                                });
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            title="Reply"
                        >
                            <Reply size={18} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                            onClick={() => {
                                if (!mail) return;
                                onForward?.({
                                    subject: mail.subject ? `Fwd: ${mail.subject}` : 'Fwd:',
                                    body: `\n\n--- Forwarded message ---\nFrom: ${mail.senderName} <${mail.senderAddress}>\nTo: ${mail.recipientAddress}\n\n${mail.body || ''}`,
                                    contractId: (mail as any).contractId
                                });
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            title="Forward"
                        >
                            <Forward size={18} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        <div className="w-px h-6 bg-gray-200 dark:bg-zinc-700 mx-1"></div>
                        <button
                            onClick={onDelete}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={18} className="text-red-500" />
                        </button>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={onMarkUnread}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            title="Mark as unread"
                        >
                            <MoreHorizontal size={18} className="text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Subject */}
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {mail.subject}
                </h1>

                {/* Sender Info */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {mail.senderPhotoURL ? (
                            <Image
                                src={mail.senderPhotoURL}
                                alt={mail.senderName}
                                width={48}
                                height={48}
                                className="rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f97316] to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                                {mail.senderName[0]?.toUpperCase()}
                            </div>
                        )}
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {mail.senderName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {mail.senderAddress}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(mail.createdAt)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Mail Body */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-3 prose-p:leading-relaxed">
                    <ReactMarkdown>{mail.body}</ReactMarkdown>
                </div>

                {/* Contract Action Button */}
                {hasContract && (
                    <div className="mt-8 p-6 bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 rounded-xl border-2 border-teal-200 dark:border-teal-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">Contract Attached</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        This email contains a legal contract for your review
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowContractViewer(true)}
                                className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                            >
                                View Contract
                            </button>
                        </div>
                    </div>
                )}

                {/* Attachments Section (if any) */}
                {/* TODO: Add attachments display when implemented */}
            </div>

            {/* Contract Viewer Modal (Unified) */}
            {hasContract && user && (
                <UnifiedContractViewer
                    contractId={(mail as any).contractId}
                    contract={loadedContract || {
                        type: 'general',
                        title: mail.subject || 'Contract',
                        description: mail.body || '',
                        terms: {},
                        status: 'pending',
                        fromUserId: mail.senderId,
                        fromUsername: mail.senderUsername,
                        toUserId: mail.recipientId,
                        toUsername: mail.recipientUsername,
                    }}
                    isOpen={showContractViewer}
                    onClose={() => setShowContractViewer(false)}
                    onSign={async (contractId: string, fullName: string) => {
                        try {
                            await ContractSigningService.signContract(contractId, user.uid, mail.recipientUsername, fullName);
                            toast.success('Contract signed successfully.');
                        } catch (err: any) {
                            toast.error(err?.message || 'Failed to sign contract');
                        }
                    }}
                    canSign={user.uid === (mail as any).recipientId && (loadedContract?.status === 'pending')}
                />
            )}
        </div>
    );
}
