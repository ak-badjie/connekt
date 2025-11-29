'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Calendar, Mail, Edit, Briefcase, GraduationCap,
    Star, Github, Linkedin, Twitter, Globe, Camera, Video,
    Award, Users, TrendingUp, Clock, Target, Play, Settings,
    Plus, Link as LinkIcon, Heart, MessageCircle
} from 'lucide-react';
import { ExtendedUserProfile } from '@/lib/types/profile.types';
import { ProfileService } from '@/lib/services/profile-service';
import { ReviewSection } from './ReviewSection';
import { PrivacySettingsPanel } from './PrivacySettingsPanel';

interface UserProfileProps {
    user: ExtendedUserProfile;
    isOwner: boolean;
}

export function UserProfile({ user: initialUser, isOwner }: UserProfileProps) {
    const [user, setUser] = useState(initialUser);
    const [showPrivacySettings, setShowPrivacySettings] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);

    useEffect(() => {
        // Load projects and tasks
        loadProjects();
        loadTasks();

        // Increment profile views if not owner
        if (!isOwner) {
            ProfileService.incrementProfileViews(user.uid);
        }
    }, [user.uid, isOwner]);

    const loadProjects = async () => {
        const projectsData = await ProfileService.getUserProjects(user.uid);
        setProjects(projectsData);
    };

    const loadTasks = async () => {
        const tasksData = await ProfileService.getUserTasks(user.username);
        setTasks(tasksData);
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const calculatePlatformTime = () => {
        return user.stats.timeOnPlatform || 0;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-teal-950">
            {/* Header Section - Matches Reference Image */}
            <div className="relative h-80 overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <Image
                        src={user.coverImage || '/profile_background.png'}
                        alt="Cover"
                        fill
                        className="object-cover"
                        priority
                    />
                    {/* Gradient Overlay for better text visibility */}
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-400/30 via-purple-400/30 to-blue-400/30" />
                </div>

                {/* Decorative Blur Circles */}
                <div className="absolute top-10 left-20 w-64 h-64 bg-purple-400 rounded-full blur-3xl opacity-20" />
                <div className="absolute bottom-10 right-20 w-80 h-80 bg-blue-400 rounded-full blur-3xl opacity-20" />

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
                                    {user.photoURL ? (
                                        <Image
                                            src={user.photoURL}
                                            alt={user.displayName}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-5xl font-bold">
                                            {user.displayName?.[0]?.toUpperCase()}
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
                                        {user.displayName}
                                    </h1>
                                    {/* PRO Badge */}
                                    <span className="px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-bold rounded-full shadow-lg">
                                        PRO ⚡
                                    </span>
                                </div>
                                <p className="text-lg text-white/90 font-medium mt-1 drop-shadow">
                                    {user.title || 'Connekt Member'}
                                </p>
                                {user.location && (
                                    <div className="flex items-center gap-2 text-white/80 mt-2">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-sm drop-shadow">{user.location}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Stats & Actions */}
                        <div className="flex flex-col items-end gap-4 mb-4">
                            {/* Stats Cards */}
                            <div className="flex items-center gap-3">
                                {/* Followers */}
                                <div className="px-6 py-3 bg-white/15 dark:bg-zinc-900/15 backdrop-blur-3xl border border-white/30 dark:border-white/20 rounded-2xl text-center min-w-[100px] shadow-lg">
                                    <div className="text-2xl font-bold text-white drop-shadow">
                                        {user.stats.followers || 0}
                                    </div>
                                    <div className="text-xs text-white/70 font-medium">Followers</div>
                                </div>
                                {/* Following */}
                                <div className="px-6 py-3 bg-white/15 dark:bg-zinc-900/15 backdrop-blur-3xl border border-white/30 dark:border-white/20 rounded-2xl text-center min-w-[100px] shadow-lg">
                                    <div className="text-2xl font-bold text-white drop-shadow">
                                        {user.stats.following || 0}
                                    </div>
                                    <div className="text-xs text-white/70 font-medium">Following</div>
                                </div>
                                {/* Likes / Projects */}
                                <div className="px-6 py-3 bg-white/15 dark:bg-zinc-900/15 backdrop-blur-3xl border border-white/30 dark:border-white/20 rounded-2xl text-center min-w-[100px] shadow-lg">
                                    <div className="text-2xl font-bold text-white drop-shadow">
                                        {user.stats.projectsCompleted}
                                    </div>
                                    <div className="text-xs text-white/70 font-medium">Projects</div>
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
                                                : 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white'
                                                }`}
                                        >
                                            <Users className="w-4 h-4" />
                                            {isFollowing ? 'Following' : 'Follow'}
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="px-6 py-3 glass-card-strong rounded-xl font-medium hover:shadow-lg transition-all text-white flex items-center gap-2"
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
                                uid={user.uid}
                                currentSettings={user.privacySettings}
                                onClose={() => setShowPrivacySettings(false)}
                                onSave={(settings) => {
                                    setUser({ ...user, privacySettings: settings });
                                }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content - Full Scroll Layout */}
            <div className="max-w-7xl mx-auto px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Sidebar */}
                    <div className="space-y-6">
                        {/* Platform Stats */}
                        <div className="profile-section space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Target className="w-5 h-5 text-teal-600" />
                                Platform Stats
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Time on Connekt
                                    </span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {calculatePlatformTime()} days
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                        <Star className="w-4 h-4" />
                                        Average Rating
                                    </span>
                                    <span className="font-semibold text-amber-500">
                                        {user.stats.averageRating.toFixed(1)} ★
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" />
                                        Profile Views
                                    </span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {user.stats.profileViews || 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                        <Award className="w-4 h-4" />
                                        Tasks Completed
                                    </span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {user.stats.tasksCompleted}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* About */}
                        <div className="profile-section">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">About</h3>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {user.bio || 'No bio added yet.'}
                            </p>
                        </div>

                        {/* Skills */}
                        <div className="profile-section">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Skills & Expertise</h3>
                            <div className="flex flex-wrap gap-2">
                                {user.skills?.map((skill, index) => (
                                    <motion.span
                                        key={skill}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="px-4 py-2 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 text-teal-700 dark:text-teal-300 rounded-xl text-sm font-medium border border-teal-200 dark:border-teal-800 hover:shadow-md transition-shadow"
                                    >
                                        {skill}
                                    </motion.span>
                                ))}
                                {(!user.skills || user.skills.length === 0) && (
                                    <span className="text-gray-500 text-sm italic">No skills listed</span>
                                )}
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="profile-section">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Connect</h3>
                            <div className="space-y-3">
                                {user.socialLinks?.website && (
                                    <a
                                        href={user.socialLinks.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors group"
                                    >
                                        <Globe className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm truncate">{user.socialLinks.website.replace(/^https?:\/\//, '')}</span>
                                    </a>
                                )}
                                {user.socialLinks?.linkedin && (
                                    <a
                                        href={user.socialLinks.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-[#0077b5] transition-colors group"
                                    >
                                        <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm">LinkedIn</span>
                                    </a>
                                )}
                                {user.socialLinks?.twitter && (
                                    <a
                                        href={user.socialLinks.twitter}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-[#1da1f2] transition-colors group"
                                    >
                                        <Twitter className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm">Twitter</span>
                                    </a>
                                )}
                                {user.socialLinks?.github && (
                                    <a
                                        href={user.socialLinks.github}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors group"
                                    >
                                        <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm">GitHub</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Content Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Video Intro */}
                        {user.videoIntro && (
                            <div className="profile-section">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Video className="w-6 h-6 text-teal-600" />
                                    Video Introduction
                                </h3>
                                <div className="aspect-video rounded-2xl overflow-hidden bg-black relative group">
                                    <video
                                        src={user.videoIntro}
                                        controls
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                </div>
                            </div>
                        )}

                        {/* Experience */}
                        <div className="profile-section">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Briefcase className="w-6 h-6 text-teal-600" />
                                    Work Experience
                                </h3>
                                {isOwner && (
                                    <button className="px-4 py-2 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-xl transition-colors flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        Add
                                    </button>
                                )}
                            </div>

                            <div className="space-y-6">
                                {user.experience?.map((exp, index) => (
                                    <motion.div
                                        key={exp.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="relative pl-8 border-l-2 border-teal-200 dark:border-teal-800"
                                    >
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-teal-500 border-4 border-white dark:border-zinc-900" />
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">{exp.title}</h4>
                                        <p className="text-teal-600 font-medium">{exp.company}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                            {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                                        </p>
                                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                            {exp.description}
                                        </p>
                                        {exp.skills && exp.skills.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {exp.skills.map((skill) => (
                                                    <span
                                                        key={skill}
                                                        className="px-3 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                                {(!user.experience || user.experience.length === 0) && (
                                    <p className="text-gray-500 italic text-center py-8">No experience added yet.</p>
                                )}
                            </div>
                        </div>

                        {/* Education */}
                        <div className="profile-section">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <GraduationCap className="w-6 h-6 text-teal-600" />
                                    Education
                                </h3>
                                {isOwner && (
                                    <button className="px-4 py-2 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-xl transition-colors flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        Add
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                {user.education?.map((edu, index) => (
                                    <motion.div
                                        key={edu.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="glass-card-subtle p-5 rounded-2xl"
                                    >
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">{edu.school}</h4>
                                        <p className="text-teal-600 font-medium">{edu.degree} in {edu.field}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(edu.startDate)} - {edu.current ? 'Present' : formatDate(edu.endDate)}
                                        </p>
                                    </motion.div>
                                ))}
                                {(!user.education || user.education.length === 0) && (
                                    <p className="text-gray-500 italic text-center py-8">No education added yet.</p>
                                )}
                            </div>
                        </div>

                        {/* Reviews & Ratings */}
                        <ReviewSection
                            profileUid={user.uid}
                            currentUserUid={isOwner ? undefined : user.uid}
                            isOwner={isOwner}
                            averageRating={user.stats.averageRating}
                            totalRatings={user.stats.totalRatings}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
