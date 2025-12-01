'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/context/AuthContext';
import { redirect } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { GlobalChatWidget } from '@/components/chat/GlobalChatWidget';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) return <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900"><Loader2 className="animate-spin text-[#008080]" /></div>;

    if (!user) redirect('/auth');

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-gray-900 dark:text-gray-100">
            <Sidebar />
            <Navbar />
            <main className="lg:pl-72 pt-24 pr-6 pl-6 pb-6 min-h-screen transition-all duration-300">
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl shadow-xl p-6 min-h-[calc(100vh-8rem)] overflow-hidden">
                    {children}
                </div>
            </main>
            <GlobalChatWidget />
        </div>
    );
}
