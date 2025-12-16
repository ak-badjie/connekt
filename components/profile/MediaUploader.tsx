'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import { ProfileService } from '@/lib/services/profile-service';
import { Button } from '@/components/ui/button';
import { UploadProgressDialog, UploadDialogStatus } from '@/components/ui/UploadProgressDialog';

interface MediaUploaderProps {
    userId: string;
    type: 'profile-picture' | 'cover-image' | 'video-intro' | 'portfolio';
    onUploadComplete: (url: string) => void;
    onUploadError?: (error: string) => void;
    className?: string;
    maxSizeMB?: number;
    acceptedTypes?: string;
    username?: string;
}

export function MediaUploader({
    userId,
    type,
    onUploadComplete,
    onUploadError,
    className = '',
    maxSizeMB = 10,
    acceptedTypes = 'image/*,video/*',
    username,
}: MediaUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [preview, setPreview] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const [progressOpen, setProgressOpen] = useState(false);
    const [status, setStatus] = useState<UploadDialogStatus>('idle');
    const [bytesTransferred, setBytesTransferred] = useState(0);
    const [totalBytes, setTotalBytes] = useState(0);
    const [speedBps, setSpeedBps] = useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | undefined>(undefined);
    const lastSampleRef = useRef<{ t: number; bytes: number; speed: number | null } | null>(null);

    const handleFile = useCallback(async (file: File) => {
        // Validate file size
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            const error = `File size must be less than ${maxSizeMB}MB`;
            onUploadError?.(error);
            return;
        }

        // Create preview
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);
        setUploading(true);
        setProgress(0);

        if (type === 'video-intro') {
            setProgressOpen(true);
            setStatus('uploading');
            setErrorMessage(null);
            setBytesTransferred(0);
            setTotalBytes(file.size);
            setSpeedBps(null);
            setFileName(file.name);
            lastSampleRef.current = { t: Date.now(), bytes: 0, speed: null };
        }

        try {
            let url: string | null = null;

            // Upload based on type
            if (type === 'profile-picture') {
                url = await ProfileService.uploadProfilePicture(userId, file);
            } else if (type === 'cover-image') {
                url = await ProfileService.uploadCoverImage(userId, file);
            } else if (type === 'video-intro') {
                url = await ProfileService.uploadVideoIntro(
                    userId,
                    file,
                    (info) => {
                        setProgress(info.progress);
                        setBytesTransferred(info.bytesTransferred);
                        setTotalBytes(info.totalBytes);

                        const now = Date.now();
                        const last = lastSampleRef.current;
                        if (!last) {
                            lastSampleRef.current = { t: now, bytes: info.bytesTransferred, speed: null };
                            return;
                        }

                        const dt = (now - last.t) / 1000;
                        if (dt <= 0 || dt < 0.45) return;

                        const inst = (info.bytesTransferred - last.bytes) / dt;
                        const smoothed = last.speed == null ? inst : last.speed * 0.7 + inst * 0.3;
                        lastSampleRef.current = { t: now, bytes: info.bytesTransferred, speed: smoothed };
                        setSpeedBps(smoothed);
                    },
                    username ? { username } : undefined
                );
            } else if (type === 'portfolio') {
                const media = await ProfileService.addPortfolioMedia(userId, file);
                url = media?.url || null;
            }

            if (url) {
                onUploadComplete(url);
                setProgress(100);
                if (type === 'video-intro') setStatus('success');
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            const msg = error instanceof Error ? error.message : 'Upload failed';
            onUploadError?.(msg);
            if (type === 'video-intro') {
                setStatus('error');
                setErrorMessage(msg);
            }
            setPreview(null);
        } finally {
            setUploading(false);
        }
    }, [userId, type, maxSizeMB, onUploadComplete, onUploadError, username]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFile(file);
        }
    }, [handleFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    }, []);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    }, [handleFile]);

    const clearPreview = useCallback(() => {
        setPreview(null);
        setProgress(0);
    }, []);

    return (
        <div className={`relative ${className}`}>
            {type === 'video-intro' ? (
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
            ) : null}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-xl p-6 transition-all ${dragActive
                        ? 'border-[#008080] bg-teal-50 dark:bg-teal-900/20'
                        : 'border-gray-300 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-600'
                    }`}
            >
                {preview ? (
                    <div className="relative">
                        {preview.startsWith('blob:') && preview.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img
                                src={preview}
                                alt="Preview"
                                className="w-full h-auto rounded-lg"
                            />
                        ) : (
                            <video
                                src={preview}
                                controls
                                className="w-full h-auto rounded-lg"
                            />
                        )}
                        {!uploading && (
                            <button
                                onClick={clearPreview}
                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        )}
                        {uploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                                <div className="text-center text-white">
                                    <Loader2 size={32} className="animate-spin mx-auto mb-2" />
                                    <p className="text-sm">{Math.round(progress)}%</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                            {type.includes('video') ? (
                                <Video size={24} className="text-gray-500" />
                            ) : (
                                <ImageIcon size={24} className="text-gray-500" />
                            )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                            Drag and drop or{' '}
                            <label className="text-[#008080] hover:text-teal-700 cursor-pointer font-medium">
                                browse
                                <input
                                    type="file"
                                    onChange={handleChange}
                                    accept={acceptedTypes}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </label>
                        </p>
                        <p className="text-xs text-gray-400">
                            Max file size: {maxSizeMB}MB
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
