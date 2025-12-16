'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Calendar, Mail, Edit, Briefcase, GraduationCap,
    Star, Github, Linkedin, Twitter, Globe, Camera, Video,
    Award, Users, TrendingUp, Clock, Target, Play, Settings,
    Plus, Link as LinkIcon, Heart, MessageCircle, GripVertical, Sparkles,
    FileText, Lightbulb, ChevronDown, BadgeCheck, CheckSquare
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { ExtendedUserProfile } from '@/lib/types/profile.types';
import { ProfileService } from '@/lib/services/profile-service';
import { TaskService } from '@/lib/services/task-service';
import { SubscriptionTier } from '@/lib/types/subscription-tiers.types';
import { ReviewSection } from './ReviewSection';
import { PrivacySettingsPanel } from './PrivacySettingsPanel';
import { DraggableSection } from './DraggableSection';
import { TrailerVideoSection } from './TrailerVideoSection';
import { ExperienceForm } from './ExperienceForm';
import { EducationForm } from './EducationForm';
import { CustomSectionCreator } from './CustomSectionCreator';
import { AIResumeParserModal } from './ai/AIResumeParserModal';
import { AIBioEnhancer } from './ai/AIBioEnhancer';
import { AISkillSuggester } from './ai/AISkillSuggester';
import ConnektAIIcon from '@/components/branding/ConnektAIIcon';
import { useAIAccess } from '@/hooks/useAIAccess';
import { ProfilePictureUpload } from './ProfilePictureUpload';
import { DisplayNameEditor } from './DisplayNameEditor';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserProfileProps {
    user: ExtendedUserProfile;
    isOwner: boolean;
}

