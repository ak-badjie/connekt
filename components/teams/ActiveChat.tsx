'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Mic, Image as ImageIcon, Paperclip,
  Phone, Video, ArrowLeft, Smile, X, Check, CheckCheck,
  MoreVertical, Trash2, Reply, CornerUpRight, Lock, Sparkles
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
import { StorageService } from '@/lib/services/storage-service';
import { Message, MessageType } from '@/lib/types/chat.types';
import AudioRecorder from './AudioRecorder';
import MediaLightbox from './MediaLightbox';
import SwipeableMessage from './SwipeableMessage';
import ForwardModal from './ForwardModal';
import InlineAudioPlayer from './InlineAudioPlayer';
import { AIConversationSummarizerModal } from '@/components/chat/ai/AIConversationSummarizerModal';

// --- TYPES ---
interface ActiveChatProps {
  conversation: EnrichedConversation;
  currentUserId: string;
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
  isGroupChat = false,
  senderRole,
  senderType,
  onReply,
  onDelete,
  onForward,
  onMediaClick
}: {
  msg: Message;
  isMe: boolean;
  isGroupChat?: boolean;
  senderRole?: 'owner' | 'admin' | 'member' | 'supervisor';
  senderType?: 'employee' | 'freelancer';
  onReply: (msg: Message) => void;
  onDelete: (id: string) => void;
  onForward: (msg: Message) => void;
  onMediaClick: (src: string, type: 'image' | 'video') => void;
}) => {
  // Get first attachment if exists
  const firstAttachment = msg.attachments?.[0];
  const hasImage = firstAttachment?.type === 'image';
  const hasVideo = firstAttachment?.type === 'video';
  const hasAudio = firstAttachment?.type === 'audio' || msg.type === 'audio';

  // Role badge styling
  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'owner': return 'bg-amber-100 text-amber-700';
      case 'admin': return 'bg-blue-100 text-blue-700';
      case 'supervisor': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getTypeBadgeStyle = (type?: string) => {
    return type === 'freelancer'
      ? 'bg-purple-100 text-purple-700'
      : 'bg-teal-100 text-teal-700';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`group flex mb-4 w-full ${isMe ? 'justify-end' : 'justify-start'}`}
    >
      {/* Sender Avatar for Group Chats (non-self messages) */}
      {!isMe && isGroupChat && (
        <div className="flex-shrink-0 mr-2 mt-auto mb-1">
          <img
            src={msg.senderAvatarUrl || '/default-avatar.png'}
            alt={msg.senderUsername}
            className="w-8 h-8 rounded-full object-cover border border-gray-200"
          />
        </div>
      )}

      <div className={`relative max-w-[85%] md:max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>

        {/* Sender Info for Group Chats */}
        {!isMe && isGroupChat && (
          <div className="flex items-center gap-2 mb-1 px-1">
            <span className="font-bold text-sm text-gray-900">{msg.senderUsername}</span>
            {senderRole && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getRoleBadgeStyle(senderRole)}`}>
                {senderRole}
              </span>
            )}
            {senderType && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getTypeBadgeStyle(senderType)}`}>
                {senderType}
              </span>
            )}
          </div>
        )}

        {/* Reply Context */}
        {msg.replyToId && (
          <div className={`
            mb-1 px-3 py-2 rounded-lg text-xs border-l-4 opacity-80
            ${isMe ? 'bg-emerald-800/20 border-emerald-500 text-emerald-900' : 'bg-gray-200 border-gray-400 text-gray-600'}
          `}>
            <p className="truncate line-clamp-1">Replying to a message</p>
          </div>
        )}

        {/* Bubble */}
        <div
          className={`
            relative px-4 py-2 shadow-sm rounded-2xl text-sm leading-relaxed min-w-[120px]
            ${isMe
              ? 'bg-emerald-600 text-white rounded-tr-none'
              : 'bg-white text-gray-900 border border-gray-100 rounded-tl-none'}
          `}
        >

          {/* Deleted Message */}
          {msg.isDeleted ? (
            <div className="flex items-center gap-2 italic opacity-60">
              <X size={14} /> This message was deleted
            </div>
          ) : (
            <>
              {/* Media Handling */}
              {hasImage && firstAttachment && (
                <img
                  src={firstAttachment.url}
                  alt="Sent image"
                  onClick={() => onMediaClick(firstAttachment.url, 'image')}
                  className="rounded-lg mb-2 max-h-64 object-cover w-full cursor-pointer hover:opacity-95"
                />
              )}

              {hasVideo && firstAttachment && (
                <video
                  src={firstAttachment.url}
                  onClick={() => onMediaClick(firstAttachment.url, 'video')}
                  controls
                  className="rounded-lg mb-2 max-h-64 w-full bg-black cursor-pointer"
                />
              )}

              {/* Audio Message - Inline Player */}
              {hasAudio && firstAttachment && (
                <InlineAudioPlayer
                  audioUrl={firstAttachment.url}
                  isMe={isMe}
                />
              )}

              {/* Text */}
              {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

              {/* Footer: Time & Status */}
              <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-emerald-100' : 'text-gray-400'}`}>
                {msg.isEdited && <span>(edited)</span>}
                <span>{formatTime(msg.createdAt)}</span>
                {isMe && (
                  msg.readBy?.length > 1
                    ? <CheckCheck size={14} className="text-blue-300" />
                    : <Check size={14} />
                )}
              </div>
            </>
          )}

          {/* Hover Menu Actions */}
          <div className={`
            absolute top-0 ${isMe ? '-left-24' : '-right-24'} 
            flex items-center gap-1 bg-white shadow-lg rounded-xl p-1 border border-gray-100
            opacity-0 group-hover:opacity-100 transition-opacity z-10
          `}>
            <button onClick={() => onReply(msg)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600" title="Reply">
              <Reply size={16} />
            </button>
            <button onClick={() => onForward(msg)} className="p-2 hover:bg-emerald-50 rounded-full text-emerald-600" title="Forward">
              <CornerUpRight size={16} />
            </button>
            {isMe && !msg.isDeleted && (
              <button onClick={() => onDelete(msg.id)} className="p-2 hover:bg-red-50 rounded-full text-red-500" title="Delete">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- MAIN COMPONENT ---
export default function ActiveChat({
  conversation,
  currentUserId,
  onBack,
  onViewProfile
}: ActiveChatProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');

  // UI State
  const [showAttachments, setShowAttachments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<{ src: string, type: 'image' | 'video' } | null>(null);
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const [showSummarizer, setShowSummarizer] = useState(false);
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
  const otherName = conversation.type === 'group'
    ? conversation.title || 'Group Chat'
    : otherParticipant?.displayName || 'User';
  const otherPhoto = conversation.type === 'group'
    ? conversation.photoUrl || '/default-group.png'
    : otherParticipant?.photoURL || '/default-avatar.png';
  const otherConnectMail = otherParticipant?.connectMail;
  const otherJobTitle = otherParticipant?.jobTitle;
  const otherWorkspaceRole = otherParticipant?.workspaceRole;
  const otherWorkspaceType = otherParticipant?.workspaceType;

  // Determine if this is a group chat
  const isGroupChat = conversation.type !== 'direct';

  // Get sender role/type info for a message (for group chats)
  const getSenderInfo = (senderId: string) => {
    const participant = conversation.enrichedParticipants?.[senderId];
    const memberDetail = conversation.memberDetails?.[senderId];
    return {
      role: participant?.workspaceRole || participant?.projectRole || memberDetail?.role,
      type: participant?.workspaceType
    };
  };

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
    if (smooth) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    } else {
      container.scrollTop = container.scrollHeight;
    }
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
    <div className="flex flex-col h-full bg-[#efeae2] relative overflow-hidden">

      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      {/* --- HEADER --- */}
      <header className="flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-md border-b border-gray-200 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden text-gray-600 hover:text-emerald-600">
            <ArrowLeft />
          </button>

          <div
            onClick={() => otherParticipant && onViewProfile(otherParticipant.id)}
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 rounded-xl transition-colors"
          >
            <div className="relative">
              <img src={otherPhoto} alt={otherName} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-emerald-500" />
            </div>

            <div className="flex flex-col">
              <h3 className="font-bold text-gray-900 leading-tight">{otherName}</h3>
              <div className="flex items-center gap-1 flex-wrap">
                {otherJobTitle && (
                  <span className="text-xs text-gray-500">{otherJobTitle}</span>
                )}
                {otherWorkspaceRole && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${otherWorkspaceRole === 'owner' ? 'bg-amber-100 text-amber-700' :
                    otherWorkspaceRole === 'admin' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                    {otherWorkspaceRole}
                  </span>
                )}
                {otherWorkspaceType && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${otherWorkspaceType === 'freelancer' ? 'bg-purple-100 text-purple-700' :
                    'bg-teal-100 text-teal-700'
                    }`}>
                    {otherWorkspaceType}
                  </span>
                )}
              </div>
              {otherConnectMail && (
                <p className="text-[10px] text-emerald-600">{otherConnectMail}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-emerald-600">
          {/* AI Summarizer Button */}
          <button
            onClick={() => setShowSummarizer(true)}
            className="p-2 hover:bg-emerald-50 rounded-full transition-colors"
            title="Summarize Conversation"
          >
            <Sparkles size={20} />
          </button>
          <button className="hidden md:block p-2 hover:bg-emerald-50 rounded-full transition-colors"><Video size={20} /></button>
          <button className="hidden md:block p-2 hover:bg-emerald-50 rounded-full transition-colors"><Phone size={20} /></button>
          <div className="h-6 w-px bg-gray-200 mx-1" />
          <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>
      </header>

      {/* --- MESSAGE LIST --- */}
      <main ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 z-10 custom-scrollbar">
        <div className="max-w-4xl mx-auto flex flex-col justify-end min-h-full">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 opacity-50 text-center p-8">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600">
                <Lock size={32} />
              </div>
              <p className="text-sm text-gray-600 max-w-xs bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                Messages are end-to-end encrypted. No one outside of this chat can read them.
              </p>
            </div>
          ) : (
            messages.reduce((acc: React.JSX.Element[], msg, index) => {
              const prevMsg = messages[index - 1];
              const currentDate = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt);
              const prevDate = prevMsg?.createdAt?.toDate ? prevMsg.createdAt.toDate() : (prevMsg ? new Date(prevMsg.createdAt) : null);
              const showDate = !prevDate || !isSameDay(currentDate, prevDate);

              if (showDate) {
                acc.push(
                  <div key={`date-${msg.id}`} className="flex justify-center my-4 sticky top-2 z-10">
                    <span className="bg-gray-100/90 backdrop-blur-sm text-gray-500 text-[11px] font-bold px-3 py-1 rounded-full shadow-sm border border-white uppercase tracking-wide">
                      {getRelativeDate(msg.createdAt)}
                    </span>
                  </div>
                );
              }

              acc.push(
                <SwipeableMessage
                  key={msg.id}
                  onReply={() => setReplyingTo(msg)}
                >
                  <MessageBubble
                    msg={msg}
                    isMe={msg.senderId === currentUserId}
                    isGroupChat={isGroupChat}
                    senderRole={getSenderInfo(msg.senderId).role as any}
                    senderType={getSenderInfo(msg.senderId).type}
                    onReply={setReplyingTo}
                    onDelete={handleDelete}
                    onForward={setForwardMessage}
                    onMediaClick={(src, type) => setLightboxMedia({ src, type })}
                  />
                </SwipeableMessage>
              );
              return acc;
            }, [])
          )}
        </div>
      </main>

      {/* --- FOOTER INPUT --- */}
      <footer className="p-2 md:p-4 bg-white/90 backdrop-blur-xl border-t border-gray-200 z-20">

        {/* Reply Preview */}
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="max-w-4xl mx-auto bg-gray-50 border-l-4 border-emerald-500 rounded-r-lg p-2 mb-2 flex justify-between items-center shadow-inner"
            >
              <div className="overflow-hidden">
                <p className="text-emerald-600 text-xs font-bold">Replying to {replyingTo.senderUsername}</p>
                <p className="text-gray-500 text-sm truncate">{replyingTo.content || 'Media'}</p>
              </div>
              <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-gray-200 rounded-full">
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-4xl mx-auto flex items-end gap-2 relative min-h-[50px]">
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
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.9 }}
                      className="absolute bottom-16 left-0 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 flex flex-col gap-2 z-50 min-w-[160px]"
                    >
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-gray-700"
                      >
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center"><ImageIcon size={18} /></div>
                        <span className="text-sm font-medium">Photos & Videos</span>
                      </button>
                      <button type="button" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-gray-700">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Paperclip size={18} /></div>
                        <span className="text-sm font-medium">Document</span>
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
                  className={`p-3 mb-1 rounded-full transition-all ${showAttachments ? 'bg-gray-200 text-gray-800 rotate-45' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  <Paperclip size={20} />
                </button>

                <div className="flex-1 bg-white border border-gray-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 rounded-[24px] px-4 py-2 flex items-center gap-2 shadow-sm transition-all">
                  <button type="button" className="text-gray-400 hover:text-yellow-500 transition-colors">
                    <Smile size={22} />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent border-none outline-none text-gray-900 py-2"
                  />
                </div>

                {/* Send or Mic Button */}
                <div className="mb-1">
                  {inputText.trim() ? (
                    <button
                      type="submit"
                      disabled={isSending}
                      className="p-3 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Send size={20} className="translate-x-0.5 translate-y-0.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onMouseDown={() => setIsRecording(true)}
                      className="p-3 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all"
                    >
                      <Mic size={20} />
                    </button>
                  )}
                </div>
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

      {/* AI Summarizer Modal */}
      {showSummarizer && (
        <AIConversationSummarizerModal
          userId={currentUserId}
          messages={messages}
          onClose={() => setShowSummarizer(false)}
        />
      )}
    </div>
  );
}