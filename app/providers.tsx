'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { NotificationProvider } from '@/context/NotificationContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <NotificationProvider>
                <Toaster position="bottom-right" />
                {children}
            </NotificationProvider>
        </ThemeProvider>
    );
}
