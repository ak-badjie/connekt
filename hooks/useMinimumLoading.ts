import { useState, useEffect } from 'react';

export function useMinimumLoading(isLoading: boolean, minDuration: number = 6000) {
    const [minTimeElapsed, setMinTimeElapsed] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setMinTimeElapsed(true);
        }, minDuration);

        return () => clearTimeout(timer);
    }, [minDuration]);

    return isLoading || !minTimeElapsed;
}
