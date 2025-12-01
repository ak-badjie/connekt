'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Calendar, Mail, Edit, Users, Star, Globe, Linkedin,
    Twitter, Camera, Award, TrendingUp, Clock, Target, Settings,
    Briefcase, CheckCircle2, Phone
} from 'lucide-react';
import { RecruiterProfile as RecruiterProfileType } from '@/lib/types/profile.types';
import { ProfileService } from '@/lib/services/profile-service';
import { ReviewSection } from './ReviewSection';
import { PrivacySettingsPanel } from './PrivacySettingsPanel';
import { AdvancedProfileEditor } from './AdvancedProfileEditor';

interface RecruiterProfileProps {
    recruiter: RecruiterProfileType;
    isOwner: boolean;
}

export function RecruiterProfile({ recruiter: initialRecruiter, isOwner }: RecruiterProfileProps) {
    const [recruiter, setRecruiter] = useState(initialRecruiter);
    const [showPrivacySettings, setShowPrivacySettings] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        // Increment profile views if not owner
        if (!isOwner) {
            ProfileService.incrementProfileViews(recruiter.uid);
        }
    }, [recruiter.uid, isOwner]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-purple-950">
            {/* Header Section */}
            <div className="relative h-80 overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <Image
                        src={recruiter.coverImage || '/profile_background.png'}
                        alt="Cover"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                {/* Decorative Blur Circles */}
                <div className="absolute top-10 left-20 w-64 h-64 bg-purple-400 rounded-full blur-3xl opacity-20" />
                <div className="absolute bottom-10 right-20 w-80 h-80 bg-pink-400 rounded-full blur-3xl opacity-20" />

                {/* Edit Cover Button (Owner Only) */}
                {isOwner && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="absolute top-6 right-6 px-4 py-2 bg-white/10 dark:bg-zinc-900/10 backdrop-blur-3xl border border-white/30 dark:border-white/20 rounded-xl font-medium text-white hover:bg-white/20 transition-all flex items-center gap-2"
                    >
                        <Camera className="w-4 h-4" />
                        Edit Cover
                    </motion.button>
                )}

                {/* Profile Content */}
                <div className="absolute bottom-0 left-0 right-0 px-8 pb-6">
                    <div className="max-w-7xl mx-auto flex items-end justify-between">
                        {/* Left: Avatar & Info */}
                        <div className="flex items-end gap-6">
                            {/* Profile Picture */}
                            <div className="relative">
                                <div className="w-40 h-40 rounded-full border-4 border-white/20 dark:border-white/10 overflow-hidden backdrop-blur-3xl shadow-2xl bg-white/10">
                                    {recruiter.photoURL ? (
                                        <Image
                                            src={recruiter.photoURL}
                                            alt={recruiter.displayName}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-5xl font-bold">
                                            {recruiter.displayName?.[0]?.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                {isOwner && (
                                    <button className="absolute bottom-2 right-2 p-2 bg-white/20 dark:bg-zinc-900/20 backdrop-blur-2xl border border-white/30 rounded-full shadow-lg hover:scale-105 hover:bg-white/30 transition-all">
                                        <Camera className="w-5 h-5 text-white" />
                                    </button>
                                )}
                            </div>

                            {/* Name & Title */}
                            <div className="mb-4">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-4xl font-bold text-white drop-shadow-lg">
                                        {recruiter.displayName}
                                    </h1>
                                    {/* Recruiter Badge */}
                                    <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-sm font-bold rounded-full shadow-lg flex items-center gap-1">
                                        <Briefcase className="w-4 h-4" />
                                        RECRUITER
                                    </span>
                                </div>
                                <p className="text-lg text-white/90 font-medium mt-1 drop-shadow">
                                    Talent Acquisition Specialist
                                </p>
                            </div>
                        </div>

                        {/* Right: Stats & Actions */}
                        <div className="flex flex-col items-end gap-4 mb-4">
                            {/* Stats Cards */}
                            <div className="flex items-center gap-3">
                                {/* Placements */}
                                <div className="px-6 py-3 bg-white/15 dark:bg-zinc-900/15 backdrop-blur-3xl border border-white/30 dark:border-white/20 rounded-2xl text-center min-w-[100px] shadow-lg">
                                    <div className="text-2xl font-bold text-white drop-shadow">
                                        {recruiter.placementsCount || 0}
                                    </div>
                                    <div className="text-xs text-white/70 font-medium">Placements</div>
                                </div>
                                {/* Avg Response */}
                                <div className="px-6 py-3 bg-white/15 dark:bg-zinc-900/15 backdrop-blur-3xl border border-white/30 dark:border-white/20 rounded-2xl text-center min-w-[100px] shadow-lg">
                                    <div className="text-2xl font-bold text-white drop-shadow">
                                        {recruiter.averageResponseTime || 0}h
                                    </div>
                                    <div className="text-xs text-white/70 font-medium">Avg Response</div>
                                </div>
                                {/* Rating */}
                                <div className="px-6 py-3 bg-white/15 dark:bg-zinc-900/15 backdrop-blur-3xl border border-white/30 dark:border-white/20 rounded-2xl text-center min-w-[100px] shadow-lg">
                                    <div className="text-2xl font-bold text-white drop-shadow">
                                        {recruiter.stats.averageRating.toFixed(1)} ★
                                    </div>
                                    <div className="text-xs text-white/70 font-medium">Rating</div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3">
                                {isOwner ? (
                                    <>
                                        <motion.button
                                            onClick={() => setShowEditModal(true)}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="px-6 py-3 bg-white/20 dark:bg-zinc-900/20 backdrop-blur-3xl border border-white/30 text-white rounded-xl font-medium hover:bg-white/30 transition-all flex items-center gap-2 shadow-lg"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit Profile
                                        </motion.button>
                                        <motion.button
                                            onClick={() => setShowPrivacySettings(!showPrivacySettings)}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="px-6 py-3 bg-white/15 dark:bg-zinc-900/15 backdrop-blur-3xl border border-white/30 rounded-xl font-medium hover:bg-white/25 transition-all text-white flex items-center gap-2 shadow-lg"
                                        >
                                            <Settings className="w-4 h-4" />
                                            Privacy
                                        </motion.button>
                                    </>
                                ) : (
                                    <>
                                        <motion.button
                                            onClick={() => setIsFollowing(!isFollowing)}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2 ${isFollowing
                                                ? 'bg-white/90 text-gray-900'
                                                : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                                                }`}
                                        >
                                            <Users className="w-4 h-4" />
                                            {isFollowing ? 'Following' : 'Follow'}
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="px-6 py-3 bg-white/20 backdrop-blur-3xl border border-white/30 rounded-xl font-medium hover:shadow-lg transition-all text-white flex items-center gap-2"
                                        >
                                            <Mail className="w-4 h-4" />
                                            Message
                                        </motion.button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Privacy Settings Modal */}
            <AnimatePresence>
                {showPrivacySettings && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
                        onClick={() => setShowPrivacySettings(false)}
                    >
                        <div onClick={(e) => e.stopPropagation()}>
                            <PrivacySettingsPanel
                                uid={recruiter.uid}
                                currentSettings={recruiter.privacySettings}
                                onClose={() => setShowPrivacySettings(false)}
                                onSave={(settings) => {
                                    setRecruiter({ ...recruiter, privacySettings: settings });
                                }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Profile Modal */}
            {showEditModal && (
                <AdvancedProfileEditor
                    user={recruiter as any}
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    onUpdate={(updatedData) => {
                        setRecruiter({ ...recruiter, ...updatedData });
                        setShowEditModal(false);
                    }}
                />
            )}

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Sidebar */}
                    <div className="space-y-6">
                        {/* About */}
                        <div className="profile-section">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">About</h3>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {recruiter.bio || 'No bio added yet.'}
                            </p>
                        </div>

                        {/* Specializations */}
                        <div className="profile-section">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Specializations</h3>
                            <div className="flex flex-wrap gap-2">
                                {recruiter.specializations?.map((spec, index) => (
                                    <motion.span
                                        key={spec}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-700 dark:text-purple-300 rounded-xl text-sm font-medium border border-purple-200 dark:border-purple-800 hover:shadow-md transition-shadow"
                                    >
                                        {spec}
                                    </motion.span>
                                ))}
                                {(!recruiter.specializations || recruiter.specializations.length === 0) && (
                                    <span className="text-gray-500 text-sm italic">No specializations listed</span>
                                )}
                            </div>
                        </div>

                        {/* Stats Summary */}
                        <div className="profile-section">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Target className="w-5 h-5 text-purple-600" />
                                Performance Stats
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Time on Connekt
                                    </span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {recruiter.stats.timeOnPlatform || 0} days
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" />
                                        Profile Views
                                    </span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {recruiter.stats.profileViews || 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                        <Award className="w-4 h-4" />
                                        Total Placements
                                    </span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {recruiter.placementsCount || 0}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="profile-section">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Connect</h3>
                            <div className="space-y-3">
                                {recruiter.socialLinks?.website && (
                                    <a
                                        href={recruiter.socialLinks.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors group"
                                    >
                                        <Globe className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm truncate">{recruiter.socialLinks.website.replace(/^https?:\/\//, '')}</span>
                                    </a>
                                )}
                                {recruiter.socialLinks?.linkedin && (
                                    <a
                                        href={recruiter.socialLinks.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-[#0077b5] transition-colors group"
                                    >
                                        <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm">LinkedIn</span>
                                    </a>
                                )}
                                {recruiter.socialLinks?.twitter && (
                                    <a
                                        href={recruiter.socialLinks.twitter}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-[#1da1f2] transition-colors group"
                                    >
                                        <Twitter className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm">Twitter</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Content Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Custom Sections would go here */}

                        {/* Reviews & Ratings */}
                        <ReviewSection
                            profileUid={recruiter.uid}
                            currentUserUid={isOwner ? undefined : recruiter.uid}
                            isOwner={isOwner}
                            averageRating={recruiter.stats.averageRating}
                            totalRatings={recruiter.stats.totalRatings}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
