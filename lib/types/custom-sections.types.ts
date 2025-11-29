import { Timestamp } from 'firebase/firestore';
import { ProfileMedia } from './profile.types';

// Custom Section Types
export type CustomSectionType =
    | 'text'
    | 'media_gallery'
    | 'links'
    | 'achievements'
    | 'testimonials'
    | 'timeline'
    | 'stats';

export type SectionVisibility = 'public' | 'authenticated' | 'private';

// Custom Section Interface
export interface CustomSection {
    id: string;
    type: CustomSectionType;
    title: string;
    description?: string;
    visibility: SectionVisibility;
    order: number;
    content: CustomSectionContent;
    createdAt: Timestamp | any;
    updatedAt: Timestamp | any;
}

// Content types for different section types
export interface CustomSectionContent {
    // For 'text' type
    richText?: string;

    // For 'media_gallery' type
    media?: ProfileMedia[];

    // For 'links' type
    links?: SectionLink[];

    // For 'achievements' type
    achievements?: Achievement[];

    // For 'testimonials' type
    testimonials?: Testimonial[];

    // For 'timeline' type
    timelineEvents?: TimelineEvent[];

    // For 'stats' type
    stats?: CustomStat[];
}

export interface SectionLink {
    id: string;
    title: string;
    url: string;
    description?: string;
    icon?: string;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    date: Timestamp | any;
    icon?: string;
    imageUrl?: string;
}

export interface Testimonial {
    id: string;
    authorName: string;
    authorRole?: string;
    authorPhoto?: string;
    content: string;
    rating?: number;
    date: Timestamp | any;
}

export interface TimelineEvent {
    id: string;
    title: string;
    description: string;
    date: Timestamp | any;
    media?: ProfileMedia;
}

export interface CustomStat {
    id: string;
    label: string;
    value: string | number;
    icon?: string;
    color?: string;
}

// Referral Interface
export interface Referral {
    id: string;
    fromUserId: string;
    fromUserName: string;
    fromUserPhoto?: string;
    relationship: string; // e.g., "Worked together at Company X"
    endorsement: string;
    skills?: string[]; // Skills they endorse you for
    createdAt: Timestamp | any;
}

// Project Reference (for auto-synced projects)
export interface ProjectReference {
    id: string;
    title: string;
    description: string;
    status: 'active' | 'completed' | 'archived';
    role: string;
    startDate: Timestamp | any;
    endDate?: Timestamp | any;
    media?: ProfileMedia[];
    technologies?: string[];
    isVisible: boolean; // Controlled by privacy settings
}

// Task Reference (for auto-synced tasks)
export interface TaskReference {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in-progress' | 'done' | 'paid';
    projectId?: string;
    projectName?: string;
    completedAt?: Timestamp | any;
    isVisible: boolean; // Controlled by privacy settings
}

// Section Order Type (for drag-and-drop reordering)
export type SectionOrderItem = {
    sectionId: string;
    type: 'default' | 'custom'; // default = built-in sections, custom = user-created
    order: number;
};
