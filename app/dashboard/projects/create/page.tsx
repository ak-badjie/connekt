'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { EnhancedProjectService } from '@/lib/services/enhanced-project-service';
import { WorkspaceService } from '@/lib/services/workspace-service';
import { WalletService } from '@/lib/services/wallet-service';
import { Workspace } from '@/lib/types/workspace.types';
import { useRouter } from 'next/navigation';
import { Loader2, Briefcase, ArrowLeft, Check, Calendar, DollarSign, Wallet } from 'lucide-react';
import ConnektWalletLogo from '@/components/wallet/ConnektWalletLogo';

export default function CreateProjectPage() {
    const { user, userProfile } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [formData, setFormData] = useState({
        workspaceId: '',
        title: '',
        description: '',
        budget: '',
        deadline: '',
        recurringType: 'none' as 'none' | 'daily' | 'weekly' | 'monthly'
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [walletBalance, setWalletBalance] = useState<number | null>(null);

    useEffect(() => {
        if (user) {
            const fetchInitialData = async () => {
                const userWorkspaces = await WorkspaceService.getUserWorkspaces(user.uid);
                setWorkspaces(userWorkspaces);
                if (userWorkspaces.length > 0) {
                    setFormData(prev => ({ ...prev, workspaceId: userWorkspaces[0].id! }));
                }

                try {
                    const wallet = await WalletService.getWallet(user.uid, 'user');
                    if (wallet) {
                        setWalletBalance(wallet.balance);
                    }
                } catch (error) {
                    console.error('Error fetching wallet:', error);
                }
            };
            fetchInitialData();
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.workspaceId) newErrors.workspaceId = 'Please select a workspace';
        if (!formData.title.trim()) newErrors.title = 'Project title is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';

        const budget = parseFloat(formData.budget);
        if (!formData.budget || budget <= 0) {
            newErrors.budget = 'Budget must be greater than 0';
        } else if (walletBalance !== null && budget > walletBalance) {
            newErrors.budget = `Insufficient funds. Available: D${walletBalance.toFixed(2)}`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate() || !user || !userProfile) return;

        setLoading(true);
        try {
            const projectId = await EnhancedProjectService.createProject({
                workspaceId: formData.workspaceId,
                ownerId: user.uid,
                ownerUsername: userProfile.username || 'user',
                title: formData.title,
                description: formData.description,
                budget: parseFloat(formData.budget),
                deadline: formData.deadline || undefined,
                recurringType: formData.recurringType
            });

            router.push(`/dashboard/projects/${projectId}`);
        } catch (error: any) {
            console.error('Error creating project:', error);
            const errorMessage = error.message || 'Failed to create project. Please try again.';
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (workspaces.length === 0 && !loading) {
        return (
            <div className="max-w-3xl mx-auto text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Briefcase size={40} className="text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Create a Workspace First
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    Projects must belong to a workspace. Create a workspace before creating projects.
                </p>
                <button
                    onClick={() => router.push('/dashboard/workspaces/create')}
                    className="px-6 py-3 bg-[#008080] hover:bg-teal-600 text-white rounded-xl font-bold inline-flex items-center gap-2 transition-all"
                >
                    Create Workspace
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#008080] transition-colors mb-4"
                >
                    <ArrowLeft size={20} />
                    Back
                </button>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
                        <Briefcase size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Create Project</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Set up a new project to manage tasks and team collaboration
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-zinc-800 p-8 space-y-6">
                    {/* Workspace Selection */}
                    <div>
                        <label htmlFor="workspaceId" className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                            Workspace *
                        </label>
                        <select
                            id="workspaceId"
                            name="workspaceId"
                            value={formData.workspaceId}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 bg-white dark:bg-zinc-800 border ${errors.workspaceId ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'
                                } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20`}
                        >
                            {workspaces.map(workspace => (
                                <option key={workspace.id} value={workspace.id}>
                                    {workspace.name}
                                </option>
                            ))}
                        </select>
                        {errors.workspaceId && <p className="mt-2 text-sm text-red-500">{errors.workspaceId}</p>}
                    </div>

                    {/* Project Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                            Project Title *
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g. Website Redesign, Mobile App Development"
                            className={`w-full px-4 py-3 bg-white dark:bg-zinc-800 border ${errors.title ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'
                                } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20`}
                        />
                        {errors.title && <p className="mt-2 text-sm text-red-500">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                            Description *
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Describe the project goals, deliverables, and scope..."
                            className={`w-full px-4 py-3 bg-white dark:bg-zinc-800 border ${errors.description ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'
                                } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20 resize-none`}
                        />
                        {errors.description && <p className="mt-2 text-sm text-red-500">{errors.description}</p>}
                    </div>

                    {/* Wallet & Budget Calculator */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-800 dark:to-zinc-900 rounded-xl p-6 border border-gray-200 dark:border-zinc-700">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm overflow-hidden flex items-center justify-center">
                                    <ConnektWalletLogo size="small" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">Wallet Check</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Real-time funding status</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Available Funds</p>
                                <p className="text-xl font-bold text-[#008080]">
                                    D{walletBalance?.toFixed(2) || '0.00'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-2">
                            <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-700">
                                <p className="text-xs text-gray-500 mb-1">Current</p>
                                <p className="font-bold text-gray-900 dark:text-white">D{walletBalance?.toFixed(2) || '0.00'}</p>
                            </div>
                            <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-700 flex flex-col items-center justify-center">
                                <p className="text-xs text-gray-500 mb-1">- Project Cost</p>
                                <p className="font-bold text-gray-900 dark:text-white">D{parseFloat(formData.budget || '0').toFixed(2)}</p>
                            </div>
                            <div className={`p-3 rounded-lg border flex flex-col items-end ${(walletBalance !== null && parseFloat(formData.budget || '0') > walletBalance)
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                : 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800'
                                }`}>
                                <p className={`text-xs mb-1 ${(walletBalance !== null && parseFloat(formData.budget || '0') > walletBalance)
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-teal-600 dark:text-teal-400'
                                    }`}>Remaining</p>
                                <p className={`font-bold ${(walletBalance !== null && parseFloat(formData.budget || '0') > walletBalance)
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-teal-600 dark:text-teal-400'
                                    }`}>
                                    D{(walletBalance !== null ? (walletBalance - parseFloat(formData.budget || '0')) : 0).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Budget and Deadline Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="budget" className="block text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <DollarSign size={16} className="text-[#008080]" />
                                Budget *
                            </label>
                            <input
                                type="number"
                                id="budget"
                                name="budget"
                                value={formData.budget}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                className={`w-full px-4 py-3 bg-white dark:bg-zinc-800 border ${errors.budget ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'
                                    } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20`}
                            />
                            {errors.budget && <p className="mt-2 text-sm text-red-500">{errors.budget}</p>}
                        </div>

                        <div>
                            <label htmlFor="deadline" className="block text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <Calendar size={16} className="text-[#008080]" />
                                Deadline (Optional)
                            </label>
                            <input
                                type="date"
                                id="deadline"
                                name="deadline"
                                value={formData.deadline}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
                            />
                        </div>
                    </div>

                    {/* Recurring Type */}
                    <div>
                        <label htmlFor="recurringType" className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                            Recurring Type
                        </label>
                        <select
                            id="recurringType"
                            name="recurringType"
                            value={formData.recurringType}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
                        >
                            <option value="none">One-time Project</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-[#008080] to-teal-600 hover:from-teal-600 hover:to-[#008080] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Securing Funds...
                            </>
                        ) : (
                            <>
                                <Check size={20} />
                                Confirm & Create Project
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form >
        </div >
    );
}
