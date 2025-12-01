'use client';

import { useState } from 'react';
import { X, Type, Image as ImageIcon, Link as LinkIcon, Award, MessageSquare, Clock, BarChart } from 'lucide-react';
import { ProfileService } from '@/lib/services/profile-service';
import { Button } from '@/components/ui/button';
import { CustomSectionType } from '@/lib/types/custom-sections.types';

interface CustomSectionCreatorProps {
    uid: string;
    onSave: (section: any) => void;
    onCancel: () => void;
}

const SECTION_TYPES: { type: CustomSectionType; label: string; icon: any; description: string }[] = [
    { type: 'text', label: 'Text Block', icon: Type, description: 'Add a rich text area for bio, about, or any content.' },
    { type: 'media_gallery', label: 'Media Gallery', icon: ImageIcon, description: 'Showcase images and videos.' },
    { type: 'links', label: 'Links', icon: LinkIcon, description: 'List of important links.' },
    { type: 'achievements', label: 'Achievements', icon: Award, description: 'Highlight awards and certifications.' },
    { type: 'testimonials', label: 'Testimonials', icon: MessageSquare, description: 'Show what others say about you.' },
    { type: 'timeline', label: 'Timeline', icon: Clock, description: 'Show a chronological history.' },
    { type: 'stats', label: 'Statistics', icon: BarChart, description: 'Display key metrics and numbers.' },
];

export function CustomSectionCreator({ uid, onSave, onCancel }: CustomSectionCreatorProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedType, setSelectedType] = useState<CustomSectionType | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState(''); // For text type
    const [saving, setSaving] = useState(false);

    const handleTypeSelect = (type: CustomSectionType) => {
        setSelectedType(type);
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedType) return;

        setSaving(true);
        try {
            const sectionData = {
                type: selectedType,
                title,
                visibility: 'public',
                order: 99, // Will be handled by the list order
                content: {
                    richText: content // Only supporting text for now
                }
            };

            const id = await ProfileService.addCustomSection(uid, sectionData);
            if (id) {
                onSave({ id, ...sectionData });
            }
        } catch (error) {
            console.error('Error creating section:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {step === 1 ? 'Choose Section Type' : 'Configure Section'}
                    </h3>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {step === 1 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {SECTION_TYPES.map((item) => (
                                <button
                                    key={item.type}
                                    onClick={() => handleTypeSelect(item.type)}
                                    className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-all text-left group"
                                >
                                    <div className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-lg group-hover:bg-teal-100 dark:group-hover:bg-teal-900/30 transition-colors">
                                        <item.icon className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-teal-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{item.label}</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Section Title *
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                                    placeholder="e.g. My Philosophy"
                                />
                            </div>

                            {selectedType === 'text' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Content *
                                    </label>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        required
                                        rows={6}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-white resize-none"
                                        placeholder="Write your content here..."
                                    />
                                </div>
                            ) : (
                                <div className="p-8 text-center border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-xl">
                                    <p className="text-gray-500">Configuration for {selectedType} is coming soon.</p>
                                </div>
                            )}

                            <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-zinc-800">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setStep(1)}
                                    disabled={saving}
                                    className="flex-1"
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={saving || (selectedType === 'text' && !content)}
                                    className="flex-1 bg-[#008080] hover:bg-teal-700 text-white"
                                >
                                    {saving ? 'Creating...' : 'Create Section'}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
