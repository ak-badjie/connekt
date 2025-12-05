'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Meeting } from '@/lib/types/meeting.types';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, MessageSquare, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConferenceRoomProps {
    meetingId: string;
    onLeave: () => void;
    isMinimized?: boolean;
    onToggleMinimize?: () => void;
}

export function ConferenceRoom({ meetingId, onLeave, isMinimized = false, onToggleMinimize }: ConferenceRoomProps) {
    const { user } = useAuth();
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [participants, setParticipants] = useState<any[]>([]);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        // Initialize media
        const startMedia = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setStream(mediaStream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Error accessing media devices:", err);
            }
        };

        if (!isMinimized) {
            startMedia();
        }

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isMinimized]);

    useEffect(() => {
        if (stream) {
            stream.getAudioTracks().forEach(track => track.enabled = !isMuted);
        }
    }, [isMuted, stream]);

    useEffect(() => {
        if (stream) {
            stream.getVideoTracks().forEach(track => track.enabled = !isVideoOff);
        }
    }, [isVideoOff, stream]);

    // Mock participants for UI
    useEffect(() => {
        setParticipants([
            { id: '1', name: 'You', isLocal: true },
            { id: '2', name: 'Sarah Connor', isLocal: false },
            { id: '3', name: 'John Doe', isLocal: false },
        ]);
    }, []);

    if (isMinimized) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed bottom-20 right-4 w-64 h-48 bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-700 z-[115]"
            >
                <div className="relative w-full h-full">
                    {/* Preview of active speaker or local video */}
                    <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                        <span className="text-white text-xs">Meeting in progress...</span>
                    </div>

                    <div className="absolute top-2 right-2 flex gap-2">
                        <button onClick={onToggleMinimize} className="p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70">
                            <Maximize2 size={14} />
                        </button>
                    </div>

                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                        <button onClick={() => setIsMuted(!isMuted)} className={`p-2 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-700'} text-white`}>
                            {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                        </button>
                        <button onClick={onLeave} className="p-2 rounded-full bg-red-600 text-white">
                            <PhoneOff size={14} />
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gray-900 z-[120] flex flex-col">
            {/* Header */}
            <div className="h-16 px-6 flex items-center justify-between bg-gray-900/90 backdrop-blur border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <h2 className="text-white font-semibold">Team Meeting</h2>
                    <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-400 text-xs">00:12:45</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onToggleMinimize} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
                        <Minimize2 size={20} />
                    </button>
                </div>
            </div>

            {/* Main Grid */}
            <div className="flex-1 p-4 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full max-h-full">
                    {participants.map(p => (
                        <div key={p.id} className="relative bg-gray-800 rounded-2xl overflow-hidden aspect-video md:aspect-auto border border-gray-700">
                            {p.isLocal ? (
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover transform scale-x-[-1]"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-700">
                                    <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center text-2xl font-bold text-gray-400">
                                        {p.name[0]}
                                    </div>
                                </div>
                            )}

                            <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-lg backdrop-blur text-white text-sm font-medium">
                                {p.name} {p.isLocal && '(You)'}
                            </div>

                            <div className="absolute top-4 right-4 flex gap-2">
                                <div className="p-1.5 bg-black/50 rounded-full text-white">
                                    <Mic size={14} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div className="h-20 bg-gray-900 border-t border-gray-800 flex items-center justify-center gap-4">
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                >
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>

                <button
                    onClick={() => setIsVideoOff(!isVideoOff)}
                    className={`p-4 rounded-full transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                >
                    {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                </button>

                <button
                    onClick={onLeave}
                    className="px-8 py-4 rounded-full bg-red-600 text-white font-bold hover:bg-red-700 transition-all flex items-center gap-2"
                >
                    <PhoneOff size={24} />
                    <span>End Call</span>
                </button>

                <button className="p-4 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-all">
                    <Users size={24} />
                </button>

                <button className="p-4 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-all">
                    <MessageSquare size={24} />
                </button>
            </div>
        </div>
    );
}
