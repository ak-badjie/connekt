import { useCallback } from 'react';

const STORAGE_KEY = 'connekt_visited_pages';

export function useLoadingSession() {
    const getVisitedPages = useCallback((): string[] => {
        if (typeof window === 'undefined') return [];
        try {
            const stored = sessionStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }, []);

    const markPageVisited = useCallback((path: string) => {
        if (typeof window === 'undefined') return;
        try {
            const visited = getVisitedPages();
            if (!visited.includes(path)) {
                visited.push(path);
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(visited));
            }
        } catch (error) {
            console.error('Error marking page as visited:', error);
        }
    }, [getVisitedPages]);

    const shouldShowAnimation = useCallback((path: string): boolean => {
        // Always show animation for profile pages (/@username pattern)
        if (path.startsWith('/@')) {
            return true;
        }

        // Check if page was already visited in this session
        const visited = getVisitedPages();
        return !visited.includes(path);
    }, [getVisitedPages]);

    const hasVisited = useCallback((path: string): boolean => {
        const visited = getVisitedPages();
        return visited.includes(path);
    }, [getVisitedPages]);

    const clearSession = useCallback(() => {
        if (typeof window === 'undefined') return;
        try {
            sessionStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Error clearing session:', error);
        }
    }, []);

    return {
        shouldShowAnimation,
        markPageVisited,
        hasVisited,
        clearSession,
    };
}
