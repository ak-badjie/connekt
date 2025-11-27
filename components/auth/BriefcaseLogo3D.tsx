'use client';

import { motion } from 'framer-motion';
import { Briefcase } from 'lucide-react';

interface BriefcaseLogo3DProps {
    size?: 'small' | 'medium' | 'large';
    color?: 'white' | 'teal';
}

export function BriefcaseLogo3D({ size = 'large', color = 'white' }: BriefcaseLogo3DProps) {
    const isSmall = size === 'small';
    const isMedium = size === 'medium';
    const isLarge = size === 'large';

    // Dimensions
    const containerClass = isLarge ? 'w-32 h-32' : isMedium ? 'w-10 h-10' : 'w-10 h-10';
    const glassClass = isLarge ? 'w-28 h-28 rounded-3xl' : isMedium ? 'w-10 h-10 rounded-lg' : 'w-8 h-8 rounded-lg';
    const iconSize = isLarge ? 48 : isMedium ? 24 : 16;

    // Colors
    const isTeal = color === 'teal';
    const iconColorClass = isTeal ? 'text-[#008080]' : 'text-white';
    const glowColor = isTeal ? 'bg-[#008080]/20' : 'bg-[#008080]'; // Softer glow for teal icon

    return (
        <motion.div
            className={`relative ${containerClass} flex items-center justify-center`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
        >
            {/* Glow Effect */}
            <motion.div
                className={`absolute inset-0 ${glowColor} ${isLarge ? 'rounded-3xl blur-3xl' : 'rounded-xl blur-md'}`}
                animate={{
                    opacity: [0.2, 0.5, 0.2],
                    scale: [0.8, 1.1, 0.8],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            {/* Glass Container */}
            <motion.div
                className={`relative ${glassClass} bg-white/10 backdrop-blur-xl border border-white/40 flex items-center justify-center shadow-2xl`}
                animate={{
                    rotateY: [0, 360],
                    rotateX: [0, 15, 0],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Inner Pulse */}
                <motion.div
                    className={`absolute inset-2 bg-gradient-to-br from-[#008080]/30 to-transparent ${isLarge ? 'rounded-2xl' : 'rounded-md'}`}
                    animate={{
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />

                {/* Briefcase Icon */}
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                >
                    <Briefcase size={iconSize} className={`${iconColorClass} relative z-10`} strokeWidth={1.5} />
                </motion.div>
            </motion.div>

            {/* Accent Particles */}
            {isLarge && [...Array(3)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-[#FFA500] rounded-full"
                    style={{
                        left: `${30 + i * 20}%`,
                        top: `${20 + i * 15}%`,
                    }}
                    animate={{
                        y: [0, -15, 0],
                        opacity: [0.4, 1, 0.4],
                    }}
                    transition={{
                        duration: 2,
                        delay: i * 0.3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </motion.div>
    );
}
