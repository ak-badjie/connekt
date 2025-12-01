import { Timestamp } from 'firebase/firestore';

export interface WorkspaceMember {
    userId: string;
    username: string;
    email: string;
    role: 'owner' | 'admin' | 'member';
    joinedAt: any; // Timestamp | Date | FieldValue
}

export interface Workspace {
    id?: string;
    name: string;
    description: string;
    ownerId: string;
    ownerUsername: string;
    members: WorkspaceMember[];
    createdAt: any; // Timestamp | Date | FieldValue
    updatedAt: any; // Timestamp | Date | FieldValue
    isActive: boolean;
}

export interface Project {
    id?: string;
    workspaceId: string;
    ownerId: string;
    ownerUsername: string;
    title: string;
    description: string;
    budget: number;
    deadline?: string;
    status: 'planning' | 'active' | 'completed' | 'on-hold' | 'cancelled';
    assignedOwnerId?: string; // For project reassignment
    assignedOwnerUsername?: string;
    supervisors: string[]; // Array of user IDs
    members: ProjectMember[];
    recurringType?: 'none' | 'daily' | 'weekly' | 'monthly';
    pricing?: ProjectPricing;
    isPublic: boolean; // NEW: For Explore page visibility
    publishedAt?: any; // NEW: When pushed to public (Timestamp | Date | FieldValue)
    createdAt: any; // Timestamp | Date | FieldValue
    updatedAt: any; // Timestamp | Date | FieldValue
}

export interface ProjectMember {
    userId: string;
    username: string;
    email: string;
    role: 'owner' | 'supervisor' | 'member';
    assignedAt: any; // Timestamp | Date | FieldValue
}

export interface ProjectPricing {
    type: 'fixed' | 'hourly' | 'milestone';
    amount: number;
    currency: string;
    milestones?: Milestone[];
}

export interface Milestone {
    id: string;
    title: string;
    amount: number;
    dueDate?: string;
    completed: boolean;
}

export interface Task {
    id?: string;
    projectId: string;
    workspaceId: string;
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'pending-validation' | 'done' | 'paid';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assigneeId?: string;
    assigneeUsername?: string;
    isReassignable: boolean;
    timeline: TaskTimeline;
    pricing: TaskPricing;
    proofOfTask?: ProofOfTask;
    createdBy: string;
    isPublic: boolean; // NEW: For Explore page visibility
    publishedAt?: any; // NEW: When pushed to public (Timestamp | Date | FieldValue)
    createdAt: any; // Timestamp | Date | FieldValue
    updatedAt: any; // Timestamp | Date | FieldValue
}

export interface TaskTimeline {
    startDate?: string;
    dueDate?: string;
    estimatedHours?: number;
    actualHours?: number;
}

export interface TaskPricing {
    amount: number;
    currency: string;
    paymentStatus: 'unpaid' | 'pending' | 'paid';
}

export interface ProofOfTask {
    id?: string;
    taskId: string;
    submittedBy: string;
    submittedByUsername: string;
    submittedAt: any; // Timestamp | Date | FieldValue
    status: 'pending' | 'approved' | 'rejected' | 'revision-requested';
    screenshots: string[]; // URLs
    videos: string[]; // URLs
    links: string[];
    notes?: string;
    validatedBy?: string;
    validatedByUsername?: string;
    validatedAt?: any; // Timestamp | Date | FieldValue
    validationNotes?: string;
}

export interface HelpRequest {
    id?: string;
    taskId: string;
    projectId: string;
    requestedBy: string;
    requestedByUsername: string;
    message: string;
    isPublic: boolean;
    status: 'open' | 'resolved';
    createdAt: any; // Timestamp | Date | FieldValue
    resolvedAt?: any; // Timestamp | Date | FieldValue
}
