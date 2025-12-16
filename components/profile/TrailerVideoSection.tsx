'use client';

import { useRef, useState } from 'react';
import { Video, Upload, X, Loader2 } from 'lucide-react';
import { ProfileService } from '@/lib/services/profile-service';
import { cn } from '@/lib/utils';
import { UploadProgressDialog, UploadDialogStatus } from '@/components/ui/UploadProgressDialog';

interface TrailerVideoSectionProps {
    videoUrl?: string;
    isOwner: boolean;
    uid: string;
    username?: string;
    onUpdate: (url: string) => void;
}

export function TrailerVideoSection({ videoUrl, isOwner, uid, username, onUpdate }: TrailerVideoSectionProps) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [progressOpen, setProgressOpen] = useState(false);
    const [status, setStatus] = useState<UploadDialogStatus>('idle');
    const [bytesTransferred, setBytesTransferred] = useState(0);
    const [totalBytes, setTotalBytes] = useState(0);
    const [speedBps, setSpeedBps] = useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | undefined>(undefined);
    const lastSampleRef = useRef<{ t: number; bytes: number; speed: number | null } | null>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate video type
        if (!file.type.startsWith('video/')) {
            alert('Please select a video file');
            return;
        }

        // Validate size (e.g., 50MB limit)
        if (file.size > 50 * 1024 * 1024) {
            alert('Video must be smaller than 50MB');
            return;
        }

        setUploading(true);
        setProgressOpen(true);
        setStatus('uploading');
        setErrorMessage(null);
        setBytesTransferred(0);
        setTotalBytes(file.size);
        setSpeedBps(null);
        setFileName(file.name);
        lastSampleRef.current = { t: Date.now(), bytes: 0, speed: null };
        try {
            const url = await ProfileService.uploadVideoIntro(
                uid,
                file,
                (info) => {
                    setBytesTransferred(info.bytesTransferred);
                    setTotalBytes(info.totalBytes);

                    const now = Date.now();
                    const last = lastSampleRef.current;
                    if (!last) {
                        lastSampleRef.current = { t: now, bytes: info.bytesTransferred, speed: null };
                        return;
                    }

                    const dt = (now - last.t) / 1000;
                    if (dt <= 0) return;

                    // Update speed at ~2Hz to reduce jitter.
                    if (dt < 0.45) return;

                    const inst = (info.bytesTransferred - last.bytes) / dt;
                    const smoothed = last.speed == null ? inst : last.speed * 0.7 + inst * 0.3;

                    lastSampleRef.current = { t: now, bytes: info.bytesTransferred, speed: smoothed };
                    setSpeedBps(smoothed);
                },
                username ? { username } : undefined
            );
            if (url) {
                onUpdate(url);
                setStatus('success');
            } else {
                setStatus('error');
                setErrorMessage('Upload failed.');
            }
        } catch (error) {
            console.error('Error uploading video:', error);
            setStatus('error');
            setErrorMessage(error instanceof Error ? error.message : 'Failed to upload video');
            alert('Failed to upload video');
        } finally {
            setUploading(false);
        }
    };

    if (!videoUrl && !isOwner) return null;

    return (
        <div className="relative">
            <UploadProgressDialog
                open={progressOpen}
                onOpenChange={setProgressOpen}
                title="Uploading Intro Video"
                description="Uploading to ConnektStorage"
                fileName={fileName}
                totalBytes={totalBytes}
                bytesTransferred={bytesTransferred}
                speedBps={speedBps}
                status={status}
                errorMessage={errorMessage}
            />

            <div className="aspect-video rounded-3xl overflow-hidden bg-transparent relative group">
                {videoUrl ? (
                    <>
                        <video
                            src={videoUrl}
                            autoPlay
                            muted
                            playsInline
                            controls
                            className="w-full h-full object-cover"
                        />
                        {isOwner && (
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-black/70 transition-colors"
                                    title="Replace video"
                                >
                                    <Upload size={16} />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div
                        className="w-full h-full flex flex-col items-center justify-center bg-black/20 cursor-pointer hover:bg-black/30 transition-colors"
                        onClick={() => isOwner && fileInputRef.current?.click()}
                    >
                        {uploading ? (
                            <div className="flex flex-col items-center gap-2 text-teal-600">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <span className="text-sm font-medium">Uploading video...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-200">
                                <div className="p-4 bg-black/30 backdrop-blur-md rounded-full">
                                    <Upload className="w-8 h-8" />
                                </div>
                                <span className="font-medium">Upload Trailer Video</span>
                                <span className="text-xs">MP4, WebM up to 50MB</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="absolute top-4 left-4 pointer-events-none">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-md text-white">
                        <Video className="w-5 h-5 text-teal-300" />
                        <span className="text-sm font-semibold">Video Introduction</span>
                    </div>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleFileSelect}
                />
            </div>
        </div>
    );
}
