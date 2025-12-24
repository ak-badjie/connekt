'use client';

import { useState } from 'react';
import { Reply, Forward, Trash2, MoreHorizontal, Paperclip, Download, ExternalLink, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import type { MailMessage } from '@/lib/services/mail-service';
import Image from 'next/image';
import { UnifiedContractViewer } from '@/components/contracts/UnifiedContractViewer';
import { ProposalViewer } from '@/components/contracts/ProposalViewer';
import { getContract, signContract } from '@/lib/services/legal';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface MailViewerColumnProps {
    mail: MailMessage | null;
    onReply?: (prefill: {
        recipient?: string;
        subject?: string;
        body?: string;
        contractId?: string;
        isProposalResponse?: boolean;
        autoContractDraftRequest?: {
            templateId?: string;
            contractType?: string;
            variables?: Record<string, any>;
            autoStart?: boolean;
            autoSelectProjectId?: string;
            autoSelectWorkspaceId?: string;
            autoSelectTaskId?: string;
        };
    }) => void;
    onForward?: (prefill: { recipient?: string; subject?: string; body?: string; contractId?: string }) => void;
    onDelete?: () => void;
    onMarkUnread?: () => void;
}

export function MailViewerColumn({
    mail,
    onReply,
    onForward,
    onDelete,
    onMarkUnread
}: MailViewerColumnProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [showContractViewer, setShowContractViewer] = useState(false);
    const [showProposalViewer, setShowProposalViewer] = useState(false);
    const [loadedDocument, setLoadedDocument] = useState<any | null>(null);
    const [loadingDoc, setLoadingDoc] = useState(false);
    const [documentType, setDocumentType] = useState<'proposal' | 'contract' | null>(null);

    // Check if this mail has an attachment
    const hasAttachment = (mail as any)?.contractId;

    // Load document data when viewer requested
    const loadDocument = async (contractId: string) => {
        setLoadingDoc(true);
        try {
            const docData = await getContract(contractId);
            setLoadedDocument(docData);

            // Determine document type based on actual data, not mail metadata
            const isProposal = docData?.terms?.proposal === true;
            setDocumentType(isProposal ? 'proposal' : 'contract');

            // Open appropriate viewer
            if (isProposal) {
                setShowProposalViewer(true);
            } else {
                setShowContractViewer(true);
            }
        } catch (err: any) {
            console.error('Failed to load document', err);
            toast.error('Failed to load attachment');
        } finally {
            setLoadingDoc(false);
        }
    };

    const handleViewAttachment = () => {
        const id = (mail as any).contractId;
        if (id) loadDocument(id);
    };

    // Determine if the attachment label should say "Contract" or "Proposal"
    // Use actual document type if loaded, otherwise fall back to heuristic
    const isProposalDocument = documentType !== null
        ? documentType === 'proposal'
        : (mail?.category === 'Proposals' || mail?.subject?.toLowerCase().includes('proposal'));

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

                {/* Attachment Card */}
                {hasAttachment && (
                    <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-zinc-800 dark:to-zinc-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-zinc-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isProposalDocument ? 'bg-teal-600' : 'bg-blue-600'}`}>
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">
                                        {isProposalDocument ? 'Attached Proposal' : 'Attached Contract'}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {isProposalDocument
                                            ? 'Review the proposal terms and reply with a contract.'
                                            : 'Review and sign the attached legal contract.'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleViewAttachment}
                                disabled={loadingDoc}
                                className="px-6 py-2.5 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 text-gray-900 dark:text-white font-medium rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-600 transition-all"
                            >
                                {loadingDoc ? 'Loading...' : `View ${isProposalDocument ? 'Proposal' : 'Contract'}`}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Contract Viewer (Strictly for Contracts) */}
            {showContractViewer && loadedDocument && (
                <UnifiedContractViewer
                    contractId={(mail as any).contractId}
                    contract={loadedDocument}
                    isOpen={showContractViewer}
                    onClose={() => setShowContractViewer(false)}
                    onSign={async (contractId, fullName) => {
                        await signContract(contractId, user!.uid, mail.recipientUsername, fullName);
                        toast.success('Signed successfully');
                    }}
                    canSign={user?.uid === (mail as any).recipientId && loadedDocument.status === 'pending'}
                />
            )}

            {/* Proposal Viewer (For Proposals) */}
            {showProposalViewer && loadedDocument && (
                <ProposalViewer
                    proposalId={(mail as any).contractId}
                    proposal={loadedDocument}
                    isOpen={showProposalViewer}
                    onClose={() => setShowProposalViewer(false)}
                    onReplyWithContract={(payload) => {
                        onReply?.({
                            recipient: payload.recipient || mail.senderAddress,
                            subject: payload.subject,
                            body: payload.body,
                            autoContractDraftRequest: payload.autoContractDraftRequest
                        });
                    }}
                />
            )}
        </div>
    );
}
