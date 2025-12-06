import { db } from '@/lib/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    addDoc,
    updateDoc,
    serverTimestamp,
    orderBy,
    onSnapshot,
    limit
} from 'firebase/firestore';
import { Meeting } from '@/lib/types/meeting.types';

export const MeetingService = {
    /**
     * Create a new meeting
     */
    async createMeeting(data: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt' | 'status'>) {
        // Omit undefined optional fields to satisfy Firestore (no undefined allowed)
        const meetingData: any = {
            title: data.title,
            description: data.description,
            startTime: data.startTime,
            ...(typeof data.endTime === 'number' ? { endTime: data.endTime } : {}),
            duration: data.duration,
            hostId: data.hostId,
            hostName: data.hostName,
            participants: data.participants,
            type: data.type,
            ...(data.conversationId ? { conversationId: data.conversationId } : {}),
            ...(data.projectId ? { projectId: data.projectId } : {}),
            ...(data.workspaceId ? { workspaceId: data.workspaceId } : {}),
            ...(data.agencyId ? { agencyId: data.agencyId } : {}),
            status: 'scheduled',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        const docRef = await addDoc(collection(db, 'meetings'), meetingData);
        return docRef.id;
    },

    /**
     * Get meeting by ID
     */
    async getMeeting(meetingId: string): Promise<Meeting | null> {
        const docRef = doc(db, 'meetings', meetingId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return null;

        return {
            id: docSnap.id,
            ...docSnap.data()
        } as Meeting;
    },

    /**
     * Get upcoming meetings for a user
     */
    async getUpcomingMeetings(userId: string) {
        const q = query(
            collection(db, 'meetings'),
            where('participants', 'array-contains', userId),
            where('status', 'in', ['scheduled', 'active']),
            orderBy('startTime', 'asc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Meeting));
    },

    /**
     * Update meeting status
     */
    async updateMeetingStatus(meetingId: string, status: Meeting['status']) {
        await updateDoc(doc(db, 'meetings', meetingId), {
            status,
            updatedAt: Date.now()
        });
    },

    /**
     * Join meeting (update participant status?)
     * For now, just return true if allowed
     */
    async joinMeeting(meetingId: string, userId: string) {
        const meeting = await this.getMeeting(meetingId);
        if (!meeting) throw new Error('Meeting not found');

        // Check if user is allowed
        // if (!meeting.participants.includes(userId)) throw new Error('Not authorized');

        return meeting;
    },

    /**
     * Subscribe to a specific meeting (for status updates)
     */
    subscribeToMeeting(meetingId: string, callback: (meeting: Meeting | null) => void) {
        return onSnapshot(doc(db, 'meetings', meetingId), (doc) => {
            if (doc.exists()) {
                callback({ id: doc.id, ...doc.data() } as Meeting);
            } else {
                callback(null);
            }
        });
    }
};
