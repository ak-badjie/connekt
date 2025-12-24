'use client';

import React from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import {
    Bot,
    Code2,
    Palette,
    TrendingUp,
    Languages,
    HeadphonesIcon,
    Calculator,
    Scale,
    GraduationCap,
    Wrench
} from 'lucide-react';

// Category data with icons and search queries
const CATEGORIES = [
    {
        id: 'ai-services',
        icon: Bot,
        label: 'AI Services',
        searchQuery: 'AI,machine learning,automation,chatbot',
    },
    {
        id: 'development',
        icon: Code2,
        label: 'Development & IT',
        searchQuery: 'developer,programmer,software,web development,mobile app',
    },
    {
        id: 'design',
        icon: Palette,
        label: 'Design & Creative',
        searchQuery: 'design,graphic design,UI,UX,illustration,branding',
    },
    {
        id: 'sales',
        icon: TrendingUp,
        label: 'Sales & Marketing',
        searchQuery: 'sales,marketing,SEO,social media,content marketing',
    },
    {
        id: 'writing',
        icon: Languages,
        label: 'Writing & Translation',
        searchQuery: 'writing,copywriting,translation,content,editing',
    },
    {
        id: 'admin',
        icon: HeadphonesIcon,
        label: 'Admin & Support',
        searchQuery: 'admin,virtual assistant,customer service,data entry',
    },
    {
        id: 'finance',
        icon: Calculator,
        label: 'Finance & Accounting',
        searchQuery: 'accounting,bookkeeping,finance,financial analysis',
    },
    {
        id: 'legal',
        icon: Scale,
        label: 'Legal',
        searchQuery: 'legal,contract,compliance,paralegal',
    },
    {
        id: 'hr-training',
        icon: GraduationCap,
        label: 'HR & Training',
        searchQuery: 'HR,human resources,training,recruiting,onboarding',
    },
    {
        id: 'engineering',
        icon: Wrench,
        label: 'Engineering & Architecture',
        searchQuery: 'engineering,CAD,architecture,3D modeling,technical',
    }
];

interface CategoryCardProps {
    category: typeof CATEGORIES[0];
    index: number;
}

function CategoryCard({ category, index }: CategoryCardProps) {
    const Icon = category.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
        >
            <Link
                href={`/explore?skills=${encodeURIComponent(category.searchQuery)}&mode=people`}
                className="block"
            >
                <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-[#008080] dark:hover:border-[#008080] transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-teal-500/10 cursor-pointer"
                >
                    {/* Icon container */}
                    <div className="w-12 h-12 rounded-xl bg-[#008080]/10 flex items-center justify-center mb-4 group-hover:bg-[#008080] transition-colors duration-300">
                        <Icon className="w-6 h-6 text-[#008080] group-hover:text-white transition-colors duration-300" strokeWidth={2} />
                    </div>

                    {/* Label */}
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-[#008080] dark:group-hover:text-teal-400 transition-colors duration-300 text-sm">
                        {category.label}
                    </h3>
                </motion.div>
            </Link>
        </motion.div>
    );
}

export default function ExploreSection() {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <section
            ref={ref}
            className="w-full py-16 md:py-24 px-6 md:px-12 lg:px-20 bg-white dark:bg-zinc-950"
        >
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="mb-10"
                >
                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                        Explore millions of pros
                    </h2>
                    <p className="mt-3 text-base text-gray-600 dark:text-gray-400 max-w-xl">
                        Browse by category to find the perfect talent for your project
                    </p>
                </motion.div>

                {/* Category Grid - 5 columns on large screens */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {CATEGORIES.map((category, index) => (
                        <CategoryCard
                            key={category.id}
                            category={category}
                            index={index}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
