'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
    MapPin, Link as LinkIcon, Calendar, Mail, Edit,
    Briefcase, GraduationCap, Star, Award, Github,
    Linkedin, Twitter, Globe, Camera, Video
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

interface Experience {
    id: string;
    title: string;
    company: string;
    startDate: any;
    endDate?: any;
    current: boolean;
    description: string;
}

interface Education {
    id: string;
    school: string;
    degree: string;
    field: string;
    startDate: any;
    endDate?: any;
}

interface UserProfileProps {
    user: any; // Type will be refined
    isOwner: boolean;
}

export function UserProfile({ user, isOwner }: UserProfileProps) {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-20">
            {/* Cover Image */}
            <div className="h-64 md:h-80 w-full relative bg-gradient-to-r from-teal-500 to-emerald-600">
                {user.coverImage ? (
                    <Image
                        src={user.coverImage}
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
                    {/* Profile Picture */}
                    <div className="relative">
                        <div className="w-40 h-40 md:w-48 md:h-48 rounded-full border-4 border-white dark:border-zinc-900 overflow-hidden bg-white shadow-xl">
                            {user.photoURL ? (
                                <Image
                                    src={user.photoURL}
                                    alt={user.displayName}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#008080] to-teal-600 flex items-center justify-center text-white text-5xl font-bold">
                                    {user.displayName?.[0]?.toUpperCase()}
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
                                    {user.displayName}
                                </h1>
                                <p className="text-lg text-[#008080] font-medium mt-1">
                                    {user.title || 'Connekt Member'}
                                </p>
                                <div className="flex items-center justify-center md:justify-start gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                                    {user.location && (
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {user.location}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        Joined {new Date(user.createdAt?.seconds * 1000).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 justify-center md:justify-end">
                                {isOwner ? (
                                    <Button className="bg-[#008080] hover:bg-teal-700 text-white">
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit Profile
                                    </Button>
                                ) : (
                                    <>
                                        <Button variant="outline" className="border-[#008080] text-[#008080] hover:bg-[#008080]/5">
                                            <Mail className="w-4 h-4 mr-2" />
                                            Message
                                        </Button>
                                        <Button className="bg-[#008080] hover:bg-teal-700 text-white">
                                            Hire Me
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-8 border-b border-gray-200 dark:border-zinc-800 mb-8 overflow-x-auto">
                    {['Overview', 'Experience', 'Projects', 'Reviews'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            className={`pb-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === tab.toLowerCase()
                                ? 'text-[#008080]'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            {tab}
                            {activeTab === tab.toLowerCase() && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#008080]"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column (Bio, Skills, Socials) */}
                    <div className="space-y-6">
                        {/* Bio */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 font-headline">About</h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {user.bio || "No bio added yet."}
                            </p>
                        </div>

                        {/* Video Demo */}
                        {user.videoDemo && (
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 font-headline flex items-center gap-2">
                                    <Video className="w-5 h-5 text-[#008080]" />
                                    Video Intro
                                </h3>
                                <div className="aspect-video rounded-xl overflow-hidden bg-black">
                                    <video
                                        src={user.videoDemo}
                                        controls
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Skills */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 font-headline">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {user.skills?.map((skill: string) => (
                                    <span
                                        key={skill}
                                        className="px-3 py-1 bg-teal-50 dark:bg-teal-900/20 text-[#008080] rounded-full text-sm font-medium"
                                    >
                                        {skill}
                                    </span>
                                ))}
                                {(!user.skills || user.skills.length === 0) && (
                                    <span className="text-gray-500 text-sm italic">No skills listed</span>
                                )}
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 font-headline">Connect</h3>
                            <div className="space-y-3">
                                {user.website && (
                                    <a href={user.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:text-[#008080] transition-colors">
                                        <Globe className="w-5 h-5" />
                                        <span className="text-sm truncate">{user.website.replace(/^https?:\/\//, '')}</span>
                                    </a>
                                )}
                                {user.socialLinks?.linkedin && (
                                    <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:text-[#0077b5] transition-colors">
                                        <Linkedin className="w-5 h-5" />
                                        <span className="text-sm">LinkedIn</span>
                                    </a>
                                )}
                                {user.socialLinks?.twitter && (
                                    <a href={user.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:text-[#1da1f2] transition-colors">
                                        <Twitter className="w-5 h-5" />
                                        <span className="text-sm">Twitter</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Main Content) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Experience Section */}
                        {(activeTab === 'overview' || activeTab === 'experience') && (
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white font-headline flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-[#008080]" />
                                        Experience
                                    </h3>
                                    {isOwner && (
                                        <Button variant="ghost" size="sm" className="text-[#008080]">
                                            <PlusCircle className="w-4 h-4 mr-1" /> Add
                                        </Button>
                                    )}
                                </div>

                                <div className="space-y-8">
                                    {user.experience?.map((exp: Experience, index: number) => (
                                        <div key={index} className="relative pl-8 border-l-2 border-gray-200 dark:border-zinc-800 last:border-0">
                                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#008080] border-4 border-white dark:border-zinc-900"></div>
                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">{exp.title}</h4>
                                            <p className="text-[#008080] font-medium">{exp.company}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                                {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                                            </p>
                                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                                {exp.description}
                                            </p>
                                        </div>
                                    ))}
                                    {(!user.experience || user.experience.length === 0) && (
                                        <p className="text-gray-500 italic text-center py-4">No experience added yet.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Projects Section */}
                        {(activeTab === 'overview' || activeTab === 'projects') && (
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white font-headline flex items-center gap-2">
                                        <Award className="w-5 h-5 text-[#008080]" />
                                        Projects
                                    </h3>
                                    {isOwner && (
                                        <Button variant="ghost" size="sm" className="text-[#008080]">
                                            <PlusCircle className="w-4 h-4 mr-1" /> Add
                                        </Button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Placeholder for projects */}
                                    <div className="border border-dashed border-gray-300 dark:border-zinc-700 rounded-xl p-8 text-center">
                                        <p className="text-gray-500">Projects will appear here</p>
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
