'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';

interface InlineAudioPlayerProps {
    audioUrl: string;
    isMe: boolean;
}

const SPEED_OPTIONS = [1, 1.5, 2];

export default function InlineAudioPlayer({ audioUrl, isMe }: InlineAudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isLoaded, setIsLoaded] = useState(false);

    // Generate static waveform bars (memoized so they don't change on re-render)
    const waveformBars = useMemo(() =>
        Array.from({ length: 28 }).map(() => Math.random() * 20 + 8),
        []
    );

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
    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    // Cycle through speed options
    const cycleSpeed = () => {
        const audio = audioRef.current;
        if (!audio) return;

        const currentIdx = SPEED_OPTIONS.indexOf(playbackRate);
        const nextIdx = (currentIdx + 1) % SPEED_OPTIONS.length;
        const newSpeed = SPEED_OPTIONS[nextIdx];

        audio.playbackRate = newSpeed;
        setPlaybackRate(newSpeed);
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

    // Color classes based on sender
    const colors = isMe ? {
        bg: 'bg-emerald-700/40',
        bgHover: 'hover:bg-emerald-700/60',
        playBg: 'bg-white/20',
        playBgHover: 'hover:bg-white/30',
        playIcon: 'text-white',
        barActive: 'bg-white',
        barInactive: 'bg-white/30',
        text: 'text-emerald-100',
        textMuted: 'text-emerald-200/70',
        speedBg: 'bg-white/15',
        speedBgHover: 'hover:bg-white/25',
        speedText: 'text-white',
    } : {
        bg: 'bg-gray-100',
        bgHover: 'hover:bg-gray-200',
        playBg: 'bg-emerald-500',
        playBgHover: 'hover:bg-emerald-600',
        playIcon: 'text-white',
        barActive: 'bg-emerald-500',
        barInactive: 'bg-gray-300',
        text: 'text-gray-700',
        textMuted: 'text-gray-500',
        speedBg: 'bg-gray-200',
        speedBgHover: 'hover:bg-gray-300',
        speedText: 'text-gray-700',
    };

    return (
        <div className={`flex items-center gap-3 p-2 rounded-xl ${colors.bg} min-w-[240px] max-w-[320px]`}>
            {/* Hidden Audio Element */}
            <audio ref={audioRef} src={audioUrl} preload="metadata" />

            {/* Play/Pause Button */}
            <motion.button
                onClick={togglePlay}
                disabled={!isLoaded}
                whileTap={{ scale: 0.9 }}
                className={`
          w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
          ${colors.playBg} ${colors.playBgHover}
          disabled:opacity-50 transition-all shadow-sm
        `}
            >
                {isPlaying ? (
                    <Pause size={18} className={colors.playIcon} fill="currentColor" />
                ) : (
                    <Play size={18} className={`${colors.playIcon} translate-x-0.5`} fill="currentColor" />
                )}
            </motion.button>

            {/* Waveform & Progress */}
            <div className="flex-1 flex flex-col gap-1">
                {/* Waveform Progress Bar */}
                <div
                    className="flex items-center gap-[2px] h-6 cursor-pointer"
                    onClick={handleProgressClick}
                >
                    {waveformBars.map((height, i) => {
                        const barProgress = (i / waveformBars.length) * 100;
                        const isActive = barProgress <= progress;
                        return (
                            <div
                                key={i}
                                className={`w-[3px] rounded-full transition-all duration-75 ${isActive ? colors.barActive : colors.barInactive
                                    }`}
                                style={{ height: `${height}px` }}
                            />
                        );
                    })}
                </div>

                {/* Time Display */}
                <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-mono ${colors.textMuted}`}>
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>

                    {/* Speed Button */}
                    <button
                        onClick={cycleSpeed}
                        className={`
              px-2 py-0.5 text-[10px] font-bold rounded-full
              ${colors.speedBg} ${colors.speedBgHover} ${colors.speedText}
              transition-colors
            `}
                    >
                        {playbackRate}x
                    </button>
                </div>
            </div>
        </div>
    );
}
