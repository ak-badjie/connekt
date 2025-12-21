'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    X, Phone, Video, Search, Bell, Ban, ThumbsDown, Trash2,
    Image as ImageIcon, FileText, Link as LinkIcon, MessageSquare
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/toast/toast';
import {
    EnrichedConversation,
    ParticipantInfo,
    blockUserInConversation
} from '@/lib/services/realtime-service';
import { ProfileService } from '@/lib/services/profile-service';
import { ExtendedUserProfile } from '@/lib/types/profile.types';

interface UserDetailScreenProps {
    conversation: EnrichedConversation;
    onClose: () => void;
}

export default function UserDetailScreen({
    conversation,
    onClose
}: UserDetailScreenProps) {
    const { user } = useAuth();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<'media' | 'files' | 'links'>('media');
    const [profile, setProfile] = useState<ExtendedUserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Get other participant
    const otherId = conversation.members.find(id => id !== user?.uid) || '';
    const enrichedParticipant = conversation.enrichedParticipants?.[otherId];
    const memberDetail = conversation.memberDetails?.[otherId];

    // Load full profile
    useEffect(() => {
        const loadProfile = async () => {
            if (!otherId) return;
            setLoading(true);
            try {
                const fullProfile = await ProfileService.getUserProfile(otherId);
                setProfile(fullProfile);
            } catch (error) {
                console.error('Failed to load profile:', error);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, [otherId]);

    // Display info with fallbacks
    const displayName = enrichedParticipant?.displayName || memberDetail?.username || 'User';
    const displayPhoto = enrichedParticipant?.photoURL || memberDetail?.avatarUrl || '/default-avatar.png';
    const displayEmail = enrichedParticipant?.connectMail || profile?.email || '';
    const displayBio = profile?.bio || '';
    const displayRole = enrichedParticipant?.workspaceRole;
    const displayType = enrichedParticipant?.workspaceType;
    const displayJobTitle = enrichedParticipant?.jobTitle || '';

    const handleBlock = async () => {
        if (!user) return;
        if (confirm(`Block ${displayName}? They won't be able to message you.`)) {
            await blockUserInConversation(conversation.id, user.uid);
            toast.success('Blocked', `${displayName} has been blocked.`);
            onClose();
        }
    };

    return (
        <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full md:w-[380px] bg-white border-l border-gray-100 h-full flex flex-col z-30 shadow-2xl"
        >
            {/* Header */}
            <div className="p-4 flex items-center gap-3 border-b border-gray-100 bg-gray-50/50">
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>
                <h2 className="font-bold text-gray-800">Contact Info</h2>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {/* Profile */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-emerald-400 to-amber-300 mb-4 shadow-lg">
                        <img
                            src={displayPhoto}
                            alt={displayName}
                            className="w-full h-full rounded-full object-cover border-4 border-white"
                        />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 text-center">{displayName}</h2>

                    {/* Role/Type badges */}
                    {(displayRole || displayType) && (
                        <div className="flex items-center gap-2 mt-2">
                            {displayRole && (
                                <span className={`text-xs px-2 py-0.5 rounded font-medium ${displayRole === 'owner' ? 'bg-amber-100 text-amber-700' :
                                    displayRole === 'admin' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-600'
                                    }`}>
                                    {displayRole}
                                </span>
                            )}
                            {displayType && (
                                <span className={`text-xs px-2 py-0.5 rounded font-medium ${displayType === 'freelancer'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-teal-100 text-teal-700'
                                    }`}>
                                    {displayType}
                                </span>
                            )}
                        </div>
                    )}

                    {displayJobTitle && (
                        <p className="text-gray-500 text-sm font-medium mt-1">{displayJobTitle}</p>
                    )}

                    {displayEmail && (
                        <p className="text-emerald-600 text-sm mt-1">{displayEmail}</p>
                    )}

                    {displayBio && (
                        <p className="text-gray-600 text-sm text-center mt-3 px-4">{displayBio}</p>
                    )}

                    {/* Quick Actions */}
                    <div className="flex gap-4 mt-6 w-full justify-center">
                        <button className="flex flex-col items-center gap-1 text-gray-600 hover:text-emerald-600 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <Phone size={20} />
                            </div>
                            <span className="text-xs font-medium">Audio</span>
                        </button>
                        <button className="flex flex-col items-center gap-1 text-gray-600 hover:text-emerald-600 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <Video size={20} />
                            </div>
                            <span className="text-xs font-medium">Video</span>
                        </button>
                        <button className="flex flex-col items-center gap-1 text-gray-600 hover:text-emerald-600 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <Search size={20} />
                            </div>
                            <span className="text-xs font-medium">Search</span>
                        </button>
                    </div>
                </div>

                <div className="h-2 bg-gray-50 -mx-6 mb-6" />

                {/* Media / Files / Links */}
                <div className="mb-6">
                    <div className="flex gap-6 border-b border-gray-100 pb-2 mb-4">
                        {(['media', 'files', 'links'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setActiveTab(t)}
                                className={`text-sm font-bold capitalize pb-2 relative ${activeTab === t ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {t}
                                {activeTab === t && (
                                    <motion.div
                                        layoutId="user-detail-tab"
                                        className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="min-h-[100px]">
                        {activeTab === 'media' && (
                            <div className="text-center text-gray-400 text-sm py-4">
                                No shared media yet
                            </div>
                        )}
                        {activeTab === 'files' && (
                            <div className="text-center text-gray-400 text-sm py-4">
                                No shared files yet
                            </div>
                        )}
                        {activeTab === 'links' && (
                            <div className="text-center text-gray-400 text-sm py-4">
                                No shared links yet
                            </div>
                        )}
                    </div>
                </div>

                <div className="h-2 bg-gray-50 -mx-6 mb-6" />

                {/* Settings */}
                <div className="space-y-2">
                    <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                        <div className="flex items-center gap-3 text-gray-700">
                            <Bell size={20} />
                            <span className="font-medium">Mute Notifications</span>
                        </div>
                        <div className="w-10 h-6 bg-gray-200 rounded-full relative">
                            <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1 shadow-sm" />
                        </div>
                    </button>
                </div>

                <div className="h-2 bg-gray-50 -mx-6 my-6" />

                {/* Danger Zone */}
                <div className="space-y-2">
                    <button
                        onClick={handleBlock}
                        className="w-full flex items-center gap-3 p-3 hover:bg-red-50 text-red-600 rounded-xl transition-colors font-medium"
                    >
                        <Ban size={20} />
                        Block {displayName}
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 hover:bg-red-50 text-red-600 rounded-xl transition-colors font-medium">
                        <ThumbsDown size={20} />
                        Report Contact
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 text-gray-600 rounded-xl transition-colors font-medium mt-4">
                        <Trash2 size={20} />
                        Delete Chat
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
