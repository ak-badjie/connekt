'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, 
    Users, MessageSquare, Settings, Share2, LayoutGrid
} from 'lucide-react';

interface VideoConferenceOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    meetingTitle: string;
    participants: { id: string; name: string; avatar?: string; isMuted?: boolean }[];
}

export function VideoConferenceOverlay({ isOpen, onClose, meetingTitle, participants }: VideoConferenceOverlayProps) {
    const [status, setStatus] = useState<'connecting' | 'connected'>('connecting');
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [elapsed, setElapsed] = useState(0);

    // Connection Simulation
    useEffect(() => {
        if (isOpen) {
            setStatus('connecting');
            const timer = setTimeout(() => setStatus('connected'), 2000);
            return () => clearTimeout(timer);
        }
        setElapsed(0);
    }, [isOpen]);

    // Timer
    useEffect(() => {
        if (status === 'connected') {
            const interval = setInterval(() => setElapsed(e => e + 1), 1000);
            return () => clearInterval(interval);
        }
    }, [status]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const ControlButton = ({ icon: Icon, label, isActive, onClick, danger = false }: any) => (
        <motion.button
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`flex flex-col items-center gap-2 transition-all ${
                danger 
                    ? 'text-red-500 hover:text-red-400' 
                    : isActive 
                        ? 'text-white' 
                        : 'text-gray-400 hover:text-white'
            }`}
        >
            <div className={`p-4 rounded-2xl transition-all shadow-xl ${
                danger 
                    ? 'bg-red-500 text-white shadow-red-500/20' 
                    : isActive 
                        ? 'bg-white text-black' 
                        : 'bg-zinc-800 border border-zinc-700'
            }`}>
                <Icon size={24} />
            </div>
            <span className="text-[10px] font-bold tracking-wide uppercase">{label}</span>
        </motion.button>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, filter: 'blur(20px)' }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed inset-0 z-[9999] bg-[#0f1115] text-white flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20 bg-gradient-to-b from-black/80 to-transparent">
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-bold tracking-tight">{meetingTitle}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                                <span className="text-sm font-mono text-gray-400">
                                    {status === 'connecting' ? 'Connecting...' : formatTime(elapsed)}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <button className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors">
                                <Settings size={20} />
                             </button>
                             <button className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors">
                                <LayoutGrid size={20} />
                             </button>
                        </div>
                    </div>

                    {/* Main Stage */}
                    <div className="flex-1 flex items-center justify-center p-4 relative">
                        {status === 'connecting' ? (
                            <div className="flex flex-col items-center justify-center gap-8">
                                <div className="relative">
                                    <div className="w-32 h-32 rounded-full border-4 border-zinc-800" />
                                    <div className="absolute inset-0 rounded-full border-4 border-t-[#008080] border-r-[#008080] border-b-transparent border-l-transparent animate-spin" />
                                    <div className="absolute inset-2 bg-zinc-800 rounded-full overflow-hidden">
                                        <img src="https://github.com/shadcn.png" className="w-full h-full object-cover opacity-50" alt="Avatar" />
                                    </div>
                                </div>
                                <p className="text-zinc-500 font-medium tracking-widest uppercase text-sm">Waiting for host...</p>
                            </div>
                        ) : (
                            <div className="w-full h-full grid grid-cols-2 md:grid-cols-3 gap-4 max-w-7xl mx-auto pt-16 pb-24">
                                {participants.map((p, i) => (
                                    <motion.div
                                        key={p.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="relative bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 group"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                                            <span className="text-4xl font-bold text-zinc-700">{p.name[0]}</span>
                                        </div>
                                        <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
                                            <span className="text-sm font-bold">{p.name}</span>
                                        </div>
                                        <div className="absolute top-4 right-4">
                                            {p.isMuted && <div className="p-2 bg-red-500/20 text-red-500 rounded-full"><MicOff size={14} /></div>}
                                        </div>
                                        {/* Active Speaker Border */}
                                        {!p.isMuted && (
                                            <div className="absolute inset-0 border-2 border-[#008080] rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer Controls - Floating Dock Style */}
                    <motion.div 
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-4 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-30"
                    >
                        <ControlButton 
                            icon={isMuted ? MicOff : Mic} 
                            label={isMuted ? "Unmute" : "Mute"} 
                            isActive={isMuted}
                            onClick={() => setIsMuted(!isMuted)} 
                        />
                        <ControlButton 
                            icon={isVideoOff ? VideoOff : Video} 
                            label={isVideoOff ? "Start Video" : "Stop Video"} 
                            isActive={isVideoOff}
                            onClick={() => setIsVideoOff(!isVideoOff)} 
                        />
                        <div className="w-px h-12 bg-white/10" />
                        <ControlButton icon={MonitorUp} label="Share" onClick={() => {}} />
                        <ControlButton icon={Users} label="People" onClick={() => {}} />
                        <ControlButton icon={MessageSquare} label="Chat" onClick={() => {}} />
                        <div className="w-px h-12 bg-white/10" />
                        <ControlButton 
                            icon={PhoneOff} 
                            label="End" 
                            danger 
                            onClick={onClose} 
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
