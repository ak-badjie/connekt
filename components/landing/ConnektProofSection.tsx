'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Shield,
    FileCheck,
    Camera,
    Video,
    Link,
    CheckCircle,
    Clock,
    ArrowRight,
    FileText,
    Briefcase,
    ListTodo,
    DollarSign,
} from 'lucide-react';

// POP/POT Flow Steps
const PROOF_FLOW = [
    { step: 1, label: 'Submit Work', desc: 'Upload screenshots, videos, links' },
    { step: 2, label: 'Review & Validate', desc: 'Supervisor validates completion' },
    { step: 3, label: 'Payment Released', desc: 'Funds automatically released' },
];

export default function ConnektProofSection() {
    return (
        <section className="w-full py-16 md:py-24 px-6 md:px-12 lg:px-20 bg-slate-50">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#008080]/10 text-[#008080] text-xs font-bold mb-6">
                        <Shield className="w-4 h-4" />
                        PROOF SYSTEM
                    </div>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-4">
                        POPs & <span className="text-[#008080]">POTs</span>
                    </h2>
                    <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
                        Our revolutionary Proof of Project (POP) and Proof of Task (POT) system ensures
                        transparent work validation and secure, automatic payments.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">

                    {/* LEFT: POT Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xl"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#008080] to-teal-500 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                    <ListTodo className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-xl">Proof of Task</h3>
                                    <p className="text-white/80 text-sm">POT</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <p className="text-gray-600 mb-6">
                                When a team member completes a task, they submit a <strong>POT</strong> with evidence
                                of completion. Supervisors review and approve, triggering automatic payment release.
                            </p>

                            {/* Evidence Types */}
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-gray-700 mb-3">Evidence Includes:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { icon: Camera, label: 'Screenshots' },
                                        { icon: Video, label: 'Videos' },
                                        { icon: Link, label: 'Links' },
                                        { icon: FileText, label: 'Notes' },
                                    ].map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <div key={item.label} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                                                <Icon className="w-4 h-4 text-[#008080]" />
                                                <span className="text-sm text-gray-700">{item.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* POT Status */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h4 className="text-sm font-bold text-gray-700 mb-3">POT Statuses:</h4>
                                <div className="space-y-2">
                                    {[
                                        { status: 'Pending', color: 'bg-amber-500', desc: 'Awaiting review' },
                                        { status: 'Approved', color: 'bg-green-500', desc: 'Payment released' },
                                        { status: 'Revision', color: 'bg-orange-500', desc: 'Changes needed' },
                                        { status: 'Rejected', color: 'bg-red-500', desc: 'Work not accepted' },
                                    ].map((s) => (
                                        <div key={s.status} className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${s.color}`} />
                                            <span className="text-sm font-medium text-gray-700">{s.status}</span>
                                            <span className="text-xs text-gray-400">— {s.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* RIGHT: POP Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xl"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                    <Briefcase className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-xl">Proof of Project</h3>
                                    <p className="text-white/80 text-sm">POP</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <p className="text-gray-600 mb-6">
                                For project-level contracts, a <strong>POP</strong> is submitted when the entire project is
                                completed. The client reviews and approves, releasing the project payment.
                            </p>

                            {/* Difference from POT */}
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-gray-700 mb-3">Key Differences:</h4>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Scope', pot: 'Single Task', pop: 'Entire Project' },
                                        { label: 'Reviewer', pot: 'Supervisor', pop: 'Client/Owner' },
                                        { label: 'Payment', pot: 'Task Amount', pop: 'Project Budget' },
                                    ].map((diff) => (
                                        <div key={diff.label} className="flex items-center gap-4 text-sm">
                                            <span className="w-20 text-gray-500">{diff.label}</span>
                                            <span className="flex-1 bg-[#008080]/10 text-[#008080] px-3 py-1 rounded text-center font-medium">{diff.pot}</span>
                                            <span className="flex-1 bg-indigo-100 text-indigo-700 px-3 py-1 rounded text-center font-medium">{diff.pop}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Why it matters */}
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                                <h4 className="text-sm font-bold text-indigo-700 mb-2">Why POPs Matter:</h4>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        Legal proof of project delivery
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        Automatic escrow release
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        Dispute protection
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Flow Diagram */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-16 bg-white rounded-3xl border border-gray-200 p-8"
                >
                    <h3 className="text-center text-xl font-bold text-gray-900 mb-8">How It Works</h3>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
                        {PROOF_FLOW.map((step, i) => (
                            <React.Fragment key={step.step}>
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-[#008080] flex items-center justify-center mb-3 shadow-lg shadow-teal-500/30">
                                        {step.step === 1 && <FileCheck className="w-8 h-8 text-white" />}
                                        {step.step === 2 && <Clock className="w-8 h-8 text-white" />}
                                        {step.step === 3 && <DollarSign className="w-8 h-8 text-white" />}
                                    </div>
                                    <span className="font-bold text-gray-900">{step.label}</span>
                                    <span className="text-xs text-gray-500 max-w-[120px]">{step.desc}</span>
                                </div>
                                {i < PROOF_FLOW.length - 1 && (
                                    <ArrowRight className="w-6 h-6 text-gray-300 rotate-90 md:rotate-0" />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </motion.div>

                {/* CTA */}
                <div className="text-center mt-10">
                    <button className="inline-flex items-center gap-2 px-8 py-4 bg-[#008080] text-white font-bold rounded-full hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/20">
                        Learn More About Proof System
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </section>
    );
}
