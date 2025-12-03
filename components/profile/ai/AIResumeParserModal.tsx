'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';
import { ProfileAIService } from '@/lib/services/ai/profile-ai.service';
import { ConnectAIService } from '@/lib/services/connect-ai.service';
import { ExtendedUserProfile } from '@/lib/types/profile.types';
import { AIGenerationOverlay } from './AIGenerationOverlay';

interface AIResumeParserModalProps {
    userId: string;
    onClose: () => void;
    onParsed: (profileData: Partial<ExtendedUserProfile>) => void;
}

export function AIResumeParserModal({ userId, onClose, onParsed }: AIResumeParserModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [resumeText, setResumeText] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (selectedFile: File) => {
        const { isSupportedFile, validateFileSize } = await import('@/lib/utils/file-processing');

        // Validate file type
        if (!isSupportedFile(selectedFile)) {
            setError('Invalid file type. Please upload PDF, DOC, DOCX, TXT, or image files (JPG, PNG, WEBP).');
            return;
        }

        // Validate file size (max 10MB)
        if (!validateFileSize(selectedFile, 10)) {
            setError('File too large. Maximum size is 10MB.');
            return;
        }

        setFile(selectedFile);
        setError(null);

        // For images, we don't need to read as text - AI will process directly
        // Just set a flag that we have a file ready
        setResumeText('FILE_READY'); // Placeholder to indicate file is loaded
    };

    const handleParse = async () => {
        if (!file) {
            setError('Please upload a resume first');
            return;
        }

        try {
            setIsParsing(true);
            setError(null);

            // Check quota
            const { allowed } = await ConnectAIService.checkQuota(userId);
            if (!allowed) {
                throw new Error('AI quota exceeded. Please upgrade your plan or wait until next month.');
            }

            // Convert file to base64 for AI processing
            const { fileToBase64, getMimeType } = await import('@/lib/utils/file-processing');
            const base64Data = await fileToBase64(file);
            const mimeType = getMimeType(file);

            // Parse resume using multimodal API
            const profileData = await ProfileAIService.parseResumeFromFile(base64Data, mimeType);

            // Track usage
            await ConnectAIService.trackUsage(userId, 'resume_parser', 1000, 0.001, true);

            onParsed(profileData);
            onClose();
        } catch (error: any) {
            console.error('Resume parsing error:', error);
            setError(error.message || 'Failed to parse resume');
        } finally {
            setIsParsing(false);
        }
    };

    return (
        <>
            <AIGenerationOverlay isVisible={isParsing} message="Parsing your resume..." />

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
                                <ConnektAIIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    AI Resume Parser
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Upload your resume to auto-fill your profile
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Upload Area */}
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`relative border-2 border-dashed rounded-2xl p-8 transition-all ${dragActive
                                ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/10'
                                : 'border-gray-300 dark:border-gray-700 hover:border-teal-400'
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp"
                                onChange={handleChange}
                            />

                            {file ? (
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
                                        <FileText className="w-8 h-8 text-teal-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {file.name}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {(file.size / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setFile(null);
                                            setResumeText('');
                                        }}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        Drop your resume here
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                        or click to browse
                                    </p>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-colors"
                                    >
                                        Choose File
                                    </button>
                                    <p className="text-xs text-gray-500 mt-4">
                                        Supports PDF, DOC, DOCX, TXT, and Images (JPG, PNG, WEBP) - Max 10MB
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                            >
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                            </motion.div>
                        )}

                        {/* Info Box */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-700 dark:text-blue-400">
                                    <p className="font-semibold mb-1">What gets extracted:</p>
                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                        <li>Contact information</li>
                                        <li>Work experience and job roles</li>
                                        <li>Education and certifications</li>
                                        <li>Skills and expertise</li>
                                        <li>Professional summary/bio</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleParse}
                            disabled={!file || isParsing}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isParsing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Parsing...
                                </>
                            ) : (
                                <>
                                    <ConnektAIIcon className="w-5 h-5" />
                                    Parse Resume
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </>
    );
}
