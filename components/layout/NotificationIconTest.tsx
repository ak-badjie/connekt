'use client';

import React from 'react';
import { Bell } from 'lucide-react';

// Simple test component to verify rendering
export default function NotificationIconTest() {
    return (
        <div className="relative">
            <button className="relative p-3 bg-white dark:bg-zinc-800 rounded-full shadow-sm hover:shadow-md hover:scale-105 text-gray-600 dark:text-gray-300 hover:text-[#008080] dark:hover:text-[#008080] transition-all duration-200 border border-gray-100 dark:border-zinc-700">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full border-2 border-white dark:border-zinc-800">
                    3
                </span>
            </button>

            {/* Test dropdown */}
            <div className="absolute right-0 top-full mt-3 w-96 max-h-[600px] bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-700 overflow-hidden z-[9999]">
                <div className="p-6">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">Test Dropdown</h3>
                    <p className="text-gray-600 dark:text-gray-400">If you can see this, the dropdown positioning works!</p>
                </div>
            </div>
        </div>
    );
}
