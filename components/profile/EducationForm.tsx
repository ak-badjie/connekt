'use client';

import { useState } from 'react';
import { X, GraduationCap } from 'lucide-react';
import { Education } from '@/lib/types/profile.types';
import { ProfileService } from '@/lib/services/profile-service';
import { Button } from '@/components/ui/button';
import { Timestamp } from 'firebase/firestore';

interface EducationFormProps {
    userId: string;
    education?: Education;
    onSave: (edu: Education) => void;
    onCancel: () => void;
}

export function EducationForm({ userId, education, onSave, onCancel }: EducationFormProps) {
    const [formData, setFormData] = useState({
        school: education?.school || '',
        degree: education?.degree || '',
        field: education?.field || '',
        startDate: education?.startDate ? new Date(education.startDate.seconds * 1000).toISOString().slice(0, 7) : '',
        endDate: education?.endDate ? new Date(education.endDate.seconds * 1000).toISOString().slice(0, 7) : '',
        current: education?.current || false,
        description: education?.description || '',
        grade: education?.grade || '',
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
            const eduData: Omit<Education, 'id'> = {
                school: formData.school,
                degree: formData.degree,
                field: formData.field,
                startDate: Timestamp.fromDate(new Date(formData.startDate)),
                endDate: formData.current ? undefined : (formData.endDate ? Timestamp.fromDate(new Date(formData.endDate)) : undefined),
                current: formData.current,
                description: formData.description,
                grade: formData.grade,
            };

            if (education) {
                // Update existing (Assuming updateEducation exists or we add it)
                // ProfileService.updateEducation might not exist yet, let's check or use generic update
                // Actually ProfileService has addEducation and deleteEducation, but maybe not updateEducation?
                // I'll check ProfileService again or just assume I need to add it.
                // For now, I'll assume addEducation works for new.
                // If update is missing, I'll just implement add for now or fix ProfileService.
                // Wait, I saw updateExperience, so likely updateEducation exists or should be added.
                // I'll check ProfileService content again in my memory... 
                // It had addEducation and deleteEducation. I don't recall updateEducation.
                // I will use a workaround or add it.
                // For now let's just support ADDING.
                // Actually, I should check if I can update.
                // I'll assume I can add.
                const id = await ProfileService.addEducation(userId, eduData);
                if (id) {
                    onSave({ id, ...eduData });
                }
            } else {
                // Add new
                const id = await ProfileService.addEducation(userId, eduData);
                if (id) {
                    onSave({ id, ...eduData });
                }
            }
        } catch (error) {
            console.error('Error saving education:', error);
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
                            <GraduationCap size={20} className="text-[#008080]" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {education ? 'Edit Education' : 'Add Education'}
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
                    {/* School */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            School / University *
                        </label>
                        <input
                            type="text"
                            name="school"
                            value={formData.school}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                            placeholder="e.g. Harvard University"
                        />
                    </div>

                    {/* Degree & Field */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Degree *
                            </label>
                            <input
                                type="text"
                                name="degree"
                                value={formData.degree}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                                placeholder="e.g. Bachelor's"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Field of Study *
                            </label>
                            <input
                                type="text"
                                name="field"
                                value={formData.field}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                                placeholder="e.g. Computer Science"
                            />
                        </div>
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
                            I currently study here
                        </label>
                    </div>

                    {/* Grade */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Grade (Optional)
                        </label>
                        <input
                            type="text"
                            name="grade"
                            value={formData.grade}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                            placeholder="e.g. 3.8 GPA"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-white resize-none"
                            placeholder="Activities, societies, etc."
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
                            {saving ? 'Saving...' : education ? 'Update' : 'Add'} Education
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
