'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Heart,
    Sparkles,
    Mail,
    MapPin,
    Github,
    Twitter,
    Linkedin,
    Instagram,
    ArrowUp,
} from 'lucide-react';
import ConnektIcon from '@/components/branding/ConnektIcon';

const FOOTER_LINKS = {
    product: [
        { label: 'Features', href: '#' },
        { label: 'Pricing', href: '#' },
        { label: 'AI Tools', href: '#' },
        { label: 'Contracts', href: '#' },
        { label: 'Wallet', href: '#' },
    ],
    company: [
        { label: 'About', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Press', href: '#' },
    ],
    resources: [
        { label: 'Documentation', href: '#' },
        { label: 'Help Center', href: '#' },
        { label: 'Community', href: '#' },
        { label: 'API', href: '#' },
    ],
    legal: [
        { label: 'Privacy', href: '#' },
        { label: 'Terms', href: '#' },
        { label: 'Security', href: '#' },
    ],
};

const SOCIAL_LINKS = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Github, href: '#', label: 'GitHub' },
];

export default function ConnektFooter() {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="relative w-full bg-zinc-950 text-white overflow-hidden">

            {/* Gradient Top Border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#008080] to-transparent" />

            {/* Floating Particles Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 rounded-full bg-[#008080]/30"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                        }}
                    />
                ))}
            </div>

            <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-20 pt-20 pb-10">

                {/* Main Footer Content */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-10 mb-16">

                    {/* Brand Column */}
                    <div className="col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-[#008080] flex items-center justify-center">
                                <ConnektIcon className="w-7 h-7" />
                            </div>
                            <span className="text-2xl font-black tracking-tight">Connekt</span>
                        </div>
                        <p className="text-gray-400 text-sm mb-6 max-w-xs">
                            The ultimate platform for freelancers, agencies, and businesses.
                            Connect, collaborate, and grow together.
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <MapPin className="w-4 h-4" />
                            <span>The Gambia, West Africa</span>
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h4 className="font-bold text-white mb-4">Product</h4>
                        <ul className="space-y-3">
                            {FOOTER_LINKS.product.map((link) => (
                                <li key={link.label}>
                                    <a href={link.href} className="text-gray-400 hover:text-[#008080] transition-colors text-sm">
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h4 className="font-bold text-white mb-4">Company</h4>
                        <ul className="space-y-3">
                            {FOOTER_LINKS.company.map((link) => (
                                <li key={link.label}>
                                    <a href={link.href} className="text-gray-400 hover:text-[#008080] transition-colors text-sm">
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources Links */}
                    <div>
                        <h4 className="font-bold text-white mb-4">Resources</h4>
                        <ul className="space-y-3">
                            {FOOTER_LINKS.resources.map((link) => (
                                <li key={link.label}>
                                    <a href={link.href} className="text-gray-400 hover:text-[#008080] transition-colors text-sm">
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h4 className="font-bold text-white mb-4">Legal</h4>
                        <ul className="space-y-3">
                            {FOOTER_LINKS.legal.map((link) => (
                                <li key={link.label}>
                                    <a href={link.href} className="text-gray-400 hover:text-[#008080] transition-colors text-sm">
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Newsletter Section */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 mb-16">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h3 className="text-xl font-bold mb-2">Stay in the loop</h3>
                            <p className="text-gray-400 text-sm">Get updates on new features and early access.</p>
                        </div>
                        <div className="flex w-full md:w-auto gap-3">
                            <input
                                type="email"
                                placeholder="your@email.com"
                                className="flex-1 md:w-64 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#008080] transition-colors"
                            />
                            <button className="px-6 py-3 bg-[#008080] hover:bg-teal-600 text-white font-bold rounded-xl transition-colors flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Subscribe
                            </button>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-zinc-800 pt-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">

                        {/* Copyright + Built With Love */}
                        <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-gray-400">
                            <span>© 2024 Connekt. All rights reserved.</span>
                            <span className="hidden md:block text-zinc-700">•</span>
                            <motion.span
                                className="flex items-center gap-2"
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                Built with
                                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                                in The Gambia
                            </motion.span>
                        </div>

                        {/* Social Links */}
                        <div className="flex items-center gap-4">
                            {SOCIAL_LINKS.map((social) => {
                                const Icon = social.icon;
                                return (
                                    <a
                                        key={social.label}
                                        href={social.href}
                                        aria-label={social.label}
                                        className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-[#008080] text-gray-400 hover:text-white flex items-center justify-center transition-all"
                                    >
                                        <Icon className="w-5 h-5" />
                                    </a>
                                );
                            })}
                        </div>

                        {/* Back to Top */}
                        <motion.button
                            onClick={scrollToTop}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-12 h-12 rounded-xl bg-[#008080] hover:bg-teal-600 text-white flex items-center justify-center transition-colors shadow-lg shadow-teal-500/20"
                        >
                            <ArrowUp className="w-5 h-5" />
                        </motion.button>
                    </div>
                </div>

                {/* Solo Developer Credit - The Heart of It All */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-16 text-center"
                >
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 rounded-full border border-zinc-700">
                        <Sparkles className="w-5 h-5 text-[#008080]" />
                        <span className="text-sm text-gray-300">
                            <span className="font-bold text-white">1 month</span> of solo development by GiDave '19
                            <span className="mx-2">•</span>
                            <span className="font-bold text-white">1 vision</span>
                            <span className="mx-2">•</span>
                            <span className="font-bold text-[#008080]">Infinite possibilities</span>
                        </span>
                        <Sparkles className="w-5 h-5 text-[#008080]" />
                    </div>
                </motion.div>
            </div>
        </footer>
    );
}
