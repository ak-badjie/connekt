'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { TaskService } from '@/lib/services/task-service';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { Task, Project } from '@/lib/types/workspace.types';
import {
    Loader2, ArrowLeft, Clock, DollarSign, Calendar, AlertCircle,
    CheckCircle2, XCircle, Upload, Link as LinkIcon, Image, Video,
    FileText, CheckCheck, X, Send
} from 'lucide-react';

export default function TaskDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, userProfile } = useAuth();
    const taskId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [task, setTask] = useState<Task | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [isSupervisor, setIsSupervisor] = useState(false);
    const [isAssignee, setIsAssignee] = useState(false);

    // POT Submission State
    const [showPotSubmission, setShowPotSubmission] = useState(false);
    const [potSubmitting, setPotSubmitting] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
    const [links, setLinks] = useState<string[]>(['']);
    const [potNotes, setPotNotes] = useState('');

    // POT Validation State
    const [showValidation, setShowValidation] = useState(false);
    const [validationNotes, setValidationNotes] = useState('');
    const [validating, setValidating] = useState(false);

    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user && taskId) {
            const fetchData = async () => {
                try {
                    const taskData = await TaskService.getTask(taskId);
                    if (!taskData) throw new Error('Task not found');

                    const projectData = await EnhancedProjectService.getProject(taskData.projectId);
                    const supervisorCheck = projectData ? await EnhancedProjectService.isSupervisor(taskData.projectId, user.uid) : false;

                    setTask(taskData);
                    setProject(projectData);
                    setIsSupervisor(supervisorCheck);
                    setIsAssignee(taskData.assigneeId === user.uid);
                } catch (error) {
                    console.error('Error fetching task:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [user, taskId]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedImages(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedVideos(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const handleAddLink = () => {
        setLinks(prev => [...prev, '']);
    };

    const handleLinkChange = (index: number, value: string) => {
        setLinks(prev => prev.map((l, i) => i === index ? value : l));
    };

    const handleSubmitPot = async () => {
        if (!user || !userProfile || !task) return;

        setPotSubmitting(true);
        try {
            const validLinks = links.filter(l => l.trim() !== '');
            await TaskService.submitProofOfTask(
                taskId,
                user.uid,
                userProfile.username || 'user',
                {
                    screenshots: selectedImages,
                    videos: selectedVideos,
                    links: validLinks,
                    notes: potNotes
                }
            );

            // Refresh task data
            const updatedTask = await TaskService.getTask(taskId);
            setTask(updatedTask);
            setShowPotSubmission(false);

            // Reset form
            setSelectedImages([]);
            setSelectedVideos([]);
            setLinks(['']);
            setPotNotes('');
        } catch (error) {
            console.error('Error submitting POT:', error);
            alert('Failed to submit proof. Please try again.');
        } finally {
            setPotSubmitting(false);
        }
    };

    const handleValidatePot = async (decision: 'approved' | 'rejected' | 'revision-requested') => {
        if (!user || !userProfile || !task) return;

        setValidating(true);
        try {
            await TaskService.validateProofOfTask(
                taskId,
                user.uid,
                userProfile.username || 'user',
                decision,
                validationNotes
            );

            // Refresh task data
            const updatedTask = await TaskService.getTask(taskId);
            setTask(updatedTask);
            setShowValidation(false);
            setValidationNotes('');
        } catch (error) {
            console.error('Error validating POT:', error);
            alert('Failed to validate proof. Please try again.');
        } finally {
            setValidating(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[calc(100vh-120px)] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#008080]" size={40} />
            </div>
        );
    }

    if (!task) {
        return (
            <div className="max-w-4xl mx-auto text-center py-16">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Task Not Found</h2>
                <button
                    onClick={() => router.push('/dashboard/tasks')}
                    className="px-6 py-3 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold transition-all"
                >
                    Back to Tasks
                </button>
            </div>
        );
    }

    const canSubmitPot = isAssignee && task.status === 'in-progress';
    const canValidate = isSupervisor && task.status === 'pending-validation';

    return (
        <div className="max-w-[1200px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard/tasks')}
                        className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${task.priority === 'urgent' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' :
                                    task.priority === 'high' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' :
                                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30' :
                                            'bg-green-100 text-green-600 dark:bg-green-900/30'
                                }`}>
                                {task.priority} Priority
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${task.status === 'done' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' :
                                    task.status === 'pending-validation' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' :
                                        task.status === 'in-progress' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' :
                                            'bg-gray-100 text-gray-600 dark:bg-gray-800'
                                }`}>
                                {task.status}
                            </span>
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{task.title}</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">{task.description}</p>
                    </div>
                </div>
                {canSubmitPot && (
                    <button
                        onClick={() => setShowPotSubmission(true)}
                        className="px-5 py-2.5 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-teal-500/20"
                    >
                        <Upload size={16} />
                        Submit Proof
                    </button>
                )}
            </div>

            {/* Task Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar size={16} className="text-[#008080]" />
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Due Date</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {task.timeline.dueDate || 'No deadline'}
                    </p>
                </div>

                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={16} className="text-[#008080]" />
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Payment</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                        ${task.pricing.amount} {task.pricing.currency}
                    </p>
                </div>

                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-[#008080]" />
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Estimated Hours</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {task.timeline.estimatedHours || 'N/A'}
                    </p>
                </div>

                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 size={16} className="text-[#008080]" />
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Payment Status</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                        {task.pricing.paymentStatus}
                    </p>
                </div>
            </div>

            {/* POT Display */}
            {task.proofOfTask && (
                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
                    <div className="flex items-center justify between mb-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText className="text-[#008080]" size={28} />
                            Proof of Task
                        </h2>
                        {canValidate && (
                            <button
                                onClick={() => setShowValidation(true)}
                                className="px-5 py-2.5 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
                            >
                                <CheckCheck size={16} />
                                Review & Validate
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        {/* Screenshots */}
                        {task.proofOfTask.screenshots.length > 0 && (
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                    <Image size={18} className="text-[#008080]" />
                                    Screenshots ({task.proofOfTask.screenshots.length})
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {task.proofOfTask.screenshots.map((url, index) => (
                                        <a
                                            key={index}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group relative aspect-video bg-gray-100 dark:bg-zinc-800 rounded-xl overflow-hidden hover:ring-2 hover:ring-[#008080] transition-all"
                                        >
                                            <img src={url} alt={`Screenshot ${index + 1}`} className="w-full h-full object-cover" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Videos */}
                        {task.proofOfTask.videos.length > 0 && (
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                    <Video size={18} className="text-[#008080]" />
                                    Videos ({task.proofOfTask.videos.length})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {task.proofOfTask.videos.map((url, index) => (
                                        <video key={index} controls className="w-full rounded-xl">
                                            <source src={url} />
                                        </video>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Links */}
                        {task.proofOfTask.links.length > 0 && (
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                    <LinkIcon size={18} className="text-[#008080]" />
                                    Links ({task.proofOfTask.links.length})
                                </h3>
                                <div className="space-y-2">
                                    {task.proofOfTask.links.map((link, index) => (
                                        <a
                                            key={index}
                                            href={link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 hover:underline text-sm"
                                        >
                                            {link}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {task.proofOfTask.notes && (
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Notes</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl">
                                    {task.proofOfTask.notes}
                                </p>
                            </div>
                        )}

                        {/* Validation Info */}
                        {task.proofOfTask.validatedBy && (
                            <div className={`p-4 rounded-xl ${task.proofOfTask.status === 'approved' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900' :
                                    task.proofOfTask.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900' :
                                        'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900'
                                }`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {task.proofOfTask.status === 'approved' ? <CheckCircle2 className="text-green-600" /> :
                                        task.proofOfTask.status === 'rejected' ? <XCircle className="text-red-600" /> :
                                            <AlertCircle className="text-amber-600" />}
                                    <span className="font-bold capitalize">{task.proofOfTask.status}</span>
                                </div>
                                <p className="text-sm">
                                    Validated by @{task.proofOfTask.validatedByUsername}
                                </p>
                                {task.proofOfTask.validationNotes && (
                                    <p className="text-sm mt-2">{task.proofOfTask.validationNotes}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* POT Submission Modal */}
            {showPotSubmission && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPotSubmission(false)} />
                    <div className="relative w-full max-w-3xl max-h-[85vh] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden">
                        <div className="sticky top-0 z-10 bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Submit Proof of Task</h2>
                            <button onClick={() => setShowPotSubmission(false)} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 flex items-center justify-center">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)] space-y-6">
                            {/* Screenshots */}
                            <div>
                                <label className="block font-bold text-gray-900 dark:text-white mb-2">Screenshots</label>
                                <input
                                    ref={imageInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageSelect}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => imageInputRef.current?.click()}
                                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl hover:border-[#008080] transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400"
                                >
                                    <Image size={20} />
                                    Add Screenshots
                                </button>
                                {selectedImages.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {selectedImages.map((file, index) => (
                                            <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm">
                                                {file.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Videos */}
                            <div>
                                <label className="block font-bold text-gray-900 dark:text-white mb-2">Videos</label>
                                <input
                                    ref={videoInputRef}
                                    type="file"
                                    accept="video/*"
                                    multiple
                                    onChange={handleVideoSelect}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => videoInputRef.current?.click()}
                                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl hover:border-[#008080] transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400"
                                >
                                    <Video size={20} />
                                    Add Videos
                                </button>
                                {selectedVideos.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {selectedVideos.map((file, index) => (
                                            <span key={index} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg text-sm">
                                                {file.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Links */}
                            <div>
                                <label className="block font-bold text-gray-900 dark:text-white mb-2">Links</label>
                                {links.map((link, index) => (
                                    <input
                                        key={index}
                                        type="url"
                                        value={link}
                                        onChange={(e) => handleLinkChange(index, e.target.value)}
                                        placeholder="https://example.com"
                                        className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl mb-2 focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
                                    />
                                ))}
                                <button
                                    onClick={handleAddLink}
                                    className="text-[#008080] hover:text-teal-600 font-bold text-sm"
                                >
                                    + Add Another Link
                                </button>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block font-bold text-gray-900 dark:text-white mb-2">Notes (Optional)</label>
                                <textarea
                                    value={potNotes}
                                    onChange={(e) => setPotNotes(e.target.value)}
                                    rows={4}
                                    placeholder="Add any additional notes or context..."
                                    className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20 resize-none"
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmitPot}
                                disabled={potSubmitting || (selectedImages.length === 0 && selectedVideos.length === 0 && links.filter(l => l).length === 0)}
                                className="w-full px-6 py-3 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {potSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send size={20} />
                                        Submit Proof
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Validation Modal */}
            {showValidation && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowValidation(false)} />
                    <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden">
                        <div className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Validate Proof</h2>
                            <button onClick={() => setShowValidation(false)} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 flex items-center justify-center">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block font-bold text-gray-900 dark:text-white mb-2">Validation Notes</label>
                                <textarea
                                    value={validationNotes}
                                    onChange={(e) => setValidationNotes(e.target.value)}
                                    rows={4}
                                    placeholder="Provide feedback on the submitted proof..."
                                    className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => handleValidatePot('approved')}
                                    disabled={validating}
                                    className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={18} />
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleValidatePot('revision-requested')}
                                    disabled={validating}
                                    className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                                >
                                    <AlertCircle size={18} />
                                    Revise
                                </button>
                                <button
                                    onClick={() => handleValidatePot('rejected')}
                                    disabled={validating}
                                    className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                                >
                                    <XCircle size={18} />
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
