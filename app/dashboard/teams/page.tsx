'use client';

import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with the chat components
const ChatHome = dynamic(() => import('@/components/teams/ChatHome'), {
    ssr: false,
    loading: () => (
        <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
    )
});

export default function UserTeamsPage() {
    return (
        <div className="h-full">
            <ChatHome />
        </div>
    );
}
