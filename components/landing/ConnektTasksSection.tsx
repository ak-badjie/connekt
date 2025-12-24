'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    ListTodo,
    CheckSquare,
    AlertCircle,
    ArrowRight,
    Plus,
    MoreHorizontal,
    Calendar,
    User,
    Flag,
} from 'lucide-react';

// Sample tasks with different statuses
const KANBAN_COLUMNS = [
    {
        title: 'To Do',
        color: 'bg-gray-400',
        tasks: [
            { title: 'Design system updates', priority: 'high', assignee: 'S', dueDate: 'Dec 28' },
            { title: 'API documentation', priority: 'medium', assignee: 'J', dueDate: 'Dec 30' },
        ]
    },
    {
        title: 'In Progress',
        color: 'bg-[#008080]',
        tasks: [
            { title: 'User authentication flow', priority: 'high', assignee: 'A', dueDate: 'Dec 25' },
            { title: 'Dashboard analytics', priority: 'low', assignee: 'D', dueDate: 'Jan 2' },
            { title: 'Mobile responsive fixes', priority: 'medium', assignee: 'F', dueDate: 'Dec 26' },
        ]
    },
    {
        title: 'Done',
        color: 'bg-green-500',
        tasks: [
            { title: 'Project setup', priority: 'done', assignee: 'S', dueDate: 'Dec 20' },
            { title: 'Database schema', priority: 'done', assignee: 'J', dueDate: 'Dec 22' },
        ]
    },
];

const getPriorityStyles = (priority: string) => {
    switch (priority) {
        case 'high': return 'bg-red-100 text-red-700';
        case 'medium': return 'bg-amber-100 text-amber-700';
        case 'low': return 'bg-blue-100 text-blue-700';
        default: return 'bg-gray-100 text-gray-500';
    }
};

export default function ConnektTasksSection() {
    return (
        <section className="w-full py-16 md:py-24 px-6 md:px-12 lg:px-20 bg-slate-50">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="text-center mb-12">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#008080]/10 text-[#008080] text-xs font-bold mb-6">
                        <ListTodo className="w-4 h-4" />
                        TASK MANAGEMENT
                    </div>

                    {/* Main Heading */}
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-4">
                        Connekt <span className="text-[#008080]">Tasks</span>
                    </h2>

                    {/* Description */}
                    <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
                        A powerful Kanban-style task system that adapts to how you work. Drag, drop, and conquer your workload with AI-powered prioritization.
                    </p>
                </div>

                {/* Kanban Board Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xl"
                >
                    {/* Board Header */}
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h3 className="font-bold text-gray-900">E-Commerce Platform</h3>
                            <div className="flex -space-x-2">
                                {['S', 'J', 'A', 'D'].map((initial, i) => (
                                    <div
                                        key={i}
                                        className="w-7 h-7 rounded-full bg-gradient-to-br from-[#008080] to-teal-400 border-2 border-white flex items-center justify-center text-xs text-white font-bold"
                                    >
                                        {initial}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="px-3 py-1.5 bg-[#008080] text-white text-sm font-bold rounded-lg flex items-center gap-1">
                                <Plus className="w-4 h-4" />
                                Add Task
                            </button>
                        </div>
                    </div>

                    {/* Kanban Columns */}
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {KANBAN_COLUMNS.map((column) => (
                            <div key={column.title} className="bg-gray-50 rounded-xl p-4">
                                {/* Column Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${column.color}`} />
                                        <span className="font-bold text-gray-700">{column.title}</span>
                                        <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                                            {column.tasks.length}
                                        </span>
                                    </div>
                                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                </div>

                                {/* Tasks */}
                                <div className="space-y-3">
                                    {column.tasks.map((task, i) => (
                                        <motion.div
                                            key={task.title}
                                            initial={{ opacity: 0, y: 10 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.1 }}
                                            className="bg-white rounded-lg p-3 border border-gray-200 hover:border-[#008080] hover:shadow-md transition-all cursor-pointer group"
                                        >
                                            <p className="text-sm font-medium text-gray-800 mb-2 group-hover:text-[#008080] transition-colors">
                                                {task.title}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {task.priority !== 'done' && (
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getPriorityStyles(task.priority)}`}>
                                                            {task.priority.toUpperCase()}
                                                        </span>
                                                    )}
                                                    {task.priority === 'done' && (
                                                        <CheckSquare className="w-4 h-4 text-green-500" />
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {task.dueDate}
                                                    </span>
                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#008080] to-teal-400 flex items-center justify-center text-[10px] text-white font-bold">
                                                        {task.assignee}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Add Task Button */}
                                <button className="w-full mt-3 py-2 border border-dashed border-gray-300 rounded-lg text-gray-400 text-sm flex items-center justify-center gap-1 hover:border-[#008080] hover:text-[#008080] transition-colors">
                                    <Plus className="w-4 h-4" />
                                    Add task
                                </button>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA */}
                <div className="text-center mt-10">
                    <button className="inline-flex items-center gap-2 px-8 py-4 bg-[#008080] text-white font-bold rounded-full hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/20">
                        Try Task Management
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </section>
    );
}
