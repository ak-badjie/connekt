'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Loader2 } from 'lucide-react';

interface ProfilePictureUploadProps {
    currentPhotoURL?: string;
    currentDisplayName?: string;
    onUpload: (file: File, previewUrl: string) => Promise<void>;
    size?: 'small' | 'medium' | 'large';
    isLoading?: boolean;
    showModal?: boolean;
    onClose?: () => void;
}

export function ProfilePictureUpload({
    currentPhotoURL,
    currentDisplayName,
    onUpload,
    size = 'medium',
    isLoading = false,
    showModal = false,
    onClose
}: ProfilePictureUploadProps) {
    const [preview, setPreview] = useState<string | null>(currentPhotoURL || null);
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const sizeClasses = {
        small: 'w-20 h-20',
        medium: 'w-32 h-32',
        large: 'w-40 h-40'
    };

    const validateFile = (file: File): string | null => {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!validTypes.includes(file.type)) {
            return 'Please upload a valid image (JPEG, PNG, GIF, or WEBP)';
        }

        if (file.size > maxSize) {
            return 'Image size must be less than 5MB';
        }

        return null;
    };

    const handleFileSelect = useCallback(async (file: File) => {
        setError(null);

        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = async () => {
            const previewUrl = reader.result as string;
            setPreview(previewUrl);

            // Call upload handler
            setUploading(true);
            try {
                await onUpload(file, previewUrl);
            } catch (err) {
                setError('Upload failed. Please try again.');
                setPreview(currentPhotoURL || null);
            } finally {
                setUploading(false);
            }
        };
        reader.readAsDataURL(file);
    }, [onUpload, currentPhotoURL]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    }, [handleFileSelect]);

    const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const renderUploadArea = () => (
        <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleClick}
            className={`relative ${sizeClasses[size]} rounded-full overflow-hidden cursor-pointer transition-all border-4 ${dragActive
                    ? 'border-teal-500 scale-105'
                    : 'border-gray-200 dark:border-zinc-700 hover:border-teal-400'
                } ${uploading || isLoading ? 'opacity-50 pointer-events-none' : ''}`}
        >
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleChange}
                disabled={uploading || isLoading}
            />

            {preview ? (
                <Image
                    src={preview}
                    alt="Profile preview"
                    fill
                    className="object-cover"
                />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                    <span className="text-white text-5xl font-bold">
                        {currentDisplayName?.[0]?.toUpperCase() || '?'}
                    </span>
                </div>
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                {uploading || isLoading ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                    <Camera className="w-8 h-8 text-white" />
                )}
            </div>
        </div>
    );

    if (showModal && onClose) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-md w-full shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Update Profile Picture
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="flex flex-col items-center gap-6">
                            {renderUploadArea()}

                            <div className="text-center">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    Click or drag and drop to upload
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                    JPEG, PNG, GIF or WEBP (max 5MB)
                                </p>
                            </div>

                            {error && (
                                <div className="w-full p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                                    <p className="text-sm text-red-600 dark:text-red-400 text-center">
                                        {error}
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    }

    // Inline version (for onboarding)
    return (
        <div className="flex flex-col items-center gap-4">
            {renderUploadArea()}

            <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Click or drag to upload
                </p>
                <p className="text-xs text-gray-500">
                    JPEG, PNG, GIF or WEBP (max 5MB)
                </p>
            </div>

            {error && (
                <div className="w-full p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <p className="text-sm text-red-600 dark:text-red-400 text-center">
                        {error}
                    </p>
                </div>
            )}
        </div>
    );
}
