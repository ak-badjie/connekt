'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Mic, Image as ImageIcon, Paperclip,
    ArrowLeft, Smile, X, Check, CheckCheck,
    MoreVertical, Trash2, Reply, CornerUpRight
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/toast/toast';
import {
    listenToMessages,
    sendMessage,
    deleteMessage,
    markMessagesAsRead,
    EnrichedConversation,
    ParticipantInfo
} from '@/lib/services/realtime-service';
import { Message, MessageType } from '@/lib/types/chat.types';
import AudioRecorder from '@/components/teams/AudioRecorder';
import MediaLightbox from '@/components/teams/MediaLightbox';
import InlineAudioPlayer from '@/components/teams/InlineAudioPlayer';
import ForwardModal from '@/components/teams/ForwardModal';

// --- TYPES ---
interface WidgetActiveChatProps {
    conversation: EnrichedConversation;
    onBack: () => void;
    onViewProfile: (userId: string) => void;
}

// --- UTILS ---
const formatTime = (timestamp: any) => {
    if (!timestamp) return '...';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
};

const getRelativeDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();

    if (isSameDay(date, now)) return 'Today';

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (isSameDay(date, yesterday)) return 'Yesterday';

    return date.toLocaleDateString();
};

// --- MESSAGE BUBBLE ---
const MessageBubble = ({
    msg,
    isMe,
    onReply,
    onDelete,
    onForward,
    onMediaClick
}: {
    msg: Message;
    isMe: boolean;
    onReply: (msg: Message) => void;
    onDelete: (id: string) => void;
    onForward: (msg: Message) => void;
    onMediaClick: (src: string, type: 'image' | 'video') => void;
}) => {
    const firstAttachment = msg.attachments?.[0];
    const hasImage = firstAttachment?.type === 'image';
    const hasVideo = firstAttachment?.type === 'video';
    const hasAudio = firstAttachment?.type === 'audio' || msg.type === 'audio';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`group flex mb-3 w-full ${isMe ? 'justify-end' : 'justify-start'}`}
        >
            <div className={`relative max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>

                {/* Reply Context */}
                {msg.replyToId && (
                    <div className={`
            mb-1 px-2 py-1 rounded-lg text-xs border-l-2 opacity-80
            ${isMe ? 'bg-emerald-800/20 border-emerald-500 text-emerald-900' : 'bg-gray-200 border-gray-400 text-gray-600'}
          `}>
                        <p className="truncate line-clamp-1">Replying to a message</p>
                    </div>
                )}

                {/* Bubble */}
                <div
                    className={`
            relative px-3 py-2 shadow-sm rounded-2xl text-sm leading-relaxed min-w-[80px]
            ${isMe
                            ? 'bg-[#008080] text-white rounded-tr-none'
                            : 'bg-white text-gray-900 border border-gray-100 rounded-tl-none'}
          `}
                >

                    {/* Deleted Message */}
                    {msg.isDeleted ? (
                        <div className="flex items-center gap-1 italic opacity-60 text-xs">
                            <X size={12} /> Deleted
                        </div>
                    ) : (
                        <>
                            {/* Media Handling */}
                            {hasImage && firstAttachment && (
                                <img
                                    src={firstAttachment.url}
                                    alt="Sent image"
                                    onClick={() => onMediaClick(firstAttachment.url, 'image')}
                                    className="rounded-lg mb-2 max-h-40 object-cover w-full cursor-pointer hover:opacity-95"
                                />
                            )}

                            {hasVideo && firstAttachment && (
                                <video
                                    src={firstAttachment.url}
                                    onClick={() => onMediaClick(firstAttachment.url, 'video')}
                                    controls
                                    className="rounded-lg mb-2 max-h-40 w-full bg-black cursor-pointer"
                                />
                            )}

                            {/* Audio Message */}
                            {hasAudio && firstAttachment && (
                                <InlineAudioPlayer
                                    audioUrl={firstAttachment.url}
                                    isMe={isMe}
                                />
                            )}

                            {/* Text */}
                            {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

                            {/* Footer: Time & Status */}
                            <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-teal-100' : 'text-gray-400'}`}>
                                {msg.isEdited && <span>(edited)</span>}
                                <span>{formatTime(msg.createdAt)}</span>
                                {isMe && (
                                    msg.readBy?.length > 1
                                        ? <CheckCheck size={12} className="text-blue-200" />
                                        : <Check size={12} />
                                )}
                            </div>
                        </>
                    )}

                    {/* Hover Menu Actions */}
                    <div className={`
            absolute top-0 ${isMe ? '-left-20' : '-right-20'} 
            flex items-center gap-0.5 bg-white shadow-lg rounded-lg p-0.5 border border-gray-100
            opacity-0 group-hover:opacity-100 transition-opacity z-10
          `}>
                        <button onClick={() => onReply(msg)} className="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Reply">
                            <Reply size={14} />
                        </button>
                        <button onClick={() => onForward(msg)} className="p-1.5 hover:bg-teal-50 rounded text-teal-600" title="Forward">
                            <CornerUpRight size={14} />
                        </button>
                        {isMe && !msg.isDeleted && (
                            <button onClick={() => onDelete(msg.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500" title="Delete">
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// --- MAIN COMPONENT ---
export default function WidgetActiveChat({
    conversation,
    onBack,
    onViewProfile
}: WidgetActiveChatProps) {
    const { user } = useAuth();
    const toast = useToast();
    const currentUserId = user?.uid || '';

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');

    // UI State
    const [showAttachments, setShowAttachments] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [lightboxMedia, setLightboxMedia] = useState<{ src: string, type: 'image' | 'video' } | null>(null);
    const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
    const [isSending, setIsSending] = useState(false);

    // Refs
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get other participant info
    const getOtherParticipant = (): ParticipantInfo | null => {
        if (conversation.type === 'direct') {
            const otherId = conversation.members.find(id => id !== currentUserId);
            if (otherId) {
                return conversation.enrichedParticipants?.[otherId] || {
                    id: otherId,
                    displayName: conversation.memberDetails?.[otherId]?.username || 'User',
                    username: conversation.memberDetails?.[otherId]?.username || 'user',
                    photoURL: conversation.memberDetails?.[otherId]?.avatarUrl || '/default-avatar.png'
                };
            }
        }
        return null;
    };

    const otherParticipant = getOtherParticipant();
    const chatName = conversation.type === 'group'
        ? conversation.title || 'Group Chat'
        : otherParticipant?.displayName || 'User';
    const chatPhoto = conversation.type === 'group'
        ? conversation.photoUrl || '/default-group.png'
        : otherParticipant?.photoURL || '/default-avatar.png';

    // 1. Listen to Messages
    useEffect(() => {
        const unsubscribe = listenToMessages(conversation.id, (msgs) => {
            setMessages(msgs);
            // Mark as read
            const unreadIds = msgs
                .filter(m => m.senderId !== currentUserId && !m.readBy?.includes(currentUserId))
                .map(m => m.id);
            if (unreadIds.length > 0) {
                markMessagesAsRead(conversation.id, currentUserId, unreadIds);
            }
            scrollToBottom();
        });
        return () => unsubscribe();
    }, [conversation.id, currentUserId]);

    // 2. Scroll Logic
    const scrollToBottom = (smooth = false) => {
        const container = scrollContainerRef.current;
        if (!container) return;
        setTimeout(() => {
            if (smooth) {
                container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
            } else {
                container.scrollTop = container.scrollHeight;
            }
        }, 50);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 3. Send Message
    const handleSend = async (e?: React.FormEvent, file?: File) => {
        e?.preventDefault();
        if ((!inputText.trim() && !file) || isSending) return;

        const textPayload = inputText;
        setInputText('');
        setReplyingTo(null);
        setShowAttachments(false);
        setIsSending(true);

        try {
            let attachments: File[] = [];
            let attachmentMetadata: { type: 'image' | 'video' | 'audio' | 'file' }[] = [];
            let msgType: MessageType = 'text';

            if (file) {
                attachments = [file];
                if (file.type.startsWith('video')) {
                    msgType = 'video';
                    attachmentMetadata = [{ type: 'video' }];
                } else if (file.type.startsWith('image')) {
                    msgType = 'image';
                    attachmentMetadata = [{ type: 'image' }];
                } else if (file.type.startsWith('audio')) {
                    msgType = 'audio';
                    attachmentMetadata = [{ type: 'audio' }];
                } else {
                    msgType = 'file';
                    attachmentMetadata = [{ type: 'file' }];
                }
            }

            await sendMessage({
                conversationId: conversation.id,
                senderId: currentUserId,
                senderUsername: user?.displayName || 'User',
                senderAvatarUrl: user?.photoURL ?? '',
                content: textPayload,
                type: msgType,
                attachments,
                attachmentMetadata,
                replyToId: replyingTo?.id
            });

            scrollToBottom(true);
        } catch (error) {
            console.error(error);
            toast.error('Error', 'Failed to send message');
            setInputText(textPayload);
        } finally {
            setIsSending(false);
        }
    };

    // 4. File Selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            handleSend(undefined, e.target.files[0]);
        }
    };

    // 5. Handle Delete
    const handleDelete = async (messageId: string) => {
        try {
            await deleteMessage(conversation.id, messageId);
            toast.success('Deleted', 'Message removed');
        } catch (error) {
            toast.error('Error', 'Could not delete message');
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 relative overflow-hidden">

            {/* --- HEADER --- */}
            <header className="flex items-center justify-between px-3 py-2 bg-white border-b border-gray-100 z-20 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600">
                        <ArrowLeft size={18} />
                    </button>

                    <div
                        onClick={() => otherParticipant && onViewProfile(otherParticipant.id)}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded-lg transition-colors"
                    >
                        <div className="relative">
                            <img src={chatPhoto} alt={chatName} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-emerald-500" />
                        </div>

                        <div className="flex flex-col">
                            <h3 className="font-bold text-sm text-gray-900 leading-tight truncate max-w-[150px]">{chatName}</h3>
                            {conversation.type === 'group' && (
                                <span className="text-[10px] text-gray-500">{conversation.members.length} members</span>
                            )}
                        </div>
                    </div>
                </div>

                <button className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500">
                    <MoreVertical size={18} />
                </button>
            </header>

            {/* --- MESSAGE LIST --- */}
            <main ref={scrollContainerRef} className="flex-1 overflow-y-auto p-3 z-10 min-h-0">
                <div className="flex flex-col justify-end" style={{ minHeight: '100%' }}>
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center flex-1 opacity-50 text-center p-4">
                            <p className="text-sm text-gray-500">No messages yet. Say hello!</p>
                        </div>
                    ) : (
                        messages.reduce((acc: React.JSX.Element[], msg, index) => {
                            const prevMsg = messages[index - 1];
                            const currentDate = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt);
                            const prevDate = prevMsg?.createdAt?.toDate ? prevMsg.createdAt.toDate() : (prevMsg ? new Date(prevMsg.createdAt) : null);
                            const showDate = !prevDate || !isSameDay(currentDate, prevDate);

                            if (showDate) {
                                acc.push(
                                    <div key={`date-${msg.id}`} className="flex justify-center my-3">
                                        <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                                            {getRelativeDate(msg.createdAt)}
                                        </span>
                                    </div>
                                );
                            }

                            acc.push(
                                <MessageBubble
                                    key={msg.id}
                                    msg={msg}
                                    isMe={msg.senderId === currentUserId}
                                    onReply={setReplyingTo}
                                    onDelete={handleDelete}
                                    onForward={setForwardMessage}
                                    onMediaClick={(src, type) => setLightboxMedia({ src, type })}
                                />
                            );
                            return acc;
                        }, [])
                    )}
                </div>
            </main>

            {/* --- FOOTER INPUT --- */}
            <footer className="p-2 bg-white border-t border-gray-100 z-20 flex-shrink-0">

                {/* Reply Preview */}
                <AnimatePresence>
                    {replyingTo && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-gray-50 border-l-2 border-[#008080] rounded-r-lg p-2 mb-2 flex justify-between items-center"
                        >
                            <div className="overflow-hidden">
                                <p className="text-[#008080] text-xs font-bold">Replying to {replyingTo.senderUsername}</p>
                                <p className="text-gray-500 text-xs truncate">{replyingTo.content || 'Media'}</p>
                            </div>
                            <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-gray-200 rounded-full">
                                <X size={14} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-end gap-2 relative">
                    <AnimatePresence mode="wait">
                        {isRecording ? (
                            <AudioRecorder
                                key="recorder"
                                onCancel={() => setIsRecording(false)}
                                onSend={(file) => {
                                    setIsRecording(false);
                                    handleSend(undefined, file);
                                }}
                            />
                        ) : (
                            <form key="input-form" onSubmit={handleSend} className="w-full flex items-end gap-2 relative">

                                {/* Attachments Menu */}
                                <AnimatePresence>
                                    {showAttachments && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                            className="absolute bottom-12 left-0 bg-white rounded-xl shadow-xl border border-gray-100 p-1.5 flex flex-col gap-1 z-50 min-w-[140px]"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-700"
                                            >
                                                <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center"><ImageIcon size={14} /></div>
                                                <span className="text-xs font-medium">Photo/Video</span>
                                            </button>
                                            <button type="button" className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-700">
                                                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Paperclip size={14} /></div>
                                                <span className="text-xs font-medium">Document</span>
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*,video/*"
                                    onChange={handleFileSelect}
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowAttachments(!showAttachments)}
                                    className={`p-2 rounded-full transition-all ${showAttachments ? 'bg-gray-200 text-gray-800 rotate-45' : 'text-gray-400 hover:bg-gray-100'}`}
                                >
                                    <Paperclip size={18} />
                                </button>

                                <div className="flex-1 bg-gray-100 focus-within:bg-white focus-within:border-[#008080] focus-within:ring-1 focus-within:ring-[#008080]/20 border border-transparent rounded-full px-3 py-1.5 flex items-center gap-2 transition-all">
                                    <button type="button" className="text-gray-400 hover:text-yellow-500 transition-colors">
                                        <Smile size={18} />
                                    </button>

                                    <input
                                        type="text"
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        placeholder="Message..."
                                        className="flex-1 bg-transparent border-none outline-none text-gray-900 text-sm py-1"
                                    />
                                </div>

                                {/* Send or Mic Button */}
                                {inputText.trim() ? (
                                    <button
                                        type="submit"
                                        disabled={isSending}
                                        className="p-2.5 bg-[#008080] text-white rounded-full shadow-lg hover:bg-teal-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        <Send size={16} className="translate-x-0.5" />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onMouseDown={() => setIsRecording(true)}
                                        className="p-2.5 bg-[#008080] text-white rounded-full shadow-lg hover:bg-teal-700 transition-all"
                                    >
                                        <Mic size={16} />
                                    </button>
                                )}
                            </form>
                        )}
                    </AnimatePresence>
                </div>
            </footer>

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxMedia && (
                    <MediaLightbox
                        src={lightboxMedia.src}
                        type={lightboxMedia.type}
                        onClose={() => setLightboxMedia(null)}
                    />
                )}
            </AnimatePresence>

            {/* Forward Modal */}
            <AnimatePresence>
                {forwardMessage && (
                    <ForwardModal
                        message={forwardMessage}
                        currentConvId={conversation.id}
                        onClose={() => setForwardMessage(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