export function UserProfile({ user: initialUser, isOwner }: UserProfileProps) {
    const router = useRouter();
    const [user, setUser] = useState(initialUser);
    const [showPrivacySettings, setShowPrivacySettings] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [activeForm, setActiveForm] = useState<'experience' | 'education' | 'custom' | null>(null);
    const [showAIResumeParser, setShowAIResumeParser] = useState(false);
    const [showAIToolsMenu, setShowAIToolsMenu] = useState(false);
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [bioText, setBioText] = useState(user.bio || '');
    const [bioError, setBioError] = useState<string | null>(null);

    // FIX: Sync state when props change (data may load after initial render)
    useEffect(() => {
        if (initialUser) {
            setUser(initialUser);
            setBioText(initialUser.bio || '');

            // Initialize section order based on fetched user
            if (initialUser.sectionOrder && initialUser.sectionOrder.length > 0) {
                setSectionOrder(initialUser.sectionOrder.map(s => s.sectionId));
            }
        }
    }, [initialUser]);

    // Recruiter Stats State
    const [recruiterStats, setRecruiterStats] = useState({
        tasksCreated: 0,
        talentsWorkedWith: 0
    });

    // AI Access Hook
    const aiAccess = useAIAccess();

    // Profile Picture Upload State
    const [showPictureUpload, setShowPictureUpload] = useState(false);
    const [uploadingPicture, setUploadingPicture] = useState(false);

    // Display Name Edit State
    const [editingDisplayName, setEditingDisplayName] = useState(false);

    // Section Order State
    const [sectionOrder, setSectionOrder] = useState<string[]>([]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        // Initialize section order
        if (user.sectionOrder && user.sectionOrder.length > 0) {
            setSectionOrder(user.sectionOrder.map(s => s.sectionId));
        } else {
            // Default order
            setSectionOrder(['video_intro', 'experience', 'education', 'projects', 'reviews']);
        }

        // Load projects and tasks
        loadProjects();
        loadTasks();

        if (user.role === 'recruiter') {
            loadRecruiterData();
        }

        // Increment profile views if not owner
        if (!isOwner) {
            ProfileService.incrementProfileViews(user.uid);
        }
    }, [user.uid, isOwner]);

    const loadProjects = async () => {
        const projectsData = await ProfileService.getUserProjects(user.uid);
        setProjects(projectsData);
        return projectsData; // Return for chaining
    };

    const loadTasks = async () => {
        if (!user.username) return;
        const tasksData = await ProfileService.getUserTasks(user.username);
        setTasks(tasksData);
    };

    const loadRecruiterData = async () => {
        try {
            // Fetch created tasks
            const createdTasks = await TaskService.getCreatedTasks(user.uid);

            // Calculate talents (needs projects)
            // We can re-fetch or wait for projects state, but safer to fetch here or use the result of loadProjects if we chained it.
            // Since we can't easily chain in useEffect without refactoring, let's just fetch projects again or rely on the service cache if any (none here).
            // Actually, let's just fetch projects here again to be safe and independent, or use the service.
            const projectsData = await ProfileService.getUserProjects(user.uid);

            const uniqueMembers = new Set<string>();
            projectsData.forEach((p: any) => {
                if (p.members) {
                    p.members.forEach((m: any) => uniqueMembers.add(m.userId));
                }
            });

            setRecruiterStats({
                tasksCreated: createdTasks.length,
                talentsWorkedWith: uniqueMembers.size
            });
        } catch (error) {
            console.error("Error loading recruiter stats", error);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setSectionOrder((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over.id as string);
                const newOrder = arrayMove(items, oldIndex, newIndex);

                // Persist to Firestore
                const orderObjects = newOrder.map((id, index) => ({
                    sectionId: id,
                    type: id.startsWith('custom_') ? 'custom' : 'default',
                    order: index
                }));

                // We cast to any because the type definition might need update in the service call
                ProfileService.updateSectionOrder(user.uid, orderObjects as any);

                return newOrder;
            });
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const handleProfilePictureUpload = async (file: File, previewUrl: string) => {
        setUploadingPicture(true);
        try {
            const photoURL = await ProfileService.uploadProfilePicture(user.uid, file);
            if (photoURL) {
                setUser({ ...user, photoURL });
                // Also update users collection
                await updateDoc(doc(db, 'users', user.uid), { photoURL });
                setShowPictureUpload(false);
            }
        } catch (error) {
            console.error('Profile picture upload failed:', error);
        } finally {
            setUploadingPicture(false);
        }
    };

    const handleDisplayNameSave = async (newName: string) => {
        try {
            const success = await ProfileService.updateUserProfile(user.uid, {
                displayName: newName
            });

            if (success) {
                setUser({ ...user, displayName: newName });
                // Also update users collection
                await updateDoc(doc(db, 'users', user.uid), { displayName: newName });
                setEditingDisplayName(false);
            }
        } catch (error) {
            console.error('Display name update failed:', error);
            throw error;
        }
    };

    const calculatePlatformTime = () => {
        return user.stats.timeOnPlatform || 0;
    };

    // Render helper for sections
    const renderSection = (sectionId: string) => {
        switch (sectionId) {
            case 'video_intro':
                return (
                    <DraggableSection key={sectionId} id={sectionId} isOwner={isOwner} title="Video Intro">
                        <TrailerVideoSection
                            uid={user.uid}
                            videoUrl={user.videoIntro}
                            isOwner={isOwner}
                            username={user.username}
                            onUpdate={(url) => setUser({ ...user, videoIntro: url })}
                        />
                    </DraggableSection>
                );

            case 'experience':
                return (
                    <DraggableSection key={sectionId} id={sectionId} isOwner={isOwner} title="Experience">
                        <div className="profile-section">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Briefcase className="w-6 h-6 text-teal-600" />
                                    Work Experience
                                </h3>
                                {isOwner && (
                                    <button
                                        onClick={() => setActiveForm('experience')}
                                        className="px-4 py-2 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-xl transition-colors flex items-center gap-2"
                                    >
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
                    </DraggableSection>
                );

            case 'education':
                // Hide Education for Agencies
                if ((user as any).agencyType) return null;
                return (
                    <DraggableSection key={sectionId} id={sectionId} isOwner={isOwner} title="Education">
                        <div className="profile-section">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <GraduationCap className="w-6 h-6 text-teal-600" />
                                    Education
                                </h3>
                                {isOwner && (
                                    <button
                                        onClick={() => setActiveForm('education')}
                                        className="px-4 py-2 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-xl transition-colors flex items-center gap-2"
                                    >
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
                    </DraggableSection>
                );

            case 'projects':
                const isRecruiter = user.role === 'recruiter';
                const isAgency = !!(user as any).agencyType;
                const sectionTitle = isRecruiter ? "Active Job Postings" : isAgency ? "Agency Portfolio" : "Projects";

                // For recruiters, filter to show only active projects (jobs)
                const displayProjects = isRecruiter
                    ? projects.filter(p => p.status === 'active')
                    : projects;

                return (
                    <DraggableSection key={sectionId} id={sectionId} isOwner={isOwner} title={sectionTitle}>
                        <div className="profile-section">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Briefcase className="w-6 h-6 text-teal-600" />
                                    {sectionTitle}
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {displayProjects.map((project) => (
                                    <div key={project.id} className="glass-card p-4 rounded-xl">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-gray-900 dark:text-white">{project.title}</h4>
                                            {isRecruiter && (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                                    Hiring
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{project.description}</p>
                                        {isRecruiter && project.budget && (
                                            <div className="mt-3 text-sm font-medium text-teal-600">
                                                Budget: ${project.budget}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {displayProjects.length === 0 && (
                                    <p className="text-gray-500 italic text-center py-8 col-span-2">
                                        {isRecruiter ? "No active job postings." : "No projects to display."}
                                    </p>
                                )}
                            </div>
                        </div>
                    </DraggableSection>
                );

            case 'reviews':
                return (
                    <DraggableSection key={sectionId} id={sectionId} isOwner={isOwner} title="Reviews">
                        <ReviewSection
                            profileUid={user.uid}
                            currentUserUid={isOwner ? undefined : user.uid}
                            isOwner={isOwner}
                            averageRating={user.stats.averageRating}
                            totalRatings={user.stats.totalRatings}
                        />
                    </DraggableSection>
                );

            case 'members':
                // Only for Agencies
                if (!(user as any).agencyType) return null;
                return (
                    <DraggableSection key={sectionId} id={sectionId} isOwner={isOwner} title="Agency Members">
                        <div className="profile-section">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <Users className="w-6 h-6 text-teal-600" />
                                Agency Members
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Mock Members for now - In real app, map through user.members */}
                                {(user as any).members?.map((member: any, idx: number) => (
                                    <div key={idx} className="glass-card p-4 rounded-xl flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden relative">
                                            {member.photoURL ? (
                                                <Image src={member.photoURL} alt={member.name} fill className="object-cover" />
                                            ) : (
                                                <span className="text-lg font-bold">{member.name?.[0]}</span>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white">{member.name}</h4>
                                            <p className="text-sm text-teal-600">{member.role}</p>
                                        </div>
                                    </div>
                                ))}
                                {(!(user as any).members || (user as any).members.length === 0) && (
                                    <p className="text-gray-500 italic">No members visible.</p>
                                )}
                            </div>
                        </div>
                    </DraggableSection>
                );

            default:
                // Handle custom sections
                if (sectionId.startsWith('custom_')) {
                    // Find the custom section data
                    const customSection = user.customSections?.find(s => s.id === sectionId);
                    if (!customSection) return null;

                    return (
                        <DraggableSection key={sectionId} id={sectionId} isOwner={isOwner} title={customSection.title}>
                            <div className="profile-section">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                    {customSection.title}
                                </h3>
                                {/* Render content based on type - simplified for now */}
                                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {customSection.type === 'text' && customSection.content.richText}
                                    {/* Add other types here */}
                                </div>
                            </div>
                        </DraggableSection>
                    );
                }
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-teal-950">
            {/* Header Section */}
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
                                            alt={user.displayName || user.username || 'User profile picture'}
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
                                    <button
                                        onClick={() => setShowPictureUpload(true)}
                                        className="absolute bottom-2 right-2 p-2 bg-white/20 dark:bg-zinc-900/20 backdrop-blur-2xl border border-white/30 rounded-full shadow-lg hover:scale-105 hover:bg-white/30 transition-all"
                                    >
                                        <Camera className="w-5 h-5 text-white" />
                                    </button>
                                )}
                            </div>

                            {/* Name & Title */}
                            <div className="mb-4">
                                {editingDisplayName ? (
                                    <DisplayNameEditor
                                        currentName={user.displayName}
                                        onSave={handleDisplayNameSave}
                                        onCancel={() => setEditingDisplayName(false)}
                                    />
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-4xl font-bold text-white drop-shadow-lg flex items-center gap-2">
                                            {user.displayName}
                                            {/* Verification Badge - Only for Pro Plus */}
                                            {user.subscription?.tier === SubscriptionTier.PRO_PLUS && (
                                                <BadgeCheck className="w-8 h-8 text-blue-500 fill-white" />
                                            )}
                                        </h1>
                                        {/* Edit Name Button (Owner Only) */}
                                        {isOwner && (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setEditingDisplayName(true)}
                                                className="p-2 bg-white/15 dark:bg-zinc-900/15 backdrop-blur-2xl border border-white/30 rounded-full shadow-lg hover:bg-white/25 transition-all"
                                                title="Edit name"
                                            >
                                                <Edit className="w-5 h-5 text-white" />
                                            </motion.button>
                                        )}
                                        {/* PRO Badge - For Pro and Pro Plus */}
                                        {(user.subscription?.tier === SubscriptionTier.PRO || user.subscription?.tier === SubscriptionTier.PRO_PLUS) && (
                                            <span className="px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-bold rounded-full shadow-lg">
                                                PRO ⚡
                                            </span>
                                        )}
                                    </div>
                                )}
                                <p className="text-lg text-white/90 font-medium mt-1 drop-shadow">
                                    {user.title || (user.role === 'recruiter' ? 'Recruiter' : user.role === 'va' ? 'Virtual Assistant' : 'Connekt Member')}
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
                                        {/* Privacy Settings Button */}
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

            {/* Experience Form */}
            {activeForm === 'experience' && (
                <ExperienceForm
                    userId={user.uid}
                    onSave={(exp) => {
                        const newExperience = [...(user.experience || []), exp];
                        setUser({ ...user, experience: newExperience });
                        setActiveForm(null);
                    }}
                    onCancel={() => setActiveForm(null)}
                />
            )}

            {/* Education Form */}
            {activeForm === 'education' && (
                <EducationForm
                    userId={user.uid}
                    onSave={(edu) => {
                        const newEducation = [...(user.education || []), edu];
                        setUser({ ...user, education: newEducation });
                        setActiveForm(null);
                    }}
                    onCancel={() => setActiveForm(null)}
                />
            )}

            {/* Custom Section Creator */}
            {activeForm === 'custom' && (
                <CustomSectionCreator
                    uid={user.uid}
                    onSave={(section) => {
                        const newSections = [...(user.customSections || []), section];
                        const newOrder = [...sectionOrder, section.id];
                        setUser({ ...user, customSections: newSections });
                        setSectionOrder(newOrder);

                        // Also update order in DB
                        const orderObjects = newOrder.map((id, index) => ({
                            sectionId: id,
                            type: id.startsWith('custom_') ? 'custom' : 'default',
                            order: index
                        }));
                        ProfileService.updateSectionOrder(user.uid, orderObjects as any);

                        setActiveForm(null);
                    }}
                    onCancel={() => setActiveForm(null)}
                />
            )}

            {/* AI Resume Parser Modal */}
            {showAIResumeParser && (
                <AIResumeParserModal
                    userId={user.uid}
                    onClose={() => setShowAIResumeParser(false)}
                    onParsed={(profileData) => {
                        // Apply parsed data to user profile
                        const updatedUser = { ...user, ...profileData };
                        setUser(updatedUser);

                        // Save to database
                        ProfileService.updateUserProfile(user.uid, profileData).catch(error => {
                            console.error('Failed to save parsed profile data:', error);
                        });
                    }}
                />
            )}

            {/* Profile Picture Upload Modal */}
            {showPictureUpload && (
                <ProfilePictureUpload
                    currentPhotoURL={user.photoURL}
                    currentDisplayName={user.displayName}
                    onUpload={handleProfilePictureUpload}
                    isLoading={uploadingPicture}
                    showModal={true}
                    onClose={() => setShowPictureUpload(false)}
                />
            )}

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

                                {/* Recruiter Specific Stats */}
                                {user.role === 'recruiter' && (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                                <Briefcase className="w-4 h-4" />
                                                Projects Created
                                            </span>
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {projects.length}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                                <CheckSquare className="w-4 h-4" />
                                                Tasks Created
                                            </span>
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {recruiterStats.tasksCreated}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                                <Users className="w-4 h-4" />
                                                Talents Worked With
                                            </span>
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {recruiterStats.talentsWorkedWith}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                                <Briefcase className="w-4 h-4" />
                                                Active Jobs
                                            </span>
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {projects.filter(p => p.status === 'active').length}
                                            </span>
                                        </div>
                                    </>
                                )}

                                {/* Agency Specific Stats */}
                                {(user as any).agencyType && (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                                <Users className="w-4 h-4" />
                                                Team Size
                                            </span>
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {(user as any).members?.length || 0}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                                <Briefcase className="w-4 h-4" />
                                                Projects Managed
                                            </span>
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {projects.length}
                                            </span>
                                        </div>
                                    </>
                                )}

                                {/* VA Specific Stats (Default) */}
                                {user.role !== 'recruiter' && !(user as any).agencyType && (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                                <Star className="w-4 h-4" />
                                                Average Rating
                                            </span>
                                            <span className="font-semibold text-amber-500">
                                                {(user.stats?.averageRating || 0).toFixed(1)} ★
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
                                    </>
                                )}

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" />
                                        Profile Views
                                    </span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {user.stats.profileViews || 0}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Parse Resume - At Top of All Sections */}
                        {isOwner && (
                            <button
                                onClick={() => setShowAIResumeParser(true)}
                                className="mb-6 w-full px-5 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                            >
                                <ConnektAIIcon className="w-5 h-5" />
                                Parse Resume
                            </button>
                        )}

                        {/* AI Tools Quick Actions - REMOVED */}
                        {false && isOwner && (
                            <div className="profile-section bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm relative z-[5]">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <ConnektAIIcon className="w-5 h-5" />
                                    Quick Actions
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {/* Parse Resume */}
                                    <button
                                        onClick={() => setShowAIResumeParser(true)}
                                        className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all shadow-sm hover:shadow-md"
                                    >
                                        <ConnektAIIcon className="w-5 h-5" />
                                        Parse Resume
                                    </button>

                                    {/* View All Tools */}
                                    <button
                                        onClick={() => router.push('intro/ai/catalog')}
                                        className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all shadow-sm hover:shadow-md"
                                    >
                                        <ConnektAIIcon className="w-5 h-5" />
                                        View All Tools
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* About */}
                        <div className="profile-section">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">About</h3>
                                {isOwner && (
                                    <button
                                        onClick={() => setIsEditingBio(!isEditingBio)}
                                        className="px-3 py-1.5 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                                    >
                                        <Edit className="w-4 h-4" />
                                        {isEditingBio ? 'Cancel' : 'Edit'}
                                    </button>
                                )}
                            </div>

                            {isEditingBio ? (
                                <div>
                                    {/* AI Bio Enhancer - At Top */}
                                    {aiAccess.hasAccess && (
                                        <AIBioEnhancer
                                            currentBio={bioText}
                                            skills={user.skills}
                                            experience={user.experience}
                                            userId={user.uid}
                                            onEnhanced={(enhanced) => setBioText(enhanced)}
                                            onError={(error) => setBioError(error)}
                                        />
                                    )}

                                    <textarea
                                        value={bioText}
                                        onChange={(e) => setBioText(e.target.value)}
                                        placeholder="Write a compelling bio about yourself..."
                                        className="w-full p-4 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none"
                                        rows={5}
                                    />

                                    {bioError && (
                                        <p className="text-sm text-red-600 mt-2">{bioError}</p>
                                    )}

                                    <div className="flex gap-3 mt-3">
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await ProfileService.updateUserProfile(user.uid, { bio: bioText });
                                                    setUser({ ...user, bio: bioText });
                                                    setIsEditingBio(false);
                                                    setBioError(null);
                                                } catch (error: any) {
                                                    setBioError(error.message || 'Failed to save bio');
                                                }
                                            }}
                                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-colors"
                                        >
                                            Save Bio
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {user.bio || 'No bio added yet.'}
                                </p>
                            )}
                        </div>

                        {/* Skills - Hidden for Recruiters */}
                        {user.role !== 'recruiter' && (
                            <div className="profile-section">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Skills & Expertise</h3>

                                {/* AI Skill Suggester - Only for Profile Owner */}
                                {isOwner && (
                                    <AISkillSuggester
                                        currentSkills={user.skills || []}
                                        bio={user.bio}
                                        experience={user.experience}
                                        userId={user.uid}
                                        onSkillsAdded={async (newSkills) => {
                                            // Combine existing and new skills, remove duplicates
                                            const combinedSkills = [...(user.skills || []), ...newSkills];
                                            const uniqueSkills = Array.from(new Set(combinedSkills));

                                            // Update database
                                            try {
                                                await ProfileService.updateUserProfile(user.uid, { skills: uniqueSkills });
                                                // Update local state
                                                setUser({ ...user, skills: uniqueSkills });
                                            } catch (error) {
                                                console.error('Failed to save skills:', error);
                                            }
                                        }}
                                        onError={(error) => console.error('Skill suggestion error:', error)}
                                    />
                                )}

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
                        )}

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

                    {/* Main Content Column - Draggable Canvas */}
                    <div className="lg:col-span-2 space-y-8">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={sectionOrder}
                                strategy={verticalListSortingStrategy}
                            >
                                {sectionOrder.map((sectionId) => renderSection(sectionId))}
                            </SortableContext>
                        </DndContext>

                        {/* Add Section Button (Owner Only) */}
                        {isOwner && (
                            <motion.button
                                onClick={() => setActiveForm('custom')}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl flex items-center justify-center gap-2 text-gray-500 hover:text-teal-600 hover:border-teal-500/50 hover:bg-teal-50/50 dark:hover:bg-teal-900/10 transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="font-medium">Add Custom Section</span>
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
