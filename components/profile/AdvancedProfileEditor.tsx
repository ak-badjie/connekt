'use client';

import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { X, GripVertical, Plus, Upload, Video, Image as ImageIcon, Link as LinkIcon, Save, Loader2 } from 'lucide-react';
import { ProfileMediaService } from '@/lib/services/profile-media-service';
import { ProfileService } from '@/lib/services/profile-service';
import { ExtendedUserProfile } from '@/lib/types/profile.types';
import { SortableSection } from './SortableSection';
import { MediaUploader } from './MediaUploader';
import { CustomSectionCreator } from './CustomSectionCreator';

interface AdvancedProfileEditorProps {
    user: ExtendedUserProfile;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (data: any) => void;
}

export function AdvancedProfileEditor({ user, isOpen, onClose, onUpdate }: AdvancedProfileEditorProps) {
    const [sections, setSections] = useState(getInitialSections());
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'basic' | 'media' | 'sections' | 'privacy'>('basic');
    const [showCustomSectionCreator, setShowCustomSectionCreator] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function getInitialSections() {
        // Build sections from user.sectionOrder or use defaults
        const defaultSections = [
            { id: 'about', title: 'About', type: 'default' as const },
            { id: 'experience', title: 'Work Experience', type: 'default' as const },
            { id: 'education', title: 'Education', type: 'default' as const },
            { id: 'skills', title: 'Skills', type: 'default' as const },
            { id: 'portfolio', title: 'Portfolio', type: 'default' as const },
            { id: 'projects', title: 'Projects', type: 'default' as const },
            { id: 'tasks', title: 'Tasks', type: 'default' as const },
        ];

        // Add custom sections
        if (user.customSections) {
            const customSections = user.customSections.map(section => ({
                id: section.id,
                title: section.title,
                type: 'custom' as const,
                data: section,
            }));
            return [...defaultSections, ...customSections];
        }

        return defaultSections;
    }

    function handleDragEnd(event: any) {
        const { active, over } = event;

        if (active.id !== over.id) {
            setSections((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);

                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            // Save section order
            const sectionOrder = sections.map((section, index) => ({
                sectionId: section.id,
                type: section.type,
                order: index,
            }));

            await ProfileService.updateSectionOrder(user.uid, sectionOrder);
            onUpdate({ sectionOrder });
            onClose();
        } catch (error) {
            console.error('Error saving profile:', error);
        } finally {
            setSaving(false);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl border  border-gray-200 dark:border-zinc-800 flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-zinc-900 p-6 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Profile</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Customize your profile with drag-and-drop sections
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 px-6">
                    <div className="flex items-center gap-4">
                        {[
                            { id: 'basic', label: 'Basic Info' },
                            { id: 'media', label: 'Media & Videos' },
                            { id: 'sections', label: 'Section Order' },
                            { id: 'privacy', label: 'Privacy' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                        ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'basic' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Display Name
                                    </label>
                                    <input
                                        type="text"
                                        defaultValue={user.displayName}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-teal-500/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Professional Title
                                    </label>
                                    <input
                                        type="text"
                                        defaultValue={user.title}
                                        placeholder="e.g. Senior Graphic Designer"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-teal-500/20 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Bio
                                </label>
                                <textarea
                                    defaultValue={user.bio}
                                    rows={5}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'media' && (
                        <div className="space-y-6">
                            <MediaUploader
                                userId={user.uid}
                                type="video-intro"
                                username={user.username}
                                maxSizeMB={50}
                                acceptedTypes="video/*"
                                onUploadComplete={(url) => onUpdate({ videoIntro: url })}
                                onUploadError={(err) => console.error('Video upload error:', err)}
                            />
                        </div>
                    )}

                    {activeTab === 'sections' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Section Order</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Drag and drop to reorder sections on your profile
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowCustomSectionCreator(true)}
                                    className="px-4 py-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Section
                                </button>
                            </div>

                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-2">
                                        {sections.map((section) => (
                                            <SortableSection key={section.id} id={section.id} title={section.title} type={section.type} />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}

                    {activeTab === 'privacy' && (
                        <div>
                            <p className="text-gray-600 dark:text-gray-400">Privacy settings coming soon...</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 dark:bg-zinc-900/50 p-6 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors border border-gray-300 dark:border-zinc-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Custom Section Creator Modal */}
            {showCustomSectionCreator && (
                <CustomSectionCreator
                    uid={user.uid}
                    onClose={() => setShowCustomSectionCreator(false)}
                    on Created={(section) => {
                        setSections([...sections, {
                            id: section.id,
                            title: section.title,
                            type: 'custom',
                            data: section,
                        }]);
                        setShowCustomSectionCreator(false);
                    }}
                />
            )}
        </div>
    );
}
