"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence, Transition } from "motion/react"
import { cn } from "@/lib/utils"

// Types
export type SizePresets = "compact" | "large" | "tall" | "long" | "medium" | "default" | "ultra-long"

interface DynamicIslandState {
    size: SizePresets
    previousSize: SizePresets
    isAnimating: boolean
}

interface DynamicIslandContextType {
    state: DynamicIslandState
    setSize: (size: SizePresets) => void
}

// Context
const DynamicIslandContext = createContext<DynamicIslandContextType | undefined>(undefined)

// Provider
interface DynamicIslandProviderProps {
    children: React.ReactNode
    initialSize?: SizePresets
}

export function DynamicIslandProvider({ children, initialSize = "compact" }: DynamicIslandProviderProps) {
    const [state, setState] = useState<DynamicIslandState>({
        size: initialSize,
        previousSize: "compact", // safe default
        isAnimating: false
    })

    const setSize = useCallback((newSize: SizePresets) => {
        setState(prev => {
            if (prev.size === newSize) return prev
            return {
                size: newSize,
                previousSize: prev.size,
                isAnimating: true
            }
        })

        // Reset animating flag after transition (approximate duration)
        // In a real production app, use onLayoutAnimationComplete
        setTimeout(() => {
            setState(prev => ({ ...prev, isAnimating: false }))
        }, 700)
    }, [])

    return (
        <DynamicIslandContext.Provider value={{ state, setSize }}>
            {children}
        </DynamicIslandContext.Provider>
    )
}

// Hooks
export function useDynamicIslandSize() {
    const context = useContext(DynamicIslandContext)
    if (!context) {
        throw new Error("useDynamicIslandSize must be used within a DynamicIslandProvider")
    }
    return context
}

export function useScheduledAnimations(animations: { size: SizePresets, delay: number }[]) {
    const { setSize } = useDynamicIslandSize()
    const hasRun = useRef(false)

    useEffect(() => {
        if (hasRun.current) return
        hasRun.current = true

        animations.forEach(({ size, delay }) => {
            setTimeout(() => {
                setSize(size)
            }, delay)
        })
    }, [animations, setSize])
}

// size configurations for width/height/radius
const SIZE_CONFIGS: Record<SizePresets, { width: number | string, height: number, borderRadius: number }> = {
    compact: { width: 200, height: 44, borderRadius: 22 },
    large: { width: "60vw", height: 160, borderRadius: 32 },
    tall: { width: "60vw", height: 200, borderRadius: 32 },
    long: { width: "60vw", height: 80, borderRadius: 40 },
    "ultra-long": { width: "70vw", height: 100, borderRadius: 50 },
    medium: { width: "50vw", height: 140, borderRadius: 36 },
    default: { width: 150, height: 44, borderRadius: 22 }
}

// Components
interface DynamicIslandProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

export function DynamicIsland({ children, className, ...props }: DynamicIslandProps) {
    const { state } = useDynamicIslandSize()
    const config = SIZE_CONFIGS[state.size] || SIZE_CONFIGS.compact

    const spring: Transition = {
        type: "spring",
        stiffness: 400,
        damping: 30
    }

    return (
        <div className={cn("flex justify-center w-full", className)} {...props}>
            <motion.div
                layout
                initial={false}
                animate={{
                    width: config.width,
                    height: config.height,
                    borderRadius: config.borderRadius
                }}
                transition={spring}
                className="bg-black text-white relative flex justify-center items-center shadow-xl overflow-hidden z-[100000] border border-white/10"
                style={{ originY: 0 }}
            >
                <div className="w-full h-full relative">
                    <AnimatePresence mode="popLayout" custom={state.size}>
                        <motion.div
                            key={state.size}
                            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                            transition={{ duration: 0.3 }}
                            className="w-full h-full absolute inset-0"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    )
}

export function DynamicContainer({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={cn("w-full h-full", className)}>
            {children}
        </div>
    )
}

export function DynamicTitle({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <h3 className={cn("font-bold text-white", className)}>
            {children}
        </h3>
    )
}

export function DynamicDescription({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <p className={cn("text-white/70 text-sm", className)}>
            {children}
        </p>
    )
}

export function DynamicDiv({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={cn("", className)}>
            {children}
        </div>
    )
}
