'use client';

import { useState } from 'react';
import { X, Link as LinkIcon, Image as ImageIcon, Calendar, Tag, Save, Loader2, Upload } from 'lucide-react';
import { ProfileService } from '@/lib/services/profile-service';
import { ProfileMediaService } from '@/lib/services/profile-media-service';

interface ExternalProjectFormProps {
    uid: string;
    onClose: () => void;
    onProjectAdded: (project: any) => void;
}

export function ExternalProjectForm({ uid, onClose, onProjectAdded }: ExternalProjectFormProps) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        url: '',
        technologies: [] as string[],
        role: '',
        startDate: '',
        endDate: '',
        status: 'completed' as 'active' | 'completed' | 'archived',
    });
    const [newTech, setNewTech] = useState('');
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const addTechnology = () => {
        if (newTech.trim() && !formData.technologies.includes(newTech.trim())) {
            setFormData({
                ...formData,
                technologies: [...formData.technologies, newTech.trim()],
            });
            setNewTech('');
        }
    };

    const removeTechnology = (tech: string) => {
        setFormData({
            ...formData,
            technologies: formData.technologies.filter(t => t !== tech),
        });
    };

    const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setMediaFiles(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.description) return;

        setSaving(true);
        try {
            // Upload media files if any
            const uploadedMedia = [];
            for (const file of mediaFiles) {
                const media = await ProfileMediaService.uploadPortfolioMedia(uid, file);
                if (media) uploadedMedia.push(media);
            }

            // Create external project entry
            const projectData = {
                ...formData,
                media: uploadedMedia,
                isExternal: true,
                isVisible: true,
                createdAt: new Date(),
            };

            // Here you would typically save to Firestore
            // For now, we'll just callback
            onProjectAdded(projectData);
            onClose();
        } catch (error) {
            console.error('Error adding external project:', error);
            alert('Failed to add project');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-zinc-800 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add External Project</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Showcase work done outside of Connekt
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Project Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Project Title *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            placeholder="e.g., E-commerce Website Redesign"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-teal-500/20 outline-none"
                        />
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
                            placeholder="Describe what you did, the challenges, and the results..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none"
                        />
                    </div>

                    {/* URL and Role */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Project URL
                            </label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="url"
                                    name="url"
                                    value={formData.url}
                                    onChange={handleChange}
                                    placeholder="https://example.com"
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-teal-500/20 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Your Role
                            </label>
                            <input
                                type="text"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                placeholder="e.g., Lead Designer, Developer"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-teal-500/20 outline-none"
                            />
                        </div>
                    </div>

                    {/* Dates and Status */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Start Date
                            </label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-teal-500/20 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                End Date
                            </label>
                            <input
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-teal-500/20 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-teal-500/20 outline-none"
                            >
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>

                    {/* Technologies */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Technologies/Skills Used
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {formData.technologies.map((tech) => (
                                <span
                                    key={tech}
                                    className="px-3 py-1.5 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 rounded-lg text-sm font-medium flex items-center gap-2"
                                >
                                    {tech}
                                    <button
                                        type="button"
                                        onClick={() => removeTechnology(tech)}
                                        className="hover:text-red-500"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newTech}
                                onChange={(e) => setNewTech(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                                placeholder="Add technology..."
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-teal-500/20 outline-none"
                            />
                            <button
                                type="button"
                                onClick={addTechnology}
                                className="px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Media Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Project Media (Images/Videos)
                        </label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl p-6 text-center hover:border-teal-500 dark:hover:border-teal-500 transition-colors">
                            <input
                                type="file"
                                multiple
                                accept="image/*,video/*"
                                onChange={handleMediaSelect}
                                className="hidden"
                                id="media-upload"
                            />
                            <label htmlFor="media-upload" className="cursor-pointer">
                                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                <p className="font-semibold text-gray-900 dark:text-white">Click to upload media</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {mediaFiles.length > 0 ? `${mediaFiles.length} file(s) selected` : 'Images and videos up to 500MB'}
                                </p>
                            </label>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-end gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors border border-gray-300 dark:border-zinc-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving || !formData.title || !formData.description}
                        className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Adding Project...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Add Project
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
