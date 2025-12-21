'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Users, ChevronDown, ChevronUp, MessageSquare,
    Calendar, Briefcase, ExternalLink, Settings
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { EnrichedConversation, ParticipantInfo, getOrCreateConversation } from '@/lib/services/realtime-service';
import { WorkspaceService } from '@/lib/services/workspace-service';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { Workspace, Project, WorkspaceMember, ProjectMember } from '@/lib/types/workspace.types';
import { getDisplayAvatar, getInitials } from '@/lib/utils/generateInitialAvatar';

interface GroupDetailScreenProps {
    conversation: EnrichedConversation;
    onClose: () => void;
    onOpenDirectChat: (userId: string) => void;
}

export default function GroupDetailScreen({
    conversation,
    onClose,
    onOpenDirectChat
}: GroupDetailScreenProps) {
    const { user } = useAuth();
    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedMembers, setExpandedMembers] = useState(true);

    const isWorkspaceChat = conversation.type === 'workspace';
    const isProjectChat = conversation.type === 'project';

    // Load workspace/project details
    useEffect(() => {
        const loadDetails = async () => {
            setLoading(true);
            try {
                if (isWorkspaceChat && conversation.workspaceId) {
                    const ws = await WorkspaceService.getWorkspace(conversation.workspaceId);
                    setWorkspace(ws);
                } else if (isProjectChat && conversation.projectId) {
                    const proj = await EnhancedProjectService.getProject(conversation.projectId);
                    setProject(proj);
                    // Also load the parent workspace for project context
                    if (proj?.workspaceId) {
                        const ws = await WorkspaceService.getWorkspace(proj.workspaceId);
                        setWorkspace(ws);
                    }
                }
            } catch (error) {
                console.error('Failed to load group details:', error);
            } finally {
                setLoading(false);
            }
        };
        loadDetails();
    }, [conversation, isWorkspaceChat, isProjectChat]);

    // Get members list
    const members: (WorkspaceMember | ProjectMember)[] = isWorkspaceChat
        ? workspace?.members || []
        : project?.members || [];

    // Get display info
    const groupName = conversation.title || (isWorkspaceChat ? workspace?.name : project?.title) || 'Group';
    const groupDescription = conversation.description ||
        (isWorkspaceChat ? workspace?.description : project?.description) || '';
    const groupImage = conversation.photoUrl ||
        (isProjectChat ? project?.coverImage : undefined);

    const displayAvatar = groupImage || getDisplayAvatar(undefined, groupName, false);

    // Get role badge style
    const getRoleBadgeStyle = (role: string) => {
        switch (role) {
            case 'owner': return 'bg-amber-100 text-amber-700';
            case 'admin': return 'bg-blue-100 text-blue-700';
            case 'supervisor': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getTypeBadgeStyle = (type: string) => {
        return type === 'freelancer'
            ? 'bg-purple-100 text-purple-700'
            : 'bg-teal-100 text-teal-700';
    };

    // Handle member click - open direct chat
    const handleMemberClick = async (memberId: string) => {
        if (memberId === user?.uid) return; // Don't open chat with self
        onOpenDirectChat(memberId);
    };

    // Format date
    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'Unknown';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
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
                <h2 className="font-bold text-gray-800">
                    {isWorkspaceChat ? 'Workspace Info' : isProjectChat ? 'Project Info' : 'Group Info'}
                </h2>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Group Profile */}
                    <div className="flex flex-col items-center p-6 border-b border-gray-100">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-2xl overflow-hidden mb-4 shadow-lg ring-4 ring-white">
                            {groupImage ? (
                                <img
                                    src={groupImage}
                                    alt={groupName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div
                                    className="w-full h-full flex items-center justify-center text-white text-3xl font-bold"
                                    style={{
                                        background: isWorkspaceChat
                                            ? 'linear-gradient(135deg, #059669, #0D9488)'
                                            : 'linear-gradient(135deg, #7C3AED, #9333EA)'
                                    }}
                                >
                                    {getInitials(groupName)}
                                </div>
                            )}
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 text-center">{groupName}</h2>

                        <div className="flex items-center gap-2 mt-2">
                            <Users size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-500">
                                {members.length} member{members.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {groupDescription && (
                            <p className="text-sm text-gray-600 text-center mt-3 px-4">
                                {groupDescription}
                            </p>
                        )}

                        {/* View in Dashboard Button */}
                        {(isWorkspaceChat && conversation.workspaceId) && (
                            <a
                                href={`/workspaces/${conversation.workspaceId}`}
                                className="mt-4 flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 
                                         rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
                            >
                                <ExternalLink size={14} />
                                View Workspace
                            </a>
                        )}
                        {(isProjectChat && conversation.projectId) && (
                            <a
                                href={`/projects/${conversation.projectId}`}
                                className="mt-4 flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 
                                         rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                            >
                                <ExternalLink size={14} />
                                View Project
                            </a>
                        )}
                    </div>

                    {/* Project Details */}
                    {isProjectChat && project && (
                        <div className="p-4 border-b border-gray-100">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">Status</p>
                                    <p className="font-medium text-gray-900 capitalize">{project.status}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">Deadline</p>
                                    <p className="font-medium text-gray-900">
                                        {project.deadline || 'Not set'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Members Section */}
                    <div className="p-4">
                        <button
                            onClick={() => setExpandedMembers(!expandedMembers)}
                            className="w-full flex items-center justify-between py-2"
                        >
                            <span className="font-bold text-gray-800">
                                Team Members ({members.length})
                            </span>
                            {expandedMembers ? (
                                <ChevronUp size={20} className="text-gray-400" />
                            ) : (
                                <ChevronDown size={20} className="text-gray-400" />
                            )}
                        </button>

                        <AnimatePresence>
                            {expandedMembers && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="space-y-1 mt-2">
                                        {members.map((member) => {
                                            const isCurrentUser = member.userId === user?.uid;
                                            const enrichedInfo = conversation.enrichedParticipants?.[member.userId];

                                            return (
                                                <div
                                                    key={member.userId}
                                                    onClick={() => handleMemberClick(member.userId)}
                                                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isCurrentUser
                                                            ? 'bg-gray-50 cursor-default'
                                                            : 'hover:bg-gray-50 cursor-pointer'
                                                        }`}
                                                >
                                                    <img
                                                        src={enrichedInfo?.photoURL || '/default-avatar.png'}
                                                        alt={member.username}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-gray-900 truncate">
                                                                {member.username}
                                                                {isCurrentUser && (
                                                                    <span className="text-gray-400 text-xs ml-1">(you)</span>
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getRoleBadgeStyle(member.role)}`}>
                                                                {member.role}
                                                            </span>
                                                            {'type' in member && member.type && (
                                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getTypeBadgeStyle(member.type)}`}>
                                                                    {member.type}
                                                                </span>
                                                            )}
                                                            {member.jobTitle && (
                                                                <span className="text-xs text-gray-500">
                                                                    • {member.jobTitle}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {!isCurrentUser && (
                                                        <MessageSquare size={16} className="text-gray-400" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Metadata */}
                    <div className="p-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Calendar size={12} />
                            <span>
                                Created {formatDate(isWorkspaceChat ? workspace?.createdAt : project?.createdAt)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
