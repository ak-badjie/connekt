'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AnimationContextType {
    hasGlobalAnimationRun: boolean;
    setHasGlobalAnimationRun: (hasRun: boolean) => void;
    hasTeamsAnimationRun: boolean;
    setHasTeamsAnimationRun: (hasRun: boolean) => void;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export function AnimationProvider({ children }: { children: ReactNode }) {
    const [hasGlobalAnimationRun, setHasGlobalAnimationRun] = useState(false);
    const [hasTeamsAnimationRun, setHasTeamsAnimationRun] = useState(false);

    return (
        <AnimationContext.Provider
            value={{
                hasGlobalAnimationRun,
                setHasGlobalAnimationRun,
                hasTeamsAnimationRun,
                setHasTeamsAnimationRun,
            }}
        >
            {children}
        </AnimationContext.Provider>
    );
}

export function useAnimation() {
    const context = useContext(AnimationContext);
    if (context === undefined) {
        throw new Error('useAnimation must be used within an AnimationProvider');
    }
    return context;
}
