'use client';

import { Play, Pause, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function TimeTracker() {
    const [isRunning, setIsRunning] = useState(false);
    const [time, setTime] = useState(0);

    useEffect(() => {
        let interval: any;
        if (isRunning) {
            interval = setInterval(() => {
                setTime(t => t + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    return (
        <div className="bg-gradient-to-br from-[#008080] to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-teal-500/20">
            <h3 className="text-lg font-bold mb-6">Time Tracker</h3>
            <div className="text-center mb-6">
                <div className="text-5xl font-bold font-mono mb-2">{formatTime(time)}</div>
                <p className="text-sm text-white/80">Current Session</p>
            </div>
            <div className="flex gap-3">
                <button
                    onClick={() => setIsRunning(!isRunning)}
                    className="flex-1 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                    {isRunning ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Start</>}
                </button>
                <button
                    onClick={() => { setTime(0); setIsRunning(false); }}
                    className="px-4 py-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                >
                    <RotateCcw size={16} />
                </button>
            </div>
        </div>
    );
}
