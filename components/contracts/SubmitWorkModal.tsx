import React, { useState } from 'react';
import { X, Upload, Link as LinkIcon, FileText, Image, Video, Loader2 } from 'lucide-react';
import { TaskService } from '@/lib/services/task-service';

interface SubmitWorkModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskId?: string;
    projectId?: string;
    userId: string;
    username: string;
    onSubmitSuccess: () => void;
}

export default function SubmitWorkModal({
    isOpen,
    onClose,
    taskId,
    projectId,
    userId,
    username,
    onSubmitSuccess
}: SubmitWorkModalProps) {
    const [screenshots, setScreenshots] = useState<File[]>([]);
    const [videos, setVideos] = useState<File[]>([]);
    const [links, setLinks] = useState<string[]>(['']);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            if (type === 'image') {
                setScreenshots(prev => [...prev, ...filesArray]);
            } else {
                setVideos(prev => [...prev, ...filesArray]);
            }
        }
    };

    const removeFile = (index: number, type: 'image' | 'video') => {
        if (type === 'image') {
            setScreenshots(prev => prev.filter((_, i) => i !== index));
        } else {
            setVideos(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleLinkChange = (index: number, value: string) => {
        const newLinks = [...links];
        newLinks[index] = value;
        setLinks(newLinks);
    };

    const addLinkField = () => {
        setLinks([...links, '']);
    };

    const removeLinkField = (index: number) => {
        const newLinks = links.filter((_, i) => i !== index);
        setLinks(newLinks);
    };

    const handleSubmit = async () => {
        if (!taskId) {
            alert('Project POP submission is not yet fully supported in this UI version.');
            return;
        }

        setIsSubmitting(true);
        try {
            await TaskService.submitProofOfTask(taskId, userId, username, {
                screenshots,
                videos,
                links: links.filter(l => l.trim() !== ''),
                notes
            });
            onSubmitSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to submit work:', error);
            alert('Failed to submit work. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-[#1A1A1A] p-6 text-left shadow-xl transition-all border border-white/10 animate-in fade-in zoom-in-95 duration-200 block overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium leading-6 text-white">
                        Submit {taskId ? 'Proof of Task (POT)' : 'Proof of Project (POP)'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Screenshots */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Screenshots</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            {screenshots.map((file, idx) => (
                                <div key={idx} className="relative group aspect-square bg-gray-800 rounded-lg overflow-hidden border border-white/5">
                                    <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                                    <button onClick={() => removeFile(idx, 'image')} className="absolute top-1 right-1 bg-red-500/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <X size={12} className="text-white" />
                                    </button>
                                </div>
                            ))}
                            <label className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-gray-700 hover:border-blue-500/50 hover:bg-white/5 transition-all cursor-pointer">
                                <Image className="text-gray-500 mb-1" size={24} />
                                <span className="text-xs text-gray-500">Add Image</span>
                                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileChange(e, 'image')} />
                            </label>
                        </div>
                    </div>

                    {/* Videos */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Screen Recordings / Videos</label>
                        <div className="flex flex-wrap gap-4">
                            {videos.map((file, idx) => (
                                <div key={idx} className="relative group bg-gray-800 rounded-lg p-2 border border-white/5 flex items-center pr-8">
                                    <Video size={16} className="text-blue-400 mr-2" />
                                    <span className="text-xs text-gray-300 truncate max-w-[150px]">{file.name}</span>
                                    <button onClick={() => removeFile(idx, 'video')} className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-red-400">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            <label className="flex items-center px-3 py-2 rounded-lg border border-dashed border-gray-700 hover:border-blue-500/50 hover:bg-white/5 transition-all cursor-pointer">
                                <Upload size={16} className="text-gray-500 mr-2" />
                                <span className="text-xs text-gray-500">Upload Video</span>
                                <input type="file" accept="video/*" multiple className="hidden" onChange={(e) => handleFileChange(e, 'video')} />
                            </label>
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">External Links (Figma, GitHub, etc.)</label>
                        <div className="space-y-2">
                            {links.map((link, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <div className="relative flex-1">
                                        <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input
                                            type="text"
                                            value={link}
                                            onChange={(e) => handleLinkChange(idx, e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    {links.length > 1 && (
                                        <button onClick={() => removeLinkField(idx)} className="text-gray-500 hover:text-red-400">
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button onClick={addLinkField} className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                                + Add another link
                            </button>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Completion Notes</label>
                        <div className="relative">
                            <FileText size={16} className="absolute left-3 top-3 text-gray-500" />
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                                className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
                                placeholder="Describe what you completed, any challenges, or specific details for review..."
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || (screenshots.length === 0 && videos.length === 0 && links.every(l => !l.trim()))}
                        className="px-6 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                        {isSubmitting ? 'Submitting...' : 'Submit Completion'}
                    </button>
                </div>
            </div>
        </div>
    );
}
