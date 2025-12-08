'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase, DollarSign, Clock, Calendar, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { WorkspaceService } from '@/lib/services/workspace-service';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

interface CreateJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
}

const steps = [
    { number: 1, title: "Basics", description: "Role & Type" },
    { number: 2, title: "Details", description: "Description & Pay" },
    { number: 3, title: "Requirements", description: "Skills & Schedule" }
];

export default function CreateJobModal({ isOpen, onClose, workspaceId }: CreateJobModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'job' as 'job' | 'project' | 'task',
        salary: '',
        currency: 'USD',
        paymentSchedule: 'monthly',
        requirements: '',
        skills: '' // Comma separated for now
    });

    const handleSubmit = async () => {
        if (!user) return;

        setLoading(true);
        try {
            await WorkspaceService.createJob({
                workspaceId,
                ownerId: user.uid,
                ...formData,
                salary: Number(formData.salary),
                requirements: formData.requirements.split('\n').filter(r => r.trim()),
                isPublic: true,
                schedule: {
                    startTime: '09:00',
                    endTime: '17:00',
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    breakDurationMinutes: 60,
                    workDays: [1, 2, 3, 4, 5]
                },
                conditions: {
                    penaltyPerLateTask: 0,
                    penaltyUnit: 'fixed',
                    overtimeRate: 1.5
                }
            });
            toast.success('Job posted successfully!');
            onClose();
        } catch (error) {
            console.error('Error creating job:', error);
            toast.error('Failed to post job');
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => setCurrentStep(curr => Math.min(curr + 1, 3));
    const prevStep = () => setCurrentStep(curr => Math.max(curr - 1, 1));

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
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
                                    <h2 className="text-2xl font-black text-white mb-2">Create Opportunity</h2>
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
                                                Key Requirements
                                            </label>
                                            <textarea
                                                value={formData.requirements}
                                                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                                placeholder="- 5+ years React experience&#10;- Knowledge of Next.js&#10;- Problem solver"
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[#008080] outline-none transition-all min-h-[150px] font-mono text-sm"
                                            />
                                        </div>

                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-start gap-3">
                                            <Calendar className="text-blue-600 dark:text-blue-400 mt-1" size={20} />
                                            <div>
                                                <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm">Review & Publish</h4>
                                                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                                    Your job will be posted publicly to the Explore page immediately. You can manage applications in your workspace Mail.
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 backdrop-blur-sm flex justify-between items-center">
                            <button
                                onClick={prevStep}
                                disabled={currentStep === 1}
                                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${currentStep === 1
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                Back
                            </button>

                            {currentStep < 3 ? (
                                <button
                                    onClick={nextStep}
                                    className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2"
                                >
                                    Next Step <ArrowRight size={16} />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="px-8 py-3 bg-gradient-to-r from-[#008080] to-teal-600 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-teal-500/30 transition-all flex items-center gap-2"
                                >
                                    {loading ? 'Publishing...' : 'Post Job Now'}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
