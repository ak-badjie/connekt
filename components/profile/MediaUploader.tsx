'use client';

import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import { ProfileService } from '@/lib/services/profile-service';
import { Button } from '@/components/ui/button';

interface MediaUploaderProps {
    userId: string;
    type: 'profile-picture' | 'cover-image' | 'video-intro' | 'portfolio';
    onUploadComplete: (url: string) => void;
    onUploadError?: (error: string) => void;
    className?: string;
    maxSizeMB?: number;
    acceptedTypes?: string;
}

export function MediaUploader({
    userId,
    type,
    onUploadComplete,
    onUploadError,
    className = '',
    maxSizeMB = 10,
    acceptedTypes = 'image/*,video/*',
}: MediaUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [preview, setPreview] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

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

        try {
            let url: string | null = null;

            // Upload based on type
            if (type === 'profile-picture') {
                url = await ProfileService.uploadProfilePicture(userId, file);
            } else if (type === 'cover-image') {
                url = await ProfileService.uploadCoverImage(userId, file);
            } else if (type === 'video-intro') {
                url = await ProfileService.uploadVideoIntro(userId, file, (prog) => {
                    setProgress(prog);
                });
            } else if (type === 'portfolio') {
                const media = await ProfileService.addPortfolioMedia(userId, file);
                url = media?.url || null;
            }

            if (url) {
                onUploadComplete(url);
                setProgress(100);
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
            setPreview(null);
        } finally {
            setUploading(false);
        }
    }, [userId, type, maxSizeMB, onUploadComplete, onUploadError]);

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
