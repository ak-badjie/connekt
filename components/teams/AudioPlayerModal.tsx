'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerModalProps {
    audioUrl: string;
    senderName?: string;
    onClose: () => void;
}

const SPEED_OPTIONS = [0.5, 1, 1.5, 2];

export default function AudioPlayerModal({ audioUrl, senderName, onClose }: AudioPlayerModalProps) {
    const audioRef = useRef<HTMLAudioElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Format time (mm:ss)
    const formatTime = (seconds: number) => {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate progress percentage
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    // Audio event handlers
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
            setIsLoaded(true);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        const handleCanPlay = () => {
            setIsLoaded(true);
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('canplay', handleCanPlay);

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('canplay', handleCanPlay);
        };
    }, []);

    // Play/Pause toggle
    const togglePlay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    }, [isPlaying]);

    // Handle speed change
    const handleSpeedChange = (speed: number) => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.playbackRate = speed;
        setPlaybackRate(speed);
    };

    // Handle seek
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;

        const newTime = (parseFloat(e.target.value) / 100) * duration;
        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    // Handle seek via click on progress bar
    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        if (!audio || !duration) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newTime = percentage * duration;

        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    // Toggle mute
    const toggleMute = () => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    // Close handler - stops audio first
    const handleClose = () => {
        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
        onClose();
    };

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
            if (e.key === ' ') {
                e.preventDefault();
                togglePlay();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay]);

    return (
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Hidden Audio Element */}
                <audio ref={audioRef} src={audioUrl} preload="metadata" />

                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-white text-lg">Voice Note</h3>
                        {senderName && (
                            <p className="text-gray-400 text-sm">from {senderName}</p>
                        )}
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Waveform Visualization */}
                <div className="px-6 pt-6 pb-2">
                    <div className="flex items-center justify-center gap-1 h-16">
                        {Array.from({ length: 32 }).map((_, i) => {
                            const baseHeight = Math.random() * 40 + 10;
                            const isActive = (i / 32) * 100 <= progress;
                            return (
                                <motion.div
                                    key={i}
                                    className={`w-1.5 rounded-full transition-colors duration-150 ${isActive ? 'bg-emerald-500' : 'bg-gray-600'
                                        }`}
                                    animate={{
                                        height: isPlaying
                                            ? [baseHeight * 0.5, baseHeight, baseHeight * 0.7, baseHeight * 0.9, baseHeight * 0.5]
                                            : baseHeight * 0.6,
                                    }}
                                    transition={{
                                        duration: 0.8,
                                        repeat: isPlaying ? Infinity : 0,
                                        delay: i * 0.02,
                                        ease: 'easeInOut',
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="px-6 py-4">
                    <div
                        className="relative h-2 bg-gray-700 rounded-full cursor-pointer group"
                        onClick={handleProgressClick}
                    >
                        {/* Progress Fill */}
                        <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                        {/* Seek Handle */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ left: `calc(${progress}% - 8px)` }}
                        />
                        {/* Hidden Range Input for accessibility */}
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={progress}
                            onChange={handleSeek}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>

                    {/* Time Display */}
                    <div className="flex justify-between mt-2 text-sm font-mono">
                        <span className="text-emerald-400">{formatTime(currentTime)}</span>
                        <span className="text-gray-500">{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="px-6 pb-6">
                    <div className="flex items-center justify-center gap-4">
                        {/* Mute Button */}
                        <button
                            onClick={toggleMute}
                            className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                        >
                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>

                        {/* Play/Pause Button */}
                        <motion.button
                            onClick={togglePlay}
                            disabled={!isLoaded}
                            whileTap={{ scale: 0.95 }}
                            className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-full shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <AnimatePresence mode="wait">
                                {isPlaying ? (
                                    <motion.div
                                        key="pause"
                                        initial={{ scale: 0, rotate: -90 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        exit={{ scale: 0, rotate: 90 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <Pause size={28} fill="currentColor" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="play"
                                        initial={{ scale: 0, rotate: -90 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        exit={{ scale: 0, rotate: 90 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <Play size={28} fill="currentColor" className="translate-x-0.5" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>

                        {/* Speed Control */}
                        <div className="relative">
                            <button
                                className="px-3 py-2 text-sm font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors min-w-[56px]"
                                onClick={() => {
                                    const currentIdx = SPEED_OPTIONS.indexOf(playbackRate);
                                    const nextIdx = (currentIdx + 1) % SPEED_OPTIONS.length;
                                    handleSpeedChange(SPEED_OPTIONS[nextIdx]);
                                }}
                            >
                                {playbackRate}x
                            </button>
                        </div>
                    </div>

                    {/* Speed Options */}
                    <div className="flex justify-center gap-2 mt-4">
                        {SPEED_OPTIONS.map((speed) => (
                            <button
                                key={speed}
                                onClick={() => handleSpeedChange(speed)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${playbackRate === speed
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
                                    }`}
                            >
                                {speed}x
                            </button>
                        ))}
                    </div>
                </div>

                {/* Keyboard Hints */}
                <div className="px-6 pb-4 flex justify-center gap-4 text-xs text-gray-500">
                    <span><kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-400">Space</kbd> Play/Pause</span>
                    <span><kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-400">Esc</kbd> Close</span>
                </div>
            </motion.div>
        </div>
    );
}
