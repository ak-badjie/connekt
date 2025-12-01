'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { ConferenceRoom } from './ConferenceRoom';

interface ConferenceContextType {
    startMeeting: (meetingId: string) => void;
    joinMeeting: (meetingId: string) => void;
    activeMeetingId: string | null;
}

const ConferenceContext = createContext<ConferenceContextType | undefined>(undefined);

export function ConferenceProvider({ children }: { children: ReactNode }) {
    const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);

    const startMeeting = (meetingId: string) => {
        setActiveMeetingId(meetingId);
        setIsMinimized(false);
    };

    const joinMeeting = (meetingId: string) => {
        setActiveMeetingId(meetingId);
        setIsMinimized(false);
    };

    const leaveMeeting = () => {
        setActiveMeetingId(null);
        setIsMinimized(false);
    };

    return (
        <ConferenceContext.Provider value={{ startMeeting, joinMeeting, activeMeetingId }}>
            {children}
            {activeMeetingId && (
                <ConferenceRoom
                    meetingId={activeMeetingId}
                    onLeave={leaveMeeting}
                    isMinimized={isMinimized}
                    onToggleMinimize={() => setIsMinimized(!isMinimized)}
                />
            )}
        </ConferenceContext.Provider>
    );
}

export const useConference = () => {
    const context = useContext(ConferenceContext);
    if (!context) {
        throw new Error('useConference must be used within a ConferenceProvider');
    }
    return context;
};
