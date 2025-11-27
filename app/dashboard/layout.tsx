'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/context/AuthContext';
import { redirect } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) return <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900"><Loader2 className="animate-spin text-[#008080]" /></div>;

    if (!user) redirect('/auth');

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-gray-900 dark:text-gray-100">
            <Sidebar />
            <Navbar />
            <main className="lg:pl-64 pt-[60px] pr-6 pl-6 pb-6 min-h-screen transition-all duration-300">
                {children}
            </main>
        </div>
    );
}
