'use client';

import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// --- Utility Functions ---
function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
    const value = bytes / Math.pow(k, i);
    const fixed = i === 0 ? 0 : value >= 100 ? 0 : value >= 10 ? 1 : 2;
    return `${value.toFixed(fixed)} ${units[i]}`;
}

function formatSpeed(bytesPerSecond: number | null | undefined): string {
    if (!bytesPerSecond || !Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) return '—';
    return `${formatBytes(bytesPerSecond)}/s`;
}

function formatTime(seconds: number | null | undefined): string {
    if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return '—';
    const s = Math.round(seconds);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return m > 0 ? `${m}m ${rem}s` : `${rem}s`;
}

// --- The Connekt Storage Icon (Progress Aware) ---
const DB_PATH = "M17.91,18.28c8.08,0,14.66-1.74,15.09-3.94V8.59c-.43,2.2-7,3.94-15.09,3.94A39.4,39.4,0,0,1,6.25,11V9a39.4,39.4,0,0,0,11.66,1.51C26,10.53,32.52,8.79,33,6.61h0C32.8,3.2,23.52,2.28,18,2.28S3,3.21,3,6.71V29.29c0,3.49,9.43,4.43,15,4.43s15-.93,15-4.43V24.09C32.57,26.28,26,28,17.91,28A39.4,39.4,0,0,1,6.25,26.52v-2A39.4,39.4,0,0,0,17.91,26C26,26,32.57,24.28,33,22.09V16.34c-.43,2.2-7,3.94-15.09,3.94A39.4,39.4,0,0,1,6.25,18.77v-2A39.4,39.4,0,0,0,17.91,18.28Z";

interface StorageIconProps {
    progress: number;
    status: UploadDialogStatus;
}

function StorageProgressIcon({ progress, status }: StorageIconProps) {
    // Determine fill color based on status
    const getFillColor = () => {
        if (status === 'error') return 'text-red-500';
        if (status === 'success') return 'text-emerald-500';
        return 'text-teal-600'; // Default Brand Teal
    };

    // Calculate clip path: inset(TOP right bottom left)
    // 100% inset from top means hidden. 0% inset from top means full.
    const inverseProgress = Math.max(0, Math.min(100, 100 - progress));
    
    return (
        <div className="relative w-32 h-32 mx-auto mb-6">
            <svg 
                viewBox="0 0 36 36" 
                preserveAspectRatio="xMidYMid meet" 
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full overflow-visible drop-shadow-xl"
            >
                <defs>
                    <path id="storage-path" d={DB_PATH}></path>
                </defs>

                {/* 1. Background Wireframe (Always visible, faint) */}
                <use 
                    href="#storage-path" 
                    className={cn(
                        "fill-none stroke-[0.5px] transition-colors duration-300",
                        status === 'error' ? 'stroke-red-200' : 'stroke-teal-900/20 dark:stroke-teal-100/20'
                    )}
                ></use>

                {/* 2. The Liquid Fill (Controlled by Clip Path) */}
                <use 
                    href="#storage-path" 
                    className={cn(
                        "transition-colors duration-300 ease-in-out",
                        getFillColor()
                    )}
                    fill="currentColor"
                    style={{ 
                        // This creates the "filling up" effect
                        clipPath: `inset(${inverseProgress}% 0 0 0)`,
                        // Smooth transition for the liquid movement
                        transition: 'clip-path 0.3s linear' 
                    }}
                ></use>

                {/* 3. The Outline (Sitting on top for crisp edges) */}
                <use 
                    href="#storage-path" 
                    className={cn(
                        "fill-none stroke-[0.5px] transition-colors duration-300",
                        status === 'error' ? 'stroke-red-500' : 'stroke-teal-600 dark:stroke-teal-400'
                    )}
                ></use>
                
                {/* 4. Gloss/Sheen effect (Optional, adds 3D feel) */}
                <use 
                     href="#storage-path" 
                     className="fill-white/20 pointer-events-none"
                     style={{ 
                        clipPath: `inset(${inverseProgress}% 0 0 0)`,
                        transition: 'clip-path 0.3s linear' 
                    }}
                />
            </svg>
            
            {/* Percentage Text Centered Over Icon */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={cn(
                    "text-lg font-bold drop-shadow-md",
                    progress > 50 ? "text-white" : "text-teal-700 dark:text-teal-300",
                    status === 'error' && (progress > 50 ? "text-white" : "text-red-600")
                )}>
                    {Math.round(progress)}%
                </span>
            </div>
        </div>
    );
}

// --- Main Component ---

export type UploadDialogStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface UploadProgressDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    fileName?: string;
    totalBytes: number;
    bytesTransferred: number;
    speedBps?: number | null;
    status: UploadDialogStatus;
    errorMessage?: string | null;
}

export function UploadProgressDialog({
    open,
    onOpenChange,
    title = 'Uploading to Connekt',
    description,
    fileName,
    totalBytes,
    bytesTransferred,
    speedBps,
    status,
    errorMessage,
}: UploadProgressDialogProps) {
    // Safety calculations
    const safeTotal = Math.max(totalBytes || 0, 0);
    const safeTransferred = Math.min(Math.max(bytesTransferred || 0, 0), safeTotal || Number.MAX_SAFE_INTEGER);
    const progress = safeTotal > 0 ? Math.min((safeTransferred / safeTotal) * 100, 100) : 0;
    const remainingBytes = safeTotal > 0 ? Math.max(safeTotal - safeTransferred, 0) : 0;
    const etaSeconds = speedBps && speedBps > 0 ? remainingBytes / speedBps : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md border-none shadow-2xl bg-white dark:bg-zinc-950">
                <DialogHeader className="flex flex-col items-center text-center">
                    <DialogTitle className="text-xl font-bold text-teal-950 dark:text-teal-50">
                        {status === 'success' ? 'Upload Complete' : title}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400 max-w-[80%] mx-auto">
                        {description ?? (fileName ? 
                            <span className="font-medium text-teal-700/80 dark:text-teal-300/80 truncate block">
                                {fileName}
                            </span> 
                            : 'Please keep this tab open.'
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 flex flex-col items-center">
                    {/* The Animated Icon replaces the progress bar */}
                    <StorageProgressIcon progress={progress} status={status} />

                    {/* Stats Grid */}
                    <div className="w-full grid grid-cols-2 gap-3">
                        <StatBox label="Transferred" value={`${formatBytes(safeTransferred)} / ${formatBytes(safeTotal)}`} />
                        <StatBox label="Speed" value={formatSpeed(speedBps)} />
                        <StatBox label="Remaining" value={formatBytes(remainingBytes)} />
                        <StatBox label="Time Left" value={formatTime(etaSeconds)} />
                    </div>

                    {/* Error Message */}
                    {status === 'error' && errorMessage && (
                        <div className="mt-4 w-full rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-600 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400 animate-in fade-in slide-in-from-bottom-2">
                            {errorMessage}
                        </div>
                    )}
                    
                    {/* Success Message */}
                    {status === 'success' && (
                        <div className="mt-4 w-full rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-600 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400 animate-in fade-in slide-in-from-bottom-2">
                            File stored successfully.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Helper component for the grid stats
function StatBox({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center dark:border-zinc-800 dark:bg-zinc-900/50 transition-colors">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</div>
            <div className="mt-0.5 text-sm font-semibold text-slate-700 dark:text-slate-200">{value}</div>
        </div>
    );
}