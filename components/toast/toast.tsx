'use client';

/**
 * Custom useToast hook for consistent toast API across the app.
 * Wraps react-hot-toast with a more convenient API.
 */

import toast from 'react-hot-toast';

export function useToast() {
    return {
        success: (title: string, message?: string) => {
            toast.success(message ? `${title}: ${message}` : title);
        },
        error: (title: string, message?: string) => {
            toast.error(message ? `${title}: ${message}` : title);
        },
        info: (message: string) => {
            toast(message);
        },
        loading: (message: string) => {
            return toast.loading(message);
        },
        dismiss: (toastId?: string) => {
            toast.dismiss(toastId);
        },
        promise: <T,>(
            promise: Promise<T>,
            msgs: { loading: string; success: string; error: string }
        ) => {
            return toast.promise(promise, msgs);
        }
    };
}

// Also export a direct toast object for simple use cases
export { toast };
