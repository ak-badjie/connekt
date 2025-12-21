'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Mic, Image as ImageIcon, Paperclip,
  Phone, Video, ArrowLeft, Smile, X, Check, CheckCheck, 
  MoreVertical,
  Play, Pause, Trash2, Reply, Copy, AlertCircle, Clock, Lock, CornerUpRight
} from 'lucide-react';

import { useAuth } from '@/lib/auth-store';
import { useToast } from '@/components/toast/toast';
import { 
  Message, 
  sendMessage, 
  listenToMessages, 
  updateMessageStatus, 
  setTypingStatus, 
  deleteMessage, 
  Conversation,
  MessageType
} from '@/lib/realtime-service';
import { uploadImage, uploadVideo } from '@/lib/storage-service';
import AudioRecorder from './AudioRecorder';
import MediaLightbox from './MediaLightbox';
import SwipeableMessage from './SwipeableMessage';
import ForwardModal from './ForwardModal'; 

// --- TYPES ---

interface ActiveChatProps {
  conversation: Conversation;
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

// --- SUB-COMPONENTS ---

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
  onMediaClick: (src: string, type: 'image'|'video') => void;
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isViewOnceOpened, setIsViewOnceOpened] = useState(false);

  // Status Icon Logic
  const StatusIcon = () => {
    if (msg.status === 'read') return <CheckCheck size={14} className="text-blue-400" />;
    if (msg.status === 'delivered') return <CheckCheck size={14} className="text-gray-400" />;
    return <Check size={14} className="text-gray-400" />;
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`group flex mb-4 w-full ${isMe ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`relative max-w-[85%] md:max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
        
        {/* Reply Context */}
        {msg.replyTo && (
          <div className={`
            mb-1 px-3 py-2 rounded-lg text-xs border-l-4 opacity-80 cursor-pointer
            ${isMe ? 'bg-emerald-800/20 border-emerald-500 text-emerald-900' : 'bg-gray-200 border-gray-400 text-gray-600'}
          `}>
            <p className="font-bold mb-0.5">{msg.replyTo.senderName}</p>
            <p className="truncate line-clamp-1">{msg.replyTo.text}</p>
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
          onContextMenu={(e) => { e.preventDefault(); setShowMenu(!showMenu); }}
        >
          
          {/* Deleted Message */}
          {msg.isDeleted ? (
            <div className="flex items-center gap-2 italic opacity-60">
              <AlertCircle size={14} /> This message was deleted
            </div>
          ) : (
            <>
              {/* Media Handling */}
              {msg.type === 'image' && msg.mediaUrl && (
                msg.isOneTimeView ? (
                  <button 
                    onClick={() => !isViewOnceOpened && setIsViewOnceOpened(true)}
                    className={`flex items-center gap-2 p-3 rounded-lg border w-full mb-1 transition-all ${isViewOnceOpened ? 'bg-gray-100 border-gray-200 cursor-default' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}
                  >
                    <div className={`p-2 rounded-full ${isViewOnceOpened ? 'bg-gray-300' : 'bg-emerald-500 text-white'}`}>
                      {isViewOnceOpened ? <Clock size={16} /> : <Lock size={16} />}
                    </div>
                    <span className={isViewOnceOpened ? 'text-gray-500 italic' : ''}>
                      {isViewOnceOpened ? 'Opened' : 'View Once Photo'}
                    </span>
                  </button>
                ) : (
                  <img 
                    src={msg.mediaUrl} 
                    alt="Sent image" 
                    onClick={() => onMediaClick(msg.mediaUrl!, 'image')}
                    className="rounded-lg mb-2 max-h-64 object-cover w-full cursor-pointer hover:opacity-95" 
                  />
                )
              )}

              {msg.type === 'video' && msg.mediaUrl && (
                 <video 
                   src={msg.mediaUrl} 
                   onClick={() => onMediaClick(msg.mediaUrl!, 'video')}
                   controls 
                   className="rounded-lg mb-2 max-h-64 w-full bg-black cursor-pointer" 
                 />
              )}

              {/* Text */}
              {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

              {/* Footer: Time & Status */}
              <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-emerald-100' : 'text-gray-400'}`}>
                {msg.isEdited && <span>(edited)</span>}
                <span>{formatTime(msg.timestamp)}</span>
                {isMe && <StatusIcon />}
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
             {/* Only delete my own messages */}
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
  const toast = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Attachments & State
  const [showAttachments, setShowAttachments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isRecording, setIsRecording] = useState(false); // Visual Only for now
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<{ src: string, type: 'image'|'video' } | null>(null);
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Computed: Other User Info
  const otherUserId = conversation.participants.find(p => p !== currentUserId) || '';
  const otherName = conversation.participantNames[otherUserId] || 'User';
  const otherPhoto = conversation.participantPhotos?.[otherUserId] || '/default-avatar.png';
  const isOtherTyping = conversation.typingUsers?.[otherUserId] || false;

  // 1. Listen to Messages
  useEffect(() => {
    const unsubscribe = listenToMessages(conversation.id, (msgs) => {
      setMessages(msgs);
      // Mark as read immediately if we are at bottom
      updateMessageStatus(conversation.id, currentUserId, 'read');
      scrollToBottom();
    });
    return () => unsubscribe();
  }, [conversation.id, currentUserId]);

  // 2. Scroll Logic
  // We explicitly set the container's scrollTop to avoid affecting the page/body scroll.
  const scrollToBottom = (smooth = false) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    // Prefer instant jump to avoid page-level smooth scrolling that can move the body.
    if (smooth && typeof container.scrollTo === 'function') {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  };

  // Also ensure we snap to bottom whenever messages change (covers initial mount and updates).
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    // instant set to avoid visual jump of the page
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  // 3. Typing Handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      setTypingStatus(conversation.id, currentUserId, true);
    }

    if (typingTimeout) clearTimeout(typingTimeout);

    const timeout = setTimeout(() => {
      setIsTyping(false);
      setTypingStatus(conversation.id, currentUserId, false);
    }, 2000);
    setTypingTimeout(timeout);
  };

  // 4. Send Message
  const handleSend = async (e?: React.FormEvent, file?: File) => {
    e?.preventDefault();
    if ((!inputText.trim() && !file)) return;

    const textPayload = inputText;
    // Optimistic clear
    setInputText('');
    setReplyingTo(null);
    setIsViewOnce(false);
    setShowAttachments(false);

    try {
      let mediaUrl = undefined;
      let type: MessageType = 'text';

      if (file) {
        toast.loading('Uploading...', 'Sending media');
        if (file.type.startsWith('video')) {
          type = 'video';
          mediaUrl = await uploadVideo(file, `conversations/${conversation.id}`);
        } else {
          type = 'image';
          mediaUrl = await uploadImage(file, `conversations/${conversation.id}`);
        }
        toast.success('Sent', 'Media delivered');
      }

      await sendMessage(
        conversation.id,
        currentUserId,
        conversation.participantNames[currentUserId],
        conversation.participants.filter(id => id !== currentUserId),
        textPayload,
        type,
        mediaUrl,
        undefined,
        replyingTo ? { 
          id: replyingTo.id, 
          text: replyingTo.text || 'Media', 
          senderName: replyingTo.senderName 
        } : undefined,
        isViewOnce
      );
      
      scrollToBottom();
    } catch (error) {
      console.error(error);
      toast.error('Error', 'Failed to send message');
      setInputText(textPayload); // Restore text
    }
  };

  // 5. File Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleSend(undefined, e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#efeae2] relative overflow-hidden">
      
      {/* Background Pattern (WhatsApp Style) */}
      <div 
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`
        }} 
      />

      {/* --- HEADER --- */}
      <header className="flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-md border-b border-gray-200 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden text-gray-600 hover:text-emerald-600">
            <ArrowLeft />
          </button>
          
          <div 
            onClick={() => onViewProfile(otherUserId)}
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 rounded-xl transition-colors"
          >
            <div className="relative">
              <img src={otherPhoto} alt={otherName} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
              {/* Online Dot (Logic needs real presence, using mock for now based on typing) */}
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOtherTyping ? 'bg-emerald-500' : 'bg-gray-300'}`} />
            </div>
            
            <div className="flex flex-col">
              <h3 className="font-bold text-gray-900 leading-tight">{otherName}</h3>
              <p className="text-xs text-emerald-600 font-medium h-4">
                {isOtherTyping ? 'Typing...' : 'Online'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-emerald-600">
          <button className="hidden md:block p-2 hover:bg-emerald-50 rounded-full transition-colors"><Video size={20} /></button>
          <button className="hidden md:block p-2 hover:bg-emerald-50 rounded-full transition-colors"><Phone size={20} /></button>
          <div className="h-6 w-px bg-gray-200 mx-1" />
          <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors" title="More Options">
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
                Messages are end-to-end encrypted. No one outside of this chat, not even us, can read or listen to them.
              </p>
            </div>
          ) : (
            messages.reduce((acc: JSX.Element[], msg, index) => {
              // Date Separator Logic
              const prevMsg = messages[index - 1];
              const showDate = !prevMsg || !isSameDay(new Date(msg.timestamp?.toDate ? msg.timestamp.toDate() : msg.timestamp), new Date(prevMsg.timestamp?.toDate ? prevMsg.timestamp.toDate() : prevMsg.timestamp));
              
              if (showDate) {
                acc.push(
                  <div key={`date-${msg.id}`} className="flex justify-center my-4 sticky top-2 z-10">
                    <span className="bg-gray-100/90 backdrop-blur-sm text-gray-500 text-[11px] font-bold px-3 py-1 rounded-full shadow-sm border border-white uppercase tracking-wide">
                      {getRelativeDate(msg.timestamp)}
                    </span>
                  </div>
                );
              }

              acc.push(
                <SwipeableMessage 
                  key={msg.id} 
                  onReply={() => {
                    setReplyingTo(msg);
                    fileInputRef.current?.focus();
                  }}
                >
                  <MessageBubble 
                    msg={msg} 
                    isMe={msg.senderId === currentUserId}
                    onReply={(m) => { setReplyingTo(m); fileInputRef.current?.focus(); }}
                    onDelete={(id) => deleteMessage(conversation.id, id)}
                    onForward={(m) => setForwardMessage(m)}
                    onMediaClick={(src, type) => setLightboxMedia({ src, type })}
                  />
                </SwipeableMessage>
              );
              return acc;
            }, [])
          )}
          {/* bottom spacer removed; scrolling is handled via scrollContainerRef */}
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
                <p className="text-emerald-600 text-xs font-bold">Replying to {replyingTo.senderName}</p>
                <p className="text-gray-500 text-sm truncate">{replyingTo.text || 'Media'}</p>
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
              onChange={handleInputChange} 
              placeholder="Type a message..." 
              className="flex-1 bg-transparent border-none outline-none text-gray-900 py-2 max-h-32" 
            />
            
            {/* View Once Toggle */}
            {(inputText || isRecording) && (
              <button 
                type="button" 
                onClick={() => setIsViewOnce(!isViewOnce)}
                className={`p-1.5 rounded-full transition-colors border ${isViewOnce ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'text-gray-400 border-transparent hover:bg-gray-100'}`}
                title="View Once"
              >
                <span className="text-[10px] font-black border-2 border-current rounded-full w-4 h-4 flex items-center justify-center">1</span>
              </button>
            )}
          </div>

          {/* Send or Mic Button */}
          <div className="mb-1">
             {inputText.trim() ? (
               <button 
                 type="submit" 
                 className="p-3 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all"
               >
                 <Send size={20} className="translate-x-0.5 translate-y-0.5" />
               </button>
             ) : (
               <button 
                 type="button"
                 onMouseDown={() => setIsRecording(true)}
                 onMouseUp={() => setIsRecording(false)}
                 onTouchStart={() => setIsRecording(true)}
                 onTouchEnd={() => setIsRecording(false)}
                 className={`p-3 rounded-full shadow-lg transition-all ${isRecording ? 'bg-red-500 text-white scale-110 animate-pulse' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
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

      <AnimatePresence>
        {lightboxMedia && (
          <MediaLightbox 
            src={lightboxMedia.src} 
            type={lightboxMedia.type} 
            onClose={() => setLightboxMedia(null)} 
          />
        )}
      </AnimatePresence>

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