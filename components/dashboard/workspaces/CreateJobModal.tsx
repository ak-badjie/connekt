'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase, DollarSign, Clock, Calendar, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { WorkspaceService } from '@/lib/services/workspace-service';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { TaskService } from '@/lib/services/task-service';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

interface CreateJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
    jobToEdit?: any; // Optional job object for editing
}

const steps = [
    { number: 1, title: "Basics", description: "Role & Type" },
    { number: 2, title: "Details", description: "Description & Pay" },
    { number: 3, title: "Requirements", description: "Skills & Schedule" }
];

export default function CreateJobModal({ isOpen, onClose, workspaceId, jobToEdit }: CreateJobModalProps) {
    const { user, userProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [mounted, setMounted] = useState(false);

    // Context Selection State
    const [projects, setProjects] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        title: jobToEdit?.title || '',
        description: jobToEdit?.description || '',
        type: (jobToEdit?.type || 'job') as 'job' | 'project' | 'task',
        projectId: jobToEdit?.projectId || '',
        taskId: jobToEdit?.taskId || '',
        salary: jobToEdit?.salary?.toString() || '',
        currency: jobToEdit?.currency || 'USD',
        paymentSchedule: jobToEdit?.paymentSchedule || 'monthly',
        requirements: Array.isArray(jobToEdit?.requirements) ? jobToEdit.requirements.join('\n') : (jobToEdit?.requirements || ''),
        skills: '' // Comma separated for now
    });

    useEffect(() => {
        setMounted(true);
        if (workspaceId && isOpen) {
            loadProjects();
        }
        return () => setMounted(false);
    }, [workspaceId, isOpen]);

    useEffect(() => {
        if (jobToEdit) {
            setFormData({
                title: jobToEdit.title || '',
                description: jobToEdit.description || '',
                type: (jobToEdit.type || 'job') as 'job' | 'project' | 'task',
                projectId: jobToEdit.projectId || '',
                taskId: jobToEdit.taskId || '',
                salary: jobToEdit.salary?.toString() || '',
                currency: jobToEdit.currency || 'USD',
                paymentSchedule: jobToEdit.paymentSchedule || 'monthly',
                requirements: Array.isArray(jobToEdit.requirements) ? jobToEdit.requirements.join('\n') : (jobToEdit.requirements || ''),
                skills: Array.isArray(jobToEdit.skills) ? jobToEdit.skills.join(', ') : (jobToEdit.skills || '')
            });
        } else if (isOpen && !jobToEdit) {
            // Reset if opening in Create mode (and not Edit mode)
            setFormData({
                title: '',
                description: '',
                type: 'job',
                projectId: '',
                taskId: '',
                salary: '',
                currency: 'USD',
                paymentSchedule: 'monthly',
                requirements: '',
                skills: ''
            });
        }
    }, [jobToEdit, isOpen]);

    useEffect(() => {
        if (formData.projectId && formData.type === 'task') {
            loadTasks(formData.projectId);
        } else {
            setTasks([]);
        }
    }, [formData.projectId, formData.type]);

    const loadProjects = async () => {
        try {
            const data = await EnhancedProjectService.getWorkspaceProjects(workspaceId);
            setProjects(data);
        } catch (error) {
            console.error('Failed to load projects:', error);
        }
    };

    const loadTasks = async (projectId: string) => {
        try {
            const data = await TaskService.getProjectTasks(projectId);
            setTasks(data);
        } catch (error) {
            console.error('Failed to load tasks:', error);
        }
    };

    const handleSubmit = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const commonData = {
                ...formData,
                salary: Number(formData.salary),
                requirements: formData.requirements.split('\n').filter((r: string) => r.trim()),
                schedule: {
                    startTime: '09:00',
                    endTime: '17:00',
                    timezone: 'UTC',
                    breakDurationMinutes: 60,
                    workDays: [1, 2, 3, 4, 5]
                },
                conditions: {
                    penaltyPerLateTask: 0,
                    penaltyUnit: 'fixed',
                    overtimeRate: 1.5
                }
            };

            if (jobToEdit) {
                await WorkspaceService.updateJob(jobToEdit.id, commonData);
                toast.success('Job updated successfully!');
            } else {
                await WorkspaceService.createJob({
                    workspaceId,
                    ownerId: user.uid,
                    ownerEmail: user.email,
                    ownerUsername: userProfile?.username || user.email,
                    // Use the official connectMail from profile if available, otherwise construct it
                    ownerConnektEmail: userProfile?.connectMail || (userProfile?.username ? `${userProfile.username}@connekt.com` : user.email),
                    isPublic: true,
                    ...commonData
                });
                toast.success('Job posted successfully!');
            }
            onClose();
        } catch (error) {
            console.error('Error saving job:', error);
            toast.error('Failed to save job');
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => setCurrentStep(curr => Math.min(curr + 1, 3));
    const prevStep = () => setCurrentStep(curr => Math.max(curr - 1, 1));

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-white/5"
                    >
                        {/* Header */}
                        <div className="relative bg-gradient-to-r from-[#008080] to-teal-600 p-8 overflow-hidden">
                            <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10 flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-black text-white mb-2">{jobToEdit ? 'Edit Opportunity' : 'Create Opportunity'}</h2>
                                    <p className="text-teal-100">Find the perfect talent for your workspace</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Stepper */}
                            <div className="flex items-center gap-4 mt-8">
                                {steps.map((step, idx) => (
                                    <div key={step.number} className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${currentStep >= step.number
                                            ? 'bg-white text-[#008080]'
                                            : 'bg-teal-700/50 text-teal-200'
                                            }`}>
                                            {currentStep > step.number ? <Check size={16} /> : step.number}
                                        </div>
                                        <span className={`text-sm font-medium ${currentStep >= step.number ? 'text-white' : 'text-teal-200/70'
                                            }`}>{step.title}</span>
                                        {idx < steps.length - 1 && (
                                            <div className="w-12 h-px bg-teal-500/50"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8">
                            <AnimatePresence mode="wait">
                                {currentStep === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                                Position Title
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                placeholder="e.g. Senior Product Designer"
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[#008080] outline-none transition-all font-medium"
                                                autoFocus
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                                Engagement Type
                                            </label>
                                            <div className="grid grid-cols-3 gap-4">
                                                {[
                                                    { id: 'job', label: 'Full-time Job', icon: Briefcase },
                                                    { id: 'project', label: 'Project', icon: Clock },
                                                    { id: 'task', label: 'Single Task', icon: Check }
                                                ].map((type) => (
                                                    <div
                                                        key={type.id}
                                                        onClick={() => setFormData({ ...formData, type: type.id as any })}
                                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.type === type.id
                                                            ? 'border-[#008080] bg-[#008080]/5'
                                                            : 'border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700'
                                                            }`}
                                                    >
                                                        <type.icon className={`mb-2 ${formData.type === type.id ? 'text-[#008080]' : 'text-gray-400'}`} />
                                                        <div className={`font-bold ${formData.type === type.id ? 'text-[#008080]' : 'text-gray-600 dark:text-gray-400'}`}>
                                                            {type.label}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Context Selection Dropdowns */}
                                        <AnimatePresence>
                                            {formData.type !== 'job' && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="space-y-4 pt-2"
                                                >
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                                            Select Context Project
                                                        </label>
                                                        <select
                                                            value={formData.projectId}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value, taskId: '' }))}
                                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[#008080] outline-none transition-all"
                                                        >
                                                            <option value="">-- Choose a Project --</option>
                                                            {projects.map(p => (
                                                                <option key={p.id} value={p.id}>{p.title}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {formData.type === 'task' && formData.projectId && (
                                                        <div>
                                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                                                Select Specific Task
                                                            </label>
                                                            <select
                                                                value={formData.taskId}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, taskId: e.target.value }))}
                                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[#008080] outline-none transition-all"
                                                            >
                                                                <option value="">-- Choose a Task --</option>
                                                                {tasks.map(t => (
                                                                    <option key={t.id} value={t.id}>{t.title}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                )}

                                {currentStep === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                                Description
                                            </label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                placeholder="Describe the responsibilities and what you are looking for..."
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[#008080] outline-none transition-all min-h-[120px]"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                                    Compensation
                                                </label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                    <input
                                                        type="number"
                                                        value={formData.salary}
                                                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                                        placeholder="0.00"
                                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[#008080] outline-none transition-all font-mono"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                                    Schedule
                                                </label>
                                                <select
                                                    value={formData.paymentSchedule}
                                                    onChange={(e) => setFormData({ ...formData, paymentSchedule: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[#008080] outline-none transition-all"
                                                >
                                                    <option value="monthly">Monthly Salary</option>
                                                    <option value="weekly">Weekly Rate</option>
                                                    <option value="fixed">Fixed Price</option>
                                                    <option value="milestone">Milestone Based</option>
                                                </select>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {currentStep === 3 && (
                                    <motion.div
                                        key="step3"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                                Requirements
                                            </label>
                                            <textarea
                                                value={formData.requirements}
                                                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                                placeholder="List the key requirements (one per line)..."
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[#008080] outline-none transition-all min-h-[160px]"
                                            />
                                        </div>

                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex gap-3">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg h-fit">
                                                <Briefcase size={20} className="text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white mb-1">Standard Contract</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    This role will include standard workspace benefits and follow the default contract terms.
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-900/50">
                            {currentStep > 1 ? (
                                <button
                                    onClick={prevStep}
                                    className="px-6 py-2.5 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all flex items-center gap-2"
                                >
                                    <ArrowLeft size={16} />
                                    Back
                                </button>
                            ) : (
                                <div></div>
                            )}

                            {currentStep === 3 ? (
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="px-8 py-2.5 bg-[#008080] hover:bg-teal-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2"
                                >
                                    {loading ? 'Saving...' : (jobToEdit ? 'Update Opportunity' : 'Post Opportunity')}
                                    {!loading && <Check size={16} />}
                                </button>
                            ) : (
                                <button
                                    onClick={nextStep}
                                    className="px-8 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center gap-2"
                                >
                                    Next Step
                                    <ArrowRight size={16} />
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
