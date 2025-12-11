'use client';

import { useState, useEffect } from 'react';
import { X, MessageSquare, Briefcase, Globe, Users, Check } from 'lucide-react';
import { Task, ProjectMember, WorkspaceMember } from '@/lib/types/workspace.types';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { TaskService } from '@/lib/services/task-service';
import { useAuth } from '@/context/AuthContext';

interface AskForHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task;
    projectId: string;
    onHelpRequested: () => void;
}

export default function AskForHelpModal({ isOpen, onClose, task, projectId, onHelpRequested }: AskForHelpModalProps) {
    const [step, setStep] = useState<'type-select' | 'member-select' | 'confirm-public'>('type-select');
    const [helpType, setHelpType] = useState<'free' | 'paid-internal' | 'paid-public' | null>(null);
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(null);
    const { user, userProfile } = useAuth();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && projectId) {
            loadMembers();
            setStep('type-select');
            setHelpType(null);
            setSelectedMember(null);
        }
    }, [isOpen, projectId]);

    const loadMembers = async () => {
        try {
            const projectMembers = await EnhancedProjectService.getProjectMembers(projectId);
            setMembers(projectMembers);
        } catch (e) {
            console.error('Failed to load members', e);
        }
    };

    const handleOptionSelect = (type: 'free' | 'paid-internal' | 'paid-public') => {
        setHelpType(type);
        if (type === 'paid-public') {
            setStep('confirm-public');
        } else {
            setStep('member-select');
        }
    };

    const handleMemberSubmit = () => {
        if (!selectedMember || !userProfile) return;

        const recipientEmail = selectedMember.email;
        const senderUsername = userProfile.username || 'User';

        if (helpType === 'free') {
            // Open Compose for simple message
            const subject = `Help Request: ${task.title}`;
            const body = `Hey ${selectedMember.username}, I need some help with the task "${task.title}". Can you assist?`;

            const params = new URLSearchParams({
                compose: '1',
                to: recipientEmail,
                subject,
                body
            });

            window.open(`/mail?${params.toString()}`, '_blank', 'noopener,noreferrer');
            onClose();
        } else if (helpType === 'paid-internal') {
            console.log('AskForHelp: Starting internal contract draft for', selectedMember.username);

            // Contract Variables
            const variables = {
                taskTitle: task.title,
                taskDescription: task.description,
                paymentAmount: task.pricing?.amount || 0,
                endDate: task.timeline?.dueDate
            };

            const params = new URLSearchParams({
                compose: '1',
                to: recipientEmail,
                templateId: 'Task Admin Contract (Task Ownership)',
                contractType: 'task_admin',
                variables: JSON.stringify(variables),
                autoStart: '1',
                autoSelectTaskId: task.id || ''
            });

            window.open(`/mail?${params.toString()}`, '_blank', 'noopener,noreferrer');
            onClose();
        }
    };

    const handlePublicSubmit = async () => {
        setLoading(true);
        try {
            await TaskService.updateVisibility(task.id!, true);
            onHelpRequested();
            onClose();
        } catch (e) {
            console.error('Error publishing task', e);
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setStep('type-select');
        setHelpType(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-zinc-800">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Ask For Help</h3>
                    <button onClick={reset} className="text-gray-400 hover:text-gray-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {step === 'type-select' && (
                        <div className="space-y-3">
                            <button
                                onClick={() => handleOptionSelect('free')}
                                className="w-full p-4 rounded-xl border border-gray-200 dark:border-zinc-700 hover:border-[#008080] dark:hover:border-[#008080] hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-all group text-left"
                            >
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                                        <MessageSquare size={18} />
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white">Free Help</span>
                                </div>
                                <p className="text-sm text-gray-500 ml-11">Message a coworker or project member for quick assistance.</p>
                            </button>

                            <button
                                onClick={() => handleOptionSelect('paid-internal')}
                                className="w-full p-4 rounded-xl border border-gray-200 dark:border-zinc-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group text-left"
                            >
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="p-2 bg-purple-100 text-purple-600 rounded-full">
                                        <Users size={18} />
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white">Hire Internal Member</span>
                                </div>
                                <p className="text-sm text-gray-500 ml-11">Offer a paid sub-contract to a team member.</p>
                            </button>

                            <button
                                onClick={() => handleOptionSelect('paid-public')}
                                className="w-full p-4 rounded-xl border border-gray-200 dark:border-zinc-700 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all group text-left"
                            >
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="p-2 bg-amber-100 text-amber-600 rounded-full">
                                        <Globe size={18} />
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white">Make Public (Explore)</span>
                                </div>
                                <p className="text-sm text-gray-500 ml-11">List this task on the Explore page for freelancers.</p>
                            </button>
                        </div>
                    )}

                    {step === 'member-select' && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500">Select a team member to ask:</p>
                            <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
                                {members.length === 0 ? (
                                    <div className="text-center py-4 text-gray-500 italic">No other members found in this project.</div>
                                ) : (
                                    members.map(member => (
                                        <button
                                            key={member.userId}
                                            onClick={() => setSelectedMember(member)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${selectedMember?.userId === member.userId
                                                ? 'border-[#008080] bg-teal-50 dark:bg-teal-900/20'
                                                : 'border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
                                                }`}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                {member.username.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-900 dark:text-white">{member.username}</p>
                                                <p className="text-xs text-gray-500">{member.type}</p>
                                            </div>
                                            {selectedMember?.userId === member.userId && (
                                                <Check size={16} className="ml-auto text-[#008080]" />
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>

                            <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-zinc-800">
                                <button onClick={() => setStep('type-select')} className="text-sm text-gray-500 hover:text-gray-700">Back</button>
                                <button
                                    disabled={!selectedMember}
                                    onClick={handleMemberSubmit}
                                    className="px-4 py-2 bg-[#008080] text-white rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-teal-600 transition-colors"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'confirm-public' && (
                        <div className="space-y-4 text-center py-4">
                            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Globe size={32} />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white">Make Task Public?</h4>
                            <p className="text-sm text-gray-500">
                                This will list "{task.title}" on the Explore page. Any verified freelancer can apply to help.
                                Requires a budget of <b>{task.pricing?.amount} {task.pricing?.currency}</b>.
                            </p>

                            <div className="flex justify-center gap-3 mt-6">
                                <button
                                    onClick={() => setStep('type-select')}
                                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg text-sm font-bold hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePublicSubmit}
                                    disabled={loading}
                                    className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600 flex items-center gap-2"
                                >
                                    {loading ? 'Publishing...' : 'Yes, Make Public'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>


        </div>
    );
}
