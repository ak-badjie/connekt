'use client';

import { Message } from '@/lib/types/chat.types';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { FileIcon, Download, Play, CheckCheck, Check } from 'lucide-react';

interface MessageBubbleProps {
    message: Message;
    isOwn: boolean;
    showAvatar: boolean;
    onAcceptHelpRequest?: (message: Message) => void;
}

export function MessageBubble({ message, isOwn, showAvatar, onAcceptHelpRequest }: MessageBubbleProps) {
    const { user } = useAuth();

    // Format time
    const time = message.createdAt?.seconds
        ? format(new Date(message.createdAt.seconds * 1000), 'h:mm a')
        : 'Sending...';

    return (
        <div className={`flex gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 flex-shrink-0 ${!showAvatar ? 'opacity-0' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                    {message.senderAvatarUrl ? (
                        <img src={message.senderAvatarUrl} alt={message.senderUsername} className="w-full h-full rounded-full object-cover" />
                    ) : (
                        message.senderUsername.substring(0, 2).toUpperCase()
                    )}
                </div>
            </div>

            {/* Content */}
            <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                {/* Username (only for groups/others) */}
                {!isOwn && showAvatar && (
                    <span className="text-xs text-gray-500 ml-1 mb-1">{message.senderUsername}</span>
                )}

                <div
                    className={`rounded-2xl px-4 py-3 shadow-sm ${message.type === 'help_request'
                        ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 w-full'
                        : isOwn
                            ? 'bg-[#008080] text-white rounded-tr-none'
                            : 'bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-zinc-700'
                        }`}
                >
                    {/* Help Request Special UI */}
                    {message.type === 'help_request' && message.helpRequest && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-2 border-b border-amber-200/50 pb-2">
                                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Help Request</span>
                                <span className="text-xs font-medium text-amber-800 dark:text-amber-200">
                                    {message.helpRequest.budget ? `$${message.helpRequest.budget}` : 'Free Help'}
                                </span>
                            </div>
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">{message.helpRequest.taskTitle}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{message.content}</p>

                            {!isOwn && message.helpRequest.status === 'open' && (
                                <button
                                    onClick={() => onAcceptHelpRequest?.(message)}
                                    className="w-full mt-2 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                >
                                    {message.helpRequest.budget ? 'View Contract & Accept' : 'Accept Task'}
                                </button>
                            )}

                            {message.helpRequest.status !== 'open' && (
                                <div className={`w-full mt-2 py-1.5 text-xs font-medium rounded-lg text-center ${message.helpRequest.status === 'accepted'
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                        : 'bg-gray-100 text-gray-500 dark:bg-zinc-800'
                                    }`}>
                                    {message.helpRequest.status === 'accepted' ? 'Accepted' : 'Closed'}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Standard Text */}
                    {message.type === 'text' && (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}

                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                        <div className="space-y-2 mt-1">
                            {message.attachments.map((att, idx) => (
                                <div key={idx}>
                                    {att.type === 'image' && (
                                        <img src={att.url} alt="Attachment" className="rounded-lg max-h-60 object-cover" />
                                    )}
                                    {att.type === 'video' && (
                                        <video src={att.url} controls className="rounded-lg max-h-60 w-full" />
                                    )}
                                    {att.type === 'audio' && (
                                        <audio src={att.url} controls className="w-full" />
                                    )}
                                    {att.type === 'file' && (
                                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-black/5 dark:bg-white/10 rounded-lg hover:bg-black/10 transition-colors">
                                            <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg">
                                                <FileIcon size={20} className="text-[#008080]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{att.name}</p>
                                                <p className="text-xs opacity-70">{att.size ? `${(att.size / 1024 / 1024).toFixed(2)} MB` : 'File'}</p>
                                            </div>
                                            <Download size={16} />
                                        </a>
                                    )}
                                </div>
                            ))}
                            {message.content && message.type !== 'text' && <p className="text-sm mt-2">{message.content}</p>}
                        </div>
                    )}
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-1 mt-1 px-1">
                    <span className="text-[10px] text-gray-400">{time}</span>
                    {isOwn && (
                        <span className="text-gray-400">
                            {/* Simple read receipt logic - if readBy has more than just sender */}
                            {message.readBy && message.readBy.length > 1 ? (
                                <CheckCheck size={12} className="text-[#008080]" />
                            ) : (
                                <Check size={12} />
                            )}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
