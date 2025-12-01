import { Timestamp } from 'firebase/firestore';
import { CustomSection, Referral, ProjectReference, TaskReference, SectionOrderItem } from './custom-sections.types';

// Privacy Settings
export interface PrivacySettings {
    showEmail: 'public' | 'authenticated' | 'private';
    showPhone: 'public' | 'authenticated' | 'private';
    showExperience: 'public' | 'authenticated' | 'private';
    showEducation: 'public' | 'authenticated' | 'private';
    showProjects: 'public' | 'authenticated' | 'private';
    showTasks: 'public' | 'authenticated' | 'private';
    showRatings: 'public' | 'authenticated' | 'private';
    showLocation: 'public' | 'authenticated' | 'private';
    showSocialLinks: 'public' | 'authenticated' | 'private';
    showReferrals: 'public' | 'authenticated' | 'private';
}

// Experience
export interface Experience {
    id: string;
    title: string;
    company: string;
    location?: string;
    startDate: Timestamp | any;
    endDate?: Timestamp | any;
    current: boolean;
    description: string;
    media?: ProfileMedia[];
    skills?: string[];
}

// Education
export interface Education {
    id: string;
    school: string;
    degree: string;
    field: string;
    location?: string;
    startDate: Timestamp | any;
    endDate?: Timestamp | any;
    current: boolean;
    description?: string;
    grade?: string;
}

// Certification
export interface Certification {
    id: string;
    name: string;
    issuer: string;
    issueDate: Timestamp | any;
    expiryDate?: Timestamp | any;
    credentialId?: string;
    credentialUrl?: string;
}

// Profile Media
export interface ProfileMedia {
    id: string;
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string;
    title?: string;
    description?: string;
    size?: number;
    mimeType?: string;
    uploadedAt: Timestamp | any;
}

// Rating
export interface Rating {
    id: string;
    fromUserId: string;
    fromUserName: string;
    fromUserPhoto?: string;
    rating: number; // 1-5
    review?: string;
    projectId?: string;
    projectName?: string;
    media?: ProfileMedia[];
    createdAt: Timestamp | any;
}

// Social Links
export interface SocialLinks {
    website?: string;
    linkedin?: string;
    twitter?: string;
    github?: string;
    instagram?: string;
    portfolio?: string;
    behance?: string;
    dribbble?: string;
}

// Profile Statistics
export interface ProfileStats {
    timeOnPlatform: number; // days
    projectsCompleted: number;
    tasksCompleted: number;
    averageRating: number;
    totalRatings: number;
    responseRate: number; // percentage
    hireCount: number;
    followers?: number;
    following?: number;
    profileViews?: number;
}

// Extended User Profile
export interface ExtendedUserProfile {
    uid: string;
    username: string;
    email?: string;
    displayName: string;
    photoURL?: string;
    coverImage?: string;
    bio?: string;
    title?: string; // Professional title
    location?: string;
    phone?: string;

    // Professional info
    role: 'employer' | 'va' | 'recruiter' | 'admin';
    skills: string[];
    hourlyRate?: number;
    availability?: 'available' | 'busy' | 'unavailable';

    // Extended data
    experience: Experience[];
    education: Education[];
    certifications: Certification[];
    portfolio: ProfileMedia[];
    videoIntro?: string; // URL to intro video

    // New: Custom sections and references
    customSections?: CustomSection[];
    referrals?: Referral[];
    sectionOrder?: SectionOrderItem[];

    // Social
    socialLinks: SocialLinks;

    // Stats
    stats: ProfileStats;

    // Privacy
    privacySettings: PrivacySettings;

    // Meta
    createdAt: Timestamp | any;
    updatedAt: Timestamp | any;
    lastSeen?: Timestamp | any;
}

// Extended Agency Profile
export interface ExtendedAgencyProfile {
    id: string;
    name: string;
    username: string; // handle
    domain: string;
    logoUrl?: string;
    coverImage?: string;
    description?: string;

    // Agency info
    industry?: string;
    size?: string; // e.g., "1-10", "11-50"
    location?: string;
    foundedYear?: number;
    website?: string;

    // Team
    ownerId: string;
    members: any[]; // From AgencyMember

    // Portfolio
    services: string[];
    portfolio: ProfileMedia[];
    videoReel?: string;

    // New: Custom sections
    customSections?: CustomSection[];
    sectionOrder?: SectionOrderItem[];

    // Social
    socialLinks: SocialLinks;

    // Stats
    stats: ProfileStats;

    // Privacy
    privacySettings: PrivacySettings;

    // Meta
    createdAt: Timestamp | any;
    updatedAt: Timestamp | any;
}

// Recruiter Profile
export interface RecruiterProfile {
    uid: string;
    username: string;
    displayName: string;
    photoURL?: string;
    coverImage?: string;
    bio?: string;

    // Recruiter specific
    specializations: string[]; // e.g., "Tech", "Marketing"
    placementsCount: number;
    averageResponseTime: number; // in hours

    // New: Custom sections
    customSections?: CustomSection[];
    sectionOrder?: SectionOrderItem[];

    // Stats
    stats: ProfileStats;

    // Social
    socialLinks: SocialLinks;

    // Privacy
    privacySettings: PrivacySettings;

    // Meta
    createdAt: Timestamp | any;
    updatedAt: Timestamp | any;
}

// Default Privacy Settings
export const defaultPrivacySettings: PrivacySettings = {
    showEmail: 'authenticated',
    showPhone: 'private',
    showExperience: 'public',
    showEducation: 'public',
    showProjects: 'public',
    showTasks: 'public',
    showRatings: 'public',
    showLocation: 'public',
    showSocialLinks: 'public',
    showReferrals: 'public',
};

// Default Profile Stats
export const defaultProfileStats: ProfileStats = {
    timeOnPlatform: 0,
    projectsCompleted: 0,
    tasksCompleted: 0,
    averageRating: 0,
    totalRatings: 0,
    responseRate: 0,
    hireCount: 0,
    followers: 0,
    following: 0,
    profileViews: 0,
};
