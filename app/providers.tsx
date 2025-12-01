'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { NotificationProvider } from '@/context/NotificationContext';
import { ConferenceProvider } from '@/components/conference/ConferenceProvider';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <NotificationProvider>
                <ConferenceProvider>
                    <Toaster position="bottom-right" />
                    {children}
                </ConferenceProvider>
            </NotificationProvider>
        </ThemeProvider>
    );
}
