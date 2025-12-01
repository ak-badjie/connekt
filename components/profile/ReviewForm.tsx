'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Send, Loader2, Upload, Image, Video, FileImage, FileVideo, Trash2 } from 'lucide-react';
import { ProfileService } from '@/lib/services/profile-service';
import { ProfileMedia } from '@/lib/types/profile.types';

interface ReviewFormProps {
    profileUid: string;
    reviewerUid: string;
    onClose: () => void;
    onSubmitSuccess: () => void;
}

export function ReviewForm({
    profileUid,
    reviewerUid,
    onClose,
    onSubmitSuccess,
}: ReviewFormProps) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [review, setReview] = useState('');
    const [projectName, setProjectName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [uploadedMedia, setUploadedMedia] = useState<ProfileMedia[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        setError('');

        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                // Validate file type
                if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
                    throw new Error('Only images and videos are allowed');
                }

                // Validate file size (50MB max)
                if (file.size > 50 * 1024 * 1024) {
                    throw new Error('File size must be less than 50MB');
                }

                const media = await ProfileService.uploadReviewMedia(reviewerUid, file);
                return media;
            });

            const results = await Promise.all(uploadPromises);
            const validMedia = results.filter((m): m is ProfileMedia => m !== null);
            setUploadedMedia([...uploadedMedia, ...validMedia]);
        } catch (err: any) {
            console.error('Error uploading media:', err);
            setError(err.message || 'Failed to upload media. Please try again.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemoveMedia = (mediaId: string) => {
        setUploadedMedia(uploadedMedia.filter(m => m.id !== mediaId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            setError('Please select a rating');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const success = await ProfileService.addRating(
                profileUid,
                reviewerUid,
                rating,
                review || undefined,
                undefined,
                uploadedMedia.length > 0 ? uploadedMedia : undefined
            );

            if (success) {
                onSubmitSuccess();
            } else {
                setError('Failed to submit review. Please try again.');
            }
        } catch (err) {
            console.error('Error submitting review:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-zinc-800 p-10 rounded-3xl max-w-2xl w-full shadow-2xl border-2 border-gray-200 dark:border-zinc-700 max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
                            Leave a Review
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Share your experience and help others make informed decisions
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Star Rating */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 p-6 rounded-2xl border-2 border-amber-200 dark:border-amber-700">
                        <label className="block text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
                            Your Rating *
                        </label>
                        <div className="flex items-center justify-center gap-3 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <motion.button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    whileHover={{ scale: 1.2, rotate: 5 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="focus:outline-none"
                                >
                                    <Star
                                        className={`w-14 h-14 transition-all duration-200 ${star <= (hoverRating || rating)
                                            ? 'text-amber-500 fill-amber-500 drop-shadow-lg'
                                            : 'text-gray-300 dark:text-gray-600'
                                            }`}
                                    />
                                </motion.button>
                            ))}
                        </div>
                        {rating > 0 && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center text-lg font-semibold text-amber-600 dark:text-amber-400"
                            >
                                {rating === 5 ? '⭐ Excellent!' : rating === 4 ? '😊 Good' : rating === 3 ? '😐 Average' : rating === 2 ? '😕 Fair' : '😞 Poor'}
                            </motion.p>
                        )}
                    </div>

                    {/* Written Review */}
                    <div>
                        <label className="block text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
                            Your Review (Optional)
                        </label>
                        <textarea
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            rows={5}
                            maxLength={500}
                            className="w-full px-5 py-4 bg-gray-50 dark:bg-zinc-700 border-2 border-gray-300 dark:border-zinc-600 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all resize-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
                            placeholder="Share your experience working with this person... What did you appreciate most about working together?"
                        />
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Help others by sharing specific details about your experience
                            </p>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                {review.length}/500
                            </p>
                        </div>
                    </div>

                    {/* Project Name (Optional) */}
                    <div>
                        <label className="block text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
                            Project Name (Optional)
                        </label>
                        <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            className="w-full px-5 py-4 bg-gray-50 dark:bg-zinc-700 border-2 border-gray-300 dark:border-zinc-600 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400"
                            placeholder="e.g., Website Redesign Project"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Link this review to a specific project you collaborated on
                        </p>
                    </div>

                    {/* Media Upload Section */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-cyan-900/20 dark:to-blue-900/20 p-6 rounded-2xl border-2 border-dashed border-cyan-300 dark:border-cyan-600">
                        <label className="block text-base font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                            <Upload className="w-5 h-5" />
                            Add Photos or Videos
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Showcase your work together with images or videos (Max 50MB per file)
                        </p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="w-full px-6 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5" />
                                    Choose Files
                                </>
                            )}
                        </button>

                        {/* Media Preview */}
                        {uploadedMedia.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <AnimatePresence>
                                    {uploadedMedia.map((media) => (
                                        <motion.div
                                            key={media.id}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="relative group aspect-square rounded-xl overflow-hidden bg-gray-900 border-2 border-white/20 shadow-lg"
                                        >
                                            {media.type === 'image' ? (
                                                <img
                                                    src={media.url}
                                                    alt="Review media"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                                                    <Video className="w-12 h-12 text-white" />
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveMedia(media.id)}
                                                className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                            >
                                                <Trash2 className="w-4 h-4 text-white" />
                                            </button>
                                            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-xs text-white font-medium flex items-center gap-1">
                                                    {media.type === 'image' ? <FileImage className="w-3 h-3" /> : <FileVideo className="w-3 h-3" />}
                                                    {media.type.toUpperCase()}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl"
                            >
                                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Actions */}
                    <div className="flex items-center gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="flex-1 px-6 py-4 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || rating === 0}
                            className="flex-1 px-6 py-4 bg-gradient-to-r from-teal-500 via-cyan-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Submit Review
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
