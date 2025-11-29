'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, TrendingUp, Filter, ChevronDown } from 'lucide-react';
import { Rating } from '@/lib/types/profile.types';
import { ProfileService } from '@/lib/services/profile-service';
import { ReviewForm } from './ReviewForm';
import Image from 'next/image';

interface ReviewSectionProps {
    profileUid: string;
    currentUserUid?: string;
    isOwner: boolean;
    averageRating: number;
    totalRatings: number;
}

export function ReviewSection({
    profileUid,
    currentUserUid,
    isOwner,
    averageRating,
    totalRatings,
}: ReviewSectionProps) {
    const [reviews, setReviews] = useState<Rating[]>([]);
    const [loading, setLoading] = useState(true);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');
    const [showSortMenu, setShowSortMenu] = useState(false);

    // Calculate rating distribution
    const [ratingDistribution, setRatingDistribution] = useState({
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
    });

    useEffect(() => {
        loadReviews();
    }, [profileUid, sortBy]);

    const loadReviews = async () => {
        setLoading(true);
        try {
            const fetchedReviews = await ProfileService.getRatings(profileUid, 20);

            // Sort reviews
            let sorted = [...fetchedReviews];
            if (sortBy === 'newest') {
                sorted.sort((a, b) => {
                    const aTime = a.createdAt?.seconds || 0;
                    const bTime = b.createdAt?.seconds || 0;
                    return bTime - aTime;
                });
            } else if (sortBy === 'highest') {
                sorted.sort((a, b) => b.rating - a.rating);
            } else if (sortBy === 'lowest') {
                sorted.sort((a, b) => a.rating - b.rating);
            }

            setReviews(sorted);

            // Calculate distribution
            const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
            fetchedReviews.forEach((review) => {
                if (review.rating >= 1 && review.rating <= 5) {
                    dist[review.rating as keyof typeof dist]++;
                }
            });
            setRatingDistribution(dist);
        } catch (error) {
            console.error('Error loading reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReviewSubmitted = () => {
        setShowReviewForm(false);
        loadReviews();
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'Recently';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="profile-section space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                    Reviews & Ratings
                </h2>

                {!isOwner && currentUserUid && (
                    <motion.button
                        onClick={() => setShowReviewForm(true)}
                        className="px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <MessageSquare className="w-4 h-4 inline mr-2" />
                        Leave a Review
                    </motion.button>
                )}
            </div>

            {/* Rating Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Overall Rating */}
                <div className="glass-card-strong p-8 rounded-2xl text-center">
                    <div className="text-6xl font-bold text-gradient-teal-amber mb-2">
                        {averageRating.toFixed(1)}
                    </div>
                    <div className="flex items-center justify-center gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`w-6 h-6 ${star <= Math.round(averageRating)
                                    ? 'text-amber-500 fill-amber-500'
                                    : 'text-gray-300 dark:text-gray-600'
                                    }`}
                            />
                        ))}
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                        Based on {totalRatings} {totalRatings === 1 ? 'review' : 'reviews'}
                    </p>
                </div>

                {/* Rating Distribution */}
                <div className="glass-card-strong p-6 rounded-2xl space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => {
                        const count = ratingDistribution[rating as keyof typeof ratingDistribution];
                        const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;

                        return (
                            <div key={rating} className="flex items-center gap-3">
                                <div className="flex items-center gap-1 w-16">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {rating}
                                    </span>
                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                </div>
                                <div className="flex-1 h-3 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 0.8, delay: (5 - rating) * 0.1 }}
                                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                                    />
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400 w-12 text-right">
                                    {count}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Sort & Filter */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-700 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    All Reviews ({reviews.length})
                </h3>

                <div className="relative">
                    <button
                        onClick={() => setShowSortMenu(!showSortMenu)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-medium hover:bg-white dark:hover:bg-zinc-800 transition-all"
                    >
                        <Filter className="w-4 h-4" />
                        Sort by: {sortBy === 'newest' ? 'Newest' : sortBy === 'highest' ? 'Highest Rated' : 'Lowest Rated'}
                        <ChevronDown className="w-4 h-4" />
                    </button>

                    <AnimatePresence>
                        {showSortMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute right-0 mt-2 w-48 glass-card-strong rounded-xl shadow-xl z-10 overflow-hidden"
                            >
                                {['newest', 'highest', 'lowest'].map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            setSortBy(option as any);
                                            setShowSortMenu(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors ${sortBy === option ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600' : 'text-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        {option === 'newest' ? 'Newest First' : option === 'highest' ? 'Highest Rated' : 'Lowest Rated'}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent"></div>
                        <p className="text-gray-500 dark:text-gray-400 mt-4">Loading reviews...</p>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-12 glass-card-subtle rounded-2xl">
                        <Star className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 text-lg">No reviews yet</p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                            Be the first to leave a review!
                        </p>
                    </div>
                ) : (
                    reviews.map((review, index) => (
                        <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass-card p-6 rounded-2xl hover:shadow-xl transition-shadow"
                        >
                            <div className="flex items-start gap-4">
                                {/* Reviewer Avatar */}
                                <div className="flex-shrink-0">
                                    {review.fromUserPhoto ? (
                                        <Image
                                            src={review.fromUserPhoto}
                                            alt={review.fromUserName}
                                            width={48}
                                            height={48}
                                            className="rounded-full"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold">
                                            {review.fromUserName[0]?.toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                {/* Review Content */}
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                                {review.fromUserName}
                                            </h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {formatDate(review.createdAt)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`w-4 h-4 ${star <= review.rating
                                                        ? 'text-amber-500 fill-amber-500'
                                                        : 'text-gray-300 dark:text-gray-600'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {review.review && (
                                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                                            {review.review}
                                        </p>
                                    )}

                                    {review.projectName && (
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 dark:bg-teal-900/20 text-teal-600 rounded-lg text-sm">
                                            <TrendingUp className="w-4 h-4" />
                                            Project: {review.projectName}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Review Form Modal */}
            <AnimatePresence>
                {showReviewForm && (
                    <ReviewForm
                        profileUid={profileUid}
                        reviewerUid={currentUserUid!}
                        onClose={() => setShowReviewForm(false)}
                        onSubmitSuccess={handleReviewSubmitted}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
