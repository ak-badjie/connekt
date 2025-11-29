'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, X, Send, Loader2 } from 'lucide-react';
import { ProfileService } from '@/lib/services/profile-service';

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
    const [projectId, setProjectId] = useState('');
    const [projectName, setProjectName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

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
                projectId || undefined
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-card-strong p-8 rounded-3xl max-w-lg w-full shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Leave a Review
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Star Rating */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Your Rating *
                        </label>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <motion.button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="focus:outline-none"
                                >
                                    <Star
                                        className={`w-10 h-10 transition-colors ${star <= (hoverRating || rating)
                                                ? 'text-amber-500 fill-amber-500'
                                                : 'text-gray-300 dark:text-gray-600'
                                            }`}
                                    />
                                </motion.button>
                            ))}
                            {rating > 0 && (
                                <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {rating === 5 ? 'Excellent!' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Fair' : 'Poor'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Written Review */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Your Review (Optional)
                        </label>
                        <textarea
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 bg-white/50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                            placeholder="Share your experience working with this person..."
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {review.length}/500 characters
                        </p>
                    </div>

                    {/* Project Name (Optional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Project Name (Optional)
                        </label>
                        <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            className="w-full px-4 py-3 bg-white/50 dark:bg-zinc-800/50 border border-gray-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                            placeholder="e.g., Website Redesign Project"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Link this review to a specific project
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="flex-1 px-6 py-3 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || rating === 0}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
