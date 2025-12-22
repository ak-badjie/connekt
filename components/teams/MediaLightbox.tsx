'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Download } from 'lucide-react';

interface MediaLightboxProps {
  src: string;
  type: 'image' | 'video';
  onClose: () => void;
  layoutId?: string;
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white/95 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Toolbar */}
      <div
        className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-white/90 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm font-medium">Media Viewer</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="p-2.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
            title="Download"
          >
            <Download size={20} />
          </button>

          <button
            onClick={onClose}
            className="p-2.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="w-full h-full flex items-center justify-center p-4 md:p-10"
        onClick={(e) => e.stopPropagation()}
      >
        {type === 'video' ? (
          <motion.video
            layoutId={layoutId}
            src={src}
            controls
            autoPlay
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl shadow-gray-300/50 border border-gray-200"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          />
        ) : (
          <motion.img
            layoutId={layoutId}
            src={src}
            alt="Full screen media"
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl shadow-gray-300/50 border border-gray-200"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.15}
            onDragEnd={(e, { offset, velocity }) => {
              if (Math.abs(offset.y) > 100 || Math.abs(velocity.y) > 500) {
                onClose();
              }
            }}
          />
        )}
      </div>

      {/* Footer Hint */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white/90 to-transparent pointer-events-none">
        <div className="flex justify-center gap-4 text-xs text-gray-400">
          <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 border border-gray-200">Esc</kbd> Close</span>
          {type === 'image' && <span>Drag to dismiss</span>}
        </div>
      </div>
    </motion.div>
  );
}