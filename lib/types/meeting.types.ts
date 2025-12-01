export interface Meeting {
    id: string;
    title: string;
    description?: string;
    startTime: number; // Timestamp
    endTime?: number; // Timestamp
    duration: number; // Minutes
    hostId: string;
    hostName: string;
    participants: string[]; // User IDs
    type: 'video' | 'audio';
    status: 'scheduled' | 'active' | 'completed' | 'cancelled';
    conversationId?: string; // Linked chat
    projectId?: string;
    workspaceId?: string;
    agencyId?: string;
    createdAt: number;
    updatedAt: number;
}

export interface MeetingParticipant {
    userId: string;
    username: string;
    avatarUrl?: string;
    role: 'host' | 'participant';
    joinedAt?: number;
    leftAt?: number;
    status: 'online' | 'offline' | 'busy';
    hasVideo?: boolean;
    hasAudio?: boolean;
}
