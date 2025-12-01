'use client';

import { Clock, CheckCircle, AlertCircle } from 'lucide-react';



export default function Reminders() {
    return (
        <div className="h-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-lg border border-white/20 dark:border-white/5 rounded-2xl p-6 overflow-y-auto custom-scrollbar shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Reminders</h3>
                <button className="text-xs text-[#008080] hover:underline font-medium">View All</button>
            </div>
            <div className="space-y-4">
                {/* In a real app, we would fetch reminders from MeetingService and TaskService */}
                {/* For now, we'll show an empty state or a "No upcoming reminders" message if no data */}
                {/* To truly implement this, we need MeetingService first. */}
                {/* I will leave this empty for now and populate it after implementing MeetingService */}
                <div className="text-center py-8 text-gray-400 text-sm">
                    No upcoming reminders.
                </div>
            </div>
        </div>
    );
}
