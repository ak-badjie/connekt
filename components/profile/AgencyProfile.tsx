'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
    MapPin, Link as LinkIcon, Calendar, Mail, Edit,
    Briefcase, Users, Star, Award, Github,
    Linkedin, Twitter, Globe, Camera, Video, Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Agency } from '@/lib/services/agency-service';

interface AgencyProfileProps {
    agency: Agency & {
        description?: string;
        coverImage?: string;
        industry?: string;
        size?: string;
        location?: string;
        website?: string;
        socialLinks?: {
            linkedin?: string;
            twitter?: string;
            instagram?: string;
        };
        videoDemo?: string;
        projects?: any[];
        reviews?: any[];
    };
    isOwner: boolean;
}

export function AgencyProfile({ agency, isOwner }: AgencyProfileProps) {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-20">
            {/* Cover Image */}
            <div className="h-64 md:h-80 w-full relative bg-gradient-to-r from-blue-600 to-indigo-700">
                {agency.coverImage ? (
                    <Image
                        src={agency.coverImage}
                        alt="Cover"
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                )}

                {isOwner && (
                    <Button
                        variant="secondary"
                        size="sm"
                        className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-900"
                    >
                        <Camera className="w-4 h-4 mr-2" />
                        Edit Cover
                    </Button>
                )}
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative -mt-24 mb-8 flex flex-col md:flex-row items-end md:items-start gap-6">
                    {/* Agency Logo */}
                    <div className="relative">
                        <div className="w-40 h-40 md:w-48 md:h-48 rounded-2xl border-4 border-white dark:border-zinc-900 overflow-hidden bg-white shadow-xl">
                            {agency.logoUrl ? (
                                <Image
                                    src={agency.logoUrl}
                                    alt={agency.name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-5xl font-bold">
                                    {agency.name[0].toUpperCase()}
                                </div>
                            )}
                        </div>
                        {isOwner && (
                            <button className="absolute bottom-2 right-2 p-2 bg-white dark:bg-zinc-800 rounded-full shadow-lg border border-gray-200 dark:border-zinc-700 hover:scale-105 transition-transform">
                                <Camera className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            </button>
                        )}
                    </div>

                    {/* Basic Info */}
                    <div className="flex-1 pt-4 md:pt-24 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-headline">
                                    {agency.name}
                                </h1>
                                <p className="text-lg text-blue-600 dark:text-blue-400 font-medium mt-1">
                                    @{agency.username}
                                </p>
                                <div className="flex items-center justify-center md:justify-start gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                                    {agency.location && (
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {agency.location}
                                        </div>
                                    )}
                                    {agency.industry && (
                                        <div className="flex items-center gap-1">
                                            <Building2 className="w-4 h-4" />
                                            {agency.industry}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        Founded {new Date(agency.createdAt?.seconds * 1000).getFullYear()}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 justify-center md:justify-end">
                                {isOwner ? (
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit Agency
                                    </Button>
                                ) : (
                                    <>
                                        <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                                            <Mail className="w-4 h-4 mr-2" />
                                            Contact
                                        </Button>
                                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                            Hire Agency
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-8 border-b border-gray-200 dark:border-zinc-800 mb-8 overflow-x-auto">
                    {['Overview', 'Services', 'Portfolio', 'Team', 'Reviews'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            className={`pb-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === tab.toLowerCase()
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            {tab}
                            {activeTab === tab.toLowerCase() && (
                                <motion.div
                                    layoutId="activeTabAgency"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column (Bio, Stats, Socials) */}
                    <div className="space-y-6">
                        {/* Bio */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 font-headline">About Us</h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {agency.description || "No description added yet."}
                            </p>
                        </div>

                        {/* Video Demo */}
                        {agency.videoDemo && (
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 font-headline flex items-center gap-2">
                                    <Video className="w-5 h-5 text-blue-600" />
                                    Agency Reel
                                </h3>
                                <div className="aspect-video rounded-xl overflow-hidden bg-black">
                                    <video
                                        src={agency.videoDemo}
                                        controls
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 font-headline">Agency Stats</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {agency.members?.length || 1}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Members</div>
                                </div>
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {agency.size || '1-10'}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Size</div>
                                </div>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 font-headline">Connect</h3>
                            <div className="space-y-3">
                                {agency.website && (
                                    <a href={agency.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors">
                                        <Globe className="w-5 h-5" />
                                        <span className="text-sm truncate">{agency.website.replace(/^https?:\/\//, '')}</span>
                                    </a>
                                )}
                                {agency.socialLinks?.linkedin && (
                                    <a href={agency.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:text-[#0077b5] transition-colors">
                                        <Linkedin className="w-5 h-5" />
                                        <span className="text-sm">LinkedIn</span>
                                    </a>
                                )}
                                {agency.socialLinks?.twitter && (
                                    <a href={agency.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:text-[#1da1f2] transition-colors">
                                        <Twitter className="w-5 h-5" />
                                        <span className="text-sm">Twitter</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Main Content) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Services Section */}
                        {(activeTab === 'overview' || activeTab === 'services') && (
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white font-headline flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-blue-600" />
                                        Services
                                    </h3>
                                    {isOwner && (
                                        <Button variant="ghost" size="sm" className="text-blue-600">
                                            <PlusCircle className="w-4 h-4 mr-1" /> Add
                                        </Button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Placeholder */}
                                    <div className="border border-dashed border-gray-300 dark:border-zinc-700 rounded-xl p-8 text-center col-span-full">
                                        <p className="text-gray-500">Services will appear here</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Portfolio Section */}
                        {(activeTab === 'overview' || activeTab === 'portfolio') && (
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white font-headline flex items-center gap-2">
                                        <Award className="w-5 h-5 text-blue-600" />
                                        Portfolio
                                    </h3>
                                    {isOwner && (
                                        <Button variant="ghost" size="sm" className="text-blue-600">
                                            <PlusCircle className="w-4 h-4 mr-1" /> Add
                                        </Button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Placeholder */}
                                    <div className="border border-dashed border-gray-300 dark:border-zinc-700 rounded-xl p-8 text-center col-span-full">
                                        <p className="text-gray-500">Portfolio items will appear here</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function PlusCircle({ className, ...props }: any) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            {...props}
        >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8" />
            <path d="M12 8v8" />
        </svg>
    );
}
