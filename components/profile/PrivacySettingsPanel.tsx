'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Users, Globe, Save, X } from 'lucide-react';
import { PrivacySettings } from '@/lib/types/profile.types';
import { ProfileService } from '@/lib/services/profile-service';

interface PrivacySettingsPanelProps {
    uid: string;
    currentSettings: PrivacySettings;
    onClose?: () => void;
    onSave?: (settings: PrivacySettings) => void;
}

type VisibilityOption = 'public' | 'authenticated' | 'private';

const visibilityOptions: { value: VisibilityOption; label: string; icon: any; color: string }[] = [
    { value: 'public', label: 'Public', icon: Globe, color: 'text-green-500' },
    { value: 'authenticated', label: 'Registered Users', icon: Users, color: 'text-amber-500' },
    { value: 'private', label: 'Only Me', icon: Lock, color: 'text-red-500' },
];

export function PrivacySettingsPanel({
    uid,
    currentSettings,
    onClose,
    onSave,
}: PrivacySettingsPanelProps) {
    const [settings, setSettings] = useState<PrivacySettings>(currentSettings);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    const privacyItems = [
        { key: 'showEmail', label: 'Email Address', description: 'Who can see your email' },
        { key: 'showPhone', label: 'Phone Number', description: 'Who can see your phone number' },
        { key: 'showLocation', label: 'Location', description: 'Who can see where you\'re based' },
        { key: 'showExperience', label: 'Work Experience', description: 'Who can see your work history' },
        { key: 'showEducation', label: 'Education', description: 'Who can see your education background' },
        { key: 'showProjects', label: 'Projects', description: 'Who can see your completed projects' },
        { key: 'showTasks', label: 'Tasks', description: 'Who can see your tasks showcase' },
        { key: 'showRatings', label: 'Ratings & Reviews', description: 'Who can see reviews about you' },
        { key: 'showReferrals', label: 'Referrals', description: 'Who can see your endorsements' },
        { key: 'showSocialLinks', label: 'Social Links', description: 'Who can see your social profiles' },
    ];

    const handleSave = async () => {
        setSaving(true);
        try {
            const success = await ProfileService.updatePrivacySettings(uid, settings);
            if (success) {
                setSuccess(true);
                onSave?.(settings);
                setTimeout(() => {
                    setSuccess(false);
                    onClose?.();
                }, 1500);
            }
        } catch (error) {
            console.error('Error saving privacy settings:', error);
        } finally {
            setSaving(false);
        }
    };

    const updateSetting = (key: keyof PrivacySettings, value: VisibilityOption) => {
        setSettings((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-4xl w-full mx-auto flex flex-col max-h-[85vh] overflow-hidden border border-gray-200 dark:border-zinc-800">
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl">
                        <Lock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Privacy Settings
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Control who can see your profile information
                        </p>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
                {/* Visibility Legend */}
                <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/10 dark:to-cyan-900/10 rounded-2xl">
                    {visibilityOptions.map((option) => (
                        <div key={option.value} className="flex items-center gap-2">
                            <option.icon className={`w-5 h-5 ${option.color}`} />
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {option.label}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {option.value === 'public' && 'Everyone'}
                                    {option.value === 'authenticated' && 'Signed-in users'}
                                    {option.value === 'private' && 'Just you'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Settings List - Vertical Layout */}
                <div className="space-y-3">
                    {privacyItems.map((item, index) => {
                        const currentValue = settings[item.key as keyof PrivacySettings] as VisibilityOption;

                        return (
                            <motion.div
                                key={item.key}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-gray-200 dark:border-zinc-700 hover:border-teal-300 dark:hover:border-teal-700 transition-all"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                            {item.label}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {item.description}
                                        </p>
                                    </div>

                                    {/* Vertical Select-style buttons */}
                                    <div className="flex flex-col gap-2 min-w-[160px]">
                                        {visibilityOptions.map((option) => {
                                            const isSelected = currentValue === option.value;
                                            const IconComponent = option.icon;

                                            return (
                                                <motion.button
                                                    key={option.value}
                                                    onClick={() => updateSetting(item.key as keyof PrivacySettings, option.value)}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-left ${isSelected
                                                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30 shadow-sm'
                                                            : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-800'
                                                        }`}
                                                >
                                                    <IconComponent
                                                        className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-teal-600 dark:text-teal-400' : option.color
                                                            }`}
                                                    />
                                                    <span className={`text-sm font-medium ${isSelected
                                                            ? 'text-teal-700 dark:text-teal-300'
                                                            : 'text-gray-700 dark:text-gray-300'
                                                        }`}>
                                                        {option.label}
                                                    </span>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Fixed Footer */}
            <div className="flex items-center gap-4 p-6 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 flex-shrink-0">
                <button
                    onClick={() => setSettings(currentSettings)}
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 dark:border-zinc-700"
                >
                    Reset
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving || success}
                    className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${success
                            ? 'bg-green-500 text-white'
                            : 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:shadow-lg'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {saving ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                        </>
                    ) : success ? (
                        <>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Saved!
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Save Settings
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
