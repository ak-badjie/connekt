'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Crown,
    Shield,
    Eye,
    Users,
    Briefcase,
    ArrowRight,
    ArrowDown,
    CheckCircle,
} from 'lucide-react';

// Role definitions
const ROLES = [
    {
        id: 'owner',
        title: 'Owner',
        icon: Crown,
        color: 'bg-amber-500',
        borderColor: 'border-amber-500',
        description: 'Creates workspaces, assigns project owners, manages billing',
        permissions: ['Full control', 'Billing access', 'Delete workspace', 'Invite anyone'],
    },
    {
        id: 'admin',
        title: 'Admin',
        icon: Shield,
        color: 'bg-red-500',
        borderColor: 'border-red-500',
        description: 'Manages workspace settings, members, and project assignments',
        permissions: ['Manage members', 'Create projects', 'Edit settings', 'View all data'],
    },
    {
        id: 'supervisor',
        title: 'Supervisor',
        icon: Eye,
        color: 'bg-purple-500',
        borderColor: 'border-purple-500',
        description: 'Reviews POTs, validates work, approves task completions',
        permissions: ['Approve POTs', 'Request revisions', 'View project progress', 'Reassign tasks'],
    },
    {
        id: 'employee',
        title: 'Employee',
        icon: Users,
        color: 'bg-[#008080]',
        borderColor: 'border-[#008080]',
        description: 'Permanent team members working on recurring tasks and salary',
        permissions: ['Complete tasks', 'Submit POTs', 'View assigned projects', 'Request help'],
    },
    {
        id: 'freelancer',
        title: 'Freelancer',
        icon: Briefcase,
        color: 'bg-blue-500',
        borderColor: 'border-blue-500',
        description: 'Contract-based workers paid per task or project completion',
        permissions: ['Complete tasks', 'Submit POTs/POPs', 'Sign contracts', 'Receive payments'],
    },
];

export default function ConnektRolesSection() {
    return (
        <section className="w-full py-16 md:py-24 px-6 md:px-12 lg:px-20 bg-white">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#008080]/10 text-[#008080] text-xs font-bold mb-6">
                        <Users className="w-4 h-4" />
                        ROLE SYSTEM
                    </div>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-4">
                        Roles & <span className="text-[#008080]">Permissions</span>
                    </h2>
                    <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
                        A sophisticated role-based access control system that ensures everyone has exactly the
                        permissions they need — no more, no less.
                    </p>
                </div>

                {/* Hierarchy Diagram */}
                <div className="mb-16">
                    <div className="flex flex-col items-center">
                        {/* Owner at top */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="flex flex-col items-center"
                        >
                            <div className="w-20 h-20 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                                <Crown className="w-10 h-10 text-white" />
                            </div>
                            <span className="mt-2 font-bold text-gray-900">Owner</span>
                        </motion.div>

                        <ArrowDown className="w-6 h-6 text-gray-300 my-3" />

                        {/* Admin */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="flex flex-col items-center"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                                <Shield className="w-8 h-8 text-white" />
                            </div>
                            <span className="mt-2 font-bold text-gray-900">Admin</span>
                        </motion.div>

                        <ArrowDown className="w-6 h-6 text-gray-300 my-3" />

                        {/* Supervisor */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col items-center"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                <Eye className="w-7 h-7 text-white" />
                            </div>
                            <span className="mt-2 font-bold text-gray-900">Supervisor</span>
                        </motion.div>

                        <ArrowDown className="w-6 h-6 text-gray-300 my-3" />

                        {/* Workers - Side by side */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center gap-4 sm:gap-8"
                        >
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-[#008080] flex items-center justify-center shadow-lg shadow-teal-500/30">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                                <span className="mt-2 font-bold text-gray-900">Employee</span>
                            </div>
                            <span className="text-gray-300 text-2xl">/</span>
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                    <Briefcase className="w-6 h-6 text-white" />
                                </div>
                                <span className="mt-2 font-bold text-gray-900">Freelancer</span>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Role Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ROLES.map((role, i) => {
                        const Icon = role.icon;
                        return (
                            <motion.div
                                key={role.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className={`bg-white rounded-2xl border-2 ${role.borderColor} p-6 shadow-lg hover:shadow-xl transition-shadow`}
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`w-12 h-12 rounded-xl ${role.color} flex items-center justify-center`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">{role.title}</h3>
                                </div>
                                <p className="text-gray-600 text-sm mb-4">{role.description}</p>
                                <div className="space-y-2">
                                    {role.permissions.map((perm) => (
                                        <div key={perm} className="flex items-center gap-2 text-sm">
                                            <CheckCircle className={`w-4 h-4 ${role.color.replace('bg-', 'text-')}`} />
                                            <span className="text-gray-700">{perm}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Employee vs Freelancer Comparison */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-16 bg-gray-50 rounded-3xl p-8"
                >
                    <h3 className="text-center text-xl font-bold text-gray-900 mb-8">Employee vs Freelancer</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center md:text-right">
                            <div className="font-bold text-[#008080] mb-4">Employee</div>
                            <div className="space-y-3 text-sm text-gray-600">
                                <p>Monthly salary</p>
                                <p>Recurring tasks</p>
                                <p>Job templates</p>
                                <p>Work schedule</p>
                                <p>Company benefits</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-px h-full bg-gray-300 hidden md:block" />
                            <div className="text-gray-300 font-bold my-4 md:my-0">VS</div>
                        </div>
                        <div className="text-center md:text-left">
                            <div className="font-bold text-blue-500 mb-4">Freelancer</div>
                            <div className="space-y-3 text-sm text-gray-600">
                                <p>Per-task/project payment</p>
                                <p>Contract-based work</p>
                                <p>Proposals & contracts</p>
                                <p>Flexible hours</p>
                                <p>Independent contractor</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* CTA */}
                <div className="text-center mt-10">
                    <button className="inline-flex items-center gap-2 px-8 py-4 bg-[#008080] text-white font-bold rounded-full hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/20">
                        Set Up Your Team
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </section>
    );
}
