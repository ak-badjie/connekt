'use client';

import React from 'react';
import { Settings, User, Bell, Shield, Palette } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pt-24 px-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage your account settings and preferences</p>
                </div>

                {/* Settings Grid */}
                <div className="grid gap-4">
                    {/* Account Settings */}
                    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#008080]/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-[#008080]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Account</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Update your profile and email</p>
                            </div>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Bell className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notifications</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Configure notification preferences</p>
                            </div>
                        </div>
                    </div>

                    {/* Privacy & Security */}
                    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-purple-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Privacy & Security</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your privacy settings</p>
                            </div>
                        </div>
                    </div>

                    {/* Appearance */}
                    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                                <Palette className="w-5 h-5 text-pink-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Appearance</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Customize your theme and display</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
