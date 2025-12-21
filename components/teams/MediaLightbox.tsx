'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, ExternalLink } from 'lucide-react';

interface MediaLightboxProps {
  src: string;
  type: 'image' | 'video';
  onClose: () => void;
  layoutId?: string; // For magic motion transitions
}

export default function MediaLightbox({ src, type, onClose, layoutId }: MediaLightboxProps) {
  
  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `media_${Date.now()}.${type === 'video' ? 'mp4' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed', error);
      window.open(src, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md"
      onClick={onClose} // Click outside to close
    >
      {/* Toolbar */}
      <div 
        className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4">
           {/* User info could go here */}
           <span className="text-white/80 text-sm font-mono">Media Viewer</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleDownload}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="Download"
          >
            <Download size={20} />
          </button>
          
          <button 
            onClick={onClose}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div 
        className="w-full h-full flex items-center justify-center p-4 md:p-10"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
      >
        {type === 'video' ? (
          <motion.video
            layoutId={layoutId}
            src={src}
            controls
            autoPlay
            className="max-w-full max-h-full rounded-md shadow-2xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          />
        ) : (
          <motion.img
            layoutId={layoutId}
            src={src}
            alt="Full screen media"
            className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.2} // Pull to dismiss feel
            onDragEnd={(e, { offset, velocity }) => {
              if (Math.abs(offset.y) > 100 || Math.abs(velocity.y) > 500) {
                onClose();
              }
            }}
          />
        )}
      </div>

      {/* Footer / Caption Area (Optional) */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
        <p className="text-center text-white/50 text-xs">
          {type === 'image' ? 'Drag up/down to close' : ''}
        </p>
      </div>
    </motion.div>
  );
}