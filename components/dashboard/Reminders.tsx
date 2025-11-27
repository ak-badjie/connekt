'use client';

import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

const reminders = [
    { title: 'Team Meeting', time: '10:00 AM', type: 'meeting', color: 'blue' },
    { title: 'Project Deadline', time: '5:00 PM', type: 'deadline', color: 'red' },
    { title: 'Code Review', time: '2:30 PM', type: 'task', color: 'teal' },
];

export default function Reminders() {
    return (
        <div className="h-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-lg border border-white/20 dark:border-white/5 rounded-2xl p-6 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Reminders</h3>
                <button className="text-xs text-[#008080] hover:underline font-medium">View All</button>
            </div>
            <div className="space-y-4">
                {reminders.map((reminder, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${reminder.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600' :
                                reminder.color === 'red' ? 'bg-red-100 dark:bg-red-900/20 text-red-600' :
                                    'bg-teal-100 dark:bg-teal-900/20 text-teal-600'
                            }`}>
                            {reminder.type === 'meeting' ? <Clock size={18} /> :
                                reminder.type === 'deadline' ? <AlertCircle size={18} /> :
                                    <CheckCircle size={18} />}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{reminder.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{reminder.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
