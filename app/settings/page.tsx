'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import MainNavbar from '@/components/layout/MainNavbar';
import { ProfileService } from '@/lib/services/profile-service';
import { PrivacySettings } from '@/lib/types/profile.types';
import { Shield, Eye, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function SettingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);

    useEffect(() => {
        async function loadSettings() {
            if (!user) {
                router.push('/auth');
                return;
            }

            try {
                const profile = await ProfileService.getUserProfile(user.uid);
                if (profile?.privacySettings) {
                    setPrivacySettings(profile.privacySettings);
                } else {
                    setPrivacySettings({
                        showEmail: 'authenticated',
                        showPhone: 'private',
                        showExperience: 'public',
                        showEducation: 'public',
                        showProjects: 'public',
                        showRatings: 'public',
                        showLocation: 'public',
                        showSocialLinks: 'public',
                    });
                }
            } catch (error) {
                console.error('Error loading settings:', error);
            } finally {
                setLoading(false);
            }
        }

        loadSettings();
    }, [user, router]);

    const handleSave = async () => {
        if (!user || !privacySettings) return;

        setSaving(true);
        try {
            await ProfileService.updatePrivacySettings(user.uid, privacySettings);
            alert('Privacy settings updated successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const updateSetting = (key: keyof PrivacySettings, value: 'public' | 'authenticated' | 'private') => {
        setPrivacySettings(prev => prev ? { ...prev, [key]: value } : null);
    };

    if (loading) {
        return <LoadingScreen />;
    }

    const settingItems: { key: keyof PrivacySettings; label: string; description: string }[] = [
        { key: 'showEmail', label: 'Email Address', description: 'Who can see your email address' },
        { key: 'showPhone', label: 'Phone Number', description: 'Who can see your phone number' },
        { key: 'showExperience', label: 'Work Experience', description: 'Who can see your work history' },
        { key: 'showEducation', label: 'Education', description: 'Who can see your educational background' },
        { key: 'showProjects', label: 'Projects & Portfolio', description: 'Who can see your projects' },
        { key: 'showRatings', label: 'Ratings & Reviews', description: 'Who can see your ratings' },
        { key: 'showLocation', label: 'Location', description: 'Who can see your location' },
        { key: 'showSocialLinks', label: 'Social Links', description: 'Who can see your social media links' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
            <MainNavbar />

            <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-full bg-[#008080]/10 flex items-center justify-center">
                                <Shield size={24} className="text-[#008080]" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-headline">
                                    Privacy Settings
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Control who can see your profile information
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Privacy Options Key */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <Eye size={20} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2">
                                    Privacy Levels
                                </h3>
                                <div className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
                                    <p><strong>Public:</strong> Visible to everyone, including visitors not logged in</p>
                                    <p><strong>Authenticated:</strong> Only visible to logged-in users</p>
                                    <p><strong>Private:</strong> Only visible to you</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Settings List */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
                        {settingItems.map((item, index) => (
                            <div
                                key={item.key}
                                className={`p-6 ${index !== settingItems.length - 1
                                        ? 'border-b border-gray-100 dark:border-zinc-800'
                                        : ''
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                            {item.label}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {item.description}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {(['public', 'authenticated', 'private'] as const).map((level) => (
                                            <button
                                                key={level}
                                                onClick={() => updateSetting(item.key, level)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${privacySettings?.[item.key] === level
                                                        ? 'bg-[#008080] text-white shadow-md'
                                                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                                                    }`}
                                            >
                                                {level.charAt(0).toUpperCase() + level.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Save Button */}
                    <div className="mt-6 flex items-center justify-end gap-3">
                        <Button
                            onClick={() => router.back()}
                            variant="outline"
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-[#008080] hover:bg-teal-700 text-white px-6"
                        >
                            {saving ? (
                                <>
                                    <Loader2 size={16} className="mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={16} className="mr-2" />
                                    Save Settings
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
