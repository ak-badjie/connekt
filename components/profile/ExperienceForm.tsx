'use client';

import { useState } from 'react';
import { X, Plus, Briefcase } from 'lucide-react';
import { Experience } from '@/lib/types/profile.types';
import { ProfileService } from '@/lib/services/profile-service';
import { Button } from '@/components/ui/button';
import { Timestamp } from 'firebase/firestore';

interface ExperienceFormProps {
    userId: string;
    experience?: Experience;
    onSave: (exp: Experience) => void;
    onCancel: () => void;
}

export function ExperienceForm({ userId, experience, onSave, onCancel }: ExperienceFormProps) {
    const [formData, setFormData] = useState({
        title: experience?.title || '',
        company: experience?.company || '',
        location: experience?.location || '',
        startDate: experience?.startDate ? new Date(experience.startDate.seconds * 1000).toISOString().slice(0, 7) : '',
        endDate: experience?.endDate ? new Date(experience.endDate.seconds * 1000).toISOString().slice(0, 7) : '',
        current: experience?.current || false,
        description: experience?.description || '',
        skills: experience?.skills?.join(', ') || '',
    });
    const [saving, setSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const expData: Omit<Experience, 'id'> = {
                title: formData.title,
                company: formData.company,
                location: formData.location || undefined,
                startDate: Timestamp.fromDate(new Date(formData.startDate)),
                endDate: formData.current ? undefined : (formData.endDate ? Timestamp.fromDate(new Date(formData.endDate)) : undefined),
                current: formData.current,
                description: formData.description,
                skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
            };

            if (experience) {
                // Update existing
                await ProfileService.updateExperience(userId, experience.id, expData);
                onSave({ ...experience, ...expData });
            } else {
                // Add new
                const id = await ProfileService.addExperience(userId, expData);
                if (id) {
                    onSave({ id, ...expData });
                }
            }
        } catch (error) {
            console.error('Error saving experience:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#008080]/10 flex items-center justify-center">
                            <Briefcase size={20} className="text-[#008080]" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {experience ? 'Edit Experience' : 'Add Experience'}
                        </h3>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Job Title *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                            placeholder="e.g. Senior Virtual Assistant"
                        />
                    </div>

                    {/* Company */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Company *
                        </label>
                        <input
                            type="text"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                            placeholder="e.g. Acme Corp"
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Location
                        </label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                            placeholder="e.g. Remote, New York, NY"
                        />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Start Date *
                            </label>
                            <input
                                type="month"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                End Date
                            </label>
                            <input
                                type="month"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                disabled={formData.current}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-white disabled:opacity-50"
                            />
                        </div>
                    </div>

                    {/* Current */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="current"
                            checked={formData.current}
                            onChange={handleChange}
                            className="w-4 h-4 text-[#008080] border-gray-300 rounded focus:ring-[#008080]"
                        />
                        <label className="text-sm text-gray-700 dark:text-gray-300">
                            I currently work here
                        </label>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description *
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-white resize-none"
                            placeholder="Describe your responsibilities and achievements..."
                        />
                    </div>

                    {/* Skills */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Skills (comma-separated)
                        </label>
                        <input
                            type="text"
                            name="skills"
                            value={formData.skills}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                            placeholder="e.g. Project Management, Communication, Data Entry"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-zinc-800">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={saving}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={saving}
                            className="flex-1 bg-[#008080] hover:bg-teal-700 text-white"
                        >
                            {saving ? 'Saving...' : experience ? 'Update' : 'Add'} Experience
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
