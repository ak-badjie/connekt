'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, Ban, User } from 'lucide-react';
import { ProfileService } from '@/lib/services/profile-service';
import { ExtendedUserProfile } from '@/lib/types/profile.types';

interface WidgetUserProfileProps {
    userId: string;
    onBack: () => void;
    onStartChat: () => void;
}

export default function WidgetUserProfile({ userId, onBack, onStartChat }: WidgetUserProfileProps) {
    const [profile, setProfile] = useState<ExtendedUserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await ProfileService.getUserProfile(userId);
                setProfile(data);
            } catch (error) {
                console.error('Failed to load profile:', error);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, [userId]);

    if (loading) {
        return (
            <div className="flex flex-col h-full bg-white">
                <div className="flex items-center gap-2 p-3 border-b border-gray-100">
                    <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600">
                        <ArrowLeft size={18} />
                    </button>
                    <h3 className="font-bold text-sm text-gray-900">Profile</h3>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-[#008080] border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col h-full bg-white">
                <div className="flex items-center gap-2 p-3 border-b border-gray-100">
                    <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600">
                        <ArrowLeft size={18} />
                    </button>
                    <h3 className="font-bold text-sm text-gray-900">Profile</h3>
                </div>
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                    User not found
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 50, opacity: 0 }}
            className="flex flex-col h-full bg-white"
        >
            {/* Header */}
            <div className="flex items-center gap-2 p-3 border-b border-gray-100">
                <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600">
                    <ArrowLeft size={18} />
                </button>
                <h3 className="font-bold text-sm text-gray-900">Contact Info</h3>
            </div>

            {/* Profile Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Avatar & Name Section */}
                <div className="flex flex-col items-center py-6 px-4 bg-gradient-to-b from-gray-50 to-white">
                    <img
                        src={profile.photoURL || '/default-avatar.png'}
                        alt={profile.displayName}
                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                    <h2 className="font-bold text-lg text-gray-900 mt-3">{profile.displayName || profile.username}</h2>
                    <p className="text-sm text-gray-500">@{profile.username}</p>
                    {profile.connectMail && (
                        <p className="text-xs text-[#008080] mt-1">{profile.connectMail}</p>
                    )}
                </div>

                {/* Info Section */}
                <div className="px-4 py-3 border-t border-gray-100">
                    {profile.bio && (
                        <div className="mb-4">
                            <p className="text-xs text-gray-400 uppercase font-bold mb-1">Bio</p>
                            <p className="text-sm text-gray-700">{profile.bio}</p>
                        </div>
                    )}

                    {profile.location && (
                        <div className="mb-4">
                            <p className="text-xs text-gray-400 uppercase font-bold mb-1">Location</p>
                            <p className="text-sm text-gray-700">{profile.location}</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="px-4 py-3 border-t border-gray-100 space-y-2">
                    <button
                        onClick={onStartChat}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#008080] text-white rounded-xl font-medium text-sm hover:bg-teal-700 transition-colors"
                    >
                        <MessageSquare size={16} />
                        Message
                    </button>

                    <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors">
                        <User size={16} />
                        View Full Profile
                    </button>

                    <button className="w-full flex items-center justify-center gap-2 py-2.5 text-red-500 hover:bg-red-50 rounded-xl font-medium text-sm transition-colors">
                        <Ban size={16} />
                        Block User
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
