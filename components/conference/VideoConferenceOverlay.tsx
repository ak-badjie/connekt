'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    MonitorUp,
    PhoneOff,
    Users,
    MessageSquare,
    Settings,
    LayoutGrid,
    ShieldCheck
} from 'lucide-react';
import { ConversationMember } from '@/lib/types/chat.types';
import { Meeting } from '@/lib/types/meeting.types';
import { MeetingService } from '@/lib/services/meeting-service';

interface VideoConferenceOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    meetingTitle: string;
    meetingId: string | null;
    meeting: Meeting | null;
    conversationId: string;
    members: Record<string, ConversationMember>;
    currentUserId: string;
}

export function VideoConferenceOverlay({
    isOpen,
    onClose,
    meetingTitle,
    meetingId,
    meeting,
    conversationId,
    members,
    currentUserId
}: VideoConferenceOverlayProps) {
    const [status, setStatus] = useState<'connecting' | 'connected'>('connecting');
    const [elapsed, setElapsed] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isSharingScreen, setIsSharingScreen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [sharingStream, setSharingStream] = useState<MediaStream | null>(null);
    const [mediaError, setMediaError] = useState<string | null>(null);
    const [isEnding, setIsEnding] = useState(false);
    const [autoMuteOnJoin, setAutoMuteOnJoin] = useState(true);
    const [noiseSuppression, setNoiseSuppression] = useState(true);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const localAudioRef = useRef<HTMLAudioElement>(null);
    const sharePreviewRef = useRef<HTMLVideoElement>(null);

    const isHost = Boolean(meeting?.hostId && meeting.hostId === currentUserId);
    const participantIds = meeting?.participants?.length ? meeting.participants : Object.keys(members || {});
    const hostLabel = meeting?.hostName || members[meeting?.hostId || '']?.username || 'You';

    const participantDetails = Array.from(new Set(participantIds || [])).map(userId => ({
        userId,
        username: members[userId]?.username || `Teammate ${userId.slice(-4)}`,
        avatarUrl: members[userId]?.avatarUrl,
        role: userId === meeting?.hostId ? 'admin' : members[userId]?.role || 'member'
    }));

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (!isOpen) return;
        let active = true;
        let localStream: MediaStream | null = null;

        setStatus('connecting');
        setElapsed(0);
        setMediaError(null);
        setIsSharingScreen(false);

        const init = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });

                if (!active) return;
                localStream = mediaStream;
                setStream(mediaStream);

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = mediaStream;
                }
                if (localAudioRef.current) {
                    localAudioRef.current.srcObject = mediaStream;
                }

                setIsMuted(autoMuteOnJoin);

                setTimeout(() => {
                    if (active) {
                        setStatus('connected');
                    }
                }, 900);
            } catch (error) {
                console.error('Media access failed', error);
                setMediaError('Unable to access your camera or mic. Please allow permissions.');
            }
        };

        init();

        return () => {
            active = false;
            localStream?.getTracks().forEach(track => track.stop());
            setStream(null);
        };
    }, [isOpen, autoMuteOnJoin]);

    useEffect(() => {
        if (status !== 'connected') return;
        const interval = setInterval(() => setElapsed(prev => prev + 1), 1000);
        return () => clearInterval(interval);
    }, [status]);

    useEffect(() => {
        if (!stream) return;
        stream.getAudioTracks().forEach(track => {
            track.enabled = !isMuted;
        });
    }, [isMuted, stream]);

    useEffect(() => {
        if (!stream) return;
        stream.getVideoTracks().forEach(track => {
            track.enabled = !isVideoOff;
        });
    }, [isVideoOff, stream]);

    useEffect(() => {
        if (!isOpen) {
            setSettingsOpen(false);
            setIsSharingScreen(false);
            sharingStream?.getTracks().forEach(track => track.stop());
            setSharingStream(null);
        }
    }, [isOpen, sharingStream]);

    useEffect(() => {
        if (sharePreviewRef.current) {
            sharePreviewRef.current.srcObject = sharingStream;
        }
    }, [sharingStream]);

    useEffect(() => () => {
        sharingStream?.getTracks().forEach(track => track.stop());
    }, [sharingStream]);

    const handleShareScreen = async () => {
        if (isSharingScreen) {
            sharingStream?.getTracks().forEach(track => track.stop());
            setSharingStream(null);
            setIsSharingScreen(false);
            return;
        }

        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            setSharingStream(displayStream);
            setIsSharingScreen(true);

            displayStream.getVideoTracks()[0].addEventListener('ended', () => {
                setIsSharingScreen(false);
                setSharingStream(null);
            }, { once: true });
        } catch (error) {
            console.error('Screen share failed', error);
            setMediaError('Unable to share your screen. Please allow permissions.');
        }
    };

    const handleEndMeeting = async () => {
        if (isEnding) return;
        if (isHost && meetingId) {
            setIsEnding(true);
            try {
                await MeetingService.updateMeetingStatus(meetingId, 'completed');
            } catch (error) {
                console.error('Failed to end meeting', error);
            } finally {
                setIsEnding(false);
            }
        }

        onClose();
    };

    const statusLabel = status === 'connecting'
        ? 'Securing connection...'
        : isSharingScreen
            ? 'Sharing your screen'
            : 'Live audio & video';

    const ControlButton = ({ icon: Icon, label, isActive, onClick, danger = false, disabled = false }: any) => (
        <motion.button
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`flex flex-col items-center gap-2 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <div className={`p-4 rounded-2xl transition-all shadow-xl ${danger
                ? 'bg-red-500 text-white shadow-red-500/30'
                : isActive
                    ? 'bg-white text-black'
                    : 'bg-zinc-800 border border-zinc-700 text-gray-400'}
            `}>
                <Icon size={24} />
            </div>
            <span className="text-[10px] font-bold tracking-wide uppercase text-white/70">{label}</span>
        </motion.button>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 1.07 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed inset-0 z-[9999] bg-[#0f1115] text-white flex flex-col overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 pointer-events-none" />

                    <div className="absolute top-0 left-0 right-0 p-6 flex items-start justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
                        <div className="space-y-2">
                            <h2 className="text-2xl uppercase tracking-[0.2em] text-white font-semibold">
                                {meetingTitle}
                            </h2>
                            <div className="flex items-center gap-4 text-xs text-white/70">
                                <div className="flex items-center gap-1">
                                    <ShieldCheck size={14} className="text-green-400" />
                                    <span>Team-only room</span>
                                </div>
                                <span>{statusLabel}</span>
                                <span>{formatTime(elapsed)}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSettingsOpen(prev => !prev)}
                                className="p-2 rounded-xl bg-zinc-900 border border-white/10 hover:border-white/40 transition"
                            >
                                <Settings size={20} />
                            </button>
                            <button
                                onClick={() => setIsSharingScreen(prev => !prev)}
                                className="p-2 rounded-xl bg-zinc-900 border border-white/10 hover:border-white/40 transition"
                            >
                                <LayoutGrid size={20} />
                            </button>
                        </div>
                        <AnimatePresence>
                            {settingsOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute right-6 top-20 w-64 bg-black/80 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur"
                                >
                                    <p className="text-[10px] uppercase text-white/40 tracking-[0.3em] mb-3">Meeting Settings</p>
                                    <div className="space-y-3">
                                        <label className="flex items-center justify-between text-sm">
                                            <span>Auto mute on join</span>
                                            <input
                                                type="checkbox"
                                                checked={autoMuteOnJoin}
                                                onChange={(e) => setAutoMuteOnJoin(e.target.checked)}
                                                className="scale-[1.15]"
                                            />
                                        </label>
                                        <label className="flex items-center justify-between text-sm">
                                            <span>Noise suppression</span>
                                            <input
                                                type="checkbox"
                                                checked={noiseSuppression}
                                                onChange={(e) => setNoiseSuppression(e.target.checked)}
                                                className="scale-[1.15]"
                                            />
                                        </label>
                                        <label className="flex items-center justify-between text-sm">
                                            <span>Show participant badges</span>
                                            <input
                                                type="checkbox"
                                                checked
                                                readOnly
                                                className="scale-[1.15]"
                                            />
                                        </label>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                        <div className="flex-1 flex flex-col gap-6 px-6 py-8 pt-28 z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr,0.6fr] gap-6">
                            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 shadow-2xl min-h-[360px]">
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                />
                                <audio ref={localAudioRef} autoPlay playsInline />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                <div className="absolute left-6 bottom-10 text-sm text-white/80 space-y-1">
                                    <p className="font-semibold">You are sharing camera + audio</p>
                                    <p className="text-xs text-white/60">Only team members can join this room.</p>
                                </div>
                                {isSharingScreen && sharingStream && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-6 right-6 w-40 h-28 rounded-2xl bg-black/80 border border-white/20 p-2 flex flex-col gap-1"
                                    >
                                        <video
                                            ref={sharePreviewRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-full rounded-xl object-cover"
                                        />
                                        <div className="flex items-center justify-between text-[10px] text-green-300">
                                            <MonitorUp size={12} />
                                            sharing live
                                        </div>
                                    </motion.div>
                                )}
                                {mediaError && (
                                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center px-6">
                                        <p className="text-sm text-red-300">{mediaError}</p>
                                        <p className="text-xs text-white/40 mt-2">Refresh or allow device permissions to continue.</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-4">
                                <div className="rounded-3xl border border-white/10 bg-black/40 p-4 space-y-2">
                                    <div className="flex items-center justify-between text-sm text-white/80">
                                        <span>Team members</span>
                                        <span className="text-green-300">{participantDetails.length}</span>
                                    </div>
                                    <div className="text-xs text-white/40">Hosted by {hostLabel}</div>
                                    <div className="flex items-center gap-2 text-xs text-white/60">
                                        <ShieldCheck size={12} />
                                        Only members listed here can enter the call.
                                    </div>
                                </div>
                                <div className="flex-1 rounded-3xl border border-white/10 bg-black/50 p-4 overflow-y-auto max-h-[280px]">
                                    <div className="text-[10px] uppercase tracking-[0.4em] text-white/40 mb-3">Participants</div>
                                    <div className="space-y-3">
                                        {participantDetails.map(participant => (
                                            <div key={participant.userId} className="flex items-center justify-between text-sm text-white/80">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs font-bold">
                                                        {participant.username?.[0] || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold">{participant.username}</p>
                                                        <p className="text-xs text-white/50">
                                                            {participant.role === 'admin' ? 'Host' : 'Participant'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-[11px] text-green-300">
                                                    {participant.userId === currentUserId ? 'You' : 'Online'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <motion.div
                            initial={{ y: 80, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="flex items-center justify-center gap-6 px-4 py-4 bg-black/60 border border-white/10 rounded-3xl shadow-2xl"
                        >
                            <ControlButton
                                icon={isMuted ? MicOff : Mic}
                                label={isMuted ? 'Unmute' : 'Mute'}
                                isActive={!isMuted}
                                onClick={() => setIsMuted(prev => !prev)}
                            />
                            <ControlButton
                                icon={isVideoOff ? VideoOff : Video}
                                label={isVideoOff ? 'Start Video' : 'Stop Video'}
                                isActive={!isVideoOff}
                                onClick={() => setIsVideoOff(prev => !prev)}
                            />
                            <div className="w-px h-12 bg-white/10" />
                            <ControlButton
                                icon={MonitorUp}
                                label={isSharingScreen ? 'Sharing' : 'Share'}
                                isActive={isSharingScreen}
                                onClick={handleShareScreen}
                            />
                            <ControlButton
                                icon={Users}
                                label="People"
                                isActive
                                onClick={() => null}
                            />
                            <ControlButton
                                icon={MessageSquare}
                                label="Chat"
                                isActive
                                onClick={() => null}
                            />
                            <div className="w-px h-12 bg-white/10" />
                            <motion.button
                                onClick={handleEndMeeting}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                disabled={isEnding}
                                className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-600 hover:bg-red-500 transition text-sm font-semibold"
                            >
                                <PhoneOff size={20} />
                                {isHost ? 'End Meeting' : 'Leave Room'}
                            </motion.button>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
