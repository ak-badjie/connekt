'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Send, Mic, StopCircle } from 'lucide-react';

interface AudioRecorderProps {
  onSend: (audioFile: File) => void;
  onCancel: () => void;
}

export default function AudioRecorder({ onSend, onCancel }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Start Recording on Mount
  useEffect(() => {
    startRecording();
    return () => {
      stopMediaStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 2. Formatting Time (mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 3. Start Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start Timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Microphone access denied:', error);
      onCancel(); // Close if no permission
    }
  };

  // 4. Stop Logic (Send)
  const handleStopAndSend = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], 'voice_note.webm', { type: 'audio/webm' });
        onSend(file);
      };
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 5. Cleanup
  const stopMediaStream = () => {
    audioStream?.getTracks().forEach(track => track.stop());
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      className="absolute inset-0 z-20 bg-white rounded-[24px] flex items-center justify-between px-2 pr-4 shadow-sm border border-red-100"
    >
      {/* Delete Action */}
      <button 
        onClick={onCancel}
        className="p-3 text-red-500 hover:bg-red-50 rounded-full transition-colors group"
        title="Delete Recording"
      >
        <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
      </button>

      {/* Visualizer & Timer */}
      <div className="flex items-center gap-4 flex-1 justify-center">
        <div className="flex items-center gap-1 h-6">
          <motion.div 
             className="w-2 bg-red-500 rounded-full"
             animate={{ height: [8, 16, 8] }}
             transition={{ repeat: Infinity, duration: 0.5 }}
          />
          <div className="w-1.5 h-3 bg-red-400/50 rounded-full" />
          <div className="w-1.5 h-2 bg-red-400/30 rounded-full" />
          
          <span className="text-red-600 font-mono font-bold text-lg min-w-[50px] text-center ml-2">
            {formatTime(duration)}
          </span>
          
           <div className="w-1.5 h-2 bg-red-400/30 rounded-full ml-2" />
           <div className="w-1.5 h-3 bg-red-400/50 rounded-full" />
           <motion.div 
             className="w-2 bg-red-500 rounded-full"
             animate={{ height: [8, 20, 8] }}
             transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }}
          />
        </div>
        <p className="text-xs text-red-400 font-medium animate-pulse">Recording...</p>
      </div>

      {/* Send Action */}
      <button 
        onClick={handleStopAndSend}
        className="p-3 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
      >
        <Send size={18} className="translate-x-0.5" />
      </button>

    </motion.div>
  );
}