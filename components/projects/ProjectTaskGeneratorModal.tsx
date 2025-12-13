'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Check, DollarSign, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

import ConnektAIIcon from '@/components/branding/ConnektAIIcon';
import { ConnectAIService, TaskSuggestion } from '@/lib/services/connect-ai.service';
import { TaskService } from '@/lib/services/task-service';
import { Task } from '@/lib/types/workspace.types';

// Branding Icon
const ConnektIcon = ({ className }: { className?: string }) => (
    <ConnektAIIcon className={`w-5 h-5 ${className || ''}`} />
);

interface ProjectTaskGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    workspaceId: string;
    userId: string;
    projectDescription: string;
    remainingBudget: number;
    currency: string;
    onTasksAdded: () => void;
}

export default function ProjectTaskGeneratorModal({
    isOpen,
    onClose,
    projectId,
    workspaceId,
    userId,
    projectDescription,
    remainingBudget,
    currency,
    onTasksAdded
}: ProjectTaskGeneratorModalProps) {
    const [step, setStep] = useState<'input' | 'generating' | 'review'>('input');
    const [instructions, setInstructions] = useState('');
    const [budgetToUse, setBudgetToUse] = useState(remainingBudget);
    const [numTasks, setNumTasks] = useState(3);
    const [generatedTasks, setGeneratedTasks] = useState<TaskSuggestion[]>([]);

    const finalPrompt = instructions
        ? `Project Context: "${projectDescription}". \n\nSpecific Request for this batch of tasks: "${instructions}"`
        : projectDescription;

    const handleGenerate = async () => {
        if (budgetToUse > remainingBudget) {
            toast.error(`Budget exceeds remaining project funds (${currency} ${remainingBudget})`);
            return;
        }

        setStep('generating');
        try {
            const minDelay = new Promise(resolve => setTimeout(resolve, 2500));

            const aiPromise = ConnectAIService.generateTasksFromProject(
                finalPrompt,
                budgetToUse,
                currency,
                numTasks,
                userId
            );

            const [tasks] = await Promise.all([aiPromise, minDelay]);
            setGeneratedTasks(tasks);
            setStep('review');
        } catch (error) {
            console.error(error);
            toast.error('Generation failed. Please try again.');
            setStep('input');
        }
    };

    const handleConfirm = async () => {
        const toastId = toast.loading('Adding tasks to project...');
        try {
            await Promise.all(
                generatedTasks.map(t =>
                    TaskService.createTask({
                        projectId,
                        workspaceId,
                        title: t.title,
                        description: t.description,
                        priority: (t.priority || 'medium') as Task['priority'],
                        pricing: {
                            amount: t.budget || 0,
                            currency: t.currency || currency,
                            paymentStatus: 'unpaid',
                        },
                        createdBy: userId,
                    })
                )
            );

            toast.success('Tasks added successfully!', { id: toastId });
            onTasksAdded();
            onClose();

            setTimeout(() => {
                setStep('input');
                setGeneratedTasks([]);
            }, 500);
        } catch (error) {
            console.error(error);
            toast.error('Failed to add tasks', { id: toastId });
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={step === 'generating' ? () => { } : onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-8 shadow-xl transition-all">
                            <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                                <ConnektIcon />
                                Task Generator
                            </Dialog.Title>

                            {step === 'input' && (
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Instructions (Optional)</label>
                                        <textarea
                                            className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#008080] min-h-[100px]"
                                            placeholder="e.g. Create 3 tasks for the marketing phase..."
                                            value={instructions}
                                            onChange={(e) => setInstructions(e.target.value)}
                                        />
                                        <p className="text-xs text-gray-400 mt-1">If empty, we'll use the original project description.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Budget Allocation</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-3.5 text-gray-400" size={16} />
                                                <input
                                                    type="number"
                                                    className="w-full pl-9 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#008080]"
                                                    value={budgetToUse}
                                                    max={remainingBudget}
                                                    onChange={(e) => setBudgetToUse(parseFloat(e.target.value))}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">Max: {currency} {remainingBudget}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Quantity</label>
                                            <input
                                                type="number"
                                                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#008080]"
                                                value={numTasks}
                                                min={1}
                                                max={10}
                                                onChange={(e) => setNumTasks(parseInt(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <button onClick={onClose} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl">Cancel</button>
                                        <button
                                            onClick={handleGenerate}
                                            className="px-6 py-2.5 bg-white border-2 border-[#008080] text-[#008080] hover:bg-teal-50 rounded-xl font-bold flex items-center gap-2 transition-all"
                                        >
                                            <ConnektIcon />
                                            Generate
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 'generating' && (
                                <div className="py-12 flex flex-col items-center justify-center text-center">
                                    <div className="relative w-16 h-16 mb-6">
                                        <div className="absolute inset-0 border-4 border-[#008080]/20 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-[#008080] rounded-full border-t-transparent animate-spin"></div>
                                        <ConnektIcon className="absolute inset-0 m-auto" />
                                    </div>
                                    <h4 className="text-lg font-bold text-[#008080] mb-2">Structuring Tasks...</h4>
                                    <p className="text-gray-500 text-sm">Analyzing context and splitting budget.</p>
                                </div>
                            )}

                            {step === 'review' && (
                                <div className="space-y-4">
                                    <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2">
                                        {generatedTasks.map((t, i) => (
                                            <div key={i} className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-zinc-700">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-gray-900 dark:text-white">{t.title}</h4>
                                                    <span className="font-bold text-[#008080]">{t.currency} {t.budget}</span>
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{t.description}</p>
                                                <div className="flex gap-2 mt-2">
                                                    {t.categories?.map(c => (
                                                        <span key={c} className="text-[10px] bg-teal-50 text-[#008080] px-2 py-0.5 rounded border border-[#008080]/20">
                                                            {c}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-zinc-800">
                                        <button
                                            onClick={() => setStep('input')}
                                            className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center gap-1"
                                        >
                                            <RefreshCw size={14} /> Adjust Input
                                        </button>
                                        <div className="flex gap-3">
                                            <button onClick={onClose} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl">Discard</button>
                                            <button
                                                onClick={handleConfirm}
                                                className="px-6 py-2 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-teal-500/20"
                                            >
                                                <Check size={18} />
                                                Confirm & Add
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
