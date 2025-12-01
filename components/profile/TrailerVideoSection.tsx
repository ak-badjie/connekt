'use client';

import { useState, useRef } from 'react';
import { Video, Upload, X, Loader2 } from 'lucide-react';
import { ProfileService } from '@/lib/services/profile-service';
import { cn } from '@/lib/utils';

interface TrailerVideoSectionProps {
    videoUrl?: string;
    isOwner: boolean;
    uid: string;
    onUpdate: (url: string) => void;
}

export function TrailerVideoSection({ videoUrl, isOwner, uid, onUpdate }: TrailerVideoSectionProps) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        try {
            const url = await ProfileService.uploadVideoIntro(uid, file);
            if (url) {
                onUpdate(url);
            }
        } catch (error) {
            console.error('Error uploading video:', error);
            alert('Failed to upload video');
        } finally {
            setUploading(false);
        }
    };

    if (!videoUrl && !isOwner) return null;

    return (
        <div className="profile-section">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Video className="w-6 h-6 text-teal-600" />
                Video Introduction
            </h3>

            <div className="aspect-video rounded-2xl overflow-hidden bg-black relative group border border-gray-200 dark:border-zinc-800">
                {videoUrl ? (
                    <>
                        <video
                            src={videoUrl}
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
                        className="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-900 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                        onClick={() => isOwner && fileInputRef.current?.click()}
                    >
                        {uploading ? (
                            <div className="flex flex-col items-center gap-2 text-teal-600">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <span className="text-sm font-medium">Uploading video...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                                <div className="p-4 bg-white dark:bg-zinc-800 rounded-full shadow-sm">
                                    <Upload className="w-8 h-8" />
                                </div>
                                <span className="font-medium">Upload Trailer Video</span>
                                <span className="text-xs">MP4, WebM up to 50MB</span>
                            </div>
                        )}
                    </div>
                )}

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
