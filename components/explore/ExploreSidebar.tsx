'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import {
    SlidersHorizontal,
    DollarSign,
    MapPin,
    Star,
    Briefcase,
    Calendar,
    TrendingUp,
    Award,
    Filter,
    X
} from 'lucide-react';
import { ExploreFilters } from '@/lib/services/explore-service';

interface ExploreSidebarProps {
    viewMode: 'jobs' | 'people';
    filters: ExploreFilters;
    onFiltersChange: (filters: ExploreFilters) => void;
}

export function ExploreSidebar({ viewMode, filters, onFiltersChange }: ExploreSidebarProps) {
    const [isOpen, setIsOpen] = useState(true);

    const updateFilter = (key: keyof ExploreFilters, value: any) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        onFiltersChange({});
    };

    const hasActiveFilters = Object.keys(filters).length > 0;

    return (
        <>
            {/* Mobile Toggle */}
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#008080] text-white shadow-2xl flex items-center justify-center"
            >
                <Filter size={24} />
            </motion.button>

            {/* Sidebar */}
            <aside className={`fixed left-4 top-20 bottom-4 w-64 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-white/5 flex flex-col p-6 z-[110] transition-all duration-300 overflow-y-auto rounded-3xl shadow-2xl shadow-black/5 ${!isOpen ? 'hidden lg:flex' : 'flex'
                }`}>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal size={24} className="text-[#008080]" />
                            <h2 className="text-xl font-black text-gray-900 dark:text-white">Filters</h2>
                        </div>
                        {hasActiveFilters && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={clearFilters}
                                className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline"
                            >
                                Clear All
                            </motion.button>
                        )}
                    </div>

                    {/* Budget Range */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                            <DollarSign size={16} className="text-[#008080]" />
                            Budget Range
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="number"
                                placeholder="Min"
                                value={filters.budgetMin || ''}
                                onChange={(e) => updateFilter('budgetMin', parseFloat(e.target.value) || undefined)}
                                className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
                            />
                            <input
                                type="number"
                                placeholder="Max"
                                value={filters.budgetMax || ''}
                                onChange={(e) => updateFilter('budgetMax', parseFloat(e.target.value) || undefined)}
                                className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
                            />
                        </div>
                    </div>

                    {viewMode === 'people' && (
                        <>
                            {/* Location */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                    <MapPin size={16} className="text-[#008080]" />
                                    Location
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter city or country"
                                    value={filters.location || ''}
                                    onChange={(e) => updateFilter('location', e.target.value || undefined)}
                                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
                                />
                            </div>

                            {/* Minimum Rating */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                    <Star size={16} className="text-[#008080]" />
                                    Minimum Rating
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[3, 4, 4.5, 4.8].map((rating) => (
                                        <motion.button
                                            key={rating}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => updateFilter('minRating', filters.minRating === rating ? undefined : rating)}
                                            className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${filters.minRating === rating
                                                ? 'bg-[#008080] text-white shadow-lg'
                                                : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                                                }`}
                                        >
                                            {rating}+ ⭐
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Availability */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                    <Calendar size={16} className="text-[#008080]" />
                                    Availability
                                </label>
                                <div className="space-y-2">
                                    {[
                                        { value: 'available', label: 'Available', color: 'green' },
                                        { value: 'busy', label: 'Busy', color: 'amber' },
                                        { value: 'unavailable', label: 'Unavailable', color: 'red' }
                                    ].map((option) => (
                                        <motion.button
                                            key={option.value}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => updateFilter('availability', filters.availability === option.value ? undefined : option.value as any)}
                                            className={`w-full px-4 py-2 rounded-xl text-sm font-bold text-left transition-all ${filters.availability === option.value
                                                ? `bg-${option.color}-100 dark:bg-${option.color}-900/30 text-${option.color}-700 dark:text-${option.color}-400 border-2 border-${option.color}-500`
                                                : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                                                }`}
                                        >
                                            {option.label}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Skills */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                    <Award size={16} className="text-[#008080]" />
                                    Skills
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {['Admin Support', 'Social Media', 'Customer Service', 'Data Entry', 'Content Writing', 'Graphic Design'].map((skill) => (
                                        <motion.button
                                            key={skill}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                const currentSkills = filters.skills || [];
                                                const newSkills = currentSkills.includes(skill)
                                                    ? currentSkills.filter(s => s !== skill)
                                                    : [...currentSkills, skill];
                                                updateFilter('skills', newSkills.length ? newSkills : undefined);
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filters.skills?.includes(skill)
                                                ? 'bg-[#008080] text-white'
                                                : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                                                }`}
                                        >
                                            {skill}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {viewMode === 'jobs' && (
                        <>
                            {/* Project Type */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                    <Briefcase size={16} className="text-[#008080]" />
                                    Project Type
                                </label>
                                <div className="space-y-2">
                                    {['One-time', 'Recurring', 'Full-time'].map((type) => (
                                        <button
                                            key={type}
                                            className="w-full px-4 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700 text-sm font-medium text-left transition-all"
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Deadline */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                    <Calendar size={16} className="text-[#008080]" />
                                    Deadline
                                </label>
                                <select className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]/20">
                                    <option>Any time</option>
                                    <option>Within 1 week</option>
                                    <option>Within 1 month</option>
                                    <option>Within 3 months</option>
                                </select>
                            </div>
                        </>
                    )}

                    {/* Sort By */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                            <TrendingUp size={16} className="text-[#008080]" />
                            Sort By
                        </label>
                        <select className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#008080]/20">
                            <option>Most Recent</option>
                            <option>Highest Rated</option>
                            <option>Highest Budget</option>
                            <option>Lowest Budget</option>
                            <option>Most Projects</option>
                            <option>Best Match</option>
                        </select>
                    </div>

                    {/* Active Filters Count */}
                    {hasActiveFilters && (
                        <div className="pt-4 border-t border-gray-200 dark:border-zinc-800">
                            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#008080]/10 dark:bg-[#008080]/20">
                                <span className="text-sm font-bold text-[#008080]">
                                    {Object.keys(filters).length} Active Filter{Object.keys(filters).length !== 1 ? 's' : ''}
                                </span>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={clearFilters}
                                    className="w-6 h-6 rounded-full bg-[#008080] text-white flex items-center justify-center"
                                >
                                    <X size={14} />
                                </motion.button>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}
