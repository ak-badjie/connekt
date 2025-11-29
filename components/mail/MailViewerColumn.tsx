'use client';

import { Reply, Forward, Trash2, MoreHorizontal, Paperclip, Download, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { MailMessage } from '@/lib/services/mail-service';

interface MailViewerColumnProps {
    mail: MailMessage | null;
    onReply?: () => void;
    onForward?: () => void;
    onDelete?: () => void;
}

export function MailViewerColumn({
    mail,
    onReply,
    onForward,
    onDelete
}: MailViewerColumnProps) {
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
                            onClick={onReply}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            title="Reply"
                        >
                            <Reply size={18} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                            onClick={onForward}
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
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                        <MoreHorizontal size={18} className="text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {/* Subject */}
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {mail.subject}
                </h1>

                {/* Sender Info */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f97316] to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                            {mail.senderName[0]?.toUpperCase()}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {mail.senderName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                @{mail.senderUsername}
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
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{mail.body}</ReactMarkdown>
                </div>

                {/* Attachments Section (if any) */}
                {/* TODO: Add attachments display when implemented */}
            </div>
        </div>
    );
}
