'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { NotificationProvider } from '@/context/NotificationContext';
import { ConferenceProvider } from '@/components/conference/ConferenceProvider';
import { AnimationProvider } from '@/context/AnimationContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <NotificationProvider>
                <ConferenceProvider>
                    <AnimationProvider>
                        <Toaster position="bottom-right" />
                        {children}
                    </AnimationProvider>
                </ConferenceProvider>
            </NotificationProvider>
        </ThemeProvider>
    );
}
