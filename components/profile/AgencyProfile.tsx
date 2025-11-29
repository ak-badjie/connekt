'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Mail, Edit, Briefcase, Users, Star, Globe, Linkedin,
    Twitter, Camera, Award, TrendingUp, Clock, Target, Settings,
    Plus, Building2, Phone, Calendar, ExternalLink, CheckCircle2
} from 'lucide-react';
import { ExtendedAgencyProfile } from '@/lib/types/profile.types';
import { ProfileService } from '@/lib/services/profile-service';
import { ReviewSection } from './ReviewSection';
import { PrivacySettingsPanel } from './PrivacySettingsPanel';

interface AgencyProfileProps {
    agency: ExtendedAgencyProfile;
    isOwner: boolean;
}

export function AgencyProfile({ agency: initialAgency, isOwner }: AgencyProfileProps) {
    const [agency, setAgency] = useState(initialAgency);
    const [showPrivacySettings, setShowPrivacySettings] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        // Increment profile views if not owner
        if (!isOwner && agency.id) {
            ProfileService.incrementProfileViews(agency.id);
        }
    }, [agency.id, isOwner]);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-blue-950">
            {/* Corporate Header Section */}
            <div className="relative h-96 overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <Image
                        src={agency.coverImage || '/profile_background.png'}
                        alt="Agency Cover"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-20 left-32 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-10" />
                <div className="absolute bottom-20 right-32 w-96 h-96 bg-teal-500 rounded-full blur-3xl opacity-10" />

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

                {/* Agency Branding */}
                <div className="absolute bottom-0 left-0 right-0 px-8 pb-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-end justify-between">
                            {/* Left: Logo & Info */}
                            <div className="flex items-end gap-8">
                                {/* Agency Logo */}
                                <div className="relative">
                                    <div className="w-44 h-44 rounded-3xl border-4 border-white/20 dark:border-white/10 overflow-hidden backdrop-blur-3xl shadow-2xl bg-white/10">
                                        {agency.logoUrl ? (
                                            <Image
                                                src={agency.logoUrl}
                                                alt={agency.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center">
                                                <Building2 className="w-20 h-20 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    {isOwner && (
                                        <button className="absolute bottom-3 right-3 p-2 bg-white/20 dark:bg-zinc-900/20 backdrop-blur-2xl border border-white/30 rounded-xl shadow-lg hover:scale-105 hover:bg-white/30 transition-all">
                                            <Camera className="w-5 h-5 text-white" />
                                        </button>
                                    )}
                                </div>

                                {/* Agency Name & Details */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-4 mb-2">
                                        <h1 className="text-5xl font-bold text-white drop-shadow-lg">
                                            {agency.name}
                                        </h1>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-8 h-8 text-blue-400 fill-blue-400" />
                                            <span className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-teal-500 text-white text-sm font-bold rounded-full shadow-lg">
                                                VERIFIED
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xl text-white/90 font-medium drop-shadow mb-3">
                                        {agency.industry || 'Digital Agency'}
                                    </p>
                                    <div className="flex items-center gap-6 text-white/80">
                                        {agency.location && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-5 h-5" />
                                                <span className="text-sm drop-shadow">{agency.location}</span>
                                            </div>
                                        )}
                                        {agency.foundedYear && (
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-5 h-5" />
                                                <span className="text-sm drop-shadow">Est. {agency.foundedYear}</span>
                                            </div>
                                        )}
                                        {agency.size && (
                                            <div className="flex items-center gap-2">
                                                <Users className="w-5 h-5" />
                                                <span className="text-sm drop-shadow">{agency.size} employees</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Stats & Actions */}
                            <div className="flex flex-col items-end gap-4 mb-6">
                                {/* Stats Cards - Corporate Style */}
                                <div className="flex items-center gap-3">
                                    <div className="px-8 py-4 bg-white/15 dark:bg-zinc-900/15 backdrop-blur-3xl border border-white/30 dark:border-white/20 rounded-2xl text-center min-w-[120px] shadow-lg">
                                        <div className="text-3xl font-bold text-white drop-shadow">
                                            {agency.stats?.projectsCompleted || 0}
                                        </div>
                                        <div className="text-xs text-white/70 font-medium uppercase tracking-wider">Projects</div>
                                    </div>
                                    <div className="px-8 py-4 bg-white/15 dark:bg-zinc-900/15 backdrop-blur-3xl border border-white/30 dark:border-white/20 rounded-2xl text-center min-w-[120px] shadow-lg">
                                        <div className="text-3xl font-bold text-white drop-shadow">
                                            {agency.members?.length || 0}
                                        </div>
                                        <div className="text-xs text-white/70 font-medium uppercase tracking-wider">Team</div>
                                    </div>
                                    <div className="px-8 py-4 bg-white/15 dark:bg-zinc-900/15 backdrop-blur-3xl border border-white/30 dark:border-white/20 rounded-2xl text-center min-w-[120px] shadow-lg">
                                        <div className="text-3xl font-bold text-white drop-shadow flex items-center justify-center gap-2">
                                            {agency.stats?.averageRating?.toFixed(1) || '0.0'}
                                            <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                                        </div>
                                        <div className="text-xs text-white/70 font-medium uppercase tracking-wider">Rating</div>
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
                                                Settings
                                            </motion.button>
                                        </>
                                    ) : (
                                        <>
                                            <motion.button
                                                onClick={() => setIsFollowing(!isFollowing)}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className={`px-8 py-3 rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2 ${isFollowing
                                                    ? 'bg-white/20 text-white border border-white/30'
                                                    : 'bg-gradient-to-r from-blue-500 to-teal-500 text-white'
                                                    }`}
                                            >
                                                {isFollowing ? 'Following' : 'Follow'}
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="px-8 py-3 bg-white/20 dark:bg-zinc-900/20 backdrop-blur-3xl border border-white/30 rounded-xl font-medium hover:bg-white/30 transition-all text-white flex items-center gap-2 shadow-lg"
                                            >
                                                <Mail className="w-4 h-4" />
                                                Contact
                                            </motion.button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Privacy Settings Modal */}
            <AnimatePresence>
                {showPrivacySettings && agency.id && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
                        onClick={() => setShowPrivacySettings(false)}
                    >
                        <div onClick={(e) => e.stopPropagation()}>
                            <PrivacySettingsPanel
                                uid={agency.id}
                                currentSettings={agency.privacySettings}
                                onClose={() => setShowPrivacySettings(false)}
                                onSave={(settings) => {
                                    setAgency({ ...agency, privacySettings: settings });
                                }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content - Corporate Layout */}
            <div className="max-w-7xl mx-auto px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - About & Services */}
                    <div className="space-y-6">
                        {/* About Agency */}
                        <div className="profile-section">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-blue-600" />
                                About Us
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {agency.description || 'No description added yet.'}
                            </p>
                        </div>

                        {/* Services */}
                        <div className="profile-section">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Our Services</h3>
                            <div className="flex flex-wrap gap-2">
                                {agency.services?.map((service, index) => (
                                    <motion.span
                                        key={service}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="px-4 py-2 bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 text-blue-700 dark:text-blue-300 rounded-xl text-sm font-medium border border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow"
                                    >
                                        {service}
                                    </motion.span>
                                ))}
                                {(!agency.services || agency.services.length === 0) && (
                                    <span className="text-gray-500 text-sm italic">No services listed</span>
                                )}
                            </div>
                        </div>

                        {/* Contact & Website */}
                        <div className="profile-section">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Connect With Us</h3>
                            <div className="space-y-3">
                                {agency.website && (
                                    <a
                                        href={agency.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                                    >
                                        <Globe className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm truncate">{agency.website.replace(/^https?:\/\//, '')}</span>
                                        <ExternalLink className="w-4 h-4 ml-auto" />
                                    </a>
                                )}
                                {agency.socialLinks?.linkedin && (
                                    <a
                                        href={agency.socialLinks.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-[#0077b5] transition-colors group"
                                    >
                                        <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm">LinkedIn</span>
                                    </a>
                                )}
                                {agency.socialLinks?.twitter && (
                                    <a
                                        href={agency.socialLinks.twitter}
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

                        {/* Stats Summary */}
                        <div className="profile-section">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Target className="w-5 h-5 text-blue-600" />
                                Agency Stats
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Time on Connekt
                                    </span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {agency.stats?.timeOnPlatform || 0} days
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" />
                                        Profile Views
                                    </span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {agency.stats?.profileViews || 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                        <Award className="w-4 h-4" />
                                        Response Rate
                                    </span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {agency.stats?.responseRate || 0}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Portfolio & Reviews */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Portfolio */}
                        <div className="profile-section">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Briefcase className="w-6 h-6 text-blue-600" />
                                    Portfolio
                                </h3>
                                {isOwner && (
                                    <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        Add Work
                                    </button>
                                )}
                            </div>

                            {agency.portfolio && agency.portfolio.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {agency.portfolio.map((item, index) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="aspect-square rounded-2xl overflow-hidden glass-card hover:scale-105 transition-transform cursor-pointer"
                                        >
                                            <Image
                                                src={item.url}
                                                alt={item.title || 'Portfolio Item'}
                                                width={300}
                                                height={300}
                                                className="w-full h-full object-cover"
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 glass-card-subtle rounded-2xl">
                                    <Briefcase className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400 text-lg">No portfolio items yet</p>
                                </div>
                            )}
                        </div>

                        {/* Reviews & Ratings */}
                        {agency.id && (
                            <ReviewSection
                                profileUid={agency.id}
                                currentUserUid={isOwner ? undefined : agency.id}
                                isOwner={isOwner}
                                averageRating={agency.stats?.averageRating || 0}
                                totalRatings={agency.stats?.totalRatings || 0}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
