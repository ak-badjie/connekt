'use client';

import { useState, useRef } from 'react';
import { X, Image as ImageIcon, Upload, Loader2 } from 'lucide-react';
import { ProfileService } from '@/lib/services/profile-service';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface PortfolioFormProps {
    userId: string;
    onSave: (item: any) => void;
    onCancel: () => void;
}

export function PortfolioForm({ userId, onSave, onCancel }: PortfolioFormProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            const url = URL.createObjectURL(selectedFile);
            setPreviewUrl(url);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setSaving(true);
        try {
            const media = await ProfileService.addPortfolioMedia(userId, file, { title, description });
            if (media) {
                onSave(media);
            }
        } catch (error) {
            console.error('Error uploading portfolio item:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <ImageIcon size={20} className="text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Add Portfolio Item
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
                    {/* File Upload */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-video rounded-xl border-2 border-dashed border-gray-300 dark:border-zinc-700 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all relative overflow-hidden group"
                    >
                        {previewUrl ? (
                            <>
                                <Image
                                    src={previewUrl}
                                    alt="Preview"
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <Upload className="w-8 h-8" />
                                </div>
                            </>
                        ) : (
                            <div className="text-center p-4">
                                <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                                    <Upload size={24} />
                                </div>
                                <p className="font-medium text-gray-700 dark:text-gray-300">Click to upload image or video</p>
                                <p className="text-sm text-gray-500">Max 50MB</p>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={handleFileSelect}
                            required={!file}
                        />
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                            placeholder="Project Title"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-white resize-none"
                            placeholder="Brief description of the project..."
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
                            disabled={saving || !file}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : 'Add to Portfolio'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
