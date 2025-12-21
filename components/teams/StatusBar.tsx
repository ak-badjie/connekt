'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, X, Image as ImageIcon, Type, Send, ChevronLeft, ChevronRight, 
  MoreVertical, Trash2, Eye 
} from 'lucide-react';
import { useAuth } from '@/lib/auth-store';
import { useToast } from '@/components/toast/toast';
import { 
  listenToStatuses, 
  addStatus, 
  viewStatus, 
  UserStatus 
} from '@/lib/realtime-service';
import { uploadImage } from '@/lib/storage-service'; // Assuming you have this helper

// --- TYPES ---
interface GroupedStatus {
  userId: string;
  userName: string;
  userPhoto: string;
  statuses: UserStatus[];
  hasUnseen: boolean;
}

// --- UTILS ---
const GRADIENTS = [
  'from-emerald-400 to-teal-600',
  'from-amber-300 to-orange-500',
  'from-rose-400 to-pink-600',
  'from-blue-400 to-indigo-600',
  'from-violet-400 to-purple-600',
  'from-slate-800 to-black',
];

// --- COMPONENTS ---

/**
 * 1. CREATE STATUS MODAL
 * Allows user to upload media or type text on a gradient background
 */
const CreateStatusModal = ({ onClose }: { onClose: () => void }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState<'text' | 'media'>('text');
  const [text, setText] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(0);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      setMode('media');
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      let content = text;
      let type: 'text' | 'image' | 'video' = 'text';

      if (mode === 'media' && mediaFile) {
        // Upload logic here
        const isVideo = mediaFile.type.startsWith('video');
        type = isVideo ? 'video' : 'image';
        content = await uploadImage(mediaFile, `statuses/${user.id}`);
      } else if (mode === 'text') {
        if (!text.trim()) return;
        // For text, we save the gradient class as background
        // Ideally save the specific colors, here we save the index or class string
        // We'll pass the gradient class string as 'background'
      }

      await addStatus(
        user.id,
        user.displayName || 'User',
        user.photoURL || '',
        content,
        type,
        mode === 'text' ? GRADIENTS[selectedGradient] : undefined
      );

      toast.success('Status Posted', 'Your updates are live for 24 hours.');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Error', 'Failed to post status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
      animate={{ opacity: 1, scale: 1, rotateX: 0 }}
      exit={{ opacity: 0, scale: 0.9, rotateX: -20 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md perspective-1000"
    >
      <div className="w-full max-w-md bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 flex justify-between items-center z-10">
          <button onClick={onClose} className="text-white/70 hover:text-white"><X /></button>
          <h3 className="text-white font-bold">New Status</h3>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting || (!text && !mediaFile)}
            className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:scale-90 transition-all hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
          >
            {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Send size={18} className="ml-0.5" />}
          </button>
        </div>

        {/* Content Area */}
        <div className={`flex-1 relative flex items-center justify-center transition-colors duration-500 bg-gradient-to-br ${mode === 'text' ? GRADIENTS[selectedGradient] : 'from-black to-zinc-900'}`}>
          
          {mode === 'text' ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a status..."
              className="w-full h-full bg-transparent border-none outline-none text-center text-white text-3xl font-bold p-8 resize-none placeholder:text-white/50"
              autoFocus
            />
          ) : (
            mediaPreview && (
               mediaFile?.type.startsWith('video') 
               ? <video src={mediaPreview} controls className="max-h-full max-w-full" />
               : <img src={mediaPreview} alt="Preview" className="max-h-full max-w-full object-contain" />
            )
          )}
        </div>

        {/* Tools */}
        <div className="p-6 bg-zinc-900/90 backdrop-blur-xl border-t border-white/10 flex flex-col gap-4">
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => { setMode('text'); setMediaFile(null); }}
              className={`p-3 rounded-xl transition-all ${mode === 'text' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
            >
              <Type size={20} />
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={`p-3 rounded-xl transition-all ${mode === 'media' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
            >
              <ImageIcon size={20} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*,video/*" 
              className="hidden" 
              onChange={handleFileSelect}
            />
          </div>

          {mode === 'text' && (
            <div className="flex gap-2 justify-center overflow-x-auto pb-2 scrollbar-hide">
              {GRADIENTS.map((grad, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedGradient(i)}
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${grad} border-2 transition-all ${selectedGradient === i ? 'border-white scale-110' : 'border-transparent opacity-70'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * 2. STATUS VIEWER (Instagram/WhatsApp Style)
 */
const StatusViewer = ({ 
  groupedStatus, 
  onClose, 
  onNextUser, 
  onPrevUser 
}: { 
  groupedStatus: GroupedStatus; 
  onClose: () => void;
  onNextUser?: () => void;
  onPrevUser?: () => void;
}) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const currentStatus = groupedStatus.statuses[currentIndex];
  
  // Mark as viewed
  useEffect(() => {
    if (user && currentStatus && !currentStatus.viewers.includes(user.id)) {
      viewStatus(currentStatus.id, user.id);
    }
  }, [currentStatus, user]);

  // Auto Advance Timer
  useEffect(() => {
    if (isPaused) return;
    
    const duration = currentStatus.type === 'video' ? 10000 : 5000; // 5s for img/text, 10s video (simplified)
    const step = 50; // Update every 50ms
    const increment = (step / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + increment;
      });
    }, step);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, currentStatus]);

  const handleNext = () => {
    if (currentIndex < groupedStatus.statuses.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      // End of this user's stories
      if (onNextUser) onNextUser();
      else onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    } else {
      if (onPrevUser) onPrevUser();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="fixed inset-0 z-[60] bg-black flex items-center justify-center"
    >
      <div 
        className="w-full h-full md:max-w-md md:h-[90vh] md:rounded-3xl relative bg-zinc-900 overflow-hidden flex flex-col"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-20 p-2 flex gap-1">
          {groupedStatus.statuses.map((_, idx) => (
            <div key={idx} className="h-1 bg-white/30 flex-1 rounded-full overflow-hidden">
               <motion.div 
                 className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                 initial={{ width: idx < currentIndex ? '100%' : '0%' }}
                 animate={{ width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' }}
                 transition={{ duration: 0 }} // Instant updates controlled by state
               />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 z-20 px-4 py-2 flex justify-between items-center text-white drop-shadow-md">
           <div className="flex items-center gap-3">
             <img src={groupedStatus.userPhoto || '/default-avatar.png'} className="w-10 h-10 rounded-full border-2 border-white/50" />
             <div>
               <p className="font-bold text-sm">{groupedStatus.userName}</p>
               <p className="text-xs opacity-70">
                 {new Date(currentStatus.createdAt?.toDate()).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
               </p>
             </div>
           </div>
           <div className="flex gap-4">
              <button onClick={onClose}><X size={24} /></button>
           </div>
        </div>

        {/* Content */}
        <div className={`flex-1 w-full h-full flex items-center justify-center bg-gradient-to-br ${currentStatus.type === 'text' ? currentStatus.background || 'from-gray-800 to-black' : 'bg-black'}`}>
          {currentStatus.type === 'text' ? (
            <p className="text-white text-3xl md:text-4xl font-bold text-center px-8 break-words drop-shadow-lg">
              {currentStatus.content}
            </p>
          ) : currentStatus.type === 'image' ? (
             <img src={currentStatus.content} className="w-full h-full object-cover" />
          ) : (
            <video src={currentStatus.content} autoPlay muted={false} className="w-full h-full object-contain" />
          )}
        </div>

        {/* Touch Navigation Overlay */}
        <div className="absolute inset-0 z-10 flex">
           <div className="w-1/3 h-full" onClick={(e) => { e.stopPropagation(); handlePrev(); }}></div>
           <div className="w-1/3 h-full cursor-pointer" onClick={() => { /* Toggle pause handled by container */ }}></div>
           <div className="w-1/3 h-full" onClick={(e) => { e.stopPropagation(); handleNext(); }}></div>
        </div>

        {/* Footer (Views for owner) */}
        {user?.id === groupedStatus.userId && (
          <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent z-20 flex justify-center text-white/80">
             <div className="flex items-center gap-2 text-sm font-medium">
                <Eye size={16} /> {currentStatus.viewers.length} views
             </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

/**
 * 3. MAIN EXPORT: STATUS BAR LIST
 */
export default function StatusBar() {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<UserStatus[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [viewingUserIdx, setViewingUserIdx] = useState<number | null>(null);

  // Load Statuses
  useEffect(() => {
    const unsubscribe = listenToStatuses((data) => {
      setStatuses(data);
    });
    return () => unsubscribe();
  }, []);

  // Group by User
  const groupedStatuses = useMemo(() => {
    const map = new Map<string, GroupedStatus>();
    
    statuses.forEach(st => {
      if (!map.has(st.userId)) {
        map.set(st.userId, {
          userId: st.userId,
          userName: st.userName,
          userPhoto: st.userPhoto,
          statuses: [],
          hasUnseen: false
        });
      }
      const group = map.get(st.userId)!;
      group.statuses.push(st);
      
      // Check seen
      if (user && !st.viewers.includes(user.id)) {
        group.hasUnseen = true;
      }
    });

    // Move my status to front if exists, else add placeholder logic
    let arr = Array.from(map.values());
    
    // Sort: Unseen first, then Recent
    arr.sort((a, b) => {
      if (a.hasUnseen === b.hasUnseen) return 0;
      return a.hasUnseen ? -1 : 1;
    });

    return arr;
  }, [statuses, user]);

  return (
    <div className="w-full mb-6">
      <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide px-2">
        
        {/* 1. 'My Status' Button */}
        <motion.div 
          className="flex flex-col items-center gap-2 cursor-pointer group min-w-[70px]"
          whileTap={{ scale: 0.95 }}
        >
          <div className="relative">
            <div 
              className="w-16 h-16 rounded-full p-[2px] border-2 border-dashed border-gray-300 group-hover:border-emerald-500 transition-colors"
              onClick={() => setIsCreating(true)}
            >
              <img 
                src={user?.photoURL || '/default-avatar.png'} 
                className="w-full h-full rounded-full object-cover"
                alt="Me"
              />
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsCreating(true); }}
              className="absolute bottom-0 right-0 bg-emerald-500 text-white rounded-full p-1 border-2 border-white shadow-sm"
            >
              <Plus size={14} />
            </button>
          </div>
          <span className="text-xs font-medium text-gray-500 group-hover:text-emerald-600">My Status</span>
        </motion.div>

        {/* 2. Other Users' Statuses */}
        {groupedStatuses.map((group, idx) => (
           <motion.div 
             key={group.userId}
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 1, scale: 1 }}
             className="flex flex-col items-center gap-2 cursor-pointer min-w-[70px] relative"
             onClick={() => setViewingUserIdx(idx)}
           >
             <div className={`
               w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr 
               ${group.hasUnseen ? 'from-emerald-500 via-amber-400 to-emerald-500 animate-gradient-spin' : 'from-gray-300 to-gray-200'}
             `}>
               <div className="w-full h-full rounded-full border-2 border-white overflow-hidden">
                 <img src={group.userPhoto || '/default-avatar.png'} className="w-full h-full object-cover transition-transform hover:scale-110" />
               </div>
             </div>
             <span className={`text-xs text-center truncate w-20 ${group.hasUnseen ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
                {group.userId === user?.id ? 'Me' : group.userName.split(' ')[0]}
             </span>
           </motion.div>
        ))}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isCreating && (
          <CreateStatusModal onClose={() => setIsCreating(false)} />
        )}
        {viewingUserIdx !== null && viewingUserIdx < groupedStatuses.length && (
          <StatusViewer 
            groupedStatus={groupedStatuses[viewingUserIdx]}
            onClose={() => setViewingUserIdx(null)}
            onNextUser={() => {
              if (viewingUserIdx + 1 < groupedStatuses.length) setViewingUserIdx(viewingUserIdx + 1);
              else setViewingUserIdx(null);
            }}
            onPrevUser={() => {
              if (viewingUserIdx - 1 >= 0) setViewingUserIdx(viewingUserIdx - 1);
            }}
          />
        )}
      </AnimatePresence>

      {/* Tailwind Custom Animation for ring */}
      <style jsx global>{`
        @keyframes gradient-spin {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-spin {
          background-size: 200% 200%;
          animation: gradient-spin 3s ease infinite;
        }
      `}</style>
    </div>
  );
}